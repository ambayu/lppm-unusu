# Changelog

Seluruh perubahan penting pada proyek **LPPM UNUSU** didokumentasikan di berkas ini.
Format mengacu pada standar tanggal ISO (`YYYY-MM-DD`) dengan kategori: `Added`, `Changed`, `Fixed`, `Removed`, dan `Documentation`.

## [2026-11-04]

### Added
- **`src/client/components/Navbar.tsx`** — navbar publik LPPM dengan struktur baku ekosistem ONE UNUSU: brand di kiri (logo violet + nama + subteks), menu di tengah (Beranda, Penelitian, Pengabdian, Publikasi, Monev) dengan `aria-current="page"`, dan aksi di kanan ("Website Kampus" + "Masuk SSO", atau identitas pengguna + "Panel" + "Keluar" bila sudah login). `sticky top-0`, baris `h-16`, seluruh kontrol `min-h-[44px]`, hamburger mobile dengan `aria-expanded`. Navbar lama yang tertanam di dalam `Landing.tsx` dihapus agar tidak ada navbar ganda.
- **Daftar terbaru pada dashboard**: "Penelitian Terbaru" dan "Publikasi Terbaru" (masing-masing 5 baris) beserta agregasi server pendukungnya.
- Dokumentasi §6b (Dashboard Page Template) dan §6c (Navbar Landing Page) pada `docs/design-system/PAGE_TEMPLATES.md`.

### Changed
- **`src/client/pages/Dashboard.tsx` diselaraskan dengan pola E-Surat**: banner sapaan dinamis (`Selamat pagi/siang/sore/malam` dari `user?.nama`), tombol aksi modul inti, kartu ringkasan dengan tombol `Segarkan` berputar, skeleton `animate-pulse`, kartu metrik berfooter `Daftar →`, laporan chart, lalu daftar terbaru. Palet violet/amber repo dipertahankan.
- **`GET /api/dashboard/stats` kini melakukan agregasi di server** (`count`, `aggregate` untuk total dana disetujui dan rata-rata kemajuan/serapan dana monev, `groupBy` per status/bidang fokus/sumber dana/mitra/jenis publikasi/skor SINTA, tren 5 tahun, serta `findMany` + `take: 5` untuk data terbaru). Sebelumnya dashboard menarik empat endpoint daftar penuh lalu menghitung rata-rata di klien.
- Semua kartu dashboard kini menampilkan field yang dikirim server; tidak ada lagi angka yang dihitung dari data tidak lengkap.

### Fixed
- **İkon `lucide-react` pada `SsoCallback.tsx` diganti Heroicons** (`ArrowPathIcon`, `ExclamationTriangleIcon`, `ShieldCheckIcon`) agar mematuhi aturan ikon repo. `src/client` kini 100% bebas `lucide-react`.

### Removed
- **Kartu informasi akun (`UserAuthorityCard`) dihapus dari dashboard** dan dari `SidebarLayout.tsx` (yang tadinya merendernya secara global di seluruh halaman panel). Identitas pengguna tetap tampil di topbar dan sidebar.
- İkon Sparkles tidak lagi ada di seluruh `src/client`.

### Documentation
- `docs/design-system/PAGE_TEMPLATES.md` mencatat aturan mengikat dashboard: data wajib dari API nyata, dilarang membuang field yang dikirim server, dilarang `Math.random()`, larangan library chart baru, dan larangan membungkus template dengan container `max-w-*`/`mx-auto`.

## [2026-11-03]

### Added
- **Pemisahan admin per aplikasi (LPPM ≠ LPM)**: kebijakan akses terpusat `src/client/lib/appAccess.ts` (`APP_SCOPE = 'lppm'`, `LPPM_ALLOWED_SSO_ROLES`, `FOREIGN_APP_ADMIN_ROLES`) sebagai satu sumber kebenaran aturan panel.
- Halaman 403 `src/client/pages/AksesDitolak.tsx` + guard `src/client/components/AppScopeGuard.tsx` yang menjelaskan alasan penolakan (peran admin aplikasi lain, peran tidak terdaftar, sesi milik aplikasi lain) dengan aksi 44px dan kontras WCAG AA.
- Endpoint `GET /api/auth/session` mengembalikan cakupan aplikasi (`app: "lppm"`), `isAdmin`, `canManageSystem`, dan daftar permission efektif.
- Rute `/akses-ditolak` dan guard `AdminOnlyRoute` untuk halaman Pengguna, Peran, serta Izin.
- **Panel "Cakupan Aplikasi & Pemisahan Admin"** di `Pengguna.tsx`: daftar peran sah LPPM, daftar peran admin aplikasi lain yang ditolak (beserta nama aplikasinya), chip sesi aktif, dan badge *Akses LPPM / Ditolak di LPPM* pada kolom Hak Akses.
- **Notifikasi lintas aplikasi di halaman login** (`Login.tsx`): menjelaskan panel ini khusus LPPM serta tautan 44px "Buka panel LPM UNUSU" (`VITE_LPM_URL`, default `http://localhost:5177`).
- Dokumentasi kebijakan `docs/security/APP_SCOPED_ADMIN.md` (matriks peran, titik penegakan, kontrak error `FOREIGN_APP_ADMIN`, checklist QA).

