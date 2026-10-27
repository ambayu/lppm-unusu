import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { PenelitianPage } from './pages/Penelitian';
import { PengabdianPage } from './pages/Pengabdian';
import { PublikasiPage } from './pages/Publikasi';
import { LoginPage } from './pages/Login';
import { SsoCallbackPage } from './pages/SsoCallback';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="p-12 text-center text-slate-500">Memuat sesi...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function App() {
  return (
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/sso/callback" element={<SsoCallbackPage />} />
              <Route path="/" element={<ProtectedRoute><PenelitianPage /></ProtectedRoute>} />
              <Route path="/pengabdian" element={<ProtectedRoute><PengabdianPage /></ProtectedRoute>} />
              <Route path="/publikasi" element={<ProtectedRoute><PublikasiPage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
            <p>Ac {new Date().getFullYear()} LPPM UNUSU — Lembaga Penelitian & Pengabdian kepada Masyarakat Universitas Nahdlatul Ulama Sumatera Utara</p>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
