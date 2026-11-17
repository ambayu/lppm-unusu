import React, { useEffect, useState } from 'react';
import { RowActionButton } from '../components/RowActionButton';
import { NotificationModal } from '../components/NotificationModal';
import { deskripsikanGalat, type DeskripsiGalat } from '../lib/galat';
import { fetchPengabdian, deletePengabdian, PengabdianItem } from '../services/api';
import { ListPageTemplate, ListActionButton } from '../components/ListPageTemplate';
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
  const [akanDihapus, setAkanDihapus] = useState<{ id: number; nama: string } | null>(null);
  const [galat, setGalat] = useState<DeskripsiGalat | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchPengabdian()
      .then((res) => setList(res.data.data))
      .catch((err: unknown) => {
        const rincian = deskripsikanGalat(err, 'Memuat Pengabdian', 'daftar kegiatan PKM');
        setError(rincian.message);
        setGalat(rincian);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async () => {
    if (!akanDihapus || deletingId !== null) return;
    const { id, nama } = akanDihapus;
    setDeletingId(id);
    try {
      await deletePengabdian(id);
      setAkanDihapus(null);
      loadData();
    } catch (err: unknown) {
      setAkanDihapus(null);
      setGalat(deskripsikanGalat(err, 'Menghapus Pengabdian', `kegiatan PKM «${nama}»`));
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
    <>
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
          <ListActionButton onClick={loadData} disabled={loading} variant="secondary" icon={<ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}>Segarkan</ListActionButton>
          <ListActionButton to="/pengabdian/tambah" icon={<PlusIcon className="w-4 h-4" />}>Tambah Data</ListActionButton>
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
      minTableWidth="min-w-[2060px]"
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
            <div className="font-bold text-slate-900 leading-snug">{item.judul}</div>
          ),
        },
        {
          key: 'anggota',
          header: 'Anggota Tim',
          headerClassName: 'min-w-[200px]',
          render: (item) => item.anggota || '-',
        },
        {
          key: 'ketua',
          header: 'Ketua',
          headerClassName: 'min-w-[190px]',
          render: (item) => (
            <div className="font-semibold text-slate-800">{item.ketua}</div>
          ),
        },
        {
          key: 'nidn',
          header: 'NIDN',
          headerClassName: 'min-w-[140px]',
          cellClassName: 'font-mono text-slate-500',
          render: (item) => item.nidn || '-',
        },
        {
          key: 'mitra',
          header: 'Mitra',
          headerClassName: 'min-w-[180px]',
          render: (item) => (
            <div className="font-semibold text-slate-800">{item.mitra}</div>
          ),
        },
        {
          key: 'lokasi',
          header: 'Lokasi',
          headerClassName: 'min-w-[200px]',
          render: (item) => (
            <div className="text-slate-500 flex items-center gap-1">
              <MapPinIcon className="w-3.5 h-3.5 text-violet-700 shrink-0" />
              <span>{item.lokasi || '-'}</span>
            </div>
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
          header: 'Tahun',
          headerClassName: 'min-w-[110px] text-center',
          cellClassName: 'text-center',
          render: (item) => (
            <div className="font-mono font-bold text-slate-800">{item.tahun}</div>
          ),
        },
        {
          key: 'status',
          header: 'Status',
          headerClassName: 'min-w-[140px]',
          cellClassName: 'font-semibold text-violet-700',
          render: (item) => item.status || '-',
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
              <RowActionButton
                to={`/pengabdian/edit/${item.id}`}
                label={`Edit pengabdian ${item.judul}`}
              >
                <PencilSquareIcon className="w-4 h-4" />
              </RowActionButton>
              <RowActionButton
                onClick={() => setAkanDihapus({ id: item.id, nama: item.judul })}
                disabled={deletingId === item.id}
                variant="danger"
                label={`Hapus pengabdian ${item.judul}`}
              >
                <TrashIcon className="w-4 h-4" />
              </RowActionButton>
            </div>
          ),
        },
      ]}
    />
    <NotificationModal isOpen={Boolean(akanDihapus)} type="confirm" title="Hapus Pengabdian?" message={`Kegiatan PKM «${akanDihapus?.nama ?? ''}» akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`} confirmLabel="Hapus Pengabdian" onConfirm={handleDelete} onClose={() => setAkanDihapus(null)} loading={deletingId !== null} />
    <NotificationModal isOpen={Boolean(galat)} type="error" title={galat?.title} message={galat?.message ?? ''} details={galat?.details} code={galat?.code} onClose={() => setGalat(null)} />
    </>
  );
};
