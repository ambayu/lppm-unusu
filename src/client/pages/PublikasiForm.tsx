import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  createPublikasi,
  getPublikasi,
  updatePublikasi,
} from '../services/api';
import { AdminPanelTemplate } from '../components/AdminPanelTemplate';
import { CardContainer } from '../components/CardContainer';
import {
  ArrowLeftIcon,
  CheckIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

export const PublikasiFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [judul, setJudul] = useState('');
  const [penulis, setPenulis] = useState('');
  const [jenis, setJenis] = useState('Jurnal Nasional');
  const [namaJurnal, setNamaJurnal] = useState('');
  const [volumeIssue, setVolumeIssue] = useState('');
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [doiUrl, setDoiUrl] = useState('');
  const [sintaScore, setSintaScore] = useState('SINTA 3');

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      getPublikasi(id)
        .then((res) => {
          const data = res.data.data;
          setJudul(data.judul);
          setPenulis(data.penulis);
          setJenis(data.jenis);
          setNamaJurnal(data.namaJurnal);
          setVolumeIssue(data.volumeIssue || '');
          setTahun(data.tahun);
          setDoiUrl(data.doiUrl || '');
          setSintaScore(data.sintaScore || 'SINTA 3');
        })
        .catch((err) => {
          console.error(err);
          setError('Gagal memuat data publikasi.');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      judul,
      penulis,
      jenis,
      namaJurnal,
      volumeIssue: volumeIssue || null,
      tahun: Number(tahun),
      doiUrl: doiUrl || null,
      sintaScore: sintaScore || null,
    };

    try {
      if (isEdit && id) {
        await updatePublikasi(id, payload);
      } else {
        await createPublikasi(payload);
      }
      navigate('/publikasi');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal menyimpan data publikasi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPanelTemplate
      title={isEdit ? 'Edit Data Publikasi' : 'Tambah Publikasi Baru'}
      description="Pencatatan artikel ilmiah dosen pada jurnal nasional terakreditasi SINTA, Scopus, prosiding konferensi, dan buku referensi."
      actions={
        <Link
          to="/publikasi"
          className="inline-flex items-center gap-2 px-4 py-2.5 h-[42px] rounded-[12px] border border-[#CBD5E1] bg-white text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors shadow-2xs"
        >
          <ArrowLeftIcon className="w-4 h-4 text-slate-500" />
          <span>Kembali</span>
        </Link>
      }
    >
      {error && (
        <div className="p-4 rounded-[12px] bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400 font-semibold text-sm">
          Memuat formulir publikasi...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <CardContainer
            title="Artikel & Identitas Penulis"
            subtitle="Rincian judul artikel ilmiah dan susunan penulis"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Judul Artikel Ilmiah <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Sentiment Analysis on Higher Education Quality Using Bidirectional LSTM and Transformers"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm focus:outline-none focus:border-violet-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Penulis (Dosen & Kolaborator) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={penulis}
                  onChange={(e) => setPenulis(e.target.value)}
                  placeholder="Contoh: Dr. M. Syahputra, S.Kom., M.Kom., Ahmad Fauzi"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm focus:outline-none focus:border-violet-600 transition-colors"
                />
              </div>
            </div>
          </CardContainer>

          <CardContainer
            title="Metadata Penerbit & Akreditasi Jurnal"
            subtitle="Identitas jurnal, peringkat akreditasi, dan tautan digital object identifier (DOI)"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kategori Publikasi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={jenis}
                  onChange={(e) => setJenis(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm focus:outline-none focus:border-violet-600 transition-colors"
                >
                  <option value="Jurnal Internasional">Jurnal Internasional (Scopus/WOS)</option>
                  <option value="Jurnal Nasional">Jurnal Nasional (SINTA)</option>
                  <option value="Prosiding">Prosiding Seminar Nasional/Internasional</option>
                  <option value="Buku">Buku / Monograf Ber-ISBN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Jurnal / Penerbit <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaJurnal}
                  onChange={(e) => setNamaJurnal(e.target.value)}
                  placeholder="Contoh: Jurnal Teknologi Informasi & Rekayasa Komputer"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm focus:outline-none focus:border-violet-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Volume & Nomor (Issue)
                </label>
                <input
                  type="text"
                  value={volumeIssue}
                  onChange={(e) => setVolumeIssue(e.target.value)}
                  placeholder="Contoh: Vol. 5 No. 2, pp. 112-120"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm focus:outline-none focus:border-violet-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Peringkat Akreditasi (SINTA / Quartile)
                </label>
                <select
                  value={sintaScore}
                  onChange={(e) => setSintaScore(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm focus:outline-none focus:border-violet-600 transition-colors"
                >
                  <option value="Scopus Q1">Scopus Q1</option>
                  <option value="Scopus Q2">Scopus Q2</option>
                  <option value="Scopus Q3">Scopus Q3</option>
                  <option value="Scopus Q4">Scopus Q4</option>
                  <option value="SINTA 1">SINTA 1</option>
                  <option value="SINTA 2">SINTA 2</option>
                  <option value="SINTA 3">SINTA 3</option>
                  <option value="SINTA 4">SINTA 4</option>
                  <option value="SINTA 5">SINTA 5</option>
                  <option value="SINTA 6">SINTA 6</option>
                  <option value="Non-SINTA">Non-SINTA / Prosiding</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tahun Terbit <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={tahun}
                  onChange={(e) => setTahun(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm font-mono focus:outline-none focus:border-violet-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tautan DOI / URL Artikel
                </label>
                <input
                  type="url"
                  value={doiUrl}
                  onChange={(e) => setDoiUrl(e.target.value)}
                  placeholder="https://doi.org/10.1234/example"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm font-mono focus:outline-none focus:border-violet-600 transition-colors"
                />
              </div>
            </div>
          </CardContainer>

          {/* Action Button Row */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              to="/publikasi"
              className="px-5 py-2.5 h-[42px] rounded-[12px] border border-[#CBD5E1] bg-white text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 h-[42px] rounded-[12px] bg-violet-700 hover:bg-violet-800 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <CheckIcon className="w-4 h-4 text-amber-400" />
              <span>{submitting ? 'Menyimpan...' : isEdit ? 'Perbarui Data' : 'Simpan Publikasi'}</span>
            </button>
          </div>
        </form>
      )}
    </AdminPanelTemplate>
  );
};
