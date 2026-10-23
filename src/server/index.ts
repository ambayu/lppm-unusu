import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
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

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", app: "LPPM UNUSU API", time: new Date().toISOString() });
});

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
