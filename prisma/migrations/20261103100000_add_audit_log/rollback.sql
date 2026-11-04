-- =============================================================================
-- ROLLBACK : 20261103100000_add_audit_log
-- PERINGATAN: DROP TABLE akan MENGHAPUS SELURUH JEJAK AUDIT yang sudah tercatat.
-- Sebelum menjalankan rollback, ekspor dulu isi tabel:
--   mysqldump --single-transaction lppm_unusu_db lppm_audit_log \
--     > audit_log_archive_$(date +%Y%m%d_%H%M).sql
-- Status: BELUM DIEKSEKUSI. Wajib approval terpisah.
-- =============================================================================

DROP TABLE IF EXISTS `lppm_audit_log`;

-- Setelah rollback, hapus juga folder migrasi ini dari riwayat dev atau jalankan
--   npx prisma migrate resolve --rolled-back 20261103100000_add_audit_log
