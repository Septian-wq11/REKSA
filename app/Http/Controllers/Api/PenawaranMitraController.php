<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PenawaranMitra;
use App\Models\BursaBantuan;
use App\Models\KebutuhanWarga;
use App\Models\MisiPenyaluran;
use App\Models\LogAktivitas;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PenawaranMitraController extends Controller
{
    /**
     * Tampilkan semua penawaran (bisa difilter posko, mitra, status, atau kebutuhan)
     */
    public function index(Request $request): JsonResponse
    {
        $query = PenawaranMitra::with([
            'posko',
            'mitra' => fn($q) => $q->select('id', 'name', 'email', 'organization'),
            'kebutuhan' => fn($q) => $q->select('id', 'kode_kasus', 'posko_id', 'kategori_kebutuhan', 'volume_permintaan', 'total_alokasi_resmi', 'total_diterima_resmi', 'jumlah_kk', 'status', 'desa', 'kecamatan', 'kabupaten'),
            'bursa',
            'misi',
        ]);

        if ($request->has('posko_id')) {
            $query->where('posko_id', $request->posko_id);
        }

        if ($request->has('mitra_id')) {
            $query->where('mitra_id', $request->mitra_id);
        }

        if ($request->has('organisasi')) {
            $query->where('organisasi', 'ilike', "%{$request->organisasi}%");
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('kebutuhan_id')) {
            $query->where('kebutuhan_id', $request->kebutuhan_id);
        }

        if ($request->has('bursa_id')) {
            $query->where('bursa_id', $request->bursa_id);
        }

        $items = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    /**
     * Mitra mengajukan penawaran bantuan untuk suatu posko / kebutuhan terbuka di Bursa
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bursa_id' => 'required|integer|exists:bursa_bantuans,id',
            'jumlah_tawaran' => 'required|string|max:100',
            'volume_angka' => 'nullable|integer',
            'satuan' => 'nullable|string|max:50',
            'metode_penyaluran' => 'nullable|string|in:mandiri,serah_posko,koordinasi',
            'kategori_komoditas' => 'nullable|string|max:150',
            'waktu_kesiapan' => 'nullable|string|max:150',
            'armada_info' => 'nullable|string|max:200',
            'organisasi' => 'nullable|string|max:150',
            'catatan' => 'nullable|string',
        ]);

        $bursa = BursaBantuan::with('kebutuhan')->findOrFail($validated['bursa_id']);
        $user = $request->user();
        $defaultMitra = User::where('role', 'responder')->first();

        $mitraName = $user ? $user->name : ($defaultMitra?->name ?? 'Arif Nugroho (Mitra Bantuan BPBD)');
        $mitraOrg = $user && $user->organization ? $user->organization : ($validated['organisasi'] ?? ($defaultMitra?->organization ?? 'Mitra Bantuan Kemanusiaan'));
        $mitraId = $user ? $user->id : ($defaultMitra?->id ?? null);

        // Ekstraksi angka dan unit jika tidak diberikan eksplisit
        $rawAmount = $validated['volume_angka'] ?? intval(preg_replace('/[^0-9]/', '', $validated['jumlah_tawaran']));
        $satuan = $validated['satuan'] ?? trim(preg_replace('/[0-9.,]/', '', $validated['jumlah_tawaran'])) ?: 'Unit';

        $metodePenyaluran = $validated['metode_penyaluran'] ?? 'serah_posko';
        
        // Tangani armada_info: Mitra tidak wajib memiliki armada
        $inputArmada = !empty($validated['armada_info']) ? $validated['armada_info'] : null;
        if ($metodePenyaluran === 'mandiri') {
            $armadaInfo = $inputArmada ?: 'Armada Mandiri Mitra Siaga';
        } else {
            // Serah posko atau koordinasi tidak mewajibkan armada
            $armadaInfo = $inputArmada;
        }

        $kodePenawaran = 'TWR-' . date('Y') . '-' . str_pad(rand(10, 999), 4, '0', STR_PAD_LEFT);

        $penawaran = PenawaranMitra::create([
            'kode_penawaran' => $kodePenawaran,
            'bursa_id' => $bursa->id,
            'kebutuhan_id' => $bursa->kebutuhan_id,
            'posko_id' => $bursa->posko_id,
            'mitra_id' => $mitraId,
            'mitra_name' => $mitraName,
            'organisasi' => $mitraOrg,
            'metode_penyaluran' => $metodePenyaluran,
            'jenis_bantuan' => $bursa->item_bantuan,
            'kategori_komoditas' => $validated['kategori_komoditas'] ?? null,
            'jumlah_tawaran' => $validated['jumlah_tawaran'],
            'volume_angka' => $rawAmount ?: 1,
            'satuan' => $satuan,
            'waktu_kesiapan' => $validated['waktu_kesiapan'] ?? 'Hari ini, Siap Berangkat dalam 2 Jam',
            'armada_info' => $armadaInfo,
            'catatan' => $validated['catatan'] ?? 'Mitra siap menyalurkan logistik sesuai alokasi.',
            'status' => 'Diajukan',
        ]);

        // Update bursa status jika masih Terbuka
        if ($bursa->status === 'Terbuka') {
            $bursa->update(['status' => 'Klaim Diajukan']);
        }
        if ($bursa->kebutuhan && $bursa->kebutuhan->status === 'Kebutuhan Terbuka') {
            $bursa->kebutuhan->update(['status' => 'Klaim Diajukan']);
        }

        $metodeLabel = match ($metodePenyaluran) {
            'mandiri' => 'Pengiriman Mandiri (Armada Sendiri)',
            'koordinasi' => 'Koordinasi Penyaluran Bersama Posko',
            default => 'Diserahkan ke Posko/Gudang BPBD (Tanpa Armada Mandiri)',
        };

        LogAktivitas::create([
            'kebutuhan_id' => $bursa->kebutuhan_id,
            'posko_id' => $bursa->posko_id,
            'user_id' => $mitraId,
            'user_name' => $mitraName,
            'aksi' => 'Penawaran Diajukan',
            'deskripsi' => "Mitra Bantuan {$mitraName} ({$mitraOrg}) mengajukan bantuan {$validated['jumlah_tawaran']} untuk {$bursa->item_bantuan} [Metode: {$metodeLabel}]. Menunggu peninjauan Posko.",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Penawaran bantuan berhasil diajukan ke Posko. Status saat ini: Diajukan.',
            'data' => $penawaran->load(['kebutuhan', 'posko', 'bursa']),
        ], 201);
    }

    /**
     * Posko menyetujui penawaran (bisa setujui penuh atau setujui sebagian kuantitas)
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $penawaran = PenawaranMitra::with(['bursa', 'kebutuhan', 'posko'])->findOrFail($id);

        $validated = $request->validate([
            'approved_volume' => 'nullable|string|max:100',
            'volume_angka' => 'nullable|integer',
            'catatan' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($penawaran, $validated, $request) {
            $kebutuhan = $penawaran->kebutuhan;
            $bursa = $penawaran->bursa;

            // Target volume kebutuhan
            $targetVol = intval(preg_replace('/[^0-9]/', '', $kebutuhan->volume_permintaan ?: $bursa->target_volume));
            if ($targetVol <= 0) $targetVol = 1000;

            // Hitung alokasi aktif yang sudah disetujui sebelumnya (dari semua mitra)
            $existingAllocated = PenawaranMitra::where('kebutuhan_id', $kebutuhan->id)
                ->where('status', 'Disetujui')
                ->where('id', '!=', $penawaran->id)
                ->sum('volume_disetujui_angka');

            $satuan = $penawaran->satuan ?: 'Unit';
            $remainingShortage = max(0, $targetVol - $existingAllocated);

            if ($remainingShortage <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Tidak dapat menyetujui: Kebutuhan {$kebutuhan->kode_kasus} sudah teralokasi penuh ({$existingAllocated}/{$targetVol} {$satuan}).",
                ], 422);
            }

            $offeredNum = $validated['volume_angka'] ?? ($penawaran->volume_angka ?: intval(preg_replace('/[^0-9]/', '', $penawaran->jumlah_tawaran)));
            if ($offeredNum <= 0) $offeredNum = $remainingShortage;

            // Cegah alokasi berlebih: jumlah disetujui tidak boleh menyebabkan total alokasi melebihi kebutuhan
            $approvedNum = min($offeredNum, $remainingShortage);

            $approvedVolStr = $validated['approved_volume'] ?: "{$approvedNum} {$satuan}";

            $poskoUserId = $request->user()?->id ?? User::where('role', 'posko')->value('id') ?? User::first()?->id;
            $approverName = $request->user() ? $request->user()->name : (User::find($poskoUserId)?->name ?? 'Siti Rahma (Koordinator Posko)');
            $defaultMitraId = User::where('role', 'responder')->value('id') ?? $poskoUserId;

            $penawaran->update([
                'status' => 'Disetujui',
                'jumlah_disetujui' => $approvedVolStr,
                'volume_disetujui_angka' => $approvedNum,
                'approved_by' => $poskoUserId,
                'reviewed_at' => now(),
            ]);

            // Hitung total alokasi baru
            $totalAllocated = $existingAllocated + $approvedNum;
            $kekuranganAlokasi = max(0, $targetVol - $totalAllocated);
            $isFullyAllocated = $kekuranganAlokasi === 0;

            $newStatus = $isFullyAllocated ? 'Teralokasi Penuh' : 'Sebagian Terpenuhi';

            // Update Bursa dan Kebutuhan
            $bursa->update([
                'status' => $newStatus,
                'volume_terpenuhi' => "{$totalAllocated} {$satuan}",
                'claimed_by' => $penawaran->mitra_id ?: $defaultMitraId,
                'claimed_org' => $penawaran->organisasi,
                'claimed_volume' => $approvedVolStr,
                'claimed_armada' => $penawaran->armada_info,
            ]);

            $kebutuhan->update([
                'status' => $newStatus,
                'total_alokasi_resmi' => "{$totalAllocated} {$satuan}",
            ]);

            // Terbitkan Misi Penyaluran Resmi untuk Mitra
            $kodeMisi = 'MISI-ASG-' . str_pad(rand(10, 999), 3, '0', STR_PAD_LEFT);
            $misi = MisiPenyaluran::create([
                'kode_misi' => $kodeMisi,
                'kebutuhan_id' => $kebutuhan->id,
                'bursa_id' => $bursa->id,
                'penawaran_id' => $penawaran->id,
                'posko_id' => $kebutuhan->posko_id,
                'responder_id' => $penawaran->mitra_id ?: $defaultMitraId,
                'responder_name' => $penawaran->mitra_name,
                'organisasi' => $penawaran->organisasi,
                'armada_info' => $penawaran->armada_info ?: 'Dukungan Distribusi Posko BPBD',
                'muatan' => $approvedVolStr,
                'status_tahapan' => 'Menunggu Persiapan',
                'estimasi_waktu' => $penawaran->waktu_kesiapan ?: 'Siap Berangkat',
                'catatan_lapangan' => $validated['catatan'] ?? 'Alokasi resmi disetujui Koordinator Posko. Penyaluran siap dijalankan.',
            ]);

            LogAktivitas::create([
                'kebutuhan_id' => $kebutuhan->id,
                'posko_id' => $kebutuhan->posko_id,
                'user_id' => $request->user()?->id,
                'user_name' => $approverName,
                'aksi' => 'Alokasi Disetujui',
                'deskripsi' => "Posko menyetujui alokasi {$approvedVolStr} dari penawaran {$penawaran->kode_penawaran} ({$penawaran->organisasi}). Misi {$kodeMisi} diterbitkan. Sisa kekurangan alokasi: {$kekuranganAlokasi} {$satuan}.",
            ]);

            return response()->json([
                'success' => true,
                'message' => "Penawaran {$penawaran->kode_penawaran} berhasil disetujui ({$approvedVolStr}). Misi resmi {$kodeMisi} telah diterbitkan.",
                'data' => [
                    'penawaran' => $penawaran->fresh(['kebutuhan', 'misi']),
                    'misi' => $misi,
                    'kekurangan_alokasi' => $kekuranganAlokasi,
                    'status_kebutuhan' => $newStatus,
                ],
            ]);
        });
    }

    /**
     * Posko menolak penawaran mitra dengan alasan
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $penawaran = PenawaranMitra::with(['kebutuhan', 'posko', 'bursa'])->findOrFail($id);

        $validated = $request->validate([
            'alasan_penolakan' => 'required|string|max:500',
        ]);

        $poskoUserId = $request->user()?->id ?? User::where('role', 'posko')->value('id') ?? User::first()?->id;

        $penawaran->update([
            'status' => 'Ditolak',
            'alasan_penolakan' => $validated['alasan_penolakan'],
            'approved_by' => $poskoUserId,
            'reviewed_at' => now(),
        ]);

        // Cek jika tidak ada penawaran lain yang aktif, kembalikan bursa ke 'Terbuka'
        $activeOffers = PenawaranMitra::where('bursa_id', $penawaran->bursa_id)
            ->whereIn('status', ['Diajukan', 'Disetujui'])
            ->count();

        if ($activeOffers === 0 && $penawaran->bursa) {
            $penawaran->bursa->update(['status' => 'Terbuka']);
            if ($penawaran->kebutuhan && $penawaran->kebutuhan->status === 'Klaim Diajukan') {
                $penawaran->kebutuhan->update(['status' => 'Kebutuhan Terbuka']);
            }
        }

        $reviewerName = $request->user() ? $request->user()->name : 'Koordinator Posko';

        LogAktivitas::create([
            'kebutuhan_id' => $penawaran->kebutuhan_id,
            'posko_id' => $penawaran->posko_id,
            'user_id' => $request->user()?->id,
            'user_name' => $reviewerName,
            'aksi' => 'Penawaran Ditolak',
            'deskripsi' => "Penawaran {$penawaran->kode_penawaran} dari {$penawaran->organisasi} ditolak oleh Posko. Alasan: {$validated['alasan_penolakan']}.",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Penawaran mitra telah ditolak dengan alasan yang tersimpan.',
            'data' => $penawaran->fresh(),
        ]);
    }
}
