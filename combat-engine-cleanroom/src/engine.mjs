import { contactTelemetry } from './contact.mjs';
import { strikeContactProbe } from './collision-probe.mjs';
/**
 * Dojo World combat clean-room — version 0.1.
 * Fresh implementation. No dependency on previous project source.
 *
 * Units: horizontal meters (x,z), seconds, 60 fixed simulation ticks/sec.
 * Vertical/ragdoll dynamics and rendering are explicitly NOT implemented yet.
 */
export const TICK_RATE = 60;
const DT = 1 / TICK_RATE;
const EPS = 1e-9;
const RADIUS = 0.42;
const WALK_SPEED = 3.2;
const GUARD_SPEED_SCALE = 0.42;
const ATTACK_SPEED_SCALE = 0.18;
const ACCELERATION = 25;
const STAMINA_REGEN_PER_SEC = 9;
const KO_HEAD_STRAIN = 95;
const KO_BODY_STRAIN = 120;
const MIN_GUARD_STAMINA = 3;
const ATTACK_BUFFER_TICKS = 8; // One queued press, valid for eight fixed steps.
const MAX_TURN_RADIANS_PER_TICK = Math.PI * 1.5 / TICK_RATE; // 270 degrees/second
const GUARD_CONE_COS = Math.cos(Math.PI * 65 / 180); // +/-65 degrees from facing

const defineMove = (startup, active, recovery, range, cost, impact, target, stun, push) =>
  Object.freeze({ startup, active, recovery, range, cost, impact, target, stun, push });

// New action definitions. Frame timing is authoritative; rendering follows state.
export const MOVESETS = Object.freeze({
  blue: Object.freeze({
    palm: defineMove(7, 3, 12, 1.18, 8, 13, 'head', 11, 0.85),
    straight: defineMove(5, 2, 13, 1.30, 7, 11, 'head', 8, 0.62),
    frontKick: defineMove(12, 4, 17, 1.72, 15, 21, 'body', 16, 1.4)
  }),
  red: Object.freeze({
    jab: defineMove(4, 2, 10, 1.25, 6, 9, 'head', 7, 0.52),
    cross: defineMove(9, 3, 18, 1.38, 13, 19, 'head', 15, 1.2),
    hook: defineMove(11, 3, 19, 1.06, 14, 22, 'head', 16, 1.0)
  })
});

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const norm = (v) => {
  const length = Math.hypot(v.x, v.z);
  return length < EPS ? { x: 0, z: 0 } : { x: v.x / length, z: v.z / length };
};
const dist = (a, b) => Math.hypot(a.position.x - b.position.x, a.position.z - b.position.z);
const active = (f) => !f.knockedOut && f.stunFrames === 0;
const dot = (a, b) => a.x * b.x + a.z * b.z;
const rotateToward = (current, target, limit) => {
  if (Math.hypot(target.x, target.z) < EPS) return current;
  const from = Math.atan2(current.z, current.x);
  const to = Math.atan2(target.z, target.x);
  const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  const next = from + clamp(delta, -limit, limit);
  return { x: Math.cos(next), z: Math.sin(next) };
};

const createFighter = (id, x) => ({
  id,
  massKg: id === 'blue' ? 78 : 85,
  position: { x, y: 0, z: 0 },
  velocity: { x: 0, z: 0 },
  facing: { x: id === 'blue' ? 1 : -1, z: 0 },
  stamina: 100,
  condition: { headStrain: 0, bodyStrain: 0 },
  knockedOut: false,
  stunFrames: 0,
  action: null,
  bufferedAttack: null,
  guarding: false
});

