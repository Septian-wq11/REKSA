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
        Schema::create('bursa_bantuans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kebutuhan_id')->constrained('kebutuhan_wargas')->cascadeOnDelete();
            $table->foreignId('posko_id')->constrained('posko_wilayahs')->cascadeOnDelete();
            $table->string('item_bantuan'); // e.g. Air Bersih (1.000 L)
            $table->string('target_volume');
            $table->string('volume_terpenuhi')->default('0');
            $table->string('urgensi')->default('Kritis');
            $table->string('status')->default('Terbuka'); // Terbuka, Klaim Diajukan, Sebagian Terpenuhi, Teralokasi Penuh, Selesai
            $table->foreignId('claimed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('claimed_org')->nullable(); // BPBD, PMI, NGO
            $table->string('claimed_volume')->nullable(); // Volume yang diajukan mitra (e.g. 500 L)
            $table->string('claimed_armada')->nullable(); // Truk Tangki 02
            $table->text('claim_notes')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bursa_bantuans');
    }
};
