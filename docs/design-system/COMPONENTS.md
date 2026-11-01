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
| `Navbar` | `src/client/components/Navbar.tsx` | **Tidak Dipakai (Legacy)** | Header navigasi horizontal lama yang masih menggunakan ikon `lucide-react`. Jangan digunakan pada halaman baru; gunakan `SidebarLayout` untuk halaman admin. |

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
