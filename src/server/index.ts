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
  nim: string | null;
  nidn: string | null;
  prodi: string | null;
  fakultas: string | null;
}

interface AuthRequest extends Request {
  user?: SsoSession;
}

const SSO_ROLE_MAP: Record<string, string> = {
  SUPERADMIN: "admin",
  ADMIN_LPPM: "admin",
  DOSEN: "dosen",
  MAHASISWA: "mahasiswa",
};

/** Role SSO yang diizinkan mengakses panel LPPM (Admin & Dosen) */
const ALLOWED_SSO_ROLES = new Set(["SUPERADMIN", "ADMIN_LPPM", "DOSEN"]);

const mapSsoRole = (role: string): string => SSO_ROLE_MAP[role] ?? "mahasiswa";

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header && header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Token otentikasi tidak disediakan" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    (req as AuthRequest).user = {
      id: Number(decoded.id),
      username: String(decoded.username ?? ""),
      nama: String(decoded.nama ?? ""),
      email: typeof decoded.email === "string" ? decoded.email : null,
      role: String(decoded.role ?? "mahasiswa"),
      ssoRole: String(decoded.ssoRole ?? ""),
      nim: typeof decoded.nim === "string" ? decoded.nim : null,
      nidn: typeof decoded.nidn === "string" ? decoded.nidn : null,
      prodi: typeof decoded.prodi === "string" ? decoded.prodi : null,
      fakultas: typeof decoded.fakultas === "string" ? decoded.fakultas : null,
    };
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Sesi login telah kedaluwarsa" });
  }
};

// Verifikasi token SSO sekali-pakai lalu terbitkan sesi lokal
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
      | { status?: boolean; message?: string; data?: { user?: SsoUserPayload } }
      | null;
    const ssoUser = ssoPayload?.data?.user;

    if (!ssoResponse.ok || !ssoPayload?.status || !ssoUser) {
      return res.status(401).json({ success: false, message: ssoPayload?.message || "Verifikasi token SSO gagal" });
    }

    // Tolak login jika role SSO tidak diizinkan di LPPM
    if (!ALLOWED_SSO_ROLES.has(ssoUser.role)) {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Hanya Administrator LPPM dan Dosen yang diizinkan masuk ke panel ini.",
      });
    }

    const sessionUser: SsoSession = {
      id: ssoUser.id,
      username: ssoUser.username,
      nama: ssoUser.nama,
      email: ssoUser.email ?? null,
      role: mapSsoRole(ssoUser.role),
      ssoRole: ssoUser.role,
      nim: ssoUser.nim ?? null,
      nidn: ssoUser.nidn ?? null,
      prodi: ssoUser.prodi ?? null,
      fakultas: ssoUser.fakultas ?? null,
    };

    const tokenJwt = jwt.sign(sessionUser, JWT_SECRET, { expiresIn: "7d" });

    res.json({ success: true, token: tokenJwt, user: sessionUser });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal memproses SSO: " + error?.message });
  }
});

// Seluruh API di bawah ini wajib membawa JWT sesi lokal (hasil SSO).
app.use("/api", authenticate);

/** Middleware otorisasi — hanya role tertentu yang boleh lewat. */
const requireRole = (...allowed: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const role = (req as AuthRequest).user?.role;
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Anda tidak memiliki izin untuk operasi ini.",
      });
    }
    next();
  };

// 1. Penelitian
app.get("/api/penelitian", async (req: Request, res: Response) => {
  try {
    const list = await prisma.penelitian.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data penelitian" });
  }
});

