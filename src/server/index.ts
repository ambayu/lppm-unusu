import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import jwt from "jsonwebtoken";
import { CentralAccessError, checkCentralAccess, effectiveSsoRole, localFeaturesEnabled } from "./centralAccess.js";
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
import {
  pasangRuteBerkasArsip,
  simpanBerkasArsip,
  ARSIP_MAX_BYTES,
} from "./arsipBerkas.js";
import { jalankanMigrasiArsip } from "./arsipMigrasi.js";
import {
  PREFIX_MEDIA_SLIDER,
  direktoriMediaSlider,
  hapusMediaSliderFisik,
  namaBerkasMediaDariUrl,
  pastikanDirektoriMediaSlider,
  periksaUkuranMediaSlider,
  unggahMediaSlider,
  urlMediaSlider,
} from "./sliderMedia.js";

dotenv.config();
if (process.env.NODE_ENV === 'production' && !process.env.SSO_BASE_URL?.trim()) throw new Error('Missing required SSO_BASE_URL configuration.');
const SSO_BASE_URL = process.env.SSO_BASE_URL || 'http://localhost:5000';
const SSO_VERIFY_URL = process.env.SSO_VERIFY_URL || `${SSO_BASE_URL.replace(/\/$/, "")}/api/v2/website/verify-token`;
if (!/^https?:$/.test(new URL(SSO_BASE_URL).protocol)) throw new Error('SSO_BASE_URL must use HTTP(S).');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5005;

/**
 * Penyajian berkas arsip dokumen lewat URL bertanda tangan.
 *
 * Dipasang lebih awal (sebelum autentikasi) karena berkas dibaca juga oleh
 * server lain tanpa sesi pengguna; keamanannya berasal dari tanda tangan URL.
 */
pasangRuteBerkasArsip(app);

app.use(cors({
  origin: true,
  credentials: true,
}));
/**
 * Batas body 10 MB: berkas PDF dikirim ke `POST /api/dokumen/berkas` sebagai
 * base64 sekali jalan (± 33% lebih besar dari berkas asli, sehingga PDF 5 MB
 * menjadi ± 6,7 MB). Base64 TIDAK disimpan ke database — server mengubahnya
 * menjadi berkas di `uploads/dokumen` dan hanya menyimpan URL-nya. Batas
 * bawaan 100 KB dari Express akan menolak setiap unggahan.
 */
app.use(express.json({ limit: "10mb" }));

// Static client
const clientDistPath = path.resolve(process.cwd(), "dist/client");
app.use(express.static(clientDistPath));
app.use("/lppm", express.static(clientDistPath));

/*
 * Pengalihan paksa ke awalan `/lppm` DIHAPUS.
 *
 * Aplikasi kini dilayani pada akar domainnya, sejalan dengan `urlRedirect`
 * SSO di database ONE (`https://lppm.unusu.ac.id/sso/callback`). Pengalihan
 * lama membuat setiap halaman callback dibelokkan ke `/lppm/sso/callback`
 * sehingga router tidak menemukan rute yang cocok dan pengguna tidak pernah
 * sampai ke panel. Awalan `/lppm` masih dilayani sebagai alias statis di atas
 * agar tautan lama tidak mati.
 */

// Media slider hero (gambar & video) disajikan sebagai berkas statis publik.
try {
  pastikanDirektoriMediaSlider();
} catch (error) {
  console.error("[SLIDER] Gagal menyiapkan direktori media slider:", error);
}
app.use(PREFIX_MEDIA_SLIDER, express.static(direktoriMediaSlider(), { maxAge: "7d" }));

/**
 * Penanganan galat body-parser: tanpa ini, unggahan yang melebihi batas
 * berhenti di middleware dengan halaman HTML sehingga klien hanya menerima
 * pesan generik. Di sini penyebabnya diteruskan sebagai JSON terstruktur agar
 * modal galat dapat menyebut "ukuran berkas melebihi batas", bukan "gagal".
 */
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);
  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      code: "PAYLOAD_TOO_LARGE",
      message:
        "Ukuran data yang dikirim melebihi batas server (10 MB). Kompres atau perkecil berkas PDF lalu coba lagi.",
    });
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      code: "PAYLOAD_PARSE_FAILED",
      message: "Format data yang dikirim tidak dapat dibaca server.",
    });
  }
  return next(err);
});


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
const SSO_CLIENT_ID = process.env.SSO_CLIENT_ID || "223ea0752e7619e2";
const SSO_CLIENT_KEY = process.env.SSO_CLIENT_KEY || "";

/** API key LPPM di API Hub ONE UNUSU (untuk pencarian direktori pengguna). */
const ONE_UNUSU_API_KEY = process.env.ONE_UNUSU_API_KEY || "";

/** Bentuk pengguna yang dikirim ONE UNUSU pada /api/v2/website/users. */
interface PenggunaOneUnusu {
  id: number;
  username: string;
  nama: string;
  email: string | null;
  noHp?: string | null;
  nim?: string | null;
  nidn?: string | null;
  nip?: string | null;
  fakultas?: string | null;
  prodi?: string | null;
  jenisKelamin?: string | null;
  avatar?: string | null;
  isActive?: boolean;
  role?: string | null;
  roles?: string[];
}

/**
 * Memanggil endpoint ONE UNUSU dengan API key aplikasi ini.
 *
 * API key disimpan di server, jadi tidak pernah sampai ke browser. Dipakai
 * tunggal supaya header dan penanganan galatnya seragam.
 */
