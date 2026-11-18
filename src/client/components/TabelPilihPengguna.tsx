import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  cariKandidatPengguna,
  type KandidatPenggunaOne,
  type KriteriaKandidat,
} from '../services/api';
import { DataTable, type DataTableColumn } from './DataTable';

/**
 * TabelPilihPengguna — direktori ONE UNUSU dalam bentuk tabel bercentang dengan Paginasi.
 */

const LABEL_PERAN: Record<string, string> = {
  SUPERADMIN: 'Superadmin',
  ADMIN: 'Administrator',
  DOSEN: 'Dosen',
  MAHASISWA: 'Mahasiswa',
  TENDIK: 'Tendik',
};

function labelPeran(kode: string | null | undefined): string {
  if (!kode) return '—';
  return LABEL_PERAN[kode.toUpperCase()] ?? kode;
}

/** Dua huruf pertama nama untuk avatar cadangan. */
function inisial(nama: string): string {
  const bagian = nama.trim().split(/\s+/).filter(Boolean);
  if (bagian.length === 0) return '?';
  if (bagian.length === 1) return bagian[0].slice(0, 2).toUpperCase();
  return (bagian[0][0] + bagian[bagian.length - 1][0]).toUpperCase();
}

export interface TabelPilihPenggunaProps {
  /** Id pengguna yang sedang dicentang. Dikendalikan induk agar bisa dikirim bersama peran. */
  terpilih: number[];
  onUbahTerpilih: (ids: number[]) => void;
  /** Pengguna yang sudah menjadi anggota — barisnya tidak dapat dicentang. */
  idTerdaftar?: number[];
}

