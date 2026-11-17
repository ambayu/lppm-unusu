import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { PageHeader } from '../components/PageHeader';
import { PublicFooter } from '../components/PublicFooter';
import { NotificationModal } from '../components/NotificationModal';
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
  const [modalNotif, setModalNotif] = useState<{
    isOpen: boolean;
    type: 'error' | 'warning' | 'info' | 'confirm';
    title: string;
    message: string;
  } | null>(null);

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
      setModalNotif({
        isOpen: true,
        type: 'warning',
        title: 'Butir Wajib Belum Lengkap',
        message: `Mohon lengkapi seluruh butir pertanyaan wajib (${belumDiisi.length} butir belum dijawab). Silakan periksa kembali sebelum mengirim.`,
      });
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Header Halaman Publik sesuai standar UNUSU */}
        <PageHeader
          eyebrow="INSTRUMEN MONEV"
          title={survei?.judul || 'Formulir Kuesioner Monev'}
          description={survei?.deskripsi || 'Silakan isi penilaian Anda secara objektif. Masukan Anda sangat berarti bagi kemajuan mutu institusi.'}
        >
          <div className="flex flex-row flex-nowrap items-center gap-3 pt-2 text-xs sm:text-sm overflow-x-auto pb-1">
            <Link
              to="/monev-survei"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/20 border border-white/20 transition backdrop-blur-xs"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Kembali ke Katalog</span>
            </Link>
            <div className="inline-flex shrink-0 items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-xs text-violet-200 border border-violet-400/20 shadow-xs">
              <ShieldCheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 shrink-0" />
              <span className="font-semibold whitespace-nowrap">Respon Dijamin Anonim</span>
            </div>
            {survei?.periode && (
              <div className="inline-flex shrink-0 items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-xs text-amber-200 border border-amber-400/20 shadow-xs">
                <ClipboardDocumentCheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-amber-300 shrink-0" />
                <span className="font-semibold whitespace-nowrap">Periode: <strong className="text-white">{survei.periode.nama}</strong></span>
              </div>
            )}
          </div>
        </PageHeader>

        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {error && (
        <div className="rounded-[10px] border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Langkah 1: Data Identitas Perkuliahan (1 kolom, lebar penuh, tulisan besar) */}
        <div className="rounded-[20px] border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
              1
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Langkah 1: Informasi Program Studi &amp; Perkuliahan</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Isi data berikut untuk pemetaan evaluasi tanpa mencatat identitas diri Anda (anonim).
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label className="block text-sm sm:text-base font-semibold text-slate-800">
                Program Studi
              </label>
              <input
                type="text"
                placeholder="Contoh: Pendidikan Agama Islam"
                value={prodi}
                onChange={(e) => setProdi(e.target.value)}
                className="mt-2 w-full rounded-[10px] border border-slate-300 px-4 py-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold text-slate-800">
                Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="mt-2 w-full rounded-[10px] border border-slate-300 px-4 py-3 text-sm sm:text-base text-slate-900 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-100"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={String(s)}>Semester {s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold text-slate-800">
                Mata Kuliah (Jika Relevan)
              </label>
              <input
                type="text"
                placeholder="Contoh: Metodologi Penelitian"
                value={mataKuliah}
                onChange={(e) => setMataKuliah(e.target.value)}
                className="mt-2 w-full rounded-[10px] border border-slate-300 px-4 py-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
            </div>
          </div>
        </div>

        {/* Daftar Pertanyaan per Seksi */}
        {Object.entries(kelompokSeksi).map(([namaSeksi, daftarP], sIdx) => (
          <div key={sIdx} className="overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-xs">
            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-800">{namaSeksi}</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Pilih opsi penilaian dari Sangat Puas hingga Sangat Tidak Puas.
              </p>
            </div>

            <div className="divide-y divide-slate-100 p-6">
              {daftarP.map((p, pIdx) => {
                const ans = jawabanState[p.id];
                return (
                  <div key={p.id} className={`${pIdx > 0 ? 'pt-6' : ''} ${pIdx < daftarP.length - 1 ? 'pb-6' : ''} space-y-3`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm sm:text-base font-semibold leading-relaxed text-slate-900">
                        <span className="mr-2 font-extrabold text-violet-700 text-base">{p.urutan}.</span>
                        {p.teks}
                        {p.wajib && <span className="ml-1 text-rose-500">*</span>}
                      </p>
                    </div>

                    {p.tipe === 'SKALA_5' && (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                        {[
                          {
                            nilai: 5,
                            label: 'Sangat Puas',
                            warnaAktif: 'border-emerald-600 bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200',
                            warnaIdle: 'border-emerald-200 bg-emerald-50/40 text-emerald-800 hover:bg-emerald-100/60 hover:border-emerald-300',
                          },
                          {
                            nilai: 4,
                            label: 'Puas',
                            warnaAktif: 'border-teal-600 bg-teal-600 text-white shadow-sm ring-2 ring-teal-200',
                            warnaIdle: 'border-teal-200 bg-teal-50/40 text-teal-800 hover:bg-teal-100/60 hover:border-teal-300',
                          },
                          {
                            nilai: 3,
                            label: 'Cukup Puas',
                            warnaAktif: 'border-amber-500 bg-amber-500 text-white shadow-sm ring-2 ring-amber-200',
                            warnaIdle: 'border-amber-200 bg-amber-50/40 text-amber-800 hover:bg-amber-100/60 hover:border-amber-300',
                          },
                          {
                            nilai: 2,
                            label: 'Kurang Puas',
                            warnaAktif: 'border-orange-500 bg-orange-500 text-white shadow-sm ring-2 ring-orange-200',
                            warnaIdle: 'border-orange-200 bg-orange-50/40 text-orange-800 hover:bg-orange-100/60 hover:border-orange-300',
                          },
                          {
                            nilai: 1,
                            label: 'Sangat Tidak Puas',
                            warnaAktif: 'border-rose-600 bg-rose-600 text-white shadow-sm ring-2 ring-rose-200',
                            warnaIdle: 'border-rose-200 bg-rose-50/40 text-rose-800 hover:bg-rose-100/60 hover:border-rose-300',
                          },
                        ].map((opt) => {
                          const aktif = ans?.nilaiSkala === opt.nilai;
                          return (
                            <button
                              key={opt.nilai}
                              type="button"
                              onClick={() => handlePilihSkala(p.id, opt.nilai)}
                              className={`flex min-h-[46px] items-center justify-center rounded-[12px] border px-3 py-2.5 text-xs sm:text-sm transition-all text-center ${
                                aktif
                                  ? `${opt.warnaAktif} font-bold`
                                  : `${opt.warnaIdle} font-semibold`
                              }`}
                            >
                              <span>{opt.label}</span>
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
                        className="w-full rounded-[10px] border border-slate-300 p-4 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-100"
                      />
                    )}

                    {p.tipe === 'TEKS_SINGKAT' && (
                      <input
                        type="text"
                        value={ans?.nilaiTeks || ''}
                        onChange={(e) => handleInputTeks(p.id, e.target.value)}
                        placeholder="Tulis jawaban singkat Anda..."
                        className="w-full rounded-[10px] border border-slate-300 px-4 py-3 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:border-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-100"
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
            className="inline-flex min-h-[44px] items-center gap-2 rounded-[12px] bg-violet-700 px-8 py-3.5 text-sm sm:text-base font-bold text-white shadow-md transition hover:bg-violet-800 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Mengirim Respon...' : 'Kirim Respon'}
          </button>
        </div>
      </form>
        </main>
      </div>

      {/* Modal Notifikasi Validasi & Respon */}
      {modalNotif && (
        <NotificationModal
          isOpen={modalNotif.isOpen}
          type={modalNotif.type}
          title={modalNotif.title}
          message={modalNotif.message}
          confirmLabel="Mengerti"
          onClose={() => setModalNotif(null)}
        />
      )}

      <PublicFooter />
    </div>
  );
};
