# Project Rules — LPPM UNUSU

Dokumen ini menetapkan aturan global pengembangan fullstack monolith **LPPM UNUSU** (Lembaga Penelitian dan Pengabdian kepada Masyarakat — Universitas Nahdlatul Ulama Sumatera Utara).

## ATURAN SSO — Callback, Tiket, dan Diagnosis Gagal Login

### Aturan Akses Masuk dan Pemuatan Peran LPPM (2026-11-18)

1. **Hak masuk ditentukan per peran di ONE UNUSU.** ONE memeriksa apakah salah satu peran pengguna diizinkan mengakses LPPM; keputusan ini bukan pemberian izin fitur internal LPPM.
2. **Login memeriksa akun LPPM berdasarkan ID pengguna ONE (`userId`).** Nama dan username tidak menjadi identitas pencocokan izin.
3. **Akun yang sudah diatur di Manajemen Pengguna LPPM langsung memakai penugasan yang ada.** Jika akun lokal aktif, peran dan izin internal dimuat otomatis saat login; menu dan tindakan mengikuti izin tersebut. Tidak perlu menempatkan ulang peran setiap login.
4. **Pemuatan peran bukan penetapan peran otomatis.** Login tidak membuat anggota lokal, tidak menimpa penugasan lokal, dan tidak otomatis memetakan peran DOSEN ONE menjadi peran dosen LPPM. Penetapan peran internal dilakukan melalui Manajemen Pengguna LPPM.
5. **Tanpa akun atau peran lokal, pengguna yang diizinkan ONE tetap boleh masuk, tetapi izin fiturnya kosong.** Akun lokal nonaktif tidak memperoleh izin fitur internal. SUPERADMIN tetap mendapat seluruh izin sesuai kebijakan ekosistem.
6. **Keputusan akses tidak hanya diperiksa saat login.** Setiap request JWT memeriksa kembali akses pusat dan membaca penugasan lokal terbaru. Gangguan pemeriksaan pusat tidak boleh membuka akses; klaim JWT atau cache browser bukan sumber kebenaran hak akses.

Aturan ini menggantikan ketentuan lama yang mewajibkan keanggotaan lokal sebagai syarat masuk atau menyamakan peran pusat dengan administrator internal LPPM.

Kontrak tetap antara Portal ONE UNUSU dan aplikasi ini. Melanggar satu butir cukup untuk membuat login gagal total, dan gejalanya sering menyerupai masalah lain. Katalog gejala–sebab–solusi lengkap: `one-unusu/docs/SSO_TROUBLESHOOTING.md`.

### A. Aturan Wajib Callback Browser

1. **Callback Berisi Token Saja**: URL callback hanya boleh berbentuk `{urlRedirect}?token=<64 heksadesimal>`. Dilarang menambahkan `client_id`/`client_key` di address bar. `client_id` dibaca dari env server (`SSO_CLIENT_ID`) dan dikirim hanya pada `POST {ONE}/api/v2/website/verify-token`.
2. **Tiket Sekali Pakai**: komponen callback wajib memakai penanda `useRef` (`sudahJalan`) agar `POST /api/auth/sso` tidak terkirim dua kali, termasuk oleh `React.StrictMode`. Dilarang mengulang penukaran tiket yang sudah gagal — minta pengguna memulai login baru. Dilarang memasang logika `cancelled` yang membuang hasil tukar yang sudah berhasil.
3. **Bersihkan Address Bar**: setelah tiket dibaca, jalankan `window.history.replaceState(null, '', window.location.pathname)`. Simpan tiket ke memori modul (mis. `TIKET_TERAKHIR`) **sebelum** pembersihan agar tetap tersedia bila komponen terpasang ulang.
4. **Basis API Relatif**: nilai cadangan `VITE_API_URL` wajib jalur relatif, tidak boleh `http://localhost:<port>/api`. Verifikasi: `grep -o 'http://localhost:[0-9]*/api' dist/**/*.js` harus kosong.
5. **Tiga Lapisan Sepakat**: `base` Vite, rute/redirect server Express, dan `urlRedirect` di tabel `sso_apps` harus menunjuk bentuk URL yang sama. Aplikasi yang memang di subpath boleh berawalan selama ketiganya sama.
6. **Cache Bukan Sumber Kebenaran**: `localStorage` hanya untuk tampilan awal. Keputusan navigasi setelah login wajib lewat verifikasi server; dilarang mengalihkan pengguna hanya karena ada data pengguna di `localStorage`.

### B. Gejala Cepat dan Arah Perbaikan

