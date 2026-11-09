# CHANGELOG — LPPM UNUSU

## [2026-11-09] — Desentralisasi RBAC, Manajemen Multi-Role, & URL Callback

### Added
- **Desentralisasi RBAC Penuh**: Menambahkan tabel junction `lppm_user_roles` dan migrasi database `20261109120000_decentralized_lppm_user_roles` untuk mendukung penugasan multi-role per pengguna.
- **Seeder Mandiri LPPM**: Menyemai 23 permissions granular domain penelitian, pengabdian, publikasi, monev, dan tata kelola akun (`prisma/seed.ts`).
- **Halaman Manajemen Pengguna**: Halaman penuh `/admin/pengguna`, `/admin/pengguna/tambah`, dan `/admin/pengguna/edit/:id` untuk penugasan multi-peran pengguna di LPPM (`Pengguna.tsx` & `PenggunaForm.tsx`).

### Changed
- **Endpoint SSO (`POST /api/auth/sso`)**: Membaca peran dan izin langsung dari database lokal LPPM (`lppm_user_roles` & `lppm_role_permissions`) dengan auto-provisioning akun baru.
- **Sinkronisasi Callback Lingkungan**: Penyelarasan callback lokal (`http://localhost:5178/sso/callback`) vs VPS (`/lppm/sso/callback`) yang dikontrol terpusat dari gateway ONE UNUSU.

## [2026-11-07] — Audit Anti-Slop Halaman Publik & Landasan Tipografi

### Added
- **`src/client/hooks/useReveal.ts`**: dua hook animasi. `useReveal` memunculkan elemen saat memasuki viewport (geser 20px + fade, 600ms, sekali saja); `useCountUp` menaikkan angka dari 0 ke nilai target dengan `easeOutCubic`. Keduanya mematikan diri pada `prefers-reduced-motion: reduce` dan tetap menampilkan konten bila `IntersectionObserver` tidak tersedia.
- **Satu `IntersectionObserver` bersama** untuk seluruh `Reveal` di halaman (`observerBersama()` + `WeakMap` callback). Sebelumnya setiap elemen membuat observer sendiri; dengan 24 elemen beranimasi itu berarti 24 observer aktif dan callback yang tidak sinkron. Kini biayanya konstan berapa pun jumlah elemen. `threshold` diubah dari `0.15` menjadi `0` dengan `rootMargin: 0px 0px -80px 0px`, supaya elemen tinggi (kartu, panel) tetap memicu dan animasi selesai sebelum elemen benar-benar di tepi layar.
- **24 elemen `Reveal`** tersebar di landing: dua kolom seksi `#tentang` (jeda 0 dan 120ms), tiga poin keunggulan (200ms + 70ms per indeks), tiga kartu pilar (90ms per indeks), empat kartu skema (70ms per indeks), empat kartu statistik (90ms per indeks), empat kartu alur (80ms per indeks), dan empat blok judul seksi.
- **`KartuStatistik`**: hitungan angka dimulai hanya setelah kartu itu sendiri masuk layar (`useCountUp(nilai, terlihat)`), bukan langsung saat komponen ter-mount. Setiap kartu punya animasi angkanya sendiri saat di-scroll.
- **Panel `#statistik` memakai animasi**: setiap kartu capaian masuk berurutan (jeda 90ms per kartu) dan angkanya naik dari nol setelah data API tiba, sehingga terbaca sebagai data yang baru dimuat.
- **`fontFamily` pada `tailwind.config.js`**: `sans` dan `display` dipetakan ke Plus Jakarta Sans. Sebelumnya config hanya berisi `colors`, sehingga `font-sans` jatuh ke font sistem dan tampilan bergantung pada pewarisan class `<body>`.
- **Tautan satelit footer lewat env var** (`Landing.tsx`): `VITE_LPM_URL`, `VITE_ESURAT_URL`, `VITE_LMS_URL` dengan default domain produksi `https://unusu.bpp-developer.com/{lpm,esurat,lms}`. Sebelumnya di-hardcode `http://localhost:5177/5175/3001`.
- **Angka capaian riset diikat ke data nyata** (`Landing.tsx`): seksi `#statistik` kini memanggil `fetchPenelitian()`, `fetchPengabdian()`, dan `fetchPublikasi()` lalu menampilkan jumlah sebenarnya. Saat data belum termuat ditampilkan `...`, dan saat permintaan gagal muncul keterangan bahwa arsip tidak dapat diakses.

