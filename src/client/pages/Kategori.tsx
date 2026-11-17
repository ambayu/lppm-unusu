import React, { useEffect, useState } from 'react';
import { RowActionButton } from '../components/RowActionButton';
import { NotificationModal } from '../components/NotificationModal';
import { deskripsikanGalat, type DeskripsiGalat } from '../lib/galat';
import { useAuth } from '../context/AuthContext';
import { fetchKategori, deleteKategori, KategoriItem } from '../services/api';
import { ListPageTemplate, ListActionButton } from '../components/ListPageTemplate';
import {
  FolderIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export const KategoriLppmPage: React.FC = () => {
  const { bisa } = useAuth();
  const bolehMenulis = bisa('dokumen.create', 'dokumen.manage');

  const [categories, setCategories] = useState<KategoriItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [akanDihapus, setAkanDihapus] = useState<{ id: number; nama: string } | null>(null);
  const [galat, setGalat] = useState<DeskripsiGalat | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchKategori()
      .then((res) => {
        setCategories(res.data.data);
      })
      .catch((err: unknown) => {
        const rincian = deskripsikanGalat(err, 'Memuat Kategori', 'daftar kategori dokumen');
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
      await deleteKategori(id);
      setAkanDihapus(null);
      loadData();
    } catch (err: unknown) {
      setAkanDihapus(null);
      setGalat(deskripsikanGalat(err, 'Menghapus Kategori', `kategori «${nama}»`));
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = categories.filter((c) =>
    c.nama.toLowerCase().includes(search.toLowerCase()) ||
    (c.deskripsi && c.deskripsi.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
    <ListPageTemplate<KategoriItem>
      title="Kategori Dokumen"
      description="Kelola kategori klasifikasi dokumen penelitian, pengabdian masyarakat, dan panduan luaran LPPM UNUSU."
      badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-900">
          <FolderIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Kategori LPPM
        </span>
      }
      actions={
        bolehMenulis ? (
          <ListActionButton to="/admin/kategori/tambah" icon={<PlusIcon className="w-4 h-4" />}>
            Tambah Data
          </ListActionButton>
        ) : undefined
      }
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Cari nama atau deskripsi kategori..."
      tableTitle="Daftar Kategori Dokumen"
      tableSubtitle={`Total ${filtered.length} kategori ditemukan`}
      columns={[
        {
          key: 'no',
          header: 'No',
          headerClassName: 'w-16 text-center',
          cellClassName: 'text-center text-xs font-semibold text-slate-500',
          render: (_, idx) => idx + 1,
        },
        {
          key: 'nama',
          header: 'Nama Kategori',
          headerClassName: 'w-64',
          render: (item) => (
            <span className="font-semibold text-slate-900 text-sm">{item.nama}</span>
          ),
        },
        {
          key: 'deskripsi',
          header: 'Deskripsi',
          render: (item) => (
            <span className="text-xs text-slate-600 leading-relaxed">
              {item.deskripsi || <span className="text-slate-400 italic">-</span>}
            </span>
          ),
        },
        {
          key: 'status',
          header: 'Status',
          headerClassName: 'w-32 text-center',
          cellClassName: 'text-center',
          render: (item) => (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                item.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
              }`}
            >
              {item.isActive ? 'Aktif' : 'Nonaktif'}
            </span>
          ),
        },
        {
          key: 'aksi',
          header: 'Aksi',
          headerClassName: 'w-28 text-center',
          cellClassName: 'text-center',
          render: (item) =>
            bolehMenulis ? (
              <div className="flex items-center justify-center gap-1">
                <RowActionButton
                  to={`/admin/kategori/edit/${item.id}`}
                  label={`Sunting kategori ${item.nama}`}
                >
                  <PencilSquareIcon className="w-4 h-4" />
                </RowActionButton>
                <RowActionButton
                  onClick={() => setAkanDihapus({ id: item.id, nama: item.nama })}
                  disabled={deletingId === item.id}
                  variant="danger"
                  label={`Hapus kategori ${item.nama}`}
                >
                  <TrashIcon className="w-4 h-4" />
                </RowActionButton>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Hanya Baca</span>
            ),
        },
      ]}
      rows={filtered}
      rowKey={(item) => item.id}
      loading={loading}
      error={error}
      onRetry={loadData}
      emptyMessage="Belum ada kategori dokumen yang dibuat."
      noResultMessage="Tidak ditemukan kategori dokumen yang cocok dengan kata kunci pencarian."
      hasActiveFilter={Boolean(search)}
    />
    <NotificationModal isOpen={Boolean(akanDihapus)} type="confirm" title="Hapus Kategori?" message={`Kategori «${akanDihapus?.nama ?? ''}» akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`} confirmLabel="Hapus Kategori" onConfirm={handleDelete} onClose={() => setAkanDihapus(null)} loading={deletingId !== null} />
    <NotificationModal isOpen={Boolean(galat)} type="error" title={galat?.title} message={galat?.message ?? ''} details={galat?.details} code={galat?.code} onClose={() => setGalat(null)} />
    </>
  );
};

export default KategoriLppmPage;