app.get("/api/penelitian/:id", async (req: Request, res: Response) => {
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

app.post("/api/penelitian", requireRole("admin"), async (req: Request, res: Response) => {
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

app.put("/api/penelitian/:id", requireRole("admin"), async (req: Request, res: Response) => {
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

app.delete("/api/penelitian/:id", requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.penelitian.delete({ where: { id } });
    res.json({ success: true, message: "Data penelitian berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus data penelitian" });
  }
});

// 2. Pengabdian (PKM)
app.get("/api/pengabdian", async (req: Request, res: Response) => {
  try {
    const list = await prisma.pengabdian.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data pengabdian" });
  }
});

app.get("/api/pengabdian/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const item = await prisma.pengabdian.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ success: false, message: "Pengabdian tidak ditemukan" });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil detail pengabdian" });
  }
});

app.post("/api/pengabdian", requireRole("admin"), async (req: Request, res: Response) => {
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

app.put("/api/pengabdian/:id", requireRole("admin"), async (req: Request, res: Response) => {
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

app.delete("/api/pengabdian/:id", requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.pengabdian.delete({ where: { id } });
    res.json({ success: true, message: "Data pengabdian berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus pengabdian" });
  }
});

// 3. Publikasi Jurnal
app.get("/api/publikasi", async (req: Request, res: Response) => {
  try {
    const list = await prisma.publikasi.findMany({
      orderBy: { tahun: "desc" }
    });
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil data publikasi" });
  }
});

app.get("/api/publikasi/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const item = await prisma.publikasi.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ success: false, message: "Publikasi tidak ditemukan" });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil detail publikasi" });
  }
});

app.post("/api/publikasi", requireRole("admin"), async (req: Request, res: Response) => {
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

app.put("/api/publikasi/:id", requireRole("admin"), async (req: Request, res: Response) => {
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

app.delete("/api/publikasi/:id", requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.publikasi.delete({ where: { id } });
    res.json({ success: true, message: "Data publikasi berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus publikasi" });
  }
});

// 4. Role & Permission Management
app.get("/api/roles", async (req: Request, res: Response) => {
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

app.post("/api/roles", requireRole("admin"), async (req: Request, res: Response) => {
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

app.put("/api/roles/:id", requireRole("admin"), async (req: Request, res: Response) => {
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

app.delete("/api/roles/:id", requireRole("admin"), async (req: Request, res: Response) => {
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
app.get("/api/permissions", async (req: Request, res: Response) => {
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

app.post("/api/permissions", requireRole("admin"), async (req: Request, res: Response) => {
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

app.put("/api/permissions/:id", requireRole("admin"), async (req: Request, res: Response) => {
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

app.delete("/api/permissions/:id", requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.permission.delete({ where: { id } });
    res.json({ success: true, message: "Hak izin berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus izin" });
  }
});

// 5. Monitoring & Evaluasi (Monev) API
app.get("/api/monev", async (req: Request, res: Response) => {
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

    const where: any = {};
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
      where.OR = [
        { kodeMonev: { contains: search } },
        { namaReviewer: { contains: search } },
        { targetLuaranWajib: { contains: search } },
        { catatanReviewer: { contains: search } },
        { penelitian: { judul: { contains: search } } },
        { pengabdian: { judul: { contains: search } } },
      ];
    }
    if (tahun) {
      where.OR = [
        ...(where.OR || []),
        { penelitian: { tahun } },
        { pengabdian: { tahun } },
      ];
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
      orderBy: { createdAt: "desc" },
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

app.get("/api/monev/:id", async (req: Request, res: Response) => {
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

app.post("/api/monev", requireRole("admin"), async (req: Request, res: Response) => {
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

app.put("/api/monev/:id", requireRole("admin"), async (req: Request, res: Response) => {
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

app.delete("/api/monev/:id", requireRole("admin"), async (req: Request, res: Response) => {
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

// SPA Fallback: Melayani index.html untuk semua rute client (SPA routing)
// Rute publik root '/' tidak melakukan default redirect ke '/admin'
app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(clientDistPath, "index.html"), (err) => {
    if (err) {
      res.status(200).send("LPPM UNUSU Server Running. Build client using 'npm run build:client'.");
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 LPPM UNUSU Monolith Server running on http://localhost:${PORT}`);
});

