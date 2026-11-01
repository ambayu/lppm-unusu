import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/Landing';
import { PenelitianPage } from './pages/Penelitian';
import { PenelitianFormPage } from './pages/PenelitianForm';
import { PengabdianPage } from './pages/Pengabdian';
import { PengabdianFormPage } from './pages/PengabdianForm';
import { PublikasiPage } from './pages/Publikasi';
import { PublikasiFormPage } from './pages/PublikasiForm';
import { PenggunaPage } from './pages/Pengguna';
import { PeranPage } from './pages/Peran';
import { IzinPage } from './pages/Izin';
import { MonevPage } from './pages/Monev';
import { MonevFormPage } from './pages/MonevForm';
import { LoginPage } from './pages/Login';
import { SsoCallbackPage } from './pages/SsoCallback';
import { SidebarLayout } from './components/SidebarLayout';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactElement }) {
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
  return children;
}

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

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

            {/* Rute /admin: Jika sudah login & role admin, arahkan ke /penelitian; selain itu arahkan ke /login */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Navigate to="/penelitian" replace />
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

            {/* 4. Manajemen Pengguna */}
            <Route
              path="/pengguna"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <PenggunaPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />

            {/* 5. Manajemen Peran & Hak Akses */}
            <Route
              path="/peran"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <PeranPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />

            {/* 6. Katalog Hak Izin (Permissions) */}
            <Route
              path="/izin"
              element={
                <ProtectedRoute>
                  <SidebarLayout>
                    <IzinPage />
                  </SidebarLayout>
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
