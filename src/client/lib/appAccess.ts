/**
 * Otorisasi LPPM UNUSU — BERBASIS IZIN, SUMBERNYA SSO
 * ---------------------------------------------------
 * Modul ini TIDAK memutuskan akses dari nama peran. Nama peran SSO
 * (`ADMIN_LPPM`, `DOSEN`, ...) hanya metadata tampilan: ia tidak membuktikan
 * apa pun tentang hak seseorang, dan admin aplikasi lain bisa memilikinya.
 *
 * Yang menentukan adalah daftar KUNCI IZIN yang dibawa sesi. Izin itu berasal
 * dari ONE UNUSU — tempat pengguna, peran, dan pemetaan peran -> izin dikelola
 * (`permissions` + `role_permissions`). LPPM tidak menyimpan salinannya.
 *
 * Karena izin ikut saat login, mencabut izin di panel SSO berlaku pada login
 * berikutnya, bukan seketika pada token yang sudah terbit.
 */

/** Identitas aplikasi ini pada gateway SSO ONE UNUSU. */
export const APP_SCOPE = 'lppm' as const;
export const APP_NAME = 'LPPM UNUSU';
export const APP_FULL_NAME = 'Lembaga Penelitian & Pengabdian kepada Masyarakat';

// ===========================================================================
// KUNCI IZIN
// ===========================================================================

/** Izin masuk panel, satu per tingkat. */
export const IZIN_MASUK = {
  admin: 'lppm-unusu:masuk_admin',
  dosen: 'lppm-unusu:masuk_dosen',
  reviewer: 'lppm-unusu:masuk_reviewer',
  mahasiswa: 'lppm-unusu:masuk_mahasiswa',
} as const;

export type TingkatMasuk = keyof typeof IZIN_MASUK;

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

  peranLihat: 'roles.view',
  peranKelola: 'roles.manage',
  izinLihat: 'permissions.view',
  izinKelola: 'permissions.manage',
  laporanLihat: 'laporan.view',
  laporanEkspor: 'laporan.export',
} as const;

/** Label peran aplikasi lain — hanya untuk pesan, tidak untuk otorisasi. */
export const FOREIGN_APP_ADMIN_ROLES: Record<string, string> = {
  ADMIN_LPM: 'LPM UNUSU',
  ADMIN_ESURAT: 'E-Surat UNUSU',
  ADMIN_SARPRAS: 'Sarpras UNUSU',
  ADMIN_AKREDITASI: 'Akreditasi UNUSU',
  ADMIN_LMS: 'LMS UNUSU',
  ADMIN_SSO: 'ONE UNUSU',
};

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
  const dimiliki = new Set(izinDari(subject));
  return kunci.every((k) => dimiliki.has(k));
}

/** Apakah subjek memegang SALAH SATU kunci izin yang diminta. */
export function bisaSalahSatu(subject: AccessSubject | null | undefined, ...kunci: string[]): boolean {
  if (!subject || kunci.length === 0) return false;
  const dimiliki = new Set(izinDari(subject));
  return kunci.some((k) => dimiliki.has(k));
}

/**
 * Tingkat masuk tertinggi.
 *
 * Server selalu memilih tingkat tertinggi, jadi urutannya penting: admin
 * menang atas dosen, dosen menang atas reviewer, dan seterusnya.
 */
export function tingkatDari(subject?: AccessSubject | null): TingkatMasuk | null {
  if (!subject) return null;
  if (subject.tingkat && subject.tingkat in IZIN_MASUK) return subject.tingkat as TingkatMasuk;
  const dimiliki = new Set(izinDari(subject));
  if (dimiliki.has(IZIN_MASUK.admin)) return 'admin';
  if (dimiliki.has(IZIN_MASUK.dosen)) return 'dosen';
  if (dimiliki.has(IZIN_MASUK.reviewer)) return 'reviewer';
  if (dimiliki.has(IZIN_MASUK.mahasiswa)) return 'mahasiswa';
  return null;
}

export function punyaIzinMasuk(subject?: AccessSubject | null): boolean {
  return tingkatDari(subject) !== null;
}

/** Admin LPPM: pemegang izin mengelola sistem. */
export function isAdminLppm(subject?: AccessSubject | null): boolean {
  return tingkatDari(subject) === 'admin';
}

/** Superadmin lintas aplikasi — tetap diperiksa lewat izinnya. */
export function isSuperadmin(subject?: AccessSubject | null): boolean {
  return bisa(subject, IZIN_MASUK.admin) && (subject?.ssoRole ?? '').toUpperCase() === 'SUPERADMIN';
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
  | 'foreign-app'
  | 'role-not-allowed'
  | 'invalid-scope';

export interface AccessDecision {
  allowed: boolean;
  code?: AccessDenialCode;
  /** Nama aplikasi asal pengguna, mis. "LPM UNUSU". */
  foreignApp?: string | null;
  title?: string;
  message?: string;
}

export function labelForSsoRole(ssoRole?: string | null): string {
  if (!ssoRole) return 'Pengguna';
  return SSO_ROLE_LABEL[ssoRole] ?? ssoRole;
}

export function foreignAppForRole(ssoRole?: string | null): string | null {
  if (!ssoRole) return null;
  return FOREIGN_APP_ADMIN_ROLES[ssoRole] ?? null;
}

/**
 * Putusan akses panel. Sumber utama adalah `appAccess` dari server; bila tidak
 * ada (sesi lama), dipakai daftar izin.
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
  if (subject.appAccess && subject.appAccess.allowed === false) {
    const alasan = subject.appAccess.reason;
    if (alasan === 'foreign_app_admin') {
      const appLain = foreignAppForRole(subject.ssoRole);
      return {
        allowed: false,
        code: 'foreign-app',
        foreignApp: appLain,
        title: `Akun ${labelForSsoRole(subject.ssoRole)} tidak dapat masuk panel LPPM`,
        message: `Peran Anda adalah administrator ${appLain ?? 'aplikasi lain'}. Setiap aplikasi memiliki panel terpisah.`,
      };
    }
    return {
      allowed: false,
      code: 'role-not-allowed',
      title: 'Belum memiliki izin masuk LPPM',
      message:
        'Akun Anda belum ditugaskan peran pada panel LPPM. Hubungi Administrator LPPM untuk memberikan izin masuk.',
    };
  }

  if (punyaIzinMasuk(subject)) return { allowed: true };

  const appLain = foreignAppForRole(subject.ssoRole);
  if (appLain) {
    return {
      allowed: false,
      code: 'foreign-app',
      foreignApp: appLain,
      title: `Akun ${labelForSsoRole(subject.ssoRole)} tidak dapat masuk panel LPPM`,
      message: `Peran Anda adalah administrator ${appLain}. Setiap aplikasi memiliki panel terpisah — silakan kelola ${appLain} melalui panel aplikasi tersebut.`,
    };
  }

  return {
    allowed: false,
    code: 'role-not-allowed',
    title: 'Belum memiliki izin masuk LPPM',
    message:
      'Akun Anda belum ditugaskan peran pada panel LPPM. Hubungi Administrator LPPM untuk memberikan izin masuk.',
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
  return labelForSsoRole(subject.ssoRole);
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
