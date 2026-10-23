import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { PenelitianPage } from './pages/Penelitian';
import { PengabdianPage } from './pages/Pengabdian';
import { PublikasiPage } from './pages/Publikasi';

export function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<PenelitianPage />} />
            <Route path="/pengabdian" element={<PengabdianPage />} />
            <Route path="/publikasi" element={<PublikasiPage />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} LPPM UNUSU • Lembaga Penelitian & Pengabdian kepada Masyarakat Universitas Nahdlatul Ulama Sumatera Utara</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
