# Registri Komponen Bersama (COMPONENTS.md)

Dokumen ini mendaftarkan seluruh komponen bersama (shared components) yang tersedia di `src/client/components/`, tanggung jawab masing-masing komponen, kontrak props, serta aturan penggunaannya.

---

## 1. Daftar Komponen Bersama

| Nama Komponen | Path Berkas | Status Penggunaan | Tanggung Jawab Utama |
|---|---|---|---|
| `SidebarLayout` | `src/client/components/SidebarLayout.tsx` | **Aktif (Wajib untuk Admin)** | Kerangka aplikasi ber-sidebar (sticky desktop sidebar, mobile drawer, topbar `88px` dengan breadcrumb & profil, serta footer). |
| `AdminPanelTemplate` | `src/client/components/AdminPanelTemplate.tsx` | **Aktif (Wajib untuk Halaman Admin)** | Panel putih utama (`rounded-[16px] border-[#CBD5E1]`) yang membungkus header halaman (judul, deskripsi, tombol aksi) dan area isi halaman. |
| `CardContainer` | `src/client/components/CardContainer.tsx` | **Aktif (Wajib untuk Form & Tabel)** | Kartu kontainer (`rounded-[14px] border-[#CBD5E1]`) dengan header opsional berlatar `#F8FAFC` untuk membungkus filter bar, tabel data, dan seksi form (Part 10.8). |
| `EmptyState` | `src/client/components/EmptyState.tsx` | **Aktif (Wajib)** | Tampilan saat daftar data atau hasil pencarian kosong, lengkap dengan ikon `DocumentMagnifyingGlassIcon` dan slot tombol aksi. |
| `ErrorState` | `src/client/components/ErrorState.tsx` | **Aktif (Wajib)** | Tampilan peringatan saat pengambilan data API gagal (`role="alert"`), dilengkapi ikon `ExclamationTriangleIcon` dan tombol `Coba Lagi`. |
| `FullHeroSlider` | `src/client/components/FullHeroSlider.tsx` | **Aktif (Landing Page)** | Carousel banner beranda dengan rasio 80% gambar visual dan 20% teks ringkas, auto-advance 6 detik, indikator titik, dan tombol navigasi slide. |
| `AnimatedFlatSsoLogo` | `src/client/components/AnimatedFlatSsoLogo.tsx` | **Aktif (Login Page)** | Logo SVG interaktif ONE UNUSU dengan 6 satelit berputar mengelilingi badge angka "1" statis. |
| `OneUnusuMark` | `src/client/components/OneUnusuMark.tsx` | Cadangan / Utilitas | Emblem SVG ringkas ONE UNUSU berukuran default `96px` yang mendukung `@media (prefers-reduced-motion: reduce)`. |
| `UserAuthorityCard` | `src/client/components/UserAuthorityCard.tsx` | **Aktif (Wajib di Panel Admin)** | Kartu otoritas pengguna berisi `USERNAME`, `HAK AKSES`, `UNIT KERJA`, dan `STATUS AKUN`. Dirender otomatis oleh `SidebarLayout` di atas konten halaman sehingga seluruh panel LPPM menampilkan identitas sesi secara seragam. |
| `Navbar` | — (berkas dihapus) | **Dihapus** | Header navigasi horizontal lama berbasis `lucide-react` yang tidak pernah dirender. Berkas `src/client/components/Navbar.tsx` telah dihapus; navbar landing page kini inline di `src/client/pages/Landing.tsx`. |

---

## 2. Spesifikasi & Kontrak Props Komponen Inti

### 2.1 `AdminPanelTemplate`
**Berkas**: `src/client/components/AdminPanelTemplate.tsx`

```tsx
interface AdminPanelTemplateProps {
  title: string;
  description: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}
```
- **Aturan Pakai**: Wajib menjadi elemen terluar di setiap komponen halaman yang dirender di dalam `SidebarLayout` (`PenelitianPage`, `PenelitianFormPage`, `PengabdianPage`, `PengabdianFormPage`, `PublikasiPage`, `PublikasiFormPage`).
- **Slot `actions`**: Gunakan untuk menempatkan tombol segarkan data (`ArrowPathIcon`) dan tombol CTA utama (`Tambah ...`) pada halaman daftar, atau tombol `Kembali` pada halaman form.

### 2.2 `CardContainer`
**Berkas**: `src/client/components/CardContainer.tsx`

