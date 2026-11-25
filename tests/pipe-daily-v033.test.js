// Daily v3 rotation and replayable solutions.
'use strict';
const assert=require('node:assert/strict'),e=require('../pipe-engine.js');
const goals=['any','all','all','any'];
for(let i=0;i<28;i++){
 const day=new Date(Date.parse(e.DAILY_V3_START+'T00:00:00Z')+i*86400000).toISOString().slice(0,10),p=e.daily(day),board=e.clone(p.board);
 assert.equal(p.dailyVersion,3);assert.equal(p.size,7);assert.equal(p.freeTier,i%2?'expert':'advanced');assert.equal(p.freeObjective,goals[i%4]);assert.equal(p.timerMs,null);
 assert.equal(e.evaluate(board).solved,false);assert.equal(e.evaluate(p.solvedBoard).solved,true);
 for(const m of p.solutionMoves)assert(e.move(board,m.from,m.to));assert(e.evaluate(board).solved);
 assert.equal(e.signature(e.daily(day).board),e.signature(p.board));
}
console.log('28 rotated Pipe Shift Daily boards validated');