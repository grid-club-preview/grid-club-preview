/* Grid Zero v1: deterministic finite partition puzzles. */
(function(root){
'use strict';
const VERSION=1,PREVIEW=6;
function rng(seed){let x=Number(seed)>>>0||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
const rand=(r,min,max)=>min+Math.floor(r()*(max-min+1));
function shuffle(xs,r){for(let i=xs.length-1;i>0;i--){const j=rand(r,0,i);[xs[i],xs[j]]=[xs[j],xs[i]];}return xs;}
function generate(seed,traySize=3){
 if(![1,2,3].includes(traySize))throw Error('Invalid tray size');
 const r=rng(seed),cells=[],pieces=[];
 // Every tile is made from its own positive integer partition. Shuffling the
 // pieces preserves a legal solution even with a one-number tray.
 for(let i=0;i<9;i++){
   const count=rand(r,2,3),group=[];
   for(let j=0;j<count;j++)group.push(r()<.065?1:rand(r,2,9));
   cells.push(group.reduce((a,b)=>a+b,0));
   for(const value of group)pieces.push({value,cell:i});
 }
 shuffle(pieces,r);
 return {version:VERSION,seed:Number(seed)>>>0,traySize,cells,numbers:pieces.map(p=>p.value),solution:pieces.map(p=>p.cell)};
}
function fresh(puzzle){return {cells:puzzle.cells.slice(),tray:puzzle.numbers.slice(0,puzzle.traySize),cursor:puzzle.traySize,moves:0};}
function status(s){if(s.cells.every(n=>n===0))return 'won';return s.tray.some(v=>v!==null&&s.cells.some(n=>n>=v))?'playing':'stuck';}
function place(p,s,tile,cell){
 if(status(s)!=='playing'||!Number.isInteger(tile)||!Number.isInteger(cell)||tile<0||tile>=s.tray.length||cell<0||cell>=s.cells.length)return false;
 const v=s.tray[tile];if(!Number.isInteger(v)||v<=0||s.cells[cell]<v)return false;
 s.cells[cell]-=v;s.tray[tile]=p.numbers[s.cursor]??null;if(s.cursor<p.numbers.length)s.cursor++;s.moves++;return true;
}
function remaining(p,s){return p.numbers.length-s.cursor+s.tray.filter(v=>v!==null).length;}
function valid(p,s){
 if(!s||!Array.isArray(s.cells)||!Array.isArray(s.tray)||s.cells.length!==9||s.tray.length!==p.traySize||!Number.isInteger(s.cursor)||s.cursor<p.traySize||s.cursor>p.numbers.length||!Number.isInteger(s.moves)||s.moves<0)return false;
 if(!s.cells.every((v,i)=>Number.isInteger(v)&&v>=0&&v<=p.cells[i])||!s.tray.every(v=>v===null||Number.isInteger(v)&&v>=1&&v<=9))return false;
 const rest=s.tray.filter(v=>v!==null).concat(p.numbers.slice(s.cursor));return s.moves===p.numbers.length-rest.length&&s.cells.reduce((a,b)=>a+b,0)===rest.reduce((a,b)=>a+b,0);
}
const api={VERSION,PREVIEW,generate,fresh,status,place,remaining,valid};root.GridZeroEngine=Object.freeze(api);if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
