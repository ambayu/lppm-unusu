# Project Rules — LPPM UNUSU

Dokumen ini menetapkan aturan global pengembangan fullstack monolith **LPPM UNUSU** (Lembaga Penelitian dan Pengabdian kepada Masyarakat — Universitas Nahdlatul Ulama Sumatera Utara).

## 1. Hierarki Aturan
Jika terdapat perbedaan aturan di antara dokumen, urutan prioritas dari tertinggi ke terendah adalah:
1. `AGENTS.md` di direktori root proyek.
2. `docs/PROJECT_RULES.md` (dokumen ini).
3. `docs/design-system/*` (`DESIGN_RULES.md`, `COLORS.md`, `TYPOGRAPHY.md`, `COMPONENTS.md`, `PAGE_TEMPLATES.md`).
4. Konvensi lokal pada berkas modul di `src/client/` dan `src/server/`.

## 2. Arsitektur & Konvensi Global
- **Monolith Satu Port**: Backend Express (`src/server/`) dan Frontend Vite React (`src/client/`) berjalan dalam satu repositori (`PORT` default `5005`, Vite dev server pada `5178` dengan proxy `/api` ke `localhost:5005`).
- **Build Once, Reuse Everywhere**: Every page must use the correct page template and shared components. Dashboard must use its own dashboard template. Duplicating UI structure that already exists in a shared template is forbidden.
- **Full-Page CRUD (Tanpa Modal Form)**: Seluruh operasi penambahan dan penyuntingan data untuk modul Penelitian, Pengabdian, dan Publikasi wajib menggunakan rute halaman penuh (`/tambah` dan `/edit/:id`). Dilarang menggunakan popup modal untuk form input data.
- **Form Section Layout Rule (Part 10.8)**: Setiap grup field pada halaman form wajib dibungkus di dalam `CardContainer` ber-heading di atas kanvas halaman (`#F1F5F9`). Dilarang merender label dan input telanjang langsung di atas background halaman.
- **Icon Standard & Anti-Sparkles**: Wajib menggunakan `@heroicons/react/24/outline` atau `solid` untuk komponen panel manajemen, tanpa ikon sparkles (`SparklesIcon`). Gunakan ikon fungsional (`AcademicCapIcon`, `BeakerIcon`, `HeartIcon`, `BookOpenIcon`, `DocumentTextIcon`).
  - *Catatan Audit Kode*: Komponen `src/client/components/Navbar.tsx` (legacy, tidak aktif di `App.tsx`) dan `src/client/pages/SsoCallback.tsx` masih mengimpor ikon dari `lucide-react`. Pengembangan baru atau refaktor wajib menggunakan `@heroicons/react`.
- **Horizontal Scroll Table & Audit Trail**: Setiap tabel data wajib mendukung `w-full overflow-x-auto` dengan `min-w-[1080px]` serta menyertakan kolom audit trail (`Dibuat` / `createdAt`).
- **Resolusi Aset Sub-Path (`/lppm/`)**: Build produksi dipasang pada base path `/lppm/` (`PROD_BASE` di `vite.config.ts`). Seluruh referensi gambar/aset statis dari `public/assets/` wajib dibungkus helper `assetUrl()` dari `src/client/lib/assets.ts`.

## 3. Kontrak API, Autentikasi SSO, & Validasi Backend
- **Otentikasi SSO Satu Pintu**: Seluruh sesi pengguna berasal dari penukaran token sekali pakai ONE UNUSU Gateway (`/api/v2/website/verify-token`) melalui endpoint `POST /api/auth/sso`. Tidak ada login password lokal dan tidak ada registri pengguna lokal (`lppm_users` telah dihapus).
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
