// Grid Club v0.9.27 · ranked Pipe Shift daily v1/v2 reproducibility.
'use strict';
const assert=require('node:assert/strict'),e=require('../pipe-engine.js');
const historical={
 '2026-11-24':[2684209963,1562225875],
 '2026-11-25':[2142562274,1515143667],
 '2026-11-26':[987293817,4215193686]
};
for(const [date,[seed,checksum]]of Object.entries(historical)){
 const p=e.daily(date);
 assert.equal(p.dailyVersion,1);
 assert.equal(p.seed,seed);
 assert.equal(e.hashSeed(e.signature(p.board)),checksum);
}
for(let i=0;i<21;i++){
 const d=new Date(Date.parse('2026-11-27T00:00:00Z')+i*86400000).toISOString().slice(0,10);
 const p=e.daily(d),board=e.clone(p.board);
 assert.equal(p.dailyVersion,2);
 assert.equal(p.size,7);
 assert.equal(p.freeObjective,'all');
 assert.equal(p.requireAllFlow,true);
 assert.equal(e.evaluate(p.board).solved,false);
 assert.equal(e.evaluate(p.solvedBoard).solved,true);
 assert(p.solvedBoard.filter(t=>t.kind==='pipe').length>=15);
 assert(p.difficultyMetrics.essentialWrong>=9);
 for(const m of p.solutionMoves)assert(e.move(board,m.from,m.to));
 assert(e.evaluate(board).solved,'Verified route must complete '+d);
 assert.equal(e.signature(e.daily(d).board),e.signature(p.board));
}
console.log('Pipe Daily v2: old published boards frozen and 21 new daily boards solvable');
