<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\PoskoWilayah;
use App\Models\KebutuhanWarga;
use App\Models\BursaBantuan;
use App\Models\PenawaranMitra;
use App\Models\MisiPenyaluran;
use App\Models\LogAktivitas;
use Illuminate\Http\Request;

echo "========================================================\n";
echo "      PENGUJIAN WAJIB 9 SKENARIO REKSA (DATABASE RIIL) \n";
echo "========================================================\n\n";

$results = [];

function assertTest($scenarioName, $condition, $message = '') {
    global $results;
    if ($condition) {
        echo "[PASS] {$scenarioName}: {$message}\n";
        $results[] = ['name' => $scenarioName, 'status' => 'PASS', 'message' => $message];
    } else {
        echo "[FAIL] {$scenarioName}: {$message}\n";
        $results[] = ['name' => $scenarioName, 'status' => 'FAIL', 'message' => $message];
    }
}

// Persiapan Data
$posko = PoskoWilayah::firstOrCreate(
    ['nama_posko' => 'Posko Induk BPBD Sukomanunggal'],
    [
        'kode_posko' => 'PSK-SKM-01',
        'penanggung_jawab_nama' => 'Siti Rahma',
        'telepon' => '081234567890',
        'desa' => 'Sukomanunggal',
        'kecamatan' => 'Sukomanunggal',
        'kabupaten' => 'Kota Surabaya',
        'provinsi' => 'Jawa Timur',
        'status_operasional' => 'Aktif',
        'kapasitas_kk' => 150,
        'kk_terdata' => 35,
    ]
);

$citizenAndi = User::firstOrCreate(
    ['email' => 'andi.masyarakat@reksa.id'],
    [
        'name' => 'Andi Pratama',
        'password' => bcrypt('password'),
        'role' => 'citizen',
    ]
);

$otherCitizen = User::firstOrCreate(
    ['email' => 'budi.warga@reksa.id'],
    [
        'name' => 'Budi Warga Lain',
        'password' => bcrypt('password'),
        'role' => 'citizen',
    ]
);

$mitraUser = User::firstOrCreate(
    ['email' => 'arif.bpbd@reksa.id'],
    [
        'name' => 'Arif Nugroho',
        'password' => bcrypt('password'),
        'role' => 'responder',
        'organization' => 'Satgas BPBD / Mitra Bantuan',
    ]
);

// -------------------------------------------------------------
// SKENARIO 1: BPBD meminta klarifikasi foto buram -> warga unggah ulang foto -> BPBD periksa
// -------------------------------------------------------------
echo "--- Menjalankan Skenario 1 ---\n";
$case1 = KebutuhanWarga::create([
    'kode_kasus' => 'RK-UJI-01-' . rand(100, 999),
    'posko_id' => $posko->id,
    'citizen_id' => $citizenAndi->id,
    'citizen_name' => $citizenAndi->name,
    'citizen_phone' => '08123456789',
    'kategori_kebutuhan' => 'Tenda Pengungsian',
    'volume_permintaan' => '4 Unit',
    'jumlah_kk' => 10,
    'deskripsi' => 'Pengungsi membutuhkan tenda keluarga di balai RW.',
    'foto_bukti' => 'https://images.unsplash.com/photo-initial-blur.jpg',
    'urgensi' => 'Tinggi',
    'status' => 'Dalam Verifikasi',
]);
$fotoAwal = $case1->foto_bukti;

// BPBD meminta klarifikasi
$kategoriKlarifikasi = 'Foto / Bukti Tidak Jelas';
$pertanyaan1 = 'Foto bukti kondisi lapangan tidak fokus dan buram. Mohon unggah ulang foto kondisi terkini tenda pengungsi.';
$controller = app()->make(App\Http\Controllers\Api\KebutuhanWargaController::class);

$reqVerify1 = Request::create("/api/kebutuhan/{$case1->id}/verify", 'POST', [
    'action' => 'clarify',
    'kategori_klarifikasi' => $kategoriKlarifikasi,
    'pertanyaan' => $pertanyaan1,
    'meminta_lampiran' => true,
    'verifier_name' => 'Siti Rahma',
]);
$resVerify1 = $controller->verify($reqVerify1, $case1->id);

