import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import {
  createMonevSchema,
  updateMonevSchema,
  queryMonevSchema,
} from "./validations/monev.validation.js";
import {
  queryListSchema,
  resolvePagination,
  resolveOrder,
  buildPaginationMeta,
} from "./validations/list.validation.js";
import {
  createAuditLogger,
  queryAuditSchema,
} from "./lib/auditLog.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5005;

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// Static client
const clientDistPath = path.resolve(process.cwd(), "dist/client");
app.use(express.static(clientDistPath));
app.use("/lppm", express.static(clientDistPath));

// Auth guard & public route audit:
// Rute publik root '/' atau sub-path '/lppm' tidak melakukan redirect otomatis ke '/admin'.
// Akses publik tetap melayani landing page/katalog publik tanpa paksaan redirect login/admin.


// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", app: "LPPM UNUSU API", time: new Date().toISOString() });
});

// ==========================================
// SSO ONE UNUSU — satu pintu, tanpa login lokal
// ==========================================
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET belum diset di environment. Server dihentikan demi keamanan.");
  process.exit(1);
}
const SSO_BASE_URL = process.env.SSO_BASE_URL || "http://localhost:5000";
const SSO_CLIENT_ID = process.env.SSO_CLIENT_ID || "lppm-unusu";
const SSO_CLIENT_KEY = process.env.SSO_CLIENT_KEY || "";

interface SsoUserPayload {
  id: number;
  username: string;
  nama: string;
  email?: string | null;
  role: string;
  nim?: string | null;
  nidn?: string | null;
  fakultas?: string | null;
  prodi?: string | null;
}

interface SsoSession {
  id: number;
  username: string;
  nama: string;
  email: string | null;
  role: string;
  ssoRole: string;
  /** Cakupan aplikasi penerbit sesi — selalu "lppm" untuk aplikasi ini. */
  app: string;
  appName: string;
  nim: string | null;
  nidn: string | null;
  prodi: string | null;
  fakultas: string | null;
}

interface AuthRequest extends Request {
  user?: SsoSession;
  /** Kunci izin pengguna — selalu dibaca dari database, bukan dari JWT. */
  izin?: Set<string>;
  /** Putusan akses yang sudah dihitung pada middleware authenticate. */
  akses?: AppAccessDecision;
}

/**
 * PEMISAHAN ADMIN PER APLIKASI
 * ---------------------------
 * Setiap aplikasi cabang ONE UNUSU menerbitkan sesinya sendiri. Aplikasi ini
 * hanya boleh menerima peran miliknya; peran admin aplikasi lain (mis. LPM)
 * ditolak walaupun token SSO-nya sah secara global.
 */
const APP_SCOPE = "lppm";
const APP_NAME = "LPPM UNUSU";

/** Peran admin aplikasi cabang lain → label aplikasi pemiliknya (untuk pesan). */
const FOREIGN_APP_ADMIN_ROLES: Record<string, string> = {
  ADMIN_LPM: "LPM UNUSU",
  ADMIN_ESURAT: "E-Surat UNUSU",
  ADMIN_SARPRAS: "Sarpras UNUSU",
  ADMIN_AKREDITASI: "Akreditasi UNUSU",
  ADMIN_LMS: "LMS UNUSU",
  ADMIN_SSO: "ONE UNUSU",
};

// ===========================================================================
// OTORISASI BERBASIS IZIN — SUMBERNYA SSO
//
// Pengguna, peran, dan pemetaan peran -> izin SELURUHNYA dikelola di panel
// ONE UNUSU (`permissions` + `role_permissions`). Aplikasi ini sengaja TIDAK
// menyimpan salinan registri pengguna maupun penugasan peran: salinan seperti
// itu cepat basi dan menciptakan dua sumber kebenaran yang bisa berselisih.
//
// Alur akses:
//   1. Tiket SSO ditukar ke ONE UNUSU. Di sana pengguna sudah ditolak bila
//      tidak memegang `<clientId>:masuk_*`, dan daftar izinnya ikut dikirim.
//   2. Izin itu disimpan di dalam JWT aplikasi ini (umur 7 hari) agar setiap
//      permintaan tidak perlu memanggil ONE UNUSU.
//   3. Setiap permintaan memakai izin dari JWT tersebut.
//
// Konsekuensi yang disengaja: mencabut izin di panel SSO berlaku pada login
// berikutnya, bukan seketika pada token yang sudah terbit.
// ===========================================================================

/** Tingkat izin masuk panel LPPM. */
const KUNCI_IZIN_MASUK = {
  admin: "lppm-unusu:masuk_admin",
  dosen: "lppm-unusu:masuk_dosen",
  reviewer: "lppm-unusu:masuk_reviewer",
  mahasiswa: "lppm-unusu:masuk_mahasiswa",
} as const;

type TingkatMasuk = keyof typeof KUNCI_IZIN_MASUK;

const LABEL_TINGKAT: Record<TingkatMasuk, string> = {
  admin: "Administrator LPPM",
  dosen: "Dosen Peneliti & Pengabdi",
  reviewer: "Reviewer Proposal",
  mahasiswa: "Mahasiswa",
};

/**
 * Izin fitur bawaan per tingkat.
 *
 * Cadangan bila ONE UNUSU belum mengirim daftar izin (versi SSO lama). Ini
 * HANYA menebak izin fitur; izin masuk tetap wajib datang dari SSO — tanpa
 * itu akses ditolak (fail-closed).
 */
const IZIN_FITUR_BAWAAN: Record<TingkatMasuk, string[]> = {
  admin: [
    "penelitian.view", "penelitian.create", "penelitian.edit", "penelitian.delete", "penelitian.review",
    "pengabdian.view", "pengabdian.create", "pengabdian.edit", "pengabdian.delete", "pengabdian.review",
    "publikasi.view", "publikasi.create", "publikasi.edit", "publikasi.delete",
    "monev.view", "monev.create", "monev.manage", "monev.review",
    "roles.view", "permissions.view", "laporan.view", "laporan.export",
  ],
  dosen: [
    "penelitian.view", "penelitian.create",
    "pengabdian.view", "pengabdian.create",
    "publikasi.view", "publikasi.create",
    "monev.view", "laporan.view",
  ],
  reviewer: [
    "penelitian.view", "penelitian.review",
    "pengabdian.view", "pengabdian.review",
    "publikasi.view", "monev.view", "monev.review", "laporan.view",
  ],
  mahasiswa: ["penelitian.view", "pengabdian.view", "publikasi.view", "laporan.view"],
};

/**
 * Susun daftar izin efektif dari kiriman ONE UNUSU.
 *
 * Bila SSO mengirim daftar izin, itulah yang dipakai apa adanya. Bila tidak,
 * izin fitur ditebak dari tingkat masuk — tetapi tingkat itu sendiri hanya
 * dipercaya kalau SSO menyatakan izin masuknya.
 */
const susunIzin = (izinSso: string[] | undefined, tingkat: TingkatMasuk | null): Set<string> => {
  if (Array.isArray(izinSso) && izinSso.length > 0) return new Set(izinSso);
  if (!tingkat) return new Set<string>();
  return new Set([KUNCI_IZIN_MASUK[tingkat], ...IZIN_FITUR_BAWAAN[tingkat]]);
};

