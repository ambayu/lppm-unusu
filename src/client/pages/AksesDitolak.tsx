import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShieldExclamationIcon,
  ArrowLeftIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import {
  APP_NAME,
  APP_FULL_NAME,
  evaluatePanelAccess,
  foreignAppForRole,
  labelForSsoRole,
} from '../lib/appAccess';

/**
 * Halaman 403 khusus ekosistem ONE UNUSU.
 *
 * Dipakai ketika pengguna terautentikasi tetapi TIDAK berhak masuk panel LPPM
 * (mis. admin LPM). Menjelaskan alasan penolakan secara eksplisit — bukan
 * membuang pengguna diam-diam ke halaman lain.
 */
export function AksesDitolakPage() {
  const [params] = useSearchParams();
  const { user, logout } = useAuth();

  const decision = evaluatePanelAccess(user);
  const reason = (params.get('reason') as ReturnType<typeof evaluatePanelAccess>['code']) || decision.code;
  const roleFromQuery = params.get('role');
  const fromPath = params.get('from');

  const effectiveRole = roleFromQuery || user?.ssoRole || null;
  const foreignApp = foreignAppForRole(effectiveRole) || decision.foreignApp || params.get('app');

  const title =
    reason === 'foreign-app' && foreignApp
      ? `Akun ${labelForSsoRole(effectiveRole)} tidak dapat masuk panel LPPM`
      : decision.title || 'Akses panel LPPM ditolak';

  const message =
    reason === 'foreign-app' && foreignApp
      ? `Peran Anda terdaftar sebagai administrator ${foreignApp}. Setiap aplikasi pada ekosistem ONE UNUSU memiliki panel terpisah, sehingga akun ${foreignApp} tidak diizinkan membuka ${APP_NAME}.`
      : decision.message ||
        'Akun Anda tidak memiliki izin untuk membuka panel manajemen LPPM UNUSU.';

  return (
    <div className="min-h-screen w-full bg-[#F1F5F9] flex items-center justify-center p-5 sm:p-8">
      <div className="w-full max-w-2xl bg-white border border-[#CBD5E1] rounded-2xl shadow-sm overflow-hidden">
        {/* Header kontainer */}
        <div className="px-6 sm:px-8 pt-7 pb-6 border-b border-[#E2E8F0] flex items-start gap-4">
          <div className="w-12 h-12 flex-shrink-0 rounded-[14px] bg-rose-50 border border-rose-200 flex items-center justify-center">
            <ShieldExclamationIcon className="w-6 h-6 text-rose-700" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-700">
              Error 403 · Akses Ditolak
            </p>
            <h1 className="mt-1 text-lg sm:text-xl font-bold text-slate-900 leading-snug">{title}</h1>
            <p className="mt-0.5 text-[11px] font-semibold text-violet-700">
              {APP_NAME} — {APP_FULL_NAME}
            </p>
          </div>
        </div>

        {/* Isi penjelasan */}
        <div className="px-6 sm:px-8 py-6 space-y-5">
          <p className="text-sm text-slate-700 leading-relaxed">{message}</p>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Peran Anda</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900 truncate">
                {effectiveRole ? labelForSsoRole(effectiveRole) : 'Tidak diketahui'}
              </dd>
            </div>
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Panel ini</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">LPPM UNUSU</dd>
            </div>
            {foreignApp && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:col-span-2">
                <dt className="text-[10px] font-bold uppercase tracking-widest text-amber-800">
                  Panel yang sesuai untuk akun Anda
                </dt>
                <dd className="mt-1 text-sm font-bold text-amber-900">{foreignApp}</dd>
              </div>
            )}
            {fromPath && (
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 sm:col-span-2">
                <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Halaman yang diminta
                </dt>
                <dd className="mt-1 text-xs font-mono text-slate-700 break-all">{fromPath}</dd>
              </div>
            )}
          </dl>

          <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 flex items-start gap-3">
            <KeyIcon className="w-4 h-4 text-violet-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-violet-900 leading-relaxed">
              Pemisahan admin per aplikasi diberlakukan di server dan klien. Bila Anda memang memerlukan akses
              LPPM, ajukan perubahan peran ke admin ONE UNUSU — bukan dengan berpindah akun aplikasi lain.
            </p>
          </div>
        </div>

        {/* Aksi */}
        <div className="px-6 sm:px-8 py-5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-violet-700 text-white text-sm font-semibold hover:bg-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 transition-colors"
          >
            <HomeIcon className="w-4 h-4" aria-hidden="true" />
            <span>Kembali ke Beranda LPPM</span>
          </Link>

          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-white text-slate-700 text-sm font-semibold border border-[#CBD5E1] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" aria-hidden="true" />
            <span>Masuk dengan akun LPPM</span>
          </Link>

          {user && (
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-white text-rose-700 text-sm font-semibold border border-rose-200 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 transition-colors sm:ml-auto"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" aria-hidden="true" />
              <span>Keluar Akun</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AksesDitolakPage;
