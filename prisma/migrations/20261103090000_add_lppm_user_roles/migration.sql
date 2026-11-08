-- Pemetaan pengguna ONE UNUSU -> peran LPPM.
--
-- Sebelum tabel ini ada, LPPM menentukan hak akses dari NAMA peran SSO
-- (`ADMIN_LPPM`, `DOSEN`, ...). Cara itu rapuh: peran hanya tebakan, dan
-- admin aplikasi lain dapat lolos bila namanya kebetulan mirip. Dengan tabel
-- ini, izin diturunkan dari peran yang benar-benar DITUGASKAN kepada pengguna.
CREATE TABLE `lppm_user_roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `roleId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lppm_user_roles_roleId_idx`(`roleId`),
    UNIQUE INDEX `lppm_user_roles_userId_roleId_key`(`userId`, `roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Menghapus peran menghapus penugasannya; izin pengguna ikut hilang seketika.
ALTER TABLE `lppm_user_roles`
  ADD CONSTRAINT `lppm_user_roles_roleId_fkey`
  FOREIGN KEY (`roleId`) REFERENCES `lppm_roles`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;