async function panggilOneUnusu<T>(
  jalur: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; data: T | null; pesan?: string }> {
  if (!ONE_UNUSU_API_KEY) {
    return {
      ok: false,
      data: null,
      pesan:
        "ONE_UNUSU_API_KEY belum diset di server LPPM. Buat API key di panel API Hub ONE UNUSU lalu isi di .env.",
    };
  }

  try {
    const res = await fetch(`${SSO_BASE_URL.replace(/\/$/, "")}${jalur}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ONE_UNUSU_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const payload = (await res.json().catch(() => null)) as
      | { status?: boolean; message?: string; data?: T }
      | null;

    if (!res.ok || !payload?.status) {
      return { ok: false, data: null, pesan: payload?.message || `ONE UNUSU membalas ${res.status}.` };
    }

    return { ok: true, data: (payload.data ?? null) as T | null };
  } catch (error: any) {
    return { ok: false, data: null, pesan: `Gagal menghubungi ONE UNUSU: ${error?.message ?? "jaringan"}` };
  }
}

/**
 * Verifikasi beberapa pengguna sekaligus ke direktori ONE UNUSU.
 *
 * Endpoint pencarian hanya menerima kata kunci teks, jadi tiap id dicari lewat
 * `search` yang sama lalu disaring berdasarkan id. Jumlah pilihan dari modal
 * biasanya kecil, sehingga biayanya wajar.
 */
async function verifikasiPenggunaOneUnusu(
  daftar: Array<{ id: number; nama?: string; username?: string }>
): Promise<Map<number, PenggunaOneUnusu>> {
  const hasil = new Map<number, PenggunaOneUnusu>();

  const daftarId = Array.from(
    new Set(
      daftar
        .map((d) => Number(d.id))
        .filter((n) => Number.isInteger(n) && n > 0)
    )
  );
  if (daftarId.length === 0) return hasil;

  const res = await panggilOneUnusu<PenggunaOneUnusu[]>(
    "/api/v2/website/users",
    { ids: daftarId.slice(0, 50) }
  );
  if (!res.ok || !Array.isArray(res.data)) return hasil;

  for (const u of res.data) {
    const id = Number(u.id);
    if (daftarId.includes(id)) hasil.set(id, u);
  }

  return hasil;
}

/**
 * GET /api/sso/session-check
 *
 * Meneruskan pemeriksaan sesi ONE UNUSU lewat origin aplikasi ini sendiri.
 *
 * Sebelumnya browser memanggil API Hub langsung. Alamatnya berasal dari
 * `VITE_SSO_API_URL`, yang bila tidak diisi jatuh ke `http://localhost:5000`
 * — alamat komputer pengunjung, bukan server. Akibatnya pemeriksaan selalu
 * gagal dan pengguna terlempar ke halaman masuk. Dengan diteruskan dari sisi
 * server, cookie sesi ikut terbawa pada jalur yang sama seperti penukaran
 * tiket, dan aplikasi tidak lagi bergantung pada alamat absolut di browser.
 *
 * Ketidakpastian (server SSO tidak dapat dihubungi) dijawab dengan
 * `authenticated: null`, BUKAN `false`, agar sesi lokal tidak diputus.
 */
app.get("/api/sso/session-check", async (req: Request, res: Response) => {
  try {
    const cookie = req.headers.cookie ?? "";
    const upstream = await fetch(`${SSO_BASE_URL}/api/sso/session-check`, {
      headers: cookie ? { cookie } : {},
    });

    const payload = (await upstream.json().catch(() => null)) as any;
    if (!payload) {
      return res.status(502).json({ status: false, authenticated: null, message: "Pemeriksa sesi SSO tidak merespons." });
    }

    return res.status(upstream.status).json(payload);
  } catch (error: any) {
    return res.status(502).json({ status: false, authenticated: null, message: error?.message });
  }
});

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

// ===========================================================================
// ONE menentukan izin masuk pada setiap request JWT; peran lokal hanya fitur.
// Tidak ada auto-provisioning. Tanpa anggota aktif, izin fitur lokal kosong.
// ===========================================================================

/** Tingkat akses panel LPPM — diturunkan dari peran lokal. */
const TINGKAT_MASUK_LPPM = ["admin", "dosen", "reviewer", "mahasiswa"] as const;

type TingkatMasuk = (typeof TINGKAT_MASUK_LPPM)[number];

const LABEL_TINGKAT: Record<TingkatMasuk, string> = {
  admin: "Administrator LPPM",
  dosen: "Dosen Peneliti & Pengabdi",
  reviewer: "Reviewer Proposal",
  mahasiswa: "Mahasiswa",
};

/**
 * Izin fitur bawaan per tingkat.
 *
 * Dipakai HANYA ketika sebuah peran lokal belum memiliki satu pun baris
 * `lppm_role_permissions`. Tanpa cadangan ini, peran baru hasil seeder akan
 * menghasilkan panel yang kosong meski pengguna sudah terdaftar dan aktif.
 * Begitu peran itu punya izin sendiri, cadangan ini tidak dipakai lagi.
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
 * Tingkat tertinggi yang dimiliki pengguna berdasarkan peran LPPM-nya.
 * `null` berarti pengguna tidak memegang peran LPPM apa pun.
 */
const tingkatMasukDari = (roles: string[]): TingkatMasuk | null => {
  const kode = roles.map((r) => r.toLowerCase());
  if (kode.includes("admin")) return "admin";
  if (kode.includes("dosen")) return "dosen";
  if (kode.includes("reviewer")) return "reviewer";
  if (kode.includes("mahasiswa")) return "mahasiswa";
  return null;
};

export type AppAccessReason =
  | "allowed"
  | "not_registered"
  | "inactive_account"
  | "no_role"
  | "superadmin_bypass";

/** Kode penolakan untuk klien, supaya pesan bisa dibedakan. */
const KODE_PENOLAKAN: Record<string, string> = {
  not_registered: "NOT_REGISTERED",
  inactive_account: "INACTIVE",
  no_role: "NO_ROLE",
};

export interface AppAccessDecision {
  app: string;
  appName: string;
  allowed: boolean;
  reason: AppAccessReason;
  ssoRole: string;
  tingkat: TingkatMasuk | null;
  roleLabel: string;
  isAppAdmin: boolean;
  izin: string[];
  message: string;
}

/**
 * Putusan akses aplikasi LPPM.
 *
 * Dipanggil hanya setelah check-access ONE berhasil; peran pusat biasa tidak memberi fitur admin.
 */
const putuskanAkses = (params: {
  ssoRole: string;
  roles: string[];
  statusAkun: string | null;
}): AppAccessDecision => {
  const ssoRole = (params.ssoRole || "").toUpperCase();
  const tingkat = ssoRole === "SUPERADMIN" ? "admin" : tingkatMasukDari(localFeaturesEnabled(params.statusAkun) ? params.roles : []);

  const dasar = {
    app: APP_SCOPE,
    appName: APP_NAME,
    ssoRole,
    tingkat,
    roleLabel: tingkat ? LABEL_TINGKAT[tingkat] : "Tanpa Peran LPPM",
    isAppAdmin: tingkat === "admin",
    izin: [] as string[],
  };

  // Jaring pengaman: Superadmin ekosistem selalu bisa masuk panel LPPM.
  if (ssoRole === "SUPERADMIN") {
    return {
      ...dasar,
      allowed: true,
      reason: "superadmin_bypass",
      message: `Selamat datang di panel ${APP_NAME}.`,
    };
  }

  return {
    ...dasar,
    allowed: true,
    reason: "allowed",
    message: `Selamat datang di panel ${APP_NAME}.`,
  };
};

/**
 * Memeriksa token layanan arsip yang diterbitkan portal ONE UNUSU.
 *
 * Token berbentuk `arsip.<clientId>.<hmac>` dan hanya sah bila HMAC-nya cocok
 * dengan `ARSIP_SERVICE_TOKEN_SECRET`. Fungsi mengembalikan `null` untuk token
 * apa pun yang tidak cocok, sehingga token sesi pengguna biasa tetap diproses
 * lewat jalur JWT di bawahnya.
 */
const verifikasiTokenLayananArsip = (token: string): { clientId: string } | null => {
  const secret = process.env.ARSIP_SERVICE_TOKEN_SECRET || "";
  if (!secret) return null;

  const bagian = token.split(".");
  if (bagian.length !== 3 || bagian[0] !== "arsip") return null;

  const [, clientId, tanda] = bagian;
  if (!clientId || !/^[A-Za-z0-9_-]{1,64}$/.test(clientId)) return null;

  const diharapkan = crypto
    .createHmac("sha256", secret)
    .update(`arsip-dokumen|${clientId}`)
    .digest("hex");

  const a = Buffer.from(tanda, "utf8");
  const b = Buffer.from(diharapkan, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  return { clientId };
};

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  // Endpoint survei publik & pengisian kuesioner mutu anonim dapat diakses tanpa token
  const isPublicMonev =
    req.path === "/monev-survei/aktif" ||
    (/^\/monev-survei\/\d+$/.test(req.path) && req.method === "GET") ||
    (/^\/monev-survei\/\d+\/submit$/.test(req.path) && req.method === "POST");

  const header = req.headers.authorization;
  const token = header && header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    if (isPublicMonev) {
      return next();
    }
    return res.status(401).json({ success: false, message: "Token otentikasi tidak disediakan" });
  }

  /*
   * Token layanan arsip.
   *
   * Portal ONE UNUSU memanggil endpoint arsip tanpa sesi pengguna (server-ke-
   * server, mis. dari website prodi). Token ini hanya memberi hak BACA arsip;
   * tidak ada peran administrator dan tidak dapat dipakai mengubah data.
   */
  const serviceToken = verifikasiTokenLayananArsip(token);
  if (serviceToken) {
    (req as AuthRequest).izin = new Set(["dokumen.view"]);
    (req as AuthRequest).user = {
      id: 0,
      username: serviceToken.clientId,
      nama: `Layanan Arsip (${serviceToken.clientId})`,
      email: null,
      role: "dosen",
      ssoRole: "SERVICE_ARSIP",
      app: APP_SCOPE,
      appName: APP_NAME,
      nim: null,
      nidn: null,
      prodi: null,
      fakultas: null,
    };
    next();
    return;
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
    const central = await checkCentralAccess(SSO_VERIFY_URL, SSO_CLIENT_ID, SSO_CLIENT_KEY, Number(decoded.id));
    const session: SsoSession = {
      id: Number(decoded.id),
      username: String(decoded.username ?? ""),
      nama: String(decoded.nama ?? ""),
      email: typeof decoded.email === "string" ? decoded.email : null,
      role: "",
      ssoRole: effectiveSsoRole(central),
      app: APP_SCOPE,
      appName: APP_NAME,
      nim: typeof decoded.nim === "string" ? decoded.nim : null,
      nidn: typeof decoded.nidn === "string" ? decoded.nidn : null,
      prodi: typeof decoded.prodi === "string" ? decoded.prodi : null,
      fakultas: typeof decoded.fakultas === "string" ? decoded.fakultas : null,
    };

    // Status lokal hanya membatasi fitur; izin masuk sudah diperiksa di ONE.
    const lokal = await ambilAksesLokalPengguna(session.id, session.ssoRole);
    const akses = putuskanAkses({
      ssoRole: session.ssoRole,
      roles: lokal.roles,
      statusAkun: lokal.record ? String(lokal.record.status ?? "") : null,
    });

    // Pertahankan bentuk respons penolakan untuk kompatibilitas klien.
    if (!akses.allowed) {
      return res.status(403).json({
        success: false,
        code: KODE_PENOLAKAN[akses.reason] ?? "IZIN_MASUK_DITOLAK",
        app: APP_SCOPE,
        appAccess: { ...akses, izin: Array.from(lokal.permissions) },
        message: akses.message,
      });
    }

    session.role = akses.tingkat ?? "";
    (req as AuthRequest).user = session;
    (req as AuthRequest).izin = lokal.permissions;
    (req as AuthRequest).akses = { ...akses, izin: Array.from(lokal.permissions) };
    next();
  } catch (error: any) {
    if (error instanceof CentralAccessError) return res.status(error.status).json({ success: false, code: error.status === 403 ? "IZIN_MASUK_DITOLAK" : "CENTRAL_ACCESS_UNAVAILABLE", message: error.message });
    console.error("Gagal memverifikasi izin akses:", error?.message);
    return res.status(500).json({ success: false, message: "Gagal memverifikasi izin akses" });
  }
};

/**
 * Mendaftarkan seluruh izin yang dikenal ke sebuah himpunan.
 * Dipakai untuk memberi Superadmin akses penuh tanpa bergantung pada peran
 * lokal yang mungkin belum dibuat.
 */
async function seluruhIzin(): Promise<string[]> {
  const semua = await prisma.permission.findMany({ select: { kode: true } });
  return semua.map((p) => p.kode);
}

/**
 * Mengambil keanggotaan, peran, dan izin pengguna dari database LPPM.
 *
 * Tidak menulis akun lokal; baris yang tidak ada atau nonaktif tidak memberi fitur.
 */
async function ambilAksesLokalPengguna(
  userId: number,
  ssoRole: string
): Promise<{
  record: Awaited<ReturnType<typeof prisma.lppmUser.findFirst>> | null;
  roles: string[];
  permissions: Set<string>;
}> {
  const record = await prisma.lppmUser.findFirst({
    where: { userId },
    include: {
      peran: {
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      },
    },
  });

  const roles: string[] = [];
  const permissions = new Set<string>();

  if (record && localFeaturesEnabled(record.status)) {
    for (const ur of record.peran) {
      roles.push(ur.role.kode);
      for (const rp of ur.role.permissions) {
        permissions.add(rp.permission.kode);
      }
    }
  }

  // Jaring pengaman Superadmin: tanpa izin, setiap endpoint akan menolak 403
  // dan panel terkunci permanen — termasuk halaman pengguna yang justru
  // dibutuhkan untuk memperbaikinya. Superadmin ekosistem karena itu selalu
  // memegang seluruh izin fitur LPPM.
  if ((ssoRole || "").toUpperCase() === "SUPERADMIN") {
    for (const kode of await seluruhIzin()) permissions.add(kode);
  }

  // Cadangan izin fitur bila peran lokal belum punya izin sama sekali, agar
  // panel tidak kosong hanya karena seeder izin belum dijalankan.
  const tingkat = tingkatMasukDari(roles);
  if (tingkat && permissions.size === 0) {
    for (const kode of IZIN_FITUR_BAWAAN[tingkat]) permissions.add(kode);
  }

  return { record, roles, permissions };
}

// Verifikasi token SSO sekali-pakai lalu terbitkan sesi lokal terdesentralisasi
app.post("/api/auth/sso", async (req: Request, res: Response) => {
  try {
    const { token } = req.body ?? {};

    if (typeof token !== "string" || token.length < 32 || token.length > 256) {
      return res.status(400).json({ success: false, message: "Tiket SSO tidak valid" });
    }
    if (!SSO_CLIENT_KEY) {
      return res.status(500).json({ success: false, message: "SSO_CLIENT_KEY belum dikonfigurasi di server" });
    }

    const ssoResponse = await fetch(SSO_VERIFY_URL, {
      method: "POST",
      signal: AbortSignal.timeout(5000),
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

    const central = await checkCentralAccess(SSO_VERIFY_URL, SSO_CLIENT_ID, SSO_CLIENT_KEY, ssoUser.id);
    const ssoRole = effectiveSsoRole(central);
    const lokal = await ambilAksesLokalPengguna(ssoUser.id, ssoRole);

    const akses = putuskanAkses({
      ssoRole,
      roles: lokal.roles,
      statusAkun: lokal.record ? String(lokal.record.status ?? "") : null,
    });

    if (!akses.allowed) {
      return res.status(403).json({
        success: false,
        code: KODE_PENOLAKAN[akses.reason] ?? "IZIN_MASUK_DITOLAK",
        app: APP_SCOPE,
        appAccess: akses,
        message: akses.message,
      });
    }

    const aksesFinal: AppAccessDecision = { ...akses, izin: Array.from(lokal.permissions) };

    const sessionUser: SsoSession = {
      id: ssoUser.id,
      username: ssoUser.username,
      nama: ssoUser.nama,
      email: ssoUser.email ?? null,
      role: akses.tingkat ?? "",
      ssoRole,
      app: APP_SCOPE,
      appName: APP_NAME,
      nim: ssoUser.nim ?? null,
      nidn: ssoUser.nidn ?? null,
      prodi: ssoUser.prodi ?? null,
      fakultas: ssoUser.fakultas ?? null,
    };

    const tokenJwt = jwt.sign(
      {
        ...sessionUser,
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
      appAccess: aksesFinal,
      izin: aksesFinal.izin,
    });
  } catch (error: any) {
    if (error instanceof CentralAccessError) return res.status(error.status).json({ success: false, code: error.status === 403 ? "IZIN_MASUK_DITOLAK" : "CENTRAL_ACCESS_UNAVAILABLE", message: error.message });
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
  const akses = (req as AuthRequest).akses;
  if (!akses) return res.status(403).json({ success: false, message: "Sesi pengguna tidak tersedia." });

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

// 4b. Manajemen Pengguna LPPM
//
// Pengguna LPPM TIDAK dibuat manual: Admin LPPM memilih dari direktori ONE
// UNUSU, dan server memverifikasi ulang sebelum menyimpan. Jadi tidak ada akun
// hantu yang tidak dikenal SSO, dan NIDN/NIP selalu sama dengan data kampus.
app.get("/api/users", requireAnyPermission("users.view", "roles.view"), async (req: Request, res: Response) => {
  try {
    const daftar = await prisma.lppmUser.findMany({
      orderBy: { id: "asc" },
      include: { peran: { include: { role: true } } },
    });

    res.json({
      success: true,
      data: daftar.map((u) => ({
        id: u.id,
        userId: u.userId,
        username: u.username,
        nama: u.nama,
        email: u.email,
        ssoRole: u.ssoRole,
        status: u.status,
        peran: u.peran.map((p) => p.role.kode),
        role: u.peran[0]?.role.kode ?? null,
        createdAt: u.createdAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal mengambil daftar pengguna: " + error?.message });
  }
});

// 4b2. Cari pengguna ONE UNUSU untuk modal "Tambah Pengguna".
//
// Yang dikembalikan hanya pengguna yang BELUM terdaftar di LPPM, supaya modal
// tidak menampilkan pilihan yang pasti ditolak.
app.get(
  "/api/users/kandidat",
  requireAnyPermission("users.manage", "roles.manage"),
  async (req: Request, res: Response) => {
    try {
      const search = String(req.query.search ?? "").trim();
      const role = String(req.query.role ?? "").trim();
      const fakultas = String(req.query.fakultas ?? "").trim();
      const prodi = String(req.query.prodi ?? "").trim();

      if (search.length === 1) {
        return res.status(422).json({
          success: false,
          message: "Ketik minimal 2 karakter untuk mencari pengguna.",
        });
      }

      const hasil = await panggilOneUnusu<PenggunaOneUnusu[]>("/api/v2/website/users", {
        ...(search.length >= 2 ? { search: search.slice(0, 100) } : {}),
        ...(role ? { role } : {}),
        ...(fakultas ? { fakultas } : {}),
        ...(prodi ? { prodi } : {}),
        limit: 20,
      });

      if (!hasil.ok) {
        return res.status(502).json({ success: false, message: hasil.pesan });
      }

      const daftar = Array.isArray(hasil.data) ? hasil.data : [];
      const terdaftar = await prisma.lppmUser.findMany({
        where: { userId: { in: daftar.map((u) => Number(u.id)) } },
        select: { userId: true },
      });
      const sudahAda = new Set(terdaftar.map((u) => u.userId));

      res.json({
        success: true,
        data: daftar.map((u) => ({ ...u, sudahTerdaftar: sudahAda.has(Number(u.id)) })),
        meta: { total: daftar.length, search, role, fakultas, prodi },
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, message: error?.message || "Gagal mencari pengguna ONE UNUSU" });
    }
  }
);

app.post("/api/users", requireAnyPermission("users.manage", "roles.manage"), async (req: Request, res: Response) => {
  try {
    const { userIds, userId, peran, roleIds } = req.body ?? {};

    const daftarId: number[] = Array.from(
      new Set(
        (Array.isArray(userIds) ? userIds : userId !== undefined ? [userId] : [])
          .map((n: unknown) => Number(n))
          .filter((n: number) => Number.isInteger(n) && n > 0)
      )
    );

    if (daftarId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Pilih minimal satu pengguna dari direktori ONE UNUSU.",
      });
    }

    // Menerima kode peran (`peran`) maupun id peran (`roleIds`) agar klien lama
    // dan baru sama-sama bekerja.
    const kodePeran: string[] = Array.isArray(peran) ? peran.map(String) : [];
    const idsPeran: number[] = Array.isArray(roleIds)
      ? roleIds.map((n: unknown) => Number(n)).filter((n: number) => Number.isInteger(n) && n > 0)
      : [];

    const adaPeran = kodePeran.length > 0 || idsPeran.length > 0;
    const peranDb = adaPeran
      ? await prisma.role.findMany({
          where: kodePeran.length > 0 ? { kode: { in: kodePeran } } : { id: { in: idsPeran } },
        })
      : [];
    const diharapkan = kodePeran.length > 0 ? kodePeran.length : idsPeran.length;
    if (adaPeran && peranDb.length !== diharapkan) {
      return res.status(400).json({ success: false, message: "Ada peran yang tidak dikenal." });
    }

    // Verifikasi ke direktori ONE UNUSU: hanya pengguna nyata yang boleh masuk.
    const kandidat = Array.isArray(req.body?.kandidat) ? req.body.kandidat : [];
    const dariOne = await verifikasiPenggunaOneUnusu(
      daftarId.map((id) => {
        const info = kandidat.find((k: any) => Number(k?.id) === id);
        return { id, nama: info?.nama, username: info?.username };
      })
    );
    if (dariOne.size !== daftarId.length) {
      const tidakAda = daftarId.filter((id) => !dariOne.has(id));
      return res.status(400).json({
        success: false,
        message: `Pengguna tidak ditemukan di direktori ONE UNUSU: ${tidakAda.join(", ")}.`,
      });
    }

    const sudahAda = await prisma.lppmUser.findMany({
      where: { userId: { in: daftarId } },
      select: { userId: true },
    });
    if (sudahAda.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Sebagian pengguna sudah terdaftar di LPPM (userId: ${sudahAda
          .map((u) => u.userId)
          .join(", ")}).`,
      });
    }

    const dibuat = await prisma.$transaction(
      daftarId.map((id) => {
        const one = dariOne.get(id)!;
        return prisma.lppmUser.create({
          data: {
            userId: id,
            username: one.username,
            nama: one.nama,
            email: one.email || null,
            ssoRole: null,
            status: "Aktif",
            peran: { create: peranDb.map((p) => ({ roleId: p.id })) },
          },
          include: { peran: { include: { role: true } } },
        });
      })
    );

    res.status(201).json({
      success: true,
      data: dibuat,
      message:
        daftarId.length === 1
          ? `${dibuat[0]?.nama ?? "Pengguna"} berhasil didaftarkan ke LPPM.`
          : `${dibuat.length} pengguna berhasil didaftarkan ke LPPM.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal menambahkan pengguna: " + error?.message });
  }
});

app.put("/api/users/:id", requireAnyPermission("users.manage", "roles.manage"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Id pengguna tidak valid" });
    }

    const target = await prisma.lppmUser.findUnique({
      where: { id },
      include: { peran: { include: { role: true } } },
    });
    if (!target) {
      return res.status(404).json({ success: false, message: "Pengguna tidak ditemukan" });
    }

    const { peran, roleIds, status } = req.body ?? {};
    const kodePeran: string[] = Array.isArray(peran) ? peran.map(String) : [];
    const idsPeran: number[] = Array.isArray(roleIds)
      ? roleIds.map((n: unknown) => Number(n)).filter((n: number) => Number.isInteger(n) && n > 0)
      : [];

    // Jaring pengaman: Superadmin ekosistem tidak boleh terkunci.
    const isSuperadmin =
      (target.ssoRole || "").toUpperCase() === "SUPERADMIN" ||
      target.peran.some((p) => p.role.kode.toUpperCase() === "SUPERADMIN");

    if (isSuperadmin && status !== undefined && String(status) !== "Aktif") {
      return res.status(400).json({
        success: false,
        message: "Akun Superadmin selalu aktif dan tidak dapat dinonaktifkan.",
      });
    }

    let peranDb: Array<{ id: number; kode: string; nama: string }> | null = null;
    if (kodePeran.length > 0 || idsPeran.length > 0) {
      peranDb = await prisma.role.findMany({
        where: kodePeran.length > 0 ? { kode: { in: kodePeran } } : { id: { in: idsPeran } },
        select: { id: true, kode: true, nama: true },
      });
      const diharapkan = kodePeran.length > 0 ? kodePeran.length : idsPeran.length;
      if (peranDb.length !== diharapkan) {
        return res.status(400).json({ success: false, message: "Ada peran yang tidak dikenal." });
      }
      if (isSuperadmin) {
        const superRole = await prisma.role.findUnique({ where: { kode: "SUPERADMIN" } });
        if (superRole && !peranDb.some((r) => r.id === superRole.id)) peranDb.push(superRole);
      }
    }

    const dataStatus = status !== undefined ? String(status) : undefined;

    await prisma.$transaction(async (tx) => {
      if (dataStatus && (dataStatus === "Aktif" || dataStatus === "Nonaktif")) {
        await tx.lppmUser.update({ where: { id }, data: { status: dataStatus } });
      }
      if (peranDb) {
        await tx.lppmUserRole.deleteMany({ where: { userId: id } });
        await tx.lppmUserRole.createMany({
          data: peranDb.map((r) => ({ userId: id, roleId: r.id })),
        });
      }
    });

    res.json({
      success: true,
      message: `Perubahan untuk ${target.nama} berhasil disimpan.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal memperbarui pengguna: " + error?.message });
  }
});

app.delete("/api/users/:id", requireAnyPermission("users.manage", "roles.manage"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: "Id pengguna tidak valid" });
    }

    const target = await prisma.lppmUser.findUnique({
      where: { id },
      include: { peran: { include: { role: true } } },
    });
    if (!target) {
      return res.status(404).json({ success: false, message: "Pengguna tidak ditemukan" });
    }

    const isSuperadmin =
      (target.ssoRole || "").toUpperCase() === "SUPERADMIN" ||
      target.peran.some((p) => p.role.kode.toUpperCase() === "SUPERADMIN");
    if (isSuperadmin) {
      return res.status(400).json({
        success: false,
        message: "Akun Superadmin tidak dapat dihapus dari daftar pengguna LPPM.",
      });
    }

    await prisma.lppmUser.delete({ where: { id } });
    res.json({ success: true, message: `${target.nama} berhasil dihapus dari pengguna LPPM` });
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

// ===========================================================================
// BANNER SLIDER HERO (LPPM UNUSU)
// ===========================================================================

// GET /api/sliders (Daftar slider hero aktif untuk halaman landing publik)
app.get("/api/sliders", async (req: Request, res: Response) => {
  try {
    const sliders = await prisma.lppmBannerSlider.findMany({
      where: { active: true },
      orderBy: [{ urutan: "asc" }, { createdAt: "desc" }],
    });
    res.json({ success: true, data: sliders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil foto slider hero LPPM." });
  }
});

// GET /api/admin/sliders (Seluruh foto slider hero termasuk non-aktif)
app.get("/api/admin/sliders", async (req: Request, res: Response) => {
  try {
    const sliders = await prisma.lppmBannerSlider.findMany({
      orderBy: [{ urutan: "asc" }, { createdAt: "desc" }],
    });
    res.json({ success: true, data: sliders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal mengambil daftar slider admin LPPM." });
  }
});

// POST /api/admin/sliders (Tambah media slider hero: gambar atau video)
//
// Body multipart/form-data, field "berkas" berisi gambar atau video. Kolom
// database diisi path hasil unggahan, bukan base64.
app.post("/api/admin/sliders", unggahMediaSlider, async (req: Request, res: Response) => {
  const berkas = req.file as Express.Multer.File | undefined;
  try {
    const { judul, subjudul, linkUrl, urutan, active } = req.body;

    if (!judul || typeof judul !== "string" || !judul.trim()) {
      if (berkas) hapusMediaSliderFisik(berkas.filename);
      return res.status(400).json({ success: false, message: "Judul slider wajib diisi." });
    }
    if (!berkas) {
      return res.status(400).json({ success: false, message: "Berkas gambar atau video slider wajib diunggah." });
    }

    const galatUkuran = periksaUkuranMediaSlider(berkas);
    if (galatUkuran) {
      hapusMediaSliderFisik(berkas.filename);
      return res.status(400).json({ success: false, message: galatUkuran });
    }

    const created = await prisma.lppmBannerSlider.create({
      data: {
        judul: judul.trim(),
        subjudul: subjudul && typeof subjudul === "string" ? subjudul.trim() : null,
        gambarUrl: urlMediaSlider(berkas),
        gambarMobileUrl: null,
        linkUrl: linkUrl && typeof linkUrl === "string" ? linkUrl.trim() : null,
        urutan: Number.isInteger(Number(urutan)) ? Number(urutan) : 0,
        active: active === undefined || active === "" ? true : active === "true" || active === true,
      },
    });

    res.status(201).json({ success: true, message: "Media slider hero LPPM berhasil ditambahkan.", data: created });
  } catch (error) {
    // Berkas sudah tertulis ke disk; jangan tinggalkan sampah bila simpan gagal.
    if (berkas) hapusMediaSliderFisik(berkas.filename);
    console.error("[SLIDER] Gagal menyimpan slider:", error);
    res.status(500).json({ success: false, message: "Gagal menyimpan media slider LPPM." });
  }
});

// PUT /api/admin/sliders/:id (Ubah media slider; berkas baru menggantikan lama)
app.put("/api/admin/sliders/:id", unggahMediaSlider, async (req: Request, res: Response) => {
  const berkas = req.file as Express.Multer.File | undefined;
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      if (berkas) hapusMediaSliderFisik(berkas.filename);
      return res.status(400).json({ success: false, message: "ID slider tidak valid." });
    }

    const galatUkuran = periksaUkuranMediaSlider(berkas);
    if (galatUkuran) {
      if (berkas) hapusMediaSliderFisik(berkas.filename);
      return res.status(400).json({ success: false, message: galatUkuran });
    }

    const existing = await prisma.lppmBannerSlider.findUnique({ where: { id } });
    if (!existing) {
      if (berkas) hapusMediaSliderFisik(berkas.filename);
      return res.status(404).json({ success: false, message: "Slider tidak ditemukan." });
    }

    const { judul, subjudul, linkUrl, urutan, active } = req.body;

    const data: Record<string, unknown> = {};
    if (judul !== undefined) data.judul = String(judul).trim();
    if (subjudul !== undefined) data.subjudul = subjudul ? String(subjudul).trim() : null;
    if (linkUrl !== undefined) data.linkUrl = linkUrl ? String(linkUrl).trim() : null;
    if (urutan !== undefined) data.urutan = Number(urutan) || 0;
    if (active !== undefined) data.active = active === "true" || active === true;
    if (berkas) data.gambarUrl = urlMediaSlider(berkas);

    const updated = await prisma.lppmBannerSlider.update({ where: { id }, data });

    // Berkas lama baru dihapus SETELAH pembaruan berhasil, agar baris tidak
    // kehilangan rujukan bila penyimpanan gagal.
    if (berkas) {
      const namaLama = namaBerkasMediaDariUrl(existing.gambarUrl);
      if (namaLama) hapusMediaSliderFisik(namaLama);
    }

    res.json({ success: true, message: "Media slider hero LPPM berhasil diperbarui.", data: updated });
  } catch (error) {
    if (berkas) hapusMediaSliderFisik(berkas.filename);
    console.error("[SLIDER] Gagal memperbarui slider:", error);
    res.status(500).json({ success: false, message: "Gagal memperbarui media slider LPPM." });
  }
});

// DELETE /api/admin/sliders/:id (Hapus slider beserta berkas medianya)
app.delete("/api/admin/sliders/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID slider tidak valid." });
    }

    const existing = await prisma.lppmBannerSlider.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Slider tidak ditemukan." });
    }

    await prisma.lppmBannerSlider.delete({ where: { id } });

    // Berkas dihapus setelah baris hilang; kegagalan pembersihan disk hanya
    // menyisakan berkas yatim dan tidak membatalkan penghapusan data.
    const nama = namaBerkasMediaDariUrl(existing.gambarUrl);
    if (nama) hapusMediaSliderFisik(nama);

    res.json({ success: true, message: "Media slider hero LPPM berhasil dihapus." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal menghapus media slider LPPM." });
  }
});

// ===========================================================================
// DOKUMEN & KATEGORI — Manajemen dokumen terstruktur per aplikasi LPPM
// ===========================================================================

// GET /api/kategori (Daftar kategori untuk dropdown atau tabel)
app.get("/api/kategori", requirePermission("dokumen.view"), async (req: Request, res: Response) => {
  try {
    const daftar = await prisma.lppmCategory.findMany({
      where: { isActive: true },
      orderBy: { nama: "asc" },
    });
    res.json({ success: true, data: daftar });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || "Gagal mengambil daftar kategori" });
  }
});

// POST /api/kategori (Tambah kategori baru)
app.post("/api/kategori", requirePermission("dokumen.create"), async (req: Request, res: Response) => {
  try {
    const { nama, deskripsi } = req.body;
    if (!nama || typeof nama !== "string" || !nama.trim()) {
      return res.status(400).json({ success: false, message: "Nama kategori wajib diisi" });
    }

    const created = await prisma.lppmCategory.create({
      data: {
        nama: nama.trim(),
        deskripsi: deskripsi && typeof deskripsi === "string" ? deskripsi.trim() : null,
      },
    });

    res.status(201).json({ success: true, data: created, message: "Kategori berhasil ditambahkan" });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({ success: false, message: "Nama kategori sudah digunakan" });
    }
    res.status(500).json({ success: false, message: error?.message || "Gagal menambah kategori" });
  }
});

// GET /api/kategori/:id (Detail kategori)
app.get("/api/kategori/:id", requirePermission("dokumen.view"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID kategori tidak valid" });
    }

    const kategori = await prisma.lppmCategory.findUnique({ where: { id } });
    if (!kategori) {
      return res.status(404).json({ success: false, message: "Kategori tidak ditemukan" });
    }

    res.json({ success: true, data: kategori });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || "Gagal mengambil detail kategori" });
  }
});

// PUT /api/kategori/:id (Update kategori)
app.put("/api/kategori/:id", requirePermission("dokumen.edit"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID kategori tidak valid" });
    }

    const { nama, deskripsi } = req.body;
    const updateData: Record<string, unknown> = {};
    if (nama !== undefined) updateData.nama = String(nama).trim();
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi ? String(deskripsi).trim() : null;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: "Tidak ada field yang diubah" });
    }

    const updated = await prisma.lppmCategory.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, data: updated, message: "Kategori berhasil diperbarui" });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({ success: false, message: "Nama kategori sudah digunakan" });
    }
    if (error?.code === "P2025") {
      return res.status(404).json({ success: false, message: "Kategori tidak ditemukan" });
    }
    res.status(500).json({ success: false, message: error?.message || "Gagal memperbarui kategori" });
  }
});

// DELETE /api/kategori/:id (Hapus kategori)
app.delete("/api/kategori/:id", requirePermission("dokumen.delete"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID kategori tidak valid" });
    }

    await prisma.lppmCategory.delete({ where: { id } });
    res.json({ success: true, message: "Kategori berhasil dihapus" });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(404).json({ success: false, message: "Kategori tidak ditemukan" });
    }
    if (error?.code === "P2003") {
      return res.status(400).json({ success: false, message: "Kategori masih digunakan oleh dokumen. Hapus dokumen terlebih dahulu" });
    }
    res.status(500).json({ success: false, message: error?.message || "Gagal menghapus kategori" });
  }
});

// GET /api/prodi (Daftar prodi dari SSO One UNUSU Academic Hierarchy)
app.get("/api/prodi", async (_req: Request, res: Response) => {
  try {
    const ssoBase = SSO_BASE_URL;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const upstreamRes = await fetch(`${ssoBase}/api/academic/hierarchy`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (upstreamRes.ok) {
      const json = await upstreamRes.json() as { status?: boolean; data?: any[] };
      const faculties = Array.isArray(json.data) ? json.data : [];
      const prodiList: Array<{ id: number; code: string; name: string; degree: string; facultyName: string }> = [];
      for (const f of faculties) {
        if (Array.isArray(f.studyPrograms)) {
          for (const sp of f.studyPrograms) {
            prodiList.push({
              id: sp.id,
              code: sp.code,
              name: sp.name,
              degree: sp.degree || '',
              facultyName: f.name || '',
            });
          }
        }
      }
      return res.json({ success: true, data: prodiList });
    }
    return res.status(502).json({ success: false, message: "Gagal mengambil data dari SSO One UNUSU" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error?.message || "Kesalahan jaringan mengambil daftar prodi" });
  }
});

// GET /api/dokumen (Daftar dokumen + pagination + filter)
app.get("/api/dokumen", requirePermission("dokumen.view"), async (req: Request, res: Response) => {
  try {
    const skip = Math.max(0, Number(req.query.skip) || 0);
    const take = Math.min(100, Math.max(1, Number(req.query.take) || 10));
    const search = req.query.search ? String(req.query.search).trim() : "";
    const status = req.query.status ? String(req.query.status) : "";
    const tahun = req.query.tahun ? Number(req.query.tahun) : undefined;
    const tujuanPublish = req.query.tujuanPublish ? String(req.query.tujuanPublish) : undefined;
    const prodiCode = req.query.prodiCode ? String(req.query.prodiCode) : undefined;

    const where: any = {};
    if (search) {
      where.OR = [
        { judul: { contains: search } },
        { nomor: { contains: search } },
        { prodiName: { contains: search } },
      ];
    }
    if (status) where.status = status;
    if (tahun) where.tahun = tahun;
    if (tujuanPublish) where.tujuanPublish = tujuanPublish;
    if (prodiCode) where.prodiCode = prodiCode;

    const [total, dokumen] = await Promise.all([
      prisma.lppmDocument.count({ where }),
      prisma.lppmDocument.findMany({
        where,
        include: { kategori: true },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    res.json({
      success: true,
      data: dokumen,
      meta: { total, skip, take, pages: Math.ceil(total / take) },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || "Gagal mengambil daftar dokumen" });
  }
});

/**
 * POST /api/dokumen/berkas
 *
 * Menerima berkas PDF dan menyimpannya ke penyimpanan arsip, lalu
 * mengembalikan URL bertanda tangan yang siap diisi ke kolom `filePdfUrl`.
 *
 * Body dikirim sebagai JSON `{ nama, data }` dengan `data` berupa base64
 * TANPA awalan `data:`. Base64 hanya menjadi alat transportasi sekali jalan —
 * yang tersimpan di database tetap URL berkas, bukan isi PDF.
 */
app.post("/api/dokumen/berkas", requirePermission("dokumen.create"), async (req: Request, res: Response) => {
  try {
    const { nama, data } = req.body ?? {};

    if (!data || typeof data !== "string") {
      return res.status(400).json({ success: false, message: "Isi berkas PDF belum dikirim." });
    }

    // Perkiraan ukuran sebelum decoding agar tidak mengalokasikan buffer besar.
    const perkiraanByte = Math.floor((data.length * 3) / 4);
    if (perkiraanByte > ARSIP_MAX_BYTES) {
      return res.status(413).json({
        success: false,
        code: "ARSIP_FILE_TOO_LARGE",
        message: `Ukuran berkas melebihi batas ${Math.round(ARSIP_MAX_BYTES / (1024 * 1024))} MB.`,
      });
    }

    const buffer = Buffer.from(data, "base64");
    const hasil = await simpanBerkasArsip(buffer);

    res.status(201).json({
      success: true,
      message: "Berkas PDF berhasil disimpan.",
      data: { url: hasil.url, ukuran: hasil.ukuran, nama: typeof nama === "string" ? nama : null },
    });
  } catch (error: any) {
    const pesan = error?.message || "Berkas PDF gagal disimpan.";
    console.error("[POST /api/dokumen/berkas]", pesan);
    res.status(400).json({ success: false, message: pesan });
  }
});

// POST /api/dokumen (Tambah dokumen baru)
app.post("/api/dokumen", requirePermission("dokumen.create"), async (req: Request, res: Response) => {
  try {
    const {
      judul,
      nomor,
      kategoriId,
      tahun,
      tanggalDokumen,
      tanggalMulaiBerlaku,
      tanggalBerakhir,
      keterangan,
      filePdfUrl,
      fileSize,
      status,
      tujuanPublish,
      prodiCode,
      prodiName,
    } = req.body;

    if (!judul || typeof judul !== "string" || !judul.trim()) {
      return res.status(400).json({ success: false, message: "Judul dokumen wajib diisi" });
    }
    if (!kategoriId || !Number.isInteger(kategoriId)) {
      return res.status(400).json({ success: false, message: "Kategori wajib dipilih" });
    }
    if (!tahun || !Number.isInteger(tahun) || tahun < 2000 || tahun > 2100) {
      return res.status(400).json({ success: false, message: "Tahun dokumen tidak valid" });
    }

    // Verifikasi kategori ada
    const kategoriAda = await prisma.lppmCategory.findUnique({ where: { id: kategoriId } });
    if (!kategoriAda) {
      return res.status(404).json({ success: false, message: "Kategori tidak ditemukan" });
    }

    const created = await prisma.lppmDocument.create({
      data: {
        judul: judul.trim(),
        nomor: nomor && typeof nomor === "string" ? nomor.trim() : null,
        kategoriId,
        tahun,
        tanggalDokumen: tanggalDokumen ? new Date(tanggalDokumen) : null,
        tanggalMulaiBerlaku: tanggalMulaiBerlaku ? new Date(tanggalMulaiBerlaku) : null,
        tanggalBerakhir: tanggalBerakhir ? new Date(tanggalBerakhir) : null,
        keterangan: keterangan && typeof keterangan === "string" ? keterangan.trim() : null,
        filePdfUrl: filePdfUrl && typeof filePdfUrl === "string" ? filePdfUrl.trim() : null,
        fileSize: fileSize && Number.isInteger(fileSize) ? fileSize : null,
        status: (status && typeof status === "string" ? status : "Aktif").trim(),
        tujuanPublish: tujuanPublish === "prodi" ? "prodi" : "lppm",
        prodiCode: tujuanPublish === "prodi" && prodiCode ? String(prodiCode).trim() : null,
        prodiName: tujuanPublish === "prodi" && prodiName ? String(prodiName).trim() : null,
      },
      include: { kategori: true },
    });

    res.status(201).json({ success: true, data: created, message: "Dokumen berhasil ditambahkan" });
  } catch (error: any) {
    console.error("[dokumen] gagal menambah dokumen:", error);
    res.status(500).json({
      success: false,
      code: "DOKUMEN_SIMPAN_GAGAL",
      message:
        "Server gagal menyimpan dokumen ke basis data. Detail teknis telah dicatat pada log server.",
    });
  }
});

// GET /api/dokumen/:id (Detail dokumen)
app.get("/api/dokumen/:id", requirePermission("dokumen.view"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID dokumen tidak valid" });
    }

    const dokumen = await prisma.lppmDocument.findUnique({
      where: { id },
      include: { kategori: true },
    });
    if (!dokumen) {
      return res.status(404).json({ success: false, message: "Dokumen tidak ditemukan" });
    }

    res.json({ success: true, data: dokumen });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error?.message || "Gagal mengambil detail dokumen" });
  }
});

// PUT /api/dokumen/:id (Update dokumen)
app.put("/api/dokumen/:id", requirePermission("dokumen.edit"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID dokumen tidak valid" });
    }

    const {
      judul,
      nomor,
      kategoriId,
      tahun,
      tanggalDokumen,
      tanggalMulaiBerlaku,
      tanggalBerakhir,
      keterangan,
      filePdfUrl,
      fileSize,
      status,
      tujuanPublish,
      prodiCode,
      prodiName,
    } = req.body;

    const updateData: Record<string, unknown> = {};
    if (judul !== undefined) updateData.judul = String(judul).trim();
    if (nomor !== undefined) updateData.nomor = nomor ? String(nomor).trim() : null;
    if (kategoriId !== undefined) updateData.kategoriId = kategoriId;
    if (tahun !== undefined) updateData.tahun = tahun;
    if (tanggalDokumen !== undefined) updateData.tanggalDokumen = tanggalDokumen ? new Date(tanggalDokumen) : null;
    if (tanggalMulaiBerlaku !== undefined) updateData.tanggalMulaiBerlaku = tanggalMulaiBerlaku ? new Date(tanggalMulaiBerlaku) : null;
    if (tanggalBerakhir !== undefined) updateData.tanggalBerakhir = tanggalBerakhir ? new Date(tanggalBerakhir) : null;
    if (keterangan !== undefined) updateData.keterangan = keterangan ? String(keterangan).trim() : null;
    if (filePdfUrl !== undefined) updateData.filePdfUrl = filePdfUrl ? String(filePdfUrl).trim() : null;
    if (fileSize !== undefined) updateData.fileSize = fileSize && Number.isInteger(fileSize) ? fileSize : null;
    if (status !== undefined) updateData.status = String(status).trim();
    if (tujuanPublish !== undefined) {
      updateData.tujuanPublish = tujuanPublish === "prodi" ? "prodi" : "lppm";
      if (tujuanPublish === "prodi") {
        updateData.prodiCode = prodiCode ? String(prodiCode).trim() : null;
        updateData.prodiName = prodiName ? String(prodiName).trim() : null;
      } else {
        updateData.prodiCode = null;
        updateData.prodiName = null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: "Tidak ada field yang diubah" });
    }

    // Verifikasi kategori jika diubah
    if (kategoriId) {
      const kategoriAda = await prisma.lppmCategory.findUnique({ where: { id: kategoriId } });
      if (!kategoriAda) {
        return res.status(404).json({ success: false, message: "Kategori tidak ditemukan" });
      }
    }

    const updated = await prisma.lppmDocument.update({
      where: { id },
      data: updateData,
      include: { kategori: true },
    });

    res.json({ success: true, data: updated, message: "Dokumen berhasil diperbarui" });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(404).json({ success: false, message: "Dokumen tidak ditemukan" });
    }
    console.error("[dokumen] gagal memperbarui dokumen:", error);
    res.status(500).json({
      success: false,
      code: "DOKUMEN_PERBARUI_GAGAL",
      message:
        "Server gagal memperbarui dokumen pada basis data. Detail teknis telah dicatat pada log server.",
    });
  }
});

// DELETE /api/dokumen/:id (Hapus dokumen)
app.delete("/api/dokumen/:id", requirePermission("dokumen.delete"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: "ID dokumen tidak valid" });
    }

    await prisma.lppmDocument.delete({ where: { id } });
    res.json({ success: true, message: "Dokumen berhasil dihapus" });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(404).json({ success: false, message: "Dokumen tidak ditemukan" });
    }
    console.error("[dokumen] gagal menghapus dokumen:", error);
    res.status(500).json({
      success: false,
      code: "DOKUMEN_HAPUS_GAGAL",
      message:
        "Server gagal menghapus dokumen dari basis data. Detail teknis telah dicatat pada log server.",
    });
  }
});

// ===========================================================================
// MONEV SURVEI & PERIODE DINAMIS API
// ===========================================================================

// GET /api/monev-survei/periode (Daftar semua periode untuk master)
app.get("/api/monev-survei/periode", requirePermission("monev.survei.manage"), async (_req: Request, res: Response) => {
  try {
    const list = await prisma.monevPeriode.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        _count: {
          select: { surveiList: true, responList: true },
        },
      },
    });
    res.json({ success: true, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal mengambil daftar periode monev: " + (error?.message || "") });
  }
});

// POST /api/monev-survei/periode (Buat periode baru)
app.post("/api/monev-survei/periode", requirePermission("monev.survei.manage"), async (req: Request, res: Response) => {
  try {
    const { kode, nama, tahunAkademik, semester, tanggalMulai, tanggalSelesai, status, deskripsi } = req.body;
    if (!kode || !nama || !tahunAkademik || !semester) {
      return res.status(400).json({ success: false, message: "Kode, nama, tahun akademik, dan semester wajib diisi" });
    }

    const created = await prisma.monevPeriode.create({
      data: {
        kode: String(kode).trim().toUpperCase(),
        nama: String(nama).trim(),
        tahunAkademik: String(tahunAkademik).trim(),
        semester: String(semester).trim(),
        tanggalMulai: tanggalMulai ? new Date(tanggalMulai) : null,
        tanggalSelesai: tanggalSelesai ? new Date(tanggalSelesai) : null,
        status: status || "DRAFT",
        deskripsi: deskripsi?.trim() || null,
      },
    });

    res.status(201).json({ success: true, data: created, message: "Periode monev berhasil dibuat" });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({ success: false, message: "Kode periode sudah digunakan" });
    }
    res.status(500).json({ success: false, message: "Gagal membuat periode: " + (error?.message || "") });
  }
});

// PUT /api/monev-survei/periode/:id (Update periode)
app.put("/api/monev-survei/periode/:id", requirePermission("monev.survei.manage"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { nama, tahunAkademik, semester, tanggalMulai, tanggalSelesai, status, deskripsi } = req.body;

    const updated = await prisma.monevPeriode.update({
      where: { id },
      data: {
        nama: nama ? String(nama).trim() : undefined,
        tahunAkademik: tahunAkademik ? String(tahunAkademik).trim() : undefined,
        semester: semester ? String(semester).trim() : undefined,
        tanggalMulai: tanggalMulai !== undefined ? (tanggalMulai ? new Date(tanggalMulai) : null) : undefined,
        tanggalSelesai: tanggalSelesai !== undefined ? (tanggalSelesai ? new Date(tanggalSelesai) : null) : undefined,
        status: status || undefined,
        deskripsi: deskripsi !== undefined ? (deskripsi ? String(deskripsi).trim() : null) : undefined,
      },
    });

    res.json({ success: true, data: updated, message: "Periode berhasil diperbarui" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal memperbarui periode: " + (error?.message || "") });
  }
});

// GET /api/monev-survei/aktif (Katalog kuesioner yang sedang aktif untuk diisi mahasiswa/dosen)
app.get("/api/monev-survei/aktif", async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user;
    const periodeAktif = await prisma.monevPeriode.findFirst({
      where: { status: "AKTIF" },
      orderBy: { id: "desc" },
    });

    if (!periodeAktif) {
      return res.json({ success: true, periode: null, data: [] });
    }

    const surveiList = await prisma.monevSurvei.findMany({
      where: {
        periodeId: periodeAktif.id,
        aktif: true,
      },
      orderBy: [{ urutan: "asc" }, { id: "asc" }],
      include: {
        _count: {
          select: { pertanyaanList: true, responList: true },
        },
      },
    });

    // Periksa status pengisian user ini jika user sedang login
    const secretHash = process.env.JWT_SECRET || "monev-hash-secret";
    const daftarStatus = await Promise.all(
      surveiList.map(async (s) => {
        let sudah: { id: number; createdAt: Date } | null = null;
        if (user && (user.id || user.username)) {
          const rawHash = `${user.id || user.username}:${periodeAktif.id}:${s.id}:${secretHash}`;
          const respondenHash = crypto.createHash("sha256").update(rawHash).digest("hex");
          sudah = await prisma.monevRespon.findUnique({
            where: {
              surveiId_respondenHash: {
                surveiId: s.id,
                respondenHash,
              },
            },
            select: { id: true, createdAt: true },
          });
        }

        return {
          id: s.id,
          kode: s.kode,
          judul: s.judul,
          deskripsi: s.deskripsi,
          targetAudiens: s.targetAudiens,
          urutan: s.urutan,
          totalPertanyaan: s._count.pertanyaanList,
          totalRespon: s._count.responList,
          sudahMengisi: Boolean(sudah),
          tanggalMengisi: sudah?.createdAt || null,
        };
      })
    );

    res.json({
      success: true,
      periode: periodeAktif,
      data: daftarStatus,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal mengambil kuesioner aktif: " + (error?.message || "") });
  }
});

// GET /api/monev-survei/kategori (Semua instrumen/kategori survei monev untuk manajemen admin)
app.get("/api/monev-survei/kategori", requirePermission("monev.survei.manage"), async (req: Request, res: Response) => {
  try {
    const { periodeId } = req.query;
    const where: any = {};
    if (periodeId) {
      where.periodeId = Number(periodeId);
    }

    const list = await prisma.monevSurvei.findMany({
      where,
      orderBy: [{ periodeId: "desc" }, { urutan: "asc" }, { id: "asc" }],
      include: {
        periode: true,
        _count: {
          select: { pertanyaanList: true, responList: true },
        },
      },
    });

    res.json({ success: true, data: list });
  } catch (error: any) {
    console.error("ERROR /api/monev-survei/kategori:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil kategori monev: " + (error?.message || "") });
  }
});

// POST /api/monev-survei/kategori (Buat kategori survei baru)
app.post("/api/monev-survei/kategori", requirePermission("monev.survei.manage"), async (req: Request, res: Response) => {
  try {
    const { periodeId, kode, judul, deskripsi, targetAudiens, aktif, urutan } = req.body;
    if (!periodeId || !kode || !judul) {
      return res.status(400).json({ success: false, message: "Periode, kode, dan judul kuesioner wajib diisi" });
    }

    const created = await prisma.monevSurvei.create({
      data: {
        periodeId: Number(periodeId),
        kode: String(kode).trim().toUpperCase(),
        judul: String(judul).trim(),
        deskripsi: deskripsi ? String(deskripsi).trim() : null,
        targetAudiens: targetAudiens || "MAHASISWA",
        aktif: aktif !== undefined ? Boolean(aktif) : true,
        urutan: urutan ? Number(urutan) : 0,
      },
      include: { periode: true },
    });

    res.status(201).json({ success: true, data: created, message: "Kategori instrumen monev berhasil dibuat" });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({ success: false, message: "Kode survei sudah digunakan pada periode ini" });
    }
    res.status(500).json({ success: false, message: "Gagal membuat kategori monev: " + (error?.message || "") });
  }
});

// PUT /api/monev-survei/kategori/:id (Update kategori survei)
app.put("/api/monev-survei/kategori/:id", requirePermission("monev.survei.manage"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { judul, deskripsi, targetAudiens, aktif, urutan } = req.body;

    const updated = await prisma.monevSurvei.update({
      where: { id },
      data: {
        judul: judul ? String(judul).trim() : undefined,
        deskripsi: deskripsi !== undefined ? (deskripsi ? String(deskripsi).trim() : null) : undefined,
        targetAudiens: targetAudiens || undefined,
        aktif: aktif !== undefined ? Boolean(aktif) : undefined,
        urutan: urutan !== undefined ? Number(urutan) : undefined,
      },
      include: { periode: true },
    });

    res.json({ success: true, data: updated, message: "Kategori monev berhasil diperbarui" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal memperbarui kategori monev: " + (error?.message || "") });
  }
});

// GET /api/monev-survei/pertanyaan (Daftar semua soal monev per survei)
app.get("/api/monev-survei/pertanyaan", requirePermission("monev.survei.manage"), async (req: Request, res: Response) => {
  try {
    const { surveiId } = req.query;
    const where: any = {};
    if (surveiId) {
      where.surveiId = Number(surveiId);
    }

    const list = await prisma.monevPertanyaan.findMany({
      where,
      orderBy: [{ surveiId: "asc" }, { urutan: "asc" }, { id: "asc" }],
      include: {
        survei: {
          include: { periode: true },
        },
        _count: {
          select: { jawabanList: true },
        },
      },
    });

    res.json({ success: true, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal mengambil daftar soal monev: " + (error?.message || "") });
  }
});

// POST /api/monev-survei/pertanyaan (Tambah butir soal/pertanyaan baru)
app.post("/api/monev-survei/pertanyaan", requirePermission("monev.survei.manage"), async (req: Request, res: Response) => {
  try {
    const { surveiId, seksi, kode, teks, tipe, wajib, urutan } = req.body;
    if (!surveiId || !teks) {
      return res.status(400).json({ success: false, message: "Survei dan teks pertanyaan wajib diisi" });
    }

    const created = await prisma.monevPertanyaan.create({
      data: {
        surveiId: Number(surveiId),
        seksi: seksi ? String(seksi).trim() : null,
        kode: kode ? String(kode).trim() : null,
        teks: String(teks).trim(),
        tipe: tipe || "SKALA_5",
        wajib: wajib !== undefined ? Boolean(wajib) : true,
        urutan: urutan ? Number(urutan) : 0,
      },
      include: { survei: true },
    });

    res.status(201).json({ success: true, data: created, message: "Butir soal berhasil ditambahkan" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal menambah butir soal: " + (error?.message || "") });
  }
});

// PUT /api/monev-survei/pertanyaan/:id (Update butir soal/pertanyaan)
app.put("/api/monev-survei/pertanyaan/:id", requirePermission("monev.survei.manage"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { seksi, kode, teks, tipe, wajib, urutan } = req.body;

    const updated = await prisma.monevPertanyaan.update({
      where: { id },
      data: {
        seksi: seksi !== undefined ? (seksi ? String(seksi).trim() : null) : undefined,
        kode: kode !== undefined ? (kode ? String(kode).trim() : null) : undefined,
        teks: teks ? String(teks).trim() : undefined,
        tipe: tipe || undefined,
        wajib: wajib !== undefined ? Boolean(wajib) : undefined,
        urutan: urutan !== undefined ? Number(urutan) : undefined,
      },
      include: { survei: true },
    });

    res.json({ success: true, data: updated, message: "Butir soal berhasil diperbarui" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal memperbarui soal: " + (error?.message || "") });
  }
});

// DELETE /api/monev-survei/pertanyaan/:id (Hapus butir soal)
app.delete("/api/monev-survei/pertanyaan/:id", requirePermission("monev.survei.manage"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.monevPertanyaan.delete({ where: { id } });
    res.json({ success: true, message: "Butir soal berhasil dihapus" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal menghapus soal: " + (error?.message || "") });
  }
});

// GET /api/monev-survei/responden (Daftar responden/respon yang sudah mengisi)
app.get("/api/monev-survei/responden", requirePermission("monev.survei.manage"), async (req: Request, res: Response) => {
  try {
    const { periodeId, surveiId, page = "1", limit = "20" } = req.query;
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {};
    if (periodeId) where.periodeId = Number(periodeId);
    if (surveiId) where.surveiId = Number(surveiId);

    const [total, list] = await Promise.all([
      prisma.monevRespon.count({ where }),
      prisma.monevRespon.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          periode: true,
          survei: true,
          _count: {
            select: { jawabanList: true },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: list,
      meta: {
        total,
        page: Number(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal mengambil daftar responden: " + (error?.message || "") });
  }
});

// GET /api/monev-survei/responden/:id (Detail jawaban spesifik satu responden)
app.get("/api/monev-survei/responden/:id", requirePermission("monev.survei.manage"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const respon = await prisma.monevRespon.findUnique({
      where: { id },
      include: {
        periode: true,
        survei: true,
        jawabanList: {
          include: {
            pertanyaan: true,
          },
          orderBy: { pertanyaan: { urutan: "asc" } },
        },
      },
    });

    if (!respon) {
      return res.status(404).json({ success: false, message: "Data respon tidak ditemukan" });
    }

    res.json({ success: true, data: respon });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal mengambil detail jawaban responden: " + (error?.message || "") });
  }
});

// GET /api/monev-survei/:id (Detail formulir kuesioner & pertanyaan)
app.get("/api/monev-survei/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID kuesioner tidak valid" });
    }
    const survei = await prisma.monevSurvei.findUnique({
      where: { id },
      include: {
        periode: true,
        pertanyaanList: {
          orderBy: [{ urutan: "asc" }, { id: "asc" }],
        },
      },
    });

    if (!survei) {
      return res.status(404).json({ success: false, message: "Survei monev tidak ditemukan" });
    }

    res.json({ success: true, data: survei });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal mengambil detail kuesioner: " + (error?.message || "") });
  }
});

// POST /api/monev-survei/:id/submit (Kirim respon kuesioner oleh mahasiswa/responden - ANONIM)
app.post("/api/monev-survei/:id/submit", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID kuesioner tidak valid" });
    }
    const user = (req as AuthRequest).user;
    const { demografi, jawaban } = req.body;

    const survei = await prisma.monevSurvei.findUnique({
      where: { id },
      include: { periode: true },
    });

    if (!survei || !survei.aktif) {
      return res.status(400).json({ success: false, message: "Survei tidak aktif atau tidak ditemukan" });
    }
    if (survei.periode.status !== "AKTIF") {
      return res.status(400).json({ success: false, message: "Periode monev ini sudah ditutup" });
    }

    // Token anonim: Hash kombinasi rahasia
    // Bila mahasiswa belum login, gunakan IP & User-Agent sebagai seed anonim fallback
    const userIdentifier = user?.id || user?.username || req.ip || req.headers["user-agent"] || "anonymous";
    const secretHash = process.env.JWT_SECRET || "monev-hash-secret";
    const rawHash = `${userIdentifier}:${survei.periodeId}:${survei.id}:${secretHash}`;
    const respondenHash = crypto.createHash("sha256").update(rawHash).digest("hex");

    // Periksa apakah sudah pernah mengisi
    const cek = await prisma.monevRespon.findUnique({
      where: {
        surveiId_respondenHash: {
          surveiId: survei.id,
          respondenHash,
        },
      },
    });

    if (cek) {
      return res.status(409).json({
        success: false,
        message: "Anda sudah pernah mengisi kuesioner survei ini untuk periode berjalan.",
      });
    }

    if (!Array.isArray(jawaban) || jawaban.length === 0) {
      return res.status(400).json({ success: false, message: "Daftar jawaban tidak boleh kosong" });
    }

    // Simpan respon dan rincian jawaban dalam 1 transaksi
    await prisma.$transaction(async (tx) => {
      const responBaru = await tx.monevRespon.create({
        data: {
          periodeId: survei.periodeId,
          surveiId: survei.id,
          respondenHash,
          prodi: demografi?.prodi || user?.prodi || null,
          fakultas: demografi?.fakultas || user?.fakultas || null,
          semester: demografi?.semester ? String(demografi.semester) : null,
          mataKuliah: demografi?.mataKuliah || null,
          dosenPengampu: demografi?.dosenPengampu || null,
        },
      });

      for (const j of jawaban) {
        if (!j.pertanyaanId) continue;
        await tx.monevJawaban.create({
          data: {
            responId: responBaru.id,
            pertanyaanId: Number(j.pertanyaanId),
            nilaiSkala: j.nilaiSkala !== undefined && j.nilaiSkala !== null ? Number(j.nilaiSkala) : null,
            nilaiTeks: j.nilaiTeks !== undefined && j.nilaiTeks !== null ? String(j.nilaiTeks) : null,
          },
        });
      }
    });

    res.json({
      success: true,
      message: "Terima kasih! Kuesioner evaluasi dan masukan Anda berhasil tersimpan secara anonim.",
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({ success: false, message: "Anda sudah pernah mengisi survei ini." });
    }
    res.status(500).json({ success: false, message: "Gagal menyimpan jawaban: " + (error?.message || "") });
  }
});

// GET /api/monev-survei/:id/rekap (Rekapitulasi statistik hasil survei untuk Admin)
app.get("/api/monev-survei/:id/rekap", requirePermission("monev.survei.manage"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: "ID kuesioner tidak valid" });
    }
    const survei = await prisma.monevSurvei.findUnique({
      where: { id },
      include: {
        periode: true,
        pertanyaanList: {
          orderBy: [{ urutan: "asc" }, { id: "asc" }],
        },
      },
    });

    if (!survei) {
      return res.status(404).json({ success: false, message: "Survei tidak ditemukan" });
    }

    const totalRespon = await prisma.monevRespon.count({
      where: { surveiId: id },
    });

    // Agregasi jawaban per pertanyaan
    const hasilPertanyaan = await Promise.all(
      survei.pertanyaanList.map(async (p) => {
        if (p.tipe === "SKALA_5") {
          const jawabanSkala = await prisma.monevJawaban.findMany({
            where: { pertanyaanId: p.id, nilaiSkala: { not: null } },
            select: { nilaiSkala: true },
          });

          const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          let totalNilai = 0;
          for (const row of jawabanSkala) {
            const v = row.nilaiSkala || 0;
            if (v >= 1 && v <= 5) {
              counts[v] = (counts[v] || 0) + 1;
              totalNilai += v;
            }
          }
          const rerata = jawabanSkala.length > 0 ? Number((totalNilai / jawabanSkala.length).toFixed(2)) : 0;

          return {
            id: p.id,
            seksi: p.seksi,
            teks: p.teks,
            tipe: p.tipe,
            totalJawaban: jawabanSkala.length,
            rerata,
            distribusi: counts,
          };
        } else {
          // Esai atau teks: ambil 25 jawaban teks terbaru
          const jawabanTeks = await prisma.monevJawaban.findMany({
            where: { pertanyaanId: p.id, nilaiTeks: { not: null } },
            select: { nilaiTeks: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 30,
          });

          return {
            id: p.id,
            seksi: p.seksi,
            teks: p.teks,
            tipe: p.tipe,
            totalJawaban: jawabanTeks.length,
            daftarJawaban: jawabanTeks.map((j) => j.nilaiTeks).filter(Boolean),
          };
        }
      })
    );

    res.json({
      success: true,
      survei: {
        id: survei.id,
        judul: survei.judul,
        kode: survei.kode,
        targetAudiens: survei.targetAudiens,
        periode: survei.periode.nama,
        totalRespon,
      },
      data: hasilPertanyaan,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Gagal mengambil rekap: " + (error?.message || "") });
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

  /**
   * Migrasi dokumen lama yang masih menyimpan PDF sebagai base64.
   * Dijalankan setelah server siap; kegagalannya tidak menghentikan server.
   */
  void jalankanMigrasiArsip({
    label: "lppm_documents",
    ambilBase64: () =>
      prisma.lppmDocument.findMany({
        where: { filePdfUrl: { startsWith: "data:" } },
        select: { id: true, filePdfUrl: true },
      }),
    simpanUrl: (id, url, ukuran) =>
      prisma.lppmDocument.update({ where: { id }, data: { filePdfUrl: url, fileSize: ukuran } }),
  }).catch((error) => {
    // Tabel belum ada (database belum di-push) adalah kondisi normal pada
    // instalasi baru; migrasi akan berjalan sendiri pada start berikutnya.
    console.error("[arsip-migrasi] lppm_documents dilewati:", error?.message ?? error);
  });
});

