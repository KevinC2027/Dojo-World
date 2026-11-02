// Execute the ACTUAL world.js loop in a headless Canvas renderer.
// This is real code-driven render output, NOT browser/device footage.
const fs=require('fs'),path=require('path'),vm=require('vm');
const {Canvas}=require('skia-canvas');
const root=__dirname,canvas=new Canvas(960,540),ctx=canvas.getContext('2d');
const handlers={};let raf=null;
const canvasHandlers={};
canvas.addEventListener=(type,fn)=>{(canvasHandlers[type]??=[]).push(fn)};
canvas.getBoundingClientRect=()=>({left:0,top:0,width:960,height:540});
const els={'#world':canvas,'#where':{textContent:''},'#location':{textContent:''},'#interact':{addEventListener(){}}};
const document={querySelector:s=>els[s],querySelectorAll:()=>[]};
const window={};
const sandbox={console,document,window,Math,Set,requestAnimationFrame:fn=>raf=fn,addEventListener:(type,fn)=>{(handlers[type]??=[]).push(fn)}};
vm.runInNewContext(fs.readFileSync(path.join(root,'world.js'),'utf8'),sandbox,{filename:'world.js'});
const out=path.join(root,'capture');
const log=[];const state=()=>window.__dojoWorld.getState();
function key(type,code){for(const fn of handlers[type]||[])fn({code,preventDefault(){},repeat:false})}
function tap(x,y){for(const fn of canvasHandlers.pointerdown||[])fn({clientX:x,clientY:y})}
let t=0,n=0;
async function frames(count){for(let i=0;i<count;i++){t+=50;raf(t);n++}}
function check(name,pass){log.push({name,pass,state:state()});if(!pass)throw Error(name+' FAILED '+JSON.stringify(state()))}
(async()=>{
 check('starts_on_street',state().scene==='street');await frames(12);
 key('keydown','ArrowUp');await frames(14);key('keyup','ArrowUp');check('walked_to_market_door',state().nearDoor);
 await frames(8);key('keydown','KeyE');await frames(1);check('entered_market',state().scene==='market');await frames(6);
 key('keydown','ArrowRight');await frames(36);key('keyup','ArrowRight');
 key('keydown','ArrowUp');await frames(16);key('keyup','ArrowUp');check('approached_merchant',state().nearMerchant);await frames(6);
 key('keydown','KeyE');await frames(1);check('merchant_opened',state().merchantOpen);await frames(12);
 key('keydown','Digit1');await frames(1);check('bought_hand_wraps',state().coins===25&&state().inventory.wraps===1);await frames(12);
 key('keydown','Digit3');await frames(1);check('bought_street_map',state().coins===13&&state().inventory.map===1);await frames(12);
 key('keydown','Digit1');await frames(1);check('insufficient_funds_protected',state().coins===13&&state().inventory.wraps===1);await frames(12);
 tap(470,297);await frames(1);check('touch_purchase_tea',state().coins===5&&state().inventory.tea===1);await frames(8);
 key('keydown','KeyE');await frames(1);check('merchant_closed',!state().merchantOpen);await frames(8);
 key('keydown','ArrowDown');await frames(16);key('keyup','ArrowDown');
 key('keydown','ArrowLeft');await frames(36);key('keyup','ArrowLeft');check('returned_to_exit',state().interiorPlayer.x<500);await frames(5);
 key('keydown','KeyE');await frames(1);check('exited_market',state().scene==='street');await frames(9);
 key('keydown','KeyR');await frames(1);check('rain_toggle',state().weather==='rain');await frames(8);
 // Slice 03: walk along the open sidewalk to Northside Dojo.
 key('keydown','ArrowRight');await frames(53);key('keyup','ArrowRight');
 check('approached_dojo_entrance',state().nearGymDoor);await frames(8);
 key('keydown','KeyE');await frames(1);check('entered_dojo',state().scene==='dojo');await frames(12);
 key('keydown','ArrowRight');await frames(12);key('keyup','ArrowRight');
 key('keydown','ArrowUp');await frames(19);key('keyup','ArrowUp');
 check('approached_coach_ren',state().nearCoach);await frames(8);
 key('keydown','KeyE');await frames(1);check('quest_accepted',state().renQuest==='active');await frames(14);
 key('keydown','KeyE');await frames(1);
 check('quest_completed',state().renQuest==='completed');
 check('hand_wraps_delivered',state().inventory.wraps===0);
 check('reward_granted_once',state().coins===25&&state().inventory.dojoPass===1);await frames(16);
 key('keydown','KeyE');await frames(1);check('reward_cannot_repeat',state().coins===25&&state().inventory.dojoPass===1);await frames(10);
 key('keydown','ArrowDown');await frames(19);key('keyup','ArrowDown');
 key('keydown','ArrowLeft');await frames(12);key('keyup','ArrowLeft');
 check('returned_to_dojo_exit',state().dojoPlayer.x<500);await frames(6);
 key('keydown','KeyE');await frames(1);check('exited_dojo',state().scene==='street');await frames(8);
 // Extended 33-second real-code visual walkthrough: street, park and return.
 key('keydown','ArrowLeft');await frames(105);key('keyup','ArrowLeft');
 key('keydown','ArrowDown');await frames(35);key('keyup','ArrowDown');
 key('keydown','ArrowRight');await frames(50);key('keyup','ArrowRight');
 key('keydown','ArrowUp');await frames(30);key('keyup','ArrowUp');
 key('keydown','KeyR');await frames(1);check('rain_off_after_walkthrough',state().weather==='clear');
 fs.writeFileSync(path.join(root,'test-results-v0.1.6.json'),JSON.stringify({checks:log,frames:n,renderer:'Actual world.js executed using skia-canvas; browser/device tests not run'},null,2));
 console.log(JSON.stringify({passed:log.length,frames:n,finalState:state()}));
})().catch(e=>{console.error(e);process.exitCode=1});
