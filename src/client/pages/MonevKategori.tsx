import React, { useEffect, useState } from 'react';
import { Link, useMatch, useNavigate, useParams } from 'react-router-dom';
import { fetchMonevKategori, fetchMonevPeriode, createMonevKategori, updateMonevKategori, MonevSurveiItem, MonevPeriodeItem } from '../services/api';
import { ListPageTemplate, ListActionButton, ListColumn } from '../components/ListPageTemplate';
import { FormPageTemplate } from '../components/FormPageTemplate';
import { CardContainer } from '../components/CardContainer';
import { NotificationModal } from '../components/NotificationModal';
import { deskripsikanGalat, DeskripsiGalat } from '../lib/galat';

export const MonevKategoriPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const formMode = Boolean(useMatch('/monev-kategori/tambah')) || Boolean(id);
  const navigate = useNavigate();
  const [list, setList] = useState<MonevSurveiItem[]>([]);
  const [periodeList, setPeriodeList] = useState<MonevPeriodeItem[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<DeskripsiGalat | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formPeriodeId, setFormPeriodeId] = useState(0);
  const [formKode, setFormKode] = useState('');
  const [formJudul, setFormJudul] = useState('');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formTarget, setFormTarget] = useState<MonevSurveiItem['targetAudiens']>('MAHASISWA');
  const [formAktif, setFormAktif] = useState(true);
  const [formUrutan, setFormUrutan] = useState(1);
  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([fetchMonevKategori(), fetchMonevPeriode()]).then(([kategori, periode]) => {
      setList(kategori.data.data || []);
      setPeriodeList(periode.data.data || []);
    }).catch((err: unknown) => {
      setError(deskripsikanGalat(err, 'Memuat Kategori', 'daftar instrumen monev').details.map((detail) => detail.message).join(' '));
    }).finally(() => setLoading(false));
  };
  useEffect(loadData, []);
  const item = id ? list.find((row) => String(row.id) === id) : undefined;
  useEffect(() => {
    if (item) {
      setFormPeriodeId(item.periodeId || 0);
      setFormKode(item.kode);
      setFormJudul(item.judul);
      setFormDeskripsi(item.deskripsi || '');
      setFormTarget(item.targetAudiens);
      setFormAktif(Boolean(item.aktif));
      setFormUrutan(item.urutan);
    } else if (!id) {
      setFormPeriodeId(Number(selectedPeriode) || periodeList.find((row) => row.status === 'AKTIF')?.id || periodeList[0]?.id || 0);
      setFormKode(`MONEV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      setFormJudul('');
      setFormDeskripsi('');
      setFormTarget('MAHASISWA');
      setFormAktif(true);
      setFormUrutan(list.length + 1);
    }
  }, [item, id, formMode, periodeList, list.length, selectedPeriode]);
  const formError = error || (!loading && id && !item ? 'Kategori monev tidak ditemukan.' : null);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading || formError || submitting) return;
    setSubmitting(true);
    try {
      const payload = { judul: formJudul, deskripsi: formDeskripsi, targetAudiens: formTarget, aktif: formAktif, urutan: formUrutan };
      if (item) await updateMonevKategori(item.id, payload);
      else await createMonevKategori({ periodeId: formPeriodeId, kode: formKode, ...payload });
      navigate('/monev-kategori');
      loadData();
    } catch (err: unknown) {
      setNotification(deskripsikanGalat(err, 'Menyimpan Kategori', `instrumen «${formJudul}»`));
    } finally { setSubmitting(false); }
  };
  const columns: ListColumn<MonevSurveiItem>[] = [
    { key: 'urutan', header: 'Urutan', render: (row) => row.urutan },
    { key: 'kode', header: 'Kode', render: (row) => row.kode },
    { key: 'judul', header: 'Judul', render: (row) => row.judul },
    { key: 'deskripsi', header: 'Deskripsi', render: (row) => row.deskripsi || '-' },
    { key: 'periode', header: 'Periode', render: (row) => row.periode?.nama || '-' },
    { key: 'targetAudiens', header: 'Audiens', render: (row) => row.targetAudiens === 'MAHASISWA' ? 'Mahasiswa' : row.targetAudiens === 'DOSEN_TENDIK' ? 'Dosen & Tendik' : 'Semua Civitas' },
    { key: 'soal', header: 'Butir Soal', render: (row) => row._count?.pertanyaanList ?? row.totalPertanyaan ?? 0 },
    { key: 'respon', header: 'Responden', render: (row) => row._count?.responList ?? row.totalRespon ?? 0 },
    { key: 'aktif', header: 'Status', render: (row) => row.aktif ? 'Aktif' : 'Nonaktif' },
    { key: 'createdAt', header: 'Dibuat', render: (row) => 'createdAt' in row && typeof row.createdAt === 'string' ? new Date(row.createdAt).toLocaleString('id-ID') : '-' },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-[8px] bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-100 hover:text-violet-900 border border-violet-200 transition-colors"
            to={`/monev-soal?surveiId=${row.id}`}
          >
            <span>Kelola Soal</span>
            <span className="rounded-full bg-violet-200/70 px-1.5 py-0.2 text-[10px] text-violet-800">
              {row._count?.pertanyaanList ?? row.totalPertanyaan ?? 0}
            </span>
          </Link>
          <Link
            className="inline-flex min-h-[36px] items-center rounded-[8px] px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            to={`/monev-kategori/edit/${row.id}`}
          >
            Ubah
          </Link>
        </div>
      ),
    },
  ];
  const filteredList = list.filter((row) => !selectedPeriode || String(row.periodeId) === selectedPeriode);
  return <>
    {formMode ? <FormPageTemplate title={id ? 'Ubah Kategori Monev' : 'Tambah Kategori Monev'} description="Atur instrumen survei, audiens, dan urutan tampilan." backTo="/monev-kategori" isEdit={Boolean(id)} submitting={submitting} submitDisabled={loading || Boolean(formError)} error={formError} onSubmit={handleSubmit} accentClassName="bg-violet-700 hover:bg-violet-800">
      <CardContainer title="Informasi Instrumen">
        {loading && <p role="status">Memuat kategori monev...</p>}
        <fieldset disabled={loading || submitting || Boolean(formError)} className="space-y-4">
          {!id && <><label className="block text-sm font-semibold">Periode Monev<select required value={formPeriodeId || ''} onChange={(e) => setFormPeriodeId(Number(e.target.value))} className="mt-1 block w-full rounded-[12px] border border-[#CBD5E1] p-3"><option value="">Pilih Periode</option>{periodeList.map((row) => <option key={row.id} value={row.id}>{row.nama}</option>)}</select></label><label className="block text-sm font-semibold">Kode Instrumen<input required value={formKode} onChange={(e) => setFormKode(e.target.value)} className="mt-1 block w-full rounded-[12px] border border-[#CBD5E1] p-3" /></label></>}
          <label className="block text-sm font-semibold">Judul Kuesioner<input required value={formJudul} onChange={(e) => setFormJudul(e.target.value)} className="mt-1 block w-full rounded-[12px] border border-[#CBD5E1] p-3" /></label>
          <label className="block text-sm font-semibold">Deskripsi<textarea rows={3} value={formDeskripsi} onChange={(e) => setFormDeskripsi(e.target.value)} className="mt-1 block w-full rounded-[12px] border border-[#CBD5E1] p-3" /></label>
          <label className="block text-sm font-semibold">Sasaran Audiens<select value={formTarget} onChange={(e) => { const value = e.target.value; if (value === 'MAHASISWA' || value === 'DOSEN_TENDIK' || value === 'SEMUA') setFormTarget(value); }} className="mt-1 block w-full rounded-[12px] border border-[#CBD5E1] p-3"><option value="MAHASISWA">Mahasiswa</option><option value="DOSEN_TENDIK">Dosen & Tendik</option><option value="SEMUA">Semua Civitas</option></select></label>
          <label className="block text-sm font-semibold">Nomor Urutan<input type="number" required min={1} value={formUrutan} onChange={(e) => setFormUrutan(Number(e.target.value))} className="mt-1 block w-full rounded-[12px] border border-[#CBD5E1] p-3" /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formAktif} onChange={(e) => setFormAktif(e.target.checked)} />Aktifkan instrumen kuesioner ini</label>
        </fieldset>
      </CardContainer>
    </FormPageTemplate> : <ListPageTemplate title="Kategori Monev" description="Kelola instrumen kuesioner mutu dan sasaran audiens." columns={columns} rows={error ? [] : filteredList} rowKey={(row) => row.id} loading={loading} error={error} onRetry={loadData} tableTitle="Daftar Instrumen Kuesioner Monev" tableSubtitle={`Menampilkan ${filteredList.length} dari total ${list.length} instrumen.`} emptyMessage="Belum ada kategori monev." hasActiveFilter={Boolean(selectedPeriode)} filters={<label className="text-sm">Periode<select value={selectedPeriode} onChange={(e) => setSelectedPeriode(e.target.value)} className="ml-2 min-h-[44px] rounded-[12px] border border-[#CBD5E1] p-2"><option value="">Semua Periode</option>{periodeList.map((row) => <option key={row.id} value={row.id}>{row.nama}</option>)}</select></label>} actions={<div className="flex flex-wrap gap-2"><ListActionButton variant="secondary" onClick={loadData} disabled={loading}>Segarkan</ListActionButton><ListActionButton to="/monev-kategori/tambah" accentClassName="bg-violet-700 hover:bg-violet-800">Tambah Data</ListActionButton></div>} />}
    <NotificationModal isOpen={Boolean(notification)} type="error" message={notification?.message || ''} {...notification} onClose={() => setNotification(null)} />
  </>;
};
