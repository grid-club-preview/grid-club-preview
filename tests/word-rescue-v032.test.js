/* Grid Club v0.9.32: separate tower & raft escape threats and UI contract */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const e=require('../word-rescue-engine.js');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const markup=read('index.html'),css=read('word-rescue.css'),ui=read('word-rescue.js');
const vowels=r=>r.some(letter=>'AEIOU'.includes(letter)&&letter!=='');
function playWord(g,word){
 const indices=[];
 for(const letter of word){
  const idx=g.rack.findIndex((ch,i)=>ch===letter&&!indices.includes(i));
  assert(idx>=0,'Must have word available from displayed rack');
  indices.push(idx);
  assert(e.select(g,idx));
 }
 return e.submit(g);
}
for(const mode of ['tide','sinking','raft']){
 for(let seed=1;seed<=70;seed++){
  const g=e.create(seed,mode),initial=e.create(seed,mode);
  assert.deepEqual(g.rack,initial.rack,'Deterministic initial letters');
  assert(vowels(g.rack),'Guaranteed vowel in all escape modes');
  assert(e.validState(g));
  g.started=true;
  const choices=e.possibleWords(g.rack,g.used);
  assert(choices.length>0);
  const result=playWord(g,choices.sort((a,b)=>b.length-a.length)[0]);
  assert(result.ok);
  assert(vowels(g.rack),'Letters always replenish with a vowel');
 }
}
const idle=e.create(400,'raft');idle.started=true;
assert.equal(e.hazard(idle),'shark');
assert.equal(e.waterHeight(idle),32,'Raft floats on fixed sea level');
assert.equal(e.remainingSafetySeconds(idle),28.5);
const pace=e.create(7,'raft');pace.blocks=23;
assert.equal(e.remainingSafetySeconds(pace),48.05);
const previousPace={...pace,raftPace:2};assert.equal(e.remainingSafetySeconds(previousPace),42.75);
const legacyPace={...pace};delete legacyPace.raftPace;
assert.equal(e.remainingSafetySeconds(legacyPace),25.5+23*2.7);
assert(!markup.includes('id="wrTime"'),'No live time display');
const d0=e.dangerFraction(idle);
e.advance(idle,14000);
assert(e.dangerFraction(idle)>d0,'Shark must grow more dangerous while idle');
assert(!idle.expired);
const save=e.remainingSafetySeconds(idle),position=e.sharkProgress(idle);
assert(position>0&&position<1);
const w=e.possibleWords(idle.rack)[0];
const build=playWord(idle,w);
assert(build.ok);
assert(e.remainingSafetySeconds(idle)>save,'Valid words buy survival time');
assert(Math.abs(e.remainingSafetySeconds(idle)-save-build.blocks*.85)<1e-9,'New raft allowance is 0.85 seconds per plank');
assert.equal(e.sharkProgress(idle),position,'A word must never reset shark position');
const slower=e.sharkProgress(idle);e.advance(idle,1000);
assert(e.sharkProgress(idle)>slower,'Shark continues approaching after a word');
assert(e.sharkProgress(idle)-slower<(1-position)/save,'Word slows pursuit');
const resumed=JSON.parse(JSON.stringify(idle));assert.equal(e.sharkProgress(resumed),e.sharkProgress(idle));
const legacy=JSON.parse(JSON.stringify(idle));delete legacy.sharkProgress;
const legacyPosition=e.sharkProgress(legacy);e.advance(legacy,1000);assert(e.sharkProgress(legacy)>legacyPosition);
assert(!idle.expired);
const fresh=e.create(1,'raft');fresh.started=true;
e.advance(fresh,29000);
assert.equal(fresh.expired,true,'Idle players get caught by shark');
assert.equal(e.sharkProgress(fresh),1,'Shark reaches Gridda exactly at defeat');
assert.equal(e.waterHeight(fresh),32,'The sea must not rise in Raft Escape');
const tower=e.create(1,'tide');tower.started=true;
const original=e.waterHeight(tower);
e.advance(tower,2000);
assert(e.waterHeight(tower)>original,'Water must rise in Rising Tide');
assert.equal(e.hazard(tower),'drowning');
const erode=e.create(1,'sinking',3,3,1);erode.started=true;
e.advance(erode,7000);
assert.equal(erode.rack.filter(Boolean).length,6,'Sinking Letters still loses tiles');
const win=e.create(11,'raft');win.blocks=23;
const finishWord=e.possibleWords(win.rack)[0];
assert(playWord(win,finishWord).won,'Full raft should win at 24 planks');
assert.equal(e.isAcceptedWord('SHU'),false,'SHU is excluded from supported word list');
assert(!e.possibleWords(['S','H','U','','','','']).includes('SHU'));
for(const w of ['SHUT','SHORE','SHARKS','CATS','DOGS'])assert(e.isAcceptedWord(w),'Common words remain accepted: '+w);
assert(markup.includes('id="wrNewRaft"'),'Third escape mode must be selectable');
assert(markup.includes('id="wrDock"'),'Mobile word controls should share a bottom dock');
assert(markup.includes('id="wrShark"'),'Shark must have a tracked scene element');
assert(markup.includes('id="wrBuildNotice"'));
assert(css.includes('position:fixed;bottom:0;left:50%'),'Submit controls must remain on screen');
assert(css.includes('env(safe-area-inset-bottom)'),'Bottom buttons must respect iPhone home indicator');
assert(css.includes('data-mode=raft')&&css.includes('--wrRaftLength'),'Horizontal raft must visibly grow');
assert(css.includes('data-panic=frantic'),'Avatar must grow visibly frantic near danger');
assert(ui.includes('function situation(danger)')&&!ui.includes("' to safety'"),'Narrative status replaces numerical countdown');
assert(ui.includes("scene.style.setProperty('--wrBodySpeed'"),'Character animation speeds should vary with danger');
assert(!ui.includes('GridClubCredits?.award'),'Ordinary Free Play must not grant credits');
console.log('Word Rescue v0.9.32 passed: 210 seeds, shark distance, vertical tide, horizontal raft, word filter and iPhone bottom dock');

