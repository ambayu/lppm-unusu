-- Migration: Remove Kategori and Skema Riset from LPPM UNUSU
-- Tangani foreign key dan relasi sebelum menghapus tabel

-- 1. Drop Foreign Key constraint dari lppm_penelitian jika ada
ALTER TABLE `lppm_penelitian` DROP FOREIGN KEY `lppm_penelitian_kategoriRisetId_fkey`;

-- 2. Drop Index kategoriRisetId
ALTER TABLE `lppm_penelitian` DROP INDEX `lppm_penelitian_kategoriRisetId_idx`;

-- 3. Hapus kolom kategoriRisetId dan skema dari lppm_penelitian
ALTER TABLE `lppm_penelitian` 
  DROP COLUMN `kategoriRisetId`,
  DROP COLUMN `skema`;

-- 4. Hapus tabel lppm_kategori_riset
DROP TABLE IF EXISTS `lppm_kategori_riset`;
