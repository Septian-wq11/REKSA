<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogAktivitas extends Model
{
    use HasFactory;

    protected $table = 'log_aktivitas';

    protected $fillable = [
        'kebutuhan_id',
        'posko_id',
        'user_id',
        'user_name',
        'aksi',
        'deskripsi',
    ];

    public function kebutuhan(): BelongsTo
    {
        return $this->belongsTo(KebutuhanWarga::class, 'kebutuhan_id');
    }

    public function posko(): BelongsTo
    {
        return $this->belongsTo(PoskoWilayah::class, 'posko_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
