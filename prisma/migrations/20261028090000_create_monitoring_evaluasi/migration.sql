-- AlterTable: hubungkan kategori riset ke penelitian jika belum ada constraint
-- (Di MySQL pastikan foreign key dan kolom pendukung sinkron)

-- CreateTable lppm_monitoring_evaluasi
CREATE TABLE `lppm_monitoring_evaluasi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kodeMonev` VARCHAR(50) NOT NULL,
    `jenisProgram` ENUM('PENELITIAN', 'PENGABDIAN') NOT NULL,
    `tahap` ENUM('MONEV_ANTARA', 'MONEV_AKHIR', 'MONEV_LAPANGAN') NOT NULL DEFAULT 'MONEV_ANTARA',
    `status` ENUM('DIJADWALKAN', 'SEDANG_DITELAAH', 'PERLU_REVISI', 'DISETUJUI', 'DITOLAK') NOT NULL DEFAULT 'DIJADWALKAN',
    `rekomendasi` ENUM('LANJUT_PENUH', 'LANJUT_BERSYARAT', 'TUNDA', 'HENTIKAN') NULL DEFAULT 'LANJUT_PENUH',
    `penelitianId` INTEGER NULL,
    `pengabdianId` INTEGER NULL,
    `namaReviewer` VARCHAR(150) NOT NULL,
    `nidnReviewer` VARCHAR(50) NULL,
    `tanggalJadwal` DATE NOT NULL,
    `tanggalMonev` DATE NULL,
    `lokasiMonev` VARCHAR(255) NULL,
    `persentaseKemajuan` INTEGER NOT NULL DEFAULT 0,
    `persentaseDanaTerpakai` INTEGER NOT NULL DEFAULT 0,
    `skorSubstansi` DECIMAL(5, 2) NULL,
    `targetLuaranWajib` TEXT NULL,
    `capaianLuaran` TEXT NULL,
    `catatanReviewer` TEXT NULL,
    `tindakLanjut` TEXT NULL,
    `beritaAcaraUrl` VARCHAR(255) NULL,
    `buktiDokumentasiUrl` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `lppm_monitoring_evaluasi_kodeMonev_key`(`kodeMonev`),
    INDEX `lppm_monitoring_evaluasi_penelitianId_idx`(`penelitianId`),
    INDEX `lppm_monitoring_evaluasi_pengabdianId_idx`(`pengabdianId`),
    INDEX `lppm_monitoring_evaluasi_jenisProgram_status_idx`(`jenisProgram`, `status`),
    INDEX `lppm_monitoring_evaluasi_tahap_idx`(`tahap`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lppm_monitoring_evaluasi` ADD CONSTRAINT `lppm_monitoring_evaluasi_penelitianId_fkey` FOREIGN KEY (`penelitianId`) REFERENCES `lppm_penelitian`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lppm_monitoring_evaluasi` ADD CONSTRAINT `lppm_monitoring_evaluasi_pengabdianId_fkey` FOREIGN KEY (`pengabdianId`) REFERENCES `lppm_pengabdian`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
