# Changelog

Seluruh perubahan penting pada proyek **LPPM UNUSU** didokumentasikan di berkas ini.
Format mengacu pada standar tanggal ISO (`YYYY-MM-DD`) dengan kategori: `Added`, `Changed`, `Fixed`, `Removed`, dan `Documentation`.

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
