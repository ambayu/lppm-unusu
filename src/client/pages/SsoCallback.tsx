import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { ssoLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SsoLoadingScreen } from '../components/SsoLoadingScreen';
import { accessDeniedUrl } from '../lib/appAccess';

type SsoExchangeResult = Awaited<ReturnType<typeof ssoLogin>>;

/**
 * Token SSO hanya boleh ditukar satu kali. React menjalankan efek dua kali pada
 * mode pengembangan (StrictMode) dan halaman callback dapat dirender ulang,
 * sehingga penukaran dideduplikasi per token. Tanpa ini permintaan kedua
 * ditolak server karena token sudah terpakai.
 */
const exchangeRequests = new Map<string, Promise<SsoExchangeResult>>();

function exchangeSsoToken(clientId: string, token: string): Promise<SsoExchangeResult> {
  const key = `${clientId}:${token}`;
  const pending = exchangeRequests.get(key);

  if (pending) {
    return pending;
  }

  const request = ssoLogin(clientId, token);
  exchangeRequests.set(key, request);

  request.catch(() => {
    // Penukaran gagal (mis. jaringan terputus) boleh dicoba lagi; hasil sukses
    // tetap disimpan agar token tidak pernah dikirim ulang.
    exchangeRequests.delete(key);
  });

  return request;
}

/**
 * Callback SSO ONE UNUSU.
 * URL: /sso/callback?client_id=..&token=..
 * Token diverifikasi backend aplikasi ini (server-to-server).
 */
export function SsoCallbackPage() {
  const [params] = useSearchParams();
  const { saveSession } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const clientId = params.get('client_id');
    const token = params.get('token');

    if (!clientId || !token) {
      setError('Parameter SSO tidak lengkap. Silakan login ulang dari ONE UNUSU.');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await exchangeSsoToken(clientId, token);
        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Login SSO gagal');
        }

        saveSession(response.data.token, response.data.user);

        if (!cancelled) {
          // Setelah login sukses SELALU mendarat di dashboard panel, bukan di
          // menu modul (dulu '/penelitian'). BASE_URL dipertahankan supaya
          // tetap benar bila aplikasi di-deploy di subfolder.
          const dashboardPath = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/dashboard`;
          window.location.replace(dashboardPath);
        }
      } catch (err: any) {
        if (!cancelled) {
          const data = err.response?.data;
          const code = data?.code as string | undefined;

          // Penolakan lintas aplikasi (mis. admin LPM) diarahkan ke halaman 403
          // yang menjelaskan alasan, bukan sekadar pesan error generik.
          if (code === 'FOREIGN_APP_ADMIN' || code === 'ROLE_NOT_ALLOWED') {
            window.location.replace(
              accessDeniedUrl({
                reason: code === 'FOREIGN_APP_ADMIN' ? 'foreign-app' : 'role-not-allowed',
                role: data?.role ?? null,
                app: data?.foreignApp ?? data?.app ?? null,
                from: '/sso/callback',
              })
            );
            return;
          }

          setError(
            data?.message ||
            err.message ||
            'Gagal memverifikasi token SSO. Token mungkin sudah kedaluwarsa.'
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, saveSession]);

  // Verifikasi tiket menunggu request jaringan nyata (server-to-server), jadi
  // layar tunggu penuh memang pantas ditampilkan. Gayanya disamakan dengan
  // layar tunggu di halaman login supaya seluruh rangkaian masuk terasa satu
  // alur, bukan tiga halaman berbeda.
  if (!error) {
    return (
      <SsoLoadingScreen
        title="Memverifikasi tiket masuk"
        description="Aplikasi sedang memvalidasi token sekali pakai Anda. Jangan tutup halaman ini."
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mb-4">
          <ExclamationTriangleIcon className="w-7 h-7" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 mb-2">Login SSO Gagal</h1>
        <p className="text-sm text-slate-600 mb-6">{error}</p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-700 text-white text-sm font-bold hover:bg-violet-800 transition-all"
        >
          Kembali ke Halaman Login
        </Link>
      </div>
    </div>
  );
}
