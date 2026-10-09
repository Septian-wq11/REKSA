<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\PoskoWilayah;
use App\Models\KebutuhanWarga;
use App\Models\BursaBantuan;
use App\Models\MisiPenyaluran;
use App\Models\LogAktivitas;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with 1 standard reference case.
     */
    public function run(): void
    {
        // 1. SEED 3 CORE DEMO USERS (1 PER ROLE)
        $citizen = User::create([
            'name' => 'Andi Pratama',
            'email' => 'andi.masyarakat@reksa.id',
            'phone' => '+62 812 4455 0188',
            'password' => Hash::make('password'),
            'role' => 'citizen',
            'organization' => 'Warga Terdampak RT 04 Sukamaju',
            'address' => 'RT 04 / RW 02, Desa Sukamaju, Kec. Cibadak',
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
            'organization' => 'Koordinator Posko Induk Balai Desa Sukamaju',
            'address' => 'Balai Desa Sukamaju, Kec. Cibadak',
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
            'organization' => 'Satgas Penyaluran BPBD Kab. Sukabumi',
            'address' => 'Pusdalops BPBD Kab. Sukabumi',
            'nik' => 'RSP-BPBD-9941',
            'is_verified' => true,
            'is_active' => true,
        ]);

        // 2. SEED 1 POSKO WILAYAH
        $posko1 = PoskoWilayah::create([
            'kode_posko' => 'PSK-01',
            'nama_posko' => 'Posko Induk 01 - Balai Desa Sukamaju',
            'penanggung_jawab_id' => $poskoOfficer->id,
            'penanggung_jawab_nama' => 'Siti Rahma',
            'telepon' => '+62 812 8899 1102',
            'desa' => 'Desa Sukamaju',
            'kecamatan' => 'Cibadak',
            'kabupaten' => 'Sukabumi',
            'provinsi' => 'Jawa Barat',
            'alamat_lengkap' => 'Jl. Raya Sukamaju No. 12, Balai Desa',
            'latitude' => -6.9174639,
            'longitude' => 106.9298281,
            'kapasitas_kk' => 150,
            'kk_terdata' => 87,
            'status_operasional' => 'Aktif',
        ]);

        // 3. SEED 1 KASUS KEBUTUHAN UTAMA
        $case1 = KebutuhanWarga::create([
            'kode_kasus' => 'RK-2026-00124',
            'citizen_id' => $citizen->id,
            'citizen_name' => 'Andi Pratama',
            'citizen_phone' => '+62 812 4455 0188',
            'posko_id' => $posko1->id,
            'kategori_kebutuhan' => 'Air Bersih',
            'volume_permintaan' => '1.000 L',
            'jumlah_kk' => 87,
            'status_hunian' => 'Rumah Warga Terdampak',
            'vulnerable_group' => true,
            'tingkat_urgensi' => 'Kritis',
            'priority_rationale' => 'Rekomendasi Sistem: KRITIS — 87 KK mengalami defisit air bersih > 6 jam pascabencana, terdapat 14 balita & lansia. Alokasi disetujui: 500 L (50%).',
            'status' => 'Sebagian Terpenuhi',
            'deskripsi' => 'Pipa utama PDAM terputus akibat longsor, 87 KK mengalami kekeringan air bersih sejak kemarin sore.',
            'catatan_verifikasi_posko' => 'Verifikasi posko selesai. Validasi lapangan sesuai, alokasi tahap 1 disetujui untuk BPBD.',
            'verified_by' => $poskoOfficer->id,
            'verified_at' => now()->subHours(3),
        ]);

        // 4. SEED 1 BURSA BANTUAN TERBUKA (Partial Fulfillment)
        $bursa1 = BursaBantuan::create([
            'kebutuhan_id' => $case1->id,
            'posko_id' => $posko1->id,
            'item_bantuan' => 'Air Bersih (1.000 L)',
            'target_volume' => '1.000 L',
            'volume_terpenuhi' => '500 L',
            'urgensi' => 'Kritis',
            'status' => 'Sebagian Terpenuhi',
            'claimed_by' => $responderBpbd->id,
            'claimed_org' => 'BPBD Kabupaten Sukabumi',
            'claimed_volume' => '500 L',
            'claimed_armada' => 'Truk Tangki No. 02 · Kapasitas 500 L',
            'published_at' => now()->subHours(3),
        ]);

        // 5. SEED 1 MISI PENYALURAN AKTIF
        MisiPenyaluran::create([
            'kode_misi' => 'MISI-ASG-001',
            'kebutuhan_id' => $case1->id,
            'bursa_id' => $bursa1->id,
            'posko_id' => $posko1->id,
            'responder_id' => $responderBpbd->id,
            'responder_name' => 'Arif Nugroho',
            'organisasi' => 'Satgas Penyaluran BPBD Kab. Sukabumi',
            'armada_info' => 'Truk Tangki No. 02 · Kapasitas 500 L Air Minum',
            'muatan' => '500 L Air Bersih',
            'status_tahapan' => 'Dalam Pengiriman',
            'estimasi_waktu' => '18 Menit (2,4 km)',
            'catatan_lapangan' => 'Armada telah berangkat dari Markas BPBD menuju Posko Induk 01 Balai Desa Sukamaju.',
        ]);

        // 6. SEED LOG AKTIVITAS KRONOLOGIS
        LogAktivitas::create([
            'kebutuhan_id' => $case1->id,
            'posko_id' => $posko1->id,
            'user_id' => $citizen->id,
            'user_name' => 'Andi Pratama',
            'aksi' => 'Laporan Dibuat',
            'deskripsi' => 'Laporan kebutuhan 1.000 L Air Bersih diajukan ke Posko Induk 01 Sukamaju.',
            'created_at' => now()->subHours(4),
        ]);

        LogAktivitas::create([
            'kebutuhan_id' => $case1->id,
            'posko_id' => $posko1->id,
            'user_id' => $poskoOfficer->id,
            'user_name' => 'Siti Rahma',
            'aksi' => 'Verifikasi Posko',
            'deskripsi' => 'Koordinator Posko memvalidasi data 87 KK dan merilis ke Bursa Bantuan Terbuka (Prioritas: Kritis).',
            'created_at' => now()->subHours(3),
        ]);

        LogAktivitas::create([
            'kebutuhan_id' => $case1->id,
            'posko_id' => $posko1->id,
            'user_id' => $responderBpbd->id,
            'user_name' => 'Arif Nugroho',
            'aksi' => 'Pengajuan Klaim',
            'deskripsi' => 'Satgas BPBD mengajukan klaim penyaluran 500 L Air Bersih dengan Truk Tangki No. 02.',
            'created_at' => now()->subHours(2),
        ]);

        LogAktivitas::create([
            'kebutuhan_id' => $case1->id,
            'posko_id' => $posko1->id,
            'user_id' => $poskoOfficer->id,
            'user_name' => 'Siti Rahma',
            'aksi' => 'Alokasi Disetujui',
            'deskripsi' => 'Koordinator Posko menyetujui alokasi 500 L untuk BPBD. Misi MISI-ASG-001 diterbitkan. Sisa kebutuhan: 500 L tetap terbuka di Bursa.',
            'created_at' => now()->subHours(1)->subMinutes(30),
        ]);

        LogAktivitas::create([
            'kebutuhan_id' => $case1->id,
            'posko_id' => $posko1->id,
            'user_id' => $responderBpbd->id,
            'user_name' => 'Arif Nugroho',
            'aksi' => 'Mulai Pengiriman',
            'deskripsi' => 'Truk Tangki No. 02 telah berangkat menuju titik serah terima Posko Induk 01 Balai Desa Sukamaju.',
            'created_at' => now()->subMinutes(25),
        ]);
    }
}
