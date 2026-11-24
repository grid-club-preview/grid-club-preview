/* Grid Club v0.9.25 · objective-aware candidate route search.
 * This deliberately runs OFFLINE in regression/calibration, never while
 * presenting a game board. It finds legal examples, not proven optima.
 * It is safe to use the existing generator solution if no improvement is found.
 */
(function(root){
'use strict';
function solve(p,engine,options={}){
 if(!p||!engine?.evaluate||!engine?.legalMoves||!Array.isArray(p.solvedBoard))return null;
 const size=p.size,base=p.board,solved=p.solvedBoard;
 const perGoal=Math.max(100,Math.floor(options.perGoal||1000));
 const tries=Math.max(1,Math.min(30,Math.floor(options.attempts||15)));
 const maxTotal=Math.max(1000,Math.floor(options.maxExpanded||160000));
 const positions=solved.flatMap((t,i)=>t.kind==='pipe'&&!t.decoy&&!t.fixed?[{i,t}]:[]);
 if(!positions.length)return {moves:[],length:0,objective:p.freeObjective,expanded:0,method:'trivial'};
 const sources=solved.flatMap((t,i)=>t.kind==='source'?[i]:[]);
 const distance=(a,b)=>Math.abs(a%size-b%size)+Math.abs(Math.floor(a/size)-Math.floor(b/size));
 const sourceDistance=i=>Math.min(...sources.map(s=>distance(i,s)));
 const token=t=>t.kind==='empty'?'_':t.kind==='pipe'?
   String.fromCharCode(65+t.mask)+(t.decoy?'d':'p')+(t.transportPiece?'g':''):
   t.kind==='block'?'B':t.kind==='wall'?'W':t.kind==='source'?'S':'T';
 const key=board=>board.map(token).join('');
 const matches=(a,b)=>a.kind==='pipe'&&a.mask===b.mask&&
   (!!a.transportPiece===!!b.transportPiece)&&(!b.transportPiece||a.transportTarget===b.transportTarget);
 // Binary min-heap on numeric score.
 function put(q,node){
   q.push(node);let i=q.length-1;
   while(i>0){const j=(i-1)>>1;if(q[j].f<=node.f)break;q[i]=q[j];i=j;}q[i]=node;
 }
 function pull(q){
   const first=q[0],last=q.pop();if(!q.length)return first;
   let i=0;for(;;){const left=2*i+1,right=left+1;if(left>=q.length)break;
     const j=right<q.length&&q[right].f<q[left].f?right:left;
     if(last.f<=q[j].f)break;q[i]=q[j];i=j;}
   q[i]=last;return first;
 }
 // Reposition one requested working tile without disturbing positions already
 // completed. The return value is always a sequence of real legal slides.
 function place(board,target,locks,budget,tieSeed){
   if(matches(board[target.i],target.t))return {moves:[],expanded:0,board};
   const tx=target.i%size,ty=Math.floor(target.i/size);
   function heuristic(state){
     if(matches(state[target.i],target.t))return 0;
     let h=100;
     for(let i=0;i<state.length;i++){
       if(locks.has(i))continue;
       if(matches(state[i],target.t)){
         const d=Math.abs(i%size-tx)+Math.abs(Math.floor(i/size)-ty);
         h=Math.min(h,d);
       }
     }
     return h+(state[target.i].kind==='empty'?0:1.25);
   }
   const heap=[],seen=new Map([[key(board),0]]);
   put(heap,{b:board,g:0,f:heuristic(board)*3,from:null,m:null});
   let expanded=0;
   while(heap.length&&expanded<budget){
     const node=pull(heap);expanded++;
     if(matches(node.b[target.i],target.t)){
       const slides=[];let current=node;
       while(current.from){slides.push(current.m);current=current.from;}
       slides.reverse();
       return {moves:slides,expanded,board:node.b};
     }
     for(const m of engine.legalMoves(node.b)){
       if(locks.has(m.from)||locks.has(m.to))continue;
       if(node.m&&m.from===node.m.to&&m.to===node.m.from)continue;
       const b=node.b.slice();b[m.to]=b[m.from];b[m.from]=node.b[m.to];
       const g=node.g+1,id=key(b);
       if(seen.has(id)&&seen.get(id)<=g)continue;
       seen.set(id,g);
       const h=heuristic(b);if(h>=100)continue;
       // Tiny deterministic perturbation makes tied searches explore varied
       // manoeuvres without relying on Math.random or changing between runs.
       const noise=((m.from*73+m.to*11+tieSeed*17)%13)*.002;
       put(heap,{b,g,f:g+h*2.65+noise,from:node,m});
     }
     if(heap.length>7000){heap.sort((a,b)=>a.f-b.f);heap.length=4500;}
   }
   return {moves:null,expanded};
 }
 const src=positions.slice().sort((a,b)=>sourceDistance(a.i)-sourceDistance(b.i));
 const variants=[
   src,
   src.slice().reverse(),
   positions.slice().sort((a,b)=>a.i-b.i),
   positions.slice().sort((a,b)=>b.i-a.i),
   positions.slice().sort((a,b)=>{
     const d=t=>Math.min(...base.flatMap((tile,i)=>matches(tile,t.t)?[distance(i,t.i)]:[]).concat([50]));
     return d(a)-d(b);
   }),
   positions.slice().sort((a,b)=>{
     const d=t=>Math.min(...base.flatMap((tile,i)=>matches(tile,t.t)?[distance(i,t.i)]:[]).concat([50]));
     return d(b)-d(a);
   })
 ];
 let random=(p.seed||p.level||1)>>>0;
 const next=()=>{random^=random<<13;random^=random>>>17;random^=random<<5;return(random>>>0)/4294967296;};
 while(variants.length<tries){
   const order=positions.slice();
   for(let i=order.length-1;i>0;i--){const j=Math.floor(next()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
   variants.push(order);
 }
 let best=null,expanded=0,finished=0;
 for(let attempt=0;attempt<Math.min(tries,variants.length);attempt++){
   let b=engine.clone(base),moves=[],locked=new Set(),bad=false;
   for(const goal of variants[attempt]){
     if(expanded>=maxTotal){bad=true;break;}
     if(matches(b[goal.i],goal.t)){locked.add(goal.i);continue;}
     const result=place(b,goal,locked,Math.min(perGoal,maxTotal-expanded),attempt);
     expanded+=result.expanded;
     if(!result.moves){bad=true;break;}
     for(const m of result.moves){
       if(!engine.move(b,m.from,m.to))throw Error('Candidate route has an illegal slide');
       moves.push(m);
     }
     locked.add(goal.i);
   }
   if(bad)continue;
   if(engine.evaluate(b).solved){
     finished++;
     if(!best||moves.length<best.length)best={moves,length:moves.length,objective:p.freeObjective,expanded,attempt,method:'target-guided'};
   }
 }
 if(best)return {...best,attempts:Math.min(tries,variants.length),finished};
 return {moves:null,length:null,objective:p.freeObjective,expanded,attempts:Math.min(tries,variants.length),finished,method:'unresolved'};
}
const api=Object.freeze({solve});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.GridClubPipeSolver=api;
})(typeof globalThis==='object'?globalThis:this);
