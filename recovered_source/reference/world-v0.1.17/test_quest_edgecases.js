// Test the no-wraps quest path using the real world.js logic and headless canvas.
const fs=require('fs'),path=require('path'),vm=require('vm');
const {Canvas}=require('skia-canvas');
const canvas=new Canvas(960,540),handlers={};let raf;
canvas.addEventListener=()=>{};
const els={'#world':canvas,'#where':{textContent:''},'#location':{textContent:''},'#interact':{addEventListener(){}}};
const window={};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'world.js'),'utf8'),{window,document:{querySelector:s=>els[s],querySelectorAll:()=>[]},Math,Set,requestAnimationFrame:f=>raf=f,addEventListener:(t,f)=>(handlers[t]??=[]).push(f)},{filename:'world.js'});
const state=()=>window.__dojoWorld.getState();let t=0;
const checks=[];
function check(name,ok){checks.push({name,pass:!!ok});if(!ok)throw Error(name+': '+JSON.stringify(state()))}
function key(type,code){for(const fn of handlers[type]||[])fn({code,repeat:false,preventDefault(){}})}
function frames(n){for(let i=0;i<n;i++){t+=50;raf(t)}}
check('quest_initially_unstarted',state().renQuest==='not_started');
key('keydown','KeyE');frames(1);check('no_remote_interaction',state().scene==='street');
key('keydown','ArrowUp');frames(10);key('keyup','ArrowUp');
key('keydown','ArrowRight');frames(55);key('keyup','ArrowRight');
check('reached_gym_without_market',state().nearGymDoor);
key('keydown','KeyE');frames(1);check('entered_dojo_without_purchase',state().scene==='dojo');
key('keydown','ArrowRight');frames(12);key('keyup','ArrowRight');
key('keydown','ArrowUp');frames(19);key('keyup','ArrowUp');
check('near_coach',state().nearCoach);
key('keydown','KeyE');frames(1);check('accepted_without_wraps',state().renQuest==='active');
key('keydown','KeyE');frames(1);
check('cannot_complete_without_wraps',state().renQuest==='active'&&state().coins===40&&!state().inventory.dojoPass);
check('clear_market_guidance',state().renNotice.includes('Mika'));
fs.writeFileSync(path.join(__dirname,'edgecase-results.json'),JSON.stringify({checks,renderer:'Actual world.js in headless skia-canvas; not browser/device QA'},null,2));
console.log(JSON.stringify({passed:checks.length,finalState:state()}));
