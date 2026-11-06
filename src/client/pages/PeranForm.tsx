import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormPageTemplate } from '../components/FormPageTemplate';
import { CardContainer } from '../components/CardContainer';
import { ErrorState } from '../components/ErrorState';
import {
  fetchRoles,
  fetchPermissions,
  createRole,
  updateRole,
  PermissionItem,
} from '../services/api';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

/**
 * PeranFormPage — halaman penuh tambah/ubah peran LPPM.
 *
 * Menggantikan modal dialog `Modal Form Tambah/Edit Peran` pada `Peran.tsx`.
 * Rute: `/peran/tambah` dan `/peran/edit/:id`.
 *
 * Setelah berhasil menyimpan, pengguna TETAP di halaman formulir (tidak
 * diarahkan kembali ke daftar), sesuai preferensi navigasi panel.
 */
export const PeranFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    deskripsi: '',
    permissionIds: [] as number[],
  });

  // Muat katalog izin untuk alokasi hak akses.
  useEffect(() => {
    let aktif = true;
    setLoadingPermissions(true);
    fetchPermissions()
      .then((res) => {
        if (aktif) setPermissions(res.data.data || []);
      })
      .catch((err: any) => {
        if (aktif) {
          setPermissionsError(
            err?.response?.data?.message || 'Gagal memuat katalog hak izin.'
          );
        }
      })
      .finally(() => {
        if (aktif) setLoadingPermissions(false);
      });
    return () => {
      aktif = false;
    };
  }, []);

  // Mode ubah: muat detail peran yang akan diedit dari daftar peran.
  useEffect(() => {
    if (!isEdit || !id) return;
    let aktif = true;
    fetchRoles()
      .then((res) => {
        if (!aktif) return;
        const daftar = res.data.data || [];
        const peran = daftar.find((r: any) => String(r.id) === String(id));
        if (!peran) {
          setError('Peran tidak ditemukan. Mungkin sudah dihapus.');
          return;
        }
        setFormData({
          kode: peran.kode || '',
          nama: peran.nama || '',
          deskripsi: peran.deskripsi || '',
          permissionIds: peran.permissions?.map((p: any) => p.permissionId) || [],
        });
      })
      .catch((err: any) => {
        if (aktif) {
          setError(err?.response?.data?.message || 'Gagal memuat detail peran.');
        }
      });
    return () => {
      aktif = false;
    };
  }, [id, isEdit]);

  const permissionsByModule = useMemo(() => {
    const map = new Map<string, PermissionItem[]>();
    permissions.forEach((p) => {
      const list = map.get(p.modul) || [];
      list.push(p);
      map.set(p.modul, list);
    });
    return map;
  }, [permissions]);

  const handleTogglePermission = (permissionId: number) => {
    setFormData((prev) => {
      const ada = prev.permissionIds.includes(permissionId);
      return {
        ...prev,
        permissionIds: ada
          ? prev.permissionIds.filter((pid) => pid !== permissionId)
          : [...prev.permissionIds, permissionId],
      };
    });
  };

  const handleSelectAllModule = (modulePerms: PermissionItem[]) => {
    const ids = modulePerms.map((p) => p.id);
    const semuaTerpilih = ids.every((pid) => formData.permissionIds.includes(pid));
    setFormData((prev) => ({
      ...prev,
      permissionIds: semuaTerpilih
        ? prev.permissionIds.filter((pid) => !ids.includes(pid))
        : Array.from(new Set([...prev.permissionIds, ...ids])),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSukses(null);

    if (!formData.nama.trim()) {
      setError('Nama peran wajib diisi.');
      return;
    }
    if (!isEdit && !formData.kode.trim()) {
      setError('Kode peran wajib diisi.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (isEdit && id) {
        await updateRole(Number(id), {
          nama: formData.nama,
          deskripsi: formData.deskripsi,
          permissionIds: formData.permissionIds,
        });
        setSukses(`Perubahan peran "${formData.nama}" berhasil disimpan.`);
      } else {
        await createRole({
          kode: formData.kode,
          nama: formData.nama,
          deskripsi: formData.deskripsi,
          permissionIds: formData.permissionIds,
        });
        setSukses(`Peran "${formData.nama}" berhasil ditambahkan.`);
        // Tetap di halaman form: kosongkan isian agar bisa menambah berikutnya.
        setFormData({ kode: '', nama: '', deskripsi: '', permissionIds: [] });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal menyimpan data peran.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPageTemplate
      title={isEdit ? 'Ubah Peran Pengguna' : 'Tambah Peran Pengguna Baru'}
      description="Konfigurasi peran (role) sistem LPPM UNUSU dan alokasi hak izin operasional Tridharma perguruan tinggi."
      badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#EDE8F5] border border-violet-200 text-[10px] font-bold uppercase tracking-wider text-violet-900">
          <ShieldCheckIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Tata Kelola
        </span>
      }
      backTo="/peran"
      backLabel="Kembali"
      isEdit={isEdit}
      submitLabel={isEdit ? 'Simpan Perubahan' : 'Simpan Peran'}
      submitting={submitting}
      error={error}
      onSubmit={handleSubmit}
      accentClassName="bg-violet-700 hover:bg-violet-800"
    >
      {sukses && (
        <div
          role="status"
          className="p-4 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold"
        >
          {sukses}
        </div>
      )}

      <CardContainer
        title="Identitas Peran"
        subtitle="Kode unik dipakai sistem, nama tampilan dipakai antarmuka pengguna."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="peran-kode" className="block text-xs font-bold text-slate-700 mb-1">
              Kode Peran <span className="text-rose-500">*</span>
            </label>
            <input
              id="peran-kode"
              type="text"
              required
              disabled={isEdit}
              value={formData.kode}
              onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
              placeholder="Misal: REVIEWER_LPPM"
              className="w-full px-3 py-2 min-h-[44px] text-xs sm:text-sm rounded-[10px] border border-[#CBD5E1] font-mono uppercase disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700"
            />
            {isEdit && (
              <p className="text-[11px] text-slate-400 mt-1">
                Kode peran tidak dapat diubah setelah dibuat.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="peran-nama" className="block text-xs font-bold text-slate-700 mb-1">
              Nama Peran <span className="text-rose-500">*</span>
            </label>
            <input
              id="peran-nama"
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Misal: Reviewer Proposal LPPM"
              className="w-full px-3 py-2 min-h-[44px] text-xs sm:text-sm rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700"
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="peran-deskripsi" className="block text-xs font-bold text-slate-700 mb-1">
            Deskripsi &amp; Wewenang
          </label>
          <textarea
            id="peran-deskripsi"
            rows={3}
            value={formData.deskripsi}
            onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
            placeholder="Deskripsi tugas dan batasan akses wewenang peran ini..."
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700"
          />
        </div>
      </CardContainer>

      <CardContainer
        title={`Alokasi Hak Izin (${formData.permissionIds.length} dipilih)`}
        subtitle="Centang izin yang boleh dijalankan oleh pemegang peran ini."
      >
        {loadingPermissions ? (
          <div className="py-16 text-center text-xs text-slate-500 font-medium">
            Memuat katalog hak izin...
          </div>
        ) : permissionsError ? (
          <ErrorState title="Gagal Memuat Izin" description={permissionsError} />
        ) : (
          <div className="space-y-4 border border-[#CBD5E1] rounded-[12px] p-3 bg-slate-50/50">
            {Array.from(permissionsByModule.entries()).map(([modul, modulePerms]) => {
              const semuaTerpilih = modulePerms.every((p) =>
                formData.permissionIds.includes(p.id)
              );
              return (
                <div key={modul} className="bg-white p-3 rounded-[10px] border border-slate-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <span className="text-xs font-bold text-violet-900 tracking-wide">
                      MODUL: {modul.toUpperCase()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectAllModule(modulePerms)}
                      className="min-h-[44px] px-2 text-[11px] font-semibold text-violet-700 hover:text-violet-900 cursor-pointer"
                    >
                      {semuaTerpilih ? 'Batal Semua' : 'Pilih Semua'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {modulePerms.map((p) => {
                      const terpilih = formData.permissionIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-start gap-2 p-2 rounded-[8px] border text-xs cursor-pointer transition-colors ${
                            terpilih
                              ? 'bg-violet-50/70 border-violet-300 text-violet-950'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={terpilih}
                            onChange={() => handleTogglePermission(p.id)}
                            className="mt-0.5 rounded text-violet-700 focus:ring-violet-600 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold leading-tight">{p.nama}</div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              {p.kode}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContainer>
    </FormPageTemplate>
  );
};

export default PeranFormPage;
