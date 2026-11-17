# Halaman publik LPPM

## Lingkup

Halaman informasi publik terpisah dari panel terproteksi. Desain mempertahankan
violet/amber/slate serta aset landing existing; bukan template CRUD admin.

## Rute dan struktur

| Rute | Isi |
|---|---|
| `/` | Beranda, hero, pengantar, layanan, skema hibah, kinerja dan alur pengajuan |
| `/#layanan` | Seksi layanan pada landing utama |
| `/#skema` | Seksi skema hibah pada landing utama |
| `/#statistik` | Seksi ketersediaan capaian publik pada landing utama |
| `/#alur` | Seksi tahapan pengajuan pada landing utama |
| `/monev-survei` dan turunannya | Survei publik existing, tidak diubah |

Navbar dan footer dipakai bersama. Menu desktop ringkas: Beranda, Monev,
Layanan, Informasi; Informasi mengelompokkan Skema Hibah, Kinerja dan Alur
Pengajuan. Label tidak membungkus; layar di bawah breakpoint xl memakai menu
hamburger. Identitas akun dipadatkan tanpa mengubah akses panel existing.

Layanan dan semua item Informasi menggulir ke seksi landing utama, bukan
halaman terpisah. Rute `/layanan`, `/skema-hibah`, `/kinerja` dan
`/alur-pengajuan` tetap tersedia sebagai redirect kompatibilitas ke anchor.

## Batas akses dan data

Halaman publik tidak boleh mengambil daftar rekaman panel terproteksi hanya
untuk menghitung statistik. Jangan menambahkan endpoint publik atau membuka
otorisasi API sebagai efek samping pemisahan halaman. Jangan mengarang angka
capaian; bila belum tersedia data publik, tampilkan keterangan yang jujur.
Navigasi internal memakai router agar basename `/lppm/` tetap berlaku.

Lihat [aturan proyek](../../PROJECT_RULES.md) dan
[registri template](../../design-system/PAGE_TEMPLATES.md).
