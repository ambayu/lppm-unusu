# Server API Rules — LPPM UNUSU (`src/server`)

## Purpose and Scope
Modul `src/server` menyediakan REST API utama untuk sistem **LPPM UNUSU**, mencakup:
1. Pertukaran token SSO ONE UNUSU & manajemen sesi JWT lokal (`/api/auth/*`).
2. Ringkasan statistik agregat kinerja Tridharma LPPM (`/api/stats`).
3. CRUD & pencarian/pemfilteran **Penelitian Dosen** (`/api/penelitian`).
4. CRUD & pencarian/pemfilteran **Pengabdian kepada Masyarakat / PKM** (`/api/pengabdian`).
5. CRUD & pencarian/pemfilteran **Publikasi Ilmiah & Jurnal** (`/api/publikasi`).

Modul ini tidak menangani penyimpanan berkas biner langsung (dokumen disimpan sebagai URL referensi seperti `laporanUrl` dan `doiUrl`).

## Component Structure
- `src/server/index.ts` — Bootstrap Express, konfigurasi CORS, static serving SPA (`dist/client`), registrasi router `/api`, fallback `/api/*` 404 JSON, SPA fallback, dan global error middleware.
- `src/server/lib/prisma.ts` — Singleton instance `PrismaClient`.
- `src/server/lib/errors.ts` — Kelas `ApiError`, helper `asyncHandler`, dan utilitas respons JSON terstandar (`sendSuccess`).
- `src/server/lib/serializers.ts` — Normalisasi entitas Prisma (konversi `Prisma.Decimal` `danaDisetujui` ke `number | null`).
- `src/server/middleware/auth.ts` — Verifikasi Bearer JWT sesi lokal (`authenticate`), pemeriksa role (`requireRole`), dan tipe `AuthRequest` / `SsoSession`.
- `src/server/middleware/errorHandler.ts` — Penanganan terpusat untuk `ApiError`, `ZodError`, `PrismaClientKnownRequestError` (`P2025`, `P2002`), syntax error JSON body, dan fallback `500`.
- `src/server/schemas/lppm.schema.ts` — Skema validasi Zod untuk parameter `:id`, body SSO, query list, serta payload create/update Penelitian, Pengabdian, dan Publikasi.
- `src/server/routes/auth.routes.ts` — Endpoint `POST /api/auth/sso` dan `GET /api/auth/me`.
- `src/server/routes/stats.routes.ts` — Endpoint `GET /api/stats` (ringkasan KPI lintas modul).
- `src/server/routes/penelitian.routes.ts` — Endpoint CRUD Penelitian Dosen beserta kontrol akses kepemilikan/admin.
- `src/server/routes/pengabdian.routes.ts` — Endpoint CRUD Pengabdian (PKM) beserta kontrol akses kepemilikan/admin.
- `src/server/routes/publikasi.routes.ts` — Endpoint CRUD Publikasi Jurnal beserta kontrol akses.

## API, Validation & Business Logic Rules
1. **Kontrak Respons JSON**:
   - Setiap respons sukses wajib memuat `success: true`, diikuti `data` (opsional `meta` dan `message`).
   - Setiap respons error wajib memuat `success: false`, `message` berbahasa Indonesia yang jelas, `code` terstruktur (`VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`), serta `errors: [{ field, message }]` khusus kegagalan validasi `400`.
2. **Validasi Input (Zod)**:
   - Parameter `:id` harus bilangan bulat positif (`z.coerce.number().int().positive()`). ID non-numerik langsung ditolak dengan `400 VALIDATION_ERROR`, bukan diteruskan sebagai `NaN` ke Prisma.
   - String wajib di-`trim()` dan divalidasi panjang minimalnya. String opsional kosong (`""`) dinormalisasi menjadi `null`.
   - `tahun` dibatasi pada rentang tahun akademik wajar (`1990`–`2100`).
   - `danaDisetujui` menerima angka atau string numerik `>= 0` (maksimal `9_999_999_999.99` sesuai `Decimal(12,2)`), atau `null` bila kosong.
   - `doiUrl` dan `laporanUrl` bila diisi harus berupa URL `http://` atau `https://` yang valid.
3. **Aturan Otorisasi & Logika Bisnis**:
   - Hanya role SSO `SUPERADMIN`, `ADMIN_LPPM`, dan `DOSEN` yang dapat menukar token SSO ke sesi LPPM (`admin` atau `dosen`).
   - **Pembacaan (`GET`)**: Seluruh pengguna terautentikasi (`admin`, `dosen`) dapat membaca daftar, detail, dan statistik, serta memfilter menggunakan query `?search=...`, `?tahun=...`, dan filter spesifik modul (`bidangFokus`, `status`, `jenis`, `nidn`).
   - **Pengajuan / Pencatatan (`POST`)**:
     - `admin` dan `dosen` diizinkan membuat data Penelitian, Pengabdian, dan Publikasi.
     - Khusus `dosen` pada Penelitian & Pengabdian: apabila akun memiliki `nidn` pada sesi SSO, `nidn` otomatis disesuaikan/dijaga atau proposal baru otomatis berstatus awal `"Pengajuan"` kecuali ditetapkan oleh `admin`. (`admin` bebas menetapkan status seperti `"Disetujui"`, `"Pelaksanaan"`, `"Selesai"`).
   - **Pembaruan (`PUT`)**:
     - `admin` dapat memperbarui seluruh field termasuk `status` dan `danaDisetujui`.
     - `dosen` hanya dapat memperbarui Penelitian/Pengabdian yang memiliki `nidn` sama dengan `user.nidn` miliknya (atau nama ketua cocok bila `nidn` sesi kosong), dan `dosen` tidak dapat mengubah `status` persetujuan maupun `danaDisetujui` secara sepihak pada mode edit. Untuk Publikasi, `dosen` dapat memperbarui publikasi yang mencantumkan namanya pada `penulis`.
   - **Penghapusan (`DELETE`)**:
     - `admin` dapat menghapus seluruh entitas.
     - `dosen` hanya dapat menghapus usulan Penelitian/Pengabdian miliknya yang masih berstatus `"Pengajuan"`.

## Do-Not-Change Items
- Alur pertukaran SSO ke `${SSO_BASE_URL}/api/v2/website/verify-token` beserta kontrak `{ client_id, token }` pada `POST /api/auth/sso`.
- Nama tabel & kolom pada `prisma/schema.prisma` (`lppm_penelitian`, `lppm_pengabdian`, `lppm_publikasi`) tanpa persetujuan migrasi eksplisit.
- Kompatibilitas mundur payload `GET /api/penelitian`, `GET /api/pengabdian`, dan `GET /api/publikasi` (`{ success: true, data: [...] }`) yang dikonsumsi langsung oleh `src/client/services/api.ts`.

## Dependencies
- `express`, `@prisma/client`, `jsonwebtoken`, `zod`, `cors`, `dotenv`
- Eksternal: ONE UNUSU SSO Gateway (`SSO_BASE_URL`, `SSO_CLIENT_ID`, `SSO_CLIENT_KEY`)

## Related Documentation
- `AGENTS.md`
- `docs/PROJECT_RULES.md`
- `CHANGELOG.md`
