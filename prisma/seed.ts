import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding data LPPM UNUSU...");

  // 0. Permission (Izin) & Role (Peran)
  const defaultPermissions = [
    // Penelitian
    { kode: "penelitian.view", nama: "Lihat Usulan Penelitian", modul: "Penelitian", deskripsi: "Dapat melihat daftar proposal dan data penelitian dosen" },
    { kode: "penelitian.create", nama: "Ajukan Proposal Penelitian", modul: "Penelitian", deskripsi: "Dapat mengajukan proposal hibah dan riset baru" },
    { kode: "penelitian.edit", nama: "Ubah Data Penelitian", modul: "Penelitian", deskripsi: "Dapat memperbarui data dan status usulan penelitian" },
    { kode: "penelitian.delete", nama: "Hapus Proposal Penelitian", modul: "Penelitian", deskripsi: "Dapat menghapus arsip proposal penelitian" },
    { kode: "penelitian.review", nama: "Review Proposal Penelitian", modul: "Penelitian", deskripsi: "Dapat menilai dan memberikan telaah kelayakan usulan riset" },

    // Pengabdian (PKM)
    { kode: "pengabdian.view", nama: "Lihat Kegiatan PKM", modul: "Pengabdian", deskripsi: "Dapat melihat daftar kegiatan pengabdian kepada masyarakat" },
    { kode: "pengabdian.create", nama: "Ajukan Usulan PKM", modul: "Pengabdian", deskripsi: "Dapat mengajukan kegiatan pengabdian dan kemitraan baru" },
    { kode: "pengabdian.edit", nama: "Ubah Data PKM", modul: "Pengabdian", deskripsi: "Dapat memperbarui detail kegiatan PKM masyarakat" },
    { kode: "pengabdian.delete", nama: "Hapus Kegiatan PKM", modul: "Pengabdian", deskripsi: "Dapat menghapus riwayat usulan PKM" },
    { kode: "pengabdian.review", nama: "Review Proposal PKM", modul: "Pengabdian", deskripsi: "Dapat mereview dan memberi penilaian kelayakan kegiatan PKM" },

    // Publikasi & Jurnal
    { kode: "publikasi.view", nama: "Lihat Data Publikasi", modul: "Publikasi", deskripsi: "Dapat melihat daftar publikasi jurnal dan karya ilmiah" },
    { kode: "publikasi.create", nama: "Catat Publikasi Baru", modul: "Publikasi", deskripsi: "Dapat menginput publikasi artikel jurnal nasional / internasional" },
    { kode: "publikasi.edit", nama: "Ubah Data Publikasi", modul: "Publikasi", deskripsi: "Dapat mengedit informasi jurnal dan capaian luaran" },
    { kode: "publikasi.delete", nama: "Hapus Data Publikasi", modul: "Publikasi", deskripsi: "Dapat menghapus riwayat data publikasi" },

    // Peran & Izin (Role & Permission Management)
    { kode: "roles.view", nama: "Lihat Menu Peran", modul: "Peran & Hak Akses", deskripsi: "Dapat melihat daftar peran pengguna sistem LPPM" },
    { kode: "roles.manage", nama: "Kelola Menu Peran", modul: "Peran & Hak Akses", deskripsi: "Dapat menambah, mengubah, atau mengatur hak peran sistem" },
    { kode: "permissions.view", nama: "Lihat Menu Izin", modul: "Peran & Hak Akses", deskripsi: "Dapat melihat daftar hak izin (permissions) sistem" },
    { kode: "permissions.manage", nama: "Kelola Menu Izin", modul: "Peran & Hak Akses", deskripsi: "Dapat menambah atau memperbarui katalog izin LPPM" },

    // Monitoring dan Evaluasi (Monev)
    { kode: "monev.view", nama: "Lihat Monitoring & Evaluasi", modul: "Monev", deskripsi: "Dapat melihat jadwal, rekaman, dan hasil monev penelitian/pengabdian" },
    { kode: "monev.create", nama: "Jadwalkan Monev Baru", modul: "Monev", deskripsi: "Dapat menetapkan jadwal dan menunjuk reviewer monev riset/pengabdian" },
    { kode: "monev.review", nama: "Beri Nilai & Rekomendasi Monev", modul: "Monev", deskripsi: "Dapat mengisi capaian luaran, skor kemajuan, dan rekomendasi monev" },
    { kode: "monev.manage", nama: "Kelola Administrasi Monev", modul: "Monev", deskripsi: "Dapat mengubah status kelayakan dan mengunggah berita acara monev" },

    // Manajemen Pengguna & Laporan
    { kode: "pengguna.view", nama: "Lihat Manajemen Pengguna", modul: "Pengguna", deskripsi: "Dapat melihat daftar sivitas akademika pengguna SSO" },
    { kode: "pengguna.manage", nama: "Kelola Akses Pengguna", modul: "Pengguna", deskripsi: "Dapat mengatur pemetaan akun pengguna dan perannya" },
    { kode: "laporan.view", nama: "Lihat Rekapitulasi & Laporan", modul: "Laporan", deskripsi: "Dapat melihat dan mencetak rekapitulasi Tridharma LPPM" },
    { kode: "laporan.export", nama: "Ekspor Data & Laporan", modul: "Laporan", deskripsi: "Dapat mengunduh arsip data ke format CSV atau dokumen" },
  ];

  for (const perm of defaultPermissions) {
    await prisma.permission.upsert({
      where: { kode: perm.kode },
      update: {
        nama: perm.nama,
        modul: perm.modul,
        deskripsi: perm.deskripsi,
      },
      create: perm,
    });
  }

  // Role Default
  const rolesData = [
    {
      kode: "SUPERADMIN",
      nama: "Super Administrator LPPM",
      deskripsi: "Hak akses penuh ke seluruh modul riset, PKM, publikasi, dan pengaturan hak akses peran & izin sistem.",
      permissions: [
        "penelitian.view", "penelitian.create", "penelitian.edit", "penelitian.delete", "penelitian.review",
        "pengabdian.view", "pengabdian.create", "pengabdian.edit", "pengabdian.delete", "pengabdian.review",
        "publikasi.view", "publikasi.create", "publikasi.edit", "publikasi.delete",
        "monev.view", "monev.create", "monev.review", "monev.manage",
        "roles.view", "roles.manage", "permissions.view", "permissions.manage",
        "pengguna.view", "pengguna.manage", "laporan.view", "laporan.export"
      ],
    },
    {
      kode: "ADMIN_LPPM",
      nama: "Pengelola LPPM UNUSU",
      deskripsi: "Mengelola pangkalan data penelitian, verifikasi berkas PKM, administrasi jurnal, serta memantau izin peran.",
      permissions: [
        "penelitian.view", "penelitian.create", "penelitian.edit", "penelitian.delete", "penelitian.review",
        "pengabdian.view", "pengabdian.create", "pengabdian.edit", "pengabdian.delete", "pengabdian.review",
        "publikasi.view", "publikasi.create", "publikasi.edit", "publikasi.delete",
        "monev.view", "monev.create", "monev.manage",
        "roles.view", "permissions.view",
        "pengguna.view", "laporan.view", "laporan.export"
      ],
    },
    {
      kode: "DOSEN",
      nama: "Dosen Peneliti & Pengabdi",
      deskripsi: "Dapat mengusulkan proposal penelitian, mencatat kegiatan PKM, dan mendokumentasikan publikasi ilmiah.",
      permissions: [
        "penelitian.view", "penelitian.create",
        "pengabdian.view", "pengabdian.create",
        "publikasi.view", "publikasi.create",
        "monev.view",
        "laporan.view"
      ],
    },
    {
      kode: "REVIEWER",
      nama: "Reviewer Proposal Riset",
      deskripsi: "Menilai kelayakan usulan proposal riset dan kemitraan masyarakat LPPM UNUSU.",
      permissions: [
        "penelitian.view", "penelitian.review",
        "pengabdian.view", "pengabdian.review",
        "publikasi.view",
        "monev.view", "monev.review",
        "laporan.view"
      ],
    },
  ];

  for (const r of rolesData) {
    const roleRecord = await prisma.role.upsert({
      where: { kode: r.kode },
      update: {
        nama: r.nama,
        deskripsi: r.deskripsi,
      },
      create: {
        kode: r.kode,
        nama: r.nama,
        deskripsi: r.deskripsi,
      },
    });

    // Hubungkan permission
    for (const pKode of r.permissions) {
      const permObj = await prisma.permission.findUnique({ where: { kode: pKode } });
      if (permObj) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: roleRecord.id,
              permissionId: permObj.id,
            },
          },
          update: {},
          create: {
            roleId: roleRecord.id,
            permissionId: permObj.id,
          },
        });
      }
    }
  }

  // 1. Penelitian Dosen
  await prisma.penelitian.createMany({
    data: [
      {
        judul: "Rancang Bangun Sistem Informasi Terpadu Kampus Berbasis Microservices & Single Sign-On di UNUSU",
        ketua: "Junaidy, M.Kom.",
        nidn: "0123068901",
        anggota: "Ahmad Zaki, M.Kom., Muhammad Fadhil",
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

  // 4. Kategori Riset telah dihapus (migrasi penghapusan Kategori & Skema Riset)

  // 5. Data Dummy Monitoring dan Evaluasi (Monev)
  // Ambil record penelitian & pengabdian yang baru dibuat atau sudah ada
  const samplePenelitian = await prisma.penelitian.findFirst({
    orderBy: { id: "asc" }
  });
  const samplePengabdian = await prisma.pengabdian.findFirst({
    orderBy: { id: "asc" }
  });

  const dummyMonev = [
    {
      kodeMonev: "MNV-PEN-2026-001",
      jenisProgram: "PENELITIAN" as const,
      tahap: "MONEV_ANTARA" as const,
      status: "DISETUJUI" as const,
      rekomendasi: "LANJUT_PENUH" as const,
      penelitianId: samplePenelitian ? samplePenelitian.id : null,
      pengabdianId: null,
      namaReviewer: "Prof. Dr. Ir. H. Syahril Efendi, M.Sc.",
      nidnReviewer: "0014026501",
      tanggalJadwal: new Date("2026-06-15"),
      tanggalMonev: new Date("2026-06-15"),
      lokasiMonev: "Ruang Sidang Smart Room LPPM Lt. 2 UNUSU",
      persentaseKemajuan: 75,
      persentaseDanaTerpakai: 70,
      skorSubstansi: 88.5,
      targetLuaranWajib: "1 Artikel Jurnal Terindeks SINTA 2 & Hak Cipta Perangkat Lunak SSO",
      capaianLuaran: "Draft manuskrip berstatus 'Under Review' di Jurnal Terakreditasi SINTA 2; modul SSO dan API gateway telah terpasang 80%.",
      catatanReviewer: "Perkembangan arsitektur integrasi sistem sangat baik. Validasi performa throughput pada traffic concurrent perlu diperjelas dalam laporan akhir.",
      tindakLanjut: "Lakukan pengujian stress test beban server dan persiapkan penerbitan sertifikat Hak Cipta EC00.",
      beritaAcaraUrl: "/documents/monev/BA-MONEV-PEN-2026-001.pdf",
      buktiDokumentasiUrl: "/images/monev/dokumentasi-pen-001.jpg",
    },
    {
      kodeMonev: "MNV-PKM-2026-001",
      jenisProgram: "PENGABDIAN" as const,
      tahap: "MONEV_LAPANGAN" as const,
      status: "PERLU_REVISI" as const,
      rekomendasi: "LANJUT_BERSYARAT" as const,
      penelitianId: null,
      pengabdianId: samplePengabdian ? samplePengabdian.id : null,
      namaReviewer: "Dr. K.H. Ahmad Nawawi, M.A.",
      nidnReviewer: "0112087502",
      tanggalJadwal: new Date("2026-07-20"),
      tanggalMonev: new Date("2026-07-22"),
      lokasiMonev: "Kantor Koperasi Muslimat NU Percut Sei Tuan, Deli Serdang",
      persentaseKemajuan: 60,
      persentaseDanaTerpakai: 50,
      skorSubstansi: 79.0,
      targetLuaranWajib: "Publikasi Jurnal Pengabdian Nasional, Video Dokumenter YouTube, Produk Kemasan UMKM",
      capaianLuaran: "Pelatihan pembukuan berbasis web telah terlaksana untuk 25 anggota pelaku usaha; video draft 50%.",
      catatanReviewer: "Antusiasme mitra tinggi. Namun luaran wajib buku saku panduan operasional pembukuan UMKM belum diserahkan ke mitra.",
      tindakLanjut: "Lengkapi cetak buku saku panduan dan sertakan surat kepuasan kepesertaan mitra selambat-lambatnya 14 hari kerja.",
      beritaAcaraUrl: "/documents/monev/BA-MONEV-PKM-2026-001.pdf",
      buktiDokumentasiUrl: "/images/monev/visitasi-pkm-deliserdang.jpg",
    },
    {
      kodeMonev: "MNV-PEN-2026-002",
      jenisProgram: "PENELITIAN" as const,
      tahap: "MONEV_AKHIR" as const,
      status: "DIJADWALKAN" as const,
      rekomendasi: "LANJUT_PENUH" as const,
      penelitianId: samplePenelitian ? samplePenelitian.id : null,
      pengabdianId: null,
      namaReviewer: "Dr. Faisal Riza, M.Pd.",
      nidnReviewer: "0103048101",
      tanggalJadwal: new Date("2026-11-10"),
      tanggalMonev: null,
      lokasiMonev: "Daring via Zoom Cloud Meetings LPPM UNUSU",
      persentaseKemajuan: 40,
      persentaseDanaTerpakai: 40,
      skorSubstansi: null,
      targetLuaranWajib: "Publikasi Jurnal Internasional Terindeks Scopus / Copernicus dan Laporan Keuangan 100%",
      capaianLuaran: "Pengumpulan dataset dan eksperimen model pembelajaran mesin selesai 100%.",
      catatanReviewer: "Jadwal monev tahap akhir telah dikonfirmasi bersama tim peneliti.",
      tindakLanjut: "Peneliti diharapkan mengunggah draf final laporan dan naskah publikasi 3 hari sebelum jadwal telaah.",
      beritaAcaraUrl: null,
      buktiDokumentasiUrl: null,
    }
  ];

  // Gunakan raw query atau prisma model yang kompatibel jika client ter-generate
  for (const m of dummyMonev) {
    await (prisma as any).monitoringEvaluasi.upsert({
      where: { kodeMonev: m.kodeMonev },
      update: {
        jenisProgram: m.jenisProgram,
        tahap: m.tahap,
        status: m.status,
        rekomendasi: m.rekomendasi,
        penelitianId: m.penelitianId,
        pengabdianId: m.pengabdianId,
        namaReviewer: m.namaReviewer,
        nidnReviewer: m.nidnReviewer,
        tanggalJadwal: m.tanggalJadwal,
        tanggalMonev: m.tanggalMonev,
        lokasiMonev: m.lokasiMonev,
        persentaseKemajuan: m.persentaseKemajuan,
        persentaseDanaTerpakai: m.persentaseDanaTerpakai,
        skorSubstansi: m.skorSubstansi,
        targetLuaranWajib: m.targetLuaranWajib,
        capaianLuaran: m.capaianLuaran,
        catatanReviewer: m.catatanReviewer,
        tindakLanjut: m.tindakLanjut,
        beritaAcaraUrl: m.beritaAcaraUrl,
        buktiDokumentasiUrl: m.buktiDokumentasiUrl,
      },
      create: m,
    }).catch(async () => {
      // Fallback jika belum ter-generate di Prisma Client runtime lokal: gunakan query raw
      await prisma.$executeRawUnquoted`
        INSERT INTO lppm_monitoring_evaluasi (
          kodeMonev, jenisProgram, tahap, status, rekomendasi,
          penelitianId, pengabdianId, namaReviewer, nidnReviewer,
          tanggalJadwal, tanggalMonev, lokasiMonev, persentaseKemajuan,
          persentaseDanaTerpakai, skorSubstansi, targetLuaranWajib,
          capaianLuaran, catatanReviewer, tindakLanjut, beritaAcaraUrl,
          buktiDokumentasiUrl, createdAt, updatedAt
        ) VALUES (
          ${m.kodeMonev}, ${m.jenisProgram}, ${m.tahap}, ${m.status}, ${m.rekomendasi},
          ${m.penelitianId}, ${m.pengabdianId}, ${m.namaReviewer}, ${m.nidnReviewer},
          ${m.tanggalJadwal.toISOString().slice(0, 10)},
          ${m.tanggalMonev ? m.tanggalMonev.toISOString().slice(0, 10) : null},
          ${m.lokasiMonev}, ${m.persentaseKemajuan}, ${m.persentaseDanaTerpakai},
          ${m.skorSubstansi}, ${m.targetLuaranWajib}, ${m.capaianLuaran},
          ${m.catatanReviewer}, ${m.tindakLanjut}, ${m.beritaAcaraUrl},
          ${m.buktiDokumentasiUrl}, NOW(), NOW()
        )
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          rekomendasi = VALUES(rekomendasi),
          persentaseKemajuan = VALUES(persentaseKemajuan),
          persentaseDanaTerpakai = VALUES(persentaseDanaTerpakai),
          skorSubstansi = VALUES(skorSubstansi),
          catatanReviewer = VALUES(catatanReviewer);
      `;
    });
  }

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
