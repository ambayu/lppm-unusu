import React from 'react';
import { Link } from 'react-router-dom';
import { AcademicCapIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { ONE_UNUSU_URL } from '../lib/ssoConfig';

const SATELLITE_URLS = {
  lpm: import.meta.env.VITE_LPM_URL || 'https://unusu.bpp-developer.com/lpm',
  esurat: import.meta.env.VITE_ESURAT_URL || 'https://unusu.bpp-developer.com/esurat',
  lms: import.meta.env.VITE_LMS_URL || 'https://unusu.bpp-developer.com/lms',
};

export const PublicFooter: React.FC = () => (
  <footer className="relative overflow-hidden bg-slate-950 text-white border-t border-slate-800">
    {/* Aksen garis gradien tipis di batas atas */}
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"
    />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-violet-700 text-white flex items-center justify-center font-bold shadow-md shadow-violet-900/30">
              <AcademicCapIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-white">LPPM UNUSU</span>
              <p className="text-[11px] text-slate-400">Lembaga Penelitian &amp; Pengabdian kepada Masyarakat</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 max-w-md leading-relaxed">
            Jl. Gaperta Ujung No. 1, Medan Helvetia, Kota Medan, Sumatera Utara.
          </p>
        </div>

        <div className="space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-white">Tautan Satelit</h5>
          <ul className="text-xs text-slate-300 space-y-1">
            <li>
              <a href={ONE_UNUSU_URL} className="inline-flex items-center min-h-[36px] hover:text-violet-400 transition-colors">
                Portal ONE UNUSU
              </a>
            </li>
            <li>
              <a href={SATELLITE_URLS.lpm} className="inline-flex items-center min-h-[36px] hover:text-violet-400 transition-colors">
                LPM Penjaminan Mutu
              </a>
            </li>
            <li>
              <a href={SATELLITE_URLS.esurat} className="inline-flex items-center min-h-[36px] hover:text-violet-400 transition-colors">
                E-Surat &amp; Tata Naskah
              </a>
            </li>
            <li>
              <a href={SATELLITE_URLS.lms} className="inline-flex items-center min-h-[36px] hover:text-violet-400 transition-colors">
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-white text-xs font-bold transition-all shadow-xs"
            >
              <span>Masuk</span>
              <ArrowRightIcon className="w-3.5 h-3.5 text-white" />
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>&copy; {new Date().getFullYear()} LPPM Universitas Nahdlatul Ulama Sumatera Utara. Hak Cipta Dilindungi.</p>
        <p className="text-[11px] text-violet-400">Sistem Informasi Riset &amp; PKM Terintegrasi</p>
      </div>
    </div>
  </footer>
);

export default PublicFooter;
