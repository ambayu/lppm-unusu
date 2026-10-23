import React, { useEffect, useState } from 'react';
import { fetchPengabdian, PengabdianItem } from '../services/api';
import { HeartHandshake, MapPin, Users, Calendar } from 'lucide-react';

export const PengabdianPage: React.FC = () => {
  const [list, setList] = useState<PengabdianItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPengabdian()
      .then((res) => setList(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Pengabdian kepada Masyarakat (PKM)</h1>
        <p className="text-xs text-slate-500 mt-1">Implementasi kepakaran dosen dan mahasiswa untuk memberdayakan UMKM, pesantren, dan masyarakat luas.</p>
      </div>

      <div className="space-y-4">
        {list.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800">
                Tahun {item.tahun}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                {item.status}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900">{item.judul}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
              <div>Ketua PKM: <strong className="text-slate-800">{item.ketua}</strong></div>
              <div>Mitra Sasaran: <strong className="text-slate-700">{item.mitra}</strong></div>
              <div>Lokasi Kegiatan: <span className="text-slate-700 flex items-center mt-0.5"><MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" /> {item.lokasi}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
