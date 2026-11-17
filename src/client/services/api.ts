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
  reason: 'allowed' | 'not_registered' | 'inactive_account' | 'no_role' | 'superadmin_bypass';
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

    // Keanggotaan di luar cakupan aplikasi (belum terdaftar / nonaktif / tanpa
    // peran): sesi lokal dibersihkan agar tidak ada sisa kredensial di peramban.
    if (
      status === 403 &&
      (code === 'FOREIGN_APP_TOKEN' ||
        code === 'NOT_REGISTERED' ||
        code === 'INACTIVE' ||
        code === 'NO_ROLE')
    ) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      const base = import.meta.env.BASE_URL || '/';
      const alasan =
        code === 'NOT_REGISTERED'
          ? 'not-registered'
          : code === 'INACTIVE'
            ? 'inactive-account'
            : code === 'NO_ROLE'
              ? 'no-role'
              : 'invalid-scope';
      const deniedUrl = `${base}${base.endsWith('/') ? '' : '/'}akses-ditolak?reason=${alasan}`;
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

export const ssoLogin = (token: string) =>
  api.post<{
    success: boolean;
    token: string;
    user: SessionUser;
    izin?: string[];
    appAccess?: AppAccessInfo;
    message?: string;
  }>('/auth/sso', { token });

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

/**
 * Periksa status sesi terpusat di Identity Provider (ONE UNUSU).
 * - authenticated: true -> sesi ONE UNUSU aktif.
 * - authenticated: false -> pengguna telah logout dari ONE UNUSU.
 * - authenticated: null -> gagal menghubungi server SSO (offline/network error).
 *
 * Alamat memakai jalur relatif `/api` agar diteruskan server aplikasi ini
 * sendiri (lihat `GET /api/sso/session-check` di src/server/index.ts).
 * Sebelumnya di sini tertulis `http://localhost:5000/api`, yaitu alamat
 * komputer pengunjung — pemeriksaan selalu gagal di produksi sehingga
 * pengguna terlempar ke halaman masuk.
 */
export const checkOneUnusuSession = async () => {
  const ssoApiUrl = import.meta.env.VITE_SSO_API_URL || '/api';
  try {
    const res = await axios.get<{
      status: boolean;
      authenticated: boolean;
      user?: { username: string; nama: string; role: string };
      message?: string;
    }>(`${ssoApiUrl}/sso/session-check`, {
      withCredentials: true,
      timeout: 3500,
    });
    return res.data;
  } catch (err: any) {
    return {
      status: false,
      authenticated: null,
      message: err.message,
    };
  }
};

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
// PENGGUNA LPPM (DARI DIREKTORI ONE UNUSU)
// ==========================================
export interface PenggunaLppm {
  id: number;
  userId: number;
  username: string;
  nama: string;
  email: string | null;
  ssoRole: string | null;
  status: string;
  role: string | null;
  peran: string[];
  createdAt?: string;
}

/** Pengguna ONE UNUSU yang bisa dipilih pada tabel tambah pengguna. */
export interface KandidatPenggunaOne {
  id: number;
  username: string;
  nama: string;
  email: string | null;
  noHp?: string | null;
  nim?: string | null;
  nidn?: string | null;
  nip?: string | null;
  fakultas?: string | null;
  prodi?: string | null;
  jenisKelamin?: string | null;
  avatar?: string | null;
  isActive?: boolean;
  role?: string | null;
  roles?: string[];
  sudahTerdaftar: boolean;
}

export const fetchUsers = () => api.get<{ success: boolean; data: PenggunaLppm[] }>('/users');

export interface KriteriaKandidat {
  search?: string;
  role?: string;
  fakultas?: string;
  prodi?: string;
}

export const cariKandidatPengguna = (kriteria: KriteriaKandidat | string = {}) => {
  const params: Record<string, string> = {};
  if (typeof kriteria === 'string') {
    if (kriteria) params.search = kriteria;
  } else {
    if (kriteria.search) params.search = kriteria.search;
    if (kriteria.role) params.role = kriteria.role;
    if (kriteria.fakultas) params.fakultas = kriteria.fakultas;
    if (kriteria.prodi) params.prodi = kriteria.prodi;
  }

  return api.get<{
    success: boolean;
    data: KandidatPenggunaOne[];
    meta: { total: number; search: string; role: string; fakultas: string; prodi: string };
  }>('/users/kandidat', { params });
};

/**
 * Mendaftarkan pengguna ONE UNUSU ke LPPM.
 *
 * `peran` bersifat opsional: pengguna didaftarkan lebih dulu tanpa peran, lalu
 * peran diatur satu per satu lewat modal "Atur Peran" pada daftar pengguna.
 */
