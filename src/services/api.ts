/**
 * REKSA API Client Service
 * Connects React Frontend with Laravel REST API + PostgreSQL Database
 */

const API_BASE_URL = '/api';

export interface PoskoItem {
  id: number;
  kode_posko: string;
  nama_posko: string;
  penanggung_jawab_nama?: string;
  telepon?: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  alamat_lengkap?: string;
  latitude: number;
  longitude: number;
  kapasitas_kk: number;
  kk_terdata: number;
  status_operasional: string;
}

export interface KebutuhanItem {
  id: number;
  kode_kasus: string;
  citizen_name: string;
  citizen_phone?: string;
  posko_id: number;
  kategori_kebutuhan: string;
  volume_permintaan: string;
  jumlah_kk: number;
  status_hunian: string;
  tingkat_urgensi: string;
  status: string;
  deskripsi?: string;
  catatan_verifikasi_posko?: string;
  desa?: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
  latitude?: number | string;
  longitude?: number | string;
  foto_bukti?: string;
  vulnerable_group?: boolean | number;
  priority_rationale?: string;
  posko?: PoskoItem;
  total_alokasi_resmi?: string;
  total_diterima_resmi?: string;
  pertanyaan_klarifikasi?: string;
  kategori_klarifikasi?: string;
  meminta_lampiran?: boolean;
  foto_klarifikasi?: string;
  riwayat_klarifikasi?: Array<{
    id: number;
    putaran: number;
    waktu_tanya: string;
    penanya: string;
    kategori: string;
    pertanyaan: string;
    meminta_lampiran: boolean;
    status: string;
    jawaban?: string | null;
    foto_tambahan?: string | null;
    waktu_jawab?: string | null;
  }>;
  jawaban_klarifikasi?: string;
  alasan_penolakan?: string;
  tindak_lanjut_penolakan?: string;
  created_at: string;
  updated_at?: string;
  verified_at?: string;
  completed_at?: string;
}

export interface PenawaranItem {
  id: number;
  kode_penawaran: string;
  bursa_id: number;
  kebutuhan_id: number;
  posko_id: number;
  mitra_id?: number;
  mitra_name: string;
  organisasi: string;
  metode_penyaluran?: 'mandiri' | 'serah_posko' | 'koordinasi';
  kategori_komoditas?: string;
  jenis_bantuan: string;
  jumlah_tawaran: string;
  volume_angka: number;
  satuan: string;
  waktu_kesiapan?: string;
  armada_info?: string;
  catatan?: string;
  status: 'Diajukan' | 'Disetujui' | 'Ditolak' | 'Dibatalkan';
  jumlah_disetujui?: string;
  volume_disetujui_angka?: number;
  alasan_penolakan?: string;
  approved_by?: number;
  reviewed_at?: string;
  created_at: string;
  posko?: PoskoItem;
  kebutuhan?: KebutuhanItem;
  bursa?: BursaItem;
  misi?: MisiItem;
}

export interface BursaItem {
  id: number;
  kebutuhan_id: number;
  posko_id: number;
  item_bantuan: string;
  target_volume: string;
  volume_terpenuhi: string;
  urgensi: string;
  status: string;
  claimed_by?: number;
  claimed_org?: string;
  claimed_volume?: string;
  claimed_armada?: string;
  claim_notes?: string;
  claimedBy?: { id: number; name: string; organization?: string };
  penawaran?: PenawaranItem[];
  posko?: PoskoItem;
  kebutuhan?: KebutuhanItem;
  published_at?: string;
}

export interface MisiItem {
  id: number;
  kode_misi: string;
  kebutuhan_id: number;
  bursa_id?: number;
  penawaran_id?: number;
  posko_id: number;
  responder_name: string;
  organisasi: string;
  armada_info: string;
  muatan: string;
  jumlah_diterima?: string;
  selisih?: string;
  status_tahapan: string;
  estimasi_waktu?: string;
  catatan_lapangan?: string;
  status_kendala?: string;
  posko?: PoskoItem;
  kebutuhan?: KebutuhanItem;
  penawaran?: PenawaranItem;
}

export interface ActivityLogItem {
  id: number;
  kebutuhan_id?: number;
  posko_id?: number;
  user_name?: string;
  aksi: string;
  deskripsi: string;
  created_at: string;
  kebutuhan?: KebutuhanItem;
}

// HTTP Helper with fallback to mock data if offline
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('reksa_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Terjadi kesalahan pada server' }));
    throw new Error(errorData.message || `HTTP Error ${response.status}`);
  }

  return response.json();
}

