import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AcademicCapIcon,
  BookOpenIcon,
  HeartIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  CpuChipIcon,
  GlobeAltIcon,
  UserGroupIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { FullHeroSlider } from '../components/FullHeroSlider';
import { Navbar } from '../components/Navbar';
import { LatarDekoratif } from '../components/LatarDekoratif';
import { assetUrl } from '../lib/assets';
import { fetchPenelitian, fetchPengabdian, fetchPublikasi } from '../services/api';
import { useReveal, useCountUp } from '../hooks/useReveal';

const ONE_UNUSU_URL = import.meta.env.VITE_ONE_UNUSU_URL || 'https://unusu.bpp-developer.com/sso';

/**
 * Tautan satelit ekosistem dikendalikan lewat env var agar tidak pernah
 * menunjuk ke `localhost` pada build produksi. Default sengaja dibiarkan
 * ke domain produksi; saat pengembangan cukup mengisi `.env.local`.
 */
const SATELLITE_URLS = {
  lpm: import.meta.env.VITE_LPM_URL || 'https://unusu.bpp-developer.com/lpm',
  esurat: import.meta.env.VITE_ESURAT_URL || 'https://unusu.bpp-developer.com/esurat',
  lms: import.meta.env.VITE_LMS_URL || 'https://unusu.bpp-developer.com/lms',
};

/**
 * KartuStatistik: satu kartu capaian pada panel `#statistik`.
 *
 * Angka dianimasikan naik saat kartu memasuki viewport agar terbaca sebagai
 * data yang baru dimuat. Bila `nilai` masih `null` (belum ada data), yang
 * tampil teks placeholder dan animasi count-up dilewati.
 */
const KartuStatistik: React.FC<{
  ikon: React.ElementType;
  label: string;
  nilai: number | null;
  teks: string;
  urutan: number;
}> = ({ ikon: Icon, label, nilai, teks, urutan }) => {
  const { ref, style, terlihat } = useReveal<HTMLDivElement>({ delay: urutan * 90 });
  // Hitungan dimulai hanya setelah kartu ini sendiri masuk layar, sehingga
  // setiap kartu punya animasi angkanya sendiri saat di-scroll.
  const terhitung = useCountUp(nilai, terlihat);
  const tampil = nilai === null ? teks : new Intl.NumberFormat('id-ID').format(terhitung);

  return (
    <div
      ref={ref}
      style={style}
      className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-2"
    >
      <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center mx-auto">
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums">
        {tampil}
      </div>
      <p className="text-sm text-violet-100 font-medium">{label}</p>
    </div>
  );
};

/**
 * Reveal: pembungkus tipis `useReveal` untuk dipakai di JSX.
 *
 * Bila animasi tidak bisa berjalan (JS mati, `IntersectionObserver` tidak
 * tersedia), `useReveal` langsung menampilkan elemen dalam keadaan akhir
 * sehingga konten tidak pernah hilang.
 */
const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'li';
}> = ({ children, delay = 0, className, as: Tag = 'div' }) => {
  const { ref, style } = useReveal<HTMLElement>({ delay });
  return (
    <Tag ref={ref as React.Ref<never>} style={style} className={className}>
      {children}
    </Tag>
  );
};

