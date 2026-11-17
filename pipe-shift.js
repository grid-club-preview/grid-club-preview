/* Grid Club · Pipe Shift v0.8.0 · separate, local-only playable prototype */
(function(){
  'use strict';
  const engine=globalThis.PipeEngine;
  if(!engine)return;
  const $=id=>document.getElementById(id);
  const root=$('pipeShiftScreen'),hub=$('home');
  if(!root||!hub||!$('pipeShiftEntry'))return;
  const KEY='gridclub-pipeshift-progress-v1', MAX_LEVEL=10;
  let currentLevel=null,board=null,moves=0,selected=null,undo=[],section='menu',won=false;
  let flowTimer=null,pointerOrigin=null,ignoreClickUntil=0;
  let progress={version:1,completed:{},best:{},active:{}};
  const blank=(i)=>board[i]?.kind==='empty';
  function read(){
    try{
      const value=JSON.parse(localStorage.getItem(KEY)||'null');
      if(value&&value.version===1&&value.completed&&value.best&&value.active&&
         !Array.isArray(value.completed)&&!Array.isArray(value.active))return value;
    }catch(_){}
    return {version:1,completed:{},best:{},active:{}};
  }
  function save(){
    try{
      localStorage.setItem(KEY,JSON.stringify(progress));
      if(localStorage.getItem(KEY)!==JSON.stringify(progress))throw Error('Storage failed');
      $('pipeSaveNotice').hidden=true;
    }catch(_){$('pipeSaveNotice').hidden=false;}
  }
  function saveCurrent(){
    if(!currentLevel||!board||won)return;
    progress.active[String(currentLevel)]={board:engine.clone(board),moves,undo:undo.slice(-50).map(x=>({board:engine.clone(x.board),moves:x.moves}))};
    save();
  }
  function clearFlowTimer(){if(flowTimer!==null){clearTimeout(flowTimer);flowTimer=null;}}
  function route(name){
    clearFlowTimer();section=name;
    for(const sectionName of ['menu','levels','game']) $('pipe-'+sectionName).hidden=sectionName!==name;
    $('pipeResult').hidden=true;
    selected=null;pointerOrigin=null;
  }
  function home(){
    saveCurrent();clearFlowTimer();route('menu');root.hidden=true;hub.hidden=false;
  }
  function menu(){
    saveCurrent();hub.hidden=true;root.hidden=false;route('menu');
    const count=Object.keys(progress.completed).filter(n=>progress.completed[n]).length;
    $('pipeMainProgress').textContent=`${count}/10 complete`;
  }
  function levels(){
    saveCurrent();hub.hidden=true;root.hidden=false;route('levels');
    const list=$('pipeLevelList');list.replaceChildren();
    const count=Object.keys(progress.completed).filter(n=>progress.completed[n]).length;
    $('pipeCompletedCount').textContent=`${count}/10`;
    for(let i=1;i<=MAX_LEVEL;i++){
      const unlocked=i===1||!!progress.completed[i-1];
      const complete=!!progress.completed[i];
      const active=!!progress.active[i];
      const b=document.createElement('button');b.className='pipeLevel';b.disabled=!unlocked;
      b.dataset.complete=String(complete);
      b.setAttribute('aria-label',`Puzzle ${i}${!unlocked?' locked':complete?' completed':''}`);
      const left=document.createElement('span');
      const title=document.createElement('strong');title.textContent=`Puzzle ${i}`;
      const sub=document.createElement('small');
      sub.textContent=complete?`Best: ${progress.best[i]?.moves??'—'} moves`:active?'Continue puzzle':
        (i>=5?'Fixed pipes & obstacles':'Slide the pipes');
      left.append(title,sub);
      const right=document.createElement('span');right.className='pipeTag';
      right.textContent=complete?'✓':unlocked?'›':'🔒';
      b.append(left,right);b.onclick=()=>start(i);list.append(b);
    }
  }
  function start(id){
    if(!Number.isInteger(id)||id<1||id>MAX_LEVEL||(id>1&&!progress.completed[id-1]))return;
    saveCurrent();clearFlowTimer();hub.hidden=true;root.hidden=false;route('game');
    currentLevel=id;won=false;selected=null;undo=[];
    const puzzle=engine.get(id);
    const saved=progress.active[id];
    if(saved&&engine.validateBoard(saved.board)&&Number.isInteger(saved.moves)&&saved.moves>=0&&saved.moves<100000){
      board=engine.clone(saved.board);moves=saved.moves;
      undo=Array.isArray(saved.undo)?saved.undo.filter(x=>engine.validateBoard(x.board)&&Number.isInteger(x.moves)).slice(-50):[];
    }else{board=engine.clone(puzzle.board);moves=0;}
    $('pipeGameName').textContent=`Puzzle ${id}`;
    $('pipeDifficultyTag').textContent=iDifficulty(id);
    $('pipeInstruction').textContent='Slide pipes into empty spaces.';
    render();
    saveCurrent();
  }
  function iDifficulty(n){return n<=3?'Getting started':n<=6?'Finding a route':'A little trickier';}
  function isLegalTarget(from,to){return engine.canMove(board,from,to);}
  function targets(i){return board?.map((t,k)=>isLegalTarget(i,k)?k:-1).filter(k=>k>=0)||[];}
  function svgPath(mask){
    const arms=engine.DIRECTIONS.filter(d=>mask&d.bit);
    const edge=d=>({1:[50,0],2:[100,50],4:[50,100],8:[0,50]})[d.bit];
    if(arms.length===2){
      const [a,b]=arms.map(edge);
      if((mask===(engine.N|engine.S))||(mask===(engine.E|engine.W))){return `M${a[0]} ${a[1]} L${b[0]} ${b[1]}`;}
      // Curves are oriented exactly as their tile mask; no rotating tiles.
      return `M${a[0]} ${a[1]} Q50 50 ${b[0]} ${b[1]}`;
    }
    return arms.map(d=>{const [x,y]=edge(d);return `M50 50 L${x} ${y}`;}).join(' ');
  }
  function description(t){
    if(t.kind==='empty')return 'Empty space';
    if(t.kind==='wall')return 'Fixed obstacle';
    if(t.kind==='source')return 'Water inlet';
    if(t.kind==='sink')return 'Water outlet';
    return `${t.fixed?'Fixed':'Movable'} pipe`;
  }
  function render(flow=[]){
    const container=$('pipeBoard');container.replaceChildren();
    const valid=selected===null?[]:targets(selected);
    const flowing=new Map(flow.map((n,i)=>[n,i]));
    for(let i=0;i<25;i++){
      const t=board[i];
      const b=document.createElement('button');b.type='button';b.dataset.cell=String(i);
      b.className='pipeTile '+(t.kind==='empty'?'pipeEmpty':t.kind==='wall'?'pipeWall':
        t.kind==='source'?'pipeSource':t.kind==='sink'?'pipeSink':'pipePiece')+
        (t.fixed?' pipeFixed':'')+(i===selected?' pipeSelected':'')+
        (valid.includes(i)?' pipeValidDrop':'')+
        (flowing.has(i)?' pipeFlowing':'');
      b.setAttribute('aria-label',`Row ${Math.floor(i/5)+1}, column ${i%5+1}: ${description(t)}`);
      if(i===selected)b.setAttribute('aria-pressed','true');
      if(flowing.has(i))b.style.setProperty('--flow-delay',`${flowing.get(i)*.085}s`);
      if(t.mask){
        const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
        svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('aria-hidden','true');
        const d=svgPath(t.mask);
        for(const name of ['pipeTube','pipeChannel','pipeWater']){
          const path=document.createElementNS(ns,'path');path.setAttribute('d',d);path.setAttribute('class',name);svg.append(path);
        }
        b.append(svg);
      }
      if(t.fixed&&t.kind==='pipe'){
        const mark=document.createElement('span');mark.className='pipeFixedMark';mark.textContent='•';b.append(mark);
      }
      if(t.kind==='source'||t.kind==='sink'){
        const label=document.createElement('span');label.className='pipeTerminal';label.textContent=t.kind==='source'?'IN':'OUT';b.append(label);
      }
      container.append(b);
    }
    $('pipeMoves').textContent=String(moves);
    $('pipeUndo').disabled=won||undo.length===0;
    $('pipeReset').disabled=won||moves===0;
  }
  function slide(from,to){
    if(won||!isLegalTarget(from,to))return false;
    undo.push({board:engine.clone(board),moves});
    if(undo.length>50)undo.shift();
    engine.move(board,from,to);moves++;selected=null;
    const result=engine.evaluate(board);
    if(result.solved){won=true;progress.completed[currentLevel]=true;
      if(!progress.best[currentLevel]||moves<progress.best[currentLevel].moves)
        progress.best[currentLevel]={moves,when:new Date().toISOString()};
      delete progress.active[currentLevel];save();
      render(result.flow);
      $('pipeInstruction').textContent='Flow connected!';
      flowTimer=setTimeout(()=>{flowTimer=null;if(section==='game'&&won)showVictory();},980);
    }else{render();saveCurrent();}
    return true;
  }
  function clickCell(cell){
    if(section!=='game'||won)return;
    if(selected!==null&&blank(cell)&&slide(selected,cell))return;
    const t=board[cell];
    if(t.kind!=='pipe'||t.fixed){selected=null;render();return;}
    const spaces=targets(cell);
    if(spaces.length===1){slide(cell,spaces[0]);return;}
    selected=selected===cell?null:cell;
    render();
    $('pipeInstruction').textContent=selected===null?'Slide pipes into empty spaces.':'Tap a highlighted space, or drag the selected pipe.';
  }
  function undoMove(){
    if(won||!undo.length)return;
    const prior=undo.pop();board=engine.clone(prior.board);moves=prior.moves;selected=null;
    render();saveCurrent();
  }
  function reset(){
    if(won||!currentLevel)return;
    const p=engine.get(currentLevel);board=engine.clone(p.board);moves=0;undo=[];selected=null;
    $('pipeInstruction').textContent='Slide pipes into empty spaces.';
    render();saveCurrent();
  }
  function showVictory(){
    $('pipeResultTitle').textContent=['Flow restored!','Pipes in perfect order.','Let it flow!','Nicely connected.'][currentLevel%4];
    $('pipeResultMessage').textContent=`Puzzle ${currentLevel} · ${moves} moves`;
    $('pipeResultNext').hidden=currentLevel>=MAX_LEVEL;
    $('pipeResultNext').textContent=`${currentLevel<MAX_LEVEL?'Next puzzle →':'All done'}`;
    $('pipeResult').hidden=false;
  }
  function back(){
    if(section==='game')levels();
    else if(section==='levels')menu();
    else home();
  }
  $('pipeShiftEntry').onclick=menu;
  $('pipeHomeBack').onclick=home;
  $('pipeLevelsEntry').onclick=levels;
  $('pipeLevelsBack').onclick=menu;
  $('pipeGameBack').onclick=levels;
  $('pipeResultNext').onclick=()=>{if(currentLevel<MAX_LEVEL)start(currentLevel+1);};
  $('pipeResultLevels').onclick=levels;
  $('pipeUndo').onclick=undoMove;
  $('pipeReset').onclick=reset;
  const grid=$('pipeBoard');
  grid.addEventListener('click',e=>{
    if(performance.now()<ignoreClickUntil)return;
    const b=e.target.closest('[data-cell]');if(!b)return;
    clickCell(Number(b.dataset.cell));
  });
  grid.addEventListener('pointerdown',e=>{
    const b=e.target.closest('[data-cell]');if(!b||section!=='game')return;
    pointerOrigin={id:e.pointerId,x:e.clientX,y:e.clientY,from:Number(b.dataset.cell)};
  });
  grid.addEventListener('pointerup',e=>{
    if(!pointerOrigin||pointerOrigin.id!==e.pointerId)return;
    const p=pointerOrigin;pointerOrigin=null;
    const dx=e.clientX-p.x,dy=e.clientY-p.y;
    if(Math.max(Math.abs(dx),Math.abs(dy))<17)return;
    ignoreClickUntil=performance.now()+300;
    const delta=Math.abs(dx)>Math.abs(dy)?(dx>0?1:-1):(dy>0?5:-5);
    const to=p.from+delta;
    if(engine.adjacent(p.from,to)){
      if(!slide(p.from,to)){
        selected=p.from;render();
      }
    }
  });
  grid.addEventListener('pointercancel',()=>{pointerOrigin=null;});
  grid.addEventListener('lostpointercapture',()=>{pointerOrigin=null;});
  grid.addEventListener('contextmenu',e=>e.preventDefault());
  grid.addEventListener('selectstart',e=>e.preventDefault());
  // Edge swipe mirrors Back, except when the gesture starts on a pipe tile.
  let edge=null;
  root.addEventListener('touchstart',e=>{
    edge=null;if(e.touches.length!==1||e.touches[0].clientX>45)return;
    if(e.target.closest('#pipeBoard,button'))return;
    const t=e.touches[0];edge={id:t.identifier,x:t.clientX,y:t.clientY};
  },{passive:true});
  root.addEventListener('touchend',e=>{
    if(!edge)return;
    const p=Array.from(e.changedTouches).find(t=>t.identifier===edge.id);const start=edge;edge=null;
    if(p&&p.clientX-start.x>90&&Math.abs(p.clientY-start.y)<50)back();
  },{passive:true});
  root.addEventListener('touchcancel',()=>{edge=null;},{passive:true});
  window.addEventListener('pagehide',saveCurrent);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)saveCurrent();});
  progress=read();
  // Namespace remains separate from Dot Trails, with no shared-credit spend.
  globalThis.PipeShiftApp={menu,levels,start,back,readProgress:()=>JSON.parse(JSON.stringify(progress))};
})();
