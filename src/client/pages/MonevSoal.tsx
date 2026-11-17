import React, { useEffect, useState } from 'react';
import { Link, useMatch, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchMonevPertanyaan, fetchMonevKategori, createMonevPertanyaan, updateMonevPertanyaan, deleteMonevPertanyaan, MonevPertanyaanItem, MonevSurveiItem } from '../services/api';
import { ListPageTemplate, ListActionButton, ListColumn } from '../components/ListPageTemplate';
import { FormPageTemplate } from '../components/FormPageTemplate';
import { CardContainer } from '../components/CardContainer';
import { NotificationModal } from '../components/NotificationModal';
import { deskripsikanGalat, DeskripsiGalat } from '../lib/galat';

export const MonevSoalPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const formMode = Boolean(useMatch('/monev-soal/tambah')) || Boolean(id);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSurvei = searchParams.get('surveiId') || '';
  const query = selectedSurvei ? `?surveiId=${encodeURIComponent(selectedSurvei)}` : '';
  const backTo = `/monev-soal${query}`;
  const [list, setList] = useState<MonevPertanyaanItem[]>([]);
  const [surveiList, setSurveiList] = useState<MonevSurveiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<DeskripsiGalat | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MonevPertanyaanItem | null>(null);
  const [deleting, setDeleting] = useState(false);
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
  const item = id ? list.find((row) => String(row.id) === id) : undefined;
  useEffect(() => {
    if (item) {
      setFormSurveiId(item.surveiId);
      setFormSeksi(item.seksi || '');
      setFormKode(item.kode || '');
      setFormTeks(item.teks);
      setFormTipe(item.tipe);
      setFormWajib(item.wajib);
      setFormUrutan(item.urutan);
    } else if (!id) {
      const count = list.filter((row) => !selectedSurvei || String(row.surveiId) === selectedSurvei).length;
      setFormSurveiId(Number(selectedSurvei) || surveiList[0]?.id || 0);
      setFormSeksi('');
      setFormKode(`SOAL-${count + 1}`);
      setFormTeks('');
      setFormTipe('SKALA_5');
      setFormWajib(true);
      setFormUrutan(count + 1);
    }
  }, [item, id, formMode, selectedSurvei, surveiList, list]);
  const formError = error || (!loading && id && !item ? 'Butir soal monev tidak ditemukan.' : null);
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
    if (loading || formError || submitting) return;
    setSubmitting(true);
    try {
      const payload = { seksi: formSeksi, kode: formKode, teks: formTeks, tipe: formTipe, wajib: formWajib, urutan: formUrutan };
      if (item) await updateMonevPertanyaan(item.id, payload);
      else await createMonevPertanyaan({ surveiId: formSurveiId, ...payload });
      navigate(backTo);
      loadData();
    } catch (err: unknown) {
      setNotification(deskripsikanGalat(err, 'Menyimpan Soal', `pertanyaan «${formTeks}»`));
    } finally { setSubmitting(false); }
  };
  const columns: ListColumn<MonevPertanyaanItem>[] = [
    { key: 'urutan', header: 'Urutan', render: (row) => row.urutan },
    { key: 'survei', header: 'Instrumen', render: (row) => row.survei?.judul || '-' },
    { key: 'seksi', header: 'Seksi', render: (row) => row.seksi || '-' },
    { key: 'kode', header: 'Kode', render: (row) => row.kode || '-' },
    { key: 'teks', header: 'Pertanyaan', render: (row) => row.teks },
    { key: 'tipe', header: 'Tipe', render: (row) => row.tipe },
    { key: 'wajib', header: 'Wajib', render: (row) => row.wajib ? 'Ya' : 'Opsional' },
    { key: 'createdAt', header: 'Dibuat', render: (row) => 'createdAt' in row && typeof row.createdAt === 'string' ? new Date(row.createdAt).toLocaleString('id-ID') : '-' },
    { key: 'aksi', header: 'Aksi', render: (row) => <div className="flex gap-3"><Link className="inline-flex min-h-[44px] items-center text-violet-700" to={`/monev-soal/edit/${row.id}${query}`}>Ubah</Link><button type="button" disabled={deleting} className="min-h-[44px] text-rose-700 disabled:opacity-50" onClick={() => setDeleteTarget(row)}>Hapus</button></div> },
  ];
  const filteredList = list.filter((row) => !selectedSurvei || String(row.surveiId) === selectedSurvei);
  return <>
    {formMode ? <FormPageTemplate title={id ? 'Ubah Butir Soal Monev' : 'Tambah Butir Soal Monev'} description="Atur pertanyaan, seksi instrumen, dan model penilaian." backTo={backTo} isEdit={Boolean(id)} submitting={submitting} submitDisabled={loading || Boolean(formError)} error={formError} onSubmit={handleSubmit} accentClassName="bg-violet-700 hover:bg-violet-800">
      <CardContainer title="Informasi Pertanyaan">
        {loading && <p role="status">Memuat bank soal monev...</p>}
        <fieldset disabled={loading || submitting || Boolean(formError)} className="space-y-4">
          <label className="block text-sm font-semibold">Instrumen Monev<select required disabled={Boolean(id)} value={formSurveiId || ''} onChange={(e) => setFormSurveiId(Number(e.target.value))} className="mt-1 block w-full rounded-[12px] border border-[#CBD5E1] p-3"><option value="">Pilih Instrumen</option>{surveiList.map((row) => <option key={row.id} value={row.id}>{row.judul}</option>)}</select></label>
          <label className="block text-sm font-semibold">Seksi / Kelompok Dimensi<input value={formSeksi} onChange={(e) => setFormSeksi(e.target.value)} className="mt-1 block w-full rounded-[12px] border border-[#CBD5E1] p-3" /></label>
          <label className="block text-sm font-semibold">Kode Pertanyaan<input value={formKode} onChange={(e) => setFormKode(e.target.value)} className="mt-1 block w-full rounded-[12px] border border-[#CBD5E1] p-3" /></label>
          <label className="block text-sm font-semibold">Teks Pertanyaan<textarea required rows={3} value={formTeks} onChange={(e) => setFormTeks(e.target.value)} className="mt-1 block w-full rounded-[12px] border border-[#CBD5E1] p-3" /></label>
          <label className="block text-sm font-semibold">Tipe Jawaban<select value={formTipe} onChange={(e) => { const value = e.target.value; if (value === 'SKALA_5' || value === 'ESAI') setFormTipe(value); }} className="mt-1 block w-full rounded-[12px] border border-[#CBD5E1] p-3"><option value="SKALA_5">Skala Likert (1–5)</option><option value="ESAI">Esai / Catatan Bebas</option>{formTipe !== 'SKALA_5' && formTipe !== 'ESAI' && <option value={formTipe}>{formTipe}</option>}</select></label>
          <label className="block text-sm font-semibold">Nomor Urutan<input required type="number" min={1} value={formUrutan} onChange={(e) => setFormUrutan(Number(e.target.value))} className="mt-1 block w-full rounded-[12px] border border-[#CBD5E1] p-3" /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formWajib} onChange={(e) => setFormWajib(e.target.checked)} />Wajib dijawab oleh responden</label>
        </fieldset>
      </CardContainer>
    </FormPageTemplate> : <ListPageTemplate
      title="Kelola Butir Soal Monev"
      description="Kelola butir pertanyaan kuesioner dan model skala penilaian untuk instrumen terpilih."
      columns={columns}
      rows={error ? [] : filteredList}
      rowKey={(row) => row.id}
      loading={loading}
      error={error}
      onRetry={loadData}
      tableTitle="Daftar Butir Pertanyaan"
      tableSubtitle={`Menampilkan ${filteredList.length} dari total ${list.length} butir pertanyaan.`}
      emptyMessage="Belum ada butir soal untuk instrumen ini."
      hasActiveFilter={Boolean(selectedSurvei)}
      filters={<label className="text-sm font-semibold text-slate-700">Filter Instrumen<select value={selectedSurvei} onChange={(e) => setSearchParams(e.target.value ? { surveiId: e.target.value } : {})} className="ml-2 min-h-[44px] rounded-[12px] border border-[#CBD5E1] p-2 text-xs font-normal"><option value="">Semua Instrumen</option>{surveiList.map((row) => <option key={row.id} value={row.id}>{row.judul}</option>)}</select></label>}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/monev-kategori"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-[12px] border border-[#CBD5E1] bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            ← Kembali ke Kategori
          </Link>
          <ListActionButton variant="secondary" onClick={loadData} disabled={loading}>Segarkan</ListActionButton>
          <ListActionButton to={`/monev-soal/tambah${query}`} accentClassName="bg-violet-700 hover:bg-violet-800">Tambah Pertanyaan</ListActionButton>
        </div>
      }
    />}
    <NotificationModal isOpen={Boolean(notification)} type="error" message={notification?.message || ''} {...notification} onClose={() => setNotification(null)} />
    <NotificationModal isOpen={Boolean(deleteTarget)} type="confirm" title="Hapus Butir Pertanyaan" message={`Hapus pertanyaan «${deleteTarget?.teks || ''}»? Jawaban responden terkait pertanyaan ini juga akan terhapus.`} confirmLabel="Hapus Pertanyaan" loading={deleting} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
  </>;
};
