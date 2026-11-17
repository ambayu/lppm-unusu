CREATE TABLE `lppm_monev_periode` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kode` VARCHAR(50) NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `tahunAkademik` VARCHAR(50) NOT NULL,
    `semester` VARCHAR(20) NOT NULL,
    `tanggalMulai` DATE NULL,
    `tanggalSelesai` DATE NULL,
    `status` ENUM('DRAFT', 'AKTIF', 'DITUTUP') NOT NULL DEFAULT 'DRAFT',
    `deskripsi` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `lppm_monev_periode_kode_key`(`kode`),
    INDEX `lppm_monev_periode_status_idx`(`status`),
    INDEX `lppm_monev_periode_tahunAkademik_semester_idx`(`tahunAkademik`, `semester`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lppm_monev_survei` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `periodeId` INTEGER NOT NULL,
    `kode` VARCHAR(50) NOT NULL,
    `judul` VARCHAR(200) NOT NULL,
    `deskripsi` TEXT NULL,
    `targetAudiens` ENUM('MAHASISWA', 'DOSEN_TENDIK', 'SEMUA') NOT NULL DEFAULT 'MAHASISWA',
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `lppm_monev_survei_periodeId_kode_key`(`periodeId`, `kode`),
    INDEX `lppm_monev_survei_periodeId_aktif_idx`(`periodeId`, `aktif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lppm_monev_pertanyaan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `surveiId` INTEGER NOT NULL,
    `seksi` VARCHAR(150) NULL,
    `kode` VARCHAR(50) NULL,
    `teks` TEXT NOT NULL,
    `tipe` ENUM('SKALA_5', 'PILIHAN_GANDA', 'KOTAK_CENTANG', 'TEKS_SINGKAT', 'ESAI') NOT NULL DEFAULT 'SKALA_5',
    `opsi` JSON NULL,
    `wajib` BOOLEAN NOT NULL DEFAULT true,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `lppm_monev_pertanyaan_surveiId_urutan_idx`(`surveiId`, `urutan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lppm_monev_respon` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `periodeId` INTEGER NOT NULL,
    `surveiId` INTEGER NOT NULL,
    `respondenHash` VARCHAR(128) NOT NULL,
    `prodi` VARCHAR(100) NULL,
    `fakultas` VARCHAR(100) NULL,
    `semester` VARCHAR(20) NULL,
    `mataKuliah` VARCHAR(150) NULL,
    `dosenPengampu` VARCHAR(150) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `lppm_monev_respon_surveiId_respondenHash_key`(`surveiId`, `respondenHash`),
    INDEX `lppm_monev_respon_periodeId_idx`(`periodeId`),
    INDEX `lppm_monev_respon_surveiId_idx`(`surveiId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lppm_monev_jawaban` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `responId` INTEGER NOT NULL,
    `pertanyaanId` INTEGER NOT NULL,
    `nilaiSkala` INTEGER NULL,
    `nilaiTeks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `lppm_monev_jawaban_responId_idx`(`responId`),
    INDEX `lppm_monev_jawaban_pertanyaanId_idx`(`pertanyaanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `lppm_monev_survei` ADD CONSTRAINT `lppm_monev_survei_periodeId_fkey` FOREIGN KEY (`periodeId`) REFERENCES `lppm_monev_periode`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lppm_monev_pertanyaan` ADD CONSTRAINT `lppm_monev_pertanyaan_surveiId_fkey` FOREIGN KEY (`surveiId`) REFERENCES `lppm_monev_survei`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lppm_monev_respon` ADD CONSTRAINT `lppm_monev_respon_periodeId_fkey` FOREIGN KEY (`periodeId`) REFERENCES `lppm_monev_periode`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lppm_monev_respon` ADD CONSTRAINT `lppm_monev_respon_surveiId_fkey` FOREIGN KEY (`surveiId`) REFERENCES `lppm_monev_survei`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lppm_monev_jawaban` ADD CONSTRAINT `lppm_monev_jawaban_responId_fkey` FOREIGN KEY (`responId`) REFERENCES `lppm_monev_respon`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `lppm_monev_jawaban` ADD CONSTRAINT `lppm_monev_jawaban_pertanyaanId_fkey` FOREIGN KEY (`pertanyaanId`) REFERENCES `lppm_monev_pertanyaan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
