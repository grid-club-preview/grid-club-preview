/* Grid Zero first playable prototype, local progress only. */
(function(){
'use strict';
const E=globalThis.GridZeroEngine,$=id=>document.getElementById(id),root=$('gridZeroScreen'),home=$('home');
if(!E||!root)return;
const KEY='gridclub-gridzero-v1',read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch(_){return null;}};
let size=3,puzzle=null,state=null,selected=0,elapsed=0,restarts=0,timer=null,started=null,screen='menu',best={};
function seed(){return (Date.now()^Math.floor(Math.random()*4294967296))>>>0||1;}
const now=()=>performance.now(),time=()=>Math.max(0,elapsed+(started===null?0:now()-started));
const fmt=ms=>{const s=Math.floor(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
function save(){try{localStorage.setItem(KEY,JSON.stringify({version:1,size,seed:puzzle?.seed??null,state,elapsed:Math.round(time()),restarts,best}));}catch(_){}}
function clock(){ $('gzTime').textContent=fmt(time()); }
function stop(){if(started!==null){elapsed=time();started=null;}if(timer!==null){clearInterval(timer);timer=null;}clock();}
function run(){if(started!==null||screen!=='play'||root.hidden||document.hidden||E.status(state)!=='playing')return;started=now();timer=setInterval(()=>{clock();},250);}
function route(which){screen=which;$('gzMenu').hidden=which!=='menu';$('gzPlay').hidden=which!=='play';}
function restore(){const x=read();if(!x||x.version!==1)return;best=x.best&&typeof x.best==='object'?x.best:{};size=[1,2,3].includes(x.size)?x.size:3;if(!Number.isInteger(x.seed))return;const p=E.generate(x.seed,size);if(!E.valid(p,x.state))return;puzzle=p;state=x.state;elapsed=Math.max(0,Number(x.elapsed)||0);restarts=Math.max(0,Math.floor(Number(x.restarts)||0));selected=Math.max(0,state.tray.findIndex(v=>v!==null));}
function menu(){stop();save();route('menu');for(const n of [1,2,3])$('gzChoice'+n).setAttribute('aria-pressed',String(n===size));$('gzContinue').hidden=!puzzle||E.status(state)==='won';$('gzContinue').textContent=state&&E.status(state)==='stuck'?'Return to puzzle':'Continue puzzle';$('gzBest').textContent=best[size]!==undefined?'Best time · '+fmt(best[size]):'No completed puzzles in this tray mode yet.';}
function open(){home.hidden=true;root.hidden=false;menu();}
function begin(){if(puzzle&&state&&E.status(state)!=='won'&&state.moves&&!confirm('Replace your current Grid Zero puzzle?'))return;stop();puzzle=E.generate(seed(),size);state=E.fresh(puzzle);selected=0;elapsed=0;restarts=0;route('play');render();run();save();}
function resume(){if(!puzzle)return;route('play');render();run();save();}
function restart(){if(!puzzle)return;if(E.status(state)==='playing'&&state.moves&&!confirm('Restart this puzzle? Your stopwatch will keep its elapsed time.'))return;stop();state=E.fresh(puzzle);selected=0;restarts++;render();run();save();}
function choose(n){if(n===size)return;if(puzzle&&E.status(state)!=='won'&&state.moves&&!confirm('Changing the tray size replaces your current puzzle. Continue?'))return;stop();size=n;puzzle=null;state=null;elapsed=0;restarts=0;menu();}
function back(){if(screen==='play'){menu();return;}stop();save();root.hidden=true;home.hidden=false;}
function tile(value,index,kind){const el=document.createElement('button');el.type='button';el.className=kind;el.textContent=value===null?'·':String(value);el.dataset.index=String(index);return el;}
function render(){
 if(!puzzle||!state)return;const status=E.status(state),won=status==='won',stuck=status==='stuck',locked=state.cells.filter(n=>n===0).length;
 if(state.tray[selected]===null)selected=Math.max(0,state.tray.findIndex(v=>v!==null));
 const active=state.tray[selected];$('gzSecured').textContent=locked+'/9';$('gzRemaining').textContent=String(E.remaining(puzzle,state));$('gzRestarts').textContent=String(restarts);clock();
 $('gzBoard').replaceChildren();state.cells.forEach((n,i)=>{const b=tile(n,i,'gzCell');b.classList.toggle('gzLocked',n===0);b.classList.toggle('gzExact',n>0&&active===n);b.disabled=status!=='playing'||n===0||active===null||n<active;b.setAttribute('aria-label','Square '+(i+1)+', '+(n===0?'secured':n+' remaining'));b.onclick=()=>{if(!E.place(puzzle,state,selected,i))return;const next=E.status(state);if(next!=='playing'){stop();if(next==='won'&&(best[size]===undefined||elapsed<best[size]))best[size]=Math.round(elapsed);}save();render();};$('gzBoard').append(b);});
 $('gzTray').replaceChildren();$('gzTray').style.setProperty('--gz-tray',String(size));state.tray.forEach((n,i)=>{const b=tile(n,i,'gzNumber');b.disabled=n===null||status!=='playing';b.setAttribute('aria-pressed',String(i===selected));b.setAttribute('aria-label',n===null?'Empty tray slot':'Select '+n);b.onclick=()=>{selected=i;render();};$('gzTray').append(b);});
 $('gzQueue').replaceChildren();for(let i=0;i<E.PREVIEW;i++){const el=document.createElement('span');el.className='gzIncoming';el.textContent=puzzle.numbers[state.cursor+i]??'·';$('gzQueue').append(el);}
 $('gzMessage').textContent=won?'Grid secured!':stuck?'No valid placements remain. Restart to try again.':size===1?'Choose a square to subtract '+active+'.':'Choose a number, then choose a square.';
 $('gzMessage').dataset.outcome=status;$('gzResult').hidden=status==='playing';$('gzResultTitle').textContent=won?'Grid secured!':'No moves left';$('gzResultText').textContent=locked+'/9 squares secured · '+fmt(time())+' · '+restarts+' restart'+(restarts===1?'':'s');$('gzResultNext').textContent=won?'New puzzle ›':'↻ Restart';$('gzRestart').hidden=won;
}
$('gzEntry').onclick=open;$('gzBack').onclick=back;$('gzStart').onclick=begin;$('gzContinue').onclick=resume;$('gzRestart').onclick=restart;$('gzNew').onclick=begin;$('gzResultNext').onclick=()=>E.status(state)==='won'?begin():restart();$('gzResultMenu').onclick=menu;for(const n of [1,2,3])$('gzChoice'+n).onclick=()=>choose(n);
document.addEventListener('visibilitychange',()=>{if(root.hidden||screen!=='play')return;if(document.hidden){stop();save();}else run();});window.addEventListener('pagehide',()=>{if(!root.hidden&&screen==='play'){stop();save();}});
restore();globalThis.GridZeroApp=Object.freeze({open,back,menu});
})();
