// Grid Club v0.9.23 · campaign and Free Play regression checks.
// Run: node tests/pipe-campaign-v8.test.js
'use strict';
const assert=require('node:assert/strict');
const pipe=require('../pipe-engine.js');
assert.deepEqual(pipe.STAGES.map(pipe.stageCount),[5,6,7,7,8,9]);
assert.equal(pipe.MAX_LEVEL,42);
let campaign=0,free=0;
for(let n=1;n<=pipe.MAX_LEVEL;n++){
 const stage=pipe.stageOf(n),p=pipe.get(n),second=pipe.get(n);
 assert(stage);
 assert.equal(p.level,n);
 assert.equal(p.stage,stage.id);
 assert.equal(p.catalogVersion,8);
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
 if(p.timerMs!==null)assert(pipe.moveLimitFor(n)>=p.solutionMoves.length);
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
console.log('Pipe Shift regression passed:',campaign,'campaign stages and',free,'Free Play boards');
