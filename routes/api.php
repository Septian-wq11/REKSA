<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PoskoController;
use App\Http\Controllers\Api\KebutuhanWargaController;
use App\Http\Controllers\Api\BursaBantuanController;
use App\Http\Controllers\Api\PenawaranMitraController;
use App\Http\Controllers\Api\MisiPenyaluranController;
use App\Http\Controllers\Api\ActivityLogController;

/*
|--------------------------------------------------------------------------
| REKSA RESTful API Routes
|--------------------------------------------------------------------------
*/

// Public Authentication
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Posko Wilayah & GIS Coordinates (for Leaflet OSM Map)
Route::get('/posko', [PoskoController::class, 'index']);
Route::get('/posko/stats', [PoskoController::class, 'stats']);
Route::get('/posko/{id}', [PoskoController::class, 'show']);

// Kebutuhan Warga (Cases & Lifecycle - Full CRUD)
Route::get('/kebutuhan', [KebutuhanWargaController::class, 'index']);
Route::post('/kebutuhan', [KebutuhanWargaController::class, 'store']);
Route::get('/kebutuhan/{id}', [KebutuhanWargaController::class, 'show']);
Route::put('/kebutuhan/{id}', [KebutuhanWargaController::class, 'update']);
Route::delete('/kebutuhan/{id}', [KebutuhanWargaController::class, 'destroy']);
Route::match(['patch', 'post'], '/kebutuhan/{id}/verify', [KebutuhanWargaController::class, 'verify']);
Route::post('/kebutuhan/{id}/jawab-klarifikasi', [KebutuhanWargaController::class, 'jawabKlarifikasi']);
Route::post('/kebutuhan/{id}/confirm-receipt', [KebutuhanWargaController::class, 'confirmReceipt']);

// Bursa Bantuan Terbuka (Open Needs Marketplace & Claims)
Route::get('/bursa', [BursaBantuanController::class, 'index']);
Route::post('/bursa/{id}/claim', [BursaBantuanController::class, 'claim']);
Route::post('/bursa/{id}/approve-claim', [BursaBantuanController::class, 'approveClaim']);
Route::post('/bursa/{id}/reject-claim', [BursaBantuanController::class, 'rejectClaim']);

// Penawaran Mitra & Alokasi (PRD Bab 5, 6, 7)
Route::get('/penawaran', [PenawaranMitraController::class, 'index']);
Route::post('/penawaran', [PenawaranMitraController::class, 'store']);
Route::post('/penawaran/{id}/approve', [PenawaranMitraController::class, 'approve']);
Route::post('/penawaran/{id}/reject', [PenawaranMitraController::class, 'reject']);

// Misi Penyaluran Lapangan (Responder Field Missions)
Route::get('/misi', [MisiPenyaluranController::class, 'index']);
Route::get('/misi/{id}', [MisiPenyaluranController::class, 'show']);
Route::match(['patch', 'post'], '/misi/{id}/step', [MisiPenyaluranController::class, 'advanceStep']);
Route::post('/misi/{id}/report-obstacle', [MisiPenyaluranController::class, 'reportObstacle']);

// Log Aktivitas Kronologis
Route::get('/activity-logs', [ActivityLogController::class, 'index']);

// Authenticated Sanctum Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
});
