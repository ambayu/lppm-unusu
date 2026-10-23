import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding data LPPM UNUSU...");

  // 1. Penelitian Dosen
  await prisma.penelitian.createMany({
    data: [
      {
        judul: "Rancang Bangun Sistem Informasi Terpadu Kampus Berbasis Microservices & Single Sign-On di UNUSU",
        ketua: "Junaidy, M.Kom.",
        nidn: "0123068901",
        anggota: "Ahmad Zaki, M.Kom., Muhammad Fadhil",
        skema: "Penelitian Terapan Unggulan Perguruan Tinggi",
        bidangFokus: "Teknologi Informasi & Smart Campus",
        danaDisetujui: 25000000,
        sumberDana: "Internal UNUSU",
        tahun: 2026,
        status: "Disetujui",
      },
      {
        judul: "Analisis Sentimen Opini Publik Terhadap Moderasi Beragama Menggunakan Algoritma Support Vector Machine",
        ketua: "Ahmad Zaki, M.Kom.",
        nidn: "0115049002",
        anggota: "Dr. K.H. Ahmad Nawawi, M.A.",
        skema: "Penelitian Dosen Pemula (PDP)",
        bidangFokus: "Artificial Intelligence & NLP",
        danaDisetujui: 15000000,
        sumberDana: "Kemendikbudristek",
        tahun: 2026,
        status: "Selesai",
      }
    ]
  });

  // 2. Pengabdian Kepada Masyarakat (PKM)
  await prisma.pengabdian.createMany({
    data: [
      {
        judul: "Pelatihan Digital Marketing dan Pembukuan Berbasis Web untuk UMKM Binaan Muslimat NU Deli Serdang",
        ketua: "Dr. Ridwan Siregar, S.E., M.Si.",
        nidn: "0109038201",
        anggota: "Fitriani, S.E., M.Ak.",
        mitra: "Koperasi & UMKM Muslimat NU Deli Serdang",
        lokasi: "Kecamatan Percut Sei Tuan, Deli Serdang",
        danaDisetujui: 12500000,
        tahun: 2026,
        status: "Selesai",
      },
      {
        judul: "Penerapan Sistem Pembelajaran Daring (E-Learning) di Pondok Pesantren Al-Kautsar Medan",
        ketua: "Junaidy, M.Kom.",
        nidn: "0123068901",
        anggota: "Rahmat Hidayat, S.Kom.",
        mitra: "Pondok Pesantren Al-Kautsar",
        lokasi: "Medan Helvetia",
        danaDisetujui: 10000000,
        tahun: 2026,
        status: "Disetujui",
      }
    ]
  });

  // 3. Publikasi Jurnal Dosen
  await prisma.publikasi.createMany({
    data: [
      {
        judul: "Optimizing Academic Data Workflow using React and Prisma ORM in Higher Education Institution",
        penulis: "Junaidy, Ahmad Zaki",
        jenis: "Jurnal Nasional (SINTA)",
        namaJurnal: "Journal of Computer Science & Applied Informatics",
        volumeIssue: "Vol. 5 No. 1",
        tahun: 2026,
        sintaScore: "SINTA 2",
        doiUrl: "https://doi.org/10.1234/jcsai.2026.01",
      }
    ]
  });

  console.log("Seeding data LPPM UNUSU selesai!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
