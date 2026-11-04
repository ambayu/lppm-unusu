-- =============================================================================
-- VERIFIKASI INDEX — 20261102103000_add_performance_indexes
-- Read-only: hanya SELECT terhadap information_schema dan EXPLAIN.
-- Aman dijalankan pada database produksi kapan pun.
-- =============================================================================

-- 1. Daftar index yang diharapkan (harus muncul 15 baris setelah migrasi)
SELECT TABLE_NAME, INDEX_NAME,
       GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS kolom
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND INDEX_NAME IN (
    'lppm_penelitian_createdAt_idx',
    'lppm_penelitian_tahun_status_idx',
    'lppm_penelitian_bidangFokus_idx',
    'lppm_penelitian_nidn_idx',
    'lppm_pengabdian_createdAt_idx',
    'lppm_pengabdian_tahun_status_idx',
    'lppm_pengabdian_mitra_idx',
    'lppm_pengabdian_nidn_idx',
    'lppm_publikasi_tahun_idx',
    'lppm_publikasi_jenis_tahun_idx',
    'lppm_publikasi_penulis_idx',
    'lppm_monitoring_evaluasi_createdAt_idx',
    'lppm_monitoring_evaluasi_tanggalJadwal_idx',
    'lppm_monitoring_evaluasi_nidnReviewer_idx',
    'lppm_permissions_modul_idx'
  )
GROUP BY TABLE_NAME, INDEX_NAME
ORDER BY TABLE_NAME, INDEX_NAME;

-- 2. Ukuran index per tabel (pantau pertumbuhan storage)
SELECT TABLE_NAME,
       ROUND(SUM(INDEX_LENGTH) / 1024 / 1024, 2) AS index_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('lppm_penelitian','lppm_pengabdian','lppm_publikasi',
                     'lppm_monitoring_evaluasi','lppm_permissions')
GROUP BY TABLE_NAME;

-- 3. EXPLAIN query acuan
--    Harapan: `key` memakai index baru dan `Extra` tanpa "Using filesort".
EXPLAIN SELECT id, judul, tahun, status
FROM lppm_penelitian
WHERE tahun = 2026 AND status = 'Disetujui'
ORDER BY createdAt DESC, id DESC
LIMIT 10;

EXPLAIN SELECT id, kodeMonev, status
FROM lppm_monitoring_evaluasi
WHERE jenisProgram = 'PENELITIAN' AND status = 'DIJADWALKAN'
ORDER BY createdAt DESC, id DESC
LIMIT 10;

EXPLAIN SELECT id, judul, tahun
FROM lppm_publikasi
ORDER BY tahun DESC, id DESC
LIMIT 10;

-- 4. Deteksi index duplikat/redundan (prefix kolom sama)
SELECT TABLE_NAME, INDEX_NAME, kolom, COUNT(*) AS jumlah
FROM (
  SELECT TABLE_NAME, INDEX_NAME,
         GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS kolom
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
  GROUP BY TABLE_NAME, INDEX_NAME
) t
GROUP BY TABLE_NAME, kolom
HAVING COUNT(*) > 1;
