import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormPageTemplate } from '../components/FormPageTemplate';
import { CardContainer } from '../components/CardContainer';
import { TabelPilihPengguna } from '../components/TabelPilihPengguna';
import {
  fetchRoles,
  fetchUsers,
  createUserAssignment,
  updateUserAssignment,
  type RoleItem,
} from '../services/api';
import { ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline';

/**
 * PenggunaFormPage — tambah/ubah pengguna panel LPPM.
 *
 * Rute: `/pengguna/tambah` dan `/pengguna/edit/:id`.
 *
 * Mode TAMBAH langsung menampilkan tabel direktori ONE UNUSU lengkap dengan
 * pencarian dan filter peran/fakultas/prodi. Admin mencentang beberapa orang
 * sekaligus lalu menyimpan tanpa peran. Setelah tersimpan, diarahkan ke daftar
 * pengguna dan peran ditetapkan lewat modal "Atur Peran".
 */
export const PenggunaFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [rolesReady, setRolesReady] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);

  // Mode tambah: id yang dicentang pada tabel.
  const [terpilih, setTerpilih] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    username: '',
    nama: '',
    email: '',
    status: 'Aktif',
    roleIds: [] as number[],
  });

  const [isSuperadmin, setIsSuperadmin] = useState(false);

  // Muat daftar peran LPPM.
  useEffect(() => {
    let aktif = true;
    fetchRoles()
      .then((res) => {
        if (!aktif) return;
        setRoles(res.data.data || []);
        setRolesReady(true);
      })
      .catch((err: any) => {
        if (aktif) setError(err?.response?.data?.message || 'Gagal memuat daftar peran sistem.');
      });
    return () => {
      aktif = false;
    };
  }, []);

  // Mode ubah: muat data pengguna dari API.
  useEffect(() => {
    setLoadedId(null);
    if (!isEdit || !id || !rolesReady) return;
    let aktif = true;
    fetchUsers()
      .then((res) => {
        if (!aktif) return;
        const target = (res.data.data || []).find((u) => String(u.id) === String(id));
        if (!target) {
          setError('Pengguna tidak ditemukan. Mungkin sudah dihapus.');
          return;
        }
        const superadmin =
          (target.ssoRole || '').toUpperCase() === 'SUPERADMIN' || target.peran.includes('SUPERADMIN');
        setIsSuperadmin(superadmin);

        const kodeTarget = target.peran[0];
        const roleTarget = roles.find((r) => r.kode === kodeTarget);

        setFormData({
          username: target.username,
          nama: target.nama,
          email: target.email || '',
          status: target.status || 'Aktif',
          roleIds: roleTarget ? [roleTarget.id] : [],
        });
        setLoadedId(id);
      })
      .catch((err: any) => {
        if (aktif) setError(err?.response?.data?.message || 'Gagal memuat data pengguna.');
      });
    return () => {
      aktif = false;
    };
  }, [isEdit, id, roles, rolesReady]);

  /** Simpan hasil centang tabel: kirim id ke server tanpa peran */
  const simpanDariTabel = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSukses(null);

    if (terpilih.length === 0) {
      setError('Centang minimal satu pengguna pada tabel direktori ONE UNUSU.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createUserAssignment({
        userIds: terpilih,
      });
      setTerpilih([]);
      navigate('/pengguna', {
        replace: true,
        state: { pesan: res.data?.message || 'Pengguna berhasil didaftarkan ke LPPM.' },
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal mendaftarkan pengguna.');
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSukses(null);

    if (formData.roleIds.length === 0) {
      setError('Pilih minimal satu peran untuk pengguna ini.');
      return;
    }

    const kodePeran = roles.filter((r) => formData.roleIds.includes(r.id)).map((r) => r.kode);

    try {
      setSubmitting(true);
      await updateUserAssignment(id!, {
        peran: kodePeran,
        status: formData.status,
      });
      setSukses(`Perubahan untuk "${formData.nama}" berhasil disimpan.`);
      setTimeout(() => navigate('/pengguna'), 1000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal menyimpan perubahan pengguna.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Mode TAMBAH ----------
  if (!isEdit) {
    return (
      <FormPageTemplate
        title="Tambah Pengguna LPPM"
        description="Centang pengguna dari direktori ONE UNUSU. Peran ditetapkan setelah penyimpanan melalui tombol Atur Peran pada daftar pengguna."
        backTo="/pengguna"
        onSubmit={simpanDariTabel}
        submitting={submitting}
        error={error}
        submitLabel={
          terpilih.length > 0 ? `Tambahkan ${terpilih.length} Pengguna` : 'Tambahkan Pengguna'
        }
      >
        <div className="space-y-6">
          {sukses && (
            <div className="p-4 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{sukses}</span>
            </div>
          )}

          <CardContainer
            title="Direktori Pengguna ONE UNUSU"
            subtitle="Pilih satu atau beberapa orang sekaligus. Server memverifikasi ulang setiap pilihan ke ONE UNUSU sebelum menyimpan."
          >
            <TabelPilihPengguna terpilih={terpilih} onUbahTerpilih={setTerpilih} />
          </CardContainer>
        </div>
      </FormPageTemplate>
    );
  }

  // ---------- Mode UBAH ----------
  return (
    <FormPageTemplate
      title="Ubah Pengguna LPPM"
      submitDisabled={!rolesReady || loadedId !== id}
      description={`Perbarui peran dan status akun ${formData.nama || ''}. Biodata dikelola ONE UNUSU.`}
      backTo="/pengguna"
      onSubmit={handleEditSubmit}
      submitting={submitting}
      error={error}
      isEdit
    >
      <div className="space-y-6">
        {sukses && (
          <div className="p-4 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <ShieldCheckIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{sukses}</span>
          </div>
        )}

        <CardContainer className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <UserGroupIcon className="w-5 h-5 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-800">Biodata (dari SSO ONE UNUSU)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Username / NIDN</span>
              <span className="font-mono font-semibold text-slate-700">{formData.username}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Nama Lengkap</span>
              <span className="font-semibold text-slate-800">{formData.nama}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Email SSO</span>
              <span className="font-semibold text-slate-800">{formData.email || '—'}</span>
            </div>
          </div>
        </CardContainer>

        <CardContainer className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <ShieldCheckIcon className="w-5 h-5 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-800">Peran & Status Akses LPPM</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Peran Pengguna {isSuperadmin && '(Terkunci: Superadmin)'}
              </label>
              {isSuperadmin ? (
                <div className="p-3 rounded-[8px] bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  Akun Superadmin ekosistem selalu memiliki hak penuh di seluruh aplikasi dan tidak
                  dapat diubah perannya.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roles.map((r) => {
                    const dipilih = formData.roleIds.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        className={`flex items-start gap-3 p-3 rounded-[10px] border cursor-pointer transition ${
                          dipilih
                            ? 'border-[#166534] bg-[#F0FDF4]'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="roleId"
                          checked={dipilih}
                          onChange={() => setFormData({ ...formData, roleIds: [r.id] })}
                          className="mt-0.5 w-4 h-4 accent-[#166534]"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800">{r.nama}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{r.deskripsi || '—'}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Status Akun di LPPM
              </label>
              <select
                value={formData.status}
                disabled={isSuperadmin}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full md:w-64 px-4 py-3 min-h-[44px] text-xs rounded-[10px] border border-[#D8E5DC] bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#166534] focus:border-[#166534] disabled:opacity-50"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>
        </CardContainer>
      </div>
    </FormPageTemplate>
  );
};