```tsx
interface CardContainerProps {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}
```
- **Aturan Pakai**:
  1. **Tanpa `title`/`subtitle`**: Digunakan untuk membungkus bar pencarian dan filter dropdown.
  2. **Dengan `title` & `subtitle`**: Digunakan untuk membungkus tabel data utama serta setiap grup logis field form sesuai mandat **Part 10.8 (Form Section Layout Rule)**.

### 2.3 `EmptyState`
**Berkas**: `src/client/components/EmptyState.tsx`

```tsx
interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}
```
- **Aturan Pakai**: Dirender di dalam `CardContainer` tabel ketika `filteredList.length === 0` dan tidak sedang loading/error. Berikan pesan `description` yang membedakan antara filter pencarian aktif vs. data kosong.

### 2.4 `ErrorState`
**Berkas**: `src/client/components/ErrorState.tsx`

```tsx
interface ErrorStateProps {
  title?: string;       // Default: 'Gagal Memuat Data'
  description?: string; // Default: 'Terjadi kesalahan saat mengambil data. Silakan coba beberapa saat lagi.'
  onRetry?: () => void;
}
```
- **Aturan Pakai**: Dirender di dalam `CardContainer` tabel ketika state `error` bernilai truthy, dengan meneruskan fungsi `loadData` ke prop `onRetry`.

### 2.5 `SidebarLayout`
**Berkas**: `src/client/components/SidebarLayout.tsx`

```tsx
interface SidebarLayoutProps {
  children: React.ReactNode;
}
```
- **Aturan Pakai**: Membungkus rute terproteksi (`<ProtectedRoute>`) di `src/client/App.tsx`. Jika menambahkan rute modul baru, perbarui array `navItems`, fungsi `isActive`, dan fungsi `getBreadcrumbLabel` di dalam `SidebarLayout.tsx`.
- **Kartu Otoritas Sesi**: `SidebarLayout` merender `UserAuthorityCard` secara otomatis di atas `{children}` pada elemen `<main>`. Halaman anak **tidak boleh** merender kartu serupa agar tidak terjadi duplikasi.

### 2.6 `UserAuthorityCard`
**Berkas**: `src/client/components/UserAuthorityCard.tsx`

```tsx
interface UserAuthorityCardProps {
  user: AuthorityCardUser | null;
  roleLabel?: string;   // label hak akses terpetakan (menimpa user.roleLabel)
  className?: string;
}
```
- **Aturan Data**: `UNIT KERJA` diambil berurutan `unitKerja → prodi → fakultas`; bila kosong tampil "Belum terhubung unit". `STATUS AKUN` default `Aktif` kecuali bernilai `nonaktif`.
- **Ikon**: `@heroicons/react/24/outline` (`UserCircleIcon`, `ShieldCheckIcon`, `BuildingOffice2Icon`, `CheckBadgeIcon`) — patuh aturan Anti-Lucide pada `AGENTS.md`.
- **Styling**: `bg-white border border-[#CBD5E1] rounded-[16px]`, aksen `violet-50`/`violet-100`.
- **Larangan**: Dilarang menduplikasi markup empat baris identitas ini di halaman lain.

---

## 3. Pola Elemen UI Standar (Inline Patterns)

Beberapa elemen berulang belum diekstrak menjadi file komponen terpisah namun memiliki pola kelas Tailwind baku yang **tidak boleh diubah sembarangan**:

1. **KPI Summary Card** (4 kartu per baris di bagian atas halaman daftar):
   ```tsx
   <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
     <div>
       <p className="text-xs font-medium text-slate-500">{label}</p>
       <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
     </div>
     <div className="w-10 h-10 rounded-[10px] bg-violet-50 text-violet-700 flex items-center justify-center">
       {/* Ikon Heroicons w-5 h-5 atau singkatan teks font-bold text-xs */}
     </div>
   </div>
   ```
2. **Primary CTA Button**:
   ```tsx
   className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 h-[42px] rounded-[12px] bg-violet-700 hover:bg-violet-800 text-white text-sm font-bold transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
   ```
3. **Standard Form Input / Select / Textarea**:
   ```tsx
   className="w-full px-3.5 py-2.5 rounded-[12px] border border-[#CBD5E1] text-xs sm:text-sm focus:outline-none focus:border-violet-600 transition-colors"
   ```

