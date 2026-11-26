// New Free Play boards retain a full solution and never alter Daily/Levels.
const assert=require('node:assert/strict'),core=require('../puzzle.js');
const distribution={9:{},11:{}},obstacles={};
for(const size of [9,11])for(let seed=1;seed<=60;seed++){
 const p=core.generate(size,seed*7919,{freePlay:true});
 const n=p.pairs.length;assert(n>=(size===9?8:9)&&n<=(size===9?10:11));distribution[size][n]=(distribution[size][n]||0)+1;
 const blocked=p.blocked||[];assert(size===9?blocked.length===0:blocked.length>=3&&blocked.length<=6);
 if(size===11)obstacles[blocked.length]=(obstacles[blocked.length]||0)+1;
 const seen=new Set(),add=cell=>{assert(cell.x>=0&&cell.y>=0&&cell.x<size&&cell.y<size);const k=cell.x+','+cell.y;assert(!seen.has(k));seen.add(k);};
 blocked.forEach(add);
 for(const [id,path] of p.solution.entries()){assert(path.length>=4);assert.deepEqual(p.pairs[id].a,path[0]);assert.deepEqual(p.pairs[id].b,path[path.length-1]);path.forEach((cell,i)=>{add(cell);if(i)assert(core.adjacent(cell,path[i-1]));});}
 assert.equal(seen.size,size*size);
 const game=core.create(p);
 for(const path of p.solution){assert(core.begin(game,path[0]));for(const cell of path.slice(1))assert(core.move(game,cell));core.end(game);}
 assert.equal(core.filled(game),core.playableCells(p));assert(p.pairs.every(pair=>core.connected(game,pair.id)));
 const restored=core.restore(core.serialize(game));assert.deepEqual(restored.level,p);
}
for(const size of [9,11])assert.equal(Object.keys(distribution[size]).length,3);
assert.equal(Object.keys(obstacles).length,4);
for(const size of [5,7,9,11]){const p=core.generate(size,20261126,{daily:true});assert.deepEqual(p,core.generate(size,20261126,{daily:true,freePlay:true}));}
console.log('120 Hard/Expert Free Play boards passed',distribution,obstacles);
