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
  // Older v0.9.30 unfinished runs may be saved with no available vowel.
  // Repair only the letter rack; keep their tower, score and elapsed time.
  if(engine.ensureVowel(s))safeSave(KEY,s);
  return s;
 }catch(_){return null;}};
const balance=()=>globalThis.GridClubCredits?.balance?.()||0;
const RERACK_COST=5;
const SCORE_KEY='gridclub-word-rescue-scores-v1';
let boardMode='tide',boardPeriod='day';
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
 tide:['Raise Gridda up by making words','Hurry — the tide is rising!','Build 24 blocks before the water reaches Gridda.'],
 raft:['Build towards Gridda by making words','Hurry — the shark is approaching!','Build 24 planks out from the island to reach Gridda before the shark catches her.'],
 sinking:['Raise Gridda up by making words','Hurry — the tide is rising and letters are sinking!','Build 24 blocks before the tide catches Gridda. One letter disappears every 7 seconds, but the last vowel is protected.']
};
function seen(mode){return rulesSeen.has(mode)||safeGet(RULES_KEY+':'+mode)==='true';}
function startTimer(){if(!state||state.won||state.expired||rulesOpen||document.hidden||timer!==null)return;lastTick=performance.now();timer=setInterval(tick,125);}
function showRules(first=false){
 if(!state||state.won||state.expired||rulesOpen)return;
 stop();rulesOpen=true;firstRules=first;
 const [lead,warning,detail]=RULES[state.mode];
 $('wrRulesMode').textContent=modeName(state.mode);
 $('wrRulesLead').textContent=lead;$('wrRulesWarning').textContent=warning;
 $('wrRulesDetail').textContent=detail;$('wrRulesDetails').hidden=first;
 $('wrRulesPlay').textContent=first?'Play':'Continue';$('wrRules').hidden=false;
 $('wrDock').inert=true;render();$('wrRulesPlay').focus?.();
}
function closeRules(){
 if(!rulesOpen)return;
 if(firstRules){rulesSeen.add(state.mode);safeSave(RULES_KEY+':'+state.mode,true);}
 rulesOpen=false;firstRules=false;$('wrRules').hidden=true;$('wrDock').inert=false;
 state.started=true;render();save();startTimer();
}
function menu(){
 rulesOpen=false;firstRules=false;$('wrRules').hidden=true;$('wrDock').inert=false;$('wrInfo').hidden=true;
 stop();screen='menu';$('wrMenu').hidden=false;$('wrPlay').hidden=true;$('wrLeaderboard').hidden=true;
 const saved=readState();$('wrContinue').hidden=!saved;
 ensureDictionary();
 if(saved)$('wrContinueLabel').textContent='Continue '+modeName(saved.mode)+' · '+formatMs(saved.elapsedMs)+' played';
 $('wrWallet').textContent='◉ '+balance();
 const best=records();
 $('wrBest').textContent=['tide','raft','sinking'].map(mode=>best[mode]?'Best '+modeName(mode)+': '+best[mode].seconds+'s':'').filter(Boolean).join(' · ')||
   'Complete a rescue to set your first personal best.';
}
function homeScreen(){save();stop();root.hidden=true;home.hidden=false;}
function open(){
 home.hidden=true;root.hidden=false;menu();
}
function scoreHistory(){
 try{const items=JSON.parse(safeGet(SCORE_KEY)||'[]');return Array.isArray(items)?items.filter(x=>x&&typeof x.id==='string'&&['tide','raft','sinking'].includes(x.mode)&&Number.isFinite(x.score)&&Number.isFinite(x.ms)&&Number.isFinite(x.at)):[];}catch(_){return [];}
}
function scoreRows(mode,period,now=Date.now()){
 const date=new Date(now).toISOString().slice(0,10);
 return scoreHistory().filter(x=>{
   if(x.mode!==mode)return false;
   const completed=new Date(x.at).toISOString().slice(0,10);
   return period==='all'||(period==='day'?completed===date:completed.slice(0,7)===date.slice(0,7));
 }).sort((a,b)=>b.score-a.score||a.ms-b.ms||a.at-b.at).slice(0,10);
}
function renderScoreboard(){
 for(const [id,value] of [['wrBoardTide','tide'],['wrBoardRaft','raft'],['wrBoardSinking','sinking']]){
   $(id).setAttribute('aria-pressed',String(boardMode===value));
 }
 for(const [id,value] of [['wrBoardDay','day'],['wrBoardMonth','month'],['wrBoardAll','all']]){
   $(id).setAttribute('aria-pressed',String(boardPeriod===value));
 }
 const list=$('wrBoardRows');list.replaceChildren();
 const rows=scoreRows(boardMode,boardPeriod);
 $('wrBoardEmpty').hidden=rows.length>0;
 for(const [i,row] of rows.entries()){
   const tr=document.createElement('tr');
   for(const value of [String(i+1),String(row.score),(row.ms/1000).toFixed(1)+'s',new Date(row.at).toISOString().slice(0,10)]){
     const td=document.createElement('td');td.textContent=value;tr.append(td);
   }
   list.append(tr);
 }
}
function showScoreboard(mode=boardMode){
 if(screen==='play')save();
 stop();screen='leaderboard';boardMode=mode;
 $('wrMenu').hidden=true;$('wrPlay').hidden=true;$('wrLeaderboard').hidden=false;$('wrInfo').hidden=true;
 renderScoreboard();
}
function persistRecord(){
 const entries=scoreHistory();
 if(!entries.some(x=>x.id===state.attemptId)){
   entries.push({id:state.attemptId,mode:state.mode,score:state.score,ms:state.elapsedMs,at:Date.now(),reracks:state.reracks||0});
   safeSave(SCORE_KEY,entries);
 }
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
function finished(){
 stop();state.selected=[];rulesOpen=false;$('wrRules').hidden=true;$('wrDock').inert=false;
 if(state.won){
   persistRecord();
   // Ordinary Free Play rounds do not award credits. A future verified
   // Daily Challenge can award Club Credits separately.
   $('wrResultTitle').textContent=victoryTitle(state.mode);
   $('wrResultText').textContent='You built '+Math.min(24,state.blocks)+(state.mode==='raft'?' planks':' blocks')+' using '+state.words.length+
     ' words in '+Math.round(state.elapsedMs/1000)+' seconds. Score: '+state.score+'. '+
     'Results saved.';
 }else{
   $('wrResultTitle').textContent=defeatTitle(state.mode);
   $('wrResultText').textContent='You built '+state.blocks+' of 24 '+(state.mode==='raft'?'planks':'blocks')+'. Try quicker words or a different letter combination.';
 }
 $('wrResult').dataset.outcome=state.won?'won':'lost';
 $('wrResultBoard').hidden=!state.won;
 $('wrResult').hidden=false;$('wrDock').hidden=true;$('wrTryAgain').focus?.();
 save();
 $('wrWallet').textContent='◉ '+balance();
}
function tick(){
 if(!state||screen!=='play'||rulesOpen||state.won||state.expired||document.hidden)return;
 const now=performance.now(),delta=Math.max(0,Math.min(1000,now-lastTick));
 lastTick=now;
 const previousCount=state.rack.filter(Boolean).length;
 engine.advance(state,delta);
 if(state.mode==='raft')renderShark();
 if(state.expired){finished();render();return;}
 const second=Math.floor(state.elapsedMs/1000);
 if(second!==lastSecond){
   lastSecond=second;save();render();
   if(previousCount>state.rack.filter(Boolean).length)message('A letter sank. Complete a word to refill the tray.',false);
 }
}
function begin(mode,continueSaved=false){
 stop();
 if(!continueSaved){
   if(readState()&&!confirm('Start a new run? Your unfinished Word Rescue attempt will be replaced.'))return;
   state=engine.create(Date.now(),mode);
 }else state=readState();
 if(!state)return menu();
 if(typeof state.attemptId!=='string'||!state.attemptId)state.attemptId=makeAttempt();
 if(!Number.isInteger(state.reracks)||state.reracks<0)state.reracks=0;
 $('wrWallet').textContent='◉ '+balance();
 screen='play';$('wrMenu').hidden=true;$('wrPlay').hidden=false;$('wrLeaderboard').hidden=true;
 $('wrResult').hidden=true;$('wrDock').hidden=false;$('wrRules').hidden=true;$('wrInfo').hidden=false;rulesOpen=false;firstRules=false;flash='';lastSecond=-1;
 state.started=seen(state.mode);
 $('wrModeTitle').textContent=modeName(state.mode);
 $('wrModeNote').textContent=state.mode==='sinking'?
   'A letter sinks every 7 seconds. Keep building above the rising tide.':
   state.mode==='raft'?'Build from the island towards Gridda before the shark catches her.':
   'The rising water is the danger. Build upwards to stay dry.';
 render();save();
 if(!seen(state.mode))showRules(true);else startTimer();
}
function back(){
 if(screen==='play'){save();menu();}
 else if(screen==='leaderboard')menu();
 else homeScreen();
}
function message(text,error){
 flash=text;const box=$('wrMessage');box.textContent=text||' ';box.dataset.error=String(!!error);
}
function renderShark(){
 if(state.mode==='raft')$('wrShark').style.left=(94-75*engine.sharkProgress(state)).toFixed(3)+'%';
}
function render(){
 if(!state)return;
 const completed=state.won||state.expired;
 const danger=engine.dangerFraction(state);
 const scene=$('wrScene');
 scene.dataset.mode=state.mode==='raft'?'raft':'tower';
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
 const remaining=Math.max(0,24-state.blocks);
 $('wrBlocks').textContent=state.won?'SAFE':state.expired?'CAUGHT':remaining+' '+(state.mode==='raft'?(remaining===1?'plank':'planks'):(remaining===1?'block':'blocks'))+' to safety';
 $('wrBlocks').classList.toggle('wrSafe',state.won);
 $('wrInfo').disabled=completed||rulesOpen;
 $('wrScore').textContent=String(state.score);
 $('wrModeTitle').textContent=modeName(state.mode);
 $('wrProgress').style.width=Math.min(100,state.blocks/24*100)+'%';
 $('wrSea').style.height=engine.waterHeight(state)+'%';
 $('wrBuildNotice').textContent=state.mode==='raft'?(state.won?'Together at last!':'Make words. Bring the jetty to Gridda.'):'Make words. Build higher.';
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
 $('wrResult').hidden=!completed;$('wrDock').hidden=completed;
}
function renderLetters(){
 const completed=state.won||state.expired;
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
 $('wrBackspace').disabled=completed||rulesOpen||state.selected.length===0;
 $('wrRerack').disabled=completed||rulesOpen;
 const shuffleLabel=state.reracks>0?'↻ New letters · ◉ 5':'↻ New letters';
 if($('wrRerack').textContent!==shuffleLabel)$('wrRerack').textContent=shuffleLabel;
}
function submit(){
 if(!state||rulesOpen||state.won||state.expired)return;
 const result=engine.submit(state);
 if(!result.ok){message(result.reason,true);return;}
 message(result.word+' · +'+result.blocks+(state.mode==='raft'?' planks':' blocks')+' · +'+result.points+' points',false);
 if(result.won)finished();
 else{save();}
 render();
}
function rerack(){
 if(!state||rulesOpen||state.won||state.expired)return;
 const paid=state.reracks>0;
 // Prepare a new rack without modifying the live state until payment succeeds.
 const next=JSON.parse(JSON.stringify(state));
 if(!engine.rerack(next))return;
 if(paid&&!globalThis.GridClubCredits?.spend?.(RERACK_COST,'word-rerack',state.attemptId)){
   message(balance()<RERACK_COST?'You need 5 Club Credits for new letters.':'Could not spend credits. Please try again.',true);
   return;
 }
 next.reracks=(state.reracks||0)+1;state=next;
 save();$('wrWallet').textContent='◉ '+balance();
 renderLetters();message(paid?'New letters · 5 credits used':'New letters',false);
}
$('wrEntry').onclick=open;
$('wrBack').onclick=back;
$('wrNewTide').onclick=()=>begin('tide');
$('wrNewSinking').onclick=()=>begin('sinking');
$('wrNewRaft').onclick=()=>begin('raft');
$('wrContinue').onclick=()=>begin('tide',true);
$('wrWordBack').onclick=back;
$('wrTryAgain').onclick=()=>{safeDel(KEY);begin(state?.mode||'tide');};
$('wrResultModes').onclick=menu;
$('wrBoardEntry').onclick=()=>showScoreboard();
$('wrResultBoard').onclick=()=>showScoreboard(state.mode);
for(const [id,value] of [['wrBoardTide','tide'],['wrBoardRaft','raft'],['wrBoardSinking','sinking']])$(id).onclick=()=>{boardMode=value;renderScoreboard();};
for(const [id,value] of [['wrBoardDay','day'],['wrBoardMonth','month'],['wrBoardAll','all']])$(id).onclick=()=>{boardPeriod=value;renderScoreboard();};
$('wrInfo').onclick=()=>showRules(false);
$('wrRulesPlay').onclick=closeRules;
$('wrRulesBack').onclick=back;
$('wrTray').addEventListener('click',event=>{
 const btn=event.target.closest('[data-letter-index]');if(!btn||btn.disabled||!state||rulesOpen||screen!=='play')return;
 if(engine.select(state,Number(btn.dataset.letterIndex))){if(flash)message('',false);renderLetters();}
 // Selection is persisted by the existing once-per-second tick, Back and pagehide.
});
$('wrSubmit').onclick=submit;
$('wrBackspace').onclick=()=>{if(!state||rulesOpen||state.won||state.expired)return;engine.removeLast(state);renderLetters();};
$('wrRerack').onclick=rerack;
document.addEventListener('keydown',event=>{
 if(root.hidden||screen!=='play'||!state||state.won||state.expired)return;
 if(rulesOpen){if(event.key==='Escape'){event.preventDefault();if(firstRules)back();else closeRules();}return;}
 if(event.key==='Enter'){event.preventDefault();submit();}
 if(event.key==='Backspace'){event.preventDefault();engine.removeLast(state);renderLetters();}
 if(event.key==='Escape'){back();}
});
document.addEventListener('visibilitychange',()=>{
 if(root.hidden||screen!=='play'||!state)return;
 if(document.hidden){if(lastTick&&!rulesOpen&&!(state.won||state.expired))engine.advance(state,Math.max(0,Math.min(1000,performance.now()-lastTick)));stop();if(state.expired){finished();render();}else save();}
 else if(!state.won&&!state.expired&&!rulesOpen){startTimer();render();}
});
window.addEventListener('pagehide',()=>{save();stop();});
globalThis.WordRescueApp=Object.freeze({open,menu,begin,back,readState:readState});
})();