import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('compatibility review has inline SVG visible without WebGL or JavaScript', () => {
  const html=readFileSync(new URL('../review-lite.html',import.meta.url),'utf8');
  assert.match(html, /<svg id="arena"/);
  assert.match(html, /id="blueActor"/);
  assert.match(html, /id="redActor"/);
  assert.doesNotMatch(html, /getContext\('webgl'/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  for(const id of ['timeline','play','speed','scenario','notes','feedback','copy','status']){
    assert.ok(html.includes('id="'+id+'"'),'missing '+id);
  }
});

test('compatibility review browser module parses as valid JavaScript', () => {
  const html=readFileSync(new URL('../review-lite.html',import.meta.url),'utf8');
  const script=html.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert.ok(script);
  const dir=mkdtempSync(join(tmpdir(),'dojo-lite-'));
  try{
    const file=join(dir,'review-lite.mjs');
    writeFileSync(file,script[1]);
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr||run.stdout);
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test('full 3D review links visibly to fallback review', () => {
  const html=readFileSync(new URL('../review.html',import.meta.url),'utf8');
  assert.match(html,/href="\.\/review-lite\.html"/);
});
