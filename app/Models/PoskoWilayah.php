<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PoskoWilayah extends Model
{
    use HasFactory;

    protected $table = 'posko_wilayahs';

    protected $fillable = [
        'kode_posko',
        'nama_posko',
        'penanggung_jawab_id',
        'penanggung_jawab_nama',
        'telepon',
        'desa',
        'kecamatan',
        'kabupaten',
        'provinsi',
        'alamat_lengkap',
        'latitude',
        'longitude',
        'kapasitas_kk',
        'kk_terdata',
        'status_operasional',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'kapasitas_kk' => 'integer',
        'kk_terdata' => 'integer',
    ];

    public function penanggungJawab(): BelongsTo
    {
        return $this->belongsTo(User::class, 'penanggung_jawab_id');
    }

    public function kebutuhanWarga(): HasMany
    {
        return $this->hasMany(KebutuhanWarga::class, 'posko_id');
    }

    public function bursaBantuan(): HasMany
    {
        return $this->hasMany(BursaBantuan::class, 'posko_id');
    }

    public function misiPenyaluran(): HasMany
    {
        return $this->hasMany(MisiPenyaluran::class, 'posko_id');
    }
}
