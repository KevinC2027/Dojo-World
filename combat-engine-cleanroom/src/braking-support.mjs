/** Diagnostic only: deterministic planar stopping-distance and contact reach screen.
 * No combat authority or render pose is modified by this module.
 * Coordinates are world-space metres, velocity metres/second.
 */
const finite2=v=>Array.isArray(v)&&v.length===2&&v.every(Number.isFinite);
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function segmentDistance(p,a,b){
  const dx=b[0]-a[0],dy=b[1]-a[1],len2=dx*dx+dy*dy;
  const t=len2?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/len2)):0;
  return distance(p,[a[0]+t*dx,a[1]+t*dy]);
}
export function brakingSupportSnapshot({root,velocity,contacts,deceleration=6,contactRadius=.12}){
  if(!finite2(root)||!finite2(velocity)||!Array.isArray(contacts)||
     !contacts.every(finite2)||!Number.isFinite(deceleration)||deceleration<=0||
     !Number.isFinite(contactRadius)||contactRadius<0)
    throw new TypeError('Finite planar root, velocity, contacts and positive deceleration required');
  const speed=Math.hypot(...velocity);
  const stopTime=speed/deceleration;
  const displacement=velocity.map(v=>v*stopTime*.5);
  const stop=[root[0]+displacement[0],root[1]+displacement[1]];
  const nearest=contacts.length?Math.min(...contacts.map(p=>distance(stop,p))):null;
  // Two-foot support segment is a better static screen than nearest ankle alone.
  // This remains diagnostic, not a physical stability solver.
  const segment=contacts.length===0?null:contacts.length===1?nearest:
    segmentDistance(stop,contacts[0],contacts[1]);
  return {speed,stopTime,stoppingDistance:speed*stopTime*.5,projectedStop:stop,
    nearestContactDistance:nearest,
    outsideContactRadius:nearest===null?null:Math.max(0,nearest-contactRadius),
    supportSegmentDistance:segment,
    outsideSupportSegmentRadius:segment===null?null:Math.max(0,segment-contactRadius)};
}