$case1->refresh();
assertTest('Skenario 1.1', $case1->status === 'Perlu Klarifikasi' && $case1->meminta_lampiran === true, 'Status berubah ke Perlu Klarifikasi dan meminta_lampiran true');

// Warga menjawab dan mengunggah foto baru
$fotoBaru = 'https://images.unsplash.com/photo-klarifikasi-clear.jpg';
$reqJawab1 = Request::create("/api/kebutuhan/{$case1->id}/jawab-klarifikasi", 'POST', [
    'citizen_id' => $citizenAndi->id,
    'citizen_name' => $citizenAndi->name,
    'jawaban' => 'Berikut foto terbaru lokasi posko balai RW dengan pencahayaan jelas.',
    'foto_klarifikasi' => $fotoBaru,
]);
$resJawab1 = $controller->jawabKlarifikasi($reqJawab1, $case1->id);

$case1->refresh();
assertTest('Skenario 1.2', $case1->status === 'Dalam Verifikasi', 'Jawaban warga mengubah status kembali ke Dalam Verifikasi (tidak langsung otomatis disetujui)');
assertTest('Skenario 1.3', $case1->foto_bukti === $fotoAwal && $case1->foto_klarifikasi === $fotoBaru, 'Foto bukti awal tetap utuh dipertahankan dan foto baru tersimpan di foto_klarifikasi');
assertTest('Skenario 1.4', !empty($case1->riwayat_klarifikasi) && count($case1->riwayat_klarifikasi) >= 1, 'Riwayat klarifikasi tersimpan terstruktur dengan lampiran');

// -------------------------------------------------------------
// SKENARIO 2: BPBD meminta info tambahan jumlah kebutuhan -> warga menjawab -> status berubah benar
// -------------------------------------------------------------
echo "\n--- Menjalankan Skenario 2 ---\n";
$case2 = KebutuhanWarga::create([
    'kode_kasus' => 'RK-UJI-02-' . rand(100, 999),
    'posko_id' => $posko->id,
    'citizen_id' => $citizenAndi->id,
    'citizen_name' => $citizenAndi->name,
    'citizen_phone' => '08123456789',
    'kategori_kebutuhan' => 'Popok & Perlengkapan Bayi',
    'volume_permintaan' => 'Banyak Paket',
    'jumlah_kk' => 6,
    'deskripsi' => 'Kebutuhan popok bayi.',
    'status' => 'Dalam Verifikasi',
]);

$reqVerify2 = Request::create("/api/kebutuhan/{$case2->id}/verify", 'POST', [
    'action' => 'clarify',
    'kategori_klarifikasi' => 'Jumlah Kebutuhan Tidak Realistis / Rinci',
    'pertanyaan' => 'Berapa banyak balita yang membutuhkan popok serta rentang ukurannya?',
    'meminta_lampiran' => false,
    'verifier_name' => 'Siti Rahma',
]);
$controller->verify($reqVerify2, $case2->id);

$case2->refresh();
assertTest('Skenario 2.1', $case2->status === 'Perlu Klarifikasi', 'Laporan berpindah ke status Perlu Klarifikasi');

$reqJawab2 = Request::create("/api/kebutuhan/{$case2->id}/jawab-klarifikasi", 'POST', [
    'citizen_id' => $citizenAndi->id,
    'citizen_name' => $citizenAndi->name,
    'jawaban' => 'Terdapat 8 balita (4 balita ukuran M, 4 balita ukuran L). Total dibutuhkan 16 pack popok.',
    'volume_permintaan' => '16 Pack Popok Bayi',
]);
$controller->jawabKlarifikasi($reqJawab2, $case2->id);

$case2->refresh();
assertTest('Skenario 2.2', $case2->status === 'Dalam Verifikasi' && $case2->volume_permintaan === '16 Pack Popok Bayi', 'Status berubah ke Dalam Verifikasi dan jumlah kebutuhan terbarui secara akurat');

