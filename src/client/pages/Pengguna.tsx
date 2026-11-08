import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { CardContainer } from '../components/CardContainer';
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
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Username / NIDN / NIM</th>
                  <th className="py-3.5 px-4">Nama Civitas</th>
                  <th className="py-3.5 px-4">Peran Lokal LPPM (Multi-Role)</th>
                  <th className="py-3.5 px-4">Ditugaskan Pada</th>
                  {canManage && <th className="py-3.5 px-4 w-28 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((item, idx) => (
                  <tr key={item.username} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {item.username}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {item.nama}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {item.roles.map((r) => (
                          <span
                            key={r.id}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeForRole(
                              r.kode
                            )}`}
                          >
                            <ShieldCheckIcon className="w-3 h-3" />
                            <span>{r.nama}</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      }) : '-'}
                    </td>
                    {canManage && (
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            to={`/pengguna/edit/${encodeURIComponent(item.username)}`}
                            className="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-[8px] transition-colors"
                            title="Ubah Penugasan Peran"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </Link>
                          {item.username !== 'admin' && (
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-[8px] transition-colors"
                              title="Hapus Penugasan Pengguna"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContainer>
      )}
    </PageShell>
  );
};
