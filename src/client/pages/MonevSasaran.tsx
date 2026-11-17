import React, { useEffect, useState } from 'react';
import { ArrowPathIcon, PencilSquareIcon, PlusIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Link, useMatch, useNavigate, useParams } from 'react-router-dom';
import {
  fetchMonevSasaranAudiens,
  createMonevSasaranAudiens,
  updateMonevSasaranAudiens,
  deleteMonevSasaranAudiens,
  MonevSasaranAudiensItem,
} from '../services/api';
import { ListPageTemplate, ListActionButton, ListColumn, RowActionButton } from '../components/ListPageTemplate';
import { FormPageTemplate } from '../components/FormPageTemplate';
import { CardContainer } from '../components/CardContainer';
import { NotificationModal } from '../components/NotificationModal';
import { deskripsikanGalat, DeskripsiGalat } from '../lib/galat';

export const MonevSasaranPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const formMode = Boolean(useMatch('/admin/monev-sasaran/tambah')) || Boolean(id);
  const navigate = useNavigate();

  const [list, setList] = useState<MonevSasaranAudiensItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<DeskripsiGalat | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MonevSasaranAudiensItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form states
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [sublabel, setSublabel] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [badge, setBadge] = useState('');
  const [ikon, setIkon] = useState('UserGroupIcon');
  const [urutan, setUrutan] = useState(1);
  const [aktif, setAktif] = useState(true);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchMonevSasaranAudiens()
      .then((res) => setList(res.data.data || []))
      .catch((err: unknown) => {
        const failure = deskripsikanGalat(err, 'Memuat Sasaran Audiens', 'daftar sasaran monev');
        setError(failure.details.map((detail) => detail.message).join(' '));
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const item = id ? list.find((row) => String(row.id) === id) : undefined;

  useEffect(() => {
    if (item) {
      setKode(item.kode);
      setNama(item.nama);
      setSublabel(item.sublabel || '');
      setDeskripsi(item.deskripsi || '');
      setBadge(item.badge || '');
      setIkon(item.ikon || 'UserGroupIcon');
      setUrutan(item.urutan || 0);
      setAktif(item.aktif);
    } else if (!id) {
      setKode('');
      setNama('');
      setSublabel('');
      setDeskripsi('');
      setBadge('');
      setIkon('UserGroupIcon');
      setUrutan(list.length + 1);
      setAktif(true);
    }
  }, [item, id, formMode, list.length]);

  const formError = error || (!loading && id && !item ? 'Sasaran audiens tidak ditemukan.' : null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading || formError || submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        nama,
        sublabel,
        deskripsi,
        badge,
        ikon,
        urutan: Number(urutan),
        aktif,
      };
      if (item) {
        await updateMonevSasaranAudiens(item.id, payload);
      } else {
        await createMonevSasaranAudiens({ kode, ...payload });
      }
      navigate('/admin/monev-sasaran');
      loadData();
    } catch (err: unknown) {
      setNotification(deskripsikanGalat(err, 'Menyimpan Sasaran Audiens', `sasaran «${nama}»`));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteMonevSasaranAudiens(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    } catch (err: unknown) {
      setNotification(deskripsikanGalat(err, 'Menghapus Sasaran Audiens', `sasaran «${deleteTarget.nama}»`));
    } finally {
      setDeleting(false);
    }
  };

  const columns: ListColumn<MonevSasaranAudiensItem>[] = [
    { key: 'urutan', header: 'Urutan', render: (row) => <span className="font-bold text-slate-700">{row.urutan}</span> },
    { key: 'kode', header: 'Kode', render: (row) => <span className="font-mono text-xs font-bold text-violet-700">{row.kode}</span> },
    { key: 'nama', header: 'Nama Sasaran', render: (row) => (
      <div>
        <div className="font-bold text-slate-900">{row.nama}</div>
        <div className="text-xs text-slate-500">{row.sublabel || '-'}</div>
      </div>
    )},
    { key: 'badge', header: 'Badge Tampilan', render: (row) => row.badge ? <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 border border-violet-100">{row.badge}</span> : '-' },
    { key: 'status', header: 'Status', render: (row) => (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${row.aktif ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
        {row.aktif ? 'Aktif' : 'Nonaktif'}
      </span>
    )},
    {
      key: 'aksi',
      header: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <RowActionButton label="Ubah sasaran" to={`/admin/monev-sasaran/edit/${row.id}`}>
            <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
          </RowActionButton>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            title="Hapus sasaran"
            aria-label={`Hapus sasaran ${row.nama}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          >
            <TrashIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {formMode ? (
        <FormPageTemplate
          title={id ? 'Ubah Sasaran Audiens' : 'Tambah Sasaran Audiens'}
          description="Atur kelompok sasaran audiens responden monev mutu."
          backTo="/admin/monev-sasaran"
          isEdit={Boolean(id)}
          submitting={submitting}
          submitDisabled={loading || Boolean(formError)}
          error={formError}
          onSubmit={handleSubmit}
          accentClassName="bg-violet-700 hover:bg-violet-800"
        >
          <CardContainer title="Informasi Sasaran Audiens">
            {loading && <p role="status">Memuat data sasaran...</p>}
            <fieldset disabled={loading || submitting || Boolean(formError)} className="space-y-4">
              <label className="block text-xs font-bold text-slate-700">
                Kode Sasaran (Uppercase, tanpa spasi)
                <input
                  required
                  disabled={Boolean(id)}
                  value={kode}
                  onChange={(e) => setKode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                  placeholder="Contoh: ALUMNI, MITRA, DOSEN_TENDIK"
                  className="mt-1 block min-h-[44px] w-full rounded-[12px] border border-[#CBD5E1] p-3 text-sm font-normal focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20"
                />
              </label>

              <label className="block text-xs font-bold text-slate-700">
                Nama Sasaran
                <input
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Alumni & Lulusan"
                  className="mt-1 block min-h-[44px] w-full rounded-[12px] border border-[#CBD5E1] p-3 text-sm font-normal focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20"
                />
              </label>

              <label className="block text-xs font-bold text-slate-700">
                Sublabel Singkat
                <input
                  value={sublabel}
                  onChange={(e) => setSublabel(e.target.value)}
                  placeholder="Contoh: Survei Tracer Study & Kesesuaian Bidang Kerja"
                  className="mt-1 block min-h-[44px] w-full rounded-[12px] border border-[#CBD5E1] p-3 text-sm font-normal focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20"
                />
              </label>

              <label className="block text-xs font-bold text-slate-700">
                Badge Tampilan (Pill)
                <input
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="Contoh: Lulusan & Alumni"
                  className="mt-1 block min-h-[44px] w-full rounded-[12px] border border-[#CBD5E1] p-3 text-sm font-normal focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-xs font-bold text-slate-700">
                  Ikon Representatif
                  <select
                    value={ikon}
                    onChange={(e) => setIkon(e.target.value)}
                    className="mt-1 block min-h-[44px] w-full rounded-[12px] border border-[#CBD5E1] p-3 text-sm font-normal focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20"
                  >
                    <option value="AcademicCapIcon">AcademicCap (Mahasiswa/Akademik)</option>
                    <option value="BriefcaseIcon">Briefcase (Dosen/Tendik/Karier)</option>
                    <option value="BuildingLibraryIcon">BuildingLibrary (Institusi/Umum)</option>
                    <option value="UserGroupIcon">UserGroup (Masyarakat/Komunitas)</option>
                  </select>
                </label>

                <label className="block text-xs font-bold text-slate-700">
                  Urutan Tampilan
                  <input
                    type="number"
                    min="1"
                    value={urutan}
                    onChange={(e) => setUrutan(Number(e.target.value))}
                    className="mt-1 block min-h-[44px] w-full rounded-[12px] border border-[#CBD5E1] p-3 text-sm font-normal focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20"
                  />
                </label>
              </div>

              <label className="block text-xs font-bold text-slate-700">
                Status Sasaran
                <select
                  value={aktif ? 'true' : 'false'}
                  onChange={(e) => setAktif(e.target.value === 'true')}
                  className="mt-1 block min-h-[44px] w-full rounded-[12px] border border-[#CBD5E1] p-3 text-sm font-normal focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20"
                >
                  <option value="true">Aktif (Tampil di Publik)</option>
                  <option value="false">Nonaktif (Disembunyikan)</option>
                </select>
              </label>

              <label className="block text-xs font-bold text-slate-700">
                Deskripsi Sasaran
                <textarea
                  rows={3}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Penjelasan sasaran responden yang akan tampil di kartu publik..."
                  className="mt-1 block min-h-[44px] w-full rounded-[12px] border border-[#CBD5E1] p-3 text-sm font-normal focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-600/20"
                />
              </label>
            </fieldset>
          </CardContainer>
        </FormPageTemplate>
      ) : (
        <ListPageTemplate
          title="Master Sasaran Audiens Monev"
          description="Kelola kelompok sasaran responden (Mahasiswa, Dosen, Tendik, Alumni, dll) untuk kuesioner mutu."
          columns={columns}
          rows={error ? [] : list}
          rowKey={(row) => row.id}
          loading={loading}
          error={error}
          onRetry={loadData}
          tableTitle="Daftar Sasaran Audiens"
          tableSubtitle={`Menampilkan ${list.length} sasaran responden.`}
          emptyMessage="Belum ada sasaran audiens."
          filters={
            <Link to="/monev-survei" className="text-sm font-semibold text-violet-700">
              Lihat Tampilan Publik
            </Link>
          }
          actions={
            <div className="flex flex-wrap gap-2">
              <ListActionButton
                variant="secondary"
                onClick={loadData}
                disabled={loading}
                icon={<ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />}
              >
                Segarkan
              </ListActionButton>
              <ListActionButton
                to="/admin/monev-sasaran/tambah"
                icon={<PlusIcon className="h-4 w-4" aria-hidden="true" />}
                accentClassName="bg-violet-700 hover:bg-violet-800"
              >
                Tambah Sasaran
              </ListActionButton>
            </div>
          }
        />
      )}

      {deleteTarget && (
        <NotificationModal
          isOpen={Boolean(deleteTarget)}
          type="confirm"
          title="Hapus Sasaran Audiens"
          message={`Apakah Anda yakin ingin menghapus sasaran «${deleteTarget.nama}» (${deleteTarget.kode})? Sasaran hanya dapat dihapus bila tidak sedang digunakan oleh instrumen kuesioner.`}
          confirmLabel={deleting ? 'Menghapus...' : 'Ya, Hapus'}
          cancelLabel="Batal"
          onConfirm={handleDelete}
          onClose={() => !deleting && setDeleteTarget(null)}
        />
      )}

      <NotificationModal
        isOpen={Boolean(notification)}
        type="error"
        message={notification?.message || ''}
        {...notification}
        onClose={() => setNotification(null)}
      />
    </>
  );
};
