import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { PublicFooter } from '../components/PublicFooter';
import { PageHeader } from '../components/PageHeader';
import {
  fetchMonevSurveiAktif,
  fetchMonevSasaranAudiens,
  MonevPeriodeItem,
  MonevSurveiItem,
  MonevSasaranAudiensItem,
} from '../services/api';
import {
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  BuildingLibraryIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

const IKON_MAP: Record<string, React.ElementType> = {
  AcademicCapIcon,
  BriefcaseIcon,
  BuildingLibraryIcon,
  UserGroupIcon,
};

export const MonevSurveiListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [periode, setPeriode] = useState<MonevPeriodeItem | null>(null);
  const [surveiList, setSurveiList] = useState<MonevSurveiItem[]>([]);
  const [sasaranList, setSasaranList] = useState<MonevSasaranAudiensItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sasaranTerpilih = searchParams.get('sasaran');

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([fetchMonevSurveiAktif(), fetchMonevSasaranAudiens()])
      .then(([resSurvei, resSasaran]) => {
        setPeriode(resSurvei.data.periode);
        setSurveiList(resSurvei.data.data || []);
        const aktifSasaran = (resSasaran.data.data || []).filter((s) => s.aktif);
        setSasaranList(aktifSasaran);
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

  const handlePilihSasaran = (key: string) => {
    setSearchParams({ sasaran: key });
  };

  const handleResetSasaran = () => {
    setSearchParams({});
  };

  // Filter instrumen berdasarkan sasaran yang dipilih
  const instrumenFiltered = sasaranTerpilih
    ? surveiList.filter((item) => item.targetAudiens === sasaranTerpilih)
    : [];

  // Hitung jumlah survei per sasaran
  const hitungSurveiPerSasaran = (key: string) =>
    surveiList.filter((item) => item.targetAudiens === key).length;

  const activeSasaranConfig = sasaranList.find((s) => s.kode === sasaranTerpilih);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Header Halaman Publik sesuai standar UNUSU */}
        <PageHeader
          eyebrow="HALAMAN"
          title="Monitoring & Evaluasi (Monev) Mutu"
          description="Kuesioner evaluasi dan pemantauan mutu pembelajaran, pelaksanaan ujian, layanan informasi, serta kepuasan SDM civitas kampus UNUSU."
        >
          {/* Badge horizontal tanpa collapse (nowrap / lurus) */}
          <div className="flex flex-row flex-nowrap items-center gap-3 pt-2 text-xs sm:text-sm overflow-x-auto pb-1">
            <div className="inline-flex shrink-0 items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-xs text-violet-200 border border-violet-400/20 shadow-xs">
              <ShieldCheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 shrink-0" />
              <span className="font-semibold whitespace-nowrap">Respon Dijamin Anonim</span>
            </div>
            {periode && (
              <div className="inline-flex shrink-0 items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-xs text-amber-200 border border-amber-400/20 shadow-xs">
                <CalendarDaysIcon className="h-4 w-4 sm:h-5 sm:w-5 text-amber-300 shrink-0" />
                <span className="font-semibold whitespace-nowrap">Periode Aktif: <strong className="text-white">{periode.nama}</strong></span>
              </div>
            )}
          </div>
        </PageHeader>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
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
                  <p className="text-xs text-slate-500">
                    {sasaranTerpilih
                      ? `Menampilkan instrumen khusus sasaran: ${activeSasaranConfig?.nama || sasaranTerpilih}.`
                      : periode.deskripsi || 'Silakan pilih sasaran Anda untuk melihat instrumen monev yang sesuai.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Tombol kembali ke pilihan sasaran di dalam card yang sama dengan tahun akademik */}
                {sasaranTerpilih && (
                  <button
                    type="button"
                    onClick={handleResetSasaran}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-[10px] border border-violet-300 bg-violet-50 px-3.5 py-2 text-xs font-bold text-violet-800 hover:bg-violet-100 hover:border-violet-400 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    <span>Kembali ke Sasaran</span>
                  </button>
                )}

                <div className="text-xs font-semibold text-slate-500 bg-slate-50 px-3.5 py-2.5 rounded-[10px] border border-slate-100">
                  T.A. <strong className="text-slate-800">{periode.tahunAkademik}</strong> ({periode.semester})
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-[12px] border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {/* ALUR TAHAP 1: PILIH SASARAN TERLEBIH DAHULU (Bila belum ada sasaran yang dipilih) */}
          {!sasaranTerpilih ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Pilih Sasaran Responden
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Silakan tentukan peran atau kedudukan Anda terlebih dahulu untuk melihat instrumen kuesioner yang sesuai.
                </p>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-56 rounded-[20px] bg-slate-100 animate-pulse border border-slate-200" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {sasaranList.map((sasaran) => {
                    const Icon = (sasaran.ikon && IKON_MAP[sasaran.ikon]) || UserGroupIcon;
                    const jumlah = hitungSurveiPerSasaran(sasaran.kode);
                    return (
                      <button
                        key={sasaran.id}
                        type="button"
                        onClick={() => handlePilihSasaran(sasaran.kode)}
                        className="group relative flex flex-col justify-between text-left rounded-[22px] border border-slate-200 bg-white p-7 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-violet-400 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 cursor-pointer"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-violet-100 text-violet-800 transition-colors group-hover:bg-violet-700 group-hover:text-white shadow-xs">
                              <Icon className="h-7 w-7" aria-hidden="true" />
                            </div>
                            {sasaran.badge && (
                              <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-800 border border-violet-100">
                                {sasaran.badge}
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="text-lg font-bold text-slate-900 group-hover:text-violet-700 transition-colors">
                              {sasaran.nama}
                            </h4>
                            {sasaran.sublabel && (
                              <p className="text-xs font-semibold text-violet-700 mt-0.5">
                                {sasaran.sublabel}
                              </p>
                            )}
                            <p className="mt-2 text-xs leading-relaxed text-slate-500">
                              {sasaran.deskripsi || 'Survei evaluasi dan pemantauan mutu.'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 text-xs">
                          <span className="font-bold text-slate-600">
                            <strong className="text-sm font-extrabold text-violet-700">{jumlah}</strong> Instrumen
                          </span>

                          <div className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[12px] bg-slate-900 px-4 py-2 font-bold text-white transition-all group-hover:bg-violet-700 group-hover:shadow-md">
                            <span>Pilih Sasaran</span>
                            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ALUR TAHAP 2: DAFTAR INSTRUMEN DARI SASARAN YANG TELAH DIPILIH */
            <div className="space-y-6">
              {/* Daftar Kartu Kuesioner untuk Sasaran Terpilih */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Instrumen Kuesioner {activeSasaranConfig?.nama}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pilih instrumen di bawah ini untuk memulai pengisian kuesioner mutu secara objektif.
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-48 rounded-[16px] bg-slate-100 animate-pulse border border-slate-200" />
                    ))}
                  </div>
                ) : instrumenFiltered.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-slate-200 bg-white p-12 text-center">
                    <ClipboardDocumentCheckIcon className="mx-auto h-12 w-12 text-slate-300" />
                    <h4 className="mt-3 text-base font-bold text-slate-700">Belum Ada Kuesioner untuk Sasaran Ini</h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Saat ini belum ada instrumen yang dibuka untuk kategori sasaran {activeSasaranConfig?.nama || sasaranTerpilih}.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetSasaran}
                      className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-[12px] bg-violet-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-800 transition"
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                      <span>Kembali Pilih Sasaran Lain</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {instrumenFiltered.map((item) => {
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
                              <div>
                                <div className="font-mono text-[11px] font-semibold text-slate-400">{item.kode}</div>
                                <h4 className="text-base font-bold text-slate-900 group-hover:text-violet-700 mt-0.5">
                                  {item.judul}
                                </h4>
                              </div>

                              {isSelesai && (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                                  <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-600" />
                                  Sudah Diisi
                                </span>
                              )}
                            </div>

                            <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                              {item.deskripsi || 'Instrumen kuesioner evaluasi dan pemantauan mutu institusi.'}
                            </p>
                          </div>

                          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-5 text-xs">
                            <div className="text-slate-500 font-medium">
                              <span className="font-extrabold text-sm text-slate-900">{item.totalPertanyaan}</span> Butir Pertanyaan
                            </div>

                            <div className="flex items-center gap-3">
                              {isSelesai ? (
                                <span className="inline-flex min-h-[44px] items-center gap-2 rounded-[12px] bg-slate-100 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-400 cursor-not-allowed">
                                  Tersimpan
                                </span>
                              ) : (
                                <Link
                                  to={`/monev-survei/${item.id}`}
                                  className="inline-flex min-h-[44px] items-center gap-2 rounded-[12px] bg-violet-700 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-violet-800 transition active:scale-95"
                                >
                                  <span>Isi Kuesioner</span>
                                  <ArrowRightIcon className="h-4 w-4" />
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
            </div>
          )}
        </main>
      </div>

      {/* Footer Lengkap ONE UNUSU */}
      <PublicFooter />
    </div>
  );
};
