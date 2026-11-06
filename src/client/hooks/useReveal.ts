import React from 'react';

/**
 * useReveal — animasi masuk saat elemen memasuki viewport.
 *
 * Prinsip:
 * 1. Animasi hanya menyatakan *kedatangan* konten, bukan menghibur. Elemen
 *    muncul dengan geseran kecil (20px) dan fade, sekali saja, lalu diam.
 * 2. `prefers-reduced-motion: reduce` mematikan animasi sepenuhnya dan
 *    langsung menampilkan elemen dalam keadaan akhir.
 * 3. Tanpa JavaScript / tanpa IntersectionObserver, elemen tetap terlihat.
 *
 * Kenapa memakai satu observer bersama:
 * Grid kartu bisa berisi belasan elemen. Satu `IntersectionObserver` per
 * elemen berarti belasan observer aktif sekaligus, dan callback-nya tidak
 * sinkron. Semua `Reveal` di halaman kini berbagi satu observer lewat
 * `observerBersama()` sehingga biayanya konstan.
 */

type Callback = () => void;

const petaCallback = new WeakMap<Element, Callback>();
let observerGlobal: IntersectionObserver | null = null;

function observerBersama(): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null;

  if (!observerGlobal) {
    observerGlobal = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const cb = petaCallback.get(entry.target);
          if (cb) cb();
          petaCallback.delete(entry.target);
          observerGlobal?.unobserve(entry.target);
        });
      },
      {
        // Picu sedikit sebelum elemen benar-benar menyentuh tepi bawah layar,
        // supaya animasi selesai saat elemen terbaca, bukan sesudahnya.
        rootMargin: '0px 0px -80px 0px',
        // 0 berarti cukup 1 piksel terlihat. Elemen setinggi viewport tetap
        // bisa memicu, berbeda dengan threshold persentase.
        threshold: 0,
      },
    );
  }

  return observerGlobal;
}

/**
 * @param opsi.delay  Jeda tambahan dalam milidetik. Untuk efek berurutan
 *                    dalam satu grup kartu, isi dengan indeks * 70.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: {
  delay?: number;
}) {
  const ref = React.useRef<T | null>(null);
  const [terlihat, setTerlihat] = React.useState(false);
  const delay = options?.delay ?? 0;

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Hormati preferensi pengguna: langsung tampil tanpa animasi.
    const kurangiGerak = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const observer = observerBersama();

    if (kurangiGerak || !observer) {
      setTerlihat(true);
      return;
    }

    petaCallback.set(node, () => setTerlihat(true));
    observer.observe(node);

    return () => {
      petaCallback.delete(node);
      observer.unobserve(node);
    };
  }, []);

  const style: React.CSSProperties = {
    opacity: terlihat ? 1 : 0,
    transform: terlihat ? 'none' : 'translateY(20px)',
    transition: `opacity 600ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 600ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    // Cegah bayangan/teks terpotong saat elemen masih bergeser.
    willChange: terlihat ? 'auto' : 'opacity, transform',
  };

  return { ref, style, terlihat };
}

/**
 * useCountUp — menghitung angka naik dari 0 ke nilai target.
 * Dipakai pada panel statistik agar angka terbaca sebagai data yang baru
 * dimuat, bukan hiasan. Nilai `null` (belum ada data) dilewati.
 */
export function useCountUp(target: number | null, aktif: boolean, durasi = 1200) {
  const [nilai, setNilai] = React.useState(0);

  React.useEffect(() => {
    if (target === null || !aktif) return;

    const kurangiGerak = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (kurangiGerak) {
      setNilai(target);
      return;
    }

    let raf = 0;
    const mulai = performance.now();

    const langkah = (kini: number) => {
      const progres = Math.min((kini - mulai) / durasi, 1);
      // easeOutCubic: cepat di awal, melambat di akhir.
      const eased = 1 - Math.pow(1 - progres, 3);
      setNilai(Math.round(target * eased));
      if (progres < 1) raf = requestAnimationFrame(langkah);
    };

    raf = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(raf);
  }, [target, aktif, durasi]);

  return nilai;
}
