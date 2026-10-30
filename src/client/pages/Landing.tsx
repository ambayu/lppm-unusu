import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AcademicCapIcon,
  BookOpenIcon,
  HeartIcon,
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  Bars3Icon,
  XMarkIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { FullHeroSlider } from '../components/FullHeroSlider';
import { assetUrl } from '../lib/assets';

const ONE_UNUSU_URL = import.meta.env.VITE_ONE_UNUSU_URL || 'http://localhost:5173';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const skemaPenelitian = [
    {
      kode: 'PDP',
      nama: 'Penelitian Dosen Pemula',
      target: 'Dosen Asisten Ahli & Lektor',
      luaran: 'Jurnal Nasional Terakreditasi SINTA 3-6',
      badge: 'Riset Pemula',
    },
    {
      kode: 'PTR',
      nama: 'Penelitian Terapan Unggulan',
      target: 'Dosen Lektor & Lektor Kepala',
      luaran: 'Prototipe TKT 4-6, HKI Paten/Hak Cipta',
      badge: 'Hilirisasi Inovasi',
    },
    {
      kode: 'PKM-M',
      nama: 'Pengabdian Kemitraan Masyarakat',
      target: 'Kelompok Dosen Multi-Disiplin',
      luaran: 'Peningkatan Kapasitas Mitra & Publikasi PKM',
      badge: 'Pemberdayaan Umat',
    },
    {
      kode: 'P-KOLAB',
      nama: 'Riset Kolaborasi Antar-Institusi',
      target: 'Peneliti Utama UNUSU & Mitra Eksternal',
      luaran: 'Publikasi Scopus / WOS Bereputasi',
      badge: 'Internasional',
    },
  ];

  const statistikLppm = [
    { angka: '120+', label: 'Proposal Penelitian Terarsip', icon: DocumentTextIcon },
    { angka: '85+', label: 'Program Pengabdian (PKM)', icon: HeartIcon },
    { angka: '240+', label: 'Artikel Jurnal & Prosiding', icon: BookOpenIcon },
    { angka: '14', label: 'Program Studi Terintegrasi', icon: AcademicCapIcon },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFE] text-slate-800 font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* 1. TOP ANNOUNCEMENT STRIP (SESUAI IDENTITAS LOGIN: VIOLET & AMBER) */}
      <div className="bg-violet-950 text-violet-100 px-4 py-2 text-xs font-semibold border-b border-violet-900/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate">
            <span className="bg-amber-400 text-slate-950 text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
              Portal Resmi
            </span>
            <span className="truncate">
              Lembaga Penelitian & Pengabdian kepada Masyarakat — Universitas Nahdlatul Ulama Sumatera Utara
            </span>
          </div>
          <div className="hidden sm:flex items-center space-x-4 text-[11px] font-medium text-violet-200">
            <a
              href={`${ONE_UNUSU_URL}/dashboard`}
              className="flex items-center space-x-1 hover:text-white transition-colors"
            >
              <span>Portal Terpadu ONE UNUSU</span>
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. NAVBAR BERSIH (VIOLET THEME & AMBER ACCENT) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo Brand */}
          <Link to="/" className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-violet-700 flex items-center justify-center text-white shadow-md ring-2 ring-violet-600">
              <AcademicCapIcon className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-xl text-slate-950 tracking-normal">LPPM</span>
                <span className="font-bold text-xl text-violet-700 tracking-normal">UNUSU</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">
                Penelitian & Pengabdian Masyarakat
              </p>
            </div>
          </Link>

          {/* Navigasi Utama */}
          <nav
            className="hidden md:flex items-center space-x-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/60"
            aria-label="Navigasi utama"
          >
            <a
              href="#layanan"
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-violet-700 hover:bg-white rounded-xl transition-all"
            >
              Pilar Tridharma
            </a>
            <a
              href="#skema"
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-violet-700 hover:bg-white rounded-xl transition-all"
            >
              Skema Hibah
            </a>
            <a
              href="#alur"
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-violet-700 hover:bg-white rounded-xl transition-all"
            >
              Alur Pengajuan
            </a>
            <a
              href="#statistik"
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-violet-700 hover:bg-white rounded-xl transition-all"
            >
              Capaian Kinerja
            </a>
          </nav>

          {/* Right Action */}
          <div className="hidden sm:flex items-center space-x-3">
            {user ? (
              <Link
                to="/penelitian"
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
              >
                <span>Panel Peneliti</span>
                <ArrowRightIcon className="w-3.5 h-3.5 text-amber-400" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
              >
                <span>Masuk</span>
                <ArrowRightIcon className="w-3.5 h-3.5 text-amber-400" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
            aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
          >
            {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
            <a
              href="#layanan"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-medium text-slate-700 py-1.5"
            >
              Pilar Tridharma
            </a>
            <a
              href="#skema"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-medium text-slate-700 py-1.5"
            >
              Skema Hibah
            </a>
            <a
              href="#alur"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-medium text-slate-700 py-1.5"
            >
              Alur Pengajuan
            </a>
            <a
              href="#statistik"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-medium text-slate-700 py-1.5"
            >
              Capaian Kinerja
            </a>
            <div className="pt-2 border-t border-slate-100">
              {user ? (
                <Link
                  to="/penelitian"
                  className="w-full text-center block px-4 py-2.5 rounded-xl bg-violet-700 text-white text-xs font-bold"
                >
                  Panel Peneliti
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="w-full text-center block px-4 py-2.5 rounded-xl bg-violet-700 text-white text-xs font-bold"
                >
                  Masuk
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 3. HERO FULL SLIDER (80% Visual Gambar, 20% Tulisan Ringkas di Bawah) */}
      <FullHeroSlider />

      {/* 3.5 TENTANG LPPM UNUSU (DESAIN SEPERTI PROFIL ONE UNUSU) */}
      <section id="profil" aria-labelledby="profil-lppm-title" className="bg-white py-16 sm:py-24 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-violet-700 bg-violet-50 border border-violet-200 px-3 py-1 rounded-full inline-block">
                Tentang Lembaga
              </span>
              <h2 id="profil-lppm-title" className="text-2xl sm:text-4xl font-bold text-slate-950 tracking-tight pt-2">
                Mengenal LPPM UNUSU
              </h2>
            </div>

            <div className="mt-6 space-y-4 text-sm sm:text-base leading-relaxed text-slate-600">
              <p>
                Lembaga Penelitian dan Pengabdian kepada Masyarakat (LPPM) adalah pusat inovasi riset, hilirisasi keilmuan, dan pengabdian sivitas akademika Universitas Nahdlatul Ulama Sumatera Utara bagi kemaslahatan masyarakat dan kemandirian bangsa.
              </p>
              <p>
                Melalui ekosistem digital terpadu, LPPM UNUSU memfasilitasi seluruh siklus riset dosen dan mahasiswa—mulai dari seleksi proposal hibah kompetitif, monitoring dan evaluasi kemajuan (Monev), pelaporan luaran jurnal SINTA/Scopus, perolehan HKI paten, hingga kemitraan desa binaan.
              </p>
            </div>

            <ul className="mt-6 space-y-3">
              {[
                'Skema pendanaan riset dosen pemula hingga kolaborasi internasional',
                'Hilirisasi pengabdian kemitraan masyarakat (PKM) berbasis kearifan lokal',
                'Sentra HKI dan percepatan publikasi ilmiah bereputasi nasional & global',
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                  <span className="mt-0.5 grid size-5 flex-shrink-0 place-items-center rounded-full bg-violet-700 text-amber-300">
                    <AcademicCapIcon className="size-3.5" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Visual Peneliti Setengah Badan (Ukuran Lebih Besar & Menawan) */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto flex max-w-lg items-end justify-center">
              <div className="absolute inset-x-2 bottom-0 h-[86%] rounded-[40px] bg-gradient-to-tr from-violet-100/90 via-amber-100/70 to-transparent border border-violet-100" />
              <img
                src={assetUrl("/assets/profil-peneliti.png")}
                alt="Peneliti dan Pengabdi LPPM UNUSU"
                className="relative z-10 block w-full max-w-[480px] sm:max-w-[500px] h-auto object-contain drop-shadow-[0_25px_50px_rgba(109,40,217,0.22)] transition-transform duration-300 hover:scale-[1.02]"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. TIGA PILAR UTAMA LAYANAN */}
      <section id="layanan" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-violet-700 bg-violet-50 border border-violet-200 px-3 py-1 rounded-full">
            Infrastruktur Riset & Pengabdian
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-950 tracking-normal">
            Pilar Layanan Riset LPPM UNUSU
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Menyediakan ekosistem pendukung riset yang transparan, akuntabel, dan berorientasi pada kemanfaatan masyarakat luas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Pangkalan Penelitian */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-8 space-y-5 hover:border-violet-400 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center border border-violet-100">
                <DocumentTextIcon className="w-8 h-8 text-violet-700" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Pangkalan Penelitian Dosen</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Pencatatan usulan hibah, reviu proposal, monitoring kemajuan riset (Monev), serta pelaporan akhir dana penelitian internal & eksternal.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-violet-700">
              <span>Dana Hibah Bersaing</span>
              <span className="text-amber-600 font-bold">Terdokumentasi</span>
            </div>
          </div>

          {/* Card 2: Pengabdian Masyarakat */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-8 space-y-5 hover:border-amber-400 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-100">
                <HeartIcon className="w-8 h-8 text-amber-800" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Pengabdian Kepada Masyarakat (PKM)</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Pemberdayaan mitra desa binaan, pesantren, UMKM, dan komunitas melalui transfer ilmu pengetahuan dan teknologi terapan berbasis Aswaja.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-800">
              <span>Mitra Komunitas Binaan</span>
              <span className="text-violet-700 font-bold">Berdaya Saing</span>
            </div>
          </div>

          {/* Card 3: Publikasi & HKI */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-8 space-y-5 hover:border-violet-400 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-700 text-white flex items-center justify-center shadow-xs">
                <BookOpenIcon className="w-8 h-8 text-amber-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Publikasi Ilmiah & HKI</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Pengelolaan repositori artikel jurnal terindeks SINTA/Scopus, prosiding seminar nasional, paten sederhana, dan sertifikat Hak Cipta dosen.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-violet-700">
              <span>SINTA, Scopus & HKI</span>
              <span className="text-amber-600 font-bold">Terverifikasi</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SKEMA HIBAH & PENDANAAN */}
      <section id="skema" className="bg-[#F6F3F9] py-20 border-y border-violet-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-violet-800 bg-white border border-violet-200 px-3 py-1 rounded-full shadow-2xs">
              Skema Penelitian & Hibah
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-950 tracking-normal">
              Kategori Pendanaan & Target Luaran
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Fasilitasi hibah bertingkat untuk mengakomodasi seluruh jenjang fungsional dosen di lingkungan UNUSU.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {skemaPenelitian.map((skema) => (
              <div
                key={skema.kode}
                className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4 hover:border-violet-600 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-violet-700 text-amber-400 font-mono font-bold text-base flex items-center justify-center">
                    {skema.kode}
                  </div>
                  <h4 className="font-bold text-base text-slate-900">{skema.nama}</h4>
                  <div className="text-xs text-slate-500 space-y-1">
                    <div>
                      <span className="text-slate-400">Sasaran: </span>
                      <strong className="text-slate-700">{skema.target}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Target Luaran: </span>
                      <strong className="text-violet-700">{skema.luaran}</strong>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <span className="inline-block text-[10px] font-semibold text-violet-800 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
                    {skema.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. STATISTIK KINERJA LPPM */}
      <section id="statistik" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-violet-950 via-purple-900 to-slate-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/10 text-amber-300 px-3 py-1 rounded-full border border-white/20">
              Kinerja Tridharma
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Capaian Produktivitas Riset Dosen
            </h2>
            <p className="text-xs sm:text-sm text-violet-100 leading-relaxed font-normal">
              Indikator kinerja utama dalam memperkuat daya saing akademik UNUSU di tingkat regional dan nasional.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {statistikLppm.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-2 backdrop-blur-xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center mx-auto">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">{stat.angka}</div>
                  <p className="text-xs text-violet-100 font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. ALUR TAHAPAN PENGAJUAN */}
      <section id="alur" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-violet-700 bg-violet-50 border border-violet-200 px-3 py-1 rounded-full">
            Alur Operasional
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-950 tracking-normal">
            Siklus Hibah & Publikasi Mandiri
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Tahapan transparan dari penerimaan proposal hingga seminar hasil riset.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <span className="w-8 h-8 rounded-xl bg-violet-700 text-white flex items-center justify-center font-bold text-xs">
              01
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Penerimaan Proposal</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dosen mengajukan proposal penelitian atau PKM secara digital melalui akun ONE UNUSU.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <span className="w-8 h-8 rounded-xl bg-violet-700 text-white flex items-center justify-center font-bold text-xs">
              02
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Desk Evaluation & Reviu</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tim reviewer independen menilai kelayakan metodologi, kebaruan topik, dan alokasi anggaran (RAB).
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <span className="w-8 h-8 rounded-xl bg-violet-700 text-white flex items-center justify-center font-bold text-xs">
              03
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Kontrak & Monev Lapangan</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Penetapan pemenang hibah, penandatanganan kontrak kerja riset, serta monitoring kemajuan berkala.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <span className="w-8 h-8 rounded-xl bg-violet-700 text-white flex items-center justify-center font-bold text-xs">
              04
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Seminar Hasil & Luaran</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pelaporan pertanggungjawaban dana, diseminasi temuan pada seminar, serta penyerahan bukti publikasi/HKI.
            </p>
          </div>
        </div>
      </section>

      {/* 8. FOOTER RESMI KAMPUS */}
      <footer className="bg-slate-950 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-violet-700 text-white flex items-center justify-center font-bold">
                  <AcademicCapIcon className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <span className="font-bold text-lg">LPPM UNUSU</span>
                  <p className="text-[11px] text-slate-400">Lembaga Penelitian & Pengabdian kepada Masyarakat</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                Jl. Gaperta Ujung No. 1, Medan Helvetia, Kota Medan, Sumatera Utara. Mengabdi untuk riset inovatif dan kemajuan peradaban bangsa.
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400">Tautan Satelit</h5>
              <ul className="text-xs text-slate-400 space-y-2">
                <li>
                  <a href="http://localhost:5173" className="hover:text-violet-400 transition-colors">
                    Portal ONE UNUSU
                  </a>
                </li>
                <li>
                  <a href="http://localhost:5177" className="hover:text-violet-400 transition-colors">
                    LPM Mutu Akademik
                  </a>
                </li>
                <li>
                  <a href="http://localhost:3001" className="hover:text-violet-400 transition-colors">
                    LMS Pembelajaran Daring
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400">Gerbang Peneliti</h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                Kelola luaran Tridharma Perguruan Tinggi dengan autentikasi SSO kampus.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-white text-xs font-bold transition-all"
                >
                  <span>Masuk</span>
                  <ArrowRightIcon className="w-3.5 h-3.5 text-amber-400" />
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>&copy; {new Date().getFullYear()} LPPM Universitas Nahdlatul Ulama Sumatera Utara. Hak Cipta Dilindungi.</p>
            <p className="text-[11px] font-mono text-violet-400">Sistem Informasi Riset & PKM Terintegrasi</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
