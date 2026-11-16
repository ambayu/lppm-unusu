import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  fetchMonevSurveiDetail,
  submitMonevSurvei,
  MonevSurveiDetail,
  MonevPertanyaanItem,
} from '../services/api';
import {
  ClipboardDocumentCheckIcon,
  ArrowLeftIcon,
  CheckIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export const MonevSurveiFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [survei, setSurvei] = useState<MonevSurveiDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Demografi form
  const [prodi, setProdi] = useState('');
  const [fakultas, setFakultas] = useState('');
  const [semester, setSemester] = useState('2');
  const [mataKuliah, setMataKuliah] = useState('');
  const [dosenPengampu, setDosenPengampu] = useState('');

  // Jawaban: Record<pertanyaanId, { nilaiSkala?: number, nilaiTeks?: string }>
  const [jawabanState, setJawabanState] = useState<
    Record<number, { nilaiSkala?: number; nilaiTeks?: string }>
  >({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchMonevSurveiDetail(id)
      .then((res) => {
        setSurvei(res.data.data);
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || 'Gagal memuat kuesioner.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handlePilihSkala = (pertanyaanId: number, nilai: number) => {
    setJawabanState((prev) => ({
      ...prev,
      [pertanyaanId]: {
        ...prev[pertanyaanId],
        nilaiSkala: nilai,
      },
    }));
  };

  const handleInputTeks = (pertanyaanId: number, teks: string) => {
    setJawabanState((prev) => ({
      ...prev,
      [pertanyaanId]: {
        ...prev[pertanyaanId],
        nilaiTeks: teks,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survei || !id) return;

    // Validasi pertanyaan wajib
    const belumDiisi = survei.pertanyaanList.filter((p) => {
      if (!p.wajib) return false;
      const ans = jawabanState[p.id];
      if (p.tipe === 'SKALA_5') {
        return !ans || ans.nilaiSkala === undefined;
      }
      return !ans || !ans.nilaiTeks || !ans.nilaiTeks.trim();
    });

    if (belumDiisi.length > 0) {
      alert(`Mohon lengkapi seluruh butir pertanyaan wajib (${belumDiisi.length} butir belum dijawab).`);
      return;
    }

    setSubmitting(true);
    setError(null);

    const payloadJawaban = Object.entries(jawabanState).map(([pId, val]) => ({
      pertanyaanId: Number(pId),
      nilaiSkala: val.nilaiSkala ?? null,
      nilaiTeks: val.nilaiTeks ?? null,
    }));

    try {
      const res = await submitMonevSurvei(id, {
        demografi: {
          prodi,
          fakultas,
          semester,
          mataKuliah,
          dosenPengampu,
        },
        jawaban: payloadJawaban,
      });

      setSuccessMsg(res.data.message || 'Kuesioner berhasil dikirim secara anonim.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengirim jawaban survei.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 py-8">
        <div className="h-28 animate-pulse rounded-[16px] bg-slate-100" />
        <div className="h-64 animate-pulse rounded-[16px] bg-slate-100" />
      </div>
    );
  }

  if (error && !survei) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <div className="rounded-[16px] border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <p className="font-bold">Terjadi Kesalahan</p>
          <p className="mt-1 text-xs">{error}</p>
          <Link
            to="/monev-survei"
            className="mt-4 inline-flex items-center gap-2 rounded-[8px] bg-white px-4 py-2 text-xs font-bold text-rose-700 shadow-xs"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Kembali ke Daftar Monev
          </Link>
        </div>
      </div>
    );
  }

  if (successMsg) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="rounded-[20px] border border-emerald-100 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckIcon className="h-8 w-8" strokeWidth={3} />
          </div>
          <h2 className="mt-4 text-xl font-extrabold text-slate-800">Terima Kasih!</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            {successMsg}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => navigate('/monev-survei')}
              className="rounded-[8px] bg-violet-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-violet-800"
            >
              Kembali ke Daftar Survei
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Kelompokkan pertanyaan berdasarkan seksi
  const kelompokSeksi: Record<string, MonevPertanyaanItem[]> = {};
  survei?.pertanyaanList.forEach((p) => {
    const seksi = p.seksi || 'Pertanyaan Evaluasi';
    if (!kelompokSeksi[seksi]) kelompokSeksi[seksi] = [];
    kelompokSeksi[seksi].push(p);
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* Tombol kembali & breadcrumb */}
      <div>
        <Link
          to="/monev-survei"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-700"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          <span>Kembali ke Daftar Survei</span>
        </Link>
      </div>

      {/* Header Formulir */}
      <div className="rounded-[16px] border border-violet-100 bg-gradient-to-r from-violet-900 to-indigo-900 p-6 text-white shadow-xs sm:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold text-violet-300">
          <ClipboardDocumentCheckIcon className="h-4 w-4" />
          <span>{survei?.periode?.nama}</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
          {survei?.judul}
        </h1>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-violet-100/90 sm:text-sm">
          {survei?.deskripsi}
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-300">
          <ShieldCheckIcon className="h-4 w-4" />
          <span>Pengisian formulir ini dijamin anonim dan data dihimpun untuk perbaikan mutu.</span>
        </div>
      </div>

      {error && (
        <div className="rounded-[10px] border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seksi Data Demografis Singkat (Opsional, untuk konteks agregat) */}
        <div className="rounded-[16px] border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <InformationCircleIcon className="h-5 w-5 text-violet-600" />
            <h2 className="text-sm font-bold text-slate-800">Informasi Konteks (Opsional)</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Digunakan untuk membantu pemetaan per fakultas/prodi tanpa mencatat identitas diri Anda.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Program Studi</label>
              <input
                type="text"
                placeholder="Contoh: Pendidikan Agama Islam"
                value={prodi}
                onChange={(e) => setProdi(e.target.value)}
                className="mt-1 w-full rounded-[8px] border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="mt-1 w-full rounded-[8px] border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-violet-500 focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={String(s)}>Semester {s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Mata Kuliah (Jika Relevan)</label>
              <input
                type="text"
                placeholder="Contoh: Metodologi Penelitian"
                value={mataKuliah}
                onChange={(e) => setMataKuliah(e.target.value)}
                className="mt-1 w-full rounded-[8px] border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Daftar Pertanyaan per Seksi */}
        {Object.entries(kelompokSeksi).map(([namaSeksi, daftarP], sIdx) => (
          <div key={sIdx} className="overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-xs">
            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
              <h2 className="text-sm font-extrabold text-slate-800">{namaSeksi}</h2>
              <p className="text-[11px] text-slate-500">
                Pilih opsi skala penilaian (1 = Sangat Tidak Setuju/Puas s/d 5 = Sangat Setuju/Puas).
              </p>
            </div>

            <div className="divide-y divide-slate-100 p-6">
              {daftarP.map((p, pIdx) => {
                const ans = jawabanState[p.id];
                return (
                  <div key={p.id} className={`${pIdx > 0 ? 'pt-6' : ''} ${pIdx < daftarP.length - 1 ? 'pb-6' : ''} space-y-3`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-semibold leading-relaxed text-slate-800">
                        <span className="mr-1.5 font-bold text-violet-700">{p.urutan}.</span>
                        {p.teks}
                        {p.wajib && <span className="ml-1 text-rose-500">*</span>}
                      </p>
                    </div>

                    {p.tipe === 'SKALA_5' && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 sm:gap-4">
                        {[
                          { nilai: 1, label: '1 - Sangat Tidak Puas' },
                          { nilai: 2, label: '2 - Kurang Puas' },
                          { nilai: 3, label: '3 - Cukup' },
                          { nilai: 4, label: '4 - Puas' },
                          { nilai: 5, label: '5 - Sangat Puas' },
                        ].map((opt) => {
                          const aktif = ans?.nilaiSkala === opt.nilai;
                          return (
                            <button
                              key={opt.nilai}
                              type="button"
                              onClick={() => handlePilihSkala(p.id, opt.nilai)}
                              className={`flex h-10 min-w-[42px] items-center justify-center rounded-[8px] border px-3 text-xs font-bold transition-all sm:flex-1 ${
                                aktif
                                  ? 'border-violet-600 bg-violet-600 text-white shadow-xs ring-2 ring-violet-200'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50/50'
                              }`}
                            >
                              {opt.nilai}
                              <span className="hidden sm:inline sm:ml-1 text-[11px] font-normal opacity-90">
                                {opt.nilai === 1 ? 'STP' : opt.nilai === 2 ? 'KP' : opt.nilai === 3 ? 'CP' : opt.nilai === 4 ? 'P' : 'SP'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {p.tipe === 'ESAI' && (
                      <textarea
                        rows={3}
                        value={ans?.nilaiTeks || ''}
                        onChange={(e) => handleInputTeks(p.id, e.target.value)}
                        placeholder="Tuliskan saran, kritik, atau komentar konstruktif Anda di sini..."
                        className="w-full rounded-[8px] border border-slate-200 p-3 text-xs text-slate-800 focus:border-violet-500 focus:outline-none"
                      />
                    )}

                    {p.tipe === 'TEKS_SINGKAT' && (
                      <input
                        type="text"
                        value={ans?.nilaiTeks || ''}
                        onChange={(e) => handleInputTeks(p.id, e.target.value)}
                        placeholder="Tulis jawaban singkat Anda..."
                        className="w-full rounded-[8px] border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-violet-500 focus:outline-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Action Button */}
        <div className="flex items-center justify-between rounded-[14px] border border-slate-200 bg-white p-4 shadow-xs">
          <Link
            to="/monev-survei"
            className="rounded-[8px] border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Batal
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-[8px] bg-violet-700 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-violet-800 disabled:opacity-50"
          >
            {submitting ? 'Mengirim Respon...' : 'Kirim Respon Anonim'}
          </button>
        </div>
      </form>
    </div>
  );
};
