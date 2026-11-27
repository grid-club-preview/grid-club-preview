/* Grid Club v0.9.41 · one left-edge Back gesture for every game. */
(function(root,doc){
'use strict';
const $=id=>doc.getElementById(id);
const visible=id=>{const el=$(id);return !!el&&!el.hidden;};
const current=()=>{
 if(visible('home'))return null;
 if(visible('wordRescueScreen')){
   if(visible('wrRules'))return null;
   return visible('wrPlay')?['word-play',root.WordRescueApp?.back]:visible('wrLeaderboard')?['word-leaderboard',root.WordRescueApp?.back]:visible('wrStats')?['word-stats',root.WordRescueApp?.back]:visible('wrCampaign')?['word-campaign',root.WordRescueApp?.back]:visible('wrMenu')?['word-menu',root.WordRescueApp?.back]:null;
 }
 if(visible('pipeShiftScreen')){
   for(const id of ['pipe-game','pipe-menu','pipe-random','pipe-stages','pipe-levels','pipe-stats','pipe-daily'])
     if(visible(id))return [id,root.PipeShiftApp?.back];
   return null;
 }
 if(visible('pauseLayer')||visible('timeUpLayer'))return null;
 for(const id of ['dotDailyCompleteLayer','gameScreen','statsScreen','dotDailyScreen','randomScreen','levelsScreen','difficultyScreen'])
   if(visible(id))return [id,root.GridDotTrailsApp?.back];
 return null;
};
let touch=null,pointer=null;
function start(target,x,y,id){
 const route=current();
 if(!route||typeof route[1]!=='function'||x>90||x<0)return null;
 if(target?.closest?.('input,select,textarea,.controls,.pipeControls,#pipeExtraTime,#wrDock,#wrResult,#wrRules'))return null;
 if(target?.closest?.('#board,.boardWrap,#pipeBoard,.pipeBoardHolder')&&x>28)return null;
 return {id,x,y,route:route[0]};
}
function move(g,x,y,ev){
 if(!g)return null;
 const dx=x-g.x,dy=y-g.y;
 if((Math.abs(dy)>45&&Math.abs(dy)>Math.abs(dx))||dx< -30)return null;
 if(dx>22&&dx>Math.abs(dy)*1.5&&ev.cancelable)ev.preventDefault();
 return g;
}
function finish(g,x,y,ev){
 if(!g)return;
 const dx=x-g.x,dy=y-g.y,route=current();
 if(!route||route[0]!==g.route||dx<75||Math.abs(dy)>=65||dx<=Math.abs(dy)*1.5)return;
 // A single physical swipe may produce both Touch and Pointer events.
 // Clear both recognisers before navigation, so we never go back twice.
 touch=pointer=null;
 if(ev.cancelable)ev.preventDefault();
 route[1]();
}
doc.addEventListener('touchstart',ev=>{
 if(ev.touches.length!==1){touch=pointer=null;return;}
 const t=ev.touches[0];touch=start(ev.target,t.clientX,t.clientY,t.identifier);
},{capture:true,passive:true});
doc.addEventListener('touchmove',ev=>{
 if(ev.touches.length!==1){touch=pointer=null;return;}
 if(!touch)return;
 const t=ev.touches[0];if(t.identifier!==touch.id){touch=pointer=null;return;}
 touch=move(touch,t.clientX,t.clientY,ev);if(!touch)pointer=null;
},{capture:true,passive:false});
doc.addEventListener('touchend',ev=>{
 const g=touch;touch=null;if(!g)return;
 const t=Array.from(ev.changedTouches||[]).find(t=>t.identifier===g.id);
 if(t)finish(g,t.clientX,t.clientY,ev);
},{capture:true,passive:false});
doc.addEventListener('touchcancel',()=>{touch=pointer=null;},{capture:true,passive:true});
doc.addEventListener('pointerdown',ev=>{
 if(ev.pointerType!=='touch')return;
 if(ev.isPrimary===false){touch=pointer=null;return;}
 pointer=start(ev.target,ev.clientX,ev.clientY,ev.pointerId);
},{capture:true,passive:true});
doc.addEventListener('pointermove',ev=>{
 if(pointer?.id===ev.pointerId)pointer=move(pointer,ev.clientX,ev.clientY,ev);
},{capture:true,passive:false});
doc.addEventListener('pointerup',ev=>{
 const g=pointer;if(!g||g.id!==ev.pointerId)return;pointer=null;
 finish(g,ev.clientX,ev.clientY,ev);
},{capture:true,passive:false});
doc.addEventListener('pointercancel',()=>{pointer=null;},{capture:true,passive:true});
})(globalThis,document);