export const LandingPage: React.FC = () => {
  const location = useLocation();

  /**
   * Gulir ke seksi landing berdasarkan hash (`/#layanan`, `/#skema`, ...).
   * Navbar publik hanya menautkan seksi dalam halaman ini, tidak ada tautan
   * yang membuka panel manajemen.
   */
  React.useEffect(() => {
    const id = location.hash.replace('#', '');
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    const raf = window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [location.hash, location.key]);

  const skemaPenelitian = [
    {
      kode: 'PDP',
      nama: 'Penelitian Dosen Pemula',
      target: 'Dosen Asisten Ahli & Lektor',
      luaran: 'Jurnal Nasional Terakreditasi SINTA 3-6',
      badge: 'Riset Pemula',
      icon: AcademicCapIcon,
      bgColor: 'bg-violet-50 text-violet-700 border-violet-200',
      badgeColor: 'bg-violet-50 text-violet-800 border-violet-300',
    },
    {
      kode: 'PTR',
      nama: 'Penelitian Terapan Unggulan',
      target: 'Dosen Lektor & Lektor Kepala',
      luaran: 'Prototipe TKT 4-6, HKI Paten/Hak Cipta',
      badge: 'Hilirisasi Inovasi',
      icon: CpuChipIcon,
      bgColor: 'bg-violet-50 text-violet-700 border-violet-200',
      badgeColor: 'bg-violet-50 text-violet-800 border-violet-300',
    },
    {
      kode: 'PKM-M',
      nama: 'Pengabdian Kemitraan Masyarakat',
      target: 'Kelompok Dosen Multi-Disiplin',
      luaran: 'Peningkatan Kapasitas Mitra & Publikasi PKM',
      badge: 'Pemberdayaan Umat',
      icon: UserGroupIcon,
      bgColor: 'bg-violet-50 text-violet-700 border-violet-200',
      badgeColor: 'bg-violet-50 text-violet-800 border-violet-300',
    },
    {
      kode: 'P-KOLAB',
      nama: 'Riset Kolaborasi Antar-Institusi',
      target: 'Peneliti Utama UNUSU & Mitra Eksternal',
      luaran: 'Publikasi Scopus / WOS Bereputasi',
      badge: 'Internasional',
      icon: GlobeAltIcon,
      bgColor: 'bg-violet-50 text-violet-700 border-violet-200',
      badgeColor: 'bg-violet-50 text-violet-800 border-violet-300',
    },
  ];

  /**
   * Angka capaian diambil dari arsip LPPM yang sebenarnya (endpoint publik
   * `/api/penelitian`, `/api/pengabdian`, `/api/publikasi`). Selama data belum
   * termuat atau permintaan gagal, tampilkan tanda pisah, bukan angka karangan:
   * halaman publik tidak boleh mengklaim capaian yang tidak bisa dibuktikan.
   */
  const [capaian, setCapaian] = React.useState<{
    penelitian: number | null;
    pengabdian: number | null;
    publikasi: number | null;
    gagal: boolean;
  }>({ penelitian: null, pengabdian: null, publikasi: null, gagal: false });

  React.useEffect(() => {
    let dibatalkan = false;

    Promise.all([fetchPenelitian(), fetchPengabdian(), fetchPublikasi()])
      .then(([p, pkm, pub]) => {
        if (dibatalkan) return;
        setCapaian({
          penelitian: p.data.data.length,
          pengabdian: pkm.data.data.length,
          publikasi: pub.data.data.length,
          gagal: false,
        });
      })
      .catch(() => {
        if (!dibatalkan) setCapaian((prev) => ({ ...prev, gagal: true }));
      });

    return () => {
      dibatalkan = true;
    };
  }, []);

  // Placeholder saat data belum termuat: "..." bukan "0", karena nol berarti
  // arsip benar-benar kosong, sedangkan keadaan ini masih memuat.
  const angka = (n: number | null) =>
    n === null ? '...' : new Intl.NumberFormat('id-ID').format(n);

  const statistikLppm = [
    {
      nilai: capaian.penelitian,
      angka: angka(capaian.penelitian),
      label: 'Proposal Penelitian Terarsip',
      icon: DocumentTextIcon,
    },
    {
      nilai: capaian.pengabdian,
      angka: angka(capaian.pengabdian),
      label: 'Program Pengabdian (PKM)',
      icon: HeartIcon,
    },
    {
      nilai: capaian.publikasi,
      angka: angka(capaian.publikasi),
      label: 'Artikel Jurnal & Prosiding',
      icon: BookOpenIcon,
    },
    {
      nilai: 14,
      angka: '14',
      label: 'Program Studi Terintegrasi',
      icon: AcademicCapIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFE] text-slate-800 font-sans selection:bg-violet-700 selection:text-white">
      {/* 1. TOP ANNOUNCEMENT STRIP: identitas aplikasi LPPM UNUSU saja
          (tanpa emblem "Portal Resmi" & tanpa tautan portal lain). */}
      <div className="bg-violet-950 text-violet-100 px-4 py-2 text-xs font-semibold border-b border-violet-900/50">
        <div className="max-w-7xl mx-auto flex items-center justify-center sm:justify-start">
          <p className="min-w-0 text-center sm:text-left">
            <span className="font-bold text-white">LPPM UNUSU</span>
            <span className="mx-1.5 text-white/40" aria-hidden="true">
              &middot;
            </span>
            <span>
              Sistem Informasi Penelitian &amp; Pengabdian kepada Masyarakat
            </span>
            <span className="hidden sm:inline">
              <span className="mx-1.5 text-white/40" aria-hidden="true">
                &middot;
              </span>
              Universitas Nahdlatul Ulama Sumatera Utara
            </span>
          </p>
        </div>
      </div>

      {/* 2. NAVBAR (brand kiri · menu tengah · aksi kanan) komponen bersama */}
      <Navbar />

      {/* 3. HERO FULL SLIDER (80% Visual Gambar, 20% Tulisan Ringkas di Bawah) */}
      <FullHeroSlider />

      {/* 3.5 TENTANG LPPM (teks kiri, foto potret kanan, pola baku ONE UNUSU) */}
      <section
        id="tentang"
        aria-labelledby="tentang-title"
        className="relative isolate overflow-hidden bg-white py-16 sm:py-24 border-b border-slate-200/70"
      >
        <LatarDekoratif jenis="titik" arah="kanan" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* KIRI: narasi & keunggulan */}
          <Reveal className="lg:col-span-6">
            <p className="border-l-2 border-violet-700 pl-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet-800">
              Tentang Platform
            </p>
            <h2
              id="tentang-title"
              className="mt-3 text-3xl font-semibold tracking-tight text-balance text-slate-950 sm:text-4xl"
            >
              Mengenal LPPM UNUSU
            </h2>

            <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              <p>
                Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) adalah pusat inovasi riset,
                hilirisasi keilmuan, dan pengabdian sivitas akademika Universitas Nahdlatul Ulama Sumatera
                Utara bagi kemaslahatan masyarakat dan kemandirian bangsa.
              </p>
              <p>
                Melalui ekosistem digital terpadu, LPPM UNUSU memfasilitasi seluruh siklus riset dosen dan
                mahasiswa, mulai dari seleksi proposal hibah kompetitif, monitoring dan evaluasi kemajuan
                (Monev), pelaporan luaran jurnal SINTA/Scopus, perolehan HKI paten, hingga kemitraan desa
                binaan.
              </p>
            </div>

            <ul className="mt-7 space-y-3">
              {[
                'Skema pendanaan riset dosen pemula hingga kolaborasi internasional',
                'Hilirisasi pengabdian kemitraan masyarakat (PKM) berbasis kearifan lokal',
                'Sentra HKI dan percepatan publikasi ilmiah bereputasi nasional & global',
              ].map((item, idx) => (
                <Reveal
                  key={item}
                  as="li"
                  delay={200 + idx * 70}
                  className="flex items-start gap-3 text-xs text-slate-700 sm:text-sm"
                >
                  <span
                    className="mt-0.5 grid size-5 flex-shrink-0 place-items-center rounded-full bg-violet-700 text-white"
                    aria-hidden="true"
                  >
                    <CheckIcon className="size-3.5" strokeWidth={2.5} />
                  </span>
                  <span>{item}</span>
                </Reveal>
              ))}
            </ul>
          </Reveal>

          {/* KANAN: foto model mahasiswa setengah badan (PNG transparan) */}
          <Reveal delay={120} className="lg:col-span-6">
            <div className="relative mx-auto flex max-w-lg items-end justify-center">
              <div
                className="absolute inset-x-2 bottom-0 h-[86%] rounded-[40px] border border-violet-100 bg-gradient-to-tr from-violet-100/90 to-transparent"
                aria-hidden="true"
              />
              <img
                src={assetUrl('/assets/profil-peneliti.png')}
                alt="Mahasiswa UNUSU membawa buku dan tas, siap mengikuti program riset LPPM"
                loading="lazy"
                decoding="async"
                className="relative z-10 block h-auto w-full object-contain drop-shadow-[0_25px_50px_rgba(109,40,217,0.22)] transition-transform duration-300 hover:scale-[1.02] sm:max-w-[500px]"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 4. TIGA PILAR UTAMA LAYANAN */}
      <section
        id="layanan"
        className="relative isolate overflow-hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
      >
        <LatarDekoratif jenis="titik" arah="kiri" />
        <div className="relative">
          <Reveal className="text-center max-w-2xl mx-auto mb-14">
          <p className="inline-block border-y-2 border-violet-700 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-violet-800">
            Tiga Pilar
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-slate-950 sm:text-4xl">
            Pilar Layanan Riset LPPM UNUSU
          </h2>
          <p className="mt-4 text-base text-slate-600 leading-relaxed text-pretty">
            Menyediakan ekosistem pendukung riset yang transparan, akuntabel, dan berorientasi pada kemanfaatan masyarakat luas.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              ikon: DocumentTextIcon,
              judul: 'Pangkalan Penelitian Dosen',
              teks: 'Pencatatan usulan hibah, reviu proposal, monitoring kemajuan riset (Monev), serta pelaporan akhir dana penelitian internal & eksternal.',
              cakupan: 'Cakupan: hibah internal & eksternal',
            },
            {
              ikon: HeartIcon,
              judul: 'Pengabdian Kepada Masyarakat (PKM)',
              teks: 'Pemberdayaan mitra desa binaan, pesantren, UMKM, dan komunitas melalui transfer ilmu pengetahuan dan teknologi terapan berbasis Aswaja.',
              cakupan: 'Cakupan: desa binaan, pesantren, UMKM',
            },
            {
              ikon: BookOpenIcon,
              judul: 'Publikasi Ilmiah & HKI',
              teks: 'Pengelolaan repositori artikel jurnal terindeks SINTA/Scopus, prosiding seminar nasional, paten sederhana, dan sertifikat Hak Cipta dosen.',
              cakupan: 'Cakupan: SINTA, Scopus, paten, hak cipta',
            },
          ].map((pilar, idx) => {
            const Icon = pilar.ikon;
            return (
              <Reveal
                key={pilar.judul}
                delay={idx * 90}
                className="bg-white rounded-3xl border border-slate-200/90 p-8 space-y-5 hover:border-violet-400 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center border border-violet-100">
                    <Icon className="w-7 h-7" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-950">{pilar.judul}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{pilar.teks}</p>
                </div>
                <div className="pt-4 border-t border-slate-100 text-xs font-semibold text-violet-700">
                  {pilar.cakupan}
                </div>
              </Reveal>
            );
          })}
        </div>
        </div>
      </section>

      {/* 5. SKEMA HIBAH & PENDANAAN */}
      <section
        id="skema"
        className="relative isolate overflow-hidden bg-[#F6F3F9] py-20 border-y border-violet-900/10"
      >
        <LatarDekoratif jenis="kisi" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-14">
            <p className="inline-block border-y-2 border-violet-700 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-violet-800">
              Empat Skema
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-slate-950 sm:text-4xl">
              Kategori Pendanaan &amp; Target Luaran
            </h2>
            <p className="mt-4 text-base text-slate-600 leading-relaxed text-pretty">
              Fasilitasi hibah bertingkat untuk mengakomodasi seluruh jenjang fungsional dosen di lingkungan UNUSU.
            </p>
          </Reveal>

          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {skemaPenelitian.map((skema, idx) => {
              const SchemeIcon = skema.icon;
              return (
                <Reveal
                  key={skema.kode}
                  delay={idx * 70}
                  className="bg-white rounded-2xl p-6 border border-slate-200/90 space-y-4 hover:border-violet-600 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${skema.bgColor}`}>
                        <SchemeIcon className="w-6 h-6" aria-hidden="true" />
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {skema.kode}
                      </span>
                    </div>
                    <h4 className="font-bold text-base text-slate-900 leading-snug">{skema.nama}</h4>
                    <dl className="text-sm space-y-1.5 pt-1">
                      <div>
                        <dt className="inline text-slate-500">Sasaran: </dt>
                        <dd className="inline text-slate-700 font-semibold">{skema.target}</dd>
                      </div>
                      <div>
                        <dt className="inline text-slate-500">Target Luaran: </dt>
                        <dd className="inline text-violet-700 font-semibold">{skema.luaran}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md border ${skema.badgeColor}`}>
                      {skema.badge}
                    </span>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. STATISTIK KINERJA LPPM */}
      <section id="statistik" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-violet-950 via-violet-900 to-slate-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <Reveal className="text-center max-w-2xl mx-auto mb-10">
            <p className="inline-block border-y-2 border-white/60 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              Arsip Berjalan
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
              Capaian Produktivitas Riset Dosen
            </h2>
            <p className="mt-4 text-base text-violet-100 leading-relaxed text-pretty">
              Indikator kinerja utama dalam memperkuat daya saing akademik UNUSU di tingkat regional dan nasional.
            </p>
          </Reveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {statistikLppm.map((stat, idx) => (
              <KartuStatistik
                key={stat.label}
                ikon={stat.icon}
                label={stat.label}
                nilai={stat.nilai}
                teks={stat.angka}
                urutan={idx}
              />
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-violet-200">
            {capaian.gagal
              ? 'Arsip capaian sedang tidak dapat diakses. Silakan muat ulang halaman.'
              : 'Dihitung langsung dari arsip LPPM UNUSU.'}
          </p>
        </div>
      </section>

      {/* 7. ALUR TAHAPAN PENGAJUAN */}
      <section
        id="alur"
        className="relative isolate overflow-hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20"
      >
        <LatarDekoratif jenis="lengkung" arah="kanan" />
        <Reveal className="relative text-center max-w-2xl mx-auto mb-14">
          <p className="inline-block border-y-2 border-violet-700 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-violet-800">
            Empat Tahap
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-slate-950 sm:text-4xl">
            Siklus Hibah &amp; Publikasi Mandiri
          </h2>
          <p className="mt-4 text-base text-slate-600 leading-relaxed text-pretty">
            Tahapan transparan dari penerimaan proposal hingga seminar hasil riset.
          </p>
        </Reveal>

        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              nomor: '01',
              judul: 'Penerimaan Proposal',
              teks: 'Dosen mengajukan proposal penelitian atau PKM secara digital melalui akun ONE UNUSU.',
            },
            {
              nomor: '02',
              judul: 'Desk Evaluation & Reviu',
              teks: 'Tim reviewer independen menilai kelayakan metodologi, kebaruan topik, dan alokasi anggaran (RAB).',
            },
            {
              nomor: '03',
              judul: 'Kontrak & Monev Lapangan',
              teks: 'Penetapan pemenang hibah, penandatanganan kontrak kerja riset, serta monitoring kemajuan berkala.',
            },
            {
              nomor: '04',
              judul: 'Seminar Hasil & Luaran',
              teks: 'Pelaporan pertanggungjawaban dana, diseminasi temuan pada seminar, serta penyerahan bukti publikasi/HKI.',
            },
          ].map((tahap, idx) => (
            <Reveal
              key={tahap.nomor}
              delay={idx * 80}
              className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3"
            >
              <span className="w-8 h-8 rounded-xl bg-violet-700 text-white flex items-center justify-center font-bold text-xs">
                {tahap.nomor}
              </span>
              <h4 className="font-bold text-slate-900 text-base">{tahap.judul}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{tahap.teks}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 8. FOOTER RESMI KAMPUS */}
      <footer className="bg-slate-950 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-violet-700 text-white flex items-center justify-center font-bold">
                  <AcademicCapIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-lg">LPPM UNUSU</span>
                  <p className="text-[11px] text-slate-300">Lembaga Penelitian &amp; Pengabdian kepada Masyarakat</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 max-w-md leading-relaxed">
                Jl. Gaperta Ujung No. 1, Medan Helvetia, Kota Medan, Sumatera Utara.
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-white">Tautan Satelit</h5>
              <ul className="text-xs text-slate-300">
                <li>
                  <a href={ONE_UNUSU_URL} className="inline-flex items-center min-h-[44px] hover:text-violet-400 transition-colors">
                    Portal ONE UNUSU
                  </a>
                </li>
                <li>
                  <a href={SATELLITE_URLS.lpm} className="inline-flex items-center min-h-[44px] hover:text-violet-400 transition-colors">
                    LPM Penjaminan Mutu
                  </a>
                </li>
                <li>
                  <a href={SATELLITE_URLS.esurat} className="inline-flex items-center min-h-[44px] hover:text-violet-400 transition-colors">
                    E-Surat &amp; Tata Naskah
                  </a>
                </li>
                <li>
                  <a href={SATELLITE_URLS.lms} className="inline-flex items-center min-h-[44px] hover:text-violet-400 transition-colors">
                    LMS Perkuliahan Daring
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-white">Gerbang Peneliti</h5>
              <p className="text-xs text-slate-300 leading-relaxed">
                Kelola luaran Tridharma Perguruan Tinggi dengan autentikasi SSO kampus.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-white text-xs font-bold transition-all"
                >
                  <span>Masuk</span>
                  <ArrowRightIcon className="w-3.5 h-3.5 text-white" />
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>&copy; {new Date().getFullYear()} LPPM Universitas Nahdlatul Ulama Sumatera Utara. Hak Cipta Dilindungi.</p>
            <p className="text-[11px] text-violet-300">Sistem Informasi Riset & PKM Terintegrasi</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
