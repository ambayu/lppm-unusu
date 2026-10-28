import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

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
  DOSEN: "dosen",
  MAHASISWA: "mahasiswa",
};

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

app.post("/api/penelitian", async (req: Request, res: Response) => {
  try {
    const { judul, ketua, nidn, anggota, skema, bidangFokus, danaDisetujui, sumberDana, tahun } = req.body;
    const item = await prisma.penelitian.create({
      data: {
        judul,
        ketua,
        nidn,
        anggota,
        skema: skema || "Penelitian Dosen Pemula (PDP)",
        bidangFokus: bidangFokus || "Teknologi Informasi",
        danaDisetujui: danaDisetujui ? Number(danaDisetujui) : null,
        sumberDana: sumberDana || "Internal UNUSU",
        tahun: Number(tahun) || new Date().getFullYear(),
      }
    });
    res.json({ success: true, data: item, message: "Proposal penelitian berhasil diajukan" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengajukan penelitian" });
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

app.post("/api/pengabdian", async (req: Request, res: Response) => {
  try {
    const { judul, ketua, nidn, anggota, mitra, lokasi, danaDisetujui, tahun } = req.body;
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
      }
    });
    res.json({ success: true, data: item, message: "Kegiatan pengabdian berhasil dicatat" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mencatat pengabdian" });
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

// SPA Fallback
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

