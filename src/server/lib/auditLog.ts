import type { Request, Response, NextFunction } from "express";
import type { PrismaClient, AksiAudit } from "@prisma/client";
import { z } from "zod";

/**
 * Audit trail — jejak mutasi data LPPM UNUSU.
 *
 * Desain aman:
 * - Log ditulis SETELAH respons selesai (`res.on("finish")`), sehingga tidak
 *   memperlambat respons pengguna dan tidak pernah menggagalkan request.
 * - Semua error penulisan log ditelan (`catch`) — audit tidak boleh menjadi
 *   titik kegagalan fungsional aplikasi.
 * - Hanya request mutasi (POST/PUT/PATCH/DELETE) dengan status < 400 yang dicatat.
 * - Payload dipotong (maks. 2000 karakter) dan field sensitif dibuang.
 * - Tabel `lppm_audit_log` bersifat append-only: tidak ada endpoint update/delete.
 */

/** Skema query untuk `GET /api/audit-log` (semua filter memakai kolom ber-index). */
export const queryAuditSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  entitas: z.string().trim().max(50).optional(),
  aksi: z.enum(["CREATE", "UPDATE", "DELETE"]).optional(),
  aktor: z.string().trim().max(150).optional(),
  search: z.string().trim().max(150).optional(),
  dari: z.string().trim().min(10).max(30).optional(), // YYYY-MM-DD
  sampai: z.string().trim().min(10).max(30).optional(),
});

export type QueryAuditInput = z.infer<typeof queryAuditSchema>;

/** Pemetaan segmen URL API -> nama entitas yang dicatat. */
const ENTITAS_MAP: Record<string, string> = {
  penelitian: "penelitian",
  pengabdian: "pengabdian",
  publikasi: "publikasi",
  monev: "monev",
  roles: "role",
  role: "role",
  permissions: "permission",
  permission: "permission",
  "audit-log": "audit",
};

/** Field yang tidak boleh masuk ringkasan log. */
const REDACTED_KEYS = new Set([
  "password",
  "passwordBaru",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "secret",
  "clientKey",
  "cvv",
  "kartu",
]);

const MAX_RINGKASAN = 2000;

/** Ambil nama entitas + id record dari path seperti `/api/penelitian/12?x=1`. */
export function deriveEntitas(rawUrl: string): { entitas: string; entitasId: number | null } {
  const pathname = (rawUrl || "").split("?")[0];
  const segments = pathname.split("/").filter(Boolean); // ["api", "penelitian", "12"]
  const kandidat = segments[1] || "unknown";
  const entitas = ENTITAS_MAP[kandidat] || kandidat.slice(0, 50);
  const idSegment = segments[2];
  const entitasId = idSegment && /^\d+$/.test(idSegment) ? Number(idSegment) : null;
  return { entitas, entitasId };
}

/** Ringkas payload menjadi JSON pendek tanpa field sensitif. */
export function ringkasPayload(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const bersih: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (REDACTED_KEYS.has(key)) {
      bersih[key] = "[REDACTED]";
      continue;
    }
    if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
      bersih[key] = typeof value === "string" && value.length > 200 ? `${value.slice(0, 200)}…` : value;
    } else {
      bersih[key] = "[objek]";
    }
  }
  const teks = JSON.stringify(bersih);
  return teks.length > MAX_RINGKASAN ? `${teks.slice(0, MAX_RINGKASAN)}…` : teks;
}

/**
 * Subset PrismaClient yang dibutuhkan logger.
 *
 * Diturunkan langsung dari PrismaClient (bukan antarmuka buatan sendiri) karena
 * metode `create` Prisma bersifat generik: tanda tangan yang ditulis manual
 * tidak akan pernah cocok. Dengan cara ini `createAuditLogger(prisma)` lolos
 * pemeriksaan tipe, sementara pengujian tetap bisa menyuntikkan objek tiruan
 * yang berbentuk sama.
 */
export type AuditWriter = Pick<PrismaClient, "auditLog">;

interface AktorAudit {
  id?: number | null;
  nidn?: string | null;
  nama?: string | null;
  role?: string | null;
}

/**
 * Middleware Express: catat setiap mutasi sukses ke `lppm_audit_log`.
 * Dipasang setelah middleware autentikasi agar `req.user` sudah terisi.
 */
export function createAuditLogger(writer: AuditWriter) {
  return function auditLogger(req: Request, res: Response, next: NextFunction) {
    const metode = (req.method || "").toUpperCase();
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(metode)) {
      return next();
    }

    res.on("finish", () => {
      // Hanya mutasi yang berhasil (2xx/3xx) yang dicatat.
      if (res.statusCode >= 400) return;

      const aktor = ((req as Request & { user?: AktorAudit }).user || {}) as AktorAudit;
      const { entitas, entitasId } = deriveEntitas(req.originalUrl || req.url || "");

      // `aksi` bertipe enum `AksiAudit` di Prisma, bukan string bebas.
      const aksi: AksiAudit = metode === "POST" ? "CREATE" : metode === "DELETE" ? "DELETE" : "UPDATE";

      const data = {
        aktorId: aktor.id ?? null,
        aktorNidn: aktor.nidn ?? null,
        aktorNama: aktor.nama ?? null,
        aktorRole: aktor.role ?? null,
        aksi,
        entitas,
        entitasId,
        metode,
        path: (req.originalUrl || req.url || "").slice(0, 255),
        statusCode: res.statusCode,
        ringkasan: ringkasPayload(req.body),
        ipAddress: (req.ip || req.socket?.remoteAddress || "").slice(0, 64) || null,
      };

      // Fire-and-forget: kegagalan audit tidak boleh memengaruhi respons.
      void Promise.resolve(writer.auditLog.create({ data })).catch(() => undefined);
    });

    return next();
  };
}
