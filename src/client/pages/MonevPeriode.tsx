import React, { useEffect, useState } from 'react';
import { Link, useMatch, useNavigate, useParams } from 'react-router-dom';
import { fetchMonevPeriode, createMonevPeriode, updateMonevPeriode, MonevPeriodeItem } from '../services/api';
import { ListPageTemplate, ListActionButton, ListColumn } from '../components/ListPageTemplate';
import { FormPageTemplate } from '../components/FormPageTemplate';
import { CardContainer } from '../components/CardContainer';
import { NotificationModal } from '../components/NotificationModal';
import { deskripsikanGalat, DeskripsiGalat } from '../lib/galat';

export const MonevPeriodePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const formMode = Boolean(useMatch('/admin/monev-periode/tambah')) || Boolean(id);
  const navigate = useNavigate();
  const [list, setList] = useState<MonevPeriodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<DeskripsiGalat | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const year = new Date().getFullYear();
  const [kode, setKode] = useState(`PERIODE-${year}-GENAP`);
  const [nama, setNama] = useState(`Monev Mutu Semester Genap T.A. ${year - 1}/${year}`);
  const [tahunAkademik, setTahunAkademik] = useState(`${year - 1}/${year}`);
  const [semester, setSemester] = useState('Genap');
  const [status, setStatus] = useState<MonevPeriodeItem['status']>('AKTIF');
  const [deskripsi, setDeskripsi] = useState('');
  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchMonevPeriode().then((res) => setList(res.data.data || [])).catch((err: unknown) => {
      const failure = deskripsikanGalat(err, 'Memuat Periode', 'daftar periode monev');
      setError(failure.details.map((detail) => detail.message).join(' '));
    }).finally(() => setLoading(false));
  };
  useEffect(loadData, []);
  const item = id ? list.find((row) => String(row.id) === id) : undefined;
  useEffect(() => {
    if (item) {
      setKode(item.kode);
      setNama(item.nama);
      setTahunAkademik(item.tahunAkademik);
      setSemester(item.semester);
      setStatus(item.status);
      setDeskripsi(item.deskripsi || '');
    } else if (!id) {
      setKode(`PERIODE-${year}-GENAP`);
      setNama(`Monev Mutu Semester Genap T.A. ${year - 1}/${year}`);
      setTahunAkademik(`${year - 1}/${year}`);
      setSemester('Genap');
      setStatus('AKTIF');
      setDeskripsi('');
    }
  }, [item, id, formMode, year]);
  const formError = error || (!loading && id && !item ? 'Periode monev tidak ditemukan.' : null);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading || formError || submitting) return;
    setSubmitting(true);
    try {
      const payload = { nama, tahunAkademik, semester, status, deskripsi };
      if (item) await updateMonevPeriode(item.id, payload);
      else await createMonevPeriode({ kode, ...payload });
      navigate('/admin/monev-periode');
      loadData();
    } catch (err: unknown) {
      setNotification(deskripsikanGalat(err, 'Menyimpan Periode', `periode «${nama}»`));
    } finally { setSubmitting(false); }
  };
  const columns: ListColumn<MonevPeriodeItem>[] = [
    { key: 'kode', header: 'Kode', render: (row) => row.kode },
    { key: 'nama', header: 'Nama', render: (row) => row.nama },
    { key: 'deskripsi', header: 'Deskripsi', render: (row) => row.deskripsi || '-' },
    { key: 'tahunAkademik', header: 'Tahun Akademik', render: (row) => row.tahunAkademik },
    { key: 'semester', header: 'Semester', render: (row) => row.semester },
    { key: 'survei', header: 'Instrumen', render: (row) => row._count?.surveiList ?? 0 },
    { key: 'status', header: 'Status', render: (row) => row.status },
    { key: 'createdAt', header: 'Dibuat', render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleString('id-ID') : '-' },
    { key: 'aksi', header: 'Aksi', render: (row) => <Link className="inline-flex min-h-[44px] items-center font-semibold text-violet-700" to={`/admin/monev-periode/edit/${row.id}`}>Ubah</Link> },
  ];
  return <>
    {formMode ? <FormPageTemplate title={id ? 'Ubah Periode Monev' : 'Tambah Periode Monev'} description="Atur masa pengisian kuesioner monev." backTo="/admin/monev-periode" isEdit={Boolean(id)} submitting={submitting} submitDisabled={loading || Boolean(formError)} error={formError} onSubmit={handleSubmit} accentClassName="bg-violet-700 hover:bg-violet-800">
      <CardContainer title="Informasi Periode">
        {loading && <p role="status">Memuat periode monev...</p>}
        <fieldset disabled={loading || submitting || Boolean(formError)} className="space-y-4">
          <label className="block text-sm font-semibold">Kode Periode<input required disabled={Boolean(id)} value={kode} onChange={(e) => setKode(e.target.value)} className="mt-1 block w-full rounded-[12px] border border-[#CBD5E1] p-3" /></label>
          <label className="block text-sm font-semibold">Nama Periode<input required value={nama} onChange={(e) => setNama(e.target.value)} className="mt-1 block w-full rounded-[12px] border border-[#CBD5E1] p-3" /></label>
          <label className="block text-sm font-semibold">Tahun Akademik<input required value={tahunAkademik} onChange={(e) => setTahunAkademik(e.target.value)} className="mt-1 block w-full rounded-[12px] border border-[#CBD5E1] p-3" /></label>
          <label className="block text-sm font-semibold">Semester<select value={semester} onChange={(e) => setSemester(e.target.value)} className="mt-1 block w-full rounded-[12px] border border-[#CBD5E1] p-3"><option>Ganjil</option><option>Genap</option><option>Antara</option></select></label>
          <label className="block text-sm font-semibold">Status<select value={status} onChange={(e) => { const value = e.target.value; if (value === 'AKTIF' || value === 'DRAFT' || value === 'DITUTUP') setStatus(value); }} className="mt-1 block w-full rounded-[12px] border border-[#CBD5E1] p-3"><option value="AKTIF">AKTIF</option><option value="DRAFT">DRAFT</option><option value="DITUTUP">DITUTUP</option></select></label>
          <p className="text-sm text-slate-500">Mengaktifkan periode ini otomatis menutup periode aktif lainnya.</p>
          <label className="block text-sm font-semibold">Deskripsi<textarea rows={3} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} className="mt-1 block w-full rounded-[12px] border border-[#CBD5E1] p-3" /></label>
        </fieldset>
      </CardContainer>
    </FormPageTemplate> : <ListPageTemplate title="Master Periode Monev" description="Kelola tahun akademik, semester, dan status masa pengisian kuesioner monev." columns={columns} rows={error ? [] : list} rowKey={(row) => row.id} loading={loading} error={error} onRetry={loadData} tableTitle="Daftar Periode Survei Mutu" tableSubtitle={`Menampilkan ${list.length} periode monev.`} emptyMessage="Belum ada periode monev." filters={<Link to="/monev-survei" className="text-sm font-semibold text-violet-700">Lihat Kuesioner Publik</Link>} actions={<div className="flex flex-wrap gap-2"><ListActionButton variant="secondary" onClick={loadData} disabled={loading}>Segarkan</ListActionButton><ListActionButton to="/admin/monev-periode/tambah" accentClassName="bg-violet-700 hover:bg-violet-800">Tambah Data</ListActionButton></div>} />}
    <NotificationModal isOpen={Boolean(notification)} type="error" message={notification?.message || ''} {...notification} onClose={() => setNotification(null)} />
  </>;
};
