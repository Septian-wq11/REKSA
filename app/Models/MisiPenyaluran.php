<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MisiPenyaluran extends Model
{
    use HasFactory;

    protected $table = 'misi_penyalurans';

    protected $fillable = [
        'kode_misi',
        'kebutuhan_id',
        'bursa_id',
        'penawaran_id',
        'posko_id',
        'responder_id',
        'responder_name',
        'organisasi',
        'armada_info',
        'muatan',
        'jumlah_diterima',
        'selisih',
        'status_tahapan',
        'estimasi_waktu',
        'catatan_lapangan',
        'status_kendala',
        'bukti_penyerahan',
        'completed_at',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    public function kebutuhan(): BelongsTo
    {
        return $this->belongsTo(KebutuhanWarga::class, 'kebutuhan_id');
    }

    public function bursa(): BelongsTo
    {
        return $this->belongsTo(BursaBantuan::class, 'bursa_id');
    }

    public function penawaran(): BelongsTo
    {
        return $this->belongsTo(PenawaranMitra::class, 'penawaran_id');
    }

    public function posko(): BelongsTo
    {
        return $this->belongsTo(PoskoWilayah::class, 'posko_id');
    }

    public function responder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responder_id');
    }
}
