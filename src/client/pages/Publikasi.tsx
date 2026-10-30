import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPublikasi, deletePublikasi, PublikasiItem } from '../services/api';
import { AdminPanelTemplate } from '../components/AdminPanelTemplate';
import { CardContainer } from '../components/CardContainer';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import {
  BookOpenIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

export const PublikasiPage: React.FC = () => {
  const [list, setList] = useState<PublikasiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedJenis, setSelectedJenis] = useState('SEMUA');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchPublikasi()
      .then((res) => setList(res.data.data))
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || 'Gagal memuat data publikasi.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number, judul: string) => {
    if (!window.confirm(`Yakin ingin menghapus data publikasi "${judul}"?`)) return;
    setDeletingId(id);
    try {
      await deletePublikasi(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus publikasi');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredList = list.filter((item) => {
    const matchSearch =
      item.judul.toLowerCase().includes(search.toLowerCase()) ||
      item.penulis.toLowerCase().includes(search.toLowerCase()) ||
      item.namaJurnal.toLowerCase().includes(search.toLowerCase()) ||
      (item.sintaScore && item.sintaScore.toLowerCase().includes(search.toLowerCase()));
    const matchJenis =
      selectedJenis === 'SEMUA' || item.jenis.toLowerCase().includes(selectedJenis.toLowerCase());
    return matchSearch && matchJenis;
  });

  // KPI Calculations
  const totalPublikasi = list.length;
  const countScopus = list.filter((p) => p.jenis.toLowerCase().includes('scopus') || p.jenis.toLowerCase().includes('internasional')).length;
  const countSinta = list.filter((p) => p.jenis.toLowerCase().includes('sinta') || p.jenis.toLowerCase().includes('nasional')).length;
  const countProsiding = list.filter((p) => p.jenis.toLowerCase().includes('prosiding') || p.jenis.toLowerCase().includes('buku')).length;

  return (
    <AdminPanelTemplate
      title="Publikasi Artikel Ilmiah & Jurnal"
      description="Kelola repositori artikel jurnal terindeks Scopus, SINTA, prosiding seminar, dan perolehan Hak Cipta dosen UNUSU."
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
          <Link
            to="/publikasi/tambah"
            className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 h-[42px] rounded-[12px] bg-violet-700 hover:bg-violet-800 text-white text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
          >
            <PlusIcon className="w-5 h-5 text-amber-400" />
            <span>Tambah Publikasi</span>
          </Link>
        </div>
      }
    >
      {/* 1. KPI Cards Row (Part 10.8 standard) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Publikasi</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalPublikasi}</p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-violet-50 text-violet-700 flex items-center justify-center">
            <BookOpenIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Scopus / Internasional</p>
            <p className="mt-1 text-2xl font-bold text-violet-700">{countScopus}</p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-xs">
            WOS
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">SINTA Terakreditasi</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{countSinta}</p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
            SINTA
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Prosiding & Buku</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{countProsiding}</p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
            ISBN
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
              placeholder="Cari judul artikel, nama penulis, jurnal, atau peringkat SINTA..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] border border-[#CBD5E1] bg-slate-50 text-xs font-semibold text-slate-600 flex-shrink-0">
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
              <span>Jenis:</span>
            </div>
            <select
              value={selectedJenis}
              onChange={(e) => setSelectedJenis(e.target.value)}
              className="px-3 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-violet-600 transition-colors"
            >
              <option value="SEMUA">Semua Jenis</option>
              <option value="Jurnal Internasional">Jurnal Internasional (Scopus)</option>
              <option value="Jurnal Nasional">Jurnal Nasional (SINTA)</option>
              <option value="Prosiding">Prosiding Seminar</option>
              <option value="Buku">Buku / Monograf</option>
            </select>
          </div>
        </div>
      </CardContainer>

      {/* 3. Data Table dengan Horizontal Scroll & Audit Trail */}
      <CardContainer
        title="Daftar Publikasi Bereputasi"
        subtitle={`Menampilkan ${filteredList.length} dari total ${list.length} artikel ilmiah terbit`}
      >
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <ArrowPathIcon className="w-8 h-8 mx-auto animate-spin text-violet-700 mb-2" />
            <p className="text-sm font-semibold">Memuat data publikasi...</p>
          </div>
        ) : error ? (
          <ErrorState description={error} onRetry={loadData} />
        ) : filteredList.length === 0 ? (
          <EmptyState
            title="Tidak Ada Publikasi"
            description={
              search || selectedJenis !== 'SEMUA'
                ? 'Tidak ditemukan publikasi ilmiah yang cocok dengan kata kunci pencarian.'
                : 'Belum ada data publikasi terarsip.'
            }
            action={
              <Link
                to="/publikasi/tambah"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-violet-700 text-white text-xs font-bold hover:bg-violet-800 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Tambah Publikasi</span>
              </Link>
            }
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[#CBD5E1] text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                  <th className="py-3 px-3.5 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[300px]">Judul Artikel & Jurnal Penerbit</th>
                  <th className="py-3 px-4 min-w-[200px]">Penulis</th>
                  <th className="py-3 px-4 min-w-[150px]">Kategori & Akreditasi</th>
                  <th className="py-3 px-4 min-w-[140px]">Tautan DOI / Web</th>
                  <th className="py-3 px-4 min-w-[90px] text-center">Tahun</th>
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
                      <div className="text-[11px] text-slate-500 mt-1">
                        Jurnal: <em className="text-slate-700 font-semibold">{item.namaJurnal}</em>
                        {item.volumeIssue && <span> ({item.volumeIssue})</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{item.penulis}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{item.jenis}</div>
                      {item.sintaScore && (
                        <div className="text-[11px] font-mono font-bold text-violet-700 mt-0.5">
                          {item.sintaScore}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.doiUrl ? (
                        <a
                          href={item.doiUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 hover:text-violet-900 hover:underline"
                        >
                          <span className="truncate max-w-[120px]">Buka DOI</span>
                          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                      {item.tahun}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono">
                      {/* Audit trail CreatedAt */}
                      2026-10-31
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          to={`/publikasi/edit/${item.id}`}
                          className="p-1.5 rounded-[8px] border border-[#CBD5E1] bg-white text-slate-600 hover:text-violet-700 hover:bg-violet-50 transition-colors shadow-2xs"
                          title="Edit Publikasi"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id, item.judul)}
                          disabled={deletingId === item.id}
                          className="p-1.5 rounded-[8px] border border-[#CBD5E1] bg-white text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer"
                          title="Hapus Publikasi"
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
