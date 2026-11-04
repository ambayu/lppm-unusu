/**
 * Pemisahan Admin Per Aplikasi — LPPM UNUSU
 * -----------------------------------------
 * Ekosistem ONE UNUSU memiliki beberapa aplikasi cabang (LPM, LPPM, E-Surat,
 * Sarpras, Akreditasi, LMS). Setiap aplikasi hanya boleh dikelola oleh admin
 * miliknya sendiri. Admin LPM TIDAK boleh masuk ke panel LPPM, dan sebaliknya.
 *
 * Modul ini menjadi satu-satunya sumber kebenaran (single source of truth) di
 * sisi klien untuk aturan tersebut. Server menegakkan aturan yang sama pada
 * `src/server/index.ts` (lihat LPPM_ALLOWED_SSO_ROLES & FOREIGN_APP_ADMIN_ROLES).
 */

/** Identitas aplikasi ini pada gateway SSO ONE UNUSU. */
export const APP_SCOPE = 'lppm' as const;
export const APP_NAME = 'LPPM UNUSU';
export const APP_FULL_NAME = 'Lembaga Penelitian & Pengabdian kepada Masyarakat';

/** Peran SSO yang sah untuk mengakses panel LPPM. */
export const LPPM_ALLOWED_SSO_ROLES = ['SUPERADMIN', 'ADMIN_LPPM', 'DOSEN'] as const;

export type LppmSsoRole = (typeof LPPM_ALLOWED_SSO_ROLES)[number];

/** Peran admin aplikasi lain beserta label aplikasi pemiliknya. */
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
};

/** Struktur minimal sesi yang dibutuhkan untuk evaluasi akses. */
export interface AccessSubject {
  role?: string | null;
  ssoRole?: string | null;
  app?: string | null;
}

export function labelForSsoRole(ssoRole?: string | null): string {
  if (!ssoRole) return 'Pengguna';
  return SSO_ROLE_LABEL[ssoRole] ?? ssoRole;
}

/** Nama aplikasi pemilik peran, bila peran tersebut milik aplikasi cabang lain. */
export function foreignAppForRole(ssoRole?: string | null): string | null {
  if (!ssoRole) return null;
  return FOREIGN_APP_ADMIN_ROLES[ssoRole] ?? null;
}

export function isLppmAllowedRole(ssoRole?: string | null): boolean {
  if (!ssoRole) return false;
  return (LPPM_ALLOWED_SSO_ROLES as readonly string[]).includes(ssoRole);
}

/** Superadmin lintas aplikasi pada ekosistem ONE UNUSU. */
export function isSuperadmin(subject?: AccessSubject | null): boolean {
  return subject?.ssoRole === 'SUPERADMIN';
}

/** Admin yang berhak mengelola data master LPPM (bukan dosen peneliti). */
export function isLppmAdmin(subject?: AccessSubject | null): boolean {
  if (!subject) return false;
  if (subject.ssoRole === 'SUPERADMIN' || subject.ssoRole === 'ADMIN_LPPM') return true;
  // Sesi lama tanpa ssoRole tetap dihormati selama role lokalnya admin.
  return !subject.ssoRole && subject.role === 'admin';
}

/** Dosen peneliti: boleh membaca & mengusulkan, tidak boleh mengelola sistem. */
export function isDosenPeneliti(subject?: AccessSubject | null): boolean {
  return !!subject && subject.role === 'dosen';
}

export function canManageSystem(subject?: AccessSubject | null): boolean {
  return isLppmAdmin(subject);
}

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

/**
 * Keputusan akses panel LPPM. Dipakai oleh route guard (UI) dan dapat dipakai
 * ulang oleh komponen lain yang butuh pesan penolakan yang konsisten.
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

  const foreignApp = foreignAppForRole(subject.ssoRole);
  if (foreignApp) {
    return {
      allowed: false,
      code: 'foreign-app',
      foreignApp,
      title: `Akun ${labelForSsoRole(subject.ssoRole)} tidak dapat masuk panel LPPM`,
      message: `Peran Anda adalah administrator ${foreignApp}. Setiap aplikasi memiliki panel terpisah — silakan kelola ${foreignApp} melalui panel aplikasi tersebut.`,
    };
  }

  if (subject.ssoRole && !isLppmAllowedRole(subject.ssoRole)) {
    return {
      allowed: false,
      code: 'role-not-allowed',
      title: 'Peran tidak memiliki akses ke LPPM',
      message: `Peran "${labelForSsoRole(subject.ssoRole)}" tidak terdaftar pada aplikasi ${APP_NAME}. Hubungi admin ONE UNUSU bila peran Anda keliru.`,
    };
  }

  if (subject.role !== 'admin' && subject.role !== 'dosen') {
    return {
      allowed: false,
      code: 'role-not-allowed',
      title: 'Peran tidak memiliki akses ke LPPM',
      message: `Panel ${APP_NAME} hanya dapat diakses Administrator LPPM dan Dosen peneliti.`,
    };
  }

  return { allowed: true };
}

export function canAccessLppmPanel(subject?: AccessSubject | null): boolean {
  return evaluatePanelAccess(subject).allowed;
}

/** Label ringkas untuk badge peran pada topbar/sidebar. */
export function roleBadgeLabel(subject?: AccessSubject | null): string {
  if (!subject) return 'Tamu';
  if (subject.ssoRole) return labelForSsoRole(subject.ssoRole);
  if (subject.role === 'admin') return 'Admin LPPM';
  if (subject.role === 'dosen') return 'Dosen Peneliti';
  return subject.role || 'Pengguna';
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
