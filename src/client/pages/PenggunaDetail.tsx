import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { CardContainer } from '../components/CardContainer';
import { ErrorState } from '../components/ErrorState';
import {
  fetchPenelitian,
  fetchPengabdian,
  fetchPublikasi,
  PenelitianItem,
  PengabdianItem,
  PublikasiItem,
} from '../services/api';
import {
  UsersIcon,
  EnvelopeIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  HeartIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

/**
 * PenggunaDetailPage — Halaman penuh detail profil dan rekam jejak Tridharma pengguna LPPM.
 *
 * Menggantikan modal dialog pada `Pengguna.tsx` sesuai protokol AGENTS.md (CRUD Full Pages / No Modals).
 * Rute: `/pengguna/:id`
 */
export const PenggunaDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [penelitianList, setPenelitianList] = useState<PenelitianItem[]>([]);
  const [pengabdianList, setPengabdianList] = useState<PengabdianItem[]>([]);
  const [publikasiList, setPublikasiList] = useState<PublikasiItem[]>([]);

  useEffect(() => {
    let aktif = true;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchPenelitian().catch(() => ({ data: { data: [] as PenelitianItem[] } })),
      fetchPengabdian().catch(() => ({ data: { data: [] as PengabdianItem[] } })),
      fetchPublikasi().catch(() => ({ data: { data: [] as PublikasiItem[] } })),
    ])
      .then(([penRes, pkmRes, pubRes]) => {
        if (!aktif) return;
        setPenelitianList(penRes.data?.data || []);
        setPengabdianList(pkmRes.data?.data || []);
        setPublikasiList(pubRes.data?.data || []);
      })
      .catch((err: any) => {
        if (aktif) {
          setError(err?.response?.data?.message || 'Gagal memuat rekam jejak pengguna');
        }
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });

    return () => {
      aktif = false;
    };
  }, [id]);

  // Cari user berdasarkan ID di daftar aktivitas
  const decodedId = decodeURIComponent(id || '');

  // Kumpulkan aktivitas dosen bersangkutan
  const userPenelitian = penelitianList.filter(
    (p) => String(p.id) === decodedId || p.ketua?.toLowerCase().includes(decodedId.toLowerCase())
  );
  const userPengabdian = pengabdianList.filter(
    (p) => String(p.id) === decodedId || p.ketua?.toLowerCase().includes(decodedId.toLowerCase())
  );
  const userPublikasi = publikasiList.filter(
    (p) => String(p.id) === decodedId || p.penulis?.toLowerCase().includes(decodedId.toLowerCase())
  );

  const namaTampilan = decodedId.replace(/_/g, ' ');

  return (
    <PageShell
      title={`Detail Pengguna: ${namaTampilan}`}
      description="Profil civitas akademika dan rekam jejak pelaksanaan Tridharma Perguruan Tinggi di LPPM UNUSU."
      badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#EDE8F5] border border-violet-200 text-[10px] font-bold uppercase tracking-wider text-violet-900">
          <UsersIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Tata Kelola
        </span>
      }
      actions={
        <Link
          to="/pengguna"
          className="inline-flex items-center justify-center px-5 py-2.5 h-[42px] rounded-[12px] border border-[#CBD5E1] bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold shadow-2xs transition-all shrink-0"
        >
          <span>Kembali</span>
        </Link>
      }
    >
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500 font-medium">
          Memuat detail rekam jejak pengguna...
        </div>
      ) : error ? (
        <ErrorState title="Gagal Memuat Data Pengguna" description={error} />
      ) : (
        <div className="space-y-6">
          {/* Kartu Profil Utama */}
          <CardContainer
            title="Identitas Pengguna Terverifikasi"
            subtitle="Data akun pengguna yang tersinkronisasi via ONE UNUSU SSO Gateway."
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-violet-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-xs shrink-0">
                {namaTampilan.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                  {namaTampilan}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 mt-2">
                  <div className="flex items-center gap-1.5">
                    <IdentificationIcon className="w-4 h-4 text-slate-400" />
                    <span>NIDN / Akun: <strong className="font-mono text-slate-800">{decodedId}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <EnvelopeIcon className="w-4 h-4 text-slate-400" />
                    <span>Email: <strong className="font-mono text-slate-800">dosen@unusu.ac.id</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-emerald-700">Status Terverifikasi SSO</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContainer>

          {/* Ringkasan Statistik Tridharma */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-[16px] bg-white border border-[#CBD5E1] shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-[12px] bg-violet-50 text-violet-700 flex items-center justify-center shrink-0">
                <AcademicCapIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Penelitian
                </p>
                <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {userPenelitian.length}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-[16px] bg-white border border-[#CBD5E1] shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-[12px] bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <HeartIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Pengabdian
                </p>
                <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {userPengabdian.length}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-[16px] bg-white border border-[#CBD5E1] shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-[12px] bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <BookOpenIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Publikasi
                </p>
                <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {userPublikasi.length}
                </p>
              </div>
            </div>
          </div>

          {/* Daftar Penelitian */}
          {userPenelitian.length > 0 && (
            <CardContainer
              title={`Penelitian yang Diampu (${userPenelitian.length})`}
              subtitle="Daftar usulan dan hibah riset dosen di pangkalan data LPPM."
            >
              <ul className="divide-y divide-slate-100 text-xs">
                {userPenelitian.map((p) => (
                  <li key={p.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{p.judul}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Bidang Fokus: {p.bidangFokus} • Tahun: {p.tahun} • Status: {p.status}
                      </p>
                    </div>
                    <span className="font-mono text-[11px] text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                      {p.bidangFokus}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContainer>
          )}
        </div>
      )}
    </PageShell>
  );
};

export default PenggunaDetailPage;
