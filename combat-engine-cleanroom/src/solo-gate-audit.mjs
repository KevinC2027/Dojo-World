/** Deterministic full-body gate report from actual clean-room CombatWorld snapshots.
 * Diagnostic only: static COM and projected braking are NOT proofs of dynamic balance.
 */
import {recordSoloMotion,measureSoloMotion,INDEPENDENT_MOTION_SCENARIOS} from './movement-qualification.mjs';
import {auditFullBodyReplay} from './full-body-qualification.mjs';
import {auditBrakingReplay} from './braking-replay.mjs';

export function auditSoloGate(){
  const cases=[];
  for(const fighter of ['blue','red'])for(const scenario of INDEPENDENT_MOTION_SCENARIOS){
    const replay=recordSoloMotion(fighter,scenario);
    const motion=measureSoloMotion(replay);
    const body=auditFullBodyReplay(replay);
    const braking=auditBrakingReplay(replay);
    const failures=[];
    if(motion.errors.length)failures.push('nonfinite_motion');
    if(motion.footPenetrations)failures.push('ground_penetration');
    if(motion.maxBoneErrorMeters>=1e-8)failures.push('bone_length');
    if(motion.maxPlantTargetErrorMeters>=.05)failures.push('planted_reach');
    if(body.counts.unsupported_com)failures.push('static_com_support');
    if(body.counts.no_planted_foot)failures.push('no_planted_foot');
    if(body.counts.head_jump||body.counts.com_jump)failures.push('body_continuity');
    cases.push({fighter,scenario,passed:failures.length===0,failures,
      maxPlantTargetErrorMeters:motion.maxPlantTargetErrorMeters,
      maxJointStepMeters:motion.maxJointStepMeters,
      maxStaticSupportGapMeters:body.max.supportDistance,
      maxProjectedBrakeGapMeters:braking.maxProjectedGapMeters,
      unknownBrakeSupportFrames:braking.unknownSupportFrames});
  }
  return {total:cases.length,passed:cases.filter(c=>c.passed).length,
    failed:cases.filter(c=>!c.passed).length,cases,
    note:'Static COM and projected braking are approximate screens; a pass is not biomechanical or visual approval.'};
}