const rescue=e.create(9,'tide');rescue.started=true;rescue.blocks=24;e.advance(rescue,44000);assert(!rescue.won&&!rescue.expired);e.advance(rescue,1000);assert(rescue.won&&!rescue.expired);assert.equal(e.rescueProgress(rescue),1);
const quick=e.create(9,'tide');quick.started=true;e.advance(quick,14000);assert(quick.expired&&!quick.won);
const long=e.create(9,'tide');long.rack=['S','H','A','R','K','S','X'];assert.equal(playWord(long,'SHARKS').points,50);

// v0.9.51: no vowel-only, consonant-only or unplayable racks.
function playable(s){const letters=s.rack.filter(Boolean);assert(letters.some(x=>'AEIOU'.includes(x)));assert(letters.filter(x=>!'AEIOU'.includes(x)).length>=2);assert(e.hasPlayable(s.rack,s.used));}
const broken=e.create(1,'tide');broken.rack=['E','O','E','U','U','O','I'];broken.blocks=12;broken.score=50;broken.elapsedMs=10000;broken.reracks=1;
assert(e.ensurePlayable(broken));playable(broken);assert.equal(broken.blocks,12);assert.equal(broken.score,50);assert.equal(broken.elapsedMs,10000);assert.equal(broken.reracks,1);
for(const mode of ['tide','sinking','raft'])for(let seed=1;seed<=40;seed++){
 const run=e.create(seed,mode);run.started=true;playable(run);
 for(let i=0;i<8&&!run.won&&!run.expired;i++){
  const word=e.possibleWords(run.rack,run.used)[0];assert(word);assert(playWord(run,word).ok);playable(run);
  if(i%3===0&&!run.won){e.rerack(run);playable(run);}
  if(!run.won){e.advance(run,7000);playable(run);}
 }
}
const eroded=e.create(3,'sinking');eroded.rack=['C','A','T','','','',''];eroded.started=true;e.advance(eroded,7000);playable(eroded);assert.equal(eroded.rack.filter(Boolean).length,3);
const oldRack=e.create(4,'sinking');oldRack.rack=['E','','E','U','','O','I'];assert(e.ensurePlayable(oldRack));playable(oldRack);assert.equal(oldRack.rack.filter(Boolean).length,5);
console.log('Playable racks: 120 seeded rounds, impossible saved rack repair, erosion and free/paid shuffle engine checks passed');