---

## 4. Larangan Duplikasi

- **Dilarang** membuat komponen pembungkus kartu baru jika `CardContainer` sudah memenuhi kebutuhan.
- **Dilarang** membuat layout halaman admin tanpa `SidebarLayout` dan `AdminPanelTemplate`.
- **Dilarang** mengimpor `Navbar.tsx` ke halaman panel manajemen karena seluruh halaman manajemen wajib menggunakan navigasi `SidebarLayout`.

---

## 4. Komponen Laporan & Grafik

### `LaporanCharts` (`src/client/components/LaporanCharts.tsx`)
- **Tanggung Jawab**: Kumpulan komponen grafik ringkas untuk dashboard panel, dibangun **murni dengan SVG dan CSS** — tanpa library chart eksternal, sehingga ukuran bundle tetap ringan dan tidak menambah dependensi baru.
- **Alasan tidak memakai library**: grafik dashboard bersifat ringkasan (bukan analitik interaktif), dan palette harus mengikuti warna aplikasi masing-masing.
- **Komponen yang tersedia**:
  | Komponen | Kegunaan |
  | --- | --- |
  | `ReportCard` | Kartu pembungkus laporan (judul + subjudul + aksi opsional) |
  | `MetricTile` | Kartu metrik angka besar dengan ikon & aksen warna |
  | `DonutChart` | Proporsi antar kategori (mis. status surat, kondisi fasilitas) |
  | `BarChart` | Perbandingan kategori dengan bar horizontal |
  | `ColumnChart` | Tren per periode dengan kolom vertikal |
  | `TrendChart` | Tren waktu dengan area lembut (SVG path) |
  | `StackedBar` | Komposisi satu batang bertingkat |
  | `GaugeRing` | Capaian persentase tunggal berbentuk cincin |
  | `ActivityFeed` | Daftar kejadian terbaru bersusun waktu |
- **Aksesibilitas**: Setiap grafik memakai `role="img"` + `aria-label` yang merangkum datanya; nilai juga tetap ditampilkan sebagai teks sehingga tidak bergantung pada warna saja.
- **Aturan Pemakaian**: Dashboard setiap aplikasi **wajib** menampilkan laporan/grafik ringkas untuk tiap menu, dan **dilarang** menyertakan panel aksi cepat (tombol pintas tambah/input) di dashboard. Navigasi tetap melalui sidebar.

---

## 5. Komponen Landing Page

### Seksi "Tentang LPPM" (`src/client/pages/Landing.tsx`, anchor `#tentang`)
- **Status**: ditulis langsung di `Landing.tsx`. Komponen pembungkus `TentangPlatform.tsx` **dibatalkan dan dihapus** karena hanya memiliki satu pemakaian; pola baku tetap dipertahankan agar identik dengan ONE UNUSU.
- **Grid**: `lg:grid-cols-12` dengan pembagian **6:6** seimbang (`lg:col-span-6` pada kedua kolom), `items-center`.
- **Kolom kiri**: eyebrow *Tentang Platform* (`text-violet-700 bg-violet-50 border-violet-200`), judul `h2#tentang-title` *Mengenal LPPM UNUSU* (`text-2xl sm:text-4xl font-bold text-slate-950`), dua paragraf narasi (`text-sm sm:text-base text-slate-600`), dan tiga poin centang berikon Heroicons `CheckIcon` dalam bulatan `bg-violet-700 text-amber-300`.
- **Kolom kanan**: foto potret `public/assets/profil-peneliti.png` di atas plakat `rounded-[40px]` setinggi **86%** dengan gradasi `from-violet-100/90 via-amber-100/70 to-transparent` dan border `border-violet-100`, plus `drop-shadow-[0_25px_50px_rgba(109,40,217,0.22)]` dan hover `scale-[1.02]`.
- **Section background**: `bg-white` dengan `border-b border-slate-200/70`.
- **Aturan Aset**:
  - Potret **wajib PNG ber-alpha channel** (latar transparan) agar plakat gradasi tembus di sekitar siluet. Aset saat ini `1024×958` ARGB, sudut `alpha=0`.
  - Path **wajib** melalui `assetUrl()` dari `src/client/lib/assets.ts` agar tidak jatuh ke root domain pada sub-path `/lppm/`.
  - Dilarang memakai gambar yang memuat branding institusi lain.
