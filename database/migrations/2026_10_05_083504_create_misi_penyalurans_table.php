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
        Schema::create('misi_penyalurans', function (Blueprint $table) {
            $table->id();
            $table->string('kode_misi')->unique(); // MISI-ASG-001
            $table->foreignId('kebutuhan_id')->constrained('kebutuhan_wargas')->cascadeOnDelete();
            $table->foreignId('bursa_id')->nullable()->constrained('bursa_bantuans')->nullOnDelete();
            $table->foreignId('posko_id')->constrained('posko_wilayahs')->cascadeOnDelete();
            $table->foreignId('responder_id')->constrained('users')->cascadeOnDelete();
            $table->string('responder_name');
            $table->string('organisasi'); // BPBD Kabupaten, PMI, Relawan
            $table->string('armada_info'); // Truk Tangki No. 02 · Kapasitas 500 L
            $table->string('muatan'); // 500 L Air Bersih
            $table->string('status_tahapan')->default('Baru'); // Baru, Diterima, Disiapkan, Dalam Pengiriman, Tiba di Lokasi, Selesai
            $table->string('estimasi_waktu')->nullable();
            $table->text('catatan_lapangan')->nullable();
            $table->string('bukti_penyerahan')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('misi_penyalurans');
    }
};
