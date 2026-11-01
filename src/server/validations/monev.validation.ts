import { z } from "zod";

// Enum yang sesuai dengan Prisma schema MonitoringEvaluasi
export const jenisProgramMonevEnum = z.enum(["PENELITIAN", "PENGABDIAN"]);

export const tahapMonevEnum = z.enum([
  "MONEV_ANTARA",
  "MONEV_AKHIR",
  "MONEV_LAPANGAN",
]);

export const statusMonevEnum = z.enum([
  "DIJADWALKAN",
  "SEDANG_DITELAAH",
  "PERLU_REVISI",
  "DISETUJUI",
  "DITOLAK",
]);

export const rekomendasiMonevEnum = z.enum([
  "LANJUT_PENUH",
  "LANJUT_BERSYARAT",
  "TUNDA",
  "HENTIKAN",
]);

export const createMonevSchema = z.object({
  kodeMonev: z.string().trim().max(50).optional(),
  jenisProgram: jenisProgramMonevEnum.default("PENELITIAN"),
  tahap: tahapMonevEnum.default("MONEV_ANTARA"),
  status: statusMonevEnum.default("DIJADWALKAN"),
  rekomendasi: rekomendasiMonevEnum.optional().nullable(),
  penelitianId: z.coerce.number().int().positive().optional().nullable(),
  pengabdianId: z.coerce.number().int().positive().optional().nullable(),
  namaReviewer: z.string().trim().min(3, "Nama reviewer minimal 3 karakter").max(150),
  nidnReviewer: z.string().trim().max(50).optional().nullable(),
  tanggalJadwal: z.string().trim().min(10, "Format tanggal jadwal harus YYYY-MM-DD"),
  tanggalMonev: z.string().trim().min(10, "Format tanggal monev harus YYYY-MM-DD").optional().nullable(),
  lokasiMonev: z.string().trim().max(255).optional().nullable(),
  persentaseKemajuan: z.coerce.number().min(0, "Kemajuan minimal 0%").max(100, "Kemajuan maksimal 100%").default(0),
  persentaseDanaTerpakai: z.coerce.number().min(0, "Serapan dana minimal 0%").max(100, "Serapan dana maksimal 100%").default(0),
  skorSubstansi: z.coerce.number().min(0).max(100).optional().nullable(),
  targetLuaranWajib: z.string().trim().optional().nullable(),
  capaianLuaran: z.string().trim().optional().nullable(),
  catatanReviewer: z.string().trim().optional().nullable(),
  tindakLanjut: z.string().trim().optional().nullable(),
  beritaAcaraUrl: z.string().trim().optional().nullable(),
  buktiDokumentasiUrl: z.string().trim().optional().nullable(),
});

export const updateMonevSchema = z.object({
  jenisProgram: jenisProgramMonevEnum.optional(),
  tahap: tahapMonevEnum.optional(),
  status: statusMonevEnum.optional(),
  rekomendasi: rekomendasiMonevEnum.optional().nullable(),
  penelitianId: z.coerce.number().int().positive().optional().nullable(),
  pengabdianId: z.coerce.number().int().positive().optional().nullable(),
  namaReviewer: z.string().trim().min(3, "Nama reviewer minimal 3 karakter").max(150).optional(),
  nidnReviewer: z.string().trim().max(50).optional().nullable(),
  tanggalJadwal: z.string().trim().min(10, "Format tanggal jadwal harus YYYY-MM-DD").optional(),
  tanggalMonev: z.string().trim().min(10, "Format tanggal monev harus YYYY-MM-DD").optional().nullable(),
  lokasiMonev: z.string().trim().max(255).optional().nullable(),
  persentaseKemajuan: z.coerce.number().min(0).max(100).optional(),
  persentaseDanaTerpakai: z.coerce.number().min(0).max(100).optional(),
  skorSubstansi: z.coerce.number().min(0).max(100).optional().nullable(),
  targetLuaranWajib: z.string().trim().optional().nullable(),
  capaianLuaran: z.string().trim().optional().nullable(),
  catatanReviewer: z.string().trim().optional().nullable(),
  tindakLanjut: z.string().trim().optional().nullable(),
  beritaAcaraUrl: z.string().trim().optional().nullable(),
  buktiDokumentasiUrl: z.string().trim().optional().nullable(),
});

export const queryMonevSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
  jenisProgram: z.string().trim().optional(),
  tahap: z.string().trim().optional(),
  tahun: z.coerce.number().int().optional(),
});

export type CreateMonevInput = z.infer<typeof createMonevSchema>;
export type UpdateMonevInput = z.infer<typeof updateMonevSchema>;
export type QueryMonevInput = z.infer<typeof queryMonevSchema>;