### Changed
- **`font-black` → `font-extrabold`** di 24 lokasi: `Dashboard.tsx` (8), `Login.tsx` (6), `Monev.tsx` (4), `LaporanCharts.tsx` (3), `Landing.tsx` (2), `FullHeroSlider.tsx` (1). Weight 900 tidak pernah dimuat dari Google Fonts, sehingga selama ini dirender lewat sintesis browser yang hasilnya berbeda antar-browser.
- **`<body class="font-sans ...">`** (`index.html`): tidak lagi memakai arbitrary value `font-['Plus_Jakarta_Sans',sans-serif]`.
- **Statistik karangan dihapus**: `120+`, `85+`, dan `240+` diganti angka dari API. Klaim `14 Program Studi Terintegrasi` dipertahankan karena merupakan fakta struktural universitas.
- **Label status tanpa data dihapus**: "Terdokumentasi", "Berdaya Saing", dan "Terverifikasi" pada tiga kartu layanan diganti keterangan cakupan layanan yang faktual (mis. "Cakupan: SINTA, Scopus, paten, hak cipta").
- **Badge pill eyebrow dihapus dari seluruh seksi landing**: seksi `#tentang`, `#layanan`, `#skema`, `#statistik`, dan `#alur` tidak lagi dibuka dengan `<span>` berbentuk pill (`rounded-full` + `uppercase tracking-widest`). Label itu hanya mengulang judul di bawahnya tanpa menambah informasi, dan pola yang identik di lima seksi terbaca sebagai template. Judul `h2` kini menjadi pembuka seksi. Satu-satunya `rounded-full` yang tersisa di halaman adalah bulatan penanda daftar poin keunggulan, yang memang berfungsi sebagai bullet.
- **Pola eyebrow ONE UNUSU diterapkan di seluruh seksi landing**: setiap seksi dibuka dengan `<p>` bergaris pendek (`h-px w-8 bg-current`) yang menampung label ber-`tracking-[0.2em]` dan `font-semibold`. Ini menggantikan badge pill yang sebelumnya dihapus. Label dibuat informatif, bukan pengulangan judul: *Tentang Platform*, *Tiga Pilar*, *Empat Skema*, *Arsip Berjalan*, *Empat Tahap*. Warna emas (`text-amber-700`, `text-amber-300` pada panel gelap) sebagai aksen, bukan violet. `h2` diseragamkan ke `text-3xl font-semibold tracking-tight text-balance sm:text-4xl`, deskripsi `text-base text-pretty`.
- **Eyebrow memakai tanda baca vertikal, bukan garis ONE UNUSU**: pola `h-px w-8` (garis tidur) dihapus seluruhnya dari landing. Seksi rata kiri (`#tentang`) memakai bilah tegak `border-l-2 border-amber-600 pl-3`; seksi rata tengah (`#layanan`, `#skema`, `#alur`) memakai pengapit `border-y-2 border-amber-600 py-1.5` sebagai gantinya, karena bilah tegak sepihak pada blok terpusat terbaca miring. Panel gelap `#statistik` memakai `border-amber-300`. Warna teks dinaikkan ke `amber-800` untuk kontras AA di atas latar terang.
- **Palet disederhanakan menjadi hitam–ungu–putih** pada seluruh halaman publik (`Landing.tsx`, `Login.tsx`, `Navbar.tsx`, `FullHeroSlider.tsx`): amber dihapus seluruhnya. Pemetaan: eyebrow bilah `amber-600/800` → `violet-700/800`; ikon centang di dalam bulatan ungu → putih; kartu PKM `bg-amber-50` → `bg-violet-50`; angka statistik `text-amber-300` → `text-white`; header footer dan tautan `text-amber-400` → `text-white`; `selection:bg-amber-400` → `selection:bg-violet-700`; CTA hero `bg-amber-400` → `bg-white text-violet-950`. Warna kartu skema yang sebelumnya acak (`emerald`, `blue`, `amber`, `purple`) diseragamkan ke violet dengan dua tingkat (`violet-700` / `violet-800`) agar tetap ada pembeda tanpa pelangi. Gradien plakat profil kehilangan komponen `via-amber-100`.
- **Hero slider menjadi full height** (`FullHeroSlider.tsx`): tinggi `h-[580px] sm:h-[620px] lg:h-[660px]` diganti `h-[calc(100svh-4rem)] min-h-[560px] max-h-[1080px]`. Nilai `4rem` mengimbangi navbar `sticky h-16` sehingga tidak muncul scrollbar hantu. `svh` dipakai agar bilah alamat browser seluler tidak memotong hero. Tipografi dalam hero dinaikkan mengikuti tinggi baru (headline `text-3xl sm:text-5xl lg:text-6xl` dengan `leading-[1.05]` dan `text-balance`, subjudul `text-sm sm:text-lg`).
- **Tekstur latar pada seksi terang** (`src/client/components/LatarDekoratif.tsx`, dipakai 4 seksi di `Landing.tsx`): seksi `#tentang` dan `#layanan` memakai titik grid 22px (`radial-gradient`) plus satu bentuk gradien blur; seksi `#skema` memakai kisi garis 64px yang di-*mask* radial agar memudar di tepi, menandai isinya yang bersifat tabular; seksi `#alur` memakai tiga lingkaran konsentris SVG. Semua lapisan `aria-hidden` + `pointer-events-none`, dan konten dibungkus `relative` agar tetap di atas. Seksi diberi `relative isolate overflow-hidden` supaya bentuk tidak meluber dan tidak menumbulkan scroll horizontal.
- **Seragam ikon kartu layanan**: tiga kartu memakai kotak `bg-violet-50 text-violet-700 border-violet-100` dengan ikon `w-7 h-7`. Kartu ketiga sebelumnya menyimpang (`bg-violet-700 text-white`).
- **Semua judul `h2` seksi**: `tracking-normal` → `tracking-tight`; judul `#statistik` diberi `text-white` eksplisit.
- **Body copy dinaikkan `text-xs` → `text-sm`**: kartu layanan, kartu skema, dan kartu alur pengajuan. Deskripsi seksi `text-xs sm:text-sm` → `text-sm`.
- **Kontras footer**: `text-slate-400` → `text-slate-300`; label "Sasaran:"/"Target Luaran:" `text-slate-400` → `text-slate-500`.
- **Tap target tautan footer**: `<a>` diberi `min-h-[44px]` sesuai ambang WCAG.
- **Em-dash dihapus** dari `Landing.tsx`, `Login.tsx`, `Navbar.tsx` (termasuk `aria-label`), dan `FullHeroSlider.tsx`.
- **Ornamen tanpa fungsi dibuang**: `shadow-2xs`/`shadow-xs` pada kartu bersudut, `shadow-md`/`transition-all` pada kartu layanan, `backdrop-blur-xs`. Bayangan tipis diperkuat border yang sudah ada; `transition` diganti `transition-colors` karena hanya warna border yang berubah.
- **Struktur semantik kartu skema**: `<span>`/`<strong>` diganti `<dl>`/`<dt>`/`<dd>`.

