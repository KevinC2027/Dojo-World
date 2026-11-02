import { ShoulderThrow } from './USER_PROPOSED_throwController.mjs';
import assert from 'node:assert/strict';
const v=(x=0,y=0,z=0)=>({x,y,z});
function body(){let w=v(); let q={x:0,y:0,z:0,w:1};return {
 rotation:()=>q,angvel:()=>w,setAngvel:x=>{w=x;},setAngularDamping:()=>{},setLinearDamping:()=>{},setRotation:x=>{q=x;}
};}
function mock(){const rig=Object.fromEntries(['torso','pelvis','head','thighL','thighR','shinL','shinR'].map(k=>[k,body()]));let releases=0;const world={removeImpulseJoint:()=>{releases++}};
 const ctrl=new ShoulderThrow(world,rig,{},v(1,0,0),1,new Map([[2,'shinR'],[3,'torso'],[4,'pelvis']]));
 return {ctrl,rig,get releases(){return releases}};
}
const checks=[];
function check(name,fn){try{const detail=fn();checks.push({name,result:'PASS',detail});}catch(e){checks.push({name,result:'FAIL',detail:e.message});}}
check('User supplied JS parses and can instantiate on expected rig shape',()=>{const a=mock();assert.equal(a.ctrl.phase,'ROTATE');});
check('Current C0835 rig exposes torso as controller expects',()=>{
 const a=mock(); a.ctrl.rig.torso=undefined; a.ctrl.rig.upper_back=body();
 let raised=false;try{a.ctrl.step(1/60,{drainCollisionEvents:()=>{}});}catch{raised=true;}
 assert.equal(raised,false,'C0835 actually calls its torso upper_back; proposed controller dereferences missing torso');
});
check('Collision gate rejects shin-first event even if torso contacts later',()=>{
 const a=mock();a.ctrl.step(1/60,{drainCollisionEvents:cb=>{cb(1,2,true);cb(1,3,true)}});
 assert.notEqual(a.ctrl.phase,'SETTLE','controller transitions to SETTLE after torso event despite shinR being first');
});
check('Release occurs at initial back contact (not +150ms)',()=>{
 const a=mock();a.ctrl.step(1/60,{drainCollisionEvents:cb=>cb(1,3,true)});
 assert.equal(a.releases,1,'grip is intentionally retained 150ms after contact, contrary to previous visual target');
});
check('setAngvel ramp respects dt not raw frame count',()=>{
 const a=mock(),b=mock();
 a.ctrl.step(1/60,{drainCollisionEvents:()=>{}});
 b.ctrl.step(1/30,{drainCollisionEvents:()=>{}});
 assert.notDeepEqual(a.rig.torso.angvel(),b.rig.torso.angvel(),'same blend factor at 30 and 60fps, independent of dt');
});
check('Positive X throw rotation moves back normal toward ground from neutral pose',()=>{
 const a=mock();const before=a.ctrl.backAngle();
 const ang=0.15; a.rig.torso.setRotation({x:Math.sin(ang/2),y:0,z:0,w:Math.cos(ang/2)});
 const after=a.ctrl.backAngle();
 assert.ok(after<before,`positive X rotation increases back angle ${before.toFixed(3)}→${after.toFixed(3)} rad`);
});
const out={source:'USER_PROPOSED_throwController.mjs',current_baseline:'C0835',actual_rapier_simulation_of_proposed_controller:false,checks,pass:checks.filter(x=>x.result==='PASS').length,fail:checks.filter(x=>x.result==='FAIL').length};
console.log(JSON.stringify(out,null,2));
// Intentionally exit 0 so failures can be captured as diagnostic evidence rather than aborting package creation.
