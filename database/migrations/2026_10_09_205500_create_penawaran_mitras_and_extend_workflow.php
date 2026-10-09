<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Tabel Penawaran Mitra
        Schema::create('penawaran_mitras', function (Blueprint $table) {
            $table->id();
            $table->string('kode_penawaran')->unique(); // e.g. TWR-2026-001
            $table->foreignId('bursa_id')->constrained('bursa_bantuans')->cascadeOnDelete();
            $table->foreignId('kebutuhan_id')->constrained('kebutuhan_wargas')->cascadeOnDelete();
            $table->foreignId('posko_id')->constrained('posko_wilayahs')->cascadeOnDelete();
            $table->foreignId('mitra_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('mitra_name');
            $table->string('organisasi'); // e.g. Satgas BPBD, PMI, ACT, dsb.
            $table->string('jenis_bantuan'); // e.g. Air Bersih, Makanan Siap Saji
            $table->string('jumlah_tawaran'); // e.g. "400 Paket", "500 L"
            $table->integer('volume_angka')->default(0);
            $table->string('satuan')->default('Unit');
            $table->string('waktu_kesiapan')->nullable(); // e.g. "Hari ini, siap berangkat dalam 2 jam"
            $table->string('armada_info')->nullable(); // e.g. "Truk Tangki No. 02 · Kapasitas 500 L"
            $table->text('catatan')->nullable();
            $table->string('status')->default('Diajukan'); // Diajukan, Disetujui, Ditolak, Dibatalkan
            $table->string('jumlah_disetujui')->nullable(); // e.g. "400 Paket"
            $table->integer('volume_disetujui_angka')->nullable();
            $table->text('alasan_penolakan')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });

        // 2. Extend Misi Penyaluran
        Schema::table('misi_penyalurans', function (Blueprint $table) {
            $table->foreignId('penawaran_id')->nullable()->after('bursa_id')->constrained('penawaran_mitras')->nullOnDelete();
            $table->string('jumlah_diterima')->nullable()->after('muatan'); // e.g. "480 L"
            $table->string('selisih')->nullable()->after('jumlah_diterima'); // e.g. "-20 L"
            $table->string('status_kendala')->nullable()->after('catatan_lapangan'); // e.g. "Jalur Longsor Terputus"
        });

        // 3. Extend Kebutuhan Warga
        Schema::table('kebutuhan_wargas', function (Blueprint $table) {
            $table->text('pertanyaan_klarifikasi')->nullable()->after('catatan_verifikasi_posko');
            $table->text('jawaban_klarifikasi')->nullable()->after('pertanyaan_klarifikasi');
            $table->string('alasan_penolakan')->nullable()->after('jawaban_klarifikasi');
            $table->string('total_alokasi_resmi')->default('0')->after('volume_permintaan');
            $table->string('total_diterima_resmi')->default('0')->after('total_alokasi_resmi');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kebutuhan_wargas', function (Blueprint $table) {
            $table->dropColumn(['pertanyaan_klarifikasi', 'jawaban_klarifikasi', 'alasan_penolakan', 'total_alokasi_resmi', 'total_diterima_resmi']);
        });

        Schema::table('misi_penyalurans', function (Blueprint $table) {
            $table->dropForeign(['penawaran_id']);
            $table->dropColumn(['penawaran_id', 'jumlah_diterima', 'selisih', 'status_kendala']);
        });

        Schema::dropIfExists('penawaran_mitras');
    }
};
