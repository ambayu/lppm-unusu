import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

test('migration tables exist before indexes and foreign keys reference them', () => {
  const root = new URL('../prisma/migrations/', import.meta.url);
  const tables = new Set();
  for (const dir of readdirSync(root, { withFileTypes: true }).filter(entry => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const sql = readFileSync(new URL(`${dir.name}/migration.sql`, root), 'utf8').replace(/--[^\n]*/g, '');
    for (const statement of sql.split(';')) {
      const created = statement.match(/CREATE TABLE\s+`([^`]+)`/i);
      if (created) {
        assert.ok(!tables.has(created[1]), `${dir.name}: duplicate table ${created[1]}`);
        tables.add(created[1]);
      }
      for (const match of statement.matchAll(/(?:REFERENCES|ALTER TABLE|\bON)\s+`([^`]+)`/gi)) {
        assert.ok(tables.has(match[1]), `${dir.name}: missing prerequisite ${match[1]}`);
      }
      const dropped = statement.match(/DROP TABLE\s+(?:IF EXISTS\s+)?`([^`]+)`/i);
      if (dropped) tables.delete(dropped[1]);
    }
  }
  for (const table of ['lppm_roles', 'lppm_permissions', 'lppm_role_permissions', 'lppm_user_roles']) {
    assert.ok(tables.has(table), `missing RBAC table ${table}`);
  }
  const schema = readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8');
  for (const model of ['MonevPeriode', 'MonevSurvei', 'MonevPertanyaan', 'MonevRespon', 'MonevJawaban']) {
    const body = schema.match(new RegExp(`model ${model} \\{([\\s\\S]*?)\\n\\}`))?.[1];
    assert.ok(body, `missing schema model ${model}`);
    const table = body.match(/@@map\("([^"]+)"\)/)?.[1];
    assert.ok(tables.has(table), `missing migration for ${model}: ${table}`);
  }
});
