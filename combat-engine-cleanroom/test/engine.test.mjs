import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatWorld, MOVESETS, TICK_RATE } from '../src/engine.mjs';

const stepN = (world, n, input = {}) => Array.from({ length: n }, () => world.step(input)).flat();

function attackThenResolve(world, who, attack) {
  const events = world.step({ [who]: { attack } });
  return events.concat(stepN(world, 55));
}

test('fixed frame count and immutable snapshots', () => {
  const w = new CombatWorld();
  stepN(w, 120);
  const snapshot = w.snapshot();
  assert.equal(snapshot.tick, 120);
  assert.equal(snapshot.timeSeconds, 2);
  snapshot.fighters.blue.stamina = -100;
  assert.notEqual(w.fighters.blue.stamina, -100);
  assert.equal(TICK_RATE, 60);
});

test('invalid input and gap rejected', () => {
  assert.throws(() => new CombatWorld({ startingGap: 0.5 }), RangeError);
  assert.throws(() => new CombatWorld().step({ blue: { move: { x: Infinity, z: 0 } } }), TypeError);
});

test('blue palm has startup, makes exactly one contact then recovers', () => {
  const w = new CombatWorld({ startingGap: 1.3 });
  const initial = w.step({ blue: { attack: 'palm' } });
  assert.equal(initial.some(x => x.type === 'hit'), false);
  const events = initial.concat(stepN(w, 40));
  assert.equal(events.filter(x => x.type === 'hit').length, 1);
  assert.equal(events.filter(x => x.type === 'attack_finished').length, 1);
  assert.equal(w.fighters.red.condition.headStrain, MOVESETS.blue.palm.impact);
});

test('attack out of range cannot connect', () => {
  const w = new CombatWorld({ startingGap: 9 });
  const events = attackThenResolve(w, 'red', 'cross');
  assert.equal(events.filter(x => x.type === 'hit').length, 0);
  assert.equal(w.fighters.blue.condition.headStrain, 0);
});

test('guard absorbs most strain but costs stamina', () => {
  const w = new CombatWorld({ startingGap: 1.3 });
  let events = [];
  events.push(...w.step({ red: { attack: 'cross' }, blue: { guard: true } }));
  events.push(...stepN(w, 12, { blue: { guard: true } }));
  assert.equal(events.filter(x => x.type === 'blocked').length, 1);
  assert.ok(w.fighters.blue.condition.headStrain < 3);
  assert.ok(w.fighters.blue.stamina < 100);
});

test('simultaneous valid active frames allow trades', () => {
  const w = new CombatWorld({ startingGap: 1.25 });
  // Blue straight becomes active on tick 5, Red jab on tick 5 if launched one frame later.
  let events = [];
  events.push(...w.step({ blue: { attack: 'straight' } }));
  events.push(...w.step({ red: { attack: 'jab' } }));
  events.push(...stepN(w, 5));
  assert.equal(events.filter(x => x.type === 'hit').length, 2);
  assert.ok(w.fighters.blue.condition.headStrain > 0);
  assert.ok(w.fighters.red.condition.headStrain > 0);
});

test('movement cannot overlap fighter footprints', () => {
  const w = new CombatWorld({ startingGap: 1.0 });
  for (let i = 0; i < 220; i++) {
    w.step({ blue: { move: { x: 1, z: 0 } }, red: { move: { x: -1, z: 0 } } });
    const a = w.fighters.blue.position, b = w.fighters.red.position;
    assert.ok(Math.hypot(b.x - a.x, b.z - a.z) >= 0.84 - 1e-8);
  }
});

test('repeated blows can end the match without exposing a HUD health bar', () => {
  const w = new CombatWorld({ startingGap: 1.25 });
  let all = [];
  for (let i = 0; i < 12 && !w.finished; i++) {
    all.push(...attackThenResolve(w, 'blue', 'palm'));
  }
  assert.equal(w.winner, 'blue');
  assert.equal(all.filter(e => e.type === 'match_finished').length, 1);
  assert.equal(w.step().length, 0);
});

test('separate worlds with same inputs produce identical state and events', () => {
  const a = new CombatWorld(), b = new CombatWorld();
  for (let i = 0; i < 600; i++) {
    const input = {
      blue: i % 45 === 0 ? { attack: 'frontKick' } : { move: { x: 0.3, z: 0.1 } },
      red: i % 53 === 0 ? { attack: 'cross' } : { guard: i % 6 === 0 }
    };
    assert.deepEqual(a.step(input), b.step(input));
    assert.deepEqual(a.snapshot(), b.snapshot());
  }
});