/** Tingkat masuk tertinggi yang dimiliki pengguna (null = tidak boleh masuk). */
const tingkatMasukDari = (izin: Iterable<string>): TingkatMasuk | null => {
  const set = izin instanceof Set ? izin : new Set(izin);
  if (set.has(KUNCI_IZIN_MASUK.admin)) return "admin";
  if (set.has(KUNCI_IZIN_MASUK.dosen)) return "dosen";
  if (set.has(KUNCI_IZIN_MASUK.reviewer)) return "reviewer";
  if (set.has(KUNCI_IZIN_MASUK.mahasiswa)) return "mahasiswa";
  return null;
};

export interface AppAccessDecision {
  app: string;
  appName: string;
  allowed: boolean;
  reason: "allowed" | "no_izin_masuk" | "foreign_app_admin" | "missing_role";
  ssoRole: string;
  tingkat: TingkatMasuk | null;
  roleLabel: string;
  isAppAdmin: boolean;
  izin: string[];
  message: string;
}

/**
 * Putusan akses — murni berdasarkan IZIN yang diberikan ONE UNUSU.
 *
 * `ssoRole` hanya dipakai untuk menyusun pesan penolakan, tidak pernah untuk
 * mengizinkan. Karena itu admin aplikasi lain tidak dapat lolos hanya karena
 * namanya mirip.
 */
const putuskanAkses = (ssoRoleRaw: string, izinMentah: string[] | Set<string>): AppAccessDecision => {
  const ssoRole = (ssoRoleRaw || "").toUpperCase();
  const izin = izinMentah instanceof Set ? izinMentah : new Set(izinMentah);
  const tingkat = tingkatMasukDari(izin);

  const dasar = {
    app: APP_SCOPE,
    appName: APP_NAME,
    ssoRole,
    tingkat,
    roleLabel: tingkat ? LABEL_TINGKAT[tingkat] : "Tanpa Izin Masuk",
    isAppAdmin: tingkat === "admin",
    izin: Array.from(izin),
  };

  if (tingkat) {
    return { ...dasar, allowed: true, reason: "allowed", message: `Selamat datang di panel ${APP_NAME}.` };
  }

  const aplikasiLain = FOREIGN_APP_ADMIN_ROLES[ssoRole];
  if (aplikasiLain) {
    return {
      ...dasar,
      allowed: false,
      reason: "foreign_app_admin",
      message: `Akun Anda terdaftar sebagai administrator ${aplikasiLain}, sehingga tidak memiliki izin masuk panel ${APP_NAME}.`,
    };
  }

  return {
    ...dasar,
    allowed: false,
    reason: ssoRole ? "no_izin_masuk" : "missing_role",
    message: ssoRole
      ? `Akun Anda belum diberi izin masuk panel ${APP_NAME}. Minta administrator ONE UNUSU menambahkan izin "${KUNCI_IZIN_MASUK.admin}" atau "${KUNCI_IZIN_MASUK.dosen}" pada peran Anda.`
      : "Token SSO tidak memuat peran. Silakan login ulang melalui Portal ONE UNUSU.",
  };
};

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header && header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Token otentikasi tidak disediakan" });
  }

  let decoded: jwt.JwtPayload;
  try {
    decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  } catch {
    return res.status(401).json({ success: false, message: "Sesi login telah kedaluwarsa" });
  }

  // Tolak token yang diterbitkan untuk aplikasi cabang lain (mis. LPM).
  const tokenApp = typeof decoded.app === "string" ? decoded.app : APP_SCOPE;
  if (tokenApp !== APP_SCOPE) {
    return res.status(403).json({
      success: false,
      code: "FOREIGN_APP_TOKEN",
      app: APP_SCOPE,
      message: `Sesi ini milik aplikasi "${tokenApp}". Panel ${APP_NAME} hanya menerima sesi aplikasi ${APP_SCOPE}.`,
    });
  }

  try {
    const session: SsoSession = {
      id: Number(decoded.id),
      username: String(decoded.username ?? ""),
      nama: String(decoded.nama ?? ""),
      email: typeof decoded.email === "string" ? decoded.email : null,
      role: String(decoded.role ?? "mahasiswa"),
      ssoRole: String(decoded.ssoRole ?? ""),
      app: APP_SCOPE,
      appName: APP_NAME,
      nim: typeof decoded.nim === "string" ? decoded.nim : null,
      nidn: typeof decoded.nidn === "string" ? decoded.nidn : null,
      prodi: typeof decoded.prodi === "string" ? decoded.prodi : null,
      fakultas: typeof decoded.fakultas === "string" ? decoded.fakultas : null,
    };

    // Izin diambil dari JWT yang diterbitkan saat penukaran tiket SSO. Tidak
    // ada salinan registri lokal yang perlu disinkronkan, sehingga tidak ada
    // dua sumber kebenaran yang bisa berselisih.
    const izinJwt = Array.isArray(decoded.izin) ? (decoded.izin as string[]) : [];
    const izin = susunIzin(izinJwt, tingkatMasukDari(izinJwt));
    const akses = putuskanAkses(session.ssoRole, izin);

    // Tanpa izin masuk panel, seluruh API ditolak.
    if (!akses.allowed) {
      return res.status(403).json({
        success: false,
        code: akses.reason === "foreign_app_admin" ? "FOREIGN_APP_ADMIN" : "IZIN_MASUK_DITOLAK",
        app: APP_SCOPE,
        appAccess: akses,
        message: akses.message,
      });
    }

    (req as AuthRequest).user = session;
    (req as AuthRequest).izin = izin;
    (req as AuthRequest).akses = akses;
    next();
  } catch (error: any) {
    console.error("Gagal memverifikasi izin akses:", error?.message);
    return res.status(500).json({ success: false, message: "Gagal memverifikasi izin akses" });
  }
};

/**
 * Mengambil peran dan izin lokal LPPM dari database lokal `lppm_unusu_db`.
 * Mendukung multi-role: seorang pengguna bisa memiliki beberapa peran lokal sekaligus.
 */