// -------------------------------------------------------------
// SKENARIO 3: BPBD menolak laporan; masyarakat melihat alasan dan tindak lanjut
// -------------------------------------------------------------
echo "\n--- Menjalankan Skenario 3 ---\n";
$case3 = KebutuhanWarga::create([
    'kode_kasus' => 'RK-UJI-03-' . rand(100, 999),
    'posko_id' => $posko->id,
    'citizen_id' => $citizenAndi->id,
    'citizen_name' => $citizenAndi->name,
    'citizen_phone' => '08123456789',
    'kategori_kebutuhan' => 'Alat Berat',
    'volume_permintaan' => '2 Ekskavator',
    'jumlah_kk' => 40,
    'status' => 'Dalam Verifikasi',
]);

$alasanTolak = 'Pengadaan alat berat ditangani terpusat oleh Dinas PU Bina Marga, bukan melalui posko logistik pengungsi.';
$tindakLanjutTolak = 'Silakan berkoordinasi langsung dengan Posko BPBD Provinsi di Call Center 112 atau Dinas Pekerjaan Umum.';

$reqVerify3 = Request::create("/api/kebutuhan/{$case3->id}/verify", 'POST', [
    'action' => 'reject',
    'alasan' => $alasanTolak,
    'tindak_lanjut' => $tindakLanjutTolak,
    'verifier_name' => 'Siti Rahma',
]);
$controller->verify($reqVerify3, $case3->id);

$case3->refresh();
assertTest('Skenario 3.1', $case3->status === 'Ditolak', 'Status laporan tercatat Ditolak');
assertTest('Skenario 3.2', $case3->alasan_penolakan === $alasanTolak && $case3->tindak_lanjut_penolakan === $tindakLanjutTolak, 'Alasan penolakan spesifik dan arahan tindak lanjut tersimpan di database');

// -------------------------------------------------------------
// SKENARIO 4: Mitra menawarkan kebutuhan pokok tanpa memiliki kendaraan
// -------------------------------------------------------------
echo "\n--- Menjalankan Skenario 4 ---\n";
$case4 = KebutuhanWarga::create([
    'kode_kasus' => 'RK-UJI-04-' . rand(100, 999),
    'posko_id' => $posko->id,
    'citizen_id' => $citizenAndi->id,
    'citizen_name' => 'Warga Pengungsi',
    'citizen_phone' => '08123456789',
    'kategori_kebutuhan' => 'Makanan Siap Saji',
    'volume_permintaan' => '150 Paket Nasi',
    'jumlah_kk' => 30,
    'status' => 'Dalam Verifikasi',
]);

// Verifikasi dan publikasikan ke Bursa
$controller->verify(Request::create("/api/kebutuhan/{$case4->id}/verify", 'POST', [
    'action' => 'verify',
    'verifier_name' => 'Siti Rahma',
]), $case4->id);

$bursa4 = BursaBantuan::where('kebutuhan_id', $case4->id)->firstOrFail();

$penawaranController = app()->make(App\Http\Controllers\Api\PenawaranMitraController::class);
$reqTawar4 = Request::create('/api/penawaran', 'POST', [
    'bursa_id' => $bursa4->id,
    'kebutuhan_id' => $case4->id,
    'posko_id' => $posko->id,
    'mitra_id' => $mitraUser->id,
    'mitra_name' => $mitraUser->name,
    'organisasi' => 'Dapur Umum Peduli Kemanusiaan',
    'jenis_bantuan' => 'Nasi Kotak Higienis',
    'jumlah_tawaran' => '50 Paket',
    'volume_angka' => 50,
    'satuan' => 'Paket',
    'metode_penyaluran' => 'serah_posko', // TANPA KENDARAAN MANDIRI
    'armada_info' => null,
    'kategori_komoditas' => 'Pangan & Makanan Siap Saji',
    'waktu_kesiapan' => 'Pukul 12.00 WIB',
    'catatan' => 'Makanan diserahkan langsung oleh tim dapur umum ke gudang BPBD.',
]);
$resTawar4 = $penawaranController->store($reqTawar4);
$penawaran4Data = json_decode($resTawar4->getContent(), true)['data'];

