/* Grid Club v0.4b.2 · local-only Dot Trails player stats + safe leaderboard formatting */
(function(root){
  'use strict';
  const levels=[{size:5,name:'Beginner'},{size:7,name:'Medium'},{size:9,name:'Hard'},{size:11,name:'Expert'}];
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const fmt=ms=>{const n=Math.max(0,Math.floor(num(ms)/1000));return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;};
  const average=arr=>arr.length?Math.round(arr.reduce((a,b)=>a+b,0)/arr.length):null;
  const median=arr=>{if(!arr.length)return null;const x=arr.slice().sort((a,b)=>a-b);const i=Math.floor(x.length/2);return Math.round(x.length%2?x[i]:(x[i-1]+x[i])/2);};
  function summarize(results){
    const list=Array.isArray(results)?results:[];
    const group=(rows)=>({
      count:rows.length,
      averageMs:average(rows.map(r=>num(r.elapsedMs))),
      medianMs:median(rows.map(r=>num(r.elapsedMs))),
      bestMs:rows.length?Math.min(...rows.map(r=>num(r.elapsedMs))):null,
      averageMoves:average(rows.map(r=>num(r.moves))),
      assistedCount:rows.filter(r=>r.assisted).length
    });
    return {
      total:list.length,
      levels:levels.map(l=>({...l,...group(list.filter(r=>(r.mode==='free'||r.mode==='level')&&Number(r.size)===l.size))})),
      daily:group(list.filter(r=>r.mode==='daily')),
      lastFive:list.slice(-5).reverse()
    };
  }
  const plural=(n,singular,pluralForm=singular+'s')=>`${num(n)} ${num(n)===1?singular:pluralForm}`;
  function communityLines(stats,assisted){
    const count=num(stats?.count),cat=assisted?'Assisted':'Unassisted';
    if(!count)return {label:cat,summary:'No verified completions yet.',detail:''};
    if(count===1)return {label:cat,summary:'First verified result recorded',detail:'Community comparisons appear when more players finish.'};
    const summary=`${plural(count,'player')} · average ${fmt(stats.averageMs)} · median ${fmt(stats.medianMs)} · ${num(stats.averageMoves)} avg moves`;
    let detail='';
    if(Number.isFinite(Number(stats.fasterCount))&&stats.fasterCount!==undefined){
      const others=Math.max(1,count-1),beats=num(stats.beatCount);
      detail=`${plural(stats.fasterCount,'player')} faster · ${plural(stats.fewerMovesCount,'player')} used fewer moves · faster than ${Math.round(beats/others*100)}% of other verified players`;
    }
    return {label:cat,summary,detail};
  }
  const api={levels,fmt,average,median,summarize,plural,communityLines};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.GridStats=api;
})(typeof globalThis==='object'?globalThis:this);
