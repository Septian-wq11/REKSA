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
        Schema::create('kebutuhan_wargas', function (Blueprint $table) {
            $table->id();
            $table->string('kode_kasus')->unique(); // e.g. RK-2026-00124
            $table->foreignId('citizen_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('citizen_name');
            $table->string('citizen_phone')->nullable();
            $table->foreignId('posko_id')->constrained('posko_wilayahs')->cascadeOnDelete();
            $table->string('kategori_kebutuhan'); // Air Bersih, Makanan, Medis, etc.
            $table->string('volume_permintaan'); // e.g. 1.000 L, 360 Paket
            $table->integer('jumlah_kk')->default(1);
            $table->string('status_hunian')->default('Rumah Warga Terdampak'); // Rumah Warga Terdampak, Tenda Pengungsian Posko, Fasilitas Umum
            $table->boolean('vulnerable_group')->default(false); // Balita, lansia, disabilitas
            $table->string('tingkat_urgensi')->default('Tinggi'); // Kritis, Tinggi, Sedang
            $table->text('priority_rationale')->nullable(); // Rekomendasi sistem + alasan logis
            $table->string('status')->default('Dalam Verifikasi'); // Dalam Verifikasi, Kebutuhan Terbuka, Klaim Diajukan, Sebagian Terpenuhi, Teralokasi Penuh, Dalam Pengiriman, Menunggu Konfirmasi Penerimaan, Selesai
            $table->text('deskripsi')->nullable();
            $table->string('foto_bukti')->nullable();
            $table->text('catatan_verifikasi_posko')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kebutuhan_wargas');
    }
};