export const TabelPilihPengguna: React.FC<TabelPilihPenggunaProps> = ({
  terpilih,
  onUbahTerpilih,
  idTerdaftar = [],
}) => {
  const [baris, setBaris] = useState<KandidatPenggunaOne[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState<string | null>(null);

  const [kataKunci, setKataKunci] = useState('');
  const [filterPeran, setFilterPeran] = useState('');
  const [filterFakultas, setFilterFakultas] = useState('');
  const [filterProdi, setFilterProdi] = useState('');

  // Pagination states
  const [halaman, setHalaman] = useState(1);
  const [perHalaman, setPerHalaman] = useState(10);

  // Daftar opsi filter diambil dari hasil terakhir yang belum disaring
  const [opsiFakultas, setOpsiFakultas] = useState<string[]>([]);
  const [opsiProdi, setOpsiProdi] = useState<string[]>([]);

  const sudahTerdaftar = useMemo(() => new Set(idTerdaftar), [idTerdaftar]);

  const permintaanTerakhir = useRef(0);

  const muat = useCallback(async (kriteria: KriteriaKandidat) => {
    const nomor = ++permintaanTerakhir.current;
    setMemuat(true);
    setGalat(null);
    try {
      const res = await cariKandidatPengguna(kriteria);
      if (nomor !== permintaanTerakhir.current) return;

      const data = res.data?.data ?? [];
      setBaris(data);
      setHalaman(1); // Reset ke halaman pertama setiap kali data baru dimuat

      const tanpaFilter = !kriteria.role && !kriteria.fakultas && !kriteria.prodi && !kriteria.search;
      if (tanpaFilter) {
        const fakultas = Array.from(
          new Set(data.map((u) => (u.fakultas ?? '').trim()).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b, 'id'));
        const prodi = Array.from(
          new Set(data.map((u) => (u.prodi ?? '').trim()).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b, 'id'));
        setOpsiFakultas(fakultas);
        setOpsiProdi(prodi);
      }
    } catch (err: any) {
      if (nomor !== permintaanTerakhir.current) return;
      setBaris([]);
      setGalat(
        err?.response?.data?.message || err?.message || 'Gagal memuat direktori ONE UNUSU.'
      );
    } finally {
      if (nomor === permintaanTerakhir.current) setMemuat(false);
    }
  }, []);

  useEffect(() => {
    void muat({});
  }, [muat]);

  const kriteriaSekarang = useCallback(
    (): KriteriaKandidat => ({
      ...(kataKunci.trim().length >= 2 ? { search: kataKunci.trim() } : {}),
      ...(filterPeran ? { role: filterPeran } : {}),
      ...(filterFakultas ? { fakultas: filterFakultas } : {}),
      ...(filterProdi ? { prodi: filterProdi } : {}),
    }),
    [kataKunci, filterPeran, filterFakultas, filterProdi]
  );

  useEffect(() => {
    const kw = kataKunci.trim();
    if (kw.length < 2) return;
    const jeda = setTimeout(() => {
      void muat(kriteriaSekarang());
    }, 400);
    return () => clearTimeout(jeda);
  }, [kataKunci, kriteriaSekarang, muat]);

  const terapkanFilter = () => {
    const kw = kataKunci.trim();
    if (kw.length === 1) {
      setGalat('Ketik minimal 2 karakter untuk mencari, atau kosongkan kolom pencarian.');
      return;
    }
    void muat(kriteriaSekarang());
  };

  const aturUlang = () => {
    setKataKunci('');
    setFilterPeran('');
    setFilterFakultas('');
    setFilterProdi('');
    void muat({});
  };

  // Perhitungan Pagination
  const totalData = baris.length;
  const totalHalaman = Math.max(1, Math.ceil(totalData / perHalaman));
  const halamanAman = Math.min(Math.max(1, halaman), totalHalaman);
  const indeksAwal = (halamanAman - 1) * perHalaman;
  const barisHalamanIni = useMemo(() => {
    return baris.slice(indeksAwal, indeksAwal + perHalaman);
  }, [baris, indeksAwal, perHalaman]);

  const bisaDipilih = (u: KandidatPenggunaOne) => !sudahTerdaftar.has(u.id);

  // Checkbox halaman ini
  const semuaTerpilihHalamanIni =
    barisHalamanIni.length > 0 &&
    barisHalamanIni.filter(bisaDipilih).every((u) => terpilih.includes(u.id));

  const toggleSatu = (u: KandidatPenggunaOne) => {
    if (!bisaDipilih(u)) return;
    onUbahTerpilih(
      terpilih.includes(u.id) ? terpilih.filter((x) => x !== u.id) : [...terpilih, u.id]
    );
  };

  const toggleSemuaHalamanIni = () => {
    const idBoleh = barisHalamanIni.filter(bisaDipilih).map((u) => u.id);
    if (semuaTerpilihHalamanIni) {
      onUbahTerpilih(terpilih.filter((x) => !idBoleh.includes(x)));
    } else {
      onUbahTerpilih(Array.from(new Set([...terpilih, ...idBoleh])));
    }
  };

  const gayaKontrol =
    'w-full px-4 py-3 min-h-[44px] text-xs rounded-[10px] border border-[#D8E5DC] bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#166534] focus:border-[#166534]';

  const kolom: DataTableColumn<KandidatPenggunaOne>[] = [
    {
      key: 'pilih',
      header: (
        <input
          type="checkbox"
          aria-label="Pilih semua pengguna pada halaman ini"
          checked={semuaTerpilihHalamanIni}
          onChange={toggleSemuaHalamanIni}
          disabled={memuat || barisHalamanIni.filter(bisaDipilih).length === 0}
          className="w-4 h-4 accent-[#166534] cursor-pointer"
        />
      ),
      headerClassName: 'w-12 text-center',
      cellClassName: 'text-center',
      render: (u) => (
        <input
          type="checkbox"
          aria-label={`Pilih ${u.nama}`}
          checked={terpilih.includes(u.id)}
          disabled={!bisaDipilih(u)}
          onChange={() => toggleSatu(u)}
          className="w-4 h-4 accent-[#166534] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        />
      ),
    },
    {
      key: 'nomor',
      header: 'No',
      headerClassName: 'w-12 text-center',
      cellClassName: 'font-mono text-slate-500 text-center text-xs',
      render: (_u, idx) => indeksAwal + idx + 1,
    },
    {
      key: 'nama',
      header: 'Nama',
      render: (u) => (
        <div className="flex items-center gap-2.5">
          {u.avatar ? (
            <img
              src={u.avatar}
              alt=""
              className="w-8 h-8 rounded-full object-cover border border-[#D8E5DC] flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <span
              aria-hidden="true"
              className="w-8 h-8 rounded-full bg-[#DCFCE7] text-[#166534] font-bold flex items-center justify-center flex-shrink-0"
            >
              {inisial(u.nama)}
            </span>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">{u.nama}</p>
            <p className="text-slate-500 font-mono truncate">
              {u.nidn || u.nim || u.username} {u.email ? `• ${u.email}` : ''}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Peran', render: (u) => labelPeran(u.role) },
    {
      key: 'fakultas',
      header: 'Fakultas',
      cellClassName: 'text-slate-600 max-w-[180px]',
      render: (u) => <span className="line-clamp-2">{u.fakultas || '—'}</span>,
    },
    {
      key: 'prodi',
      header: 'Program Studi',
      cellClassName: 'text-slate-600 max-w-[180px]',
      render: (u) => <span className="line-clamp-2">{u.prodi || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => sudahTerdaftar.has(u.id) ? (
        <span className="inline-flex items-center gap-1 font-bold text-slate-500 text-xs">
          <CheckCircleIcon className="w-3.5 h-3.5" />
          Terdaftar
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 font-bold text-[#166534] text-xs">
          <UserCircleIcon className="w-3.5 h-3.5" />
          Bisa ditambahkan
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-3.5">
      {/* ---------- Pencarian & filter ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
        <div className="md:col-span-4">
          <label htmlFor="cari-kandidat" className="block text-xs font-semibold text-slate-700 mb-1">
            Cari nama / NIDN / NIM
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="cari-kandidat"
              type="search"
              value={kataKunci}
              onChange={(e) => setKataKunci(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  terapkanFilter();
                }
              }}
              placeholder="Minimal 2 karakter"
              className={`${gayaKontrol} pl-9`}
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="filter-peran" className="block text-xs font-semibold text-slate-700 mb-1">
            Peran
          </label>
          <select
            id="filter-peran"
            value={filterPeran}
            onChange={(e) => setFilterPeran(e.target.value)}
            className={gayaKontrol}
          >
            <option value="">Semua</option>
            <option value="DOSEN">Dosen</option>
            <option value="MAHASISWA">Mahasiswa</option>
            <option value="TENDIK">Tendik</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <label htmlFor="filter-fakultas" className="block text-xs font-semibold text-slate-700 mb-1">
            Fakultas
          </label>
          <select
            id="filter-fakultas"
            value={filterFakultas}
            onChange={(e) => setFilterFakultas(e.target.value)}
            className={gayaKontrol}
          >
            <option value="">Semua</option>
            {opsiFakultas.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <label htmlFor="filter-prodi" className="block text-xs font-semibold text-slate-700 mb-1">
            Program Studi
          </label>
          <select
            id="filter-prodi"
            value={filterProdi}
            onChange={(e) => setFilterProdi(e.target.value)}
            className={gayaKontrol}
          >
            <option value="">Semua</option>
            {opsiProdi.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={terapkanFilter}
          disabled={memuat}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#166534] hover:bg-[#14532d] text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
        >
          <MagnifyingGlassIcon className="w-4 h-4" />
          Terapkan
        </button>
        <button
          type="button"
          onClick={aturUlang}
          disabled={memuat}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] border border-[#D8E5DC] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Atur ulang
        </button>
        <p className="text-[11px] text-slate-500 ml-auto">
          {memuat ? (
            'Memuat direktori...'
          ) : (
            <span>
              Total <strong>{totalData}</strong> pengguna ditemukan
            </span>
          )}
          {terpilih.length > 0 && (
            <span className="ml-2 font-bold text-[#166534]">({terpilih.length} dipilih)</span>
          )}
        </p>
      </div>

      {galat && (
        <div
          role="alert"
          className="px-4 py-3 rounded-[10px] bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold"
        >
          {galat}
        </div>
      )}

      {/* ---------- Tabel Data ---------- */}
      <div className="rounded-[12px] border border-[#D8E5DC] overflow-hidden">
        <DataTable
          columns={kolom}
          rows={barisHalamanIni}
          rowKey={(u) => u.id}
          size="sm"
          emptyMessage={
            memuat
              ? 'Memuat direktori ONE UNUSU...'
              : galat
              ? null
              : 'Tidak ada pengguna yang cocok. Coba ubah kata kunci atau filter.'
          }
          className="[&_tbody_tr:has(input:disabled)]:!bg-slate-50 [&_tbody_tr:has(input:checked:not(:disabled))]:!bg-[#F0FDF4]"
        />
      </div>

      {/* ---------- Navigasi Paginasi ---------- */}
      {!memuat && totalData > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Baris per halaman:</span>
            <select
              value={perHalaman}
              onChange={(e) => {
                setPerHalaman(Number(e.target.value));
                setHalaman(1);
              }}
              className="px-2 py-1 rounded-lg border border-[#D8E5DC] bg-white text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-[#166534] cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-slate-400">|</span>
            <span>
              Menampilkan <strong>{totalData === 0 ? 0 : indeksAwal + 1}</strong> –{' '}
              <strong>{Math.min(indeksAwal + perHalaman, totalData)}</strong> dari{' '}
              <strong>{totalData}</strong> pengguna
            </span>
          </div>

          <div className="flex items-center gap-1 justify-end">
            <button
              type="button"
              disabled={halamanAman <= 1}
              onClick={() => setHalaman((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D8E5DC] bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalHalaman }, (_, i) => i + 1)
                .filter((p) => {
                  if (totalHalaman <= 7) return true;
                  return (
                    p === 1 ||
                    p === totalHalaman ||
                    Math.abs(p - halamanAman) <= 1
                  );
                })
                .map((p, idx, arr) => {
                  const sebelum = arr[idx - 1];
                  const perluTitik = sebelum && p - sebelum > 1;

                  return (
                    <React.Fragment key={p}>
                      {perluTitik && <span className="px-1 text-slate-400 font-bold">…</span>}
                      <button
                        type="button"
                        onClick={() => setHalaman(p)}
                        className={`w-8 h-8 rounded-lg font-bold text-xs transition ${
                          halamanAman === p
                            ? 'bg-[#166534] text-white shadow-xs'
                            : 'border border-[#D8E5DC] bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              type="button"
              disabled={halamanAman >= totalHalaman}
              onClick={() => setHalaman((p) => Math.min(totalHalaman, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D8E5DC] bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium"
            >
              <span>Selanjutnya</span>
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
        Pengguna bertanda <strong>Terdaftar</strong> sudah menjadi anggota LPPM. Pilihan centang yang Anda tandai akan tetap tersimpan meskipun Anda berpindah halaman.
      </p>
    </div>
  );
};
