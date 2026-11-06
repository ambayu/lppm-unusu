import React from 'react';
import {
  UserCircleIcon,
  EnvelopeIcon,
  IdentificationIcon,
  BuildingOffice2Icon,
  AcademicCapIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { AdminPanelTemplate } from '../components/AdminPanelTemplate';

/**
 * Halaman Profil Pengguna LPPM UNUSU.
 * Menampilkan data akun aktif dari ONE UNUSU SSO.
 */
export const ProfilPage: React.FC = () => {
  const { user, roleLabel } = useAuth();

  const nama = user?.nama || 'Pengguna';
  const initial = (nama || '?').trim().charAt(0).toUpperCase();

  const rows = [
    { label: 'Nama Lengkap', value: nama, icon: UserCircleIcon },
    { label: 'Username', value: user?.username || '—', icon: IdentificationIcon },
    { label: 'Email', value: user?.email || '—', icon: EnvelopeIcon },
    { label: 'Peran & Akses', value: roleLabel || user?.role || '—', icon: ShieldCheckIcon },
    { label: 'NIM / NIDN', value: user?.nidn || user?.nim || '—', icon: IdentificationIcon },
    { label: 'Program Studi', value: user?.prodi || '—', icon: AcademicCapIcon },
    { label: 'Fakultas / Unit', value: user?.fakultas || 'LPPM UNUSU', icon: BuildingOffice2Icon },
  ];

  return (
    <AdminPanelTemplate
      badge={
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EDE8F5] text-violet-900 border border-violet-200 uppercase tracking-wider">
          Akun Saya
        </span>
      }
      title="Profil Pengguna"
      description="Biodata pengguna yang sedang aktif di LPPM UNUSU. Informasi identitas tersinkronisasi langsung dari ONE UNUSU Gateway."
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-[14px] border border-[#CBD5E1] bg-white shadow-2xs">
          <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden bg-violet-900 text-amber-400 flex items-center justify-center text-2xl font-bold border border-violet-800">
            {initial}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate">{nama}</h2>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {user?.email || 'lppm@unusu.ac.id'} &middot; {roleLabel}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[10px] font-bold bg-[#EDE8F5] text-violet-900 border border-violet-200 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-700 animate-pulse" />
                Sesi LPPM Aktif
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-[16px] border border-[#CBD5E1] bg-white overflow-hidden shadow-2xs">
          <div className="px-5 py-3.5 border-b border-[#CBD5E1] bg-slate-50/70">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Rincian Informasi Akun
            </h3>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#CBD5E1]">
            {rows.map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.label} className="bg-white p-4 flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-[8px] bg-[#EDE8F5] text-violet-900 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                      {row.label}
                    </dt>
                    <dd className="text-sm font-semibold text-slate-900 break-words mt-0.5">
                      {row.value}
                    </dd>
                  </div>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </AdminPanelTemplate>
  );
};

export default ProfilPage;
