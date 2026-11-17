import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
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
  AcademicCapIcon,
  SparklesIcon,
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-[24px] border border-violet-800 bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-950 p-6 sm:p-10 text-white shadow-xl">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/20 px-3.5 py-1 text-xs font-semibold text-violet-200 backdrop-blur-md">
                <SparklesIcon className="h-4 w-4 text-amber-300" />
                <span>Portal Survei Mutu Terpadu UNUSU</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Monitoring &amp; Evaluasi (Monev) Mutu
              </h1>
              <p className="text-sm sm:text-base leading-relaxed text-violet-100/90">
                Kuesioner evaluasi dan pemantauan mutu pembelajaran, pelaksanaan ujian, layanan informasi, serta kepuasan SDM. Masukan dan penilaian Anda langsung digunakan sebagai dasar perbaikan mutu institusi secara berkelanjutan.
              </p>

              <div className="flex flex-wrap items-center gap-5 pt-2 text-xs text-violet-200">
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-xs">
                  <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
                  <span>Respon Dijamin Anonim</span>
                </div>
                {periode && (
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-xs">
                    <CalendarDaysIcon className="h-4 w-4 text-amber-300" />
                    <span>Periode Aktif: <strong className="text-white">{periode.nama}</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Banner Status Periode */}
          {periode && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[16px] border border-violet-200 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-violet-100 text-violet-700">
                  <CalendarDaysIcon className="h-6 w-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Masa Pengisian Dibuka</span>
                  </div>
                  <h2 className="text-base font-extrabold text-slate-800 mt-0.5">{periode.nama}</h2>
                  <p className="text-xs text-slate-500">{periode.deskripsi || 'Silakan pilih dan lengkapi instrumen monev di bawah ini.'}</p>
                </div>
              </div>

              <div className="text-xs font-semibold text-slate-500 bg-slate-50 px-3.5 py-2 rounded-[8px] border border-slate-100">
                T.A. <strong className="text-slate-800">{periode.tahunAkademik}</strong> ({periode.semester})
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-[12px] border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* Daftar Kartu Kuesioner */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Daftar Instrumen Kuesioner</h3>
                <p className="text-xs text-slate-500">Pilih salah satu instrumen kuesioner untuk mulai memberikan penilaian.</p>
              </div>
              <span className="text-xs font-bold text-violet-700 bg-violet-50 px-3 py-1 rounded-full border border-violet-100">
                {surveiList.length} Instrumen Tersedia
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-48 rounded-[16px] bg-slate-100 animate-pulse border border-slate-200" />
                ))}
              </div>
            ) : surveiList.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-slate-200 bg-white p-12 text-center">
                <ClipboardDocumentCheckIcon className="mx-auto h-12 w-12 text-slate-300" />
                <h4 className="mt-3 text-base font-bold text-slate-700">Belum Ada Kuesioner Aktif</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Saat ini belum ada instrumen kuesioner monev yang dibuka pada periode ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {surveiList.map((item) => {
                  const isSelesai = Boolean(item.sudahMengisi);
                  return (
                    <div
                      key={item.id}
                      className={`relative flex flex-col justify-between overflow-hidden rounded-[18px] border bg-white p-6 shadow-xs transition-all hover:shadow-md ${
                        isSelesai
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-slate-200 hover:border-violet-300'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-700 border border-violet-100">
                            <UserGroupIcon className="h-3.5 w-3.5" />
                            {item.targetAudiens === 'MAHASISWA'
                              ? 'Sasaran: Mahasiswa'
                              : item.targetAudiens === 'DOSEN_TENDIK'
                              ? 'Sasaran: Dosen & Tendik'
                              : 'Sasaran: Civitas Akademika'}
                          </span>

                          {isSelesai && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                              <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-600" />
                              Sudah Diisi
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="font-mono text-[11px] font-semibold text-slate-400">{item.kode}</div>
                          <h4 className="text-base font-bold text-slate-900 group-hover:text-violet-700 mt-0.5">
                            {item.judul}
                          </h4>
                          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                            {item.deskripsi || 'Instrumen kuesioner evaluasi dan pemantauan mutu institusi.'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
                        <div className="text-slate-500 font-medium">
                          <span className="font-bold text-slate-800">{item.totalPertanyaan}</span> Butir Pertanyaan
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            to={`/monev-survei/${item.id}/rekap`}
                            className="inline-flex items-center gap-1 rounded-[8px] border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 shadow-2xs"
                          >
                            <ChartBarIcon className="h-3.5 w-3.5 text-slate-500" />
                            <span>Hasil Rekap</span>
                          </Link>

                          {isSelesai ? (
                            <span className="inline-flex items-center gap-1 rounded-[8px] bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-400 cursor-not-allowed">
                              Tersimpan
                            </span>
                          ) : (
                            <Link
                              to={`/monev-survei/${item.id}`}
                              className="inline-flex items-center gap-1.5 rounded-[8px] bg-violet-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-violet-800 transition active:scale-95"
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
        </main>
      </div>

      {/* Footer Sederhana */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} LPPM Universitas Nahdlatul Ulama Sumatera Utara. Sistem Monev Terpadu.</p>
      </footer>
    </div>
  );
};
