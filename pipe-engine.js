/* Grid Club Pipe Shift v0.9.5 · reproducible challenges and shortcut-audited levels */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.PipeEngine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const N=1,E=2,S=4,W=8,SIZE=5,MAX_LEVEL=42,PUZZLES_PER_STAGE=7;
const DIRECTIONS=[{bit:N,dx:0,dy:-1,opposite:S},{bit:E,dx:1,dy:0,opposite:W},{bit:S,dx:0,dy:1,opposite:N},{bit:W,dx:-1,dy:0,opposite:E}];
const STAGES=[
 {id:1,name:'Beginner',size:5,first:1,last:7,mode:'path'},
 {id:2,name:'Advanced',size:6,first:8,last:14,mode:'path'},
 {id:3,name:'Expert',size:7,first:15,last:21,mode:'path'},
 {id:4,name:'Expert · Branches',size:7,first:22,last:28,mode:'loop'},
 {id:5,name:'Expert · Multiple terminals',size:7,first:29,last:35,mode:'multiple'},
 {id:6,name:'Expert · Full network',size:7,first:36,last:42,mode:'double'}
];
const sizeOf=b=>Array.isArray(b)&&[5,6,7].includes(Math.sqrt(b.length))?Math.sqrt(b.length):0;
const id=(x,y,s=5)=>x+y*s,at=(i,s=5)=>({x:i%s,y:Math.floor(i/s)});
const clone=b=>b.map(x=>({...x}));
function direction(a,b,size=5){const p=at(a,size),q=at(b,size);return DIRECTIONS.find(d=>p.x+d.dx===q.x&&p.y+d.dy===q.y);}
function adjacent(a,b,size=5){return Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<size*size&&b<size*size&&!!direction(a,b,size);}
function rng(seed){let v=seed>>>0||1;return()=>((v=(Math.imul(v,1664525)+1013904223)>>>0)/4294967296);}
function shuffle(xs,r){for(let i=xs.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[xs[j],xs[i]]=[xs[i],xs[j]];}return xs;}
function pathDesign(size,seed,extra){
 const random=rng(seed),row=(size===6?2:Math.floor(size/2))+(size>=6&&random()>.62?1:0),chosen=[];
 for(const x of shuffle(Array.from({length:size-1},(_,i)=>i),random))if((x>0||size>=7)&&chosen.length<Math.min(extra,3)&&chosen.every(k=>Math.abs(k-x)>1))chosen.push(x);
 const path=[[0,row]];
 for(let x=0;x<size-1;x++){
   if(chosen.includes(x)){const sign=random()>.5?1:-1;const y=row+sign>=0&&row+sign<size?row+sign:row-sign;path.push([x,y],[x+1,y],[x+1,row]);}
   else path.push([x+1,row]);
 }
 return {paths:[path],sources:[path[0]],sinks:[path[path.length-1]]};
}
function loopDesign(seed){
 const r=rng(seed),y=2+Math.floor(r()*3),sign=y===4?-1:y===2?1:r()>.5?1:-1;
 const main=[[0,y],[1,y],[2,y],[3,y],[4,y],[5,y],[6,y]];
 if(r()>.5)main.splice(1,0,[0,y-sign],[1,y-sign]);
 return {paths:[main,[[2,y],[2,y+sign],[3,y+sign],[4,y+sign],[4,y]]],sources:[[0,y]],sinks:[[6,y]]};
}
function multipleDesign(seed){
 const flip=(seed>>>0)%2===0;
 if(flip)return {paths:[[[0,3],[1,3],[2,3],[3,3],[4,3]],[[4,3],[4,2],[4,1],[5,1],[6,1]],[[4,3],[4,4],[4,5],[5,5],[6,5]]],sources:[[0,3]],sinks:[[6,1],[6,5]]};
 return {paths:[[[0,1],[1,1],[2,1],[2,2],[2,3]],[[0,5],[1,5],[2,5],[2,4],[2,3]],[[2,3],[3,3],[4,3],[5,3],[6,3]]],sources:[[0,1],[0,5]],sinks:[[6,3]]};
}
function doubleDesign(seed){
 const paths=[[[0,1],[1,1],[2,1],[2,2],[2,3]],[[0,5],[1,5],[2,5],[2,4],[2,3]],[[2,3],[3,3],[4,3]],[[4,3],[4,2],[4,1],[5,1],[6,1]],[[4,3],[4,4],[4,5],[5,5],[6,5]]];
 const mirror=(seed&1)===1,flip=ps=>ps.map(([x,y])=>[mirror?6-x:x,y]);
 return {paths:paths.map(flip),sources:flip([[0,1],[0,5]]),sinks:flip([[6,1],[6,5]])};
}
function cornerTraverseDesign(){
  // A real loop near the inlet, followed by a route to the opposite corner.
  const main=[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[5,6]];
  const loop=[[2,0],[2,1],[3,1],[4,1],[4,0]];
  return {paths:[main,loop],sources:[[0,0]],sinks:[[5,6]]};
}

