import { PrismaClient } from "@prisma/client";

export const dataMonevSurvei = [
  {
    kode: "MONEV-PEMBELAJARAN",
    judul: "Monev Pembelajaran",
    targetAudiens: "MAHASISWA" as const,
    deskripsi: "Kuesioner monitoring dan evaluasi proses belajar mengajar, kehadiran dosen, metode, dan fasilitas pembelajaran.",
    urutan: 1,
    pertanyaan: [
      {
        seksi: "A. Proses dan Isi Pembelajaran",
        teks: "Pada awal perkuliahan dosen mengajak mahasiswa untuk berdoa sebelum dan sesudah perkuliahan.",
        tipe: "SKALA_5" as const,
        urutan: 1,
      },
      {
        seksi: "A. Proses dan Isi Pembelajaran",
        teks: "Dosen menyampaikan materi perkuliahan sesuai topik silabus dan rencana pembelajaran semester (RPS).",
        tipe: "SKALA_5" as const,
        urutan: 2,
      },
      {
        seksi: "A. Proses dan Isi Pembelajaran",
        teks: "Dosen menyampaikan materi perkuliahan dengan berbagai metode pembelajaran (presentasi, brainstorming, studi kasus, dialog interaktif, dsb).",
        tipe: "SKALA_5" as const,
        urutan: 3,
      },
      {
        seksi: "A. Proses dan Isi Pembelajaran",
        teks: "Dosen memiliki kemampuan menggunakan media pembelajaran daring/luring secara efektif.",
        tipe: "SKALA_5" as const,
        urutan: 4,
      },
      {
        seksi: "A. Proses dan Isi Pembelajaran",
        teks: "Dosen mampu meningkatkan pemahaman mahasiswa dengan metode pembelajaran yang interaktif dan kolaboratif.",
        tipe: "SKALA_5" as const,
        urutan: 5,
      },
      {
        seksi: "A. Proses dan Isi Pembelajaran",
        teks: "Dosen memberikan tugas, memeriksa, dan mengembalikan hasil tugas tersebut kepada mahasiswa.",
        tipe: "SKALA_5" as const,
        urutan: 6,
      },
      {
        seksi: "A. Proses dan Isi Pembelajaran",
        teks: "Materi pembelajaran dituangkan dalam bentuk bahan ajar yang mudah diakses.",
        tipe: "SKALA_5" as const,
        urutan: 7,
      },
      {
        seksi: "B. Kehadiran dan Kedisiplinan",
        teks: "Dosen hadir tepat waktu sesuai dengan jadwal perkuliahan yang telah ditetapkan.",
        tipe: "SKALA_5" as const,
        urutan: 8,
      },
      {
        seksi: "B. Kehadiran dan Kedisiplinan",
        teks: "Dosen hadir secara konsisten pada setiap pertemuan perkuliahan (minimal 14-16 pertemuan).",
        tipe: "SKALA_5" as const,
        urutan: 9,
      },
      {
        seksi: "B. Kehadiran dan Kedisiplinan",
        teks: "Jika dosen berhalangan hadir, informasi disampaikan kepada mahasiswa dengan jelas dan tepat waktu.",
        tipe: "SKALA_5" as const,
        urutan: 10,
      },
      {
        seksi: "C. Penilaian Pembelajaran",
        teks: "Dosen menyampaikan kontrak dan sistem penilaian secara transparan pada awal perkuliahan.",
        tipe: "SKALA_5" as const,
        urutan: 11,
      },
      {
        seksi: "C. Penilaian Pembelajaran",
        teks: "Mahasiswa mengetahui nilai setiap mata kuliah secara tepat waktu.",
        tipe: "SKALA_5" as const,
        urutan: 12,
      },
      {
        seksi: "C. Penilaian Pembelajaran",
        teks: "Mahasiswa memiliki kesempatan remedial/klarifikasi nilai dengan persetujuan dosen.",
        tipe: "SKALA_5" as const,
        urutan: 13,
      },
      {
        seksi: "D. Komunikasi & Keterlibatan",
        teks: "Dosen menyampaikan materi perkuliahan dengan bahasa yang komunikatif, santun, dan mudah dipahami.",
        tipe: "SKALA_5" as const,
        urutan: 14,
      },
      {
        seksi: "D. Komunikasi & Keterlibatan",
        teks: "Dosen memberikan inspirasi, motivasi belajar, dan keteladanan yang baik.",
        tipe: "SKALA_5" as const,
        urutan: 15,
      },
      {
        seksi: "D. Komunikasi & Keterlibatan",
        teks: "Dosen melibatkan mahasiswa dalam kegiatan penelitian dan/atau pengabdian kepada masyarakat.",
        tipe: "SKALA_5" as const,
        urutan: 16,
      },
      {
        seksi: "E. Fasilitas dan Sarana",
        teks: "Ruang kelas dan fasilitas perkuliahan bersih, nyaman, dan mendukung proses pembelajaran.",
        tipe: "SKALA_5" as const,
        urutan: 17,
      },
      {
        seksi: "E. Fasilitas dan Sarana",
        teks: "Fasilitas laboratorium dan perpustakaan memadai untuk menunjang kegiatan pembelajaran.",
        tipe: "SKALA_5" as const,
        urutan: 18,
      },
      {
        seksi: "F. Evaluasi Keseluruhan",
        teks: "Secara umum, seberapa puaskah Anda terhadap efektivitas proses pembelajaran pada semester ini?",
        tipe: "SKALA_5" as const,
        urutan: 19,
      },
      {
        seksi: "F. Evaluasi Keseluruhan",
        teks: "Tuliskan saran, kritik, atau komentar konstruktif Anda untuk peningkatan kualitas pembelajaran ke depan.",
        tipe: "ESAI" as const,
        wajib: false,
        urutan: 20,
      },
    ],
  },
  {
    kode: "MONEV-KEPUASAN-SDM",
    judul: "Monev Kepuasan SDM terhadap Layanan Perguruan Tinggi",
    targetAudiens: "DOSEN_TENDIK" as const,
    deskripsi: "Kuesioner evaluasi kepuasan dosen dan tenaga kependidikan terhadap tata kelola, sarana prasarana, dan kesejahteraan universitas.",
    urutan: 2,
    pertanyaan: [
      {
        seksi: "A. Kesejahteraan & Penghargaan",
        teks: "Universitas memberikan perhatian terhadap kesejahteraan, THR, atau tunjangan sesuai regulasi.",
        tipe: "SKALA_5" as const,
        urutan: 1,
      },
      {
        seksi: "A. Kesejahteraan & Penghargaan",
        teks: "Sistem penggajian, insentif, dan apresiasi kinerja berjalan layak, tepat waktu, dan transparan.",
        tipe: "SKALA_5" as const,
        urutan: 2,
      },
      {
        seksi: "A. Kesejahteraan & Penghargaan",
        teks: "Universitas memberikan penghargaan terhadap dosen dan tendik yang memiliki prestasi atau dedikasi tinggi.",
        tipe: "SKALA_5" as const,
        urutan: 3,
      },
      {
        seksi: "B. Sarana dan Prasarana Kerja",
        teks: "Ketersediaan fasilitas kerja pokok (ruang kerja, komputer/printer, ATK) memadai untuk menunjang tugas.",
        tipe: "SKALA_5" as const,
        urutan: 4,
      },
      {
        seksi: "B. Sarana dan Prasarana Kerja",
        teks: "Ketersediaan koneksi internet dan sistem informasi pendukung kerja berfungsi andal dan stabil.",
        tipe: "SKALA_5" as const,
        urutan: 5,
      },
      {
        seksi: "C. Pengembangan Karir & Kompetensi",
        teks: "Pimpinan unit memberikan kesempatan yang adil untuk mengikuti pelatihan, seminar, dan workshop peningkatan skill.",
        tipe: "SKALA_5" as const,
        urutan: 6,
      },
      {
        seksi: "C. Pengembangan Karir & Kompetensi",
        teks: "Universitas mendukung peningkatan jenjang pendidikan lanjutan serta kenaikan jabatan fungsional/kepangkatan.",
        tipe: "SKALA_5" as const,
        urutan: 7,
      },
      {
        seksi: "D. Suasana Kerja & Hubungan Kerja",
        teks: "Tercipta suasana kerja yang kondusif, harmonis, saling menghargai, dan bebas dari diskriminasi.",
        tipe: "SKALA_5" as const,
        urutan: 8,
      },
      {
        seksi: "D. Suasana Kerja & Hubungan Kerja",
        teks: "Pimpinan unit terbuka dalam menerima masukan, keluhan, dan saran konstruktif dari staf.",
        tipe: "SKALA_5" as const,
        urutan: 9,
      },
      {
        seksi: "E. Saran dan Harapan",
        teks: "Tuliskan saran dan harapan Anda demi kemajuan tata kelola dan layanan SDM di universitas.",
        tipe: "ESAI" as const,
        wajib: false,
        urutan: 10,
      },
    ],
  },
  {
    kode: "MONEV-LAYANAN-INFORMASI",
    judul: "Monev Kepuasan Mahasiswa terhadap Layanan Informasi",
    targetAudiens: "MAHASISWA" as const,
    deskripsi: "Evaluasi kemudahan akses, kejelasan, kelengkapan, dan responsivitas layanan informasi kampus bagi mahasiswa.",
    urutan: 3,
    pertanyaan: [
      {
        seksi: "A. Aksesibilitas Informasi",
        teks: "Informasi akademik (jadwal kuliah, ujian, kalender akademik) mudah diakses secara cepat dan terbuka.",
        tipe: "SKALA_5" as const,
        urutan: 1,
      },
      {
        seksi: "A. Aksesibilitas Informasi",
        teks: "Media komunikasi resmi kampus (website, portal, media sosial) memadai dalam menyampaikan pengumuman penting.",
        tipe: "SKALA_5" as const,
        urutan: 2,
      },
      {
        seksi: "B. Kecepatan & Responsivitas Layanan",
        teks: "Petugas dan unit pelayanan akademik memberikan respon cepat dan solutif ketika mahasiswa membutuhkan informasi.",
        tipe: "SKALA_5" as const,
        urutan: 3,
      },
      {
        seksi: "B. Kecepatan & Responsivitas Layanan",
        teks: "Mahasiswa memperoleh penjelasan lanjutan yang jelas jika ada pengumuman yang belum dipahami.",
        tipe: "SKALA_5" as const,
        urutan: 4,
      },
      {
        seksi: "C. Kejelasan & Akurasi Informasi",
        teks: "Informasi yang diberikan akurat, lengkap, dan tidak membingungkan mahasiswa.",
        tipe: "SKALA_5" as const,
        urutan: 5,
      },
      {
        seksi: "D. Kepuasan Keseluruhan & Masukan",
        teks: "Secara umum, seberapa puaskah Anda terhadap seluruh layanan informasi di kampus?",
        tipe: "SKALA_5" as const,
        urutan: 6,
      },
      {
        seksi: "D. Kepuasan Keseluruhan & Masukan",
        teks: "Berikan saran Anda agar layanan informasi kepada mahasiswa ke depan dapat lebih baik dan responsif.",
        tipe: "ESAI" as const,
        wajib: false,
        urutan: 7,
      },
    ],
  },
  {
    kode: "MONEV-PELAKSANAAN-UTS",
    judul: "Monev Kepuasan Mahasiswa terhadap Pelaksanaan UTS",
    targetAudiens: "MAHASISWA" as const,
    deskripsi: "Monitoring dan evaluasi ketertiban, keadilan, kesesuaian soal, dan transparansi Ujian Tengah Semester.",
    urutan: 4,
    pertanyaan: [
      {
        seksi: "A. Penyelenggaraan & Jadwal",
        teks: "Jadwal pelaksanaan UTS diumumkan dengan jelas, tepat waktu, dan terkoordinasi.",
        tipe: "SKALA_5" as const,
        urutan: 1,
      },
      {
        seksi: "A. Penyelenggaraan & Jadwal",
        teks: "UTS dilaksanakan sesuai jadwal resmi dan kalender akademik yang telah ditetapkan universitas.",
        tipe: "SKALA_5" as const,
        urutan: 2,
      },
      {
        seksi: "B. Substansi & Tata Tertib",
        teks: "Soal pertanyaan ujian relevan dan sesuai dengan materi perkuliahan yang telah diajarkan hingga tengah semester.",
        tipe: "SKALA_5" as const,
        urutan: 3,
      },
      {
        seksi: "B. Substansi & Tata Tertib",
        teks: "Ujian dilaksanakan secara adil, tertib, dan menegakkan integritas akademik.",
        tipe: "SKALA_5" as const,
        urutan: 4,
      },
      {
        seksi: "B. Substansi & Tata Tertib",
        teks: "Dosen/pengawas hadir mengawasi jalannya ujian serta memberikan petunjuk teknis yang jelas.",
        tipe: "SKALA_5" as const,
        urutan: 5,
      },
      {
        seksi: "B. Substansi & Tata Tertib",
        teks: "Alokasi waktu yang diberikan cukup untuk menyelesaikan soal ujian dengan baik.",
        tipe: "SKALA_5" as const,
        urutan: 6,
      },
      {
        seksi: "C. Kendala & Saran",
        teks: "Apa kendala utama yang Anda hadapi selama pelaksanaan UTS berlangsung?",
        tipe: "ESAI" as const,
        wajib: false,
        urutan: 7,
      },
      {
        seksi: "C. Kendala & Saran",
        teks: "Tuliskan saran Anda untuk peningkatan mutu pelaksanaan UTS di semester berikutnya.",
        tipe: "ESAI" as const,
        wajib: false,
        urutan: 8,
      },
    ],
  },
  {
    kode: "MONEV-PELAKSANAAN-UAS",
    judul: "Monev Kepuasan Mahasiswa terhadap Pelaksanaan UAS",
    targetAudiens: "MAHASISWA" as const,
    deskripsi: "Monitoring dan evaluasi ketertiban, keadilan, kesesuaian soal, dan transparansi Ujian Akhir Semester.",
    urutan: 5,
    pertanyaan: [
      {
        seksi: "A. Penyelenggaraan & Jadwal",
        teks: "Jadwal pelaksanaan UAS diumumkan dengan jelas, tepat waktu, dan terkoordinasi dari BAAKSI/Prodi.",
        tipe: "SKALA_5" as const,
        urutan: 1,
      },
      {
        seksi: "A. Penyelenggaraan & Jadwal",
        teks: "UAS dilaksanakan sesuai dengan kalender akademik dan ketentuan yang ditetapkan.",
        tipe: "SKALA_5" as const,
        urutan: 2,
      },
      {
        seksi: "B. Substansi & Tata Tertib",
        teks: "Soal pertanyaan ujian mencakup capaian pembelajaran dan materi yang telah dipelajari selama satu semester.",
        tipe: "SKALA_5" as const,
        urutan: 3,
      },
      {
        seksi: "B. Substansi & Tata Tertib",
        teks: "UAS diselenggarakan secara tertib, adil, transparan, dan akuntabel sesuai peraturan akademik.",
        tipe: "SKALA_5" as const,
        urutan: 4,
      },
      {
        seksi: "B. Substansi & Tata Tertib",
        teks: "Dosen pengampu/pengawas hadir mengawasi jalannya UAS secara seksama dan bertanggung jawab.",
        tipe: "SKALA_5" as const,
        urutan: 5,
      },
      {
        seksi: "B. Substansi & Tata Tertib",
        teks: "Waktu yang disediakan memadai untuk menjawab seluruh butir soal ujian.",
        tipe: "SKALA_5" as const,
        urutan: 6,
      },
      {
        seksi: "C. Kendala & Saran",
        teks: "Apa kendala utama yang Anda hadapi selama pelaksanaan UAS?",
        tipe: "ESAI" as const,
        wajib: false,
        urutan: 7,
      },
      {
        seksi: "C. Kendala & Saran",
        teks: "Saran Anda untuk peningkatan pelaksanaan UAS ke depan.",
        tipe: "ESAI" as const,
        wajib: false,
        urutan: 8,
      },
    ],
  },
];

