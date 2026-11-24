// Grid Club v0.9.25 · regression for the shared Club Credit economy.
// Run: node tests/credit-economy-v025.test.js
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const levels=require('../levels.js');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const pipe=fs.readFileSync(path.join(__dirname,'../pipe-shift.js'),'utf8');
const dot=fs.readFileSync(path.join(__dirname,'../game.js'),'utf8');
assert.equal(levels.COST,5);
assert(pipe.includes('square:{cost:3'));
assert(pipe.includes('area:{cost:7'));
assert(pipe.includes('full:{cost:18'));
assert(pipe.includes("const cost=rescue?(extraTimeCount===0?15:10):5"));
assert(dot.includes("const cost=rescue?(used===0?15:10):5"));
assert(dot.includes("levelCore.spend(p,5,'hint'"));
assert(html.includes('id="pipeHintSquare">One square <span>3 ◉'));
assert(html.includes('id="pipeHintArea">Three squares <span>7 ◉'));
assert(html.includes('id="pipeHintFull">Full solution <span>18 ◉'));
assert(html.includes('id="hintCost" hidden>5 ◉'));
function wallet(){
  const p=levels.initial();
  p.ledger.push({id:'test-credit-deposit',amount:100,type:'test'});
  levels.normalize(p);
  return p;
}
let p=wallet();
assert(levels.spend(p,5,'hint','hint-1'));
assert.equal(p.credits,95);
assert(!levels.spend(p,10,'hint','hint-2'),'Old hint cost cannot be charged');
p=wallet();
assert(levels.spend(p,5,'extra-time','time-1'));
assert(levels.spend(p,5,'extra-time','time-1'));
assert(!levels.spend(p,5,'extra-time','time-1'),'A third extension must fail');
p=wallet();
assert(levels.spend(p,15,'extra-time-rescue','rescue-1'));
assert(!levels.spend(p,5,'extra-time','rescue-1'),'No boost after full rescue');
p=wallet();
assert(levels.spend(p,5,'extra-time','rescue-2'));
assert(levels.spend(p,10,'extra-time-rescue','rescue-2'));
assert(!levels.spend(p,10,'extra-time-rescue','rescue-2'),'Rescue cannot be repeated');
console.log('Shared Club Credit economy regression passed');
