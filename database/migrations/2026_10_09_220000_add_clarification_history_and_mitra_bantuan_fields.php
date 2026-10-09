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
        // 1. Tambah kolom klarifikasi terstruktur dan tindak lanjut penolakan di kebutuhan_wargas
        Schema::table('kebutuhan_wargas', function (Blueprint $table) {
            $table->string('kategori_klarifikasi')->nullable()->after('pertanyaan_klarifikasi');
            $table->boolean('meminta_lampiran')->default(false)->after('kategori_klarifikasi');
            $table->longText('foto_klarifikasi')->nullable()->after('meminta_lampiran');
            $table->json('riwayat_klarifikasi')->nullable()->after('foto_klarifikasi');
            $table->text('tindak_lanjut_penolakan')->nullable()->after('alasan_penolakan');
        });

        // 2. Tambah kolom metode penyaluran dan komoditas di penawaran_mitras
        Schema::table('penawaran_mitras', function (Blueprint $table) {
            $table->string('metode_penyaluran')->default('serah_posko')->after('organisasi'); // serah_posko, mandiri, koordinasi
            $table->string('kategori_komoditas')->nullable()->after('jenis_bantuan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kebutuhan_wargas', function (Blueprint $table) {
            $table->dropColumn([
                'kategori_klarifikasi',
                'meminta_lampiran',
                'foto_klarifikasi',
                'riwayat_klarifikasi',
                'tindak_lanjut_penolakan',
            ]);
        });

        Schema::table('penawaran_mitras', function (Blueprint $table) {
            $table->dropColumn([
                'metode_penyaluran',
                'kategori_komoditas',
            ]);
        });
    }
};
