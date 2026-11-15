import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { SessionUser } from '../services/api';
import { checkOneUnusuSession } from '../services/api';

const ONE_UNUSU_URL = import.meta.env.VITE_ONE_UNUSU_URL || 'http://localhost:5178';
const SSO_CLIENT_ID = import.meta.env.VITE_SSO_CLIENT_ID || '223ea0752e7619e2';
import {
  APP_SCOPE,
  IZIN_FITUR,
  IZIN_MASUK,
  type TingkatMasuk,
  bisa as bisaUntuk,
  bisaSalahSatu as bisaSalahSatuUntuk,
  canAccessLppmPanel,
  evaluatePanelAccess,
  izinDari,
  roleBadgeLabel,
  tingkatDari,
} from '../lib/appAccess';

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  /** Cakupan aplikasi sesi aktif (selalu "lppm" untuk aplikasi ini). */
  appScope: string;
  /** True bila sesi berhak membuka panel LPPM (memiliki izin masuk). */
  hasPanelAccess: boolean;
  /** True bila pengguna memegang izin mengelola sistem. */
  isAdmin: boolean;
  /** Alias semantik: boleh mengelola pengguna, peran & izin. */
  canManageSystem: boolean;
  /** True bila boleh mengajukan proposal penelitian. */
  isDosen: boolean;
  isSuperadmin: boolean;
  roleLabel: string;
  /** Kunci izin efektif — dibaca server dari database pada setiap permintaan. */
  izin: string[];
  /** Tingkat masuk tertinggi. */
  tingkat: TingkatMasuk | null;
  /** True bila memegang SEMUA kunci izin yang diminta. */
  bisa: (...kunci: string[]) => boolean;
  /** True bila memegang SALAH SATU kunci izin yang diminta. */
  bisaSalahSatu: (...kunci: string[]) => boolean;
  /** Muat ulang izin dari server (mis. setelah admin mengubah peran). */
  segarkanSesi: () => Promise<void>;
  saveSession: (token: string, user: SessionUser) => void;
  logout: () => void;
}

const TOKEN_KEY = 'lppm_unusu_token';
const USER_KEY = 'lppm_unusu_user';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const raw = localStorage.getItem(USER_KEY);

      if (!token || !raw) {
        if (!cancelled) setLoading(false);
        return;
      }

      let parsedUser: SessionUser | null = null;
      try {
        parsedUser = JSON.parse(raw) as SessionUser;
        if (!cancelled) {
          setUser({ ...parsedUser, app: parsedUser.app ?? APP_SCOPE });
        }
      } catch {
        localStorage.removeItem(USER_KEY);
      }

      try {
        const ssoStatus = await checkOneUnusuSession();
        if (ssoStatus?.authenticated === false) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          if (!cancelled) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (
          ssoStatus?.authenticated === true &&
          ssoStatus.user?.username &&
          parsedUser?.username &&
          ssoStatus.user.username.toLowerCase() !== parsedUser.username.toLowerCase()
        ) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          if (!cancelled) {
            setUser(null);
            setLoading(false);
          }
          window.location.replace(
            `${ONE_UNUSU_URL}/authorize?client_id=${encodeURIComponent(SSO_CLIENT_ID)}`
          );
          return;
        }
      } catch {
        // Abaikan kegagalan jaringan saat offline
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const saveSession = (token: string, sessionUser: SessionUser) => {
    const scopedUser: SessionUser = { ...sessionUser, app: sessionUser.app ?? APP_SCOPE };
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(scopedUser));
    setUser(scopedUser);
  };

  /**
   * Ambil ulang izin dari server.
   *
   * Izin disimpan di server dan dibaca per permintaan, jadi data di localStorage
   * bisa basi setelah admin mengubah peran. Fungsi ini menyegarkannya tanpa
   * memaksa pengguna login ulang.
   */
  const segarkanSesi = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      const { default: api } = await import('../services/api');
      const res = await api.get<{ success: boolean; data: SessionUser }>('/auth/session');
      const terbaru = res.data.data;
      const scoped: SessionUser = { ...terbaru, app: terbaru.app ?? APP_SCOPE };
      localStorage.setItem(USER_KEY, JSON.stringify(scoped));
      setUser(scoped);
    } catch {
      /* biarkan sesi berjalan; kegagalan jaringan bukan alasan mengeluarkan pengguna */
    }
  };

  const value = useMemo<AuthContextValue>(() => {
    const izin = izinDari(user);
    const tingkat = tingkatDari(user);
    return {
      user,
      loading,
      appScope: user?.app || APP_SCOPE,
      hasPanelAccess: canAccessLppmPanel(user),
      isAdmin: tingkatDari(user) === 'admin',
      canManageSystem: bisaUntuk(user, IZIN_FITUR.peranKelola, IZIN_FITUR.izinKelola),
      isDosen: bisaUntuk(user, IZIN_FITUR.penelitianBuat),
      isSuperadmin: bisaUntuk(user, IZIN_MASUK.admin) && (user?.ssoRole ?? '').toUpperCase() === 'SUPERADMIN',
      roleLabel: roleBadgeLabel(user),
      izin,
      tingkat,
      bisa: (...kunci: string[]) => bisaUntuk(user, ...kunci),
      bisaSalahSatu: (...kunci: string[]) => bisaSalahSatuUntuk(user, ...kunci),
      segarkanSesi,
      saveSession,
      logout,
    };
  }, [user, loading]);

  // Penolakan akses tidak boleh senyap — catat untuk diagnosis.
  useEffect(() => {
    if (!user) return;
    const decision = evaluatePanelAccess(user);
    if (!decision.allowed) {
      console.warn('[LPPM Access]', decision.code, decision.message);
    }
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider');
  }
  return context;
}
