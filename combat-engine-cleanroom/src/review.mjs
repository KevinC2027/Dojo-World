/**
 * Deterministic clean-room combat review fixtures.
 *
 * A review is a replay of actual CombatWorld.step() inputs, not artist-authored
 * footage. Snapshot frames are kept in memory for accurate scrubbing.
 * The current engine uses range-based proxy contacts; this recorder does
 * not pretend to validate skeletal impact.
 */
import { CombatWorld, TICK_RATE } from './engine.mjs';

export const REVIEW_SCHEMA_VERSION = 1;

export const REVIEW_SCENARIOS = Object.freeze([
  Object.freeze({
    id: 'palm-contact',
    name: 'Palm strike contact',
    description: 'Blue palm versus unguarded Red at close range',
    startingGap: 1.3,
    frames: 80
  }),
  Object.freeze({
    id: 'guarded-cross',
    name: 'Guarded cross',
    description: 'Red cross into Blue frontal guard',
    startingGap: 1.3,
    frames: 90
  }),
  Object.freeze({
    id: 'simultaneous-trade',
    name: 'Simultaneous trade',
    description: 'Blue palm and Red jab overlap during active frames',
    startingGap: 1.15,
    frames: 80
  }),
  Object.freeze({
    id: 'range-miss',
    name: 'Out-of-range miss',
    description: 'Blue palm at three and a half meters must not connect',
    startingGap: 3.5,
    frames: 80
  })
]);

const own = (id) => REVIEW_SCENARIOS.find((item) => item.id === id);

function scenarioInputs(id, zeroBasedStep) {
  const blue = {};
  const red = {};
  if (id === 'palm-contact' && zeroBasedStep === 0) blue.attack = 'palm';
  if (id === 'guarded-cross') {
    if (zeroBasedStep === 0) red.attack = 'cross';
    if (zeroBasedStep <= 25) blue.guard = true;
  }
  if (id === 'simultaneous-trade') {
    // Was straight-vs-jab one frame apart; the jab's startup went 4 -> 7
    // ticks for hand continuity. Both launch together now: a reactive jab no
    // longer overlaps the straight, and a palm launched a frame earlier stuns
    // Red before the jab's first active tick.
    if (zeroBasedStep === 0) { blue.attack = 'palm'; red.attack = 'jab'; }
  }
  if (id === 'range-miss' && zeroBasedStep === 0) blue.attack = 'palm';
  return { blue, red };
}

function isFrameRecord(record) {
  return record && Number.isInteger(record.tick) &&
    record.snapshot && Array.isArray(record.events);
}

export function buildReviewReplay(id) {
  const scenario = own(id);
  if (!scenario) throw new RangeError('Unknown review scenario: ' + id);
  const world = new CombatWorld({ startingGap: scenario.startingGap });
  const frames = [{ tick: 0, input: null, snapshot: world.snapshot(), events: [] }];
  const events = [];
  for (let step = 0; step < scenario.frames && !world.finished; step++) {
    const input = scenarioInputs(id, step);
    const changes = world.step(input);
    events.push(...changes);
    frames.push({
      tick: world.tick,
      input: structuredClone(input),
      snapshot: world.snapshot(),
      events: structuredClone(changes)
    });
  }
  const counts = Object.freeze({
    hit: events.filter((e) => e.type === 'hit').length,
    blocked: events.filter((e) => e.type === 'blocked').length,
    knockout: events.filter((e) => e.type === 'knockout').length
  });
  return {
    schemaVersion: REVIEW_SCHEMA_VERSION,
    engineRateHz: TICK_RATE,
    contactAuthority: 'range_proxy_v1',
    scenario: { ...scenario },
    frames,
    events,
    counts
  };
}

export function frameAt(replay, tick) {
  if (!replay || !Array.isArray(replay.frames) || replay.frames.length === 0) {
    throw new TypeError('Replay with frames required');
  }
  if (!Number.isFinite(tick)) throw new TypeError('Finite tick required');
  const index = Math.max(0, Math.min(replay.frames.length - 1, Math.round(tick)));
  const frame = replay.frames[index];
  if (!isFrameRecord(frame)) throw new TypeError('Invalid review frame');
  return frame;
}

const cleanText = (value, limit) => String(value ?? '').trim().slice(0, limit);

export function reviewPacket(replay, { tick = 0, decision = 'needs-work', notes = '', build = 'unpublished' } = {}) {
  if (!['approved', 'needs-work', 'unreviewed'].includes(decision)) {
    throw new RangeError('Unknown review decision');
  }
  const frame = frameAt(replay, tick);
  const key = replay.scenario.id + ':' + frame.tick;
  return {
    schemaVersion: REVIEW_SCHEMA_VERSION,
    project: 'Dojo World clean-room combat',
    build: cleanText(build, 100),
    scenario: replay.scenario.id,
    frame: frame.tick,
    replayKey: key,
    engineRateHz: replay.engineRateHz,
    contactAuthority: replay.contactAuthority,
    decision,
    notes: cleanText(notes, 2500),
    observedEvents: frame.events.map(({ tick, type, attacker, defender, fighter, move }) => ({
      tick, type, attacker: attacker ?? null,
      defender: defender ?? fighter ?? null, move: move ?? null
    })),
    scenarioCounts: { ...replay.counts }
  };
}
