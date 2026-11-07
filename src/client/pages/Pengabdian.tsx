import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchPengabdian, deletePengabdian, PengabdianItem } from '../services/api';
import { ListPageTemplate } from '../components/ListPageTemplate';
import {
  HeartIcon,
  PlusIcon,
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
    const q = (search || '').trim().toLowerCase();
    const matchSearch =
      !q ||
      String(item.judul || '').toLowerCase().includes(q) ||
      String(item.ketua || '').toLowerCase().includes(q) ||
      String(item.mitra || '').toLowerCase().includes(q) ||
      String(item.lokasi || '').toLowerCase().includes(q);
    const matchStatus =
      selectedStatus === 'SEMUA' ||
      String(item.status || '').toLowerCase() === selectedStatus.toLowerCase();
    return matchSearch && matchStatus;
  });

  // KPI Calculations
  const totalPkm = list.length;
  const countSelesai = list.filter((p) => p.status.toLowerCase() === 'selesai').length;
  const countAktif = list.filter((p) => p.status.toLowerCase() !== 'selesai').length;
  const totalDana = list.reduce((acc, curr) => acc + Number(curr.danaDisetujui || 0), 0);

  return (
    <ListPageTemplate<PengabdianItem>
      title="Pengabdian Kepada Masyarakat (PKM)"
      description="Pemberdayaan mitra UMKM, pesantren binaan, dan komunitas melalui transfer kepakaran teknologi terapan civitas UNUSU."
      badge={
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-violet-100 text-violet-800 uppercase tracking-wider">
          Pengabdian
        </span>
      }
      actions={
        <>
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
        </>
      }
      stats={
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
      }
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Cari program PKM, ketua pengusul, nama mitra sasaran, atau lokasi..."
      filters={
        <>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] border border-[#CBD5E1] bg-slate-50 text-xs font-semibold text-slate-600">
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            <span>Status:</span>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter status kegiatan PKM"
            className="px-3 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-violet-600 transition-colors min-h-[44px]"
          >
            <option value="SEMUA">Semua Status</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Pelaksanaan">Pelaksanaan</option>
            <option value="Selesai">Selesai</option>
          </select>
        </>
      }
      tableTitle="Daftar Kegiatan Pengabdian Masyarakat"
      tableSubtitle={`Menampilkan ${filteredList.length} dari total ${list.length} kegiatan PKM`}
      tableBadge={
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-800 border border-violet-200">
          {filteredList.length} Kegiatan
        </span>
      }
      loading={loading}
      error={error}
      onRetry={loadData}
      hasActiveFilter={Boolean(search || selectedStatus !== 'SEMUA')}
      emptyMessage="Belum ada kegiatan pengabdian masyarakat tercatat."
      noResultMessage="Tidak ditemukan program PKM yang cocok dengan pencarian Anda."
      rowKey={(item) => item.id}
      rows={filteredList}
      columns={[
        {
          key: 'no',
          header: 'No',
          headerClassName: 'w-12 text-center',
          cellClassName: 'text-center text-slate-400 font-mono text-xs',
          render: (_item, idx) => idx + 1,
        },
        {
          key: 'judul',
          header: 'Judul Program PKM',
          headerClassName: 'min-w-[280px]',
          render: (item) => (
            <>
              <div className="font-bold text-slate-900 leading-snug">{item.judul}</div>
              {item.anggota && (
                <div className="text-[11px] text-slate-400 mt-1 truncate max-w-md">
                  Tim: {item.anggota}
                </div>
              )}
            </>
          ),
        },
        {
          key: 'ketua',
          header: 'Ketua & NIDN',
          headerClassName: 'min-w-[190px]',
          render: (item) => (
            <>
              <div className="font-semibold text-slate-800">{item.ketua}</div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">NIDN: {item.nidn}</div>
            </>
          ),
        },
        {
          key: 'mitra',
          header: 'Mitra & Lokasi',
          headerClassName: 'min-w-[180px]',
          render: (item) => (
            <>
              <div className="font-semibold text-slate-800">{item.mitra}</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPinIcon className="w-3.5 h-3.5 text-violet-700" />
                <span>{item.lokasi}</span>
              </div>
            </>
          ),
        },
        {
          key: 'danaDisetujui',
          header: 'Dana Disetujui',
          headerClassName: 'min-w-[130px] text-right',
          cellClassName: 'text-right font-mono font-bold text-slate-900',
          render: (item) =>
            item.danaDisetujui ? `Rp ${Number(item.danaDisetujui).toLocaleString('id-ID')}` : '-',
        },
        {
          key: 'tahun',
          header: 'Tahun / Status',
          headerClassName: 'min-w-[110px] text-center',
          cellClassName: 'text-center',
          render: (item) => (
            <>
              <div className="font-mono font-bold text-slate-800">{item.tahun}</div>
              <div className="text-[11px] font-semibold text-violet-700 mt-0.5">{item.status}</div>
            </>
          ),
        },
        {
          key: 'createdAt',
          header: 'Dibuat',
          headerClassName: 'min-w-[120px]',
          cellClassName: 'text-slate-500 text-[11px] font-mono',
          render: (item) => (item.createdAt ? String(item.createdAt).substring(0, 10) : '-'),
        },
        {
          key: 'aksi',
          header: 'Aksi',
          headerClassName: 'w-28 text-center',
          cellClassName: 'text-center',
          render: (item) => (
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
          ),
        },
      ]}
    />
  );
};