const assertInput = (input) => {
  if (input === undefined || input === null) return {};
  if (typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Input must be an object');
  if (input.move !== undefined &&
    (!Number.isFinite(input.move?.x) || !Number.isFinite(input.move?.z))) {
    throw new TypeError('Movement needs finite x and z components');
  }
  return input;
};

export class CombatWorld {
  constructor({ startingGap = 1.5 } = {}) {
    if (!Number.isFinite(startingGap) || startingGap < RADIUS * 2) {
      throw new RangeError('startingGap must be finite and >= 0.84 meters');
    }
    this.tick = 0;
    this.finished = false;
    this.winner = null;
    this.fighters = {
      blue: createFighter('blue', -startingGap / 2),
      red: createFighter('red', startingGap / 2)
    };
  }

  snapshot() {
    return structuredClone({
      tick: this.tick,
      timeSeconds: this.tick * DT,
      finished: this.finished,
      winner: this.winner,
      fighters: this.fighters
    });
  }

  /** A single deterministic fixed-step frame. Press attack in one frame to request it. */
  step(frame = {}) {
    if (this.finished) return [];
    const inputs = {
      blue: assertInput(frame.blue),
      red: assertInput(frame.red)
    };
    const events = [];
    this.tick += 1;
    const blue = this.fighters.blue;
    const red = this.fighters.red;
    // Capture tick-start geometry before movement, separation, and facing changes.
    // Shadow collision must use the same tick boundary on both fighters.
    const previousPose = {
      blue: { position: { ...blue.position }, facing: { ...blue.facing } },
      red: { position: { ...red.position }, facing: { ...red.facing } }
    };

    for (const fighter of [blue, red]) {
      const input = inputs[fighter.id];
      if (fighter.stunFrames > 0) fighter.stunFrames--;
      // Buffer only during recovery. An invalid attack never replaces a valid queued press.
      // The queue is intentionally discarded on stun/KO, and cannot bypass guarding.
      if (!active(fighter)) fighter.bufferedAttack = null;
      if (fighter.bufferedAttack && this.tick > fighter.bufferedAttack.expiresAt) {
        fighter.bufferedAttack = null;
      }
      if (fighter.action?.phase === 'recovery' && input.attack !== undefined &&
          Object.hasOwn(MOVESETS[fighter.id], input.attack)) {
        fighter.bufferedAttack = {
          name: input.attack, expiresAt: this.tick + ATTACK_BUFFER_TICKS - 1
        };
        events.push({ tick: this.tick, type: 'attack_buffered', fighter: fighter.id, move: input.attack });
      }
      fighter.guarding = active(fighter) && !fighter.action && !!input.guard &&
        fighter.stamina >= MIN_GUARD_STAMINA;

      const queued = fighter.bufferedAttack?.name;
      const requested = input.attack !== undefined ? input.attack : queued;
      if (active(fighter) && !fighter.guarding && !fighter.action && requested !== undefined) {
        const move = Object.hasOwn(MOVESETS[fighter.id], requested)
          ? MOVESETS[fighter.id][requested] : null;
        if (move && fighter.stamina >= move.cost) {
          fighter.stamina -= move.cost;
          fighter.bufferedAttack = null;
          fighter.action = {
            name: requested,
            phase: 'startup',
            framesLeft: move.startup,
            connected: false
          };
          events.push({ tick: this.tick, type: 'attack_started', fighter: fighter.id, move: requested });
        }
      }
      const direction = norm(input.move ?? { x: 0, z: 0 });
      const speedFactor = fighter.knockedOut || fighter.stunFrames > 0 ? 0 :
        fighter.action ? ATTACK_SPEED_SCALE : fighter.guarding ? GUARD_SPEED_SCALE : 1;
      const target = {
        x: direction.x * WALK_SPEED * speedFactor,
        z: direction.z * WALK_SPEED * speedFactor
      };
      const dv = ACCELERATION * DT;
      for (const axis of ['x', 'z']) {
        fighter.velocity[axis] += clamp(target[axis] - fighter.velocity[axis], -dv, dv);
        fighter.position[axis] += fighter.velocity[axis] * DT;
      }
      fighter.stamina = clamp(fighter.stamina + STAMINA_REGEN_PER_SEC * DT, 0, 100);
    }

    // Deterministic 2D capsule-footprint separation; no interpenetrating fighters.
    const difference = { x: red.position.x - blue.position.x, z: red.position.z - blue.position.z };
    const gap = Math.hypot(difference.x, difference.z);
    if (gap < RADIUS * 2) {
      const n = gap < EPS ? { x: 1, z: 0 } : { x: difference.x / gap, z: difference.z / gap };
      const correction = (RADIUS * 2 - gap) * 0.5;
      blue.position.x -= n.x * correction;
      blue.position.z -= n.z * correction;
      red.position.x += n.x * correction;
      red.position.z += n.z * correction;
    }

    // Turn by a bounded angular step. A sudden cross-over cannot flip facing instantly.
    for (const [self, other] of [[blue, red], [red, blue]]) {
      self.facing = rotateToward(self.facing, {
        x: other.position.x - self.position.x,
        z: other.position.z - self.position.z
      }, MAX_TURN_RADIANS_PER_TICK);
    }

    // Collect all contacts BEFORE applying damage: simultaneous hits can trade fairly.
    const contacts = [];
    for (const [attacker, defender] of [[blue, red], [red, blue]]) {
      if (!attacker.action || attacker.action.phase !== 'active' || attacker.action.connected) continue;
      const move = MOVESETS[attacker.id][attacker.action.name];
      const d = dist(attacker, defender);
      const toward = norm({
        x: defender.position.x - attacker.position.x,
        z: defender.position.z - attacker.position.z
      });
      const frontDot = attacker.facing.x * toward.x + attacker.facing.z * toward.z;
      const proxyEligible = d <= move.range + RADIUS && d >= RADIUS * 2 - EPS && frontDot >= 0.65;
      // Evaluate shadow geometry for *all* active attempts, including proxy rejects.
      // This remains observational: only the existing proxy gate can cause damage.
      const collisionProbe = strikeContactProbe(
        attacker, defender, attacker.action.name,
        move.active - attacker.action.framesLeft, move.active,
        { attacker: previousPose[attacker.id], defender: previousPose[defender.id] }
      );
      if (proxyEligible) {
        contacts.push({ attacker, defender, move, moveName: attacker.action.name, collisionProbe });
        attacker.action.connected = true;
      } else if (collisionProbe.intersected) {
        events.push({
          tick: this.tick, type: 'shadow_contact_rejected',
          attacker: attacker.id, defender: defender.id, move: attacker.action.name,
          reason: '3d_intersection_without_range_authority', collisionProbe
        });
      }
    }
    for (const { attacker, defender, move, moveName, collisionProbe } of contacts) {
      const incoming = norm({ x: attacker.position.x - defender.position.x, z: attacker.position.z - defender.position.z });
      const guarded = defender.guarding && defender.stamina >= MIN_GUARD_STAMINA &&
        dot(defender.facing, incoming) >= GUARD_CONE_COS;
      const strain = guarded ? move.impact * 0.12 : move.impact;
      const conditionKey = move.target === 'head' ? 'headStrain' : 'bodyStrain';
      defender.condition[conditionKey] += strain;
      if (guarded) defender.stamina = clamp(defender.stamina - move.impact * 1.0, 0, 100);
      else {
        defender.stunFrames = Math.max(defender.stunFrames, move.stun);
        defender.action = null; // Contact can interrupt recovery/startup; trade already collected.
        defender.bufferedAttack = null; // An interrupted combo must not auto-fire after stun.
      }
      const impulse = (guarded ? 0.22 : 1) * move.push / defender.massKg * 75;
      const away = norm({ x: defender.position.x - attacker.position.x, z: defender.position.z - attacker.position.z });
      defender.velocity.x += away.x * impulse;
      defender.velocity.z += away.z * impulse;
      events.push({
        tick: this.tick, type: guarded ? 'blocked' : 'hit', attacker: attacker.id,
        defender: defender.id, move: moveName, target: move.target,
        strain: Number(strain.toFixed(3)),
        contact: contactTelemetry(attacker, defender, moveName, move.target),
        collisionProbe,
        // Diagnostic only: a range-authorized hit with no swept 3D contact
        // is an explicit discrepancy, never an implicit authoritative miss.
        contactDiscrepancy: collisionProbe.intersected ? null : 'range_hit_without_3d_intersection'
      });
      if (defender.condition.headStrain >= KO_HEAD_STRAIN ||
          defender.condition.bodyStrain >= KO_BODY_STRAIN) {
        defender.knockedOut = true;
        defender.action = null;
        defender.bufferedAttack = null;
        defender.guarding = false;
        events.push({ tick: this.tick, type: 'knockout', fighter: defender.id });
      }
    }

    // State advance after contact resolution; every phase consumes exact frame counts.
    for (const fighter of [blue, red]) {
      const state = fighter.action;
      if (!state) continue;
      state.framesLeft--;
      if (state.framesLeft > 0) continue;
      const move = MOVESETS[fighter.id][state.name];
      if (state.phase === 'startup') {
        state.phase = 'active'; state.framesLeft = move.active;
      } else if (state.phase === 'active') {
        state.phase = 'recovery'; state.framesLeft = move.recovery;
      } else {
        fighter.action = null;
        events.push({ tick: this.tick, type: 'attack_finished', fighter: fighter.id });
      }
    }
    if (blue.knockedOut || red.knockedOut) {
      this.finished = true;
      this.winner = blue.knockedOut && red.knockedOut ? 'draw' : blue.knockedOut ? 'red' : 'blue';
      events.push({ tick: this.tick, type: 'match_finished', winner: this.winner });
    }
    return events;
  }
}
