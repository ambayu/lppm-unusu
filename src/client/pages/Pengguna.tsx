import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ListPageTemplate } from '../components/ListPageTemplate';
import { useAuth } from '../context/AuthContext';
import {
  fetchPenelitian,
  fetchPengabdian,
  fetchPublikasi,
  PenelitianItem,
  PengabdianItem,
  PublikasiItem,
} from '../services/api';
import {
  UsersIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  BeakerIcon,
  HeartIcon,
  BookOpenIcon,
  IdentificationIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { FOREIGN_APP_ADMIN_ROLES, foreignAppForRole, labelForSsoRole } from '../lib/appAccess';

export interface UserSummaryItem {
  id: string;
  nama: string;
  nidn: string;
  email?: string;
  prodi?: string;
  fakultas?: string;
  role: 'Administrator' | 'Dosen Peneliti';
  ssoRole: string;
  status: 'Aktif' | 'Terverifikasi SSO';
  totalPenelitian: number;
  totalPengabdian: number;
  totalPublikasi: number;
}

export const PenggunaPage: React.FC = () => {
  const { user: currentAuthUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('SEMUA');

  const [penelitianList, setPenelitianList] = useState<PenelitianItem[]>([]);
  const [pengabdianList, setPengabdianList] = useState<PengabdianItem[]>([]);
  const [publikasiList, setPublikasiList] = useState<PublikasiItem[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [penRes, pkmRes, pubRes] = await Promise.all([
        fetchPenelitian().catch(() => ({ data: { data: [] as PenelitianItem[] } })),
        fetchPengabdian().catch(() => ({ data: { data: [] as PengabdianItem[] } })),
        fetchPublikasi().catch(() => ({ data: { data: [] as PublikasiItem[] } })),
      ]);

      setPenelitianList(penRes.data?.data || []);
      setPengabdianList(pkmRes.data?.data || []);
      setPublikasiList(pubRes.data?.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Gagal memuat data pengguna Tridharma');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Agregasi pengguna dan peneliti dari pangkalan data riset dan sesi SSO aktif
  const users: UserSummaryItem[] = useMemo(() => {
    const map = new Map<string, UserSummaryItem>();

    // 1. Tambahkan user yang sedang login (dari SSO Gateway)
    if (currentAuthUser) {
      const nidnKey = currentAuthUser.nidn || currentAuthUser.username || `usr-${currentAuthUser.id}`;
      map.set(nidnKey, {
        id: String(currentAuthUser.id),
        nama: currentAuthUser.nama || currentAuthUser.username,
        nidn: currentAuthUser.nidn || '-',
        email: currentAuthUser.email || `${currentAuthUser.username}@unusu.ac.id`,
        prodi: currentAuthUser.prodi || 'Sistem Informasi',
        fakultas: currentAuthUser.fakultas || 'Fakultas Ilmu Komputer',
        role: currentAuthUser.role === 'admin' ? 'Administrator' : 'Dosen Peneliti',
        ssoRole: currentAuthUser.ssoRole || (currentAuthUser.role === 'admin' ? 'ADMIN_LPPM' : 'DOSEN'),
        status: 'Terverifikasi SSO',
        totalPenelitian: 0,
        totalPengabdian: 0,
        totalPublikasi: 0,
      });
    }

    // 2. Agregasi Dosen Peneliti dari Pangkalan Penelitian
    penelitianList.forEach((p) => {
      const key = p.nidn || p.ketua;
      if (!map.has(key)) {
        map.set(key, {
          id: `p-${p.id}`,
          nama: p.ketua,
          nidn: p.nidn || '-',
          email: `${p.ketua.toLowerCase().replace(/[^a-z0-9]/g, '')}@unusu.ac.id`,
          prodi: 'Tridharma UNUSU',
          fakultas: 'Universitas Nahdlatul Ulama Sumatera Utara',
          role: 'Dosen Peneliti',
          ssoRole: 'DOSEN',
          status: 'Aktif',
          totalPenelitian: 1,
          totalPengabdian: 0,
          totalPublikasi: 0,
        });
      } else {
        const u = map.get(key)!;
        u.totalPenelitian += 1;
      }
    });

    // 3. Agregasi dari Pangkalan Pengabdian
    pengabdianList.forEach((pkm) => {
      const key = pkm.nidn || pkm.ketua;
      if (!map.has(key)) {
        map.set(key, {
          id: `pkm-${pkm.id}`,
          nama: pkm.ketua,
          nidn: pkm.nidn || '-',
          email: `${pkm.ketua.toLowerCase().replace(/[^a-z0-9]/g, '')}@unusu.ac.id`,
          prodi: 'Tridharma UNUSU',
          fakultas: 'Universitas Nahdlatul Ulama Sumatera Utara',
          role: 'Dosen Peneliti',
          ssoRole: 'DOSEN',
          status: 'Aktif',
          totalPenelitian: 0,
          totalPengabdian: 1,
          totalPublikasi: 0,
        });
      } else {
        const u = map.get(key)!;
        u.totalPengabdian += 1;
      }
    });

    // 4. Agregasi dari Pangkalan Publikasi Jurnal
    publikasiList.forEach((pub) => {
      // Cari nama penulis pertama atau pencocokan nama
      const penulisUtama = pub.penulis.split(',')[0].trim();
      const existing = Array.from(map.values()).find(
        (u) =>
          u.nama.toLowerCase().includes(penulisUtama.toLowerCase()) ||
          penulisUtama.toLowerCase().includes(u.nama.toLowerCase())
      );

      if (existing) {
        existing.totalPublikasi += 1;
      } else {
        map.set(`pub-${pub.id}`, {
          id: `pub-${pub.id}`,
          nama: penulisUtama,
          nidn: '-',
          email: `${penulisUtama.toLowerCase().replace(/[^a-z0-9]/g, '')}@unusu.ac.id`,
          prodi: 'Tridharma UNUSU',
          fakultas: 'Universitas Nahdlatul Ulama Sumatera Utara',
          role: 'Dosen Peneliti',
          ssoRole: 'DOSEN',
          status: 'Aktif',
          totalPenelitian: 0,
          totalPengabdian: 0,
          totalPublikasi: 1,
        });
      }
    });

    return Array.from(map.values());
  }, [currentAuthUser, penelitianList, pengabdianList, publikasiList]);

  // Filter hasil pencarian
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.nama.toLowerCase().includes(search.toLowerCase()) ||
        u.nidn.toLowerCase().includes(search.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
        (u.prodi && u.prodi.toLowerCase().includes(search.toLowerCase()));
      const matchRole =
        roleFilter === 'SEMUA' ||
        (roleFilter === 'ADMIN' && u.role === 'Administrator') ||
        (roleFilter === 'DOSEN' && u.role === 'Dosen Peneliti');
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  // Statistik Pengguna
  const totalUsers = users.length;
  const totalAdmin = users.filter((u) => u.role === 'Administrator').length;
  const totalDosen = users.filter((u) => u.role === 'Dosen Peneliti').length;
  const totalAktivitas = users.reduce(
    (acc, curr) => acc + curr.totalPenelitian + curr.totalPengabdian + curr.totalPublikasi,
    0
  );

  const handleExportCsv = () => {
    if (filteredUsers.length === 0) {
      alert('Tidak ada data pengguna untuk diekspor.');
      return;
    }

    const headers = [
      'No',
      'Nama Lengkap',
      'NIDN',
      'Email Kampus',
      'Hak Akses (Role)',
      'Role SSO Gateway',
      'Program Studi',
      'Total Penelitian',
      'Total Pengabdian',
      'Total Publikasi',
      'Status Akun',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredUsers.map((u, idx) => [
      idx + 1,
      escapeCsv(u.nama),
      escapeCsv(u.nidn ? `\t${u.nidn}` : '-'),
      escapeCsv(u.email || '-'),
      escapeCsv(u.role),
      escapeCsv(u.ssoRole),
      escapeCsv(u.prodi || '-'),
      u.totalPenelitian,
      u.totalPengabdian,
      u.totalPublikasi,
      escapeCsv(u.status),
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `manajemen-pengguna-lppm-unusu-${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <ListPageTemplate<UserSummaryItem>
        title="Manajemen Pengguna & Peneliti"
        description="Monitoring akun civitas akademika, administrator LPPM, dan rekapitulasi keaktifan tridharma dosen terintegrasi ONE UNUSU SSO Gateway."
        badge={
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-violet-100 text-violet-800 uppercase tracking-wider">
            Pengguna LPPM
          </span>
        }
        actions={
          <>
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-[12px] border border-[#CBD5E1] bg-white text-slate-600 hover:text-violet-900 hover:bg-[#F3EEF9] transition-colors cursor-pointer shadow-2xs"
              title="Segarkan Data"
              aria-label="Muat ulang daftar pengguna"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
            <button
              onClick={handleExportCsv}
              disabled={loading || filteredUsers.length === 0}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-[12px] border border-emerald-600 bg-white hover:bg-emerald-50 text-emerald-700 text-sm font-bold transition-all shadow-2xs hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              title="Ekspor Data Pengguna ke CSV"
            >
              <ArrowDownTrayIcon className="w-5 h-5 text-emerald-600" aria-hidden="true" />
              <span>Export CSV</span>
            </button>
          </>
        }
        stats={
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Pengguna Terdata</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{totalUsers}</p>
              </div>
              <div className="w-10 h-10 rounded-[10px] bg-violet-50 text-violet-700 flex items-center justify-center">
                <UsersIcon className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Dosen Peneliti</p>
                <p className="mt-1 text-2xl font-bold text-violet-700">{totalDosen}</p>
              </div>
              <div className="w-10 h-10 rounded-[10px] bg-violet-50 text-violet-700 flex items-center justify-center font-bold text-xs">
                <AcademicCapIcon className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Admin LPPM</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{totalAdmin}</p>
              </div>
              <div className="w-10 h-10 rounded-[10px] bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-[14px] border border-[#CBD5E1] shadow-2xs flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Berkas Riset</p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">{totalAktivitas}</p>
              </div>
              <div className="w-10 h-10 rounded-[10px] bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                AKT
              </div>
            </div>
          </div>
        }
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari pengguna berdasarkan nama, NIDN, email, atau program studi..."
        filters={
          <>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] border border-[#CBD5E1] bg-slate-50 text-xs font-semibold text-slate-600">
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
              <span>Hak Akses:</span>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter hak akses"
              className="px-3 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-violet-600 transition-colors cursor-pointer min-h-[44px]"
            >
              <option value="SEMUA">Semua Peran</option>
              <option value="ADMIN">Administrator LPPM</option>
              <option value="DOSEN">Dosen Peneliti</option>
            </select>
          </>
        }
        tableTitle="Daftar Pengguna & Peneliti Terdaftar"
        tableSubtitle={`Menampilkan ${filteredUsers.length} pengguna aktif dalam ekosistem LPPM UNUSU`}
        tableBadge={
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-800 border border-violet-200">
            {filteredUsers.length} Pengguna
          </span>
        }
        minTableWidth="min-w-[1020px]"
        loading={loading}
        error={error}
        onRetry={loadData}
        hasActiveFilter={Boolean(search || roleFilter !== 'SEMUA')}
        emptyMessage="Belum ada pengguna terdaftar di ekosistem LPPM."
        noResultMessage="Tidak ada pengguna atau peneliti yang cocok dengan filter pencarian Anda."
        rowKey={(item) => item.id}
        rows={filteredUsers}
        columns={[
          {
            key: 'no',
            header: 'No',
            headerClassName: 'w-12 text-center',
            cellClassName: 'text-center text-slate-400 font-mono text-xs',
            render: (_item, idx) => idx + 1,
          },
          {
            key: 'nama',
            header: 'Pengguna & NIDN',
            headerClassName: 'min-w-[260px]',
            render: (item) => {
              const isCurrent = currentAuthUser?.id && String(currentAuthUser.id) === item.id;
              return (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-700 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-2xs">
                    {item.nama.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 leading-snug flex items-center gap-1.5">
                      <span className="truncate">{item.nama}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold bg-violet-100 text-violet-800 px-1.5 py-0.2 rounded-sm border border-violet-200">
                          Anda
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                      <span>NIDN: {item.nidn}</span>
                      <span>•</span>
                      <span className="text-slate-400 truncate">{item.email}</span>
                    </div>
                  </div>
                </div>
              );
            },
          },
          {
            key: 'prodi',
            header: 'Program Studi / Fakultas',
            headerClassName: 'min-w-[220px]',
            render: (item) => (
              <>
                <div className="font-semibold text-slate-800">{item.prodi || '-'}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{item.fakultas || '-'}</div>
              </>
            ),
          },
          {
            key: 'role',
            header: 'Hak Akses',
            headerClassName: 'min-w-[140px] text-center',
            cellClassName: 'text-center',
            render: (item) => (
              <>
                <div className="font-bold text-xs text-slate-800">{item.role}</div>
                <div className="mt-1 flex flex-col items-center gap-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      foreignAppForRole(item.ssoRole)
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                    title={
                      foreignAppForRole(item.ssoRole)
                        ? `Peran milik ${foreignAppForRole(item.ssoRole)} — tidak dapat memakai panel LPPM`
                        : 'Peran sah untuk panel LPPM'
                    }
                  >
                    {foreignAppForRole(item.ssoRole) ? (
                      <ExclamationTriangleIcon className="w-3 h-3" aria-hidden="true" />
                    ) : (
                      <ShieldCheckIcon className="w-3 h-3" aria-hidden="true" />
                    )}
                    {foreignAppForRole(item.ssoRole) ? 'Ditolak di LPPM' : 'Akses LPPM'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">SSO: {item.ssoRole}</span>
                </div>
              </>
            ),
          },
          {
            key: 'tridharma',
            header: 'Rekap Tridharma',
            headerClassName: 'min-w-[180px] text-center',
            cellClassName: 'text-center',
            render: (item) => (
              <div className="flex items-center justify-center gap-3 text-xs font-semibold">
                <span title="Penelitian" className="text-violet-700">
                  {item.totalPenelitian}{' '}
                  <span className="text-[11px] text-slate-400 font-normal">Lit</span>
                </span>
                <span className="text-slate-300">•</span>
                <span title="Pengabdian" className="text-rose-600">
                  {item.totalPengabdian}{' '}
                  <span className="text-[11px] text-slate-400 font-normal">PKM</span>
                </span>
                <span className="text-slate-300">•</span>
                <span title="Publikasi" className="text-amber-600">
                  {item.totalPublikasi}{' '}
                  <span className="text-[11px] text-slate-400 font-normal">Pub</span>
                </span>
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Status Akun',
            headerClassName: 'min-w-[140px] text-center',
            cellClassName: 'text-center',
            render: (item) => (
              <span className="text-xs font-semibold text-emerald-600">{item.status}</span>
            ),
          },
          {
            key: 'aksi',
            header: 'Detail',
            headerClassName: 'w-24 text-center',
            cellClassName: 'text-center',
            render: (item) => (
              <Link
                to={`/pengguna/${encodeURIComponent(item.nidn || item.nama)}`}
                className="inline-flex items-center justify-center min-h-[44px] px-2.5 py-1.5 rounded-[8px] border border-[#CBD5E1] bg-white text-xs font-semibold text-slate-700 hover:text-violet-900 hover:bg-[#F3EEF9] transition-colors cursor-pointer shadow-2xs"
              >
                Lihat
              </Link>
            ),
          },
        ]}
      />
    </>
  );
};
