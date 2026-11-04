import React, { useEffect, useState, useMemo } from 'react';
import { AdminPanelTemplate } from '../components/AdminPanelTemplate';
import { CardContainer } from '../components/CardContainer';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { useAuth } from '../context/AuthContext';
import {
  fetchRoles,
  fetchPermissions,
  createRole,
  updateRole,
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
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

export const PeranPage: React.FC = () => {
  const { canManageSystem } = useAuth();
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    deskripsi: '',
    permissionIds: [] as number[],
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isAdmin = canManageSystem;

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

  const openCreateModal = () => {
    setEditingRole(null);
    setFormData({
      kode: '',
      nama: '',
      deskripsi: '',
      permissionIds: [],
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (role: RoleItem) => {
    setEditingRole(role);
    setFormData({
      kode: role.kode,
      nama: role.nama,
      deskripsi: role.deskripsi || '',
      permissionIds: role.permissions?.map((p) => p.permissionId) || [],
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleTogglePermission = (id: number) => {
    setFormData((prev) => {
      const exists = prev.permissionIds.includes(id);
      return {
        ...prev,
        permissionIds: exists
          ? prev.permissionIds.filter((pId) => pId !== id)
          : [...prev.permissionIds, id],
      };
    });
  };

  const handleSelectAllModule = (modulePerms: PermissionItem[]) => {
    const modulePermIds = modulePerms.map((p) => p.id);
    const allSelected = modulePermIds.every((id) => formData.permissionIds.includes(id));

    setFormData((prev) => ({
      ...prev,
      permissionIds: allSelected
        ? prev.permissionIds.filter((id) => !modulePermIds.includes(id))
        : Array.from(new Set([...prev.permissionIds, ...modulePermIds])),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      setFormError('Nama peran wajib diisi');
      return;
    }
    if (!editingRole && !formData.kode.trim()) {
      setFormError('Kode peran wajib diisi');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingRole) {
        await updateRole(editingRole.id, {
          nama: formData.nama,
          deskripsi: formData.deskripsi,
          permissionIds: formData.permissionIds,
        });
      } else {
        await createRole({
          kode: formData.kode,
          nama: formData.nama,
          deskripsi: formData.deskripsi,
          permissionIds: formData.permissionIds,
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      setFormError(err?.response?.data?.message || 'Gagal menyimpan data peran');
    } finally {
      setSubmitting(false);
    }
  };

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
    <AdminPanelTemplate
      title="Manajemen Peran Pengguna"
      description="Konfigurasi peran (role) sistem LPPM UNUSU dan alokasi hak izin operasional Tridharma perguruan tinggi."
      actions={
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center justify-center p-2.5 h-[42px] w-[42px] rounded-[12px] border border-[#CBD5E1] bg-white text-slate-600 hover:text-violet-900 hover:bg-[#F3EEF9] transition-colors cursor-pointer shadow-2xs"
            title="Segarkan Data"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 h-[42px] rounded-[12px] bg-violet-700 hover:bg-violet-800 text-white text-sm font-bold transition-all shadow-2xs hover:shadow-sm cursor-pointer"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Tambah Peran</span>
            </button>
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
                          <button
                            onClick={() => openEditModal(role)}
                            className="p-1.5 rounded-[8px] border border-[#CBD5E1] text-slate-600 hover:text-violet-700 hover:bg-violet-50 transition-colors"
                            title="Edit Peran & Izin"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          {!isSuper && (
                            <button
                              onClick={() => handleDelete(role)}
                              className="p-1.5 rounded-[8px] border border-[#CBD5E1] text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                              title="Hapus Peran"
                            >
                              <TrashIcon className="w-4 h-4" />
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

      {/* Modal Form Tambah/Edit Peran */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-[16px] border border-[#CBD5E1] shadow-2xl max-w-2xl w-full p-6 relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingRole ? `Ubah Peran: ${editingRole.nama}` : 'Tambah Peran Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-[8px]"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 rounded-[10px] bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden mt-3">
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kode Peran <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={!!editingRole}
                      value={formData.kode}
                      onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                      placeholder="Misal: REVIEWER_LPPM"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-[10px] border border-[#CBD5E1] font-mono uppercase disabled:bg-slate-100 disabled:text-slate-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Peran <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      placeholder="Misal: Reviewer Proposal LPPM"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-[10px] border border-[#CBD5E1]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi & Wewenang</label>
                  <textarea
                    rows={2}
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                    placeholder="Deskripsi tugas dan batasan akses wewenang peran ini..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-[10px] border border-[#CBD5E1]"
                  />
                </div>

                {/* Permissions Allocation */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Alokasi Hak Izin (Permissions) ({formData.permissionIds.length} dipilih)
                    </label>
                  </div>

                  <div className="space-y-4 border border-[#CBD5E1] rounded-[12px] p-3 bg-slate-50/50">
                    {Array.from(permissionsByModule.entries()).map(([modul, modulePerms]) => {
                      const allSelected = modulePerms.every((p) => formData.permissionIds.includes(p.id));
                      return (
                        <div key={modul} className="bg-white p-3 rounded-[10px] border border-slate-200">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                            <span className="text-xs font-bold text-violet-900 tracking-wide">
                              MODUL: {modul.toUpperCase()}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSelectAllModule(modulePerms)}
                              className="text-[11px] font-semibold text-violet-700 hover:text-violet-900"
                            >
                              {allSelected ? 'Batal Semua' : 'Pilih Semua'}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {modulePerms.map((p) => {
                              const checked = formData.permissionIds.includes(p.id);
                              return (
                                <label
                                  key={p.id}
                                  className={`flex items-start gap-2 p-2 rounded-[8px] border text-xs cursor-pointer transition-colors ${
                                    checked
                                      ? 'bg-violet-50/70 border-violet-300 text-violet-950'
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleTogglePermission(p.id)}
                                    className="mt-0.5 rounded text-violet-700 focus:ring-violet-600 cursor-pointer"
                                  />
                                  <div className="min-w-0">
                                    <div className="font-semibold leading-tight">{p.nama}</div>
                                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">{p.kode}</div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-[10px] border border-[#CBD5E1] bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-[10px] bg-violet-700 hover:bg-violet-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                >
                  {submitting ? (
                    <>
                      <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-3.5 h-3.5" />
                      <span>Simpan Peran</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPanelTemplate>
  );
};
export default PeranPage;
