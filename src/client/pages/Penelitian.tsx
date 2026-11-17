import React, { useEffect, useState } from 'react';
import { RowActionButton } from '../components/RowActionButton';
import { NotificationModal } from '../components/NotificationModal';
import { deskripsikanGalat, type DeskripsiGalat } from '../lib/galat';
import { fetchPenelitian, deletePenelitian, PenelitianItem } from '../services/api';
import { ListPageTemplate, ListActionButton } from '../components/ListPageTemplate';
import {
  BeakerIcon,
  PlusIcon,
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
  const [akanDihapus, setAkanDihapus] = useState<{ id: number; nama: string } | null>(null);
  const [galat, setGalat] = useState<DeskripsiGalat | null>(null);
  const [pesanEkspor, setPesanEkspor] = useState(false);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchPenelitian()
      .then((res) => {
        const rawData = res.data?.data;
        setList(Array.isArray(rawData) ? rawData : []);
      })
      .catch((err: unknown) => {
        const rincian = deskripsikanGalat(err, 'Memuat Penelitian', 'daftar penelitian LPPM');
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
      await deletePenelitian(id);
      setAkanDihapus(null);
      loadData();
    } catch (err: unknown) {
      setAkanDihapus(null);
      setGalat(deskripsikanGalat(err, 'Menghapus Penelitian', `penelitian «${nama}»`));
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
      setPesanEkspor(true);
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

    const escapeCsv = (val: unknown) => {
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
    <>
    <ListPageTemplate<PenelitianItem>
      title="Pangkalan Data Penelitian Dosen"
      description="Kelola usulan hibah, pemantauan kemajuan riset, dan pelaporan luaran penelitian civitas akademika UNUSU."
      badge={
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-violet-100 text-violet-800 uppercase tracking-wider">
          Riset Dosen
        </span>
      }
      actions={
        <>
          <ListActionButton onClick={loadData} disabled={loading} variant="secondary" icon={<ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}>Segarkan</ListActionButton>
          <ListActionButton
            onClick={handleExportExcel}
            disabled={loading || filteredList.length === 0}
            variant="secondary"
            icon={<ArrowDownTrayIcon className="w-4 h-4" />}
          >
            Export Excel
          </ListActionButton>
          <ListActionButton to="/penelitian/tambah" icon={<PlusIcon className="w-4 h-4" />}>Tambah Data</ListActionButton>
        </>
      }
      stats={
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
      }
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Cari judul riset, nama ketua peneliti, NIDN, atau bidang fokus..."
      filters={
        <>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] border border-[#CBD5E1] bg-slate-50 text-xs font-semibold text-slate-600">
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            <span>Bidang Fokus:</span>
          </div>
          <select
            value={selectedBidangFokus}
            onChange={(e) => setSelectedBidangFokus(e.target.value)}
            aria-label="Filter bidang fokus penelitian"
            className="px-3 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-violet-600 transition-colors min-h-[44px]"
          >
            <option value="SEMUA">Semua Bidang</option>
            <option value="Teknologi Informasi">Teknologi Informasi</option>
            <option value="Kecerdasan Buatan (AI)">Kecerdasan Buatan (AI)</option>
            <option value="Pendidikan & Aswaja">Pendidikan & Aswaja</option>
            <option value="Sosial Humaniora">Sosial Humaniora</option>
            <option value="Pertanian & Ketahanan Pangan">Pertanian & Ketahanan Pangan</option>
            <option value="Kesehatan & Gizi">Kesehatan & Gizi</option>
          </select>
        </>
      }
      tableTitle="Daftar Proposal & Luaran Penelitian"
      tableSubtitle={`Menampilkan ${filteredList.length} dari total ${list.length} data penelitian terdaftar`}
      tableBadge={
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-800 border border-violet-200">
          {filteredList.length} Riset
        </span>
      }
      loading={loading}
      error={error}
      onRetry={loadData}
      hasActiveFilter={Boolean(search || selectedBidangFokus !== 'SEMUA')}
      emptyMessage="Belum ada proposal penelitian tercatat di pangkalan LPPM."
      noResultMessage="Tidak ditemukan penelitian yang cocok dengan kriteria pencarian Anda."
      rowKey={(item) => item.id}
      rows={filteredList}
      minTableWidth="min-w-[1960px]"
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
          header: 'Judul Penelitian',
          headerClassName: 'min-w-[280px]',
          render: (item) => (
            <div className="font-bold text-slate-900 leading-snug">{item.judul}</div>
          ),
        },
        {
          key: 'bidangFokus',
          header: 'Bidang Fokus',
          headerClassName: 'min-w-[180px]',
          render: (item) => item.bidangFokus || '-',
        },
        {
          key: 'anggota',
          header: 'Anggota Peneliti',
          headerClassName: 'min-w-[200px]',
          render: (item) => item.anggota || '-',
        },
        {
          key: 'ketua',
          header: 'Ketua Peneliti',
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
          key: 'sumberDana',
          header: 'Sumber Dana',
          headerClassName: 'min-w-[150px]',
          render: (item) => <div className="font-semibold text-slate-800">{item.sumberDana}</div>,
        },
        {
          key: 'danaDisetujui',
          header: 'Dana Disetujui',
          headerClassName: 'min-w-[140px] text-right',
          cellClassName: 'text-right font-mono font-bold text-slate-900',
          render: (item) =>
            item.danaDisetujui ? `Rp ${Number(item.danaDisetujui).toLocaleString('id-ID')}` : '-',
        },
        {
          key: 'tahun',
          header: 'Tahun',
          headerClassName: 'min-w-[100px] text-center',
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
                to={`/penelitian/edit/${item.id}`}
                label={`Edit penelitian ${item.judul}`}
              >
                <PencilSquareIcon className="w-4 h-4" />
              </RowActionButton>
              <RowActionButton
                onClick={() => setAkanDihapus({ id: item.id, nama: item.judul })}
                disabled={deletingId === item.id}
                variant="danger"
                label={`Hapus penelitian ${item.judul}`}
              >
                <TrashIcon className="w-4 h-4" />
              </RowActionButton>
            </div>
          ),
        },
      ]}
    />
    <NotificationModal isOpen={Boolean(akanDihapus)} type="confirm" title="Hapus Penelitian?" message={`Penelitian «${akanDihapus?.nama ?? ''}» akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`} confirmLabel="Hapus Penelitian" onConfirm={handleDelete} onClose={() => setAkanDihapus(null)} loading={deletingId !== null} />
    <NotificationModal isOpen={Boolean(galat)} type="error" title={galat?.title} message={galat?.message ?? ''} details={galat?.details} code={galat?.code} onClose={() => setGalat(null)} />
    <NotificationModal isOpen={pesanEkspor} type="info" title="Ekspor Penelitian" message="Tidak ada data penelitian untuk diekspor." onClose={() => setPesanEkspor(false)} />
    </>
  );
};
