import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BeakerIcon,
  HeartIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightIcon,
  BanknotesIcon,
  UserIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { fetchDashboardStats, DashboardStatsData } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ErrorState } from '../components/ErrorState';
import {
  ReportCard,
  DonutChart,
  BarChart,
  ColumnChart,
  GaugeRing,
  StackedBar,
} from '../components/LaporanCharts';

/**
 * DashboardPage (LPPM UNUSU)
 *
 * Halaman beranda panel manajemen LPPM. Seluruh angka diambil dari satu
 * endpoint agregasi `GET /api/dashboard/stats` (count / aggregate / groupBy di
 * server) sehingga tidak ada angka yang dihitung dari data yang tidak lengkap.
 *
 * Urutan blok mengikuti standar dashboard ONE UNUSU:
 * banner sambutan → kartu ringkasan → error → skeleton → kartu metrik →
 * laporan chart → 2 daftar terbaru.
 */

type ChartDatum = { label: string; value: number; color?: string };

const PALETTE = ['#6D28D9', '#D97706', '#2563EB', '#DB2777', '#0891B2', '#7C3AED', '#94A3B8'];

const warna = (idx: number) => PALETTE[idx % PALETTE.length];

/** Sapaan dinamis mengikuti jam perangkat pengguna. */
function sapaanSekarang() {
  const jam = new Date().getHours();
  if (jam < 11) return 'Selamat pagi';
  if (jam < 15) return 'Selamat siang';
  if (jam < 19) return 'Selamat sore';
  return 'Selamat malam';
}

