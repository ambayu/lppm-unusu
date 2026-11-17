const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
for (const name of ['MonevPeriode', 'MonevKategori', 'MonevSoal', 'MonevResponden']) {
  const filename = path.join(root, 'src/client/pages', `${name}.tsx`);
  const source = fs.readFileSync(filename, 'utf8');
  assert.match(source, /<ListPageTemplate\b/, `${name}: shared list template`);
  assert.doesNotMatch(source, /<table\b|\b(?:window\.)?(?:alert|confirm)\s*\(|:\s*any\b|as\s+any\b/, `${name}: no inline table, browser dialogs or any`);
  assert.match(source, /header: 'Dibuat'/, `${name}: audit column`);
  assert.match(source, /deskripsikanGalat/, `${name}: typed error feedback`);
  if (name !== 'MonevResponden') {
    assert.match(source, /useParams<\{ id: string \}>/, `${name}: route-based edit`);
    assert.match(source, /<FormPageTemplate\b/, `${name}: full-page form`);
    assert.match(source, /<CardContainer title=/, `${name}: named field section`);
    assert.match(source, /submitting=\{submitting\} submitDisabled=\{loading \|\| Boolean\(formError\)\}/, `${name}: fetch readiness separate from submission`);
    assert.match(source, />Tambah Data<\//, `${name}: standard primary action`);
    assert.doesNotMatch(source, /fixed inset-0|setFormOpen/, `${name}: no CRUD modal`);
  }
  const result = ts.transpileModule(source, { fileName: filename, reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  assert.equal(result.diagnostics.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error).length, 0, `${name}: valid TSX syntax`);
}
const periode = fs.readFileSync(path.join(root, 'src/client/pages/MonevPeriode.tsx'), 'utf8');
assert.match(periode, /useMatch\('\/admin\/monev-periode\/tambah'\)/);
assert.match(periode, /to=\{`\/admin\/monev-periode\/edit\//);
const soal = fs.readFileSync(path.join(root, 'src/client/pages/MonevSoal.tsx'), 'utf8');
assert.match(soal, /type="confirm"/);
assert.match(soal, /Jawaban responden terkait pertanyaan ini juga akan terhapus/);
const responden = fs.readFileSync(path.join(root, 'src/client/pages/MonevResponden.tsx'), 'utf8');
assert.match(responden, /res\.data\.meta\.total/);
assert.match(responden, /jawaban\.nilaiTeks/);
assert.match(responden, /<dialog\b/);
assert.match(responden, /page \* 20 >= total/);
console.log('Monev template source regression checks passed (4 pages).');
