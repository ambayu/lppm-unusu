import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { SessionUser } from '../services/api';
import {
  APP_SCOPE,
  canAccessLppmPanel,
  canManageSystem as canManageSystemFor,
  evaluatePanelAccess,
  isDosenPeneliti,
  isLppmAdmin,
  isSuperadmin as isSuperadminSubject,
  roleBadgeLabel,
} from '../lib/appAccess';

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  /** Cakupan aplikasi sesi aktif (selalu "lppm" untuk aplikasi ini). */
  appScope: string;
  /** True bila sesi berhak membuka panel LPPM. */
  hasPanelAccess: boolean;
  /** True untuk admin LPPM / superadmin. */
  isAdmin: boolean;
  /** Alias semantik: boleh mengelola data master, pengguna, peran & izin. */
  canManageSystem: boolean;
  /** True untuk dosen peneliti (akses baca & pengusulan). */
  isDosen: boolean;
  isSuperadmin: boolean;
  roleLabel: string;
  saveSession: (token: string, user: SessionUser) => void;
  logout: () => void;
}

const TOKEN_KEY = 'lppm_unusu_token';
const USER_KEY = 'lppm_unusu_user';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);

    if (token && raw) {
      try {
        const parsed = JSON.parse(raw) as SessionUser;
        // Sesi lama tanpa penanda aplikasi dilengkapi cakupan LPPM agar
        // pengguna sah tidak ter-logout hanya karena migrasi skema.
        setUser({ ...parsed, app: parsed.app ?? APP_SCOPE });
      } catch {
        localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const saveSession = (token: string, sessionUser: SessionUser) => {
    const scopedUser: SessionUser = { ...sessionUser, app: sessionUser.app ?? APP_SCOPE };
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(scopedUser));
    setUser(scopedUser);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      appScope: user?.app || APP_SCOPE,
      hasPanelAccess: canAccessLppmPanel(user),
      isAdmin: isLppmAdmin(user),
      canManageSystem: canManageSystemFor(user),
      isDosen: isDosenPeneliti(user),
      isSuperadmin: isSuperadminSubject(user),
      roleLabel: roleBadgeLabel(user),
      saveSession,
      logout,
    }),
    [user, loading]
  );

  // Penolakan akses lintas aplikasi tidak boleh senyap — catat untuk diagnosis.
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
