<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MisiPenyaluran;
use App\Models\LogAktivitas;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MisiPenyaluranController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = MisiPenyaluran::with([
            'posko',
            'kebutuhan' => function ($q) {
                $q->select('id', 'kode_kasus', 'posko_id', 'kategori_kebutuhan', 'volume_permintaan', 'total_alokasi_resmi', 'total_diterima_resmi', 'jumlah_kk', 'status_hunian', 'tingkat_urgensi', 'status', 'desa', 'kecamatan', 'kabupaten');
            },
            'penawaran',
            'responder',
        ]);

        if ($request->has('responder_id')) {
            $query->where('responder_id', $request->responder_id);
        }

        if ($request->has('posko_id')) {
            $query->where('posko_id', $request->posko_id);
        }

        if ($request->has('status')) {
            $query->where('status_tahapan', $request->status);
        }

        $missions = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $missions,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $mission = MisiPenyaluran::with([
            'posko',
            'kebutuhan' => function ($q) {
                $q->select('id', 'kode_kasus', 'posko_id', 'kategori_kebutuhan', 'volume_permintaan', 'total_alokasi_resmi', 'total_diterima_resmi', 'jumlah_kk', 'status_hunian', 'tingkat_urgensi', 'status');
            },
            'bursa',
            'penawaran',
            'responder',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $mission,
        ]);
    }

    /**
     * Mitra memperbarui tahapan operasional lapangan
     */
    public function advanceStep(Request $request, int $id): JsonResponse
    {
        $mission = MisiPenyaluran::with(['posko', 'kebutuhan', 'bursa'])->findOrFail($id);

        // State progression per Bab 8.3 & Bab 11 PRD
        $states = [
            'Menunggu Persiapan', 
            'Siap Berangkat', 
            'Dalam Perjalanan', 
            'Tiba di Lokasi & Diserahkan',
            'Menunggu Konfirmasi Penerimaan'
        ];

        // Map older legacy labels if present
        $currentLabel = match ($mission->status_tahapan) {
            'Diterima', 'Baru' => 'Menunggu Persiapan',
            'Disiapkan' => 'Siap Berangkat',
            'Dalam Pengiriman' => 'Dalam Perjalanan',
            'Tiba di Lokasi' => 'Tiba di Lokasi & Diserahkan',
            default => $mission->status_tahapan,
        };

        $currentIdx = array_search($currentLabel, $states);
        if ($currentIdx === false) {
            $currentIdx = 0;
        }

        $nextIdx = min($currentIdx + 1, count($states) - 1);
        $nextStatus = $states[$nextIdx];

        $mission->update([
            'status_tahapan' => $nextStatus,
        ]);

        if ($nextStatus === 'Dalam Perjalanan') {
            $mission->kebutuhan->update([
                'status' => 'Dalam Pengiriman',
            ]);
        } elseif ($nextStatus === 'Tiba di Lokasi & Diserahkan' || $nextStatus === 'Menunggu Konfirmasi Penerimaan') {
            // TIDAK langsung ditutup Selesai, melainkan menunggu konfirmasi penerimaan dari Koordinator/Warga (Bab 2.3 & 5.2 Tahap 8)
            $mission->kebutuhan->update([
                'status' => 'Menunggu Konfirmasi Penerimaan',
            ]);
        }

        LogAktivitas::create([
            'kebutuhan_id' => $mission->kebutuhan_id,
            'posko_id' => $mission->posko_id,
            'user_id' => $mission->responder_id,
            'user_name' => $mission->responder_name,
            'aksi' => "Update Misi: {$nextStatus}",
            'deskripsi' => "Mitra {$mission->responder_name} ({$mission->organisasi}) memperbarui tahapan misi {$mission->kode_misi} ke status '{$nextStatus}'.",
        ]);

        return response()->json([
            'success' => true,
            'message' => "Tahapan misi berhasil diperbarui menjadi '{$nextStatus}'.",
            'data' => $mission->fresh(['posko', 'kebutuhan', 'bursa', 'penawaran']),
        ]);
    }

    /**
     * Mitra melaporkan kendala di lapangan (keterlambatan, jalan terputus, dsb.)
     */
    public function reportObstacle(Request $request, int $id): JsonResponse
    {
        $mission = MisiPenyaluran::with(['posko', 'kebutuhan'])->findOrFail($id);

        $validated = $request->validate([
            'status_kendala' => 'required|string|max:150',
            'catatan_lapangan' => 'required|string|max:1000',
        ]);

        $mission->update([
            'status_kendala' => $validated['status_kendala'],
            'catatan_lapangan' => $validated['catatan_lapangan'],
        ]);

        LogAktivitas::create([
            'kebutuhan_id' => $mission->kebutuhan_id,
            'posko_id' => $mission->posko_id,
            'user_id' => $mission->responder_id,
            'user_name' => $mission->responder_name,
            'aksi' => "Kendala Misi Lapangan",
            'deskripsi' => "PERINGATAN: Mitra {$mission->responder_name} ({$mission->organisasi}) melaporkan kendala pada misi {$mission->kode_misi}: [{$validated['status_kendala']}] {$validated['catatan_lapangan']}.",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Laporan kendala berhasil dikirimkan ke Posko Koordinator.',
            'data' => $mission->fresh(['posko', 'kebutuhan']),
        ]);
    }
}
