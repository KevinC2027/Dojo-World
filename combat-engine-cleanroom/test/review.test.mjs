import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { REVIEW_SCENARIOS, buildReviewReplay, frameAt, reviewPacket } from '../src/review.mjs';

test('all four review scenarios create contiguous deterministic 60 Hz frames', () => {
  assert.equal(REVIEW_SCENARIOS.length, 4);
  for (const scenario of REVIEW_SCENARIOS) {
    const a=buildReviewReplay(scenario.id);
    const b=buildReviewReplay(scenario.id);
    assert.deepEqual(a,b);
    assert.equal(a.frames[0].tick,0);
    assert.equal(a.engineRateHz,60);
    assert.equal(a.contactAuthority,'range_proxy_v1');
    for(let i=0;i<a.frames.length;i++)assert.equal(a.frames[i].tick,i);
    for(const frame of a.frames)assert.ok(frame.snapshot.fighters.blue && frame.snapshot.fighters.red);
  }
});

test('contact, block, trade, and distance miss are preserved in review fixtures', () => {
  assert.equal(buildReviewReplay('palm-contact').counts.hit,1);
  assert.equal(buildReviewReplay('guarded-cross').counts.blocked,1);
  assert.equal(buildReviewReplay('simultaneous-trade').counts.hit,2);
  const miss=buildReviewReplay('range-miss');
  assert.equal(miss.counts.hit,0);
  assert.equal(miss.counts.blocked,0);
});

test('review frame scrubbing clamps and rejects invalid timeline input', () => {
  const r=buildReviewReplay('palm-contact');
  assert.equal(frameAt(r,-200).tick,0);
  assert.equal(frameAt(r,9999).tick,r.frames.length-1);
  assert.equal(frameAt(r,3.8).tick,4);
  assert.throws(()=>frameAt(r,NaN), TypeError);
  assert.throws(()=>frameAt({frames:[]},0),TypeError);
});

test('review packet contains grounded frame details, provenance, and bounded notes', () => {
  const r=buildReviewReplay('palm-contact');
  const p=reviewPacket(r,{tick:14,decision:'needs-work',notes:'X'.repeat(3000),build:'dev-example'});
  assert.equal(p.schemaVersion,1);
  assert.equal(p.scenario,'palm-contact');
  assert.equal(p.frame,14);
  assert.equal(p.replayKey,'palm-contact:14');
  assert.equal(p.build,'dev-example');
  assert.equal(p.contactAuthority,'range_proxy_v1');
  assert.equal(p.notes.length,2500);
  assert.deepEqual(p.scenarioCounts,r.counts);
  assert.throws(()=>reviewPacket(r,{decision:'fantastic'}),RangeError);
  assert.throws(()=>buildReviewReplay('does-not-exist'),RangeError);
});

test('review UI has accessible player, scenario picker, timeline, notes and export', () => {
  const html=readFileSync(new URL('../review.html',import.meta.url),'utf8');
  for(const id of ['stage','fallback','reviewPanel','reviewScenario','reviewRange','reviewPlay','reviewPrev','reviewNext','reviewSpeed','reviewNotes','reviewApprove','reviewReject','reviewCopy','reviewPacket']){
    assert.ok(html.includes('id="'+id+'"'),'missing control '+id);
  }
  assert.match(html,/from '\.\/src\/review\.mjs'/);
  assert.match(html,/from '\.\/src\/engine\.mjs'/);
  assert.doesNotMatch(html, /<script[^>]*\bsrc=/i);
  const script=html.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert.ok(script);
  const dir=mkdtempSync(join(tmpdir(),'dojo-review-'));
  try{
    const file=join(dir,'review.mjs');
    writeFileSync(file,script[1]);
    const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr||run.stdout);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
