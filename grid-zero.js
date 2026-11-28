/* Zero Down, local progress only. Internal storage keys retained. */
(function(){
'use strict';
const E=globalThis.GridZeroEngine,$=id=>document.getElementById(id),root=$('gridZeroScreen'),home=$('home');
if(!E||!root)return;
const KEY='gridclub-gridzero-v1',read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch(_){return null;}};
const modes=Object.keys(E.DIFFICULTIES),label=k=>k[0].toUpperCase()+k.slice(1);
let difficulty='beginner',puzzle=null,state=null,selected=0,elapsed=0,restarts=0,timer=null,started=null,screen='menu',best={};
const bestKey=()=>puzzle?.version===2?'v2:'+puzzle.difficulty:puzzle?.difficulty||difficulty;
function seed(){return (Date.now()^Math.floor(Math.random()*4294967296))>>>0||1;}
const now=()=>performance.now(),time=()=>Math.max(0,elapsed+(started===null?0:now()-started));
const fmt=ms=>{const s=Math.floor(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
function save(){try{localStorage.setItem(KEY,JSON.stringify({version:3,difficulty,seed:puzzle?.seed??null,puzzleVersion:puzzle?.version??null,puzzleDifficulty:puzzle?.difficulty??null,traySize:puzzle?.traySize??null,state,elapsed:Math.round(time()),restarts,best}));}catch(_){}}
function clock(){ $('gzTime').textContent=fmt(time()); }
function stop(){if(started!==null){elapsed=time();started=null;}if(timer!==null){clearInterval(timer);timer=null;}clock();}
function run(){if(started!==null||screen!=='play'||root.hidden||document.hidden||E.status(state)!=='playing')return;started=now();timer=setInterval(()=>{clock();},250);}
function route(which){screen=which;$('gzMenu').hidden=which!=='menu';$('gzPlay').hidden=which!=='play';}
function restore(){const x=read();if(!x||![1,2,3].includes(x.version))return;
 if(x.version===1){best=Object.fromEntries(Object.entries(x.best||{}).map(([k,v])=>['legacy:'+k,v]));difficulty='beginner';}
 else{best=x.best&&typeof x.best==='object'?x.best:{};if(x.version===2)best=Object.fromEntries(Object.entries(best).map(([k,v])=>[modes.includes(k)?'v2:'+k:k,v]));difficulty=modes.includes(x.difficulty)?x.difficulty:'beginner';}
 if(!Number.isInteger(x.seed)||x.version===1||x.puzzleVersion===1)return;
 let p;try{p=x.puzzleVersion===2||x.version===2?E.version2(x.seed,x.puzzleDifficulty||difficulty):E.generate(x.seed,x.puzzleDifficulty||difficulty);}catch(_){return;}
 if(!E.valid(p,x.state))return;puzzle=p;state=x.state;elapsed=Math.max(0,Number(x.elapsed)||0);restarts=Math.max(0,Math.floor(Number(x.restarts)||0));selected=Math.max(0,state.tray.findIndex(v=>v!==null));}
function menu(){stop();save();route('menu');for(const n of modes)$('gzChoice'+label(n)).setAttribute('aria-pressed',String(n===difficulty));$('gzContinue').hidden=!puzzle||E.status(state)==='won';$('gzContinue').textContent='Continue last puzzle ›';}
function open(){home.hidden=true;root.hidden=false;menu();}
function begin(mode=difficulty){if(!modes.includes(mode))return;if(puzzle&&state&&E.status(state)==='playing'&&state.moves&&!confirm('Replace your current Zero Down puzzle?'))return;stop();difficulty=mode;puzzle=E.generate(seed(),mode);state=E.fresh(puzzle);selected=0;elapsed=0;restarts=0;route('play');render();run();save();}
function resume(){if(!puzzle)return;route('play');render();run();save();}
function restart(){if(!puzzle)return;if(E.status(state)==='playing'&&state.moves&&!confirm('Restart this puzzle? Your stopwatch will keep its elapsed time.'))return;stop();state=E.fresh(puzzle);selected=0;restarts++;render();run();save();}
function choose(n){if(!modes.includes(n)||n===difficulty)return;difficulty=n;menu();}
function back(){if(screen==='play'){menu();return;}stop();save();root.hidden=true;home.hidden=false;}
function tile(value,index,kind){const el=document.createElement('button');el.type='button';el.className=kind;el.textContent=value===null?'·':String(value);el.dataset.index=String(index);return el;}
function render(){
 if(!puzzle||!state)return;const status=E.status(state),won=status==='won',stuck=status==='stuck',locked=state.cells.filter(n=>n===0).length;
 if(state.tray[selected]===null)selected=Math.max(0,state.tray.findIndex(v=>v!==null));
 const size=puzzle.traySize,active=state.tray[selected];$('gzDifficulty').textContent=label(puzzle.difficulty);$('gzTrayLabel').textContent=size===1?'Place this number':'Select a number';$('gzSecured').textContent=locked+'/9';$('gzRemaining').textContent=String(E.remaining(puzzle,state));$('gzRestarts').textContent=String(restarts);clock();
 $('gzBoard').replaceChildren();state.cells.forEach((n,i)=>{const b=tile(n,i,'gzCell');b.classList.toggle('gzLocked',n===0);b.classList.toggle('gzExact',n>0&&active===n);b.disabled=status!=='playing'||n===0||active===null||n<active;b.setAttribute('aria-label','Square '+(i+1)+', '+(n===0?'secured':n+' remaining'));b.onclick=()=>{if(!E.place(puzzle,state,selected,i))return;const next=E.status(state);if(next!=='playing'){stop();if(next==='won'&&(best[bestKey()]===undefined||elapsed<best[bestKey()]))best[bestKey()]=Math.round(elapsed);}save();render();};$('gzBoard').append(b);});
 $('gzTray').replaceChildren();$('gzTray').style.setProperty('--gz-tray',String(size));state.tray.forEach((n,i)=>{const b=tile(n,i,'gzNumber');b.disabled=n===null||status!=='playing';b.setAttribute('aria-pressed',String(i===selected));b.setAttribute('aria-label',n===null?'Empty tray slot':'Select '+n);b.onclick=()=>{selected=i;render();};$('gzTray').append(b);});
 $('gzQueue').replaceChildren();for(let i=0;i<E.PREVIEW;i++){const el=document.createElement('span');el.className='gzIncoming';el.textContent=puzzle.numbers[state.cursor+i]??'·';$('gzQueue').append(el);}
 $('gzMessage').textContent=won?'Grid secured!':stuck?'No valid placements remain. Restart to try again.':size===1?'Choose a square to subtract '+active+'.':'Choose a number, then choose a square.';
 $('gzMessage').dataset.outcome=status;$('gzMessage').hidden=status!=='playing';$('gzPlayControls').hidden=status!=='playing';$('gzRestartCount').hidden=status!=='playing';$('gzResult').hidden=status==='playing';$('gzResult').dataset.outcome=status;$('gzResultTitle').textContent=won?'Grid secured!':'No moves left';$('gzResultText').textContent=locked+'/9 squares secured · '+fmt(time())+' · '+restarts+' restart'+(restarts===1?'':'s');$('gzResultRestart').className=won?'gzSecondary':'gzPrimary';$('gzResultNext').className=won?'gzPrimary':'gzSecondary';
}
$('gzEntry').onclick=open;$('gzBack').onclick=back;$('gzStart').onclick=()=>begin(difficulty);$('gzContinue').onclick=resume;$('gzRestart').onclick=restart;$('gzNew').onclick=()=>begin(puzzle?.difficulty||difficulty);$('gzResultNext').onclick=()=>begin(puzzle?.difficulty||difficulty);$('gzResultRestart').onclick=restart;$('gzResultMenu').onclick=menu;for(const n of modes)$('gzChoice'+label(n)).onclick=()=>choose(n);
document.addEventListener('visibilitychange',()=>{if(root.hidden||screen!=='play')return;if(document.hidden){stop();save();}else run();});window.addEventListener('pagehide',()=>{if(!root.hidden&&screen==='play'){stop();save();}});
restore();globalThis.GridZeroApp=Object.freeze({open,back,menu});
})();