### Changed
- **`POST /api/auth/sso` menolak admin aplikasi cabang lain** (mis. `ADMIN_LPM`, `ADMIN_ESURAT`, `ADMIN_SARPRAS`, `ADMIN_AKREDITASI`, `ADMIN_LMS`, `ADMIN_SSO`) dengan `403` + `code: "FOREIGN_APP_ADMIN"` beserta label aplikasi pemilik peran.
- **`authenticate` memvalidasi cakupan token**: JWT dengan klaim `app` selain `lppm` ditolak (`403 FOREIGN_APP_TOKEN`), dan peran admin aplikasi lain ditolak (`403 FOREIGN_APP_ADMIN`) walau tanda tangan token sah.
- Sesi JWT kini membawa `app`/`appName`; `SessionUser` di klien memuat field yang sama.
- `SidebarLayout` menyembunyikan blok **Manajemen Admin** (Pengguna, Peran, Izin) untuk dosen peneliti, menampilkan label peran asli (`roleLabel`) dan chip `Akses: LPPM`.
- `AuthContext` mengekspos `appScope`, `hasPanelAccess`, `isAdmin`, `canManageSystem`, `isDosen`, `isSuperadmin`, dan `roleLabel`; sesi lama tanpa `app` dimigrasikan otomatis ke `lppm`.
- `SsoCallback` mengarahkan penolakan lintas aplikasi ke `/akses-ditolak` (bukan pesan error generik), dan interceptor API membersihkan sesi pada `403` cakupan aplikasi.

### Fixed
- Dosen peneliti tidak lagi dapat membuka `/pengguna`, `/peran`, `/izin` melalui URL langsung (dialihkan ke `/penelitian`).

## [2026-11-03]

### Added
- **Audit trail append-only (`lppm_audit_log`)**:
  - Model Prisma `AuditLog` + enum `AksiAudit` (`CREATE`/`UPDATE`/`DELETE`) dengan 4 index (`createdAt`, `entitas+entitasId`, `aktorNidn`, `aksi+createdAt`).
  - Middleware `src/server/lib/auditLog.ts` (`createAuditLogger`) yang mencatat setiap mutasi sukses setelah respons terkirim — non-blocking, error ditelan, field sensitif di-`[REDACTED]`, payload dipotong 2000 karakter.
  - Endpoint baru `GET /api/audit-log` (role `admin`) dengan filter `entitas`, `aksi`, `aktor`, `search`, `dari`/`sampai`, plus pagination.
  - Migrasi aman `prisma/migrations/20261103100000_add_audit_log/` (`migration.sql`, `rollback.sql`, `verify.sql`, `README.md`). **Belum dieksekusi.**
  - Dokumentasi `docs/database/AUDIT_LOG.md` (struktur, alur penulisan, cara baca, retensi).

### Changed
- Prisma Client di-generate ulang (`prisma generate`, v5.22.0) agar tipe `auditLog` tersedia; tidak ada mutasi database.

## [2026-11-02]

### Added
- **Index Kinerja Database (migrasi disiapkan, belum dieksekusi)**:
  - Menambah 15 index pada `prisma/schema.prisma`: `lppm_penelitian` (`createdAt`, `tahun+status`, `bidangFokus`, `nidn`), `lppm_pengabdian` (`createdAt`, `tahun+status`, `mitra`, `nidn`), `lppm_publikasi` (`tahun`, `jenis+tahun`, `penulis`), `lppm_monitoring_evaluasi` (`createdAt`, `tanggalJadwal`, `nidnReviewer`), dan `lppm_permissions` (`modul`).
  - Menambah berkas migrasi aman `prisma/migrations/20261102103000_add_performance_indexes/` berisi `migration.sql` (additive, `ALGORITHM=INPLACE, LOCK=NONE`), `rollback.sql`, `verify.sql`, dan `README.md` berisi checklist approval. **Belum dieksekusi ke database mana pun.**
  - Menambah `src/server/validations/list.validation.ts` (skema query daftar bersama: `page`, `limit`, `search`, `tahun`, `status`, `sort`, helper pagination & urutan stabil).
  - Menambah dokumentasi `docs/database/INDEX_STRATEGY.md` (peta index → query dan aturan perubahan skema).

