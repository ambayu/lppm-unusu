const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const pages = ['Penelitian', 'Pengabdian', 'Publikasi', 'Monev', 'Izin', 'Kategori', 'Dokumen', 'Pengguna', 'Peran'];
for (const page of pages) {
  const source = fs.readFileSync(path.join(__dirname, `../src/client/pages/${page}.tsx`), 'utf8');
  assert.doesNotMatch(source, /\b(?:alert|confirm)\s*\(/, `${page}: tanpa dialog peramban`);
  assert.doesNotMatch(source, /catch\s*\(err:\s*any\)/, `${page}: galat unknown`);
  assert.match(source, /<RowActionButton\b/, `${page}: aksi baris bersama`);
  assert.match(source, /variant="danger"/, `${page}: aksi destruktif`);
  assert.match(source, /<ListActionButton\b/, `${page}: aksi header bersama`);
  assert.match(source, /type="confirm"/, `${page}: konfirmasi tetap tersedia`);
  assert.match(source, /deskripsikanGalat\(err,/, `${page}: rincian galat server`);
  assert.match(source, /details=\{galat\?\.details\}/, `${page}: rincian galat ditampilkan`);
  const result = ts.transpileModule(source, {
    fileName: `${page}.tsx`,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
    reportDiagnostics: true,
  });
  assert.deepEqual(result.diagnostics, [], `${page}: sintaks TSX valid`);
}
for (const page of ['Penelitian', 'Monev']) {
  const source = fs.readFileSync(path.join(__dirname, `../src/client/pages/${page}.tsx`), 'utf8');
  assert.match(source, /isOpen=\{pesanEkspor\} type="info"/, `${page}: umpan balik ekspor kosong`);
}
const users = fs.readFileSync(path.join(__dirname, '../src/client/pages/Pengguna.tsx'), 'utf8');
assert.match(users, /!isSuperadmin\(item\) &&/, 'Pengguna: perlindungan SUPERADMIN');
const roles = fs.readFileSync(path.join(__dirname, '../src/client/pages/Peran.tsx'), 'utf8');
assert.match(roles, /role\.kode === 'SUPERADMIN'/, 'Peran: perlindungan SUPERADMIN');
console.log(`PASS: aksi, konfirmasi, galat, izin dan sintaks ${pages.length} halaman daftar`);
