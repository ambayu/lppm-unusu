import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import {
  fetchRekapMonevSurvei,
  RekapMonevData,
  RekapPertanyaanItem,
} from '../services/api';
import {
  ChartBarIcon,
  ArrowLeftIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

export const MonevRekapPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [rekap, setRekap] = useState<RekapMonevData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchRekapMonevSurvei(id)
      .then((res) => {
        setRekap(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || 'Gagal memuat rekapitulasi survei.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleExportCsv = () => {
    if (!rekap || rekap.data.length === 0) return;

    const headers = ['No', 'Seksi', 'Pertanyaan', 'Tipe', 'Total Jawaban', 'Skor Rerata (1-5)'];
    const rows = rekap.data.map((p, idx) => [
      idx + 1,
      `"${p.seksi || '-'}"`,
      `"${p.teks.replace(/"/g, '""')}"`,
      p.tipe,
      p.totalJawaban,
      p.rerata || '-',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap-monev-${rekap.survei.kode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-4 py-8">
        <div className="h-28 animate-pulse rounded-[16px] bg-slate-100" />
        <div className="h-64 animate-pulse rounded-[16px] bg-slate-100" />
      </div>
    );
  }

  if (error || !rekap) {
    return (
      <div className="rounded-[12px] border border-rose-200 bg-rose-50 p-6 text-center text-xs text-rose-700">
        <p className="font-bold">Gagal Memuat Rekap</p>
        <p className="mt-1">{error}</p>
        <Link
          to="/monev-survei"
          className="mt-4 inline-flex items-center gap-1.5 rounded-[8px] bg-white px-3 py-1.5 text-xs font-bold text-rose-700 shadow-xs"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          <span>Kembali</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div>
            <Link
              to="/monev-survei"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-700"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              <span>Kembali ke Katalog Monev</span>
            </Link>
          </div>

          {/* Header Info */}
          <div className="flex flex-col gap-4 rounded-[20px] border border-violet-800 bg-gradient-to-br from-violet-950 via-indigo-950 to-slate-900 p-6 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-violet-300">
                <CalendarDaysIcon className="h-4 w-4" />
                <span>{rekap.survei.periode}</span>
              </div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                {rekap.survei.judul}
              </h1>
              <p className="mt-1 text-xs text-violet-200">
                Rekapitulasi statistik dan agregasi jawaban survei kepuasan mahasiswa/civitas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-[12px] bg-white/10 px-4 py-2.5 text-center backdrop-blur-md">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-200">Total Responden</p>
                <p className="text-xl font-extrabold text-white">{rekap.survei.totalRespon}</p>
              </div>
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 rounded-[8px] bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                <span>Ekspor CSV</span>
              </button>
            </div>
          </div>

      {/* Rincian Jawaban per Pertanyaan */}
      <div className="space-y-4">
        {rekap.data.map((item, idx) => (
          <div key={item.id} className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600">
                  {item.seksi || 'Pertanyaan Evaluasi'}
                </span>
                <p className="mt-1 text-xs font-semibold text-slate-800">
                  <span className="mr-1.5 font-bold text-slate-400">#{idx + 1}</span>
                  {item.teks}
                </p>
              </div>

              {item.tipe === 'SKALA_5' && (
                <div className="flex shrink-0 items-center gap-2 rounded-[8px] bg-violet-50 px-3 py-1.5 text-violet-900">
                  <ChartBarIcon className="h-4 w-4 text-violet-600" />
                  <span className="text-xs font-bold">Rerata: {item.rerata} / 5.0</span>
                </div>
              )}
            </div>

            {/* Visualisasi Skala Likert 1-5 */}
            {item.tipe === 'SKALA_5' && item.distribusi && (
              <div className="mt-4 grid grid-cols-5 gap-2 border-t border-slate-100 pt-3">
                {[1, 2, 3, 4, 5].map((val) => {
                  const count = item.distribusi?.[val] || 0;
                  const pct = item.totalJawaban > 0 ? Math.round((count / item.totalJawaban) * 100) : 0;
                  return (
                    <div key={val} className="space-y-1 text-center">
                      <div className="text-[11px] font-bold text-slate-600">
                        {val === 1 ? '1 (STP)' : val === 2 ? '2 (KP)' : val === 3 ? '3 (CP)' : val === 4 ? '4 (P)' : '5 (SP)'}
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-violet-600 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {count} ({pct}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Daftar Jawaban Esai/Saran */}
            {item.tipe === 'ESAI' && item.daftarJawaban && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="text-[11px] font-bold text-slate-500">Kutipan Saran / Masukan Responden (Terbaru):</p>
                {item.daftarJawaban.length === 0 ? (
                  <p className="mt-1 text-xs italic text-slate-400">Belum ada masukan teks.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {item.daftarJawaban.map((txt, tIdx) => (
                      <li
                        key={tIdx}
                        className="rounded-[8px] bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-700 italic border border-slate-100"
                      >
                        "{txt}"
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
        </main>
      </div>

      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} LPPM Universitas Nahdlatul Ulama Sumatera Utara.</p>
      </footer>
    </div>
  );
};