### Changed
- **Endpoint daftar mendukung filter & pagination server-side** (`src/server/index.ts`): `GET /api/penelitian`, `/api/pengabdian`, `/api/publikasi` menerima `search`, `tahun`, `status`, `sort`, serta `page`/`limit`. Tanpa `?limit`, respons tetap mengembalikan seluruh data seperti sebelumnya sehingga tabel client tidak berubah.

### Fixed
- **Filter monev tidak lagi saling meniadakan**: `tahun` dan blok pencarian kini digabung dengan `AND` eksplisit (sebelumnya `where.OR` ditimpa sehingga hasil bisa lolos walau tahun tidak cocok).
- **Urutan pagination stabil**: `orderBy` pada `/api/monev`, `/api/penelitian`, `/api/pengabdian`, dan `/api/publikasi` memakai `id` sebagai tie-breaker agar baris tidak bergeser antar halaman.

## [2026-11-01]

### Removed
- **Modul Kategori & Skema Riset**:
  - Menghapus endpoint API `/api/kategori-riset` dan validasi Zod terkait dari backend (`src/server/index.ts`, `src/server/validations/kategoriRiset.validation.ts`).
  - Menghapus halaman frontend `KategoriRiset.tsx` dan `KategoriRisetForm.tsx` dari `src/client/pages/`.
  - Menghapus interface dan fungsi API `fetchKategoriRiset`, `getKategoriRiset`, `createKategoriRiset`, `updateKategoriRiset`, `deleteKategoriRiset` dari `src/client/services/api.ts`.
  - Menghapus referensi `kategoriRisetId` dan `skema` dari model form penelitian (`PenelitianForm.tsx`) dan daftar penelitian (`Penelitian.tsx`).
  - Menghapus permission `kategori_riset.view` dan `kategori_riset.manage` dari skrip seeder (`prisma/seed.ts`).
  - Menghapus test audit kategori riset legacy (`tests/kategoriRiset.audit.ts` dan `tests/kategoriRisetDelete.test.ts`).

### Fixed
- **Alur Pengajuan & Monitoring Proposal Riset**:
  - Memperbarui query `prisma.penelitian` dan include relation pada `prisma.monitoringEvaluasi` di `src/server/index.ts` agar tidak mereferensikan kolom atau relasi yang sudah dihapus.
  - Memperbarui type definition `PenelitianItem` dan `MonevItem` di `src/client/services/api.ts` agar bersih dari field `skema` dan `kategoriRiset`.
  - Memperbaiki filter dan KPI pada halaman `Penelitian.tsx` menjadi klasifikasi Bidang Fokus (Teknologi & AI, Pendidikan & Aswaja).
  - Memperbaiki test audit `tests/monev.audit.ts` agar selaras dengan skema Prisma saat ini.


## [2026-10-31]

### Documentation
- Menyusun tata kelola dokumentasi proyek (`project-docs-governance`) berdasarkan audit kode aktual tanpa mengubah kode fitur.
- Menambahkan `docs/README.md` berisi ringkasan modul Tridharma LPPM UNUSU, arsitektur fullstack monolith, variabel lingkungan, dan panduan perintah operasional.
- Menambahkan `docs/PROJECT_RULES.md` yang menetapkan hierarki aturan, mandat *Build Once, Reuse Everywhere*, aturan *Form Section Layout (Part 10.8)*, standar Heroicons, alur autentikasi SSO ONE UNUSU, serta guardrail keamanan database dan Git.
- Menambahkan dokumentasi sistem desain lengkap di `docs/design-system/`:
  - `DESIGN_RULES.md`: Prinsip visual Violet/Amber/Slate, standar geometri border `#CBD5E1` & radius sudut (`16px`/`14px`/`12px`), penanganan state UI (`loading`, `empty`, `error`), dan aturan anti-slop.
  - `COLORS.md`: Referensi token warna primer (`violet-700`), aksen (`amber-400`), permukaan kanvas (`#F1F5F9`, `#F8F5FB`, `#EDE8F5`), semantik status, serta pemisahan token logo induk ONE UNUSU.
  - `TYPOGRAPHY.md`: Skala tipografi `Plus Jakarta Sans` dan aturan penggunaan `font-mono` untuk NIDN, nominal dana, tahun, serta metadata tabel.
  - `COMPONENTS.md`: Registri komponen bersama (`SidebarLayout`, `AdminPanelTemplate`, `CardContainer`, `EmptyState`, `ErrorState`, `FullHeroSlider`, `AnimatedFlatSsoLogo`, `OneUnusuMark`) beserta kontrak props dan catatan komponen legacy (`Navbar.tsx`).
  - `PAGE_TEMPLATES.md`: Standar struktur halaman Daftar/Tabel (KPI + Filter Card + Horizontal Scroll Table) dan halaman Formulir CRUD penuh (`/tambah` & `/edit/:id`).
