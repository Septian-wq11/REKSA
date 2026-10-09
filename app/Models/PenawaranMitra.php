<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PenawaranMitra extends Model
{
    use HasFactory;

    protected $table = 'penawaran_mitras';

    protected $fillable = [
        'kode_penawaran',
        'bursa_id',
        'kebutuhan_id',
        'posko_id',
        'mitra_id',
        'mitra_name',
        'organisasi',
        'metode_penyaluran',
        'jenis_bantuan',
        'kategori_komoditas',
        'jumlah_tawaran',
        'volume_angka',
        'satuan',
        'waktu_kesiapan',
        'armada_info',
        'catatan',
        'status',
        'jumlah_disetujui',
        'volume_disetujui_angka',
        'alasan_penolakan',
        'approved_by',
        'reviewed_at',
    ];

    protected $casts = [
        'volume_angka' => 'integer',
        'volume_disetujui_angka' => 'integer',
        'reviewed_at' => 'datetime',
    ];

    public function bursa(): BelongsTo
    {
        return $this->belongsTo(BursaBantuan::class, 'bursa_id');
    }

    public function kebutuhan(): BelongsTo
    {
        return $this->belongsTo(KebutuhanWarga::class, 'kebutuhan_id');
    }

    public function posko(): BelongsTo
    {
        return $this->belongsTo(PoskoWilayah::class, 'posko_id');
    }

    public function mitra(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mitra_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function misi(): HasOne
    {
        return $this->hasOne(MisiPenyaluran::class, 'penawaran_id');
    }
}
