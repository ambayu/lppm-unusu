import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  createPenelitian,
  getPenelitian,
  updatePenelitian,
} from '../services/api';
import { AdminPanelTemplate } from '../components/AdminPanelTemplate';
import { CardContainer } from '../components/CardContainer';
import {
  ArrowLeftIcon,
  CheckIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';

export const PenelitianFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [judul, setJudul] = useState('');
  const [ketua, setKetua] = useState('');
  const [nidn, setNidn] = useState('');
  const [anggota, setAnggota] = useState('');
  const [skema, setSkema] = useState('Penelitian Dosen Pemula (PDP)');
  const [bidangFokus, setBidangFokus] = useState('Teknologi Informasi');
  const [danaDisetujui, setDanaDisetujui] = useState<number | string>(15000000);
  const [sumberDana, setSumberDana] = useState('Internal UNUSU');
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [status, setStatus] = useState('Disetujui');

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      getPenelitian(id)
        .then((res) => {
          const data = res.data.data;
          setJudul(data.judul);
          setKetua(data.ketua);
          setNidn(data.nidn);
          setAnggota(data.anggota || '');
          setSkema(data.skema);
          setBidangFokus(data.bidangFokus);
          setDanaDisetujui(data.danaDisetujui || 0);
          setSumberDana(data.sumberDana || 'Internal UNUSU');
          setTahun(data.tahun);
          setStatus(data.status || 'Disetujui');
        })
        .catch((err) => {
          console.error(err);
          setError('Gagal memuat data penelitian untuk diedit.');
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
      ketua,
      nidn,
      anggota: anggota || null,
      skema,
      bidangFokus,
      danaDisetujui: danaDisetujui ? Number(danaDisetujui) : null,
      sumberDana,
      tahun: Number(tahun),
      status,
    };

    try {
      if (isEdit && id) {
        await updatePenelitian(id, payload);
      } else {
        await createPenelitian(payload);
      }
      navigate('/penelitian');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal menyimpan data penelitian.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPanelTemplate
      title={isEdit ? 'Edit Proposal Penelitian' : 'Tambah Proposal Riset Baru'}
      description="Formulir pencatatan lengkap proposal penelitian, skema pendanaan, dan tim peneliti civitas akademika UNUSU."
      actions={
        <Link
          to="/penelitian"
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
          Memuat formulir penelitian...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <CardContainer
            title="Informasi Judul & Tim Peneliti"
            subtitle="Isikan rincian judul riset dan susunan dosen peneliti"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Judul Penelitian <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Implementasi Deep Learning untuk Deteksi Hama Padi pada Pertanian Komunitas Deli Serdang"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm focus:outline-none focus:border-violet-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ketua Peneliti <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={ketua}
                    onChange={(e) => setKetua(e.target.value)}
                    placeholder="Nama Lengkap & Gelar Dosen"
                    className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm focus:outline-none focus:border-violet-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    NIDN Ketua <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nidn}
                    onChange={(e) => setNidn(e.target.value)}
                    placeholder="Contoh: 0123456789"
                    className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm font-mono focus:outline-none focus:border-violet-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Anggota Peneliti (Dosen / Mahasiswa)
                </label>
                <input
                  type="text"
                  value={anggota}
                  onChange={(e) => setAnggota(e.target.value)}
                  placeholder="Pisahkan nama anggota dengan koma (mis: Dr. Ahmad, Siti Aminah)"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm focus:outline-none focus:border-violet-600 transition-colors"
                />
              </div>
            </div>
          </CardContainer>

          <CardContainer
            title="Skema Pendanaan & Fokus Riset"
            subtitle="Kategori hibah, sumber pembiayaan, dan target tahun pelaksanaan"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Skema Riset <span className="text-rose-500">*</span>
                </label>
                <select
                  value={skema}
                  onChange={(e) => setSkema(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm focus:outline-none focus:border-violet-600 transition-colors"
                >
                  <option value="Penelitian Dosen Pemula (PDP)">Penelitian Dosen Pemula (PDP)</option>
                  <option value="Penelitian Terapan Unggulan (PTR)">Penelitian Terapan Unggulan (PTR)</option>
                  <option value="Riset Kerjasama Kolaborasi">Riset Kerjasama Kolaborasi</option>
                  <option value="Penelitian Mandiri">Penelitian Mandiri</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Bidang Fokus Riset <span className="text-rose-500">*</span>
                </label>
                <select
                  value={bidangFokus}
                  onChange={(e) => setBidangFokus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm focus:outline-none focus:border-violet-600 transition-colors"
                >
                  <option value="Teknologi Informasi">Teknologi Informasi</option>
                  <option value="Kecerdasan Buatan (AI)">Kecerdasan Buatan (AI)</option>
                  <option value="Pendidikan & Aswaja">Pendidikan & Aswaja</option>
                  <option value="Sosial Humaniora">Sosial Humaniora</option>
                  <option value="Pertanian & Ketahanan Pangan">Pertanian & Ketahanan Pangan</option>
                  <option value="Kesehatan & Gizi">Kesehatan & Gizi</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Sumber Dana <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sumberDana}
                  onChange={(e) => setSumberDana(e.target.value)}
                  placeholder="Contoh: Internal UNUSU / Kemendikbud"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm focus:outline-none focus:border-violet-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Besaran Dana Disetujui (Rp)
                </label>
                <input
                  type="number"
                  value={danaDisetujui}
                  onChange={(e) => setDanaDisetujui(e.target.value)}
                  placeholder="15000000"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm font-mono focus:outline-none focus:border-violet-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tahun Pelaksanaan <span className="text-rose-500">*</span>
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
                  Status Riset <span className="text-rose-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm focus:outline-none focus:border-violet-600 transition-colors"
                >
                  <option value="Pengajuan">Pengajuan</option>
                  <option value="Review">Sedang Direview</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Pelaksanaan">Dalam Pelaksanaan</option>
                  <option value="Selesai">Selesai / Laporan Masuk</option>
                </select>
              </div>
            </div>
          </CardContainer>

          {/* Action Button Row */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              to="/penelitian"
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
              <span>{submitting ? 'Menyimpan...' : isEdit ? 'Perbarui Data' : 'Simpan Proposal'}</span>
            </button>
          </div>
        </form>
      )}
    </AdminPanelTemplate>
  );
};
