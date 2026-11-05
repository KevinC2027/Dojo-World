/** Reproducible 24-scenario movement diagnostic; screening only, not visual approval. */
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {recordSoloMotion,measureSoloMotion,INDEPENDENT_MOTION_SCENARIOS} from './movement-qualification.mjs';
import {auditFullBodyReplay} from './full-body-qualification.mjs';
import {measureDynamicSupport} from './dynamic-support.mjs';

export function buildSoloQualificationMatrix(){
  const rows=[];
  for(const fighter of ['blue','red'])for(const scenario of INDEPENDENT_MOTION_SCENARIOS){
    const replay=recordSoloMotion(fighter,scenario);
    const motion=measureSoloMotion(replay);
    const full=auditFullBodyReplay(replay);
    const dynamic=measureDynamicSupport(replay);
    const geometryPass=motion.errors.length===0&&motion.footPenetrations===0&&
      motion.maxBoneErrorMeters<.001&&motion.maxPlantTargetErrorMeters<.05;
    const continuityPass=motion.maxJointStepMeters<=.2;
    // Static COM is only a diagnostic: moving humans can be dynamically stable
    // outside a static foot segment. Do not convert this to visual approval.
    rows.push({fighter,scenario,geometryPass,continuityPass,staticSupportPass:!(full.counts.unsupported_com||full.counts.no_planted_foot),
      fullBodyDiagnosticPass:full.passed,
      boneErrorMeters:motion.maxBoneErrorMeters,
      plantedTargetErrorMeters:motion.maxPlantTargetErrorMeters,
      jointStepMeters:motion.maxJointStepMeters,
      worstJoint:motion.worstJointStep,
      groundedSlideMeters:motion.maxGroundedFootSlideMeters,
      supportTransfers:motion.supportTransfers,
      swingAnkleStepMeters:motion.maxSwingAnkleStepMeters,
      plantedAnkleStepMeters:motion.maxPlantedAnkleStepMeters,
      penetrationCount:motion.footPenetrations,
      staticSupportDistanceMeters:full.max.supportDistance,
      captureDistanceMeters:dynamic.maxCurrentCaptureErrorMeters,
      anticipatedCaptureDistanceMeters:dynamic.maxAnticipatedCaptureErrorMeters,
      dynamicFinite:dynamic.finite,
      visualApproval:'unverified'});
  }
  return rows;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const rows=buildSoloQualificationMatrix();
  console.log(JSON.stringify({count:rows.length,rows},null,2));
}
