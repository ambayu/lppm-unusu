# Strategi Index & Query Aman — LPPM UNUSU

Dokumen ini memetakan setiap index di `prisma/schema.prisma` ke query yang
dilayaninya, plus aturan agar perubahan skema berikutnya tetap aman.

## 1. Peta Index → Query

| Tabel | Index | Dipakai oleh |
| --- | --- | --- |
| `lppm_penelitian` | `createdAt` | `GET /api/penelitian` default (`ORDER BY createdAt DESC, id DESC`) |
| | `tahun, status` | filter `?tahun=2026&status=Disetujui` |
| | `bidangFokus` | filter bidang fokus pada halaman Penelitian |
| | `nidn` | pencarian usulan milik dosen (`?search=<nidn>`) |
| `lppm_pengabdian` | `createdAt` | `GET /api/pengabdian` default |
| | `tahun, status` | filter tahun + status |
| | `mitra` | rekap per mitra (SMK NU, Pesantren, UMKM) |
| | `nidn` | pencarian kegiatan per dosen |
| `lppm_publikasi` | `tahun` | `GET /api/publikasi` (`ORDER BY tahun DESC, id DESC`) |
| | `jenis, tahun` | filter jenis (Scopus/SINTA/Prosiding) per tahun |
| | `penulis` | riwayat publikasi penulis |
| `lppm_monitoring_evaluasi` | `penelitianId`, `pengabdianId` | relasi polimorfik + `ON DELETE CASCADE` |
| | `jenisProgram, status` | dashboard monev per program & status |
| | `tahap` | filter tahap (Antara/Akhir/Lapangan) |
| | `createdAt` | pagination `GET /api/monev` (`ORDER BY createdAt DESC, id DESC`) |
| | `tanggalJadwal` | agenda/kalender monev terdekat |
| | `nidnReviewer` | riwayat penugasan reviewer |
| `lppm_permissions` | `modul` | `GET /api/permissions` (`ORDER BY modul, kode`) |
| `lppm_role_permissions` | `roleId, permissionId` (unique) | join otorisasi per role |

## 2. Aturan Query (server)

1. **Selalu beri tie-breaker `id`** pada `orderBy` yang memakai kolom waktu.
   Tanpa itu, offset pagination (`skip`/`take`) dapat menggeser baris ketika
   beberapa record memiliki `createdAt` identik → data tampak duplikat/hilang.
2. **Filter dan pencarian digabung dengan `AND` eksplisit** (`where.AND = [...]`),
   bukan menumpuk `where.OR`, agar filter tahun tidak saling meniadakan
   dengan blok pencarian.
3. **Pagination opsional & kompatibel**: endpoint daftar mengembalikan seluruh
   data bila `?limit` tidak dikirim, dan mengembalikan `pagination`
   (`page`, `limit`, `total`, `totalPages`) bila `?limit` dikirim.
4. **`contains` pada kolom TEXT tidak memakai index.** Untuk dataset besar,
   pertimbangkan `FULLTEXT` (migrasi terpisah) atau pencarian via `kodeMonev`
   yang sudah `UNIQUE`.
5. **Jangan menambah index pada kolom `TEXT`/`LONGTEXT`** tanpa prefix length.

## 3. Aturan Perubahan Skema

- Semua perubahan bersifat **additive** lebih dulu (kolom nullable / index baru).
  Rename atau drop kolom harus lewat dua rilis: (1) tambah kolom baru + dual-write,
  (2) hapus kolom lama setelah data dimigrasikan.
- Setiap migrasi wajib menyertakan `rollback.sql` dan catatan approval.
- File migrasi **tidak dieksekusi** oleh programmer; eksekusi hanya oleh operator
  DB setelah `[APPROVAL_REQUIRED]` disetujui.
- Sebelum menambah index, pastikan tidak ada index redundan dengan prefix kolom
  yang sama (MySQL memakai index paling kiri).

## 4. Verifikasi

Gunakan `prisma/migrations/20261102103000_add_performance_indexes/verify.sql`
untuk melihat index yang terpasang dan `EXPLAIN` query acuan.
