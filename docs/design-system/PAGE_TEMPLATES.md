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

---

## 6. Template 6: Form Page Template (`FormPageTemplate`)

- **Digunakan oleh**: **seluruh** halaman formulir tambah/ubah data (mis. `/penelitian/tambah`, `/penelitian/edit/:id`, `/admin/surat-form`, `/admin/standar/tambah`). **Dashboard tidak memakai template ini.**
- **Tanggung Jawab**: Menyeragamkan kerangka halaman formulir di seluruh aplikasi sehingga tata letaknya identik antar menu: header panel + pesan galat + area isian + baris aksi tetap di bawah.
- **Komposisi Struktur**:
  ```tsx
  <FormPageTemplate
    title="Tambah Proposal Riset Baru"
    description="Formulir pencatatan lengkap proposal penelitian."
    backTo="/penelitian"
    isEdit={isEdit}
    submitLabel={isEdit ? 'Perbarui Data' : 'Simpan Proposal'}
    submitting={submitting}
    error={error}
    onSubmit={handleSubmit}
    accentClassName="bg-violet-700 hover:bg-violet-800"
  >
    <CardContainer title="Informasi Judul & Tim Peneliti">
      {/* field-field formulir */}
    </CardContainer>
  </FormPageTemplate>
  ```
- **Poin Penting**:
  1. Tidak perlu lagi menulis `<form>`, blok galat, dan baris tombol Batal/Simpan secara manual — semuanya disediakan template.
  2. Baris aksi (Batal + Simpan) selalu berada di **bawah** formulir dengan tap target minimal 42px.
  3. `submitLabel` default otomatis: `Simpan Perubahan` saat `isEdit`, `Simpan Data` saat menambah.
  4. Tombol "Batal" mengarah ke `backTo`; tombol "Kembali" pada header juga mengarah ke sana.
  5. `accentClassName` disesuaikan dengan palette aplikasi (ESurat emerald, LPM/LPPM biru/violet, dll).
- **Dilarang**: Membuat struktur header formulir + baris aksi sendiri di halaman baru. Gunakan template ini agar konsisten.

---

## 6b. Template 6b: Dashboard Page (`pages/Dashboard.tsx`)

Dashboard LPPM mengikuti pola baku yang sama dengan E-Surat UNUSU. Urutan blok dari atas ke bawah:

1. **Banner sambutan** — latar gradien warna primer repo (violet), badge kecil uppercase,
   `h1` berisi sapaan dinamis (`Selamat pagi/siang/sore/malam` + nama depan dari `user?.nama`),
   satu paragraf penjelas modul, dan 2 tombol aksi ke modul inti (`min-h-[44px]`).
2. **Kartu ringkasan** (`AdminPanelTemplate`) — badge + judul `Ringkasan ...` + aksi
   `Segarkan` (ikon berputar saat `loading`) dan tautan ke halaman daftar data.
3. **Error state** — `ErrorState` + tombol coba lagi.
4. **Skeleton** — grid 4 kartu `animate-pulse` selama `loading` dan data belum ada.
5. **Kartu metrik** — grid 4 kolom; label uppercase, ikon dalam kotak warna lembut, angka
   `text-3xl font-black`, subteks kecil, footer tautan `Daftar →` ke modul terkait.
6. **Laporan chart** — grid 2 kolom berisi `ReportCard` (`DonutChart` / `BarChart` /
   `ColumnChart` / `StackedBar` / `GaugeRing`) dari `components/LaporanCharts.tsx`.
   **Tanpa library chart dan tanpa dependency baru.**
7. **Daftar terbaru** — "Penelitian Terbaru" dan "Publikasi Terbaru", masing-masing 5 baris
   data nyata dari API.

**Aturan data (mengikat):**

- Setiap angka **wajib** berasal dari API nyata. Dilarang `Math.random()`, konstanta palsu,
  atau angka "kira-kira".
- **Jangan membuang field yang sudah dikirim server.** Bila endpoint menghitung sesuatu namun
  UI tidak menampilkannya, itu bug.
- Bila sebuah angka belum tersedia, **tambahkan agregasi di server** (`count` / `groupBy` /
  `aggregate` / `findMany` + `take`), jangan menghitung di klien dari data yang tidak lengkap.
- Bila sebuah chart tidak bisa diisi dari data nyata, **jangan buat chart itu**.

**Aturan fetch:** satu fungsi `loadData()` dipakai bersama oleh pemuatan awal, `Segarkan`, dan
`onRetry`; `loading` selalu ditutup lewat `finally`.

**Larangan:**

- Dashboard **tidak** menampilkan kartu informasi akun (`UserAuthorityCard`) — identitas
  pengguna cukup di topbar/sidebar. Jangan juga merendernya secara global di `SidebarLayout`,
  karena akan muncul di seluruh halaman.
- Jangan membungkus dashboard dengan `max-w-*`/`mx-auto`/padding luar; `SidebarLayout` sudah
  memberi kanvas ber-padding (`<main className="flex-1 p-5 sm:p-7 space-y-6">`).

---

## 6c. Navbar Landing Page (`components/Navbar.tsx`)

Seluruh aplikasi memakai satu struktur navbar yang sama (acuan:
`esurat-unusu/src/client/components/Navbar.tsx`).

- `<header className="sticky top-0 z-50 bg-white border-b border-[#CBD5E1]">` dengan baris `h-16`.
- **Kiri** — brand: kotak logo 36×36 (`w-9 h-9 rounded-[10px]`) berwarna primer repo, nama
  aplikasi, dan subteks kecil.
- **Tengah** — menu desktop (`hidden md:flex`), tiap item ikon + label, `rounded-[8px]`,
  item aktif memakai warna primer repo dan ditandai `aria-current="page"`.
- **Kanan** — belum login: tautan "Website Kampus" + tombol "Masuk SSO" → `/login`
  (seluruh autentikasi lewat ONE UNUSU SSO). Sudah login: identitas (`user?.nama` — **LPPM
  tidak punya field `name`**) + tombol `Keluar`. Hamburger `md:hidden`
  (`min-h-[44px] min-w-[44px]`, `aria-label`, `aria-expanded`).
- Menu mobile menutup diri setelah tautan diklik.
- Navbar **disembunyikan di rute panel** (prefix rute modul + `/admin`), karena panel sudah
  punya sidebar + topbar sendiri.
- **Dilarang** membuat navbar kedua di `Landing.tsx` — navbar lama wajib dihapus agar tidak dobel.

---

## 7. Aturan Status Aktif Menu Sidebar (`isActive`)

Semua sidebar panel **wajib** memakai aturan kecocokan yang sama agar tidak pernah ada dua menu aktif sekaligus:

1. **Cocok persis** — `pathname === to` → aktif.
2. **Cocok batas segmen** — `pathname.startsWith(to + '/')` → kandidat aktif. Dilarang memakai `startsWith(to)` tanpa garis miring, karena `/peran` akan ikut menyala di `/perangkat`.
3. **Kecocokan terpanjang menang** — bila beberapa menu berbagi prefix yang sama (mis. `/admin` dan `/admin/pengguna`), hanya menu dengan path **terpanjang** yang dianggap aktif.
4. **Menu ber-`end`** — menu yang menunjuk rute akar (mis. `/`) wajib ditandai `end: true` agar tidak menyala di semua halaman. Rute turunannya (mis. `/class/:id`) dipetakan manual ke menu induk.
5. **Reaktif** — status harus dihitung dari `useLocation()` (bukan `window.location.pathname`), supaya ikut berubah saat navigasi client-side.
