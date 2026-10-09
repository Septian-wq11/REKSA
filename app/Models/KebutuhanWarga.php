<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KebutuhanWarga extends Model
{
    use HasFactory;

    protected $table = 'kebutuhan_wargas';

    protected $fillable = [
        'kode_kasus',
        'citizen_id',
        'citizen_name',
        'citizen_phone',
        'posko_id',
        'kategori_kebutuhan',
        'volume_permintaan',
        'jumlah_kk',
        'status_hunian',
        'vulnerable_group',
        'tingkat_urgensi',
        'priority_rationale',
        'status',
        'deskripsi',
        'foto_bukti',
        'catatan_verifikasi_posko',
        'pertanyaan_klarifikasi',
        'kategori_klarifikasi',
        'meminta_lampiran',
        'foto_klarifikasi',
        'riwayat_klarifikasi',
        'jawaban_klarifikasi',
        'alasan_penolakan',
        'tindak_lanjut_penolakan',
        'total_alokasi_resmi',
        'total_diterima_resmi',
        'verified_by',
        'verified_at',
        'completed_at',
        'desa',
        'kecamatan',
        'kabupaten',
        'provinsi',
        'latitude',
        'longitude',
    ];

    protected $casts = [
        'jumlah_kk' => 'integer',
        'meminta_lampiran' => 'boolean',
        'riwayat_klarifikasi' => 'array',
        'verified_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function citizen(): BelongsTo
    {
        return $this->belongsTo(User::class, 'citizen_id');
    }

    public function posko(): BelongsTo
    {
        return $this->belongsTo(PoskoWilayah::class, 'posko_id');
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function bursaBantuan(): HasOne
    {
        return $this->hasOne(BursaBantuan::class, 'kebutuhan_id');
    }

    public function misiPenyaluran(): HasMany
    {
        return $this->hasMany(MisiPenyaluran::class, 'kebutuhan_id');
    }

    public function penawaranMitra(): HasMany
    {
        return $this->hasMany(PenawaranMitra::class, 'kebutuhan_id');
    }

    public function logAktivitas(): HasMany
    {
        return $this->hasMany(LogAktivitas::class, 'kebutuhan_id');
    }
}
