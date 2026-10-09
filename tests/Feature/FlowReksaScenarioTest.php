<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\PoskoWilayah;
use App\Models\KebutuhanWarga;
use App\Models\BursaBantuan;
use App\Models\PenawaranMitra;
use App\Models\MisiPenyaluran;
use App\Models\LogAktivitas;
use Illuminate\Support\Facades\DB;

class FlowReksaScenarioTest extends TestCase
{
    protected PoskoWilayah $posko;
    protected User $citizenUser;
    protected User $otherCitizenUser;
    protected User $poskoUser;
    protected User $mitraUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Siapkan Posko
        $this->posko = PoskoWilayah::firstOrCreate(
            ['nama_posko' => 'Posko Uji BPBD Sukomanunggal'],
            [
                'kode_posko' => 'PSK-TEST-01',
                'penanggung_jawab_nama' => 'Siti Rahma (Koordinator Test)',
                'telepon' => '081234567890',
                'kabupaten' => 'Kota Surabaya',
                'provinsi' => 'Jawa Timur',
                'status_operasional' => 'Aktif',
                'kapasitas_kk' => 100,
                'kk_terdata' => 20,
            ]
        );

        // Siapkan Akun Uji
        $this->citizenUser = User::firstOrCreate(
            ['email' => 'andi.test@reksa.id'],
            [
                'name' => 'Andi Pratama Uji',
                'password' => bcrypt('password'),
                'role' => 'citizen',
                'phone' => '081200000001',
            ]
        );

        $this->otherCitizenUser = User::firstOrCreate(
            ['email' => 'budi.test@reksa.id'],
            [
                'name' => 'Budi Bukan Pemilik',
                'password' => bcrypt('password'),
                'role' => 'citizen',
                'phone' => '081200000002',
            ]
        );

        $this->poskoUser = User::firstOrCreate(
            ['email' => 'siti.test@reksa.id'],
            [
                'name' => 'Siti Rahma Posko Uji',
                'password' => bcrypt('password'),
                'role' => 'posko',
            ]
        );

