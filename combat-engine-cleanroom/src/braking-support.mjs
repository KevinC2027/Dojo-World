/** Diagnostic only: deterministic planar stopping-distance and contact reach screen.
 * No combat authority or render pose is modified by this module.
 * Coordinates are world-space metres, velocity metres/second.
 */
const finite2=v=>Array.isArray(v)&&v.length===2&&v.every(Number.isFinite);
export function brakingSupportSnapshot({root,velocity,contacts,deceleration=6,contactRadius=.12}){
  if(!finite2(root)||!finite2(velocity)||!Array.isArray(contacts)||
     !contacts.every(finite2)||!Number.isFinite(deceleration)||deceleration<=0||
     !Number.isFinite(contactRadius)||contactRadius<0)
    throw new TypeError('Finite planar root, velocity, contacts and positive deceleration required');
  const speed=Math.hypot(...velocity);
  const stopTime=speed/deceleration;
  const displacement=velocity.map(v=>v*stopTime*.5);
  const stop=[root[0]+displacement[0],root[1]+displacement[1]];
  const nearest=contacts.length?Math.min(...contacts.map(p=>Math.hypot(stop[0]-p[0],stop[1]-p[1]))):null;
  return {speed,stopTime,stoppingDistance:speed*stopTime*.5,projectedStop:stop,
    nearestContactDistance:nearest,
    outsideContactRadius:nearest===null?null:Math.max(0,nearest-contactRadius)};
}
