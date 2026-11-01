# Registri Template Halaman (PAGE_TEMPLATES.md)

Dokumen ini mendefinisikan arsitektur template halaman yang digunakan di **LPPM UNUSU** sesuai prinsip **Build Once, Reuse Everywhere** (Part 9 & Part 10.8).

---

## 1. Peta Template Halaman di LPPM UNUSU

| Kategori Halaman | Rute Aktual | Pembungkus Layout | Template & Struktur Kontainer |
|---|---|---|---|
| **A. List / Table Page Template** | `/penelitian`, `/pengabdian`, `/publikasi` | `ProtectedRoute` -> `SidebarLayout` | `AdminPanelTemplate` -> [1. KPI Grid 4 Kolom] + [2. `CardContainer` Filter & Search] + [3. `CardContainer` Tabel Horizontal Scroll] |
| **B. Form Page Template (Add / Edit)** | `/penelitian/tambah`, `/penelitian/edit/:id`, `/pengabdian/tambah`, `/pengabdian/edit/:id`, `/publikasi/tambah`, `/publikasi/edit/:id` | `ProtectedRoute` -> `SidebarLayout` | `AdminPanelTemplate` -> `<form>` -> [Multiple `CardContainer` per Seksi Field] + [Baris Tombol `Batal` & `Simpan`] |
| **C. Public Landing Page** | `/` | Tanpa `SidebarLayout` | Top Announcement Strip + Sticky Public Header + `FullHeroSlider` + Seksi Profil, 3 Pilar Layanan, Skema Hibah, Statistik Kinerja, Alur Pengajuan, & Footer Kampus |
| **D. Authentication & SSO Pages** | `/login`, `/sso/callback` | Tanpa `SidebarLayout` | Split-screen Login (`LoginPage` dengan `AnimatedFlatSsoLogo` & wallpaper kampus) serta Card Verifikasi Token Sekali Pakai (`SsoCallbackPage`) |

*Catatan Dashboard*: Saat ini LPPM UNUSU tidak memiliki rute `/dashboard` terpisah; metrik ringkasan (KPI) disajikan pada baris kartu di bagian atas masing-masing modul (`PenelitianPage`, `PengabdianPage`, `PublikasiPage`). Apabila di masa mendatang dibangun halaman `/dashboard` khusus, halaman tersebut wajib dibuatkan `DashboardPageTemplate` tersendiri dan dilarang menyalin template halaman tabel CRUD.

---

## 2. Spesifikasi Template A: List / Table Page

Digunakan oleh: `src/client/pages/Penelitian.tsx`, `src/client/pages/Pengabdian.tsx`, dan `src/client/pages/Publikasi.tsx`.

### Urutan Struktur Wajib
1. **`AdminPanelTemplate`**:
   - `title`: Nama modul (mis. `"Pangkalan Data Penelitian Dosen"`).
   - `description`: Penjelasan satu kalimat mengenai fungsi modul.
   - `actions`: Tombol ikon refresh (`ArrowPathIcon`, `h-[42px] w-[42px]`) di sebelah kiri tombol utama `Link` ke `/<modul>/tambah` (`bg-violet-700`, `h-[42px]`).
2. **Seksi 1 — Baris Kartu KPI (`grid grid-cols-2 lg:grid-cols-4 gap-3.5`)**:
   - Menampilkan 4 metrik agregat yang dihitung secara dinamis dari state `list` (bukan angka statis).
3. **Seksi 2 — Bar Pencarian & Filter (`<CardContainer>` tanpa header)**:
   - Input pencarian teks dengan ikon `MagnifyingGlassIcon` di sisi kiri (`pl-10`).
   - Label indikator filter (`AdjustmentsHorizontalIcon`) berdampingan dengan elemen `<select>` filter kategori/skema/status.