export const apiService = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    fetchApi<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (data: any) =>
    fetchApi<{ success: boolean; token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Posko
  getPoskos: () => fetchApi<{ success: boolean; data: PoskoItem[] }>('/posko'),
  getPoskoStats: (poskoId?: number) =>
    fetchApi<{ success: boolean; data: { laporan_masuk_kk: number; kebutuhan_terbuka: number; disalurkan_mitra: number; selesai_diserahkan: number; total_kk_terdampak: number } }>(
      `/posko/stats${poskoId ? `?posko_id=${poskoId}` : ''}`
    ),

  // Kebutuhan Warga
  getKebutuhan: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi<{ success: boolean; data: KebutuhanItem[] }>(`/kebutuhan${query ? `?${query}` : ''}`);
  },

  createKebutuhan: (payload: {
    citizen_name: string;
    citizen_phone?: string;
    posko_id?: number;
    posko_name?: string;
    kategori_kebutuhan: string;
    volume_permintaan: string;
    jumlah_kk: number;
    status_hunian: string;
    tingkat_urgensi: string;
    deskripsi?: string;
    foto_bukti?: string;
    desa?: string;
    kecamatan?: string;
    kabupaten?: string;
    provinsi?: string;
    status?: string;
    latitude?: number;
    longitude?: number;
  }) =>
    fetchApi<{ success: boolean; message: string; data: KebutuhanItem }>('/kebutuhan', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateKebutuhan: (id: number | string, payload: Partial<KebutuhanItem>) =>
    fetchApi<{ success: boolean; message: string; data: KebutuhanItem }>(`/kebutuhan/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteKebutuhan: (id: number | string) =>
    fetchApi<{ success: boolean; message: string }>(`/kebutuhan/${id}`, {
      method: 'DELETE',
    }),

  verifyKebutuhan: (
    id: number | string,
    payload: {
      action: 'verify_and_publish' | 'reject' | 'clarify' | 'review_further';
      catatan?: string;
      pertanyaan?: string;
      kategori_klarifikasi?: string;
      meminta_lampiran?: boolean;
      alasan?: string;
      tindak_lanjut?: string;
      priority?: string;
    }
  ) =>
    fetchApi<{ success: boolean; message: string; data: KebutuhanItem }>(`/kebutuhan/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  jawabKlarifikasi: (
    id: number | string,
    payload: {
      jawaban: string;
      foto_klarifikasi?: string;
      jumlah_kk?: number;
      volume_permintaan?: string;
      deskripsi?: string;
      citizen_name?: string;
    }
  ) =>
    fetchApi<{ success: boolean; message: string; data: KebutuhanItem }>(`/kebutuhan/${id}/jawab-klarifikasi`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Bursa Bantuan Terbuka
  getBursa: () => fetchApi<{ success: boolean; data: BursaItem[] }>('/bursa'),

  claimBursa: (id: number, payload: { claimed_volume?: string; armada_info?: string; muatan?: string; organisasi?: string; catatan?: string } = {}) =>
    fetchApi<{ success: boolean; message: string; data: BursaItem }>(`/bursa/${id}/claim`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  approveClaimBursa: (id: number, payload: { approved_volume?: string; catatan?: string } = {}) =>
    fetchApi<{ success: boolean; message: string; data: { bursa: BursaItem; misi: MisiItem } }>(`/bursa/${id}/approve-claim`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  rejectClaimBursa: (id: number, payload: { alasan?: string } = {}) =>
    fetchApi<{ success: boolean; message: string; data: BursaItem }>(`/bursa/${id}/reject-claim`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Penawaran Mitra & Alokasi (PRD Bab 5, 6, 7)
  getPenawaran: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi<{ success: boolean; data: PenawaranItem[] }>(`/penawaran${query ? `?${query}` : ''}`);
  },

  createPenawaran: (payload: {
    bursa_id: number;
    jumlah_tawaran: string;
    volume_angka?: number;
    satuan?: string;
    metode_penyaluran?: 'mandiri' | 'serah_posko' | 'koordinasi';
    kategori_komoditas?: string;
    waktu_kesiapan?: string;
    armada_info?: string;
    organisasi?: string;
    catatan?: string;
  }) =>
    fetchApi<{ success: boolean; message: string; data: PenawaranItem }>('/penawaran', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  approvePenawaran: (id: number, payload: { approved_volume?: string; volume_angka?: number; catatan?: string } = {}) =>
    fetchApi<{ success: boolean; message: string; data: { penawaran: PenawaranItem; misi: MisiItem; kekurangan_alokasi: number; status_kebutuhan: string } }>(
      `/penawaran/${id}/approve`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  rejectPenawaran: (id: number, payload: { alasan_penolakan: string }) =>
    fetchApi<{ success: boolean; message: string; data: PenawaranItem }>(`/penawaran/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  confirmReceiptKebutuhan: (id: number | string, payload: { diterima_volume?: string; catatan?: string } = {}) =>
    fetchApi<{ success: boolean; message: string; data: KebutuhanItem; is_fully_fulfilled?: boolean; kekurangan_penerimaan?: number }>(
      `/kebutuhan/${id}/confirm-receipt`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  // Misi Penyaluran
  getMisi: () => fetchApi<{ success: boolean; data: MisiItem[] }>('/misi'),

  advanceMisiStep: (id: number) =>
    fetchApi<{ success: boolean; message: string; data: MisiItem }>(`/misi/${id}/step`, {
      method: 'PATCH',
    }),

  reportObstacleMisi: (id: number, payload: { status_kendala: string; catatan_lapangan: string }) =>
    fetchApi<{ success: boolean; message: string; data: MisiItem }>(`/misi/${id}/report-obstacle`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Activity Logs
  getActivityLogs: () => fetchApi<{ success: boolean; data: ActivityLogItem[] }>('/activity-logs'),
};