| Gejala | Sebab paling sering | Solusi |
|---|---|---|
| "Gagal menghubungi server untuk memverifikasi tiket SSO" | Bundel memuat `http://localhost:<port>/api` | Perbaiki `VITE_API_URL` + ubah nilai cadangan jadi `'/api'` |
| Login berhasil lalu terlempar ke `/login` | Tiket ditukar dua kali paralel | Guard `useRef` + `TIKET_TERAKHIR` + hapus penanda `cancelled` |
| Halaman callback kosong / URL berawalan ganda | `base` Vite/redirect backend berbeda dari `urlRedirect` | Samakan ketiga lapisan pada akar domain |
| Konsol: *MIME type 'text/html' is not executable* | Aset `.js` dibalas `index.html` | Samakan `base` build dengan lokasi aset yang dilayani nginx |
| "Parameter tiket autentikasi SSO tidak lengkap" padahal URL membawa token | Komponen terpasang ulang setelah `replaceState` | Simpan tiket ke memori modul sebelum membersihkan URL |
| Tiket terbit tapi `isUsed = false` selamanya | Browser tidak pernah menjalankan callback (bundel gagal dimuat) | Periksa pemuatan bundel dulu, bukan logika callback |

### C. Prosedur Wajib Saat SSO Dilaporkan Gagal

1. Catat gejala persis (teks pesan, URL akhir, halaman) sebelum menyentuh kode.
2. Cari gejala yang sama di tabel ringkas `one-unusu/docs/SSO_TROUBLESHOOTING.md` §1, lalu **jalankan langkah pembuktian** entri tersebut.
3. Terapkan solusi, lalu jalankan verifikasi entri yang sama.
4. Bila gejala belum pernah tercatat, tambahkan entri baru (gejala, sebab, pembuktian, solusi, verifikasi) pada commit yang sama dengan perbaikannya.

---

## 1. Hierarki Aturan
Jika terdapat perbedaan aturan di antara dokumen, urutan prioritas dari tertinggi ke terendah adalah:
1. `AGENTS.md` di direktori root proyek.
2. `docs/PROJECT_RULES.md` (dokumen ini).
3. `docs/design-system/*` (`DESIGN_RULES.md`, `COLORS.md`, `TYPOGRAPHY.md`, `COMPONENTS.md`, `PAGE_TEMPLATES.md`).
4. Konvensi lokal pada berkas modul di `src/client/` dan `src/server/`.

## 2. Arsitektur & Konvensi Global
- **Monolith Satu Port**: Backend Express (`src/server/`) dan Frontend Vite React (`src/client/`) berjalan dalam satu repositori (`PORT` default `5005`, Vite dev server pada `5176` dengan proxy `/api` ke `localhost:5005`).
- **Build Once, Reuse Everywhere**: Every page must use the correct page template and shared components. Dashboard must use its own dashboard template. Duplicating UI structure that already exists in a shared template is forbidden.
- **Full-Page CRUD (Tanpa Modal Form)**: Seluruh operasi penambahan dan penyuntingan data panel, termasuk master Monev, pengguna dan slider, wajib menggunakan rute halaman penuh (`/tambah` dan `/edit/:id`) dengan `FormPageTemplate`. Modal hanya untuk notifikasi, konfirmasi dan preview singkat. Daftar tabel memakai `ListPageTemplate`; daftar kartu memakai `PageShell`; dashboard memakai `DashboardPageTemplate`.
- **Form Section Layout Rule (Part 10.8)**: Setiap grup field pada halaman form wajib dibungkus di dalam `CardContainer` ber-heading di atas kanvas halaman (`#F1F5F9`). Dilarang merender label dan input telanjang langsung di atas background halaman.
- **Icon Standard & Anti-Sparkles**: Wajib menggunakan `@heroicons/react/24/outline` atau `solid` untuk komponen panel manajemen, tanpa ikon sparkles (`SparklesIcon`). Gunakan ikon fungsional (`AcademicCapIcon`, `BeakerIcon`, `HeartIcon`, `BookOpenIcon`, `DocumentTextIcon`).
  - `Navbar.tsx` aktif pada halaman publik dan memakai Heroicons. Pengembangan baru atau refaktor wajib menggunakan `@heroicons/react`.