test('facing rotates at a bounded angular speed rather than snapping', () => {
  const w = new CombatWorld({ startingGap: 1.5 });
  w.fighters.blue.facing = { x: 0, z: 1 };
  w.step();
  const actual = Math.atan2(w.fighters.blue.facing.z, w.fighters.blue.facing.x);
  assert.ok(actual > 0);
  assert.ok(actual < Math.PI / 2);
  assert.ok(Math.abs(actual - (Math.PI / 2 - Math.PI * 1.5 / 60)) < 1e-10);
});

test('guard only blocks incoming strikes inside the facing cone', () => {
  const w = new CombatWorld({ startingGap: 1.3 });
  w.fighters.blue.facing = { x: -1, z: 0 }; // looking away from Red
  const events = [ ...w.step({ red: { attack: 'cross' }, blue: { guard: true } }) ];
  for (let i = 0; i < 14; i++) events.push(...w.step({ blue: { guard: true } }));
  assert.equal(events.filter(e => e.type === 'blocked').length, 0);
  assert.equal(events.filter(e => e.type === 'hit').length, 1);
  assert.equal(w.fighters.blue.condition.headStrain, MOVESETS.red.cross.impact);
});

test('front-facing guard still blocks a strike', () => {
  const w = new CombatWorld({ startingGap: 1.3 });
  const events = [ ...w.step({ red: { attack: 'cross' }, blue: { guard: true } }) ];
  for (let i = 0; i < 14; i++) events.push(...w.step({ blue: { guard: true } }));
  assert.equal(events.filter(e => e.type === 'blocked').length, 1);
  assert.equal(events.filter(e => e.type === 'hit').length, 0);
});

test('recovery input buffer executes on the first free tick without skipping recovery', () => {
  const w = new CombatWorld({ startingGap: 1.3 });
  const events = [];
  events.push(...w.step({ blue: { attack: 'straight' } }));
  // The straight completes its startup and active frames, then enters recovery.
  for (let i = 0; i < 6; i++) events.push(...w.step());
  assert.equal(w.fighters.blue.action.phase, 'recovery');
  // Queue within eight ticks of the end of the straight's recovery.
  for (let i = 0; i < 6; i++) events.push(...w.step());
  events.push(...w.step({ blue: { attack: 'palm' } }));
  assert.equal(w.fighters.blue.bufferedAttack.name, 'palm');
  assert.equal(w.fighters.blue.action.name, 'straight');
  for (let i = 0; i < 6; i++) events.push(...w.step());
  assert.equal(w.fighters.blue.action, null);
  events.push(...w.step());
  assert.equal(w.fighters.blue.action.name, 'palm');
  assert.equal(events.filter(e => e.type === 'attack_started' && e.move === 'palm').length, 1);
});

test('expired buffered attack does not launch after recovery', () => {
  const w = new CombatWorld({ startingGap: 1.3 });
  w.step({ blue: { attack: 'frontKick' } });
  for (let i = 0; i < 16; i++) w.step();
  assert.equal(w.fighters.blue.action.phase, 'recovery');
  w.step({ blue: { attack: 'palm' } });
  for (let i = 0; i < 30; i++) w.step();
  assert.equal(w.fighters.blue.action, null);
  assert.equal(w.fighters.blue.bufferedAttack, null);
});

test('a hit interrupts and clears the defender recovery buffer', () => {
  const w = new CombatWorld({ startingGap: 1.3 });
  w.step({ blue: { attack: 'frontKick' }, red: { guard: true } });
  for (let i = 0; i < 16; i++) w.step({ red: { guard: true } });
  assert.equal(w.fighters.blue.action.phase, 'recovery');
  w.step({ blue: { attack: 'palm' }, red: { attack: 'jab' } });
  assert.equal(w.fighters.blue.bufferedAttack.name, 'palm');
  for (let i = 0; i < 8; i++) w.step();
  assert.ok(w.fighters.blue.stunFrames > 0);
  assert.equal(w.fighters.blue.bufferedAttack, null);
});

test('guard prevents a queued attack from firing while held', () => {
  const w = new CombatWorld({ startingGap: 1.3 });
  w.step({ blue: { attack: 'straight' } });
  for (let i = 0; i < 15; i++) w.step();
  assert.equal(w.fighters.blue.action.phase, 'recovery');
  w.step({ blue: { attack: 'palm' } });
  for (let i = 0; i < 4; i++) w.step({ blue: { guard: true } });
  assert.equal(w.fighters.blue.action, null);
  w.step({ blue: { guard: true } });
  assert.equal(w.fighters.blue.guarding, true);
  assert.equal(w.fighters.blue.action, null);
});