export const createUserAssignment = (data: {
  userIds: number[];
  peran?: string[];
  kandidat?: Array<{ id: number; nama?: string; username?: string }>;
}) => api.post<{ success: boolean; message: string; data: PenggunaLppm[] }>('/users', data);

export const updateUserAssignment = (
  id: number | string,
  data: { peran?: string[]; status?: string }
) => api.put<{ success: boolean; message: string }>(`/users/${id}`, data);

export const deleteUserAssignment = (id: number | string) =>
  api.delete<{ success: boolean; message: string }>(`/users/${id}`);

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

// ==========================================
// BANNER SLIDER HERO (`/api/sliders`, `/api/admin/sliders`)
// ==========================================
export interface LppmBannerSliderItem {
  id: number;
  judul: string;
  subjudul?: string | null;
  gambarUrl: string;
  gambarMobileUrl?: string | null;
  linkUrl?: string | null;
  urutan: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const fetchPublicSliders = () =>
  api.get<{ success: boolean; data: LppmBannerSliderItem[] }>('/sliders');

export const fetchAdminSliders = () =>
  api.get<{ success: boolean; data: LppmBannerSliderItem[] }>('/admin/sliders');

export interface SliderKiriman {
  judul?: string;
  subjudul?: string | null;
  linkUrl?: string | null;
  urutan?: number;
  active?: boolean;
  /** Berkas gambar atau video baru pengganti media lama. */
  berkas?: File | null;
}

/**
 * Media slider dikirim sebagai multipart/form-data, bukan JSON base64.
 *
 * Content-Type sengaja dihapus agar peramban menuliskannya sendiri lengkap
 * dengan boundary; tanpa itu multer menolak body dan berkas tidak terbaca.
 * Berkas hanya disertakan bila benar-benar ada, sehingga penyuntingan teks
 * saja tidak mengirim field kosong yang dianggap galat oleh server.
 */
const buatFormSlider = ({ berkas, ...teks }: SliderKiriman): FormData => {
  const form = new FormData();
  Object.entries(teks).forEach(([kunci, nilai]) => {
    if (nilai !== undefined && nilai !== null) form.append(kunci, String(nilai));
  });
  if (berkas) form.append("berkas", berkas);
  return form;
};

const KONFIG_MULTIPART = { headers: { "Content-Type": undefined } };

export const createAdminSlider = (data: SliderKiriman) =>
  api.post<{ success: boolean; message: string; data: LppmBannerSliderItem }>(
    "/admin/sliders",
    buatFormSlider(data),
    KONFIG_MULTIPART,
  );

export const updateAdminSlider = (id: number, data: SliderKiriman) =>
  api.put<{ success: boolean; message: string; data: LppmBannerSliderItem }>(
    "/admin/sliders/" + id,
    buatFormSlider(data),
    KONFIG_MULTIPART,
  );

export const deleteAdminSlider = (id: number) =>
  api.delete<{ success: boolean; message: string }>(`/admin/sliders/${id}`);

// ==========================================
// DOKUMEN & KATEGORI (MODUL TERBARU)
// ==========================================

export interface KategoriItem {
  id: number;
  nama: string;
  deskripsi?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProdiOption {
  id: number;
  code: string;
  name: string;
  degree?: string;
  facultyName?: string;
}

export interface DokumenRecord {
  id: number;
  judul: string;
  nomor?: string | null;
  kategoriId: number;
  kategori?: KategoriItem;
  tahun: number;
  tanggalDokumen?: string | null;
  tanggalMulaiBerlaku?: string | null;
  tanggalBerakhir?: string | null;
  keterangan?: string | null;
  filePdfUrl?: string | null;
  fileSize?: number | null;
  status: string;
  tujuanPublish?: 'lppm' | 'prodi' | string;
  prodiCode?: string | null;
  prodiName?: string | null;
  createdBy?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export const fetchProdiList = () =>
  api.get<{ success: boolean; data: ProdiOption[] }>('/prodi');

export const fetchKategori = () =>
  api.get<{ success: boolean; data: KategoriItem[] }>('/kategori');

export const fetchKategoriDetail = (id: number | string) =>
  api.get<{ success: boolean; data: KategoriItem }>(`/kategori/${id}`);

export const createKategori = (data: { nama: string; deskripsi?: string | null }) =>
  api.post<{ success: boolean; data: KategoriItem; message: string }>('/kategori', data);

export const updateKategori = (id: number | string, data: { nama?: string; deskripsi?: string | null }) =>
  api.put<{ success: boolean; data: KategoriItem; message: string }>(`/kategori/${id}`, data);

export const deleteKategori = (id: number | string) =>
  api.delete<{ success: boolean; message: string }>(`/kategori/${id}`);

export const fetchDokumen = (params?: { search?: string; status?: string; tahun?: number; skip?: number; take?: number }) =>
  api.get<{ success: boolean; data: DokumenRecord[]; meta: { total: number; skip: number; take: number; pages: number } }>('/dokumen', { params });

export const fetchDokumenDetail = (id: number | string) =>
  api.get<{ success: boolean; data: DokumenRecord }>(`/dokumen/${id}`);

export const createDokumen = (data: Partial<DokumenRecord>) =>
  api.post<{ success: boolean; data: DokumenRecord; message: string }>('/dokumen', data);

/**
 * Mengunggah berkas PDF dokumen ke penyimpanan arsip.
 *
 * Body dikirim sebagai JSON `{ nama, data }` dengan `data` berupa base64.
 * Base64 hanya dipakai sebagai alat transportasi sekali jalan — server
 * menyimpannya sebagai berkas dan mengembalikan URL bertanda tangan yang
 * kemudian diisi ke kolom `filePdfUrl`. Jadi tidak ada lagi PDF base64 yang
 * tersimpan di database.
 */
export const uploadBerkasDokumen = async (file: File) => {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Peramban gagal membaca isi berkas PDF.'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  // Buang awalan `data:application/pdf;base64,` — hanya isi base64 yang dikirim.
  const data = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return api.post<{ success: boolean; data: { url: string; ukuran: number; nama: string | null }; message: string }>(
    '/dokumen/berkas',
    { nama: file.name, data },
  );
};

export const updateDokumen = (id: number | string, data: Partial<DokumenRecord>) =>
  api.put<{ success: boolean; data: DokumenRecord; message: string }>(`/dokumen/${id}`, data);

export const deleteDokumen = (id: number | string) =>
  api.delete<{ success: boolean; message: string }>(`/dokumen/${id}`);

// =============================================================================
// MONEV SURVEI & PERIODE DINAMIS API
// =============================================================================

export interface MonevPeriodeItem {
  id: number;
  kode: string;
  nama: string;
  tahunAkademik: string;
  semester: string;
  tanggalMulai?: string | null;
  tanggalSelesai?: string | null;
  status: 'DRAFT' | 'AKTIF' | 'DITUTUP';
  deskripsi?: string | null;
  createdAt?: string;
  _count?: {
    surveiList: number;
    responList: number;
  };
}

export interface MonevSasaranAudiensItem {
  id: number;
  kode: string;
  nama: string;
  sublabel?: string | null;
  deskripsi?: string | null;
  badge?: string | null;
  ikon?: string | null;
  urutan: number;
  aktif: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MonevSurveiItem {
  id: number;
  periodeId?: number;
  periode?: MonevPeriodeItem;
  kode: string;
  judul: string;
  deskripsi?: string | null;
  targetAudiens: 'MAHASISWA' | 'DOSEN_TENDIK' | 'SEMUA';
  aktif?: boolean;
  urutan: number;
  totalPertanyaan?: number;
  totalRespon?: number;
  sudahMengisi?: boolean;
  tanggalMengisi?: string | null;
  _count?: {
    pertanyaanList: number;
    responList: number;
  };
}

export interface MonevPertanyaanItem {
  id: number;
  surveiId: number;
  survei?: MonevSurveiItem;
  seksi?: string | null;
  kode?: string | null;
  teks: string;
  tipe: 'SKALA_5' | 'PILIHAN_GANDA' | 'KOTAK_CENTANG' | 'TEKS_SINGKAT' | 'ESAI';
  opsi?: any;
  wajib: boolean;
  urutan: number;
  _count?: {
    jawabanList: number;
  };
}

export interface MonevResponItem {
  id: number;
  periodeId: number;
  periode?: MonevPeriodeItem;
  surveiId: number;
  survei?: MonevSurveiItem;
  respondenHash: string;
  prodi?: string | null;
  fakultas?: string | null;
  semester?: string | null;
  mataKuliah?: string | null;
  dosenPengampu?: string | null;
  createdAt: string;
  _count?: {
    jawabanList: number;
  };
  jawabanList?: Array<{
    id: number;
    pertanyaanId: number;
    pertanyaan: MonevPertanyaanItem;
    nilaiSkala?: number | null;
    nilaiTeks?: string | null;
  }>;
}

export interface MonevSurveiDetail {
  id: number;
  kode: string;
  judul: string;
  deskripsi?: string | null;
  targetAudiens: 'MAHASISWA' | 'DOSEN_TENDIK' | 'SEMUA';
  periode: MonevPeriodeItem;
  pertanyaanList: MonevPertanyaanItem[];
}

export interface RekapPertanyaanItem {
  id: number;
  seksi?: string | null;
  teks: string;
  tipe: string;
  totalJawaban: number;
  rerata?: number;
  distribusi?: Record<number, number>;
  daftarJawaban?: string[];
}

export interface RekapMonevData {
  survei: {
    id: number;
    judul: string;
    kode: string;
    targetAudiens: string;
    periode: string;
    totalRespon: number;
  };
  data: RekapPertanyaanItem[];
}

// Client API Methods
export const fetchMonevPeriode = () =>
  api.get<{ success: boolean; data: MonevPeriodeItem[] }>('/monev-survei/periode');

export const fetchMonevSasaranAudiens = () =>
  api.get<{ success: boolean; data: MonevSasaranAudiensItem[] }>('/monev-survei/sasaran-audiens');

export const createMonevSasaranAudiens = (data: Partial<MonevSasaranAudiensItem>) =>
  api.post<{ success: boolean; data: MonevSasaranAudiensItem; message: string }>('/monev-survei/sasaran-audiens', data);

export const updateMonevSasaranAudiens = (id: number | string, data: Partial<MonevSasaranAudiensItem>) =>
  api.put<{ success: boolean; data: MonevSasaranAudiensItem; message: string }>(`/monev-survei/sasaran-audiens/${id}`, data);

export const deleteMonevSasaranAudiens = (id: number | string) =>
  api.delete<{ success: boolean; message: string }>(`/monev-survei/sasaran-audiens/${id}`);

export const createMonevPeriode = (data: Partial<MonevPeriodeItem>) =>
  api.post<{ success: boolean; data: MonevPeriodeItem; message: string }>('/monev-survei/periode', data);

export const updateMonevPeriode = (id: number | string, data: Partial<MonevPeriodeItem>) =>
  api.put<{ success: boolean; data: MonevPeriodeItem; message: string }>(`/monev-survei/periode/${id}`, data);

export const deleteMonevPeriode = (id: number | string) =>
  api.delete<{ success: boolean; message: string }>(`/monev-survei/periode/${id}`);

export const fetchMonevSurveiAktif = () =>
  api.get<{ success: boolean; periode: MonevPeriodeItem | null; data: MonevSurveiItem[] }>('/monev-survei/aktif');

export const fetchMonevSurveiDetail = (id: number | string) =>
  api.get<{ success: boolean; data: MonevSurveiDetail }>(`/monev-survei/${id}`);

export const submitMonevSurvei = (
  id: number | string,
  payload: {
    demografi?: {
      prodi?: string;
      fakultas?: string;
      semester?: string;
      mataKuliah?: string;
      dosenPengampu?: string;
    };
    jawaban: Array<{
      pertanyaanId: number;
      nilaiSkala?: number | null;
      nilaiTeks?: string | null;
    }>;
  }
) =>
  api.post<{ success: boolean; message: string }>(`/monev-survei/${id}/submit`, payload);

export const fetchRekapMonevSurvei = (id: number | string) =>
  api.get<{ success: boolean; survei: RekapMonevData['survei']; data: RekapPertanyaanItem[] }>(
    `/monev-survei/${id}/rekap`
  );

// Kategori Monev
export const fetchMonevKategori = (params?: { periodeId?: number | string }) =>
  api.get<{ success: boolean; data: MonevSurveiItem[] }>('/monev-survei/kategori', { params });

export const createMonevKategori = (data: Partial<MonevSurveiItem>) =>
  api.post<{ success: boolean; data: MonevSurveiItem; message: string }>('/monev-survei/kategori', data);

export const updateMonevKategori = (id: number | string, data: Partial<MonevSurveiItem>) =>
  api.put<{ success: boolean; data: MonevSurveiItem; message: string }>(`/monev-survei/kategori/${id}`, data);

// Soal Monev
export const fetchMonevPertanyaan = (params?: { surveiId?: number | string }) =>
  api.get<{ success: boolean; data: MonevPertanyaanItem[] }>('/monev-survei/pertanyaan', { params });

export const createMonevPertanyaan = (data: Partial<MonevPertanyaanItem>) =>
  api.post<{ success: boolean; data: MonevPertanyaanItem; message: string }>('/monev-survei/pertanyaan', data);

export const updateMonevPertanyaan = (id: number | string, data: Partial<MonevPertanyaanItem>) =>
  api.put<{ success: boolean; data: MonevPertanyaanItem; message: string }>(`/monev-survei/pertanyaan/${id}`, data);

export const deleteMonevPertanyaan = (id: number | string) =>
  api.delete<{ success: boolean; message: string }>(`/monev-survei/pertanyaan/${id}`);

// Responden Monev
export const fetchMonevResponden = (params?: {
  periodeId?: number | string;
  surveiId?: number | string;
  page?: number;
  limit?: number;
}) =>
  api.get<{
    success: boolean;
    data: MonevResponItem[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>('/monev-survei/responden', { params });

export const fetchMonevRespondenDetail = (id: number | string) =>
  api.get<{ success: boolean; data: MonevResponItem }>(`/monev-survei/responden/${id}`);


export default api;