## [2026-11-06] — Dashboard Laporan Baru & Template Formulir Seragam

### Added
- **`/dashboard` — halaman dashboard laporan LPPM** (`src/client/pages/Dashboard.tsx`): halaman beranda panel baru berisi laporan ringkas tiap menu — metrik Penelitian/Pengabdian/Publikasi/Monev, donut status penelitian, bar bidang fokus riset, kolom tren kegiatan tridharma per tahun, bar bertingkat jenis publikasi, bar mitra pengabdian, donut status monev, bar sumber dana, dan dua `GaugeRing` capaian program. Tanpa panel aksi cepat.
- `src/client/components/LaporanCharts.tsx`, `src/client/components/FormPageTemplate.tsx`.
- Menu sidebar **Dashboard Laporan** pada `SidebarLayout`.

### Changed
- **`AdminEntryRoute` & `AdminOnlyRoute`** (`src/client/App.tsx`): tujuan pengalihan diubah dari `/penelitian` ke `/dashboard`, sesuai aturan "setelah login semua peran mendarat di dashboard".
- **Halaman formulir** (`PenelitianForm.tsx`, `PengabdianForm.tsx`, `PublikasiForm.tsx`, `MonevForm.tsx`): seluruhnya dimigrasikan ke `FormPageTemplate`.
- **Seksi Tentang Platform** (`src/client/pages/Landing.tsx`): ditulis langsung di halaman dengan pola baku ONE UNUSU — teks di kiri, foto potret di kanan, grid 6:6. Anchor `#tentang` dipertahankan. Foto memakai `public/assets/profil-peneliti.png` (PNG 1024×958 dengan alpha channel) melalui helper `assetUrl()`. Komponen pembungkus `TentangPlatform.tsx` dibatalkan dan dihapus karena hanya memiliki satu pemakaian.
- **Sidebar** (`src/client/components/SidebarLayout.tsx`): `isActive` memakai batas segmen + kecocokan terpanjang; label grup menu sistem menjadi **TATA KELOLA**.

