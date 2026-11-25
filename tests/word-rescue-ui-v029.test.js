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
dom.wrSubmit.onclick();
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
console.log('Word Rescue browser wiring passed: entry, letters, scoring, pause/continue and return home');
