/* Grid Club v0.9.24 · shared hold-to-fill Club Credit celebration.
 * IMPORTANT: Credit awards are persisted by the game before this visual runs.
 * Holding animates only the display. Leaving/releasing cannot lose a credit.
 */
(function(root){
'use strict';
const DURATION_MS=1250; // tactile collect animation stays comfortably short
const create=(tag,klass,text)=>{
 const el=document.createElement(tag);if(klass)el.className=klass;
 if(text!==undefined)el.textContent=String(text);return el;
};
function show(target,settings){
 const host=typeof target==='string'?document.getElementById(target):target;
 if(!host)return;
 if(typeof host._vaultDispose==='function')host._vaultDispose();
 host.replaceChildren();
 const earned=Math.max(0,Math.floor(Number(settings?.earned)||0));
 const balance=Math.max(0,Math.floor(Number(settings?.balance)||0));
 host.hidden=earned<=0;
 if(!earned)return;
 const from=Math.max(0,balance-earned),reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 host.classList.add('vaultReward');
 const title=create('div','vaultEarned',`◉ +${earned} Club Credit${earned===1?'':'s'}`);
 const detail=create('div','vaultDetail',settings?.detail||'');
 detail.hidden=!detail.textContent;
 const display=create('div','vaultDisplay');
 const ring=create('div','vaultRing');
 const door=create('div','vaultDoor');const cross=create('div','vaultCross');
 cross.append(create('i'));door.append(cross);ring.append(door);
 const right=create('div','vaultValues');
 const caption=create('div','vaultCaption','YOUR VAULT');
 const number=create('strong','vaultBalance');
 const suffix=create('span','vaultCoinSymbol','◉');number.append(suffix);
 const status=create('div','vaultCount');right.append(caption,number,status);
 display.append(ring,right);
 const progressTrack=create('div','vaultTrack');
 progressTrack.setAttribute('aria-hidden','true');
 const bar=create('div','vaultProgress');progressTrack.append(bar);
 const button=create('button','vaultHold','Fill vault');
 button.type='button';
 button.setAttribute('aria-label',`Hold to add ${earned} credits to the vault display`);
 host.append(title,detail,display,progressTrack,button);
 let value=0,shown=0,held=false,raf=0,last=null,disposed=false;
 function spawn(){
  if(reduced||disposed)return;
  const source=button.getBoundingClientRect(),target=ring.getBoundingClientRect(),box=host.getBoundingClientRect();
  if(!source.width||!target.width)return;
  const coin=create('span','vaultFlyingCoin','◉'),x=source.left+source.width/2-box.left,
    y=source.top-box.top+8,dx=target.left+target.width/2-box.left-x,dy=target.top+target.height/2-box.top-y;
  coin.style.left=`${x}px`;coin.style.top=`${y}px`;
  coin.style.setProperty('--vault-dx',`${dx}px`);coin.style.setProperty('--vault-dy',`${dy}px`);
  coin.setAttribute('aria-hidden','true');host.append(coin);
  coin.addEventListener('animationend',()=>coin.remove(),{once:true});
 }
 function draw(){
  const p=Math.min(1,value),current=Math.min(earned,Math.floor(p*earned+0.000001));
  while(shown<current){shown++;spawn();}
  number.firstChild?.nodeType===3?number.firstChild.textContent=String(from+current):number.prepend(document.createTextNode(String(from+current)));
  status.textContent='Credit balance';
  bar.style.width=`${p*100}%`;
  ring.style.setProperty('--vault-fill',`${p*100}%`);
  if(p>=1){
   held=false;last=null;if(raf){root.cancelAnimationFrame(raf);raf=0;}
   button.classList.remove('vaultHolding');button.disabled=true;
   button.textContent='✓ Vault filled';
   host.classList.add('vaultComplete');
  }
 }
 function tick(now){
  if(!held||disposed){raf=0;return;}
  if(last!==null)value=Math.min(1,value+Math.max(0,Math.min(75,now-last))/DURATION_MS);
  last=now;draw();
  if(held)raf=root.requestAnimationFrame(tick);else raf=0;
 }
 function hold(ev){
  if(disposed||button.disabled||held)return;
  if(ev?.pointerType==='mouse'&&ev.button!==0)return;
  if(ev?.preventDefault)ev.preventDefault();
  if(ev?.pointerId!==undefined&&button.setPointerCapture)try{button.setPointerCapture(ev.pointerId);}catch(_){}
  held=true;last=null;button.classList.add('vaultHolding');button.textContent='Filling vault…';
  raf=root.requestAnimationFrame(tick);
 }
 function release(){
  if(!held)return;
  held=false;last=null;if(raf){root.cancelAnimationFrame(raf);raf=0;}
  button.classList.remove('vaultHolding');
  if(value<1)button.textContent='Fill vault';
 }
 const onKeyDown=ev=>{if((ev.key===' '||ev.key==='Enter')&&!ev.repeat)hold(ev);};
 const onKeyUp=ev=>{if(ev.key===' '||ev.key==='Enter'){ev.preventDefault();release();}};
 const onPointerDown=ev=>hold(ev);
 const onPageHidden=()=>{if(document.hidden)release();};
 button.addEventListener('pointerdown',onPointerDown);
 button.addEventListener('pointerup',release);
 button.addEventListener('pointercancel',release);
 button.addEventListener('lostpointercapture',release);
 button.addEventListener('keydown',onKeyDown);
 button.addEventListener('keyup',onKeyUp);
 button.addEventListener('contextmenu',ev=>ev.preventDefault());
 button.addEventListener('click',ev=>ev.preventDefault());
 document.addEventListener('visibilitychange',onPageHidden);
 host._vaultDispose=()=>{
  disposed=true;release();document.removeEventListener('visibilitychange',onPageHidden);
  host.querySelectorAll('.vaultFlyingCoin').forEach(el=>el.remove());
 };
 if(reduced){value=1;shown=earned;draw();}
 else draw();
}
root.GridClubVault=Object.freeze({show,DURATION_MS});
})(globalThis);
