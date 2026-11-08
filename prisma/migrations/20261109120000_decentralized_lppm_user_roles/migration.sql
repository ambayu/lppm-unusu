-- Tabel penugasan peran pengguna lokal LPPM UNUSU (Multi-Role Support)
CREATE TABLE `lppm_user_roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `roleId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lppm_user_roles_username_idx`(`username`),
    INDEX `lppm_user_roles_roleId_idx`(`roleId`),
    UNIQUE INDEX `lppm_user_roles_username_roleId_key`(`username`, `roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `lppm_user_roles`
  ADD CONSTRAINT `lppm_user_roles_roleId_fkey`
  FOREIGN KEY (`roleId`) REFERENCES `lppm_roles`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
