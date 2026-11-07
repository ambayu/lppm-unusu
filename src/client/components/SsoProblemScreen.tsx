import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldExclamationIcon,
  ArrowPathIcon,
  HomeIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

/**
 * SsoProblemScreen - halaman penuh untuk kegagalan masuk lewat SSO.
 *
 * Kenapa satu halaman penuh, bukan kartu melayang di tengah layar:
 * ketika proses masuk gagal, tidak ada satu pun isi lain di halaman yang masih
 * berguna. Kartu kecil di tengah layar gelap hanya menyisakan ruang kosong di
 * sekelilingnya dan terasa seperti kotak galat yang muncul tiba-tiba. Satu
 * halaman penuh memberi ruang untuk menjelaskan apa yang terjadi dan apa yang
 * bisa dilakukan pembaca.
 *
 * Kenapa bahasanya tidak menyebut nama teknis:
 * orang yang membaca layar ini adalah pengguna kampus, bukan pengembang. Pesan
 * seperti "Client ID tidak cocok" tidak memberitahu apa pun yang bisa mereka
 * lakukan, dan membuat mereka mengira akunnya rusak. Yang ditampilkan di sini
 * hanya tiga hal: apa yang terjadi, apa artinya bagi mereka, dan langkah
 * berikutnya.
 *
 * Palet memakai violet mengikuti warna aksi LPPM UNUSU, dengan aksen amber yang
 * sama seperti halaman login. Seluruh tombol setinggi minimal 44px.
 */

type Props = {
  judul: string;
  penjelasan: string;
  langkah?: string[];
  catatan?: string;
  /** Bila diisi, tombol "Coba masuk lagi" ditampilkan. */
  onCobaLagi?: () => void;
  alamatBantuan?: string;
  tahun?: number;
};

export function SsoProblemScreen({
  judul,
  penjelasan,
  langkah = [],
  catatan,
  onCobaLagi,
  alamatBantuan,
  tahun = new Date().getFullYear(),
}: Props) {
  return (
    <div className="min-h-screen w-full bg-[#F7F7FB] text-slate-800 font-sans selection:bg-amber-300 selection:text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        {/* Kepala halaman: hanya identitas, tanpa navigasi. */}
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-xl bg-violet-800 text-amber-300"
            >
              <ShieldExclamationIcon className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="text-sm font-extrabold tracking-tight text-slate-950">
              LPPM <span className="text-violet-800">UNUSU</span>
            </span>
          </div>
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200/60 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-700 focus-visible:ring-offset-2"
          >
            <HomeIcon className="h-4 w-4" aria-hidden="true" />
            <span>Beranda</span>
          </Link>
        </header>

        {/* Isi: dua kolom di layar lebar, satu kolom di ponsel. */}
        <main
          role="alert"
          className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-12 lg:gap-16 lg:py-16"
        >
          <div className="lg:col-span-7">
            {/* Eyebrow berupa bilah tegak, mengikuti pola halaman lain. */}
            <p className="border-l-2 border-amber-500 pl-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
              Proses masuk terhenti
            </p>

            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-[2.75rem]">
              {judul}
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {penjelasan}
            </p>

            {langkah.length > 0 && (
              <ol className="mt-8 max-w-xl space-y-4">
                {langkah.map((item, idx) => (
                  <li key={item} className="flex items-start gap-3.5">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-violet-800 text-[11px] font-bold tabular-nums text-amber-300"
                    >
                      {idx + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-slate-700">{item}</span>
                  </li>
                ))}
              </ol>
            )}

            <div className="mt-9 flex flex-wrap items-center gap-3">
              {onCobaLagi && (
                <button
                  type="button"
                  onClick={onCobaLagi}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] bg-violet-700 px-5 text-sm font-bold text-white transition-colors hover:bg-violet-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
                >
                  <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                  <span>Coba masuk lagi</span>
                </button>
              )}
              <Link
                to="/login"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
              >
                <HomeIcon className="h-4 w-4" aria-hidden="true" />
                <span>Kembali ke halaman masuk</span>
              </Link>
            </div>

            {alamatBantuan && (
              <p className="mt-6 flex items-center gap-2 text-xs text-slate-500">
                <EnvelopeIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <span>
                  Bila masih terhenti, hubungi administrator LPPM di{' '}
                  <a
                    href={`mailto:${alamatBantuan}`}
                    className="font-semibold text-violet-800 underline decoration-violet-300 underline-offset-2 hover:decoration-violet-700"
                  >
                    {alamatBantuan}
                  </a>
                  .
                </span>
              </p>
            )}
          </div>

          {/* Panel keterangan: menjelaskan keadaan sistem tanpa istilah teknis. */}
          <aside className="lg:col-span-5">
            <div className="rounded-3xl border border-violet-900 bg-violet-900 p-7 text-white sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                Yang perlu diketahui
              </p>
              <ul className="mt-5 space-y-4 text-sm leading-relaxed text-violet-50/90">
                <li className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400"
                  />
                  <span>Akun dan kata sandi Anda tidak berubah. Tidak ada data yang hilang.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400"
                  />
                  <span>
                    Halaman ini hanya mencatat bahwa proses masuk belum berhasil diselesaikan.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400"
                  />
                  <span>
                    Beberapa aplikasi kampus memiliki hak akses tersendiri, jadi satu akun belum
                    tentu bisa membuka semua aplikasi.
                  </span>
                </li>
              </ul>

              {catatan && (
                <p className="mt-6 border-t border-violet-700/70 pt-5 text-xs leading-relaxed text-violet-200">
                  {catatan}
                </p>
              )}
            </div>
          </aside>
        </main>

        <footer className="border-t border-slate-200 pt-6 pb-2">
          <p className="text-xs text-slate-500">
            &copy; {tahun} LPPM UNUSU. Universitas Nahdlatul Ulama Sumatera Utara.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default SsoProblemScreen;
