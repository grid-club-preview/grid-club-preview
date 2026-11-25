/* Grid Club · Pipe Shift v0.9.28 · consistent two-tap movement */
(function(){
'use strict';
const e=globalThis.PipeEngine;if(!e)return;
const $=id=>document.getElementById(id),root=$('pipeShiftScreen'),hub=$('home');
if(!root||!hub||!$('pipeShiftEntry'))return;
const KEY='gridclub-pipeshift-progress-v1',BACKUP=KEY+'-v08-backup',MAX=e.MAX_LEVEL;
const blank=()=>({version:2,levelCatalog:6,challengeTuneV24:true,challengeTuneV27:true,completed:{},best:{},active:{},randomBest:{},randomBestV3:{},randomBestV4:{},randomBestByGoal:{all:{},any:{}},randomGoal:'all',randomCount:{},legacyArchived:{},legacyUnlockedStages:{},firstAttemptFailed:{},daily:{},moveStats:{random:{},levels:{count:0,total:0},daily:{count:0,total:0}}});
const oldToNew=id=>{const n=Number(id);return Number.isInteger(n)&&n>=1&&n<=30?Math.floor((n-1)/5)*7+(n-1)%5+1:null;};
function remapLevels(items){const mapped={};for(const [id,value] of Object.entries(items||{})){const next=oldToNew(id);if(next!==null)mapped[next]=value;}return mapped;}
let progress=blank(),section='menu',stage=1,mode='levels',currentLevel=null,currentSize=5,currentTier='beginner',puzzle=null;
const freeTiers={beginner:5,apprentice:6,advanced:7,expert:7};
const fallbackTier=size=>size===5?'beginner':size===6?'apprentice':'expert';
let board=null,moves=0,elapsed=0,undo=[],selected=null,won=false,expired=false,justClearedStage=false,trialPending=false;
let timer=null,lastTick=null,flowTimer=null,pointerOrigin=null,ignoreClickUntil=0,nonce=0;
let dailyDay='',dailyTrace=[],dailyPractice=false,dailyConnection='',dailySync=null,dailyLoading=null;
let dailyServerAttemptId=null,dailyStartPending=false;
let moveLimit=null,legacyMoveCapExempt=false,moveCapVersion=3,failureReason='time';
let extraTimeMs=0,extraTimeCount=0,attemptId='',creditReward=null;
let hintSelection=null,hintPreviewActive=false,hintPreviewInterval=null,hintPreviewUntil=0,hintsUsed=0;
const credits=globalThis.GridClubCredits;
const timeBudget=()=>puzzle?.timerMs?puzzle.timerMs+extraTimeMs:null;
const creditBalance=()=>credits?.balance()||0;
const makeAttempt=()=>`pipe:${Date.now()}:${Math.random().toString(36).slice(2,12)}`;
function goalBest(tier,goal){
 const recent=progress.randomBestByGoal?.[goal]?.[tier]?.moves;
 const previous=tier==='expert'&&goal==='all'?progress.randomBestV4?.[7]?.moves:
   // Old 7x7 Expert boards were far easier, even with an "any pipes"
   // objective. Do not present a historical 7-move best as competitive
   // with the new 29–31-pipe Expert generation.
   tier==='apprentice'&&goal==='any'?progress.randomBest?.[6]?.moves:
   tier==='beginner'&&goal==='any'?progress.randomBest?.[5]?.moves:null;
 const values=[recent,previous].filter(Number.isInteger);
 return values.length?Math.min(...values):null;
}
function bestMoves(){
 if(mode==='levels')return progress.best[currentLevel]?.moves??null;
 if(mode!=='random')return null;
 if(currentTier==='expert'&&[1,2].includes(puzzle?.randomLayoutVersion))
   return progress.randomBest?.[7]?.moves??null;
 if(currentTier==='expert'&&puzzle?.randomLayoutVersion===3)
   return progress.randomBestV3?.[7]?.moves??null;
 return goalBest(currentTier,puzzle?.freeObjective||'all');
}
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
     // The private-beta v8 campaign has different, hidden stage counts and
     // different board goals. Reset ONLY campaign progress, preserving Free
     // Play, Daily Challenges and the shared wallet.
     if(v.levelCatalog!==6){
       next.completed={};next.best={};next.firstAttemptFailed={};
       next.legacyUnlockedStages={};
       next.active=Object.fromEntries(Object.entries(next.active||{}).filter(([key])=>!key.startsWith('level:')));
       next.moveStats.levels={count:0,total:0};
       next.levelCatalog=6;
     }
     if(!next.challengeTuneV24){
       // Level 2 Stage 2 has a different, staggered board in v0.9.24:
       // discard only that old PB/unfinished board, not completed levels,
       // credits, Free Play records or Daily Challenge results.
       delete next.best[7];delete next.active['level:7'];
       next.challengeTuneV24=true;
     }
     if(v.challengeTuneV27!==true){
       // Retain campaign progress and earned credits, but old PBs cannot be
       // compared with the two deeper replacement networks.
       for(const n of [18,23]){delete next.best[n];delete next.active['level:'+n];}
       next.challengeTuneV27=true;
     }
     next.randomGoal=next.randomGoal==='any'?'any':'all';
     next.randomBestByGoal={all:{...(next.randomBestByGoal?.all||{})},
       any:{...(next.randomBestByGoal?.any||{})}};
     // Previous versions used numeric grid sizes as Free Play categories.
     // The new Advanced and Expert tiers are BOTH 7x7, so preserve the
     // old Expert records under Expert rather than merging unrelated bests.
     for(const goal of ['all','any']){
       const category=next.randomBestByGoal[goal];
       for(const [size,tier] of [[5,'beginner'],[6,'apprentice'],[7,'expert']]){
         if(category[size]&&!category[tier])category[tier]=category[size];
         delete category[size];
       }
     }
     for(const [prior,value] of Object.entries(next.active||{})){
       const match=/^random:(5|6|7)(?::(all|any))?$/.exec(prior);
       if(!match||!value)continue;
       const size=Number(match[1]),tier=size===5?'beginner':size===6?'apprentice':'expert';
       const goal=match[2]||(size===7&&value.randomLayoutVersion===3?'all':'any');
       const key=`random:${tier}:${goal}`;
       if(!next.active[key])next.active[key]={...value,freeObjective:goal,freeTier:tier};
       delete next.active[prior];
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
     next.best={};next.active={};next.levelCatalog=6;
     return next;
   }
 }catch(_){}
 return blank();
}
function save(){
 try{const value=JSON.stringify(progress);localStorage.setItem(KEY,value);if(localStorage.getItem(KEY)!==value)throw Error('Storage mismatch');$('pipeSaveNotice').hidden=true;}
 catch(_){$('pipeSaveNotice').hidden=false;}
}
function activeKey(){return mode==='random'?`random:${currentTier}:${puzzle?.freeObjective||'any'}`:mode==='daily'?`daily:${dailyDay}`:mode==='practice'?`practice:${dailyDay}`:`level:${currentLevel}`;}
function clockSync(){if(lastTick===null||won||expired)return;const now=performance.now();if(document.hidden){lastTick=null;return;}elapsed+=Math.max(0,now-lastTick);lastTick=now;}
function timerStop(){if(timer!==null){clearInterval(timer);timer=null;}lastTick=null;}
function startTicker(){if(trialPending||hintPreviewActive)return;timerStop();lastTick=performance.now();timer=setInterval(()=>{
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
 button.disabled=!available||balance<5;
 button.textContent=`+15 seconds · 5 ◉ (${Math.max(0,2-extraTimeCount)} left)`;
 const note=$('pipeBoostNote');
 note.textContent=timed&&!expired&&extraTimeCount<2&&balance<5?'Not enough credits for +15 seconds':'';
 const seconds=(2-extraTimeCount)*15;
 const cost=extraTimeCount===0?15:10;
 $('pipeRescue').hidden=!(timed&&expired&&failureReason==='time'&&seconds>0);
 $('pipeRescue').disabled=balance<cost;
 $('pipeRescue').textContent=`Emergency rescue · +${seconds}s · ${cost} ◉`;
 $('pipeRescueNote').textContent=timed&&expired&&failureReason==='time'?
   (seconds===0?'All 30 extra seconds have been used.':
    balance<cost?`Not enough Club Credits (${balance}/${cost}). Retry is free.`:
    `Balance: ${balance} ◉ · Resume the same attempt`):'';
}
function buyPipeTime(){
 if(mode!=='levels'||!puzzle?.timerMs||won||trialPending||extraTimeCount>=2)return false;
 // Treat a genuinely expired timer as a rescue even if the 100 ms tick
 // hasn't updated the overlay yet. Never sell a late boost at in-play prices.
 if(!expired){clockSync();if(elapsed>=timeBudget())timeout('time');}
 if(expired&&failureReason!=='time')return false;
 const rescue=expired,seconds=rescue?(2-extraTimeCount)*15:15;
 const cost=rescue?(extraTimeCount===0?15:10):5;
 if(!credits?.spend(cost,rescue?'extra-time-rescue':'extra-time',attemptId)){
   refreshCreditControls();return false;
 }
 extraTimeMs+=seconds*1000;
 extraTimeCount=rescue?2:extraTimeCount+1;
 if(rescue){
   // A last-frame purchase may arrive while the visual leak is still
   // unfolding. Cancel it and restore the normal puzzle instruction.
   clearFlow();$('pipeInstruction').textContent=puzzleInstruction(puzzle);
   expired=false;$('pipeTimeout').hidden=true;startTicker();
 }
 updateClock();render();saveCurrent();return true;
}
function saveCurrent(){if(!puzzle||!board||won)return;
 clockSync();progress.active[activeKey()]={board:e.clone(board),moves,elapsed,expired,started:!trialPending,catalogVersion:mode==='levels'?puzzle.catalogVersion:mode==='daily'||mode==='practice'?puzzle.dailyVersion:null,seed:puzzle.seed??null,
   trace:mode==='daily'?dailyTrace.map(x=>({...x})):null,
   serverAttemptId:mode==='daily'?dailyServerAttemptId:null,
   extraTimeMs,extraTimeCount,attemptId,
   moveCapVersion:mode==='levels'?moveCapVersion:null,moveCapExempt:mode==='levels'&&legacyMoveCapExempt,
   timerBudgetMs:mode==='levels'?puzzle?.timerMs:null,failureReason,
   randomLayoutVersion:mode==='random'?(puzzle.randomLayoutVersion||1):null,
   hintsUsed,
   freeObjective:mode==='random'?puzzle.freeObjective:null,
   freeTier:mode==='random'?currentTier:null,
   undo:undo.slice(-40).map(a=>({board:e.clone(a.board),moves:a.moves,steps:a.steps||1}))};save();
}
function clearFlow(){if(flowTimer!==null){clearTimeout(flowTimer);flowTimer=null;}}
function route(name){
 clearFlow();timerStop();closeHintPreview(false);hintSelection=null;
 $('pipeHintMenu').hidden=true;$('pipeHintStatus').hidden=true;
 $('pipeObjectiveHelp').hidden=true;$('pipeObjectiveInfo').setAttribute('aria-expanded','false');
 $('pipeBoard').classList.remove('pipeHintChoosing');section=name;
 for(const n of ['menu','random','stages','levels','game','stats','daily'])$('pipe-'+n).hidden=n!==name;
 $('pipeResult').hidden=true;$('pipeTimeout').hidden=true;$('pipeTimeIntro').hidden=true;selected=null;cancelDrag();
}
function home(){cancelDrag();saveCurrent();route('menu');root.hidden=true;hub.hidden=false;}
function menu(){saveCurrent();hub.hidden=true;root.hidden=false;route('menu');
 $('pipeMenuWallet').textContent=`◉ ${creditBalance()}`;
 const completed=Array.from({length:MAX},(_,i)=>i+1).filter(n=>!!progress.completed[n]).length;
 const remaining=MAX-completed;
 // Display the furthest unlocked, unfinished Level. This respects migrated
 // progress where a later level was unlocked before two new puzzles were added.
 const current=[...e.STAGES].reverse().find(s=>stageUnlocked(s.id)&&
   Array.from({length:e.stageCount(s)},(_,i)=>s.first+i).some(n=>!progress.completed[n]));
 $('pipeLevelsSummary').textContent=remaining?
   `Continue Level ${current?.id||1}`:'All levels complete';
}
function statsMenu(){
 saveCurrent();hub.hidden=true;root.hidden=false;route('stats');
 const completed=Object.keys(progress.completed).filter(n=>progress.completed[n]).length;
 const random=Object.values(progress.randomCount||{}).reduce((n,value)=>n+(Number(value)||0),0);
 const s=progress.moveStats||{},records=[s.levels,s.daily,...Object.values(s.random||{})].filter(Boolean);
 const sum=records.reduce((a,v)=>a+(Number(v.total)||0),0);
 const count=records.reduce((a,v)=>a+(Number(v.count)||0),0);
 $('pipeStatsCompleted').textContent=String(completed+random);
 $('pipeStatsAverage').textContent=count?(sum/count).toFixed(1):'—';
 const list=$('pipeStatsDetails');list.replaceChildren();
 for(const [label,tier,previousSize] of [
   ['Beginner','beginner',5],['Apprentice','apprentice',6],
   ['Advanced','advanced',null],['Expert','expert',7],
   ['Levels',null,null],['Daily Challenge','daily',null]
 ]){
   const fresh=tier&&tier!=='daily'?(s.random||{})[tier]:null;
   const old=previousSize?(s.random||{})[previousSize]:null;
   const record=tier==='daily'?s.daily:tier===null?s.levels:
     {count:(fresh?.count||0)+(old?.count||0),total:(fresh?.total||0)+(old?.total||0)};
   const played=tier==='daily'?Object.keys(progress.daily||{}).filter(d=>progress.daily[d]?.completed).length:
     tier===null?completed:(progress.randomCount[tier]||0)+(previousSize?(progress.randomCount[previousSize]||0):0);
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
 const goal=progress.randomGoal==='any'?'any':'all';
 for(const objective of ['all','any'])$(objective==='all'?'pipeGoalAll':'pipeGoalAny')
   .setAttribute('aria-pressed',String(goal===objective));
 $('pipeGoalExplanation').textContent=goal==='all'?
   'Connect every working pipe. Expert also has a gold-marked pipe to place.':
   'Create a leak-free route from IN to OUT. Other pipes may remain dry.';
 for(const btn of $('pipeRandomChoices').querySelectorAll('[data-pipe-tier]')){
   const tier=btn.dataset.pipeTier;
   if(!Object.hasOwn(freeTiers,tier))continue;
   const text=btn.querySelector('.pipeChoiceCopy')||btn.querySelector('span:not(.pipeButtonIcon):not(.pipeChevron)');
   let subtitle=text?.querySelector('small');
   if(text&&!subtitle){subtitle=document.createElement('small');text.append(subtitle);}
   const active=progress.active[`random:${tier}:${goal}`],best=goalBest(tier,goal);
   // Preserve the short difficulty description while showing the goal's
   // saved best and whether there is an unfinished board.
   const description={
     beginner:'Short connections',apprentice:'Longer connections',
     advanced:'Multi-row networks',expert:'Full-grid challenge'
   }[tier];
   subtitle.textContent=description+
     (Number.isInteger(best)?` · Best ${best} moves`:'')+
     (active?' · Continue available':'');
 }
}
function chooseRandomGoal(goal){
 if(!['all','any'].includes(goal))return;
 progress.randomGoal=goal;save();randomMenu();
}
function stageUnlocked(id){if(id===1)return true;const previous=e.STAGES[id-2];return !!progress.completed[previous.last]||!!progress.legacyUnlockedStages?.[id];}
function canStartLevel(n){const group=e.stageOf(n);return !!group&&(n===1||!!progress.completed[n-1]||(n===group.first&&stageUnlocked(group.id)));}
function stages(){saveCurrent();hub.hidden=true;root.hidden=false;route('stages');
 $('pipeCompletedCount').textContent=`${Object.values(progress.completed).filter(Boolean).length} stages complete`;
 const list=$('pipeStageList');list.replaceChildren();
 for(const s of e.STAGES){const count=Array.from({length:e.stageCount(s)},(_,i)=>s.first+i).filter(n=>progress.completed[n]).length;
   const enabled=stageUnlocked(s.id);const b=document.createElement('button');b.className='pipeStage';b.dataset.stage=s.id;
   b.disabled=!enabled;const number=document.createElement('span');number.className='pipeStageNum';number.textContent=s.id;
   const text=document.createElement('span');text.className='pipeStageContent';const strong=document.createElement('strong');strong.textContent=`Level ${s.id} · ${s.name}`;
   const small=document.createElement('small');small.textContent=`${s.size}×${s.size} · ${count} stage${count===1?'':'s'} complete`;text.append(strong,small);
   const arrow=document.createElement('span');arrow.className='pipeChevron';arrow.textContent=!enabled?'🔒':count===e.stageCount(s)?'✓':'›';
   b.append(number,text,arrow);b.onclick=()=>stageMenu(s.id);list.append(b);
 }
}
function stageMenu(id){const s=e.STAGES.find(x=>x.id===id);if(!s||!stageUnlocked(id))return;
 saveCurrent();stage=id;hub.hidden=true;root.hidden=false;route('levels');
 $('pipeStageTitle').textContent=`Level ${id}`;$('pipeStageDescription').textContent=`${s.name} · ${s.size}×${s.size}`;
 const stageDone=Array.from({length:e.stageCount(s)},(_,i)=>s.first+i).filter(n=>progress.completed[n]).length;
 $('pipeStageCount').textContent=`${stageDone} stage${stageDone===1?'':'s'} complete`;
 const list=$('pipeLevelList');list.replaceChildren();
 for(let n=s.first;n<=s.last;n++){
   const enabled=canStartLevel(n),completed=!!progress.completed[n];
   if(!enabled&&!completed)continue; // do not disclose future stage count
   const active=!!progress.active[`level:${n}`];
   const b=document.createElement('button');b.className='pipeLevel';b.disabled=!enabled;b.dataset.complete=String(completed);
   const left=document.createElement('span'),label=document.createElement('strong'),detail=document.createElement('small');
   label.textContent=`Stage ${n-s.first+1}`;
   detail.textContent=completed?`Best: ${progress.best[n]?.moves??'—'} moves`:active?'Continue stage':e.timerFor(n)?'Time & move trial':'Untimed';
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
 $('pipeDailyDifficulty').textContent=p.freeObjective==='all'?'Use all pipes':'Use any pipes';
 $('pipeDailyPlay').textContent=record?.completed?'Practice today’s puzzle':progress.active[`daily:${day}`]?'Continue today’s puzzle':'Play today’s puzzle';
 $('pipeDailyNote').textContent=record?.completed?`Your first result: ${record.moves} moves${record.verified?' · verified':record.sync==='review'?' · under review':' · saved locally'}`:'One ranked result per day · Fewest moves wins · Fastest verified time breaks ties.';
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
 if(mode!=='daily')return null;
 if(dailyLoading)return dailyLoading;
 // Never create a ranked clock after an offline attempt has already begun.
 if((moves>0||dailyTrace.length>0)&&!dailyServerAttemptId){
   dailyConnection='This attempt began offline. Your result will be saved locally.';
   $('pipeInstruction').textContent=dailyConnection;
   return null;
 }
 if(!rankedReady()){
   dailyConnection='No ranked connection. You can still play and save locally.';
   $('pipeInstruction').textContent=dailyConnection;
   return null;
 }
 const day=dailyDay,localAttemptId=attemptId;
 dailyStartPending=true;
 $('pipeInstruction').textContent='Connecting you to today’s challenge…';
 render();
 dailyLoading=(async()=>{
   try{
     const r=await GridRanked.call('pipe_start',{day});
     if(day!==utcToday()||mode!=='daily'||attemptId!==localAttemptId)return null;
     if(r.state==='completed'){
       dailyConnection='Today’s ranked puzzle is already completed. Additional plays are practice only.';
       dailyPractice=true;dailyServerAttemptId=null;
       if(!progress.daily[day]){
         progress.daily[day]={completed:true,moves:r.moves,sync:'verified',verified:!!r.verified,day};
         save();
       }
     }else if(r.attemptId&&(!dailyServerAttemptId||dailyServerAttemptId===r.attemptId)){
       dailyServerAttemptId=r.attemptId;
       dailyConnection='Ranked attempt ready';
     }else{
       dailyServerAttemptId=null;
       dailyConnection='Ranked session mismatch. This attempt will save locally.';
     }
     return r;
   }catch(err){
     dailyServerAttemptId=null;
     dailyConnection='Ranked connection unavailable. You can still play locally.';
     console.warn('Pipe Shift ranked start unavailable:',err);
     return null;
   }
 })().finally(()=>{
   dailyLoading=null;
   if(mode==='daily'&&day===dailyDay&&attemptId===localAttemptId){
     dailyStartPending=false;
     $('pipeInstruction').textContent=dailyServerAttemptId?'':dailyConnection;
     render();saveCurrent();
   }
 });
 return dailyLoading;
}
async function submitDaily(){
 const day=utcToday(),record=progress.daily?.[day];
 if(!record?.completed||record.sync!=='pending'||!rankedReady())return;
 // Never create a server clock after a player finished an offline board.
 if(!record.serverAttemptId){record.sync='local';save();return;}
 if(dailySync)return dailySync;
 dailySync=(async()=>{
  try{
   const reply=await GridRanked.call('pipe_submit',
     {day,attemptId:record.serverAttemptId,events:record.events});
   if(utcToday()!==day)return;
   record.sync=reply.verified?'verified':'review';record.verified=!!reply.verified;
   record.serverMoves=reply.moves;
   if(Number.isFinite(Number(reply.elapsedMs))&&Number(reply.elapsedMs)>0)
     record.serverElapsedMs=Number(reply.elapsedMs);
   save();
   if(mode==='daily'&&won){
     const serverTime=rankedTime(reply.elapsedMs);
     $('pipeResultMessage').textContent=`${reply.moves} moves${serverTime?' · '+serverTime:''} · ${reply.verified?'Verified result':'Result under review'}`;
   }
  }catch(err){dailyConnection=err.message;console.warn('Pipe Shift daily submission pending:',err);}
 })().finally(()=>{dailySync=null;});
 return dailySync;
}
const rankedTime=ms=>{
 const n=Number(ms);
 if(!Number.isFinite(n)||n<=0)return '';
 const tenths=Math.max(0,Math.round(n/100)),seconds=Math.floor(tenths/10);
 return String(Math.floor(seconds/60)).padStart(2,'0')+':'+
   String(seconds%60).padStart(2,'0')+'.'+String(tenths%10);
};
const pipeRankMedal=rank=>({1:'🥇',2:'🥈',3:'🥉'})[Number(rank)]||'';
function appendRankedRow(parent,rank,name,moves,ms,isYou){
 const row=document.createElement('div');row.className='pipeDailyRow';
 if(isYou)row.classList.add('pipeDailyYou');
 if(Number(rank)>=1&&Number(rank)<=3)row.classList.add('pipeDailyPodium');
 const left=document.createElement('span'),right=document.createElement('strong');
 const medal=pipeRankMedal(rank);
 left.textContent=`${rank}. ${medal?medal+' ':''}${isYou?'You':name}`;
 right.textContent=`${moves} moves${rankedTime(ms)?' · '+rankedTime(ms):''}`;
 row.append(left,right);parent.append(row);
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
  const total=Number(data.total||0),myRank=Number(data.yourRank||0);
  rank.textContent=myRank?`${total} verified finishes · Your rank: ${myRank}`:`${total} verified finishes today`;
  const shown=(data.entries||[]).slice(0,10);
  if(!shown.length&&!myRank){list.textContent='No verified finishes yet. Your run could be the first.';return;}
  for(const entry of shown){
   appendRankedRow(list,entry.rank,entry.name,entry.moves,entry.elapsedMs,!!entry.isYou);
  }
  if(myRank>10&&!shown.some(entry=>entry.isYou)){
   const separator=document.createElement('div');
   separator.className='pipeDailyGap';separator.textContent='•••';
   separator.setAttribute('aria-label','Other leaderboard positions omitted');
   list.append(separator);
   appendRankedRow(list,myRank,'You',data.yourMoves,data.yourElapsedMs,true);
  }
 }catch(err){list.textContent='Leaderboard unavailable: '+err.message;}
}
function freshRandomSeed(){
 nonce++;let seed=(Date.now()^Math.imul(nonce,0x9e3779b9))>>>0;
 try{if(globalThis.crypto?.getRandomValues){const data=new Uint32Array(1);crypto.getRandomValues(data);seed^=data[0];}}catch(_){}
 return seed>>>0;
}
// Only the live, player-connected pipe network is inspected here.
// The feedback never reveals the authored solved board or unseen moves.
// A missing definition of this helper blanked every Pipe Shift board in
// v0.9.19/v0.9.20, because render() called it before creating the tiles.
function expertFlowFeedback(p,current){
 if(!p?.requireAllFlow||!Array.isArray(current))return null;
 const result=e.evaluate(current),wet=new Set(result.flow);
 const dry=current.flatMap((tile,i)=>
   tile.kind==='pipe'&&!tile.decoy&&!wet.has(i)?[i]:[]);
 const total=current.filter(tile=>tile.kind==='pipe'&&!tile.decoy).length;
 const connected=total-dry.length;
 const marker=current.findIndex(tile=>tile.transportPiece);
 const destination=marker<0?-1:(current[marker].transportTarget??current.length-1);
 const markerReady=marker<0||marker===destination;
 let message;
 if(result.reachedOutlet&&dry.length){
   message=`IN to OUT connected · ${dry.length} pipe${dry.length===1?'':'s'} still dry. Connect the highlighted pipes.`;
 }else if(result.reachedOutlet&&result.leaks){
   message=`IN to OUT connected · ${result.leaks} open pipe connection${result.leaks===1?'':'s'} still leaking.`;
 }else if(result.reachedOutlet&&!markerReady){
   message='Every pipe carries water, but the gold-marked pipe is not on its outlined target.';
 }else if(result.reachedOutlet){
   message='All connections complete.';
 }else{
   message=`Water reaches ${connected}/${total} pipes. Connect IN to OUT, then check every pipe.`;
 }
 return {message,dry:result.reachedOutlet?dry:[],dryCount:dry.length,
   connected,total,outletReached:result.reachedOutlet,leaks:result.leaks,
   markerReady,solved:result.solved};
}
function puzzleInstruction(p){
 if(!p)return '';
 if(p.freeObjective==='any'||(p.mode==='daily'&&!p.requireAllFlow))
   return 'Connect IN to OUT without leaks. Unused pipes can stay dry.';
 if(p.freeObjective==='all'&&!p.solvedBoard?.some(t=>t.transportPiece))
   return 'Connect every pipe to the water flow. No pipe can remain dry.';
 if(p.requireAllFlow)
   return 'Connect every working pipe. Move the gold-marked pipe to its outlined square.';
 return p.solvedBoard?.some(t=>t.transportPiece)?
   'Move the gold-marked pipe to the outlined square, then complete the flow.':'';
}
// Paid solution hints use the solved board already generated in the puzzle.
// The player chooses the area before the wallet is charged; the live board
// is never modified by a hint. Ranked Daily is deliberately excluded.
const PIPE_HINTS=Object.freeze({
 square:{cost:3,ledger:'pipe-hint-square',title:'One square'},
 area:{cost:7,ledger:'pipe-hint-area',title:'Three squares'},
 full:{cost:18,ledger:'pipe-hint-full',title:'Full solution'}
});
const hintsAvailable=()=>['random','levels'].includes(mode)&&
 !!puzzle?.solvedBoard&&!won&&!expired&&!trialPending&&!dailyStartPending;
function refreshHintControls(){
 const modeAllows=['random','levels'].includes(mode);
 $('pipeHint').hidden=!modeAllows;
 $('pipeHint').disabled=!hintsAvailable()||hintPreviewActive;
 if(!modeAllows){$('pipeHintMenu').hidden=true;return;}
 const balance=creditBalance();
 $('pipeHintBalance').textContent=`◉ ${balance} available`;
 for(const kind of ['square','area','full']){
   $('pipeHint'+kind.charAt(0).toUpperCase()+kind.slice(1)).disabled=
     !hintsAvailable()||hintPreviewActive||balance<PIPE_HINTS[kind].cost;
 }
}
function hintMessage(message){
 const note=$('pipeHintStatus');
 note.hidden=!message;note.textContent=message||'';
}
function closeHintMenu(){
 hintSelection=null;$('pipeHintMenu').hidden=true;
 $('pipeBoard').classList.remove('pipeHintChoosing');
 hintMessage('');
}
function openHintMenu(){
 if(!hintsAvailable()||hintPreviewActive)return;
 if(!$('pipeHintMenu').hidden){closeHintMenu();return;}
 selected=null;$('pipeHintMenu').hidden=false;
 $('pipeBoard').classList.remove('pipeHintChoosing');
 hintSelection=null;
 $('pipeHintNote').textContent='Hints pause the timer for 5 seconds. Using a hint prevents a new personal best.';
 refreshHintControls();render();
}
function chooseHint(kind){
 if(!hintsAvailable()||!PIPE_HINTS[kind]||hintPreviewActive)return;
 if(creditBalance()<PIPE_HINTS[kind].cost){
   hintMessage('Not enough Club Credits for this hint.');return;
 }
 if(kind==='full'){purchaseHint(kind,null);return;}
 hintSelection=kind;selected=null;
 $('pipeHintMenu').hidden=true;
 $('pipeBoard').classList.add('pipeHintChoosing');
 hintMessage(kind==='square'?
   `Tap the square to reveal (${PIPE_HINTS.square.cost} ◉).`:
   `Tap near the three solution squares you want to reveal (${PIPE_HINTS.area.cost} ◉).`);
 render();
}
function applySelectedHint(index){
 if(!hintSelection||!Number.isInteger(index)||index<0||index>=board.length)return;
 purchaseHint(hintSelection,index);
}
function hintCell(tile){
 const cell=document.createElement('div');
 cell.className='pipeTile '+(tile.kind==='empty'?'pipeEmpty':tile.kind==='wall'?'pipeWall':
   tile.kind==='block'?'pipeBlankBlock':tile.kind==='source'?'pipeSource':
   tile.kind==='sink'?'pipeSink':'pipePiece')+(tile.fixed?' pipeFixed':'');
 if(tile.mask){
   const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
   svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('aria-hidden','true');
   for(const type of ['pipeTube','pipeChannel']){
     const path=document.createElementNS(ns,'path');
     path.setAttribute('class',type);path.setAttribute('d',svgPath(tile.mask));svg.append(path);
   }
   cell.append(svg);
 }
 if(tile.kind==='block'){
   const dot=document.createElement('span');dot.className='pipeBlockGrip';
   dot.textContent='•';cell.append(dot);
 }
 if(tile.kind==='source'||tile.kind==='sink'){
   const label=document.createElement('span');label.className='pipeTerminal';
   label.textContent=tile.kind==='source'?'IN':'OUT';cell.append(label);
 }
 if(tile.fixed&&tile.kind==='pipe'){
   const mark=document.createElement('span');mark.className='pipeFixedMark';
   mark.textContent='•';cell.append(mark);
 }
 if(tile.transportPiece){
   cell.classList.add('pipeTransport');
   const mark=document.createElement('span');mark.className='pipeHintGold';
   mark.textContent='◆';cell.append(mark);
 }
 return cell;
}
// Three positions near the tapped square, favouring connected working pipes.
function hintIndices(kind,center,size){
 if(kind==='full')return new Set(Array.from({length:size*size},(_,i)=>i));
 if(kind==='square')return new Set([center]);
 const solved=puzzle.solvedBoard;
 const distance=i=>Math.abs(i%size-center%size)+Math.abs(Math.floor(i/size)-Math.floor(center/size));
 const candidates=solved.flatMap((tile,i)=>tile.kind==='pipe'&&!tile.decoy?[i]:[])
   .sort((a,b)=>distance(a)-distance(b)||a-b);
 if(!candidates.length)return new Set([center]);
 const result=[],seen=new Set(),queue=[candidates[0]];
 while(queue.length&&result.length<3){
   const at=queue.shift();
   if(seen.has(at))continue;
   seen.add(at);
   const tile=solved[at];
   if(tile.kind!=='pipe'||tile.decoy)continue;
   result.push(at);
   const x=at%size,y=Math.floor(at/size);
   for(const d of e.DIRECTIONS){
     const xx=x+d.dx,yy=y+d.dy;
     if(xx<0||yy<0||xx>=size||yy>=size)continue;
     const next=yy*size+xx,neighbour=solved[next];
     if((tile.mask&d.bit)&&(neighbour.mask&d.opposite)&&neighbour.kind==='pipe'&&!neighbour.decoy&&!seen.has(next))
       queue.push(next);
   }
 }
 for(const at of candidates){
   if(result.length===3)break;
   if(!result.includes(at))result.push(at);
 }
 return new Set(result);
}
function showHintPreview(kind,center){
 const grid=$('pipeHintGrid'),size=puzzle.size,indices=hintIndices(kind,center,size);
 grid.replaceChildren();grid.style.setProperty('--pipe-size',size);
 for(let i=0;i<puzzle.solvedBoard.length;i++){
   const cell=indices.has(i)?hintCell(puzzle.solvedBoard[i]):document.createElement('div');
   cell.classList.add(indices.has(i)?'pipeHintRevealed':'pipeHintMasked');
   grid.append(cell);
 }
 $('pipeHintPreviewTitle').textContent=PIPE_HINTS[kind].title;
 $('pipeHintPreview').dataset.kind=kind;
 $('pipeHintPreview').hidden=false;
 $('pipeHintPreview').setAttribute('aria-label',
   `${PIPE_HINTS[kind].title}, visible for five seconds`);
 hintPreviewActive=true;hintPreviewUntil=performance.now()+5000;
 const update=()=>{
   const remain=Math.max(0,Math.ceil((hintPreviewUntil-performance.now())/1000));
   $('pipeHintSeconds').textContent=`${remain}s`;
   if(remain<=0)closeHintPreview();
 };
 update();
 hintPreviewInterval=setInterval(update,100);
}
function closeHintPreview(resume=true){
 if(hintPreviewInterval!==null){clearInterval(hintPreviewInterval);hintPreviewInterval=null;}
 const wasActive=hintPreviewActive;
 hintPreviewActive=false;hintPreviewUntil=0;
 $('pipeHintPreview').hidden=true;
 delete $('pipeHintPreview').dataset.kind;
 $('pipeHintGrid').replaceChildren();
 if(wasActive&&resume&&section==='game'&&!won&&!expired&&!trialPending&&!document.hidden)
   startTicker();
 if(wasActive&&board&&section==='game')render();
}
function purchaseHint(kind,center){
 if(!hintsAvailable()||hintPreviewActive||!PIPE_HINTS[kind])return false;
 clockSync();
 if(timeBudget()&&elapsed>=timeBudget()){timeout();closeHintMenu();return false;}
 const hint=PIPE_HINTS[kind];
 if(!credits?.spend(hint.cost,hint.ledger,attemptId)){
   closeHintMenu();hintMessage('Could not spend Club Credits. Check your balance.');return false;
 }
 hintsUsed++;closeHintMenu();timerStop();
 showHintPreview(kind,center);
 render();saveCurrent();
 return true;
}
function begin(p,kind,id,skipSave=false){
 if(!skipSave)saveCurrent();mode=kind;currentLevel=kind==='levels'?id:null;if(kind==='levels')stage=e.stageOf(id).id;dailyDay=(kind==='daily'||kind==='practice')?p.day:'';dailyPractice=kind==='practice';dailyTrace=[];currentSize=p.size;currentTier=p.freeTier||fallbackTier(p.size);puzzle=p;
 won=false;expired=false;justClearedStage=false;selected=null;elapsed=0;moves=0;undo=[];trialPending=!!p.timerMs;
 dailyServerAttemptId=null;dailyStartPending=false;
 extraTimeMs=0;extraTimeCount=0;attemptId=makeAttempt();creditReward=null;hintsUsed=0;
 failureReason='time';legacyMoveCapExempt=false;moveCapVersion=3;
 // Existing v6 attempts of redesigned puzzles 6 and 7 keep their original
 // move budgets and boards; fresh starts use the more demanding v7 layout.
 moveLimit=kind==='levels'?e.moveLimitFor(id):null;
 hub.hidden=true;root.hidden=false;route('game');
 const key=activeKey(),stored=progress.active[key];
 if(stored&&e.validateBoard(stored.board)&&stored.board.length===p.size*p.size&&
   (kind==='levels'?stored.catalogVersion===p.catalogVersion:(kind==='daily'||kind==='practice')?stored.seed===p.seed&&stored.catalogVersion===p.dailyVersion:stored.seed===p.seed)&&Number.isInteger(stored.moves)&&stored.moves>=0&&stored.moves<100000){
   board=e.clone(stored.board);moves=stored.moves;elapsed=Math.max(0,Number(stored.elapsed)||0);expired=!!stored.expired;
   extraTimeMs=Math.max(0,Math.min(30000,Number(stored.extraTimeMs)||0));
   extraTimeCount=Math.max(0,Math.min(2,Number(stored.extraTimeCount)||0));
   attemptId=typeof stored.attemptId==='string'&&stored.attemptId?stored.attemptId:attemptId;
   hintsUsed=Math.max(0,Math.min(100,Number(stored.hintsUsed)||0));
   if(kind==='levels'){
     // Preserve the original countdown for unfinished sessions, even
     // after they are re-saved by this release.
     const oldTimers={10:95000,11:130000,18:140000,23:140000,
       29:285000,30:265000,31:300000};
     if(Number.isFinite(stored.timerBudgetMs)&&stored.timerBudgetMs>0)puzzle.timerMs=stored.timerBudgetMs;
     else if(stored.moveCapVersion!==2&&oldTimers[id])puzzle.timerMs=oldTimers[id];
   }
   if(kind==='levels'&&moveLimit!==null){
     // Unfinished v2 trials keep their old move budget, while the original
     // uncapped v1 trials remain uncapped. Only new trials use v3 limits.
     moveCapVersion=stored.moveCapVersion===2?2:stored.moveCapVersion===3?3:1;
     legacyMoveCapExempt=moveCapVersion===1||!!stored.moveCapExempt;
     moveLimit=legacyMoveCapExempt?null:moveCapVersion===2?(e.MOVE_CAPS_V9[id]??null):e.moveLimitFor(id);
   }
   failureReason=stored.failureReason==='moves'?'moves':'time';
   trialPending=!!p.timerMs&&!expired&&!stored.started&&moves===0&&elapsed===0;
   undo=Array.isArray(stored.undo)?stored.undo.filter(a=>e.validateBoard(a.board)&&a.board.length===board.length&&Number.isInteger(a.moves)).slice(-40):[];
   if(kind==='daily'){
    dailyTrace=Array.isArray(stored.trace)?stored.trace.slice(0,5000):[];
    dailyServerAttemptId=typeof stored.serverAttemptId==='string'&&stored.serverAttemptId?
      stored.serverAttemptId:null;
   }
 }else board=e.clone(p.board);
 $('pipeGameName').textContent=kind==='levels'?`Level ${p.stage}`:
   kind==='daily'||kind==='practice'?'Daily Challenge':currentTier.charAt(0).toUpperCase()+currentTier.slice(1);
 $('pipeDifficultyTag').textContent=kind==='levels'? `Stage ${id-e.stageOf(id).first+1}`:
   kind==='daily'||kind==='practice'?(dailyPractice?'Practice':p.day):'Free Play';
 const showObjective=kind==='random'||kind==='levels'||kind==='daily'||kind==='practice';
 $('pipeObjectiveTag').hidden=!showObjective;
 $('pipeObjectiveHelp').hidden=true;
 $('pipeObjectiveInfo').setAttribute('aria-expanded','false');
 if(showObjective){
   $('pipeObjectiveLabel').textContent=p.freeObjective==='all'?'Connect using all pipes':'Connect using any pipes';
   $('pipeObjectiveHelp').textContent=puzzleInstruction(p);
 }
 $('pipeInstruction').hidden=kind==='random'||kind==='levels';
 $('pipeGridSize').textContent=`${p.size}×${p.size}`;
 $('pipeGridSize').hidden=kind==='daily'||kind==='practice';
 $('pipeInstruction').textContent=puzzleInstruction(p);
 $('pipeNew').hidden=kind!=='random';
 $('pipeBoard').style.setProperty('--pipe-size',p.size);$('pipeBoard').dataset.pipeGridSize=String(p.size);
 const goalText=p.freeObjective==='all'?'Connect using all pipes.':'Connect using any pipes.';
 $('pipeTrialDescription').textContent=moveLimit!==null?`${goalText} Finish within ${moveLimit} moves and ${Math.ceil(p.timerMs/1000)} seconds.`:`${goalText} Beat the clock to restore the flow.`;
 render();updateClock();if(kind==='daily')void syncDailyStart();
 if(expired){showFailure();$('pipeTimeout').hidden=false;}
 else if(moveLimit!==null&&moves>=moveLimit)timeout('moves');
 else if(timeBudget()&&elapsed>=timeBudget())timeout('time');
 else if(trialPending){$('pipeTimeIntro').hidden=false;}
 else startTicker();
 saveCurrent();
}
function startLevel(n){
 if(!Number.isInteger(n)||n<1||n>MAX||!canStartLevel(n))return;
 begin(e.get(n),'levels',n);
}
function startRandom(tier,newPuzzle=false){
 if(typeof tier==='number')tier=fallbackTier(tier); // legacy JS caller
 if(!Object.hasOwn(freeTiers,tier))return;
 const size=freeTiers[tier],goal=progress.randomGoal==='any'?'any':'all';
 const key=`random:${tier}:${goal}`,saved=progress.active[key];
 const seed=!newPuzzle&&saved&&Number.isInteger(saved.seed)?saved.seed:freshRandomSeed();
 const version=!newPuzzle&&saved?.randomLayoutVersion;
 let p;
 if(saved&&![5,6].includes(version)&&!newPuzzle){
   // Preserve the original v1, v2 and Expert v3 layouts for active saves.
   const variant=version===1?true:version===2?2:version===3?3:false;
   p={...e.random(size,seed,variant),freeObjective:goal,freeTier:tier};
 }else p=e.freePlay(size,seed,goal,tier);
 if(newPuzzle)delete progress.active[key];
 begin(p,'random',null,newPuzzle);
}
function svgPath(mask){const arms=e.DIRECTIONS.filter(d=>mask&d.bit),end=d=>({1:[50,0],2:[100,50],4:[50,100],8:[0,50]})[d.bit];
 if(arms.length===2){const [a,b]=arms.map(end);if(mask===(e.N|e.S)||mask===(e.E|e.W))return `M${a[0]} ${a[1]} L${b[0]} ${b[1]}`;
 return `M${a[0]} ${a[1]} Q50 50 ${b[0]} ${b[1]}`;}
 return arms.map(d=>{const [x,y]=end(d);return `M50 50 L${x} ${y}`;}).join(' ');
}
function render(flow=[],leak=null){if(!board)return;
 const size=puzzle.size,container=$('pipeBoard');container.replaceChildren();
 const valid=selected===null?[]:availableDestinations(selected),flowMap=new Map(flow.map((n,i)=>[n,i]));
 const leakTarget=leak?.leak?.to>=0?leak.leak.to:leak?.leak?.from;
 const feedback=!won&&!expired?expertFlowFeedback(puzzle,board):null;
 const dryTiles=new Set(feedback?.dry||[]);
 const notice=$('pipeFlowFeedback');
 notice.hidden=!feedback;
 if(feedback){
   if(notice.textContent!==feedback.message)notice.textContent=feedback.message;
   notice.dataset.state=feedback.outletReached?'outlet':'working';
 }else notice.textContent='';
 let numberIn=0,numberOut=0;
 for(let i=0;i<board.length;i++){
   const t=board[i],b=document.createElement('button');b.type='button';b.dataset.cell=String(i);
   b.className='pipeTile '+(t.kind==='empty'?'pipeEmpty':t.kind==='wall'?'pipeWall':t.kind==='block'?'pipeBlankBlock':t.kind==='source'?'pipeSource':t.kind==='sink'?'pipeSink':'pipePiece')+
     (t.fixed?' pipeFixed':'')+(t.transportPiece?' pipeTransport':'')+
     (puzzle.solvedBoard?.[i]?.transportPiece?' pipeTransportGoal':'')+(i===selected?' pipeSelected':'')+
     (valid.includes(i)?' pipeValidDrop':'')+(flowMap.has(i)?(leak?' pipeLeakTrace':' pipeFlowing'):'')+
     (dryTiles.has(i)?' pipeDry':'')+(leakTarget===i?' pipeLeakTarget':'');
   b.setAttribute('aria-label',`Row ${Math.floor(i/size)+1}, column ${i%size+1}: ${t.transportPiece?'Gold-collared movable elbow':t.kind==='empty'?'Empty space':t.kind==='wall'?'Fixed obstacle':t.kind==='block'?'Movable blank block':t.kind==='source'?'Inlet':t.kind==='sink'?'Outlet':t.fixed?'Fixed pipe':'Movable pipe'}`);
   if(flowMap.has(i))b.style.setProperty('--flow-delay',`${flowMap.get(i)*(leak?.segmentMs||140)/1000}s`);
   if(leakTarget===i)b.style.setProperty('--splash-delay',`${Math.max(.35,flow.length*(leak?.segmentMs||140)/1000)}s`);
   if(t.mask){const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('aria-hidden','true');
     for(const name of ['pipeTube','pipeChannel','pipeWater']){const path=document.createElementNS(ns,'path');path.setAttribute('d',svgPath(t.mask));path.setAttribute('class',name);svg.append(path);}b.append(svg);
   }
   if(t.kind==='block'){const grip=document.createElement('span');grip.className='pipeBlockGrip';grip.textContent='•';b.append(grip);}
   if(t.fixed&&t.kind==='pipe'){const mark=document.createElement('span');mark.className='pipeFixedMark';mark.textContent='•';b.append(mark);}
   if(t.kind==='source'||t.kind==='sink'){const label=document.createElement('span');label.className='pipeTerminal';
     const nr=t.kind==='source'?++numberIn:++numberOut;label.textContent=t.kind==='source'?'IN'+(board.filter(x=>x.kind==='source').length>1?nr:''):'OUT'+(board.filter(x=>x.kind==='sink').length>1?nr:'');b.append(label);
   }
   container.append(b);
 }
 $('pipeMoves').textContent=moveLimit!==null?`${moves}/${moveLimit}`:String(moves);
 refreshMoveInfo();refreshCreditControls();refreshHintControls();
 $('pipeUndo').disabled=won||expired||undo.length===0;$('pipeReset').disabled=won||expired||moves===0;
}
function availableDestinations(from){
 return board.map((_,to)=>{
   const path=e.straightSlidePath(board,from,to);
   return path.length&&(moveLimit===null||moves+path.length<=moveLimit)?to:-1;
 }).filter(to=>to>=0);
}
function slide(from,to){
 if(won||expired||trialPending||dailyStartPending||hintPreviewActive||hintSelection)return false;
 const path=e.straightSlidePath(board,from,to);
 if(!path.length||(moveLimit!==null&&moves+path.length>moveLimit))return false;
 clockSync();if(timeBudget()&&elapsed>=timeBudget()){timeout();return false;}
 const saved={board:e.clone(board),moves,steps:0};
 undo.push(saved);
 let check=null;
 for(const move of path){
   if(!e.move(board,move.from,move.to))throw Error('Unreachable straight slide');
   moves++;saved.steps++;
   if(mode==='daily')dailyTrace.push({action:'slide',from:move.from,to:move.to});
   // Server replay checks for completion after EVERY individual slide and
   // rejects any further actions. Stop even in the middle of a drag.
   check=e.evaluate(board);
   if(check.solved)break;
 }
 // The backend holds at most 40 adjacent slide snapshots for ranked undo.
 // Keep the same 40-step budget even when one drag contains several moves.
 if(mode==='daily'){
   let steps=undo.reduce((n,x)=>n+(x.steps||1),0);
   while(steps>40&&undo.length>1)steps-=undo.shift().steps||1;
 }else if(undo.length>40)undo.shift();
 selected=null;
 if(check.solved){
   won=true;timerStop();
   creditReward={puzzle:0,stage:0,daily:0,saveFailed:false};
   if(mode!=='practice'&&!dailyPractice)recordCompletion(mode,mode==='random'?currentTier:currentSize,moves);
   if(mode==='levels'){
     const first=!progress.completed[currentLevel],group=e.stageOf(currentLevel);
     progress.completed[currentLevel]=true;
     if(hintsUsed===0&&(!progress.best[currentLevel]||moves<progress.best[currentLevel].moves))
       progress.best[currentLevel]={moves,elapsed,when:new Date().toISOString()};
     if(first&&!progress.firstAttemptFailed?.[currentLevel]){
       const award=credits?.award('club:pipe:v8:level:'+currentLevel,2,'pipe-level');
       creditReward.puzzle=award?.awarded||0;
       creditReward.saveFailed ||= !!award?.saveFailed;
     }
     justClearedStage=first&&currentLevel===group.last&&
       Array.from({length:e.stageCount(group)},(_,i)=>group.first+i).every(id=>!!progress.completed[id]);
     if(justClearedStage){
       const award=credits?.award('club:pipe:v8:stage:'+group.id,5,'pipe-stage');
       creditReward.stage=award?.awarded||0;
       creditReward.saveFailed ||= !!award?.saveFailed;
     }
   }else if(mode==='random'){
     progress.randomCount[currentTier]=(progress.randomCount[currentTier]||0)+1;
     const objective=puzzle.freeObjective==='all'?'all':'any';
     const bests=(progress.randomBestByGoal ||= {all:{},any:{}})[objective] ||= {};
     if(hintsUsed===0&&(!bests[currentTier]||moves<bests[currentTier].moves))
       bests[currentTier]={moves,elapsed};
   }else if(mode==='daily'&&!dailyPractice){
     progress.daily[dailyDay]={completed:true,moves,events:dailyTrace.map(x=>({...x})),
      sync:dailyServerAttemptId?'pending':'local',serverAttemptId:dailyServerAttemptId,
      verified:false,day:dailyDay};
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
function clickCell(i){if(section!=='game'||won||expired||trialPending||dailyStartPending||i<0||i>=board.length)return;
 if(hintSelection){applySelectedHint(i);return;}
 if(hintPreviewActive)return;
 if(selected!==null&&board[i].kind==='empty'&&slide(selected,i))return;
 const t=board[i];if(!['pipe','block'].includes(t.kind)||t.fixed){selected=null;render();return;}
 // Use select-then-destination for every tap, even if only one adjacent
 // square is available. Drag gestures remain a deliberate single gesture.
 // Auto-sliding on selection can accidentally waste a limited move.
 selected=selected===i?null:i;render();
}
function undoMove(){if(won||expired||trialPending||dailyStartPending||hintPreviewActive||hintSelection||!undo.length)return;clockSync();const last=undo.pop();board=e.clone(last.board);if(mode==='daily')for(let step=0;step<(last.steps||1);step++)dailyTrace.push({action:'undo'});selected=null;render();saveCurrent();}
function reset(){if(won||expired||trialPending||dailyStartPending||hintPreviewActive||hintSelection)return;clockSync();board=e.clone(puzzle.board);if(mode==='daily')dailyTrace.push({action:'reset'});undo=[];selected=null;render();saveCurrent();}
function showFailure(){
 const byMoves=failureReason==='moves';
 $('pipeTimeoutTitle').textContent=byMoves?'Move limit reached!':'Flow failed · Leak detected';
 $('pipeTimeoutMessage').textContent=byMoves?'The flow needs fewer moves. Try a different route.':
   'Water escaped before the network was finished. Use an emergency rescue to continue this attempt, or retry for free (without first-attempt credits).';
 refreshCreditControls();
}
function timeout(reason='time'){
 if(won||expired)return;
 clockSync();failureReason=reason;expired=true;timerStop();selected=null;
 updateClock();saveCurrent();
 if(reason!=='time'||section!=='game'||document.hidden||
    (typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)){
   render();showFailure();$('pipeTimeout').hidden=false;return;
 }
 // Only trace the water connected to the inlet on the player's CURRENT
 // board. This never reveals the hidden correct route.
 const leak=e.traceLeak(board),segmentMs=140;
 const originalInstruction=$('pipeInstruction').textContent;
 $('pipeInstruction').textContent='Water flowing…';
 render(leak.flow,{...leak,segmentMs});
 clearFlow();
 const delay=Math.min(1900,Math.max(850,450+leak.flow.length*segmentMs));
 flowTimer=setTimeout(()=>{
   flowTimer=null;
   if(section!=='game'||won||!expired||failureReason!=='time')return;
   $('pipeInstruction').textContent=originalInstruction;
   render();showFailure();$('pipeTimeout').hidden=false;
 },delay);
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
 $('pipeCreditReward').hidden=!creditReward?.saveFailed;
 $('pipeCreditReward').textContent=creditReward?.saveFailed?'Some credit rewards could not be saved.':'';
 globalThis.GridClubVault?.show('pipeVaultReward',{earned,balance:creditBalance(),
   detail:creditReward?.stage?`Includes +${creditReward.stage} level bonus`:''});
 $('pipeResultTitle').textContent=names[(moves+(currentLevel||0))%names.length];
 if(mode==='random'){$('pipeResultMessage').textContent=`${moves} moves`;$('pipeResultNext').hidden=false;$('pipeResultNext').textContent='Next puzzle →';$('pipeResultLevels').textContent='Back to Free Play';}
 else if(mode==='daily'||mode==='practice'){$('pipeResultMessage').textContent=`${moves} moves · ${dailyDay}${dailyPractice?' · practice':''}`;$('pipeResultNext').hidden=true;$('pipeResultLevels').textContent='Daily leaderboard';}
 else{
   const s=e.stageOf(currentLevel),last=currentLevel===MAX;
   $('pipeResultMessage').textContent=`Level ${s.id} · Stage ${currentLevel-s.first+1} · ${moves} moves`;
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
 if(hintsUsed>0)$('pipeResultMessage').textContent+=
   ` · Assisted (${hintsUsed} hint${hintsUsed===1?'':'s'})`;
 const todayCompleted=(mode==='daily'||mode==='practice')&&dailyDay===utcToday()&&!!progress.daily[dailyDay]?.completed;
 const journey=globalThis.GridClubDailyJourney;
 const nextDaily=todayCompleted?journey?.nextGame('pipeShift'):null;
 $('pipeDailyRemainingWin').hidden=!todayCompleted||!nextDaily;
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
$('pipeGoalAll').onclick=()=>chooseRandomGoal('all');
$('pipeGoalAny').onclick=()=>chooseRandomGoal('any');
$('pipeRandomChoices').addEventListener('click',ev=>{const b=ev.target.closest('[data-pipe-tier]');if(b)startRandom(b.dataset.pipeTier);});
$('pipeResultNext').onclick=()=>mode==='random'?startRandom(currentTier,true):startLevel(currentLevel+1);
$('pipeResultLevels').onclick=()=>mode==='random'?randomMenu():mode==='daily'||mode==='practice'?dailyMenu():stages();
$('pipeTrialStart').onclick=()=>{if(!trialPending||section!=='game')return;trialPending=false;$('pipeTimeIntro').hidden=true;startTicker();saveCurrent();};
$('pipeRetry').onclick=retry;
$('pipeRescue').onclick=buyPipeTime;
$('pipeExtraTime').onclick=buyPipeTime;
$('pipeTimeoutBack').onclick=()=>mode==='random'?randomMenu():stageMenu(stage);
$('pipeUndo').onclick=undoMove;$('pipeReset').onclick=reset;$('pipeNew').onclick=()=>startRandom(currentTier,true);
$('pipeObjectiveInfo').onclick=()=>{
 if(!['random','levels'].includes(mode)||section!=='game')return;
 const help=$('pipeObjectiveHelp'),show=help.hidden;
 help.hidden=!show;$('pipeObjectiveInfo').setAttribute('aria-expanded',String(show));
};
$('pipeHint').onclick=openHintMenu;
$('pipeHintSquare').onclick=()=>chooseHint('square');
$('pipeHintArea').onclick=()=>chooseHint('area');
$('pipeHintFull').onclick=()=>chooseHint('full');
$('pipeHintCancel').onclick=closeHintMenu;
$('pipeHintClose').onclick=()=>closeHintPreview();
const grid=$('pipeBoard');
grid.addEventListener('click',ev=>{if(performance.now()<ignoreClickUntil)return;const b=ev.target.closest('[data-cell]');if(b)clickCell(Number(b.dataset.cell));});
// Press and drag a pipe (or solid blank block) along a clear straight run.
// Native pointer capture ensures the drag keeps working when a finger leaves
// the source tile. Tap-to-select and tap-to-move remain available for access.
function cancelDrag(){
 if(pointerOrigin?.ghost)pointerOrigin.ghost.remove();
 grid?.querySelectorAll('.pipeDragSource,.pipeDragTarget').forEach(t=>t.classList.remove('pipeDragSource','pipeDragTarget'));
 pointerOrigin=null;
}
// Cache all reachable straight-line destinations on touch-down rather than
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
 if(ev.pointerType==='touch'&&ev.clientX<=28)return; // reserve narrow edge swipe
 const cell=ev.target.closest('[data-cell]');
 if(!cell||section!=='game'||won||expired||trialPending||ev.isPrimary===false)return;
 const from=Number(cell.dataset.cell),tile=board?.[from];
 if(hintPreviewActive||hintSelection||won||expired||trialPending||dailyStartPending)return;
 if(!tile||tile.fixed||!['pipe','block'].includes(tile.kind))return;
 cancelDrag();
 const validCells=[];
 for(const to of availableDestinations(from)){
  const dest=grid.querySelector(`[data-cell="${to}"]`),r=dest?.getBoundingClientRect();
  if(r)validCells.push({index:to,x:r.left+r.width/2,y:r.top+r.height/2,width:r.width});
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
  const valid=target!==null&&e.straightSlidePath(board,p.from,target).length>0;
  cancelDrag();
  if(valid)slide(p.from,target);
  if(ev.cancelable)ev.preventDefault();
 }else cancelDrag(); // Short touch: retain the original tap controls.
 try{if(grid.hasPointerCapture(ev.pointerId))grid.releasePointerCapture(ev.pointerId);}catch(_){}
});
grid.addEventListener('pointercancel',cancelDrag);
grid.addEventListener('lostpointercapture',cancelDrag);
grid.addEventListener('contextmenu',ev=>ev.preventDefault());grid.addEventListener('selectstart',ev=>ev.preventDefault());
window.addEventListener('online',()=>{void submitDaily();if(section==='daily')void refreshDailyLeaderboard();});
window.addEventListener('pagehide',()=>{
 cancelDrag();closeHintPreview(false);saveCurrent();timerStop();
});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){
   closeHintPreview(false);saveCurrent();timerStop();cancelDrag();
 }else if(section==='game'&&!won&&!expired&&!trialPending)startTicker();
});
progress=read();save();if(progress.daily?.[utcToday()]?.sync==='pending')void submitDaily();
globalThis.PipeShiftApp={home,menu,dailyMenu,randomMenu,stages,levels:stages,start:startLevel,startLevel,startRandom,startDaily,back,readProgress:()=>JSON.parse(JSON.stringify(progress))};
})();
