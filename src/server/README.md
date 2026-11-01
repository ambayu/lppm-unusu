# LPPM UNUSU Backend API (`src/server`)

## Purpose
Backend monolith berbasis Node.js, Express, TypeScript, Zod, dan Prisma ORM (MySQL) yang melayani REST API pengelolaan Penelitian Dosen, Pengabdian kepada Masyarakat (PKM), Publikasi Ilmiah, ringkasan kinerja LPPM, serta autentikasi SSO ONE UNUSU dan penyajian aset SPA frontend.

## Key Functions
- **SSO Token Exchange & Session Guard**: Menukar one-time token dari ONE UNUSU Gateway menjadi JWT sesi lokal berdurasi 7 hari serta membatasi akses hanya bagi Administrator LPPM dan Dosen.
- **Validasi Skema Terpusat (Zod)**: Memvalidasi parameter `:id`, filter query, dan payload transaksi sebelum eksekusi database.
- **Manajemen Tridharma (Penelitian, PKM, Publikasi)**: Menyediakan operasi CRUD, filter pencarian server-side, serialisasi nilai desimal pendanaan, dan aturan bisnis berbasis peran (`admin` vs `dosen`).
- **Agregasi Kinerja (`/api/stats`)**: Menghitung total riset, program PKM, sebaran publikasi, dan total serapan pendanaan.
- **Penanganan Error Konsisten**: Mengubah error validasi, otorisasi, JSON malformed, dan Prisma (`P2025`, `P2002`) menjadi respons JSON terstruktur.

## Directory Structure
```
src/server/
├── index.ts                    # Entry point Express, static SPA & router mounting
├── RULES.md                    # Aturan implementasi, validasi & kontrak API
├── README.md                   # Dokumentasi arsitektur modul server
├── lib/
│   ├── errors.ts               # ApiError, asyncHandler & response helpers
│   ├── prisma.ts               # Singleton PrismaClient
│   └── serializers.ts          # Serialisasi Decimal Prisma ke number JSON
├── middleware/
│   ├── auth.ts                 # Middleware JWT authenticate & requireRole
│   └── errorHandler.ts         # Global error & 404 API handler
├── schemas/
│   └── lppm.schema.ts          # Skema Zod (Auth, Penelitian, Pengabdian, Publikasi)
└── routes/
    ├── auth.routes.ts          # POST /api/auth/sso, GET /api/auth/me
    ├── stats.routes.ts         # GET /api/stats
    ├── penelitian.routes.ts    # CRUD /api/penelitian
    ├── pengabdian.routes.ts    # CRUD /api/pengabdian
    └── publikasi.routes.ts     # CRUD /api/publikasi
```

## Data Flow
1. Request masuk ke Express (`src/server/index.ts`) → melewati parser JSON & CORS.
2. Endpoint publik (`/api/health`, `POST /api/auth/sso`) diproses langsung; seluruh endpoint `/api/*` lainnya melewati middleware `authenticate`.
3. Handler route memvalidasi `req.params`, `req.query`, dan `req.body` dengan skema Zod (`src/server/schemas/lppm.schema.ts`).
4. Logika bisnis & otorisasi kepemilikan diverifikasi, lalu query dijalankan melalui Prisma (`src/server/lib/prisma.ts`) dan dinormalisasi oleh `serializers.ts`.
5. Respons dikirim lewat `sendSuccess(...)` atau dilempar ke `errorHandler` bila terjadi `ZodError` / `ApiError` / Prisma error.

## How to Run or Test
- Pengembangan: `npm run dev:server`
- Pemeriksaan tipe & kompilasi server: `npm run build:server`
- Build penuh (client + server): `npm run build`

## See Also
- [RULES.md](./RULES.md)
- [../../docs/PROJECT_RULES.md](../../docs/PROJECT_RULES.md)
- [../../CHANGELOG.md](../../CHANGELOG.md)
