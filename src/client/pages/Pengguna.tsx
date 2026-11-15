import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { CardContainer } from '../components/CardContainer';
import { DataTable } from '../components/DataTable';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { useAuth } from '../context/AuthContext';
import { IZIN_FITUR } from '../lib/appAccess';
import {
  fetchUsers,
  deleteUserAssignment,
  UserRoleAssignment,
} from '../services/api';
import {
  UserGroupIcon,
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

export const PenggunaPage: React.FC = () => {
  const { bisa } = useAuth();
  const [users, setUsers] = useState<UserRoleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const canManage = bisa(IZIN_FITUR.penggunaKelola, IZIN_FITUR.peranKelola);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUsers();
      setUsers(res.data.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Gagal memuat daftar penugasan pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (userItem: UserRoleAssignment) => {
    if (userItem.username === 'admin') {
      alert('Penugasan akun admin utama tidak dapat dihapus');
      return;
    }
    if (window.confirm(`Yakin ingin menghapus seluruh penugasan peran lokal untuk "${userItem.nama}" (${userItem.username})?`)) {
      try {
        await deleteUserAssignment(userItem.username);
        loadData();
      } catch (err: any) {
        alert(err?.response?.data?.message || 'Gagal menghapus penugasan pengguna');
      }
    }
  };

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.nama.toLowerCase().includes(q) ||
        u.roles.some((r) => r.nama.toLowerCase().includes(q) || r.kode.toLowerCase().includes(q))
    );
  }, [users, search]);

  return (
    <PageShell
      title="Manajemen Pengguna & Penugasan Peran"
      description="Pengaturan multi-role lokal untuk dosen, reviewer, dan pengelola LPPM UNUSU."
      actions={
        canManage ? (
          <Link
            to="/pengguna/tambah"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md transition-all active:scale-[0.98]"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Tugaskan Pengguna</span>
          </Link>
        ) : undefined
      }
    >
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
          title="Tidak Ada Data Pengguna"
          description={
            search
              ? 'Tidak ditemukan pengguna yang cocok dengan pencarian Anda.'
              : 'Belum ada pengguna yang ditugaskan ke peran lokal LPPM.'
          }
          action={
            canManage ? (
              <Link
                to="/pengguna/tambah"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Tugaskan Pengguna Baru</span>
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
            rowKey={(item) => item.username}
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
                render: (item) =>
                  item.username.includes('@')
                    ? item.username
                    : `${item.username.toLowerCase()}@unusu.ac.id`,
              },
              {
                key: 'roles',
                header: 'Role Terkait',
                render: (item) =>
                  item.roles.length === 0 ? (
                    <span className="text-slate-400">-</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-w-md">
                      {item.roles.map((r) => (
                        <span
                          key={r.id}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold border ${badgeForRole(
                            r.kode,
                          )}`}
                        >
                          <ShieldCheckIcon className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{r.nama}</span>
                        </span>
                      ))}
                    </div>
                  ),
              },
              {
                key: 'status',
                header: 'Status Akun',
                headerClassName: 'w-36',
                render: () => (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                    Aktif
                  </span>
                ),
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
                            to={`/pengguna/edit/${encodeURIComponent(item.username)}`}
                            className="inline-flex items-center justify-center w-9 h-9 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-[8px] border border-slate-200 transition-colors"
                            title="Edit Pengguna"
                            aria-label={`Edit ${item.nama}`}
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </Link>
                          {item.username !== 'admin' &&
                            !item.roles.some((r) => r.kode === 'SUPERADMIN') && (
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
    </PageShell>
  );
};
