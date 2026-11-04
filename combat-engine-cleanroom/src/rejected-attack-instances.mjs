/**
 * Count unique attack attempts that produced rejected shadow contacts.
 * Pure diagnostic aggregation; no effect on damage or hit authority.
 * Events must be in chronological order. An attack is identified by its
 * CombatWorld-scoped attackInstanceId, not by its move name or tick.
 */
export function summarizeRejectedAttackInstances(events) {
  if (!Array.isArray(events)) throw new TypeError('events must be an array');
  const attempts = new Map();
  let lastTick = -1;
  for (const event of events) {
    if (!event || event.type !== 'shadow_contact_rejected') continue;
    const { tick, attackInstanceId, attacker, defender, move } = event;
    if (!Number.isSafeInteger(tick) || tick < 0) {
      throw new TypeError('tick must be a nonnegative safe integer');
    }
    if (tick < lastTick) throw new RangeError('rejected contacts must be chronological');
    lastTick = tick;
    if (!Number.isSafeInteger(attackInstanceId) || attackInstanceId < 1) {
      throw new TypeError('attackInstanceId must be a positive safe integer');
    }
    if (typeof attacker !== 'string' || !attacker ||
        typeof defender !== 'string' || !defender ||
        typeof move !== 'string' || !move) {
      throw new TypeError('rejected contact requires attacker, defender and move');
    }
    let attempt = attempts.get(attackInstanceId);
    if (!attempt) {
      attempt = {
        attackInstanceId, attacker, defender, move,
        firstTick: tick, lastTick: tick, observedTicks: 0
      };
      attempts.set(attackInstanceId, attempt);
    } else if (attempt.attacker !== attacker || attempt.defender !== defender ||
               attempt.move !== move) {
      throw new RangeError('attack instance identity changed during observation');
    }
    if (attempt.observedTicks === 0 || attempt.lastTick !== tick) {
      attempt.observedTicks++;
      attempt.lastTick = tick;
    }
  }
  const instances = [...attempts.values()];
  return {
    uniqueRejectedAttacks: instances.length,
    observationCount: instances.reduce((total, attempt) => total + attempt.observedTicks, 0),
    instances
  };
}
