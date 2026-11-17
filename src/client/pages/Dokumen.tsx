import React, { useEffect, useState } from 'react';
import { RowActionButton } from '../components/RowActionButton';
import { useAuth } from '../context/AuthContext';
import { fetchDokumen, deleteDokumen, DokumenRecord } from '../services/api';
import { ListPageTemplate, ListActionButton } from '../components/ListPageTemplate';
import { NotificationModal } from '../components/NotificationModal';
import { deskripsikanGalat, DeskripsiGalat } from '../lib/galat';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

export const DokumenLppmPage: React.FC = () => {
  const { bisa } = useAuth();
  const bolehMenulis = bisa('dokumen.create', 'dokumen.manage');

  const [documents, setDocuments] = useState<DokumenRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('SEMUA');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  /** Dokumen yang menunggu konfirmasi hapus. */
  const [akanDihapus, setAkanDihapus] = useState<DokumenRecord | null>(null);
  /** Modal galat untuk kegagalan memuat maupun menghapus. */
  const [galat, setGalat] = useState<DeskripsiGalat | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchDokumen()
      .then((res) => {
        setDocuments(res.data.data);
      })
      .catch((err: unknown) => {
        const rincian = deskripsikanGalat(err, 'Memuat Arsip Dokumen', 'daftar arsip dokumen LPPM');
        setError(rincian.message);
        setGalat(rincian);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const jalankanHapus = async () => {
    if (!akanDihapus || deletingId !== null) return;
    const target = akanDihapus;
    setDeletingId(target.id);
    try {
      await deleteDokumen(target.id);
      setAkanDihapus(null);
      loadData();
    } catch (err: unknown) {
      console.error(err);
      setAkanDihapus(null);
      setGalat(
        deskripsikanGalat(err, 'Menghapus Dokumen', `dokumen «${target.judul}»`),
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = documents.filter((doc) => {
    const matchSearch =
      doc.judul.toLowerCase().includes(search.toLowerCase()) ||
      (doc.nomor && doc.nomor.toLowerCase().includes(search.toLowerCase())) ||
      (doc.kategori?.nama && doc.kategori.nama.toLowerCase().includes(search.toLowerCase())) ||
      (doc.prodiName && doc.prodiName.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = selectedStatus === 'SEMUA' || doc.status === selectedStatus;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <ListPageTemplate<DokumenRecord>
      title="Manajemen Dokumen"
      description="Pangkalan arsip dokumen penelitian, pengabdian kepada masyarakat, regulasi, dan panduan luaran LPPM UNUSU."
      badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-900">
          <DocumentTextIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Pangkalan Dokumen LPPM
        </span>
      }
      actions={
        bolehMenulis ? (
          <ListActionButton to="/admin/arsip-dokumen/tambah" icon={<PlusIcon className="w-4 h-4" />}>
            Tambah Data
          </ListActionButton>
        ) : undefined
      }
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Cari judul, nomor dokumen, atau kategori..."
      filters={
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          aria-label="Filter status dokumen"
          className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
        >
          <option value="SEMUA">Semua Status</option>
          <option value="Aktif">Aktif</option>
          <option value="Draft">Draft</option>
          <option value="Arsip">Arsip</option>
        </select>
      }
      tableTitle="Daftar Dokumen LPPM"
      tableSubtitle={`Total ${filtered.length} dokumen terdaftar`}
      columns={[
        {
          key: 'no',
          header: 'NO',
          headerClassName: 'w-14',
          cellClassName: 'text-center',
          render: (_, idx) => idx + 1,
        },
        {
          key: 'judul',
          header: 'JUDUL DOKUMEN',
          headerClassName: 'min-w-[260px]',
          render: (item) => (
            <span className="font-semibold leading-snug break-words">{item.judul}</span>
          ),
        },
        {
          key: 'nomor',
          header: 'NOMOR DOKUMEN',
          headerClassName: 'w-44',
          render: (item) =>
            item.nomor ? <span className="font-mono break-all">{item.nomor}</span> : '-',
        },
        {
          key: 'tahun',
          header: 'TAHUN',
          headerClassName: 'w-24',
          cellClassName: 'text-center',
          render: (item) => <span className="font-mono">{item.tahun}</span>,
        },
        {
          key: 'kategori',
          header: 'KATEGORI',
          headerClassName: 'w-40',
          render: (item) =>
            item.kategori?.nama ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                {item.kategori.nama}
              </span>
            ) : (
              '-'
            ),
        },
        {
          key: 'tujuanPublish',
          header: 'TUJUAN PUBLIKASI',
          headerClassName: 'w-44',
          render: (item) => (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-md font-medium border ${
                item.tujuanPublish === 'prodi'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {item.tujuanPublish === 'prodi' ? 'Program Studi' : 'LPPM Internal'}
            </span>
          ),
        },
        {
          key: 'prodi',
          header: 'PROGRAM STUDI',
          headerClassName: 'min-w-[200px]',
          render: (item) =>
            item.tujuanPublish === 'prodi' && item.prodiName ? (
              <span className="break-words">{item.prodiName}</span>
            ) : (
              '-'
            ),
        },
        {
          key: 'tanggalMulaiBerlaku',
          header: 'MULAI BERLAKU',
          headerClassName: 'w-36',
          cellClassName: 'whitespace-nowrap',
          render: (item) =>
            item.tanggalMulaiBerlaku ? (
              <span>{new Date(item.tanggalMulaiBerlaku).toLocaleDateString('id-ID')}</span>
            ) : (
              '-'
            ),
        },
        {
          key: 'tanggalBerakhir',
          header: 'BERAKHIR',
          headerClassName: 'w-36',
          cellClassName: 'whitespace-nowrap',
          render: (item) =>
            item.tanggalBerakhir ? (
              <span>{new Date(item.tanggalBerakhir).toLocaleDateString('id-ID')}</span>
            ) : (
              '-'
            ),
        },
        {
          key: 'status',
          header: 'STATUS',
          headerClassName: 'w-28',
          cellClassName: 'text-center',
          render: (item) => {
            const warna =
              item.status === 'Aktif'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : item.status === 'Draft'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-100 text-slate-700 border-slate-200';
            return (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-medium border ${warna}`}>
                {item.status}
              </span>
            );
          },
        },
        {
          key: 'berkas',
          header: 'BERKAS',
          headerClassName: 'w-28',
          cellClassName: 'text-center',
          render: (item) =>
            item.filePdfUrl ? (
              <a
                href={item.filePdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-emerald-50 text-emerald-800 hover:bg-emerald-700 hover:text-white border border-emerald-200 font-medium transition-all"
              >
                <ArrowDownTrayIcon className="w-4 h-4" aria-hidden="true" />
                Unduh
              </a>
            ) : (
              '-'
            ),
        },
        {
          key: 'aksi',
          header: 'AKSI',
          headerClassName: 'w-28',
          cellClassName: 'text-center',
          render: (item) =>
            bolehMenulis ? (
              <div className="inline-flex items-center justify-center gap-2">
                <RowActionButton
                  to={`/admin/arsip-dokumen/edit/${item.id}`}
                  label={`Sunting dokumen ${item.judul}`}
                >
                  <PencilSquareIcon className="w-4 h-4" aria-hidden="true" />
                </RowActionButton>
                <RowActionButton
                  onClick={() => setAkanDihapus(item)}
                  disabled={deletingId === item.id}
                  variant="danger"
                  label={`Hapus dokumen ${item.judul}`}
                >
                  <TrashIcon className="w-4 h-4" aria-hidden="true" />
                </RowActionButton>
              </div>
            ) : (
              'Hanya Baca'
            ),
        },
      ]}
      rows={filtered}
      rowKey={(item) => item.id}
      loading={loading}
      minTableWidth="min-w-[1560px]"
      error={error}
      onRetry={loadData}
      emptyMessage="Belum ada arsip dokumen LPPM yang diunggah."
      noResultMessage="Tidak ditemukan dokumen yang cocok dengan filter atau kata kunci."
      hasActiveFilter={Boolean(search || selectedStatus !== 'SEMUA')}
      />

      <NotificationModal
        isOpen={Boolean(akanDihapus)}
        type="confirm"
        title="Hapus Dokumen?"
        message={`Dokumen «${akanDihapus?.judul ?? ''}» akan dihapus permanen dari arsip LPPM. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus Dokumen"
        cancelLabel="Batal"
        onConfirm={jalankanHapus}
        onClose={() => setAkanDihapus(null)}
        loading={deletingId !== null}
      />

      <NotificationModal
        isOpen={Boolean(galat)}
        type="error"
        title={galat?.title}
        message={galat?.message ?? ''}
        details={galat?.details}
        code={galat?.code}
        onClose={() => setGalat(null)}
      />
    </>
  );
};

export default DokumenLppmPage;
