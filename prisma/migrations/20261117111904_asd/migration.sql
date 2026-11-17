/*
  Warnings:

  - You are about to drop the column `skema` on the `lppm_penelitian` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `lppm_monitoring_evaluasi` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `lppm_penelitian` DROP COLUMN `skema`;

-- CreateTable
CREATE TABLE `lppm_banner_sliders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `judul` VARCHAR(150) NOT NULL,
    `subjudul` VARCHAR(255) NULL,
    `gambarUrl` LONGTEXT NOT NULL,
    `gambarMobileUrl` LONGTEXT NULL,
    `linkUrl` VARCHAR(255) NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `lppm_banner_sliders_active_urutan_idx`(`active`, `urutan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lppm_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(100) NOT NULL,
    `deskripsi` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lppm_categories_nama_key`(`nama`),
    INDEX `lppm_categories_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lppm_documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `judul` VARCHAR(255) NOT NULL,
    `nomor` VARCHAR(100) NULL,
    `kategoriId` INTEGER NOT NULL,
    `tahun` INTEGER NOT NULL,
    `tanggalDokumen` DATETIME(3) NULL,
    `tanggalMulaiBerlaku` DATETIME(3) NULL,
    `tanggalBerakhir` DATETIME(3) NULL,
    `keterangan` LONGTEXT NULL,
    `filePdfUrl` LONGTEXT NULL,
    `fileSize` INTEGER NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'Aktif',
    `tujuanPublish` VARCHAR(20) NOT NULL DEFAULT 'lppm',
    `prodiCode` VARCHAR(50) NULL,
    `prodiName` VARCHAR(150) NULL,
    `createdBy` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `lppm_documents_kategoriId_idx`(`kategoriId`),
    INDEX `lppm_documents_tahun_idx`(`tahun`),
    INDEX `lppm_documents_status_idx`(`status`),
    INDEX `lppm_documents_tujuanPublish_idx`(`tujuanPublish`),
    INDEX `lppm_documents_prodiCode_idx`(`prodiCode`),
    INDEX `lppm_documents_createdAt_idx`(`createdAt` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lppm_documents` ADD CONSTRAINT `lppm_documents_kategoriId_fkey` FOREIGN KEY (`kategoriId`) REFERENCES `lppm_categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
