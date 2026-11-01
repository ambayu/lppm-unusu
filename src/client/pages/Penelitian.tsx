import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPenelitian, deletePenelitian, PenelitianItem } from '../services/api';
import { AdminPanelTemplate } from '../components/AdminPanelTemplate';
import { CardContainer } from '../components/CardContainer';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import {
  BeakerIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

export const PenelitianPage: React.FC = () => {
  const [list, setList] = useState<PenelitianItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedBidangFokus, setSelectedBidangFokus] = useState('SEMUA');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchPenelitian()
      .then((res) => {
        const rawData = res.data?.data;
        setList(Array.isArray(rawData) ? rawData : []);
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || 'Gagal memuat data penelitian.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number, judul?: string) => {
    if (!window.confirm(`Yakin ingin menghapus proposal penelitian "${judul || 'ini'}"?`)) return;
    setDeletingId(id);
    try {
      await deletePenelitian(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus penelitian');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredList = list.filter((item) => {
    if (!item) return false;
    const q = (search || '').trim().toLowerCase();
    const judul = String(item.judul || '').toLowerCase();
    const ketua = String(item.ketua || '').toLowerCase();
    const nidn = String(item.nidn || '').toLowerCase();
    const bidangFokus = String(item.bidangFokus || '').toLowerCase();
    const sumberDana = String(item.sumberDana || '').toLowerCase();

    const matchSearch =
      !q ||
      judul.includes(q) ||
      ketua.includes(q) ||
      nidn.includes(q) ||
      bidangFokus.includes(q) ||
      sumberDana.includes(q);

    const matchBidang =
      selectedBidangFokus === 'SEMUA' ||
      bidangFokus.includes(selectedBidangFokus.toLowerCase());

    return matchSearch && matchBidang;
  });

  // KPI Calculations
  const totalPenelitian = list.length;
  const countIT = list.filter((p) => {
    const bf = String(p?.bidangFokus || '').toLowerCase();
    return bf.includes('teknologi') || bf.includes('ai');
  }).length;
  const countPendidikan = list.filter((p) => {
    const bf = String(p?.bidangFokus || '').toLowerCase();
    return bf.includes('pendidikan') || bf.includes('aswaja');
  }).length;
  const totalDana = list.reduce((acc, curr) => {
    const val = Number(curr?.danaDisetujui);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const handleExportExcel = () => {
    if (filteredList.length === 0) {
      alert('Tidak ada data penelitian untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'Judul Penelitian',
      'Bidang Fokus',
      'Ketua Peneliti',
      'NIDN',
      'Anggota Peneliti',
      'Sumber Dana',
      'Dana Disetujui (Rp)',
      'Tahun',
      'Status',
      'Tanggal Dibuat',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredList.map((item, idx) => [
      idx + 1,
      escapeCsv(item?.judul || '-'),
      escapeCsv(item?.bidangFokus || '-'),
      escapeCsv(item?.ketua || '-'),
      escapeCsv(item?.nidn ? `\t${item.nidn}` : '-'),
      escapeCsv(item?.anggota || '-'),
      escapeCsv(item?.sumberDana || '-'),
      item?.danaDisetujui ? Number(item.danaDisetujui) : 0,
      item?.tahun || '-',
      escapeCsv(item?.status || '-'),
      escapeCsv(item?.createdAt ? String(item.createdAt).substring(0, 10) : '-'),
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `data-penelitian-lppm-unusu-${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AdminPanelTemplate
      title="Pangkalan Data Penelitian Dosen"
      description="Kelola usulan hibah, pemantauan kemajuan riset, dan pelaporan luaran penelitian civitas akademika UNUSU."
      actions={
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center justify-center p-2.5 h-[42px] w-[42px] rounded-[12px] border border-[#CBD5E1] bg-white text-slate-600 hover:text-violet-900 hover:bg-[#F3EEF9] transition-colors cursor-pointer shadow-2xs"
            title="Segarkan Data"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportExcel}
            disabled={loading || filteredList.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 h-[42px] rounded-[12px] border border-emerald-600 bg-white hover:bg-emerald-50 text-emerald-700 text-sm font-bold transition-all shadow-2xs hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Export Data ke Excel (.csv)"
          >
            <ArrowDownTrayIcon className="w-5 h-5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <Link
            to="/penelitian/tambah"
            className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 h-[42px] rounded-[12px] bg-violet-700 hover:bg-violet-800 text-white text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
          >
            <PlusIcon className="w-5 h-5 text-amber-400" />
            <span>Tambah Penelitian</span>
          </Link>
        </div>
      }
    >
      {/* 1. KPI Cards Row (Part 10.8 standard) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Judul Riset</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalPenelitian}</p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-violet-50 text-violet-700 flex items-center justify-center">
            <BeakerIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Teknologi & AI</p>
            <p className="mt-1 text-2xl font-bold text-violet-700">{countIT}</p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-xs">
            IT
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Pendidikan & Aswaja</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{countPendidikan}</p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
            EDU
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Alokasi Hibah</p>
            <p className="mt-1 text-lg sm:text-xl font-bold text-slate-900">
              Rp {totalDana.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
            IDR
          </div>
        </div>
      </div>

      {/* 2. Filter & Pencarian Bar */}
      <CardContainer>
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari judul riset, nama ketua peneliti, NIDN, atau bidang fokus..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] border border-[#CBD5E1] bg-slate-50 text-xs font-semibold text-slate-600 flex-shrink-0">
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
              <span>Bidang Fokus:</span>
            </div>
            <select
              value={selectedBidangFokus}
              onChange={(e) => setSelectedBidangFokus(e.target.value)}
              className="px-3 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-violet-600 transition-colors"
            >
              <option value="SEMUA">Semua Bidang</option>
              <option value="Teknologi Informasi">Teknologi Informasi</option>
              <option value="Kecerdasan Buatan (AI)">Kecerdasan Buatan (AI)</option>
              <option value="Pendidikan & Aswaja">Pendidikan & Aswaja</option>
              <option value="Sosial Humaniora">Sosial Humaniora</option>
              <option value="Pertanian & Ketahanan Pangan">Pertanian & Ketahanan Pangan</option>
              <option value="Kesehatan & Gizi">Kesehatan & Gizi</option>
            </select>
          </div>
        </div>
      </CardContainer>

      {/* 3. Data Table dengan Horizontal Scroll & Audit Trail */}
      <CardContainer
        title="Daftar Proposal & Luaran Penelitian"
        subtitle={`Menampilkan ${filteredList.length} dari total ${list.length} data penelitian terdaftar`}
      >
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <ArrowPathIcon className="w-8 h-8 mx-auto animate-spin text-violet-700 mb-2" />
            <p className="text-sm font-semibold">Memuat data penelitian...</p>
          </div>
        ) : error ? (
          <ErrorState description={error} onRetry={loadData} />
        ) : filteredList.length === 0 ? (
          <EmptyState
            title="Tidak Ada Data Penelitian"
            description={
              search || selectedBidangFokus !== 'SEMUA'
                ? 'Tidak ditemukan penelitian yang cocok dengan kriteria pencarian Anda.'
                : 'Belum ada proposal penelitian tercatat di pangkalan LPPM.'
            }
            action={
              <Link
                to="/penelitian/tambah"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-violet-700 text-white text-xs font-bold hover:bg-violet-800 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Tambah Sekarang</span>
              </Link>
            }
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[#CBD5E1] text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                  <th className="py-3 px-3.5 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[280px]">Judul Penelitian & Bidang Fokus</th>
                  <th className="py-3 px-4 min-w-[190px]">Ketua & NIDN</th>
                  <th className="py-3 px-4 min-w-[150px]">Sumber Dana</th>
                  <th className="py-3 px-4 min-w-[140px] text-right">Dana Disetujui</th>
                  <th className="py-3 px-4 min-w-[100px] text-center">Tahun / Status</th>
                  <th className="py-3 px-4 min-w-[120px]">Dibuat</th>
                  <th className="py-3 px-4 w-28 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-[13px]">
                {filteredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-violet-50/30 transition-colors">
                    <td className="py-3.5 px-3.5 text-center text-slate-400 font-mono text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 leading-snug">{item.judul}</div>
                      <div className="text-[11px] text-violet-700 font-medium mt-1">
                        Fokus: {item.bidangFokus}
                      </div>
                      {item.anggota && (
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-md">
                          Anggota: {item.anggota}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{item.ketua}</div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        NIDN: {item.nidn}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{item.sumberDana}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {item.danaDisetujui
                        ? `Rp ${Number(item.danaDisetujui).toLocaleString('id-ID')}`
                        : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="font-mono font-bold text-slate-800">{item.tahun}</div>
                      <div className="text-[11px] font-semibold text-violet-700 mt-0.5">
                        {item.status}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono">
                      {/* Audit trail CreatedAt */}
                      {item.createdAt ? String(item.createdAt).substring(0, 10) : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          to={`/penelitian/edit/${item.id}`}
                          className="p-1.5 rounded-[8px] border border-[#CBD5E1] bg-white text-slate-600 hover:text-violet-700 hover:bg-violet-50 transition-colors shadow-2xs"
                          title="Edit Penelitian"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id, item.judul)}
                          disabled={deletingId === item.id}
                          className="p-1.5 rounded-[8px] border border-[#CBD5E1] bg-white text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer"
                          title="Hapus Penelitian"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContainer>
    </AdminPanelTemplate>
  );
};
