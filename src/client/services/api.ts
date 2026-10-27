import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
  api.post<{ success: boolean; token: string; user: SessionUser }>('/auth/sso', { client_id, token });

export interface PenelitianItem {
  id: number;
  judul: string;
  ketua: string;
  nidn: string;
  anggota?: string;
  skema: string;
  bidangFokus: string;
  danaDisetujui?: number;
  sumberDana: string;
  tahun: number;
  status: string;
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
export const createPenelitian = (data: any) => api.post('/penelitian', data);
export const fetchPengabdian = () => api.get<{ success: boolean; data: PengabdianItem[] }>('/pengabdian');
export const createPengabdian = (data: any) => api.post('/pengabdian', data);
export const fetchPublikasi = () => api.get<{ success: boolean; data: PublikasiItem[] }>('/publikasi');

export default api;
