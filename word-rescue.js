/* Grid Club Word Rescue v0.9.42 · hazard-only play display. */
(function(){
'use strict';
const engine=globalThis.GridClubWordRescueEngine;
const $=id=>document.getElementById(id);
const root=$('wordRescueScreen'),home=$('home');
if(!engine||!root||!home||!$('wrEntry'))return;
const KEY='gridclub-word-rescue-alpha-v1',STATS_KEY='gridclub-word-rescue-records-v1',RULES_KEY='gridclub-word-rescue-rules-v1';
let state=null,screen='menu',timer=null,lastTick=0,lastSecond=-1,flash='',rulesOpen=false,firstRules=false;
const rulesSeen=new Set();
const letterButtons=[];
let drawnBlocks=-1;
const safeGet=(key)=>{try{return localStorage.getItem(key);}catch(_){return null;}};
const safeSave=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(_){return false;}};
const safeDel=key=>{try{localStorage.removeItem(key);}catch(_){}};
const readState=()=>{try{const s=JSON.parse(safeGet(KEY)||'null');if(!engine.validState(s)||s.won||s.expired)return null;
  // Repair impossible old racks without consuming a free shuffle, credits
  // or time. Keep construction, score, elapsed time and sunk slots.
  if(!s.rankEligible&&s.rackRules!==3){s.rackRules=3;s.allowTriple=false;engine.ensurePlayable(s);safeSave(KEY,s);}else if(engine.ensurePlayable(s))safeSave(KEY,s);
  return s;
 }catch(_){return null;}};
const balance=()=>globalThis.GridClubCredits?.balance?.()||0;
const RERACK_COST=5;
const SCORE_KEY='gridclub-word-rescue-scores-v1';
let boardMode='tide',boardPeriod='day',statsMode='all';
let rankStarting=false,boardRequest=0;
const RANK_HISTORY_KEY='gridclub-word-rescue-ranking-status-v1';
let resultReadyAt=0;
const RESULT_TAP_GUARD_MS=900;
const rankedReady=()=>!!globalThis.GridRanked?.configured&&globalThis.navigator?.onLine!==false;
function unrank(reason='Round was saved or paused.'){
 if(state){state.rankEligible=false;state.rankAttempt=null;state.rankReason=state.rankReason||reason;}
 rankStarting=false;
}
function rankHistory(){try{return JSON.parse(safeGet(RANK_HISTORY_KEY)||'{}')||{};}catch(_){return {};}}
function renderRankDetails(){
 const item=rankHistory()[boardMode];
 $('wrBoardLastResult').textContent=item?'Last successful rescue: '+item.score+'. '+item.note:'No submission details recorded for this mode yet.';
}
function rememberRank(run,note){
 const all=rankHistory(),existing=all[run.mode];
 if(!existing||existing.id===run.attemptId||existing.at<=run.rankFinishedAt){
   all[run.mode]={id:run.attemptId,at:run.rankFinishedAt,score:run.score,note};safeSave(RANK_HISTORY_KEY,all);
 }
 if(screen==='leaderboard')renderRankDetails();
}
const makeAttempt=()=>`word:${Date.now()}:${Math.random().toString(36).slice(2,12)}`;
function ensureDictionary(){
 // All words are loaded synchronously from the PWA bundle before this app
 // initialises. No first-launch download, account or connectivity required.
 $('wrDictionaryStatus').textContent=engine.WORD_SET.size.toLocaleString('en-GB')+
   ' English words available · ready offline';
}
const day=()=>new Date().toISOString().slice(0,10);
const formatMs=ms=>{const n=Math.ceil(ms/1000);return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');};
function stop(){if(timer!==null)clearInterval(timer);timer=null;lastTick=0;}
function save(){if(state&&!state.won&&!state.expired)safeSave(KEY,state);else safeDel(KEY);}
function records(){try{const x=JSON.parse(safeGet(STATS_KEY)||'null');return x&&typeof x==='object'?x:{};}catch(_){return {};}}
function modeName(mode){return mode==='sinking'?'Sinking Letters':mode==='raft'?'Raft Escape':'Rising Tide';}
const RULES={
 tide:['Raise Gridda up by making words','Hurry — the tide is rising!','Gridda’s boat has broken apart. Stack pieces of wreckage to stay above the water until the approaching rescue boat arrives.'],
 raft:['Build towards Gridda by making words','Hurry — the shark is approaching!','Build out from the island to reach Gridda before the shark catches her. Call a friend once for 10 Club Credits to distract the shark and gain 10 seconds. This makes the result personal practice only.'],
 sinking:['Raise Gridda up by making words','Hurry — the tide is rising and letters are sinking!','Gridda’s boat has broken apart. Stack wreckage until the approaching rescue boat arrives. A letter slot is lost permanently every 10 seconds, down to four letters. The endangered slot fades over six seconds before disappearing. Making words or reshuffling cannot recover lost slots. At least one vowel, two consonants and a valid word remain.']
};
function seen(mode){return rulesSeen.has(mode)||safeGet(RULES_KEY+':'+mode)==='true';}
function startTimer(){
 if(!state||state.won||state.expired||rulesOpen||document.hidden||timer!==null||rankStarting)return;
 if(state.rankEligible===undefined&&state.elapsedMs===0&&state.words.length===0&&rankedReady()){
   const original=state;rankStarting=true;state.rankEligible=false;
   $('wrDock').inert=true;render();
   const request=globalThis.GridRanked.call('word_start',{mode:state.mode,rackRules:3,raftPace:3,sinkRules:3});
   let timeout;
   Promise.race([request,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Connection timeout')),10000);})]).then(reply=>{
     if(state!==original||screen!=='play'||!rankStarting)return;
     if(!reply.attemptId||!Number.isInteger(reply.seed)||reply.rules!==(original.mode==='raft'?6:original.mode==='sinking'?8:5))throw Error('Ranked rescue unavailable');
     state=engine.create(reply.seed,original.mode,3,3,3);
     state.attemptId=original.attemptId;state.reracks=0;state.started=true;
     state.rankEligible=true;state.rankAttempt=reply.attemptId;state.rankEvents=[];
     delete state.rankReason;
   }).catch(()=>{
     if(state===original&&screen==='play'&&rankStarting)state.rankReason='Could not establish an online ranking session at the start.';
   }).finally(()=>{
     clearTimeout(timeout);
     if(!rankStarting||screen!=='play'||state.attemptId!==original.attemptId)return;
     rankStarting=false;$('wrDock').inert=false;render();save();startTimer();
   });
   return;
 }
 if(state.rankEligible===undefined){state.rankEligible=false;state.rankReason='An online ranking session was unavailable at the start.';}
 lastTick=performance.now();timer=setInterval(tick,125);
}
function showRules(first=false){
 if(!state||rulesOpen||rankStarting)return;
 if(!first&&!state.won&&!state.expired&&state.rankEligible){if(!confirm('Opening instructions pauses this round and makes it personal practice only. Continue?'))return;unrank('Instructions were opened during the round.');}
 stop();rulesOpen=true;firstRules=first;
 const [lead,warning,detail]=RULES[state.mode];
 $('wrRulesMode').textContent=modeName(state.mode);
 $('wrRulesLead').textContent=lead;$('wrRulesWarning').textContent=warning;
 $('wrRulesDetail').textContent=detail;$('wrRulesDetails').hidden=first;
 $('wrRulesPlay').textContent=first?'Play':state.won||state.expired?'Close':'Continue';$('wrRules').hidden=false;
 $('wrDock').inert=true;render();$('wrRulesPlay').focus?.();
}
function closeRules(){
 if(!rulesOpen)return;
 if(firstRules){rulesSeen.add(state.mode);safeSave(RULES_KEY+':'+state.mode,true);}
 rulesOpen=false;firstRules=false;$('wrRules').hidden=true;$('wrDock').inert=false;
 if(state.won||state.expired){render();return;}
 state.started=true;render();save();startTimer();
}
function menu(){
 if(rankStarting||state?.rankEligible&&!state.won){unrank();save();}
 boardRequest++;
 rulesOpen=false;firstRules=false;$('wrRules').hidden=true;$('wrDock').inert=false;$('wrInfo').hidden=true;
 stop();screen='menu';$('wrMenu').hidden=false;$('wrPlay').hidden=true;$('wrLeaderboard').hidden=true;$('wrStats').hidden=true;
 const saved=readState();$('wrContinue').hidden=!saved;
 ensureDictionary();
 if(saved)$('wrContinueLabel').textContent='Continue '+modeName(saved.mode)+' · '+formatMs(saved.elapsedMs)+' played';
 $('wrWallet').textContent='◉ '+balance();
 const best=records();
 $('wrBest').textContent=['tide','raft','sinking'].map(mode=>best[mode]?'Best '+modeName(mode)+': '+best[mode].seconds+'s':'').filter(Boolean).join(' · ')||
   'Complete a rescue to set your first personal best.';
}
function homeScreen(){if(rankStarting||state?.rankEligible&&!state.won)unrank();save();stop();root.hidden=true;home.hidden=false;}
function open(){
 home.hidden=true;root.hidden=false;menu();
}
function scoreHistory(){
 try{const items=JSON.parse(safeGet(SCORE_KEY)||'[]');return Array.isArray(items)?items.filter(x=>x&&typeof x.id==='string'&&['tide','raft','sinking'].includes(x.mode)&&Number.isFinite(x.score)&&Number.isFinite(x.ms)&&Number.isFinite(x.at)):[];}catch(_){return [];}
}
function scoreRows(mode,period,now=Date.now()){
 const date=new Date(now).toISOString().slice(0,10);
 return scoreHistory().filter(x=>{
   if(x.mode!==mode||x.won===false||x.rescueRules!==(mode==='raft'?2:3))return false;
   const completed=new Date(x.at).toISOString().slice(0,10);
   return period==='all'||(period==='day'?completed===date:completed.slice(0,7)===date.slice(0,7));
 }).sort((a,b)=>b.score-a.score||a.ms-b.ms||a.at-b.at).slice(0,10);
}
async function renderScoreboard(){
 for(const [id,value] of [['wrBoardTide','tide'],['wrBoardRaft','raft'],['wrBoardSinking','sinking']])$(id).setAttribute('aria-pressed',String(boardMode===value));
 for(const [id,value] of [['wrBoardDay','day'],['wrBoardMonth','month'],['wrBoardAll','all']])$(id).setAttribute('aria-pressed',String(boardPeriod===value));
 renderRankDetails();
 const list=$('wrBoardRows'),request=++boardRequest;
 list.replaceChildren();$('wrBoardEmpty').hidden=false;$('wrBoardRank').textContent='';
 $('wrBoardEmpty').textContent='Loading global rankings…';
 if(!rankedReady()){$('wrBoardEmpty').textContent='Global leaderboard unavailable offline. Your stats remain available.';return;}
 try{
   const result=await globalThis.GridRanked.call('word_leaderboard',{mode:boardMode,period:boardPeriod,rackRules:3,raftPace:3,sinkRules:3});
   if(request!==boardRequest||screen!=='leaderboard')return;
   const rows=result.entries||[];
   $('wrBoardEmpty').hidden=rows.length>0;$('wrBoardEmpty').textContent='No ranked rescues in this period yet.';
   for(const row of rows){
     const tr=document.createElement('tr');
     if(row.isYou)tr.className='wrBoardYou';
     for(const value of [String(row.rank<=3?['🥇','🥈','🥉'][row.rank-1]:row.rank),row.isYou?'You':row.name,String(row.score)]){
       const td=document.createElement('td');td.textContent=value;tr.append(td);
     }
     list.append(tr);
   }
   $('wrBoardRank').textContent=result.yourRank?'Your position: '+result.yourRank+' of '+result.total+' · Score '+result.yourScore:result.total+' ranked player'+(result.total===1?'':'s');
 }catch(_){if(request===boardRequest&&screen==='leaderboard')$('wrBoardEmpty').textContent='Could not load global rankings. Try Refresh.';}
}
function showScoreboard(mode=boardMode){
 if(screen==='play')save();
 stop();screen='leaderboard';boardMode=mode;
 $('wrMenu').hidden=true;$('wrPlay').hidden=true;$('wrLeaderboard').hidden=false;$('wrStats').hidden=true;$('wrInfo').hidden=true;
 renderScoreboard();
}
function personalStats(mode){
 const rows=scoreHistory().filter(x=>mode==='all'||x.mode===mode);
 const wins=rows.filter(x=>x.won!==false),tracked=rows.filter(x=>typeof x.won==='boolean');
 const trackedWins=tracked.filter(x=>x.won).length;
 const older=Object.entries(records()).filter(([key])=>mode==='all'||key===mode).map(([,x])=>x).filter(x=>x&&Number.isFinite(x.seconds));
 const bestTimes=wins.map(x=>x.ms).concat(older.map(x=>x.seconds*1000));
 const scores=wins.map(x=>x.score).concat(older.map(x=>x.score).filter(Number.isFinite));
 return {
   rescues:wins.length,rounds:tracked.length,defeats:tracked.length-trackedWins,
   success:tracked.length?Math.round(trackedWins/tracked.length*100):null,
   score:scores.length?Math.max(...scores):null,
   fastest:bestTimes.length?Math.min(...bestTimes):null,
   average:wins.length?wins.reduce((sum,x)=>sum+x.score,0)/wins.length:null,
   longest:tracked.reduce((max,x)=>Math.max(max,x.longest||0),0)
 };
}
function renderPersonalStats(){
 for(const [id,value] of [['wrStatsAll','all'],['wrStatsTide','tide'],['wrStatsRaft','raft'],['wrStatsSinking','sinking']])$(id).setAttribute('aria-pressed',String(statsMode===value));
 const s=personalStats(statsMode);
 const values=[
   ['Successful rescues',s.rescues],['Rounds tracked',s.rounds],['Defeats',s.defeats],
   ['Success rate',s.success===null?'—':s.success+'%'],
   ['Highest recorded score',s.score??'—'],['Fastest rescue',s.fastest===null?'—':(s.fastest/1000).toFixed(1)+'s'],
   ['Average rescue score',s.average===null?'—':s.average.toFixed(1)],['Longest word',s.longest?s.longest+' letters':'—']
 ];
 const grid=$('wrStatsGrid');grid.replaceChildren();
 for(const [label,value] of values){const card=document.createElement('div');card.className='wrStat';const name=document.createElement('small');name.textContent=label;const number=document.createElement('strong');number.textContent=String(value);card.append(name,number);grid.append(card);}
}
function showStats(){
 boardRequest++;stop();screen='stats';$('wrMenu').hidden=true;$('wrPlay').hidden=true;$('wrLeaderboard').hidden=true;$('wrStats').hidden=false;$('wrInfo').hidden=true;
 renderPersonalStats();
}
function persistRecord(){
 const entries=scoreHistory();
 if(!entries.some(x=>x.id===state.attemptId)){
   entries.push({id:state.attemptId,mode:state.mode,score:state.score,ms:state.elapsedMs,at:Date.now(),reracks:state.reracks||0,rescueRules:state.rescueRules||1,won:state.won,words:state.words.length,longest:state.words.reduce((max,x)=>Math.max(max,x.word.length),0)});
   safeSave(SCORE_KEY,entries);
 }
 if(!state.won)return;
 const previous=records(),time=Math.round(state.elapsedMs/1000),mode=state.mode;
 if(!previous[mode]||time<previous[mode].seconds){
   previous[mode]={seconds:time,score:state.score,words:state.words.length};
   safeSave(STATS_KEY,previous);
 }
}
// Rotate through each mode's pool, avoiding the last displayed title even
// when switching modes. Store only the rotation cursor, separate from scores.
const WIN_KEY='gridclub-word-rescue-win-messages-v1';
let winRotation=null;
function victoryTitle(mode){
 if(!winRotation){
   try{winRotation=JSON.parse(safeGet(WIN_KEY)||'null');}catch(_){}
   if(!winRotation||typeof winRotation!=='object'||Array.isArray(winRotation))winRotation={};
 }
 const catalog=globalThis.GridClubWinMessages?.wordRescue;
 const general=catalog?.general||['Safe at last!','What a rescue!','What a relief!'];
 const specific=catalog?.[mode]||[];
 // Interleave mode-specific messages rather than leaving them until the end.
 const pool=general.flatMap((phrase,i)=>i<specific.length?[phrase,specific[i]]:[phrase]);
 const n=pool.length;
 let i=Number.isInteger(winRotation[mode])&&winRotation[mode]>=0?winRotation[mode]%n:0;
 if(n>1&&pool[i]===winRotation.last)i=(i+1)%n;
 const title=pool[i];
 winRotation[mode]=(i+1)%n;winRotation.last=title;safeSave(WIN_KEY,winRotation);
 return title;
}
const LOSS_KEY='gridclub-word-rescue-loss-messages-v1';
let lossRotation=null;
function defeatTitle(mode){
 if(!lossRotation){
   try{lossRotation=JSON.parse(safeGet(LOSS_KEY)||'null');}catch(_){}
   if(!lossRotation||typeof lossRotation!=='object'||Array.isArray(lossRotation))lossRotation={};
 }
 const catalog=globalThis.GridClubWinMessages?.wordRescueLoss;
 const general=catalog?.general||['This is awkward.','Poor Gridda.','Better luck next time, Gridda.','Oh no!'];
 const specific=catalog?.[mode]||(mode==='raft'?['Shark meat.']:['The water caught up!']);
 const pool=general.flatMap((phrase,i)=>i<specific.length?[phrase,specific[i]]:[phrase]);
 const n=pool.length;
 let i=Number.isInteger(lossRotation[mode])&&lossRotation[mode]>=0?lossRotation[mode]%n:0;
 if(n>1&&pool[i]===lossRotation.last)i=(i+1)%n;
 const title=pool[i];
 lossRotation[mode]=(i+1)%n;lossRotation.last=title;safeSave(LOSS_KEY,lossRotation);
 return title;
}
function publishRank(run){
 run.rankFinishedAt=Date.now();
 if(!run.rankEligible||!run.rankAttempt){rememberRank(run,run.rankReason||'No online ranking session was established.');return;}
 const payload={attemptId:run.rankAttempt,events:run.rankEvents,elapsedMs:Math.round(run.elapsedMs)};
 rememberRank(run,'Submitting to the global leaderboard…');
 const submit=()=>globalThis.GridRanked.call('word_submit',payload);
 submit().catch(()=>submit()).then(result=>{
   rememberRank(run,result.verified?'Accepted by the global leaderboard. Only your best score in each period is shown.':'The server did not verify this result.');
   if(screen==='leaderboard'&&boardMode===run.mode)renderScoreboard();
 }).catch(()=>{rememberRank(run,'The server could not accept this result. Your personal score is retained.');});
}
function finished(){
 stop();state.selected=[];rulesOpen=false;$('wrRules').hidden=true;$('wrDock').inert=false;
 persistRecord();
 if(state.won){
   // Ordinary Free Play rounds do not award credits. A future verified
   // Daily Challenge can award Club Credits separately.
   $('wrResultTitle').textContent=victoryTitle(state.mode);
   publishRank(state);
   $('wrResultText').textContent='You saved Gridda! '+(state.mode==='raft'?'You built ':'You stacked ')+(state.mode==='raft'?Math.min(24,state.blocks):state.blocks)+(state.mode==='raft'?' planks':' pieces of wreckage')+' using '+state.words.length+
     (state.words.length===1?' word':' words')+(state.mode==='raft'?' in '+Math.round(state.elapsedMs/1000)+' seconds':'')+'. Score: '+state.score+'.';
 }else{
   $('wrResultTitle').textContent=defeatTitle(state.mode);
   const count=state.mode==='raft'?Math.min(24,state.blocks):state.blocks;
   const material=state.mode==='raft'?(count===1?' plank':' planks'):(count===1?' piece of wreckage':' pieces of wreckage');
   $('wrResultText').textContent='You didn’t save Gridda. '+(state.mode==='raft'?'You built ':'You stacked ')+count+material+' using '+state.words.length+(state.words.length===1?' word':' words')+'. Score: '+state.score+'.';

 }
 $('wrResult').dataset.outcome=state.won?'won':'lost';
 $('wrResultBoard').hidden=!state.won;
 // Leave the former letter row free of result controls. Also ignore taps
 // still in flight when the rescue ends, including a rapid Build double-tap.
 resultReadyAt=performance.now()+RESULT_TAP_GUARD_MS;
 const finishedRun=state;
 $('wrResult').hidden=false;$('wrDock').hidden=true;
 $('wrTryAgain').disabled=true;
 if(typeof globalThis.setTimeout==='function')globalThis.setTimeout(()=>{
   if(state===finishedRun&&screen==='play'&&(state.won||state.expired))$('wrTryAgain').disabled=false;
 },RESULT_TAP_GUARD_MS);
 $('wrResultTitle').focus?.({preventScroll:true});
 save();
 $('wrWallet').textContent='◉ '+balance();
}
function tick(){
 if(!state||screen!=='play'||rulesOpen||state.won||state.expired||document.hidden)return;
 const now=performance.now(),delta=Math.max(0,Math.min(1000,Math.floor(now-lastTick)));
 lastTick+=delta;
 const previousCount=state.rack.filter(Boolean).length,previousWarning=engine.sinkWarning(state);
 engine.advance(state,delta);
 if(state.mode==='sinking')renderSinkWarning();
 if(state.mode==='raft')renderShark();
 if(state.expired||state.won){finished();render();return;}
 const second=Math.floor(state.elapsedMs/1000);
 if(second!==lastSecond){
   lastSecond=second;save();render();
   if(engine.sinkWarning(state)&&!previousWarning)message('Wreckage is drifting away!',false);
   if(previousCount>state.rack.filter(Boolean).length)message(state.rescueRules>=3?(state.sinkRules>=2?'Wreckage is sinking!':state.rack.filter(Boolean).length%2===0?'Wreckage is drifting away!':'Wreckage is sinking!'):'A letter sank. Complete a word to refill the tray.',false);
 }
}
function begin(mode,continueSaved=false){
 rankStarting=false;stop();
 if(!continueSaved){
   if(readState()&&!confirm('Start a new run? Your unfinished Word Rescue attempt will be replaced.'))return;
   state=engine.create(Date.now(),mode);
 }else {state=readState();if(state)unrank('A saved round was resumed.');}
 if(!state)return menu();

 if(typeof state.attemptId!=='string'||!state.attemptId)state.attemptId=makeAttempt();
 if(!Number.isInteger(state.reracks)||state.reracks<0)state.reracks=0;
 $('wrWallet').textContent='◉ '+balance();
 screen='play';$('wrMenu').hidden=true;$('wrPlay').hidden=false;$('wrLeaderboard').hidden=true;$('wrStats').hidden=true;
 $('wrResult').hidden=true;$('wrTryAgain').disabled=false;resultReadyAt=0;$('wrDock').hidden=false;$('wrRules').hidden=true;$('wrInfo').hidden=false;rulesOpen=false;firstRules=false;flash='';lastSecond=-1;
 state.started=seen(state.mode);
 $('wrModeTitle').textContent=modeName(state.mode);
 $('wrModeNote').textContent=state.mode==='sinking'?
   (state.sinkRules>=2?'Wreckage drifts away every 10 seconds until four letters remain.':'Wreckage drifts away every 7 seconds. Lost letter slots cannot be recovered.'):
   state.mode==='raft'?'Build from the island towards Gridda before the shark catches her.':
   'Stack the wreckage to stay above the water until the rescue boat arrives.';
 render();save();
 if(!seen(state.mode))showRules(true);else startTimer();
}
function back(){
 if(screen==='play'){if(rankStarting||state?.rankEligible&&!state.won)unrank();save();menu();}
 else if(screen==='leaderboard'||screen==='stats')menu();
 else homeScreen();
}
function message(text,error){
 flash=text;const box=$('wrMessage');box.textContent=text||' ';box.dataset.error=String(!!error);
}
function renderShark(){
 if(state.mode==='raft')$('wrShark').style.left=(94-75*engine.sharkProgress(state)).toFixed(3)+'%';
}
function situation(danger){
 if(state.won)return 'SAFE';
 if(state.expired)return 'CAUGHT';
 const phase=state.mode==='raft'?Math.min(1,state.blocks/24):engine.rescueProgress(state);
 const variant=Math.floor(state.elapsedMs/5000)%2;
 if(danger>=.86)return variant?'Hurry, Gridda!':'It’s not looking good!';
 if(danger>=.65)return variant?'Keep going!':'Danger rising!';
 if(phase>=.78)return variant?'Nearly there!':'Just a little longer';
 if(state.mode!=='raft'&&phase>=.22)return variant?'Help is on the way!':'There’s a boat on the horizon';
 return variant?'Keep building!':'Holding steady';
}
function render(){
 if(!state)return;
 const completed=state.won||state.expired;
 const danger=engine.dangerFraction(state);
 const scene=$('wrScene');
 scene.dataset.mode=state.mode==='raft'?'raft':'tower';
 const arrival=engine.rescueProgress(state);
 $('wrRescueBoat').setAttribute('data-visible',String(state.mode!=='raft'&&!state.expired&&(state.won||arrival>=.20)));
 scene.style.setProperty('--wrBoatRight',(-20+20*Math.min(1,Math.max(0,(arrival-.20)/.80))).toFixed(2)+'%');
 scene.style.setProperty('--wrBoatWidth',(12+32*Math.min(1,Math.max(0,(arrival-.20)/.80))).toFixed(2)+'cqw');
 scene.style.setProperty('--wrWater',engine.waterHeight(state)+'%');
 scene.dataset.danger=state.won?'won':state.expired?'lost':danger>=.90?'critical':danger>=.68?'alert':'safe';
 scene.dataset.panic=state.won||state.expired?'end':danger>=.92?'frantic':danger>=.78?'panicking':danger>=.48?'worried':'calm';
 scene.style.setProperty('--wrDanger',String(danger));
 scene.style.setProperty('--wrBuild',String(Math.min(24,state.blocks)));
 // The fixed jetty is at x=80%; the floating platform ends at x=26%.
 // Grow the bridge left from the jetty, closing that 54% gap at 24 planks.
 scene.style.setProperty('--wrRaftLength',(Math.min(24,state.blocks)/24*54).toFixed(3)+'cqw');
 scene.style.setProperty('--wrBodySpeed',(1.65-danger*1.22).toFixed(2)+'s');
 scene.style.setProperty('--wrArmSpeed',(1.20-danger*.88).toFixed(2)+'s');
 renderShark();
 $('wrBlocks').textContent=situation(danger);
 $('wrBlocks').classList.toggle('wrSafe',state.won);
 $('wrInfo').disabled=rulesOpen||rankStarting;
 $('wrFriend').hidden=state.mode!=='raft';$('wrFriend').disabled=completed||rulesOpen||rankStarting||state.friendHelp===true;
 $('wrFriend').textContent=state.friendHelp?'Friend lifeline used':'Call a friend · +10s · ◉ 10';
 $('wrScore').textContent=String(state.score);
 $('wrModeTitle').textContent=modeName(state.mode);
 $('wrProgress').style.width='0%';
 $('wrSea').style.height=engine.waterHeight(state)+'%';
 $('wrBuildNotice').textContent=state.mode==='raft'?(state.won?'Together at last!':'Make words. Bring the jetty to Gridda.'):(state.won?'The rescue boat is here!':state.expired?'The tide caught up.':(arrival>=.20?'Keep building until the boat reaches you.':'Stack the wreckage. Help is coming.'));
 const bricks=$('wrBricks'),count=Math.min(24,state.blocks);
 if(drawnBlocks!==count){
   bricks.replaceChildren();
   for(let i=0;i<count;i++){
     const brick=document.createElement('div');brick.className='wrBrick';bricks.append(brick);
   }
   drawnBlocks=count;
 }
 // Animation state is owned by the scene CSS; never replace the SVG avatar
 // on each timer tick, which would restart its animation.
 $('wrSceneLabel').textContent=state.won?'GRIDDA IS SAFE':state.expired?(state.mode==='raft'?'CAUGHT BY THE SHARK':'CAUGHT BY THE TIDE'):state.mode==='raft'?'SHARK APPROACHING':state.mode==='sinking'?'LETTERS SINKING':'RISING TIDE';
 renderLetters();
 $('wrWordHistory').textContent=state.words.length?
   'Words: '+state.words.slice(-7).map(x=>x.word).join(' · '):
   state.mode==='raft'?'Longer words build more planks. Reach shore before the shark.':
   'Longer words earn more points. Each letter adds one block.';
 $('wrResult').hidden=!completed;$('wrDock').hidden=completed; $('wrDock').dataset.mode=state.mode;
}
function renderSinkWarning(){
 const warning=engine.sinkWarning(state);
 for(let i=0;i<letterButtons.length;i++){
   const b=letterButtons[i],active=warning?.index===i;
   if(b.dataset.sinking!==String(active))b.dataset.sinking=String(active);
   if(active)b.style.setProperty('--wrSinkOpacity',String(1-.82*warning.progress));
 }
}
function renderLetters(){
 const completed=state.won||state.expired||rankStarting;
 const selected=state.selected.map(i=>state.rack[i]).join('');
 // Keep the chosen word in the action button itself, so the rack never shifts.
 const buildLabel=selected?'Build: '+selected:'Build with this word';
 if($('wrSubmit').textContent!==buildLabel)$('wrSubmit').textContent=buildLabel;
 if($('wrSelected').textContent!==selected)$('wrSelected').textContent=selected;
 // Never remove a button between a finger touching it and the resulting click.
 // Keep the seven original DOM nodes through every timer update and word.
 if(!letterButtons.length){
   for(let i=0;i<7;i++){
     const b=document.createElement('button');
     b.type='button';b.className='wrLetter';b.dataset.letterIndex=String(i);
     letterButtons.push(b);$('wrTray').append(b);
   }
 }
 for(let i=0;i<7;i++){
   const b=letterButtons[i],letter=state.rack[i],pressed=state.selected.includes(i);
   const value=letter||'·',disabled=completed||rulesOpen||!letter;
   if(b.textContent!==value)b.textContent=value;
   if(b.disabled!==disabled)b.disabled=disabled;
   const label=letter?'Letter '+letter+(pressed?', selected':''):'Empty letter slot';
   if(b.dataset.pressed!==String(pressed)){
     b.dataset.pressed=String(pressed);b.setAttribute('aria-pressed',String(pressed));
   }
   if(b.dataset.label!==label){b.dataset.label=label;b.setAttribute('aria-label',label);}
 }
 $('wrSubmit').disabled=completed||rulesOpen||state.selected.length<3;
 renderSinkWarning();
 $('wrBackspace').disabled=completed||rulesOpen||state.selected.length===0;
 $('wrClear').disabled=completed||rulesOpen||state.selected.length===0;
 $('wrRerack').disabled=completed||rulesOpen;
 const shuffleLabel=state.reracks>0?'↻ New letters · ◉ 5':'↻ New letters';
 if($('wrRerack').textContent!==shuffleLabel)$('wrRerack').textContent=shuffleLabel;
}
function submit(){
 if(!state||rulesOpen||rankStarting||state.won||state.expired)return;
 const indices=state.selected.slice();
 const result=engine.submit(state);
 if(!result.ok){message(result.reason,true);return;}
 if(state.rankEligible)state.rankEvents.push({type:'word',at:state.elapsedMs,indices});
 message(result.word+' · +'+result.blocks+(state.mode==='raft'?' planks':' blocks')+' · +'+result.points+' points',false);
 if(result.won)finished();
 else{save();}
 render();
}
function callFriend(){
 if(!state||rulesOpen||rankStarting||state.won||state.expired||state.mode!=='raft'||state.friendHelp)return;
 const next=JSON.parse(JSON.stringify(state));
 if(!engine.callFriend(next))return;
 if(!globalThis.GridClubCredits?.spend?.(10,'word-friend',state.attemptId)){
   message('You need 10 Club Credits to call a friend.',true);return;
 }
 state=next;unrank('The friend lifeline was used.');
 save();$('wrWallet').textContent='◉ '+balance();
 render();message('A friend distracts the shark! +10 seconds',false);
}
function rerack(){
 if(!state||rulesOpen||rankStarting||state.won||state.expired)return;
 const paid=state.reracks>0;
 // Prepare a new rack without modifying the live state until payment succeeds.
 const next=JSON.parse(JSON.stringify(state));
 if(!engine.rerack(next))return;
 if(paid&&!globalThis.GridClubCredits?.spend?.(RERACK_COST,'word-rerack',state.attemptId)){
   message(balance()<RERACK_COST?'You need 5 Club Credits for new letters.':'Could not spend credits. Please try again.',true);
   return;
 }
 next.reracks=(state.reracks||0)+1;state=next;
 if(paid&&state.rankEligible){unrank('A paid reshuffle was used.');}
 else if(state.rankEligible)state.rankEvents.push({type:'shuffle',at:state.elapsedMs});
 save();$('wrWallet').textContent='◉ '+balance();
 renderLetters();message(paid?'New letters · 5 credits used':'New letters',false);
}
$('wrEntry').onclick=open;
$('wrBack').onclick=back;
$('wrNewTide').onclick=()=>begin('tide');
$('wrNewSinking').onclick=()=>begin('sinking');
$('wrNewRaft').onclick=()=>begin('raft');
$('wrContinue').onclick=()=>begin('tide',true);
$('wrTryAgain').onclick=()=>{if(screen!=='play'||!state||!(state.won||state.expired)||performance.now()<resultReadyAt)return;safeDel(KEY);begin(state.mode);};
$('wrResultModes').onclick=menu;
$('wrBoardEntry').onclick=()=>showScoreboard();
$('wrBoardRefresh').onclick=renderScoreboard;
$('wrStatsEntry').onclick=showStats;
for(const [id,value] of [['wrStatsAll','all'],['wrStatsTide','tide'],['wrStatsRaft','raft'],['wrStatsSinking','sinking']])$(id).onclick=()=>{statsMode=value;renderPersonalStats();};
$('wrResultBoard').onclick=()=>showScoreboard(state.mode);
for(const [id,value] of [['wrBoardTide','tide'],['wrBoardRaft','raft'],['wrBoardSinking','sinking']])$(id).onclick=()=>{boardMode=value;renderScoreboard();};
for(const [id,value] of [['wrBoardDay','day'],['wrBoardMonth','month'],['wrBoardAll','all']])$(id).onclick=()=>{boardPeriod=value;renderScoreboard();};
$('wrInfo').onclick=()=>showRules(false);
$('wrRulesPlay').onclick=closeRules;
$('wrRulesBack').onclick=back;
// Select on contact on the fixed letter tray, not on the delayed mobile click.
// Cancel the compatibility click; preserve keyboard and mouse activation.
let lastTouchButton=null,lastTouchAt=-Infinity;
function activateLetter(btn){
 if(!btn||btn.disabled||!state||rulesOpen||rankStarting||screen!=='play'||state.won||state.expired)return false;
 if(engine.select(state,Number(btn.dataset.letterIndex))){if(flash)message('',false);renderLetters();return true;}
 return false;
}
$('wrTray').addEventListener('touchstart',event=>{
 if(event.touches&&event.touches.length!==1)return;
 const btn=event.target.closest('[data-letter-index]');
 if(!btn||btn.disabled)return;
 if(event.cancelable)event.preventDefault();
 lastTouchButton=btn;lastTouchAt=performance.now();
 activateLetter(btn);
},{passive:false});
$('wrTray').addEventListener('click',event=>{
 const btn=event.target.closest('[data-letter-index]');
 if(event.detail>0&&btn===lastTouchButton&&performance.now()-lastTouchAt<800)return;
 activateLetter(btn);
});
$('wrSubmit').onclick=submit;
$('wrBackspace').onclick=()=>{if(!state||rulesOpen||state.won||state.expired)return;engine.removeLast(state);renderLetters();};
$('wrClear').onclick=()=>{if(!state||rulesOpen||rankStarting||state.won||state.expired)return;state.selected=[];renderLetters();};
$('wrRerack').onclick=rerack;
$('wrFriend').onclick=callFriend;
document.addEventListener('keydown',event=>{
 if(root.hidden||screen!=='play'||!state||rankStarting||state.won||state.expired)return;
 if(rulesOpen){if(event.key==='Escape'){event.preventDefault();if(firstRules)back();else closeRules();}return;}
 if(event.key==='Enter'){event.preventDefault();submit();}
 if(event.key==='Backspace'){event.preventDefault();engine.removeLast(state);renderLetters();}
 if(event.key==='Escape'){back();}
});
document.addEventListener('visibilitychange',()=>{
 if(root.hidden||screen!=='play'||!state)return;
 if(document.hidden){if(state.won||state.expired)return;if(rankStarting||state.rankEligible){unrank('The game was backgrounded during the round.');$('wrDock').inert=false;}if(lastTick&&!rulesOpen&&!(state.won||state.expired))engine.advance(state,Math.max(0,Math.min(1000,performance.now()-lastTick)));stop();if(state.expired||state.won){finished();render();}else save();}
 else if(!state.won&&!state.expired&&!rulesOpen){startTimer();render();}
});
window.addEventListener('pagehide',()=>{if(rankStarting||state?.rankEligible&&!state.won)unrank('The game was closed during the round.');save();stop();});
globalThis.WordRescueApp=Object.freeze({open,menu,begin,back,readState:readState});
})();