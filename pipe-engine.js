/* Grid Club · Pipe Shift prototype engine · v0.8.0
 * Pure deterministic puzzle catalogue. CommonJS export for regression tests.
 * All ten puzzles begin as correct networks and are shuffled with legal slides.
 * Future branches and extra outlets can use the same port-mask flow validator.
 */
(function(root, factory) {
  const api = factory();
  if(typeof module !== 'undefined' && module.exports) module.exports = api;
  if(root) root.PipeEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const SIZE = 5;
  const N=1, E=2, S=4, W=8;
  const DIRECTIONS = [
    {bit:N, delta:-SIZE, dx:0,dy:-1, opposite:S},
    {bit:E, delta:1, dx:1,dy:0, opposite:W},
    {bit:S, delta:SIZE, dx:0,dy:1, opposite:N},
    {bit:W, delta:-1, dx:-1,dy:0, opposite:E}
  ];
  const id=(x,y)=>y*SIZE+x;
  const at=(n)=>({x:n%SIZE,y:Math.floor(n/SIZE)});
  const clone=(board)=>board.map(tile=>({...tile}));
  const validIndex=n=>Number.isInteger(n)&&n>=0&&n<SIZE*SIZE;
  const adjacent=(a,b)=>validIndex(a)&&validIndex(b)&&Math.abs(at(a).x-at(b).x)+Math.abs(at(a).y-at(b).y)===1;
  const direction=(a,b)=>DIRECTIONS.find(d=>at(b).x-at(a).x===d.dx&&at(b).y-at(a).y===d.dy);
  function rng(seed){let s=(seed>>>0)||1;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
  // Author-controlled solution paths, not randomly generated levels. Each path
  // starts at the left inlet and reaches a right-side outlet.
  const DESIGNS = [
    {path:[[0,2],[1,2],[2,2],[3,2],[4,2]],fixed:[],walls:[],decoys:0,mix:2},
    {path:[[0,2],[1,2],[1,1],[2,1],[3,1],[3,2],[4,2]],fixed:[],walls:[],decoys:1,mix:5},
    {path:[[0,1],[1,1],[1,2],[2,2],[3,2],[3,1],[4,1]],fixed:[],walls:[[3,4]],decoys:2,mix:8},
    {path:[[0,3],[1,3],[1,2],[2,2],[2,1],[3,1],[3,2],[4,2]],fixed:[],walls:[[4,4]],decoys:2,mix:11},
    {path:[[0,2],[1,2],[1,3],[2,3],[3,3],[3,2],[3,1],[4,1]],fixed:[3],walls:[[4,4]],decoys:3,mix:15},
    {path:[[0,1],[1,1],[1,2],[1,3],[2,3],[3,3],[3,2],[4,2]],fixed:[3],walls:[[2,0],[4,4]],decoys:3,mix:18},
    {path:[[0,3],[1,3],[2,3],[2,2],[1,2],[1,1],[2,1],[3,1],[3,2],[4,2]],fixed:[4],walls:[[0,0],[4,4]],decoys:4,mix:22},
    {path:[[0,2],[1,2],[1,3],[2,3],[2,4],[3,4],[3,3],[3,2],[4,2]],fixed:[4],walls:[[0,0],[4,0]],decoys:4,mix:26},
    {path:[[0,1],[1,1],[1,2],[2,2],[2,3],[3,3],[3,2],[3,1],[4,1]],fixed:[3,6],walls:[[0,4],[4,4]],decoys:5,mix:31},
    {path:[[0,3],[1,3],[1,2],[1,1],[2,1],[2,2],[3,2],[3,3],[4,3]],fixed:[3,6],walls:[[0,0],[4,0],[4,4]],decoys:5,mix:37}
  ];
  const DECORATIVE_PIPES=[N|S,E|W,N|E,E|S,S|W,W|N];
  function network(design,seed){
    const board=Array.from({length:25},()=>({kind:'empty',mask:0,fixed:false}));
    const p=design.path.map(([x,y])=>id(x,y));
    if(new Set(p).size!==p.length)throw Error('Duplicate path cell');
    if(at(p[0]).x!==0||at(p[p.length-1]).x!==4)throw Error('Terminals must be at side edges');
    for(const [x,y] of design.walls){
      const k=id(x,y);if(p.includes(k))throw Error('Wall overlaps network');
      board[k]={kind:'wall',mask:0,fixed:true};
    }
    p.forEach((k,i)=>{
      const prev=i>0?direction(k,p[i-1]):null;
      const next=i<p.length-1?direction(k,p[i+1]):null;
      if((i>0&&!prev)||(i<p.length-1&&!next))throw Error('Invalid orthogonal route');
      const mask=(prev?.bit||0)|(next?.bit||0);
      board[k]={kind:i===0?'source':i===p.length-1?'sink':'pipe',mask,
        fixed:i===0||i===p.length-1||design.fixed.includes(i)};
    });
    const random=rng(seed);
    const candidates=board.map((t,i)=>t.kind==='empty'?i:-1).filter(i=>i>=0);
    for(let i=candidates.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
    for(const cell of candidates.slice(0,design.decoys)){
      board[cell]={kind:'pipe',mask:DECORATIVE_PIPES[Math.floor(random()*DECORATIVE_PIPES.length)],fixed:false,decoy:true};
    }
    const evaluation=evaluate(board);
    if(!evaluation.solved)throw Error('Invalid authored network: '+JSON.stringify(evaluation));
    return board;
  }
  function legalMoves(board){
    const moves=[];
    for(let from=0;from<board.length;from++){
      if(board[from].kind!=='pipe'||board[from].fixed)continue;
      for(const d of DIRECTIONS){
        const x=at(from).x+d.dx,y=at(from).y+d.dy;
        if(x<0||y<0||x>=SIZE||y>=SIZE)continue;
        const to=id(x,y);
        if(board[to].kind==='empty')moves.push({from,to});
      }
    }
    return moves;
  }
  function canMove(board,from,to){
    return Array.isArray(board)&&board.length===25&&adjacent(from,to)&&board[from]?.kind==='pipe'&&
      board[from].fixed!==true&&board[to]?.kind==='empty';
  }
  function move(board,from,to){
    if(!canMove(board,from,to))return false;
    [board[from],board[to]]=[board[to],board[from]];
    return true;
  }
  function evaluate(board){
    if(!Array.isArray(board)||board.length!==25)return {solved:false,leaks:0,reachedOutlet:false,flow:[]};
    const source=board.findIndex(t=>t.kind==='source');
    const sinks=board.reduce((xs,t,i)=>(t.kind==='sink'&&xs.push(i),xs),[]);
    if(source<0||!sinks.length)return {solved:false,leaks:0,reachedOutlet:false,flow:[]};
    const seen=new Set(),queue=[source];let leaks=0;
    while(queue.length){
      const here=queue.shift();
      if(seen.has(here))continue;
      seen.add(here);
      const tile=board[here];
      for(const d of DIRECTIONS){
        if(!(tile.mask&d.bit))continue;
        const x=at(here).x+d.dx,y=at(here).y+d.dy;
        if(x<0||x>=SIZE||y<0||y>=SIZE){leaks++;continue;}
        const neighbour=id(x,y),other=board[neighbour];
        if(!other||!(other.mask&d.opposite)||other.kind==='wall'||other.kind==='empty'){
          leaks++;continue;
        }
        if(!seen.has(neighbour))queue.push(neighbour);
      }
    }
    const reachedOutlet=sinks.every(n=>seen.has(n));
    return {solved:reachedOutlet&&leaks===0,leaks,reachedOutlet,flow:[...seen],connections:seen.size};
  }
  function signature(board){return board.map(t=>`${t.kind[0]}${t.mask}${t.fixed?'f':''}`).join('|');}
  function scramble(solved,level,steps){
    let best=null,bestScore=-1;
    for(let attempt=0;attempt<40;attempt++){
      const rand=rng(0x51f15e+level*8191+attempt*173);
      const b=clone(solved),history=[];
      let prior=null;
      for(let step=0;step<steps;step++){
        const options=legalMoves(b);
        const filtered=options.filter(m=>!prior||!(m.from===prior.to&&m.to===prior.from));
        const candidates=filtered.length?filtered:options;
        if(!candidates.length)break;
        // Prefer displacing pieces that belong to the intended network.
        const weighted=candidates.flatMap(m=>b[m.from].decoy?[m]:[m,m]);
        const chosen=weighted[Math.floor(rand()*weighted.length)];
        move(b,chosen.from,chosen.to);history.push(chosen);prior=chosen;
      }
      const score=b.reduce((n,t,i)=>n+(t.kind!==solved[i].kind||t.mask!==solved[i].mask?1:0),0);
      if(!evaluate(b).solved&&score>bestScore){bestScore=score;best={board:b,moves:history};}
      if(bestScore>=Math.min(10,2+Math.floor(level/2)))break;
    }
    if(!best)throw Error('Could not scramble level '+level);
    return {start:best.board,solutionMoves:best.moves.slice().reverse().map(m=>({from:m.to,to:m.from})),
      displacement:bestScore};
  }
  const cache=new Map();
  function get(level){
    if(!Number.isInteger(level)||level<1||level>DESIGNS.length)return null;
    if(!cache.has(level)){
      const def=DESIGNS[level-1];
      const solved=network(def,0xaada4500+level*3079);
      const {start,solutionMoves,displacement}=scramble(solved,level,def.mix);
      cache.set(level,{level,size:SIZE,board:start,solvedBoard:solved,solutionMoves,
        initialMoves:solutionMoves.length,displacement,
        fixedPipes:solved.filter(t=>t.kind==='pipe'&&t.fixed).length,
        walls:solved.filter(t=>t.kind==='wall').length});
    }
    const p=cache.get(level);
    return {...p,board:clone(p.board),solvedBoard:clone(p.solvedBoard),solutionMoves:p.solutionMoves.map(m=>({...m}))};
  }
  function validateBoard(board){
    return Array.isArray(board)&&board.length===25&&board.every(tile=>
      tile&&['empty','wall','pipe','source','sink'].includes(tile.kind)&&
      Number.isInteger(tile.mask)&&tile.mask>=0&&tile.mask<=15&&
      typeof tile.fixed==='boolean')&&board.filter(t=>t.kind==='source').length===1&&
      board.filter(t=>t.kind==='sink').length===1;
  }
  return Object.freeze({SIZE,N,E,S,W,DIRECTIONS,DESIGNS,at,id,adjacent,direction,clone,
    get,move,canMove,legalMoves,evaluate,validateBoard,signature});
});
