import React, { useEffect, useState, useMemo } from 'react';
import { AdminPanelTemplate } from '../components/AdminPanelTemplate';
import { CardContainer } from '../components/CardContainer';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
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
  MagnifyingGlassIcon,
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
} from '@heroicons/react/24/outline';

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
  const [selectedUser, setSelectedUser] = useState<UserSummaryItem | null>(null);

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
    <AdminPanelTemplate
      title="Manajemen Pengguna & Peneliti"
      description="Monitoring akun civitas akademika, administrator LPPM, dan rekapitulasi keaktifan tridharma dosen terintegrasi ONE UNUSU SSO Gateway."
      actions={
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center justify-center p-2.5 h-[42px] w-[42px] rounded-[12px] border border-[#CBD5E1] bg-white text-slate-600 hover:text-violet-900 hover:bg-[#F3EEF9] transition-colors cursor-pointer shadow-2xs"
            title="Segarkan Data"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExportCsv}
            disabled={loading || filteredUsers.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 h-[42px] rounded-[12px] border border-emerald-600 bg-white hover:bg-emerald-50 text-emerald-700 text-sm font-bold transition-all shadow-2xs hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Ekspor Data Pengguna ke CSV"
          >
            <ArrowDownTrayIcon className="w-5 h-5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      }
    >
      {/* 1. KPI Cards Row */}
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

      {/* 2. Banner Informasi SSO - Dihapus sesuai permintaan */}

      {/* 3. Filter & Pencarian Bar */}
      <CardContainer>
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pengguna berdasarkan nama, NIDN, email, atau program studi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] border border-[#CBD5E1] bg-slate-50 text-xs font-semibold text-slate-600 flex-shrink-0">
              <AdjustmentsHorizontalIcon className="w-4 h-4" />
              <span>Hak Akses:</span>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2.5 rounded-[12px] border border-[#CBD5E1] bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-violet-600 transition-colors cursor-pointer"
            >
              <option value="SEMUA">Semua Peran</option>
              <option value="ADMIN">Administrator LPPM</option>
              <option value="DOSEN">Dosen Peneliti</option>
            </select>
          </div>
        </div>
      </CardContainer>

      {/* 4. Tabel Manajemen Pengguna */}
      <CardContainer
        title="Daftar Pengguna & Peneliti Terdaftar"
        subtitle={`Menampilkan ${filteredUsers.length} pengguna aktif dalam ekosistem LPPM UNUSU`}
      >
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <ArrowPathIcon className="w-8 h-8 mx-auto animate-spin text-violet-700 mb-2" />
            <p className="text-sm font-semibold">Memuat data pengguna...</p>
          </div>
        ) : error ? (
          <ErrorState description={error} onRetry={loadData} />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            title="Pengguna Tidak Ditemukan"
            description="Tidak ada pengguna atau peneliti yang cocok dengan filter pencarian Anda."
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1020px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[#CBD5E1] text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                  <th className="py-3 px-3.5 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[260px]">Pengguna & NIDN</th>
                  <th className="py-3 px-4 min-w-[220px]">Program Studi / Fakultas</th>
                  <th className="py-3 px-4 min-w-[140px] text-center">Hak Akses</th>
                  <th className="py-3 px-4 min-w-[180px] text-center">Rekap Tridharma</th>
                  <th className="py-3 px-4 min-w-[140px] text-center">Status Akun</th>
                  <th className="py-3 px-4 w-24 text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-[13px]">
                {filteredUsers.map((item, idx) => {
                  const isCurrent = currentAuthUser?.id && String(currentAuthUser.id) === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-violet-50/30 transition-colors">
                      <td className="py-3.5 px-3.5 text-center text-slate-400 font-mono text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
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
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{item.prodi || '-'}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.fakultas || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="font-bold text-xs text-slate-800">
                          {item.role}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          SSO: {item.ssoRole}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-3 text-xs font-semibold">
                          <span title="Penelitian" className="text-violet-700">
                            {item.totalPenelitian} <span className="text-[11px] text-slate-400 font-normal">Lit</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span title="Pengabdian" className="text-rose-600">
                            {item.totalPengabdian} <span className="text-[11px] text-slate-400 font-normal">PKM</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span title="Publikasi" className="text-amber-600">
                            {item.totalPublikasi} <span className="text-[11px] text-slate-400 font-normal">Pub</span>
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs font-semibold text-emerald-600">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedUser(item)}
                          className="px-2.5 py-1.5 rounded-[8px] border border-[#CBD5E1] bg-white text-xs font-semibold text-slate-700 hover:text-violet-900 hover:bg-[#F3EEF9] transition-colors cursor-pointer shadow-2xs"
                        >
                          Lihat
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContainer>

      {/* Modal Detail Pengguna */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-[16px] border border-[#CBD5E1] shadow-2xl max-w-lg w-full p-6 relative">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-violet-700 text-white font-bold text-lg flex items-center justify-center">
                  {selectedUser.nama.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{selectedUser.nama}</h3>
                  <p className="text-xs text-slate-500 font-mono">NIDN: {selectedUser.nidn}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-[8px] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <EnvelopeIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="font-semibold text-slate-700">Email:</span>
                <span className="font-mono text-slate-800">{selectedUser.email || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <IdentificationIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="font-semibold text-slate-700">Fakultas / Prodi:</span>
                <span className="text-slate-800">
                  {selectedUser.fakultas} — {selectedUser.prodi}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <ShieldCheckIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="font-semibold text-slate-700">Role Terverifikasi:</span>
                <span className="font-bold text-violet-700">
                  {selectedUser.role} ({selectedUser.ssoRole})
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Aktivitas Tridharma Tercatat
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-[10px] bg-slate-50 border border-slate-200 text-center">
                    <p className="text-[11px] text-slate-500">Penelitian</p>
                    <p className="text-lg font-bold text-violet-700 mt-0.5">
                      {selectedUser.totalPenelitian}
                    </p>
                  </div>
                  <div className="p-3 rounded-[10px] bg-slate-50 border border-slate-200 text-center">
                    <p className="text-[11px] text-slate-500">Pengabdian</p>
                    <p className="text-lg font-bold text-rose-600 mt-0.5">
                      {selectedUser.totalPengabdian}
                    </p>
                  </div>
                  <div className="p-3 rounded-[10px] bg-slate-50 border border-slate-200 text-center">
                    <p className="text-[11px] text-slate-500">Publikasi</p>
                    <p className="text-lg font-bold text-amber-600 mt-0.5">
                      {selectedUser.totalPublikasi}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-[10px] bg-violet-700 hover:bg-violet-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPanelTemplate>
  );
};
