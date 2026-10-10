<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\PoskoWilayah;
use App\Models\KebutuhanWarga;
use App\Models\BursaBantuan;
use App\Models\PenawaranMitra;
use App\Models\MisiPenyaluran;
use App\Models\LogAktivitas;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with a comprehensive, end-to-end operational pipeline.
     */
    public function run(): void
    {
        // Truncate with RESTART IDENTITY CASCADE for PostgreSQL so sequences reset cleanly
        DB::statement('TRUNCATE TABLE misi_penyalurans, penawaran_mitras, bursa_bantuans, log_aktivitas, kebutuhan_wargas, posko_wilayahs, users RESTART IDENTITY CASCADE;');

        // 1. SEED 4 CORE DEMO USERS (1 PER KEY ROLE/ORGANIZATION)
        $citizen = User::create([
            'name' => 'Andi Pratama',
            'email' => 'andi.masyarakat@reksa.id',
            'phone' => '+62 812 4455 0188',
            'password' => Hash::make('password'),
            'role' => 'citizen',
            'organization' => 'Warga Wilayah Surabaya (RT 03 / RW 05)',
            'address' => 'Jl. Raya Gubeng No. 18, Kec. Gubeng, Kota Surabaya',
            'nik' => '3202110482910002',
            'is_verified' => true,
            'is_active' => true,
        ]);

        $poskoOfficer = User::create([
            'name' => 'Siti Rahma',
            'email' => 'siti.posko@reksa.id',
            'phone' => '+62 812 8899 1102',
            'password' => Hash::make('password'),
            'role' => 'posko',
            'organization' => 'Posko BPBD Provinsi Jawa Timur (Komando Wilayah)',
            'address' => 'Gedung Serbaguna Posko Utama, Jl. Pemuda No. 1, Kota Surabaya',
            'nik' => 'PSK-SKB-2026-01',
            'is_verified' => true,
            'is_active' => true,
        ]);

        $responderBpbd = User::create([
            'name' => 'Arif Nugroho',
            'email' => 'arif.bpbd@reksa.id',
            'phone' => '+62 813 7722 9901',
            'password' => Hash::make('password'),
            'role' => 'responder',
            'organization' => 'Satgas Reaksi Cepat BPBD Wilayah',
            'address' => 'Markas Komando BPBD, Jl. Perintis Kemerdekaan No. 15',
            'nik' => 'RSP-BPBD-9941',
            'is_verified' => true,
            'is_active' => true,
        ]);

        $responderPmi = User::create([
            'name' => 'dr. Hendra Wijaya',
            'email' => 'hendra.pmi@reksa.id',
            'phone' => '+62 812 3344 5566',
            'password' => Hash::make('password'),
            'role' => 'responder',
            'organization' => 'Palang Merah Indonesia (PMI Cabang Jawa Timur)',
            'address' => 'Markas PMI Jawa Timur, Jl. Karang Menjangan No. 22, Surabaya',
            'nik' => 'RSP-PMI-8812',
            'is_verified' => true,
            'is_active' => true,
        ]);

        // 2. SEED 1 POSKO WILAYAH UTAMA
        $posko1 = PoskoWilayah::create([
            'kode_posko' => 'PSK-01',
            'nama_posko' => 'Posko BPBD Provinsi Jawa Timur (Komando Wilayah)',
            'penanggung_jawab_id' => $poskoOfficer->id,
            'penanggung_jawab_nama' => 'Siti Rahma',
            'telepon' => '+62 812 8899 1102',
            'desa' => 'Gubeng',
            'kecamatan' => 'Gubeng',
            'kabupaten' => 'Kota Surabaya',
            'provinsi' => 'Jawa Timur',
            'alamat_lengkap' => 'Jl. Pemuda No. 1, Kota Surabaya, Jawa Timur',
            'latitude' => -7.2654,
            'longitude' => 112.7521,
            'kapasitas_kk' => 250,
            'kk_terdata' => 124,
            'status_operasional' => 'Aktif',
        ]);

        // =========================================================================
        // CASE 1: AIR BERSIH (DALAM PENGIRIMAN - PARTIAL ALLOCATION WITH BURSA SHORTAGE)
        // =========================================================================
        $case1 = KebutuhanWarga::create([
            'kode_kasus' => 'RK-2026-00124',
            'citizen_id' => $citizen->id,
            'citizen_name' => 'Andi Pratama',
            'citizen_phone' => '+62 812 4455 0188',
            'posko_id' => $posko1->id,
            'kategori_kebutuhan' => 'Air Bersih',
            'volume_permintaan' => '1.000 Liter (L)',
            'jumlah_kk' => 87,
            'status_hunian' => 'Rumah Warga Terdampak',
            'vulnerable_group' => true,
            'tingkat_urgensi' => 'Kritis',
            'priority_rationale' => 'Rekomendasi Sistem: KRITIS — 87 KK mengalami defisit air bersih > 6 jam pascabencana, terdapat 14 balita & lansia. Alokasi tahap 1 disetujui: 500 L (50%). Sisa 500 L terbuka di bursa.',
            'status' => 'Dalam Pengiriman',
            'deskripsi' => 'Pipa utama PDAM terputus akibat longsor, 87 KK mengalami kekeringan air bersih sejak kemarin sore.',
            'catatan_verifikasi_posko' => 'Verifikasi posko selesai. Validasi lapangan sesuai, alokasi tahap 1 disetujui untuk Truk Tangki BPBD.',
            'verified_by' => $poskoOfficer->id,
            'verified_at' => now()->subHours(3),
            'desa' => 'Gubeng',
            'kecamatan' => 'Gubeng',
            'kabupaten' => 'Kota Surabaya',
            'provinsi' => 'Jawa Timur',
            'latitude' => -7.2654,
            'longitude' => 112.7521,
        ]);

        $bursa1 = BursaBantuan::create([
            'kebutuhan_id' => $case1->id,
            'posko_id' => $posko1->id,
            'item_bantuan' => 'Air Bersih (1.000 Liter (L))',
            'target_volume' => '1.000 Liter (L)',
            'volume_terpenuhi' => '500 Liter (L)',
            'urgensi' => 'Kritis',
            'status' => 'Sebagian Terpenuhi',
            'claimed_by' => $responderBpbd->id,
            'claimed_org' => 'Satgas Reaksi Cepat BPBD Wilayah',
            'claimed_volume' => '500 Liter (L)',
            'claimed_armada' => 'Truk Tangki No. 02 · Kapasitas 500 L Air Minum',
            'published_at' => now()->subHours(3),
        ]);

        $misi1 = MisiPenyaluran::create([
            'kode_misi' => 'MISI-ASG-001',
            'kebutuhan_id' => $case1->id,
            'bursa_id' => $bursa1->id,
            'posko_id' => $posko1->id,
            'responder_id' => $responderBpbd->id,
            'responder_name' => 'Arif Nugroho',
            'organisasi' => 'Satgas Reaksi Cepat BPBD Wilayah',
            'armada_info' => 'Truk Tangki No. 02 · Kapasitas 500 L Air Minum',
            'muatan' => '500 Liter (L)',
            'status_tahapan' => 'Dalam Perjalanan',
            'estimasi_waktu' => '18 Menit (2,4 km)',
            'catatan_lapangan' => 'Armada telah berangkat dari Markas Komando BPBD menuju titik distribusi Posko Induk Balai Warga Gubeng.',
        ]);

        // =========================================================================
        // CASE 2: PAKET PANGAN & SEMBAKO (KEBUTUHAN TERBUKA DI BURSA BANTUAN)
        // =========================================================================
        $case2 = KebutuhanWarga::create([
            'kode_kasus' => 'RK-2026-00125',
            'citizen_id' => $citizen->id,
            'citizen_name' => 'Andi Pratama',
            'citizen_phone' => '+62 812 4455 0188',
            'posko_id' => $posko1->id,
            'kategori_kebutuhan' => 'Pangan / Sembako',
            'volume_permintaan' => '50 Paket / Unit',
            'jumlah_kk' => 50,
            'status_hunian' => 'Tenda Pengungsian Darurat',
            'vulnerable_group' => true,
            'tingkat_urgensi' => 'Tinggi',
            'priority_rationale' => 'Rekomendasi Sistem: TINGGI — 50 KK membutuhkan suplai bahan makanan pokok untuk persediaan 3 hari ke depan.',
            'status' => 'Kebutuhan Terbuka',
            'deskripsi' => 'Stok beras dan makanan siap saji warga di pengungsian menipis. Membutuhkan paket sembako beras, mie instan, minyak, dan biskuit.',
            'catatan_verifikasi_posko' => 'Data tervalidasi oleh Koordinator Posko. Kebutuhan dirilis ke Bursa Bantuan Terbuka bagi mitra kemanusiaan.',
            'verified_by' => $poskoOfficer->id,
            'verified_at' => now()->subHours(2),
            'desa' => 'Gubeng',
            'kecamatan' => 'Gubeng',
            'kabupaten' => 'Kota Surabaya',
            'provinsi' => 'Jawa Timur',
            'latitude' => -7.2680,
            'longitude' => 112.7540,
        ]);

        $bursa2 = BursaBantuan::create([
            'kebutuhan_id' => $case2->id,
            'posko_id' => $posko1->id,
            'item_bantuan' => 'Pangan / Sembako (50 Paket / Unit)',
            'target_volume' => '50 Paket / Unit',
            'volume_terpenuhi' => '0 Paket / Unit',
            'urgensi' => 'Tinggi',
            'status' => 'Terbuka',
            'published_at' => now()->subHours(2),
        ]);

        // =========================================================================
        // CASE 3: TERPAL & TENDA DARURAT (DALAM VERIFIKASI - ANTREAN VALIDASI POSKO)
        // =========================================================================
        $case3 = KebutuhanWarga::create([
            'kode_kasus' => 'RK-2026-00126',
            'citizen_id' => $citizen->id,
            'citizen_name' => 'Andi Pratama',
            'citizen_phone' => '+62 812 4455 0188',
            'posko_id' => $posko1->id,
            'kategori_kebutuhan' => 'Tenda & Terpal Darurat',
            'volume_permintaan' => '15 Unit',
            'jumlah_kk' => 15,
            'status_hunian' => 'Rumah Rusak Sedang (Atap Runtuh)',
            'vulnerable_group' => false,
            'tingkat_urgensi' => 'Kritis',
            'priority_rationale' => 'Rekomendasi Sistem: KRITIS — 15 rumah mengalami kerusakan atap pasca angin kencang, membutuhkan terpal penutup darurat.',
            'status' => 'Dalam Verifikasi',
            'deskripsi' => 'Atap genteng 15 rumah warga terbawa angin kencang saat hujan deras tadi malam, perlu terpal penutup secepatnya.',
            'desa' => 'Gubeng',
            'kecamatan' => 'Gubeng',
            'kabupaten' => 'Kota Surabaya',
            'provinsi' => 'Jawa Timur',
            'latitude' => -7.2630,
            'longitude' => 112.7505,
        ]);

        // =========================================================================
        // CASE 4: HYGIENE KIT & OBAT (KLAIM MITRA DIAJUKAN - MENUNGGU PERSETUJUAN POSKO)
        // =========================================================================
        $case4 = KebutuhanWarga::create([
            'kode_kasus' => 'RK-2026-00127',
            'citizen_id' => $citizen->id,
            'citizen_name' => 'Andi Pratama',
            'citizen_phone' => '+62 812 4455 0188',
            'posko_id' => $posko1->id,
            'kategori_kebutuhan' => 'Obat & Hygiene Kit',
            'volume_permintaan' => '30 Paket / Unit',
            'jumlah_kk' => 30,
            'status_hunian' => 'Rumah Warga Terdampak',
            'vulnerable_group' => true,
            'tingkat_urgensi' => 'Tinggi',
            'priority_rationale' => 'Rekomendasi Sistem: TINGGI — Kebutuhan sabun antiseptik, pembalut, popok balita, dan obat kulit darurat.',
            'status' => 'Klaim Diajukan',
            'deskripsi' => 'Banyak anak balita dan lansia mengalami gatal-gatal dan butuh perlengkapan sanitasi dasar.',
            'catatan_verifikasi_posko' => 'Verifikasi selesai. Laporan telah diajukan komitmennya oleh Palang Merah Indonesia.',
            'verified_by' => $poskoOfficer->id,
            'verified_at' => now()->subHours(4),
            'desa' => 'Gubeng',
            'kecamatan' => 'Gubeng',
            'kabupaten' => 'Kota Surabaya',
            'provinsi' => 'Jawa Timur',
            'latitude' => -7.2665,
            'longitude' => 112.7535,
        ]);

        $bursa4 = BursaBantuan::create([
            'kebutuhan_id' => $case4->id,
            'posko_id' => $posko1->id,
            'item_bantuan' => 'Obat & Hygiene Kit (30 Paket / Unit)',
            'target_volume' => '30 Paket / Unit',
            'volume_terpenuhi' => '0 Paket / Unit',
            'urgensi' => 'Tinggi',
            'status' => 'Klaim Diajukan',
            'claimed_by' => $responderPmi->id,
            'claimed_org' => 'Palang Merah Indonesia (PMI Cabang Jawa Timur)',
            'claimed_volume' => '30 Paket / Unit',
            'claimed_armada' => 'Mobil Ambulans & Logistik PMI No. 04',
            'claim_notes' => 'Armada logistik PMI siaga di Markas Menjangan. Siap mendistribusikan 30 paket hygiene kit lengkap begitu alokasi disetujui.',
            'published_at' => now()->subHours(4),
        ]);

        $penawaran4 = PenawaranMitra::create([
            'kode_penawaran' => 'TWR-2026-001',
            'bursa_id' => $bursa4->id,
            'kebutuhan_id' => $case4->id,
            'posko_id' => $posko1->id,
            'mitra_id' => $responderPmi->id,
            'mitra_name' => 'dr. Hendra Wijaya',
            'organisasi' => 'Palang Merah Indonesia (PMI Cabang Jawa Timur)',
            'jenis_bantuan' => 'Obat & Hygiene Kit',
            'jumlah_tawaran' => '30 Paket / Unit',
            'volume_angka' => 30,
            'satuan' => 'Paket',
            'waktu_kesiapan' => 'Siap berangkat dalam 1 jam',
            'armada_info' => 'Mobil Ambulans & Logistik PMI No. 04',
            'status' => 'Diajukan',
            'catatan' => 'Siap mendistribusikan 30 paket hygiene kit dan pertolongan pertama pascabencana.',
            'created_at' => now()->subHours(1),
        ]);

        // =========================================================================
        // CASE 5: SANDANG & SELIMUT (MENUNGGU KONFIRMASI PENERIMAAN / BAST)
        // =========================================================================
        $case5 = KebutuhanWarga::create([
            'kode_kasus' => 'RK-2026-00128',
            'citizen_id' => $citizen->id,
            'citizen_name' => 'Andi Pratama',
            'citizen_phone' => '+62 812 4455 0188',
            'posko_id' => $posko1->id,
            'kategori_kebutuhan' => 'Sandang & Selimut Hangat',
            'volume_permintaan' => '20 Paket / Unit',
            'jumlah_kk' => 20,
            'status_hunian' => 'Tenda Pengungsian',
            'vulnerable_group' => true,
            'tingkat_urgensi' => 'Sedang',
            'priority_rationale' => 'Rekomendasi Sistem: SEDANG — Suplai selimut tebal dan pakaian kering untuk warga pengungsi malam hari.',
            'status' => 'Menunggu Konfirmasi Penerimaan',
            'deskripsi' => 'Pengungsi kedinginan di malam hari, membutuhkan selimut dan pakaian ganti layak pakai.',
            'catatan_verifikasi_posko' => 'Verifikasi selesai. Armada logistik telah tiba di titik serah terima posko.',
            'verified_by' => $poskoOfficer->id,
            'verified_at' => now()->subHours(5),
            'desa' => 'Gubeng',
            'kecamatan' => 'Gubeng',
            'kabupaten' => 'Kota Surabaya',
            'provinsi' => 'Jawa Timur',
            'latitude' => -7.2645,
            'longitude' => 112.7515,
        ]);

        $bursa5 = BursaBantuan::create([
            'kebutuhan_id' => $case5->id,
            'posko_id' => $posko1->id,
            'item_bantuan' => 'Sandang & Selimut Hangat (20 Paket / Unit)',
            'target_volume' => '20 Paket / Unit',
            'volume_terpenuhi' => '20 Paket / Unit',
            'urgensi' => 'Sedang',
            'status' => 'Teralokasi Penuh',
            'claimed_by' => $responderBpbd->id,
            'claimed_org' => 'Satgas Reaksi Cepat BPBD Wilayah',
            'claimed_volume' => '20 Paket / Unit',
            'claimed_armada' => 'Mobil Box Logistik No. 01 · Kapasitas 20 Paket',
            'published_at' => now()->subHours(5),
        ]);

        $misi5 = MisiPenyaluran::create([
            'kode_misi' => 'MISI-ASG-002',
            'kebutuhan_id' => $case5->id,
            'bursa_id' => $bursa5->id,
            'posko_id' => $posko1->id,
            'responder_id' => $responderBpbd->id,
            'responder_name' => 'Arif Nugroho',
            'organisasi' => 'Satgas Reaksi Cepat BPBD Wilayah',
            'armada_info' => 'Mobil Box Logistik No. 01 · Kapasitas 20 Paket',
            'muatan' => '20 Paket / Unit',
            'status_tahapan' => 'Tiba di Lokasi & Diserahkan',
            'estimasi_waktu' => 'Tiba di Posko',
            'catatan_lapangan' => 'Barang bantuan 20 paket selimut telah tiba di Posko Induk Gubeng dan diserahkan ke koordinator posko. Menunggu verifikasi fisik BAST.',
        ]);

        // =========================================================================
        // CASE 6: DAPUR UMUM & MAKANAN SIAP SAJI (SELESAI - 100% TUNTAS BERITA ACARA)
        // =========================================================================
        $case6 = KebutuhanWarga::create([
            'kode_kasus' => 'RK-2026-00129',
            'citizen_id' => $citizen->id,
            'citizen_name' => 'Andi Pratama',
            'citizen_phone' => '+62 812 4455 0188',
            'posko_id' => $posko1->id,
            'kategori_kebutuhan' => 'Dapur Umum & Makanan Siap Saji',
            'volume_permintaan' => '100 Porsi',
            'jumlah_kk' => 25,
            'status_hunian' => 'Balai Pertemuan Pengungsi',
            'vulnerable_group' => true,
            'tingkat_urgensi' => 'Kritis',
            'priority_rationale' => 'Rekomendasi Sistem: KRITIS — Suplai makanan siap saji makan siang darurat bagi 25 KK (100 jiwa). Telah diterima 100% tuntas.',
            'status' => 'Selesai',
            'total_alokasi_resmi' => '100 Porsi',
            'total_diterima_resmi' => '100 Porsi',
            'deskripsi' => 'Penyediaan 100 bungkus makanan siap santap higienis untuk warga terdampak pascabencana.',
            'catatan_verifikasi_posko' => 'Distribusi selesai tuntas. Berita Acara Serah Terima (BAST) telah diverifikasi sah.',
            'verified_by' => $poskoOfficer->id,
            'verified_at' => now()->subHours(8),
            'completed_at' => now()->subHours(1),
            'desa' => 'Gubeng',
            'kecamatan' => 'Gubeng',
            'kabupaten' => 'Kota Surabaya',
            'provinsi' => 'Jawa Timur',
            'latitude' => -7.2650,
            'longitude' => 112.7525,
        ]);

        $bursa6 = BursaBantuan::create([
            'kebutuhan_id' => $case6->id,
            'posko_id' => $posko1->id,
            'item_bantuan' => 'Dapur Umum & Makanan Siap Saji (100 Porsi)',
            'target_volume' => '100 Porsi',
            'volume_terpenuhi' => '100 Porsi',
            'urgensi' => 'Kritis',
            'status' => 'Selesai',
            'claimed_by' => $responderBpbd->id,
            'claimed_org' => 'Satgas Reaksi Cepat BPBD Wilayah',
            'claimed_volume' => '100 Porsi',
            'claimed_armada' => 'Mobil Pick Up Dapur Lapangan BPBD',
            'published_at' => now()->subHours(8),
        ]);

        $misi6 = MisiPenyaluran::create([
            'kode_misi' => 'MISI-ASG-003',
            'kebutuhan_id' => $case6->id,
            'bursa_id' => $bursa6->id,
            'posko_id' => $posko1->id,
            'responder_id' => $responderBpbd->id,
            'responder_name' => 'Arif Nugroho',
            'organisasi' => 'Satgas Reaksi Cepat BPBD Wilayah',
            'armada_info' => 'Mobil Pick Up Dapur Lapangan BPBD',
            'muatan' => '100 Porsi',
            'status_tahapan' => 'Selesai',
            'jumlah_diterima' => '100 Porsi',
            'selisih' => '0 Porsi',
            'estimasi_waktu' => 'Selesai',
            'catatan_lapangan' => '100 porsi makanan siap santap telah dibagikan langsung ke warga pengungsi. BAST ditandatangani.',
            'completed_at' => now()->subHours(1),
        ]);

        // LOG AKTIVITAS KRONOLOGIS UNTUK AUDIT TRAIL
        LogAktivitas::create([
            'kebutuhan_id' => $case1->id,
            'posko_id' => $posko1->id,
            'user_id' => $citizen->id,
            'user_name' => 'Andi Pratama',
            'aksi' => 'Laporan Dibuat',
            'deskripsi' => 'Laporan kebutuhan 1.000 L Air Bersih diajukan ke Posko BPBD.',
            'created_at' => now()->subHours(4),
        ]);

        LogAktivitas::create([
            'kebutuhan_id' => $case1->id,
            'posko_id' => $posko1->id,
            'user_id' => $poskoOfficer->id,
            'user_name' => 'Siti Rahma',
            'aksi' => 'Verifikasi Posko',
            'deskripsi' => 'Koordinator Posko memvalidasi 87 KK dan menyetujui alokasi tahap 1 sebesar 500 L.',
            'created_at' => now()->subHours(3),
        ]);

        LogAktivitas::create([
            'kebutuhan_id' => $case1->id,
            'posko_id' => $posko1->id,
            'user_id' => $responderBpbd->id,
            'user_name' => 'Arif Nugroho',
            'aksi' => 'Mulai Pengiriman',
            'deskripsi' => 'Truk Tangki No. 02 bergerak menuju Posko Induk Gubeng (500 L Air Bersih).',
            'created_at' => now()->subMinutes(25),
        ]);

        LogAktivitas::create([
            'kebutuhan_id' => $case4->id,
            'posko_id' => $posko1->id,
            'user_id' => $responderPmi->id,
            'user_name' => 'dr. Hendra Wijaya',
            'aksi' => 'Pengajuan Klaim Mitra',
            'deskripsi' => 'PMI Jawa Timur mengajukan klaim penyaluran 30 Paket Hygiene Kit & Obat.',
            'created_at' => now()->subHours(1),
        ]);

        LogAktivitas::create([
            'kebutuhan_id' => $case5->id,
            'posko_id' => $posko1->id,
            'user_id' => $responderBpbd->id,
            'user_name' => 'Arif Nugroho',
            'aksi' => 'Tiba di Lokasi',
            'deskripsi' => 'Armada Mobil Box Logistik tiba di Posko Induk Gubeng membawa 20 Paket Selimut.',
            'created_at' => now()->subMinutes(15),
        ]);

        LogAktivitas::create([
            'kebutuhan_id' => $case6->id,
            'posko_id' => $posko1->id,
            'user_id' => $poskoOfficer->id,
            'user_name' => 'Siti Rahma',
            'aksi' => 'Konfirmasi Penerimaan Tuntas (BAST)',
            'deskripsi' => '100 porsi makanan siap santap telah dikonfirmasi diterima tuntas warga. Kasus RK-2026-00129 resmi diselesaikan (RESOLVED).',
            'created_at' => now()->subHours(1),
        ]);
    }
}
