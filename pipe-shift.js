/* Grid Club · Pipe Shift v0.9.5 · Levels, Free Play & verified Daily Challenge */
(function(){
'use strict';
const e=globalThis.PipeEngine;if(!e)return;
const $=id=>document.getElementById(id),root=$('pipeShiftScreen'),hub=$('home');
if(!root||!hub||!$('pipeShiftEntry'))return;
const KEY='gridclub-pipeshift-progress-v1',BACKUP=KEY+'-v08-backup',MAX=e.MAX_LEVEL;
const blank=()=>({version:2,levelCatalog:5,completed:{},best:{},active:{},randomBest:{},randomCount:{},legacyArchived:{},legacyUnlockedStages:{},firstAttemptFailed:{},daily:{},moveStats:{random:{},levels:{count:0,total:0},daily:{count:0,total:0}}});
const oldToNew=id=>{const n=Number(id);return Number.isInteger(n)&&n>=1&&n<=30?Math.floor((n-1)/5)*7+(n-1)%5+1:null;};
function remapLevels(items){const mapped={};for(const [id,value] of Object.entries(items||{})){const next=oldToNew(id);if(next!==null)mapped[next]=value;}return mapped;}
let progress=blank(),section='menu',stage=1,mode='levels',currentLevel=null,currentSize=5,puzzle=null;
let board=null,moves=0,elapsed=0,undo=[],selected=null,won=false,expired=false,justClearedStage=false,trialPending=false;
let timer=null,lastTick=null,flowTimer=null,pointerOrigin=null,ignoreClickUntil=0,nonce=0;
let dailyDay='',dailyTrace=[],dailyPractice=false,dailyConnection='',dailySync=null,dailyLoading=null;
let moveLimit=null,legacyMoveCapExempt=false,failureReason='time';
let extraTimeMs=0,extraTimeCount=0,attemptId='',creditReward=null;
const credits=globalThis.GridClubCredits;
const timeBudget=()=>puzzle?.timerMs?puzzle.timerMs+extraTimeMs:null;
const creditBalance=()=>credits?.balance()||0;
const makeAttempt=()=>`pipe:${Date.now()}:${Math.random().toString(36).slice(2,12)}`;
function bestMoves(){return mode==='random'?progress.randomBest[currentSize]?.moves:mode==='levels'?progress.best[currentLevel]?.moves:null;}
function refreshMoveInfo(){
 const best=bestMoves(),show=mode==='random'||mode==='levels';
 $('pipeBestBox').hidden=!show;
 $('pipeBestMoves').textContent=Number.isInteger(best)?`${best} moves`:'—';
}
function read(){
 try{
   const raw=localStorage.getItem(KEY),v=JSON.parse(raw||'null');if(!v||!v.completed||!v.active)return blank();
   if(v.version===2){
     const next={...blank(),...v,moveStats:{...blank().moveStats,...(v.moveStats||{})}};
     if(v.levelCatalog===4){
       const oldCompleted=next.completed||{},unlocked={...(next.legacyUnlockedStages||{})};
       for(let id=2;id<=e.STAGES.length;id++)if(oldCompleted[(id-1)*5])unlocked[id]=true;
       next.completed=remapLevels(oldCompleted);next.best=remapLevels(next.best);
       const active={};
       for(const [key,value] of Object.entries(next.active||{})){
         const match=/^level:(\d+)$/.exec(key);
         if(!match){active[key]=value;continue;}
         const mapped=oldToNew(match[1]);if(mapped!==null)active[`level:${mapped}`]={...value,catalogVersion:5};
       }
       next.active=active;next.legacyUnlockedStages=unlocked;next.levelCatalog=5;
     }else if(v.levelCatalog!==5){
       next.olderLevelBests={...(next.olderLevelBests||{}),v093:next.best||{}};
       next.best={};
       for(const key of Object.keys(next.active||{}))if(key.startsWith('level:'))delete next.active[key];
       next.levelCatalog=5;
     }
     return next;
   }
   if(v.version===1){
     if(!localStorage.getItem(BACKUP))localStorage.setItem(BACKUP,raw);
     const next=blank();
     for(const n of [1,2,3,4,5]){
       if(v.completed[n])next.completed[n]=true;
       if(v.best?.[n])next.best[n]=v.best[n];
       if(v.active?.[n]&&e.validateBoard(v.active[n].board))next.active[`level:${n}`]={...v.active[n],elapsed:0};
     }
     for(let n=6;n<=10;n++)if(v.completed[n]||v.best?.[n]||v.active?.[n])next.legacyArchived[n]={completed:!!v.completed[n],best:v.best?.[n]||null};
     next.olderLevelBests={v08:{...(next.best||{})}};
     next.best={};next.active={};next.levelCatalog=5;
     return next;
   }
 }catch(_){}
 return blank();
}
function save(){
 try{const value=JSON.stringify(progress);localStorage.setItem(KEY,value);if(localStorage.getItem(KEY)!==value)throw Error('Storage mismatch');$('pipeSaveNotice').hidden=true;}
 catch(_){$('pipeSaveNotice').hidden=false;}
}
function activeKey(){return mode==='random'?`random:${currentSize}`:mode==='daily'?`daily:${dailyDay}`:mode==='practice'?`practice:${dailyDay}`:`level:${currentLevel}`;}
function clockSync(){if(lastTick===null||won||expired)return;const now=performance.now();if(document.hidden){lastTick=null;return;}elapsed+=Math.max(0,now-lastTick);lastTick=now;}
function timerStop(){if(timer!==null){clearInterval(timer);timer=null;}lastTick=null;}
function startTicker(){if(trialPending)return;timerStop();lastTick=performance.now();timer=setInterval(()=>{
   if(section!=='game'||won||expired||document.hidden)return;
   clockSync();updateClock();if(timeBudget()&&elapsed>=timeBudget())timeout();
 },100);}
function updateClock(){
 const limit=timeBudget();$('pipeClockBox').hidden=!limit;
 if(!limit)return;
 const remaining=Math.max(0,Math.ceil((limit-elapsed)/1000)),mm=String(Math.floor(remaining/60)).padStart(2,'0'),ss=String(remaining%60).padStart(2,'0');
 $('pipeClock').textContent=`${mm}:${ss}`;
 $('pipeClockBox').dataset.low=String(remaining<=30);
 // Start the red alert below 15 seconds on timed Levels only.
 $('pipeClockBox').dataset.critical=String(remaining>0&&remaining<15&&!won&&!expired);
}
function refreshCreditControls(){
 const timed=mode==='levels'&&!!puzzle?.timerMs&&!won;
 const available=timed&&!trialPending&&!expired&&extraTimeCount<2;
 const balance=creditBalance();
 $('pipeWallet').hidden=mode!=='levels';
 $('pipeWallet').textContent=mode==='levels'?`◉ ${balance} Club Credits`:'';
 const button=$('pipeExtraTime');
 button.hidden=!timed||expired;
 button.disabled=!available||balance<10;
 button.textContent=`+15 seconds · 10 ◉ (${Math.max(0,2-extraTimeCount)} left)`;
 const note=$('pipeBoostNote');
 note.textContent=timed&&!expired&&extraTimeCount<2&&balance<10?'Not enough credits for +15 seconds':'';
 const seconds=(2-extraTimeCount)*15;
 const cost=extraTimeCount===0?30:20;
 $('pipeRescue').hidden=!(timed&&expired&&failureReason==='time'&&seconds>0);
 $('pipeRescue').disabled=balance<cost;
 $('pipeRescue').textContent=`Continue +${seconds} seconds · ${cost} ◉`;
 $('pipeRescueNote').textContent=timed&&expired&&failureReason==='time'?
   (seconds===0?'All 30 extra seconds have been used.':
    balance<cost?`Not enough Club Credits (${balance}/${cost}). Retry is free.`:
    `Balance: ${balance} ◉ · Resume the same attempt`):'';
}
function buyPipeTime(){
 if(mode!=='levels'||!puzzle?.timerMs||won||trialPending||extraTimeCount>=2)return false;
 if(expired&&failureReason!=='time')return false;
 const rescue=expired,seconds=rescue?(2-extraTimeCount)*15:15;
 const cost=rescue?(extraTimeCount===0?30:20):10;
 if(!credits?.spend(cost,rescue?'extra-time-rescue':'extra-time',attemptId)){
   refreshCreditControls();return false;
 }
 extraTimeMs+=seconds*1000;
 extraTimeCount=rescue?2:extraTimeCount+1;
 if(rescue){
   expired=false;$('pipeTimeout').hidden=true;startTicker();
 }
 updateClock();render();saveCurrent();return true;
}
function saveCurrent(){if(!puzzle||!board||won)return;
 clockSync();progress.active[activeKey()]={board:e.clone(board),moves,elapsed,expired,started:!trialPending,catalogVersion:mode==='levels'?5:mode==='daily'||mode==='practice'?puzzle.dailyVersion:null,seed:puzzle.seed??null,
   trace:mode==='daily'?dailyTrace.map(x=>({...x})):null,
   extraTimeMs,extraTimeCount,attemptId,
   moveCapVersion:mode==='levels'?1:null,moveCapExempt:mode==='levels'&&legacyMoveCapExempt,failureReason,
   undo:undo.slice(-40).map(a=>({board:e.clone(a.board),moves:a.moves}))};save();
}
function clearFlow(){if(flowTimer!==null){clearTimeout(flowTimer);flowTimer=null;}}
function route(name){
 clearFlow();timerStop();section=name;
 for(const n of ['menu','random','stages','levels','game','stats','daily'])$('pipe-'+n).hidden=n!==name;
 $('pipeResult').hidden=true;$('pipeTimeout').hidden=true;$('pipeTimeIntro').hidden=true;selected=null;cancelDrag();
}
function home(){cancelDrag();saveCurrent();route('menu');root.hidden=true;hub.hidden=false;}
function menu(){saveCurrent();hub.hidden=true;root.hidden=false;route('menu');
 $('pipeMenuWallet').textContent=`◉ ${creditBalance()} Club Credits`;
 $('pipeMainProgress').textContent=`${Object.keys(progress.completed).filter(n=>progress.completed[n]).length}/${MAX}`;
}
function statsMenu(){
 saveCurrent();hub.hidden=true;root.hidden=false;route('stats');
 const completed=Object.keys(progress.completed).filter(n=>progress.completed[n]).length;
 const random=[5,6,7].reduce((n,size)=>n+(progress.randomCount[size]||0),0);
 const s=progress.moveStats||{},records=[s.levels,s.daily,...Object.values(s.random||{})].filter(Boolean);
 const sum=records.reduce((a,v)=>a+(Number(v.total)||0),0);
 const count=records.reduce((a,v)=>a+(Number(v.count)||0),0);
 $('pipeStatsCompleted').textContent=String(completed+random);
 $('pipeStatsAverage').textContent=count?(sum/count).toFixed(1):'—';
 const list=$('pipeStatsDetails');list.replaceChildren();
 for(const [label,size] of [['Beginner',5],['Advanced',6],['Expert',7],['Levels',0],['Daily Challenge',-1]]){
   const record=size===-1?s.daily:size?(s.random||{})[size]:s.levels;
   const played=size===-1?Object.keys(progress.daily||{}).filter(d=>progress.daily[d]?.completed).length:size?(progress.randomCount[size]||0):completed;
   const row=document.createElement('div');row.className='pipeStatRow';
   const title=document.createElement('strong');title.textContent=label;
   const detail=document.createElement('span');detail.textContent=`${played} completed · ${record?.count?(record.total/record.count).toFixed(1)+' avg. moves':'— avg. moves'}`;
   row.append(title,detail);list.append(row);
 }
}
function recordCompletion(kind,size,usedMoves){
 const stats=progress.moveStats||(progress.moveStats={random:{},levels:{count:0,total:0}});
 const bucket=kind==='random'?(stats.random[size]||(stats.random[size]={count:0,total:0})):kind==='daily'?(stats.daily||(stats.daily={count:0,total:0})):(stats.levels||(stats.levels={count:0,total:0}));
 bucket.count++;bucket.total+=usedMoves;
}
function randomMenu(){saveCurrent();hub.hidden=true;root.hidden=false;route('random');
 for(const btn of $('pipeRandomChoices').querySelectorAll('[data-pipe-size]')){
   const size=Number(btn.dataset.pipeSize);
   const text=btn.querySelector('.pipeChoiceCopy')||btn.querySelector('span:not(.pipeButtonIcon):not(.pipeChevron)');
   let sub=text?.querySelector('small');
   if(text&&!sub){sub=document.createElement('small');text.append(sub);}
   const best=progress.randomBest[size]?.moves;
   sub.textContent=(Number.isInteger(best)?`Personal best: ${best} moves`:'No completed puzzles yet')+
     (progress.active[`random:${size}`]?' · Continue available':'');
 }
}
function stageUnlocked(id){if(id===1)return true;const previous=e.STAGES[id-2];return !!progress.completed[previous.last]||!!progress.legacyUnlockedStages?.[id];}
function canStartLevel(n){const group=e.stageOf(n);return !!group&&(n===1||!!progress.completed[n-1]||(n===group.first&&stageUnlocked(group.id)));}
function stages(){saveCurrent();hub.hidden=true;root.hidden=false;route('stages');
 $('pipeCompletedCount').textContent=`${Object.keys(progress.completed).filter(n=>progress.completed[n]).length}/${MAX}`;
 const list=$('pipeStageList');list.replaceChildren();
 for(const s of e.STAGES){const count=Array.from({length:e.PUZZLES_PER_STAGE},(_,i)=>s.first+i).filter(n=>progress.completed[n]).length;
   const enabled=stageUnlocked(s.id);const b=document.createElement('button');b.className='pipeStage';b.dataset.stage=s.id;
   b.disabled=!enabled;const number=document.createElement('span');number.className='pipeStageNum';number.textContent=s.id;
   const text=document.createElement('span');text.className='pipeStageContent';const strong=document.createElement('strong');strong.textContent=`Level ${s.id} · ${s.name}`;
   const small=document.createElement('small');small.textContent=`${s.size}×${s.size} · ${count}/${e.PUZZLES_PER_STAGE} complete`;text.append(strong,small);
   const arrow=document.createElement('span');arrow.className='pipeChevron';arrow.textContent=!enabled?'🔒':count===e.PUZZLES_PER_STAGE?'✓':'›';
   b.append(number,text,arrow);b.onclick=()=>stageMenu(s.id);list.append(b);
 }
}
function stageMenu(id){const s=e.STAGES.find(x=>x.id===id);if(!s||!stageUnlocked(id))return;
 saveCurrent();stage=id;hub.hidden=true;root.hidden=false;route('levels');
 $('pipeStageTitle').textContent=`Level ${id}`;$('pipeStageDescription').textContent=`${s.name} · ${s.size}×${s.size}`;
 $('pipeStageCount').textContent=`${Array.from({length:e.PUZZLES_PER_STAGE},(_,i)=>s.first+i).filter(n=>progress.completed[n]).length}/${e.PUZZLES_PER_STAGE}`;
 const list=$('pipeLevelList');list.replaceChildren();
 for(let n=s.first;n<=s.last;n++){
   const enabled=canStartLevel(n),completed=!!progress.completed[n],active=!!progress.active[`level:${n}`];
   const b=document.createElement('button');b.className='pipeLevel';b.disabled=!enabled;b.dataset.complete=String(completed);
   const left=document.createElement('span'),label=document.createElement('strong'),detail=document.createElement('small');
   label.textContent=`Puzzle ${n-s.first+1}`;
   detail.textContent=completed?`Best: ${progress.best[n]?.moves??'—'} moves`:active?'Continue puzzle':e.timerFor(n)?'Time & move trial':'Untimed';
   left.append(label,detail);const mark=document.createElement('span');mark.className='pipeTag';mark.textContent=completed?'✓':enabled?'›':'🔒';
   b.append(left,mark);b.onclick=()=>startLevel(n);list.append(b);
 }
}
const utcToday=()=>new Date().toISOString().slice(0,10);
const rankedReady=()=>!!globalThis.GridRanked?.configured&&navigator.onLine;
function dailyMenu(){
 saveCurrent();hub.hidden=true;root.hidden=false;route('daily');
 const day=utcToday(),p=e.daily(day),record=progress.daily?.[day];
 $('pipeDailyDay').textContent=day;
 $('pipeDailyDifficulty').textContent=`${p.size===5?'Beginner':p.size===6?'Advanced':'Expert'} · ${p.size}×${p.size}`;
 $('pipeDailyPlay').textContent=record?.completed?'Practice today’s puzzle':progress.active[`daily:${day}`]?'Continue today’s puzzle':'Play today’s puzzle';
 $('pipeDailyNote').textContent=record?.completed?`Your first result: ${record.moves} moves${record.verified?' · verified':record.sync==='review'?' · under review':' · saved locally'}`:'One ranked result per day. Fewest moves wins. No timer.';
 $('pipeDailyRank').textContent='';
 const list=$('pipeDailyEntries');list.replaceChildren();
 if(!rankedReady()){list.textContent='Leaderboard unavailable offline or until the backend update is installed.';return;}
 void refreshDailyLeaderboard();
 if(record?.completed&&record.sync==='pending')void submitDaily();
}
function startDaily(){
 const day=utcToday(),practice=!!progress.daily?.[day]?.completed;
 const p=e.daily(day);
 if(practice)delete progress.active[`practice:${day}`];
 begin(p,practice?'practice':'daily',null,practice);
}
async function syncDailyStart(){
 if(mode!=='daily'||!rankedReady())return null;
 if(dailyLoading)return dailyLoading;
 const day=dailyDay;
 dailyLoading=(async()=>{
  try{
   const r=await GridRanked.call('pipe_start',{day});
   if(day!==utcToday())return null;
   if(r.state==='completed'){
     dailyConnection='Today’s ranked puzzle is already completed. Additional plays are practice only.';
     dailyPractice=true;
     if(!progress.daily[day]){progress.daily[day]={completed:true,moves:r.moves,sync:'verified',verified:!!r.verified,day};save();}
   }else dailyConnection='Ranked attempt ready';
   return r;
  }catch(err){dailyConnection='Leaderboard connection unavailable: '+err.message;return null;}
 })().finally(()=>{dailyLoading=null;});
 return dailyLoading;
}
async function submitDaily(){
 const day=utcToday(),record=progress.daily?.[day];
 if(!record?.completed||record.sync!=='pending'||!rankedReady())return;
 if(dailySync)return dailySync;
 dailySync=(async()=>{
  try{
   const start=await GridRanked.call('pipe_start',{day});
   if(start.state==='completed'){
     record.sync=start.verified?'verified':'review';record.verified=!!start.verified;
     record.moves=start.moves;save();return;
   }
   const reply=await GridRanked.call('pipe_submit',{day,attemptId:start.attemptId,events:record.events});
   if(utcToday()!==day)return;
   record.sync=reply.verified?'verified':'review';record.verified=!!reply.verified;
   record.serverMoves=reply.moves;save();
   if(mode==='daily'&&won){$('pipeResultMessage').textContent=`${reply.moves} moves · ${reply.verified?'Verified result':'Result under review'}`;}
  }catch(err){dailyConnection=err.message;console.warn('Pipe Shift daily submission pending:',err);}
 })().finally(()=>{dailySync=null;});
 return dailySync;
}
async function refreshDailyLeaderboard(){
 const list=$('pipeDailyEntries'),rank=$('pipeDailyRank');
 if(!rankedReady()){list.textContent='Leaderboard unavailable offline or until the backend is updated.';return;}
 list.textContent='Loading verified results…';
 const day=utcToday();
 try{
  const data=await GridRanked.call('pipe_leaderboard',{day});
  if(section!=='daily'||utcToday()!==day)return;
  list.replaceChildren();
  rank.textContent=data.yourRank?`Your rank: ${data.yourRank} · ${data.yourMoves} moves`:`${data.total||0} verified finishes today`;
  if(!data.entries?.length){list.textContent='No verified finishes yet. Your run could be the first.';return;}
  for(const entry of data.entries){
   const row=document.createElement('div');row.className='pipeDailyRow';
   if(entry.isYou)row.classList.add('pipeDailyYou');
   const left=document.createElement('span'),right=document.createElement('strong');
   left.textContent=`${entry.rank}. ${entry.isYou?'You':entry.name}`;right.textContent=`${entry.moves} moves`;
   row.append(left,right);list.append(row);
  }
 }catch(err){list.textContent='Leaderboard unavailable: '+err.message;}
}
function freshRandomSeed(){
 nonce++;let seed=(Date.now()^Math.imul(nonce,0x9e3779b9))>>>0;
 try{if(globalThis.crypto?.getRandomValues){const data=new Uint32Array(1);crypto.getRandomValues(data);seed^=data[0];}}catch(_){}
 return seed>>>0;
}
function begin(p,kind,id,skipSave=false){
 if(!skipSave)saveCurrent();mode=kind;currentLevel=kind==='levels'?id:null;if(kind==='levels')stage=e.stageOf(id).id;dailyDay=(kind==='daily'||kind==='practice')?p.day:'';dailyPractice=kind==='practice';dailyTrace=[];currentSize=p.size;puzzle=p;
 won=false;expired=false;justClearedStage=false;selected=null;elapsed=0;moves=0;undo=[];trialPending=!!p.timerMs;
 extraTimeMs=0;extraTimeCount=0;attemptId=makeAttempt();creditReward=null;
 failureReason='time';legacyMoveCapExempt=false;
 moveLimit=kind==='levels'?e.moveLimitFor(id):null;
 hub.hidden=true;root.hidden=false;route('game');
 const key=activeKey(),stored=progress.active[key];
 if(stored&&e.validateBoard(stored.board)&&stored.board.length===p.size*p.size&&
   (kind==='levels'?stored.catalogVersion===5:(kind==='daily'||kind==='practice')?stored.seed===p.seed&&stored.catalogVersion===p.dailyVersion:stored.seed===p.seed)&&Number.isInteger(stored.moves)&&stored.moves>=0&&stored.moves<100000){
   board=e.clone(stored.board);moves=stored.moves;elapsed=Math.max(0,Number(stored.elapsed)||0);expired=!!stored.expired;
   extraTimeMs=Math.max(0,Math.min(30000,Number(stored.extraTimeMs)||0));
   extraTimeCount=Math.max(0,Math.min(2,Number(stored.extraTimeCount)||0));
   attemptId=typeof stored.attemptId==='string'&&stored.attemptId?stored.attemptId:attemptId;
   if(kind==='levels'&&moveLimit!==null){
     legacyMoveCapExempt=stored.moveCapVersion!==1||!!stored.moveCapExempt;
     if(legacyMoveCapExempt)moveLimit=null;
   }
   failureReason=stored.failureReason==='moves'?'moves':'time';
   trialPending=!!p.timerMs&&!expired&&!stored.started&&moves===0&&elapsed===0;
   undo=Array.isArray(stored.undo)?stored.undo.filter(a=>e.validateBoard(a.board)&&a.board.length===board.length&&Number.isInteger(a.moves)).slice(-40):[];
   if(kind==='daily')dailyTrace=Array.isArray(stored.trace)?stored.trace.slice(0,5000):[];
 }else board=e.clone(p.board);
 $('pipeGameName').textContent=kind==='levels'?`Puzzle ${id-e.stageOf(id).first+1}/${e.PUZZLES_PER_STAGE}`:kind==='daily'||kind==='practice'?'Daily Challenge':(p.size===5?'Beginner':p.size===6?'Advanced':'Expert');
 $('pipeDifficultyTag').textContent=kind==='levels'?`Level ${p.stage}`:kind==='daily'||kind==='practice'?dailyPractice?'Practice':p.day:'Free Play';
 $('pipeGridSize').textContent=`${p.size}×${p.size}`;$('pipeInstruction').textContent='';$('pipeNew').hidden=kind!=='random';
 $('pipeBoard').style.setProperty('--pipe-size',p.size);$('pipeBoard').dataset.pipeGridSize=String(p.size);
 $('pipeTrialDescription').textContent=moveLimit!==null?`Finish within ${moveLimit} moves and ${Math.ceil(p.timerMs/1000)} seconds.`:'Beat the clock to restore the flow.';
 render();updateClock();if(kind==='daily')void syncDailyStart();
 if(expired){showFailure();$('pipeTimeout').hidden=false;}
 else if(moveLimit!==null&&moves>=moveLimit)timeout('moves');
 else if(timeBudget()&&elapsed>=timeBudget())timeout('time');
 else if(trialPending){$('pipeTimeIntro').hidden=false;}
 else startTicker();
 saveCurrent();
}
function startLevel(n){if(!Number.isInteger(n)||n<1||n>MAX||!canStartLevel(n))return;
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
   b.className='pipeTile '+(t.kind==='empty'?'pipeEmpty':t.kind==='wall'?'pipeWall':t.kind==='block'?'pipeBlankBlock':t.kind==='source'?'pipeSource':t.kind==='sink'?'pipeSink':'pipePiece')+
     (t.fixed?' pipeFixed':'')+(i===selected?' pipeSelected':'')+(valid.includes(i)?' pipeValidDrop':'')+(flowMap.has(i)?' pipeFlowing':'');
   b.setAttribute('aria-label',`Row ${Math.floor(i/size)+1}, column ${i%size+1}: ${t.kind==='empty'?'Empty space':t.kind==='wall'?'Fixed obstacle':t.kind==='block'?'Movable blank block':t.kind==='source'?'Inlet':t.kind==='sink'?'Outlet':t.fixed?'Fixed pipe':'Movable pipe'}`);
   if(flowMap.has(i))b.style.setProperty('--flow-delay',`${flowMap.get(i)*.065}s`);
   if(t.mask){const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('aria-hidden','true');
     for(const name of ['pipeTube','pipeChannel','pipeWater']){const path=document.createElementNS(ns,'path');path.setAttribute('d',svgPath(t.mask));path.setAttribute('class',name);svg.append(path);}b.append(svg);
   }
   if(t.kind==='block'){const grip=document.createElement('span');grip.className='pipeBlockGrip';grip.textContent='•••';b.append(grip);}
   if(t.fixed&&t.kind==='pipe'){const mark=document.createElement('span');mark.className='pipeFixedMark';mark.textContent='•';b.append(mark);}
   if(t.kind==='source'||t.kind==='sink'){const label=document.createElement('span');label.className='pipeTerminal';
     const nr=t.kind==='source'?++numberIn:++numberOut;label.textContent=t.kind==='source'?'IN'+(board.filter(x=>x.kind==='source').length>1?nr:''):'OUT'+(board.filter(x=>x.kind==='sink').length>1?nr:'');b.append(label);
   }
   container.append(b);
 }
 $('pipeMoves').textContent=moveLimit!==null?`${moves}/${moveLimit}`:String(moves);
 refreshMoveInfo();refreshCreditControls();
 $('pipeUndo').disabled=won||expired||undo.length===0;$('pipeReset').disabled=won||expired||moves===0;
}
function slide(from,to){if(won||expired||trialPending||!e.canMove(board,from,to))return false;
 clockSync();if(timeBudget()&&elapsed>=timeBudget()){timeout();return false;}
 undo.push({board:e.clone(board),moves});if(undo.length>40)undo.shift();e.move(board,from,to);moves++;selected=null;
 if(mode==='daily')dailyTrace.push({action:'slide',from,to});
 const check=e.evaluate(board);
 if(check.solved){
   won=true;timerStop();
   creditReward={puzzle:0,stage:0,daily:0,saveFailed:false};
   if(mode!=='practice'&&!dailyPractice)recordCompletion(mode,currentSize,moves);
   if(mode==='levels'){
     const first=!progress.completed[currentLevel],group=e.stageOf(currentLevel);
     progress.completed[currentLevel]=true;
     if(!progress.best[currentLevel]||moves<progress.best[currentLevel].moves)
       progress.best[currentLevel]={moves,elapsed,when:new Date().toISOString()};
     if(first&&!progress.firstAttemptFailed?.[currentLevel]){
       const award=credits?.award('club:pipe:level:'+currentLevel,2,'pipe-level');
       creditReward.puzzle=award?.awarded||0;
       creditReward.saveFailed ||= !!award?.saveFailed;
     }
     justClearedStage=first&&currentLevel===group.last&&
       Array.from({length:e.PUZZLES_PER_STAGE},(_,i)=>group.first+i).every(id=>!!progress.completed[id]);
     if(justClearedStage){
       const award=credits?.award('club:pipe:stage:'+group.id,5,'pipe-stage');
       creditReward.stage=award?.awarded||0;
       creditReward.saveFailed ||= !!award?.saveFailed;
     }
   }else if(mode==='random'){
     progress.randomCount[currentSize]=(progress.randomCount[currentSize]||0)+1;
     if(!progress.randomBest[currentSize]||moves<progress.randomBest[currentSize].moves)
       progress.randomBest[currentSize]={moves,elapsed};
   }else if(mode==='daily'&&!dailyPractice){
     progress.daily[dailyDay]={completed:true,moves,events:dailyTrace.map(x=>({...x})),sync:'pending',verified:false,day:dailyDay};
     const award=credits?.award('club:pipe:daily:'+dailyDay,10,'pipe-daily');
     creditReward.daily=award?.awarded||0;
     creditReward.saveFailed ||= !!award?.saveFailed;
   }
   delete progress.active[activeKey()];save();
   if(mode==='daily'&&!dailyPractice)void submitDaily();
   render(check.flow);
   flowTimer=setTimeout(()=>{flowTimer=null;if(won&&section==='game')victory();},950);
 }else if(moveLimit!==null&&moves>=moveLimit){timeout('moves');}
 else{render();saveCurrent();}
 return true;
}
function clickCell(i){if(section!=='game'||won||expired||trialPending||i<0||i>=board.length)return;
 if(selected!==null&&board[i].kind==='empty'&&slide(selected,i))return;
 const t=board[i];if(!['pipe','block'].includes(t.kind)||t.fixed){selected=null;render();return;}
 const options=board.map((_,k)=>e.canMove(board,i,k)?k:-1).filter(n=>n>=0);
 if(options.length===1){slide(i,options[0]);return;}
 selected=selected===i?null:i;render();
}
function undoMove(){if(won||expired||trialPending||!undo.length)return;clockSync();const last=undo.pop();board=e.clone(last.board);if(mode==='daily')dailyTrace.push({action:'undo'});selected=null;render();saveCurrent();}
function reset(){if(won||expired||trialPending)return;clockSync();board=e.clone(puzzle.board);if(mode==='daily')dailyTrace.push({action:'reset'});undo=[];selected=null;render();saveCurrent();}
function showFailure(){
 const byMoves=failureReason==='moves';
 $('pipeTimeoutTitle').textContent=byMoves?'Move limit reached!':"Time's up!";
 $('pipeTimeoutMessage').textContent=byMoves?'The flow needs fewer moves. Try a different route.':
   'Continue for credits or retry for free. Retrying forfeits first-attempt credits.';
 refreshCreditControls();
}
function timeout(reason='time'){
 if(won||expired)return;
 clockSync();failureReason=reason;expired=true;timerStop();selected=null;
 updateClock();render();showFailure();$('pipeTimeout').hidden=false;saveCurrent();
}
function retry(){
 if(mode==='levels'&&!progress.completed[currentLevel]){
   progress.firstAttemptFailed ||= {};
   progress.firstAttemptFailed[currentLevel]=true;save();
 }
 delete progress.active[activeKey()];
 const fresh=mode==='levels'?e.get(currentLevel):e.random(currentSize,puzzle.seed);
 begin(fresh,mode,currentLevel,true);
}
function victory(){const phrases=globalThis.GridClubWinMessages?.pipeShift||{};const names=phrases.general?.length?phrases.general:['Flow restored!','Nicely connected.','Let it flow!','Pipes in perfect order.'];
 const celebration=$('pipeStageCelebration'),result=$('pipeResult');
 result.classList.remove('pipeStageWin','pipeGrandFinale');
 celebration.hidden=true;
 const earned=(creditReward?.puzzle||0)+(creditReward?.stage||0)+(creditReward?.daily||0);
 $('pipeCreditReward').hidden=!earned&&!creditReward?.saveFailed;
 $('pipeCreditReward').textContent=creditReward?.saveFailed?
   'Some credit rewards could not be saved.':
   `+${earned} Club Credits${creditReward?.stage?` (includes +${creditReward.stage} level bonus)`:''} · Balance: ${creditBalance()} ◉`;
 $('pipeResultTitle').textContent=names[(moves+(currentLevel||0))%names.length];
 if(mode==='random'){$('pipeResultMessage').textContent=`${moves} moves`;$('pipeResultNext').hidden=false;$('pipeResultNext').textContent='Next puzzle →';$('pipeResultLevels').textContent='Back to Free Play';}
 else if(mode==='daily'||mode==='practice'){$('pipeResultMessage').textContent=`${moves} moves · ${dailyDay}${dailyPractice?' · practice':''}`;$('pipeResultNext').hidden=true;$('pipeResultLevels').textContent='Daily leaderboard';}
 else{
   const s=e.stageOf(currentLevel),last=currentLevel===MAX;
   $('pipeResultMessage').textContent=`Level ${s.id} · Puzzle ${currentLevel-s.first+1}/${e.PUZZLES_PER_STAGE} · ${moves} moves`;
   $('pipeResultNext').hidden=last;$('pipeResultNext').textContent=currentLevel===s.last?'Next Level →':'Continue Level →';$('pipeResultLevels').textContent='Levels overview';
   if(justClearedStage){
     const badges=['◉','◆','✦','⌁','✺','♛'];
     result.classList.add('pipeStageWin');if(last)result.classList.add('pipeGrandFinale');
     celebration.dataset.stage=String(s.id);
     $('pipeStageBadge').textContent=badges[s.id-1]||'✦';
     $('pipeStageHeading').textContent=last?(phrases.grandHeading||'Pipe Shift mastered!'):(phrases.stageHeading||'Level {stage} complete!').replace('Stage','Level').replace('{stage}',String(s.id));
     $('pipeResultTitle').textContent=last?(phrases.grandVictory||'Every pipe connected!'):(phrases.stageVictory||'Flow upgraded!');
     $('pipeResultNext').textContent=last?'All Levels complete':'Level up →';
     celebration.hidden=false;
   }
 }
 const todayCompleted=(mode==='daily'||mode==='practice')&&dailyDay===utcToday()&&!!progress.daily[dailyDay]?.completed;
 const journey=globalThis.GridClubDailyJourney;
 const nextDaily=todayCompleted?journey?.nextGame('pipeShift'):null;
 $('pipeDailyRemainingWin').hidden=!todayCompleted;
 $('pipeDailyRemainingWin').textContent=todayCompleted?journey?.remainingLabel()||'':'';
 $('pipeDailyNextWin').hidden=!nextDaily;
 $('pipeDailyTomorrowWin').hidden=!todayCompleted||!!nextDaily;
 result.hidden=false;
}
function back(){if(section==='game'){if(mode==='daily'||mode==='practice')dailyMenu();else mode==='random'?randomMenu():stageMenu(stage);}
 else if(section==='levels')stages();else if(['random','stages','stats','daily'].includes(section))menu();else home();}
$('pipeShiftEntry').onclick=menu;$('pipeHomeBack').onclick=home;$('pipeRandomEntry').onclick=randomMenu;
$('pipeLevelsEntry').onclick=stages;$('pipeDailyEntry').onclick=dailyMenu;$('pipeStatsEntry').onclick=statsMenu;$('pipeStatsBack').onclick=menu;$('pipeRandomBack').onclick=menu;$('pipeStagesBack').onclick=menu;
$('pipeLevelsBack').onclick=stages;$('pipeGameBack').onclick=back;$('pipeDailyBack').onclick=menu;
$('pipeDailyPlay').onclick=()=>startDaily();$('pipeDailyRefresh').onclick=()=>void refreshDailyLeaderboard();
$('pipeDailyNextWin').onclick=()=>globalThis.GridClubDailyJourney?.visitNext('pipeShift');
$('pipeRandomChoices').addEventListener('click',ev=>{const b=ev.target.closest('[data-pipe-size]');if(b)startRandom(Number(b.dataset.pipeSize));});
$('pipeResultNext').onclick=()=>mode==='random'?startRandom(currentSize,true):startLevel(currentLevel+1);
$('pipeResultLevels').onclick=()=>mode==='random'?randomMenu():mode==='daily'||mode==='practice'?dailyMenu():stages();
$('pipeTrialStart').onclick=()=>{if(!trialPending||section!=='game')return;trialPending=false;$('pipeTimeIntro').hidden=true;startTicker();saveCurrent();};
$('pipeRetry').onclick=retry;
$('pipeRescue').onclick=buyPipeTime;
$('pipeExtraTime').onclick=buyPipeTime;
$('pipeTimeoutBack').onclick=()=>mode==='random'?randomMenu():stageMenu(stage);
$('pipeUndo').onclick=undoMove;$('pipeReset').onclick=reset;$('pipeNew').onclick=()=>startRandom(currentSize,true);
const grid=$('pipeBoard');
grid.addEventListener('click',ev=>{if(performance.now()<ignoreClickUntil)return;const b=ev.target.closest('[data-cell]');if(b)clickCell(Number(b.dataset.cell));});
// Press and drag a pipe (or solid blank block) onto an adjacent empty space.
// Native pointer capture ensures the drag keeps working when a finger leaves
// the source tile. Tap-to-select and tap-to-move remain available for access.
function cancelDrag(){
 if(pointerOrigin?.ghost)pointerOrigin.ghost.remove();
 grid?.querySelectorAll('.pipeDragSource,.pipeDragTarget').forEach(t=>t.classList.remove('pipeDragSource','pipeDragTarget'));
 pointerOrigin=null;
}
// Cache the two/four legal adjacent destinations on touch-down rather than
// repeatedly measuring every square during each pointermove. A drop is also
// accepted near a square's centre so the user needn't hit a tiny target.
function dropTarget(p,x,y){
 let target=null,dist=Infinity;
 for(const cell of p.validCells){
   const dx=x-cell.x,dy=y-cell.y,delta=Math.hypot(dx,dy);
   if(delta<dist){dist=delta;target=cell;}
 }
 if(!target||dist>Math.max(18,target.width*.78))return null;
 return target.index;
}
function setDragVisual(p,ev){
 if(!p.ghost){
  const source=grid.querySelector(`[data-cell="${p.from}"]`);
  if(!source)return;
  source.classList.add('pipeDragSource');
  const ghost=source.cloneNode(true),r=source.getBoundingClientRect();
  ghost.removeAttribute('data-cell');ghost.classList.remove('pipeSelected','pipeValidDrop','pipeDragSource');
  ghost.classList.add('pipeDragGhost');ghost.setAttribute('aria-hidden','true');
  ghost.style.width=`${r.width}px`;ghost.style.height=`${r.height}px`;
  // Fixed-position composited transform avoids full-grid layouts and clipping.
  document.body.append(ghost);p.ghost=ghost;
 }
 p.ghost.style.transform=`translate3d(${ev.clientX}px, ${ev.clientY}px, 0) translate(-50%, -50%) scale(1.045)`;
 const target=dropTarget(p,ev.clientX,ev.clientY),valid=target!==null;
 if(p.lastTarget!==target){
  grid.querySelector('.pipeDragTarget')?.classList.remove('pipeDragTarget');
  if(valid)grid.querySelector(`[data-cell="${target}"]`)?.classList.add('pipeDragTarget');
 }
 p.lastTarget=target;
 p.ghost.classList.toggle('pipeDragInvalid',!valid);
}
grid.addEventListener('pointerdown',ev=>{
 const cell=ev.target.closest('[data-cell]');
 if(!cell||section!=='game'||won||expired||trialPending||ev.isPrimary===false)return;
 const from=Number(cell.dataset.cell),tile=board?.[from];
 if(!tile||tile.fixed||!['pipe','block'].includes(tile.kind))return;
 cancelDrag();
 const validCells=[];
 for(const move of e.legalMoves(board))if(move.from===from){
  const dest=grid.querySelector(`[data-cell="${move.to}"]`),r=dest?.getBoundingClientRect();
  if(r)validCells.push({index:move.to,x:r.left+r.width/2,y:r.top+r.height/2,width:r.width});
 }
 pointerOrigin={id:ev.pointerId,x:ev.clientX,y:ev.clientY,from,active:false,ghost:null,lastTarget:null,validCells};
 try{grid.setPointerCapture(ev.pointerId);}catch(_){}
});
grid.addEventListener('pointermove',ev=>{
 const p=pointerOrigin;if(!p||p.id!==ev.pointerId||section!=='game')return;
 if(!p.active&&Math.hypot(ev.clientX-p.x,ev.clientY-p.y)>=7)p.active=true;
 if(!p.active)return;
 if(ev.cancelable)ev.preventDefault();
 setDragVisual(p,ev);
});
grid.addEventListener('pointerup',ev=>{
 const p=pointerOrigin;if(!p||p.id!==ev.pointerId)return;
 if(p.active){
  ignoreClickUntil=performance.now()+250;
  const target=dropTarget(p,ev.clientX,ev.clientY);
  const valid=target!==null&&e.canMove(board,p.from,target);
  cancelDrag();
  if(valid)slide(p.from,target);
  if(ev.cancelable)ev.preventDefault();
 }else cancelDrag(); // Short touch: retain the original tap controls.
 try{if(grid.hasPointerCapture(ev.pointerId))grid.releasePointerCapture(ev.pointerId);}catch(_){}
});
grid.addEventListener('pointercancel',cancelDrag);
grid.addEventListener('lostpointercapture',cancelDrag);
grid.addEventListener('contextmenu',ev=>ev.preventDefault());grid.addEventListener('selectstart',ev=>ev.preventDefault());
// Consistent hierarchy navigation on iOS PWA: left-edge rightward swipe.
// Register in document capture so nested buttons and overlays cannot swallow
// the touch sequence. Never steal touch from the sliding board or controls.
let edge=null;
document.addEventListener('touchstart',ev=>{
 edge=null;if(root.hidden||ev.touches.length!==1||!root.contains(ev.target))return;
 if(ev.target.closest('#pipeBoard,.pipeControls,input,select,textarea'))return;
 const t=ev.touches[0];if(t.clientX>92&&t.clientX<115)return;
 edge={id:t.identifier,x:t.clientX,y:t.clientY,fromLeft:t.clientX<=92,ready:false};
},{capture:true,passive:true});
document.addEventListener('touchmove',ev=>{
 if(!edge)return;
 if(ev.touches.length!==1){edge=null;return;}
 const t=ev.touches[0],dx=t.clientX-edge.x,dy=t.clientY-edge.y;
 if(Math.abs(dy)>45&&Math.abs(dy)>Math.abs(dx)){edge=null;return;}
 if((edge.fromLeft?dx>18:dx< -18)&&Math.abs(dx)>Math.abs(dy)*1.6){edge.ready=true;if(ev.cancelable)ev.preventDefault();}
},{capture:true,passive:false});
document.addEventListener('touchend',ev=>{
 if(!edge)return;const start=edge;edge=null;
 const t=Array.from(ev.changedTouches).find(p=>p.identifier===start.id);if(!t)return;
 const dx=t.clientX-start.x,dy=t.clientY-start.y;
 if((start.fromLeft?dx>=68:dx<=-95)&&Math.abs(dy)<65&&Math.abs(dx)>Math.abs(dy)*1.5){
   back();if(ev.cancelable)ev.preventDefault();
 }
},{capture:true,passive:false});
document.addEventListener('touchcancel',()=>edge=null,{capture:true,passive:true});
window.addEventListener('online',()=>{void submitDaily();if(section==='daily')void refreshDailyLeaderboard();});
window.addEventListener('pagehide',()=>{cancelDrag();saveCurrent();timerStop();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){saveCurrent();timerStop();cancelDrag();}else if(section==='game'&&!won&&!expired&&!trialPending)startTicker();});
progress=read();save();if(progress.daily?.[utcToday()]?.sync==='pending')void submitDaily();
globalThis.PipeShiftApp={home,menu,dailyMenu,randomMenu,stages,levels:stages,start:startLevel,startLevel,startRandom,startDaily,back,readProgress:()=>JSON.parse(JSON.stringify(progress))};
})();
