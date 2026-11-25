/* Grid Club Word Rescue v0.9.30 · full word list, animated rescue, waterline clock. */
(function(){
'use strict';
const engine=globalThis.GridClubWordRescueEngine;
const $=id=>document.getElementById(id);
const root=$('wordRescueScreen'),home=$('home');
if(!engine||!root||!home||!$('wrEntry'))return;
const KEY='gridclub-word-rescue-alpha-v1',STATS_KEY='gridclub-word-rescue-records-v1';
let state=null,screen='menu',timer=null,lastTick=0,lastSecond=-1,flash='';
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
function modeName(mode){return mode==='sinking'?'Sinking Letters':'Rising Tide';}
function menu(){
 stop();screen='menu';$('wrMenu').hidden=false;$('wrPlay').hidden=true;
 const saved=readState();$('wrContinue').hidden=!saved;
 ensureDictionary();
 if(saved)$('wrContinueLabel').textContent='Continue '+modeName(saved.mode)+' · '+formatMs(saved.elapsedMs)+' played';
 $('wrWallet').textContent='◉ '+balance();
 const best=records();
 $('wrBest').textContent=['tide','sinking'].map(mode=>best[mode]?'Best '+modeName(mode)+': '+best[mode].seconds+'s':'').filter(Boolean).join(' · ')||
   'Two trial modes · no ranked leaderboard yet';
}
function homeScreen(){save();stop();root.hidden=true;home.hidden=false;}
function open(){
 home.hidden=true;root.hidden=false;menu();
}
function persistRecord(){
 const previous=records(),time=Math.round(state.elapsedMs/1000),mode=state.mode;
 if(!previous[mode]||time<previous[mode].seconds){
   previous[mode]={seconds:time,score:state.score,words:state.words.length};
   safeSave(STATS_KEY,previous);
 }
}
function finished(){
 stop();state.selected=[];
 if(state.won){
   persistRecord();
   // Ordinary Free Play rounds do not award credits. A future verified
   // Daily Challenge can award Club Credits separately.
   $('wrResultTitle').textContent='Safe at last!';
   $('wrResultText').textContent='You built '+state.blocks+' blocks using '+state.words.length+
     ' words in '+Math.round(state.elapsedMs/1000)+' seconds. Score: '+state.score+'. '+
     'Prototype results are saved on this device.';
 }else{
   $('wrResultTitle').textContent='The water caught up!';
   $('wrResultText').textContent='You built '+state.blocks+' of 24 blocks. Try quicker words or a different letter combination.';
 }
 $('wrResult').hidden=false;
 save();
 $('wrWallet').textContent='◉ '+balance();
}
function tick(){
 if(!state||screen!=='play'||state.won||state.expired||document.hidden)return;
 const now=performance.now(),delta=Math.max(0,Math.min(1000,now-lastTick));
 lastTick=now;
 const previousCount=state.rack.filter(Boolean).length;
 engine.advance(state,delta);
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
 screen='play';$('wrMenu').hidden=true;$('wrPlay').hidden=false;
 $('wrResult').hidden=true;flash='';lastSecond=-1;
 state.started=true;
 $('wrModeTitle').textContent=modeName(state.mode);
 $('wrModeNote').textContent=state.mode==='sinking'?
   'A letter sinks every 7 seconds. Submitting a word replenishes your tray.':
   'The water rises steadily. Keep building to stay ahead of the shark.';
 lastTick=performance.now();
 render();save();
 timer=setInterval(tick,125);
}
function back(){
 if(screen==='play'){save();menu();}
 else homeScreen();
}
function message(text,error){
 flash=text;const box=$('wrMessage');box.textContent=text||' ';box.dataset.error=String(!!error);
}
function render(){
 if(!state)return;
 const completed=state.won||state.expired;
 $('wrTime').textContent=formatMs(state.elapsedMs);
 const danger=engine.waterHeight(state)/Math.max(1,engine.safeHeight(state));
 $('wrTime').classList.toggle('warning',danger>=.8);
 $('wrScene').dataset.danger=state.won?'won':state.expired?'lost':danger>=.88?'critical':danger>=.7?'alert':'safe';
 $('wrBlocks').textContent=Math.min(24,state.blocks)+'/24';
 $('wrScore').textContent=String(state.score);
 $('wrModeTitle').textContent=modeName(state.mode);
 $('wrProgress').style.width=Math.min(100,state.blocks/24*100)+'%';
 $('wrSea').style.height=engine.waterHeight(state)+'%';
 const bricks=$('wrBricks');bricks.replaceChildren();
 for(let i=0;i<Math.min(24,state.blocks);i++){
   const brick=document.createElement('div');brick.className='wrBrick';bricks.append(brick);
 }
 // Animation state is owned by the scene CSS; never replace the SVG avatar
 // on each timer tick, which would restart its animation.
 $('wrSceneLabel').textContent=state.mode==='sinking'?'LETTERS SINKING':'SHARK ESCAPE';
 const selected=state.selected.map(i=>state.rack[i]).join('');
 const preview=$('wrSelected');preview.replaceChildren();
 if(selected){preview.textContent=selected;}
 else{const hint=document.createElement('small');hint.textContent='Tap letters to make a word';preview.append(hint);}
 $('wrTray').replaceChildren();
 for(let i=0;i<7;i++){
   const b=document.createElement('button'),letter=state.rack[i];
   b.type='button';b.className='wrLetter';b.textContent=letter||'·';
   b.dataset.letterIndex=String(i);b.disabled=completed||!letter;
   b.setAttribute('aria-pressed',String(state.selected.includes(i)));
   b.setAttribute('aria-label',letter?'Letter '+letter+(state.selected.includes(i)?', selected':''):'Empty letter slot');
   $('wrTray').append(b);
 }
 $('wrSubmit').disabled=completed||state.selected.length<3;
 $('wrBackspace').disabled=completed||state.selected.length===0;
 $('wrRerack').disabled=completed;
 $('wrWordHistory').textContent=state.words.length?
   'Words: '+state.words.slice(-7).map(x=>x.word).join(' · '):
   'Longer words earn more points. Each letter adds one block.';
 $('wrResult').hidden=!completed;
}
function submit(){
 if(!state||state.won||state.expired)return;
 const result=engine.submit(state);
 if(!result.ok){message(result.reason,true);return;}
 message(result.word+' · +'+result.blocks+' blocks · +'+result.points+' points',false);
 if(result.won)finished();
 else{save();}
 render();
}
function rerack(){
 if(!state||state.won||state.expired)return;
 // Reracking should not permit unlimited free vocabulary fishing during a
 // time trial. A six-second cost is applied in both modes.
 if(engine.rerack(state)){
   engine.advance(state,6000);
   if(state.expired)finished();else save();
   render();message(state.expired?'Time ran out while reshuffling.':'New letters · 6 seconds used',state.expired);
 }
}
$('wrEntry').onclick=open;
$('wrBack').onclick=back;
$('wrNewTide').onclick=()=>begin('tide');
$('wrNewSinking').onclick=()=>begin('sinking');
$('wrContinue').onclick=()=>begin('tide',true);
$('wrWordBack').onclick=back;
$('wrTryAgain').onclick=()=>{safeDel(KEY);begin(state?.mode||'tide');};
$('wrTray').addEventListener('click',event=>{
 const btn=event.target.closest('[data-letter-index]');if(!btn||!state||screen!=='play')return;
 if(engine.select(state,Number(btn.dataset.letterIndex))){message('',false);render();save();}
});
$('wrSubmit').onclick=submit;
$('wrBackspace').onclick=()=>{if(!state)return;engine.removeLast(state);render();save();};
$('wrRerack').onclick=rerack;
document.addEventListener('keydown',event=>{
 if(root.hidden||screen!=='play'||!state||state.won||state.expired)return;
 if(event.key==='Enter'){event.preventDefault();submit();}
 if(event.key==='Backspace'){event.preventDefault();engine.removeLast(state);render();}
 if(event.key==='Escape'){back();}
});
document.addEventListener('visibilitychange',()=>{
 if(root.hidden||screen!=='play'||!state)return;
 if(document.hidden){if(lastTick&&!(state.won||state.expired))engine.advance(state,Math.max(0,Math.min(1000,performance.now()-lastTick)));stop();save();}
 else if(!state.won&&!state.expired){lastTick=performance.now();timer=setInterval(tick,125);render();}
});
window.addEventListener('pagehide',()=>{save();stop();});
globalThis.WordRescueApp=Object.freeze({open,menu,begin,back,readState:readState});
})();