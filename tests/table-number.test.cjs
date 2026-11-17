const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const source = fs.readFileSync(path.join(__dirname, '../src/client/components/DataTable.tsx'), 'utf8');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText, { exports: exportsObject, require });
for (const legacy of [[], [{ key: 'no', header: 'NO' }], [{ key: 'nomor', header: 'No' }]]) {
  const html = renderToStaticMarkup(React.createElement(exportsObject.DataTable, {
    columns: [...legacy, { key: 'nomorDokumen', header: 'Nomor Dokumen' }],
    rows: [{ id: 8, nomorDokumen: 'DOC-8' }, { id: 3, nomorDokumen: 'DOC-3' }],
    rowKey: (row) => row.id,
  }));
  assert.equal((html.match(/>No<\/th>/g) || []).length, 1);
  assert.match(html, /text-center normal-case">No<\/th>/);
  assert.match(html, /text-center tabular-nums">1<\/td>/);
  assert.match(html, /text-center tabular-nums">2<\/td>/);
  assert.ok(html.includes('DOC-8') && html.includes('DOC-3'));
}
console.log('PASS: kolom No tunggal, nomor urut dan rata tengah; nomor dokumen tetap utuh');
