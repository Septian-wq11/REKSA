<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PoskoWilayah;
use App\Models\KebutuhanWarga;
use App\Models\BursaBantuan;
use App\Models\MisiPenyaluran;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PoskoController extends Controller
{
    public function index(): JsonResponse
    {
        $poskos = PoskoWilayah::withCount([
            'kebutuhanWarga',
            'bursaBantuan',
            'misiPenyaluran',
        ])->get();

        return response()->json([
            'success' => true,
            'data' => $poskos,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $posko = PoskoWilayah::with([
            'penanggungJawab',
            'kebutuhanWarga' => fn ($q) => $q->latest(),
            'bursaBantuan' => fn ($q) => $q->latest(),
            'misiPenyaluran' => fn ($q) => $q->latest(),
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $posko,
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $poskoId = $request->query('posko_id');

        $query = KebutuhanWarga::query();
        if ($poskoId) {
            $query->where('posko_id', $poskoId);
        }

        $laporanMasuk = (clone $query)->whereIn('status', ['Dalam Verifikasi', 'Diajukan'])->count();
        $kebutuhanTerbuka = (clone $query)->where('status', 'Kebutuhan Terbuka')->count();
        $disalurkanMitra = (clone $query)->whereIn('status', ['Ditugaskan', 'Dalam Pengiriman'])->count();
        $selesai = (clone $query)->where('status', 'Selesai')->count();

        $totalKkTerdampak = (clone $query)->sum('jumlah_kk');

        return response()->json([
            'success' => true,
            'data' => [
                'laporan_masuk_kk' => $laporanMasuk,
                'kebutuhan_terbuka' => $kebutuhanTerbuka,
                'disalurkan_mitra' => $disalurkanMitra,
                'selesai_diserahkan' => $selesai,
                'total_kk_terdampak' => $totalKkTerdampak,
            ],
        ]);
    }
}
