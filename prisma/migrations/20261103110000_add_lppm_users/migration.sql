-- Registri pengguna LPPM.
--
-- Sebelum tabel ini ada, LPPM menentukan hak akses dari NAMA peran SSO
-- (`ADMIN_LPPM`, `DOSEN`, ...). Nama peran hanya tebakan: ia tidak membuktikan
-- siapa penggunanya. Tabel ini mencatat penugasan peran secara eksplisit,
-- sehingga izin dapat dicabut per orang tanpa mengubah kode.
CREATE TABLE `lppm_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NULL,
    `nidn` VARCHAR(50) NULL,
    `prodi` VARCHAR(150) NULL,
    `fakultas` VARCHAR(150) NULL,
    `ssoRole` VARCHAR(50) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'Aktif',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lppm_users_userId_key`(`userId`),
    UNIQUE INDEX `lppm_users_username_key`(`username`),
    INDEX `lppm_users_ssoRole_idx`(`ssoRole`),
    INDEX `lppm_users_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- `lppm_user_roles` sebelumnya menunjuk langsung ke userId milik ONE UNUSU.
-- Sekarang ia menunjuk ke baris `lppm_users` agar penugasan peran ikut
-- terhapus saat pengguna dihapus (ON DELETE CASCADE), dan agar userId yang
-- salah tidak dapat menghasilkan penugasan yatim.
DELETE FROM `lppm_user_roles`;

ALTER TABLE `lppm_user_roles` DROP INDEX `lppm_user_roles_userId_roleId_key`;

ALTER TABLE `lppm_user_roles`
  ADD CONSTRAINT `lppm_user_roles_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `lppm_users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `lppm_user_roles`
  ADD UNIQUE INDEX `lppm_user_roles_userId_roleId_key`(`userId`, `roleId`);