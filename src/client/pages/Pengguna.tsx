import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { CardContainer } from '../components/CardContainer';
import { DataTable } from '../components/DataTable';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { ModalAturPeran } from '../components/ModalAturPeran';
import { useAuth } from '../context/AuthContext';
import { IZIN_FITUR } from '../lib/appAccess';
import {
  fetchUsers,
  fetchRoles,
  updateUserAssignment,
  deleteUserAssignment,
  type PenggunaLppm,
  type RoleItem,
} from '../services/api';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const ROLE_BADGE: Record<string, string> = {
  SUPERADMIN: 'bg-rose-50 text-rose-700 border-rose-200',
  ADMIN_LPPM: 'bg-violet-50 text-violet-700 border-violet-200',
  DOSEN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REVIEWER: 'bg-amber-50 text-amber-700 border-amber-200',
};

function badgeForRole(kode: string): string {
  return ROLE_BADGE[kode] || 'bg-slate-50 text-slate-700 border-slate-200';
}

/**
 * PenggunaPage — daftar pengguna panel LPPM.
 *
 * Seluruh akun berasal dari direktori ONE UNUSU dan didaftarkan Admin LPPM.
 * Penugasan peran dilakukan lewat modal "Atur Peran" agar lebih rapi dan jelas.
 */
