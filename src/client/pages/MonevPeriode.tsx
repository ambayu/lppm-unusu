import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchMonevPeriode,
  createMonevPeriode,
  updateMonevPeriode,
  MonevPeriodeItem,
} from '../services/api';
import { ListPageTemplate } from '../components/ListPageTemplate';
import {
  CalendarDaysIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

export const MonevPeriodePage: React.FC = () => {
  const [list, setList] = useState<MonevPeriodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form modal/drawer state
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [tahunAkademik, setTahunAkademik] = useState('2024/2025');
  const [semester, setSemester] = useState('Genap');
  const [status, setStatus] = useState<'DRAFT' | 'AKTIF' | 'DITUTUP'>('AKTIF');
  const [deskripsi, setDeskripsi] = useState('');

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchMonevPeriode()
      .then((res) => {
        setList(res.data.data || []);
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || 'Gagal memuat master periode monev.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenTambah = () => {
    setEditingId(null);
    setKode(`PERIODE-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setNama('Semester Genap T.A. 2024/2025');
    setTahunAkademik('2024/2025');
    setSemester('Genap');
    setStatus('AKTIF');
    setDeskripsi('');
    setFormOpen(true);
  };

  const handleOpenEdit = (item: MonevPeriodeItem) => {
    setEditingId(item.id);
    setKode(item.kode);
    setNama(item.nama);
    setTahunAkademik(item.tahunAkademik);
    setSemester(item.semester);
    setStatus(item.status);
    setDeskripsi(item.deskripsi || '');
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updateMonevPeriode(editingId, {
          nama,
          tahunAkademik,
          semester,
          status,
          deskripsi,
        });
      } else {
        await createMonevPeriode({
          kode,
          nama,
          tahunAkademik,
          semester,
          status,
          deskripsi,
        });
      }
      setFormOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menyimpan periode monev.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/monev-survei"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-violet-700"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          <span>Kembali ke Katalog Monev</span>
        </Link>
      </div>

      <ListPageTemplate
        title="Master Periode Monev"
        description="Kelola tahun akademik, semester, dan status masa pengisian kuesioner monev."
        actions={
          <button
            onClick={handleOpenTambah}
            className="inline-flex items-center gap-1.5 rounded-[8px] bg-violet-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-violet-800"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Tambah Periode Baru</span>
          </button>
        }
        loading={loading}
        error={error}
        onRetry={loadData}
        isEmpty={!loading && list.length === 0}
        emptyTitle="Belum Ada Periode Monev"
        emptyMessage="Buat master periode monev baru untuk membuka pengisian kuesioner bagi mahasiswa dan civitas."
      >
        <div className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 font-semibold text-slate-600">
                  <th className="px-4 py-3.5">Kode Periode</th>
                  <th className="px-4 py-3.5">Nama Periode</th>
                  <th className="px-4 py-3.5">T.A. / Semester</th>
                  <th className="px-4 py-3.5">Survei Aktif</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-violet-700">{item.kode}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <div>{item.nama}</div>
                      {item.deskripsi && <div className="text-[11px] text-slate-400">{item.deskripsi}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.tahunAkademik} ({item.semester})
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {item._count?.surveiList ?? 0} Kuesioner
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          item.status === 'AKTIF'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'DRAFT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.status === 'AKTIF' ? (
                          <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-600" />
                        ) : item.status === 'DRAFT' ? (
                          <ClockIcon className="h-3.5 w-3.5 text-amber-600" />
                        ) : (
                          <XCircleIcon className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="rounded-[6px] border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Ubah
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ListPageTemplate>

      {/* Modal Tambah/Edit Periode */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[16px] border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-800">
              {editingId ? 'Ubah Periode Monev' : 'Tambah Periode Baru'}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Atur tahun akademik dan status masa berlaku pengisian kuesioner monev.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              {!editingId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Kode Periode</label>
                  <input
                    type="text"
                    required
                    value={kode}
                    onChange={(e) => setKode(e.target.value)}
                    className="mt-1 w-full rounded-[8px] border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 focus:border-violet-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700">Nama Periode</label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Semester Genap T.A. 2024/2025"
                  className="mt-1 w-full rounded-[8px] border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Tahun Akademik</label>
                  <input
                    type="text"
                    required
                    value={tahunAkademik}
                    onChange={(e) => setTahunAkademik(e.target.value)}
                    placeholder="2024/2025"
                    className="mt-1 w-full rounded-[8px] border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="mt-1 w-full rounded-[8px] border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-violet-500 focus:outline-none"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                    <option value="Antara">Antara</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Status Periode</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="mt-1 w-full rounded-[8px] border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-violet-500 focus:outline-none"
                >
                  <option value="AKTIF">AKTIF (Dapat diisi responden)</option>
                  <option value="DRAFT">DRAFT (Persiapan instrumen)</option>
                  <option value="DITUTUP">DITUTUP (Masa survei selesai)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Deskripsi / Catatan</label>
                <textarea
                  rows={2}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="mt-1 w-full rounded-[8px] border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-[8px] border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-[8px] bg-violet-700 px-4 py-2 text-xs font-bold text-white hover:bg-violet-800 disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Periode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
