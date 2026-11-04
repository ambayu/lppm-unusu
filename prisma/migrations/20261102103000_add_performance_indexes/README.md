# Migrasi `20261102103000_add_performance_indexes`

Status: **SIAP DITINJAU — BELUM DIEKSEKUSI**.
Berkas ini disiapkan oleh tim engineering (Programmer) dan **tidak** dijalankan terhadap
database mana pun, termasuk database lokal, sampai ada persetujuan eksplisit.

## 1. Ringkasan Perubahan

Migrasi ini **hanya menambah index** (additive DDL). Tidak ada:

- `DROP TABLE` / `DROP COLUMN` / `ALTER COLUMN`,
- `UPDATE` / `DELETE` / backfill data,
- perubahan tipe data, enum, atau constraint yang sudah ada.

Total **15 index baru** pada 5 tabel:

| Tabel | Index baru | Query yang dilayani |
| --- | --- | --- |
| `lppm_penelitian` | `createdAt`, `tahun+status`, `bidangFokus`, `nidn` | `GET /api/penelitian` (sort, filter tahun/status/bidang, cari NIDN) |
| `lppm_pengabdian` | `createdAt`, `tahun+status`, `mitra`, `nidn` | `GET /api/pengabdian` (sort, filter, rekap mitra) |
| `lppm_publikasi` | `tahun`, `jenis+tahun`, `penulis` | `GET /api/publikasi` (sort tahun, filter jenis, riwayat penulis) |
| `lppm_monitoring_evaluasi` | `createdAt`, `tanggalJadwal`, `nidnReviewer` | `GET /api/monev` (pagination, agenda, riwayat reviewer) |
| `lppm_permissions` | `modul` | `GET /api/permissions` (`ORDER BY modul, kode`) |

Index lama dari migrasi `20261028090000_create_monitoring_evaluasi`
(`penelitianId`, `pengabdianId`, `jenisProgram+status`, `tahap`) **tidak diubah**.

## 2. Alasan Keamanan

1. **Additive only** — struktur tabel dan seluruh baris data tetap utuh; rollback
   cukup menghapus index (`rollback.sql`).
2. **Online DDL** — setiap statement memakai `ALGORITHM = INPLACE, LOCK = NONE`
   (MySQL 5.6+/InnoDB), sehingga `SELECT/INSERT/UPDATE` tetap berjalan selama
   pembuatan index. Tidak ada downtime terjadwal.
3. **Tanpa index pada kolom `TEXT`** — semua kolom yang di-index bertipe
   `INT`, `DATETIME`, atau `VARCHAR(50–191)`. Kolom `judul`, `anggota`,
   `targetLuaranWajib`, `catatanReviewer` (TEXT) sengaja **tidak** di-index
   agar tidak memicu error `BLOB/TEXT column used in key specification`.
4. **Ukuran kecil** — perkiraan tambahan storage < 5% dari ukuran tabel saat ini
   (data operasional LPPM: ribuan baris, bukan jutaan).
5. **Reversible** — `rollback.sql` disediakan dan hanya berisi `DROP INDEX`.

## 3. Dampak yang Perlu Diterima

- Waktu pembuatan index proporsional dengan jumlah baris; pada volume data saat ini
  diperkirakan **< 5 detik per index**.
- Beban tulis (`INSERT/UPDATE`) naik tipis karena MySQL harus memelihara 15 index
  tambahan. Ini trade-off yang disengaja untuk mempercepat query daftar/filter.
- `lppm_publikasi.penulis` dan `lppm_pengabdian.mitra` adalah `VARCHAR(191)`;
  bila nanti perlu `FULLTEXT`, itu migrasi terpisah.

## 4. Prosedur Eksekusi (setelah approval)

```bash
# 0. Backup logis (wajib, dijalankan manual oleh operator DB)
mysqldump --single-transaction --routines --triggers \
  lppm_unusu_db > backup_before_indexes_$(date +%Y%m%d_%H%M).sql

# 1. Cek tidak ada index bernama sama (harus kosong)
mysql -e "SELECT TABLE_NAME, INDEX_NAME FROM information_schema.STATISTICS
          WHERE TABLE_SCHEMA='lppm_unusu_db' AND INDEX_NAME LIKE '%\_idx'
          AND INDEX_NAME IN ('lppm_penelitian_createdAt_idx', ...);"

# 2. Terapkan migrasi (pilih salah satu)
npx prisma migrate deploy        # jalur standar Prisma
# atau, bila ingin menerapkan manual tanpa menyentuh _prisma_migrations:
mysql lppm_unusu_db < prisma/migrations/20261102103000_add_performance_indexes/migration.sql

# 3. Verifikasi
#    - SHOW INDEX FROM lppm_monitoring_evaluasi;
#    - EXPLAIN pada query acuan (lihat bagian komentar di migration.sql)
#    - smoke test: GET /api/penelitian, /api/pengabdian, /api/publikasi, /api/monev
```

Bila langkah 3 gagal atau performa memburuk:

```bash
mysql lppm_unusu_db < prisma/migrations/20261102103000_add_performance_indexes/rollback.sql
```

## 5. Checklist Approval

- [ ] Backup `lppm_unusu_db` tersedia dan terverifikasi.
- [ ] Migrasi diuji lebih dulu di staging (`prisma migrate deploy`).
- [ ] `EXPLAIN` query acuan menunjukkan index terpakai (tanpa `Using filesort`).
- [ ] Jendela eksekusi disetujui (meski online DDL, tetap disarankan di luar jam sibuk).
- [ ] Rollback plan dipahami operator DB.

> **Catatan**: `migration.sql` di folder ini **belum** tercatat di tabel
> `_prisma_migrations`. Bila diterapkan via `prisma migrate deploy`, Prisma akan
> mencatatnya otomatis. Bila diterapkan manual via `mysql`, tambahkan entri
> riwayat migrasi atau gunakan `prisma migrate resolve --applied 20261102103000_add_performance_indexes`
> agar status migrasi tetap konsisten.