function weaveDesignA(){
 const main=[[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],
 [6,2],[6,3],[5,3],[4,3],[3,3],[2,3],[1,3],[0,3],
 [0,4],[0,5],[1,5],[2,5],[3,5],[4,5],[5,5],[6,5]];
 return {paths:[main,[[2,1],[2,2],[3,2],[4,2],[4,1]],[[2,3],[2,4],[3,4],[4,4],[4,3]]],
 sources:[[0,1]],sinks:[[6,5]]};
}
function weaveDesignB(){
 const main=[[6,0],[5,0],[4,0],[3,0],[2,0],[1,0],[0,0],
 [0,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],
 [6,3],[6,4],[5,4],[4,4],[3,4],[2,4],[1,4],[0,4],[0,5],[0,6]];
 return {paths:[main,[[2,0],[2,1],[3,1],[4,1],[4,0]],[[2,2],[2,3],[3,3],[4,3],[4,2]]],
 sources:[[6,0]],sinks:[[0,6]]};
}
const DECORS=[N|S,E|W,N|E,E|S,S|W,W|N];
function network({size,mode,seed,complexity=1,fixedCount=0,walls=0,decoys=0,blocks=0}){
 const graph=mode==='corner'?cornerTraverseDesign():mode==='weaveA'?weaveDesignA():mode==='weaveB'?weaveDesignB():mode==='loop'?loopDesign(seed):mode==='multiple'?multipleDesign(seed):mode==='double'?doubleDesign(seed):pathDesign(size,seed,complexity);
 const rand=rng(seed^0x87661ab5),board=Array.from({length:size*size},()=>({kind:'empty',mask:0,fixed:false})),ports=new Map();
 for(const path of graph.paths)for(let i=1;i<path.length;i++){
   const a=id(...path[i-1],size),b=id(...path[i],size),d=direction(a,b,size);
   if(!d)throw Error('Non-adjacent network');ports.set(a,(ports.get(a)||0)|d.bit);ports.set(b,(ports.get(b)||0)|d.opposite);
 }
 const sources=graph.sources.map(([x,y])=>id(x,y,size)),sinks=graph.sinks.map(([x,y])=>id(x,y,size));
 for(const [index,mask] of ports){const degrees=DIRECTIONS.filter(d=>mask&d.bit).length;
   if(degrees<1||degrees>3)throw Error('Unsupported pipe intersection');
   const kind=sources.includes(index)?'source':sinks.includes(index)?'sink':'pipe';
   if(kind!=='pipe'&&degrees!==1)throw Error('Terminal is not an endpoint');
   board[index]={kind,mask,fixed:kind!=='pipe'};
 }
 if(['corner','weaveA','weaveB'].includes(mode)){
   const target=mode==='weaveA'?id(5,5,size):mode==='weaveB'?id(0,5,size):id(6,6,size);
   if(board[target].kind!=='pipe')throw Error('Missing target elbow');
   board[target].transportPiece=true;
   // Do not change the shape of previously saved v6 corner puzzles.
   if(mode!=='corner')board[target].transportTarget=target;
 }
 const candidates=shuffle([...ports.keys()].filter(i=>board[i].kind==='pipe'&&!board[i].transportPiece),rand);
 for(const i of candidates.slice(0,fixedCount))board[i].fixed=true;
 const unused=shuffle(board.map((t,i)=>t.kind==='empty'?i:-1).filter(i=>i>=0),rand);
 for(const i of unused.splice(0,walls))board[i]={kind:'wall',mask:0,fixed:true};
 // Keep at least six genuine gaps on crowded boards; they are essential
 // for moving pipes around without relying on rapid repeated tapping.
 // Reserve solid sliding blocks first so extra decoy pipes do not displace
 // the advanced mechanic from the later fixed stages.
 const gaps=size===7?6:3;
 for(const i of unused.splice(0,Math.min(blocks,Math.max(0,unused.length-gaps))))board[i]={kind:'block',mask:0,fixed:false};
 for(const i of unused.splice(0,Math.min(decoys,Math.max(0,unused.length-gaps))))board[i]={kind:'pipe',mask:DECORS[Math.floor(rand()*DECORS.length)],fixed:false,decoy:true};
 if(!evaluate(board).solved)throw Error('Authored flow does not connect');
 return board;
}
function legalMoves(board){const size=sizeOf(board);if(!size)return [];const result=[];
 for(let from=0;from<board.length;from++)if((board[from].kind==='pipe'||board[from].kind==='block')&&!board[from].fixed){
   for(const d of DIRECTIONS){const {x,y}=at(from,size),xx=x+d.dx,yy=y+d.dy;if(xx>=0&&yy>=0&&xx<size&&yy<size){const to=id(xx,yy,size);if(board[to].kind==='empty')result.push({from,to});}}
 }return result;
}
function canMove(board,from,to){const size=sizeOf(board);return !!size&&adjacent(from,to,size)&&(board[from]?.kind==='pipe'||board[from]?.kind==='block')&&!board[from].fixed&&board[to]?.kind==='empty';}
function move(board,from,to){if(!canMove(board,from,to))return false;[board[from],board[to]]=[board[to],board[from]];return true;}
function evaluate(board){const size=sizeOf(board);if(!size)return {solved:false,flow:[],leaks:0};
 const sources=[],sinks=[];board.forEach((t,i)=>{if(t.kind==='source')sources.push(i);if(t.kind==='sink')sinks.push(i);});
 if(!sources.length||!sinks.length)return {solved:false,flow:[],leaks:0};
 const visited=new Set(),queue=[sources[0]];let leaks=0;
 while(queue.length){const here=queue.shift();if(visited.has(here))continue;visited.add(here);const p=at(here,size),tile=board[here];
   for(const d of DIRECTIONS)if(tile.mask&d.bit){const nx=p.x+d.dx,ny=p.y+d.dy;if(nx<0||ny<0||nx>=size||ny>=size){leaks++;continue;}
     const there=id(nx,ny,size),other=board[there];if(!other||(other.mask&d.opposite)===0||other.kind==='wall'||other.kind==='empty')leaks++;else if(!visited.has(there))queue.push(there);
   }
 }
 const reachedOutlet=sinks.every(i=>visited.has(i)),sourcesReached=sources.every(i=>visited.has(i));
 const branches=[...visited].filter(i=>DIRECTIONS.filter(d=>board[i].mask&d.bit).length===3).length;
 const degreeSum=[...visited].reduce((n,i)=>n+DIRECTIONS.filter(d=>board[i].mask&d.bit).length,0);
 const special=board.findIndex(tile=>tile.transportPiece===true);
 const target=special<0?-1:(board[special].transportTarget??board.length-1);
 const transportReady=special<0||(special===target&&visited.has(special));
 return {solved:leaks===0&&reachedOutlet&&sourcesReached&&transportReady,leaks,reachedOutlet,sourcesReached,flow:[...visited],branches,cycles:degreeSum/2-visited.size+1,sources:sources.length,sinks:sinks.length};
}
function scramble(solved,seed,steps){let best=null,bestScore=-1;
 for(let attempt=0;attempt<26;attempt++){
   const b=clone(solved),r=rng(seed+Math.imul(attempt+1,2654435761)),history=[];let prior=null;
   for(let j=0;j<steps;j++){
     const candidates=legalMoves(b),filtered=candidates.filter(m=>!prior||!(m.from===prior.to&&m.to===prior.from));
     const possible=filtered.length?filtered:candidates;if(!possible.length)break;
     const weighted=possible.flatMap(m=>b[m.from].decoy?[m]:[m,m]);const m=weighted[Math.floor(r()*weighted.length)];move(b,m.from,m.to);history.push(m);prior=m;
   }
   const score=b.reduce((n,t,i)=>n+(t.kind!==solved[i].kind||t.mask!==solved[i].mask||!!t.decoy!==!!solved[i].decoy?1:0),0);
   if(!evaluate(b).solved&&score>bestScore){best={board:b,moves:history,displacement:score};bestScore=score;}
   if(bestScore>=Math.min(18,4+Math.floor(steps/3)))break;
 }
 if(!best)throw Error('Unable to scramble');
 return {board:best.board,solutionMoves:best.moves.reverse().map(m=>({from:m.to,to:m.from})),displacement:best.displacement};
}
// Reposition a distinctive corner elbow near the opposite inlet using only
// legal slides. We append the reverse route to the published solution.
function stretchCorner(scrambled,desired=8){
 const board=clone(scrambled.board),size=sizeOf(board),tag=()=>board.findIndex(t=>t.transportPiece);
 if(tag()<0)throw Error('Missing long-distance tile');
 const neighbours=index=>DIRECTIONS.map(d=>{
   const p=at(index,size),x=p.x+d.dx,y=p.y+d.dy;
   return x>=0&&y>=0&&x<size&&y<size?id(x,y,size):-1;
 }).filter(x=>x>=0);
 const passable=index=>board[index].kind==='empty'||
   ((board[index].kind==='pipe'||board[index].kind==='block')&&!board[index].fixed);
 function pathTo(from,to,avoid=-1){
   const queue=[from],parent=new Map([[from,null]]);
   while(queue.length){
     const here=queue.shift();if(here===to)break;
     for(const next of neighbours(here)){
       if(next===avoid||parent.has(next)||!passable(next))continue;
       parent.set(next,here);queue.push(next);
     }
   }
   if(!parent.has(to))return null;
   const path=[];for(let at=to;at!==null;at=parent.get(at))path.push(at);
   return path.reverse();
 }
 const slides=[];
 function clear(position,tagPos){
   if(board[position].kind==='empty')return true;
   if(!passable(position))return false;
   const queue=[position],parent=new Map([[position,null]]),otherEmpty=[];
   while(queue.length){
     const here=queue.shift();
     if(board[here].kind==='empty'){otherEmpty.push(here);break;}
     for(const next of neighbours(here))if(next!==tagPos&&!parent.has(next)&&passable(next)){
       parent.set(next,here);queue.push(next);
     }
   }
   if(!otherEmpty.length)return false;
   let child=otherEmpty[0];
   while(parent.get(child)!==null){
     const previous=parent.get(child);
     if(!move(board,previous,child))return false;
     slides.push({from:previous,to:child});child=previous;
   }
   return board[position].kind==='empty';
 }
 let position=tag();
 const path=pathTo(position,desired);
 if(!path||path.length<7)throw Error('No long traversal path');
 for(const next of path.slice(1)){
   if(!clear(next,position)||!move(board,position,next))throw Error('Cannot create long traversal');
   slides.push({from:position,to:next});position=next;
 }
 if(tag()!==desired||evaluate(board).solved)throw Error('Transport did not challenge');
 return {...scrambled,board,
   solutionMoves:slides.reverse().map(m=>({from:m.to,to:m.from})).concat(scrambled.solutionMoves),
   initialMoves:slides.length+scrambled.initialMoves,
   transportDistance:path.length-1};
}
function signature(board){return board.map(t=>`${t.kind[0]}${t.mask}${t.fixed?'f':''}`).join('|');}
const LEGACY=[{"level":1,"size":5,"board":[{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"source","mask":2,"fixed":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":10,"fixed":false},{"kind":"pipe","mask":10,"fixed":false},{"kind":"sink","mask":8,"fixed":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":10,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false}],"solvedBoard":[{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"source","mask":2,"fixed":true},{"kind":"pipe","mask":10,"fixed":false},{"kind":"pipe","mask":10,"fixed":false},{"kind":"pipe","mask":10,"fixed":false},{"kind":"sink","mask":8,"fixed":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false}],"solutionMoves":[{"from":12,"to":11},{"from":17,"to":12}],"initialMoves":2,"displacement":2,"fixedPipes":0,"walls":0},{"level":2,"size":5,"board":[{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":6,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":12,"fixed":false,"decoy":true},{"kind":"pipe","mask":10,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"source","mask":2,"fixed":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":9,"fixed":false},{"kind":"pipe","mask":12,"fixed":false},{"kind":"sink","mask":8,"fixed":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":3,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false}],"solvedBoard":[{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":12,"fixed":false,"decoy":true},{"kind":"pipe","mask":6,"fixed":false},{"kind":"pipe","mask":10,"fixed":false},{"kind":"pipe","mask":12,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"source","mask":2,"fixed":true},{"kind":"pipe","mask":9,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":3,"fixed":false},{"kind":"sink","mask":8,"fixed":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false}],"solutionMoves":[{"from":13,"to":8},{"from":12,"to":11},{"from":6,"to":5},{"from":1,"to":6},{"from":18,"to":13}],"initialMoves":5,"displacement":8,"fixedPipes":0,"walls":0},{"level":3,"size":5,"board":[{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":12,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"source","mask":2,"fixed":true},{"kind":"pipe","mask":3,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"sink","mask":8,"fixed":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":10,"fixed":false},{"kind":"pipe","mask":6,"fixed":false},{"kind":"pipe","mask":12,"fixed":false,"decoy":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":9,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":3,"fixed":false,"decoy":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"wall","mask":0,"fixed":true},{"kind":"empty","mask":0,"fixed":false}],"solvedBoard":[{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"source","mask":2,"fixed":true},{"kind":"pipe","mask":12,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":6,"fixed":false},{"kind":"sink","mask":8,"fixed":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":3,"fixed":false},{"kind":"pipe","mask":10,"fixed":false},{"kind":"pipe","mask":9,"fixed":false},{"kind":"pipe","mask":12,"fixed":false,"decoy":true},{"kind":"pipe","mask":3,"fixed":false,"decoy":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"wall","mask":0,"fixed":true},{"kind":"empty","mask":0,"fixed":false}],"solutionMoves":[{"from":12,"to":7},{"from":17,"to":18},{"from":13,"to":8},{"from":6,"to":11},{"from":18,"to":13},{"from":7,"to":12},{"from":1,"to":6},{"from":20,"to":15}],"initialMoves":8,"displacement":8,"fixedPipes":0,"walls":1},{"level":4,"size":5,"board":[{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":6,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":3,"fixed":false,"decoy":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":9,"fixed":false},{"kind":"pipe","mask":12,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":6,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":3,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"sink","mask":8,"fixed":true},{"kind":"source","mask":2,"fixed":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":9,"fixed":false},{"kind":"pipe","mask":9,"fixed":false,"decoy":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"wall","mask":0,"fixed":true}],"solvedBoard":[{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":3,"fixed":false,"decoy":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":6,"fixed":false},{"kind":"pipe","mask":12,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":6,"fixed":false},{"kind":"pipe","mask":9,"fixed":false},{"kind":"pipe","mask":3,"fixed":false},{"kind":"sink","mask":8,"fixed":true},{"kind":"source","mask":2,"fixed":true},{"kind":"pipe","mask":9,"fixed":false},{"kind":"pipe","mask":9,"fixed":false,"decoy":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"wall","mask":0,"fixed":true}],"solutionMoves":[{"from":21,"to":16},{"from":1,"to":2},{"from":4,"to":3},{"from":12,"to":13},{"from":10,"to":11},{"from":2,"to":1},{"from":7,"to":12},{"from":22,"to":17},{"from":1,"to":6},{"from":3,"to":2},{"from":6,"to":7}],"initialMoves":11,"displacement":12,"fixedPipes":0,"walls":1},{"level":5,"size":5,"board":[{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":5,"fixed":false,"decoy":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":9,"fixed":false,"decoy":true},{"kind":"pipe","mask":12,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"sink","mask":8,"fixed":true},{"kind":"source","mask":2,"fixed":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":5,"fixed":false},{"kind":"pipe","mask":6,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":3,"fixed":false},{"kind":"pipe","mask":10,"fixed":true},{"kind":"pipe","mask":9,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":9,"fixed":false,"decoy":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"wall","mask":0,"fixed":true}],"solvedBoard":[{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":5,"fixed":false,"decoy":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":9,"fixed":false,"decoy":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":6,"fixed":false},{"kind":"sink","mask":8,"fixed":true},{"kind":"source","mask":2,"fixed":true},{"kind":"pipe","mask":12,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":5,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":3,"fixed":false},{"kind":"pipe","mask":10,"fixed":true},{"kind":"pipe","mask":9,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"pipe","mask":9,"fixed":false,"decoy":true},{"kind":"empty","mask":0,"fixed":false},{"kind":"empty","mask":0,"fixed":false},{"kind":"wall","mask":0,"fixed":true}],"solutionMoves":[{"from":16,"to":11},{"from":13,"to":8},{"from":5,"to":0},{"from":12,"to":13},{"from":6,"to":7},{"from":11,"to":16},{"from":21,"to":22},{"from":16,"to":21},{"from":0,"to":5},{"from":13,"to":12},{"from":21,"to":16},{"from":7,"to":6},{"from":12,"to":13},{"from":22,"to":21},{"from":6,"to":11}],"initialMoves":15,"displacement":5,"fixedPipes":1,"walls":1}]; // exact first five boards from shipped v0.8.0
const stageOf=n=>STAGES.find(s=>n>=s.first&&n<=s.last)||null;
function timerFor(n){const s=stageOf(n);if(!s)return null;const at=n-s.first;if(at<3)return null;
 // Challenge clock begins after the pre-trial prompt; Level 3 is calibrated to user testing.
 const base=[70,115,125,165,210,245][s.id-1];
 const finaleReduction=[18,20,22,25,30,35][s.id-1];
 return (at===4?base-finaleReduction:at===5?base+20:at===6?base+10:base)*1000;}
// A move budget applies only to timed numbered Levels, never Free Play or Daily.
 // It is calibrated from the catalogue's known legal solution route, with room
 // for exploration. The last legal move is allowed to solve the board.
function moveLimitFor(n,legacy=false){
 const stage=stageOf(n);
 if(!stage||timerFor(n)===null)return null;
 const baseline=get(n,undefined,legacy).solutionMoves.length;
 const multiplier=[2.0,1.85,1.7,1.6,1.5,1.45][stage.id-1];
 return Math.ceil(baseline*multiplier/5)*5;
}
// Rotate an already audited board and its entire solution route together.
// This changes orientation without changing scramble difficulty or validity.
function rotatedIndex(index,size,turns){
 let {x,y}=at(index,size);
 for(let j=0;j<turns;j++)[x,y]=[size-1-y,x];
 return id(x,y,size);
}
function rotatedMask(mask,turns){
 for(let j=0;j<turns;j++)mask=((mask<<1)&15)|((mask&8)>>3);
 return mask;
}
function rotatePuzzle(p,turns){
 if(!turns)return p;
 const size=p.size,rotate=board=>{
   const result=new Array(board.length);
   board.forEach((tile,index)=>result[rotatedIndex(index,size,turns)]={...tile,mask:rotatedMask(tile.mask,turns)});
   return result;
 };
 return {...p,board:rotate(p.board),solvedBoard:rotate(p.solvedBoard),
   solutionMoves:p.solutionMoves.map(m=>({from:rotatedIndex(m.from,size,turns),to:rotatedIndex(m.to,size,turns)}))};
}
const orientationForLevel=n=>[1,3,1,0,3,2][n%6];
const orientationForRandom=seed=>[0,1,3,1,3,2][(seed>>>12)%6];
const cache=new Map();
const FIXED_SEEDS=Object.freeze({1:3074878952,2:4088790921,3:3074894406,4:3074902133,5:4088814102,6:1434386060,7:1434393787,8:420497272,9:420504999,10:3074948495,11:3074956222,12:420528180,13:3074971676,14:420543634,15:3074987130,16:3074994857,17:420566815,18:4088914553,19:1434486511,20:3462302722,21:3075033492,22:3075041219,23:420613177,24:420620904,25:420628631,26:3075072127,27:3075079854,28:420651812,29:420659539,30:420667266}); // Audited 2026-11-18; freeze for this catalogue.
const EXTRA_SEEDS=Object.freeze({6:3074917587,7:4088829556,13:420535907,14:2835629075,20:4088930007,21:3075033492,27:1434548327,28:1434556054,34:1434602416,35:1434610143,41:4089092274,42:4089100001}); // Additional audited puzzle seeds.
function get(n,seedOverride,legacy=false){if(!Number.isInteger(n)||n<1||n>MAX_LEVEL)return null;
 const version=legacy===true?5:legacy===6?6:(n===27||n===28?7:6);
 const override=Number.isInteger(seedOverride),key=override?`trial:${n}:${seedOverride}:v${version}`:`v${version}:${n}`;
 if(!cache.has(key)){
   const s=stageOf(n),k=n-s.first,originalId=k<5?(s.id-1)*5+k+1:null;
   const seed=(override?seedOverride:(FIXED_SEEDS[originalId]??EXTRA_SEEDS[n]))>>>0;
   // A solved, leak-free network is constructed first, with dense pipe decoys
   // and unmistakable fixed metal plates, then scrambled by legal slides.
   // Previous completions are preserved; unfinished v0.9.2 boards are restarted.
   const mode=version>=7&&n===27?'weaveA':version>=7&&n===28?'weaveB':version>=6&&n===26?'corner':s.mode;
   const options={size:s.size,mode,seed,
     complexity:1+Math.floor(k/2),
     fixedCount:s.id===1?Math.floor(k/2):s.id===2?Math.min(7,2+k):Math.min(7,s.id-1+Math.floor(k/2)),
     walls:s.id===1?1+Math.floor(k/2):s.id===2?2+Math.floor(k/2):Math.min(7,2+Math.floor(k/2)+Math.floor((s.id-3)/2)),
     decoys:s.id===1?7+k:s.id===2?9+2*k:18+2*k+Math.max(0,s.id-3),
     blocks:s.id<=2?0:s.id===3?(k>=2?1+Math.floor((k-2)/2):0):2+(s.id-4)+Math.floor(k/2)};
   if(version>=6&&n===26){options.fixedCount=2;options.walls=2;options.decoys=8;options.blocks=1;}
   if(version>=7&&(n===27||n===28)){options.fixedCount=2;options.walls=2;options.decoys=6;options.blocks=3;}
   const solvedBoard=network(options);
   const raw=scramble(solvedBoard,seed^0x123acdca,20+s.id*6+k*7);
   const scrambled=version>=6&&n===26?stretchCorner(raw,8):
     version>=7&&n===27?stretchCorner(raw,id(1,1,s.size)):
     version>=7&&n===28?stretchCorner(raw,id(5,0,s.size)):raw;
   let candidate={level:n,stage:s.id,size:s.size,mode:'levels',networkType:options.mode,timerMs:timerFor(n),...scrambled,solvedBoard,initialMoves:scrambled.solutionMoves.length,
     fixedPipes:solvedBoard.filter(t=>t.kind==='pipe'&&t.fixed).length,walls:solvedBoard.filter(t=>t.kind==='wall').length,
     catalogVersion:version};
   if(version>=6&&n!==26&&(version<7||![27,28].includes(n)))
     candidate=rotatePuzzle(candidate,orientationForLevel(n));
   cache.set(key,candidate);
 }
 const p=cache.get(key);return {...p,board:clone(p.board),solvedBoard:clone(p.solvedBoard),solutionMoves:p.solutionMoves.map(m=>({...m}))};
}
// All players receive the same UTC-dated board. Keep this versioned seed
// independent of the numbered Level catalogue for server-side replay.
function hashSeed(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function hasShortWin(initial,maxDepth=4){
 const seen=new Set([signature(initial)]),countLimit=95000;
 let frontier=[initial],count=0;
 for(let depth=1;depth<=maxDepth;depth++){
   const next=[];
   for(const board of frontier){
     for(const m of legalMoves(board)){
       const b=clone(board);move(b,m.from,m.to);
       const key=signature(b);if(seen.has(key))continue;
       if(evaluate(b).solved)return true;
       seen.add(key);count++;
       if(count>=countLimit)return true; // conservative: avoid expensive ambiguous boards
       next.push(b);
     }
   }
   frontier=next;
 }
 return false;
}
const dailyCache=new Map();
function daily(day){
 if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day)||Number.isNaN(Date.parse(day+'T00:00:00Z')))throw Error('Invalid UTC day');
 if(dailyCache.has(day)){const cached=dailyCache.get(day);return {...cached,board:clone(cached.board),solvedBoard:clone(cached.solvedBoard),solutionMoves:cached.solutionMoves.map(m=>({...m}))};}
 const days=Math.floor(Date.parse(day+'T00:00:00Z')/86400000);
 const size=[5,6,7,6,7,5,7][(days%7+7)%7];
 const base=hashSeed(`gridclub-pipe-daily-v094:${day}:${size}`);
 let p=null;
 // Daily boards reject immediate two-, three- and four-slide wins.
 // The search checks the *actual* leak-free victory condition, not just how
 // many moves were used to scramble the authored solved board.
 for(let attempt=0;attempt<10;attempt++){
   const seed=(base+Math.imul(attempt,2654435761))>>>0;
   p=random(size,seed,true);
   if(!hasShortWin(p.board,4))break;
 }
 const result={...p,mode:'daily',day,dailyVersion:1,timerMs:null};dailyCache.set(day,result);
 return {...result,board:clone(result.board),solvedBoard:clone(result.solvedBoard),solutionMoves:result.solutionMoves.map(m=>({...m}))};
}
function random(size,seed,legacy=false){if(![5,6,7].includes(size))throw Error('Unknown Random difficulty');
 seed=Number.isFinite(seed)?seed>>>0:((Date.now()^Math.floor(Math.random()*0xffffffff))>>>0);
 const variety=seed%6,mode=size===7?'loop':'path';
 const options={size,mode,seed,complexity:1+variety%3,fixedCount:size===5?0:size===6?1+variety%3:2+variety%4,
   walls:size===5?0:size===6?variety%3:1+variety%3,
   decoys:size===5?variety%3:size===6?2+variety%4:13+2*variety,
   blocks:size===7?1+variety%4:0};
 const solvedBoard=network(options),scrambled=scramble(solvedBoard,seed^0x4f4b1133,14+size*6+variety*6);
 const candidate={mode:'random',size,seed,timerMs:null,level:null,stage:null,...scrambled,solvedBoard,initialMoves:scrambled.solutionMoves.length,networkType:mode,randomLayoutVersion:legacy?1:2};
 return legacy?candidate:rotatePuzzle(candidate,orientationForRandom(seed));
}
function validateBoard(b){const size=sizeOf(b);return !!size&&b.every(t=>t&&['empty','wall','block','pipe','source','sink'].includes(t.kind)&&Number.isInteger(t.mask)&&t.mask>=0&&t.mask<=15&&typeof t.fixed==='boolean'&&(t.kind==='pipe'||t.kind==='source'||t.kind==='sink'||t.mask===0))&&[1,2].includes(b.filter(t=>t.kind==='source').length)&&[1,2].includes(b.filter(t=>t.kind==='sink').length);}
return Object.freeze({SIZE,MAX_LEVEL,PUZZLES_PER_STAGE,N,E,S,W,DIRECTIONS,STAGES,sizeOf,at,id,adjacent,direction,clone,rng,get,random,daily,hashSeed,stageOf,timerFor,moveLimitFor,move,canMove,legalMoves,evaluate,validateBoard,signature});
});
