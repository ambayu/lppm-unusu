import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchKategoriDetail,
  createKategori,
  updateKategori,
} from '../services/api';
import { FormPageTemplate } from '../components/FormPageTemplate';
import { CardContainer } from '../components/CardContainer';
import { FolderIcon } from '@heroicons/react/24/outline';

export const KategoriLppmFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEdit);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nama: '',
    deskripsi: '',
  });

  useEffect(() => {
    let active = true;
    setLoadedId(null);
    if (isEdit && id) {
      setLoading(true);
      fetchKategoriDetail(id)
        .then((res) => {
          if (!active) return;
          const cat = res.data.data;
          setFormData({
            nama: cat.nama || '',
            deskripsi: cat.deskripsi || '',
          });
          setLoadedId(id);
        })
        .catch((err) => {
          if (!active) return;
          console.error(err);
          setError(err.response?.data?.message || 'Gagal memuat data kategori.');
        })
        .finally(() => { if (active) setLoading(false); });
    }
    return () => { active = false; };
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (isEdit && id) {
        await updateKategori(id, formData);
      } else {
        await createKategori(formData);
      }
      navigate('/admin/kategori');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal menyimpan kategori.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm font-semibold text-slate-500">
        Memuat data formulir kategori...
      </div>
    );
  }

  return (
    <FormPageTemplate
      title={isEdit ? 'Sunting Kategori Dokumen' : 'Tambah Kategori Dokumen'}
      description="Kategori dokumen memudahkan pemilahan dan pencarian dokumen penelitian serta arsip pengabdian LPPM."
      badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-900">
          <FolderIcon className="w-3.5 h-3.5" aria-hidden="true" />
          Formulir Kategori
        </span>
      }
      backTo="/admin/kategori"
      isEdit={isEdit}
      submitting={submitting}
      submitDisabled={loading || (isEdit && loadedId !== id)}
      error={error}
      onSubmit={handleSubmit}
      accentClassName="bg-violet-700 hover:bg-violet-800"
    >
      <CardContainer
        title="Informasi Kategori"
        subtitle="Nama kategori wajib unik dan ringkas untuk memudahkan pengelompokan dokumen."
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="nama" className="block text-xs font-bold text-slate-700 mb-1.5">
              Nama Kategori <span className="text-red-500">*</span>
            </label>
            <input
              id="nama"
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Contoh: Panduan Hibah, SK LPPM, Instrumen Monev"
              className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-[12px] text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-violet-600 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="deskripsi" className="block text-xs font-bold text-slate-700 mb-1.5">
              Deskripsi
            </label>
            <textarea
              id="deskripsi"
              rows={3}
              value={formData.deskripsi}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              placeholder="Penjelasan ringkas mengenai peruntukan kategori dokumen ini..."
              className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-[12px] text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-violet-600 transition-colors"
            />
          </div>
        </div>
      </CardContainer>
    </FormPageTemplate>
  );
};

export default KategoriLppmFormPage;
