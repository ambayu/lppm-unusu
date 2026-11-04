# Audit Trail — `lppm_audit_log`

Jejak mutasi data LPPM UNUSU. Tabel bersifat **append-only**: aplikasi hanya
melakukan `INSERT`, tidak ada endpoint `UPDATE`/`DELETE`.

## 1. Struktur

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | INT PK AI | |
| `aktorId` | INT NULL | id user dari sesi SSO ONE UNUSU |
| `aktorNidn` | VARCHAR(50) NULL | NIDN dosen (bila ada) |
| `aktorNama` | VARCHAR(150) NULL | nama tampilan sesi |
| `aktorRole` | VARCHAR(50) NULL | role lokal (`admin` / `dosen` / …) |
| `aksi` | ENUM | `CREATE` \| `UPDATE` \| `DELETE` |
| `entitas` | VARCHAR(50) | `penelitian`, `pengabdian`, `publikasi`, `monev`, `role`, `permission` |
| `entitasId` | INT NULL | id record; `NULL` bila operasi koleksi |
| `metode` | VARCHAR(10) | `POST` \| `PUT` \| `PATCH` \| `DELETE` |
| `path` | VARCHAR(255) | path request asli (termasuk query string) |
| `statusCode` | INT | status HTTP respons |
| `ringkasan` | TEXT NULL | payload JSON yang sudah disaring & dipotong 2000 karakter |
| `ipAddress` | VARCHAR(64) NULL | IP klien |
| `createdAt` | DATETIME(3) | waktu kejadian |

Index: `createdAt`, `(entitas, entitasId)`, `aktorNidn`, `(aksi, createdAt)`.

## 2. Alur Penulisan

```
Request POST/PUT/PATCH/DELETE
  → authenticate (JWT sesi lokal)
  → createAuditLogger(prisma)      // src/server/lib/auditLog.ts
  → handler bisnis (Prisma)
  → res.json(...)
  → res.on("finish") → INSERT lppm_audit_log   (fire-and-forget)
```

Aturan:

- Hanya dicatat bila `statusCode < 400` (mutasi gagal tidak masuk log).
- Penulisan log **tidak pernah** menggagalkan request (semua error ditelan).
- Field sensitif (`password`, `token`, `authorization`, `secret`, `clientKey`,
  `cvv`, `kartu`) diganti `[REDACTED]`.
- Objek/array bersarang diringkas menjadi `[objek]` agar log tetap ringkas.

## 3. Membaca Log

`GET /api/audit-log` — **hanya role `admin`**.

| Parameter | Contoh | Keterangan |
| --- | --- | --- |
| `page`, `limit` | `?page=1&limit=25` | pagination (limit maks. 100, default 25) |
| `entitas` | `?entitas=penelitian` | filter entitas |
| `aksi` | `?aksi=DELETE` | filter aksi |
| `aktor` | `?aktor=1987` | cari pada NIDN atau nama aktor |
| `search` | `?search=monev` | cari pada path/entitas/ringkasan |
| `dari`, `sampai` | `?dari=2026-11-01&sampai=2026-11-30` | rentang tanggal (YYYY-MM-DD) |

Respons: `{ success, data: AuditLog[], pagination: { page, limit, total, totalPages } }`.

## 4. Retensi & Pembersihan

- Retensi disarankan **12–24 bulan** (kebijakan LPPM).
- Pembersihan dilakukan **manual oleh operator DB**, bertahap, dan setelah approval:

```sql
DELETE FROM lppm_audit_log
WHERE createdAt < DATE_SUB(NOW(), INTERVAL 24 MONTH)
LIMIT 10000;   -- ulangi hingga selesai, di luar jam sibuk
```

- Jangan `TRUNCATE` tabel ini di produksi.

## 5. Migrasi Terkait

| Migrasi | Isi | Status |
| --- | --- | --- |
| `20261102103000_add_performance_indexes` | 15 index kinerja (additive) | belum dieksekusi |
| `20261103100000_add_audit_log` | tabel `lppm_audit_log` + 4 index | belum dieksekusi |

Keduanya menunggu `[APPROVAL_REQUIRED]` sebelum dijalankan.