4. **Seksi 3 — Tabel Data Utama (`<CardContainer title="..." subtitle="...">`)**:
   - `subtitle` wajib menampilkan jumlah data terfilter terhadap total data (`Menampilkan X dari total Y data...`).
   - Menangani cabang rendering secara berurutan:
     1. `loading === true` -> Spinner `ArrowPathIcon` berputar.
     2. `error !== null` -> `<ErrorState description={error} onRetry={loadData} />`.
     3. `filteredList.length === 0` -> `<EmptyState ... />`.
     4. Data tersedia -> `<div className="w-full overflow-x-auto"><table className="w-full min-w-[1080px] text-left border-collapse">...</table></div>`.
   - Kolom tabel wajib diakhiri dengan kolom `Dibuat` (audit trail `createdAt`) dan kolom `Aksi` (tombol `PencilSquareIcon` menuju `/<modul>/edit/:id` dan tombol `TrashIcon` untuk hapus dengan konfirmasi `window.confirm`).

---

## 3. Spesifikasi Template B: Form Page (Tambah & Edit)

Digunakan oleh: `src/client/pages/PenelitianForm.tsx`, `src/client/pages/PengabdianForm.tsx`, dan `src/client/pages/PublikasiForm.tsx`.

### Aturan Satu Komponen untuk Dua Mode
Mode **Tambah** (`/tambah`) dan **Edit** (`/edit/:id`) wajib menggunakan satu komponen halaman yang sama, dibedakan melalui pembacaan parameter URL:
```tsx
const { id } = useParams<{ id?: string }>();
const isEdit = Boolean(id);
```

### Urutan Struktur Wajib (Part 10.8)
1. **`AdminPanelTemplate`**:
   - `title`: Dinamis mengikuti `isEdit` (mis. `isEdit ? 'Edit Proposal Penelitian' : 'Tambah Proposal Riset Baru'`).
   - `actions`: Tombol `Link` kembali ke halaman daftar (`/penelitian`, `/pengabdian`, atau `/publikasi`) menggunakan `ArrowLeftIcon`.
2. **Banner Error (Kondisional)**:
   - Jika state `error` terisi, tampilkan kotak `bg-rose-50 border border-rose-200 text-rose-700 rounded-[12px] p-4` di atas form.
3. **State Memuat Data Awal (Mode Edit)**:
   - Jika `loading === true` saat mengambil detail record yang akan diedit, tampilkan indikator teks pemuatan sebelum merender `<form>`.
4. **Elemen `<form onSubmit={handleSubmit} className="space-y-6">`**:
   - **Seksi Card 1 (`<CardContainer title="..." subtitle="...">`)**: Kelompok field identitas utama (Judul, Ketua/Penulis, NIDN, Anggota).
   - **Seksi Card 2 (`<CardContainer title="..." subtitle="...">`)**: Kelompok field klasifikasi, kemitraan/penerbit, nominal dana, tahun, dan status (`grid grid-cols-1 sm:grid-cols-3 gap-4`).
   - **Larangan Keras**: Tidak boleh ada `<label>` atau `<input>` yang berada di luar `CardContainer`.
5. **Baris Tombol Aksi Form**:
   - Berada di bawah `CardContainer` terakhir (`flex items-center justify-end gap-3 pt-2`).
   - Terdiri dari tombol `Link` **Batal** (`bg-white border-[#CBD5E1]`) dan tombol `submit` **Simpan / Perbarui Data** (`bg-violet-700 text-white` dengan ikon `CheckIcon text-amber-400`).

---

## 4. Cara Menambahkan Halaman / Modul Baru

Sebelum membuat halaman baru di `src/client/pages/`:
1. Periksa apakah halaman tersebut bertipe **Daftar Data (List)** atau **Formulir (Form)**.
2. Gunakan struktur `AdminPanelTemplate` + `CardContainer` yang sudah ada sebagaimana didokumentasikan pada Bagian 2 dan 3 di atas.
3. Daftarkan rute di `src/client/App.tsx` di dalam pembungkus `<ProtectedRoute><SidebarLayout>...</SidebarLayout></ProtectedRoute>`.
4. Tambahkan entri navigasi dan label breadcrumb pada `src/client/components/SidebarLayout.tsx`.
5. Perbarui dokumentasi ini (`docs/design-system/PAGE_TEMPLATES.md`) dan `CHANGELOG.md`.
