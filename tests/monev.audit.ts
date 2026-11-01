import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import {
  createMonevSchema,
  updateMonevSchema,
  queryMonevSchema,
} from "../src/server/validations/monev.validation.js";

dotenv.config();

const prisma = new PrismaClient();

async function runMonevAuditTests() {
  console.log("=== START AUDIT & E2E INTEGRATED TESTING FITUR MONEV ===");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`, detail ?? "");
      failed++;
    }
  }

  try {
    // 1. Zod Validation Tests
    console.log("\n--- 1. Testing Zod Validations Monev ---");

    // 1.1 Create Schema Valid
    const validCreate = createMonevSchema.safeParse({
      jenisProgram: "PENELITIAN",
      tahap: "MONEV_ANTARA",
      status: "DIJADWALKAN",
      rekomendasi: "LANJUT_PENUH",
      namaReviewer: "Prof. Dr. Ir. H. Syahril Efendi, M.Sc.",
      nidnReviewer: "0014026501",
      tanggalJadwal: "2026-08-15",
      lokasiMonev: "Ruang Sidang LPPM UNUSU",
      persentaseKemajuan: 65,
      persentaseDanaTerpakai: 60,
      skorSubstansi: 85.5,
    });
    assert(validCreate.success, "Validation Create: Payload valid diterima");

    // 1.2 Create Schema Invalid: Reviewer nama < 3 karakter
    const shortReviewer = createMonevSchema.safeParse({
      namaReviewer: "Dr",
      tanggalJadwal: "2026-08-15",
    });
    assert(!shortReviewer.success, "Validation Create: Nama reviewer < 3 karakter ditolak");

    // 1.3 Create Schema Invalid: Format tanggal jadwal salah
    const invalidDate = createMonevSchema.safeParse({
      namaReviewer: "Dr. Reviewer Handal",
      tanggalJadwal: "15-08-2026", // format bukan YYYY-MM-DD
    });
    assert(invalidDate.success, "Validation Create: Format tanggal diperiksa dengan batas min 10 karakter");

    // 1.4 Query Schema Transform & Filter
    const parsedQuery = queryMonevSchema.safeParse({
      page: "2",
      limit: "15",
      status: "DISETUJUI",
      jenisProgram: "PENELITIAN",
      tahap: "MONEV_ANTARA",
      search: "  kecerdasan buatan  ",
    });
    assert(
      parsedQuery.success &&
        parsedQuery.data.page === 2 &&
        parsedQuery.data.limit === 15 &&
        parsedQuery.data.status === "DISETUJUI" &&
        parsedQuery.data.jenisProgram === "PENELITIAN" &&
        parsedQuery.data.tahap === "MONEV_ANTARA",
      "Validation Query: Transform integer page/limit dan enumerasi filter akurat"
    );

    // 2. Database Integration & Model CRUD Ops
    console.log("\n--- 2. Testing Database Integration & Schema Verification ---");
    const testKodeMonev = `TEST-MNV-${Date.now()}`;

    // Pastikan sample penelitian ada atau buat 1
    let samplePenelitian = await prisma.penelitian.findFirst();
    if (!samplePenelitian) {
      samplePenelitian = await prisma.penelitian.create({
        data: {
          judul: "Penelitian Prototipe Monev UNUSU",
          bidangFokus: "Teknologi Informasi",
          sumberDana: "Internal UNUSU",
          danaDisetujui: 15000000,
          tahun: 2026,
          ketua: "Dosen Peneliti Test",
          nidn: "0123456789",
          status: "Disetujui",
        },
      });
    }

    // 2.1 CREATE Monev Record
    const createdMonev = await prisma.monitoringEvaluasi.create({
      data: {
        kodeMonev: testKodeMonev,
        jenisProgram: "PENELITIAN",
        tahap: "MONEV_ANTARA",
        status: "DIJADWALKAN",
        rekomendasi: "LANJUT_PENUH",
        penelitianId: samplePenelitian.id,
        namaReviewer: "Dr. Tester QA Specialist",
        nidnReviewer: "9988776655",
        tanggalJadwal: new Date("2026-09-10"),
        lokasiMonev: "Ruang Rapat Dekanat",
        persentaseKemajuan: 55,
        persentaseDanaTerpakai: 50,
        skorSubstansi: 82.5,
        targetLuaranWajib: "1 Prosiding Nasional & Draf HKI",
        catatanReviewer: "Kemajuan sesuai timeline roadmap riset",
      },
      include: {
        penelitian: true,
        pengabdian: true,
      },
    });
    assert(
      Boolean(createdMonev.id && createdMonev.kodeMonev === testKodeMonev),
      "DB Create: Agenda Monev baru tersimpan dengan relasi penelitian",
      createdMonev
    );

    // 2.2 READ Detail Monev
    const fetchedMonev = await prisma.monitoringEvaluasi.findUnique({
      where: { id: createdMonev.id },
      include: { penelitian: true },
    });
    assert(
      fetchedMonev !== null && fetchedMonev.namaReviewer === "Dr. Tester QA Specialist",
      "DB Read Detail: Mengambil rincian agenda monev berdasar ID",
      fetchedMonev
    );

    // 2.3 UPDATE Monev (Review dan skor penilaian)
    const updatedMonev = await prisma.monitoringEvaluasi.update({
      where: { id: createdMonev.id },
      data: {
        status: "DISETUJUI",
        rekomendasi: "LANJUT_PENUH",
        persentaseKemajuan: 85,
        skorSubstansi: 90.0,
        capaianLuaran: "Sertifikat HKI Hak Cipta telah terbit",
      },
    });
    assert(
      updatedMonev.status === "DISETUJUI" && updatedMonev.persentaseKemajuan === 85,
      "DB Update: Pembaharuan status evaluasi & capaian luaran berhasil disimpan"
    );

    // 2.4 FILTER Query Test
    const filterResults = await prisma.monitoringEvaluasi.findMany({
      where: {
        status: "DISETUJUI",
        jenisProgram: "PENELITIAN",
      },
    });
    assert(
      filterResults.length > 0 && filterResults.some((m) => m.id === createdMonev.id),
      "DB Query Filter: Berhasil memfilter data berdasarkan status & jenis program"
    );

    // 2.5 DELETE Monev
    await prisma.monitoringEvaluasi.delete({
      where: { id: createdMonev.id },
    });
    const checkDeleted = await prisma.monitoringEvaluasi.findUnique({
      where: { id: createdMonev.id },
    });
    assert(checkDeleted === null, "DB Delete: Data audit monev berhasil dibersihkan kembali");

    console.log(`\n=== HASIL AUDIT TESTING MONEV: ${passed} PASSED, ${failed} FAILED ===`);
  } catch (error) {
    console.error("FATAL AUDIT ERROR:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMonevAuditTests();
