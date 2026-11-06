import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  createMonev,
  getMonev,
  updateMonev,
  fetchPenelitian,
  fetchPengabdian,
  PenelitianItem,
  PengabdianItem,
  JenisProgramMonev,
  TahapMonev,
  StatusMonev,
  RekomendasiMonev,
} from '../services/api';
import { FormPageTemplate } from '../components/FormPageTemplate';
import { CardContainer } from '../components/CardContainer';
import {
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

export const MonevFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parent records for selector
  const [penelitianList, setPenelitianList] = useState<PenelitianItem[]>([]);
  const [pengabdianList, setPengabdianList] = useState<PengabdianItem[]>([]);

  // Form State
  const [kodeMonev, setKodeMonev] = useState('');
  const [jenisProgram, setJenisProgram] = useState<JenisProgramMonev>('PENELITIAN');
  const [tahap, setTahap] = useState<TahapMonev>('MONEV_ANTARA');
  const [status, setStatus] = useState<StatusMonev>('DIJADWALKAN');
  const [rekomendasi, setRekomendasi] = useState<RekomendasiMonev>('LANJUT_PENUH');
  const [penelitianId, setPenelitianId] = useState<string>('');
  const [pengabdianId, setPengabdianId] = useState<string>('');

  const [namaReviewer, setNamaReviewer] = useState('');
  const [nidnReviewer, setNidnReviewer] = useState('');
  const [tanggalJadwal, setTanggalJadwal] = useState(new Date().toISOString().substring(0, 10));
  const [tanggalMonev, setTanggalMonev] = useState('');
  const [lokasiMonev, setLokasiMonev] = useState('Ruang Sidang LPPM UNUSU');

  const [persentaseKemajuan, setPersentaseKemajuan] = useState<number>(0);
  const [persentaseDanaTerpakai, setPersentaseDanaTerpakai] = useState<number>(0);
  const [skorSubstansi, setSkorSubstansi] = useState<string>('');

  const [targetLuaranWajib, setTargetLuaranWajib] = useState('');
  const [capaianLuaran, setCapaianLuaran] = useState('');
  const [catatanReviewer, setCatatanReviewer] = useState('');
  const [tindakLanjut, setTindakLanjut] = useState('');

  useEffect(() => {
    // Muat daftar riset & pengabdian untuk pilihan relasi
    fetchPenelitian()
      .then((res) => setPenelitianList(res.data.data || []))
      .catch((err) => console.error('Gagal mengambil penelitian:', err));

    fetchPengabdian()
      .then((res) => setPengabdianList(res.data.data || []))
      .catch((err) => console.error('Gagal mengambil pengabdian:', err));

    if (isEdit && id) {
      setLoading(true);
      getMonev(id)
        .then((res) => {
          const data = res.data.data;
          setKodeMonev(data.kodeMonev);
          setJenisProgram(data.jenisProgram);
          setTahap(data.tahap);
          setStatus(data.status);
          if (data.rekomendasi) setRekomendasi(data.rekomendasi);
          if (data.penelitianId) setPenelitianId(String(data.penelitianId));
          if (data.pengabdianId) setPengabdianId(String(data.pengabdianId));
          setNamaReviewer(data.namaReviewer || '');
          setNidnReviewer(data.nidnReviewer || '');
          if (data.tanggalJadwal) setTanggalJadwal(data.tanggalJadwal.substring(0, 10));
          if (data.tanggalMonev) setTanggalMonev(data.tanggalMonev.substring(0, 10));
          setLokasiMonev(data.lokasiMonev || '');
          setPersentaseKemajuan(data.persentaseKemajuan || 0);
          setPersentaseDanaTerpakai(data.persentaseDanaTerpakai || 0);
          if (data.skorSubstansi !== undefined && data.skorSubstansi !== null) {
            setSkorSubstansi(String(data.skorSubstansi));
          }
          setTargetLuaranWajib(data.targetLuaranWajib || '');
          setCapaianLuaran(data.capaianLuaran || '');
          setCatatanReviewer(data.catatanReviewer || '');
          setTindakLanjut(data.tindakLanjut || '');
        })
        .catch((err) => {
          console.error(err);
          setError('Gagal memuat rincian agenda Monev untuk diedit.');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!namaReviewer.trim() || namaReviewer.trim().length < 3) {
      setError('Nama reviewer wajib diisi dan minimal 3 karakter.');
      setSubmitting(false);
      return;
    }

    if (!tanggalJadwal) {
      setError('Tanggal jadwal monev wajib diisi.');
      setSubmitting(false);
      return;
    }

    const payload = {
      kodeMonev: kodeMonev.trim() || undefined,
      jenisProgram,
      tahap,
      status,
      rekomendasi,
      penelitianId: jenisProgram === 'PENELITIAN' && penelitianId ? Number(penelitianId) : null,
      pengabdianId: jenisProgram === 'PENGABDIAN' && pengabdianId ? Number(pengabdianId) : null,
      namaReviewer: namaReviewer.trim(),
      nidnReviewer: nidnReviewer.trim() || null,
      tanggalJadwal,
      tanggalMonev: tanggalMonev || null,
      lokasiMonev: lokasiMonev.trim() || null,
      persentaseKemajuan: Number(persentaseKemajuan),
      persentaseDanaTerpakai: Number(persentaseDanaTerpakai),
      skorSubstansi: skorSubstansi ? Number(skorSubstansi) : null,
      targetLuaranWajib: targetLuaranWajib.trim() || null,
      capaianLuaran: capaianLuaran.trim() || null,
      catatanReviewer: catatanReviewer.trim() || null,
      tindakLanjut: tindakLanjut.trim() || null,
    };

    try {
      if (isEdit && id) {
        await updateMonev(id, payload);
      } else {
        await createMonev(payload);
      }
      navigate('/monev');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Gagal menyimpan data agenda monev.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Evaluasi Monev' : 'Jadwalkan Monev Baru'}
      description="Formulir pengelolaan jadwal penilaian kemajuan riset, telaah luaran, dan rekomendasi monev LPPM UNUSU."
      backTo="/monev"
      isEdit={isEdit}
      submitLabel={isEdit ? 'Simpan Perubahan' : 'Jadwalkan Monev'}
      submitting={submitting}
      error={error}
      onSubmit={handleSubmit}
      accentClassName="bg-violet-700 hover:bg-violet-800"
    >
      {loading ? (
        <div className="py-16 text-center text-slate-400 font-semibold text-sm">
          Memuat formulir Monev...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Bagian 1: Parameter Program & Objek Monev */}
          <CardContainer
            title="1. Identitas Program & Objek Monev"
            subtitle="Tentukan klasifikasi Tridharma dan tautkan ke usulan riset atau pengabdian"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Jenis Program Tridharma <span className="text-rose-500">*</span>
                </label>
                <select
                  value={jenisProgram}
                  onChange={(e) => setJenisProgram(e.target.value as JenisProgramMonev)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition"
                >
                  <option value="PENELITIAN">Penelitian Dosen</option>
                  <option value="PENGABDIAN">Pengabdian Kepada Masyarakat (PKM)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tahap Monev <span className="text-rose-500">*</span>
                </label>
                <select
                  value={tahap}
                  onChange={(e) => setTahap(e.target.value as TahapMonev)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition"
                >
                  <option value="MONEV_ANTARA">Monev Antara (Kemajuan 50-70%)</option>
                  <option value="MONEV_AKHIR">Monev Akhir (Laporan & Luaran)</option>
                  <option value="MONEV_LAPANGAN">Monev Lapangan (Visitasi Desa/Mitra)</option>
                </select>
              </div>

              {jenisProgram === 'PENELITIAN' ? (
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Tautkan Usulan Penelitian
                  </label>
                  <select
                    value={penelitianId}
                    onChange={(e) => setPenelitianId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition"
                  >
                    <option value="">-- Pilih Judul Penelitian (Opsional) --</option>
                    {penelitianList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.tahun} - {p.judul} (Ketua: {p.ketua})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Tautkan Kegiatan Pengabdian (PKM)
                  </label>
                  <select
                    value={pengabdianId}
                    onChange={(e) => setPengabdianId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition"
                  >
                    <option value="">-- Pilih Kegiatan PKM (Opsional) --</option>
                    {pengabdianList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.tahun} - {p.judul} (Mitra: {p.mitra})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </CardContainer>

          {/* Bagian 2: Penjadwalan & Reviewer */}
          <CardContainer
            title="2. Jadwal & Data Reviewer"
            subtitle="Petugas telaah dan waktu pelaksanaan evaluasi"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nama Reviewer LPPM <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaReviewer}
                  onChange={(e) => setNamaReviewer(e.target.value)}
                  placeholder="Misal: Prof. Dr. Ir. H. Syahril Efendi, M.Sc."
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  NIDN / NIP Reviewer
                </label>
                <input
                  type="text"
                  value={nidnReviewer}
                  onChange={(e) => setNidnReviewer(e.target.value)}
                  placeholder="Misal: 0014026501"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tanggal Jadwal Monev <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={tanggalJadwal}
                  onChange={(e) => setTanggalJadwal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tanggal Realisasi Telaah
                </label>
                <input
                  type="date"
                  value={tanggalMonev}
                  onChange={(e) => setTanggalMonev(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Lokasi / Media Pelaksanaan Monev
                </label>
                <input
                  type="text"
                  value={lokasiMonev}
                  onChange={(e) => setLokasiMonev(e.target.value)}
                  placeholder="Misal: Ruang Sidang LPPM UNUSU / Daring Zoom"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition"
                />
              </div>
            </div>
          </CardContainer>

          {/* Bagian 3: Kemajuan & Hasil Evaluasi */}
          <CardContainer
            title="3. Indikator Kinerja & Hasil Evaluasi"
            subtitle="Persentase capaian, penilaian mutu substansi, dan rekomendasi pencairan"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Persentase Kemajuan (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={persentaseKemajuan}
                  onChange={(e) => setPersentaseKemajuan(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Serapan Dana (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={persentaseDanaTerpakai}
                  onChange={(e) => setPersentaseDanaTerpakai(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Skor Substansi (0 - 100)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={skorSubstansi}
                  onChange={(e) => setSkorSubstansi(e.target.value)}
                  placeholder="Misal: 88.5"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Status Monev <span className="text-rose-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusMonev)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition"
                >
                  <option value="DIJADWALKAN">Dijadwalkan</option>
                  <option value="SEDANG_DITELAAH">Sedang Ditelaah</option>
                  <option value="PERLU_REVISI">Perlu Revisi</option>
                  <option value="DISETUJUI">Disetujui / Lolos</option>
                  <option value="DITOLAK">Ditolak / Gagal</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Rekomendasi Reviewer
                </label>
                <select
                  value={rekomendasi}
                  onChange={(e) => setRekomendasi(e.target.value as RekomendasiMonev)}
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition"
                >
                  <option value="LANJUT_PENUH">Lanjut Penuh (Pencairan termin 100%)</option>
                  <option value="LANJUT_BERSYARAT">Lanjut Bersyarat (Pencairan setelah perbaikan luaran)</option>
                  <option value="TUNDA">Tunda Pendanaan (Tunggu penyelesaian perbaikan)</option>
                  <option value="HENTIKAN">Hentikan Pendanaan (Wanprestasi)</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Target Luaran Wajib
                </label>
                <textarea
                  rows={2}
                  value={targetLuaranWajib}
                  onChange={(e) => setTargetLuaranWajib(e.target.value)}
                  placeholder="Misal: 1 Artikel Jurnal SINTA 2 & Hak Cipta Perangkat Lunak"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Capaian Luaran Terverifikasi
                </label>
                <textarea
                  rows={2}
                  value={capaianLuaran}
                  onChange={(e) => setCapaianLuaran(e.target.value)}
                  placeholder="Status draft manuskrip, LoA, prototipe yang ditunjukkan saat monev"
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Catatan Reviewer
                </label>
                <textarea
                  rows={3}
                  value={catatanReviewer}
                  onChange={(e) => setCatatanReviewer(e.target.value)}
                  placeholder="Catatan kelebihan, kekurangan, dan poin telaah reviewer..."
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tindak Lanjut Peneliti
                </label>
                <textarea
                  rows={2}
                  value={tindakLanjut}
                  onChange={(e) => setTindakLanjut(e.target.value)}
                  placeholder="Hal yang wajib diselesaikan peneliti pasca telaah Monev..."
                  className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition"
                />
              </div>
            </div>
          </CardContainer>
        </div>
      )}
    </FormPageTemplate>
  );
};
