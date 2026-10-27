-- CreateTable
CREATE TABLE `lppm_penelitian` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `judul` TEXT NOT NULL,
    `ketua` VARCHAR(191) NOT NULL,
    `nidn` VARCHAR(50) NOT NULL,
    `anggota` TEXT NULL,
    `skema` VARCHAR(191) NOT NULL DEFAULT 'Penelitian Dosen Pemula (PDP)',
    `bidangFokus` VARCHAR(191) NOT NULL,
    `danaDisetujui` DECIMAL(12, 2) NULL,
    `sumberDana` VARCHAR(191) NOT NULL DEFAULT 'Internal UNUSU',
    `tahun` INTEGER NOT NULL DEFAULT 2026,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Disetujui',
    `laporanUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lppm_pengabdian` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `judul` TEXT NOT NULL,
    `ketua` VARCHAR(191) NOT NULL,
    `nidn` VARCHAR(50) NOT NULL,
    `anggota` TEXT NULL,
    `mitra` VARCHAR(191) NOT NULL,
    `lokasi` VARCHAR(191) NOT NULL,
    `danaDisetujui` DECIMAL(12, 2) NULL,
    `tahun` INTEGER NOT NULL DEFAULT 2026,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Disetujui',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lppm_publikasi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `judul` TEXT NOT NULL,
    `penulis` VARCHAR(191) NOT NULL,
    `jenis` VARCHAR(191) NOT NULL DEFAULT 'Jurnal Nasional',
    `namaJurnal` VARCHAR(191) NOT NULL,
    `volumeIssue` VARCHAR(191) NULL,
    `tahun` INTEGER NOT NULL DEFAULT 2026,
    `doiUrl` VARCHAR(191) NULL,
    `sintaScore` VARCHAR(191) NULL DEFAULT 'SINTA 3',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
