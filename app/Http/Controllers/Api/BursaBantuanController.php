<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BursaBantuan;
use App\Models\MisiPenyaluran;
use App\Models\LogAktivitas;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BursaBantuanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = BursaBantuan::with([
            'posko',
            'kebutuhan' => function ($q) {
                // Sembunyikan PII privat warga dari partner
                $q->select('id', 'kode_kasus', 'posko_id', 'kategori_kebutuhan', 'volume_permintaan', 'total_alokasi_resmi', 'total_diterima_resmi', 'jumlah_kk', 'status_hunian', 'tingkat_urgensi', 'priority_rationale', 'status', 'desa', 'kecamatan', 'kabupaten');
            },
            'penawaran',
            'claimedBy' => function ($q) {
                $q->select('id', 'name', 'organization');
            },
        ]);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $items = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    /**
     * Mitra mengajukan proposal klaim bantuan (Proposal Commitment)
     */
    public function claim(Request $request, int $id): JsonResponse
    {
        $bursa = BursaBantuan::with(['kebutuhan', 'posko'])->findOrFail($id);

        $validated = $request->validate([
            'claimed_volume' => 'nullable|string',
            'armada_info' => 'nullable|string',
            'organisasi' => 'nullable|string',
            'catatan' => 'nullable|string',
        ]);

        $user = $request->user();
        $responderName = $user ? $user->name : 'Arif Nugroho (Satgas BPBD)';
        $org = $user && $user->organization ? $user->organization : ($validated['organisasi'] ?? 'BPBD / Mitra Kemanusiaan');
        $responderId = $user ? $user->id : 3;
        $claimedVol = $validated['claimed_volume'] ?? $bursa->target_volume;

        // Update status menjadi Klaim Diajukan (Menunggu persetujuan Koordinator Posko)
        $bursa->update([
            'status' => 'Klaim Diajukan',
            'claimed_by' => $responderId,
            'claimed_org' => $org,
            'claimed_volume' => $claimedVol,
            'claimed_armada' => $validated['armada_info'] ?? 'Truk Tangki No. 02 · Kapasitas 500 L Air Minum',
            'claim_notes' => $validated['catatan'] ?? 'Mitra siap mendistribusikan logistik sesuai kapasitas armada.',
        ]);

        $bursa->kebutuhan->update([
            'status' => 'Klaim Diajukan',
        ]);

        LogAktivitas::create([
            'kebutuhan_id' => $bursa->kebutuhan_id,
            'posko_id' => $bursa->posko_id,
            'user_id' => $responderId,
            'user_name' => $responderName,
            'aksi' => 'Pengajuan Klaim',
            'deskripsi' => "Mitra {$responderName} ({$org}) mengajukan klaim penyaluran {$claimedVol} untuk {$bursa->item_bantuan}. Menunggu persetujuan Koordinator Posko.",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tawaran bantuan berhasil diajukan ke Koordinator Posko untuk ditinjau.',
            'data' => $bursa->fresh(['posko', 'kebutuhan']),
        ]);
    }

    /**
     * Koordinator Posko menyetujui klaim mitra dan merilis Misi Alokasi Resmi
     */
    public function approveClaim(Request $request, int $id): JsonResponse
    {
        $bursa = BursaBantuan::with(['kebutuhan', 'posko', 'claimedBy'])->findOrFail($id);

        $validated = $request->validate([
            'approved_volume' => 'nullable|string',
            'catatan' => 'nullable|string',
        ]);

        $approvedVol = $validated['approved_volume'] ?? $bursa->claimed_volume ?? $bursa->target_volume;
        $responderName = $bursa->claimedBy ? $bursa->claimedBy->name : 'Arif Nugroho';
        $org = $bursa->claimed_org ?? 'BPBD Kabupaten Sukabumi';

        // Hitung pemenuhan parsial
        $currentFulfilled = intval(preg_replace('/[^0-9]/', '', $bursa->volume_terpenuhi ?: '0'));
        $addVol = intval(preg_replace('/[^0-9]/', '', $approvedVol));
        $targetVol = intval(preg_replace('/[^0-9]/', '', $bursa->target_volume));
        
        $totalFulfilled = $currentFulfilled + ($addVol > 0 ? $addVol : $targetVol);
        $isFull = $totalFulfilled >= $targetVol;
        $newStatus = $isFull ? 'Teralokasi Penuh' : 'Sebagian Terpenuhi';

        $bursa->update([
            'status' => $newStatus,
            'volume_terpenuhi' => "{$totalFulfilled} L",
        ]);

        $bursa->kebutuhan->update([
            'status' => $newStatus,
        ]);

        // Buat Misi Penyaluran Resmi untuk Mitra
        $kodeMisi = 'MISI-ASG-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);

        $misi = MisiPenyaluran::create([
            'kode_misi' => $kodeMisi,
            'kebutuhan_id' => $bursa->kebutuhan_id,
            'bursa_id' => $bursa->id,
            'posko_id' => $bursa->posko_id,
            'responder_id' => $bursa->claimed_by ?? 3,
            'responder_name' => $responderName,
            'organisasi' => $org,
            'armada_info' => $bursa->claimed_armada ?? 'Truk Tangki No. 02 · Kapasitas 500 L',
            'muatan' => $approvedVol,
            'status_tahapan' => 'Diterima',
            'estimasi_waktu' => '18 Menit (2,4 km)',
            'catatan_lapangan' => 'Alokasi telah disetujui Koordinator Posko. Misi penyaluran aktif.',
        ]);

        $approverName = $request->user() ? $request->user()->name : 'Siti Rahma (Koordinator Posko)';

        LogAktivitas::create([
            'kebutuhan_id' => $bursa->kebutuhan_id,
            'posko_id' => $bursa->posko_id,
            'user_id' => $request->user()?->id,
            'user_name' => $approverName,
            'aksi' => 'Alokasi Disetujui',
            'deskripsi' => "Koordinator Posko menyetujui alokasi {$approvedVol} kepada {$responderName} ({$org}). Misi {$kodeMisi} diterbitkan. Status kebutuhan: {$newStatus}.",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Alokasi mitra berhasil disetujui dan misi penyaluran resmi telah dibuat.',
            'data' => [
                'bursa' => $bursa->fresh(['posko', 'kebutuhan']),
                'misi' => $misi,
            ],
        ]);
    }

    /**
     * Koordinator Posko menolak klaim mitra dengan alasan
     */
    public function rejectClaim(Request $request, int $id): JsonResponse
    {
        $bursa = BursaBantuan::with(['kebutuhan', 'posko'])->findOrFail($id);

        $validated = $request->validate([
            'alasan' => 'nullable|string',
        ]);

        $alasan = $validated['alasan'] ?? 'Kapasitas armada atau jenis bantuan belum sesuai prioritas posko saat ini.';

        $bursa->update([
            'status' => 'Terbuka',
            'claim_notes' => 'Tawaran sebelumnya ditolak: ' . $alasan,
        ]);

        if ($bursa->kebutuhan && $bursa->kebutuhan->status === 'Klaim Diajukan') {
            $bursa->kebutuhan->update(['status' => 'Kebutuhan Terbuka']);
        }

        $approverName = $request->user() ? $request->user()->name : 'Koordinator Posko';

        LogAktivitas::create([
            'kebutuhan_id' => $bursa->kebutuhan_id,
            'posko_id' => $bursa->posko_id,
            'user_id' => $request->user()?->id,
            'user_name' => $approverName,
            'aksi' => 'Penolakan Tawaran Bantuan',
            'deskripsi' => "Koordinator Posko menolak klaim tawaran mitra untuk {$bursa->item_bantuan}. Alasan: {$alasan}. Kebutuhan dikembalikan terbuka di bursa.",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tawaran bantuan mitra berhasil ditolak. Kebutuhan tetap terbuka di Bursa.',
            'data' => $bursa->fresh(['posko', 'kebutuhan']),
        ]);
    }
}
