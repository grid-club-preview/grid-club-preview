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
 constructor(){this.hidden=false;this.children=[];this.style={setProperty:(k,v)=>{this.style[k]=v;}};this.dataset={};this.attrs={};
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
const calls=[],spends=[];let wallet=10;
let now=100,tick=null;
const globals={GridClubWordRescueEngine:engine,GridClubCredits:{
 balance:()=>wallet,spend:(amount,kind,id)=>{if(wallet<amount)return false;wallet-=amount;spends.push({amount,kind,id});return true;},award:(...args)=>{calls.push(args);return {awarded:2};}
}};
new Function('window','document','globalThis','localStorage','performance','setInterval','clearInterval','confirm',js)(
 fakeWindow,doc,globals,storage,{now:()=>now},fn=>{tick=fn;return 1;},()=>{tick=null;},()=>true);
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
const originalTiles=dom.wrTray.children.slice();
const originalBricks=dom.wrBricks.children;
for(const ch of w){
 const i=state.rack.findIndex((x,j)=>x===ch&&!used.includes(j));
 used.push(i);
 // A timer tick can occur while the finger is down; the target must survive.
 const target=dom.wrTray.children[i];now+=1000;tick();
 assert.equal(dom.wrTray.children[i],target,'Timer must not replace a held letter');
 dom.wrTray.listeners.click({target});
 for(let j=0;j<7;j++)assert.equal(dom.wrTray.children[j],originalTiles[j],'Tap must not replace any letter');
 assert.equal(dom.wrBricks.children,originalBricks,'Unchanged tower must not be rebuilt');
}
assert.equal(dom.wrSubmit.disabled,false);
assert.equal(dom.wrSubmit.textContent,'Build: '+w);
dom.wrBackspace.onclick();assert.equal(dom.wrSubmit.textContent,'Build: '+w.slice(0,-1));
dom.wrTray.listeners.click({target:dom.wrTray.children[used[used.length-1]]});
assert.equal(dom.wrSubmit.textContent,'Build: '+w);
dom.wrSubmit.onclick();
assert.equal(dom.wrSubmit.textContent,'Build with this word');
for(let j=0;j<7;j++)assert.equal(dom.wrTray.children[j],originalTiles[j],'Refill updates the same button');
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
assert.equal(dom.wrScene.style['--wrRaftLength'],'0.000cqw');
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
assert.equal(dom.wrSceneLabel.textContent,'GRIDDA IS SAFE');
assert(dom.wrResultText.textContent.includes('24 planks'));assert(!dom.wrResultText.textContent.includes('Results saved'));assert.equal(dom.wrRescueBoat.attrs['data-visible'],'false');
assert.equal(dom.wrScene.style['--wrRaftLength'],'54.000cqw');
assert.equal(dom.wrBricks.children.length,24);
const scores=JSON.parse(local.get('gridclub-word-rescue-scores-v1'));assert.equal(scores.length,1);assert.equal(scores[0].mode,'raft');
dom.wrResultBoard.onclick();assert.equal(dom.wrLeaderboard.hidden,false);assert.equal(dom.wrBoardRows.children.length,1);
dom.wrBoardAll.onclick();assert.equal(dom.wrBoardRows.children.length,1);
dom.wrBoardTide.onclick();assert.equal(dom.wrBoardRows.children.length,0);
dom.wrBoardRaft.onclick();assert.equal(dom.wrBoardRows.children.length,1);
globals.WordRescueApp.back();assert.equal(dom.wrMenu.hidden,false);
dom.wrNewRaft.onclick();assert.equal(dom.wrRules.hidden,true);assert.equal(dom.wrDock.hidden,false);
assert.equal(dom.wrRerack.textContent,'↻ New letters');
const before=globals.WordRescueApp.readState();
dom.wrRerack.onclick();
let shuffled=globals.WordRescueApp.readState();
assert.equal(shuffled.reracks,1);assert.equal(shuffled.elapsedMs,before.elapsedMs);
assert.equal(shuffled.sharkProgress,before.sharkProgress);assert.equal(wallet,10);
assert.equal(dom.wrRerack.textContent,'↻ New letters · ◉ 5');
dom.wrWordBack.onclick();dom.wrContinue.onclick();
assert.equal(dom.wrRerack.textContent,'↻ New letters · ◉ 5','Resuming does not restore free shuffle');
dom.wrRerack.onclick();shuffled=globals.WordRescueApp.readState();
assert.equal(shuffled.reracks,2);assert.equal(wallet,5);assert.equal(spends[0].kind,'word-rerack');
assert.equal(spends[0].id,before.attemptId);assert.equal(shuffled.elapsedMs,before.elapsedMs);
dom.wrRerack.onclick();assert.equal(wallet,0);
const blocked=globals.WordRescueApp.readState();dom.wrRerack.onclick();
assert.deepEqual(globals.WordRescueApp.readState(),blocked,'Insufficient credit must not change the rack');
assert.equal(spends.length,2);assert(dom.wrMessage.textContent.includes('5 Club Credits'));
assert.equal(calls.length,0,'Free Play must not award Club Credits');
dom.wrWordBack.onclick();dom.wrStatsEntry.onclick();assert.equal(dom.wrStats.hidden,false);assert.equal(dom.wrStatsGrid.children.length,8);
dom.wrStatsRaft.onclick();assert.equal(dom.wrStatsGrid.children[0].children[1].textContent,'1');
globals.WordRescueApp.back();assert.equal(dom.wrMenu.hidden,false);
dom.wrNewTide.onclick();let rounds=0;
while(dom.wrResult.hidden&&rounds++<10){
 const run=globals.WordRescueApp.readState();const word=engine.possibleWords(run.rack,run.used).sort((a,b)=>b.length-a.length)[0];const used=[];
 for(const ch of word){const i=run.rack.findIndex((x,j)=>x===ch&&!used.includes(j));used.push(i);dom.wrTray.listeners.click({target:dom.wrTray.children[i]});}
 dom.wrSubmit.onclick();
}
assert(dom.wrResultText.textContent.startsWith('You stacked 24 pieces of wreckage'));
assert.equal(dom.wrRescueBoat.attrs['data-visible'],'true');
dom.wrResultModes.onclick();dom.wrNewTide.onclick();
for(let i=0;i<35&&tick;i++){now+=1000;tick();}
assert.equal(dom.wrResult.dataset.outcome,'lost');assert.equal(dom.wrRescueBoat.attrs['data-visible'],'false');
dom.wrResultModes.onclick();dom.wrStatsEntry.onclick();dom.wrStatsTide.onclick();
assert.equal(dom.wrStatsGrid.children[0].children[1].textContent,'1');
assert.equal(dom.wrStatsGrid.children[1].children[1].textContent,'2');
assert.equal(dom.wrStatsGrid.children[2].children[1].textContent,'1');
assert.equal(dom.wrStatsGrid.children[3].children[1].textContent,'50%');
globals.WordRescueApp.back();dom.wrBoardEntry.onclick();dom.wrBoardTide.onclick();dom.wrBoardAll.onclick();assert.equal(dom.wrBoardRows.children.length,1,'Defeats excluded from leaderboard');
console.log('Word Rescue browser wiring passed: three modes, raft victory, dock, scoring, pause/continue and return home');
