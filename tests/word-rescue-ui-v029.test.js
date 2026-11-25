// Grid Club v0.9.29 Word Rescue browser wiring smoke test (no npm deps).
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const js=fs.readFileSync(path.join(__dirname,'..','word-rescue.js'),'utf8');
const engine=require('../word-rescue-engine.js');
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);
assert.equal(new Set(ids).size,ids.length,'No duplicate HTML ids');
class Node {
 constructor(){this.hidden=false;this.children=[];this.style={setProperty:()=>{}};this.dataset={};this.attrs={};
   this.classList={toggle:()=>{},add:()=>{},remove:()=>{}};
   this.listeners={};this.textContent='';this.disabled=false;}
 append(...xs){this.children.push(...xs);}
 replaceChildren(...xs){this.children=xs;}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(k,fn){this.listeners[k]=fn;}
 closest(){return this;}
}
const dom=Object.fromEntries(ids.map(id=>[id,new Node()]));
dom.wordRescueScreen.hidden=true;
const local=new Map(),storage={
 getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v),removeItem:k=>local.delete(k)
};
const doc={getElementById:id=>dom[id],createElement:()=>new Node(),addEventListener:()=>{}};
const fakeWindow={addEventListener:()=>{}};
const calls=[];
const globals={GridClubWordRescueEngine:engine,GridClubCredits:{
 balance:()=>42,award:(...args)=>{calls.push(args);return {awarded:2};}
}};
new Function('window','document','globalThis','localStorage','performance','setInterval','clearInterval','confirm',js)(
 fakeWindow,doc,globals,storage,{now:()=>100},()=>1,()=>{},()=>true);
assert(globals.WordRescueApp,'Game entrypoint must initialise');
dom.wrEntry.onclick();
assert.equal(dom.wordRescueScreen.hidden,false);
assert.equal(dom.home.hidden,true);
dom.wrNewTide.onclick();
assert.equal(dom.wrRules.hidden,false);assert.equal(dom.wrRulesDetails.hidden,true);
assert.equal(dom.wrRulesLead.textContent,'Raise Gridda up by making words');
assert.equal(globals.WordRescueApp.readState().started,false);
assert.equal(dom.wrSubmit.disabled,true);dom.wrRulesPlay.onclick();
assert.equal(dom.wrRules.hidden,true);assert.equal(globals.WordRescueApp.readState().started,true);
dom.wrInfo.onclick();assert.equal(dom.wrRulesDetails.hidden,false);dom.wrRulesPlay.onclick();
assert.equal(dom.wrPlay.hidden,false);
assert.equal(dom.wrTray.children.length,7,'Seven buttons should render');
assert.equal(dom.wrSceneLabel.textContent,'RISING TIDE');
let state=globals.WordRescueApp.readState();
assert(engine.validState(state));
const w=engine.possibleWords(state.rack).sort((a,b)=>b.length-a.length)[0];
const used=[];
for(const ch of w){
 const i=state.rack.findIndex((x,j)=>x===ch&&!used.includes(j));
 used.push(i);
 dom.wrTray.listeners.click({target:dom.wrTray.children[i]});
}
assert.equal(dom.wrSubmit.disabled,false);
assert.equal(dom.wrSubmit.textContent,'Build: '+w);
dom.wrBackspace.onclick();assert.equal(dom.wrSubmit.textContent,'Build: '+w.slice(0,-1));
dom.wrTray.listeners.click({target:dom.wrTray.children[used[used.length-1]]});
assert.equal(dom.wrSubmit.textContent,'Build: '+w);
dom.wrSubmit.onclick();
assert.equal(dom.wrSubmit.textContent,'Build with this word');
state=globals.WordRescueApp.readState();
assert(state?.blocks>=3,'Submitting a valid word should add blocks');
assert.equal(state.rack.length,7);
dom.wrWordBack.onclick();
assert.equal(dom.wrPlay.hidden,true,'Back to menu should pause a run');
assert.equal(dom.wrContinue.hidden,false,'An unfinished run should be resumable');
dom.wrContinue.onclick();
assert.equal(dom.wrPlay.hidden,false);
state=globals.WordRescueApp.readState();
assert(state?.blocks>=3,'Continue should restore the current tower and score');
globals.WordRescueApp.back();
globals.WordRescueApp.back();
assert.equal(dom.wordRescueScreen.hidden,true);
assert.equal(dom.home.hidden,false,'Back should return to existing home');
// Third game mode uses the same controls with a horizontal raft and a
// shark-driven danger meter. Ensure the primary action is always present.
dom.wrEntry.onclick();
dom.wrNewRaft.onclick();
assert.equal(dom.wrRules.hidden,false);dom.wrRulesPlay.onclick();
assert.equal(dom.wrScene.dataset.mode,'raft');
assert.equal(dom.wrBlocks.textContent,'24 planks to safety');
assert.equal(dom.wrSea.style.height,'32%','Raft mode has a fixed sea level');
assert(dom.wrDock,'Word submission controls must have a dock');
let iterations=0;
while(dom.wrResult.hidden&&iterations++<9){
 const raft=globals.WordRescueApp.readState();
 assert(raft,'Unfinished raft must be stored');
 const word=engine.possibleWords(raft.rack,raft.used).sort((a,b)=>b.length-a.length)[0];
 assert(word,'Guaranteed playable word in raft mode');
 const chosen=[];
 for(const letter of word){
   const i=raft.rack.findIndex((x,j)=>x===letter&&!chosen.includes(j));
   assert(i>=0);
   chosen.push(i);
   dom.wrTray.listeners.click({target:dom.wrTray.children[i]});
 }
 dom.wrSubmit.onclick();
}
assert.equal(dom.wrResult.hidden,false,'Building 24 planks should complete Raft Escape');
assert.equal(dom.wrBlocks.textContent,'SAFE');assert.equal(dom.wrDock.hidden,true);
dom.wrTryAgain.onclick();assert.equal(dom.wrRules.hidden,true);assert.equal(dom.wrDock.hidden,false);
assert.equal(calls.length,0,'Free Play must not award Club Credits');
console.log('Word Rescue browser wiring passed: three modes, raft victory, dock, scoring, pause/continue and return home');
