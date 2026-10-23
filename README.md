# LPPM UNUSU - Lembaga Penelitian & Pengabdian kepada Masyarakat

Sistem Pengelolaan Hibah Penelitian Dosen, Pengabdian kepada Masyarakat (PKM), dan Publikasi Jurnal Ilmiah Universitas Nahdlatul Ulama Sumatera Utara berbasis **Single Package Fullstack Monolith (Vite React + Node.js Express + Prisma MySQL)**.

---

## 🚀 Fitur Utama
1. **Pangkalan Riset & Hibah Dosen**: Pengajuan proposal, skema riset (PDP, Terapan, Kerjasama), dan monitoring dana riset.
2. **Pengabdian Masyarakat (PKM)**: Pencatatan mitra binaan, lokasi pengabdian, dan luaran PKM.
3. **Direktori Publikasi Jurnal**: Jurnal Nasional Terakreditasi SINTA & Internasional Scopus, DOI link, dan metadata artikel.

---

## 🛠️ Konfigurasi
* **Fullstack Monolith**: 1 Port (`5005`), 1 File `.env` di root.
* **Database**: MySQL (`lppm_unusu_db`).

---

## ⚡ Cara Menjalankan
1. Instal dependensi: `npm install`
2. Migrasi & Seed:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init_lppm
   npm run prisma:seed
   ```
3. Jalankan: `npm run dev`
