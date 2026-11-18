/**
 * Otorisasi LPPM UNUSU — BERBASIS KEANGGOTAAN
 * -------------------------------------------
 * Panel LPPM memiliki tabel pengguna dan peran sendiri (`lppm_users` +
 * `lppm_users_roles`). Keanggotaan di tabel itulah SATU-SATUNYA alasan
 * seseorang dapat masuk, dan hanya Admin LPPM yang dapat menambahkannya —
 * pengguna dipilih dari direktori ONE UNUSU, tidak pernah dibuat otomatis.
 *
 * Modul ini TIDAK menebak akses dari nama peran SSO. Nama peran kampus
 * (`ADMIN_LPPM`, `DOSEN`, ...) hanya metadata tampilan. Satu-satunya pengecualian
 * adalah SUPERADMIN ekosistem, yang selalu diloloskan sebagai jaring pengaman.
 *
 * Izin fitur diturunkan server dari peran lokal LPPM dan ikut dikirim pada
 * sesi, sehingga UI tidak perlu menebak apa pun.
 */

/** Identitas aplikasi ini pada gateway SSO ONE UNUSU. */
export const APP_SCOPE = 'lppm' as const;
export const APP_NAME = 'LPPM UNUSU';
export const APP_FULL_NAME = 'Lembaga Penelitian & Pengabdian kepada Masyarakat';

// ===========================================================================
// TINGKAT AKSES
// ===========================================================================

/**
 * Tingkat akses panel LPPM.
 *
 * Nilainya ditentukan SERVER dari peran lokal pengguna, bukan dari izin masuk
 * global (izin `masuk_*` sudah dihapus dari model akses).
 */
export type TingkatMasuk = 'admin' | 'dosen' | 'reviewer' | 'mahasiswa';

export const LABEL_TINGKAT: Record<TingkatMasuk, string> = {
  admin: 'Administrator LPPM',
  dosen: 'Dosen Peneliti & Pengabdi',
  reviewer: 'Reviewer Proposal',
  mahasiswa: 'Mahasiswa',
};

/** Izin fitur yang sering dipakai UI. */
export const IZIN_FITUR = {
  penelitianLihat: 'penelitian.view',
  penelitianBuat: 'penelitian.create',
  penelitianUbah: 'penelitian.edit',
  penelitianHapus: 'penelitian.delete',
  penelitianReview: 'penelitian.review',
  pengabdianLihat: 'pengabdian.view',
  pengabdianBuat: 'pengabdian.create',
  pengabdianUbah: 'pengabdian.edit',
  pengabdianHapus: 'pengabdian.delete',
  pengabdianReview: 'pengabdian.review',
  publikasiLihat: 'publikasi.view',
  publikasiBuat: 'publikasi.create',
  publikasiUbah: 'publikasi.edit',
  publikasiHapus: 'publikasi.delete',
  monevLihat: 'monev.view',
  monevBuat: 'monev.create',
  monevKelola: 'monev.manage',
  monevReview: 'monev.review',
  monevSurveiLihat: 'monev.survei.view',
  monevSurveiKelola: 'monev.survei.manage',

  peranLihat: 'roles.view',
  peranKelola: 'roles.manage',
  izinLihat: 'permissions.view',
  izinKelola: 'permissions.manage',
  penggunaLihat: 'users.view',
  penggunaKelola: 'users.manage',
  laporanLihat: 'laporan.view',
  laporanEkspor: 'laporan.export',
  dokumenLihat: 'dokumen.view',
  dokumenBuat: 'dokumen.create',
  dokumenUbah: 'dokumen.edit',
  dokumenHapus: 'dokumen.delete',
  dokumenKelola: 'dokumen.manage',
} as const;

