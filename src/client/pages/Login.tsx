import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { AnimatedFlatSsoLogo } from '../components/AnimatedFlatSsoLogo';
import { assetUrl } from '../lib/assets';

const ONE_UNUSU_URL = import.meta.env.VITE_ONE_UNUSU_URL || 'http://localhost:5173';
const SSO_CLIENT_ID = import.meta.env.VITE_SSO_CLIENT_ID || 'lppm-unusu';

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
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-violet-50 text-violet-900 border border-violet-200">
              <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
              <span>Penelitian & Pengabdian Masyarakat</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Masuk ke <span className="text-violet-700">LPPM UNUSU</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal">
              Akses manajemen proposal riset, luaran penelitian, dan program pengabdian masyarakat melalui gerbang SSO terpadu.
            </p>
          </div>

          {/* Logo ONE UNUSU — Bisa Ditekan, Mengarah ke ONE UNUSU */}
          <div className="flex flex-col items-center space-y-3">
            <AnimatedFlatSsoLogo
              size={210}
              onClick={() => { window.location.href = ONE_UNUSU_URL; }}
            />
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center space-x-1.5">
                <span className="font-black text-xl text-slate-950 tracking-tight">ONE</span>
                <span className="font-black text-xl text-emerald-800 tracking-tight">UNUSU</span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold">
                Ekosistem Digital Terpadu Kampus
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                Universitas Nahdlatul Ulama Sumatera Utara
              </p>
            </div>
          </div>

          {/* Tombol Masuk */}
          <button
            type="button"
            onClick={handleSsoLogin}
            className="w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-2xl bg-violet-700 hover:bg-violet-800 text-white font-black text-sm shadow-xl hover:shadow-2xl transition-all transform active:scale-98 cursor-pointer group"
          >
            <span>Masuk dengan ONE UNUSU</span>
            <ArrowRightIcon className="w-4 h-4 text-amber-400 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-500 text-center sm:text-left">
          &copy; {new Date().getFullYear()} LPPM UNUSU — Universitas Nahdlatul Ulama Sumatera Utara
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
