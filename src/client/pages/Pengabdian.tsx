import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPengabdian, deletePengabdian, PengabdianItem } from '../services/api';
import { AdminPanelTemplate } from '../components/AdminPanelTemplate';
import { CardContainer } from '../components/CardContainer';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import {
  HeartIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

export const PengabdianPage: React.FC = () => {
  const [list, setList] = useState<PengabdianItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('SEMUA');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchPengabdian()
      .then((res) => setList(res.data.data))
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || 'Gagal memuat data pengabdian.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: number, judul: string) => {
    if (!window.confirm(`Yakin ingin menghapus kegiatan PKM "${judul}"?`)) return;
    setDeletingId(id);
    try {
      await deletePengabdian(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus kegiatan PKM');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredList = list.filter((item) => {
    const matchSearch =
      item.judul.toLowerCase().includes(search.toLowerCase()) ||
      item.ketua.toLowerCase().includes(search.toLowerCase()) ||
      item.mitra.toLowerCase().includes(search.toLowerCase()) ||
      item.lokasi.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      selectedStatus === 'SEMUA' || item.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchSearch && matchStatus;
  });

  // KPI Calculations
  const totalPkm = list.length;
  const countSelesai = list.filter((p) => p.status.toLowerCase() === 'selesai').length;
  const countAktif = list.filter((p) => p.status.toLowerCase() !== 'selesai').length;
  const totalDana = list.reduce((acc, curr) => acc + Number(curr.danaDisetujui || 0), 0);

  return (
    <AdminPanelTemplate
      title="Pengabdian Kepada Masyarakat (PKM)"
      description="Pemberdayaan mitra UMKM, pesantren binaan, dan komunitas melalui transfer kepakaran teknologi terapan civitas UNUSU."
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
            to="/pengabdian/tambah"
            className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 h-[42px] rounded-[12px] bg-violet-700 hover:bg-violet-800 text-white text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
          >
            <PlusIcon className="w-5 h-5 text-amber-400" />
            <span>Tambah PKM</span>
          </Link>
        </div>
      }
    >
      {/* 1. KPI Cards Row (Part 10.8 standard) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Program PKM</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalPkm}</p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-violet-50 text-violet-700 flex items-center justify-center">
            <HeartIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Mitra Berdaya</p>
            <p className="mt-1 text-2xl font-bold text-violet-700">{totalPkm}</p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-xs">
            DESA
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Program Aktif</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{countAktif}</p>
          </div>
          <div className="w-10 h-10 rounded-[10px] bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
            AKTIF
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Dana Disalurkan</p>
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
              placeholder="Cari program PKM, ketua pengusul, nama mitra sasaran, atau lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] border border-[#CBD5E1] bg-slate-50 text-xs font-semibold text-slate-600 flex-shrink-0">
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
              <span>Status:</span>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-violet-600 transition-colors"
            >
              <option value="SEMUA">Semua Status</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Pelaksanaan">Pelaksanaan</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>
        </div>
      </CardContainer>

      {/* 3. Data Table dengan Horizontal Scroll & Audit Trail */}
      <CardContainer
        title="Daftar Kegiatan Pengabdian Masyarakat"
        subtitle={`Menampilkan ${filteredList.length} dari total ${list.length} kegiatan PKM`}
      >
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <ArrowPathIcon className="w-8 h-8 mx-auto animate-spin text-violet-700 mb-2" />
            <p className="text-sm font-semibold">Memuat data pengabdian...</p>
          </div>
        ) : error ? (
          <ErrorState description={error} onRetry={loadData} />
        ) : filteredList.length === 0 ? (
          <EmptyState
            title="Tidak Ada Kegiatan PKM"
            description={
              search || selectedStatus !== 'SEMUA'
                ? 'Tidak ditemukan program PKM yang cocok dengan pencarian Anda.'
                : 'Belum ada kegiatan pengabdian masyarakat tercatat.'
            }
            action={
              <Link
                to="/pengabdian/tambah"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-violet-700 text-white text-xs font-bold hover:bg-violet-800 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Tambah PKM</span>
              </Link>
            }
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[#CBD5E1] text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                  <th className="py-3 px-3.5 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[280px]">Judul Program PKM</th>
                  <th className="py-3 px-4 min-w-[190px]">Ketua & NIDN</th>
                  <th className="py-3 px-4 min-w-[180px]">Mitra & Lokasi</th>
                  <th className="py-3 px-4 min-w-[130px] text-right">Dana Disetujui</th>
                  <th className="py-3 px-4 min-w-[110px] text-center">Tahun / Status</th>
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
                      {item.anggota && (
                        <div className="text-[11px] text-slate-400 mt-1 truncate max-w-md">
                          Tim: {item.anggota}
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
                      <div className="font-semibold text-slate-800">{item.mitra}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPinIcon className="w-3.5 h-3.5 text-violet-700" />
                        <span>{item.lokasi}</span>
                      </div>
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
                      2026-10-31
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          to={`/pengabdian/edit/${item.id}`}
                          className="p-1.5 rounded-[8px] border border-[#CBD5E1] bg-white text-slate-600 hover:text-violet-700 hover:bg-violet-50 transition-colors shadow-2xs"
                          title="Edit PKM"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id, item.judul)}
                          disabled={deletingId === item.id}
                          className="p-1.5 rounded-[8px] border border-[#CBD5E1] bg-white text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors shadow-2xs cursor-pointer"
                          title="Hapus PKM"
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
