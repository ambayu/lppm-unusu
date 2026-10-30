import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Microscope, HeartHandshake, BookOpen, ExternalLink, GraduationCap } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-violet-700 flex items-center justify-center text-white shadow-sm ring-1 ring-violet-600">
              <Microscope className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-extrabold text-lg text-slate-900">LPPM</span>
                <span className="font-extrabold text-lg text-violet-700">UNUSU</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Penelitian & Pengabdian Masyarakat</p>
            </div>
          </Link>

          <nav className="flex items-center space-x-1 sm:space-x-3">
            <Link
              to="/penelitian"
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                location.pathname === '/penelitian' ? 'text-violet-700 bg-violet-50' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Penelitian Dosen
            </Link>
            <Link
              to="/pengabdian"
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                location.pathname === '/pengabdian' ? 'text-violet-700 bg-violet-50' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pengabdian (PKM)
            </Link>
            <Link
              to="/publikasi"
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                location.pathname === '/publikasi' ? 'text-violet-700 bg-violet-50' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Publikasi & Jurnal
            </Link>

            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-violet-700 hover:bg-slate-50 transition"
            >
              <span>ONE UNUSU</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};
