import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormPageTemplate } from '../components/FormPageTemplate';
import { CardContainer } from '../components/CardContainer';
import { ErrorState } from '../components/ErrorState';
import {
  fetchRoles,
  fetchUsers,
  createUserAssignment,
  updateUserAssignment,
  RoleItem,
} from '../services/api';
import { ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export const PenggunaFormPage: React.FC = () => {
  const { username } = useParams<{ username?: string }>();
  const isEdit = Boolean(username);
  const navigate = useNavigate();

  const [loadingRoles, setLoadingRoles] = useState(true);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    nama: '',
    email: '',
    status: 'Aktif',
    roleIds: [] as number[],
  });

  const [isSuperadmin, setIsSuperadmin] = useState(false);

  // Muat daftar peran LPPM untuk pilihan
  useEffect(() => {
    let aktif = true;
    setLoadingRoles(true);
    fetchRoles()
      .then((res) => {
        if (aktif) {
          const list = res.data.data || [];
          setRoles(list);
          if (!isEdit && list.length > 0) {
            const dosenRole = list.find((r) => r.kode === 'DOSEN') || list[0];
            setFormData((prev) => ({ ...prev, roleIds: [dosenRole.id] }));
          }
        }
      })
      .catch((err: any) => {
        if (aktif) {
          setError(err?.response?.data?.message || 'Gagal memuat daftar peran sistem.');
        }
      })
      .finally(() => {
        if (aktif) setLoadingRoles(false);
      });
    return () => {
      aktif = false;
    };
  }, [isEdit]);

  // Mode Edit: muat data penugasan pengguna dari /api/users
  useEffect(() => {
    if (!isEdit || !username) return;
    let aktif = true;
    fetchUsers()
      .then((res) => {
        if (!aktif) return;
        const target = (res.data.data || []).find(
          (u) => u.username.toLowerCase() === decodeURIComponent(username).toLowerCase()
        );
        if (target) {
          const isSuper =
            target.roles.some((r) => r.kode === 'SUPERADMIN') ||
            target.username.toLowerCase() === 'superadmin' ||
            target.username.toLowerCase() === 'admin';
          setIsSuperadmin(isSuper);

          setFormData({
            username: target.username,
            nama: target.nama,
            email: target.username.includes('@')
              ? target.username
              : `${target.username.toLowerCase()}@unusu.ac.id`,
            status: 'Aktif',
            roleIds: target.roleIds || target.roles.map((r) => r.id),
          });
        } else {
          setError(`Pengguna "${username}" tidak ditemukan.`);
        }
      })
      .catch((err: any) => {
        if (aktif) setError(err?.response?.data?.message || 'Gagal memuat data pengguna.');
      });
    return () => {
      aktif = false;
    };
  }, [isEdit, username]);

  const toggleRole = (roleId: number, isSuperRole: boolean) => {
    // Guard UI: Role SUPERADMIN tidak boleh dilepas jika akun adalah superadmin
    if (isSuperadmin && isSuperRole) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSukses(null);

    if (formData.roleIds.length === 0) {
      setError('Pilih minimal satu peran (role) untuk pengguna ini');
      return;
    }

    try {
      setSubmitting(true);
      if (isEdit && username) {
        await updateUserAssignment(decodeURIComponent(username), {
          roleIds: formData.roleIds,
        });
        setSukses(`Penugasan peran untuk "${formData.nama}" berhasil diperbarui.`);
      } else {
        await createUserAssignment({
          username: formData.username.trim(),
          nama: formData.nama.trim(),
          roleIds: formData.roleIds,
        });
        setSukses(`Pengguna "${formData.nama}" berhasil ditugaskan ke LPPM.`);
      }
      setTimeout(() => {
        navigate('/pengguna');
      }, 1000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal menyimpan penugasan pengguna.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPageTemplate
      title={isEdit ? 'Ubah Penugasan Pengguna' : 'Tugaskan Pengguna Baru'}
      description={
        isEdit
          ? `Perbarui multi-role peran lokal untuk akun ${formData.username || username}.`
          : 'Tautkan civitas kampus ke peran lokal penelitian, pengabdian, atau reviewer LPPM.'
      }
      backTo="/pengguna"
      onSubmit={handleSubmit}
      submitting={submitting}
      error={error}
      isEdit={isEdit}
    >
      <div className="space-y-6">
        {sukses && (
          <div className="p-4 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{sukses}</span>
          </div>
        )}

        <CardContainer className="p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <UserGroupIcon className="w-5 h-5 text-violet-600" />
              <span>Biodata Pengguna (Single Source of Truth - ONE UNUSU SSO)</span>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Read-Only
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                NIDN / NIM
              </label>
              <input
                type="text"
                disabled
                value={formData.username}
                placeholder="NIDN / NIM civitas"
                className="w-full px-3.5 py-2.5 rounded-[10px] border text-sm font-mono bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Lengkap
              </label>
              <input
                type="text"
                disabled
                value={formData.nama}
                placeholder="Nama civitas"
                className="w-full px-3.5 py-2.5 rounded-[10px] border text-sm bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="text"
                disabled
                value={formData.email}
                placeholder="Email civitas"
                className="w-full px-3.5 py-2.5 rounded-[10px] border text-sm bg-slate-100 border-slate-200 text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 italic">
            Biodata (NIDN/NIM, Nama Lengkap, dan Email) disinkronkan secara otomatis dari portal pusat SSO ONE UNUSU dan tidak dapat diubah di sini.
          </p>
        </CardContainer>

        <CardContainer className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <ShieldCheckIcon className="w-5 h-5 text-violet-600" />
              <span>Role Terkait &amp; Status Akun</span>
              <span className="text-rose-500">*</span>
            </div>
            <span className="text-xs text-slate-500">
              {formData.roleIds.length} peran dipilih
            </span>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Status Akun
              </label>
              <select
                disabled={isSuperadmin}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={`w-full sm:w-64 px-3.5 py-2 rounded-[10px] border text-sm font-semibold transition-all ${
                  isSuperadmin
                    ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500'
                }`}
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
              {isSuperadmin && (
                <p className="mt-1 text-[11px] text-amber-600 font-medium">
                  🔒 Akun Super Administrator terkunci permanen pada status Aktif.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Daftar Role Terkait
              </label>
              {loadingRoles ? (
                <div className="p-4 text-center text-xs text-slate-500">Memuat katalog peran...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {roles.map((r) => {
                    const checked = formData.roleIds.includes(r.id);
                    const isSuperRole = r.kode === 'SUPERADMIN';
                    const isLocked = isSuperadmin && isSuperRole;

                    return (
                      <div
                        key={r.id}
                        onClick={() => toggleRole(r.id, isSuperRole)}
                        className={`flex items-start gap-3 p-3.5 rounded-[12px] border select-none transition-all ${
                          isLocked
                            ? 'bg-slate-100 border-slate-300 opacity-90 cursor-not-allowed'
                            : 'cursor-pointer hover:bg-slate-50/70'
                        } ${
                          checked && !isLocked
                            ? 'bg-violet-50/70 border-violet-300 shadow-xs'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isLocked}
                          onChange={() => {}}
                          className="mt-0.5 w-4 h-4 rounded text-violet-600 focus:ring-violet-500 disabled:opacity-75"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900">{r.nama}</span>
                            {isLocked && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                Terkunci
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {r.deskripsi || `Kode: ${r.kode}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContainer>
      </div>
    </FormPageTemplate>
  );
};
