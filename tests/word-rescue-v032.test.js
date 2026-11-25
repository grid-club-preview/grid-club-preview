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
assert.equal(e.remainingSafetySeconds(idle),25.5);
const pace=e.create(7,'raft');pace.blocks=23;
assert.equal(e.remainingSafetySeconds(pace),42.75);
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
assert(Math.abs(e.remainingSafetySeconds(idle)-save-build.blocks*.75)<1e-9,'New raft allowance is 0.75 seconds per plank');
assert.equal(e.sharkProgress(idle),position,'A word must never reset shark position');
const slower=e.sharkProgress(idle);e.advance(idle,1000);
assert(e.sharkProgress(idle)>slower,'Shark continues approaching after a word');
assert(e.sharkProgress(idle)-slower<(1-position)/save,'Word slows pursuit');
const resumed=JSON.parse(JSON.stringify(idle));assert.equal(e.sharkProgress(resumed),e.sharkProgress(idle));
const legacy=JSON.parse(JSON.stringify(idle));delete legacy.sharkProgress;
const legacyPosition=e.sharkProgress(legacy);e.advance(legacy,1000);assert(e.sharkProgress(legacy)>legacyPosition);
assert(!idle.expired);
const fresh=e.create(1,'raft');fresh.started=true;
e.advance(fresh,26000);
assert.equal(fresh.expired,true,'Idle players get caught by shark');
assert.equal(e.sharkProgress(fresh),1,'Shark reaches Gridda exactly at defeat');
assert.equal(e.waterHeight(fresh),32,'The sea must not rise in Raft Escape');
const tower=e.create(1,'tide');tower.started=true;
const original=e.waterHeight(tower);
e.advance(tower,2000);
assert(e.waterHeight(tower)>original,'Water must rise in Rising Tide');
assert.equal(e.hazard(tower),'drowning');
const erode=e.create(1,'sinking');erode.started=true;
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
assert(ui.includes("'plank':'planks'")&&ui.includes("'block':'blocks'")&&ui.includes("' to safety'"),
 'Progress counter must show remaining planks/blocks');
assert(ui.includes("scene.style.setProperty('--wrBodySpeed'"),'Character animation speeds should vary with danger');
assert(!ui.includes('GridClubCredits?.award'),'Ordinary Free Play must not grant credits');
console.log('Word Rescue v0.9.32 passed: 210 seeds, shark distance, vertical tide, horizontal raft, word filter and iPhone bottom dock');
