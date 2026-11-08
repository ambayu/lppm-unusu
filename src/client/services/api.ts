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
  /** Cakupan aplikasi penerbit sesi — harus "lppm" untuk panel ini. */
  app?: string;
  appName?: string;
  nim?: string | null;
  nidn?: string | null;
  prodi?: string | null;
  fakultas?: string | null;
  /** Kunci izin pengguna — dibaca server dari database pada setiap permintaan. */
  izin?: string[];
  /** Tingkat masuk tertinggi: "admin" | "dosen" | "reviewer" | "mahasiswa" | null. */
  tingkat?: string | null;
  appAccess?: AppAccessInfo;
}

/** Putusan akses dari server — sumber kebenaran untuk UI. */
export interface AppAccessInfo {
  app: string;
  appName: string;
  allowed: boolean;
  reason: 'allowed' | 'no_izin_masuk' | 'foreign_app_admin' | 'missing_role';
  ssoRole: string;
  tingkat: string | null;
  roleLabel: string;
  isAppAdmin: boolean;
  izin: string[];
  message: string;
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

/**
 * Rute publik yang boleh dibuka tanpa sesi.
 *
 * Interceptor TIDAK boleh "melempar" pengguna ke /login dari halaman-halaman
 * ini. Dulu pengecekan dilakukan dengan membandingkan `window.location.pathname`
 * terhadap string seperti `BASE_URL + 'login'`. Karena `BASE_URL` bernilai '/',
 * hasilnya `'/login'` — cocok. Tetapi begitu aplikasi di-build dengan base lain
 * (mis. '/lppm/'), nilai itu menjadi '/lppm/login' sementara pathname tetap
 * '/lppm/login' hanya bila base konsisten; lebih rapuh lagi, `path` bisa
 * berakhiran garis miring. Ketidakcocokan sekecil apa pun membuat halaman
 * publik seperti '/' ikut terlempar ke /login saat ada respons 401 dari
 * request lain di tab yang sama.
 *
 * Solusi: normalisasi pathname (buang BASE_URL, garis miring tepi, segmen
 * indeks) lalu cocokkan ke daftar rute publik yang eksplisit.
 */
const PUBLIC_PATHS = ['/', '/login', '/sso/callback', '/akses-ditolak'];

const isPublicPath = (pathname: string) => {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  let path = pathname;
  if (base && path.startsWith(base)) {
    path = path.slice(base.length);
  }
  path = path.replace(/\/+$/, '').replace(/\/index\.html$/, '');
  return PUBLIC_PATHS.includes(path || '/');
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const path = window.location.pathname;
    const code = error.response?.data?.code as string | undefined;

    // Sesi milik aplikasi lain (mis. admin LPM) tidak boleh dipakai di panel ini:
    // bersihkan sesi lalu tampilkan halaman 403 yang menjelaskan alasannya.
    if (status === 403 && (code === 'FOREIGN_APP_TOKEN' || code === 'FOREIGN_APP_ADMIN')) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      const base = import.meta.env.BASE_URL || '/';
      const deniedUrl = `${base}${base.endsWith('/') ? '' : '/'}akses-ditolak?reason=${
        code === 'FOREIGN_APP_ADMIN' ? 'foreign-app' : 'invalid-scope'
      }`;
      if (!path.endsWith('/akses-ditolak')) {
        window.location.replace(deniedUrl);
      }
      return Promise.reject(error);
    }

    if (status === 401 && !isPublicPath(path)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.replace(import.meta.env.BASE_URL + 'login');
    }
    return Promise.reject(error);
  }
);

export const ssoLogin = (client_id: string, token: string) =>
  api.post<{
    success: boolean;
    token: string;
    user: SessionUser;
    izin?: string[];
    appAccess?: AppAccessInfo;
    message?: string;
  }>('/auth/sso', { client_id, token });

export interface SessionScopeInfo {
  app: string;
  appName: string;
  role: string;
  ssoRole: string;
  /** @deprecated gunakan `bisa()` / `izin` — dipertahankan untuk klien lama. */
  isAdmin: boolean;
  /** @deprecated gunakan `bisa()` / `izin`. */
  canManageSystem: boolean;
  /** @deprecated berisi kunci izin yang sama dengan `izin`. */
  permissions: string[];
  /** Kunci izin efektif pengguna. */
  izin: string[];
  tingkat: string | null;
  appAccess: AppAccessInfo;
}

/** Validasi ulang sesi + cakupan aplikasi langsung ke server. */
export const fetchSession = () =>
  api.get<{ success: boolean; data: SessionUser & SessionScopeInfo }>('/auth/session');

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
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
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
// PENUGASAN PENGGUNA LOKAL LPPM (MULTI-ROLE)
// ==========================================
export interface UserRoleAssignment {
  username: string;
  nama: string;
  roles: { id: number; kode: string; nama: string }[];
  roleIds: number[];
  createdAt: string;
}

export const fetchUsers = () => api.get<{ success: boolean; data: UserRoleAssignment[] }>('/users');
export const createUserAssignment = (data: { username: string; nama: string; roleIds: number[] }) =>
  api.post<{ success: boolean; message: string; data: UserRoleAssignment }>('/users', data);
export const updateUserAssignment = (username: string, data: { nama?: string; roleIds: number[] }) =>
  api.put<{ success: boolean; message: string; data: UserRoleAssignment }>(`/users/${username}`, data);
export const deleteUserAssignment = (username: string) =>
  api.delete<{ success: boolean; message: string }>(`/users/${username}`);

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

// ==========================================
// DASHBOARD (agregasi laporan LPPM)
// ==========================================
export interface DashboardKelompok {
  label: string;
  value: number;
}

export interface DashboardTrenTahunan {
  tahun: number;
  penelitian: number;
  pengabdian: number;
  publikasi: number;
}

export interface DashboardRecentPenelitian {
  id: number;
  judul: string;
  ketua: string;
  bidangFokus: string;
  tahun: number;
  status: string;
  createdAt: string;
}

export interface DashboardRecentPublikasi {
  id: number;
  judul: string;
  penulis: string;
  jenis: string;
  namaJurnal: string;
  tahun: number;
  sintaScore?: string | null;
  createdAt: string;
}

export interface DashboardStatsData {
  diperbaruiPada: string;
  ringkasan: {
    totalPenelitian: number;
    totalPengabdian: number;
    totalPublikasi: number;
    totalMonev: number;
    totalKegiatan: number;
    danaDisetujui: number;
    monevJadwalMendatang: number;
    monevRataKemajuan: number;
    monevRataSerapanDana: number;
    monevDinilai: number;
  };
  statusPenelitian: DashboardKelompok[];
  bidangFokus: DashboardKelompok[];
  sumberDana: DashboardKelompok[];
  statusPengabdian: DashboardKelompok[];
  mitraPengabdian: DashboardKelompok[];
  jenisPublikasi: DashboardKelompok[];
  sintaPublikasi: DashboardKelompok[];
  trenTahunan: DashboardTrenTahunan[];
  statusMonev: DashboardKelompok[];
  recentPenelitian: DashboardRecentPenelitian[];
  recentPublikasi: DashboardRecentPublikasi[];
}

export const fetchDashboardStats = () =>
  api.get<{ success: boolean; data: DashboardStatsData }>('/dashboard/stats');

export default api;
