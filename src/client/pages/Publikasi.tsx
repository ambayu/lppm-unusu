import React, { useEffect, useState } from 'react';
import { RowActionButton } from '../components/RowActionButton';
import { NotificationModal } from '../components/NotificationModal';
import { deskripsikanGalat, type DeskripsiGalat } from '../lib/galat';
import { fetchPublikasi, deletePublikasi, PublikasiItem } from '../services/api';
import { ListPageTemplate, ListActionButton } from '../components/ListPageTemplate';
import {
  BookOpenIcon,
  PlusIcon,
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
  const [akanDihapus, setAkanDihapus] = useState<{ id: number; nama: string } | null>(null);
  const [galat, setGalat] = useState<DeskripsiGalat | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchPublikasi()
      .then((res) => setList(res.data.data))
      .catch((err: unknown) => {
        const rincian = deskripsikanGalat(err, 'Memuat Publikasi', 'daftar publikasi LPPM');
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
      await deletePublikasi(id);
      setAkanDihapus(null);
      loadData();
    } catch (err: unknown) {
      setAkanDihapus(null);
      setGalat(deskripsikanGalat(err, 'Menghapus Publikasi', `publikasi «${nama}»`));
    } finally {
      setDeletingId(null);
    }
  };

  const filteredList = list.filter((item) => {
    const q = (search || '').trim().toLowerCase();
    const matchSearch =
      !q ||
      String(item.judul || '').toLowerCase().includes(q) ||
      String(item.penulis || '').toLowerCase().includes(q) ||
      String(item.namaJurnal || '').toLowerCase().includes(q) ||
      String(item.sintaScore || '').toLowerCase().includes(q);
    const matchJenis =
      selectedJenis === 'SEMUA' ||
      String(item.jenis || '').toLowerCase().includes(selectedJenis.toLowerCase());
    return matchSearch && matchJenis;
  });

  // KPI Calculations
  const totalPublikasi = list.length;
  const countScopus = list.filter((p) => p.jenis.toLowerCase().includes('scopus') || p.jenis.toLowerCase().includes('internasional')).length;
  const countSinta = list.filter((p) => p.jenis.toLowerCase().includes('sinta') || p.jenis.toLowerCase().includes('nasional')).length;
  const countProsiding = list.filter((p) => p.jenis.toLowerCase().includes('prosiding') || p.jenis.toLowerCase().includes('buku')).length;

  return (
    <>
    <ListPageTemplate<PublikasiItem>
      title="Publikasi Artikel Ilmiah & Jurnal"
      description="Kelola repositori artikel jurnal terindeks Scopus, SINTA, prosiding seminar, dan perolehan Hak Cipta dosen UNUSU."
      badge={
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-violet-100 text-violet-800 uppercase tracking-wider">
          Publikasi
        </span>
      }
      actions={
        <>
          <ListActionButton onClick={loadData} disabled={loading} variant="secondary" icon={<ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}>Segarkan</ListActionButton>
          <ListActionButton to="/publikasi/tambah" icon={<PlusIcon className="w-4 h-4" />}>Tambah Data</ListActionButton>
        </>
      }
      stats={
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
      }
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Cari judul artikel, nama penulis, jurnal, atau peringkat SINTA..."
      filters={
        <>
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] border border-[#CBD5E1] bg-slate-50 text-xs font-semibold text-slate-600">
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            <span>Jenis:</span>
          </div>
          <select
            value={selectedJenis}
            onChange={(e) => setSelectedJenis(e.target.value)}
            aria-label="Filter jenis publikasi"
            className="px-3 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-violet-600 transition-colors min-h-[44px]"
          >
            <option value="SEMUA">Semua Jenis</option>
            <option value="Jurnal Internasional">Jurnal Internasional (Scopus)</option>
            <option value="Jurnal Nasional">Jurnal Nasional (SINTA)</option>
            <option value="Prosiding">Prosiding Seminar</option>
            <option value="Buku">Buku / Monograf</option>
          </select>
        </>
      }
      tableTitle="Daftar Publikasi Bereputasi"
      tableSubtitle={`Menampilkan ${filteredList.length} dari total ${list.length} artikel ilmiah terbit`}
      tableBadge={
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-800 border border-violet-200">
          {filteredList.length} Artikel
        </span>
      }
      loading={loading}
      error={error}
      onRetry={loadData}
      hasActiveFilter={Boolean(search || selectedJenis !== 'SEMUA')}
      emptyMessage="Belum ada data publikasi terarsip."
      noResultMessage="Tidak ditemukan publikasi ilmiah yang cocok dengan kata kunci pencarian."
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
          header: 'Judul Artikel',
          headerClassName: 'min-w-[300px]',
          render: (item) => (
            <div className="font-bold text-slate-900 leading-snug">{item.judul}</div>
          ),
        },
        {
          key: 'namaJurnal',
          header: 'Jurnal Penerbit',
          headerClassName: 'min-w-[220px]',
          cellClassName: 'font-semibold text-slate-700 italic',
          render: (item) => item.namaJurnal || '-',
        },
        {
          key: 'volumeIssue',
          header: 'Volume / Edisi',
          headerClassName: 'min-w-[140px]',
          render: (item) => item.volumeIssue || '-',
        },
        {
          key: 'penulis',
          header: 'Penulis',
          headerClassName: 'min-w-[200px]',
          cellClassName: 'font-semibold text-slate-800',
          render: (item) => item.penulis,
        },
        {
          key: 'jenis',
          header: 'Kategori',
          headerClassName: 'min-w-[150px]',
          render: (item) => (
            <div className="font-semibold text-slate-800">{item.jenis}</div>
          ),
        },
        {
          key: 'sintaScore',
          header: 'Akreditasi',
          headerClassName: 'min-w-[130px]',
          cellClassName: 'font-mono font-bold text-violet-700',
          render: (item) => item.sintaScore || '-',
        },
        {
          key: 'doiUrl',
          header: 'Tautan DOI / Web',
          headerClassName: 'min-w-[140px]',
          render: (item) =>
            item.doiUrl ? (
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
            ),
        },
        {
          key: 'tahun',
          header: 'Tahun',
          headerClassName: 'min-w-[90px] text-center',
          cellClassName: 'text-center font-mono font-bold text-slate-800',
          render: (item) => item.tahun,
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
                to={`/publikasi/edit/${item.id}`}
                label={`Edit publikasi ${item.judul}`}
              >
                <PencilSquareIcon className="w-4 h-4" />
              </RowActionButton>
              <RowActionButton
                onClick={() => setAkanDihapus({ id: item.id, nama: item.judul })}
                disabled={deletingId === item.id}
                variant="danger"
                label={`Hapus publikasi ${item.judul}`}
              >
                <TrashIcon className="w-4 h-4" />
              </RowActionButton>
            </div>
          ),
        },
      ]}
    />
    <NotificationModal isOpen={Boolean(akanDihapus)} type="confirm" title="Hapus Publikasi?" message={`Publikasi «${akanDihapus?.nama ?? ''}» akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`} confirmLabel="Hapus Publikasi" onConfirm={handleDelete} onClose={() => setAkanDihapus(null)} loading={deletingId !== null} />
    <NotificationModal isOpen={Boolean(galat)} type="error" title={galat?.title} message={galat?.message ?? ''} details={galat?.details} code={galat?.code} onClose={() => setGalat(null)} />
    </>
  );
};
