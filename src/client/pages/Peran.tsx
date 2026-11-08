import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { CardContainer } from '../components/CardContainer';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { useAuth } from '../context/AuthContext';
import { IZIN_FITUR } from '../lib/appAccess';
import {
  fetchRoles,
  fetchPermissions,
  deleteRole,
  RoleItem,
  PermissionItem,
} from '../services/api';
import {
  ShieldCheckIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  KeyIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

export const PeranPage: React.FC = () => {
  const { bisa } = useAuth();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Tombol ubah/tambah muncul atas dasar izin, bukan nama peran.
  const isAdmin = bisa(IZIN_FITUR.peranKelola);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetchRoles(),
        fetchPermissions(),
      ]);
      setRoles(rolesRes.data.data || []);
      setPermissions(permsRes.data.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Gagal memuat data peran sistem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (role: RoleItem) => {
    if (role.kode === 'SUPERADMIN') {
      alert('Peran SUPERADMIN tidak dapat dihapus');
      return;
    }
    if (window.confirm(`Yakin ingin menghapus peran "${role.nama}"?`)) {
      try {
        await deleteRole(role.id);
        loadData();
      } catch (err: any) {
        alert(err?.response?.data?.message || 'Gagal menghapus peran');
      }
    }
  };

  // Group permissions by module
  const permissionsByModule = useMemo(() => {
    const map = new Map<string, PermissionItem[]>();
    permissions.forEach((p) => {
      const list = map.get(p.modul) || [];
      list.push(p);
      map.set(p.modul, list);
    });
    return map;
  }, [permissions]);

  const filteredRoles = useMemo(() => {
    return roles.filter(
      (r) =>
        r.nama.toLowerCase().includes(search.toLowerCase()) ||
        r.kode.toLowerCase().includes(search.toLowerCase()) ||
        (r.deskripsi && r.deskripsi.toLowerCase().includes(search.toLowerCase()))
    );
  }, [roles, search]);

  return (
    <PageShell
      title="Manajemen Peran Pengguna"
      description="Konfigurasi peran (role) sistem LPPM UNUSU dan alokasi hak izin operasional Tridharma perguruan tinggi."
      badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#EDE8F5] border border-violet-200 text-[10px] font-bold uppercase tracking-wider text-violet-900">
          <ShieldCheckIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Tata Kelola
        </span>
      }
      actions={
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-[12px] border border-[#CBD5E1] bg-white text-slate-600 hover:text-violet-900 hover:bg-[#F3EEF9] transition-colors cursor-pointer shadow-2xs"
            title="Segarkan Data"
            aria-label="Muat ulang daftar peran"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
          {isAdmin && (
            <Link
              to="/peran/tambah"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-[12px] bg-violet-700 hover:bg-violet-800 text-white text-sm font-bold transition-all shadow-2xs hover:shadow-sm cursor-pointer"
            >
              <PlusIcon className="w-5 h-5" aria-hidden="true" />
              <span>Tambah Peran</span>
            </Link>
          )}
        </div>
      }
    >
      {/* Search & Counter */}
      <CardContainer>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari peran berdasarkan nama, kode, atau fungsi..."
              aria-label="Cari peran berdasarkan nama, kode, atau fungsi"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-600 transition-colors"
            />
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-slate-50 px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4 text-violet-700" />
            <span>Total: {roles.length} Peran Sistem</span>
          </div>
        </div>
      </CardContainer>

      {/* Role Cards List */}
      <CardContainer
        title="Daftar Hak Akses & Peran Sistem LPPM"
        subtitle="Struktur hak wewenang akses sivitas akademika terhubung ONE UNUSU SSO"
      >
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <ArrowPathIcon className="w-8 h-8 mx-auto animate-spin text-violet-700 mb-2" />
            <p className="text-sm font-semibold">Memuat daftar peran...</p>
          </div>
        ) : error ? (
          <ErrorState description={error} onRetry={loadData} />
        ) : filteredRoles.length === 0 ? (
          <EmptyState
            title="Peran Tidak Ditemukan"
            description="Tidak ada peran sistem yang cocok dengan kriteria pencarian Anda."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRoles.map((role) => {
              const permCount = role.permissions?.length || 0;
              const isSuper = role.kode === 'SUPERADMIN';

              return (
                <div
                  key={role.id}
                  className="bg-white border border-[#CBD5E1] rounded-[14px] p-5 shadow-2xs hover:border-violet-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-[10px] bg-violet-50 text-violet-700 border border-violet-100 flex items-center justify-center flex-shrink-0">
                          <ShieldCheckIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                            {role.nama}
                          </h3>
                          <span className="font-mono text-[11px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-200 inline-block mt-1">
                            {role.kode}
                          </span>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/peran/edit/${role.id}`}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[8px] border border-[#CBD5E1] text-slate-600 hover:text-violet-700 hover:bg-violet-50 transition-colors cursor-pointer"
                            title="Edit Peran & Izin"
                            aria-label={`Edit peran ${role.nama}`}
                          >
                            <PencilSquareIcon className="w-4 h-4" aria-hidden="true" />
                          </Link>
                          {!isSuper && (
                            <button
                              onClick={() => handleDelete(role)}
                              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-[8px] border border-[#CBD5E1] text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus Peran"
                              aria-label={`Hapus peran ${role.nama}`}
                            >
                              <TrashIcon className="w-4 h-4" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                      {role.deskripsi || 'Tidak ada keterangan deskripsi tambahan.'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <KeyIcon className="w-3.5 h-3.5 text-slate-400" />
                          Izin Akses ({permCount})
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {permCount === permissions.length ? 'Akses Penuh' : `${permCount} dari ${permissions.length}`}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {role.permissions && role.permissions.length > 0 ? (
                          role.permissions.map((p) => (
                            <span
                              key={p.permissionId}
                              className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                              title={p.permission?.deskripsi || p.permission?.kode}
                            >
                              {p.permission?.nama || p.permission?.kode}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">Belum ada izin yang dialokasikan</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Sistem LPPM UNUSU</span>
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckBadgeIcon className="w-3.5 h-3.5" />
                      Terdaftar Aktif
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContainer>

      {/* Form tambah/ubah peran kini halaman penuh: /peran/tambah & /peran/edit/:id */}
    </PageShell>
  );
};
export default PeranPage;
