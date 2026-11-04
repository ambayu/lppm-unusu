-- =============================================================================
-- ROLLBACK : 20261102103000_add_performance_indexes
-- Gunakan HANYA bila migrasi index perlu dibatalkan (mis. index duplikat /
-- dampak tulis tak terduga). Rollback ini hanya menghapus index — tidak
-- menyentuh struktur tabel maupun data.
-- Status: BELUM DIEKSEKUSI. Wajib approval terpisah sebelum dijalankan.
-- =============================================================================

-- 1. lppm_penelitian
DROP INDEX `lppm_penelitian_createdAt_idx` ON `lppm_penelitian`;
DROP INDEX `lppm_penelitian_tahun_status_idx` ON `lppm_penelitian`;
DROP INDEX `lppm_penelitian_bidangFokus_idx` ON `lppm_penelitian`;
DROP INDEX `lppm_penelitian_nidn_idx` ON `lppm_penelitian`;

-- 2. lppm_pengabdian
DROP INDEX `lppm_pengabdian_createdAt_idx` ON `lppm_pengabdian`;
DROP INDEX `lppm_pengabdian_tahun_status_idx` ON `lppm_pengabdian`;
DROP INDEX `lppm_pengabdian_mitra_idx` ON `lppm_pengabdian`;
DROP INDEX `lppm_pengabdian_nidn_idx` ON `lppm_pengabdian`;

-- 3. lppm_publikasi
DROP INDEX `lppm_publikasi_tahun_idx` ON `lppm_publikasi`;
DROP INDEX `lppm_publikasi_jenis_tahun_idx` ON `lppm_publikasi`;
DROP INDEX `lppm_publikasi_penulis_idx` ON `lppm_publikasi`;

-- 4. lppm_monitoring_evaluasi
DROP INDEX `lppm_monitoring_evaluasi_createdAt_idx` ON `lppm_monitoring_evaluasi`;
DROP INDEX `lppm_monitoring_evaluasi_tanggalJadwal_idx` ON `lppm_monitoring_evaluasi`;
DROP INDEX `lppm_monitoring_evaluasi_nidnReviewer_idx` ON `lppm_monitoring_evaluasi`;

-- 5. lppm_permissions
DROP INDEX `lppm_permissions_modul_idx` ON `lppm_permissions`;

-- Setelah rollback, catat di tabel _prisma_migrations (bila migrasi sempat
-- diterapkan) atau cukup hapus folder migrasi ini dari riwayat dev.
