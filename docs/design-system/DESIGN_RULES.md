# Aturan Sistem Desain (DESIGN_RULES.md)

Dokumen ini merangkum arah seni (art direction), standar geometri antarmuka, aksesibilitas, dan aturan kualitas visual untuk **LPPM UNUSU** berdasarkan implementasi aktual di repositori.

---

## 1. Identitas Visual & Arah Seni

LPPM UNUSU mengusung karakter visual **Academic Research & Institutional Precision** di dalam ekosistem ONE UNUSU:
- **Palet Inti**: Kombinasi **Violet (`violet-700` / `violet-950`)** sebagai warna identitas riset & akademik LPPM, **Amber (`amber-400` / `amber-600`)** sebagai aksen penanda sorotan dan ikon utama, serta **Slate (`#F1F5F9` / `#CBD5E1`)** sebagai kanvas netral berstruktur tegas.
- **Kejelasan Batas Kontainer**: Seluruh permukaan panel, sidebar, topbar, kartu data, dan kontrol input dibatasi oleh garis tepi eksplisit `1px solid #CBD5E1` (`border-[#CBD5E1]`) di atas latar belakang abu-abu muda `#F1F5F9`, menciptakan pemisahan hierarki visual yang jelas tanpa bergantung pada bayangan tebal (heavy drop shadows).

---

## 2. Geometri, Radius, & Spasi

Gunakan nilai radius sudut dan ukuran yang konsisten sesuai dengan komponen aktual:

| Elemen UI | Kelas Tailwind Aktual | Nilai Spesifik |
|---|---|---|
| Panel Utama (`AdminPanelTemplate`) | `rounded-[16px] border border-[#CBD5E1]` | Radius `16px`, padding header & body `p-5 sm:p-6` |
| Kartu Kontainer (`CardContainer`) & KPI Card | `rounded-[14px] border border-[#CBD5E1]` | Radius `14px`, padding konten `p-5` (KPI: `p-4 sm:p-5`) |
| Item Navigasi Sidebar, Tombol Aksi, & Input Form | `rounded-[12px]` | Radius `12px`, tinggi tombol utama `h-[42px]` |
| Tombol Toggle Sidebar & Mobile Header Button | `rounded-[10px] border border-[#CBD5E1]` | Radius `10px` |
| Ikon Indikator di Dalam Sidebar & Tombol Aksi Tabel | `rounded-[8px]` | Radius `8px` (`w-8 h-8` untuk nav icon, `p-1.5` untuk aksi tabel) |
| Tinggi Header Sidebar & Topbar Desktop | `h-[88px]` | Tinggi presisi `88px` agar garis `border-b` sejajar lurus |

---

## 3. Tata Letak Halaman & Kanvas

1. **Panel Manajemen Admin (`SidebarLayout`)**:
   - Latar belakang utama aplikasi: `bg-[#F1F5F9]`.
   - Sidebar desktop bersifat sticky (`sticky top-0 h-screen`), memiliki lebar `w-64` saat terbuka dan `w-20` saat diciutkan (`collapsed`), dengan latar ungu sangat lembut `bg-[#F8F5FB]`.
   - Area konten utama (`<main>`) menggunakan `flex-1 p-5 sm:p-7 min-w-0 w-full` untuk mencegah tabel lebar merusak lebar viewport.
2. **Halaman Publik (`LandingPage`)**:
   - Latar halaman publik menggunakan `bg-[#FDFCFE]` dengan kontainer maksimum `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
   - Hero utama (`FullHeroSlider`) menerapkan proporsi **80% visual gambar beresolusi penuh** dan **20% teks ringkas di bagian bawah kiri** di atas overlay gradasi `from-violet-950/90`.
3. **Aturan Form di Dalam Card (Part 10.8)**:
   - Setiap seksi form wajib berada di dalam `<CardContainer title="..." subtitle="...">`.
   - Tombol aksi form (`Batal` dan `Simpan`) diletakkan pada baris terpisah di bawah seluruh `CardContainer` (`flex items-center justify-end gap-3 pt-2`).

---

## 4. Standar Interaksi & State Antarmuka

Setiap halaman dan komponen interaktif wajib menangani empat state berikut secara nyata:
1. **Loading State**:
   - Pada tabel data: tampilkan spinner `ArrowPathIcon` berputar (`animate-spin text-violet-700`) dengan pesan status yang spesifik (mis. `"Memuat data penelitian..."`).
   - Pada tombol aksi selama request berlangsung: gunakan atribut `disabled={loading}` atau `disabled={submitting}` serta ubah teks tombol (mis. `"Menyimpan..."`).
2. **Empty State**:
   - Wajib merender komponen `<EmptyState />` dengan judul, deskripsi kontekstual (membedakan antara hasil pencarian kosong vs. database belum berisi data), dan tombol aksi pintas (`Tambah Sekarang`).
3. **Error State**:
   - Pada halaman daftar: gunakan komponen `<ErrorState description={error} onRetry={loadData} />`.
   - Pada halaman form: tampilkan banner peringatan `bg-rose-50 border border-rose-200 text-rose-700 rounded-[12px] p-4` di bagian atas form.
4. **Hover & Focus State**:
   - Seluruh input, select, dan textarea wajib memiliki transisi fokus `focus:outline-none focus:border-violet-600 transition-colors`.
   - Baris tabel memiliki umpan balik hover `hover:bg-violet-50/30 transition-colors`.

---

## 5. Aturan Anti-Slop & Copywriting

1. **Dilarang Menggunakan Ikon Dekoratif Tanpa Fungsi**: Jangan pernah menggunakan `SparklesIcon` atau ornamen abstrak yang tidak memiliki makna operasional.
2. **Bahasa Lugas & Kontekstual**: Gunakan terminologi resmi akademik Indonesia (seperti *NIDN*, *Skema Hibah*, *Penelitian Dosen Pemula (PDP)*, *Mitra Sasaran*, *SINTA*, *Scopus*, *DOI*). Hindari terjemahan mesin yang kaku atau jargon pemasaran hiperbolis.
3. **Pencegahan Horizontal Overflow**: Kontainer flex/grid yang membungkus tabel wajib menyertakan `min-w-0` dan pembungkus tabel langsung wajib menggunakan `w-full overflow-x-auto`.