export const PenggunaPage: React.FC = () => {
  const { bisa } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [users, setUsers] = useState<PenggunaLppm[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [menyimpan, setMenyimpan] = useState<number | null>(null);

  // Modal atur peran
  const [penggunaModal, setPenggunaModal] = useState<PenggunaLppm | null>(null);
  const [galatModal, setGalatModal] = useState<string | null>(null);
  const [menyimpanPeran, setMenyimpanPeran] = useState(false);

  // Pesan sukses yang dibawa dari halaman Tambah Pengguna
  const [pesanSukses, setPesanSukses] = useState<string | null>(
    (location.state as { pesan?: string } | null)?.pesan ?? null
  );

  useEffect(() => {
    if (!pesanSukses) return;
    navigate(location.pathname, { replace: true, state: null });
    const jeda = setTimeout(() => setPesanSukses(null), 6000);
    return () => clearTimeout(jeda);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canManage = bisa(IZIN_FITUR.penggunaKelola, IZIN_FITUR.peranKelola);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUsers();
      setUsers(res.data.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Gagal memuat daftar pengguna LPPM');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    fetchRoles()
      .then((res) => setRoles(res.data.data || []))
      .catch(() => {
        /* daftar peran dibiarkan kosong */
      });
  }, []);

  const isSuperadmin = (u: PenggunaLppm) =>
    (u.ssoRole || '').toUpperCase() === 'SUPERADMIN' || u.peran.includes('SUPERADMIN');

  const simpanPeranModal = async (kode: string) => {
    if (!penggunaModal) return;
    setGalatModal(null);
    setMenyimpanPeran(true);
    try {
      await updateUserAssignment(penggunaModal.id, {
        peran: kode ? [kode] : [],
      });
      setPenggunaModal(null);
      await loadData();
    } catch (err: any) {
      setGalatModal(err?.response?.data?.message || 'Gagal mengubah peran pengguna');
    } finally {
      setMenyimpanPeran(false);
    }
  };

  const gantiStatus = async (u: PenggunaLppm, status: string) => {
    if (u.status === status) return;
    setMenyimpan(u.id);
    try {
      await updateUserAssignment(u.id, { status });
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal mengubah status pengguna');
    } finally {
      setMenyimpan(null);
    }
  };

  const handleDelete = async (u: PenggunaLppm) => {
    if (!window.confirm(`Yakin ingin menghapus "${u.nama}" (${u.username}) dari pengguna LPPM?`)) return;
    try {
      await deleteUserAssignment(u.id);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal menghapus pengguna');
    }
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.nama.toLowerCase().includes(q) ||
        u.peran.some((p) => p.toLowerCase().includes(q))
    );
  }, [users, search]);

  return (
    <PageShell
      title="Manajemen Pengguna"
      description="Pengguna panel LPPM dipilih dari direktori ONE UNUSU dan diberi peran oleh Admin LPPM."
      actions={
        canManage ? (
          <Link
            to="/pengguna/tambah"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md transition-all active:scale-[0.98]"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Tambah Pengguna</span>
          </Link>
        ) : undefined
      }
    >
      {pesanSukses && (
        <div
          role="status"
          className="mb-6 px-4 py-3.5 rounded-[12px] bg-[#F0FDF4] border border-[#166534] text-[#166534] text-xs font-semibold"
        >
          {pesanSukses}
        </div>
      )}

      <CardContainer className="mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, NIDN, atau peran..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-[8px] transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Segarkan</span>
          </button>
        </div>
      </CardContainer>

      {error && <ErrorState description={error} onRetry={loadData} />}

      {!loading && !error && filteredUsers.length === 0 && (
        <EmptyState
          title="Belum Ada Pengguna"
          description={
            search
              ? 'Tidak ditemukan pengguna yang cocok dengan pencarian Anda.'
              : 'Belum ada pengguna yang didaftarkan ke panel LPPM. Tambahkan dari direktori ONE UNUSU.'
          }
          action={
            canManage ? (
              <Link
                to="/pengguna/tambah"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Tambah Pengguna</span>
              </Link>
            ) : undefined
          }
        />
      )}

      {!loading && !error && filteredUsers.length > 0 && (
        <CardContainer>
          <DataTable
            minTableWidth="min-w-[1180px]"
            rows={filteredUsers}
            rowKey={(item) => item.id}
            columns={[
              {
                key: 'no',
                header: 'No',
                headerClassName: 'w-12 text-center',
                cellClassName: 'text-center text-slate-400 font-mono',
                render: (_, idx) => idx + 1,
              },
              {
                key: 'username',
                header: 'NIDN / NIM',
                headerClassName: 'w-40',
                cellClassName: 'font-mono font-semibold text-slate-900',
                render: (item) => item.username,
              },
              {
                key: 'nama',
                header: 'Nama Lengkap',
                headerClassName: 'min-w-[200px]',
                cellClassName: 'font-medium text-slate-900',
                render: (item) => item.nama,
              },
              {
                key: 'email',
                header: 'Email',
                headerClassName: 'min-w-[220px]',
                cellClassName: 'text-slate-600 font-mono',
                render: (item) => item.email || '—',
              },
              {
                key: 'peran',
                header: 'Peran LPPM',
                headerClassName: 'min-w-[190px]',
                render: (item) => {
                  const superadmin = isSuperadmin(item);
                  const label =
                    item.peran.length === 0 ? 'Tanpa peran' : item.peran.join(', ');

                  if (!canManage || superadmin) {
                    return (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold border text-xs ${badgeForRole(
                          item.peran[0] || ''
                        )}`}
                      >
                        {label}
                      </span>
                    );
                  }

                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setGalatModal(null);
                        setPenggunaModal(item);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[36px] rounded-[8px] border border-[#D8E5DC] bg-white text-slate-900 hover:bg-[#F0FDF4] hover:border-[#166534] text-xs font-semibold transition cursor-pointer"
                      aria-label={`Atur peran ${item.nama}`}
                    >
                      <ShieldCheckIcon className="w-3.5 h-3.5 text-[#166534] flex-shrink-0" />
                      <span className="truncate max-w-[140px]">{label}</span>
                    </button>
                  );
                },
              },
              {
                key: 'status',
                header: 'Status Akun',
                headerClassName: 'w-36',
                render: (item) => {
                  if (!canManage || isSuperadmin(item)) {
                    const aktif = item.status === 'Aktif';
                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold border ${
                          aktif
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${aktif ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          aria-hidden="true"
                        />
                        {item.status}
                      </span>
                    );
                  }

                  return (
                    <select
                      value={item.status}
                      disabled={menyimpan === item.id}
                      onChange={(e) => gantiStatus(item, e.target.value)}
                      className="w-full px-3 py-2 min-h-[36px] text-xs font-semibold rounded-[8px] border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 disabled:opacity-60 cursor-pointer"
                      aria-label={`Status ${item.nama}`}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                  );
                },
              },
              ...(canManage
                ? [
                    {
                      key: 'aksi',
                      header: 'Aksi',
                      headerClassName: 'w-28 text-center',
                      cellClassName: 'text-center',
                      render: (item: (typeof filteredUsers)[number]) => (
                        <div className="inline-flex items-center justify-center gap-2">
                          <Link
                            to={`/pengguna/edit/${item.id}`}
                            className="inline-flex items-center justify-center w-9 h-9 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-[8px] border border-slate-200 transition-colors"
                            title="Edit Pengguna"
                            aria-label={`Edit ${item.nama}`}
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </Link>
                          {!isSuperadmin(item) && (
                            <button
                              onClick={() => handleDelete(item)}
                              className="inline-flex items-center justify-center w-9 h-9 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-[8px] border border-slate-200 transition-colors cursor-pointer"
                              title="Hapus Pengguna"
                              aria-label={`Hapus ${item.nama}`}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </CardContainer>
      )}

      <ModalAturPeran
        terbuka={Boolean(penggunaModal)}
        pengguna={penggunaModal}
        opsiPeran={roles}
        sedangMenyimpan={menyimpanPeran}
        pesanGalat={galatModal}
        onTutup={() => {
          if (menyimpanPeran) return;
          setPenggunaModal(null);
          setGalatModal(null);
        }}
        onSimpan={simpanPeranModal}
      />
    </PageShell>
  );
};
