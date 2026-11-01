# Sistem Tipografi (TYPOGRAPHY.md)

Dokumen ini menetapkan standar keluarga huruf, skala ukuran teks, ketebalan (font weight), dan penggunaan huruf monospace pada aplikasi **LPPM UNUSU**.

---

## 1. Keluarga Huruf (Font Families)

### Font Utama: `Plus Jakarta Sans`
Dimuat dari Google Fonts di dalam `index.html` dengan rentang ketebalan `300, 400, 500, 600, 700, 800`:
```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```
Diterapkan secara global pada elemen `<body>`:
```html
<body class="font-['Plus_Jakarta_Sans',sans-serif] bg-slate-50 text-slate-900 antialiased ...">
```

### Font Monospace (`font-mono`)
Menggunakan tumpukan monospace bawaan sistem/Tailwind (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`).
**Wajib digunakan pada data terstruktur berikut:**
- Nomor urut baris tabel (`No`).
- Nomor Induk Dosen Nasional (`NIDN`).
- Nominal anggaran/dana disetujui (`Rp ...`) baik di tabel maupun input angka.
- Tahun pelaksanaan riset/PKM dan tahun terbit publikasi.
- Peringkat akreditasi (`sintaScore`), kode skema (`PDP`, `PTR`, `PKM-M`), tanggal audit (`createdAt` / `2026-10-31`), dan input URL/DOI.

---

## 2. Skala Tipografi Panel Manajemen (Admin Panel)

| Peran Elemen | Kelas Tailwind Aktual | Ukuran & Karakteristik |
|---|---|---|
| **Judul Halaman (`AdminPanelTemplate`)** | `text-xl sm:text-2xl font-bold tracking-normal text-slate-900` | `20px` (mobile) / `24px` (desktop), Bold (`700`). |
| **Deskripsi Halaman (`AdminPanelTemplate`)** | `text-xs sm:text-sm text-slate-500 mt-1 font-normal leading-relaxed` | `12px` / `14px`, Regular (`400`), jarak baris lega. |
| **Angka Utama KPI Card** | `text-2xl font-bold` (atau `text-lg sm:text-xl font-bold` untuk nominal Rupiah panjang) | `24px` (`18px`–`20px` untuk mata uang), Bold (`700`). |
| **Label KPI Card** | `text-xs font-medium text-slate-500` | `12px`, Medium (`500`). |
| **Judul Seksi (`CardContainer`)** | `text-sm sm:text-base font-bold text-slate-900 tracking-normal` | `14px` / `16px`, Bold (`700`). |
| **Subjudul Seksi (`CardContainer`)** | `text-xs text-slate-500 mt-0.5 font-normal` | `12px`, Regular (`400`). |
| **Item Menu Sidebar (`SidebarLayout`)** | `text-[13.5px] font-semibold` (aktif: `font-bold`) | `13.5px`, SemiBold (`600`) / Bold (`700`). |
| **Sub-deskripsi Menu Sidebar** | `text-[10px] text-slate-400 font-normal truncate` | `10px`, Regular (`400`). |
| **Heading Grup Navigasi Sidebar** | `text-[10px] font-bold text-slate-400 uppercase tracking-widest` | `10px`, Bold (`700`), huruf kapital penuh dengan spasi huruf lebar. |
| **Header Kolom Tabel (`<th>`)** | `text-[11px] font-bold text-slate-500 uppercase tracking-wider` | `11px`, Bold (`700`), huruf kapital penuh. |
| **Isi Sel Tabel (`<td>`)** | `text-xs sm:text-[13px]` (judul baris: `font-bold text-slate-900`) | `12px` / `13px`, judul tebal dengan metadata pendukung `text-[11px]`. |
| **Label Field Form (`<label>`)** | `block text-xs font-bold text-slate-700 mb-1.5` | `12px`, Bold (`700`), margin bawah `6px`. |
| **Teks Input / Select / Textarea** | `text-xs sm:text-sm text-slate-800 placeholder-slate-400` | `12px` / `14px`, Regular (`400`). |

---

## 3. Skala Tipografi Halaman Publik & Autentikasi

| Peran Elemen | Kelas Tailwind Aktual | Penggunaan |
|---|---|---|
| **Headline Hero Slider** | `text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight` | Judul utama pada `FullHeroSlider.tsx`. |
| **Judul Halaman Login** | `text-3xl sm:text-4xl font-black text-slate-950 tracking-tight` | Heading utama pada `Login.tsx`. |
| **Judul Seksi Landing Page** | `text-2xl sm:text-4xl font-bold text-slate-950 tracking-normal` | Heading `<h2 />` pada seksi Profil, Pilar Layanan, Skema Hibah, dan Alur. |
| **Badge Seksi (Eyebrow Pill)** | `text-xs font-bold uppercase tracking-widest text-violet-700 bg-violet-50 border border-violet-200 px-3 py-1 rounded-full` | Penanda kategori di atas judul seksi pada `Landing.tsx`. |
