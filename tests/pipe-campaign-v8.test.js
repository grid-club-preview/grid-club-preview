// Grid Club v0.9.27 · campaign, calibrated budgets and Free Play checks.
// Run: node tests/pipe-campaign-v8.test.js
'use strict';
const assert=require('node:assert/strict');
const pipe=require('../pipe-engine.js');
const witnesses=require('./pipe-calibration-witnesses-v025.js');
assert.deepEqual(pipe.STAGES.map(pipe.stageCount),[5,6,7,7,8,9]);
assert.equal(pipe.MAX_LEVEL,42);
let campaign=0,free=0;
for(let n=1;n<=pipe.MAX_LEVEL;n++){
 const stage=pipe.stageOf(n),p=pipe.get(n),second=pipe.get(n);
 assert(stage);
 assert.equal(p.level,n);
 assert.equal(p.stage,stage.id);
 assert.equal(p.catalogVersion,[18,23].includes(n)?10:n===7?9:8);
 assert.equal(pipe.signature(p.board),pipe.signature(second.board));
 assert(pipe.validateBoard(p.board)&&pipe.validateBoard(p.solvedBoard));
 assert.equal(pipe.evaluate(p.board).solved,false);
 assert.equal(pipe.evaluate(p.solvedBoard).solved,true);
 assert(['all','any'].includes(p.freeObjective));
 assert.equal(p.requireAllFlow,p.freeObjective==='all');
 const requireAll=p.board.some(t=>t.kind==='source'&&t.requireAllFlow);
 assert.equal(requireAll,p.freeObjective==='all');
 if(requireAll)assert(!p.board.some(t=>t.kind==='pipe'&&t.decoy));
 const board=pipe.clone(p.board);
 for(const m of p.solutionMoves)assert(pipe.move(board,m.from,m.to),'Known move must be a legal adjacent slide');
 assert(pipe.evaluate(board).solved,'Known solution must solve stage '+n);
 // Three stages have independently observed player completions with screenshots
 // but no recorded slide-by-slide trace. Their actual win counts are 46, 51
 // and 71; don't pretend the much longer generator's reversed walk is
 // a shortest solution. All other caps have reproducible legal witnesses.
 if(p.timerMs!==null){
   const observed={17:46,22:51,24:71};
   if(observed[n]){
     assert(pipe.moveLimitFor(n)>=observed[n],
       'Cap below successful player completion at stage '+n);
     assert(pipe.moveLimitFor(n)<p.solutionMoves.length,
       'Observed human solution should improve generator witness at '+n);
   }else{
     // Redesigned boards must not reuse old-layout calibration witnesses.
     const witness=[18,23].includes(n)?p.solutionMoves:(witnesses.routeFor(n)??p.solutionMoves);
     const candidate=pipe.clone(p.board);
     for(const move of witness)assert(pipe.move(candidate,move.from,move.to),
       'Illegal calibration witness at stage '+n);
     assert(pipe.evaluate(candidate).solved,
       'Witness must satisfy the '+p.freeObjective+' goal at stage '+n);
     assert(pipe.moveLimitFor(n)>=witness.length,
       'Move cap below reproducible winning route at stage '+n);
   }
 }
 if(stage.id>=5&&n>=stage.last-1){
   assert.equal(p.timerMs,null);
   assert.equal(pipe.moveLimitFor(n),null);
 }
 campaign++;
}
for(const [tier,size] of [['beginner',5],['apprentice',6],['advanced',7],['expert',7]]){
 for(const objective of ['any','all'])for(let i=0;i<4;i++){
   const p=pipe.freePlay(size,38172+i,objective,tier),board=pipe.clone(p.board);
   assert.equal(pipe.evaluate(p.solvedBoard).solved,true);
   for(const m of p.solutionMoves)assert(pipe.move(board,m.from,m.to));
   assert.equal(pipe.evaluate(board).solved,true);
   free++;
 }
}
const timed=Array.from({length:pipe.MAX_LEVEL},(_,i)=>i+1).filter(n=>pipe.timerFor(n)!==null);
assert.equal(timed.length,20);
assert.deepEqual(Object.keys(pipe.MOVE_CAPS_V10).map(Number).sort((a,b)=>a-b),timed);
assert.equal(pipe.moveLimitFor(4),35);
assert.equal(pipe.moveLimitFor(5),22);
assert.equal(pipe.moveLimitFor(9),27);
assert.equal(pipe.moveLimitFor(10),32);
assert.equal(pipe.moveLimitFor(11),25);
assert.equal(pipe.timerFor(10),65000);
assert.equal(pipe.timerFor(11),68000);
assert.equal(pipe.get(7).networkType,'stagger');
assert.equal(pipe.get(18).networkType,'advancedFree');
assert.equal(pipe.get(23).networkType,'advancedFree');
console.log('Pipe Shift regression passed:',campaign,'campaign stages and',free,'Free Play boards');
