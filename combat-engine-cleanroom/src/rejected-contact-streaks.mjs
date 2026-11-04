/** Summarize contiguous per-tick rejected 3D contact observations.
 * Diagnostic only: a streak is not necessarily a unique attack.
 * The caller supplies chronological event order from deterministic simulation.
 */
export function summarizeRejectedContactStreaks(events) {
  if (!Array.isArray(events)) throw new TypeError('events must be an array');
  const streaks = [];
  const latest = new Map();
  let previousTick = -Infinity;
  for (const event of events) {
    if (!event || event.type !== 'shadow_contact_rejected') continue;
    if (!Number.isSafeInteger(event.tick) || event.tick < 0) {
      throw new TypeError('rejected contact tick must be a nonnegative safe integer');
    }
    if (event.tick < previousTick) throw new RangeError('events must be chronological');
    previousTick = event.tick;
    const key = JSON.stringify([event.attacker, event.defender, event.move]);
    const prior = latest.get(key);
    if (prior && event.tick <= prior.lastTick + 1) {
      if (event.tick > prior.lastTick) {
        prior.lastTick = event.tick;
        prior.observedTicks++;
      }
    } else {
      const streak = {
        attacker: event.attacker, defender: event.defender, move: event.move,
        firstTick: event.tick, lastTick: event.tick, observedTicks: 1
      };
      streaks.push(streak);
      latest.set(key, streak);
    }
  }
  return { observationCount: streaks.reduce((sum, s) => sum + s.observedTicks, 0),
    streakCount: streaks.length, streaks };
}
