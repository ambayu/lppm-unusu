const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (file) => fs.readFileSync(path.join(__dirname, '../src/client', file), 'utf8');
for (const [route, hash] of [['/layanan', 'layanan'], ['/skema-hibah', 'skema'], ['/kinerja', 'statistik'], ['/alur-pengajuan', 'alur']]) {
  assert.ok(read('App.tsx').includes(`path="${route}"`), `Rute ${route}`);
  assert.ok(read('components/Navbar.tsx').includes(`to: '/#${hash}'`), `Menu ${route}`);
  assert.ok(read('pages/Landing.tsx').includes(`<Navigate to="/#${hash}" replace />`), `Kompatibilitas ${route}`);
}
const navbar = read('components/Navbar.tsx');
assert.match(navbar, /whitespace-nowrap/);
assert.match(navbar, /hidden xl:flex/);
assert.match(navbar, /<summary/);
const landing = read('pages/Landing.tsx');
for (const name of ['LandingPage', 'LayananPage', 'SkemaHibahPage', 'KinerjaPage', 'AlurPengajuanPage']) {
  assert.match(landing, new RegExp(`export (?:const|function) ${name}\\b`), name);
}
assert.doesNotMatch(landing, /fetchPenelitian|fetchPengabdian|fetchPublikasi/);
const home = landing.slice(landing.indexOf('export const LandingPage'), landing.indexOf('const LayananSection'));
for (const section of ['Layanan', 'SkemaHibah', 'Kinerja', 'AlurPengajuan']) {
  assert.ok(home.includes(`<${section}Section />`), `${section} pada beranda`);
}
assert.match(home, /getElementById\(location.hash.slice\(1\)\)/);
console.log('PASS: seksi landing utama, menu anchor, redirect kompatibilitas dan batas data panel');
