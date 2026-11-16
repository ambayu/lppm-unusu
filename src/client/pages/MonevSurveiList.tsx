import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchMonevSurveiAktif,
  MonevPeriodeItem,
  MonevSurveiItem,
} from '../services/api';
import {
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export const MonevSurveiListPage: React.FC = () => {
  const [periode, setPeriode] = useState<MonevPeriodeItem | null>(null);
  const [surveiList, setSurveiList] = useState<MonevSurveiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchMonevSurveiAktif()
      .then((res) => {
        setPeriode(res.data.periode);
        setSurveiList(res.data.data || []);
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || 'Gagal memuat daftar survei monev aktif.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[16px] border border-violet-100 bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 p-6 text-white shadow-sm sm:p-8">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-200 backdrop-blur-md">
            <ClipboardDocumentCheckIcon className="h-4 w-4" />
            <span>Kuesioner Monitoring & Evaluasi Terpadu</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Survei Kepuasan & Evaluasi Mutu
          </h1>
          <p className="text-sm leading-relaxed text-violet-100/90 sm:text-base">
            Partisipasi Anda sangat berharga untuk meningkatkan kualitas pembelajaran, sarana prasarana, serta layanan tridharma di lingkungan Universitas Nahdlatul Ulama Sumatera Utara.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-violet-200">
            <div className="flex items-center gap-1.5">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
              <span>Respon Dijamin Anonim</span>
            </div>
            {periode && (
              <div className="flex items-center gap-1.5">
                <CalendarDaysIcon className="h-4 w-4 text-amber-300" />
                <span>Periode: <strong>{periode.nama}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Informasi Periode Aktif */}
      {periode && (
        <div className="flex flex-col gap-3 rounded-[12px] border border-violet-100 bg-violet-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-violet-600 text-white">
              <CalendarDaysIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Periode Berjalan</p>
              <h2 className="text-sm font-bold text-slate-800">{periode.nama}</h2>
              <p className="text-xs text-slate-500">{periode.deskripsi || 'Silakan lengkapi instrumen monev yang tersedia.'}</p>
            </div>
          </div>
          <Link
            to="/admin/monev-periode"
            className="inline-flex items-center gap-1.5 self-start rounded-[8px] border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-violet-700 shadow-xs hover:bg-violet-50 sm:self-center"
          >
            <ChartBarIcon className="h-4 w-4 text-violet-600" />
            <span>Kelola Master Periode</span>
          </Link>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-[10px] border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="h-44 animate-pulse rounded-[14px] border border-slate-100 bg-slate-50 p-6" />
          ))}
        </div>
      ) : surveiList.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-slate-200 bg-white p-12 text-center">
          <ClipboardDocumentCheckIcon className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-sm font-bold text-slate-700">Belum Ada Kuesioner Aktif</h3>
          <p className="mt-1 text-xs text-slate-500">
            Saat ini belum ada periode kuesioner monev yang dibuka atau belum ada survei aktif.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {surveiList.map((item) => {
            const isSelesai = Boolean(item.sudahMengisi);
            return (
              <div
                key={item.id}
                className={`relative flex flex-col justify-between overflow-hidden rounded-[14px] border bg-white p-6 shadow-xs transition-all hover:shadow-md ${
                  isSelesai
                    ? 'border-emerald-200/80 bg-emerald-50/20'
                    : 'border-slate-200 hover:border-violet-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                      <UserGroupIcon className="h-3.5 w-3.5" />
                      {item.targetAudiens === 'MAHASISWA'
                        ? 'Mahasiswa'
                        : item.targetAudiens === 'DOSEN_TENDIK'
                        ? 'Dosen & Tendik'
                        : 'Civitas Akademika'}
                    </span>
                    {isSelesai && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-600" />
                        Sudah Diisi
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-violet-700">
                      {item.judul}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {item.deskripsi || 'Instrumen kuesioner evaluasi dan pemantauan mutu.'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
                  <div className="text-slate-500">
                    <span className="font-semibold text-slate-700">{item.totalPertanyaan}</span> Butir Pertanyaan
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/monev-survei/${item.id}/rekap`}
                      className="inline-flex items-center gap-1 rounded-[6px] border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      title="Lihat Rekap Hasil Survei"
                    >
                      <ChartBarIcon className="h-3.5 w-3.5" />
                      <span>Rekap</span>
                    </Link>

                    {isSelesai ? (
                      <span className="inline-flex items-center gap-1 rounded-[6px] bg-slate-100 px-3 py-1.5 font-semibold text-slate-400 cursor-not-allowed">
                        Terkirim
                      </span>
                    ) : (
                      <Link
                        to={`/monev-survei/${item.id}`}
                        className="inline-flex items-center gap-1.5 rounded-[8px] bg-violet-700 px-3.5 py-1.5 font-bold text-white shadow-xs transition hover:bg-violet-800 active:scale-95"
                      >
                        <span>Isi Kuesioner</span>
                        <ArrowRightIcon className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
