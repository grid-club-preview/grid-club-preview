/* Grid Club v0.9.31: always at least one playable vowel, raft starts floating.
 * Run with node tests/word-rescue-v031.test.js */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const e=require('../word-rescue-engine.js');
const css=fs.readFileSync(path.join(__dirname,'..','word-rescue.css'),'utf8');
const vowel=rack=>rack.some(c=>c!==''&&'AEIOU'.includes(c));
assert.equal(e.SEA_BASELINE,22);
assert(css.includes('.wrSea{position:absolute;bottom:0;left:0;right:0;height:22%'));
assert(css.includes('#wordRescueScreen .wrStack{bottom:22%'));
for(const blocks of [0,4,7,12,24]){
 const s=e.create(1);
 s.blocks=blocks;
 for(const ms of [0,7000,21000,30000,50000]){
   s.elapsedMs=ms;
   const previousSea=8+ms/90000*60,previousSafe=25+blocks*1.8;
   assert(Math.abs((e.waterHeight(s)-e.safeHeight(s))-(previousSea-previousSafe))<1e-9,
     'Water gap to failure remains unchanged by moving the sea up');
 }
}
for(let seed=1;seed<=80;seed++){
 for(const mode of ['tide','sinking']){
  const s=e.create(seed,mode);s.started=true;
  assert(vowel(s.rack),'Fresh rack requires a vowel');
  for(let step=0;step<10&&!s.won&&!s.expired;step++){
   const candidate=e.possibleWords(s.rack,s.used).sort((a,b)=>b.length-a.length)[0];
   if(!candidate){e.rerack(s);assert(vowel(s.rack));continue;}
   for(const letter of candidate){
     const idx=s.rack.findIndex((ch,i)=>ch===letter&&!s.selected.includes(i));
     assert(idx>=0);
     e.select(s,idx);
   }
   const result=e.submit(s);
   assert(result.ok);
   assert(vowel(s.rack),'A successful word must leave a vowel');
   if(!s.won){
     e.advance(s,2500);
     assert(vowel(s.rack),'Sinking must leave at least one vowel');
   }
  }
 }
}
const old=e.create(7,'tide');
old.rack=['C','H','L','R','R','S','M'];old.blocks=7;old.elapsedMs=21000;old.score=25;
assert.equal(e.ensureVowel(old),true);
assert(vowel(old.rack),'Repair vowel-free v0.9.30 saved game');
assert.equal(old.blocks,7);assert.equal(old.elapsedMs,21000);assert.equal(old.score,25);
const empty=e.create(23,'sinking');
empty.rack=['','B','C','D','F','G','H'];
assert.equal(e.ensureVowel(empty),true,'Blank tile must not count as vowel');
assert(vowel(empty.rack));
const sink=e.create(9,'sinking');
sink.rack=['A','B','C','D','F','G','H'];sink.started=true;
e.advance(sink,7000);
assert.equal(sink.rack[0],'A','Last vowel must not sink');
assert.equal(sink.rack.filter(Boolean).length,6,'Only one non-vowel disappears');
assert(vowel(sink.rack));
e.advance(sink,14000);
assert(vowel(sink.rack),'Last vowel survives successive sink events');
assert(e.validState(sink));
console.log('Word Rescue v0.9.31: 160 seeded rounds, saved vowel repair, last-vowel protection, raft/water alignment and unchanged survival timing passed');
