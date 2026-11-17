import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AcademicCapIcon,
  BeakerIcon,
  BookOpenIcon,
  HeartIcon,
  ClipboardDocumentCheckIcon,
  HomeIcon,
  ArrowTopRightOnSquareIcon,
  ArrowRightOnRectangleIcon,
  ArrowRightIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

interface NavLinkItem {
  to: string;
  label: string;
  icon: React.ElementType;
  match: (pathname: string) => boolean;
}

/**
 * Menu navbar publik LPPM.
 *
 * Prinsip: navbar yang tampil di halaman publik hanya memuat tujuan publik
 * (halaman publik). Tidak ada tombol/menu "Panel Pengelola" di navbar.
 * Satu-satunya jalan masuk panel dari halaman publik adalah identity chip
 * akun, dan itu HANYA bisa diklik oleh Super Administrator ONE UNUSU.
 */

/** True hanya untuk Super Administrator / SUPERADMIN ONE UNUSU. */
const isSuperAdministrator = (user: { role?: string; ssoRole?: string } | null) => {
  if (!user) return false;
  const peran = (user.ssoRole || user.role || '').toUpperCase().replace(/[\s_]/g, '');
  return peran === 'SUPERADMIN';
};

/**
 * Rute panel LPPM: sidebar + topbar sudah disediakan `SidebarLayout`,
 * sehingga navbar publik harus disembunyikan agar tidak tampil ganda.
 */
const PANEL_PREFIXES = [
  '/dashboard',
  '/penelitian',
  '/pengabdian',
  '/publikasi',
  '/monev-kategori',
  '/monev-soal',
  '/monev-responden',
  '/monev-survei',
  '/monev',
  '/pengguna',
  '/peran',
  '/izin',
  '/admin',
  '/login',
  '/sso',
  '/akses-ditolak',
];

export const isPanelPath = (pathname: string) => {
  // Hanya rute rekap yang berada di dalam panel admin dari /monev-survei
  if (pathname.startsWith('/monev-survei/') && pathname.endsWith('/rekap')) {
    return true;
  }
  return PANEL_PREFIXES.filter((p) => p !== '/monev-survei').some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
};

/**
 * Navbar publik LPPM UNUSU.
 * Struktur baku ONE UNUSU: brand (logo + nama + subteks) di kiri,
 * menu di tengah, aksi akun di kanan.
 */