/** Label peran SSO — hanya untuk pesan/tampilan, tidak untuk otorisasi. */
export const SSO_ROLE_LABEL: Record<string, string> = {
  SUPERADMIN: 'Superadmin',
  ADMIN_LPPM: 'Admin LPPM',
  ADMIN_LPM: 'Admin LPM',
  ADMIN_ESURAT: 'Admin E-Surat',
  ADMIN_SARPRAS: 'Admin Sarpras',
  ADMIN_AKREDITASI: 'Admin Akreditasi',
  ADMIN_LMS: 'Admin LMS',
  ADMIN_SSO: 'Admin ONE UNUSU',
  DOSEN: 'Dosen',
  MAHASISWA: 'Mahasiswa',
  REVIEWER: 'Reviewer',
};

// ===========================================================================
// SUBJEK AKSES
// ===========================================================================

/** Struktur minimal yang dibutuhkan untuk mengevaluasi akses. */
export interface AccessSubject {
  role?: string | null;
  ssoRole?: string | null;
  app?: string | null;
  izin?: string[] | null;
  tingkat?: string | null;
  appAccess?: { allowed: boolean; reason: string; tingkat: string | null; izin: string[] } | null;
}

/** Daftar izin subjek — dari server, bukan diturunkan dari nama peran. */
export function izinDari(subject?: AccessSubject | null): string[] {
  if (!subject) return [];
  if (Array.isArray(subject.izin)) return subject.izin;
  if (Array.isArray(subject.appAccess?.izin)) return subject.appAccess.izin;
  return [];
}

/** Apakah subjek memegang SEMUA kunci izin yang diminta. */
export function bisa(subject: AccessSubject | null | undefined, ...kunci: string[]): boolean {
  if (!subject || kunci.length === 0) return false;
  if ((subject.ssoRole ?? '').toUpperCase() === 'SUPERADMIN') return true;
  const dimiliki = new Set(izinDari(subject));
  return kunci.every((k) => dimiliki.has(k));
}

/** Apakah subjek memegang SALAH SATU kunci izin yang diminta. */
export function bisaSalahSatu(subject: AccessSubject | null | undefined, ...kunci: string[]): boolean {
  if (!subject || kunci.length === 0) return false;
  if ((subject.ssoRole ?? '').toUpperCase() === 'SUPERADMIN') return true;
  const dimiliki = new Set(izinDari(subject));
  return kunci.some((k) => dimiliki.has(k));
}

/**
 * Tingkat akses tertinggi.
 *
 * Server selalu memilih tingkat tertinggi, jadi urutannya penting: admin
 * menang atas dosen, dosen menang atas reviewer, dan seterusnya.
 */
export function tingkatDari(subject?: AccessSubject | null): TingkatMasuk | null {
  if (!subject) return null;
  if (subject.tingkat && subject.tingkat in LABEL_TINGKAT) {
    return subject.tingkat as TingkatMasuk;
  }
  return null;
}

export function punyaIzinMasuk(subject?: AccessSubject | null): boolean {
  return tingkatDari(subject) !== null;
}

/** Admin LPPM: pemegang peran admin lokal. */
export function isAdminLppm(subject?: AccessSubject | null): boolean {
  return tingkatDari(subject) === 'admin';
}

/** Superadmin ekosistem — diloloskan server sebagai jaring pengaman. */
export function isSuperadmin(subject?: AccessSubject | null): boolean {
  return (subject?.ssoRole ?? '').toUpperCase() === 'SUPERADMIN';
}

export function isDosenPeneliti(subject?: AccessSubject | null): boolean {
  return bisa(subject, IZIN_FITUR.penelitianBuat);
}

export function canManageSystem(subject?: AccessSubject | null): boolean {
  return bisa(subject, IZIN_FITUR.peranKelola, IZIN_FITUR.izinKelola);
}

// ===========================================================================
// KEPUTUSAN AKSES PANEL
// ===========================================================================

export type AccessDenialCode =
  | 'unauthenticated'
  | 'not-registered'
  | 'inactive-account'
  | 'no-role'
  | 'role-not-allowed'
  | 'invalid-scope';

export interface AccessDecision {
  allowed: boolean;
  code?: AccessDenialCode;
  title?: string;
  message?: string;
}

export function labelForSsoRole(ssoRole?: string | null): string {
  if (!ssoRole) return 'Pengguna';
  return SSO_ROLE_LABEL[ssoRole] ?? ssoRole;
}

