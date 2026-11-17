# Tata kelola halaman LPPM

## Lingkup

Peta struktur rute aktif panel dan pengecualian komposisi publik. Aturan desain
mengikuti [PROJECT_RULES](../../PROJECT_RULES.md) dan
[registri template](../../design-system/PAGE_TEMPLATES.md).

## Template dan komponen

| Rute | Struktur |
|---|---|
| `/penelitian`, `/pengabdian`, `/publikasi`, `/monev`, `/izin`, `/pengguna` | `ListPageTemplate` dengan `DataTable` |
| `/admin/arsip-dokumen`, `/admin/kategori` | `ListPageTemplate` dengan `DataTable` |
| `/admin/monev-periode`, `/monev-kategori`, `/monev-soal`, `/monev-responden` | `ListPageTemplate` dengan `DataTable` |
| Rute tambah/ubah modul panel | `FormPageTemplate`, setiap seksi field dalam `CardContainer` ber-heading |
| `/peran`, `/slider` | Daftar kartu dalam `PageShell`, bukan tabel yang dipaksakan |
| `/dashboard` | `DashboardPageTemplate`; grafik `ReportCard`/`LaporanCharts`, data agregat API existing |
| `/profil` | `PageShell` dan `CardContainer`, hanya baca |

Tombol tambah berlabel `Tambah Data`; kembali/simpan/batal disediakan template
form. Pencarian/filter, definisi kolom dan handler bisnis tetap milik halaman;
kerangka visual tidak digandakan. Warna primer violet dan tabel global mengikuti
token aplikasi. Pilihan pengguna direktori juga memakai `DataTable`.

Semua tabel memiliki kolom pertama `No` yang disediakan `DataTable`. Judul dan
isinya rata tengah; nomor urut dihitung 1 sampai jumlah baris yang sedang tampil
(mengikuti urutan hasil filter/sort dan dimulai lagi pada halaman berikutnya).
Definisi kolom No lama dinormalisasi agar tidak muncul ganda; nomor dokumen dan
urutan bisnis tetap merupakan kolom data terpisah.

### Aksi daftar dan kartu

- Aksi ikon edit/hapus/preview menggunakan `RowActionButton`, target minimum
  44×44px, radius 8px, ikon Heroicons 16px dan label kontekstual (`aria-label`
  serta `title`). Default violet, aksi destruktif rose.
- Header menggunakan `ListActionButton`; tambah berikon `PlusIcon`, segarkan
  berikon `ArrowPathIcon` yang berputar saat memuat. Navigasi khusus seperti
  Kelola Soal tetap boleh berteks/penghitung dengan geometri minimum 44px.
- Status sukses/aktif tetap boleh hijau; fokus input dan aksi edit memakai violet.

## State, rute dan akses

- Tambah/ubah menggunakan URL tersendiri, bukan modal CRUD. Form periode memakai
  `/admin/monev-periode/tambah` dan `/admin/monev-periode/edit/:id`; kategori/soal
  memakai suffix sama pada `/monev-kategori` dan `/monev-soal`; slider pada `/slider`.
- Sidebar dan pembungkus otorisasi rute existing dipertahankan; template bukan
  pengganti validasi input dan otorisasi server.
- Daftar menyediakan loading, empty, error/retry melalui template; submit
  menampilkan proses dan tidak boleh dikirim berulang ketika menyimpan.
- Form edit menggunakan `submitDisabled` sampai detail berhasil dimuat; kegagalan
  mengambil detail tidak boleh menyebabkan nilai awal menimpa data tersimpan.
- Notifikasi/konfirmasi menggunakan `NotificationModal`; modal detail jawaban
  responden tetap diizinkan sebagai preview baca, bukan penyuntingan.
- API, payload mutasi, batas unggahan media serta pembersihan object URL tidak
  diubah oleh migrasi template. Audit tidak menjalankan mutasi basis data.

## Komposisi terpisah

Landing, login, callback SSO, 403/404, katalog survei, pengisian survei dan rekap
publik tetap memakai komposisi khusus existing. Halaman publik tidak memakai
sidebar admin atau tombol simpan CRUD. Ini pemisahan jenis halaman, bukan
pengecualian untuk menggandakan tabel dan form panel.
