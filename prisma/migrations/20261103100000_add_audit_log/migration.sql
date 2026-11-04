-- =============================================================================
-- Migration : 20261103100000_add_audit_log
-- Tujuan    : Membuat tabel append-only `lppm_audit_log` sebagai jejak mutasi
--             data (siapa, kapan, entitas apa, aksi apa, hasil status HTTP).
-- Sifat     : ADDITIVE ONLY — CREATE TABLE + CREATE INDEX.
--             Tidak menyentuh tabel/kolom/data yang sudah ada.
-- Status    : BELUM DIEKSEKUSI. Menunggu approval (lihat README.md).
-- Catatan   : Tanpa FOREIGN KEY ke tabel entitas, agar log tetap immutable
--             walaupun record sumbernya dihapus (hard delete / cascade).
-- =============================================================================

CREATE TABLE `lppm_audit_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `aktorId` INTEGER NULL,
    `aktorNidn` VARCHAR(50) NULL,
    `aktorNama` VARCHAR(150) NULL,
    `aktorRole` VARCHAR(50) NULL,
    `aksi` ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    `entitas` VARCHAR(50) NOT NULL,
    `entitasId` INTEGER NULL,
    `metode` VARCHAR(10) NOT NULL,
    `path` VARCHAR(255) NOT NULL,
    `statusCode` INTEGER NOT NULL,
    `ringkasan` TEXT NULL,
    `ipAddress` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lppm_audit_log_createdAt_idx`(`createdAt`),
    INDEX `lppm_audit_log_entitas_entitasId_idx`(`entitas`, `entitasId`),
    INDEX `lppm_audit_log_aktorNidn_idx`(`aktorNidn`),
    INDEX `lppm_audit_log_aksi_createdAt_idx`(`aksi`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =============================================================================
-- CATATAN OPERASIONAL
-- 1. Tabel ini hanya menerima INSERT dari middleware audit (src/server/lib/auditLog.ts).
--    Tidak ada endpoint UPDATE/DELETE untuk tabel ini.
-- 2. Retensi disarankan 12-24 bulan. Pembersihan dilakukan manual oleh operator:
--      DELETE FROM lppm_audit_log WHERE createdAt < DATE_SUB(NOW(), INTERVAL 24 MONTH) LIMIT 10000;
--    (jalankan bertahap, di luar jam sibuk, setelah approval terpisah)
-- 3. Estimasi pertumbuhan: ±1 baris per request mutasi; pada 500 mutasi/hari
--    sekitar 180 ribu baris/tahun (±25-35 MB termasuk index).
--
-- VERIFIKASI PASCA-MIGRASI (manual, tidak dieksekusi otomatis):
--   SHOW CREATE TABLE lppm_audit_log;
--   SELECT aksi, COUNT(*) FROM lppm_audit_log GROUP BY aksi;
--   EXPLAIN SELECT * FROM lppm_audit_log ORDER BY createdAt DESC, id DESC LIMIT 25;
-- =============================================================================
