-- =============================================================================
-- Migration : 20261102103000_add_performance_indexes
-- Tujuan    : Menambah index pendukung untuk query daftar, filter, dan pagination
--             pada modul Penelitian, Pengabdian, Publikasi, Monev, dan Permission.
-- Sifat     : ADDITIVE ONLY — tidak ada DROP TABLE / DROP COLUMN / UPDATE data.
--             Aman dijalankan pada data produksi (tidak mengubah satu baris pun).
-- Status    : BELUM DIEKSEKUSI. Menunggu approval (lihat README.md di folder ini).
-- Catatan   : Semua kolom yang di-index bertipe INT / DATETIME / VARCHAR(191-50),
--             sehingga tidak ada index pada kolom TEXT (menghindari error
--             "BLOB/TEXT column used in key specification without a key length").
-- -> DML tetap berjalan selama pembuatan
--             index (online DDL, MySQL 5.6+ / InnoDB).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. lppm_penelitian
--    Query acuan: GET /api/penelitian (ORDER BY createdAt DESC)
--                 filter tahun + status, bidangFokus, nidn
-- -----------------------------------------------------------------------------
CREATE INDEX `lppm_penelitian_createdAt_idx`
  ON `lppm_penelitian` (`createdAt`);

CREATE INDEX `lppm_penelitian_tahun_status_idx`
  ON `lppm_penelitian` (`tahun`, `status`);

CREATE INDEX `lppm_penelitian_bidangFokus_idx`
  ON `lppm_penelitian` (`bidangFokus`);

CREATE INDEX `lppm_penelitian_nidn_idx`
  ON `lppm_penelitian` (`nidn`);

-- -----------------------------------------------------------------------------
-- 2. lppm_pengabdian
--    Query acuan: GET /api/pengabdian (ORDER BY createdAt DESC)
--                 filter tahun + status, mitra, nidn
-- -----------------------------------------------------------------------------
CREATE INDEX `lppm_pengabdian_createdAt_idx`
  ON `lppm_pengabdian` (`createdAt`);

CREATE INDEX `lppm_pengabdian_tahun_status_idx`
  ON `lppm_pengabdian` (`tahun`, `status`);

CREATE INDEX `lppm_pengabdian_mitra_idx`
  ON `lppm_pengabdian` (`mitra`);

CREATE INDEX `lppm_pengabdian_nidn_idx`
  ON `lppm_pengabdian` (`nidn`);

-- -----------------------------------------------------------------------------
-- 3. lppm_publikasi
--    Query acuan: GET /api/publikasi (ORDER BY tahun DESC), filter jenis & penulis
-- -----------------------------------------------------------------------------
CREATE INDEX `lppm_publikasi_tahun_idx`
  ON `lppm_publikasi` (`tahun`);

CREATE INDEX `lppm_publikasi_jenis_tahun_idx`
  ON `lppm_publikasi` (`jenis`, `tahun`);

CREATE INDEX `lppm_publikasi_penulis_idx`
  ON `lppm_publikasi` (`penulis`);

-- -----------------------------------------------------------------------------
-- 4. lppm_monitoring_evaluasi
--    Query acuan: GET /api/monev (filter jenisProgram/status/tahap, pagination
--                 ORDER BY createdAt DESC, agenda tanggalJadwal, riwayat reviewer)
--    Index (penelitianId, pengabdianId, jenisProgram+status, tahap) sudah ada
--    dari migrasi 20261028090000_create_monitoring_evaluasi.
-- -----------------------------------------------------------------------------
CREATE INDEX `lppm_monitoring_evaluasi_createdAt_idx`
  ON `lppm_monitoring_evaluasi` (`createdAt`);

CREATE INDEX `lppm_monitoring_evaluasi_tanggalJadwal_idx`
  ON `lppm_monitoring_evaluasi` (`tanggalJadwal`);

CREATE INDEX `lppm_monitoring_evaluasi_nidnReviewer_idx`
  ON `lppm_monitoring_evaluasi` (`nidnReviewer`);

-- -----------------------------------------------------------------------------
-- 5. lppm_permissions
--    Query acuan: GET /api/permissions (ORDER BY modul ASC, kode ASC)
-- -----------------------------------------------------------------------------
CREATE INDEX `lppm_permissions_modul_idx`
  ON `lppm_permissions` (`modul`);

-- =============================================================================
-- VERIFIKASI PASCA-MIGRASI (jalankan manual, tidak dieksekusi otomatis):
--
--   SELECT TABLE_NAME, INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS kolom
--   FROM information_schema.STATISTICS
--   WHERE TABLE_SCHEMA = DATABASE()
--     AND INDEX_NAME LIKE '%\_idx'
--   GROUP BY TABLE_NAME, INDEX_NAME
--   ORDER BY TABLE_NAME, INDEX_NAME;
--
--   EXPLAIN SELECT id FROM lppm_monitoring_evaluasi
--   WHERE jenisProgram = 'PENELITIAN' AND status = 'DIJADWALKAN'
--   ORDER BY createdAt DESC LIMIT 10;
--   -- Harapan: key = lppm_monitoring_evaluasi_jenisProgram_status_idx
--   --          atau lppm_monitoring_evaluasi_createdAt_idx, Extra tanpa "Using filesort".
-- =============================================================================
