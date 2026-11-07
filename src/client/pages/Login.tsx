import React from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldExclamationIcon,
  ArrowTopRightOnSquareIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { AnimatedFlatSsoLogo } from '../components/AnimatedFlatSsoLogo';
import { assetUrl } from '../lib/assets';

const ONE_UNUSU_URL = import.meta.env.VITE_ONE_UNUSU_URL || 'http://localhost:5173';
const SSO_CLIENT_ID = import.meta.env.VITE_SSO_CLIENT_ID || 'lppm-unusu';
/** Panel LPM UNUSU — aplikasi cabang terpisah (admin LPM tidak dapat masuk LPPM). */
const LPM_PANEL_URL = import.meta.env.VITE_LPM_URL || 'http://localhost:5177';

export function LoginPage() {
  const handleSsoLogin = () => {
    const target = `${ONE_UNUSU_URL}/authorize?client_id=${encodeURIComponent(SSO_CLIENT_ID)}`;
    window.location.href = target;
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white relative selection:bg-amber-400 selection:text-slate-950">
      {/* ===== SISI KIRI: FORM LOGIN SSO ===== */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-16 xl:p-20 z-10">
        {/* Nav Kembali */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-violet-900 transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Konten Tengah */}
        <div className="max-w-md w-full mx-auto my-auto py-6 space-y-7 text-center sm:text-left">
          {/* Header */}
          <div className="space-y-2">
            <p className="inline-block border-l-2 border-[#166534] pl-3 text-xs font-semibold uppercase tracking-wider text-[#166534]">
              Penelitian &amp; Pengabdian Masyarakat
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold text-slate-950 tracking-normal">
              Masuk ke <span className="text-[#166534]">LPPM UNUSU</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
              Akses manajemen proposal riset, luaran penelitian, dan program pengabdian masyarakat melalui gerbang SSO terpadu.
            </p>
          </div>

          {/* Logo ONE UNUSU — Tetap Hijau UNUSU, Bisa Diklik */}
          <div className="flex flex-col items-center space-y-3">
            <AnimatedFlatSsoLogo
              size={210}
              onClick={handleSsoLogin}
            />
            <div className="text-center">
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">ONE <span className="text-[#166534]">UNUSU</span></span>
            </div>
          </div>

          {/* Tombol Masuk — Gaya Terpadu SSO */}
          <button
            type="button"
            onClick={handleSsoLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-full bg-[#166534] hover:bg-[#14532D] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all transform active:scale-98 cursor-pointer group"
            aria-label="Masuk dengan ONE UNUSU"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 text-white shrink-0" />
            <span className="font-bold">Masuk dengan ONE UNUSU</span>
            <ChevronRightIcon className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform shrink-0" />
          </button>

          {/* Wrapper Rapat: Divider 'atau' & Tautan Teks Hijau */}
          <div className="!mt-4 space-y-2">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative bg-white px-3 text-xs text-slate-400">
                atau
              </div>
            </div>

            {/* Tautan Teks Hijau Kunjungi Portal ONE UNUSU */}
            <div className="text-center pt-0.5">
              <a
                href={ONE_UNUSU_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#166534] hover:text-[#14532D] hover:underline transition-colors cursor-pointer"
              >
                <span>Kunjungi Website ONE UNUSU</span>
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>
          </div>

          {/* Footer terpusat */}
          <div className="text-xs text-slate-500 text-center font-normal pt-1">
            &copy; {new Date().getFullYear()} LPPM UNUSU &bull; Universitas Nahdlatul Ulama Sumatera Utara
          </div>
        </div>
      </div>

      {/* ===== SISI KANAN: WALLPAPER KAMPUS ===== */}
      <div className="w-full lg:w-1/2 relative flex flex-col justify-end p-8 sm:p-14 lg:p-16 overflow-hidden min-h-[420px] lg:min-h-screen text-white">
        <img
          src={assetUrl("/assets/campus-login.png")}
          alt="Gedung Kampus UNUSU Gaperta Medan"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.82]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-violet-950/95 via-violet-950/40 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-lg space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-900/80 border border-violet-400/40 text-violet-100 text-xs font-semibold backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Riset & Pengabdian Masyarakat</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md leading-tight">
            Pusat Penelitian & Inovasi UNUSU
          </h2>

          <p className="text-xs sm:text-sm text-slate-200 drop-shadow font-normal leading-relaxed">
            Platform terpadu untuk pengelolaan riset dosen, publikasi ilmiah, dan program pengabdian masyarakat berbasis kemitraan.
          </p>
        </div>
      </div>
    </div>
  );
}