/** Badge status netral (palet violet) untuk daftar terbaru. */
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const teks = (status || 'Baru').toString();
  const kecil = teks.toLowerCase();
  const tone = /selesai|disetujui|diterima/.test(kecil)
    ? 'bg-violet-100 text-violet-900 border-violet-200'
    : /tolak|revisi/.test(kecil)
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-amber-50 text-amber-800 border-amber-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tone}`}>
      {teks}
    </span>
  );
};

const angkaId = (n: number) => Number(n || 0).toLocaleString('id-ID');

const tanggalId = (iso?: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).substring(0, 10);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * loadData — satu jalur fetch untuk muat awal, tombol "Segarkan",
   * maupun tombol "Coba Lagi" pada ErrorState.
   */
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDashboardStats();
      if (res.data?.success && res.data.data) {
        setStats(res.data.data);
      } else {
        setError('Server tidak mengembalikan ringkasan dashboard.');
      }
    } catch (err: any) {
      setStats(null);
      setError(err?.response?.data?.message || err?.message || 'Gagal memuat ringkasan dashboard LPPM.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const namaDepan = (user?.nama || 'Pengguna').split(' ')[0];
  const sapaan = sapaanSekarang();

  /* ---------------- Data turunan grafik ---------------- */

  const ke = (rows: { label: string; value: number }[] = []): ChartDatum[] =>
    rows.map((d, i) => ({ ...d, color: warna(i) }));

  const ringkasan = stats?.ringkasan;
  const totalKegiatan = ringkasan?.totalKegiatan ?? 0;
  const totalPenelitian = ringkasan?.totalPenelitian ?? 0;
  const totalPengabdian = ringkasan?.totalPengabdian ?? 0;
  const totalPublikasi = ringkasan?.totalPublikasi ?? 0;
  const totalMonev = ringkasan?.totalMonev ?? 0;
  const danaDisetujui = ringkasan?.danaDisetujui ?? 0;

  const statusPenelitian = ke(stats?.statusPenelitian);
  const bidangFokus = ke(stats?.bidangFokus);
  const sumberDana = ke(stats?.sumberDana);
  const mitraPengabdian = ke(stats?.mitraPengabdian);
  const jenisPublikasi = ke(stats?.jenisPublikasi);
  const sintaPublikasi = ke(stats?.sintaPublikasi);
  const statusMonev = ke(stats?.statusMonev);

  /** Komposisi tridharma: kegiatan vs luaran publikasi. */
  const komposisiTridharma: ChartDatum[] = [
    { label: 'Penelitian', value: totalPenelitian, color: '#6D28D9' },
    { label: 'Pengabdian', value: totalPengabdian, color: '#D97706' },
    { label: 'Publikasi', value: totalPublikasi, color: '#2563EB' },
  ].filter((d) => d.value > 0);

  /** Tren 5 tahun: kolom penelitian+pengabdian dan publikasi. */
  const trenTahunan = (stats?.trenTahunan ?? []).map((t) => ({
    label: String(t.tahun),
    value: t.penelitian + t.pengabdian,
  }));
  const trenPublikasi = (stats?.trenTahunan ?? []).map((t) => ({
    label: String(t.tahun),
    value: t.publikasi,
  }));

  const penelitianTerbaru = stats?.recentPenelitian ?? [];
  const publikasiTerbaru = stats?.recentPublikasi ?? [];

  return (
    <div className="space-y-6">
      {/* 1. BANNER SAMBUTAN */}
      <section
        aria-label="Sambutan panel LPPM"
        className="relative overflow-hidden rounded-[16px] border border-violet-950 bg-gradient-to-br from-violet-900 via-violet-800 to-violet-700 text-white"
      >
        <div className="px-5 py-6 sm:px-7 sm:py-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Portal Tridharma Riset
            </span>
            <h1 className="mt-2.5 text-xl sm:text-2xl font-bold leading-snug">
              {sapaan}, {namaDepan}
            </h1>
            <p className="mt-1.5 max-w-2xl text-xs sm:text-sm text-violet-50/90 leading-relaxed">
              Ringkasan kinerja penelitian, pengabdian kepada masyarakat, publikasi ilmiah, serta
              monitoring dan evaluasi dosen UNUSU dalam satu tampilan laporan.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to="/penelitian"
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-[8px] bg-white px-3.5 text-xs font-bold text-violet-900 hover:bg-violet-50 transition-colors"
            >
              <BeakerIcon className="w-4 h-4" aria-hidden="true" />
              <span>Pangkalan Penelitian</span>
            </Link>
            <Link
              to="/monev"
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-[8px] bg-amber-400 px-3.5 text-xs font-bold text-slate-950 hover:bg-amber-300 transition-colors"
            >
              <ClipboardDocumentCheckIcon className="w-4 h-4" aria-hidden="true" />
              <span>Jadwal Monev</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. ERROR STATE */}
      {error && (
        <div className="bg-white border border-[#CBD5E1] rounded-[16px]">
          <ErrorState
            title="Gagal Memuat Ringkasan Dashboard"
            description={error}
            onRetry={loadData}
          />
        </div>
      )}

      {/* 4. SKELETON LOADING */}
      {loading && !stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-[#CBD5E1] rounded-[14px] p-5 h-28 animate-pulse bg-slate-100" />
          ))}
        </div>
      )}

      {stats && (
        <>
          {/* 5. KARTU METRIK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#CBD5E1] rounded-[14px] p-5 shadow-xs hover:border-violet-400 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Penelitian Dosen</span>
                <div className="w-9 h-9 rounded-xl bg-[#EDE8F5] text-violet-700 flex items-center justify-center">
                  <BeakerIcon className="w-4 h-4" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-slate-900">{angkaId(totalPenelitian)}</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Proposal hibah &amp; riset terapan</p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs font-bold">
                <Link to="/penelitian" className="text-violet-700 hover:text-violet-900 inline-flex items-center gap-1">
                  Daftar <ArrowRightIcon className="w-3 h-3" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="bg-white border border-[#CBD5E1] rounded-[14px] p-5 shadow-xs hover:border-violet-400 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pengabdian (PKM)</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <HeartIcon className="w-4 h-4" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-slate-900">{angkaId(totalPengabdian)}</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {mitraPengabdian.length} mitra masyarakat binaan
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs font-bold">
                <Link to="/pengabdian" className="text-violet-700 hover:text-violet-900 inline-flex items-center gap-1">
                  Daftar <ArrowRightIcon className="w-3 h-3" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="bg-white border border-[#CBD5E1] rounded-[14px] p-5 shadow-xs hover:border-violet-400 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Publikasi &amp; Jurnal</span>
                <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center">
                  <BookOpenIcon className="w-4 h-4" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-slate-900">{angkaId(totalPublikasi)}</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {jenisPublikasi.length} jenis luaran terindeks
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs font-bold">
                <Link to="/publikasi" className="text-violet-700 hover:text-violet-900 inline-flex items-center gap-1">
                  Daftar <ArrowRightIcon className="w-3 h-3" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="bg-white border border-[#CBD5E1] rounded-[14px] p-5 shadow-xs hover:border-violet-400 transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monev</span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                  <ClipboardDocumentCheckIcon className="w-4 h-4" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-slate-900">{angkaId(totalMonev)}</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  <span className="font-semibold text-amber-700">{ringkasan?.monevJadwalMendatang ?? 0} jadwal</span> dalam 30 hari
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-xs font-bold">
                <Link to="/monev" className="text-violet-700 hover:text-violet-900 inline-flex items-center gap-1">
                  Daftar <ArrowRightIcon className="w-3 h-3" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          {/* Ringkasan anggaran & capaian monev */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#CBD5E1] rounded-[14px] p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dana Disetujui</span>
                <BanknotesIcon className="w-4 h-4 text-amber-600" aria-hidden="true" />
              </div>
              <p className="mt-1.5 text-lg font-extrabold text-slate-900 tabular-nums">
                Rp {angkaId(danaDisetujui)}
              </p>
              <p className="text-[11px] text-slate-400">Akumulasi penelitian &amp; PKM</p>
            </div>
            <div className="bg-white border border-[#CBD5E1] rounded-[14px] p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Kegiatan Tridharma</span>
                <DocumentTextIcon className="w-4 h-4 text-violet-700" aria-hidden="true" />
              </div>
              <p className="mt-1.5 text-lg font-extrabold text-slate-900 tabular-nums">{angkaId(totalKegiatan)}</p>
              <p className="text-[11px] text-slate-400">Penelitian + pengabdian</p>
            </div>
            <div className="bg-white border border-[#CBD5E1] rounded-[14px] p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rata Kemajuan Monev</span>
                <ArrowTrendingUpIcon className="w-4 h-4 text-violet-700" aria-hidden="true" />
              </div>
              <p className="mt-1.5 text-lg font-extrabold text-slate-900 tabular-nums">
                {ringkasan?.monevRataKemajuan ?? 0}%
              </p>
              <p className="text-[11px] text-slate-400">{ringkasan?.monevDinilai ?? 0} kegiatan dinilai reviewer</p>
            </div>
            <div className="bg-white border border-[#CBD5E1] rounded-[14px] p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Serapan Dana Monev</span>
                <CalendarDaysIcon className="w-4 h-4 text-amber-600" aria-hidden="true" />
              </div>
              <p className="mt-1.5 text-lg font-extrabold text-slate-900 tabular-nums">
                {ringkasan?.monevRataSerapanDana ?? 0}%
              </p>
              <p className="text-[11px] text-slate-400">Rata-rata realisasi anggaran</p>
            </div>
          </div>

          {/* 6. LAPORAN CHART */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ReportCard
              title="Laporan Alur Status Penelitian"
              subtitle="Proporsi status seluruh proposal riset dosen"
            >
              {statusPenelitian.length ? (
                <DonutChart
                  data={statusPenelitian}
                  centerLabel="Proposal"
                  centerValue={totalPenelitian}
                />
              ) : (
                <p className="text-xs text-slate-500">Belum ada data penelitian tercatat.</p>
              )}
            </ReportCard>

            <ReportCard
              title="Laporan Komposisi Tridharma"
              subtitle="Perbandingan kegiatan riset, PKM, dan luaran publikasi"
            >
              <div className="space-y-4">
                <StackedBar data={komposisiTridharma} />
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <GaugeRing
                    value={totalPenelitian}
                    total={Math.max(totalKegiatan, 1)}
                    label="Riset"
                    color="#6D28D9"
                    size={88}
                  />
                  <GaugeRing
                    value={totalPengabdian}
                    total={Math.max(totalKegiatan, 1)}
                    label="PKM"
                    color="#D97706"
                    size={88}
                  />
                  <GaugeRing
                    value={totalMonev}
                    total={Math.max(totalKegiatan, 1)}
                    label="Termonev"
                    color="#2563EB"
                    size={88}
                  />
                </div>
              </div>
            </ReportCard>

            <ReportCard
              title="Laporan Volume Kegiatan per Tahun"
              subtitle="Jumlah penelitian + pengabdian lima tahun terakhir"
            >
              {trenTahunan.length ? (
                <ColumnChart data={trenTahunan} color="#6D28D9" unit=" kegiatan" />
              ) : (
                <p className="text-xs text-slate-500">Belum ada data tahunan.</p>
              )}
            </ReportCard>

            <ReportCard
              title="Laporan Bidang Fokus Riset"
              subtitle="Konsentrasi keilmuan proposal penelitian"
            >
              {bidangFokus.length ? (
                <BarChart data={bidangFokus} unit=" proposal" />
              ) : (
                <p className="text-xs text-slate-500">Belum ada data bidang fokus.</p>
              )}
            </ReportCard>

            <ReportCard
              title="Laporan Volume Publikasi per Tahun"
              subtitle="Produktivitas luaran ilmiah dosen per tahun terbit"
            >
              {trenPublikasi.length ? (
                <ColumnChart data={trenPublikasi} color="#D97706" unit=" artikel" />
              ) : (
                <p className="text-xs text-slate-500">Belum ada data publikasi tahunan.</p>
              )}
            </ReportCard>

            <ReportCard
              title="Laporan Jenis Luaran Publikasi"
              subtitle="Sebaran jurnal, prosiding, dan buku"
            >
              {jenisPublikasi.length ? (
                <BarChart data={jenisPublikasi} unit=" artikel" />
              ) : (
                <p className="text-xs text-slate-500">Belum ada data publikasi tercatat.</p>
              )}
            </ReportCard>

            <ReportCard
              title="Laporan Akreditasi Publikasi"
              subtitle="Sebaran capaian SINTA/Scopus artikel dosen"
            >
              {sintaPublikasi.length ? (
                <DonutChart
                  data={sintaPublikasi}
                  centerLabel="Artikel"
                  centerValue={totalPublikasi}
                />
              ) : (
                <p className="text-xs text-slate-500">Belum ada capaian akreditasi tercatat.</p>
              )}
            </ReportCard>

            <ReportCard
              title="Laporan Mitra Pengabdian"
              subtitle="Kemitraan PKM dengan masyarakat & lembaga"
            >
              {mitraPengabdian.length ? (
                <BarChart data={mitraPengabdian} unit=" kegiatan" />
              ) : (
                <p className="text-xs text-slate-500">Belum ada data mitra pengabdian.</p>
              )}
            </ReportCard>

            <ReportCard
              title="Laporan Monitoring & Evaluasi"
              subtitle="Progres tahapan monev kegiatan tridharma"
            >
              {statusMonev.length ? (
                <DonutChart
                  data={statusMonev}
                  centerLabel="Monev"
                  centerValue={totalMonev}
                />
              ) : (
                <p className="text-xs text-slate-500">Belum ada data monev tercatat.</p>
              )}
            </ReportCard>

            <ReportCard
              title="Laporan Sumber Dana Riset"
              subtitle="Asal pendanaan penelitian dosen"
            >
              {sumberDana.length ? (
                <BarChart data={sumberDana} unit=" proposal" />
              ) : (
                <p className="text-xs text-slate-500">Belum ada data sumber dana.</p>
              )}
            </ReportCard>

            <ReportCard
              title="Laporan Capaian Program"
              subtitle="Rasio luaran publikasi dan cakupan monev"
            >
              <div className="flex items-center justify-around gap-2 py-2">
                <GaugeRing
                  value={totalPublikasi}
                  total={Math.max(totalKegiatan, 1)}
                  label="Rasio Publikasi"
                  color="#6D28D9"
                  size={116}
                />
                <GaugeRing
                  value={totalMonev}
                  total={Math.max(totalKegiatan, 1)}
                  label="Cakupan Monev"
                  color="#D97706"
                  size={116}
                />
              </div>
            </ReportCard>
          </div>

          {/* 7. DAFTAR TERBARU */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ReportCard
              title="Penelitian Terbaru"
              subtitle="5 proposal riset terakhir yang tercatat"
              action={
                <Link
                  to="/penelitian"
                  className="text-xs font-bold text-violet-700 hover:text-violet-900 min-h-[44px] inline-flex items-center"
                >
                  Lihat Semua
                </Link>
              }
            >
              {penelitianTerbaru.length === 0 ? (
                <p className="text-xs text-slate-500">Belum ada proposal penelitian tercatat.</p>
              ) : (
                <ul className="space-y-3">
                  {penelitianTerbaru.map((item) => (
                    <li
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-violet-300 transition-colors bg-slate-50/50 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2" title={item.judul}>
                          {item.judul}
                        </h4>
                        <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <UserIcon className="w-3 h-3" aria-hidden="true" />
                          <span className="font-medium text-slate-700 truncate max-w-[160px]">{item.ketua}</span>
                          <span className="text-slate-400">&middot; {item.bidangFokus}</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <StatusBadge status={item.status} />
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.tahun} &middot; {tanggalId(item.createdAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ReportCard>

            <ReportCard
              title="Publikasi Terbaru"
              subtitle="5 luaran ilmiah terakhir yang dicatat"
              action={
                <Link
                  to="/publikasi"
                  className="text-xs font-bold text-violet-700 hover:text-violet-900 min-h-[44px] inline-flex items-center"
                >
                  Lihat Semua
                </Link>
              }
            >
              {publikasiTerbaru.length === 0 ? (
                <p className="text-xs text-slate-500">Belum ada luaran publikasi tercatat.</p>
              ) : (
                <ul className="space-y-3">
                  {publikasiTerbaru.map((item) => (
                    <li
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-violet-300 transition-colors bg-slate-50/50 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2" title={item.judul}>
                          {item.judul}
                        </h4>
                        <p className="mt-1 text-[11px] text-slate-500 truncate">
                          <span className="font-medium text-slate-700">{item.penulis}</span>
                          {' · '}
                          <em className="text-slate-600">{item.namaJurnal}</em>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-900">
                          <CheckCircleIcon className="w-3 h-3" aria-hidden="true" />
                          {item.jenis}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.sintaScore || 'Tanpa akreditasi'} &middot; {item.tahun}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ReportCard>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
