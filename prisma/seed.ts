import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding data hak akses dan peran terdesentralisasi LPPM UNUSU...");

  // 1. Permission (Izin) Berbasis Menu & Modul Nyata LPPM UNUSU
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

    // Monitoring dan Evaluasi (Monev)
    { kode: "monev.view", nama: "Lihat Monitoring & Evaluasi", modul: "Monev", deskripsi: "Dapat melihat jadwal, rekaman, dan hasil monev penelitian/pengabdian" },
    { kode: "monev.create", nama: "Jadwalkan Monev Baru", modul: "Monev", deskripsi: "Dapat menetapkan jadwal dan menunjuk reviewer monev riset/pengabdian" },
    { kode: "monev.review", nama: "Beri Nilai & Rekomendasi Monev", modul: "Monev", deskripsi: "Dapat mengisi capaian luaran, skor kemajuan, dan rekomendasi monev" },
    { kode: "monev.manage", nama: "Kelola Administrasi Monev", modul: "Monev", deskripsi: "Dapat mengubah status kelayakan dan mengunggah berita acara monev" },

    // Peran & Hak Akses (Role & Permission Management)
    { kode: "roles.view", nama: "Lihat Menu Peran", modul: "Peran & Hak Akses", deskripsi: "Dapat melihat daftar peran pengguna sistem LPPM" },
    { kode: "roles.manage", nama: "Kelola Menu Peran", modul: "Peran & Hak Akses", deskripsi: "Dapat menambah, mengubah, atau mengatur hak peran sistem" },
    { kode: "permissions.view", nama: "Lihat Menu Izin", modul: "Peran & Hak Akses", deskripsi: "Dapat melihat daftar hak izin (permissions) sistem" },
    { kode: "permissions.manage", nama: "Kelola Menu Izin", modul: "Peran & Hak Akses", deskripsi: "Dapat menambah atau memperbarui katalog izin LPPM" },

    // Pengguna (Penugasan Peran Civitas di LPPM)
    { kode: "users.view", nama: "Lihat Penugasan Pengguna", modul: "Manajemen Pengguna", deskripsi: "Dapat melihat daftar civitas dan peran lokal yang ditugaskan di LPPM" },
    { kode: "users.manage", nama: "Kelola Penugasan Pengguna", modul: "Manajemen Pengguna", deskripsi: "Dapat menugaskan multi-role peran lokal LPPM kepada pengguna" },

    // Laporan & Ekspor
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

  // 2. Definisi Peran Bawaan LPPM
  const rolesData = [
    {
      kode: "SUPERADMIN",
      nama: "Super Administrator LPPM",
      deskripsi: "Hak akses penuh ke seluruh modul riset, PKM, publikasi, monev, dan tata kelola peran, izin, serta pengguna.",
      permissions: [
        "penelitian.view", "penelitian.create", "penelitian.edit", "penelitian.delete", "penelitian.review",
        "pengabdian.view", "pengabdian.create", "pengabdian.edit", "pengabdian.delete", "pengabdian.review",
        "publikasi.view", "publikasi.create", "publikasi.edit", "publikasi.delete",
        "monev.view", "monev.create", "monev.review", "monev.manage",
        "roles.view", "roles.manage",
        "permissions.view", "permissions.manage",
        "users.view", "users.manage",
        "laporan.view", "laporan.export"
      ],
    },
    {
      kode: "ADMIN_LPPM",
      nama: "Pengelola LPPM UNUSU",
      deskripsi: "Mengelola usulan penelitian, verifikasi berkas PKM, publikasi jurnal, jadwal monev, serta pemantauan pengguna.",
      permissions: [
        "penelitian.view", "penelitian.create", "penelitian.edit", "penelitian.delete", "penelitian.review",
        "pengabdian.view", "pengabdian.create", "pengabdian.edit", "pengabdian.delete", "pengabdian.review",
        "publikasi.view", "publikasi.create", "publikasi.edit", "publikasi.delete",
        "monev.view", "monev.create", "monev.manage",
        "roles.view", "permissions.view", "users.view",
        "laporan.view", "laporan.export"
      ],
    },
    {
      kode: "DOSEN",
      nama: "Dosen Peneliti & Pengabdi",
      deskripsi: "Dapat mengusulkan proposal penelitian, mencatat kegiatan PKM, mendokumentasikan publikasi, dan memantau monev.",
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

    const izinSah = await prisma.permission.findMany({
      where: { kode: { in: r.permissions } },
      select: { id: true },
    });

    await prisma.rolePermission.deleteMany({
      where: { roleId: roleRecord.id, permissionId: { notIn: izinSah.map((i) => i.id) } },
    });

    for (const pKode of r.permissions) {
      const permObj = await prisma.permission.findUnique({ where: { kode: pKode } });
      if (!permObj) continue;

      const ada = await prisma.rolePermission.findFirst({
        where: { roleId: roleRecord.id, permissionId: permObj.id },
      });
      if (!ada) {
        await prisma.rolePermission.create({
          data: {
            roleId: roleRecord.id,
            permissionId: permObj.id,
          },
        });
      }
    }
  }

  // 3. Seeding Awal Penugasan Multi-Role Pengguna Lokal LPPM
  const superadminRole = await prisma.role.findUnique({ where: { kode: "SUPERADMIN" } });
  const dosenRole = await prisma.role.findUnique({ where: { kode: "DOSEN" } });

  if (superadminRole) {
    await prisma.userRole.upsert({
      where: {
        username_roleId: {
          username: "admin",
          roleId: superadminRole.id,
        },
      },
      update: { nama: "Super Administrator LPPM" },
      create: {
        username: "admin",
        nama: "Super Administrator LPPM",
        roleId: superadminRole.id,
      },
    });
  }

  if (dosenRole) {
    await prisma.userRole.upsert({
      where: {
        username_roleId: {
          username: "0102038901",
          roleId: dosenRole.id,
        },
      },
      update: { nama: "Dr. Muhammad Farhan, M.Kom." },
      create: {
        username: "0102038901",
        nama: "Dr. Muhammad Farhan, M.Kom.",
        roleId: dosenRole.id,
      },
    });
  }

  console.log("Seeding desentralisasi hak akses LPPM UNUSU selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
