const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const read = (file) => readFileSync(join(__dirname, '..', 'src/client', file), 'utf8');
for (const page of ['Penelitian', 'Pengabdian', 'Publikasi', 'Monev', 'Izin', 'Pengguna', 'Dokumen', 'Kategori']) {
  assert.match(read(`pages/${page}.tsx`), /<ListPageTemplate/, `${page}: template daftar`);
}
assert.match(read('pages/Dashboard.tsx'), /<DashboardPageTemplate/);
assert.doesNotMatch(read('pages/Dashboard.tsx'), /<ListPageTemplate/);
assert.match(read('pages/Profil.tsx'), /<PageShell/);
assert.match(read('components/TabelPilihPengguna.tsx'), /<DataTable/);
assert.doesNotMatch(read('components/TabelPilihPengguna.tsx'), /<table\b/);
assert.match(read('components/FormPageTemplate.tsx'), /if \(submitting \|\| submitDisabled\)/);
for (const page of ['PenelitianForm', 'PengabdianForm', 'PublikasiForm', 'MonevForm', 'PeranForm', 'IzinForm', 'PenggunaForm', 'DokumenForm', 'KategoriForm']) {
  assert.match(read(`pages/${page}.tsx`), /submitDisabled=/, `${page}: kesiapan submit`);
}
for (const page of ['MonevPeriode', 'MonevKategori', 'MonevSoal', 'MonevResponden']) {
  const source = read(`pages/${page}.tsx`);
  assert.match(source, /<ListPageTemplate/, `${page}: template daftar`);
  assert.doesNotMatch(source, /<table\b/, `${page}: tidak ada tabel inline`);
  if (page !== 'MonevResponden') assert.match(source, /<FormPageTemplate/, `${page}: template form`);
}
for (const route of ['/slider/tambah', '/slider/edit/:id', '/admin/monev-periode/tambah', '/monev-kategori/tambah', '/monev-soal/tambah']) {
  assert.ok(read('App.tsx').includes(route), `Rute ${route}`);
}
console.log('PASS: template halaman, dashboard, direktori dan rute form');