async function dapatkanAksesLokalPengguna(
  username: string,
  nama: string,
  ssoRoles: string[]
): Promise<{ roles: string[]; permissions: Set<string>; primaryRole: string }> {
  let userRoles = await prisma.userRole.findMany({
    where: { username },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  // Jika belum terdaftar di tabel lokal `lppm_user_roles`,
  // berikan peran lokal bawaan berdasarkan peran yang dibawa dari SSO:
  if (userRoles.length === 0) {
    let targetRoleCode = "DOSEN";
    if (ssoRoles.includes("SUPERADMIN")) {
      targetRoleCode = "SUPERADMIN";
    } else if (ssoRoles.includes("ADMIN_LPPM")) {
      targetRoleCode = "ADMIN_LPPM";
    }

    const defaultRole = await prisma.role.findUnique({
      where: { kode: targetRoleCode },
    });

    if (defaultRole) {
      await prisma.userRole.create({
        data: {
          username,
          nama: nama || username,
          roleId: defaultRole.id,
        },
      });

      userRoles = await prisma.userRole.findMany({
        where: { username },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      });
    }
  }

  const roleCodes = userRoles.map((ur) => ur.role.kode);
  const permissionSet = new Set<string>();
  for (const ur of userRoles) {
    for (const rp of ur.role.permissions) {
      permissionSet.add(rp.permission.kode);
    }
  }

  // Tambahkan izin kunci masuk agar middleware authenticate tidak menolak sesi
  const isSuperOrAdmin = roleCodes.includes("SUPERADMIN") || roleCodes.includes("ADMIN_LPPM");
  if (isSuperOrAdmin) {
    permissionSet.add(KUNCI_IZIN_MASUK.admin);
  } else if (roleCodes.includes("REVIEWER")) {
    permissionSet.add(KUNCI_IZIN_MASUK.reviewer);
  } else {
    permissionSet.add(KUNCI_IZIN_MASUK.dosen);
  }

  const primaryRole = roleCodes.includes("SUPERADMIN")
    ? "SUPERADMIN"
    : roleCodes.includes("ADMIN_LPPM")
    ? "ADMIN_LPPM"
    : roleCodes.includes("REVIEWER")
    ? "REVIEWER"
    : (roleCodes[0] ?? "DOSEN");

  return { roles: roleCodes, permissions: permissionSet, primaryRole };
}

// Verifikasi token SSO sekali-pakai lalu terbitkan sesi lokal terdesentralisasi
app.post("/api/auth/sso", async (req: Request, res: Response) => {
  try {
    const { client_id, token } = req.body ?? {};

    if (!client_id || !token) {
      return res.status(400).json({ success: false, message: "client_id dan token wajib diisi" });
    }
    if (client_id !== SSO_CLIENT_ID) {
      return res.status(400).json({ success: false, message: "Client ID tidak cocok dengan aplikasi ini" });
    }
    if (!SSO_CLIENT_KEY) {
      return res.status(500).json({ success: false, message: "SSO_CLIENT_KEY belum dikonfigurasi di server" });
    }

    const ssoResponse = await fetch(`${SSO_BASE_URL}/api/v2/website/verify-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: SSO_CLIENT_ID, client_key: SSO_CLIENT_KEY, token }),
    });

    const ssoPayload = (await ssoResponse.json().catch(() => null)) as
      | {
          status?: boolean;
          message?: string;
          data?: {
            user?: SsoUserPayload & { roles?: string[] };
            access?: { allowed?: boolean; tingkat?: string[]; permissions?: string[] };
          };
        }
      | null;
    const ssoUser = ssoPayload?.data?.user;

    if (!ssoResponse.ok || !ssoPayload?.status || !ssoUser) {
      return res.status(401).json({ success: false, message: ssoPayload?.message || "Verifikasi token SSO gagal" });
    }

    const ssoRoles = Array.isArray(ssoUser.roles)
      ? ssoUser.roles
      : ssoUser.role
      ? [ssoUser.role]
      : [];

    // Otorisasi terdesentralisasi: Izin dan peran dibaca dari database lokal LPPM!
    const lokal = await dapatkanAksesLokalPengguna(
      ssoUser.username,
      ssoUser.nama,
      ssoRoles
    );

    const isAppAdmin = lokal.roles.includes("SUPERADMIN") || lokal.roles.includes("ADMIN_LPPM");
    const roleLabel = lokal.roles.includes("SUPERADMIN")
      ? "Super Administrator LPPM"
      : lokal.roles.includes("ADMIN_LPPM")
      ? "Pengelola LPPM UNUSU"
      : lokal.roles.includes("REVIEWER")
      ? "Reviewer Riset"
      : "Dosen Peneliti";

    const akses: AppAccessDecision = {
      app: APP_SCOPE,
      appName: APP_NAME,
      allowed: true,
      reason: "allowed",
      ssoRole: ssoUser.role,
      tingkat: isAppAdmin ? "admin" : "dosen",
      roleLabel,
      isAppAdmin,
      izin: Array.from(lokal.permissions),
      message: `Selamat datang di panel ${APP_NAME}.`,
    };

    const sessionUser: SsoSession = {
      id: ssoUser.id,
      username: ssoUser.username,
      nama: ssoUser.nama,
      email: ssoUser.email ?? null,
      role: lokal.primaryRole,
      ssoRole: ssoUser.role,
      app: APP_SCOPE,
      appName: APP_NAME,
      nim: ssoUser.nim ?? null,
      nidn: ssoUser.nidn ?? null,
      prodi: ssoUser.prodi ?? null,
      fakultas: ssoUser.fakultas ?? null,
    };

    // Izin lokal LPPM disertakan di dalam JWT aplikasi lokal
    const tokenJwt = jwt.sign(
      {
        ...sessionUser,
        izin: akses.izin,
        roles: lokal.roles,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token: tokenJwt,
      user: sessionUser,
      roles: lokal.roles,
      appAccess: akses,
      izin: akses.izin,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal memproses SSO: " + error?.message });
  }
});

// Seluruh API di bawah ini wajib membawa JWT sesi lokal (hasil SSO).
app.use("/api", authenticate);
// Jejak audit: catat setiap mutasi sukses ke tabel append-only lppm_audit_log.
app.use("/api", createAuditLogger(prisma));

/**
 * Info sesi + cakupan aplikasi. Dipakai klien untuk memvalidasi ulang hak akses
 * (mis. setelah peran pengguna diubah di ONE UNUSU) sebelum merender panel.
 */
app.get("/api/auth/session", (req: Request, res: Response) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    return res.status(401).json({ success: false, message: "Sesi tidak ditemukan" });
  }

  const izin = (req as AuthRequest).izin ?? new Set<string>();
  const akses = (req as AuthRequest).akses ?? putuskanAkses(user.ssoRole, izin);

  res.json({
    success: true,
    data: {
      ...user,
      app: APP_SCOPE,
      appName: APP_NAME,
      appAccess: akses,
      // Kompatibilitas: klien lama membaca `isAdmin` dan `permissions`.
      isAdmin: akses.isAppAdmin,
      canManageSystem: akses.isAppAdmin,
      tingkat: akses.tingkat,
      izin: akses.izin,
      permissions: akses.izin,
    },
  });
});

/**
 * Middleware otorisasi berbasis IZIN.
 *
 * `requirePermission("penelitian.create")` menolak permintaan yang tidak
 * memuat kunci izin tersebut — tidak pernah membandingkan nama peran.
 */
const requirePermission = (...kunci: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const izin = (req as AuthRequest).izin;
    if (!izin) {
      return res.status(401).json({ success: false, message: "Sesi tidak valid" });
    }
    const kurang = kunci.filter((k) => !izin.has(k));
    if (kurang.length > 0) {
      return res.status(403).json({
        success: false,
        code: "IZIN_KURANG",
        message: "Akses ditolak. Anda tidak memiliki izin untuk operasi ini.",
        dibutuhkan: kurang,
      });
    }
    next();
  };

const requireAnyPermission = (...kunci: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const izin = (req as AuthRequest).izin;
    if (!izin) {
      return res.status(401).json({ success: false, message: "Sesi tidak valid" });
    }
    const hasAny = kunci.some((k) => izin.has(k));
    if (!hasAny) {
      return res.status(403).json({
        success: false,
        code: "IZIN_KURANG",
        message: "Akses ditolak. Anda tidak memiliki izin untuk operasi ini.",
        dibutuhkan: kunci,
      });
    }
    next();
  };

// 1. Penelitian
app.get("/api/penelitian", requirePermission("penelitian.view"), async (req: Request, res: Response) => {
  try {
    const parsed = queryListSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Parameter filter tidak valid",
        errors: parsed.error.issues,
      });
    }

    const { page, limit, search, tahun, status, sort } = parsed.data;

    // Filter memakai kolom ber-index: tahun+status, bidangFokus, nidn.
    const where: any = {};
    if (tahun) where.tahun = tahun;
    if (status && status !== "SEMUA") where.status = status;
    if (search) {
      where.OR = [
        { judul: { contains: search } },
        { ketua: { contains: search } },
        { nidn: { contains: search } },
        { bidangFokus: { contains: search } },
      ];
    }

    const orderBy = resolveOrder(sort);
    const pagination = resolvePagination(parsed.data);

    // Tanpa ?limit -> perilaku lama (seluruh data) agar tabel client tetap kompatibel.
    if (!pagination) {
      const list = await prisma.penelitian.findMany({ where, orderBy });
      return res.json({ success: true, data: list });
    }

    const [total, data] = await prisma.$transaction([
      prisma.penelitian.count({ where }),
      prisma.penelitian.findMany({ where, orderBy, ...pagination }),
    ]);

    res.json({
      success: true,
      data,
      pagination: buildPaginationMeta(page, pagination.take, total),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data penelitian" });
  }
});

app.get("/api/penelitian/:id", requirePermission("penelitian.view"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const item = await prisma.penelitian.findUnique({
      where: { id }
    });
    if (!item) return res.status(404).json({ success: false, message: "Penelitian tidak ditemukan" });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data penelitian" });
  }
});

app.post("/api/penelitian", requirePermission("penelitian.create"), async (req: Request, res: Response) => {
  try {
    const { judul, ketua, nidn, anggota, bidangFokus, danaDisetujui, sumberDana, tahun, status } = req.body;
    const item = await prisma.penelitian.create({
      data: {
        judul,
        ketua,
        nidn,
        anggota,
        bidangFokus: bidangFokus || "Teknologi Informasi",
        danaDisetujui: danaDisetujui ? Number(danaDisetujui) : null,
        sumberDana: sumberDana || "Internal UNUSU",
        tahun: Number(tahun) || new Date().getFullYear(),
        status: status || "Disetujui",
      }
    });
    res.json({ success: true, data: item, message: "Proposal penelitian berhasil diajukan" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengajukan penelitian" });
  }
});

app.put("/api/penelitian/:id", requirePermission("penelitian.edit"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { judul, ketua, nidn, anggota, bidangFokus, danaDisetujui, sumberDana, tahun, status } = req.body;
    const item = await prisma.penelitian.update({
      where: { id },
      data: {
        judul,
        ketua,
        nidn,
        anggota,
        bidangFokus,
        danaDisetujui: danaDisetujui ? Number(danaDisetujui) : null,
        sumberDana,
        tahun: Number(tahun),
        status,
      }
    });
    res.json({ success: true, data: item, message: "Data penelitian berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memperbarui data penelitian" });
  }
});

app.delete("/api/penelitian/:id", requirePermission("penelitian.delete"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.penelitian.delete({ where: { id } });
    res.json({ success: true, message: "Data penelitian berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus data penelitian" });
  }
});

// 2. Pengabdian (PKM)
app.get("/api/pengabdian", requirePermission("pengabdian.view"), async (req: Request, res: Response) => {
  try {
    const parsed = queryListSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Parameter filter tidak valid",
        errors: parsed.error.issues,
      });
    }

    const { page, limit, search, tahun, status, sort } = parsed.data;

    // Filter memakai kolom ber-index: tahun+status, mitra, nidn.
    const where: any = {};
    if (tahun) where.tahun = tahun;
    if (status && status !== "SEMUA") where.status = status;
    if (search) {
      where.OR = [
        { judul: { contains: search } },
        { ketua: { contains: search } },
        { nidn: { contains: search } },
        { mitra: { contains: search } },
        { lokasi: { contains: search } },
      ];
    }

    const orderBy = resolveOrder(sort);
    const pagination = resolvePagination(parsed.data);

    if (!pagination) {
      const list = await prisma.pengabdian.findMany({ where, orderBy });
      return res.json({ success: true, data: list });
    }

    const [total, data] = await prisma.$transaction([
      prisma.pengabdian.count({ where }),
      prisma.pengabdian.findMany({ where, orderBy, ...pagination }),
    ]);

    res.json({
      success: true,
      data,
      pagination: buildPaginationMeta(page, pagination.take, total),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data pengabdian" });
  }
});

app.get("/api/pengabdian/:id", requirePermission("pengabdian.view"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const item = await prisma.pengabdian.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ success: false, message: "Pengabdian tidak ditemukan" });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil detail pengabdian" });
  }
});

app.post("/api/pengabdian", requirePermission("pengabdian.create"), async (req: Request, res: Response) => {
  try {
    const { judul, ketua, nidn, anggota, mitra, lokasi, danaDisetujui, tahun, status } = req.body;
    const item = await prisma.pengabdian.create({
      data: {
        judul,
        ketua,
        nidn,
        anggota,
        mitra,
        lokasi,
        danaDisetujui: danaDisetujui ? Number(danaDisetujui) : null,
        tahun: Number(tahun) || new Date().getFullYear(),
        status: status || "Disetujui",
      }
    });
    res.json({ success: true, data: item, message: "Kegiatan pengabdian berhasil dicatat" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mencatat pengabdian" });
  }
});

app.put("/api/pengabdian/:id", requirePermission("pengabdian.edit"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { judul, ketua, nidn, anggota, mitra, lokasi, danaDisetujui, tahun, status } = req.body;
    const item = await prisma.pengabdian.update({
      where: { id },
      data: {
        judul,
        ketua,
        nidn,
        anggota,
        mitra,
        lokasi,
        danaDisetujui: danaDisetujui ? Number(danaDisetujui) : null,
        tahun: Number(tahun),
        status,
      }
    });
    res.json({ success: true, data: item, message: "Data pengabdian berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memperbarui pengabdian" });
  }
});

app.delete("/api/pengabdian/:id", requirePermission("pengabdian.delete"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.pengabdian.delete({ where: { id } });
    res.json({ success: true, message: "Data pengabdian berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus pengabdian" });
  }
});

// 3. Publikasi Jurnal
app.get("/api/publikasi", requirePermission("publikasi.view"), async (req: Request, res: Response) => {
  try {
    const parsed = queryListSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Parameter filter tidak valid",
        errors: parsed.error.issues,
      });
    }

    const { page, limit, search, tahun, sort } = parsed.data;

    // Filter memakai kolom ber-index: tahun, jenis+tahun, penulis.
    const where: any = {};
    if (tahun) where.tahun = tahun;
    if (search) {
      where.OR = [
        { judul: { contains: search } },
        { penulis: { contains: search } },
        { namaJurnal: { contains: search } },
        { jenis: { contains: search } },
      ];
    }

    // Urutan utama publikasi adalah tahun terbit (bukan createdAt),
    // dengan `id` sebagai tie-breaker agar pagination stabil.
    // Setiap kunci WAJIB menjadi elemen array tersendiri — Prisma menolak
    // dua kunci dalam satu objek ("Expected <Model>OrderByWithRelationInput").
    const direction: "asc" | "desc" = sort === "terlama" ? "asc" : "desc";
    const orderBy = [{ tahun: direction }, { id: direction }];
    const pagination = resolvePagination(parsed.data);

    if (!pagination) {
      const list = await prisma.publikasi.findMany({ where, orderBy });
      return res.json({ success: true, data: list });
    }

    const [total, data] = await prisma.$transaction([
      prisma.publikasi.count({ where }),
      prisma.publikasi.findMany({ where, orderBy, ...pagination }),
    ]);

    res.json({
      success: true,
      data,
      pagination: buildPaginationMeta(page, pagination.take, total),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data publikasi" });
  }
});

app.get("/api/publikasi/:id", requirePermission("publikasi.view"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const item = await prisma.publikasi.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ success: false, message: "Publikasi tidak ditemukan" });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil detail publikasi" });
  }
});

app.post("/api/publikasi", requirePermission("publikasi.create"), async (req: Request, res: Response) => {
  try {
    const { judul, penulis, jenis, namaJurnal, volumeIssue, tahun, doiUrl, sintaScore } = req.body;
    const item = await prisma.publikasi.create({
      data: {
        judul,
        penulis,
        jenis: jenis || "Jurnal Nasional",
        namaJurnal,
        volumeIssue,
        tahun: Number(tahun) || new Date().getFullYear(),
        doiUrl,
        sintaScore: sintaScore || "SINTA 3",
      }
    });
    res.json({ success: true, data: item, message: "Publikasi jurnal berhasil dicatat" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mencatat publikasi" });
  }
});

app.put("/api/publikasi/:id", requirePermission("publikasi.edit"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { judul, penulis, jenis, namaJurnal, volumeIssue, tahun, doiUrl, sintaScore } = req.body;
    const item = await prisma.publikasi.update({
      where: { id },
      data: {
        judul,
        penulis,
        jenis,
        namaJurnal,
        volumeIssue,
        tahun: Number(tahun),
        doiUrl,
        sintaScore,
      }
    });
    res.json({ success: true, data: item, message: "Data publikasi berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal memperbarui publikasi" });
  }
});

app.delete("/api/publikasi/:id", requirePermission("publikasi.delete"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.publikasi.delete({ where: { id } });
    res.json({ success: true, message: "Data publikasi berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus publikasi" });
  }
});

// 4. Role & Permission Management
app.get("/api/roles", requirePermission("roles.view"), async (req: Request, res: Response) => {
  try {
    const list = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data peran" });
  }
});

app.post("/api/roles", requirePermission("roles.manage"), async (req: Request, res: Response) => {
  try {
    const { kode, nama, deskripsi, permissionIds } = req.body;
    if (!kode || !nama) {
      return res.status(400).json({ success: false, message: "Kode dan Nama peran wajib diisi" });
    }

    const role = await prisma.role.create({
      data: {
        kode: kode.trim().toUpperCase(),
        nama: nama.trim(),
        deskripsi: deskripsi?.trim() || null,
        permissions: Array.isArray(permissionIds) && permissionIds.length > 0
          ? {
              create: permissionIds.map((pId: number) => ({
                permissionId: Number(pId),
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    res.json({ success: true, data: role, message: "Peran berhasil ditambahkan" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal menambahkan peran: " + (error?.message || "") });
  }
});

app.put("/api/roles/:id", requirePermission("roles.manage"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { nama, deskripsi, permissionIds } = req.body;

    // Update data peran dasar
    await prisma.role.update({
      where: { id },
      data: {
        nama: nama?.trim(),
        deskripsi: deskripsi?.trim() || null,
      },
    });

    // Jika permissionIds disertakan, sinkronkan
    if (Array.isArray(permissionIds)) {
      await prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((pId: number) => ({
            roleId: id,
            permissionId: Number(pId),
          })),
        });
      }
    }

    const updated = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    res.json({ success: true, data: updated, message: "Peran berhasil diperbarui" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal memperbarui peran: " + (error?.message || "") });
  }
});

app.delete("/api/roles/:id", requirePermission("roles.manage"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return res.status(404).json({ success: false, message: "Peran tidak ditemukan" });
    }
    if (role.kode === "SUPERADMIN") {
      return res.status(400).json({ success: false, message: "Peran SUPERADMIN tidak dapat dihapus demi integritas sistem" });
    }

    await prisma.role.delete({ where: { id } });
    res.json({ success: true, message: "Peran berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus peran" });
  }
});

// Permissions API
app.get("/api/permissions", requirePermission("permissions.view"), async (req: Request, res: Response) => {
  try {
    const list = await prisma.permission.findMany({
      orderBy: [{ modul: "asc" }, { kode: "asc" }],
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data izin" });
  }
});

app.post("/api/permissions", requirePermission("permissions.manage"), async (req: Request, res: Response) => {
  try {
    const { kode, nama, modul, deskripsi } = req.body;
    if (!kode || !nama || !modul) {
      return res.status(400).json({ success: false, message: "Kode, nama, dan modul wajib diisi" });
    }

    const perm = await prisma.permission.create({
      data: {
        kode: kode.trim().toLowerCase(),
        nama: nama.trim(),
        modul: modul.trim(),
        deskripsi: deskripsi?.trim() || null,
      },
    });

    res.json({ success: true, data: perm, message: "Hak izin berhasil ditambahkan" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal menambahkan izin: " + (error?.message || "") });
  }
});

app.put("/api/permissions/:id", requirePermission("permissions.manage"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { nama, modul, deskripsi } = req.body;

    const perm = await prisma.permission.update({
      where: { id },
      data: {
        nama: nama?.trim(),
        modul: modul?.trim(),
        deskripsi: deskripsi?.trim() || null,
      },
    });

    res.json({ success: true, data: perm, message: "Hak izin berhasil diperbarui" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal memperbarui izin: " + (error?.message || "") });
  }
});

app.delete("/api/permissions/:id", requirePermission("permissions.manage"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.permission.delete({ where: { id } });
    res.json({ success: true, message: "Hak izin berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus izin" });
  }
});

// 4b. Manajemen Penugasan Pengguna Lokal LPPM (Multi-Role)
app.get("/api/users", requireAnyPermission("users.view", "roles.view"), async (req: Request, res: Response) => {
  try {
    const userRoleRows = await prisma.userRole.findMany({
      include: {
        role: {
          select: {
            id: true,
            kode: true,
            nama: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Kelompokkan per username
    const userMap = new Map<
      string,
      {
        username: string;
        nama: string;
        roles: { id: number; kode: string; nama: string }[];
        roleIds: number[];
        createdAt: Date;
      }
    >();

    for (const row of userRoleRows) {
      if (!userMap.has(row.username)) {
        userMap.set(row.username, {
          username: row.username,
          nama: row.nama,
          roles: [],
          roleIds: [],
          createdAt: row.createdAt,
        });
      }
      const item = userMap.get(row.username)!;
      item.roles.push(row.role);
      item.roleIds.push(row.role.id);
    }

    res.json({ success: true, data: Array.from(userMap.values()) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal mengambil daftar pengguna: " + error?.message });
  }
});

app.post("/api/users", requireAnyPermission("users.manage", "roles.manage"), async (req: Request, res: Response) => {
  try {
    const { username, nama, roleIds } = req.body ?? {};

    if (!username || typeof username !== "string" || !username.trim()) {
      return res.status(400).json({ success: false, message: "Username / NIDN wajib diisi" });
    }
    if (!nama || typeof nama !== "string" || !nama.trim()) {
      return res.status(400).json({ success: false, message: "Nama lengkap wajib diisi" });
    }

    const trimmedUsername = username.trim();
    const trimmedNama = nama.trim();

    const ids: number[] = Array.isArray(roleIds)
      ? roleIds.map((n: unknown) => Number(n)).filter((n: number) => Number.isInteger(n) && n > 0)
      : [];

    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: "Pilih minimal satu peran untuk pengguna" });
    }

    // Pastikan peran valid
    const validRoles = await prisma.role.findMany({
      where: { id: { in: ids } },
      select: { id: true, kode: true, nama: true },
    });
    if (validRoles.length === 0) {
      return res.status(400).json({ success: false, message: "Peran yang dipilih tidak valid" });
    }

    // Simpan penugasan
    await prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { username: trimmedUsername } });
      await tx.userRole.createMany({
        data: validRoles.map((r) => ({
          username: trimmedUsername,
          nama: trimmedNama,
          roleId: r.id,
        })),
      });
    });

    res.json({
      success: true,
      message: `Peran untuk ${trimmedNama} berhasil disimpan`,
      data: { username: trimmedUsername, nama: trimmedNama, roles: validRoles },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal menambahkan penugasan peran: " + error?.message });
  }
});

app.put("/api/users/:username", requireAnyPermission("users.manage", "roles.manage"), async (req: Request, res: Response) => {
  try {
    const username = req.params.username?.trim();
    if (!username) {
      return res.status(400).json({ success: false, message: "Username tidak valid" });
    }

    const { roleIds } = req.body ?? {};
    const ids: number[] = Array.isArray(roleIds)
      ? roleIds.map((n: unknown) => Number(n)).filter((n: number) => Number.isInteger(n) && n > 0)
      : [];

    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: "Pengguna harus memiliki minimal satu peran" });
    }

    const validRoles = await prisma.role.findMany({
      where: { id: { in: ids } },
      select: { id: true, kode: true, nama: true },
    });
    if (validRoles.length === 0) {
      return res.status(400).json({ success: false, message: "Peran yang dipilih tidak valid" });
    }

    // Ambil nama eksisting di database lokal
    const existing = await prisma.userRole.findMany({
      where: { username },
      include: { role: true },
    });
    const targetNama = existing[0]?.nama || username;
    const isTargetSuperadmin =
      existing.some((r) => r.role.kode === "SUPERADMIN") ||
      username.toLowerCase() === "superadmin" ||
      username.toLowerCase() === "admin";

    // Guard: Role SUPERADMIN tidak boleh dilepas jika target adalah superadmin
    if (isTargetSuperadmin) {
      const superRole = await prisma.role.findUnique({ where: { kode: "SUPERADMIN" } });
      if (superRole && !validRoles.some((r) => r.id === superRole.id)) {
        validRoles.push(superRole);
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { username } });
      await tx.userRole.createMany({
        data: validRoles.map((r) => ({
          username,
          nama: targetNama,
          roleId: r.id,
        })),
      });
    });

    res.json({
      success: true,
      message: `Penugasan peran untuk ${targetNama} berhasil diperbarui`,
      data: { username, nama: targetNama, roles: validRoles },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal memperbarui penugasan peran: " + error?.message });
  }
});

app.delete("/api/users/:username", requireAnyPermission("users.manage", "roles.manage"), async (req: Request, res: Response) => {
  try {
    const username = req.params.username?.trim();
    if (!username) {
      return res.status(400).json({ success: false, message: "Username tidak valid" });
    }

    await prisma.userRole.deleteMany({ where: { username } });
    res.json({ success: true, message: `Penugasan peran untuk ${username} berhasil dihapus dari LPPM` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal menghapus pengguna: " + error?.message });
  }
});

// 4b. Audit Trail (append-only) — hanya admin
app.get("/api/audit-log", requirePermission("roles.manage"), async (req: Request, res: Response) => {
  try {
    const parsed = queryAuditSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Parameter filter audit tidak valid",
        errors: parsed.error.issues,
      });
    }

    const { page, limit, entitas, aksi, aktor, search, dari, sampai } = parsed.data;

    const where: any = {};
    if (entitas && entitas !== "SEMUA") where.entitas = entitas;
    if (aksi) where.aksi = aksi;

    if (dari || sampai) {
      where.createdAt = {
        ...(dari ? { gte: new Date(`${dari}T00:00:00.000Z`) } : {}),
        ...(sampai ? { lte: new Date(`${sampai}T23:59:59.999Z`) } : {}),
      };
    }

    // Filter aktor & pencarian bebas digabung AND agar tidak saling menimpa.
    const andConditions: any[] = [];
    if (aktor) {
      andConditions.push({
        OR: [{ aktorNidn: { contains: aktor } }, { aktorNama: { contains: aktor } }],
      });
    }
    if (search) {
      andConditions.push({
        OR: [
          { path: { contains: search } },
          { entitas: { contains: search } },
          { ringkasan: { contains: search } },
        ],
      });
    }
    if (andConditions.length > 0) where.AND = andConditions;

    const [total, data] = await prisma.$transaction([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.json({
      success: true,
      data,
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil jejak audit" });
  }
});

// 5. Monitoring & Evaluasi (Monev) API
app.get("/api/monev", requirePermission("monev.view"), async (req: Request, res: Response) => {
  try {
    const parseQuery = queryMonevSchema.safeParse(req.query);
    if (!parseQuery.success) {
      return res.status(400).json({
        success: false,
        message: "Parameter filter tidak valid",
        errors: parseQuery.error.issues,
      });
    }

    const { page, limit, search, status, jenisProgram, tahap, tahun } = parseQuery.data;

    // Filter dikelompokkan dengan AND eksplisit. Sebelumnya `tahun` di-OR-kan
    // dengan blok pencarian sehingga hasil bisa lolos walau tahun tidak cocok.
    const where: any = {};
    const andConditions: any[] = [];

    if (status && status !== 'SEMUA') {
      where.status = status;
    }
    if (jenisProgram && jenisProgram !== 'SEMUA') {
      where.jenisProgram = jenisProgram;
    }
    if (tahap && tahap !== 'SEMUA') {
      where.tahap = tahap;
    }
    if (search) {
      andConditions.push({
        OR: [
          { kodeMonev: { contains: search } },
          { namaReviewer: { contains: search } },
          { targetLuaranWajib: { contains: search } },
          { catatanReviewer: { contains: search } },
          { penelitian: { judul: { contains: search } } },
          { pengabdian: { judul: { contains: search } } },
        ],
      });
    }
    if (tahun) {
      // Tahun ada di tabel induk (relasi polimorfik), bukan di tabel monev.
      andConditions.push({
        OR: [{ penelitian: { tahun } }, { pengabdian: { tahun } }],
      });
    }
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const total = await prisma.monitoringEvaluasi.count({ where });
    const data = await prisma.monitoringEvaluasi.findMany({
      where,
      include: {
        penelitian: {
          select: { id: true, judul: true, ketua: true, nidn: true, tahun: true }
        },
        pengabdian: {
          select: { id: true, judul: true, ketua: true, nidn: true, mitra: true, tahun: true }
        }
      },
      // `id` sebagai tie-breaker agar offset pagination tidak menggeser baris
      // ketika beberapa record memiliki createdAt identik.
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    });

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal mengambil data monitoring evaluasi: " + (error?.message || "") });
  }
});

app.get("/api/monev/:id", requirePermission("monev.view"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const item = await prisma.monitoringEvaluasi.findUnique({
      where: { id },
      include: {
        penelitian: true,
        pengabdian: true,
      }
    });
    if (!item) {
      return res.status(404).json({ success: false, message: "Data monitoring evaluasi tidak ditemukan" });
    }
    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal mengambil detail Monev: " + (error?.message || "") });
  }
});

app.post("/api/monev", requirePermission("monev.create"), async (req: Request, res: Response) => {
  try {
    const parseResult = createMonevSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errMsg = parseResult.error.issues.map((i) => i.message).join(", ");
      return res.status(400).json({
        success: false,
        message: errMsg || "Data Monev tidak valid",
        errors: parseResult.error.issues,
      });
    }

    const {
      kodeMonev,
      jenisProgram,
      tahap,
      status,
      rekomendasi,
      penelitianId,
      pengabdianId,
      namaReviewer,
      nidnReviewer,
      tanggalJadwal,
      tanggalMonev,
      lokasiMonev,
      persentaseKemajuan,
      persentaseDanaTerpakai,
      skorSubstansi,
      targetLuaranWajib,
      capaianLuaran,
      catatanReviewer,
      tindakLanjut,
      beritaAcaraUrl,
      buktiDokumentasiUrl,
    } = parseResult.data;

    const autoKode = kodeMonev || `MNV-${jenisProgram === 'PENGABDIAN' ? 'PKM' : 'PEN'}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const item = await prisma.monitoringEvaluasi.create({
      data: {
        kodeMonev: autoKode,
        jenisProgram: jenisProgram || "PENELITIAN",
        tahap: tahap || "MONEV_ANTARA",
        status: status || "DIJADWALKAN",
        rekomendasi: rekomendasi || "LANJUT_PENUH",
        penelitianId: penelitianId ? Number(penelitianId) : null,
        pengabdianId: pengabdianId ? Number(pengabdianId) : null,
        namaReviewer: namaReviewer || "Reviewer LPPM UNUSU",
        nidnReviewer: nidnReviewer || null,
        tanggalJadwal: new Date(tanggalJadwal),
        tanggalMonev: tanggalMonev ? new Date(tanggalMonev) : null,
        lokasiMonev: lokasiMonev || "Ruang Sidang LPPM UNUSU",
        persentaseKemajuan: Number(persentaseKemajuan || 0),
        persentaseDanaTerpakai: Number(persentaseDanaTerpakai || 0),
        skorSubstansi: skorSubstansi !== undefined && skorSubstansi !== null ? Number(skorSubstansi) : null,
        targetLuaranWajib: targetLuaranWajib || null,
        capaianLuaran: capaianLuaran || null,
        catatanReviewer: catatanReviewer || null,
        tindakLanjut: tindakLanjut || null,
        beritaAcaraUrl: beritaAcaraUrl || null,
        buktiDokumentasiUrl: buktiDokumentasiUrl || null,
      },
      include: {
        penelitian: true,
        pengabdian: true,
      }
    });

    res.status(201).json({ success: true, data: item, message: "Agenda monitoring & evaluasi berhasil dibuat" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal membuat agenda Monev: " + (error?.message || "") });
  }
});

app.put("/api/monev/:id", requirePermission("monev.manage"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "ID monitoring evaluasi tidak valid" });
    }

    const parseResult = updateMonevSchema.safeParse(req.body);
    if (!parseResult.success) {
      const errMsg = parseResult.error.issues.map((i) => i.message).join(", ");
      return res.status(400).json({
        success: false,
        message: errMsg || "Data pembaharuan Monev tidak valid",
        errors: parseResult.error.issues,
      });
    }

    const {
      jenisProgram,
      tahap,
      status,
      rekomendasi,
      penelitianId,
      pengabdianId,
      namaReviewer,
      nidnReviewer,
      tanggalJadwal,
      tanggalMonev,
      lokasiMonev,
      persentaseKemajuan,
      persentaseDanaTerpakai,
      skorSubstansi,
      targetLuaranWajib,
      capaianLuaran,
      catatanReviewer,
      tindakLanjut,
      beritaAcaraUrl,
      buktiDokumentasiUrl,
    } = parseResult.data;

    const item = await prisma.monitoringEvaluasi.update({
      where: { id },
      data: {
        ...(jenisProgram && { jenisProgram }),
        ...(tahap && { tahap }),
        ...(status && { status }),
        ...(rekomendasi !== undefined && { rekomendasi }),
        ...(penelitianId !== undefined && { penelitianId: penelitianId ? Number(penelitianId) : null }),
        ...(pengabdianId !== undefined && { pengabdianId: pengabdianId ? Number(pengabdianId) : null }),
        ...(namaReviewer && { namaReviewer }),
        ...(nidnReviewer !== undefined && { nidnReviewer }),
        ...(tanggalJadwal && { tanggalJadwal: new Date(tanggalJadwal) }),
        ...(tanggalMonev !== undefined && { tanggalMonev: tanggalMonev ? new Date(tanggalMonev) : null }),
        ...(lokasiMonev !== undefined && { lokasiMonev }),
        ...(persentaseKemajuan !== undefined && { persentaseKemajuan: Number(persentaseKemajuan) }),
        ...(persentaseDanaTerpakai !== undefined && { persentaseDanaTerpakai: Number(persentaseDanaTerpakai) }),
        ...(skorSubstansi !== undefined && { skorSubstansi: skorSubstansi !== null ? Number(skorSubstansi) : null }),
        ...(targetLuaranWajib !== undefined && { targetLuaranWajib }),
        ...(capaianLuaran !== undefined && { capaianLuaran }),
        ...(catatanReviewer !== undefined && { catatanReviewer }),
        ...(tindakLanjut !== undefined && { tindakLanjut }),
        ...(beritaAcaraUrl !== undefined && { beritaAcaraUrl }),
        ...(buktiDokumentasiUrl !== undefined && { buktiDokumentasiUrl }),
      },
      include: {
        penelitian: true,
        pengabdian: true,
      }
    });

    res.json({ success: true, data: item, message: "Evaluasi Monev berhasil diperbarui" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal memperbarui Monev: " + (error?.message || "") });
  }
});

app.delete("/api/monev/:id", requirePermission("monev.manage"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "ID monitoring evaluasi tidak valid" });
    }
    const existing = await prisma.monitoringEvaluasi.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Data monitoring evaluasi tidak ditemukan" });
    }
    await prisma.monitoringEvaluasi.delete({ where: { id } });
    res.json({ success: true, message: `Data monev ${existing.kodeMonev} berhasil dihapus` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal menghapus Monev: " + (error?.message || "") });
  }
});

