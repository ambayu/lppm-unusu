# Migrasi `20261103100000_add_audit_log`

Status: **SIAP DITINJAU — BELUM DIEKSEKUSI**.
Tidak ada statement yang dijalankan terhadap database mana pun.

## 1. Ringkasan

Membuat satu tabel baru `lppm_audit_log` (append-only) berisi jejak setiap mutasi
data: aktor (id/NIDN/nama/role dari sesi SSO), aksi (`CREATE`/`UPDATE`/`DELETE`),
entitas + id, metode & path HTTP, status code, ringkasan payload, IP, dan waktu.

**Tidak ada** perubahan pada tabel lama: tidak ada `ALTER`, `DROP`, atau backfill.
Satu-satunya operasi adalah `CREATE TABLE` + 4 `CREATE INDEX` (primary key + 3
index sekunder + 1 index komposit).

| Index | Kolom | Melayani query |
| --- | --- | --- |
| PRIMARY | `id` | lookup tunggal |
| `..._createdAt_idx` | `createdAt` | daftar log terbaru (`ORDER BY createdAt DESC, id DESC`) |
| `..._entitas_entitasId_idx` | `entitas, entitasId` | riwayat satu record |
| `..._aktorNidn_idx` | `aktorNidn` | aktivitas satu dosen/admin |
| `..._aksi_createdAt_idx` | `aksi, createdAt` | rekap CREATE/UPDATE/DELETE per periode |

## 2. Mengapa Aman

1. **Tabel baru** — tidak ada tabel existing yang diubah, tidak ada risiko
   kehilangan data pada modul Penelitian/Pengabdian/Publikasi/Monev.
2. **Tanpa foreign key** ke tabel entitas, agar log tetap utuh (immutable) saat
   record sumber dihapus. Konsekuensi: tidak ada cascade — ini disengaja.
3. **Append-only** — aplikasi hanya melakukan `INSERT` (middleware
   `src/server/lib/auditLog.ts`). Tidak ada endpoint update/delete.
4. **Non-blocking** — penulisan log terjadi setelah respons terkirim
   (`res.on("finish")`) dan seluruh error ditelan, sehingga audit tidak pernah
   menggagalkan request pengguna.
5. **Data sensitif disaring** — field `password`, `token`, `authorization`,
   `secret`, `clientKey` diganti `[REDACTED]`; payload dipotong 2000 karakter.
6. **Ukuran kecil** — ±180 ribu baris/tahun pada 500 mutasi/hari (±25–35 MB).

## 3. Dampak

- Tambahan 1 tabel baru; beban tulis +1 `INSERT` ringan per mutasi (asinkron).
- Retensi perlu kebijakan: disarankan 12–24 bulan, pembersihan manual bertahap
  oleh operator DB (contoh query ada di komentar `migration.sql`).

## 4. Prosedur Eksekusi (setelah approval)

```bash
# 0. Backup skema + data (wajib)
mysqldump --single-transaction --routines --triggers lppm_unusu_db \
  > backup_before_audit_$(date +%Y%m%d_%H%M).sql

# 1. Terapkan (pilih salah satu)
npx prisma migrate deploy
# atau manual:
mysql lppm_unusu_db < prisma/migrations/20261103100000_add_audit_log/migration.sql

# 2. Verifikasi
mysql lppm_unusu_db < prisma/migrations/20261103100000_add_audit_log/verify.sql

# 3. Smoke test aplikasi
#    - lakukan 1 create + 1 update + 1 delete lewat UI
#    - GET /api/audit-log?limit=5  (role admin) harus menampilkan 3 baris
```

Rollback: `mysql lppm_unusu_db < .../rollback.sql` (**menghapus seluruh isi log**,
ekspor dulu bila diperlukan).

## 5. Checklist Approval

- [ ] Backup `lppm_unusu_db` tersedia dan terverifikasi.
- [ ] Migrasi diuji di staging (`prisma migrate deploy`).
- [ ] `prisma generate` dijalankan di pipeline build agar tipe `auditLog` tersedia
      untuk `@prisma/client` (sudah dijalankan lokal: Prisma Client v5.22.0).
- [ ] Kebijakan retensi log disepakati (12/24 bulan).
- [ ] Jendela eksekusi disetujui.
- [ ] Rollback plan dipahami operator DB.
