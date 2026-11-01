import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// SESI SSO ONE UNUSU
// ==========================================
export interface SessionUser {
  id: number;
  username: string;
  nama: string;
  email: string | null;
  role: string;
  ssoRole: string;
  nim?: string | null;
  nidn?: string | null;
  prodi?: string | null;
  fakultas?: string | null;
}

const TOKEN_KEY = 'lppm_unusu_token';
const USER_KEY = 'lppm_unusu_user';

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const path = window.location.pathname;
    if (status === 401 && path !== import.meta.env.BASE_URL + 'login' && path !== import.meta.env.BASE_URL + 'sso/callback') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.replace(import.meta.env.BASE_URL + 'login');
    }
    return Promise.reject(error);
  }
);

export const ssoLogin = (client_id: string, token: string) =>
  api.post<{ success: boolean; token: string; user: SessionUser; message?: string }>('/auth/sso', { client_id, token });

export interface PenelitianItem {
  id: number;
  judul: string;
  ketua: string;
  nidn: string;
  anggota?: string | null;
  bidangFokus: string;
  danaDisetujui?: number | null;
  sumberDana: string;
  tahun: number;
  status: string;
  laporanUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PengabdianItem {
  id: number;
  judul: string;
  ketua: string;
  nidn: string;
  anggota?: string;
  mitra: string;
  lokasi: string;
  danaDisetujui?: number;
  tahun: number;
  status: string;
}

export interface PublikasiItem {
  id: number;
  judul: string;
  penulis: string;
  jenis: string;
  namaJurnal: string;
  volumeIssue?: string;
  tahun: number;
  doiUrl?: string;
  sintaScore?: string;
}

export const fetchPenelitian = () => api.get<{ success: boolean; data: PenelitianItem[] }>('/penelitian');
export const getPenelitian = (id: number | string) => api.get<{ success: boolean; data: PenelitianItem }>(`/penelitian/${id}`);
export const createPenelitian = (data: any) => api.post('/penelitian', data);
export const updatePenelitian = (id: number | string, data: any) => api.put(`/penelitian/${id}`, data);
export const deletePenelitian = (id: number | string) => api.delete(`/penelitian/${id}`);

export const fetchPengabdian = () => api.get<{ success: boolean; data: PengabdianItem[] }>('/pengabdian');
export const getPengabdian = (id: number | string) => api.get<{ success: boolean; data: PengabdianItem }>(`/pengabdian/${id}`);
export const createPengabdian = (data: any) => api.post('/pengabdian', data);
export const updatePengabdian = (id: number | string, data: any) => api.put(`/pengabdian/${id}`, data);
export const deletePengabdian = (id: number | string) => api.delete(`/pengabdian/${id}`);

export const fetchPublikasi = () => api.get<{ success: boolean; data: PublikasiItem[] }>('/publikasi');
export const getPublikasi = (id: number | string) => api.get<{ success: boolean; data: PublikasiItem }>(`/publikasi/${id}`);
export const createPublikasi = (data: any) => api.post('/publikasi', data);
export const updatePublikasi = (id: number | string, data: any) => api.put(`/publikasi/${id}`, data);
export const deletePublikasi = (id: number | string) => api.delete(`/publikasi/${id}`);

export interface RoleItem {
  id: number;
  kode: string;
  nama: string;
  deskripsi?: string | null;
  permissions?: {
    permissionId: number;
    permission: PermissionItem;
  }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PermissionItem {
  id: number;
  kode: string;
  nama: string;
  modul: string;
  deskripsi?: string | null;
  roles?: {
    roleId: number;
    role: { id: number; kode: string; nama: string };
  }[];
  createdAt?: string;
  updatedAt?: string;
}

export const fetchRoles = () => api.get<{ success: boolean; data: RoleItem[] }>('/roles');
export const createRole = (data: { kode: string; nama: string; deskripsi?: string; permissionIds?: number[] }) =>
  api.post<{ success: boolean; data: RoleItem; message?: string }>('/roles', data);
export const updateRole = (id: number | string, data: { nama: string; deskripsi?: string; permissionIds?: number[] }) =>
  api.put<{ success: boolean; data: RoleItem; message?: string }>(`/roles/${id}`, data);
export const deleteRole = (id: number | string) => api.delete<{ success: boolean; message?: string }>(`/roles/${id}`);

export const fetchPermissions = () => api.get<{ success: boolean; data: PermissionItem[] }>('/permissions');
export const createPermission = (data: { kode: string; nama: string; modul: string; deskripsi?: string }) =>
  api.post<{ success: boolean; data: PermissionItem; message?: string }>('/permissions', data);
export const updatePermission = (id: number | string, data: { nama: string; modul: string; deskripsi?: string }) =>
  api.put<{ success: boolean; data: PermissionItem; message?: string }>(`/permissions/${id}`, data);
export const deletePermission = (id: number | string) =>
  api.delete<{ success: boolean; message?: string }>(`/permissions/${id}`);

// ==========================================
// MONITORING & EVALUASI (MONEV) API
// ==========================================
export type JenisProgramMonev = 'PENELITIAN' | 'PENGABDIAN';
export type TahapMonev = 'MONEV_ANTARA' | 'MONEV_AKHIR' | 'MONEV_LAPANGAN';
export type StatusMonev = 'DIJADWALKAN' | 'SEDANG_DITELAAH' | 'PERLU_REVISI' | 'DISETUJUI' | 'DITOLAK';
export type RekomendasiMonev = 'LANJUT_PENUH' | 'LANJUT_BERSYARAT' | 'TUNDA' | 'HENTIKAN';

export interface MonevItem {
  id: number;
  kodeMonev: string;
  jenisProgram: JenisProgramMonev;
  tahap: TahapMonev;
  status: StatusMonev;
  rekomendasi?: RekomendasiMonev | null;
  penelitianId?: number | null;
  pengabdianId?: number | null;
  penelitian?: {
    id: number;
    judul: string;
    ketua: string;
    nidn: string;
    tahun: number;
  } | null;
  pengabdian?: {
    id: number;
    judul: string;
    ketua: string;
    nidn: string;
    mitra: string;
    tahun: number;
  } | null;
  namaReviewer: string;
  nidnReviewer?: string | null;
  tanggalJadwal: string;
  tanggalMonev?: string | null;
  lokasiMonev?: string | null;
  persentaseKemajuan: number;
  persentaseDanaTerpakai: number;
  skorSubstansi?: number | null;
  targetLuaranWajib?: string | null;
  capaianLuaran?: string | null;
  catatanReviewer?: string | null;
  tindakLanjut?: string | null;
  beritaAcaraUrl?: string | null;
  buktiDokumentasiUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MonevPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MonevResponse {
  success: boolean;
  data: MonevItem[];
  pagination: MonevPagination;
}

export const fetchMonev = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  jenisProgram?: string;
  tahap?: string;
  tahun?: number;
}) => api.get<MonevResponse>('/monev', { params });

export const getMonev = (id: number | string) =>
  api.get<{ success: boolean; data: MonevItem }>(`/monev/${id}`);

export const createMonev = (data: Partial<MonevItem>) =>
  api.post<{ success: boolean; data: MonevItem; message?: string }>('/monev', data);

export const updateMonev = (id: number | string, data: Partial<MonevItem>) =>
  api.put<{ success: boolean; data: MonevItem; message?: string }>(`/monev/${id}`, data);

export const deleteMonev = (id: number | string) =>
  api.delete<{ success: boolean; message?: string }>(`/monev/${id}`);

export default api;
