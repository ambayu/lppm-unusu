# Dokumentasi Proyek LPPM UNUSU

Selamat datang di repositori dokumentasi teknis dan desain untuk **LPPM UNUSU** (Lembaga Penelitian dan Pengabdian kepada Masyarakat — Universitas Nahdlatul Ulama Sumatera Utara).

## Tujuan Proyek

LPPM UNUSU adalah aplikasi web fullstack monolith yang memfasilitasi pengelolaan Tridharma Perguruan Tinggi bidang penelitian dan pengabdian masyarakat di lingkungan Universitas Nahdlatul Ulama Sumatera Utara. Sistem ini terintegrasi langsung dengan autentikasi terpusat **ONE UNUSU SSO Gateway** (`verify-token` v2).

## Tiga Modul Utama

1. **Penelitian Dosen (`/penelitian`)**
   Pengelolaan usulan proposal hibah (Penelitian Dosen Pemula/PDP, Penelitian Terapan Unggulan/PTR, Riset Kerjasama Kolaborasi, Mandiri), pemantauan dana disetujui, dan status pelaksanaan riset.
2. **Pengabdian Kepada Masyarakat / PKM (`/pengabdian`)**
   Pencatatan program pemberdayaan mitra sasaran (UMKM, koperasi, pesantren binaan, desa binaan), lokasi kegiatan, serta realisasi pendanaan PKM.
3. **Publikasi Artikel Ilmiah & Jurnal (`/publikasi`)**
   Repositori luaran artikel jurnal internasional bereputasi (Scopus/WoS), jurnal nasional terakreditasi (SINTA 1–6), prosiding seminar, dan buku ber-ISBN beserta tautan DOI.

## Tumpukan Teknologi (Tech Stack)

- **Frontend (`src/client/`)**: React 18, Vite 6, TypeScript, React Router v7, Tailwind CSS 3.4, Heroicons (`@heroicons/react/24/outline` & `solid`).
- **Backend (`src/server/`)**: Node.js, Express 4, TypeScript (`tsx` pada mode pengembangan), JSON Web Token (`jsonwebtoken`).
- **ORM & Database (`prisma/`)**: Prisma ORM 5.20 dengan database MySQL (`lppm_unusu_db`).
- **Autentikasi**: ONE UNUSU Single Sign-On (SSO) token exchange satu pintu (`/api/auth/sso` -> `/api/v2/website/verify-token`).

## Struktur Direktori

```text
lppm-unusu/
├── AGENTS.md                        # Instruksi rekayasa tingkat root
├── CHANGELOG.md                     # Catatan riwayat perubahan proyek
├── docs/                            # Dokumentasi tata kelola & sistem desain
│   ├── README.md                    # Ringkasan proyek & panduan operasional
│   ├── PROJECT_RULES.md             # Aturan arsitektur, kode, dan tata kelola global
│   └── design-system/               # Standar UI/UX LPPM UNUSU
│       ├── DESIGN_RULES.md          # Prinsip desain, aksesibilitas, dan anti-slop
│       ├── COLORS.md                # Token warna (Violet, Amber, Slate, Semantic)
│       ├── TYPOGRAPHY.md            # Skala tipografi (Plus Jakarta Sans & Monospace)
│       ├── COMPONENTS.md            # Registri komponen bersama (Shared Components)
│       └── PAGE_TEMPLATES.md        # Registri template halaman (List, Form, Auth, Landing)
├── prisma/
│   ├── schema.prisma                # Skema model Penelitian, Pengabdian, Publikasi
│   └── seed.ts                      # Data awal (seeder) database
└── src/
    ├── client/                      # Aplikasi SPA React
    │   ├── components/              # Komponen bersama & layout
    │   ├── context/                 # AuthContext (manajemen sesi JWT lokal)
    │   ├── lib/                     # Utilitas aset statis (assetUrl)
    │   ├── pages/                   # Halaman rute (Landing, Login, SsoCallback, CRUD)
    │   └── services/                # Klien Axios & kontrak tipe API
    └── server/
        └── index.ts                 # Server Express, verifikasi SSO, & endpoint REST API
```

## Cara Menjalankan Proyek

### 1. Prasyarat Lingkungan (`.env`)
Pastikan berkas `.env` di root proyek memiliki variabel berikut:
- `DATABASE_URL`: String koneksi MySQL (`mysql://user:pass@localhost:3306/lppm_unusu_db`)
- `PORT`: Port server backend (default: `5005`)
- `JWT_SECRET`: Kunci rahasia penandatanganan JWT sesi lokal (**wajib ada**, server berhenti jika kosong)
- `SSO_BASE_URL`: URL backend ONE UNUSU Gateway (default: `http://localhost:5000`)
- `SSO_CLIENT_ID`: Identitas klien SSO (default: `lppm-unusu`)
- `SSO_CLIENT_KEY`: Kunci rahasia klien SSO untuk verifikasi server-to-server
- `VITE_ONE_UNUSU_URL`: URL frontend portal ONE UNUSU (default: `http://localhost:5173`)
- `VITE_SSO_CLIENT_ID`: Client ID pada pengalihan login frontend (default: `lppm-unusu`)

### 2. Perintah NPM
- `npm run dev`: Menjalankan server Express (`localhost:5005`) dan Vite dev server (`localhost:5178`) secara bersamaan.
- `npm run build`: Membangun bundel produksi frontend (`dist/client`) dan mengompilasi TypeScript server (`dist/server`).
- `npm start`: Menjalankan server produksi dari `dist/server/index.js`.
- `npm run prisma:generate`: Menghasilkan ulang Prisma Client.
- `npm run prisma:migrate`: Menjalankan migrasi database Prisma pada lingkungan pengembangan.
- `npm run prisma:seed`: Mengisi data awal ke database.

## Aliran Data & Sub-Path Produksi

1. Pada mode pengembangan (`vite`), aplikasi berjalan di root path `/` pada port `5178` dengan proxy `/api` diarahkan ke `http://localhost:5005`.
2. Pada mode produksi (`vite build`), aplikasi menggunakan base path `/lppm/` (`PROD_BASE` di `vite.config.ts`). Seluruh referensi gambar statis wajib dibungkus dengan helper `assetUrl()` dari `src/client/lib/assets.ts` agar resolusi aset tetap akurat di balik reverse proxy.

## Lihat Juga

- [Aturan Proyek Global (`docs/PROJECT_RULES.md`)](./PROJECT_RULES.md)
- [Aturan Sistem Desain (`docs/design-system/DESIGN_RULES.md`)](./design-system/DESIGN_RULES.md)
- [Catatan Perubahan (`CHANGELOG.md`)](../CHANGELOG.md)
