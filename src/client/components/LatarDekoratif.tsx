import React from 'react';

/**
 * LatarDekoratif — lapisan tekstur & bentuk untuk seksi berlatar terang.
 *
 * Alasan fungsional tiap elemen (bukan hiasan acak):
 * 1. **Titik grid** memberi skala dan kedalaman pada bidang kosong yang lebar,
 *    sehingga seksi tidak terbaca sebagai "belum diisi".
 * 2. **Kisi garis** pada seksi skema menandai bahwa isinya bersifat tabular
 *    (kode, sasaran, luaran) — garis mengisyaratkan struktur data.
 * 3. **Bentuk gradien lembut** memberi arah pandang ke area konten, bukan
 *    mengapung bebas. Warnanya tetap di keluarga violet agar palet
 *    hitam-ungu-putih tidak pecah.
 *
 * Semua lapisan `aria-hidden` dan `pointer-events-none` supaya tidak pernah
 * mengganggu pembaca layar maupun klik.
 */

type Jenis = 'titik' | 'kisi' | 'lengkung';

export const LatarDekoratif: React.FC<{
  jenis: Jenis;
  /** Posisi bentuk gradien, mis. "kiri" atau "kanan". */
  arah?: 'kiri' | 'kanan' | 'tengah';
}> = ({ jenis, arah = 'kanan' }) => {
  const posisiBentuk =
    arah === 'kiri' ? '-left-32' : arah === 'tengah' ? 'left-1/2 -translate-x-1/2' : '-right-32';

  if (jenis === 'titik') {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgb(109 40 217 / 0.10) 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
        <div
          className={`absolute ${posisiBentuk} top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-gradient-to-br from-violet-200/40 to-transparent blur-3xl`}
        />
      </div>
    );
  }

  if (jenis === 'kisi') {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgb(109 40 217 / 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgb(109 40 217 / 0.07) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }}
        />
      </div>
    );
  }

  // jenis === 'lengkung'
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute -bottom-24 -right-24 h-[520px] w-[520px] text-violet-200"
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle cx="100" cy="100" r="98" stroke="currentColor" strokeWidth="0.75" opacity="0.7" />
        <circle cx="100" cy="100" r="74" stroke="currentColor" strokeWidth="0.75" opacity="0.55" />
        <circle cx="100" cy="100" r="50" stroke="currentColor" strokeWidth="0.75" opacity="0.4" />
      </svg>
      <div className="absolute -left-24 top-10 h-[360px] w-[360px] rounded-full bg-gradient-to-tr from-violet-100/60 to-transparent blur-2xl" />
    </div>
  );
};