- **Horizontal Scroll Table & Audit Trail**: Setiap tabel data wajib mendukung `w-full overflow-x-auto` dengan `min-w-[1080px]` serta menyertakan kolom audit trail (`Dibuat` / `createdAt`).
- **Tabel Global Wajib (`DataTable`)**: Seluruh tabel data dirender lewat `src/client/components/DataTable.tsx`, baik langsung maupun melalui `ListPageTemplate`. Menulis `<table>` inline pada halaman **dilarang**; ukuran teks, warna header, garis pemisah, dan scroll horizontal harus seragam. Ukuran baku `size="md"`: header `text-xs` uppercase `tracking-wider`, isi sel `text-sm` dengan padding `py-3.5 px-4`. Untuk tabel berkolom banyak, teruskan `minTableWidth` yang memadai (mis. `min-w-[1560px]`).
- **Satu Kolom = Satu Jenis Data**: Dilarang menggabungkan beberapa nilai berbeda dalam satu sel (judul + nomor + tahun, atau masa berlaku + tanggal berakhir). Pecah menjadi kolom terpisah. Nilai kosong ditulis `-` (bukan "Tanpa Kategori" / "Tidak ditentukan").
- **Resolusi Aset Sub-Path (`/lppm/`)**: Build produksi dipasang pada base path `/lppm/` (`PROD_BASE` di `vite.config.ts`). Seluruh referensi gambar/aset statis dari `public/assets/` wajib dibungkus helper `assetUrl()` dari `src/client/lib/assets.ts`.

## 3. Kontrak API, Autentikasi SSO, & Validasi Backend
- **Otentikasi SSO Satu Pintu**: Seluruh sesi pengguna berasal dari penukaran token sekali pakai ONE UNUSU Gateway (`/api/v2/website/verify-token`) melalui endpoint `POST /api/auth/sso`.
- **Desentralisasi RBAC & Multi-Role**: LPPM UNUSU mengelola hak akses mandiri di basis data lokal melalui relasi `lppm_users`, `lppm_roles`, `lppm_permissions`, `lppm_role_permissions`, dan tabel junction multi-role `lppm_user_roles`.
- **Auto-Provisioning**: Pengguna SSO baru otomatis dibuatkan akun lokal LPPM saat login pertama kali dengan peran bawaan sesuai tingkat SSO (`admin` atau `dosen`).
- **Pembedaan URL Callback (Local Dev vs VPS)**:
  - Lingkungan lokal: `http://localhost:5176/sso/callback`.
  - Lingkungan VPS / Produksi: `https://unusu.ac.id/lppm/sso/callback` (atau sesuai `SEED_PUBLIC_BASE_URL`).
  - Dikelola terpusat dari seeder portal ONE UNUSU via skrip `npm run db:sso-dev-urls` / `npm run db:sso-vps-urls`.
- **Deduplikasi Token Callback**: Token SSO bersifat sekali pakai (5 menit). Halaman `SsoCallbackPage` wajib mempertahankan deduplikasi request (`exchangeRequests` Map) agar tidak gagal akibat double-invocation pada React `StrictMode`.
- **Otorisasi Berbasis Permission (Bukan Raw Role)**: Akses ke LPPM ditentukan oleh izin masuk SSO (`lppm-unusu:masuk_admin` atau `lppm-unusu:masuk_dosen`) yang diverifikasi dari response Gateway `data.access.allowed`. Seluruh peran admin aplikasi cabang kaku (`ADMIN_LPPM`) telah dihapus di portal pusat; SUPERADMIN memegang seluruh izin masuk secara global, dan Superadmin dapat menautkan peran kustom civitas. Operasi API dilindungi oleh middleware `requirePermission()` berbasis permission key, bukan nama peran mentah.
- **Validasi Input Wajib (Zod)**: Seluruh parameter URL (`:id`), query filter, dan body request (`POST`, `PUT`) pada `/api/*` wajib divalidasi menggunakan skema `zod` sebelum menyentuh layer database Prisma.
- **Kontrak Respons Konsisten**:
  - Sukses: `{ success: true, data?: T, meta?: Record<string, unknown>, message?: string }`
  - Gagal: `{ success: false, message: string, code?: string, errors?: Array<{ field: string; message: string }> }`
- **Penanganan Error Terpusat**: Error validasi (`400`), otentikasi (`401`), otorisasi (`403`), data tidak ditemukan / Prisma `P2025` (`404`), dan kegagalan internal (`500`) ditangani oleh error handler terpusat tanpa membocorkan stack trace internal ke klien.
- **Normalisasi Tipe Data**: Field `Decimal` Prisma (`danaDisetujui`) dinormalisasi menjadi `number | null` pada payload JSON agar perhitungan agregasi di klien akurat dan konsisten.

## 4. Keamanan & Guardrails
- `JWT_SECRET` wajib terdefinisi di environment sebelum server menyala. Jangan pernah membaca, mencetak, atau melakukan commit isi berkas `.env`.
- Dilarang menjalankan migrasi database destruktif (`prisma migrate reset`, `DROP`), `git reset --hard`, atau `git push` tanpa persetujuan eksplisit pengguna.
