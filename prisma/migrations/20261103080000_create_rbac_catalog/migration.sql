-- Katalog RBAC harus tersedia sebelum migrasi penugasan peran 20261103090000.
CREATE TABLE `lppm_roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kode` VARCHAR(50) NOT NULL,
    `nama` VARCHAR(100) NOT NULL,
    `deskripsi` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lppm_roles_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lppm_permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kode` VARCHAR(100) NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `modul` VARCHAR(50) NOT NULL,
    `deskripsi` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lppm_permissions_kode_key`(`kode`),
    INDEX `lppm_permissions_modul_idx`(`modul`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lppm_role_permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roleId` INTEGER NOT NULL,
    `permissionId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `lppm_role_permissions_roleId_permissionId_key`(`roleId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `lppm_role_permissions`
    ADD CONSTRAINT `lppm_role_permissions_roleId_fkey`
    FOREIGN KEY (`roleId`) REFERENCES `lppm_roles`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `lppm_role_permissions`
    ADD CONSTRAINT `lppm_role_permissions_permissionId_fkey`
    FOREIGN KEY (`permissionId`) REFERENCES `lppm_permissions`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
