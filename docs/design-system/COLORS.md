# Sistem Warna (COLORS.md)

Dokumen ini mendokumentasikan palet warna aktual yang digunakan pada kode sumber **LPPM UNUSU** (`src/client/` dan `tailwind.config.js`).

---

## 1. Palet Identitas Utama (Violet & Amber)

Seluruh antarmuka LPPM UNUSU (baik halaman publik, halaman login SSO, maupun panel manajemen admin) menggunakan **Violet** sebagai warna primer dan **Amber** sebagai warna aksen pendamping.

| Peran Warna | Kelas Tailwind / HEX | Penggunaan di Kode Aktual |
|---|---|---|
| **Primary Brand** | `bg-violet-700` (`#6D28D9`) | Tombol aksi utama (`Tambah`, `Simpan`, `Masuk`), latar badge logo LPPM, indikator menu sidebar aktif. |
| **Primary Hover** | `hover:bg-violet-800` (`#5B21B6`) | State hover pada seluruh tombol aksi utama `bg-violet-700`. |
| **Deep Brand Surface** | `bg-violet-950` (`#2E1065`) | Top announcement strip di `LandingPage`, overlay gradasi pada `FullHeroSlider` & `LoginPage`, seksi statistik kinerja. |
| **Primary Text Accent** | `text-violet-700` / `text-violet-900` | Teks "UNUSU" pada brand header, nilai KPI sekunder, tautan breadcrumb, teks menu sidebar aktif. |
| **Soft Violet Tint** | `bg-violet-50` (`#F5F3FF`) | Latar ikon KPI card, badge kategori, state hover baris tabel (`hover:bg-violet-50/30`), latar ikon `EmptyState`. |
| **Accent Gold / Amber** | `text-amber-400` (`#FBBF24`) / `bg-amber-400` | Warna ikon di dalam tombol utama (`PlusIcon`, `CheckIcon`, `ArrowRightIcon`), ikon `AcademicCapIcon` pada logo LPPM, indikator slide aktif. |
| **Accent Amber Text** | `text-amber-600` (`#D97706`) / `text-amber-800` | Angka KPI sekunder (Riset Terapan, Program Aktif, SINTA Terakreditasi) dan badge kartu layanan PKM. |

---

## 2. Permukaan Kanvas & Sidebar (Custom HEX Tokens)

Panel manajemen menggunakan nilai HEX spesifik untuk menjaga konsistensi visual dengan standar ekosistem ONE UNUSU:

| Permukaan / Elemen | Nilai HEX | Kelas Tailwind Aktual | Keterangan |
|---|---|---|---|
| **App Canvas Background** | `#F1F5F9` | `bg-[#F1F5F9]` | Latar belakang utama halaman admin (`App.tsx` & `SidebarLayout.tsx`). |
| **Public Landing Canvas** | `#FDFCFE` | `bg-[#FDFCFE]` | Latar belakang halaman depan publik (`Landing.tsx`). |
| **Public Section Tint** | `#F6F3F9` | `bg-[#F6F3F9]` | Latar seksi "Skema Hibah & Pendanaan" pada `Landing.tsx`. |
| **Card & Panel Surface** | `#FFFFFF` | `bg-white` | Permukaan `AdminPanelTemplate`, `CardContainer`, KPI cards, dan topbar. |
| **Card Header Surface** | `#F8FAFC` | `bg-[#F8FAFC]` | Latar header pada `CardContainer` (`px-5 py-3.5 border-b border-[#CBD5E1]`). |
| **Sidebar Background** | `#F8F5FB` | `bg-[#F8F5FB]` | Latar utama sidebar navigasi di `SidebarLayout.tsx`. |
| **Sidebar Active Item** | `#EDE8F5` | `bg-[#EDE8F5]` | Latar item menu sidebar yang sedang aktif dan kotak ikon sidebar non-aktif. |
| **Sidebar Hover Item** | `#F3EEF9` | `hover:bg-[#F3EEF9]` | State hover pada item navigasi sidebar dan tombol ciutkan sidebar. |
| **Sidebar Footer Surface** | `#F1EDF7` | `bg-[#F1EDF7]` | Latar area footer sidebar tempat status SSO Gateway dan tombol keluar berada. |
| **Standard Structural Border** | `#CBD5E1` | `border-[#CBD5E1]` | Garis batas wajib untuk `AdminPanelTemplate`, `CardContainer`, `SidebarLayout`, tabel header, dan seluruh field input/select/tombol sekunder. |

---

## 3. Tipografi Netral & Semantik Status

### Netral (Slate)
- **Heading Utama**: `text-slate-900` (`#0F172A`) dan `text-slate-950` (`#020617` pada Landing & Login).
- **Teks Isi & Nilai Tabel**: `text-slate-800` (`#1E293B`) dan `text-slate-700` (`#334155`).
- **Teks Sekunder / Deskripsi / Subtitle**: `text-slate-500` (`#64748B`) dan `text-slate-600` (`#475569`).
- **Teks Muted / Nomor Urut / Label Seksi Sidebar**: `text-slate-400` (`#94A3B8`).

### Semantik (Success & Danger)
- **Success / Finansial & Status Aktif (`Emerald`)**:
  - `bg-emerald-50 text-emerald-700`: Badge ikon KPI "Total Alokasi Hibah" / "Total Dana Disalurkan" (`IDR`).
  - `bg-emerald-500`: Indikator titik berdenyut (`animate-pulse`) pada pill "SSO Gateway Aktif" di footer sidebar.
- **Danger / Error & Destructive (`Rose`)**:
  - `bg-rose-50 border-rose-200 text-rose-700`: Banner pesan kesalahan form dan latar ikon `ErrorState` (`text-rose-600`).
  - `hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200`: State hover pada tombol "Keluar Akun" dan tombol hapus baris tabel (`TrashIcon`).
  - `text-rose-500`: Tanda bintang wajib isi (`*`) pada label form.

---

## 4. Token Warisan ONE UNUSU (`tailwind.config.js` & Logo SSO)

Di dalam `tailwind.config.js`, didefinisikan token kustom `lppm.green` (`#0A5C36`, `#064226`, `#117A4A`) dan `lppm.gold` (`#D4AF37`).
- Token hijau dan emas ini merepresentasikan identitas induk **ONE UNUSU** dan digunakan secara spesifik pada komponen SVG `AnimatedFlatSsoLogo.tsx` serta `OneUnusuMark.tsx` (logo gerbang SSO).
- Untuk seluruh komponen antarmuka halaman LPPM UNUSU (panel, tabel, tombol, form, navigasi), gunakan palet **Violet + Amber + Slate (`#CBD5E1`)** sebagaimana tercatat pada Bagian 1 dan 2 di atas.
