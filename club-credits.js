/* Grid Club v0.9.10 · one device-local ledger shared by Dot Trails and Pipe Shift.
 * This is prototype game credit, never a paid or server-trusted currency. */
(function(root){
 'use strict';
 const KEY='gridclub-levels-progress-v1';
 const BACKUP='gridclub-levels-progress-v1-safety-copy';
 const levels=root.GridLevels;
 function valid(value){
   return !!value&&value.version===1&&value.completed&&typeof value.completed==='object'&&Array.isArray(value.ledger);
 }
 function parse(raw){try{const x=JSON.parse(raw||'null');return valid(x)?x:null;}catch(_){return null;}}
 function load(){
   let stored=null;
   try{stored=parse(localStorage.getItem(KEY))||parse(localStorage.getItem(BACKUP));}
   catch(_){/* Private-mode storage can be unavailable: never interrupt a win. */}
   return levels.normalize(stored||levels.initial());
 }
 function save(value){
   const json=JSON.stringify(levels.normalize(value));
   try{
     localStorage.setItem(KEY,json);
     if(localStorage.getItem(KEY)!==json)return false;
     try{localStorage.setItem(BACKUP,json);}catch(_){}
     return true;
   }catch(_){return false;}
 }
 function balance(){try{return load().credits;}catch(_){return 0;}}
 function award(id,amount,type){
   if(typeof id!=='string'||!id.startsWith('club:')||!Number.isInteger(amount)||amount<=0||amount>50)
     return {awarded:0,saveFailed:true,balance:balance()};
   const record=load();
   if(record.ledger.some(x=>x.id===id))return {awarded:0,already:true,balance:record.credits};
   record.ledger.push({id,amount,type:type||'award',at:new Date().toISOString()});
   record.credits+=amount;
   if(!save(record))return {awarded:0,saveFailed:true,balance:balance()};
   return {awarded:amount,balance:record.credits};
 }
 function spend(amount,kind,attemptId){
   const record=load();
   if(!levels.spend(record,amount,kind,attemptId))return false;
   return save(record);
 }
 root.GridClubCredits=Object.freeze({balance,award,spend});
})(globalThis);
