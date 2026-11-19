/* Grid Club · Dot Trails v0.8.0 level progression · random play + ranked daily prototype */
(() => {
  'use strict';
  const core = GridCore;
  const statsUtil = GridStats;
  const levelCore = GridLevels;
  const LEVEL_STATE_KEY = 'gridclub-levels-progress-v1';
  const LEVEL_FALLBACK_KEY = 'gridclub-levels-progress-v1-safety-copy';
  let levelId=1, selectedStage=null, levelReward=null, timedOut=false;
  const $ = id => document.getElementById(id);
  const colours = ['#ff667a','#55c5ff','#ffd15b','#70e6a0','#bd91ff',
    '#ff9a55','#53e2e4','#f780d8','#a8d25c','#c7adff','#fcafc0','#b8ee85'];
  const labels = {5:'Beginner',7:'Medium',9:'Hard',11:'Expert'};
  const STATS_KEY = 'gridclub-stats-v1';
  const PROGRESS_KEY = 'gridclub-progress-v04a';
  const DIFFICULTY_KEY = 'gridclub-dottrails-size';
  const DOT_NUMBERS_KEY = 'gridclub-dottrails-show-numbers';
  const PROMPTS_KEY = 'gridclub-dottrails-prompt-seen-v1';
  const RANK_TRACE_PREFIX = 'gridclub-ranked-events-v1:';
  let rankedAttempt=null, rankEligible=false, rankEvents=[], incompleteDismissed=false;
  let rankClockQueue=Promise.resolve();
  let retryPromise=null, lastCommunity=null, rankedGateActive=false;
  let rankStartGeneration=0;
  function gateRanked(show, text){
    rankedGateActive=!!show;
    $('rankGate').hidden=!rankedGateActive;
    if(text)$('rankGate').textContent=text;
  }

  const canvas = $('board'), ctx = canvas.getContext('2d');
  const utcDay = () => new Date().toISOString().slice(0,10);
  const today = () => utcDay();
  const fmtSeconds = ms => {
    const n = Math.max(0, Math.floor(ms/1000));
    return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
  };
  const groups = globalThis.GridClubWinMessages?.dotTrails || {
    general: ['You did it!','No flies on you.','You knew the score.','We have a winner!',
      'Nice one.','Consider it connected.','All tied up nicely.','You’ve cracked it.',
      'And that’s a wrap!','Not a square out of place.','Look at you go.',
      'Another one bites the dust.','A tidy bit of connecting.','That’s all connected, then.',
      'That grid didn’t see you coming!','You’re good. Very good.','Step back. We have a winner!',
      'Winning!','How did you get so good?','The results are in…'],
    quick: ['Ooft. Quick draw!','Motoring through!','No hanging about, then.',
      'Blink and you’ll miss it.','Someone’s in a hurry.','A new personal best!'],
    effort: ['That one put up a fight.','Persistence pays off.','Got there in the end!',
      'A few detours, but who’s counting?','Never in doubt. Probably.'],
    clean: ['Nice and tidy.','No hint needed.','Smooth operator.','A neat piece of work.']
  };
  let mode = 'free', size = 5, game = null, activePointerId = null;
  let dailyStartDay=today();
  let lastCell = null, side = 0, notified = false, hintPreview = null, hintUntil = 0;
  let storageAvailable = true, saveWarningShown = false, levelSaveFailed = false;
  // The visible pause overlay is ONLY for explicit user presses of Pause.
  // Backgrounding, switching games and Back quietly suspend progress instead.
  let explicitPause = false, backgroundSuspended = false;
  let promptSeen = {};
  let showDotNumbers = false;
  try { showDotNumbers = localStorage.getItem(DOT_NUMBERS_KEY) === 'true'; } catch (_) {}
  function updateDotNumbersButton() {
    const button = $('numberToggle');
    button.setAttribute('aria-pressed', String(showDotNumbers));
    button.setAttribute('aria-label', showDotNumbers ? 'Hide numbers on coloured dots' : 'Show numbers on coloured dots');
    button.title = showDotNumbers ? 'Hide numeric dot labels' : 'Increase accessibility by showing numbers on each matching pair';
    // The visible label is deliberately just '123'; aria-pressed and the title
    // give screen readers and desktop users the state and explanation.
  }

  function readJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; }
    catch (_) { return fallback; }
  }
  function writeJSON(key, value) {
    try {
      const encoded = JSON.stringify(value);
      localStorage.setItem(key, encoded);
      // Storage must actually accept and return the snapshot. A silent failure
      // must never be reported as a saved puzzle or earned wallet balance.
      if (localStorage.getItem(key) !== encoded) throw new Error('Storage did not confirm the write');
      storageAvailable = true;
      return true;
    } catch (_) { storageAvailable = false; return false; }
  }
  function readStats() {
    const data = readJSON(STATS_KEY, {});
    data.version = 2;
    data.wallet ||= {credits:0}; // reserved; no spendable credits in this release
    data.games ||= {};
    data.games.dotTrails ||= {completions:0,daily:{}};
    data.games.dotTrails.daily ||= {};
    data.games.dotTrails.results ||= [];
    data.games.dotTrails.pending ||= [];
    data.games.dotTrails.best ||= {};
    data.games.dotTrails.headlines ||= [];
    return data;
  }
  // Levels and credits are deliberately kept on the device in this beta.
  // A separate local safety copy helps with partial/corrupt writes; an
  // IndexedDB mirror covers some storage failures. Neither is cloud sync,
  // nor can either bridge separate Safari and Home Screen app containers.
  function showLevelSaveStatus(message, error=false) {
    if(levelSaveFailed&&!error)return;
    const node=$('levelSaveStatus');
    if(node){node.textContent=message;node.dataset.error=error?'true':'false';}
    if(error){
      levelSaveFailed=true;
      $('saveWarning').hidden=false;
      $('saveWarning').textContent='Your Levels progress could not be verified as saved. Keep this app open and export a backup.';
    }
  }
  function validLevelRecord(record){
    return !!record && record.version===1 && record.completed && typeof record.completed==='object' &&
      !Array.isArray(record.completed) && Array.isArray(record.ledger);
  }
  function loadLevelState(){
    let current=readJSON(LEVEL_STATE_KEY,null);
    if(!validLevelRecord(current)){
      const safe=readJSON(LEVEL_FALLBACK_KEY,null);
      if(validLevelRecord(safe)){
        current=safe;
        writeJSON(LEVEL_STATE_KEY,safe);
      }
    }
    return levelCore.normalize(current);
  }
  function openLevelMirror(){
    if(!globalThis.indexedDB)return Promise.resolve(null);
    return new Promise(resolve=>{
      try{
        const request=indexedDB.open('gridclub-level-mirror-v1',1);
        request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('backups'))request.result.createObjectStore('backups');};
        request.onsuccess=()=>resolve(request.result);
        request.onerror=()=>resolve(null);
        request.onblocked=()=>resolve(null);
      }catch(_){resolve(null);}
    });
  }
  async function mirrorLevelState(value){
    const db=await openLevelMirror();if(!db)return;
    try{
      const tx=db.transaction('backups','readwrite');
      tx.objectStore('backups').put(value,'levels');
    }catch(_){}finally{db.close();}
  }
  async function recoverLevelMirror(){
    // Never overwrite an existing localStorage wallet with an older mirror.
    if(validLevelRecord(readJSON(LEVEL_STATE_KEY,null)) || validLevelRecord(readJSON(LEVEL_FALLBACK_KEY,null)))return;
    const db=await openLevelMirror();if(!db)return;
    const recovered=await new Promise(resolve=>{
      try{
        const req=db.transaction('backups','readonly').objectStore('backups').get('levels');
        req.onsuccess=()=>resolve(req.result);
        req.onerror=()=>resolve(null);
      }catch(_){resolve(null);}
    });db.close();
    if(!validLevelRecord(recovered))return;
    if(validLevelRecord(readJSON(LEVEL_STATE_KEY,null)))return;
    if(saveLevelState(recovered)){
      showLevelSaveStatus('Saved progress recovered from this device.');
      if(!$('levelsScreen').hidden)renderLevelBrowser();
    }
  }
  function saveLevelState(value){
    const ok=writeJSON(LEVEL_STATE_KEY,value);
    if(ok){
      levelSaveFailed=false;
      try{localStorage.setItem(LEVEL_FALLBACK_KEY,JSON.stringify(value));}catch(_){}
      void mirrorLevelState(value);
      showLevelSaveStatus('Progress and Club Credits saved on this device.');
    }else showLevelSaveStatus('Saving failed. Export a backup before leaving.',true);
    return ok;
  }
  function walletBalance(){return loadLevelState().credits;}
  function exportLevelBackup(){
    const progress=readProgress();
    const levelPuzzles=Object.fromEntries(Object.entries(progress).filter(([key])=>key.startsWith('level:')));
    return {format:'gridclub-levels-backup-v1',exportedAt:new Date().toISOString(),
      levelState:loadLevelState(),levelPuzzles};
  }
  function applyLevelBackup(backup){
    if(backup?.format!=='gridclub-levels-backup-v1'||!validLevelRecord(backup.levelState))return false;
    const puzzles=backup.levelPuzzles;
    if(!puzzles||typeof puzzles!=='object'||Array.isArray(puzzles)||
       Object.keys(puzzles).some(key=>!/^level:(?:[1-9]|[1-6][0-9]|7[0-5])$/.test(key)))return false;
    // Replacing a backup is explicitly confirmed by the player, and touches
    // Levels only: Daily and Random progress and statistics are not erased.
    const previous=loadLevelState(),all=readProgress();
    if(!saveLevelState(levelCore.normalize(backup.levelState)))return false;
    for(const key of Object.keys(all))if(key.startsWith('level:'))delete all[key];
    Object.assign(all,puzzles);
    if(!writeJSON(PROGRESS_KEY,all)){
      saveLevelState(previous);return false;
    }
    return true;
  }
  function progressSlot(forMode=mode, forSize=size, forId=levelId) {
    return forMode==='daily'?`daily:${today()}`:forMode==='level'?`level:${forId}`:`free:${forSize}`;
  }
  function readProgress() { return readJSON(PROGRESS_KEY, {}); }
  function savedGame(forMode, forSize, forId=levelId) {
    const stored = readProgress()[progressSlot(forMode,forSize,forId)];
    if (!stored) return null;
    const restored = core.restore(stored);
    // A past day's puzzle should not be shown as today's challenge.
    if (!restored || (forMode === 'daily' && stored.savedDay !== today())) return null;
    if(forMode==='daily')restored.dailyDay=stored.savedDay;
    if(forMode==='level'){
      restored.extraTimeMs=Number(stored.extraTimeMs||0);
      restored.extraTimeCount=Number(stored.extraTimeCount||0);
      // v0.9.8: previously untimed first puzzles are now time trials.
      // If the player has an unfinished saved board, preserve all their paths
      // and award the full new countdown on first return, rather than counting
      // time played under the old rules against them.
      const openingSeconds=levelCore.get(forId)?.limitSec;
      if(restored.level.limitMs==null && Number.isFinite(openingSeconds)){
        restored.level.limitMs=core.elapsed(restored)+openingSeconds*1000;
      }
    }
    return restored;
  }
  function persist() {
    if (!game) return false;
    const all = readProgress();
    const snap = core.serialize(game);
    snap.savedDay = mode==='daily'?(game.dailyDay||dailyStartDay):today();
    if(mode==='level'){snap.extraTimeMs=game.extraTimeMs||0;snap.extraTimeCount=game.extraTimeCount||0;snap.levelId=levelId;}

    all[mode==='daily'?`daily:${snap.savedDay}`:progressSlot()] = snap;
    // Keep the most recent days only; personal results remain in statistics.
    Object.keys(all).filter(k => k.startsWith('daily:') && k !== `daily:${today()}` && k!==`daily:${snap.savedDay}`)
      .forEach(k => delete all[k]);
    const ok = writeJSON(PROGRESS_KEY,all);
    if (!ok && !saveWarningShown) {
      saveWarningShown = true;
      $('saveWarning').hidden = false;
    }
    return ok;
  }
  function dailySolved() {
    return !!readStats().games.dotTrails.daily[today()];
  }
  function expireLocalSubmissions(){
    const stats=readStats(),item=stats.games.dotTrails;
    let dirty=false;
    for(const r of item.results){
      if(r.mode==='daily'&&r.date<today()&&!r.verified&&r.sync!=='expired'&&r.sync!=='review'){
        r.sync='expired';dirty=true;
      }
    }
    for(const r of Object.values(item.daily)){
      if(r&&r.date<today()&&!r.verified&&r.sync!=='expired'&&r.sync!=='review'){
        r.sync='expired';dirty=true;
      }
    }
    const pending=item.pending.filter(r=>r.mode==='daily'&&r.date>=today()&&!r.verified&&r.sync!=='review');
    if(pending.length!==item.pending.length){item.pending=pending;dirty=true;}
    if(dirty)writeJSON(STATS_KEY,stats);
  }
  function updateHome() {
    const solved=dailySolved();
    $('solvedTag').hidden = !solved;
    $('dailyStartText').textContent = dailySolved() ? 'View today’s stats' :
      savedGame('daily',11) ? 'Continue today’s puzzle' : 'Play today’s puzzle';
    $('freeStartText').textContent = 'Dot Trails';
    const progress=loadLevelState();
    const finished=Object.keys(progress.completed).filter(id=>progress.completed[id]).length;
    if($('levelsSubtitle'))$('levelsSubtitle').textContent=finished?`${finished}/75 complete · Earn credits`:'Complete levels · Earn credits';
  }
  function saveDifficulty() { try { localStorage.setItem(DIFFICULTY_KEY,String(size)); } catch (_) {} }
  function loadDifficulty() {
    const n = Number(readJSON(DIFFICULTY_KEY,5));
    return core.SIZES.includes(n) ? n : 5;
  }
  function randomSeed() {
    if (globalThis.crypto?.getRandomValues) return crypto.getRandomValues(new Uint32Array(1))[0];
    return Math.floor(Math.random()*0x100000000);
  }
  function label() { return mode==='daily'?'Daily challenge':mode==='level'?`Level ${game?.level?.stage||levelCore.get(levelId)?.stage}`:labels[size]; }
  function dailyLevelSeed() { return core.hash(`gridclub-dottrails-daily-v04a-${dailyStartDay}-11`); }
  function freshGame() {
    const fixed=mode==='level'?levelCore.get(levelId):null;
    const seed = mode === 'daily' ? dailyLevelSeed() : fixed?fixed.seed:randomSeed();
    const plain=core.generate(size,seed,{daily:mode==='daily'});
    const curatedPath=Number.isInteger(fixed?.blockedPathIndex)?plain.solution[fixed.blockedPathIndex]:null;
    const blocked=fixed?.blocked?.length?core.withBlocked(plain,fixed.blocked):
      curatedPath?core.withBlocked(plain,curatedPath):plain;
    // Curated Hard/Expert levels gain extra coloured pairs by splitting
    // existing complete solution paths. Previous saved boards remain playable.
    const puzzle=fixed?.extraPairs?core.withExtraPairs(blocked,fixed.extraPairs):blocked;
    if(fixed){puzzle.levelId=fixed.id;puzzle.stage=fixed.stage;puzzle.step=fixed.step;puzzle.limitMs=fixed.limitSec===null?null:fixed.limitSec*1000;}
    const g=core.create(puzzle);
    if(fixed){g.extraTimeMs=0;g.extraTimeCount=0;}
    if(mode==='daily')g.dailyDay=dailyStartDay;
    return g;
  }
  function setGame(newGameObject) {
    game = newGameObject;
    if(mode==='daily')dailyStartDay=game.dailyDay||today();
    // Re-entering a puzzle from Home is an explicit request to play, not to see
    // the Pause screen. Progress was saved when the player left.
    if (mode==='level'){
      game.extraTimeMs=game.extraTimeMs||0;game.extraTimeCount=game.extraTimeCount||0;
    }
    timedOut=mode==='level' && !game.finishedAt && remainingLevelMs()!==null && remainingLevelMs()<=0;
    // A restored expired countdown must stop while the player chooses a boost
    // or retry. Otherwise time would keep running behind the timeout dialog.
    if(timedOut && !game.paused)core.pause(game);
    if (game.paused && !game.finishedAt && !timedOut) core.resume(game);
    explicitPause = false; backgroundSuspended = false;
    notified = false; activePointerId = null;lastCell = null;hintPreview=null;hintUntil=0;
    incompleteDismissed=false;
    promptSeen=readJSON(PROMPTS_KEY,{});
    $('playPrompt').hidden=true;
    rankedAttempt=null;rankEligible=false;rankEvents=[];
    gateRanked(false);
    if(mode==='daily'){
      const savedTrace=readJSON(RANK_TRACE_PREFIX+dailyStartDay,null);
      if(savedTrace?.attemptId===game.attemptId&&Array.isArray(savedTrace.events)){
        rankEvents=savedTrace.events;
        rankedAttempt=savedTrace.serverAttemptId||null;
        rankEligible=!!(rankedAttempt&&savedTrace.eligible!==false);
      }
    }
    $('win').classList.remove('show','levelUp');
    $('levelUpCelebration').hidden=true;
    $('timeUpLayer').hidden=!timedOut;
    if(timedOut)refreshTimeUpBoost();
    levelReward=null;
    $('incomplete').hidden = true; $('hintStatus').hidden = true;
    $('modeTitle').textContent = mode === 'daily' ? `Daily challenge · ${dailyStartDay}` : mode==='level'?`Level ${game.level.stage} · Puzzle ${game.level.step}/5`:`${label()} · ${size}×${size}`;
    $('boardTitle').textContent = mode === 'daily' ? 'Daily Dot Trails' : mode==='level'?`Dot Trails · ${labels[size]}`:`Dot Trails · ${label()}`;
    $('next').textContent = mode === 'daily' ? 'Try Free Play' : mode==='level' && levelId===75 ? 'See your Levels →' : mode==='level' ? `Continue Level ${game.level.stage+(game.level.step===5?1:0)} →` : 'Next puzzle';
    $('returnWinHome').hidden = mode !== 'daily';
    $('winToLevels').hidden = mode!=='level';
    $('winToLevels').textContent='Return to Levels overview';
    $('win').dataset.stage = mode==='level'?String(game.level.stage):'';
    // A new game must not retain the prior result screen's daily navigation.
    $('dotDailyNextWin').hidden=true;
    $('dotDailyTomorrowWin').hidden=true;
    $('winDifficultyActions').hidden = mode !== 'free';
    $('winToRandom').hidden = mode !== 'free';
    $('winEasier').disabled = size === 5;
    $('winHarder').disabled = size === 11;
    $('rankingBox').hidden=true;
    $('new').hidden = mode !== 'free';
    $('extraTime').hidden=mode!=='level'||game.level.limitMs===null;
    $('hintCost').hidden=mode!=='level';
    $('levelProgressLine').hidden=mode!=='level';
    $('timeLabel').textContent=mode==='level'&&game.level.limitMs!==null?'◷ Left':'◷ Time';
    $('levelReward').hidden=true;
    syncPauseLayer();
    render();
    persist();
    requestAnimationFrame(resize);
    if(mode==='daily' && !game.finishedAt) { if(navigator.onLine&&window.GridRanked?.configured)gateRanked(true);startRankedAttempt(); }
    else if(mode==='daily' && game.finishedAt) {refreshLeaderboard(readStats().games.dotTrails.daily[today()]);retryPendingDaily();}
  }
  function showPage(page) {
    $('home').hidden = page !== 'home';
    $('difficultyScreen').hidden = page !== 'choose';
    $('randomScreen').hidden = page !== 'random';
    $('gameScreen').hidden = page !== 'game';
    $('statsScreen').hidden = page !== 'stats';
    $('levelsScreen').hidden = page !== 'levels';
    // Leaving a result permanently closes its overlay. Stats never navigates back to it.
    if (page !== 'game') {
      $('win').classList.remove('show','levelUp');
      $('timeUpLayer').hidden=true;
      explicitPause = false; backgroundSuspended = false;rankStartGeneration++;gateRanked(false);
    }
    syncPauseLayer();
  }
  function updateDifficultyMenu() {
    document.querySelectorAll('[data-size]').forEach(button => {
      const n = Number(button.dataset.size);
      const saved = savedGame('free',n);
      const unfinished = !!(saved && !saved.finishedAt &&
        (Object.keys(saved.paths).length > 0 || core.elapsed(saved) > 3000));
      button.querySelector('.levelAction').textContent = unfinished ? 'Continue →' : 'Start →';
    });
  }
  function showRandomScreen(){
    if(!$('gameScreen').hidden && !game?.finishedAt)suspendSilently();
    updateDifficultyMenu();
    showPage('random');
  }
  function showStatsScreen(){
    // Moving on from a completed result is final; the results panel is not reopened.
    if(!$('gameScreen').hidden && !game?.finishedAt)suspendSilently();
    showPage('stats');
    renderStatsPage();
    refreshLeaderboard();
    retryPendingDaily();
  }
  function statBox(label,value){
    const box=document.createElement('div');box.className='overviewItem';
    const l=document.createElement('small');l.textContent=label;
    const v=document.createElement('strong');v.textContent=value;
    box.append(l,v);return box;
  }
  function renderStatsPage(){
    const reports=statsUtil.summarize(readStats().games.dotTrails.results);
    const progression=loadLevelState();
    const levelsComplete=Object.keys(progression.completed).filter(id=>progression.completed[id]).length;
    const stagesComplete=Array.from({length:15},(_,i)=>i+1).filter(stage=>levelCore.stageItems(stage).every(item=>progression.completed[item.id])).length;
    const overview=$('statsOverview');overview.replaceChildren(
      statBox('Total puzzles',String(reports.total)),
      statBox('Daily completions',String(reports.daily.count)),
      statBox('Levels',`${levelsComplete}/75`),
      statBox('Stages',`${stagesComplete}/15`)
    );
    const levels=$('difficultyStats');levels.replaceChildren();
    for(const x of reports.levels){
      const card=document.createElement('div');card.className='difficultyStat';
      const name=document.createElement('strong');name.textContent=`${x.name} · ${x.size}×${x.size}`;
      const detail=document.createElement('small');
      detail.textContent=x.count?`${statsUtil.plural(x.count,'puzzle')} · Average ${statsUtil.fmt(x.averageMs)} · Best ${statsUtil.fmt(x.bestMs)} · ${x.averageMoves} avg moves · ${x.assistedCount} assisted`:'No puzzles completed yet';
      card.append(name,detail);levels.append(card);
    }
    const daily=$('dailyStats');daily.replaceChildren(
      statBox('Daily average',reports.daily.count?statsUtil.fmt(reports.daily.averageMs):'—'),
      statBox('Daily best',reports.daily.count?statsUtil.fmt(reports.daily.bestMs):'—')
    );
    $('communityDay').textContent='· '+today();
    renderCommunityPage();
  }
  function renderCommunityPage(){
    const box=$('communitySummary');box.replaceChildren();
    if(!lastCommunity){box.textContent=navigator.onLine?'Press Refresh leaderboard to check verified results.':'You are offline. Personal statistics remain available.';return;}
    const total=Number(lastCommunity.total||0);
    const title=document.createElement('p');title.textContent=total===1?'1 unassisted player today':`${total} unassisted players today`;
    box.append(title);
    if(!total){const info=document.createElement('p');info.textContent='No unassisted ranked completions yet.';box.append(info);}
    const mine=dailyRecord();
    if(mine?.assisted){const m=document.createElement('p');m.textContent=`Your assisted result: ${fmtSeconds(mine.serverElapsedMs||mine.elapsedMs)} · ${mine.serverMoves??mine.moves} moves. Hints exclude this result from the leaderboard, but it remains in your personal stats.`;box.append(m);}
    if(!total)return;
    for(const [name,group,assisted] of [['Unassisted',lastCommunity.unassisted,false]]){
      const c=document.createElement('div');c.className='communityCard';
      const h=document.createElement('strong');h.textContent=name;
      const lines=statsUtil.communityLines(group,assisted);
      const b=document.createElement('p');b.textContent=lines.summary;
      c.append(h,b);
      if(lines.detail){const d=document.createElement('small');d.textContent=lines.detail;c.append(d);}
      box.append(c);
    }
  }
  function showLevelBrowser(stage){
    if(!$('gameScreen').hidden && !game?.finishedAt)suspendSilently();
    selectedStage=Number.isInteger(stage)?stage:null;
    showPage('levels');
    renderLevelBrowser();
  }
  function renderLevelBrowser(){
    const progress=loadLevelState();
    $('levelsWallet').textContent=String(progress.credits);
    if(!saveWarningShown)showLevelSaveStatus(Object.keys(progress.completed).length?`Saved on this device · ${Object.keys(progress.completed).length}/75 puzzles complete`:'No completed levels found in this app’s local storage.');
    const list=$('stageList'),detail=$('stageDetail');
    const hasStage=!!selectedStage;
    list.hidden=hasStage;detail.hidden=!hasStage;
    if(!hasStage){
      list.replaceChildren();
      for(let stage=1;stage<=15;stage++){
        const items=levelCore.stageItems(stage),first=items[0];
        const done=items.filter(x=>progress.completed[x.id]).length;
        const allowed=levelCore.unlocked(progress,first.id);
        const btn=document.createElement('button');btn.type='button';btn.className='stageCard';btn.disabled=!allowed;btn.dataset.stage=String(stage);
        const left=document.createElement('span'),title=document.createElement('strong'),desc=document.createElement('small');
        title.textContent=`Level ${stage} · ${labels[first.size]}`;
        desc.textContent=`${done}/5 puzzles complete · ${first.size}×${first.size}`;
        left.append(title,desc);
        const tag=document.createElement('span');tag.className='tag';tag.textContent=done===5?'✓ Complete':allowed?'Play →':'🔒 Locked';
        btn.append(left,tag);btn.onclick=()=>showLevelBrowser(stage);list.append(btn);
      }
    }else{
      const items=levelCore.stageItems(selectedStage),first=items[0];
      detail.dataset.stage=String(selectedStage);
      $('stageHeading').textContent=`Level ${selectedStage} · ${labels[first.size]}`;
      $('stageSubheading').textContent='All five puzzles timed · Puzzle 1 has a generous countdown'+(items.some(item=>item.blocked?.length)?' · ■ Blocked squares':'');
      const list=$('stagePuzzles');list.replaceChildren();
      for(const item of items){
        const btn=document.createElement('button');btn.type='button';btn.className='stagePuzzle';
        const unlocked=levelCore.unlocked(progress,item.id),done=!!progress.completed[item.id];btn.disabled=!unlocked;btn.dataset.stage=String(item.stage);
        const left=document.createElement('span'),title=document.createElement('strong'),desc=document.createElement('small');
        title.textContent=`Puzzle ${item.step} · #${item.id}`;
        desc.textContent=(done&&progress.best[item.id]?`Best ${fmtSeconds(progress.best[item.id].elapsedMs)} · ${progress.best[item.id].moves} moves`:(item.limitSec===null?'Untimed':`Countdown ${fmtSeconds(item.limitSec*1000)}`))+(item.blocked?.length?' · ■ Blocked':'');
        left.append(title,desc);
        const tag=document.createElement('span');tag.className='tag';tag.textContent=done?'✓ Replay':unlocked?'Start →':'🔒';
        btn.append(left,tag);btn.onclick=()=>startLevel(item.id);list.append(btn);
      }
    }
  }
  function startLevel(id){
    const target=levelCore.get(id);
    if(!target||!levelCore.unlocked(loadLevelState(),id))return;
    if(!$('gameScreen').hidden&&!game?.finishedAt)suspendSilently();
    mode='level';levelId=target.id;size=target.size;
    explicitPause=false;backgroundSuspended=false;
    showPage('game');
    const saved=savedGame('level',size,levelId);
    setGame(saved&&!saved.finishedAt?saved:freshGame());
  }
  function remainingLevelMs(){
    if(mode!=='level'||!game||game.level.limitMs===null||game.level.limitMs===undefined)return null;
    return game.level.limitMs+(game.extraTimeMs||0)-core.elapsed(game);
  }
  function refreshTimeUpBoost(){
    const balance=walletBalance(),used=Math.min(2,game?.extraTimeCount||0);
    const seconds=(2-used)*15,cost=used===0?30:20;
    const canBoost=mode==='level'&&game&&!game.finishedAt&&seconds>0&&balance>=cost;
    const button=$('timeUpBoost'),note=$('timeUpBoostNote');
    button.textContent=seconds?`Continue +${seconds} seconds · ${cost} ◉`:'No extensions remaining';
    button.disabled=!canBoost;
    button.setAttribute('aria-disabled',String(!canBoost));
    if(!seconds)note.textContent='You have already used your full 30 seconds of extra time.';
    else if(balance<cost)note.textContent=`Not enough Club Credits (${balance}/${cost}) · Retry is free`;
    else note.textContent=`Balance: ${balance} ◉ · Resume the same attempt`;
    note.dataset.available=String(canBoost);
  }
  function triggerTimeout(){
    if(timedOut||!game||game.finishedAt)return;
    timedOut=true;
    if(activePointerId!==null)release();
    if(!game.paused)core.pause(game);
    hidePlayPrompt();$('timeUpLayer').hidden=false;
    refreshTimeUpBoost();
    persist();
  }
  function buyExtraTime(){
    if(mode!=='level'||!game||game.finishedAt||game.level.limitMs===null)return false;
    // If time has actually expired between animation frames, charge the
    // rescue price, not the cheaper in-play extension price.
    if(!timedOut&&remainingLevelMs()<=0)triggerTimeout();
    const used=game.extraTimeCount||0;
    const rescue=timedOut;
    const seconds=rescue?(2-used)*15:15;
    const cost=rescue?(used===0?30:20):10;
    const kind=rescue?'extra-time-rescue':'extra-time';
    const p=loadLevelState();
    if(used>=2||p.credits<cost){
      if(rescue)refreshTimeUpBoost();
      else{$('hintStatus').hidden=false;$('hintStatus').textContent=used>=2?'Both time extensions have been used.':`You need ${cost} Club Credits for +15 seconds.`;}
      return false;
    }
    if(!levelCore.spend(p,cost,kind,game.attemptId)){
      if(rescue)refreshTimeUpBoost();
      else{$('hintStatus').hidden=false;$('hintStatus').textContent='Could not spend Club Credits for this extension.';}
      return false;
    }
    if(!saveLevelState(p))return false;
    game.extraTimeMs=(game.extraTimeMs||0)+seconds*1000;
    game.extraTimeCount=rescue?2:used+1;
    timedOut=false;$('timeUpLayer').hidden=true;
    if(game.paused)core.resume(game);
    persist();render();return true;
  }
  function retryLevel(){
    if(mode!=='level')return;
    // An unsuccessful first attempt is no longer eligible for puzzle credits.
    // Spending +15s on the time-up screen instead continues the same attempt.
    if(!game?.finishedAt){
      const p=loadLevelState();
      if(levelCore.forfeitFirstAttempt(p,levelId))saveLevelState(p);
    }
    timedOut=false;$('timeUpLayer').hidden=true;
    setGame(freshGame());
  }
  function showDifficultyScreen() {
    if (!$('gameScreen').hidden) suspendSilently();
    updateHome();
    showPage('choose');
    updateDifficultyMenu();
  }
  function start(nextMode, chosenSize) {
    if (!$('gameScreen').hidden && !game?.finishedAt) suspendSilently();
    // Previously completed Daily Challenges lead to stats, not an old result screen.
    if(nextMode==='daily' && dailySolved()) { showStatsScreen(); return; }
    mode = nextMode;
    if(mode==='daily')dailyStartDay=today();
    size = mode === 'daily' ? 11 : (core.SIZES.includes(chosenSize) ? chosenSize : loadDifficulty());
    if (mode === 'free') saveDifficulty();
    explicitPause = false; backgroundSuspended = false;
    showPage('game');
    const saved = savedGame(mode,size);
    // A completed board is never reopened after the player leaves its results.
    const selected = saved && !saved.finishedAt ? saved : freshGame();
    setGame(selected);
  }
  function newGame(requested=size) {
    if (mode !== 'free') return;
    size = core.SIZES.includes(requested) ? requested : size;
    saveDifficulty();
    setGame(freshGame());
  }
  function resize() {
    if ($('gameScreen').hidden || !game) return;
    side = Math.round(canvas.getBoundingClientRect().width);
    if (!side) return;
    const dpr = Math.min(window.devicePixelRatio || 1,3);
    canvas.width = Math.floor(side*dpr);canvas.height = Math.floor(side*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);draw();
  }
  function roundedRect(x,y,w,h,r,color) {
    ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
  }
  function draw() {
    if (!game || !side) return;
    ctx.clearRect(0,0,side,side);
    roundedRect(0,0,side,side,16,'#0e1424');
    const cell = side/size;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
      const inset=cell*.035;
      const p={x,y};
      if(core.isBlocked(game.level,p)) {
        roundedRect(x*cell+inset,y*cell+inset,cell-2*inset,cell-2*inset,Math.max(2,cell*.12),'#101826');
        ctx.save();ctx.strokeStyle='#43516a';ctx.lineWidth=Math.max(1,cell*.035);
        ctx.globalAlpha=.65;
        const cx=(x+.5)*cell,cy=(y+.5)*cell,r=cell*.15;
        ctx.beginPath();ctx.moveTo(cx-r,cy-r);ctx.lineTo(cx+r,cy+r);
        ctx.moveTo(cx+r,cy-r);ctx.lineTo(cx-r,cy+r);ctx.stroke();ctx.restore();
      } else {
        roundedRect(x*cell+inset,y*cell+inset,cell-2*inset,cell-2*inset,Math.max(2,cell*.12),'#253147');
      }
    }
    for(const [id,path] of Object.entries(game.paths)) {
      if(!path?.length)continue;
      ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo((p.x+.5)*cell,(p.y+.5)*cell):ctx.moveTo((p.x+.5)*cell,(p.y+.5)*cell));
      ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=cell*.30;
      ctx.strokeStyle=colours[Number(id)%colours.length];ctx.globalAlpha=.92;ctx.stroke();ctx.globalAlpha=1;
      if(path.length>1 && !core.connected(game,Number(id))) {
        const tip=path[path.length-1];ctx.beginPath();ctx.arc((tip.x+.5)*cell,(tip.y+.5)*cell,cell*.14,0,Math.PI*2);
        ctx.fillStyle='#ffffff';ctx.fill();
      }
    }
    if(hintPreview && hintUntil > Date.now() && !game.paused && !game.finishedAt) {
      ctx.save();ctx.beginPath();
      hintPreview.cells.forEach((p,i)=>i?ctx.lineTo((p.x+.5)*cell,(p.y+.5)*cell):ctx.moveTo((p.x+.5)*cell,(p.y+.5)*cell));
      ctx.strokeStyle='#ffffff';ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=Math.max(3,cell*.13);
      ctx.setLineDash([cell*.19,cell*.14]);ctx.stroke();ctx.restore();
    }
    for(const pair of game.level.pairs)for(const p of [pair.a,pair.b]) {
      const x=(p.x+.5)*cell,y=(p.y+.5)*cell,r=cell*.29;
      ctx.beginPath();ctx.arc(x,y,r*1.31,0,Math.PI*2);
      ctx.fillStyle=colours[pair.id%colours.length];ctx.globalAlpha=.2;ctx.fill();ctx.globalAlpha=1;
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fillStyle=colours[pair.id%colours.length];ctx.fill();
      ctx.beginPath();ctx.arc(x-r*.1,y-r*.16,r*.2,0,Math.PI*2);ctx.fillStyle='#ffffff55';ctx.fill();
      // Optional accessibility feature: numeric labels on all pairs, off by default.
      if(showDotNumbers) {
        ctx.fillStyle='#101624';ctx.font=`800 ${Math.max(9,cell*.31)}px system-ui`;
        ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(pair.id+1),x,y+1);
      }
    }
  }
  function pickHeadline(info, stats) {
    const recent = stats.games.dotTrails.headlines || [];
    let candidates = groups.general.slice();
    if (info.newBest && info.hadBest) candidates = candidates.concat(groups.quick,groups.quick);
    if (game.resets > 0) candidates = candidates.concat(groups.effort);
    if (game.hints===0 && game.resets===0) candidates = candidates.concat(groups.clean);
    const fresh = candidates.filter(s => !recent.includes(s));
    const pool = fresh.length ? fresh : candidates;
    const line = pool[Math.floor(Math.random()*pool.length)];
    stats.games.dotTrails.headlines = [...recent.slice(-5),line];
    return line;
  }
  function recordCompletion() {
    const stats = readStats(), item = stats.games.dotTrails;
    const existing = item.results.find(r=>r.attemptId===game.attemptId);
    if(existing) return existing;
    levelReward=null;
    if(mode==='level'){
      const p=loadLevelState();
      levelReward=levelCore.record(p,levelId,Math.round(core.elapsed(game)),game.moves,game.hints);
      if(!saveLevelState(p))levelReward={accepted:false,earned:0,stageBonus:0,saveFailed:true};
    }
    const k = mode==='daily' ? 'daily' : String(size);
    const elapsedMs = Math.round(core.elapsed(game));
    const previousBest = item.best[k];
    const info = {newBest:previousBest===undefined||elapsedMs<previousBest,hadBest:previousBest!==undefined};
    if(info.newBest) item.best[k] = elapsedMs;
    const date = mode==='daily'?(game.dailyDay||dailyStartDay):today();
    const result = {
      attemptId:game.attemptId, game:'dotTrails', mode, date, size,
      puzzleId:mode==='level'?`dottrails-level-${levelId}`:`dottrails-v04a-${size}-${game.level.seed}-${mode==='daily'?date:'free'}`,
      levelId:mode==='level'?levelId:null,
      elapsedMs, moves:game.moves, hints:game.hints, resets:game.resets,
      assisted:game.hints>0||(mode==='level'&&(game.extraTimeCount||0)>0), verified:false, sync:mode==='daily'?'pending':'local',
      firstDaily:mode!=='daily'||!item.daily[date],
      finishedAt:new Date(game.finishedAt).toISOString()
    };
    result.headline=pickHeadline(info,stats);
    item.results.push(result);item.results=item.results.slice(-250);
    if(mode==='daily'){item.pending.push(result);item.pending=item.pending.slice(-250);}
    item.completions=(item.completions||0)+1;
    item.byDifficulty ||= {};
    item.byDifficulty[k]=(item.byDifficulty[k]||0)+1;
    item.lastResult=result;
    if(mode==='daily'&&!item.daily[date])item.daily[date]=result;
    const ok=writeJSON(STATS_KEY,stats);
    if(!ok)result.saveFailed=true;
    // Local completion earns one award per game per UTC day, even if the
    // leaderboard connection is unavailable. No credits for practice replays.
    if(ok&&mode==='daily'&&result.firstDaily){
      const award=globalThis.GridClubCredits?.award('club:dot:daily:'+date,10,'daily-dot-trails');
      result.dailyCredits=award?.awarded||0;
      result.dailyCreditSaveFailed=!!award?.saveFailed;
    }
    return result;
  }
  function saveRankTrace(){
    if(mode==='daily'&&game)writeJSON(RANK_TRACE_PREFIX+dailyStartDay,{
      attemptId:game.attemptId,serverAttemptId:rankedAttempt,
      eligible:rankEligible,events:rankEvents
    });
  }
  function logRank(action,p){
    if(mode!=='daily'||!game)return;
    if(rankEvents.length>=7000){rankEligible=false;saveRankTrace();return;}
    rankEvents.push(p?{action,x:p.x,y:p.y}:{action});
    saveRankTrace();
  }
  async function startRankedAttempt(){
    if(!window.GridRanked?.configured||!navigator.onLine||!game||game.finishedAt||dailyStartDay!==today()){gateRanked(false);return;}
    const localAttemptId=game.attemptId, generation=++rankStartGeneration;
    gateRanked(true,'Connecting you to today’s challenge…');
    try{
      const reply=await GridRanked.call('start',{day:dailyStartDay});
      if(generation!==rankStartGeneration||mode!=='daily'||!game||game.attemptId!==localAttemptId||game.finishedAt)return;
      const hadServerAttempt=rankedAttempt===reply.attemptId && rankEligible;
      rankedAttempt=reply.attemptId;
      rankEligible=reply.state!=='completed' && (hadServerAttempt || (rankEvents.length===0&&core.filled(game)===0&&game.moves===0));
      saveRankTrace();
      if(reply.state==='paused'&&rankEligible)await GridRanked.call('resume',{attemptId:rankedAttempt});
    }catch(e){rankEligible=false;saveRankTrace();console.warn('Ranked session unavailable',e);}
    finally{
      if(generation===rankStartGeneration){gateRanked(false);render();}
    }
  }
  function rankedClock(action){
    if(!rankEligible||!rankedAttempt||!navigator.onLine)return rankClockQueue;
    const attemptId=rankedAttempt;
    rankClockQueue=rankClockQueue.then(()=>GridRanked.call(action,{attemptId}))
      .catch(e=>{rankEligible=false;saveRankTrace();console.warn('Ranked clock sync failed',e);});
    return rankClockQueue;
  }
  function freezeRankedOnCompletion(){
    if(!rankEligible||!rankedAttempt||!navigator.onLine)return;
    const attemptId=rankedAttempt;
    // A failed network request at the finish must not erase an otherwise
    // valid queued completion. Retry on return while the same day is active.
    rankClockQueue=rankClockQueue.then(()=>GridRanked.call('pause',{attemptId}))
      .catch(e=>console.warn('Ranked finish freeze could not reach server; retry will be attempted',e));
  }
  function dailyRecord(){return readStats().games.dotTrails.daily[today()]||null;}
  function renderWinCommunity(result){
    const box=$('rankingBox');box.hidden=true;box.replaceChildren();
    return; // Detailed rankings and assisted/unassisted labels belong on Your statistics.
    const total=Number(lastCommunity?.total||0);
    const head=document.createElement('strong');head.textContent=total===1?'Today\'s verified results · 1 player':`Today\'s verified results · ${total} players`;
    box.append(head);
    if(!total){box.append(document.createTextNode('No verified community results yet. Be among the first!'));return;}
    if(result?.verified&&result.date===today()&&total===1){
      box.append(document.createTextNode('You are the first verified player today! Community comparisons will appear as more players finish.'));
      return;
    }
    for(const [name,group,assisted] of [['Unassisted',lastCommunity.unassisted,false],['Assisted',lastCommunity.assisted,true]]){
      const line=document.createElement('div');
      const r=statsUtil.communityLines(group,assisted);
      line.textContent=`${name}: ${r.summary}`;
      box.append(line);
      if(result?.verified&&result.assisted===assisted&&r.detail){const extra=document.createElement('div');extra.textContent=r.detail;box.append(extra);}
    }
  }
  async function refreshLeaderboard(result){
    if(!window.GridRanked?.configured||!navigator.onLine)return;
    try{
      const stats=await GridRanked.call('stats',{day:today()});
      lastCommunity=stats;
      if(mode==='daily'&&!$('gameScreen').hidden)renderWinCommunity(result||dailyRecord());
      if(!$('statsScreen').hidden)renderCommunityPage();
    }catch(e){console.warn('Community stats unavailable',e);if(!$('statsScreen').hidden)$('communitySummary').textContent='Community statistics unavailable. Your own results remain saved.';}
  }
  function saveVerifiedResult(result,reply){
    const stats=readStats(),item=stats.games.dotTrails;
    const matching=r=>r&&r.attemptId===result.attemptId&&r.date===result.date;
    for(const r of item.results)if(matching(r))Object.assign(r,{verified:!!reply.verified,
      sync:reply.verified?'verified':'review',serverElapsedMs:reply.elapsedMs,serverMoves:reply.moves});
    for(const r of Object.values(item.daily))if(matching(r))Object.assign(r,{verified:!!reply.verified,
      sync:reply.verified?'verified':'review',serverElapsedMs:reply.elapsedMs,serverMoves:reply.moves});
    if(matching(item.lastResult))Object.assign(item.lastResult,{verified:!!reply.verified,
      sync:reply.verified?'verified':'review',serverElapsedMs:reply.elapsedMs,serverMoves:reply.moves});
    item.pending=item.pending.filter(r=>!matching(r));
    writeJSON(STATS_KEY,stats);
    Object.assign(result,{verified:!!reply.verified,sync:reply.verified?'verified':'review',
      serverElapsedMs:reply.elapsedMs,serverMoves:reply.moves});
    if(mode==='daily'&&!$('gameScreen').hidden&&game?.attemptId===result.attemptId){
      $('resultStatus').hidden=false;
      $('resultStatus').textContent=reply.verified?(result.assisted?'Your result is verified and saved. Using hints excludes it from the leaderboard, but here are your stats.':'Verified! Your unassisted result is on the community leaderboard.'):'Your result is saved and awaiting a fair-play review.';
      $('winMessage').textContent=`Daily Challenge · ${fmtSeconds(reply.elapsedMs)} ranked time · ${reply.moves} moves`;
    }
  }
  // Invoked from Home on load, page return and reconnect. A locally solved
  // puzzle can be retried today without showing or replaying its board.
  function retryPendingDaily(){
    if(retryPromise)return retryPromise;
    const result=dailyRecord();
    if(!result||result.mode!=='daily'||result.date!==today()||result.verified||result.sync==='review'||result.sync==='expired')return Promise.resolve();
    if(!navigator.onLine||!window.GridRanked?.configured)return Promise.resolve();
    const trace=readJSON(RANK_TRACE_PREFIX+today(),null);
    if(!trace||trace.attemptId!==result.attemptId||!Array.isArray(trace.events)||!trace.events.length||trace.eligible===false){
      return Promise.resolve();
    }
    retryPromise=(async()=>{
      try{
        await rankClockQueue;
        const s=await GridRanked.call('status',{day:today()});
        const a=s.attempt;
        if(!a){if(mode==='daily'&&!$('gameScreen').hidden)$('resultStatus').textContent='Achievement saved locally, but no ranked attempt was started.';return;}
        if(trace.serverAttemptId&&a.attemptId!==trace.serverAttemptId)return;
        let reply;
        if(a.state==='completed')reply={verified:!!a.verified,elapsedMs:a.elapsedMs,moves:a.moves};
        else if(a.state==='active'||a.state==='paused'){
          reply=await GridRanked.call('submit',{attemptId:a.attemptId,day:today(),events:trace.events});
        }else return;
        saveVerifiedResult(result,reply);
        await refreshLeaderboard(result);
      }catch(e){
        console.warn('Pending daily submission will retry while challenge remains active:',e);
        if(mode==='daily'&&!$('gameScreen').hidden&&game?.finishedAt){
          $('resultStatus').textContent=`Achievement saved locally. Verification pending: ${String(e?.message||e).slice(0,125)}`;
        }
      }finally{retryPromise=null;}
    })();
    return retryPromise;
  }
  async function submitRankedResult(result){
    if(mode!=='daily'||!result)return;
    const status=$('resultStatus');
    if(result.date!==today()){status.textContent='This Daily Challenge has ended. Your achievement is saved locally, but the leaderboard is closed.';return;}
    if(result.verified){status.textContent=result.assisted?'Your assisted result was saved to your stats, not the leaderboard.':'Verified result saved on the unassisted leaderboard.';await refreshLeaderboard(result);return;}
    if(result.sync==='review'){status.textContent='This result is awaiting a fair-play review.';await refreshLeaderboard(result);return;}
    if(!navigator.onLine){status.textContent="You're offline, but your achievement is saved. We'll try to submit it when you're online, if today's challenge is still active.";return;}
    if(!window.GridRanked?.configured){status.textContent='Achievement saved on this device. Community rankings will appear once the backend is connected.';return;}
    if(!rankEligible||!rankedAttempt){
      status.textContent='Achievement saved on this device. This attempt was not started with a verified online timer.';
      await refreshLeaderboard(result);return;
    }
    status.textContent='Achievement saved. Checking your ranked result…';
    await retryPendingDaily();
  }
  function showWin(result) {
    const title=$('winTitle');
    title.textContent=result.headline||'Nice one.';
    // Replay the entrance animation for each new completion.
    title.classList.remove('victoryAnimate');
    void title.offsetWidth;
    title.classList.add('victoryAnimate');
    $('winMessage').textContent=`${label()} · ${fmtSeconds(result.elapsedMs)} · ${result.moves} moves`;
    $('rankingBox').hidden = mode !== 'daily';
    $('dotDailyCreditReward').hidden=mode!=='daily'||(!result.dailyCredits&&!result.dailyCreditSaveFailed);
    $('dotDailyCreditReward').textContent=result.dailyCreditSaveFailed?
      'Your credit reward could not be saved.':
      result.dailyCredits?`+${result.dailyCredits} Club Credits · Balance ${walletBalance()} ◉`:'';
    const newLevelUp=mode==='level'&&game.level.step===5&&Number(levelReward?.stageBonus||0)>0;
    const celebration=$('levelUpCelebration'),finalLevelUp=newLevelUp&&levelId===75;
    celebration.hidden=!newLevelUp;
    if(newLevelUp)$('win').classList.add('levelUp');else $('win').classList.remove('levelUp');
    if(finalLevelUp)$('win').classList.add('finale');else $('win').classList.remove('finale');
    if(newLevelUp){
      const n=game.level.stage;
      const stageGlyphs=['◉','◆','✦','✹','✳','❖','✧','✺','✶','✵','✸','✷','✴','✱','♛'];
      celebration.dataset.stage=String(n);
      celebration.dataset.motion=String((n-1)%5+1);
      if(celebration.style?.setProperty)celebration.style.setProperty('--stage-hue',`${(n-1)*23}deg`);
      $('levelUpMedal').textContent=stageGlyphs[n-1]||'★';
      $('levelUpHeading').textContent=finalLevelUp?(globalThis.GridClubWinMessages?.dotTrailsSpecial?.grandFinale||'Grand finale!'):(globalThis.GridClubWinMessages?.dotTrailsSpecial?.levelUp||'Credit boosted!');
      if(finalLevelUp)title.textContent=globalThis.GridClubWinMessages?.dotTrailsSpecial?.mastered||'Dot Trails mastered!';
      $('levelUpMessage').textContent=finalLevelUp?`All 75 puzzles complete · +${levelReward.stageBonus} credits`:`Level ${n} complete · +${levelReward.stageBonus} bonus credits`;
      $('next').textContent=finalLevelUp?'View all levels →':'Level up →';
    }
    $('levelReward').hidden=mode!=='level';
    $('levelRewardBalance').hidden=true;
    if(mode==='level'){
      const message=$('levelRewardMessage');
      const balance=$('levelRewardBalance');
      if(levelReward?.saveFailed){
        message.textContent='Your level reward could not be saved. Keep this app open and export a backup of any existing progress.';
      }else{
        if(!levelReward?.first){
          message.textContent='Previously completed';
        }else if(levelReward.earned){
          message.textContent=`+${levelReward.earned} credits earned${levelReward.stageBonus&&!newLevelUp?` · +${levelReward.stageBonus} level bonus`:''}`;
        }else{
          message.textContent=`No puzzle credits${levelReward.stageBonus&&!newLevelUp?` · +${levelReward.stageBonus} level bonus`:''}`;
        }
        balance.textContent=`Balance: ${walletBalance()} ◉`;
        balance.hidden=false;
      }
    }
    $('winDifficultyActions').hidden = mode !== 'free';
    $('winToRandom').hidden = mode !== 'free';
    $('winEasier').disabled = size === 5;
    $('winHarder').disabled = size === 11;
    const failed=!storageAvailable||result.saveFailed;
    $('resultStatsLink').hidden=failed||mode==='level';
    $('resultStatsLink').firstChild.textContent=mode==='daily'?'View your stats ':'Result added to your stats ';
    const status=$('resultStatus');
    status.hidden=false;
    if(failed){
      status.textContent='Your browser could not save this result. Please keep this page open.';
    }else if(mode==='daily'){
      status.textContent=navigator.onLine?'Checking your ranked result…':"You're offline, but your achievement is saved. We'll try to submit it while today's challenge is active.";
    }else{
      status.textContent='';
      status.hidden=true;
    }
    // The daily CTA belongs to the result screen, after the completion has
    // actually been saved. Never reference a result while setting up a board.
    const dailyComplete=mode==='daily'&&result.date===today()&&dailySolved();
    const journey=globalThis.GridClubDailyJourney;
    const nextDaily=dailyComplete?journey?.nextGame('dotTrails'):null;
    $('dotDailyRemainingWin').hidden=!dailyComplete;
    $('dotDailyRemainingWin').textContent=dailyComplete?journey?.remainingLabel()||'':'';
    $('dotDailyNextWin').hidden=!nextDaily;
    $('dotDailyTomorrowWin').hidden=!dailyComplete||!!nextDaily;
    $('win').classList.add('show');
    if(mode==='daily')submitRankedResult(result);
  }
  function refreshPlayPrompt(){
    const el=$('playPrompt');
    if(!game||game.finishedAt||game.paused||$('gameScreen').hidden||explicitPause){el.hidden=true;return;}
    // Hints should be gentle, optional reminders, never modal or repeated.
    const elapsedSeconds=Math.floor(core.elapsed(game)/1000);
    const key=game.attemptId;
    const dailyFive=mode==='daily'&&elapsedSeconds>=300&&!promptSeen[key+':5'];
    const hintThree=(mode==='daily'||size>=9)&&elapsedSeconds>=180&&!game.hints&&!promptSeen[key+':3'];
    if(!dailyFive&&!hintThree){ if(!el.dataset.kind)el.hidden=true;return; }
    const kind=dailyFive?'5':'3';
    if(el.dataset.kind===kind&&!el.hidden)return;
    promptSeen[key+':'+kind]=true;
    writeJSON(PROMPTS_KEY,promptSeen);
    el.dataset.kind=kind;el.hidden=false;
    $('playPromptMessage').textContent=kind==='5'?'Fancy a change? Try Free Play instead.':'You can use a hint, you know.';
    $('playPromptAction').hidden=kind!=='5';
  }
  function hidePlayPrompt(){ $('playPrompt').hidden=true;$('playPrompt').dataset.kind=''; }
  function render() {
    if(!game)return;
    const matched=game.level.pairs.filter(p=>core.connected(game,p.id)).length;
    const occupied=core.filled(game),total=core.playableCells(game.level);
    if(matched!==game.level.pairs.length || occupied===total)incompleteDismissed=false;
    $('pairs').textContent=`${matched}/${game.level.pairs.length}`;
    $('moves').textContent=String(game.moves);
    $('cells').textContent=`${occupied}/${total} squares`; 
    $('progress').style.width=`${occupied/total*100}%`;
    const remaining=remainingLevelMs();
    $('time').textContent=remaining===null?fmtSeconds(core.elapsed(game)):fmtSeconds(Math.max(0,remaining));
    // Only timed Levels flash, from 00:14 down to 00:01. No flashing for
    // elapsed-time play, completed boards, or the pause/timeout overlay.
    $('time').dataset.critical=String(remaining!==null&&remaining>0&&Math.floor(remaining/1000)<15&&!timedOut&&!game.finishedAt);
    if(mode==='level'){
      $('levelStepInfo').textContent=`Level ${game.level.stage} · Puzzle ${game.level.step}/5`;
      $('gameWallet').textContent=`◉ ${walletBalance()}`;
      $('extraTime').disabled=remaining===null||(game.extraTimeCount||0)>=2||walletBalance()<10;
      $('hint').disabled=walletBalance()<10;
      if(!game.finishedAt&&remaining!==null&&remaining<=0&&!game.paused)triggerTimeout();
    }else{$('hint').disabled=false;}
    $('pauseButton').disabled=!!game.finishedAt || (game.paused && !explicitPause);
    $('incomplete').hidden=incompleteDismissed||!!game.finishedAt||matched!==game.level.pairs.length||occupied===total;
    if(hintPreview && Date.now()>hintUntil){hintPreview=null;$('hintStatus').hidden=true;}
    if(game.finishedAt&&!notified){
      notified=true;
      if(mode==='daily'&&rankEligible&&rankedAttempt)freezeRankedOnCompletion();
      const result=recordCompletion();showWin(result);
      if(navigator.vibrate)navigator.vibrate([30,40,50]);
      updateHome();persist();
    }
    draw();
    refreshPlayPrompt();
  }
  function update() {persist();render();}
  function clearHint() {hintPreview=null;hintUntil=0;$('hintStatus').hidden=true;}
  function syncPauseLayer() {
    // A single source of truth for the overlay prevents stale pause screens
    // surviving Back, difficulty changes and Home-to-Daily navigation.
    $('pauseLayer').hidden = !(explicitPause && !($('gameScreen').hidden) && game && !game.finishedAt);
  }
  function pauseGame() {
    if (!game || game.finishedAt || $('gameScreen').hidden) return;
    if (activePointerId !== null) release();
    clearHint();hidePlayPrompt();
    if (!game.paused) core.pause(game);
    explicitPause = true;
    backgroundSuspended = false;
    syncPauseLayer();
    persist(); render();
    if(mode==='daily')rankedClock('pause');
  }
  function resumeGame() {
    // Continue is only for the explicit Pause screen, never navigation.
    if (!game || game.finishedAt || $('gameScreen').hidden) {
      explicitPause = false; syncPauseLayer(); return;
    }
    explicitPause = false;
    backgroundSuspended = false;
    if (game.paused) core.resume(game);
    syncPauseLayer();persist();render();
    if(mode==='daily')rankedClock('resume');
    requestAnimationFrame(resize);
  }
  function suspendSilently() {
    if (!game) return;
    if (activePointerId !== null) release();
    clearHint();
    if (!game.finishedAt && !game.paused) core.pause(game);
    persist();
    if(mode==='daily' && !game.finishedAt)rankedClock('pause');
  }
  function returnHome() {
    if (!$('gameScreen').hidden) suspendSilently();
    showPage('home');
    updateHome();
  }
  function exitPuzzle() {
    // The in-game Back follows the navigation hierarchy: Free Play returns
    // to difficulty selection, Daily Challenge returns directly Home.
    if (mode === 'daily') returnHome();
    else if(mode==='level')showLevelBrowser(game?.level?.stage||selectedStage);
    else showRandomScreen();
  }
  function onBackground() {
    // NEVER call pauseGame here: switching apps must not open a dialog.
    if ($('gameScreen').hidden || !game || game.finishedAt) return;
    if (activePointerId !== null) release();
    clearHint();
    if (!game.paused) {
      core.pause(game);
      if (!explicitPause) backgroundSuspended = true;
    }
    persist();
    if(mode==='daily')rankedClock('pause');
  }
  function onForeground() {
    if ($('gameScreen').hidden || !game) { syncPauseLayer(); return; }
    if (backgroundSuspended && !explicitPause && !game.finishedAt && !timedOut) {
      backgroundSuspended = false;
      if (game.paused) core.resume(game);
      persist(); render(); requestAnimationFrame(resize);
      if(mode==='daily')rankedClock('resume');
    }
    syncPauseLayer();
  }
  function pointerCell(event) {
    const rect=canvas.getBoundingClientRect();
    const x=Math.floor((event.clientX-rect.left)/rect.width*size);
    const y=Math.floor((event.clientY-rect.top)/rect.height*size);
    return x>=0&&y>=0&&x<size&&y<size?{x,y}:null;
  }
  function advance(from,to) {
    const dx=to.x-from.x,dy=to.y-from.y,steps=Math.max(Math.abs(dx),Math.abs(dy))*5;
    let last=from;
    for(let i=1;i<=steps;i++) {
      const p={x:Math.round(from.x+dx*i/steps),y:Math.round(from.y+dy*i/steps)};
      if(core.eq(last,p))continue;
      if(core.adjacent(last,p) && core.move(game,p))logRank('move',p);
      else {
        const via={x:p.x,y:last.y};
        if(core.adjacent(last,via) && core.move(game,via))logRank('move',via);
        if(core.adjacent(via,p) && core.move(game,p))logRank('move',p);
      }
      last=p;
    }
  }
  // On iOS, a quick tap-and-hold can open the Safari text magnifier *before*
  // pointerdown. Cancelling the canvas touch default stops that browser gesture.
  // This is canvas-only, so page scrolling, buttons and swipe-back stay native.
  canvas.addEventListener('touchstart',event=>{
    if(event.cancelable)event.preventDefault();
  },{passive:false});
  canvas.addEventListener('pointerdown',event=>{
    event.preventDefault();
    if(mode==='level'&&remainingLevelMs()!==null&&remainingLevelMs()<=0){triggerTimeout();return;}
    if(!game||game.finishedAt||game.paused||rankedGateActive)return;
    if(activePointerId!==null){
      // Safari may never deliver pointerup if a call/notification interrupts.
      // Finish the abandoned gesture before accepting the new touch.
      release(null);
    }
    const p=pointerCell(event);
    incompleteDismissed=true; $('incomplete').hidden=true;
    if(!p||!core.begin(game,p))return;
    if(mode==='daily' && !rankedAttempt)rankEligible=false;
    logRank('begin',p);
    clearHint();event.preventDefault();activePointerId=event.pointerId;lastCell=p;
    try{canvas.setPointerCapture(event.pointerId);}catch(_){}
    render();
  });
  canvas.addEventListener('pointermove',event=>{
    if(mode==='level'&&remainingLevelMs()!==null&&remainingLevelMs()<=0){triggerTimeout();return;}
    if(activePointerId===event.pointerId)event.preventDefault();
    if(activePointerId!==event.pointerId||!game||!lastCell)return;
    const p=pointerCell(event);
    if(p&&!core.eq(p,lastCell)){advance(lastCell,p);lastCell=p;render();}
  });
  function release(event) {
    if(activePointerId===null||(event&&event.pointerId!==activePointerId))return;
    const p=event&&pointerCell(event);
    if(p&&lastCell&&!core.eq(p,lastCell))advance(lastCell,p);
    activePointerId=null;lastCell=null;
    const late=mode==='level'&&remainingLevelMs()!==null&&remainingLevelMs()<=0;
    core.end(game);
    if(late&&game.finishedAt){game.finishedAt=null;game.clockStartedAt=Date.now();}
    logRank('end');update();
    if(late&&!timedOut)triggerTimeout();
  }
  canvas.addEventListener('pointerup',release);
  canvas.addEventListener('pointercancel',()=>release(null));
  canvas.addEventListener('lostpointercapture',()=>release(null));
  // Release even if Safari/Chrome loses pointer capture or the gesture ends
  // outside the canvas. A new touch can then always refocus the board.
  window.addEventListener('pointerup',release);
  window.addEventListener('pointercancel',()=>release(null));
  window.addEventListener('blur',()=>{if(activePointerId!==null)release();});
  for(const ev of ['contextmenu','selectstart','dragstart']){
    canvas.addEventListener(ev,e=>e.preventDefault());
  }
  // Guard against Safari selecting nearby game captions or controls if a
  // long press escapes the canvas. Do not interfere with other app screens.
  document.addEventListener('selectstart',event=>{
    if(event.target?.closest?.('#gameScreen'))event.preventDefault();
  },true);
  document.addEventListener('contextmenu',event=>{
    if(event.target?.closest?.('#gameScreen'))event.preventDefault();
  },true);
  document.addEventListener('selectionchange',()=>{
    if($('gameScreen').hidden)return;
    const selection=window.getSelection?.();
    if(!selection?.rangeCount||selection.isCollapsed)return;
    const element=node=>node?.nodeType===1?node:node?.parentElement;
    const screen=$('gameScreen');
    if(screen.contains?.(element(selection.anchorNode)) ||
       screen.contains?.(element(selection.focusNode)))selection.removeAllRanges();
  });
  // A Home-screen connection test can run even if today's daily has already
  // been solved locally, avoiding false "not invoked" impressions.
  const backendCheckMessage = $('backendCheckMessage');
  const testBackendButton = $('testBackend');
  function refreshBackendCheck() {
    if(!window.GridRanked?.configured){
      backendCheckMessage.textContent='Leaderboard not configured: check backend-config.js (public project URL and publishable key).';
      return;
    }
    if(!navigator.onLine){
      backendCheckMessage.textContent='You appear to be offline. Reconnect before checking the leaderboard.';
      return;
    }
    backendCheckMessage.textContent='Configuration loaded. Tap Test connection to check authentication, Edge Function and database.';
  }
  testBackendButton.onclick=async()=>{
    if(!window.GridRanked?.configured || !navigator.onLine){refreshBackendCheck();return;}
    testBackendButton.disabled=true;
    backendCheckMessage.textContent='Connecting to Supabase…';
    try {
      const res=await window.GridRanked.call('stats',{day:today()});
      backendCheckMessage.textContent=`Connected to daily-api. Verified community results today: ${Number(res.total||0)}. ${res.total?'':'No completed ranked attempts yet.'}`;
      lastCommunity=res;
    } catch(e) {
      backendCheckMessage.textContent='Connection failed: '+String(e?.message||e).slice(0,240);
      console.warn('Grid Club leaderboard connection test:',e);
    } finally { testBackendButton.disabled=false; }
  };
  refreshBackendCheck();
  $('dailyStart').onclick=()=>start('daily');
  $('dotDailyNextWin').onclick=()=>globalThis.GridClubDailyJourney?.visitNext('dotTrails');
  $('levelsStart').onclick=()=>showLevelBrowser();
  $('randomStart').onclick=showRandomScreen;
  $('randomBack').onclick=showDifficultyScreen;
  $('levelsBack').onclick=()=>selectedStage===null?showDifficultyScreen():showLevelBrowser();
  $('stageBack').onclick=()=>showLevelBrowser();
  $('exportLevels').onclick=async()=>{
    const backup=JSON.stringify(exportLevelBackup(),null,2);
    const name='GridClub-Levels-backup-'+today()+'.json';
    try{
      const file=new File([backup],name,{type:'application/json'});
      if(navigator.canShare?.({files:[file]})&&navigator.share){
        await navigator.share({title:'Grid Club Levels backup',files:[file]});
      }else{
        const url=URL.createObjectURL(file),a=document.createElement('a');
        a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
        setTimeout(()=>URL.revokeObjectURL(url),15000);
      }
      showLevelSaveStatus('Levels backup exported. Keep it somewhere safe.');
    }catch(e){
      if(e?.name!=='AbortError')showLevelSaveStatus('Could not export backup. Please try in Safari.',true);
    }
  };
  $('importLevels').onclick=()=>{$('importLevelsFile').click();};
  $('importLevelsFile').addEventListener('change',async event=>{
    const file=event.target.files?.[0];if(!file)return;
    event.target.value='';
    if(file.size>1024*1024){showLevelSaveStatus('Backup file is too large.',true);return;}
    try{
      const backup=JSON.parse(await file.text());
      if(!validLevelRecord(backup?.levelState)||backup?.format!=='gridclub-levels-backup-v1')throw new Error('Unexpected backup format');
      if(!confirm('Restore this Levels backup? This will replace this device’s existing Levels progress and credits. Daily and Random results will not be changed.'))return;
      if(!applyLevelBackup(backup))throw new Error('Could not save restored progress');
      renderLevelBrowser();
      showLevelSaveStatus('Levels backup restored successfully.');
    }catch(e){showLevelSaveStatus('That backup could not be restored. Existing data has been left unchanged.',true);}
  });
  $('winToLevels').onclick=()=>showLevelBrowser();
  $('timeUpRetry').onclick=retryLevel;
  $('timeUpBoost').onclick=buyExtraTime;
  $('timeUpBack').onclick=()=>showLevelBrowser(game?.level?.stage||selectedStage);
  $('extraTime').onclick=buyExtraTime;
  $('viewStats').onclick=showStatsScreen;
  $('statsBack').onclick=showDifficultyScreen;
  $('refreshCommunity').onclick=()=>refreshLeaderboard();
  $('freeStart').onclick=showDifficultyScreen;
  $('chooseBack').onclick=returnHome;
  $('back').onclick=exitPuzzle;
  $('pauseButton').onclick=pauseGame;
  $('resumeButton').onclick=resumeGame;
  $('pauseBack').onclick=returnHome;
  $('numberToggle').onclick=()=>{
    showDotNumbers=!showDotNumbers;
    try { localStorage.setItem(DOT_NUMBERS_KEY,String(showDotNumbers)); } catch (_) {}
    updateDotNumbersButton();
    if (side) draw(); else requestAnimationFrame(resize);
  };
  updateDotNumbersButton();
  $('playPromptDismiss').onclick=hidePlayPrompt;
  $('playPromptAction').onclick=()=>{hidePlayPrompt();showRandomScreen();};
  $('help').onclick=()=>alert('Connect matching colours and fill every playable square. ■ squares are blocked. Lift your finger to continue a path. Tap a dot to clear its line. 123 shows matching numbers. In timed Levels, Retry forfeits that puzzle’s credits.');
  $('undo').onclick=()=>{if(game?.paused)return;clearHint();if(game?.undo.length){core.undo(game);logRank('undo');}update();};
  $('hint').onclick=()=>{
    if(!game||game.paused||game.finishedAt)return;
    clearHint();
    const suggested=core.hint(game);
    $('hintStatus').hidden=false;
    if(!suggested){$('hintStatus').textContent='No hint fits your existing lines. Try adjusting a connection first.';return;}
    if(mode==='level'){
      const p=loadLevelState();
      if(!levelCore.spend(p,10,'hint',game.attemptId)){game.hints--; $('hintStatus').textContent='Not enough credits (10 ◉ needed)';return;}
      if(!saveLevelState(p)){game.hints--;return;}
    }
    logRank('hint');hintPreview=suggested;hintUntil=Date.now()+9000;
    $('hintStatus').textContent=suggested.reroute ? 'All pairs are connected, but some squares are empty. This highlighted route suggests a connection to rethink; you may need to adjust neighbouring paths.' : 'A short section of one possible solution is highlighted for 9 seconds. Your lines were not changed.';
    update();
  };
  $('reset').onclick=()=>{if(!game||game.paused)return;clearHint();core.reset(game);logRank('reset');update();};
  $('new').onclick=()=>{if(game && !game.finishedAt && core.filled(game)>0 && !confirm('Start a fresh puzzle? Your current unfinished puzzle will be replaced.'))return;newGame();};
  $('next').onclick=()=>mode==='daily'?showRandomScreen():mode==='level'?(levelId<75?startLevel(levelId+1):showLevelBrowser()):newGame();
  $('resultStatsLink').onclick=showStatsScreen;
  // Easier/Harder choose adjacent difficulties and preserve any unfinished
  // puzzle already saved at the destination size.
  $('winToRandom').onclick=showRandomScreen;
  $('winEasier').onclick=()=>{ if(mode==='free' && size>5) start('free',size-2); };
  $('winHarder').onclick=()=>{ if(mode==='free' && size<11) start('free',size+2); };
  $('returnWinHome').onclick=returnHome;
  document.querySelectorAll('[data-size]').forEach(button=>button.onclick=()=>start('free',Number(button.dataset.size)));
  $('share').onclick=async()=>{
    const text=`🧩 Grid Club · Dot Trails\n${mode==='daily'?`Daily challenge ${today()}`:mode==='level'?`Level ${game.level.stage} puzzle ${game.level.step}`:`${label()} (${size}×${size})`} solved in ${game.moves} moves and ${fmtSeconds(core.elapsed(game))}${game.hints?' · Assisted':''}.`;
    try {if(navigator.share)await navigator.share({text});else if(navigator.clipboard){await navigator.clipboard.writeText(text);alert('Result copied!');}else prompt('Copy your result:',text);}catch(_){}
  };
  // Left-edge swipe follows the same navigation targets as the visible Back
  // controls, but never steals a drawing gesture or a modal interaction.
  // In browser Safari the OS/browser's own back gesture may take precedence.
  function gestureBack(){
    if(!$('pauseLayer').hidden||!$('timeUpLayer').hidden)return;
    if(!$('gameScreen').hidden){exitPuzzle();return;}
    if(!$('statsScreen').hidden){showDifficultyScreen();return;}
    if(!$('randomScreen').hidden){showDifficultyScreen();return;}
    if(!$('levelsScreen').hidden){
      if(selectedStage===null)showDifficultyScreen();else showLevelBrowser();
      return;
    }
    if(!$('difficultyScreen').hidden)returnHome();
  }
  let edgeSwipe=null;
  document.addEventListener('touchstart',event=>{
    edgeSwipe=null;
    if(event.touches.length!==1)return;
    // Pipe Shift has its own Back hierarchy and gesture handler.
    const pipeScreen=$('pipeShiftScreen');
    if(pipeScreen?.isConnected&&!pipeScreen.hidden)return;
    const point=event.touches[0],target=event.target;
    if(target?.closest?.('#board,.controls,.pauseLayer,button,input,select,textarea'))return;
    if(target?.closest?.('.boardWrap')&&!target?.closest?.('.win'))return;
    if(!$('pauseLayer').hidden||!$('timeUpLayer').hidden)return;
    edgeSwipe={x:point.clientX,y:point.clientY,id:point.identifier};
  },{passive:true});
  document.addEventListener('touchmove',event=>{
    if(!edgeSwipe)return;
    if(event.touches.length!==1){edgeSwipe=null;return;}
    const point=event.touches[0];
    if(Math.abs(point.clientY-edgeSwipe.y)>45&&Math.abs(point.clientY-edgeSwipe.y)>Math.abs(point.clientX-edgeSwipe.x))edgeSwipe=null;
  },{passive:true});
  document.addEventListener('touchcancel',()=>{edgeSwipe=null;},{passive:true});
  document.addEventListener('touchend',event=>{
    const swipe=edgeSwipe;edgeSwipe=null;
    if(!swipe||!event.changedTouches?.length)return;
    const point=Array.from(event.changedTouches).find(p=>p.identifier===swipe.id);
    if(!point)return;
    const dx=point.clientX-swipe.x,dy=point.clientY-swipe.y;
    const fromLeftEdge=swipe.x<=48&&dx>=80;
    const swipeLeft=swipe.x>=105&&dx<=-105;
    if((fromLeftEdge||swipeLeft)&&Math.abs(dy)<50&&Math.abs(dx)>Math.abs(dy)*1.7)gestureBack();
  },{passive:true});
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) onBackground(); else onForeground();
  });
  window.addEventListener('pagehide',onBackground);
  window.addEventListener('pageshow',()=>{onForeground();expireLocalSubmissions();retryPendingDaily();});
  window.addEventListener('focus', () => { if (!document.hidden){onForeground();retryPendingDaily();} });
  window.addEventListener('resize',resize);
  window.addEventListener('offline',()=>{refreshBackendCheck(); $('connectivity').textContent='Offline mode · progress saved locally';$('connectivity').hidden=false;});
  window.addEventListener('online',()=>{refreshBackendCheck(); $('connectivity').hidden=true;retryPendingDaily();refreshLeaderboard();});
  if(!navigator.onLine){$('connectivity').textContent='Offline mode · progress saved locally';$('connectivity').hidden=false;}
  void recoverLevelMirror();
  try{void navigator.storage?.persist?.().catch(()=>{});}catch(_){}
  expireLocalSubmissions();
  updateHome();
  retryPendingDaily();
  setInterval(()=>{
    if(game&&!$('gameScreen').hidden){render();if(!game.paused&&!game.finishedAt)persist();}
    if(!document.hidden && !($('statsScreen').hidden))renderStatsPage();
  },1000);
  globalThis.GridDotTrailsApp={openDaily:()=>start('daily'),home:returnHome};
})();
