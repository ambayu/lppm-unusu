# Pemisahan Admin Per Aplikasi (App-Scoped Admin)

Dokumen ini menetapkan kebijakan **satu admin hanya untuk satu aplikasi** pada ekosistem
ONE UNUSU, khususnya relasi **LPPM UNUSU ↔ LPM UNUSU**.

## 1. Matriks Peran

| Peran SSO | Aplikasi pemilik | Panel LPPM | Panel LPM |
|---|---|---|---|
| `SUPERADMIN` | ONE UNUSU (lintas aplikasi) | ✅ diizinkan | ✅ diizinkan |
| `ADMIN_LPPM` | LPPM UNUSU | ✅ admin penuh | ❌ **ditolak** |
| `ADMIN_LPM` | LPM UNUSU | ❌ **ditolak** | ✅ admin penuh |
| `ADMIN_ESURAT` / `ADMIN_SARPRAS` / `ADMIN_AKREDITASI` / `ADMIN_LMS` | Aplikasi masing-masing | ❌ ditolak | ❌ ditolak |
| `ADMIN_SSO` | ONE UNUSU Gateway | ❌ ditolak | ❌ ditolak |
| `DOSEN` | LPPM & LPM (peran fungsional) | ✅ baca & usul | ✅ auditor/baca |
| `MAHASISWA` | — | ❌ ditolak | ❌ ditolak |

Prinsip: **peran admin bersifat eksklusif per aplikasi**; hanya `SUPERADMIN` dan peran
fungsional (`DOSEN`) yang lintas aplikasi.

## 2. Titik Penegakan (LPPM UNUSU)

| Lapisan | Berkas | Perilaku |
|---|---|---|
| Kebijakan klien | `src/client/lib/appAccess.ts` | `APP_SCOPE = 'lppm'`, `LPPM_ALLOWED_SSO_ROLES`, `FOREIGN_APP_ADMIN_ROLES`, `evaluatePanelAccess()` |
| Tukar token SSO | `src/server/index.ts` → `POST /api/auth/sso` | `403 FOREIGN_APP_ADMIN` + label aplikasi pemilik peran; sesi tidak diterbitkan |
| Middleware API | `src/server/index.ts` → `authenticate` | Menolak JWT dengan klaim `app ≠ "lppm"` (`FOREIGN_APP_TOKEN`) dan peran admin aplikasi lain (`FOREIGN_APP_ADMIN`) |
| Info sesi | `src/server/index.ts` → `GET /api/auth/session` | Mengembalikan `app`, `appName`, `isAdmin`, `canManageSystem`, `permissions` |
| Guard rute | `src/client/components/AppScopeGuard.tsx` | Merender halaman 403 untuk sesi yang tidak berhak |
| Guard admin | `src/client/App.tsx` → `AdminOnlyRoute` | Dosen dialihkan dari `/pengguna`, `/peran`, `/izin` ke `/penelitian` |
| Halaman 403 | `src/client/pages/AksesDitolak.tsx` | Menjelaskan peran, panel yang sesuai, dan aksi keluar/masuk ulang |
| Navigasi | `src/client/components/SidebarLayout.tsx` | Blok *Manajemen Admin* hanya tampil untuk admin LPPM |
| Klien HTTP | `src/client/services/api.ts` | `403` cakupan aplikasi → bersihkan sesi → `/akses-ditolak` |

Aplikasi LPM menerapkan kebijakan cermin (`LPM_APP_ROLES`, `FOREIGN_APP_ADMIN_ROLES`
berisi `ADMIN_LPPM`) sehingga admin LPPM ditolak saat login ke panel LPM.

## 3. Kontrak Error

```json
{
  "success": false,
  "code": "FOREIGN_APP_ADMIN",
  "app": "lppm",
  "foreignApp": "LPM UNUSU",
  "role": "ADMIN_LPM",
  "message": "Akun administrator LPM UNUSU tidak dapat masuk ke panel LPPM UNUSU..."
}
```

Kode lain: `ROLE_NOT_ALLOWED`, `FOREIGN_APP_TOKEN`.

## 4. Checklist QA

1. Login `ADMIN_LPPM` di LPPM → berhasil, badge peran "Admin LPPM", menu Pengguna/Peran/Izin tampil.
2. Login `ADMIN_LPM` di LPPM → ditolak, diarahkan ke `/akses-ditolak` dengan alasan "peran milik LPM UNUSU".
3. Login `ADMIN_LPPM` di LPM (`:5177`) → ditolak dengan pesan serupa.
4. Sesi lama di localStorage dengan peran admin aplikasi lain → panel tidak dirender, halaman 403 muncul.
5. Panggilan API langsung (`curl`) memakai token admin LPM → `403 FOREIGN_APP_ADMIN`.
6. Dosen membuka `/peran` via URL → dialihkan ke `/penelitian`.
7. Token dengan klaim `app: "lpm"` dipakai di API LPPM → `403 FOREIGN_APP_TOKEN`.

## 5. Aturan Perubahan

- Menambah peran SSO baru **wajib** memperbarui `LPPM_ALLOWED_SSO_ROLES` (klien) dan
  `LPPM_ALLOWED_SSO_ROLES`/`FOREIGN_APP_ADMIN_ROLES` (server) secara bersamaan.
- Jangan pernah melonggarkan `authenticate` menjadi "token sah = boleh masuk"; cakupan
  aplikasi harus selalu diperiksa.
- Perubahan kebijakan harus disertai pembaruan tabel matriks di dokumen ini dan entri `CHANGELOG.md`.
