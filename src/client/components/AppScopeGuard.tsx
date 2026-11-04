import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AksesDitolakPage } from '../pages/AksesDitolak';
import { evaluatePanelAccess } from '../lib/appAccess';

interface AppScopeGuardProps {
  children: React.ReactNode;
}

/**
 * Penjaga panel LPPM (defense-in-depth di sisi klien).
 *
 * Server sudah menolak penukaran token SSO milik admin aplikasi lain, tetapi
 * sesi lama di localStorage dapat bertahan (mis. pengguna yang perannya baru
 * diubah). Guard ini memastikan panel LPPM tidak pernah dirender untuk:
 *  - admin LPM / E-Surat / Sarpras / Akreditasi / LMS (aplikasi lain),
 *  - peran yang tidak terdaftar pada LPPM,
 *  - sesi tanpa token yang sah.
 */
export function AppScopeGuard({ children }: AppScopeGuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-12 text-center"
        role="status"
        aria-live="polite"
      >
        <p className="text-slate-600 font-semibold text-sm">Memverifikasi hak akses panel LPPM...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const decision = evaluatePanelAccess(user);
  if (!decision.allowed) {
    return <AksesDitolakPage />;
  }

  return <>{children}</>;
}

export default AppScopeGuard;
