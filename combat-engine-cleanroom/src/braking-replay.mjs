/** Non-authoritative braking audit of real solo CombatWorld snapshots.
 * Foot contact locations are taken from the tracked render feet, never guessed
 * from root position. This does not change simulation or assert physical balance.
 */
import {brakingSupportSnapshot} from './braking-support.mjs';
import {toWorld3} from './full-body-qualification.mjs';
export function auditBrakingReplay(replay,{deceleration=6,contactRadius=.12}={}){
  if(!Array.isArray(replay?.frames)||!replay.frames.length)throw new TypeError('Recorded solo replay required');
  const samples=replay.frames.map(({tick,fighter,rig,footTargets})=>{
    const contacts=rig.legs.filter(leg=>footTargets?.[leg.side]?.planted)
      .map(leg=>{const p=toWorld3(fighter,leg.foot);return [p[0],p[2]]});
    const result=brakingSupportSnapshot({
      root:[fighter.position.x,fighter.position.z],
      velocity:[fighter.velocity.x,fighter.velocity.z],
      contacts,deceleration,contactRadius
    });
    return {tick,plantedFeet:contacts.length,...result};
  });
  const known=samples.filter(s=>s.outsideSupportSegmentRadius!==null);
  return {fighter:replay.fighterId,scenario:replay.scenarioId,frames:samples.length,
    unknownSupportFrames:samples.length-known.length,
    maxProjectedGapMeters:known.length?Math.max(...known.map(s=>s.outsideSupportSegmentRadius)):null,
    worstFrame:known.length?known.reduce((a,b)=>b.outsideSupportSegmentRadius>a.outsideSupportSegmentRadius?b:a):null,
    samples};
}
