// Shared edge navigation regression: touch and pointer events, one route per swipe.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','edge-navigation.js'),'utf8');
const nodes={},handlers={};const node=id=>nodes[id]||(nodes[id]={hidden:true});
const doc={getElementById:node,addEventListener:(type,fn)=>handlers[type]=fn};
let calls=[];const root={WordRescueApp:{back:()=>calls.push('word')},PipeShiftApp:{back:()=>calls.push('pipe')},GridDotTrailsApp:{back:()=>calls.push('dot')}};
new Function('globalThis','document',src)(root,doc);
const open=(...ids)=>{for(const n of Object.values(nodes))n.hidden=true;ids.forEach(id=>node(id).hidden=false);calls=[];};
const target={closest:()=>null};const ev=(props={})=>({target,cancelable:true,preventDefault(){},...props});
const point=(x,y=100)=>({identifier:1,clientX:x,clientY:y});
function swipe(x=12,y=100,endX=120,endY=y,t=target){
 handlers.touchstart(ev({target:t,touches:[point(x,y)]}));
 handlers.touchmove(ev({touches:[point(endX,endY)]}));
 handlers.touchend(ev({changedTouches:[point(endX,endY)]}));
}
for(const id of ['difficultyScreen','dotDailyScreen','randomScreen','levelsScreen','statsScreen']){open(id);swipe();assert.deepEqual(calls,['dot']);}
for(const id of ['pipe-menu','pipe-daily','pipe-random','pipe-stages','pipe-levels','pipe-stats']){open('pipeShiftScreen',id);swipe();assert.deepEqual(calls,['pipe']);}
open('wordRescueScreen','wrMenu');swipe();assert.deepEqual(calls,['word']);
open('wordRescueScreen','wrMenu');swipe(12,100,40,210);assert.equal(calls.length,0);
open('wordRescueScreen','wrMenu');swipe(140,100,280);assert.equal(calls.length,0);
open('wordRescueScreen','wrPlay','wrRules');swipe();assert.equal(calls.length,0);
open('wordRescueScreen','wrPlay');swipe(12,100,120,100,{closest:s=>s.includes('#wrDock')?{}:null});assert.equal(calls.length,0);
open('pipeShiftScreen','pipe-game');swipe(45,100,150,100,{closest:s=>s.includes('#pipeBoard')?{}:null});assert.equal(calls.length,0);
open('home');swipe();assert.equal(calls.length,0);
open('wordRescueScreen','wrMenu');
const pe=(x)=>ev({pointerType:'touch',isPrimary:true,pointerId:2,clientX:x,clientY:100});
handlers.pointerdown(pe(10));handlers.touchstart(ev({touches:[point(10)]}));handlers.pointerup(pe(120));handlers.touchend(ev({changedTouches:[point(120)]}));assert.deepEqual(calls,['word']);
open('difficultyScreen');handlers.pointerdown(pe(10));handlers.pointerup(pe(120));assert.deepEqual(calls,['dot']);
console.log('Shared edge Back: all menu routes, pointer fallback, duplicate events and excluded controls passed');
