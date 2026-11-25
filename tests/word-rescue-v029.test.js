/* Grid Club v0.9.29 Word Rescue prototype regression tests.
 * Run: node tests/word-rescue-v029.test.js
 */
'use strict';
const assert=require('node:assert/strict');
const e=require('../word-rescue-engine.js');
assert(e.WORD_SET.size>2000,'Broad common-word prototype vocabulary');
assert(e.SEEDS.length>=50,'Letter tray generation should have plenty of variation');
function selectWord(state,word){
 const picked=[];
 for(const letter of word){
   const i=state.rack.findIndex((x,j)=>x===letter&&!picked.includes(j));
   assert(i>=0,'Word must be playable from the shown tiles: '+word);
   picked.push(i);
   assert(e.select(state,i));
 }
 return picked;
}
for(let seed=1;seed<=80;seed++){
 for(const mode of ['tide','sinking']){
   const state=e.create(seed,mode),copy=e.create(seed,mode);
   assert.deepEqual(state.rack,copy.rack,'Seeded initial letters must be deterministic');
   assert(e.validState(state));
   const words=e.possibleWords(state.rack);
   assert(words.length>=1);
   const first=words.sort((a,b)=>b.length-a.length)[0];
   const chosen=selectWord(state,first);
   assert.equal(state.selected.length,chosen.length);
   const result=e.submit(state);
   assert.equal(result.ok,true);
   assert.equal(result.blocks,first.length);
   assert.equal(state.score,first.length*first.length);
   assert.equal(state.selected.length,0,'Fresh letter tray must clear selection');
   assert.equal(state.rack.filter(Boolean).length,7,'Consumed letters refill immediately');
   assert(e.possibleWords(state.rack,state.used).length>=1,'A valid next word should be present');
 }
}
const invalid=e.create(7);
assert.equal(e.submit(invalid).ok,false,'No tiny or empty words allowed');
const before=invalid.rack.join('');
assert(e.rerack(invalid));assert.equal(invalid.rack.length,7);
assert(e.validState(invalid));
const penalty=e.create(8,'tide');penalty.started=true;
e.advance(penalty,6000);assert.equal(penalty.elapsedMs,6000);
const drowning=e.create(88,'tide');drowning.started=true;
e.advance(drowning,30000);assert(drowning.expired,'Idle players should lose when the sea catches up');
const vanish=e.create(99,'sinking');vanish.started=true;
e.advance(vanish,7000);
assert.equal(vanish.rack.filter(Boolean).length,6,'One letter should sink per seven seconds');
assert.equal(e.validState(vanish),true);
const nearWin=e.create(222);nearWin.blocks=23;
let winWord=e.possibleWords(nearWin.rack).sort((a,b)=>a.length-b.length)[0];
selectWord(nearWin,winWord);
assert(e.submit(nearWin).won);
assert(nearWin.won);
assert.equal(e.submit(nearWin).ok,false,'No scoring after success');
console.log('Word Rescue engine: 160 deterministic racks, refill, invalid words, sunk letters, water and victory passed');
