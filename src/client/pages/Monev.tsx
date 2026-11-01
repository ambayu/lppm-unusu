import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchMonev,
  deleteMonev,
  MonevItem,
  JenisProgramMonev,
  TahapMonev,
  StatusMonev,
} from '../services/api';
import { AdminPanelTemplate } from '../components/AdminPanelTemplate';
import { CardContainer } from '../components/CardContainer';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import {
  ClipboardDocumentCheckIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  UserIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

export const MonevPage: React.FC = () => {
  const [list, setList] = useState<MonevItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedJenis, setSelectedJenis] = useState<string>('SEMUA');
  const [selectedTahap, setSelectedTahap] = useState<string>('SEMUA');
  const [selectedStatus, setSelectedStatus] = useState<string>('SEMUA');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchMonev({
      search: search || undefined,
      jenisProgram: selectedJenis !== 'SEMUA' ? selectedJenis : undefined,
      tahap: selectedTahap !== 'SEMUA' ? selectedTahap : undefined,
      status: selectedStatus !== 'SEMUA' ? selectedStatus : undefined,
    })
      .then((res) => {
        setList(res.data.data || []);
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || 'Gagal memuat agenda monitoring & evaluasi.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [selectedJenis, selectedTahap, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleDelete = async (id: number, kode: string) => {
    if (!window.confirm(`Yakin ingin menghapus agenda Monev "${kode}"?`)) return;
    setDeletingId(id);
    try {
      await deleteMonev(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus data monev');
    } finally {
      setDeletingId(null);
    }
  };

  // KPI Calculations
  const totalAgenda = list.length;
  const countPenelitian = list.filter((m) => m.jenisProgram === 'PENELITIAN').length;
  const countPengabdian = list.filter((m) => m.jenisProgram === 'PENGABDIAN').length;
  const avgKemajuan =
    totalAgenda > 0
      ? Math.round(list.reduce((acc, curr) => acc + (curr.persentaseKemajuan || 0), 0) / totalAgenda)
      : 0;

  const handleExportCsv = () => {
    if (list.length === 0) {
      alert('Tidak ada data monev untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'Kode Monev',
      'Program',
      'Judul Kegiatan / Usulan',
      'Tahap',
      'Reviewer',
      'NIDN Reviewer',
      'Tanggal Jadwal',
      'Tanggal Monev',
      'Lokasi',
      'Kemajuan (%)',
      'Serapan Dana (%)',
      'Skor Substansi',
      'Status',
      'Rekomendasi',
      'Dibuat Pada',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = list.map((item, idx) => {
      const judul =
        item.jenisProgram === 'PENELITIAN'
          ? item.penelitian?.judul || '-'
          : item.pengabdian?.judul || '-';

      return [
        idx + 1,
        escapeCsv(item.kodeMonev),
        escapeCsv(item.jenisProgram),
        escapeCsv(judul),
        escapeCsv(item.tahap),
        escapeCsv(item.namaReviewer),
        escapeCsv(item.nidnReviewer ? `\t${item.nidnReviewer}` : '-'),
        escapeCsv(item.tanggalJadwal ? item.tanggalJadwal.substring(0, 10) : '-'),
        escapeCsv(item.tanggalMonev ? item.tanggalMonev.substring(0, 10) : '-'),
        escapeCsv(item.lokasiMonev || '-'),
        item.persentaseKemajuan,
        item.persentaseDanaTerpakai,
        item.skorSubstansi ?? '-',
        escapeCsv(item.status),
        escapeCsv(item.rekomendasi || '-'),
        escapeCsv(item.createdAt ? item.createdAt.substring(0, 10) : '-'),
      ];
    });

    const csvContent =
      '\uFEFF' +
      [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `LPPM_UNUSU_Monev_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTahapBadge = (tahap: TahapMonev) => {
    switch (tahap) {
      case 'MONEV_ANTARA':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'MONEV_AKHIR':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'MONEV_LAPANGAN':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatStatusBadge = (status: StatusMonev) => {
    switch (status) {
      case 'DISETUJUI':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'SEDANG_DITELAAH':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'PERLU_REVISI':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DITOLAK':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'DIJADWALKAN':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <AdminPanelTemplate
      title="Monitoring & Evaluasi (Monev)"
      description="Instrumen pemantauan kemajuan riset dosen dan pengabdian masyarakat UNUSU serta penilaian luaran berkala."
      actions={
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 h-[42px] rounded-[12px] border border-[#CBD5E1] bg-white text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
            title="Ekspor CSV"
          >
            <ArrowDownTrayIcon className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>
          <Link
            to="/monev/tambah"
            className="inline-flex items-center gap-2 px-4 py-2.5 h-[42px] rounded-[12px] bg-violet-700 hover:bg-violet-800 text-white text-xs sm:text-sm font-bold transition-all shadow-2xs hover:shadow-md cursor-pointer"
          >
            <PlusIcon className="w-4 h-4 stroke-[2.5]" />
            <span>Jadwal Monev Baru</span>
          </Link>
        </div>
      }
    >
      {/* 1. KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-[16px] bg-white border border-[#CBD5E1] shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[12px] bg-[#EDE8F5] flex items-center justify-center text-violet-700 flex-shrink-0">
            <ClipboardDocumentCheckIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Agenda Monev
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalAgenda}</div>
          </div>
        </div>

        <div className="p-4 rounded-[16px] bg-white border border-[#CBD5E1] shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[12px] bg-blue-50 flex items-center justify-center text-blue-700 flex-shrink-0">
            <ClipboardDocumentCheckIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Monev Penelitian
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{countPenelitian}</div>
          </div>
        </div>

        <div className="p-4 rounded-[16px] bg-white border border-[#CBD5E1] shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[12px] bg-emerald-50 flex items-center justify-center text-emerald-700 flex-shrink-0">
            <ClipboardDocumentCheckIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Monev Pengabdian
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{countPengabdian}</div>
          </div>
        </div>

        <div className="p-4 rounded-[16px] bg-white border border-[#CBD5E1] shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[12px] bg-amber-50 flex items-center justify-center text-amber-700 flex-shrink-0">
            <ChartBarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Rata-rata Kemajuan
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{avgKemajuan}%</div>
          </div>
        </div>
      </div>

      {/* 2. Filter & Pencarian */}
      <CardContainer className="mb-6">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Input Pencarian */}
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kode, reviewer, atau catatan..."
                className="w-full pl-10 pr-3.5 py-2 rounded-[12px] border border-[#CBD5E1] bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition"
              />
            </div>

            {/* Filter Jenis Program */}
            <div className="relative">
              <select
                value={selectedJenis}
                onChange={(e) => setSelectedJenis(e.target.value)}
                className="w-full px-3.5 py-2 rounded-[12px] border border-[#CBD5E1] bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition"
              >
                <option value="SEMUA">Semua Program Tridharma</option>
                <option value="PENELITIAN">Riset & Penelitian</option>
                <option value="PENGABDIAN">Pengabdian Masyarakat (PKM)</option>
              </select>
            </div>

            {/* Filter Tahap Monev */}
            <div className="relative">
              <select
                value={selectedTahap}
                onChange={(e) => setSelectedTahap(e.target.value)}
                className="w-full px-3.5 py-2 rounded-[12px] border border-[#CBD5E1] bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition"
              >
                <option value="SEMUA">Semua Tahap Monev</option>
                <option value="MONEV_ANTARA">Monev Antara (Kemajuan)</option>
                <option value="MONEV_AKHIR">Monev Akhir (Pasca)</option>
                <option value="MONEV_LAPANGAN">Monev Lapangan (Visitasi)</option>
              </select>
            </div>

            {/* Filter Status Monev */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3.5 py-2 rounded-[12px] border border-[#CBD5E1] bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition"
              >
                <option value="SEMUA">Semua Status Monev</option>
                <option value="DIJADWALKAN">Dijadwalkan</option>
                <option value="SEDANG_DITELAAH">Sedang Ditelaah</option>
                <option value="PERLU_REVISI">Perlu Revisi</option>
                <option value="DISETUJUI">Disetujui / Lolos</option>
                <option value="DITOLAK">Ditolak / Gagal</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <AdjustmentsHorizontalIcon className="w-4 h-4 text-violet-700" />
              <span>Gunakan filter untuk menyeleksi jadwal monev Tridharma UNUSU</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setSelectedJenis('SEMUA');
                  setSelectedTahap('SEMUA');
                  setSelectedStatus('SEMUA');
                }}
                className="px-3 py-1.5 rounded-[10px] border border-[#CBD5E1] bg-white text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer font-medium"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-[10px] bg-violet-700 hover:bg-violet-800 text-white text-xs font-bold transition cursor-pointer"
              >
                Terapkan
              </button>
            </div>
          </div>
        </form>
      </CardContainer>

      {/* 3. Data Table dengan Horizontal Scroll & Audit Trail */}
      <CardContainer
        title="Daftar Jadwal & Catatan Evaluasi Monev"
        subtitle={`Menampilkan ${list.length} rekaman agenda monitoring & evaluasi`}
      >
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <ArrowPathIcon className="w-8 h-8 mx-auto animate-spin text-violet-700 mb-2" />
            <p className="text-sm font-semibold">Memuat data monitoring evaluasi...</p>
          </div>
        ) : error ? (
          <ErrorState description={error} onRetry={loadData} />
        ) : list.length === 0 ? (
          <EmptyState
            title="Tidak Ada Agenda Monev"
            description={
              search || selectedJenis !== 'SEMUA' || selectedStatus !== 'SEMUA'
                ? 'Tidak ditemukan agenda monev yang cocok dengan kriteria filter Anda.'
                : 'Belum ada agenda monitoring & evaluasi riset yang dijadwalkan.'
            }
            action={
              <Link
                to="/monev/tambah"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-violet-700 text-white text-xs font-bold hover:bg-violet-800 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Jadwalkan Sekarang</span>
              </Link>
            }
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[#CBD5E1] text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                  <th className="py-3 px-3.5 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[160px]">Kode & Program</th>
                  <th className="py-3 px-4 min-w-[280px]">Judul Kegiatan & Tim Pengusul</th>
                  <th className="py-3 px-4 min-w-[180px]">Reviewer & Jadwal</th>
                  <th className="py-3 px-4 min-w-[130px] text-center">Kemajuan & Serapan</th>
                  <th className="py-3 px-4 min-w-[130px] text-center">Status / Skor</th>
                  <th className="py-3 px-4 min-w-[110px]">Dibuat</th>
                  <th className="py-3 px-4 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-[13px]">
                {list.map((item, idx) => {
                  const judul =
                    item.jenisProgram === 'PENELITIAN'
                      ? item.penelitian?.judul || 'Proposal Penelitian Belum Terpaut'
                      : item.pengabdian?.judul || 'Kegiatan Pengabdian Belum Terpaut';

                  const ketua =
                    item.jenisProgram === 'PENELITIAN'
                      ? item.penelitian?.ketua || '-'
                      : item.pengabdian?.ketua || '-';

                  const nidn =
                    item.jenisProgram === 'PENELITIAN'
                      ? item.penelitian?.nidn || '-'
                      : item.pengabdian?.nidn || '-';

                  return (
                    <tr key={item.id} className="hover:bg-violet-50/30 transition-colors">
                      <td className="py-3.5 px-3.5 text-center text-slate-400 font-mono text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-violet-800">{item.kodeMonev}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.jenisProgram === 'PENELITIAN'
                                ? 'bg-violet-50 text-violet-700 border-violet-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {item.jenisProgram}
                          </span>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${formatTahapBadge(
                              item.tahap
                            )}`}
                          >
                            {item.tahap.replace('MONEV_', '')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 leading-snug line-clamp-2">
                          {judul}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                          <span className="font-semibold text-slate-700">{ketua}</span>
                          <span>•</span>
                          <span className="font-mono">NIDN: {nidn}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{item.namaReviewer}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                          <CalendarDaysIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>
                            {item.tanggalJadwal
                              ? new Date(item.tanggalJadwal).toLocaleDateString('id-ID', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '-'}
                          </span>
                        </div>
                        {item.lokasiMonev && (
                          <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                            {item.lokasiMonev}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col gap-1 items-center">
                          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                            <div
                              className="bg-violet-600 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, item.persentaseKemajuan || 0)}%` }}
                            />
                          </div>
                          <div className="text-[10px] font-semibold text-slate-600 font-mono">
                            Kemajuan: {item.persentaseKemajuan}% | Dana: {item.persentaseDanaTerpakai}%
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${formatStatusBadge(
                            item.status
                          )}`}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                        <div className="text-[11px] font-mono font-bold text-slate-700 mt-1">
                          {item.skorSubstansi ? `Skor: ${item.skorSubstansi}` : 'Skor: -'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono">
                        {item.createdAt ? item.createdAt.substring(0, 10) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            to={`/monev/edit/${item.id}`}
                            className="p-1.5 rounded-[8px] border border-[#CBD5E1] bg-white text-slate-600 hover:text-violet-700 hover:bg-violet-50 transition-colors shadow-2xs"
                            title="Edit Monev"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(item.id, item.kodeMonev)}
                            disabled={deletingId === item.id}
                            className="p-1.5 rounded-[8px] border border-[#CBD5E1] bg-white text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer"
                            title="Hapus Monev"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContainer>
    </AdminPanelTemplate>
  );
};