// v0.9.52: each seven-second erosion removes a permanent slot until three remain.
const permanent=e.create(91,'sinking',3,3,1);permanent.started=true;permanent.blocks=24;
for(let n=6;n>=3;n--){
 e.advance(permanent,7000);assert.equal(permanent.rack.filter(Boolean).length,n);playable(permanent);
 const slots=permanent.rack.map(Boolean);
 const word=e.possibleWords(permanent.rack,permanent.used)[0];assert(playWord(permanent,word).ok);
 assert.deepEqual(permanent.rack.map(Boolean),slots,'Submitting cannot restore sunken slots');
 e.rerack(permanent);assert.deepEqual(permanent.rack.map(Boolean),slots,'Rerack cannot restore sunken slots');playable(permanent);
}
e.advance(permanent,7000);assert.equal(permanent.rack.filter(Boolean).length,3);playable(permanent);
for(const mode of ['tide','sinking']){
 const newer=e.create(4,mode),older={...newer,rescueRules:2};newer.elapsedMs=older.elapsedMs=10000;
 assert(e.waterHeight(newer)>e.waterHeight(older));assert(e.remainingSafetySeconds(newer)<e.remainingSafetySeconds(older));
}
console.log('Permanent sinking slots, protected playable floor, faster tides and old-rule compatibility passed');
function fairRack(s){const a=s.rack.filter(Boolean),v=a.filter(c=>'AEIOU'.includes(c)).length,counts=[...new Set(a)].map(c=>a.filter(x=>x===c).length);assert(v>=(a.length>=6?2:1));assert(v<=Math.min(3,a.length-2));assert(Math.max(...counts)<=3);assert(counts.filter(n=>n===3).length<=1);if(counts.includes(3))assert(s.allowTriple);assert(e.familiarWord(s.rack,s.used));return counts.includes(3);}
const repeated=e.create(8,'tide');repeated.rack=['R','G','I','I','I','I','I'];assert(e.ensurePlayable(repeated));fairRack(repeated);
let triples=0,totalRacks=0;
for(let seed=1;seed<=1000;seed++){const run=e.create(seed*7919,'tide');triples+=fairRack(run);totalRacks++;for(let i=0;i<3;i++){e.rerack(run);triples+=fairRack(run);totalRacks++;}}
assert(triples/totalRacks>.02&&triples/totalRacks<.08);
for(const mode of ['tide','sinking','raft'])for(let seed=1;seed<=45;seed++){const run=e.create(seed,mode);run.started=true;fairRack(run);for(let i=0;i<8&&!run.won&&!run.expired;i++){const word=e.possibleWords(run.rack,run.used)[0];assert(word);assert(playWord(run,word).ok);fairRack(run);if(i%3===0&&!run.won){e.rerack(run);fairRack(run);}if(!run.won){e.advance(run,7000);fairRack(run);}}}
const friend=e.create(7,'raft');friend.started=true;e.advance(friend,20000);const beforeFriend=e.remainingSafetySeconds(friend),shark=e.sharkProgress(friend);assert(e.callFriend(friend));assert.equal(e.remainingSafetySeconds(friend),beforeFriend+10);assert.equal(e.sharkProgress(friend),shark);assert(!e.callFriend(friend));assert(!e.callFriend(e.create(2,'tide')));e.advance(friend,1000);assert(e.sharkProgress(friend)>shark);console.log('Rare triples '+triples+'/'+totalRacks+' and friend lifeline passed');
const moderate=e.create(20,'raft');moderate.started=true;e.advance(moderate,27000);assert(!moderate.expired);e.advance(moderate,1500);assert(moderate.expired);
const old=e.create(20,'raft',3,2);old.started=true;e.advance(old,27000);assert(old.expired);console.log('Raft moderate pace, legacy timing and idle defeat passed');
const sinking=e.create(91,'sinking');sinking.started=true;sinking.blocks=24;
for(let n=6;n>=4;n--){
 e.advance(sinking,7000);const warning=e.sinkWarning(sinking);assert(warning);assert.equal(warning.progress,0);assert.equal(sinking.rack.filter(Boolean).length,n+1);
 const target=warning.index;e.advance(sinking,1500);assert.equal(e.sinkWarning(sinking).progress,.5);
 e.rerack(sinking);assert.equal(e.sinkWarning(sinking).index,target);
 const word=e.possibleWords(sinking.rack,sinking.used)[0];assert(playWord(sinking,word).ok);assert.equal(e.sinkWarning(sinking).index,target);
 e.advance(sinking,1500);assert.equal(sinking.rack[target],'');assert.equal(sinking.rack.filter(Boolean).length,n);assert.equal(e.sinkWarning(sinking),null);fairRack(sinking);
}
e.advance(sinking,10000);assert.equal(sinking.rack.filter(Boolean).length,4);assert.equal(e.sinkWarning(sinking),null);
console.log('Sinking Letters warnings, permanent four-slot floor and reshuffle consistency passed');