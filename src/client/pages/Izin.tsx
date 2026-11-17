import React, { useEffect, useState, useMemo } from 'react';
import { RowActionButton } from '../components/RowActionButton';
import { NotificationModal } from '../components/NotificationModal';
import { deskripsikanGalat, type DeskripsiGalat } from '../lib/galat';
import { ListPageTemplate, ListActionButton } from '../components/ListPageTemplate';
import { useAuth } from '../context/AuthContext';
import { IZIN_FITUR } from '../lib/appAccess';
import {
  fetchPermissions,
  deletePermission,
  PermissionItem,
} from '../services/api';
import {
  KeyIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const MODUL_OPTIONS = [
  'Penelitian',
  'Pengabdian',
  'Publikasi',
  'Peran & Hak Akses',
  'Kategori Riset',
  'Pengguna',
  'Laporan',
  'Sistem',
];

export const IzinPage: React.FC = () => {
  const { bisa } = useAuth();
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedModul, setSelectedModul] = useState<string>('SEMUA');
  const [akanDihapus, setAkanDihapus] = useState<PermissionItem | null>(null);
  const [menghapus, setMenghapus] = useState(false);
  const [galat, setGalat] = useState<DeskripsiGalat | null>(null);

  // Tombol ubah/tambah muncul atas dasar izin, bukan nama peran.
  const isAdmin = bisa(IZIN_FITUR.izinKelola);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPermissions();
      setPermissions(res.data.data || []);
    } catch (err: unknown) {
      const rincian = deskripsikanGalat(err, 'Memuat Izin', 'katalog hak izin LPPM');
      setError(rincian.message);
      setGalat(rincian);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async () => {
    if (!akanDihapus || menghapus) return;
    const perm = akanDihapus;
    setMenghapus(true);
    try {
      await deletePermission(perm.id);
      setAkanDihapus(null);
      loadData();
    } catch (err: unknown) {
      setAkanDihapus(null);
      setGalat(deskripsikanGalat(err, 'Menghapus Izin', `hak izin «${perm.nama}» (${perm.kode})`));
    } finally {
      setMenghapus(false);
    }
  };

  // Filter izin
  const filteredPermissions = useMemo(() => {
    return permissions.filter((p) => {
      const matchSearch =
        p.nama.toLowerCase().includes(search.toLowerCase()) ||
        p.kode.toLowerCase().includes(search.toLowerCase()) ||
        (p.deskripsi && p.deskripsi.toLowerCase().includes(search.toLowerCase()));
      const matchModul = selectedModul === 'SEMUA' || p.modul === selectedModul;
      return matchSearch && matchModul;
    });
  }, [permissions, search, selectedModul]);

  // Modul list unik
  const availableModules = useMemo(() => {
    const list = Array.from(new Set(permissions.map((p) => p.modul)));
    return list.sort();
  }, [permissions]);

  return (
    <>
      <ListPageTemplate<PermissionItem>
        title="Katalog Izin & Hak Akses"
        description="Daftar hak izin (permissions) granuler yang mengatur kewenangan operasional sistem penelitian, pengabdian, dan publikasi LPPM UNUSU."
        badge={
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-violet-100 text-violet-800 uppercase tracking-wider">
            RBAC LPPM
          </span>
        }
        actions={
          <>
            <ListActionButton onClick={loadData} disabled={loading} variant="secondary" icon={<ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}>Segarkan</ListActionButton>
            {isAdmin && (
              <ListActionButton to="/izin/tambah" icon={<PlusIcon className="w-4 h-4" />}>Tambah Data</ListActionButton>
            )}
          </>
        }
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari izin berdasarkan nama, kode wewenang, atau deskripsi..."
        filters={
          <>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] border border-[#CBD5E1] bg-slate-50 text-xs font-semibold text-slate-600">
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
              <span>Filter Modul:</span>
            </div>
            <select
              value={selectedModul}
              onChange={(e) => setSelectedModul(e.target.value)}
              aria-label="Filter modul izin"
              className="px-3 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-violet-600 transition-colors cursor-pointer min-h-[44px]"
            >
              <option value="SEMUA">Semua Modul ({permissions.length})</option>
              {availableModules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </>
        }
        tableTitle="Daftar Izin Sistem Terdaftar"
        tableSubtitle={`Menampilkan ${filteredPermissions.length} hak izin operasional dalam ekosistem LPPM`}
        tableBadge={
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-800 border border-violet-200">
            {filteredPermissions.length} Izin
          </span>
        }
        loading={loading}
        error={error}
        onRetry={loadData}
        hasActiveFilter={Boolean(search || selectedModul !== 'SEMUA')}
        emptyMessage="Belum ada hak izin terdaftar dalam sistem."
        noResultMessage="Tidak ada hak izin yang sesuai dengan kriteria pencarian."
        rowKey={(perm) => perm.id}
        rows={filteredPermissions}
        columns={[
          {
            key: 'no',
            header: 'No',
            headerClassName: 'w-12 text-center',
            cellClassName: 'text-center text-slate-400 font-mono text-xs',
            render: (_perm, idx) => idx + 1,
          },
          {
            key: 'kode',
            header: 'Kode Izin (System Key)',
            headerClassName: 'min-w-[200px]',
            cellClassName: 'font-mono font-bold text-violet-800 text-xs',
            render: (perm) => (
              <span className="bg-violet-50 px-2 py-0.5 rounded border border-violet-200 inline-block">
                {perm.kode}
              </span>
            ),
          },
          {
            key: 'nama',
            header: 'Nama Izin',
            headerClassName: 'min-w-[220px]',
            cellClassName: 'font-bold text-slate-900',
            render: (perm) => perm.nama,
          },
          {
            key: 'modul',
            header: 'Modul',
            headerClassName: 'min-w-[150px]',
            render: (perm) => (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {perm.modul}
              </span>
            ),
          },
          {
            key: 'deskripsi',
            header: 'Deskripsi Wewenang',
            headerClassName: 'min-w-[240px]',
            cellClassName: 'text-slate-600 text-xs leading-relaxed',
            render: (perm) => perm.deskripsi || '-',
          },
          {
            key: 'roles',
            header: 'Peran Terkait',
            headerClassName: 'min-w-[130px] text-center',
            cellClassName: 'text-center',
            render: (perm) => (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200"
                title={perm.roles?.map((r) => r.role.nama).join(', ')}
              >
                <ShieldCheckIcon className="w-3.5 h-3.5" />
                <span>{perm.roles?.length || 0} Peran</span>
              </span>
            ),
          },
          {
            key: 'createdAt',
            header: 'Dibuat',
            headerClassName: 'min-w-[120px]',
            cellClassName: 'text-slate-500 text-[11px] font-mono whitespace-nowrap',
            render: (perm) =>
              perm.createdAt
                ? new Date(perm.createdAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : '-',
          },
          ...(isAdmin
            ? [
                {
                  key: 'aksi',
                  header: 'Aksi',
                  headerClassName: 'w-24 text-center',
                  cellClassName: 'text-center',
                  render: (perm: PermissionItem) => (
                    <div className="flex items-center justify-center gap-1.5">
                      <RowActionButton
                        to={`/izin/edit/${perm.id}`}
                        label={`Edit izin ${perm.nama}`}
                      >
                        <PencilSquareIcon className="w-4 h-4" aria-hidden="true" />
                      </RowActionButton>
                      <RowActionButton
                        onClick={() => setAkanDihapus(perm)}
                        variant="danger"
                        disabled={menghapus}
                        label={`Hapus izin ${perm.nama}`}
                      >
                        <TrashIcon className="w-4 h-4" aria-hidden="true" />
                      </RowActionButton>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
      />
      <NotificationModal isOpen={Boolean(akanDihapus)} type="confirm" title="Hapus Izin?" message={`Hak izin «${akanDihapus?.nama ?? ''}» (${akanDihapus?.kode ?? ''}) akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`} confirmLabel="Hapus Izin" onConfirm={handleDelete} onClose={() => setAkanDihapus(null)} loading={menghapus} />
      <NotificationModal isOpen={Boolean(galat)} type="error" title={galat?.title} message={galat?.message ?? ''} details={galat?.details} code={galat?.code} onClose={() => setGalat(null)} />

      {/* Form tambah/ubah izin kini halaman penuh: /izin/tambah & /izin/edit/:id */}
    </>
  );
};
export default IzinPage;
