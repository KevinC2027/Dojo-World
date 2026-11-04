import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('mobile preview includes visible no-script fallback, graphics surface, and controls', () => {
  assert.match(html, /id="fallback"/);
  assert.match(html, /id="stage"/);
  assert.match(html, /id="error"/);
  for (const move of ['palm', 'straight', 'frontKick']) {
    assert.ok(html.includes('data-attack="' + move + '"'), 'missing button: ' + move);
  }
  for (const direction of ['forward', 'back', 'left', 'right', 'guard']) {
    assert.ok(html.includes('data-hold="' + direction + '"'), 'missing control: ' + direction);
  }
  assert.match(html, /viewport-fit=cover/);
});

test('preview loads ONLY the clean-room engine, with no external libraries', () => {
  assert.match(html, /from '\.\/src\/engine\.mjs'/);
  assert.doesNotMatch(html, /<script[^>]*\bsrc=/i);
  assert.doesNotMatch(html, /cdn\.|three\.js|replit|legacy/i);
});

test('inline graphics module passes JavaScript syntax check', () => {
  const match = html.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert.ok(match, 'expected one inline browser module');
  const dir = mkdtempSync(join(tmpdir(), 'dojo-preview-'));
  const file = join(dir, 'preview.mjs');
  try {
    writeFileSync(file, match[1]);
    const run = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr || run.stdout);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