// 6. Dashboard — satu endpoint agregasi untuk seluruh laporan & daftar terbaru.
//    Semua angka dihitung server (count / aggregate / groupBy) agar klien tidak
//    perlu menarik seluruh tabel hanya untuk menampilkan ringkasan.
const TAHUN_TERAKHIR = 5;

app.get("/api/dashboard/stats", async (req: Request, res: Response) => {
  try {
    const tahunBerjalan = new Date().getFullYear();
    const tahunAwal = tahunBerjalan - (TAHUN_TERAKHIR - 1);
    const batasTanggal = new Date();
    batasTanggal.setDate(batasTanggal.getDate() + 30);

    const [
      totalPenelitian,
      totalPengabdian,
      totalPublikasi,
      totalMonev,
      danaPenelitian,
      danaPengabdian,
      statusPenelitianRaw,
      bidangFokusRaw,
      sumberDanaRaw,
      statusPengabdianRaw,
      mitraRaw,
      jenisPublikasiRaw,
      sintaRaw,
      publikasiTahunRaw,
      statusMonevRaw,
      monevProgres,
      monevJadwalMendatang,
      recentPenelitian,
      recentPublikasi,
    ] = await Promise.all([
      prisma.penelitian.count(),
      prisma.pengabdian.count(),
      prisma.publikasi.count(),
      prisma.monitoringEvaluasi.count(),
      prisma.penelitian.aggregate({
        _sum: { danaDisetujui: true },
        where: { danaDisetujui: { not: null } },
      }),
      prisma.pengabdian.aggregate({
        _sum: { danaDisetujui: true },
        where: { danaDisetujui: { not: null } },
      }),
      prisma.penelitian.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.penelitian.groupBy({ by: ["bidangFokus"], _count: { _all: true } }),
      prisma.penelitian.groupBy({ by: ["sumberDana"], _count: { _all: true } }),
      prisma.pengabdian.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.pengabdian.groupBy({ by: ["mitra"], _count: { _all: true } }),
      prisma.publikasi.groupBy({ by: ["jenis"], _count: { _all: true } }),
      prisma.publikasi.groupBy({ by: ["sintaScore"], _count: { _all: true } }),
      Promise.all(
        Array.from({ length: TAHUN_TERAKHIR }, (_, i) => tahunAwal + i).map(async (tahun) => {
          const [penelitian, pengabdian, publikasi] = await Promise.all([
            prisma.penelitian.count({ where: { tahun } }),
            prisma.pengabdian.count({ where: { tahun } }),
            prisma.publikasi.count({ where: { tahun } }),
          ]);
          return { tahun, penelitian, pengabdian, publikasi };
        }),
      ),
      prisma.monitoringEvaluasi.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.monitoringEvaluasi.aggregate({
        _avg: { persentaseKemajuan: true, persentaseDanaTerpakai: true },
        _count: { _all: true },
      }),
      prisma.monitoringEvaluasi.count({
        where: {
          tanggalJadwal: { gte: new Date(), lte: batasTanggal },
          status: { in: ["DIJADWALKAN", "SEDANG_DITELAAH"] },
        },
      }),
      prisma.penelitian.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 5,
        select: {
          id: true,
          judul: true,
          ketua: true,
          bidangFokus: true,
          tahun: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.publikasi.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 5,
        select: {
          id: true,
          judul: true,
          penulis: true,
          jenis: true,
          namaJurnal: true,
          tahun: true,
          sintaScore: true,
          createdAt: true,
        },
      }),
    ]);

    const keKelompok = <T extends { _count: { _all: number } }>(
      rows: T[],
      ambilLabel: (row: T) => string | null | undefined,
    ) =>
      rows
        .map((row) => ({ label: (ambilLabel(row) || "Lainnya").toString().trim() || "Lainnya", value: row._count._all }))
        .sort((a, b) => b.value - a.value);

    const danaDisetujui =
      Number(danaPenelitian._sum.danaDisetujui ?? 0) + Number(danaPengabdian._sum.danaDisetujui ?? 0);

    res.json({
      success: true,
      data: {
        /** Waktu agregasi dihitung — dipakai klien untuk label "diperbarui". */
        diperbaruiPada: new Date().toISOString(),
        ringkasan: {
          totalPenelitian,
          totalPengabdian,
          totalPublikasi,
          totalMonev,
          totalKegiatan: totalPenelitian + totalPengabdian,
          danaDisetujui,
          monevJadwalMendatang,
          monevRataKemajuan: Math.round(monevProgres._avg.persentaseKemajuan ?? 0),
          monevRataSerapanDana: Math.round(monevProgres._avg.persentaseDanaTerpakai ?? 0),
          monevDinilai: monevProgres._count._all,
        },
        statusPenelitian: keKelompok(statusPenelitianRaw, (r) => r.status),
        bidangFokus: keKelompok(bidangFokusRaw, (r) => r.bidangFokus).slice(0, 6),
        sumberDana: keKelompok(sumberDanaRaw, (r) => r.sumberDana),
        statusPengabdian: keKelompok(statusPengabdianRaw, (r) => r.status),
        mitraPengabdian: keKelompok(mitraRaw, (r) => r.mitra).slice(0, 6),
        jenisPublikasi: keKelompok(jenisPublikasiRaw, (r) => r.jenis),
        sintaPublikasi: keKelompok(sintaRaw, (r) => r.sintaScore),
        trenTahunan: publikasiTahunRaw,
        statusMonev: keKelompok(statusMonevRaw, (r) => r.status),
        recentPenelitian,
        recentPublikasi,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil ringkasan dashboard LPPM" });
  }
});

// SPA Fallback: Melayani index.html untuk rute client (SPA routing).
//
// PENTING: rute `/api/*` TIDAK ikut fallback. Tanpa penjagaan ini, endpoint API
// yang tidak ada (atau sudah dihapus) menjawab 200 berisi HTML, sehingga klien
// mengira permintaannya berhasil dan mencoba mem-parsing HTML sebagai JSON.
// API yang tidak dikenal harus menjawab 404 JSON — bukan halaman aplikasi.
app.get("*", (req: Request, res: Response) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      code: "ENDPOINT_TIDAK_DITEMUKAN",
      message: `Endpoint ${req.method} ${req.path} tidak tersedia pada server ${APP_NAME}.`,
    });
  }

  res.sendFile(path.join(clientDistPath, "index.html"), (err) => {
    if (err) {
      res.status(200).send("LPPM UNUSU Server Running. Build client using 'npm run build:client'.");
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 LPPM UNUSU Monolith Server running on http://localhost:${PORT}`);
});

