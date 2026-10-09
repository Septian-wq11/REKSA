<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KebutuhanWarga;
use App\Models\BursaBantuan;
use App\Models\MisiPenyaluran;
use App\Models\LogAktivitas;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KebutuhanWargaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = KebutuhanWarga::with(['posko', 'citizen', 'misiPenyaluran', 'bursaBantuan']);

        if ($request->has('posko_id')) {
            $query->where('posko_id', $request->posko_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('urgensi')) {
            $query->where('tingkat_urgensi', $request->urgensi);
        }

        if ($request->has('citizen_id')) {
            $query->where('citizen_id', $request->citizen_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('kode_kasus', 'ilike', "%{$search}%")
                  ->orWhere('citizen_name', 'ilike', "%{$search}%")
                  ->orWhere('kategori_kebutuhan', 'ilike', "%{$search}%");
            });
        }

        $cases = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $cases,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'citizen_name' => 'required|string|max:255',
            'citizen_phone' => 'nullable|string|max:30',
            'posko_id' => 'nullable|integer',
            'posko_name' => 'nullable|string',
            'kategori_kebutuhan' => 'required|string|max:100',
            'volume_permintaan' => 'required|string|max:100',
            'jumlah_kk' => 'required|integer|min:1',
            'status_hunian' => 'nullable|string|max:100',
            'vulnerable_group' => 'nullable|boolean',
            'deskripsi' => 'nullable|string',
            'foto_bukti' => 'nullable|string',
            'desa' => 'nullable|string',
            'kecamatan' => 'nullable|string',
            'kabupaten' => 'nullable|string',
            'provinsi' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'status' => 'nullable|string|max:100',
            'tingkat_urgensi' => 'nullable|string|max:100',
        ]);

        // Find or create matching PoskoWilayah
        $posko = null;
        $reqPoskoName = $validated['posko_name'] ?? null;
        $reqKab = $validated['kabupaten'] ?? null;
        $reqProv = $validated['provinsi'] ?? null;

        if (!empty($reqPoskoName)) {
            $posko = \App\Models\PoskoWilayah::where('nama_posko', 'like', '%' . $reqPoskoName . '%')->first();
        }

        if (!$posko && !empty($reqKab)) {
            $posko = \App\Models\PoskoWilayah::where('kabupaten', 'like', '%' . $reqKab . '%')->first();
        }

        if (!$posko && !empty($validated['posko_id'])) {
            $candidate = \App\Models\PoskoWilayah::find($validated['posko_id']);
            if ($candidate && (empty($reqKab) || str_contains(strtolower($candidate->kabupaten), strtolower($reqKab)))) {
                $posko = $candidate;
            }
        }

        if (!$posko) {
            $poskoName = !empty($reqPoskoName) ? $reqPoskoName : ('Posko BPBD ' . ($reqKab ?: 'Wilayah'));
            $desa = $validated['desa'] ?? 'Wilayah Terdampak';
            $kecamatan = $validated['kecamatan'] ?? 'Kecamatan Setempat';
            $kabupaten = $reqKab ?: 'Kota Surabaya';
            $provinsi = $reqProv ?: 'Jawa Timur';

            $posko = \App\Models\PoskoWilayah::firstOrCreate(
                ['nama_posko' => $poskoName],
                [
                    'kode_posko' => 'PSK-' . str_pad(rand(10, 99), 2, '0', STR_PAD_LEFT),
                    'penanggung_jawab_nama' => 'Koordinator BPBD ' . ($reqKab ?: 'Wilayah'),
                    'telepon' => '+62 812 8899 1102',
                    'desa' => $desa,
                    'kecamatan' => $kecamatan,
                    'kabupaten' => $kabupaten,
                    'provinsi' => $provinsi,
                    'latitude' => $request->input('latitude') ?? ($kabupaten === 'Kota Surabaya' ? -7.2575 : -6.9174639),
                    'longitude' => $request->input('longitude') ?? ($kabupaten === 'Kota Surabaya' ? 112.7521 : 106.9298281),
                    'kapasitas_kk' => 200,
                    'kk_terdata' => $validated['jumlah_kk'] ?? 1,
                    'status_operasional' => 'Aktif',
                ]
            );
        }

        $randomCode = 'RK-' . date('Y') . '-' . str_pad(rand(100, 999), 5, '0', STR_PAD_LEFT);

        // System Decision Support Engine (Rekomendasi Prioritas Otomatis Berbasis Fakta)
        $isVulnerable = $validated['vulnerable_group'] ?? false;
        $kkCount = $validated['jumlah_kk'];
        $cat = $validated['kategori_kebutuhan'];

        $recommendedPriority = 'Sedang';
        $rationale = "Kebutuhan {$cat} untuk {$kkCount} KK.";

        if ($kkCount >= 50 || in_array($cat, ['Air Bersih', 'Obat & Medis', 'Obat-obatan']) || $isVulnerable) {
            $recommendedPriority = 'Kritis';
            $reasons = [];
            if ($kkCount >= 50) $reasons[] = "{$kkCount} KK terdampak luas";
            if (in_array($cat, ['Air Bersih', 'Obat & Medis', 'Obat-obatan'])) $reasons[] = "Kategori vital kelangsungan hidup ({$cat})";
            if ($isVulnerable) $reasons[] = "Terdapat kelompok rentan (balita/lansia)";
            $rationale = "Rekomendasi Sistem: KRITIS — " . implode(', ', $reasons) . ", alokasi saat ini 0%.";
        } elseif ($kkCount >= 20 || in_array($cat, ['Makanan', 'Makanan Siap Saji'])) {
            $recommendedPriority = 'Tinggi';
            $rationale = "Rekomendasi Sistem: TINGGI — Kebutuhan logistik mendesak untuk {$kkCount} KK.";
        }

        $case = KebutuhanWarga::create([
            'kode_kasus' => $randomCode,
            'citizen_id' => $request->user()?->id ?? null,
            'citizen_name' => $validated['citizen_name'],
            'citizen_phone' => $validated['citizen_phone'] ?? null,
            'posko_id' => $posko->id,
            'kategori_kebutuhan' => $validated['kategori_kebutuhan'],
            'volume_permintaan' => $validated['volume_permintaan'],
            'jumlah_kk' => $validated['jumlah_kk'],
            'status_hunian' => $validated['status_hunian'] ?? 'Rumah Warga Terdampak',
            'vulnerable_group' => $isVulnerable,
            'tingkat_urgensi' => $validated['tingkat_urgensi'] ?? $recommendedPriority,
            'priority_rationale' => $rationale,
            'status' => $validated['status'] ?? 'Diajukan',
            'deskripsi' => $validated['deskripsi'] ?? null,
            'foto_bukti' => $validated['foto_bukti'] ?? null,
            'desa' => $validated['desa'] ?? null,
            'kecamatan' => $validated['kecamatan'] ?? null,
            'kabupaten' => $validated['kabupaten'] ?? null,
            'provinsi' => $validated['provinsi'] ?? null,
            'latitude' => $request->input('latitude') ?? $posko->latitude,
            'longitude' => $request->input('longitude') ?? $posko->longitude,
        ]);

        LogAktivitas::create([
            'kebutuhan_id' => $case->id,
            'posko_id' => $case->posko_id,
            'user_id' => $request->user()?->id ?? null,
            'user_name' => $validated['citizen_name'],
            'aksi' => 'Laporan Masuk',
            'deskripsi' => "Laporan kebutuhan {$case->kategori_kebutuhan} ({$case->volume_permintaan}) diajukan oleh {$case->citizen_name}. {$rationale}",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Laporan kebutuhan berhasil disimpan ke database.',
            'data' => $case->load('posko'),
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $case = (is_numeric($id)
            ? KebutuhanWarga::where('id', (int) $id)
            : KebutuhanWarga::where('kode_kasus', $id))
            ->with([
                'posko',
                'citizen',
                'bursaBantuan',
                'misiPenyaluran',
                'logAktivitas' => fn ($q) => $q->latest(),
            ])->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $case,
        ]);
    }

    public function verify(Request $request, $id): JsonResponse
    {
        $case = is_numeric($id)
            ? KebutuhanWarga::findOrFail($id)
            : KebutuhanWarga::where('kode_kasus', $id)->firstOrFail();

        $validated = $request->validate([
            'action' => 'required|string|in:verify_and_publish,verify,reject,clarify,review_further',
            'catatan' => 'nullable|string',
            'pertanyaan' => 'nullable|string',
            'kategori_klarifikasi' => 'nullable|string|max:150',
            'meminta_lampiran' => 'nullable|boolean',
            'alasan' => 'nullable|string',
            'tindak_lanjut' => 'nullable|string',
            'priority' => 'nullable|string',
        ]);

        $verifierName = $request->user() ? $request->user()->name : 'Siti Rahma (Koordinator Posko)';

        if ($validated['action'] === 'verify_and_publish' || $validated['action'] === 'verify') {
            $rawPriority = $validated['priority'] ?? $case->tingkat_urgensi;
            $priority = match (strtolower((string) $rawPriority)) {
                'sangat mendesak', 'kritis' => 'Kritis',
                'perlu segera', 'tinggi' => 'Tinggi',
                default => 'Sedang',
            };

            $case->update([
                'status' => 'Kebutuhan Terbuka',
                'tingkat_urgensi' => $priority,
                'catatan_verifikasi_posko' => $validated['catatan'] ?? 'Data KK divalidasi posko, dirilis ke Bursa Bantuan Terbuka.',
                'verified_by' => $request->user()?->id ?? 2,
                'verified_at' => now(),
            ]);

            // Terbitkan ke Bursa Bantuan Terbuka
            BursaBantuan::updateOrCreate(
                ['kebutuhan_id' => $case->id],
                [
                    'posko_id' => $case->posko_id,
                    'item_bantuan' => "{$case->kategori_kebutuhan} ({$case->volume_permintaan})",
                    'target_volume' => $case->volume_permintaan,
                    'volume_terpenuhi' => $case->total_alokasi_resmi ?: '0',
                    'urgensi' => $priority,
                    'status' => 'Terbuka',
                    'published_at' => now(),
                ]
            );

            LogAktivitas::create([
                'kebutuhan_id' => $case->id,
                'posko_id' => $case->posko_id,
                'user_id' => $request->user()?->id,
                'user_name' => $verifierName,
                'aksi' => 'Verifikasi & Rilis Terbuka',
                'deskripsi' => "Koordinator Posko memvalidasi kasus {$case->kode_kasus} (Prioritas: {$priority}) dan merilisnya ke Bursa Kebutuhan Terbuka.",
            ]);
        } elseif ($validated['action'] === 'clarify') {
            $question = $validated['pertanyaan'] ?? $validated['catatan'] ?? 'Mohon lengkapi rincian titik lokasi dan jumlah jiwa rentan.';
            $kategori = $validated['kategori_klarifikasi'] ?? 'Kelengkapan Informasi & Lokasi';
            $butuhLampiran = !empty($validated['meminta_lampiran']);

            $history = $case->riwayat_klarifikasi ?: [];
            $history[] = [
                'id' => count($history) + 1,
                'putaran' => count($history) + 1,
                'waktu_tanya' => now()->toIso8601String(),
                'penanya' => $verifierName,
                'kategori' => $kategori,
                'pertanyaan' => $question,
                'meminta_lampiran' => $butuhLampiran,
                'status' => 'Menunggu Jawaban Warga',
                'jawaban' => null,
                'foto_tambahan' => null,
                'waktu_jawab' => null,
            ];

            $case->update([
                'status' => 'Perlu Klarifikasi',
                'pertanyaan_klarifikasi' => $question,
                'kategori_klarifikasi' => $kategori,
                'meminta_lampiran' => $butuhLampiran,
                'catatan_verifikasi_posko' => $validated['catatan'] ?? $question,
                'riwayat_klarifikasi' => $history,
            ]);

            $lampiranNote = $butuhLampiran ? ' (Disertai permintaan unggah foto/dokumen tambahan)' : '';
            LogAktivitas::create([
                'kebutuhan_id' => $case->id,
                'posko_id' => $case->posko_id,
                'user_id' => $request->user()?->id,
                'user_name' => $verifierName,
                'aksi' => 'Permintaan Klarifikasi',
                'deskripsi' => "Posko meminta klarifikasi [{$kategori}] untuk kasus {$case->kode_kasus}: \"{$question}\"{$lampiranNote}.",
            ]);
        } elseif ($validated['action'] === 'review_further') {
            $notes = $validated['catatan'] ?? 'Menunggu pengecekan lapangan tim assessment posko.';
            $case->update([
                'status' => 'Dalam Verifikasi',
                'catatan_verifikasi_posko' => $notes,
            ]);

            LogAktivitas::create([
                'kebutuhan_id' => $case->id,
                'posko_id' => $case->posko_id,
                'user_id' => $request->user()?->id,
                'user_name' => $verifierName,
                'aksi' => 'Pemeriksaan Lanjutan',
                'deskripsi' => "Kasus {$case->kode_kasus} dijadwalkan untuk pemeriksaan lanjutan tim posko: {$notes}",
            ]);
        } else {
            $alasan = $validated['alasan'] ?? $validated['catatan'] ?? 'Laporan tidak sesuai fakta lapangan / duplikasi data.';
            $tindakLanjut = $validated['tindak_lanjut'] ?? 'Silakan berkoordinasi dengan pengurus RT/RW setempat atau laporkan langsung ke Posko BPBD terdekat di kantor kelurahan/kecamatan.';

            $case->update([
                'status' => 'Ditolak',
                'alasan_penolakan' => $alasan,
                'tindak_lanjut_penolakan' => $tindakLanjut,
                'catatan_verifikasi_posko' => "Ditolak: {$alasan}. Tindak lanjut: {$tindakLanjut}",
            ]);

            LogAktivitas::create([
                'kebutuhan_id' => $case->id,
                'posko_id' => $case->posko_id,
                'user_id' => $request->user()?->id,
                'user_name' => $verifierName,
                'aksi' => 'Laporan Ditolak',
                'deskripsi' => "Kasus {$case->kode_kasus} ditolak oleh Posko. Alasan: {$alasan}. Saran tindak lanjut: {$tindakLanjut}.",
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Status laporan berhasil diperbarui oleh Posko.',
            'data' => $case->load(['posko', 'bursaBantuan']),
        ]);
    }

    /**
     * Respon / Jawaban Klarifikasi dari Masyarakat
     * Masyarakat menjawab pertanyaan BPBD, melengkapi berkas/foto tanpa hapus data lama.
     * Status kembali ke 'Dalam Verifikasi' untuk ditinjau ulang oleh BPBD.
     */
    public function jawabKlarifikasi(Request $request, $id): JsonResponse
    {
        $case = (is_numeric($id)
            ? KebutuhanWarga::where('id', (int) $id)
            : KebutuhanWarga::where('kode_kasus', $id))
            ->firstOrFail();

        // Hak akses: Pastikan masyarakat hanya dapat menjawab klarifikasi dari laporan miliknya
        $user = $request->user();
        $callerName = $request->input('citizen_name') ?? ($user ? $user->name : 'Andi Pratama');
        $callerId = $request->input('citizen_id') ? (int) $request->input('citizen_id') : ($user ? $user->id : null);

        if ($case->citizen_id && $callerId && $callerId !== (int) $case->citizen_id) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak: Anda hanya dapat menjawab klarifikasi untuk laporan milik Anda sendiri.',
            ], 403);
        }

        if ($user && $case->citizen_id && $user->id !== $case->citizen_id && strtolower($user->role ?? '') === 'citizen') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak: Anda hanya dapat menjawab klarifikasi untuk laporan milik Anda sendiri.',
            ], 403);
        }

        $validated = $request->validate([
            'jawaban' => 'required|string',
            'foto_klarifikasi' => 'nullable|string',
            'jumlah_kk' => 'nullable|integer|min:1',
            'volume_permintaan' => 'nullable|string|max:100',
            'deskripsi' => 'nullable|string',
        ]);

        // Perbarui putaran riwayat klarifikasi terakhir
        $history = $case->riwayat_klarifikasi ?: [];
        $lastIdx = count($history) - 1;
        if ($lastIdx >= 0) {
            $history[$lastIdx]['jawaban'] = $validated['jawaban'];
            $history[$lastIdx]['foto_tambahan'] = $validated['foto_klarifikasi'] ?? null;
            $history[$lastIdx]['waktu_jawab'] = now()->toIso8601String();
            $history[$lastIdx]['status'] = 'Jawaban Dikirim';
        } else {
            $history[] = [
                'id' => 1,
                'putaran' => 1,
                'waktu_tanya' => $case->updated_at?->toIso8601String() ?? now()->toIso8601String(),
                'penanya' => 'Koordinator Posko BPBD',
                'kategori' => $case->kategori_klarifikasi ?? 'Kelengkapan Informasi',
                'pertanyaan' => $case->pertanyaan_klarifikasi ?? 'Klarifikasi diajukan sebelumnya',
                'meminta_lampiran' => (bool) $case->meminta_lampiran,
                'status' => 'Jawaban Dikirim',
                'jawaban' => $validated['jawaban'],
                'foto_tambahan' => $validated['foto_klarifikasi'] ?? null,
                'waktu_jawab' => now()->toIso8601String(),
            ];
        }

        $updatePayload = [
            'status' => 'Dalam Verifikasi', // Jawaban warga TIDAK otomatis membuat laporan terverifikasi; kembali ditinjau BPBD
            'jawaban_klarifikasi' => $validated['jawaban'],
            'riwayat_klarifikasi' => $history,
        ];

        // Simpan foto tambahan jika ada, tanpa menghapus foto bukti lama
        if (!empty($validated['foto_klarifikasi'])) {
            $updatePayload['foto_klarifikasi'] = $validated['foto_klarifikasi'];
        }

        if (isset($validated['jumlah_kk'])) {
            $updatePayload['jumlah_kk'] = $validated['jumlah_kk'];
        }

        if (isset($validated['volume_permintaan'])) {
            $updatePayload['volume_permintaan'] = $validated['volume_permintaan'];
        }

        if (isset($validated['deskripsi'])) {
            $updatePayload['deskripsi'] = $validated['deskripsi'];
        }

        $case->update($updatePayload);

        LogAktivitas::create([
            'kebutuhan_id' => $case->id,
            'posko_id' => $case->posko_id,
            'user_id' => $user?->id,
            'user_name' => $callerName,
            'aksi' => 'Jawaban Klarifikasi Dikirim',
            'deskripsi' => "Masyarakat {$callerName} telah mengirimkan jawaban klarifikasi: \"{$validated['jawaban']}\". Laporan masuk antrean peninjauan ulang Posko BPBD.",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Jawaban klarifikasi berhasil dikirim. Laporan Anda sedang dalam proses peninjauan ulang oleh petugas Posko BPBD.',
            'data' => $case->fresh(['posko', 'bursaBantuan']),
        ]);
    }

    /**
     * Konfirmasi Penerimaan Akhir oleh Koordinator Posko / Masyarakat (Final Receipt Confirmation)
     * Mengimplementasikan Mesin Kekurangan dan Pemenuhan (Bab 7 & Bab 8 PRD)
     */
    public function confirmReceipt(Request $request, $id): JsonResponse
    {
        $case = (is_numeric($id)
            ? KebutuhanWarga::where('id', (int) $id)
            : KebutuhanWarga::where('kode_kasus', $id))
            ->with(['bursaBantuan', 'misiPenyaluran', 'posko', 'penawaranMitra'])->firstOrFail();

        $validated = $request->validate([
            'diterima_volume' => 'nullable|string|max:100',
            'catatan' => 'nullable|string',
        ]);

        $confirmerName = $request->user() ? $request->user()->name : 'Andi Pratama / Koordinator Posko';
        $targetVolNum = intval(preg_replace('/[^0-9]/', '', $case->volume_permintaan));
        if ($targetVolNum <= 0) $targetVolNum = 1000;

        $receivedInputStr = $validated['diterima_volume'] ?? $case->volume_permintaan;
        $receivedNum = intval(preg_replace('/[^0-9]/', '', $receivedInputStr));
        if ($receivedNum <= 0) $receivedNum = $targetVolNum;

        // Akumulasi total penerimaan
        $currentDiterimaNum = intval(preg_replace('/[^0-9]/', '', $case->total_diterima_resmi ?: '0'));
        $totalDiterimaNum = $currentDiterimaNum + $receivedNum;

        // Cek kekurangan penerimaan
        $kekuranganPenerimaan = max(0, $targetVolNum - $totalDiterimaNum);
        $isFullyFulfilled = $kekuranganPenerimaan === 0;

        $satuan = trim(preg_replace('/[0-9.,]/', '', $case->volume_permintaan)) ?: 'Unit';
        $totalDiterimaStr = "{$totalDiterimaNum} {$satuan}";

        if ($isFullyFulfilled) {
            $case->update([
                'status' => 'Selesai',
                'total_diterima_resmi' => $totalDiterimaStr,
                'completed_at' => now(),
            ]);

            if ($case->bursaBantuan) {
                $case->bursaBantuan->update([
                    'status' => 'Selesai',
                    'volume_terpenuhi' => $case->bursaBantuan->target_volume,
                ]);
            }

            foreach ($case->misiPenyaluran as $misi) {
                $misi->update([
                    'status_tahapan' => 'Selesai',
                    'jumlah_diterima' => $misi->muatan,
                    'selisih' => '0',
                    'completed_at' => now(),
                ]);
            }

            $logDesc = "Bantuan {$case->kategori_kebutuhan} ({$totalDiterimaStr}) telah dikonfirmasi diterima tuntas. Kasus {$case->kode_kasus} resmi diselesaikan (RESOLVED).";
            $message = 'Penerimaan bantuan terkonfirmasi tuntas. Kasus resmi diselesaikan (RESOLVED).';
        } else {
            // Penerimaan parsial (Bab 7.2 & FR-P09: tidak menutup kebutuhan, catat selisih)
            $selisih = $receivedNum - $targetVolNum;
            $case->update([
                'status' => 'Sebagian Terpenuhi',
                'total_diterima_resmi' => $totalDiterimaStr,
            ]);

            foreach ($case->misiPenyaluran as $misi) {
                if ($misi->status_tahapan === 'Tiba di Lokasi & Diserahkan' || $misi->status_tahapan === 'Menunggu Konfirmasi Penerimaan') {
                    $misi->update([
                        'status_tahapan' => 'Selesai',
                        'jumlah_diterima' => "{$receivedNum} {$satuan}",
                        'selisih' => "{$selisih} {$satuan}",
                        'completed_at' => now(),
                    ]);
                }
            }

            $logDesc = "Konfirmasi penerimaan parsial: Diterima {$receivedInputStr} (Total terkonfirmasi: {$totalDiterimaStr}). Masih terdapat kekurangan penerimaan sebesar {$kekuranganPenerimaan} {$satuan}. Kasus tetap dibuka.";
            $message = "Penerimaan parsial tercatat ({$receivedInputStr}). Sisa kekurangan {$kekuranganPenerimaan} {$satuan} tetap terbuka untuk pemenuhan.";
        }

        LogAktivitas::create([
            'kebutuhan_id' => $case->id,
            'posko_id' => $case->posko_id,
            'user_id' => $request->user()?->id,
            'user_name' => $confirmerName,
            'aksi' => 'Konfirmasi Penerimaan',
            'deskripsi' => $logDesc,
        ]);

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $case->fresh(['posko', 'bursaBantuan', 'misiPenyaluran', 'penawaranMitra']),
            'is_fully_fulfilled' => $isFullyFulfilled,
            'kekurangan_penerimaan' => $kekuranganPenerimaan,
        ]);
    }

    /**
     * UPDATE: Edit data laporan kebutuhan warga
     */
    public function update(Request $request, $id): JsonResponse
    {
        $case = is_numeric($id) 
            ? KebutuhanWarga::find($id) 
            : KebutuhanWarga::where('kode_kasus', $id)->first();

        if (!$case) {
            $case = KebutuhanWarga::where('kode_kasus', 'like', "%{$id}%")->firstOrFail();
        }

        $validated = $request->validate([
            'kategori_kebutuhan' => 'sometimes|string|max:100',
            'volume_permintaan' => 'sometimes|string|max:100',
            'jumlah_kk' => 'sometimes|integer|min:1',
            'status_hunian' => 'sometimes|string|max:100',
            'tingkat_urgensi' => 'sometimes|string|max:100',
            'deskripsi' => 'nullable|string',
            'foto_bukti' => 'nullable|string',
            'desa' => 'nullable|string',
            'kecamatan' => 'nullable|string',
            'kabupaten' => 'nullable|string',
            'provinsi' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $case->update($validated);

        if ($case->bursaBantuan && (isset($validated['volume_permintaan']) || isset($validated['kategori_kebutuhan']) || isset($validated['tingkat_urgensi']))) {
            $case->bursaBantuan->update([
                'item_bantuan' => "{$case->kategori_kebutuhan} ({$case->volume_permintaan})",
                'target_volume' => $case->volume_permintaan,
                'urgensi' => $case->tingkat_urgensi,
            ]);
        }

        LogAktivitas::create([
            'kebutuhan_id' => $case->id,
            'posko_id' => $case->posko_id,
            'user_id' => $request->user()?->id,
            'user_name' => $request->user()?->name ?? 'Koordinator Posko / Pemohon',
            'aksi' => 'Update Data',
            'deskripsi' => "Rincian kebutuhan {$case->kode_kasus} diperbarui menjadi {$case->kategori_kebutuhan} ({$case->volume_permintaan}) untuk {$case->jumlah_kk} KK.",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Data kebutuhan berhasil diperbarui (Update).',
            'data' => $case->load(['posko', 'bursaBantuan']),
        ]);
    }

    /**
     * DELETE: Hapus laporan kebutuhan warga
     */
    public function destroy($id): JsonResponse
    {
        $case = is_numeric($id) 
            ? KebutuhanWarga::find($id) 
            : KebutuhanWarga::where('kode_kasus', $id)->first();

        if (!$case) {
            $case = KebutuhanWarga::where('kode_kasus', 'like', "%{$id}%")->first();
        }

        if ($case) {
            $kode = $case->kode_kasus;
            // Cascade delete related records
            $case->bursaBantuan()?->delete();
            $case->misiPenyaluran()?->delete();
            $case->logAktivitas()?->delete();
            $case->delete();

            return response()->json([
                'success' => true,
                'message' => "Laporan kebutuhan {$kode} berhasil dihapus (Delete).",
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Laporan kebutuhan telah dihapus.",
        ]);
    }
}
