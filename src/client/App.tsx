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
import { PeranPage } from './pages/Peran';
import { PeranFormPage } from './pages/PeranForm';
import { IzinFormPage } from './pages/IzinForm';
import { IzinPage } from './pages/Izin';
import { PenggunaPage } from './pages/Pengguna';
import { PenggunaFormPage } from './pages/PenggunaForm';
import { MonevPage } from './pages/Monev';
import { MonevFormPage } from './pages/MonevForm';
import { ManajemenSliderLppm } from './pages/ManajemenSliderLppm';
import { ProfilPage } from './pages/Profil';
import { LoginPage } from './pages/Login';
import { SsoCallbackPage } from './pages/SsoCallback';
import { AksesDitolakPage } from './pages/AksesDitolak';
import { HalamanTidakDitemukan } from './pages/HalamanTidakDitemukan';
import { SidebarLayout } from './components/SidebarLayout';
import { AppScopeGuard } from './components/AppScopeGuard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { evaluatePanelAccess, IZIN_FITUR } from './lib/appAccess';

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
 * Rute yang dijaga IZIN, bukan nama peran.
 *
 * Pengguna yang mengetik URL langsung tanpa izin melihat halaman 403 yang
 * menjelaskan alasannya — bukan dialihkan diam-diam ke dashboard, yang membuat
 * pengguna mengira menunya "hilang" tanpa sebab.
 */
function IzinRoute({ children, izin }: { children: React.ReactElement; izin: string[] }) {
  const { user, loading, bisa, hasPanelAccess } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-12 text-center text-slate-500 font-semibold text-sm">
        Memeriksa izin akses...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!hasPanelAccess) {
    return <Navigate to="/akses-ditolak" replace />;
  }
  if (!bisa(...izin)) {
    return <Navigate to="/akses-ditolak?reason=izin" replace />;
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
                  <IzinRoute izin={[IZIN_FITUR.penelitianLihat]}>
                    <SidebarLayout>
                      <PenelitianPage />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/penelitian/tambah"
              element={
                <ProtectedRoute>
                  <IzinRoute izin={[IZIN_FITUR.penelitianBuat]}>
                    <SidebarLayout>
                      <PenelitianFormPage />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/penelitian/edit/:id"
              element={
                <ProtectedRoute>
                  <IzinRoute izin={[IZIN_FITUR.penelitianUbah]}>
                    <SidebarLayout>
                      <PenelitianFormPage />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />

            {/* 2. Pengabdian (PKM) */}
            <Route
              path="/pengabdian"
              element={
                <ProtectedRoute>
                  <IzinRoute izin={[IZIN_FITUR.pengabdianLihat]}>
                    <SidebarLayout>
                      <PengabdianPage />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pengabdian/tambah"
              element={
                <ProtectedRoute>
                  <IzinRoute izin={[IZIN_FITUR.pengabdianBuat]}>
                    <SidebarLayout>
                      <PengabdianFormPage />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pengabdian/edit/:id"
              element={
                <ProtectedRoute>
                  <IzinRoute izin={[IZIN_FITUR.pengabdianUbah]}>
                    <SidebarLayout>
                      <PengabdianFormPage />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />

            {/* 3. Publikasi & Jurnal */}
            <Route
              path="/publikasi"
              element={
                <ProtectedRoute>
                  <IzinRoute izin={[IZIN_FITUR.publikasiLihat]}>
                    <SidebarLayout>
                      <PublikasiPage />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/publikasi/tambah"
              element={
                <ProtectedRoute>
                  <IzinRoute izin={[IZIN_FITUR.publikasiBuat]}>
                    <SidebarLayout>
                      <PublikasiFormPage />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/publikasi/edit/:id"
              element={
                <ProtectedRoute>
                  <IzinRoute izin={[IZIN_FITUR.publikasiUbah]}>
                    <SidebarLayout>
                      <PublikasiFormPage />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />

            {/* 5. Manajemen Peran — dijaga izin `roles.view` / `roles.manage` */}
            <Route
              path="/peran"
              element={
                <ProtectedRoute>
                  <IzinRoute izin={[IZIN_FITUR.peranLihat]}>
                    <SidebarLayout>
                      <PeranPage />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/peran/tambah"
              element={
                <ProtectedRoute>
                  <IzinRoute izin={[IZIN_FITUR.peranKelola]}>
                    <SidebarLayout>
                      <PeranFormPage />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/peran/edit/:id"
              element={
                <ProtectedRoute>
                  <IzinRoute izin={[IZIN_FITUR.peranKelola]}>
                    <SidebarLayout>
                      <PeranFormPage />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />

            {/* 6. Katalog Hak Izin — dijaga izin `permissions.view` / `permissions.manage` */}
            <Route
              path="/izin"
              element={
                <ProtectedRoute>
                  <IzinRoute izin={[IZIN_FITUR.izinLihat]}>
                    <SidebarLayout>
                      <IzinPage />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/izin/tambah"
              element={
                <ProtectedRoute>
                  <IzinRoute izin={[IZIN_FITUR.izinKelola]}>
                    <SidebarLayout>
                      <IzinFormPage />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/izin/edit/:id"
              element={
                <ProtectedRoute>
                  <IzinRoute izin={[IZIN_FITUR.izinKelola]}>
                    <SidebarLayout>
                      <IzinFormPage />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />
            {/* 6b. Manajemen Pengguna / Penugasan Peran */}
            <Route
              path="/pengguna"
              element={
                <ProtectedRoute>
                  <IzinRoute izin={[IZIN_FITUR.penggunaLihat, IZIN_FITUR.peranLihat]}>
                    <SidebarLayout>
                      <PenggunaPage />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pengguna/tambah"
              element={
                <ProtectedRoute>
                  <IzinRoute izin={[IZIN_FITUR.penggunaKelola, IZIN_FITUR.peranKelola]}>
                    <SidebarLayout>
                      <PenggunaFormPage />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pengguna/edit/:username"
              element={
                <ProtectedRoute>
                  <IzinRoute izin={[IZIN_FITUR.penggunaKelola, IZIN_FITUR.peranKelola]}>
                    <SidebarLayout>
                      <PenggunaFormPage />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />

            {/* 7. Monitoring & Evaluasi (Monev) (Full Pages CRUD) */}
            <Route
              path="/monev"
              element={
                <ProtectedRoute>
                  <IzinRoute izin={[IZIN_FITUR.monevLihat]}>
                    <SidebarLayout>
                      <MonevPage />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/monev/tambah"
              element={
                <ProtectedRoute>
                  <IzinRoute izin={[IZIN_FITUR.monevBuat]}>
                    <SidebarLayout>
                      <MonevFormPage />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/monev/edit/:id"
              element={
                <ProtectedRoute>
                  <IzinRoute izin={[IZIN_FITUR.monevKelola, IZIN_FITUR.monevReview]}>
                    <SidebarLayout>
                      <MonevFormPage />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />

            {/* Slider Hero LPPM */}
            <Route
              path="/slider"
              element={
                <ProtectedRoute>
                  <IzinRoute izin={[IZIN_FITUR.penelitianLihat]}>
                    <SidebarLayout>
                      <ManajemenSliderLppm />
                    </SidebarLayout>
                  </IzinRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/slider"
              element={<Navigate to="/slider" replace />}
            />

            <Route path="*" element={<HalamanTidakDitemukan />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
