import React, { useEffect, useState } from 'react';
import { fetchPenelitian, createPenelitian, PenelitianItem } from '../services/api';
import { Microscope, Plus, Search, DollarSign, Calendar } from 'lucide-react';

export const PenelitianPage: React.FC = () => {
  const [list, setList] = useState<PenelitianItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [judul, setJudul] = useState('');
  const [ketua, setKetua] = useState('');
  const [nidn, setNidn] = useState('');
  const [anggota, setAnggota] = useState('');
  const [skema, setSkema] = useState('Penelitian Dosen Pemula (PDP)');
  const [bidangFokus, setBidangFokus] = useState('Teknologi Informasi');
  const [dana, setDana] = useState(15000000);

  const loadData = () => {
    setLoading(true);
    fetchPenelitian()
      .then((res) => setList(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPenelitian({
        judul,
        ketua,
        nidn,
        anggota,
        skema,
        bidangFokus,
        danaDisetujui: Number(dana),
      });
      alert('Proposal penelitian berhasil dicatat!');
      setShowModal(false);
      setJudul('');
      setKetua('');
      setNidn('');
      loadData();
    } catch (err) {
      alert('Gagal mengajukan penelitian');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <span className="text-xs font-bold uppercase tracking-wider bg-white/20 text-yellow-300 px-3 py-1 rounded-full">
          Riset & Inovasi UNUSU
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold mt-3">Pangkalan Data Penelitian Dosen</h1>
        <p className="text-emerald-100 text-sm mt-1 max-w-2xl leading-relaxed">
          Mendorong pengembangan riset ilmiah terapan, publikasi bereputasi, serta inovasi teknologi yang bermanfaat bagi kemajuan umat dan bangsa.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Daftar Hibah & Judul Penelitian</h2>
          <p className="text-xs text-slate-500">Monitoring kemajuan riset internal dan eksternal perguruan tinggi</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Ajukan Proposal Riset</span>
        </button>
      </div>

      <div className="space-y-4">
        {list.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800">
                  {item.skema}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                  {item.bidangFokus}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  Tahun {item.tahun}
                </span>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                {item.status}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900">{item.judul}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
              <div>Ketua Peneliti: <strong className="text-slate-800">{item.ketua}</strong> (NIDN: {item.nidn})</div>
              <div>Anggota: <span className="text-slate-700">{item.anggota || '-'}</span></div>
              <div>Pendanaan: <strong className="text-emerald-700">Rp {Number(item.danaDisetujui || 0).toLocaleString('id-ID')}</strong> ({item.sumberDana})</div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Ajukan Proposal Riset Dosen</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Judul Riset *</label>
                <textarea
                  required
                  rows={2}
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Tuliskan judul penelitian..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Ketua Peneliti *</label>
                  <input
                    type="text"
                    required
                    value={ketua}
                    onChange={(e) => setKetua(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">NIDN *</label>
                  <input
                    type="text"
                    required
                    value={nidn}
                    onChange={(e) => setNidn(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Anggota Peneliti (Dosen / Mahasiswa)</label>
                <input
                  type="text"
                  value={anggota}
                  onChange={(e) => setAnggota(e.target.value)}
                  placeholder="Contoh: Ahmad Zaki, M.Kom., Muhammad Fadhil"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Skema Riset</label>
                  <select
                    value={skema}
                    onChange={(e) => setSkema(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="Penelitian Dosen Pemula (PDP)">Penelitian Dosen Pemula (PDP)</option>
                    <option value="Penelitian Terapan Unggulan">Penelitian Terapan Unggulan</option>
                    <option value="Penelitian Kerjasama Mitra">Penelitian Kerjasama Mitra</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Usulan Dana (Rp)</label>
                  <input
                    type="number"
                    value={dana}
                    onChange={(e) => setDana(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800"
                >
                  Simpan Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
