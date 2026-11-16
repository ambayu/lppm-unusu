# Modul Slider Hero Beranda (LPPM)

Catatan modul untuk halaman `/slider` (panel) dan hero beranda publik LPPM UNUSU.

## Berkas

| Lapisan | Berkas |
|---|---|
| Halaman panel | `src/client/pages/ManajemenSliderLppm.tsx` |
| Hero publik | `src/client/components/FullHeroSlider.tsx` |
| Service API | `src/client/services/api.ts` (`fetchAdminSliders`, `createAdminSlider`, `updateAdminSlider`, `deleteAdminSlider`, `fetchPublicSliders`, `KONFIG_MULTIPART`) |
| Utilitas klien | `src/client/lib/mediaSlider.ts` (`jenisMedia`, `validasiBerkasMedia`, `labelJenisMedia`) |
| Modul server | `src/server/sliderMedia.ts` (`periksaUkuranMediaSlider`, `urlMediaSlider`, `hapusMediaSliderFisik`, `namaBerkasMediaDariUrl`) |
| Endpoint | `src/server/index.ts` (`/api/admin/sliders`, `/api/public/sliders`) + `express.static` pada `PREFIX_MEDIA_SLIDER` |
| Model Prisma | `prisma/schema.prisma` → `LppmBannerSlider` |
| Rute SPA | `src/client/App.tsx` → `/slider` (izin `IZIN_FITUR.penelitianLihat`), `/admin/slider` dialihkan ke `/slider` |

## Alur Data

1. `GET /api/public/sliders` mengembalikan baris aktif terurut menaik; `gambarUrl`
   hanya berisi path (`/storage/slider/<berkas>`), bukan base64.
2. Panel mengirim `POST`/`PUT` sebagai `multipart/form-data` dengan field `berkas`;
   `gambarMobileUrl` di-set `null` saat dibuat dan tidak diubah saat pembaruan.
3. Server menulis berkas ke disk dengan nama acak, memeriksa jenis dan ukuran,
   menyimpan path ke baris, lalu menghapus berkas lama setelah pembaruan berhasil.
   `DELETE` menghapus berkas setelah baris hilang.
4. `FullHeroSlider` merender `<video>` untuk slide video dan `<img>` untuk slide
   gambar; slide video berpindah setelah peristiwa `ended`.

## Aturan

- Media **tidak** boleh disimpan sebagai base64; dilarang memakai `FileReader` pada
  unggahan slider. Pratinjau memakai `URL.createObjectURL` dan URL `blob:` wajib
  dicabut saat komponen dilepas.
- Batas ukuran: **gambar 5 MB**, **video 50 MB**; angka di klien harus sama dengan
  `src/server/sliderMedia.ts`.
- Jenis media ditentukan dari ekstensi/data URL (`mp4`, `webm`, `ogg`, `ogv`, `mov`,
  `m4v`), bukan kolom database baru. Skema tidak berubah.
- Slide video tidak memakai timer; slide gambar berotasi tiap 6 detik. Elemen video
  wajib `muted` dan `playsInline` agar autoplay diizinkan peramban.
- Path media wajib ditempel `import.meta.env.BASE_URL` (atau resolver setara) saat
  ditampilkan, karena aplikasi dipasang di balik sub-path.
- Penghapusan hanya menyentuh path berawalan `/storage/slider/` dengan nama berkas
  yang sah; URL luar dan data URL lama dilewati.

Acuan lintas aplikasi untuk aturan lengkap: `unusu-lms/docs/routes/slider/RULES.md`.
