/* Grid Club · Dot Trails v0.5.0 levels prototype · random play + ranked daily prototype */
(() => {
  'use strict';
  const core = GridCore;
  const statsUtil = GridStats;
  const levelCore = GridLevels;
  const LEVEL_STATE_KEY = 'gridclub-levels-progress-v1';
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
  const groups = {
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
  let storageAvailable = true, saveWarningShown = false;
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
    try { localStorage.setItem(key, JSON.stringify(value)); storageAvailable = true; return true; }
    catch (_) { storageAvailable = false; return false; }
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
  function loadLevelState(){return levelCore.normalize(readJSON(LEVEL_STATE_KEY,null));}
  function saveLevelState(value){return writeJSON(LEVEL_STATE_KEY,value);}
  function walletBalance(){return loadLevelState().credits;}
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
    if(forMode==='level'){restored.extraTimeMs=Number(stored.extraTimeMs||0);restored.extraTimeCount=Number(stored.extraTimeCount||0);}
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
    $('solvedTag').hidden = !dailySolved();
    $('dailyStartText').textContent = dailySolved() ? 'View today’s stats' :
      savedGame('daily',11) ? 'Continue today’s puzzle' : 'Play today’s puzzle';
    const freeSaved = core.SIZES.some(n => {
      const s = savedGame('free',n);
      return s && !s.finishedAt && (Object.keys(s.paths).length > 0 || core.elapsed(s) > 3000);
    });
    $('freeStartText').textContent = freeSaved ? 'Dot Trails · Continue or play' : 'Dot Trails';
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
    const puzzle=core.generate(size,seed,{daily:mode==='daily'});
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
    $('win').classList.remove('show');
    $('timeUpLayer').hidden=!timedOut;
    levelReward=null;
    $('incomplete').hidden = true; $('hintStatus').hidden = true;
    $('modeTitle').textContent = mode === 'daily' ? `Daily challenge · ${dailyStartDay}` : mode==='level'?`Level ${game.level.stage} · Puzzle ${game.level.step}/5`:`${label()} · ${size}×${size}`;
    $('boardTitle').textContent = mode === 'daily' ? 'Daily Dot Trails' : mode==='level'?`Dot Trails · ${labels[size]}`:`Dot Trails · ${label()}`;
    $('next').textContent = mode === 'daily' ? 'Try Free Play' : mode==='level' && levelId===75 ? 'Back to Levels' : 'Next puzzle';
    $('returnWinHome').hidden = mode !== 'daily';
    $('winToLevels').hidden = mode!=='level';
    $('winDifficultyActions').hidden = mode !== 'free';
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
    $('gameScreen').hidden = page !== 'game';
    $('statsScreen').hidden = page !== 'stats';
    $('levelsScreen').hidden = page !== 'levels';
    // Leaving a result permanently closes its overlay. Stats never navigates back to it.
    if (page !== 'game') {
      $('win').classList.remove('show');
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
    const overview=$('statsOverview');overview.replaceChildren(
      statBox('Total puzzles',String(reports.total)),
      statBox('Daily completions',String(reports.daily.count))
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
    const list=$('stageList'),detail=$('stageDetail');
    const hasStage=!!selectedStage;
    list.hidden=hasStage;detail.hidden=!hasStage;
    if(!hasStage){
      list.replaceChildren();
      for(let stage=1;stage<=15;stage++){
        const items=levelCore.stageItems(stage),first=items[0];
        const done=items.filter(x=>progress.completed[x.id]).length;
        const allowed=levelCore.unlocked(progress,first.id);
        const btn=document.createElement('button');btn.type='button';btn.className='stageCard';btn.disabled=!allowed;
        const left=document.createElement('span'),title=document.createElement('strong'),desc=document.createElement('small');
        title.textContent=`Level ${stage} · ${labels[first.size]}`;
        desc.textContent=`${done}/5 puzzles complete · ${first.size}×${first.size}`;
        left.append(title,desc);
        const tag=document.createElement('span');tag.className='tag';tag.textContent=done===5?'✓ Complete':allowed?'Play →':'🔒 Locked';
        btn.append(left,tag);btn.onclick=()=>showLevelBrowser(stage);list.append(btn);
      }
    }else{
      const items=levelCore.stageItems(selectedStage),first=items[0];
      $('stageHeading').textContent=`Level ${selectedStage} · ${labels[first.size]}`;
      $('stageSubheading').textContent=`Puzzle 1 is untimed. Puzzles 2–5 have shorter countdowns. Each completed puzzle unlocks the next.`;
      const list=$('stagePuzzles');list.replaceChildren();
      for(const item of items){
        const btn=document.createElement('button');btn.type='button';btn.className='stagePuzzle';
        const unlocked=levelCore.unlocked(progress,item.id),done=!!progress.completed[item.id];btn.disabled=!unlocked;
        const left=document.createElement('span'),title=document.createElement('strong'),desc=document.createElement('small');
        title.textContent=`Puzzle ${item.step} · #${item.id}`;
        desc.textContent=item.limitSec===null?'Untimed warm-up':`Countdown ${fmtSeconds(item.limitSec*1000)}`;
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
  function triggerTimeout(){
    if(timedOut||!game||game.finishedAt)return;
    timedOut=true;
    if(activePointerId!==null)release();
    if(!game.paused)core.pause(game);
    hidePlayPrompt();$('timeUpLayer').hidden=false;
    persist();
  }
  function buyExtraTime(){
    if(mode!=='level'||!game||game.finishedAt||game.level.limitMs===null)return false;
    const p=loadLevelState();
    if(!levelCore.spend(p,10,'extra-time',game.attemptId)){
      if(!timedOut){$('hintStatus').hidden=false;$('hintStatus').textContent='Not enough credits, or you have already used two time extensions.';}
      return false;
    }
    if(!saveLevelState(p))return false;
    game.extraTimeMs=(game.extraTimeMs||0)+15000;
    game.extraTimeCount=(game.extraTimeCount||0)+1;
    timedOut=false;$('timeUpLayer').hidden=true;
    if(game.paused)core.resume(game);
    persist();render();return true;
  }
  function retryLevel(){
    if(mode!=='level')return;
    timedOut=false;$('timeUpLayer').hidden=true;
    setGame(freshGame());
  }
  function showDifficultyScreen() {
    if (!$('gameScreen').hidden) suspendSilently();
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
      roundedRect(x*cell+inset,y*cell+inset,cell-2*inset,cell-2*inset,Math.max(2,cell*.12),'#253147');
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
      if(!saveLevelState(p))levelReward={accepted:false,earned:0,stageBonus:0};
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
    gateRanked(true,'Preparing today\'s verified timer…');
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
    $('levelReward').hidden=mode!=='level';
    if(mode==='level')$('levelReward').textContent=levelReward?.first?`+${levelReward.earned} credits for this puzzle${levelReward.stageBonus?` · +${levelReward.stageBonus} level-completion bonus`:''} · Balance: ${walletBalance()} ◉`:'Puzzle completed. Rewards are earned on the first completion only.';
    $('winDifficultyActions').hidden = mode !== 'free';
    $('winEasier').disabled = size === 5;
    $('winHarder').disabled = size === 11;
    const failed=!storageAvailable||result.saveFailed;
    $('resultStatsLink').hidden=failed;
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
    const occupied=core.filled(game),total=size*size;
    if(matched!==game.level.pairs.length || occupied===total)incompleteDismissed=false;
    $('pairs').textContent=`${matched}/${game.level.pairs.length}`;
    $('moves').textContent=String(game.moves);
    $('cells').textContent=`${occupied}/${total} squares`;
    $('progress').style.width=`${occupied/total*100}%`;
    const remaining=remainingLevelMs();
    $('time').textContent=remaining===null?fmtSeconds(core.elapsed(game)):fmtSeconds(Math.max(0,remaining));
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
    else showDifficultyScreen();
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
  canvas.addEventListener('pointerdown',event=>{
    event.preventDefault();
    if(mode==='level'&&remainingLevelMs()!==null&&remainingLevelMs()<=0){triggerTimeout();return;}
    if(!game||game.finishedAt||game.paused||rankedGateActive||activePointerId!==null)return;
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
  canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('lostpointercapture',release);
  // Release even if Safari/Chrome loses pointer capture or the gesture ends
  // outside the canvas. A new touch can then always refocus the board.
  window.addEventListener('pointerup',release);
  window.addEventListener('pointercancel',release);
  window.addEventListener('blur',()=>{if(activePointerId!==null)release();});
  for(const ev of ['contextmenu','selectstart','dragstart']){
    canvas.addEventListener(ev,e=>e.preventDefault());
  }
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
  $('levelsStart').onclick=()=>showLevelBrowser();
  $('levelsBack').onclick=showDifficultyScreen;
  $('stageBack').onclick=()=>showLevelBrowser();
  $('winToLevels').onclick=()=>showLevelBrowser(game?.level?.stage||selectedStage);
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
  $('playPromptAction').onclick=()=>{hidePlayPrompt();showDifficultyScreen();};
  $('help').onclick=()=>alert('Connect matching dots without crossing lines and fill every square. Lift your finger to leave a partly drawn path, then continue from its loose end. Tap a coloured dot to clear its line. Use the 123 button below the board to label matching dot pairs if helpful. Hint shows a short section of one possible solution without drawing it. Pausing is free and hides the entire puzzle. Undo and Reset do not rewind the clock.');
  $('undo').onclick=()=>{if(game?.paused)return;clearHint();if(game?.undo.length){core.undo(game);logRank('undo');}update();};
  $('hint').onclick=()=>{
    if(!game||game.paused||game.finishedAt)return;
    clearHint();
    const suggested=core.hint(game);
    $('hintStatus').hidden=false;
    if(!suggested){$('hintStatus').textContent='No hint fits your existing lines. Try adjusting a connection first.';return;}
    if(mode==='level'){
      const p=loadLevelState();
      if(!levelCore.spend(p,10,'hint',game.attemptId)){game.hints--; $('hintStatus').textContent='You need 10 Club Credits for a hint. Finish more puzzles to earn credits.';return;}
      if(!saveLevelState(p)){game.hints--;return;}
    }
    logRank('hint');hintPreview=suggested;hintUntil=Date.now()+9000;
    $('hintStatus').textContent=suggested.reroute ? 'All pairs are connected, but some squares are empty. This highlighted route suggests a connection to rethink; you may need to adjust neighbouring paths.' : 'A short section of one possible solution is highlighted for 9 seconds. Your lines were not changed.';
    update();
  };
  $('reset').onclick=()=>{if(!game||game.paused)return;clearHint();core.reset(game);logRank('reset');update();};
  $('new').onclick=()=>{if(game && !game.finishedAt && core.filled(game)>0 && !confirm('Start a fresh puzzle? Your current unfinished puzzle will be replaced.'))return;newGame();};
  $('next').onclick=()=>mode==='daily'?showDifficultyScreen():mode==='level'?(levelId<75?startLevel(levelId+1):showLevelBrowser()):newGame();
  $('resultStatsLink').onclick=showStatsScreen;
  // Easier/Harder choose adjacent difficulties and preserve any unfinished
  // puzzle already saved at the destination size.
  $('winEasier').onclick=()=>{ if(mode==='free' && size>5) start('free',size-2); };
  $('winHarder').onclick=()=>{ if(mode==='free' && size<11) start('free',size+2); };
  $('returnWinHome').onclick=returnHome;
  document.querySelectorAll('[data-size]').forEach(button=>button.onclick=()=>start('free',Number(button.dataset.size)));
  $('share').onclick=async()=>{
    const text=`🧩 Grid Club · Dot Trails\n${mode==='daily'?`Daily challenge ${today()}`:mode==='level'?`Level ${game.level.stage} puzzle ${game.level.step}`:`${label()} (${size}×${size})`} solved in ${game.moves} moves and ${fmtSeconds(core.elapsed(game))}${game.hints?' · Assisted':''}.`;
    try {if(navigator.share)await navigator.share({text});else if(navigator.clipboard){await navigator.clipboard.writeText(text);alert('Result copied!');}else prompt('Copy your result:',text);}catch(_){}
  };
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
  expireLocalSubmissions();
  updateHome();
  retryPendingDaily();
  setInterval(()=>{
    if(game&&!$('gameScreen').hidden){render();if(!game.paused&&!game.finishedAt)persist();}
    if(!document.hidden && !($('statsScreen').hidden))renderStatsPage();
  },1000);
})();
