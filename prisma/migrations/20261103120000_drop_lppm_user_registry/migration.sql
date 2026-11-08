-- Menghapus registri pengguna LPPM.
--
-- Registri ini sempat dibuat agar LPPM dapat menugaskan peran sendiri. Itu
-- keliru: pengguna, peran, dan pemetaan peran -> izin SELURUHNYA dikelola di
-- panel ONE UNUSU. Menyimpan salinannya di sini menciptakan sumber kebenaran
-- kedua yang cepat basi dan bisa berselisih dengan SSO.
--
-- Izin sekarang dibawa oleh tiket SSO saat login dan disimpan di JWT aplikasi.
DROP TABLE IF EXISTS `lppm_user_roles`;

DROP TABLE IF EXISTS `lppm_users`;