/**
 * Putusan akses panel.
 *
 * Sumber utamanya `appAccess` dari server (dihitung dari keanggotaan pengguna
 * di tabel LPPM). Tanpa data itu, akses DITOLAK — fail-closed.
 */
export function evaluatePanelAccess(subject?: AccessSubject | null): AccessDecision {
  if (!subject) {
    return {
      allowed: false,
      code: 'unauthenticated',
      title: 'Sesi tidak ditemukan',
      message: 'Silakan masuk terlebih dahulu melalui gerbang SSO ONE UNUSU.',
    };
  }

  if (subject.app && subject.app !== APP_SCOPE) {
    return {
      allowed: false,
      code: 'invalid-scope',
      title: 'Sesi milik aplikasi lain',
      message: `Sesi ini diterbitkan untuk aplikasi "${subject.app}", bukan ${APP_NAME}. Silakan masuk ulang melalui ${APP_NAME}.`,
    };
  }

  // Server sudah memutuskan — hormati putusannya.
  if (subject.appAccess) {
    if (subject.appAccess.allowed) return { allowed: true };

    switch (subject.appAccess.reason) {
      case 'not_registered':
        return {
          allowed: false,
          code: 'not-registered',
          title: 'Akun belum terdaftar di LPPM',
          message:
            'Akun ONE UNUSU Anda belum didaftarkan sebagai pengguna panel LPPM. Minta Admin LPPM mendaftarkan akun Anda melalui menu Manajemen Pengguna.',
        };
      case 'inactive_account':
        return {
          allowed: false,
          code: 'inactive-account',
          title: 'Akun LPPM sedang nonaktif',
          message:
            'Akun LPPM Anda sedang dinonaktifkan. Minta Admin LPPM mengaktifkan kembali sebelum mencoba masuk lagi.',
        };
      case 'no_role':
        return {
          allowed: false,
          code: 'no-role',
          title: 'Peran LPPM belum ditetapkan',
          message:
            'Akun Anda sudah terdaftar, tetapi belum diberi peran. Tanpa peran, tidak ada izin fitur yang bisa dipakai.',
        };
      default:
        return {
          allowed: false,
          code: 'role-not-allowed',
          title: 'Akses panel LPPM ditolak',
          message:
            'Akun Anda belum memiliki akses ke panel LPPM. Hubungi Admin LPPM untuk penyesuaian peran.',
        };
    }
  }

  if (punyaIzinMasuk(subject)) return { allowed: true };

  return {
    allowed: false,
    code: 'not-registered',
    title: 'Akun belum terdaftar di LPPM',
    message:
      'Akun ONE UNUSU Anda belum didaftarkan sebagai pengguna panel LPPM. Minta Admin LPPM mendaftarkan akun Anda.',
  };
}

export function canAccessLppmPanel(subject?: AccessSubject | null): boolean {
  return evaluatePanelAccess(subject).allowed;
}

/** Label ringkas untuk badge peran pada topbar/sidebar. */
export function roleBadgeLabel(subject?: AccessSubject | null): string {
  if (!subject) return 'Tamu';
  const tingkat = tingkatDari(subject);
  if (tingkat) return LABEL_TINGKAT[tingkat];
  if (isSuperadmin(subject)) return 'Superadmin';
  return 'Belum Terdaftar';
}

export const ACCESS_DENIED_PATH = '/akses-ditolak';

/** URL halaman penolakan akses beserta konteks yang dapat dibaca halaman itu. */
export function accessDeniedUrl(options?: {
  from?: string;
  reason?: AccessDenialCode;
  role?: string | null;
  app?: string | null;
}): string {
  const params = new URLSearchParams();
  if (options?.from) params.set('from', options.from);
  if (options?.reason) params.set('reason', options.reason);
  if (options?.role) params.set('role', options.role);
  if (options?.app) params.set('app', options.app);
  const query = params.toString();
  return query ? `${ACCESS_DENIED_PATH}?${query}` : ACCESS_DENIED_PATH;
}