assertTest('Skenario 4.1', $resTawar4->getStatusCode() === 201, 'Penawaran bantuan kebutuhan pokok berhasil dibuat');
assertTest('Skenario 4.2', $penawaran4Data['metode_penyaluran'] === 'serah_posko' && empty($penawaran4Data['armada_info']), 'Mitra dapat menawarkan bantuan logistik tanpa kewajiban memiliki armada');

// -------------------------------------------------------------
// SKENARIO 5: Multi-mitra menawarkan barang yang sama & BPBD setujui tanpa over-allocation
// -------------------------------------------------------------
echo "\n--- Menjalankan Skenario 5 ---\n";
$case5 = KebutuhanWarga::create([
    'kode_kasus' => 'RK-UJI-05-' . rand(100, 999),
    'posko_id' => $posko->id,
    'citizen_id' => $citizenAndi->id,
    'citizen_name' => 'Warga Pengungsi Selimut',
    'citizen_phone' => '08123456789',
    'kategori_kebutuhan' => 'Selimut Hangat',
    'volume_permintaan' => '100 Lembar',
    'jumlah_kk' => 25,
    'status' => 'Dalam Verifikasi',
]);

$controller->verify(Request::create("/api/kebutuhan/{$case5->id}/verify", 'POST', [
    'action' => 'verify',
    'verifier_name' => 'Siti Rahma',
]), $case5->id);

$bursa5 = BursaBantuan::where('kebutuhan_id', $case5->id)->firstOrFail();

// Mitra A menawarkan 60 lembar
$reqTawar5A = Request::create('/api/penawaran', 'POST', [
    'bursa_id' => $bursa5->id,
    'kebutuhan_id' => $case5->id,
    'posko_id' => $posko->id,
    'organisasi' => 'Yayasan Kemanusiaan A',
    'jenis_bantuan' => 'Selimut Hangat',
    'jumlah_tawaran' => '60 Lembar',
    'volume_angka' => 60,
    'satuan' => 'Lembar',
    'metode_penyaluran' => 'serah_posko',
]);
$resTawar5A = $penawaranController->store($reqTawar5A);
$tawar5AId = json_decode($resTawar5A->getContent(), true)['data']['id'];

// Mitra B menawarkan 60 lembar juga (Total 120 > target 100)
$reqTawar5B = Request::create('/api/penawaran', 'POST', [
    'bursa_id' => $bursa5->id,
    'kebutuhan_id' => $case5->id,
    'posko_id' => $posko->id,
    'organisasi' => 'Relawan Selimut B',
    'jenis_bantuan' => 'Selimut Hangat',
    'jumlah_tawaran' => '60 Lembar',
    'volume_angka' => 60,
    'satuan' => 'Lembar',
    'metode_penyaluran' => 'koordinasi',
]);
$resTawar5B = $penawaranController->store($reqTawar5B);
$tawar5BId = json_decode($resTawar5B->getContent(), true)['data']['id'];

// BPBD Menyetujui Mitra A (60 Lembar)
$penawaranController->approve(Request::create("/api/penawaran/{$tawar5AId}/approve", 'POST', [
    'approved_volume' => '60 Lembar',
    'volume_angka' => 60,
]), $tawar5AId);

$case5->refresh();
assertTest('Skenario 5.1', $case5->status === 'Sebagian Terpenuhi' && $case5->total_alokasi_resmi === '60 Lembar', 'Mitra A disetujui, alokasi resmi tercatat 60 Lembar');

// BPBD Menyetujui Mitra B: Sistem membatasi (cap) ke sisa kekurangan (40 lembar) agar total pas 100
$penawaranController->approve(Request::create("/api/penawaran/{$tawar5BId}/approve", 'POST', [
    'approved_volume' => '60 Lembar',
    'volume_angka' => 60,
]), $tawar5BId);

$case5->refresh();
$totalAlokasiDisetujui = PenawaranMitra::where('kebutuhan_id', $case5->id)
    ->where('status', 'Disetujui')
    ->sum('volume_disetujui_angka');

