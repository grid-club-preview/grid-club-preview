/* Zero Down v5: single-number play with difficulty-specific final six numbers. */
(function(root){
'use strict';
const VERSION=5,PREVIEW=6;
const V2_DIFFICULTIES=Object.freeze({
 beginner:Object.freeze({traySize:1,baseMin:3,baseMax:7,smallOnes:9,smallTwos:6}),
 apprentice:Object.freeze({traySize:2,baseMin:3,baseMax:9,smallOnes:4,smallTwos:5}),
 advanced:Object.freeze({traySize:3,baseMin:3,baseMax:9,smallOnes:1,smallTwos:4}),
 expert:Object.freeze({traySize:1})
});
const V3_DIFFICULTIES=Object.freeze({
 beginner:Object.freeze({traySize:1,max:7,ones:4,twos:5,threes:3,bias:1}),
 apprentice:Object.freeze({traySize:2,max:8,ones:3,twos:4,threes:3,bias:.75}),
 advanced:Object.freeze({traySize:3,max:9,ones:1,twos:3,threes:2,bias:.45}),
 expert:Object.freeze({traySize:1})
});
const DIFFICULTIES=Object.freeze({
 beginner:Object.freeze({...V3_DIFFICULTIES.beginner,traySize:1}),
 medium:Object.freeze({...V3_DIFFICULTIES.apprentice,traySize:1}),
 hard:Object.freeze({...V3_DIFFICULTIES.advanced,traySize:1}),
 expert:Object.freeze({...V3_DIFFICULTIES.expert,traySize:1})
});
function rng(seed){let x=Number(seed)>>>0||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
const rand=(r,min,max)=>min+Math.floor(r()*(max-min+1));
function shuffle(xs,r){for(let i=xs.length-1;i>0;i--){const j=rand(r,0,i);[xs[i],xs[j]]=[xs[j],xs[i]];}return xs;}
function legacy(seed,traySize=3){
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
 return {version:1,seed:Number(seed)>>>0,traySize,cells,numbers:pieces.map(p=>p.value),solution:pieces.map(p=>p.cell)};
}
function version2(seed,difficulty='beginner'){
 // Keep the old generator for restoring unfinished v0.9.74 games.
 if(typeof difficulty==='number')return legacy(seed,difficulty);
 const c=V2_DIFFICULTIES[difficulty];if(!c)throw Error('Invalid difficulty');
 const r=rng(seed),cells=Array(9).fill(0),pieces=[],tail=[];
 function add(value,cell,target){cells[cell]+=value;target.push({value,cell});}
 for(let i=0;i<9;i++){
   if(difficulty==='expert'){for(let j=rand(r,2,3);j>0;j--)add(r()<.065?1:rand(r,2,9),i,pieces);}
   else{add(rand(r,c.baseMin,c.baseMax),i,pieces);if(r()<.65)add(rand(r,c.baseMin,c.baseMax),i,pieces);}
 }
 if(difficulty!=='expert'){
   let order=shuffle(Array.from({length:9},(_,i)=>i),r);
   for(let j=0;j<c.smallOnes;j++)add(1,order[j%9],tail);
   order=shuffle(Array.from({length:9},(_,i)=>i),r);
   for(let j=0;j<c.smallTwos;j++)add(2,order[j%9],tail);
 }
 shuffle(pieces,r);
 const twos=shuffle(tail.filter(x=>x.value===2),r),ones=shuffle(tail.filter(x=>x.value===1),r);
 pieces.push(...twos,...ones);
 return {version:2,seed:Number(seed)>>>0,difficulty,traySize:c.traySize,cells,numbers:pieces.map(p=>p.value),solution:pieces.map(p=>p.cell)};
}
function version3(seed,difficulty='beginner'){
 if(typeof difficulty==='number')return legacy(seed,difficulty);
 const c=V3_DIFFICULTIES[difficulty];if(!c)throw Error('Invalid difficulty');
 const r=rng(seed);
 // Construct a witness solution before ordering the incoming numbers.
 // For easier modes, independent random keys bias small numbers later, but
 // never force them into a single block. Reject triples of identical tiles.
 for(let attempt=0;attempt<64;attempt++){
   const cells=Array(9).fill(0),pieces=[];
   function add(value,cell){cells[cell]+=value;pieces.push({value,cell});}
   for(let i=0;i<9;i++){
     if(difficulty==='expert'){for(let j=rand(r,2,3);j>0;j--)add(r()<.065?1:rand(r,2,9),i);}
     else{add(rand(r,3,c.max),i);if(r()<.65)add(rand(r,3,c.max),i);}
   }
   if(difficulty!=='expert')for(const [v,num] of [[1,c.ones],[2,c.twos],[3,c.threes]]){
     const order=shuffle(Array.from({length:9},(_,i)=>i),r);
     for(let j=0;j<num;j++)add(v,order[j%9]);
   }
   for(let k=0;k<24;k++){
     const pool=pieces.map(p=>({...p,key:r()+(c.bias||0)*(1-p.value/(c.max||9))})).sort((a,b)=>a.key-b.key),out=[];
     while(pool.length){
       let i=0,n=out.length;
       if(n>=2&&out[n-1].value===out[n-2].value&&pool[0].value===out[n-1].value){i=pool.findIndex(p=>p.value!==out[n-1].value);if(i<0)break;}
       out.push(pool.splice(i,1)[0]);
     }
     if(pool.length)continue;
     const tail=out.slice(-6);
     if(difficulty==='beginner'&&(!tail.some(p=>p.value>=3)||tail.filter(p=>p.value<=2).length<2))continue;
     return {version:3,seed:Number(seed)>>>0,difficulty,traySize:c.traySize,cells,numbers:out.map(p=>p.value),solution:out.map(p=>p.cell)};
   }
 }
 // Deterministic fallback; these seed/config pairs are covered by tests.
 if((Number(seed)>>>0)!==174937){const p=version3(174937,difficulty);return {...p,seed:Number(seed)>>>0};}
 throw Error('Unable to generate a varied puzzle');
}
function version4(seed,difficulty='beginner'){
 if(typeof difficulty==='number')return legacy(seed,difficulty);
 if(!DIFFICULTIES[difficulty])throw Error('Invalid difficulty');
 const old=({medium:'apprentice',hard:'advanced'})[difficulty]||difficulty;
 return {...version3(seed,old),version:4,difficulty,traySize:1};
}
const TAILS=Object.freeze({
 beginner:{small:[3,4],large:[0,1],last:[1,3]},
 medium:{small:[2,3],large:[1,2],last:[1,5]},
 hard:{small:[0,2],large:[2,4],last:[3,7]},
 expert:{small:[0,1],large:[3,5],last:[4,9]}
});
function generate(seed,difficulty='beginner'){
 if(typeof difficulty==='number')return legacy(seed,difficulty);
 const rule=TAILS[difficulty];if(!rule)throw Error('Invalid difficulty');
 const r=rng((Number(seed)^0x9e3779b9)>>>0),within=(v,range)=>v>=range[0]&&v<=range[1];
 const category=v=>v<=2?0:v>=5?2:1;
 const varied=xs=>xs.every((v,i)=>i<2||v!==xs[i-1]||v!==xs[i-2]);
 for(let attempt=0;attempt<64;attempt++){
   const p=version4(attempt===0?seed:rand(r,1,4294967295),difficulty);
   const pieces=p.numbers.map((value,i)=>({value,cell:p.solution[i],i}));
   const groups=[0,1,2].map(c=>pieces.filter(x=>category(x.value)===c));
   const counts=[];
   for(let a=rule.small[0];a<=rule.small[1];a++)for(let b=rule.large[0];b<=rule.large[1];b++){const n=[a,6-a-b,b];if(n.every((v,i)=>v>=0&&v<=groups[i].length))counts.push(n);}
   if(!counts.length)continue;
   for(let k=0;k<64;k++){
     const n=counts[rand(r,0,counts.length-1)];
     const chosen=groups.flatMap((g,i)=>g.map(x=>({...x,key:r()+.35*(1-x.i/pieces.length)})).sort((a,b)=>a.key-b.key).slice(0,n[i]));
     const ids=new Set(chosen.map(x=>x.i)),front=pieces.filter(x=>!ids.has(x.i));
     const endings=chosen.filter(x=>within(x.value,rule.last));if(!endings.length)continue;
     const last=endings[rand(r,0,endings.length-1)],tail=shuffle(chosen.filter(x=>x.i!==last.i),r).concat(last);
     const out=front.concat(tail);if(!varied(out.map(x=>x.value)))continue;
     return {...p,version:VERSION,seed:Number(seed)>>>0,numbers:out.map(x=>x.value),solution:out.map(x=>x.cell)};
   }
 }
 // Deterministic, tested fallback for extremely unlucky seeds.
 if((Number(seed)>>>0)!==174937)return {...generate(174937,difficulty),seed:Number(seed)>>>0};
 throw Error('Unable to generate constrained tail');
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
const api={VERSION,PREVIEW,DIFFICULTIES,generate,legacy,version2,version3,version4,TAILS,fresh,status,place,remaining,valid};root.GridZeroEngine=Object.freeze(api);if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
