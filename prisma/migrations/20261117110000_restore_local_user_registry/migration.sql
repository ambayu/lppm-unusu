-- Registri lokal kembali dipakai oleh login dan manajemen pengguna saat ini.
-- Terpisah dari lppm_user_roles yang menyimpan penugasan berbasis username.
CREATE TABLE `lppm_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NULL,
    `ssoRole` VARCHAR(50) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Aktif',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lppm_users_userId_key`(`userId`),
    INDEX `lppm_users_username_idx`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `lppm_users_roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `roleId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `lppm_users_roles_userId_roleId_key`(`userId`, `roleId`),
    INDEX `lppm_users_roles_userId_idx`(`userId`),
    INDEX `lppm_users_roles_roleId_idx`(`roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `lppm_users_roles`
    ADD CONSTRAINT `lppm_users_roles_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `lppm_users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `lppm_users_roles`
    ADD CONSTRAINT `lppm_users_roles_roleId_fkey`
    FOREIGN KEY (`roleId`) REFERENCES `lppm_roles`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
