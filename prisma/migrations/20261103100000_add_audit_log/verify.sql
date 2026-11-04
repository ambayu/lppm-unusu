-- =============================================================================
-- VERIFIKASI — 20261103100000_add_audit_log
-- Read-only (SELECT/EXPLAIN). Aman dijalankan kapan pun.
-- =============================================================================

-- 1. Struktur tabel & index
SHOW CREATE TABLE `lppm_audit_log`;

SELECT INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS kolom
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'lppm_audit_log'
GROUP BY INDEX_NAME
ORDER BY INDEX_NAME;

-- 2. Tabel harus benar-benar append-only (tidak ada UPDATE/DELETE dari aplikasi).
--    Query ini memastikan belum ada trigger yang tidak diinginkan:
SELECT TRIGGER_NAME, EVENT_MANIPULATION, ACTION_TIMING
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = DATABASE()
  AND EVENT_OBJECT_TABLE = 'lppm_audit_log';

-- 3. Rencana eksekusi daftar log terbaru (harapan: key = ..._createdAt_idx)
EXPLAIN SELECT id, aktorNama, aksi, entitas, entitasId, createdAt
FROM lppm_audit_log
ORDER BY createdAt DESC, id DESC
LIMIT 25;

-- 4. Riwayat satu record (harapan: key = ..._entitas_entitasId_idx)
EXPLAIN SELECT id, aksi, aktorNama, createdAt
FROM lppm_audit_log
WHERE entitas = 'penelitian' AND entitasId = 1
ORDER BY createdAt DESC
LIMIT 50;

-- 5. Rekap aktivitas per aksi dalam 30 hari terakhir
SELECT aksi, COUNT(*) AS jumlah, MAX(createdAt) AS terakhir
FROM lppm_audit_log
WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY aksi;

-- 6. Aktor paling aktif (audit insider threat)
SELECT aktorNama, aktorNidn, aktorRole, COUNT(*) AS jumlah_mutasi
FROM lppm_audit_log
WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY aktorNama, aktorNidn, aktorRole
ORDER BY jumlah_mutasi DESC
LIMIT 20;

-- 7. Estimasi ukuran tabel
SELECT TABLE_NAME,
       TABLE_ROWS,
       ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS total_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'lppm_audit_log';
