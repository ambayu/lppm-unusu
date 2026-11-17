import React, { useEffect, useState } from 'react';
import { ArrowLeftIcon, PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchMonevPertanyaan, fetchMonevKategori, createMonevPertanyaan, updateMonevPertanyaan, deleteMonevPertanyaan, MonevPertanyaanItem, MonevSurveiItem } from '../services/api';
import { ListPageTemplate, ListActionButton, ListColumn, RowActionButton } from '../components/ListPageTemplate';
import { CardContainer } from '../components/CardContainer';
import { NotificationModal } from '../components/NotificationModal';
import { deskripsikanGalat, DeskripsiGalat } from '../lib/galat';

export const MonevSoalPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedSurvei = searchParams.get('surveiId') || '';
  const query = selectedSurvei ? `?surveiId=${encodeURIComponent(selectedSurvei)}` : '';
  const [list, setList] = useState<MonevPertanyaanItem[]>([]);
  const [surveiList, setSurveiList] = useState<MonevSurveiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<DeskripsiGalat | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MonevPertanyaanItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MonevPertanyaanItem | null>(null);
  const [formSurveiId, setFormSurveiId] = useState(0);
  const [formSeksi, setFormSeksi] = useState('');
  const [formKode, setFormKode] = useState('');
  const [formTeks, setFormTeks] = useState('');
  const [formTipe, setFormTipe] = useState<MonevPertanyaanItem['tipe']>('SKALA_5');
  const [formWajib, setFormWajib] = useState(true);
  const [formUrutan, setFormUrutan] = useState(1);

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([fetchMonevPertanyaan(), fetchMonevKategori()]).then(([soal, kategori]) => {
      setList(soal.data.data || []);
      setSurveiList(kategori.data.data || []);
    }).catch((err: unknown) => {
      setError(deskripsikanGalat(err, 'Memuat Soal', 'bank soal monev').details.map((detail) => detail.message).join(' '));
    }).finally(() => setLoading(false));
  };
  useEffect(loadData, []);

  const openTambahModal = () => {
    const count = list.filter((row) => !selectedSurvei || String(row.surveiId) === selectedSurvei).length;
    setEditingItem(null);
    setFormSurveiId(Number(selectedSurvei) || surveiList[0]?.id || 0);
    setFormSeksi('');
    setFormKode(`SOAL-${count + 1}`);
    setFormTeks('');
    setFormTipe('SKALA_5');
    setFormWajib(true);
    setFormUrutan(count + 1);
    setModalOpen(true);
  };

  const openEditModal = (target: MonevPertanyaanItem) => {
    setEditingItem(target);
    setFormSurveiId(target.surveiId);
    setFormSeksi(target.seksi || '');
    setFormKode(target.kode || '');
    setFormTeks(target.teks);
    setFormTipe(target.tipe);
    setFormWajib(target.wajib);
    setFormUrutan(target.urutan);
    setModalOpen(true);
  };

  const closeFormModal = () => {
    if (!submitting) {
      setModalOpen(false);
      setEditingItem(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteMonevPertanyaan(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    } catch (err: unknown) {
      setNotification(deskripsikanGalat(err, 'Menghapus Soal', `pertanyaan «${deleteTarget.teks}»`));
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading || submitting) return;
    setSubmitting(true);
    try {
      const payload = { seksi: formSeksi, kode: formKode, teks: formTeks, tipe: formTipe, wajib: formWajib, urutan: formUrutan };
      if (editingItem) {
        await updateMonevPertanyaan(editingItem.id, payload);
      } else {
        await createMonevPertanyaan({ surveiId: formSurveiId, ...payload });
      }
      closeFormModal();
      loadData();
    } catch (err: unknown) {
      setNotification(deskripsikanGalat(err, 'Menyimpan Soal', `pertanyaan «${formTeks}»`));
    } finally { setSubmitting(false); }
  };

  const columns: ListColumn<MonevPertanyaanItem>[] = [
    { key: 'survei', header: 'Instrumen', render: (row) => row.survei?.judul || '-' },
    { key: 'seksi', header: 'Seksi', render: (row) => row.seksi || '-' },
    { key: 'kode', header: 'Kode', render: (row) => row.kode || '-' },
    { key: 'teks', header: 'Pertanyaan', render: (row) => row.teks },
    { key: 'tipe', header: 'Tipe', render: (row) => row.tipe === 'SKALA_5' ? 'Skala Likert (1–5)' : row.tipe },
    { key: 'wajib', header: 'Wajib', render: (row) => row.wajib ? 'Ya' : 'Opsional' },
    { key: 'createdAt', header: 'Dibuat', render: (row) => 'createdAt' in row && typeof row.createdAt === 'string' ? new Date(row.createdAt).toLocaleString('id-ID') : '-' },
    { key: 'aksi', header: 'Aksi', render: (row) => <div className="flex gap-2"><RowActionButton label="Ubah soal" onClick={() => openEditModal(row)}><PencilSquareIcon className="h-4 w-4" aria-hidden="true" /></RowActionButton><RowActionButton label="Hapus soal" variant="danger" disabled={deleting} onClick={() => setDeleteTarget(row)}><TrashIcon className="h-4 w-4" aria-hidden="true" /></RowActionButton></div> },
  ];

  const activeSurvei = surveiList.find((s) => String(s.id) === selectedSurvei);
  const pageTitle = activeSurvei ? `Soal: ${activeSurvei.judul}` : 'Kelola Butir Soal Monev';
  const pageDesc = activeSurvei
    ? `Kelola butir pertanyaan dan skala penilaian untuk kategori/instrumen «${activeSurvei.judul}» (${activeSurvei.kode}).`
    : 'Kelola butir pertanyaan kuesioner dan model skala penilaian untuk instrumen terpilih.';

  const filteredList = list.filter((row) => !selectedSurvei || String(row.surveiId) === selectedSurvei);

  return <>
    <ListPageTemplate
      title={pageTitle}
      description={pageDesc}
      columns={selectedSurvei ? columns.filter((col) => col.key !== 'survei') : columns}
      rows={error ? [] : filteredList}
      rowKey={(row) => row.id}
      loading={loading}
      error={error}
      onRetry={loadData}
      tableTitle={activeSurvei ? `Daftar Soal — ${activeSurvei.judul}` : 'Daftar Butir Pertanyaan'}
      tableSubtitle={`Menampilkan ${filteredList.length} butir pertanyaan.`}
      emptyMessage={activeSurvei ? `Belum ada butir soal untuk instrumen «${activeSurvei.judul}».` : 'Belum ada butir soal untuk instrumen ini.'}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/monev-kategori"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[12px] border border-[#CBD5E1] bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" /> Kembali ke Kategori
          </Link>
          <ListActionButton onClick={openTambahModal} icon={<PlusIcon className="h-4 w-4" aria-hidden="true" />} accentClassName="bg-violet-700 hover:bg-violet-800">Tambah Data</ListActionButton>
        </div>
      }
    />

    {/* MODAL BESAR FORM TAMBAH / UBAH BUTIR SOAL MONEV */}
    {modalOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-soal-title"
      >
        <div className="relative w-full max-w-4xl bg-white rounded-[20px] border border-[#CBD5E1] shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
          {/* Header Modal */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div>
              <h3 id="modal-soal-title" className="text-base sm:text-lg font-bold text-slate-900">
                {editingItem ? 'Ubah Butir Soal Monev' : 'Tambah Butir Soal Monev'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeSurvei ? `Instrumen: ${activeSurvei.judul}` : 'Atur pertanyaan, seksi instrumen, dan model penilaian.'}
              </p>
            </div>
            <button
              type="button"
              onClick={closeFormModal}
              disabled={submitting}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition disabled:opacity-50"
              aria-label="Tutup modal"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body Modal */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5">
            <fieldset disabled={submitting} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <label className="block text-xs font-bold text-slate-700">
                  Instrumen Monev
                  <select
                    required
                    disabled={Boolean(editingItem) || Boolean(selectedSurvei)}
                    value={formSurveiId || ''}
                    onChange={(e) => setFormSurveiId(Number(e.target.value))}
                    className="mt-1 block min-h-[44px] w-full rounded-[12px] border border-[#CBD5E1] p-3 text-sm font-normal focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20 disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="">Pilih Instrumen</option>
                    {surveiList.map((row) => (
                      <option key={row.id} value={row.id}>{row.judul}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-bold text-slate-700">
                  Seksi / Kelompok Dimensi
                  <input
                    value={formSeksi}
                    onChange={(e) => setFormSeksi(e.target.value)}
                    placeholder="Contoh: Dimensi Fasilitas, Aspek Pengajaran"
                    className="mt-1 block min-h-[44px] w-full rounded-[12px] border border-[#CBD5E1] p-3 text-sm font-normal focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <label className="block text-xs font-bold text-slate-700">
                  Kode Pertanyaan
                  <input
                    value={formKode}
                    onChange={(e) => setFormKode(e.target.value)}
                    placeholder="Contoh: SOAL-1"
                    className="mt-1 block min-h-[44px] w-full rounded-[12px] border border-[#CBD5E1] p-3 text-sm font-normal focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20"
                  />
                </label>

                <label className="block text-xs font-bold text-slate-700">
                  Tipe Jawaban
                  <select
                    value={formTipe}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'SKALA_5' || value === 'ESAI') setFormTipe(value);
                    }}
                    className="mt-1 block min-h-[44px] w-full rounded-[12px] border border-[#CBD5E1] p-3 text-sm font-normal focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20"
                  >
                    <option value="SKALA_5">Skala Likert (1–5)</option>
                    <option value="ESAI">Esai / Catatan Bebas</option>
                    {formTipe !== 'SKALA_5' && formTipe !== 'ESAI' && <option value={formTipe}>{formTipe}</option>}
                  </select>
                </label>

                <label className="block text-xs font-bold text-slate-700">
                  Nomor Urutan
                  <input
                    required
                    type="number"
                    min={1}
                    value={formUrutan}
                    onChange={(e) => setFormUrutan(Number(e.target.value))}
                    className="mt-1 block min-h-[44px] w-full rounded-[12px] border border-[#CBD5E1] p-3 text-sm font-normal focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20"
                  />
                </label>
              </div>

              <label className="block text-xs font-bold text-slate-700">
                Teks Pertanyaan <span className="text-rose-500">*</span>
                <textarea
                  required
                  rows={4}
                  value={formTeks}
                  onChange={(e) => setFormTeks(e.target.value)}
                  placeholder="Tuliskan butir pertanyaan kuesioner monev secara lengkap..."
                  className="mt-1 block w-full rounded-[12px] border border-[#CBD5E1] p-3 text-sm font-normal focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20"
                />
              </label>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-[12px]">
                <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formWajib}
                    onChange={(e) => setFormWajib(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-violet-700 focus:ring-violet-600"
                  />
                  <span>Wajib dijawab oleh responden (muncul tanda bintang merah *)</span>
                </label>
              </div>
            </fieldset>

            {/* Modal Footer Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeFormModal}
                disabled={submitting}
                className="min-h-[44px] px-5 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[44px] px-6 py-2.5 rounded-[12px] bg-violet-700 hover:bg-violet-800 text-white text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambah Pertanyaan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    <NotificationModal isOpen={Boolean(notification)} type="error" message={notification?.message || ''} {...notification} onClose={() => setNotification(null)} />
    <NotificationModal isOpen={Boolean(deleteTarget)} type="confirm" title="Hapus Butir Pertanyaan" message={`Hapus pertanyaan «${deleteTarget?.teks || ''}»? Jawaban responden terkait pertanyaan ini juga akan terhapus.`} confirmLabel="Hapus Pertanyaan" loading={deleting} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
  </>;
};
