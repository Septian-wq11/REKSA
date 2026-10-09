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
        Schema::create('posko_wilayahs', function (Blueprint $table) {
            $table->id();
            $table->string('kode_posko')->unique(); // PSK-01, PSK-02
            $table->string('nama_posko');
            $table->foreignId('penanggung_jawab_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('penanggung_jawab_nama')->nullable();
            $table->string('telepon')->nullable();
            $table->string('desa');
            $table->string('kecamatan');
            $table->string('kabupaten')->default('Sukabumi');
            $table->string('provinsi')->default('Jawa Barat');
            $table->text('alamat_lengkap')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->integer('kapasitas_kk')->default(100);
            $table->integer('kk_terdata')->default(0);
            $table->string('status_operasional')->default('Aktif'); // Aktif, Siaga, Penuh, Ditutup
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posko_wilayahs');
    }
};
