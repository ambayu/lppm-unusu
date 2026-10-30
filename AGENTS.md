# LPPM UNUSU - Engineering Instructions

## Project
LPPM UNUSU - Lembaga Penelitian & Pengabdian kepada Masyarakat
Universitas Nahdlatul Ulama Sumatera Utara

## Technology Stack
- Frontend (`src/client/`): Vite + React 18, TypeScript, Tailwind CSS, Heroicons (`@heroicons/react`)
- Backend (`src/server/`): Node.js Express, TypeScript, Prisma ORM
- Database: MySQL (`lppm_unusu_db`)
- SSO Integration: Terhubung ke ONE UNUSU Gateway (`verify-token` v2)

## Modul Utama LPPM UNUSU
1. **Penelitian Dosen**: Pengusulan hibah, pemantauan kemajuan riset (PDP, Terapan, Kerjasama), dan pelaporan luaran penelitian.
2. **Pengabdian Kepada Masyarakat (PKM)**: Kemitraan desa binaan, pesantren, UMKM, dan pemberdayaan komunitas masyarakat berbasis Aswaja.
3. **Publikasi Artikel Ilmiah & Jurnal**: Repositori artikel jurnal terindeks Scopus, SINTA, prosiding seminar nasional, dan HKI dosen.

## Icon & UI Standards
1. **Icon Library**: Wajib menggunakan Heroicons (`@heroicons/react/24/outline` atau solid). Hindari icon Lucide atau library icon lain.
2. **Anti-Sparkles Rule**: Dilarang keras menggunakan ikon sparkles. Gunakan ikon fungsional yang spesifik (AcademicCap, Beaker, Heart, BookOpen, dll).
3. **Admin Panel Template & SidebarLayout**: Seluruh halaman panel manajemen dibungkus dalam `AdminPanelTemplate` dan `SidebarLayout` standar ekosistem ONE UNUSU dengan border `#CBD5E1`, sudut `rounded-[16px]`, dan palette violet/amber.
4. **CRUD Full Pages (No Modals)**: Proses penambahan dan pengeditan data wajib menggunakan full page `/tambah` dan `/edit/:id` (tidak menggunakan modal popup).
5. **Horizontal Scroll Table**: Setiap tabel data harus mendukung `w-full overflow-x-auto` dengan `min-w-[1080px]` serta menyertakan audit trail metadata (`createdAt`).
6. **SSO Gateway Compliance**: Seluruh autentikasi wajib melewati ONE UNUSU SSO token exchange.