        $this->mitraUser = User::firstOrCreate(
            ['email' => 'arif.test@reksa.id'],
            [
                'name' => 'Arif Mitra Uji',
                'password' => bcrypt('password'),
                'role' => 'responder',
                'organization' => 'Yayasan Peduli Bencana Uji',
            ]
        );
    }

    /**
     * Skenario 1: BPBD meminta klarifikasi karena foto buram; masyarakat mengunggah ulang foto dan BPBD dapat memeriksanya.
     */
    public function test_skenario_1_klarifikasi_foto_buram_dan_unggah_ulang(): void
    {
        $case = KebutuhanWarga::create([
            'kode_kasus' => 'RK-TEST-FOTO-' . rand(1000, 9999),
            'posko_id' => $this->posko->id,
            'citizen_id' => $this->citizenUser->id,
            'nama_pelapor' => $this->citizenUser->name,
            'kontak_pelapor' => '081200000001',
            'kategori_kebutuhan' => 'Tenda Pengungsian',
            'volume_permintaan' => '5 Unit',
            'jumlah_kk' => 12,
            'deskripsi' => 'Pengungsi membutuhkan tenda keluarga tambahan di lapangan RT 03.',
            'foto_bukti' => 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600',
            'urgensi' => 'Tinggi',
            'status' => 'Dalam Verifikasi',
        ]);

        $fotoAwal = $case->foto_bukti;

        // 1. BPBD meminta klarifikasi terkait foto buram
        $responseKlarifikasi = $this->postJson("/api/kebutuhan/{$case->id}/verify", [
            'action' => 'clarify',
            'kategori_klarifikasi' => 'Foto / Bukti Tidak Jelas',
            'pertanyaan' => 'Foto bukti kondisi lapangan buram/tidak terbaca. Mohon unggah ulang foto kondisi pengungsi terkini.',
            'meminta_lampiran' => true,
            'verifier_name' => 'Siti Rahma',
        ]);

        $responseKlarifikasi->assertStatus(200);

        $case->refresh();
        $this->assertEquals('Perlu Klarifikasi', $case->status);
        $this->assertEquals('Foto / Bukti Tidak Jelas', $case->kategori_klarifikasi);
        $this->assertTrue((bool)$case->meminta_lampiran);
        $this->assertNotEmpty($case->riwayat_klarifikasi);

        // 2. Masyarakat mengunggah foto baru dan menjawab
        $fotoBaru = 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800';
        $responseJawab = $this->postJson("/api/kebutuhan/{$case->id}/jawab-klarifikasi", [
            'citizen_id' => $this->citizenUser->id,
            'citizen_name' => $this->citizenUser->name,
            'jawaban' => 'Berikut kami unggah foto kondisi pengungsi yang baru diambil siang ini di tenda darurat.',
            'foto_klarifikasi' => $fotoBaru,
        ]);

        $responseJawab->assertStatus(200);

        $case->refresh();
        // Status kembali ke Dalam Verifikasi (bukan langsung selesai/terverifikasi)
        $this->assertEquals('Dalam Verifikasi', $case->status);
        // Foto awal TIDAK boleh terhapus
        $this->assertEquals($fotoAwal, $case->foto_bukti);
        // Foto klarifikasi baru tersimpan
        $this->assertEquals($fotoBaru, $case->foto_klarifikasi);
        // Riwayat menyimpan putaran dan bukti foto
        $lastHistory = end($case->riwayat_klarifikasi);
        $this->assertEquals('Jawaban Dikirim', $lastHistory['status']);
        $this->assertEquals($fotoBaru, $lastHistory['foto_tambahan']);

        // 3. BPBD memeriksa kembali laporan
        $responseShow = $this->getJson("/api/kebutuhan/{$case->id}");
        $responseShow->assertStatus(200);
        $responseShow->assertJsonPath('data.foto_bukti', $fotoAwal);
        $responseShow->assertJsonPath('data.foto_klarifikasi', $fotoBaru);
        $responseShow->assertJsonPath('data.status', 'Dalam Verifikasi');
    }

    /**
     * Skenario 2: BPBD meminta informasi tambahan mengenai jumlah kebutuhan; masyarakat menjawab dan status berubah secara benar.
     */
    public function test_skenario_2_klarifikasi_rincian_jumlah_kebutuhan(): void
    {
        $case = KebutuhanWarga::create([
            'kode_kasus' => 'RK-TEST-QTY-' . rand(1000, 9999),
            'posko_id' => $this->posko->id,
            'citizen_id' => $this->citizenUser->id,
            'nama_pelapor' => $this->citizenUser->name,
            'kontak_pelapor' => '081200000001',
            'kategori_kebutuhan' => 'Popok & Perlengkapan Bayi',
            'volume_permintaan' => 'Banyak Paket',
            'jumlah_kk' => 5,
            'deskripsi' => 'Butuh bantuan perlengkapan balita.',
            'urgensi' => 'Sedang',
            'status' => 'Dalam Verifikasi',
        ]);

        // BPBD minta rincian kuantitas
        $this->postJson("/api/kebutuhan/{$case->id}/verify", [
            'action' => 'clarify',
            'kategori_klarifikasi' => 'Jumlah Kebutuhan Tidak Realistis / Rinci',
            'pertanyaan' => 'Mohon rincikan jumlah balita dan ukuran popok yang diperlukan (S/M/L/XL).',
            'meminta_lampiran' => false,
            'verifier_name' => 'Siti Rahma',
        ])->assertStatus(200);

        $case->refresh();
        $this->assertEquals('Perlu Klarifikasi', $case->status);

        // Warga menjawab dengan kuantitas yang jelas
        $this->postJson("/api/kebutuhan/{$case->id}/jawab-klarifikasi", [
            'citizen_id' => $this->citizenUser->id,
            'citizen_name' => $this->citizenUser->name,
            'jawaban' => 'Ada 8 balita: 3 balita ukuran M, 5 balita ukuran L. Kebutuhan 16 pack popok dan 8 botol minyak telon.',
            'volume_permintaan' => '16 Pack Popok Bayi',
        ])->assertStatus(200);

        $case->refresh();
        $this->assertEquals('Dalam Verifikasi', $case->status);
        $this->assertEquals('16 Pack Popok Bayi', $case->volume_permintaan);
    }

    /**
     * Skenario 3: BPBD menolak laporan; masyarakat dapat melihat alasan dan tindak lanjutnya.
     */
    public function test_skenario_3_penolakan_laporan_dengan_alasan_dan_tindak_lanjut(): void
    {
        $case = KebutuhanWarga::create([
            'kode_kasus' => 'RK-TEST-REJECT-' . rand(1000, 9999),
            'posko_id' => $this->posko->id,
            'citizen_id' => $this->citizenUser->id,
            'nama_pelapor' => $this->citizenUser->name,
            'kontak_pelapor' => '081200000001',
            'kategori_kebutuhan' => 'Alat Berat',
            'volume_permintaan' => '2 Ekskavator',
            'jumlah_kk' => 50,
            'deskripsi' => 'Permintaan ekskavator untuk membersihkan puing mandiri.',
            'urgensi' => 'Tinggi',
            'status' => 'Dalam Verifikasi',
        ]);

        $alasan = 'Pengadaan alat berat dikelola terpusat oleh Dinas PU Bina Marga, bukan melalui pelaporan logistik pengungsi.';
        $tindakLanjut = 'Permohonan telah diteruskan ke Posko Induk BPBD Jawa Timur. Silakan menghubungi Hotline Dinas PU di 031-8280000.';

        $response = $this->postJson("/api/kebutuhan/{$case->id}/verify", [
            'action' => 'reject',
            'alasan' => $alasan,
            'tindak_lanjut' => $tindakLanjut,
            'verifier_name' => 'Siti Rahma',
        ]);

        $response->assertStatus(200);

        $case->refresh();
        $this->assertEquals('Ditolak', $case->status);
        $this->assertEquals($alasan, $case->alasan_penolakan);
        $this->assertEquals($tindakLanjut, $case->tindak_lanjut_penolakan);

        // Periksa bahwa GET detail memunculkan alasan & tindak lanjut
        $this->getJson("/api/kebutuhan/{$case->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'Ditolak')
            ->assertJsonPath('data.alasan_penolakan', $alasan)
            ->assertJsonPath('data.tindak_lanjut_penolakan', $tindakLanjut);
    }

    /**
     * Skenario 4: Satu mitra menawarkan kebutuhan pokok tanpa memiliki kendaraan (serah posko).
     */
    public function test_skenario_4_mitra_menawarkan_kebutuhan_tanpa_kendaraan(): void
    {
        // 1. Kebutuhan terverifikasi masuk ke Bursa
        $case = KebutuhanWarga::create([
            'kode_kasus' => 'RK-TEST-BURSA-' . rand(1000, 9999),
            'posko_id' => $this->posko->id,
            'citizen_id' => $this->citizenUser->id,
            'nama_pelapor' => 'Warga Terdampak Banjir',
            'kontak_pelapor' => '081200000001',
            'kategori_kebutuhan' => 'Makanan Siap Saji',
            'volume_permintaan' => '200 Porsi Nasi Bungkus',
            'jumlah_kk' => 50,
            'urgensi' => 'Tinggi',
            'status' => 'Dalam Verifikasi',
        ]);

        // Verifikasi menjadi Kebutuhan Terbuka di Bursa
        $this->postJson("/api/kebutuhan/{$case->id}/verify", [
            'action' => 'verify',
            'verifier_name' => 'Siti Rahma',
        ])->assertStatus(200);

        $bursa = BursaBantuan::where('kebutuhan_id', $case->id)->firstOrFail();

        // 2. Mitra mengajukan tawaran tanpa armada (diserahkan langsung ke gudang/posko BPBD)
        $response = $this->postJson('/api/penawaran', [
            'bursa_id' => $bursa->id,
            'kebutuhan_id' => $case->id,
            'posko_id' => $this->posko->id,
            'mitra_id' => $this->mitraUser->id,
            'mitra_name' => 'Arif Nugroho',
            'organisasi' => 'Dapur Umum Mandiri Peduli',
            'jenis_bantuan' => 'Nasi Bungkus Siap Saji',
            'jumlah_tawaran' => '80 Porsi',
            'volume_angka' => 80,
            'satuan' => 'Porsi',
            'metode_penyaluran' => 'serah_posko', // TANPA ARMADA
            'armada_info' => null,
            'kategori_komoditas' => 'Pangan & Makanan Siap Saji',
            'waktu_kesiapan' => 'Siang ini pukul 11:30 WIB',
            'catatan' => 'Bantuan diantar oleh tim dapur umum langsung ke posko gudang BPBD Sukomanunggal.',
        ]);

        $response->assertStatus(201);
        $penawaranId = $response->json('data.id');

        $penawaran = PenawaranMitra::findOrFail($penawaranId);
        $this->assertEquals('Diajukan', $penawaran->status);
        $this->assertEquals('serah_posko', $penawaran->metode_penyaluran);
        $this->assertNull($penawaran->armada_info);
    }

    /**
     * Skenario 5: Mitra lain menawarkan bantuan yang sama, lalu BPBD menyetujui penawaran tanpa menyebabkan alokasi berlebih.
     */
    public function test_skenario_5_multi_mitra_tanpa_over_allocation(): void
    {
        $case = KebutuhanWarga::create([
            'kode_kasus' => 'RK-MULTI-' . rand(1000, 9999),
            'posko_id' => $this->posko->id,
            'citizen_id' => $this->citizenUser->id,
            'nama_pelapor' => 'Warga Kampung Baru',
            'kontak_pelapor' => '081200000001',
            'kategori_kebutuhan' => 'Selimut Hangat',
            'volume_permintaan' => '100 Lembar',
            'jumlah_kk' => 25,
            'urgensi' => 'Tinggi',
            'status' => 'Dalam Verifikasi',
        ]);

        $this->postJson("/api/kebutuhan/{$case->id}/verify", [
            'action' => 'verify',
            'verifier_name' => 'Siti Rahma',
        ])->assertStatus(200);

        $bursa = BursaBantuan::where('kebutuhan_id', $case->id)->firstOrFail();

        // Mitra 1: Menawarkan 60 Lembar
        $res1 = $this->postJson('/api/penawaran', [
            'bursa_id' => $bursa->id,
            'kebutuhan_id' => $case->id,
            'posko_id' => $this->posko->id,
            'organisasi' => 'Organisasi Relawan A',
            'jenis_bantuan' => 'Selimut Hangat',
            'jumlah_tawaran' => '60 Lembar',
            'volume_angka' => 60,
            'satuan' => 'Lembar',
            'metode_penyaluran' => 'serah_posko',
        ]);
        $offer1Id = $res1->json('data.id');

        // Mitra 2: Menawarkan 60 Lembar (Total 60 + 60 = 120 > target 100)
        $res2 = $this->postJson('/api/penawaran', [
            'bursa_id' => $bursa->id,
            'kebutuhan_id' => $case->id,
            'posko_id' => $this->posko->id,
            'organisasi' => 'Organisasi Relawan B',
            'jenis_bantuan' => 'Selimut Hangat',
            'jumlah_tawaran' => '60 Lembar',
            'volume_angka' => 60,
            'satuan' => 'Lembar',
            'metode_penyaluran' => 'koordinasi',
        ]);
        $offer2Id = $res2->json('data.id');

        // BPBD Menyetujui Mitra 1 Penuh (60 Lembar)
        $this->postJson("/api/penawaran/{$offer1Id}/approve", [
            'approved_volume' => '60 Lembar',
            'volume_angka' => 60,
            'catatan' => 'Disetujui penuh untuk tahap 1.',
        ])->assertStatus(200);

        $case->refresh();
        $this->assertEquals('Sebagian Terpenuhi', $case->status);
        $this->assertEquals('60 Lembar', $case->total_alokasi_resmi);

        // BPBD Menyetujui Mitra 2: Karena sisa kekurangan adalah 40 (100 - 60),
        // sistem harus membatasi (cap) ke sisa kekurangan (40) atau mencegah kelebihan alokasi
        $this->postJson("/api/penawaran/{$offer2Id}/approve", [
            'approved_volume' => '60 Lembar',
            'volume_angka' => 60,
            'catatan' => 'Disetujui disesuaikan sisa kekurangan.',
        ])->assertStatus(200);

        $case->refresh();
        $this->assertEquals('Teralokasi Penuh', $case->status);

        // Periksa bahwa total alokasi yang disetujui TIDAK melebihi 100
        $totalAlokasi = PenawaranMitra::where('kebutuhan_id', $case->id)
            ->where('status', 'Disetujui')
            ->sum('volume_disetujui');

        $this->assertLessThanOrEqual(100, $totalAlokasi);
        $this->assertEquals(100, $totalAlokasi);
    }

    /**
     * Skenario 6: Mitra yang memiliki armada dapat menggunakannya sebagai dukungan distribusi.
     */
    public function test_skenario_6_mitra_dengan_armada_mandiri(): void
    {
        $case = KebutuhanWarga::create([
            'kode_kasus' => 'RK-AIR-' . rand(1000, 9999),
            'posko_id' => $this->posko->id,
            'citizen_id' => $this->citizenUser->id,
            'nama_pelapor' => 'Warga Pengungsian Air Bersih',
            'kontak_pelapor' => '081200000001',
            'kategori_kebutuhan' => 'Air Bersih',
            'volume_permintaan' => '1000 Liter',
            'jumlah_kk' => 30,
            'urgensi' => 'Kritis',
            'status' => 'Dalam Verifikasi',
        ]);

        $this->postJson("/api/kebutuhan/{$case->id}/verify", [
            'action' => 'verify',
            'verifier_name' => 'Siti Rahma',
        ])->assertStatus(200);

        $bursa = BursaBantuan::where('kebutuhan_id', $case->id)->firstOrFail();

        // Mitra menawarkan dengan armada mandiri
        $res = $this->postJson('/api/penawaran', [
            'bursa_id' => $bursa->id,
            'kebutuhan_id' => $case->id,
            'posko_id' => $this->posko->id,
            'mitra_id' => $this->mitraUser->id,
            'mitra_name' => 'Arif Nugroho',
            'organisasi' => 'Satgas Tanggap Bencana & Truk Tangki Air',
            'jenis_bantuan' => 'Air Bersih',
            'jumlah_tawaran' => '1000 Liter',
            'volume_angka' => 1000,
            'satuan' => 'Liter',
            'metode_penyaluran' => 'mandiri', // DUKUNGAN ARMADA MANDIRI
            'armada_info' => 'Truk Tangki Air Kapasitas 2000L - Nopol L 9081 AB',
            'kategori_komoditas' => 'Air Bersih & Sanitasi',
            'waktu_kesiapan' => 'Siap berangkat segera',
        ]);

        $res->assertStatus(201);
        $penawaranId = $res->json('data.id');

        // Posko menyetujui -> Misi otomatis diterbitkan dengan armada info
        $this->postJson("/api/penawaran/{$penawaranId}/approve", [
            'approved_volume' => '1000 Liter',
            'volume_angka' => 1000,
            'catatan' => 'Disetujui. Silakan salurkan langsung ke tandon posko.',
        ])->assertStatus(200);

        $misi = MisiPenyaluran::where('penawaran_id', $penawaranId)->first();
        $this->assertNotNull($misi);
        $this->assertStringContainsString('Truk Tangki', $misi->armada_info);
        $this->assertEquals('Diterima', $misi->status_tahapan);
    }

    /**
     * Skenario 7: Bantuan diterima sebagian; sistem tetap mencatat sisa kebutuhan.
     */
    public function test_skenario_7_penerimaan_sebagian_dan_sisa_kekurangan(): void
    {
        $case = KebutuhanWarga::create([
            'kode_kasus' => 'RK-BERAS-' . rand(1000, 9999),
            'posko_id' => $this->posko->id,
            'citizen_id' => $this->citizenUser->id,
            'nama_pelapor' => 'Warga RW 05',
            'kontak_pelapor' => '081200000001',
            'kategori_kebutuhan' => 'Beras & Sembako',
            'volume_permintaan' => '100 Karung',
            'jumlah_kk' => 40,
            'urgensi' => 'Tinggi',
            'status' => 'Dalam Verifikasi',
        ]);

        $this->postJson("/api/kebutuhan/{$case->id}/verify", [
            'action' => 'verify',
            'verifier_name' => 'Siti Rahma',
        ])->assertStatus(200);

        $bursa = BursaBantuan::where('kebutuhan_id', $case->id)->firstOrFail();

        $res = $this->postJson('/api/penawaran', [
            'bursa_id' => $bursa->id,
            'kebutuhan_id' => $case->id,
            'posko_id' => $this->posko->id,
            'organisasi' => 'Relawan Pangan Nusantara',
            'jenis_bantuan' => 'Beras',
            'jumlah_tawaran' => '50 Karung',
            'volume_angka' => 50,
            'satuan' => 'Karung',
            'metode_penyaluran' => 'serah_posko',
        ]);
        $penawaranId = $res->json('data.id');

        $this->postJson("/api/penawaran/{$penawaranId}/approve", [
            'approved_volume' => '50 Karung',
            'volume_angka' => 50,
            'catatan' => 'Tahap pertama 50 karung.',
        ])->assertStatus(200);

        $misi = MisiPenyaluran::where('penawaran_id', $penawaranId)->firstOrFail();

        // Konfirmasi penerimaan sebagian: hanya 35 karung yang diterima fisik
        $resKonfirmasi = $this->postJson("/api/misi/{$misi->id}/konfirmasi", [
            'volume_diterima' => '35 Karung',
            'volume_angka' => 35,
            'catatan' => '35 karung diterima kondisi baik, 15 karung rusak dalam perjalanan.',
            'konfirmasi_oleh' => 'Koordinator Logistik Siti Rahma',
        ]);

        $resKonfirmasi->assertStatus(200);

        $misi->refresh();
        $this->assertEquals('Selesai', $misi->status_tahapan);
        $this->assertEquals('35 Karung', $misi->volume_diterima);

        $case->refresh();
        $this->assertEquals('35 Karung', $case->total_diterima_resmi);
        // Sisa kebutuhan masih ada karena target 100 dan baru 35 yang diterima
        $this->assertEquals('Sebagian Terpenuhi', $case->status);
    }

    /**
     * Skenario 8: Semua tindakan tersimpan pada database dan tercermin pada riwayat aktivitas.
     */
    public function test_skenario_8_persistensi_log_aktivitas(): void
    {
        $case = KebutuhanWarga::create([
            'kode_kasus' => 'RK-LOG-' . rand(1000, 9999),
            'posko_id' => $this->posko->id,
            'citizen_id' => $this->citizenUser->id,
            'nama_pelapor' => 'Warga Test Log',
            'kontak_pelapor' => '081200000001',
            'kategori_kebutuhan' => 'Obat-obatan',
            'volume_permintaan' => '10 Kotak P3K',
            'jumlah_kk' => 10,
            'urgensi' => 'Sedang',
            'status' => 'Dalam Verifikasi',
        ]);

        // Klarifikasi
        $this->postJson("/api/kebutuhan/{$case->id}/verify", [
            'action' => 'clarify',
            'kategori_klarifikasi' => 'Kelengkapan Informasi & Lokasi',
            'pertanyaan' => 'Mohon rincikan jenis obat yang paling mendesak.',
            'verifier_name' => 'Siti Rahma',
        ]);

        // Jawab
        $this->postJson("/api/kebutuhan/{$case->id}/jawab-klarifikasi", [
            'citizen_id' => $this->citizenUser->id,
            'citizen_name' => $this->citizenUser->name,
            'jawaban' => 'Obat batuk anak, paracetamol, dan salep kulit.',
        ]);

        // Periksa log aktivitas
        $logs = LogAktivitas::where('kebutuhan_id', $case->id)->get();
        $this->assertGreaterThanOrEqual(2, $logs->count());

        $hasClarifyLog = $logs->contains(fn($l) => str_contains($l->aksi, 'Klarifikasi'));
        $this->assertTrue($hasClarifyLog);
    }

    /**
     * Skenario 9: Hak akses mencegah masyarakat atau mitra mengubah data yang bukan kewenangannya.
     */
    public function test_skenario_9_hak_akses_mencegah_penyalahgunaan(): void
    {
        // Laporan milik citizenUser (Andi)
        $case = KebutuhanWarga::create([
            'kode_kasus' => 'RK-AUTH-' . rand(1000, 9999),
            'posko_id' => $this->posko->id,
            'citizen_id' => $this->citizenUser->id,
            'nama_pelapor' => $this->citizenUser->name,
            'kontak_pelapor' => '081200000001',
            'kategori_kebutuhan' => 'Air Minum',
            'volume_permintaan' => '50 Dus',
            'jumlah_kk' => 10,
            'urgensi' => 'Sedang',
            'status' => 'Perlu Klarifikasi',
            'pertanyaan_klarifikasi' => 'Perjelas lokasi distribusi.',
        ]);

        // Warga B (Budi) mencoba menjawab klarifikasi milik Andi -> HARUS DITOLAK (403)
        $responseForbidden = $this->postJson("/api/kebutuhan/{$case->id}/jawab-klarifikasi", [
            'citizen_id' => $this->otherCitizenUser->id, // BUKAN PEMILIK
            'citizen_name' => $this->otherCitizenUser->name,
            'jawaban' => 'Saya mencoba memodifikasi laporan orang lain secara ilegal.',
        ]);

        $responseForbidden->assertStatus(403);
        $responseForbidden->assertJsonPath('success', false);
    }
}
