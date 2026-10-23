import React, { useEffect, useState } from 'react';
import { fetchPublikasi, PublikasiItem } from '../services/api';
import { BookOpen, ExternalLink, Award } from 'lucide-react';

export const PublikasiPage: React.FC = () => {
  const [list, setList] = useState<PublikasiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublikasi()
      .then((res) => setList(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Publikasi Artikel Ilmiah & Jurnal</h1>
        <p className="text-xs text-slate-500 mt-1">Daftar publikasi artikel riset dosen UNUSU pada jurnal terakreditasi SINTA & Scopus.</p>
      </div>

      <div className="space-y-4">
        {list.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                  {item.jenis}
                </span>
                {item.sintaScore && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {item.sintaScore}
                  </span>
                )}
                <span className="text-xs text-slate-400">Tahun {item.tahun}</span>
              </div>
            </div>

            <h3 className="text-base font-bold text-slate-900">{item.judul}</h3>
            <p className="text-xs text-slate-600">
              Penulis: <strong className="text-slate-800">{item.penulis}</strong> • Jurnal: <em>{item.namaJurnal}</em> ({item.volumeIssue || '-'})
            </p>

            {item.doiUrl && (
              <div className="pt-2 border-t border-slate-100">
                <a
                  href={item.doiUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-xs font-bold text-emerald-700 hover:underline"
                >
                  <span>Lihat Artikel / DOI</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
