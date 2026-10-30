import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  createPengabdian,
  getPengabdian,
  updatePengabdian,
} from '../services/api';
import { AdminPanelTemplate } from '../components/AdminPanelTemplate';
import { CardContainer } from '../components/CardContainer';
import {
  ArrowLeftIcon,
  CheckIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';

export const PengabdianFormPage: React.FC = () => {
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
  const [mitra, setMitra] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [danaDisetujui, setDanaDisetujui] = useState<number | string>(10000000);
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [status, setStatus] = useState('Disetujui');

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      getPengabdian(id)
        .then((res) => {
          const data = res.data.data;
          setJudul(data.judul);
          setKetua(data.ketua);
          setNidn(data.nidn);
          setAnggota(data.anggota || '');
          setMitra(data.mitra);
          setLokasi(data.lokasi);
          setDanaDisetujui(data.danaDisetujui || 0);
          setTahun(data.tahun);
          setStatus(data.status || 'Disetujui');
        })
        .catch((err) => {
          console.error(err);
          setError('Gagal memuat data pengabdian.');
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
      mitra,
      lokasi,
      danaDisetujui: danaDisetujui ? Number(danaDisetujui) : null,
      tahun: Number(tahun),
      status,
    };

    try {
      if (isEdit && id) {
        await updatePengabdian(id, payload);
      } else {
        await createPengabdian(payload);
      }
      navigate('/pengabdian');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal menyimpan data pengabdian.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPanelTemplate
      title={isEdit ? 'Edit Kegiatan PKM' : 'Tambah Kegiatan PKM Baru'}
      description="Formulir pencatatan program pengabdian kepada masyarakat, kemitraan desa binaan, dan alokasi dana Tridharma."
      actions={
        <Link
          to="/pengabdian"
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
          Memuat formulir pengabdian...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <CardContainer
            title="Informasi Program & Tim Pelaksana"
            subtitle="Rincian judul pengabdian masyarakat dan dosen pengusul"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Judul Program PKM <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Pemberdayaan UMKM Kopi Melalui Pelatihan Digital Marketing & Sertifikasi Halal di Deli Serdang"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm focus:outline-none focus:border-violet-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ketua Pelaksana <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={ketua}
                    onChange={(e) => setKetua(e.target.value)}
                    placeholder="Nama Lengkap Dosen Ketua"
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
                  Anggota Pelaksana (Dosen / Mahasiswa)
                </label>
                <input
                  type="text"
                  value={anggota}
                  onChange={(e) => setAnggota(e.target.value)}
                  placeholder="Pisahkan nama anggota dengan koma"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm focus:outline-none focus:border-violet-600 transition-colors"
                />
              </div>
            </div>
          </CardContainer>

          <CardContainer
            title="Mitra Sasaran & Lokasi Kemitraan"
            subtitle="Identitas mitra binaan dan alokasi pembiayaan program"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mitra Sasaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={mitra}
                  onChange={(e) => setMitra(e.target.value)}
                  placeholder="Contoh: Koperasi Tani Berkah / Pesantren Al-Ikhlas"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm focus:outline-none focus:border-violet-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lokasi Pelaksanaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  placeholder="Contoh: Medan Helvetia / Deli Serdang"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm focus:outline-none focus:border-violet-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Dana Disetujui (Rp)
                </label>
                <input
                  type="number"
                  value={danaDisetujui}
                  onChange={(e) => setDanaDisetujui(e.target.value)}
                  placeholder="10000000"
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
                  Status Program <span className="text-rose-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm focus:outline-none focus:border-violet-600 transition-colors"
                >
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
              to="/pengabdian"
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
              <span>{submitting ? 'Menyimpan...' : isEdit ? 'Perbarui Data' : 'Simpan PKM'}</span>
            </button>
          </div>
        </form>
      )}
    </AdminPanelTemplate>
  );
};
