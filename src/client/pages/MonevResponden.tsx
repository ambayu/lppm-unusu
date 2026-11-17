import React, { useEffect, useRef, useState } from 'react';
import { fetchMonevResponden, fetchMonevRespondenDetail, fetchMonevKategori, fetchMonevPeriode, MonevResponItem, MonevSurveiItem, MonevPeriodeItem } from '../services/api';
import { ListPageTemplate, ListActionButton, ListColumn } from '../components/ListPageTemplate';
import { NotificationModal } from '../components/NotificationModal';
import { deskripsikanGalat, DeskripsiGalat } from '../lib/galat';

export const MonevRespondenPage: React.FC = () => {
  const [list, setList] = useState<MonevResponItem[]>([]);
  const [periodeList, setPeriodeList] = useState<MonevPeriodeItem[]>([]);
  const [surveiList, setSurveiList] = useState<MonevSurveiItem[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState('');
  const [selectedSurvei, setSelectedSurvei] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<DeskripsiGalat | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<MonevResponItem | null>(null);
  const detailDialog = useRef<HTMLDialogElement>(null);
  const detailRequest = useRef(0);
  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchMonevResponden({ periodeId: selectedPeriode || undefined, surveiId: selectedSurvei || undefined, page, limit: 20 }).then((res) => {
      setList(res.data.data || []);
      setTotal(res.data.meta.total);
    }).catch((err: unknown) => {
      setError(deskripsikanGalat(err, 'Memuat Responden', 'log responden monev').details.map((detail) => detail.message).join(' '));
    }).finally(() => setLoading(false));
  };
  useEffect(() => {
    Promise.all([fetchMonevPeriode(), fetchMonevKategori()]).then(([periode, survei]) => {
      setPeriodeList(periode.data.data || []);
      setSurveiList(survei.data.data || []);
    }).catch((err: unknown) => setNotification(deskripsikanGalat(err, 'Memuat Filter', 'periode dan instrumen monev')));
  }, []);
  useEffect(loadData, [selectedPeriode, selectedSurvei, page]);
  const handleLihatDetail = async (id: number) => {
    const request = ++detailRequest.current;
    setDetailData(null);
    setDetailLoading(true);
    detailDialog.current?.showModal();
    try {
      const res = await fetchMonevRespondenDetail(id);
      if (request === detailRequest.current) setDetailData(res.data.data);
    } catch (err: unknown) {
      if (request !== detailRequest.current) return;
      detailDialog.current?.close();
      setNotification(deskripsikanGalat(err, 'Memuat Jawaban', `responden #${id}`));
    } finally {
      if (request === detailRequest.current) setDetailLoading(false);
    }
  };
  const handleExportCsv = () => {
    if (!list.length) return;
    const escapeCell = (value: string | number) => `"${String(value).replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""')}"`;
    const rows = list.map((row) => [row.id, `${row.respondenHash.substring(0, 16)}...`, row.survei?.judul || '-', row.periode?.nama || '-', row.prodi || '-', row.semester || '-', row.createdAt]);
    const csv = [['ID Respon', 'Hash Anonim', 'Instrumen', 'Periode', 'Prodi', 'Semester', 'Waktu Kirim'], ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `daftar-responden-monev-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const columns: ListColumn<MonevResponItem>[] = [
    { key: 'id', header: 'ID', render: (row) => row.id },
    { key: 'hash', header: 'Hash Anonim', render: (row) => `${row.respondenHash.substring(0, 16)}...` },
    { key: 'surveiKode', header: 'Kode Instrumen', render: (row) => row.survei?.kode || '-' },
    { key: 'survei', header: 'Instrumen', render: (row) => row.survei?.judul || '-' },
    { key: 'periode', header: 'Periode', render: (row) => row.periode?.nama || '-' },
    { key: 'prodi', header: 'Prodi', render: (row) => row.prodi || '-' },
    { key: 'mataKuliah', header: 'Mata Kuliah', render: (row) => row.mataKuliah || '-' },
    { key: 'semester', header: 'Semester', render: (row) => row.semester || '-' },
    { key: 'createdAt', header: 'Dibuat', render: (row) => new Date(row.createdAt).toLocaleString('id-ID') },
    { key: 'aksi', header: 'Aksi', render: (row) => <button type="button" className="min-h-[44px] text-violet-700 font-semibold" onClick={() => handleLihatDetail(row.id)}>Lihat Jawaban</button> },
  ];
  return <>
    <ListPageTemplate title="Monev Responden" description="Pantau partisipasi dan jawaban anonim pada instrumen survei mutu." columns={columns} rows={error ? [] : list} rowKey={(row) => row.id} loading={loading} error={error} onRetry={loadData} minTableWidth="min-w-[1560px]" tableTitle="Daftar Log Responden Masuk" tableSubtitle={`Menampilkan ${list.length} dari total ${total} responden. Ekspor CSV mencakup halaman yang sedang ditampilkan.`} emptyMessage="Belum ada responden monev." hasActiveFilter={Boolean(selectedPeriode || selectedSurvei)} actions={<div className="flex flex-wrap gap-2"><ListActionButton variant="secondary" onClick={loadData} disabled={loading}>Segarkan</ListActionButton><ListActionButton variant="secondary" onClick={handleExportCsv} disabled={loading || Boolean(error) || !list.length}>Ekspor CSV Halaman Ini</ListActionButton></div>} filters={<>
      <label className="text-sm">Periode<select value={selectedPeriode} onChange={(e) => { setSelectedPeriode(e.target.value); setPage(1); }} className="ml-2 min-h-[44px] rounded-[12px] border border-[#CBD5E1] p-2"><option value="">Semua Periode</option>{periodeList.map((row) => <option key={row.id} value={row.id}>{row.nama}</option>)}</select></label>
      <label className="text-sm">Instrumen<select value={selectedSurvei} onChange={(e) => { setSelectedSurvei(e.target.value); setPage(1); }} className="ml-2 min-h-[44px] rounded-[12px] border border-[#CBD5E1] p-2"><option value="">Semua Instrumen</option>{surveiList.map((row) => <option key={row.id} value={row.id}>{row.judul}</option>)}</select></label>
    </>} footer={<nav aria-label="Paginasi responden" className="flex flex-wrap items-center justify-end gap-3 pt-4 text-sm"><button type="button" className="min-h-[44px] disabled:opacity-50" disabled={loading || page <= 1} onClick={() => setPage((value) => value - 1)}>Sebelumnya</button><span>Halaman {page} dari {Math.max(1, Math.ceil(total / 20))}</span><button type="button" className="min-h-[44px] disabled:opacity-50" disabled={loading || page * 20 >= total} onClick={() => setPage((value) => value + 1)}>Berikutnya</button></nav>} />
    <dialog ref={detailDialog} aria-labelledby="monev-detail-title" onClose={() => { detailRequest.current += 1; }} className="m-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl rounded-[16px] border border-[#CBD5E1] bg-white p-6 text-slate-800 backdrop:bg-slate-900/40">
      <div className="flex items-center justify-between gap-4"><h2 id="monev-detail-title" className="text-lg font-bold">Rincian Jawaban Responden {detailData ? `#${detailData.id}` : ''}</h2><button type="button" className="min-h-[44px] text-violet-700" onClick={() => detailDialog.current?.close()}>Tutup</button></div>
      {detailLoading ? <p role="status" className="py-8">Memuat rincian jawaban...</p> : !detailData ? <p>Data tidak ditemukan.</p> : <div className="mt-4 space-y-5">
        <p className="text-sm">{detailData.survei?.judul} • {detailData.periode?.nama}</p>
        <section className="rounded-[12px] border border-[#CBD5E1] bg-slate-50 p-4"><h3 className="font-bold">Data Demografi Pengisi</h3><dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">{[['Prodi', detailData.prodi], ['Fakultas', detailData.fakultas], ['Semester', detailData.semester], ['Mata Kuliah', detailData.mataKuliah], ['Dosen Pengampu', detailData.dosenPengampu]].map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd>{value || '-'}</dd></div>)}</dl></section>
        <section><h3 className="mb-3 font-bold">Jawaban Pertanyaan</h3><div className="space-y-3">{detailData.jawabanList?.map((jawaban, index) => <div key={jawaban.id} className="rounded-[12px] border border-[#CBD5E1] p-4 text-sm"><p className="font-semibold">{index + 1}. {jawaban.pertanyaan?.teks}</p>{jawaban.nilaiSkala != null && <p className="mt-2">Skor: {jawaban.nilaiSkala}</p>}{jawaban.nilaiTeks && <p className="mt-2 whitespace-pre-wrap">{jawaban.nilaiTeks}</p>}</div>)}{!detailData.jawabanList?.length && <p className="text-sm text-slate-500">Belum ada jawaban.</p>}</div></section>
      </div>}
    </dialog>
    <NotificationModal isOpen={Boolean(notification)} type="error" message={notification?.message || ''} {...notification} onClose={() => setNotification(null)} />
  </>;
};
