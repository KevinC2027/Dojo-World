import test from 'node:test';
import assert from 'node:assert/strict';
import {CombatWorld,MOVESETS} from '../src/engine.mjs';
import {FootPlantTracker} from '../src/foot-plant-render.mjs';
import {fighterRig} from '../src/hit-rig.mjs';
import {recordSoloMotion} from '../src/movement-qualification.mjs';

const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const median=values=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)];

test('both fighters keep their unguarded walking arms from folding into the shoulders',()=>{
  // A regression threshold for these fixtures, not a claim of natural anatomy.
  for(const id of ['blue','red'])for(const scenario of ['forward','backward']){
    const frames=recordSoloMotion(id,scenario).frames.slice(20);
    for(const side of [-1,1]){
      const spans=frames.map(({rig})=>{
        const arm=rig.arms.find(a=>a.side===side);
        return distance(arm.shoulder,arm.hand);
      });
      assert.ok(median(spans)>.275,`${id}:${scenario}:${side} arm remains tightly folded`);
    }
  }
});

test('guard release into every attack retains arm continuity while standing and advancing',()=>{
  for(const id of ['blue','red'])for(const move of Object.keys(MOVESETS[id]))for(const moving of [false,true]){
    const world=new CombatWorld({startingGap:30}),tracker=new FootPlantTracker();
    let previous=null,maxStep=0,attackStarted=false;
    for(let tick=1;tick<=120;tick++){
      const input={move:{x:moving?(id==='blue'?1:-1):0,z:0},guard:tick<=60};
      if(tick===61)input.attack=move;
      const events=world.step({[id]:input});
      attackStarted||=events.some(e=>e.type==='attack_started'&&e.fighter===id);
      const fighter=world.snapshot().fighters[id];
      const targets=tracker.update(fighter,world.tick);
      const rig=fighterRig(fighter,fighter.action?MOVESETS[id][fighter.action.name]:null,world.tick/60,targets);
      if(previous&&tick>=61)for(let i=0;i<2;i++)for(const joint of ['shoulder','elbow','hand'])
        maxStep=Math.max(maxStep,distance(rig.arms[i][joint],previous.arms[i][joint]));
      previous=rig;
    }
    assert.ok(attackStarted,`${id}:${move} did not start`);
    assert.ok(maxStep<.19,`${id}:${move}:${moving} arm jump ${maxStep}`);
  }
});
