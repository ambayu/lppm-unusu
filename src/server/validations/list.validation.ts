import { z } from "zod";

/**
 * Skema query bersama untuk endpoint daftar (Penelitian, Pengabdian, Publikasi).
 *
 * Prinsip kompatibilitas:
 * - `limit` OPSIONAL. Bila tidak dikirim, endpoint tetap mengembalikan seluruh
 *   data seperti perilaku lama (dipakai tabel client saat ini).
 * - Bila `limit` dikirim, endpoint memakai pagination server-side (skip/take)
 *   sehingga tidak perlu menarik seluruh baris ke memori.
 * - `page` default 1, `limit` maksimum 100 agar satu request tidak membebani DB.
 */
export const queryListSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().max(150).optional(),
  tahun: z.coerce.number().int().min(2000).max(2100).optional(),
  status: z.string().trim().max(50).optional(),
  sort: z.enum(["terbaru", "terlama"]).default("terbaru"),
});

export type QueryListInput = z.infer<typeof queryListSchema>;

/** Hitung skip/take dari input pagination; `null` bila pagination tidak dipakai. */
export function resolvePagination(input: QueryListInput): { skip: number; take: number } | null {
  if (!input.limit) return null;
  return { skip: (input.page - 1) * input.limit, take: input.limit };
}

/**
 * Urutan stabil: kolom waktu + `id` sebagai tie-breaker.
 * Tanpa tie-breaker, baris dengan createdAt identik bisa berpindah halaman
 * (offset pagination) sehingga data tampak duplikat/hilang.
 * Urutan ini juga selaras dengan index `*_createdAt_idx` pada schema.prisma.
 */
export function resolveOrder(
  sort: QueryListInput["sort"],
): Array<{ createdAt: "asc" | "desc"; id: "asc" | "desc" }> {
  const direction = sort === "terlama" ? "asc" : "desc";
  return [{ createdAt: direction, id: direction }];
}

/** Bentuk metadata pagination yang konsisten dengan endpoint /api/monev. */
export function buildPaginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
