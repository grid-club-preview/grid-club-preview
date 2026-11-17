/* Grid Club · Pipe Shift v0.9.0 · Random Play & 30 sequential Levels */
(function(){
'use strict';
const e=globalThis.PipeEngine;if(!e)return;
const $=id=>document.getElementById(id),root=$('pipeShiftScreen'),hub=$('home');
if(!root||!hub||!$('pipeShiftEntry'))return;
const KEY='gridclub-pipeshift-progress-v1',BACKUP=KEY+'-v08-backup',MAX=e.MAX_LEVEL;
const blank=()=>({version:2,completed:{},best:{},active:{},randomBest:{},randomCount:{},legacyArchived:{}});
let progress=blank(),section='menu',stage=1,mode='levels',currentLevel=null,currentSize=5,puzzle=null;
let board=null,moves=0,elapsed=0,undo=[],selected=null,won=false,expired=false;
let timer=null,lastTick=null,flowTimer=null,pointerOrigin=null,ignoreClickUntil=0,nonce=0;
function read(){
 try{
   const raw=localStorage.getItem(KEY),v=JSON.parse(raw||'null');if(!v||!v.completed||!v.active)return blank();
   if(v.version===2)return {...blank(),...v};
   if(v.version===1){
     if(!localStorage.getItem(BACKUP))localStorage.setItem(BACKUP,raw);
     const next=blank();
     for(const n of [1,2,3,4,5]){
       if(v.completed[n])next.completed[n]=true;
       if(v.best?.[n])next.best[n]=v.best[n];
       if(v.active?.[n]&&e.validateBoard(v.active[n].board))next.active[`level:${n}`]={...v.active[n],elapsed:0};
     }
     for(let n=6;n<=10;n++)if(v.completed[n]||v.best?.[n]||v.active?.[n])next.legacyArchived[n]={completed:!!v.completed[n],best:v.best?.[n]||null};
     return next;
   }
 }catch(_){}
 return blank();
}
function save(){
 try{const value=JSON.stringify(progress);localStorage.setItem(KEY,value);if(localStorage.getItem(KEY)!==value)throw Error('Storage mismatch');$('pipeSaveNotice').hidden=true;}
 catch(_){$('pipeSaveNotice').hidden=false;}
}
function activeKey(){return mode==='random'?`random:${currentSize}`:`level:${currentLevel}`;}
function clockSync(){if(lastTick===null||won||expired)return;const now=performance.now();if(document.hidden){lastTick=null;return;}elapsed+=Math.max(0,now-lastTick);lastTick=now;}
function timerStop(){if(timer!==null){clearInterval(timer);timer=null;}lastTick=null;}
function startTicker(){timerStop();lastTick=performance.now();timer=setInterval(()=>{
   if(section!=='game'||won||expired||document.hidden)return;
   clockSync();updateClock();if(puzzle?.timerMs&&elapsed>=puzzle.timerMs)timeout();
 },100);}
function updateClock(){
 const limit=puzzle?.timerMs;$('pipeClockBox').hidden=!limit;
 if(!limit)return;
 const remaining=Math.max(0,Math.ceil((limit-elapsed)/1000)),mm=String(Math.floor(remaining/60)).padStart(2,'0'),ss=String(remaining%60).padStart(2,'0');
 $('pipeClock').textContent=`${mm}:${ss}`;$('pipeClockBox').dataset.low=String(remaining<=30);
}
function saveCurrent(){if(!puzzle||!board||won)return;
 clockSync();progress.active[activeKey()]={board:e.clone(board),moves,elapsed,expired,seed:puzzle.seed??null,
   undo:undo.slice(-40).map(a=>({board:e.clone(a.board),moves:a.moves}))};save();
}
function clearFlow(){if(flowTimer!==null){clearTimeout(flowTimer);flowTimer=null;}}
function route(name){
 clearFlow();timerStop();section=name;
 for(const n of ['menu','random','stages','levels','game'])$('pipe-'+n).hidden=n!==name;
 $('pipeResult').hidden=true;$('pipeTimeout').hidden=true;selected=null;pointerOrigin=null;
}
function home(){saveCurrent();route('menu');root.hidden=true;hub.hidden=false;}
function menu(){saveCurrent();hub.hidden=true;root.hidden=false;route('menu');
 $('pipeMainProgress').textContent=`${Object.keys(progress.completed).filter(n=>progress.completed[n]).length}/30`;
}
function randomMenu(){saveCurrent();hub.hidden=true;root.hidden=false;route('random');
 for(const btn of $('pipeRandomChoices').querySelectorAll('[data-pipe-size]')){
   const size=Number(btn.dataset.pipeSize),sub=btn.querySelector('small');
   if(sub&&size===7)sub.textContent=progress.active[`random:${size}`]?'Continue or play new':'Split and rejoin the flow';
 }
}
function stages(){saveCurrent();hub.hidden=true;root.hidden=false;route('stages');
 $('pipeCompletedCount').textContent=`${Object.keys(progress.completed).filter(n=>progress.completed[n]).length}/30`;
 const list=$('pipeStageList');list.replaceChildren();
 for(const s of e.STAGES){const count=Array.from({length:5},(_,i)=>s.first+i).filter(n=>progress.completed[n]).length;
   const enabled=s.id===1||!!progress.completed[s.first-1];const b=document.createElement('button');b.className='pipeStage';b.dataset.stage=s.id;
   b.disabled=!enabled;const number=document.createElement('span');number.className='pipeStageNum';number.textContent=s.id;
   const text=document.createElement('span');text.className='pipeStageContent';const strong=document.createElement('strong');strong.textContent=`Stage ${s.id} · ${s.name}`;
   const small=document.createElement('small');small.textContent=`${s.size}×${s.size} · ${count}/5 complete`;text.append(strong,small);
   const arrow=document.createElement('span');arrow.className='pipeChevron';arrow.textContent=!enabled?'🔒':count===5?'✓':'›';
   b.append(number,text,arrow);b.onclick=()=>stageMenu(s.id);list.append(b);
 }
}
function stageMenu(id){const s=e.STAGES.find(x=>x.id===id);if(!s||id>1&&!progress.completed[s.first-1])return;
 saveCurrent();stage=id;hub.hidden=true;root.hidden=false;route('levels');
 $('pipeStageTitle').textContent=`Stage ${id}`;$('pipeStageDescription').textContent=`${s.name} · ${s.size}×${s.size}`;
 $('pipeStageCount').textContent=`${Array.from({length:5},(_,i)=>s.first+i).filter(n=>progress.completed[n]).length}/5`;
 const list=$('pipeLevelList');list.replaceChildren();
 for(let n=s.first;n<=s.last;n++){
   const enabled=n===1||!!progress.completed[n-1],completed=!!progress.completed[n],active=!!progress.active[`level:${n}`];
   const b=document.createElement('button');b.className='pipeLevel';b.disabled=!enabled;b.dataset.complete=String(completed);
   const left=document.createElement('span'),label=document.createElement('strong'),detail=document.createElement('small');
   label.textContent=`Puzzle ${n-s.first+1}`;
   detail.textContent=completed?`Best: ${progress.best[n]?.moves??'—'} moves`:active?'Continue puzzle':e.timerFor(n)?'Time trial':'Untimed';
   left.append(label,detail);const mark=document.createElement('span');mark.className='pipeTag';mark.textContent=completed?'✓':enabled?'›':'🔒';
   b.append(left,mark);b.onclick=()=>startLevel(n);list.append(b);
 }
}
function freshRandomSeed(){
 nonce++;let seed=(Date.now()^Math.imul(nonce,0x9e3779b9))>>>0;
 try{if(globalThis.crypto?.getRandomValues){const data=new Uint32Array(1);crypto.getRandomValues(data);seed^=data[0];}}catch(_){}
 return seed>>>0;
}
function begin(p,kind,id,skipSave=false){
 if(!skipSave)saveCurrent();mode=kind;currentLevel=kind==='levels'?id:null;if(kind==='levels')stage=e.stageOf(id).id;currentSize=p.size;puzzle=p;
 won=false;expired=false;selected=null;elapsed=0;moves=0;undo=[];
 hub.hidden=true;root.hidden=false;route('game');
 const key=activeKey(),stored=progress.active[key];
 if(stored&&e.validateBoard(stored.board)&&stored.board.length===p.size*p.size&&
   (kind==='levels'||stored.seed===p.seed)&&Number.isInteger(stored.moves)&&stored.moves>=0&&stored.moves<100000){
   board=e.clone(stored.board);moves=stored.moves;elapsed=Math.max(0,Number(stored.elapsed)||0);expired=!!stored.expired;
   undo=Array.isArray(stored.undo)?stored.undo.filter(a=>e.validateBoard(a.board)&&a.board.length===board.length&&Number.isInteger(a.moves)).slice(-40):[];
 }else board=e.clone(p.board);
 $('pipeGameName').textContent=kind==='levels'?`Puzzle ${id-e.stageOf(id).first+1}/5`:(p.size===5?'Beginner':p.size===6?'Advanced':'Expert');
 $('pipeDifficultyTag').textContent=kind==='levels'?`Stage ${p.stage}`:'Random Play';
 $('pipeGridSize').textContent=`${p.size}×${p.size}`;$('pipeInstruction').textContent='';$('pipeNew').hidden=kind!=='random';
 $('pipeBoard').style.setProperty('--pipe-size',p.size);$('pipeBoard').dataset.pipeGridSize=String(p.size);
 render();updateClock();if(expired){$('pipeTimeout').hidden=false;}else if(p.timerMs&&elapsed>=p.timerMs)timeout();else startTicker();saveCurrent();
}
function startLevel(n){if(!Number.isInteger(n)||n<1||n>MAX||(n>1&&!progress.completed[n-1]))return;
 begin(e.get(n),'levels',n);
}
function startRandom(size,newPuzzle=false){if(![5,6,7].includes(size))return;
 const key=`random:${size}`,saved=progress.active[key],seed=!newPuzzle&&saved&&Number.isInteger(saved.seed)?saved.seed:freshRandomSeed();
 if(newPuzzle)delete progress.active[key];begin(e.random(size,seed),'random',null,newPuzzle);
}
function svgPath(mask){const arms=e.DIRECTIONS.filter(d=>mask&d.bit),end=d=>({1:[50,0],2:[100,50],4:[50,100],8:[0,50]})[d.bit];
 if(arms.length===2){const [a,b]=arms.map(end);if(mask===(e.N|e.S)||mask===(e.E|e.W))return `M${a[0]} ${a[1]} L${b[0]} ${b[1]}`;
 return `M${a[0]} ${a[1]} Q50 50 ${b[0]} ${b[1]}`;}
 return arms.map(d=>{const [x,y]=end(d);return `M50 50 L${x} ${y}`;}).join(' ');
}
function render(flow=[]){if(!board)return;
 const size=puzzle.size,container=$('pipeBoard');container.replaceChildren();
 const valid=selected===null?[]:board.map((_,i)=>e.canMove(board,selected,i)?i:-1).filter(i=>i>=0),flowMap=new Map(flow.map((n,i)=>[n,i]));
 let numberIn=0,numberOut=0;
 for(let i=0;i<board.length;i++){
   const t=board[i],b=document.createElement('button');b.type='button';b.dataset.cell=String(i);
   b.className='pipeTile '+(t.kind==='empty'?'pipeEmpty':t.kind==='wall'?'pipeWall':t.kind==='source'?'pipeSource':t.kind==='sink'?'pipeSink':'pipePiece')+
     (t.fixed?' pipeFixed':'')+(i===selected?' pipeSelected':'')+(valid.includes(i)?' pipeValidDrop':'')+(flowMap.has(i)?' pipeFlowing':'');
   b.setAttribute('aria-label',`Row ${Math.floor(i/size)+1}, column ${i%size+1}: ${t.kind==='empty'?'Empty space':t.kind==='wall'?'Obstacle':t.kind==='source'?'Inlet':t.kind==='sink'?'Outlet':t.fixed?'Fixed pipe':'Movable pipe'}`);
   if(flowMap.has(i))b.style.setProperty('--flow-delay',`${flowMap.get(i)*.065}s`);
   if(t.mask){const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('aria-hidden','true');
     for(const name of ['pipeTube','pipeChannel','pipeWater']){const path=document.createElementNS(ns,'path');path.setAttribute('d',svgPath(t.mask));path.setAttribute('class',name);svg.append(path);}b.append(svg);
   }
   if(t.fixed&&t.kind==='pipe'){const mark=document.createElement('span');mark.className='pipeFixedMark';mark.textContent='•';b.append(mark);}
   if(t.kind==='source'||t.kind==='sink'){const label=document.createElement('span');label.className='pipeTerminal';
     const nr=t.kind==='source'?++numberIn:++numberOut;label.textContent=t.kind==='source'?'IN'+(board.filter(x=>x.kind==='source').length>1?nr:''):'OUT'+(board.filter(x=>x.kind==='sink').length>1?nr:'');b.append(label);
   }
   container.append(b);
 }
 $('pipeMoves').textContent=String(moves);$('pipeUndo').disabled=won||expired||undo.length===0;$('pipeReset').disabled=won||expired||moves===0;
}
function slide(from,to){if(won||expired||!e.canMove(board,from,to))return false;
 clockSync();if(puzzle.timerMs&&elapsed>=puzzle.timerMs){timeout();return false;}
 undo.push({board:e.clone(board),moves});if(undo.length>40)undo.shift();e.move(board,from,to);moves++;selected=null;
 const check=e.evaluate(board);
 if(check.solved){won=true;timerStop();if(mode==='levels'){
     progress.completed[currentLevel]=true;if(!progress.best[currentLevel]||moves<progress.best[currentLevel].moves)progress.best[currentLevel]={moves,elapsed,when:new Date().toISOString()};
   }else{progress.randomCount[currentSize]=(progress.randomCount[currentSize]||0)+1;
     if(!progress.randomBest[currentSize]||moves<progress.randomBest[currentSize].moves)progress.randomBest[currentSize]={moves,elapsed};}
   delete progress.active[activeKey()];save();render(check.flow);flowTimer=setTimeout(()=>{flowTimer=null;if(won&&section==='game')victory();},950);
 }else{render();saveCurrent();}
 return true;
}
function clickCell(i){if(section!=='game'||won||expired||i<0||i>=board.length)return;
 if(selected!==null&&board[i].kind==='empty'&&slide(selected,i))return;
 const t=board[i];if(t.kind!=='pipe'||t.fixed){selected=null;render();return;}
 const options=board.map((_,k)=>e.canMove(board,i,k)?k:-1).filter(n=>n>=0);
 if(options.length===1){slide(i,options[0]);return;}
 selected=selected===i?null:i;render();
}
function undoMove(){if(won||expired||!undo.length)return;clockSync();const last=undo.pop();board=e.clone(last.board);moves=last.moves;selected=null;render();saveCurrent();}
function reset(){if(won||expired)return;clockSync();board=e.clone(puzzle.board);moves=0;undo=[];selected=null;render();saveCurrent();}
function timeout(){if(won||expired)return;clockSync();expired=true;timerStop();selected=null;updateClock();render();$('pipeTimeout').hidden=false;saveCurrent();}
function retry(){delete progress.active[activeKey()];const fresh=mode==='levels'?e.get(currentLevel):e.random(currentSize,puzzle.seed);begin(fresh,mode,currentLevel,true);}
function victory(){const names=['Flow restored!','Nicely connected.','Let it flow!','Pipes in perfect order.'];
 $('pipeResultTitle').textContent=names[(moves+(currentLevel||0))%names.length];
 if(mode==='random'){$('pipeResultMessage').textContent=`${moves} moves`;$('pipeResultNext').hidden=false;$('pipeResultNext').textContent='Next puzzle →';$('pipeResultLevels').textContent='Back to Random Play';}
 else{
   const s=e.stageOf(currentLevel),last=currentLevel===MAX;
   $('pipeResultMessage').textContent=`Stage ${s.id} · Puzzle ${currentLevel-s.first+1}/5 · ${moves} moves`;
   $('pipeResultNext').hidden=last;$('pipeResultNext').textContent=currentLevel===s.last?'Next stage →':'Continue stage →';$('pipeResultLevels').textContent='Levels overview';
 }
 $('pipeResult').hidden=false;
}
function back(){if(section==='game')mode==='random'?randomMenu():stageMenu(stage);
 else if(section==='levels')stages();else if(section==='random'||section==='stages')menu();else home();}
$('pipeShiftEntry').onclick=menu;$('pipeHomeBack').onclick=home;$('pipeRandomEntry').onclick=randomMenu;
$('pipeLevelsEntry').onclick=stages;$('pipeRandomBack').onclick=menu;$('pipeStagesBack').onclick=menu;
$('pipeLevelsBack').onclick=stages;$('pipeGameBack').onclick=back;
$('pipeRandomChoices').addEventListener('click',ev=>{const b=ev.target.closest('[data-pipe-size]');if(b)startRandom(Number(b.dataset.pipeSize));});
$('pipeResultNext').onclick=()=>mode==='random'?startRandom(currentSize,true):startLevel(currentLevel+1);
$('pipeResultLevels').onclick=()=>mode==='random'?randomMenu():stages();
$('pipeRetry').onclick=retry;$('pipeTimeoutBack').onclick=()=>mode==='random'?randomMenu():stageMenu(stage);
$('pipeUndo').onclick=undoMove;$('pipeReset').onclick=reset;$('pipeNew').onclick=()=>startRandom(currentSize,true);
const grid=$('pipeBoard');
grid.addEventListener('click',ev=>{if(performance.now()<ignoreClickUntil)return;const b=ev.target.closest('[data-cell]');if(b)clickCell(Number(b.dataset.cell));});
grid.addEventListener('pointerdown',ev=>{const b=ev.target.closest('[data-cell]');if(!b||section!=='game')return;
 pointerOrigin={id:ev.pointerId,x:ev.clientX,y:ev.clientY,from:Number(b.dataset.cell)};});
grid.addEventListener('pointerup',ev=>{if(!pointerOrigin||pointerOrigin.id!==ev.pointerId)return;
 const p=pointerOrigin;pointerOrigin=null;const dx=ev.clientX-p.x,dy=ev.clientY-p.y;if(Math.max(Math.abs(dx),Math.abs(dy))<17)return;
 ignoreClickUntil=performance.now()+300;const delta=Math.abs(dx)>Math.abs(dy)?(dx>0?1:-1):(dy>0?puzzle.size:-puzzle.size);const to=p.from+delta;
 if(e.adjacent(p.from,to,puzzle.size)&&!slide(p.from,to)){selected=p.from;render();}
});
grid.addEventListener('pointercancel',()=>{pointerOrigin=null;});grid.addEventListener('lostpointercapture',()=>{pointerOrigin=null;});
grid.addEventListener('contextmenu',ev=>ev.preventDefault());grid.addEventListener('selectstart',ev=>ev.preventDefault());
let edge=null;root.addEventListener('touchstart',ev=>{edge=null;if(ev.touches.length!==1||ev.touches[0].clientX>45||ev.target.closest('#pipeBoard,button'))return;
 const t=ev.touches[0];edge={id:t.identifier,x:t.clientX,y:t.clientY};},{passive:true});
root.addEventListener('touchend',ev=>{if(!edge)return;const p=Array.from(ev.changedTouches).find(t=>t.identifier===edge.id),start=edge;edge=null;if(p&&p.clientX-start.x>90&&Math.abs(p.clientY-start.y)<50)back();},{passive:true});
root.addEventListener('touchcancel',()=>edge=null,{passive:true});
window.addEventListener('pagehide',()=>{saveCurrent();timerStop();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){saveCurrent();timerStop();pointerOrigin=null;}else if(section==='game'&&!won&&!expired)startTicker();});
progress=read();save();
globalThis.PipeShiftApp={menu,randomMenu,stages,levels:stages,start:startLevel,startLevel,startRandom,back,readProgress:()=>JSON.parse(JSON.stringify(progress))};
})();
