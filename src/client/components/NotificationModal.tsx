import React, { useEffect, useId } from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldExclamationIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

/** Satu butir rincian kegagalan, mis. "Kategori — Kategori tidak ditemukan". */
export interface NotificationDetail {
  field?: string;
  message: string;
}

export interface NotificationModalProps {
  isOpen: boolean;
  /**
   * Jenis notifikasi. `error` dipakai untuk SEMUA kegagalan aksi
   * (simpan, ubah, hapus, unggah); `confirm` untuk konfirmasi destruktif.
   */
  type?: NotificationType;
  /** Judul operator aksi, mis. "Gagal Menyimpan Dokumen". */
  title?: string;
  /** Kalimat utama: APA yang gagal dilakukan pada objek apa. */
  message: string;
  /** Rincian penyebab dari server atau validasi klien. */
  details?: NotificationDetail[];
  /** Kode/status HTTP untuk transparansi teknis (opsional). */
  code?: string | null;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onClose: () => void;
  loading?: boolean;
}

/**
 * NotificationModal — modal umpan balik sistem (galat, peringatan, konfirmasi,
 * info) untuk seluruh aplikasi cabang UNUSU.
 *
 * Aturan pemakaian:
 * - DILARANG memakai `alert()` / `confirm()` peramban di panel admin.
 * - Pesan wajib menyebut APA yang gagal beserta objeknya, bukan teks generik
 *   ("Gagal menyimpan dokumen." ✗ → "Gagal menyimpan dokumen «Judul»." ✓).
 * - Penyebab (pesan server / status HTTP / nama field) dicantumkan di `details`
 *   dan `code`, bukan disamarkan.
 * - Modal non-konfirmasi hanya punya satu aksi tutup; modal `confirm` memakai
 *   `onConfirm` dan mengembalikan `loading` saat proses berjalan.
 *
 * Aksesibilitas: `role="dialog"` + `aria-modal`, `aria-labelledby`/`aria-describedby`,
 * fokus dipindahkan ke tombol utama saat terbuka, Escape menutup (kecuali
 * `loading`), dan klik latar menutup.
 */
export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  type = 'info',
  title,
  message,
  details,
  code,
  confirmLabel = 'Lanjutkan',
  cancelLabel = 'Batal',
  onConfirm,
  onClose,
  loading = false,
}) => {
  const titleId = useId();
  const descId = useId();
  const primaryBtnRef = React.useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    primaryBtnRef.current?.focus();
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const defaultTitle =
    {
      success: 'Berhasil',
      error: 'Terjadi Kesalahan',
      warning: 'Perhatian',
      confirm: 'Konfirmasi Tindakan',
      info: 'Informasi Sistem',
    }[type] || 'Informasi Sistem';

  /* Hijau hanya untuk sukses; informasi mengikuti violet LPPM. */
  const configMap = {
    success: {
      icon: CheckCircleIcon,
      badge: 'Notifikasi Sistem',
      accentBar: 'bg-emerald-700',
      iconBg: 'bg-emerald-50',
      iconBorder: 'border-emerald-200',
      iconColor: 'text-emerald-700',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      btnClass: 'bg-emerald-700 hover:bg-emerald-800 focus-visible:ring-emerald-700',
    },
    info: {
      icon: InformationCircleIcon,
      badge: 'Informasi Layanan',
      accentBar: 'bg-violet-700',
      iconBg: 'bg-violet-50',
      iconBorder: 'border-violet-200',
      iconColor: 'text-violet-700',
      badgeClass: 'bg-violet-50 text-violet-800 border-violet-200',
      btnClass: 'bg-violet-700 hover:bg-violet-800 focus-visible:ring-violet-700',
    },
    warning: {
      icon: ExclamationTriangleIcon,
      badge: 'Perhatian',
      accentBar: 'bg-amber-600',
      iconBg: 'bg-amber-50',
      iconBorder: 'border-amber-200',
      iconColor: 'text-amber-700',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      btnClass: 'bg-amber-600 hover:bg-amber-700 focus-visible:ring-amber-600',
    },
    error: {
      icon: ExclamationCircleIcon,
      badge: 'Peringatan Sistem',
      accentBar: 'bg-rose-700',
      iconBg: 'bg-rose-50',
      iconBorder: 'border-rose-200',
      iconColor: 'text-rose-700',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      btnClass: 'bg-rose-700 hover:bg-rose-800 focus-visible:ring-rose-700',
    },
    confirm: {
      icon: ShieldExclamationIcon,
      badge: 'Konfirmasi Tindakan',
      accentBar: 'bg-amber-600',
      iconBg: 'bg-amber-50',
      iconBorder: 'border-amber-200',
      iconColor: 'text-amber-700',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      btnClass: 'bg-rose-700 hover:bg-rose-800 focus-visible:ring-rose-700',
    },
  };

  const config = configMap[type] ?? configMap.info;
  const IconComponent = config.icon;

  return (
    <div
      className="fixed inset-0 z-[999] bg-slate-800/60 backdrop-blur-[2px] flex items-center justify-center p-4 sm:p-6"
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-[16px] max-w-lg w-full overflow-hidden shadow-2xl border border-slate-300 transition-all duration-150"
      >
        <div className={`h-1.5 w-full ${config.accentBar}`} />

        <div className="border-b border-slate-200 bg-slate-50 px-6 pt-6 pb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-[14px] ${config.iconBg} border ${config.iconBorder} flex items-center justify-center flex-shrink-0 ${config.iconColor} shadow-2xs`}
            >
              <IconComponent className="w-7 h-7" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-[8px] text-[11px] font-bold border ${config.badgeClass}`}
              >
                {config.badge}
              </span>
              <h3 id={titleId} className="font-bold text-slate-900 text-base sm:text-lg leading-snug">
                {title || defaultTitle}
              </h3>
            </div>
          </div>

          <button
            type="button"
            aria-label="Tutup dialog notifikasi"
            onClick={onClose}
            disabled={loading}
            className="min-h-[44px] min-w-[44px] rounded-[10px] inline-flex items-center justify-center text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            <XMarkIcon className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 py-6">
          <p id={descId} className="text-sm text-slate-700 leading-relaxed font-medium">
            {message}
          </p>

          {(details?.length || code) && (
            <div className="mt-4 rounded-[12px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Rincian Penyebab
              </p>
              <ul className="space-y-1.5">
                {details?.map((detail, index) => (
                  <li
                    key={`${detail.field || 'detail'}-${index}`}
                    className="text-xs text-slate-700 leading-relaxed"
                  >
                    {detail.field && (
                      <span className="font-bold text-slate-900">{detail.field}: </span>
                    )}
                    <span className="break-words">{detail.message}</span>
                  </li>
                ))}
                {code && (
                  <li className="text-xs text-slate-500">
                    Kode kesalahan: <span className="font-mono font-semibold">{code}</span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          {type === 'confirm' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="min-h-[44px] px-5 py-2.5 rounded-[10px] text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 font-semibold text-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              >
                {cancelLabel}
              </button>
              <button
                ref={primaryBtnRef}
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`min-h-[44px] px-6 py-2.5 rounded-[10px] text-white ${config.btnClass} font-bold text-sm shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1`}
              >
                {loading ? 'Memproses...' : confirmLabel}
              </button>
            </>
          ) : (
            <button
              ref={primaryBtnRef}
              type="button"
              onClick={onClose}
              className={`min-h-[44px] w-full sm:w-auto sm:min-w-[160px] px-6 py-2.5 rounded-[10px] text-white ${config.btnClass} font-bold text-sm shadow-sm transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1`}
            >
              Mengerti &amp; Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
