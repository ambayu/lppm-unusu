import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
