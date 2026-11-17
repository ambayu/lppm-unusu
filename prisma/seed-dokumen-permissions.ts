import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const dokPerms = [
    { kode: 'dokumen.view', nama: 'Lihat Arsip Dokumen', modul: 'Dokumen', deskripsi: 'Melihat daftar dan detail arsip dokumen LPPM' },
    { kode: 'dokumen.create', nama: 'Tambah Arsip Dokumen', modul: 'Dokumen', deskripsi: 'Mengunggah dan membuat arsip dokumen LPPM baru' },
    { kode: 'dokumen.edit', nama: 'Ubah Arsip Dokumen', modul: 'Dokumen', deskripsi: 'Memperbarui data dan metadata arsip dokumen LPPM' },
    { kode: 'dokumen.delete', nama: 'Hapus Arsip Dokumen', modul: 'Dokumen', deskripsi: 'Menghapus arsip dokumen LPPM' },
  ];

  for (const dp of dokPerms) {
    const p = await prisma.permission.upsert({
      where: { kode: dp.kode },
      update: { nama: dp.nama, modul: dp.modul, deskripsi: dp.deskripsi },
      create: dp,
    });
    console.log('Perm ready:', p.kode);
  }

  const roles = await prisma.role.findMany({
    where: { kode: { in: ['SUPERADMIN', 'ADMIN_LPPM'] } },
  });

  const allDokPerms = await prisma.permission.findMany({
    where: { kode: { in: dokPerms.map((d) => d.kode) } },
  });

  for (const r of roles) {
    for (const p of allDokPerms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: r.id, permissionId: p.id } },
        update: {},
        create: { roleId: r.id, permissionId: p.id },
      });
    }
    console.log('Linked to role:', r.kode);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