assertTest('Skenario 5.2', $totalAlokasiDisetujui <= 100, "Total alokasi resmi aktif ({$totalAlokasiDisetujui} Lembar) tidak melebihi kebutuhan riil (100 Lembar)");
assertTest('Skenario 5.3', $case5->status === 'Teralokasi Penuh', 'Status kebutuhan berubah ke Teralokasi Penuh');

// -------------------------------------------------------------
// SKENARIO 6: Mitra yang memiliki armada dapat menggunakannya sebagai dukungan distribusi
// -------------------------------------------------------------
echo "\n--- Menjalankan Skenario 6 ---\n";
$case6 = KebutuhanWarga::create([
    'kode_kasus' => 'RK-UJI-06-' . rand(100, 999),
    'posko_id' => $posko->id,
    'citizen_id' => $citizenAndi->id,
    'citizen_name' => 'Warga Krisis Air',
    'citizen_phone' => '08123456789',
    'kategori_kebutuhan' => 'Air Bersih',
    'volume_permintaan' => '1000 Liter',
    'jumlah_kk' => 30,
    'status' => 'Dalam Verifikasi',
]);

$controller->verify(Request::create("/api/kebutuhan/{$case6->id}/verify", 'POST', [
    'action' => 'verify',
    'verifier_name' => 'Siti Rahma',
]), $case6->id);

$bursa6 = BursaBantuan::where('kebutuhan_id', $case6->id)->firstOrFail();

$reqTawar6 = Request::create('/api/penawaran', 'POST', [
    'bursa_id' => $bursa6->id,
    'kebutuhan_id' => $case6->id,
    'posko_id' => $posko->id,
    'mitra_id' => $mitraUser->id,
    'mitra_name' => $mitraUser->name,
    'organisasi' => 'Satgas Armada Tangki Air Bersih',
    'jenis_bantuan' => 'Air Bersih',
    'jumlah_tawaran' => '1000 Liter',
    'volume_angka' => 1000,
    'satuan' => 'Liter',
    'metode_penyaluran' => 'mandiri', // DUKUNGAN ARMADA MANDIRI
    'armada_info' => 'Truk Tangki Air Bersih Kapasitas 2000L - Nopol L 8888 XY',
    'kategori_komoditas' => 'Air Bersih & Sanitasi',
    'waktu_kesiapan' => 'Siap meluncur hari ini',
]);
$resTawar6 = $penawaranController->store($reqTawar6);
$tawar6Id = json_decode($resTawar6->getContent(), true)['data']['id'];

$penawaranController->approve(Request::create("/api/penawaran/{$tawar6Id}/approve", 'POST', [
    'approved_volume' => '1000 Liter',
    'volume_angka' => 1000,
]), $tawar6Id);

$misi6 = MisiPenyaluran::where('penawaran_id', $tawar6Id)->first();
assertTest('Skenario 6.1', $misi6 !== null, 'Surat Misi Penyaluran otomatis terbit setelah persetujuan alokasi');
assertTest('Skenario 6.2', str_contains($misi6->armada_info ?? '', 'Truk Tangki Air'), 'Misi mencatat informasi armada mandiri yang disediakan oleh Mitra Bantuan');

// -------------------------------------------------------------
// SKENARIO 7: Bantuan diterima sebagian; sistem tetap mencatat sisa kebutuhan
// -------------------------------------------------------------
echo "\n--- Menjalankan Skenario 7 ---\n";
$case7 = KebutuhanWarga::create([
    'kode_kasus' => 'RK-UJI-07-' . rand(100, 999),
    'posko_id' => $posko->id,
    'citizen_id' => $citizenAndi->id,
    'citizen_name' => 'Warga RW 07',
    'citizen_phone' => '08123456789',
    'kategori_kebutuhan' => 'Beras & Sembako',
    'volume_permintaan' => '100 Karung',
    'jumlah_kk' => 40,
    'status' => 'Dalam Verifikasi',
]);

$controller->verify(Request::create("/api/kebutuhan/{$case7->id}/verify", 'POST', [
    'action' => 'verify',
    'verifier_name' => 'Siti Rahma',
]), $case7->id);

