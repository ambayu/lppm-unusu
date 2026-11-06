import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/Landing';
import { DashboardPage } from './pages/Dashboard';
import { PenelitianPage } from './pages/Penelitian';
import { PenelitianFormPage } from './pages/PenelitianForm';
import { PengabdianPage } from './pages/Pengabdian';
import { PengabdianFormPage } from './pages/PengabdianForm';
import { PublikasiPage } from './pages/Publikasi';
import { PublikasiFormPage } from './pages/PublikasiForm';
import { PenggunaPage } from './pages/Pengguna';
import { PenggunaDetailPage } from './pages/PenggunaDetail';
import { PeranPage } from './pages/Peran';
import { PeranFormPage } from './pages/PeranForm';
import { IzinFormPage } from './pages/IzinForm';
import { IzinPage } from './pages/Izin';
import { MonevPage } from './pages/Monev';
import { MonevFormPage } from './pages/MonevForm';
import { ProfilPage } from './pages/Profil';
import { LoginPage } from './pages/Login';
import { SsoCallbackPage } from './pages/SsoCallback';
import { AksesDitolakPage } from './pages/AksesDitolak';
import { SidebarLayout } from './components/SidebarLayout';
import { AppScopeGuard } from './components/AppScopeGuard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { evaluatePanelAccess } from './lib/appAccess';

/**
 * Rute panel LPPM. Menolak sesi yang bukan milik aplikasi ini (mis. admin LPM)
 * dengan halaman 403 yang menjelaskan alasan penolakan.
 */
function ProtectedRoute({ children }: { children: React.ReactElement }) {
  return <AppScopeGuard>{children}</AppScopeGuard>;
}

/** Pintu masuk /admin — arahkan sesuai peran, tolak peran aplikasi lain. */
function AdminEntryRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-12 text-center text-slate-500 font-semibold text-sm">
        Memverifikasi sesi pengguna...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!evaluatePanelAccess(user).allowed) {
    return <AksesDitolakPage />;
  }
  return <Navigate to="/dashboard" replace />;
}

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

/**
 * Rute khusus Admin LPPM (Pengguna, Peran, Izin). Dosen peneliti yang mengetik
 * URL langsung dikembalikan ke pangkalan data penelitian, bukan melihat menu
 * manajemen sistem.
 */
function AdminOnlyRoute({ children }: { children: React.ReactElement }) {
  const { user, loading, canManageSystem } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-12 text-center text-slate-500 font-semibold text-sm">
        Memeriksa hak administrasi...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!canManageSystem) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export function App() {
  const currentPath = window.location.pathname;
  const isBaseSubpath = BASE_PATH && currentPath.startsWith(BASE_PATH);
  const routerBasename = isBaseSubpath ? BASE_PATH : '';

  return (
    <AuthProvider>
      <Router basename={routerBasename}>
        <div className="min-h-screen flex flex-col bg-[#F1F5F9] text-slate-900 font-sans">
          <Routes>
            {/* Landing page publik tanpa sidebar (tidak ada redirect default ke /admin) */}
            <Route path="/" element={<LandingPage />} />

            {/* SSO & Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sso/callback" element={<SsoCallbackPage />} />

            {/* Halaman 403 — penolakan akses lintas aplikasi (mis. admin LPM) */}
            <Route path="/akses-ditolak" element={<AksesDitolakPage />} />

            {/* Rute /admin: hanya untuk sesi ber-cakupan LPPM, lalu ke /dashboard */}
            <Route path="/admin" element={<AdminEntryRoute />} />

            {/* 0. Dashboard — laporan ringkas tiap menu panel */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <DashboardPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />

            {/* Profil Pengguna */}
            <Route
              path="/profil"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <ProfilPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />

            {/* Panel Manajemen Admin Ber-Sidebar (Standar LPM UNUSU) */}
            {/* 1. Penelitian Dosen */}
            <Route
              path="/penelitian"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <PenelitianPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/penelitian/tambah"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <PenelitianFormPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/penelitian/edit/:id"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <PenelitianFormPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />

            {/* 2. Pengabdian (PKM) */}
            <Route
              path="/pengabdian"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <PengabdianPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pengabdian/tambah"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <PengabdianFormPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pengabdian/edit/:id"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <PengabdianFormPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />

            {/* 3. Publikasi & Jurnal */}
            <Route
              path="/publikasi"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <PublikasiPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/publikasi/tambah"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <PublikasiFormPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/publikasi/edit/:id"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <PublikasiFormPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />

            {/* 4. Manajemen Pengguna — khusus Admin LPPM */}
            <Route
              path="/pengguna"
              element={
                <ProtectedRoute>
                  <AdminOnlyRoute>
                    <SidebarLayout>
                      <PenggunaPage />
                    </SidebarLayout>
                  </AdminOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pengguna/:id"
              element={
                <ProtectedRoute>
                  <AdminOnlyRoute>
                    <SidebarLayout>
                      <PenggunaDetailPage />
                    </SidebarLayout>
                  </AdminOnlyRoute>
                </ProtectedRoute>
              }
            />

            {/* 5. Manajemen Peran & Hak Akses — khusus Admin LPPM */}
            <Route
              path="/peran"
              element={
                <ProtectedRoute>
                  <AdminOnlyRoute>
                    <SidebarLayout>
                      <PeranPage />
                    </SidebarLayout>
                  </AdminOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/peran/tambah"
              element={
                <ProtectedRoute>
                  <AdminOnlyRoute>
                    <SidebarLayout>
                      <PeranFormPage />
                    </SidebarLayout>
                  </AdminOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/peran/edit/:id"
              element={
                <ProtectedRoute>
                  <AdminOnlyRoute>
                    <SidebarLayout>
                      <PeranFormPage />
                    </SidebarLayout>
                  </AdminOnlyRoute>
                </ProtectedRoute>
              }
            />

            {/* 6. Katalog Hak Izin (Permissions) — khusus Admin LPPM */}
            <Route
              path="/izin"
              element={
                <ProtectedRoute>
                  <AdminOnlyRoute>
                    <SidebarLayout>
                      <IzinPage />
                    </SidebarLayout>
                  </AdminOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/izin/tambah"
              element={
                <ProtectedRoute>
                  <AdminOnlyRoute>
                    <SidebarLayout>
                      <IzinFormPage />
                    </SidebarLayout>
                  </AdminOnlyRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/izin/edit/:id"
              element={
                <ProtectedRoute>
                  <AdminOnlyRoute>
                    <SidebarLayout>
                      <IzinFormPage />
                    </SidebarLayout>
                  </AdminOnlyRoute>
                </ProtectedRoute>
              }
            />

            {/* 7. Monitoring & Evaluasi (Monev) (Full Pages CRUD) */}
            <Route
              path="/monev"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <MonevPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/monev/tambah"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <MonevFormPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/monev/edit/:id"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <MonevFormPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
