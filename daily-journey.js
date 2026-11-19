/* Grid Club v0.9.5 · shared device-local Daily Challenge journey */
(function(root){
 'use strict';
 const order=['dotTrails','pipeShift'];
 const date=()=>new Date().toISOString().slice(0,10);
 function read(key){try{return JSON.parse(localStorage.getItem(key)||'null')||{};}catch(_){return {};}}
 function status(){
   const day=date(),dot=read('gridclub-stats-v1').games?.dotTrails?.daily?.[day];
   const pipe=read('gridclub-pipeshift-progress-v1').daily?.[day];
   const completed={dotTrails:!!dot,pipeShift:!!pipe?.completed};
   return {day,completed,count:order.filter(id=>completed[id]).length,total:order.length};
 }
 function nextGame(from){
   const s=status(),index=order.indexOf(from);
   if(s.count===s.total)return null;
   const rotated=index<0?order:[...order.slice(index+1),...order.slice(0,index+1)];
   return rotated.find(id=>!s.completed[id])||null;
 }
 function remaining(){const s=status();return Math.max(0,s.total-s.count);}
 function remainingLabel(){return `Daily Challenges remaining: ${remaining()}`;}
 function summary(){
   const s=status();
   return `${s.count}/${s.total} complete today · Dot Trails ${s.completed.dotTrails?'✓':'○'} · Pipe Shift ${s.completed.pipeShift?'✓':'○'}`;
 }
 function visitNext(from){
   const next=nextGame(from);if(!next)return false;
   if(next==='pipeShift'){
     if(!root.PipeShiftApp?.dailyMenu)return false;
     root.GridDotTrailsApp?.home?.();
     root.PipeShiftApp.dailyMenu();
   }else{
     if(!root.GridDotTrailsApp?.openDaily)return false;
     root.PipeShiftApp?.home?.();
     root.GridDotTrailsApp.openDaily();
   }
   return true;
 }
 root.GridClubDailyJourney=Object.freeze({status,nextGame,remaining,remainingLabel,summary,visitNext});
})(globalThis);
