import React, { useEffect, useState, useMemo } from 'react';
import { AdminPanelTemplate } from '../components/AdminPanelTemplate';
import { CardContainer } from '../components/CardContainer';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { useAuth } from '../context/AuthContext';
import {
  fetchPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  PermissionItem,
} from '../services/api';
import {
  KeyIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ShieldCheckIcon,
  XMarkIcon,
  CheckIcon,
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
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedModul, setSelectedModul] = useState<string>('SEMUA');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerm, setEditingPerm] = useState<PermissionItem | null>(null);
  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    modul: 'Penelitian',
    deskripsi: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPermissions();
      setPermissions(res.data.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Gagal memuat katalog hak izin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingPerm(null);
    setFormData({
      kode: '',
      nama: '',
      modul: 'Penelitian',
      deskripsi: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (perm: PermissionItem) => {
    setEditingPerm(perm);
    setFormData({
      kode: perm.kode,
      nama: perm.nama,
      modul: perm.modul,
      deskripsi: perm.deskripsi || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      setFormError('Nama izin wajib diisi');
      return;
    }
    if (!editingPerm && !formData.kode.trim()) {
      setFormError('Kode izin wajib diisi');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingPerm) {
        await updatePermission(editingPerm.id, {
          nama: formData.nama,
          modul: formData.modul,
          deskripsi: formData.deskripsi,
        });
      } else {
        await createPermission({
          kode: formData.kode,
          nama: formData.nama,
          modul: formData.modul,
          deskripsi: formData.deskripsi,
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      setFormError(err?.response?.data?.message || 'Gagal menyimpan izin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (perm: PermissionItem) => {
    if (window.confirm(`Yakin ingin menghapus hak izin "${perm.nama}" (${perm.kode})?`)) {
      try {
        await deletePermission(perm.id);
        loadData();
      } catch (err: any) {
        alert(err?.response?.data?.message || 'Gagal menghapus hak izin');
      }
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
    <AdminPanelTemplate
      title="Katalog Izin & Hak Akses"
      description="Daftar hak izin (permissions) granuler yang mengatur kewenangan operasional sistem penelitian, pengabdian, dan publikasi LPPM UNUSU."
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
              <span>Tambah Izin</span>
            </button>
          )}
        </div>
      }
    >
      {/* Search & Filter */}
      <CardContainer>
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari izin berdasarkan nama, kode wewenang, atau deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] border border-[#CBD5E1] bg-slate-50 text-xs font-semibold text-slate-600 flex-shrink-0">
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
              <span>Filter Modul:</span>
            </div>
            <select
              value={selectedModul}
              onChange={(e) => setSelectedModul(e.target.value)}
              className="px-3 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-violet-600 transition-colors cursor-pointer"
            >
              <option value="SEMUA">Semua Modul ({permissions.length})</option>
              {availableModules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardContainer>

      {/* Tabel Izin */}
      <CardContainer
        title="Daftar Izin Sistem Terdaftar"
        subtitle={`Menampilkan ${filteredPermissions.length} hak izin operasional dalam ekosistem LPPM`}
      >
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <ArrowPathIcon className="w-8 h-8 mx-auto animate-spin text-violet-700 mb-2" />
            <p className="text-sm font-semibold">Memuat katalog izin...</p>
          </div>
        ) : error ? (
          <ErrorState description={error} onRetry={loadData} />
        ) : filteredPermissions.length === 0 ? (
          <EmptyState
            title="Izin Tidak Ditemukan"
            description="Tidak ada hak izin yang sesuai dengan kriteria pencarian."
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[#CBD5E1] text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                  <th className="py-3 px-3.5 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[200px]">Kode Izin (System Key)</th>
                  <th className="py-3 px-4 min-w-[220px]">Nama Izin</th>
                  <th className="py-3 px-4 min-w-[150px]">Modul</th>
                  <th className="py-3 px-4 min-w-[240px]">Deskripsi Wewenang</th>
                  <th className="py-3 px-4 min-w-[130px] text-center">Peran Terkait</th>
                  <th className="py-3 px-4 min-w-[120px]">Dibuat</th>
                  {isAdmin && <th className="py-3 px-4 w-24 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-[13px]">
                {filteredPermissions.map((perm, idx) => {
                  const roleCount = perm.roles?.length || 0;
                  const formattedDate = perm.createdAt
                    ? new Date(perm.createdAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '-';
                  return (
                    <tr key={perm.id} className="hover:bg-violet-50/30 transition-colors">
                      <td className="py-3.5 px-3.5 text-center text-slate-400 font-mono text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-violet-800 text-xs">
                        <span className="bg-violet-50 px-2 py-0.5 rounded border border-violet-200 inline-block">
                          {perm.kode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {perm.nama}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {perm.modul}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs leading-relaxed">
                        {perm.deskripsi || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200"
                          title={perm.roles?.map((r) => r.role.nama).join(', ')}
                        >
                          <ShieldCheckIcon className="w-3.5 h-3.5" />
                          <span>{roleCount} Peran</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono whitespace-nowrap">
                        {formattedDate}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditModal(perm)}
                              className="p-1.5 rounded-[8px] border border-[#CBD5E1] text-slate-600 hover:text-violet-700 hover:bg-violet-50 transition-colors cursor-pointer"
                              title="Edit Izin"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(perm)}
                              className="p-1.5 rounded-[8px] border border-[#CBD5E1] text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus Izin"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContainer>

      {/* Modal Tambah/Edit Izin */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-[16px] border border-[#CBD5E1] shadow-2xl max-w-lg w-full p-6 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingPerm ? `Ubah Hak Izin: ${editingPerm.nama}` : 'Tambah Hak Izin Baru'}
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

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kode Izin (System Key) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!!editingPerm}
                  value={formData.kode}
                  onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                  placeholder="Misal: penelitian.review"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-[10px] border border-[#CBD5E1] font-mono lowercase disabled:bg-slate-100 disabled:text-slate-500"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Format konvensi: modul.aksi (contoh: penelitian.create, laporan.export)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Izin <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Misal: Review & Penilaian Usulan"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-[10px] border border-[#CBD5E1]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategori Modul <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.modul}
                  onChange={(e) => setFormData({ ...formData, modul: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-[10px] border border-[#CBD5E1] bg-white cursor-pointer"
                  required
                >
                  {MODUL_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Wewenang</label>
                <textarea
                  rows={3}
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Penjelasan wewenang yang diberikan oleh izin ini..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-[10px] border border-[#CBD5E1]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
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
                      <span>Simpan Izin</span>
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
export default IzinPage;
