<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BursaBantuan extends Model
{
    use HasFactory;

    protected $table = 'bursa_bantuans';

    protected $fillable = [
        'kebutuhan_id',
        'posko_id',
        'item_bantuan',
        'target_volume',
        'volume_terpenuhi',
        'urgensi',
        'status',
        'claimed_by',
        'claimed_org',
        'claimed_volume',
        'claimed_armada',
        'claim_notes',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function kebutuhan(): BelongsTo
    {
        return $this->belongsTo(KebutuhanWarga::class, 'kebutuhan_id');
    }

    public function posko(): BelongsTo
    {
        return $this->belongsTo(PoskoWilayah::class, 'posko_id');
    }

    public function claimedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'claimed_by');
    }

    public function misiPenyaluran(): HasMany
    {
        return $this->hasMany(MisiPenyaluran::class, 'bursa_id');
    }

    public function penawaran(): HasMany
    {
        return $this->hasMany(PenawaranMitra::class, 'bursa_id');
    }
}