$bursa7 = BursaBantuan::where('kebutuhan_id', $case7->id)->firstOrFail();

$resTawar7 = $penawaranController->store(Request::create('/api/penawaran', 'POST', [
    'bursa_id' => $bursa7->id,
    'kebutuhan_id' => $case7->id,
    'posko_id' => $posko->id,
    'organisasi' => 'Mitra Bantuan Beras',
    'jenis_bantuan' => 'Beras Medium',
    'jumlah_tawaran' => '50 Karung',
    'volume_angka' => 50,
    'satuan' => 'Karung',
    'metode_penyaluran' => 'serah_posko',
]));
$tawar7Id = json_decode($resTawar7->getContent(), true)['data']['id'];

$penawaranController->approve(Request::create("/api/penawaran/{$tawar7Id}/approve", 'POST', [
    'approved_volume' => '50 Karung',
    'volume_angka' => 50,
]), $tawar7Id);

$misi7 = MisiPenyaluran::where('penawaran_id', $tawar7Id)->firstOrFail();

$resKonfirmasi = $controller->confirmReceipt(Request::create("/api/kebutuhan/{$case7->id}/confirm-receipt", 'POST', [
    'diterima_volume' => '35 Karung',
    'catatan' => '35 karung beras dalam kondisi baik, 15 karung rusak basah.',
]), $case7->id);

$case7->refresh();
assertTest('Skenario 7.1', $case7->total_diterima_resmi === '35 Karung', 'Penerimaan fisik sebagian (35 Karung) tercatat pada kebutuhan warga');
assertTest('Skenario 7.2', $case7->status === 'Sebagian Terpenuhi', 'Status kebutuhan tetap Sebagian Terpenuhi karena masih terdapat kekurangan yang belum diterima');

// -------------------------------------------------------------
// SKENARIO 8: Semua tindakan tersimpan pada database & tercermin pada riwayat aktivitas
// -------------------------------------------------------------
echo "\n--- Menjalankan Skenario 8 ---\n";
$logs = LogAktivitas::where('kebutuhan_id', $case1->id)->get();
assertTest('Skenario 8.1', $logs->count() >= 2, 'Riwayat aktivitas kasus 1 tercatat di tabel log_aktivitas');
$hasClarifyAction = $logs->contains(fn($l) => str_contains($l->aksi, 'Klarifikasi'));
$hasAnswerAction = $logs->contains(fn($l) => str_contains($l->aksi, 'Jawaban Klarifikasi'));
assertTest('Skenario 8.2', $hasClarifyAction && $hasAnswerAction, 'Log aktivitas mencakup aksi Permintaan Klarifikasi dan Jawaban Klarifikasi Dikirim');

// -------------------------------------------------------------
// SKENARIO 9: Hak akses mencegah masyarakat mengubah data bukan miliknya
// -------------------------------------------------------------
echo "\n--- Menjalankan Skenario 9 ---\n";
// Kasus 1 adalah milik citizenAndi. otherCitizen (Budi) mencoba menjawab:
$reqForbidden = Request::create("/api/kebutuhan/{$case1->id}/jawab-klarifikasi", 'POST', [
    'citizen_id' => $otherCitizen->id, // BUKAN PEMILIK
    'citizen_name' => $otherCitizen->name,
    'jawaban' => 'Upaya manipulasi jawaban klarifikasi orang lain.',
]);
$resForbidden = $controller->jawabKlarifikasi($reqForbidden, $case1->id);

assertTest('Skenario 9.1', $resForbidden->getStatusCode() === 403, 'Akses ditolak (HTTP 403) ketika warga lain mencoba menjawab klarifikasi laporan yang bukan miliknya');

echo "\n========================================================\n";
$total = count($results);
$passed = count(array_filter($results, fn($r) => $r['status'] === 'PASS'));
$failed = $total - $passed;
echo "HASIL AKHIR: {$passed} / {$total} SKENARIO PENGUJIAN BERHASIL (FAIL: {$failed})\n";
echo "========================================================\n";

if ($failed > 0) {
    exit(1);
}
exit(0);
