import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FormPageTemplate } from '../components/FormPageTemplate';
import { CardContainer } from '../components/CardContainer';
import {
  fetchPermissions,
  createPermission,
  updatePermission,
  PermissionItem,
} from '../services/api';
import { KeyIcon } from '@heroicons/react/24/outline';

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

/**
 * IzinFormPage — halaman penuh tambah/ubah hak izin (permission) LPPM.
 *
 * Menggantikan modal `Modal Tambah/Edit Izin` pada `Izin.tsx`.
 * Rute: `/izin/tambah` dan `/izin/edit/:id`.
 * Setelah berhasil menyimpan, pengguna tetap di halaman formulir.
 */
export const IzinFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sukses, setSukses] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    modul: 'Penelitian',
    deskripsi: '',
  });

  // Mode ubah: ambil detail izin dari katalog.
  useEffect(() => {
    if (!isEdit || !id) return;
    let aktif = true;
    setLoading(true);
    fetchPermissions()
      .then((res) => {
        if (!aktif) return;
        const daftar: PermissionItem[] = res.data.data || [];
        const izin = daftar.find((p) => String(p.id) === String(id));
        if (!izin) {
          setError('Hak izin tidak ditemukan. Mungkin sudah dihapus.');
          return;
        }
        setFormData({
          kode: izin.kode,
          nama: izin.nama,
          modul: izin.modul,
          deskripsi: izin.deskripsi || '',
        });
      })
      .catch((err: any) => {
        if (aktif) {
          setError(err?.response?.data?.message || 'Gagal memuat detail hak izin.');
        }
      })
      .finally(() => {
        if (aktif) setLoading(false);
      });
    return () => {
      aktif = false;
    };
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSukses(null);

    if (!formData.nama.trim()) {
      setError('Nama izin wajib diisi.');
      return;
    }
    if (!isEdit && !formData.kode.trim()) {
      setError('Kode izin wajib diisi.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (isEdit && id) {
        await updatePermission(Number(id), {
          nama: formData.nama,
          modul: formData.modul,
          deskripsi: formData.deskripsi,
        });
        setSukses(`Perubahan hak izin "${formData.nama}" berhasil disimpan.`);
      } else {
        await createPermission({
          kode: formData.kode,
          nama: formData.nama,
          modul: formData.modul,
          deskripsi: formData.deskripsi,
        });
        setSukses(`Hak izin "${formData.nama}" berhasil ditambahkan.`);
        setFormData({ kode: '', nama: '', modul: 'Penelitian', deskripsi: '' });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal menyimpan hak izin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPageTemplate
      title={isEdit ? 'Ubah Hak Izin' : 'Tambah Hak Izin Baru'}
      description="Katalog izin granular LPPM UNUSU. Setiap izin dipetakan ke peran untuk mengatur wewenang operasional."
      badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#EDE8F5] border border-violet-200 text-[10px] font-bold uppercase tracking-wider text-violet-900">
          <KeyIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Tata Kelola
        </span>
      }
      backTo="/izin"
      backLabel="Kembali"
      isEdit={isEdit}
      submitLabel={isEdit ? 'Simpan Perubahan' : 'Simpan Hak Izin'}
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
        title="Identitas Hak Izin"
        subtitle="Kode dipakai sistem pemeriksaan akses, nama dipakai antarmuka pengaturan peran."
      >
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500 font-medium">
            Memuat detail hak izin...
          </div>
        ) : (
          <div className="space-y-3.5">
            <div>
              <label htmlFor="izin-kode" className="block text-xs font-bold text-slate-700 mb-1">
                Kode Izin (System Key) <span className="text-rose-500">*</span>
              </label>
              <input
                id="izin-kode"
                type="text"
                required
                disabled={isEdit}
                value={formData.kode}
                onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                placeholder="Misal: penelitian.review"
                className="w-full px-3 py-2 min-h-[44px] text-xs sm:text-sm rounded-[10px] border border-[#CBD5E1] font-mono lowercase disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {isEdit
                  ? 'Kode izin tidak dapat diubah setelah dibuat.'
                  : 'Format konvensi: modul.aksi (contoh: penelitian.create, laporan.export)'}
              </p>
            </div>

            <div>
              <label htmlFor="izin-nama" className="block text-xs font-bold text-slate-700 mb-1">
                Nama Izin <span className="text-rose-500">*</span>
              </label>
              <input
                id="izin-nama"
                type="text"
                required
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Misal: Review & Penilaian Usulan"
                className="w-full px-3 py-2 min-h-[44px] text-xs sm:text-sm rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700"
              />
            </div>

            <div>
              <label htmlFor="izin-modul" className="block text-xs font-bold text-slate-700 mb-1">
                Kategori Modul <span className="text-rose-500">*</span>
              </label>
              <select
                id="izin-modul"
                required
                value={formData.modul}
                onChange={(e) => setFormData({ ...formData, modul: e.target.value })}
                className="w-full px-3 py-2 min-h-[44px] text-xs sm:text-sm rounded-[10px] border border-[#CBD5E1] bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700"
              >
                {MODUL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="izin-deskripsi" className="block text-xs font-bold text-slate-700 mb-1">
                Deskripsi Wewenang
              </label>
              <textarea
                id="izin-deskripsi"
                rows={3}
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                placeholder="Penjelasan wewenang yang diberikan oleh izin ini..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-[10px] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-violet-700/20 focus:border-violet-700"
              />
            </div>
          </div>
        )}
      </CardContainer>
    </FormPageTemplate>
  );
};

export default IzinFormPage;
