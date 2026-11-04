/**
 * Deterministic exchange-level audit of authoritative contact events.
 * Shadow geometry is diagnostic, never damage authority.
 * Only resolved hits/blocks have a collision probe; geometry-only misses
 * cannot be inferred from this event stream.
 */
export function summarizeContactDiscrepancies(events) {
  if (!Array.isArray(events)) throw new TypeError('events must be an array');
  const summary = {
    resolvedContacts: 0,
    hits: 0,
    blocks: 0,
    shadowIntersections: 0,
    proxyOnlyContacts: 0,
    unclassifiedContacts: 0,
    rejectedShadowIntersections: 0,
    byMove: {},
    discrepancies: []
  };
  for (const event of events) {
    if (event?.type === 'shadow_contact_rejected') {
      if (event.collisionProbe?.intersected === true) {
        summary.rejectedShadowIntersections++;
        summary.discrepancies.push({
          tick: event.tick, attacker: event.attacker, defender: event.defender,
          move: event.move, outcome: 'rejected',
          reason: '3d_intersection_without_range_authority'
        });
      }
      continue;
    }
    if (!event || (event.type !== 'hit' && event.type !== 'blocked')) continue;
    summary.resolvedContacts++;
    if (event.type === 'hit') summary.hits++;
    else summary.blocks++;
    const move = String(event.move ?? 'unknown');
    const key = String(event.attacker ?? 'unknown') + ':' + move;
    if (!Object.hasOwn(summary.byMove, key)) {
      summary.byMove[key] = { contacts: 0, intersections: 0, proxyOnly: 0, unclassified: 0 };
    }
    const bucket = summary.byMove[key];
    bucket.contacts++;
    if (event.collisionProbe?.intersected === true) {
      summary.shadowIntersections++;
      bucket.intersections++;
    } else if (event.collisionProbe?.intersected === false) {
      summary.proxyOnlyContacts++;
      bucket.proxyOnly++;
      summary.discrepancies.push({
        tick: event.tick, attacker: event.attacker, defender: event.defender,
        move: event.move, outcome: event.type,
        reason: 'range_hit_without_3d_intersection'
      });
    } else {
      summary.unclassifiedContacts++;
      bucket.unclassified++;
    }
  }
  return summary;
}
