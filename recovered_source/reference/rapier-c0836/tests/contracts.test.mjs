import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildRapierThrowLab,GRAVITY,DT,shouldReleaseGrip,RELEASE_VERTICAL_SPEED,RELEASE_UPWARD_SPEED,jointAnchorGap,evaluateLandingContacts} from '../rapier-throw-lab.mjs';
const src=await readFile(new URL('../rapier-throw-lab.mjs',import.meta.url),'utf8');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));

test('Rapier 3D package pinned, not an unspecified latest version',()=>assert.equal(pkg.dependencies['@dimforge/rapier3d-compat'],'0.21.0'));
test('fixed 60 Hz timestep defined',()=>assert.equal(DT,1/60));
test('earth gravity correct in meters per second squared',()=>assert.equal(GRAVITY.y,-9.81));
test('real Rapier World construction present',()=>assert.match(src,/new RAPIER\.World\(GRAVITY\)/));
test('real engine world stepping, not a hand-made substitute',()=>assert.match(src,/world\.step\(queue\)/));
test('joint constraints exist',()=>assert.match(src,/world\.createImpulseJoint\(/));
test('kinematic hand uses next translation instead of teleporting dynamic bodies',()=>assert.match(src,/setNextKinematicTranslation\(/));
test('collision events sampled',()=>assert.match(src,/queue\.drainCollisionEvents\(/));
test('ground contact causes grip release',()=>assert.match(src,/shouldReleaseGrip\(backContactSeen,backVerticalSpeed\)/));
test('no per-frame direct dynamic-body teleportation',()=>assert.doesNotMatch(src,/\.body\.setTranslation\(/));
test('visible controls and error state on unavailable Rapier',()=>{assert.match(html,/Start shoulder-load fall/);assert.match(html,/Rapier unavailable — no physics running/);});
test('true runtime Rapier physics exercise',async t=>{
  let lib;try {lib=await import('@dimforge/rapier3d-compat');}catch{t.skip('Rapier not installed: npm registry blocked in this environment');return;}
  const R=lib.default||lib;await R.init();const lab=buildRapierThrowLab(R);assert.equal(lab.start(),true);const first=lab.metrics().torsoY;
  for(let i=0;i<200;i++)lab.step();const m=lab.metrics();assert.ok(Number.isFinite(m.torsoY));assert.ok(m.step===200);assert.ok(m.gravity===-9.81);assert.notEqual(m.torsoY,first);
  // Do not assert a safe landing until genuine physics traces demonstrate it.
  console.log('Rapier actual physics result',JSON.stringify({firstHit:m.firstGroundContact,headClearance:m.headClearance,gripGap:m.gripGap,backHit:m.upperBackContact}));
});

test('release requires actual back contact AND low torso speed',()=>{assert.equal(shouldReleaseGrip(false,0),false);assert.equal(shouldReleaseGrip(true,-2.79),false);assert.equal(shouldReleaseGrip(true,-0.34),true);assert.equal(shouldReleaseGrip(true,0),true);assert.equal(shouldReleaseGrip(true,NaN),false);assert.equal(RELEASE_VERTICAL_SPEED,0.35);assert.equal(shouldReleaseGrip(true,0.08),false);assert.equal(shouldReleaseGrip(true,0.051),false);assert.equal(shouldReleaseGrip(true,0.05),true);assert.equal(RELEASE_UPWARD_SPEED,0.05);});
test('head clearance is signed, not clamped to conceal penetration',()=>assert.match(src,/headClearance:head.y-\.15/));

test('3D joint anchor residual measures true world-space displacement',()=>{
 const id={x:0,y:0,z:0,w:1};
 const a={position:{x:1,y:2,z:3},rotation:id};
 const b={position:{x:1.03,y:2,z:3},rotation:id};
 assert.ok(Math.abs(jointAnchorGap(a,b,{x:0,y:0,z:0},{x:0,y:0,z:0})-.03)<1e-10);
 assert.ok(jointAnchorGap(a,a,{x:0,y:0,z:0},{x:0,y:0,z:0})<1e-10);
});
test('every physics frame exports skeletal joint error and center displacement telemetry',()=>{
 assert.match(src,/maxJointGap,maxCenterStep,jointAnchorGaps:anchors/);
 assert.match(src,/audit\('shoulder'\+s/);
 assert.match(src,/audit\('knee'\+s/);
});

test('landing gate rejects head-first even if back contacts later',()=>{
 const hits=[{part:'head',frame:8},{part:'upper_back',frame:9}];
 assert.equal(evaluateLandingContacts(hits,.22).reason,'WRONG_FIRST_CONTACT');
 assert.equal(evaluateLandingContacts([{part:'upper_back',frame:8}],.12).reason,'HEAD_CLEARANCE');
 assert.equal(evaluateLandingContacts([{part:'upper_back',frame:8}],.18).pass,true);
 assert.equal(evaluateLandingContacts([],.18).reason,'NO_CONTACT');
});

// C0834 deterministic regression: a later clearance failure cannot be erased by recovery.
test('C0834 minimum clearance is monotonic across contact frames',()=>{
 const sequence=[0.24,0.19,0.08,0.31];let min=Infinity;
 for(const h of sequence){min=Math.min(min,h);const result=evaluateLandingContacts([{part:'upper_back',frame:1}],min);
  assert.equal(result.pass,min>=0.15);
 }
 assert.equal(min,0.08);
});
