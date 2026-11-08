import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { QuestionMarkCircleIcon, HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { APP_NAME, APP_FULL_NAME } from '../lib/appAccess';

/**
 * Halaman 404 — alamat tidak dikenal.
 *
 * Dulu rute tak dikenal dialihkan diam-diam ke "/", sehingga pengguna yang
 * salah mengetik URL atau membuka tautan lama mengira aplikasinya rusak.
 * Halaman ini menyebutkan alamat yang diminta agar mudah dilaporkan.
 */
export function HalamanTidakDitemukan() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[#F1F5F9] flex items-center justify-center p-5 sm:p-8">
      <div className="w-full max-w-2xl bg-white border border-[#CBD5E1] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 sm:px-8 pt-7 pb-6 border-b border-[#E2E8F0] flex items-start gap-4">
          <div className="w-12 h-12 flex-shrink-0 rounded-[14px] bg-amber-50 border border-amber-200 flex items-center justify-center">
            <QuestionMarkCircleIcon className="w-6 h-6 text-amber-700" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
              Error 404 · Halaman Tidak Ditemukan
            </p>
            <h1 className="mt-1 text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              Alamat ini tidak tersedia
            </h1>
            <p className="mt-0.5 text-[11px] font-semibold text-violet-700">
              {APP_NAME} — {APP_FULL_NAME}
            </p>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-6 space-y-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            Halaman yang Anda tuju tidak ada pada panel {APP_NAME}. Kemungkinan tautannya sudah berubah,
            menu telah dipindahkan, atau ada salah ketik.
          </p>

          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Alamat yang diminta
            </p>
            <p className="mt-1 text-xs font-mono text-slate-700 break-all">{location.pathname}</p>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-violet-700 text-white text-sm font-semibold hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 transition-colors"
          >
            <HomeIcon className="w-4 h-4" aria-hidden="true" />
            <span>Ke Dashboard LPPM</span>
          </Link>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-white text-slate-700 text-sm font-semibold border border-[#CBD5E1] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" aria-hidden="true" />
            <span>Kembali</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default HalamanTidakDitemukan;