### Documentation
- `docs/design-system/COMPONENTS.md` dan `PAGE_TEMPLATES.md` diperbarui.

### Verification
- `tsc --noEmit` — bersih. `vite build` — berhasil.

Format mengikuti standar ISO `[YYYY-MM-DD]`. Riwayat sebelum tanggal ini tidak direkonstruksi; lihat riwayat git untuk perubahan lebih awal.

## [2026-11-06]

### Changed
- **Hero slider landing** (`src/client/components/FullHeroSlider.tsx`): tata letak diseragamkan dengan ekosistem — teks di kiri-bawah, indikator titik di kiri-bawah, tombol panah + penghitung slide (`01 / 04`) di kanan-bawah. Ditambahkan jeda autoplay saat kursor berada di atas slider, radius kontrol diseragamkan `8px`, target sentuh minimal 44px, `aria-current` pada titik aktif, serta atribut `width`/`height`/`decoding` pada gambar slide. CTA hero berpindah dari `violet-700` ke aksen `amber-400`.
- **Aset hero diganti total** (`public/assets/hero/lppm-hero-1..4.png`): empat fotografi khusus bertema laboratorium riset, pendampingan masyarakat, meja editorial jurnal, dan ruang baca pustaka. Gambar lama (visual kampus umum) tidak dipakai lagi.
- **Navbar landing** (`src/client/pages/Landing.tsx`): blok header lama (brand `blue/violet` bertinggi 80px) diganti struktur baku — brand kiri (logo + `LPPM UNUSU` + subteks), menu tengah, aksi kanan (`Masuk SSO` / `Panel Peneliti`). Tinggi bar menjadi 64px, palet memakai `violet-700`/`amber-400`, dan menu mobile memakai target 44px.
- **Panel manajemen** (`src/client/components/SidebarLayout.tsx`): `UserAuthorityCard` kini dirender otomatis di atas konten setiap halaman panel, sehingga seluruh rute admin menampilkan identitas sesi tanpa perubahan per halaman.

### Added
- `src/client/components/UserAuthorityCard.tsx` — kartu otoritas pengguna dengan empat atribut: `USERNAME`, `HAK AKSES`, `UNIT KERJA`, `STATUS AKUN`. Unit kerja diambil berurutan `unitKerja → prodi → fakultas`; status default `Aktif`. Berbasis Heroicons sesuai `AGENTS.md`.

### Removed
- `src/client/components/Navbar.tsx` — komponen mati (tidak dirujuk file mana pun, memakai `lucide-react`, dan mengarah ke `localhost`). Navbar landing page kini inline di `Landing.tsx`.

### Documentation
- `docs/design-system/COMPONENTS.md`: menambahkan baris registri `UserAuthorityCard`, spesifikasi kontrak props di §2.6, catatan render otomatis pada §2.5 `SidebarLayout`, dan menandai `Navbar` sebagai komponen terhapus.

### Verification
- `npx vite build` — berhasil (client bundle terbentuk).
- `npx tsc --noEmit` — keluar dengan kode 0 (tanpa galat tipe).
- Repo ini belum memiliki berkas audit test; verifikasi dilakukan melalui build + typecheck.