export async function seedMonevDinamis(prisma: PrismaClient) {
  console.log("-> Seeding Master Periode Monev...");
  const periode = await prisma.monevPeriode.upsert({
    where: { kode: "2024-2025-GENAP" },
    update: {},
    create: {
      kode: "2024-2025-GENAP",
      nama: "Tahun Akademik 2024/2025 Semester Genap",
      tahunAkademik: "2024/2025",
      semester: "Genap",
      status: "AKTIF",
      deskripsi: "Periode aktif pengisian kuesioner monitoring dan evaluasi tridharma dan pembelajaran UNUSU.",
    },
  });

  console.log(`-> Periode aktif siap: ${periode.nama} (ID: ${periode.id})`);

  for (const s of dataMonevSurvei) {
    const survei = await prisma.monevSurvei.upsert({
      where: {
        periodeId_kode: {
          periodeId: periode.id,
          kode: s.kode,
        },
      },
      update: {
        judul: s.judul,
        deskripsi: s.deskripsi,
        targetAudiens: s.targetAudiens,
        urutan: s.urutan,
        aktif: true,
      },
      create: {
        periodeId: periode.id,
        kode: s.kode,
        judul: s.judul,
        deskripsi: s.deskripsi,
        targetAudiens: s.targetAudiens,
        urutan: s.urutan,
        aktif: true,
      },
    });

    console.log(`   [+] Survei: ${survei.judul}`);

    // Hapus pertanyaan lama agar bersih saat re-seed
    await prisma.monevPertanyaan.deleteMany({
      where: { surveiId: survei.id },
    });

    for (const p of s.pertanyaan) {
      await prisma.monevPertanyaan.create({
        data: {
          surveiId: survei.id,
          seksi: p.seksi,
          teks: p.teks,
          tipe: p.tipe,
          wajib: p.wajib ?? true,
          urutan: p.urutan,
        },
      });
    }
  }

  console.log("-> 5 Jenis Monev dan seluruh butir pertanyaan berhasil disemai!");
}