export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { setMobileOpen(false); }, [location.pathname, location.hash]);

  // Panel manajemen punya topbar sendiri; navbar publik disembunyikan.
  if (isPanelPath(location.pathname)) {
    return null;
  }

  /**
   * Layanan/informasi mengarah ke seksi beranda. Tidak ada tombol panel di navbar; hanya chip
   * identitas Super Administrator yang dapat diklik menuju panel.
   */
  const superAdmin = isSuperAdministrator(user);

  const links: NavLinkItem[] = [
    { to: '/', label: 'Beranda', icon: HomeIcon, match: (p) => p === '/' && !location.hash },
    {
      to: '/monev-survei',
      label: 'Monev',
      icon: ClipboardDocumentCheckIcon,
      match: (p) => p.startsWith('/monev-survei'),
    },
    {
      to: '/#layanan',
      label: 'Layanan',
      icon: BeakerIcon,
      match: (p) => p === '/' && location.hash === '#layanan',
    },
    {
      to: '/#skema',
      label: 'Skema Hibah',
      icon: BookOpenIcon,
      match: (p) => p === '/' && location.hash === '#skema',
    },
    {
      to: '/#statistik',
      label: 'Kinerja',
      icon: ClipboardDocumentCheckIcon,
      match: (p) => p === '/' && location.hash === '#statistik',
    },
    {
      to: '/#alur',
      label: 'Alur Pengajuan',
      icon: HeartIcon,
      match: (p) => p === '/' && location.hash === '#alur',
    },
  ];

  const linkClass = (active: boolean) =>
    `inline-flex whitespace-nowrap items-center gap-1.5 rounded-[8px] px-3 py-2 min-h-[44px] text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 ${
      active
        ? 'text-violet-900 bg-[#EDE8F5]'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#CBD5E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
          {/* KIRI: Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="LPPM UNUSU, Beranda">
            <div className="w-9 h-9 rounded-[10px] bg-violet-900 flex items-center justify-center">
              <AcademicCapIcon className="w-[18px] h-[18px] text-white" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <div className="flex items-baseline gap-1">
                <span className="font-extrabold text-[15px] tracking-tight text-slate-900">LPPM</span>
                <span className="font-extrabold text-[15px] tracking-tight text-violet-900">UNUSU</span>
              </div>
              <p className="hidden sm:block text-[10px] font-medium text-slate-500">
                Riset &amp; Pengabdian Masyarakat
              </p>
            </div>
          </Link>

          {/* TENGAH: Menu desktop */}
          <nav className="hidden xl:flex items-center gap-1" aria-label="Navigasi utama">
            {links.slice(0, 3).map((item) => {
              const active = item.match(location.pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? 'page' : undefined}
                  className={linkClass(active)}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <details className="relative" onKeyDown={(event) => {
              if (event.key === 'Escape') event.currentTarget.open = false;
            }}>
              <summary className={`${linkClass(links.slice(3).some((item) => item.match(location.pathname)))} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
                Informasi <ChevronDownIcon className="w-4 h-4" aria-hidden="true" />
              </summary>
              <div className="absolute top-full right-0 mt-2 min-w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                {links.slice(3).map((item) => <Link key={item.to} to={item.to} className={`${linkClass(item.match(location.pathname))} w-full`} aria-current={item.match(location.pathname) ? 'page' : undefined} onClick={(event) => { event.currentTarget.closest('details')?.removeAttribute('open'); }}>{item.label}</Link>)}
              </div>
            </details>
          </nav>

          {/* KANAN: Aksi */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Identitas pengguna: chip tanpa border; saat hover hanya bayangan
                 *  tipis di kiri & kanan sebagai penanda area.
                 *  - Super Administrator ONE UNUSU: chip BISA diklik menuju panel.
                 *  - Peran lain: chip non-interaktif, tidak pernah masuk panel.
                 *  Navbar publik tetap tidak memuat tombol "Panel Pengelola". */}
                {superAdmin ? (
                  <Link
                    to="/dashboard"
                    aria-label="Buka panel pengelola LPPM"
                    title="Buka panel pengelola LPPM"
                    className="group hidden lg:inline-flex items-center gap-2 h-[44px] px-3 text-slate-700 transition-all hover:text-violet-900 hover:shadow-[inset_2px_0_0_0_#CBD5E1,inset_-2px_0_0_0_#CBD5E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-violet-900 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {user.nama?.charAt(0) || 'P'}
                    </div>
                    <div className="hidden 2xl:flex flex-col leading-tight min-w-0 text-left">
                      <span className="text-xs font-bold text-slate-800 max-w-[140px] truncate">
                        {user.nama}
                      </span>
                      <span className="text-[10px] font-semibold uppercase text-violet-900">
                        {user.ssoRole || user.role}
                      </span>
                    </div>
                  </Link>
                ) : (
                  <div title={user.nama} aria-label={`Akun ${user.nama}`} className="hidden lg:inline-flex items-center gap-2 h-[44px] px-3 text-slate-700">
                    <div className="w-8 h-8 rounded-full bg-violet-900 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                      {user.nama?.charAt(0) || 'P'}
                    </div>
                    <div className="hidden 2xl:flex flex-col leading-tight min-w-0 text-left">
                      <span className="text-xs font-bold text-slate-800 max-w-[140px] truncate">
                        {user.nama}
                      </span>
                      <span className="text-[10px] font-semibold uppercase text-violet-900">
                        {user.ssoRole || user.role}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={logout}
                  aria-label="Keluar dari akun"
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-3 rounded-[8px] text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                >
                  <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden 2xl:inline">Keluar</span>
                </button>
              </>
            ) : (
              <>
                <a
                  href="https://unusu.ac.id"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hidden 2xl:inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-[8px] text-xs font-semibold text-slate-600 hover:text-violet-900 hover:bg-[#EDE8F5] transition-colors"
                >
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Website Kampus</span>
                </a>
                <Link
                  to="/login"
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-4 rounded-[8px] text-xs font-bold bg-violet-700 hover:bg-violet-800 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-950"
                >
                  <ArrowRightIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Masuk<span className="hidden sm:inline"> SSO</span></span>
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={mobileOpen}
              aria-controls="navigasi-publik-mobile"
              className="xl:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-[8px] border border-[#CBD5E1] text-slate-600"
            >
              {mobileOpen ? (
                <XMarkIcon className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Bars3Icon className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MENU MOBILE */}
      {mobileOpen && (
        <nav id="navigasi-publik-mobile" aria-label="Navigasi utama mobile" className="xl:hidden border-t border-[#CBD5E1] bg-white px-4 py-3 space-y-1">
          {links.map((item) => {
            const active = item.match(location.pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 min-h-[44px] px-3 rounded-[8px] text-sm font-semibold ${
                  active ? 'bg-[#EDE8F5] text-violet-900' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <a
            href="https://unusu.ac.id"
            target="_blank"
            rel="noreferrer noopener"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 min-h-[44px] px-3 rounded-[8px] text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <ArrowTopRightOnSquareIcon className="w-4 h-4" aria-hidden="true" />
            <span>Website Kampus</span>
          </a>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
