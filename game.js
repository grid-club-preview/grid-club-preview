/* Grid Club · Dot Trails v0.4a.2 · numeric labels and silent Back navigation */
(() => {
  'use strict';
  const core = GridCore;
  const $ = id => document.getElementById(id);
  const colours = ['#ff667a','#55c5ff','#ffd15b','#70e6a0','#bd91ff',
    '#ff9a55','#53e2e4','#f780d8','#a8d25c','#c7adff','#fcafc0','#b8ee85'];
  const labels = {5:'Easy',7:'Medium',9:'Hard',11:'Expert'};
  const STATS_KEY = 'gridclub-stats-v1';
  const PROGRESS_KEY = 'gridclub-progress-v04a';
  const DIFFICULTY_KEY = 'gridclub-dottrails-size';
  const DOT_NUMBERS_KEY = 'gridclub-dottrails-show-numbers';
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
      'Another one bites the dust.','A tidy bit of connecting.','That’s all connected, then.'],
    quick: ['Ooft. Quick draw!','Motoring through!','No hanging about, then.',
      'Blink and you’ll miss it.','Someone’s in a hurry.','A new personal best!'],
    effort: ['That one put up a fight.','Persistence pays off.','Got there in the end!',
      'A few detours, but who’s counting?','Never in doubt. Probably.'],
    clean: ['Nice and tidy.','No hint needed.','Smooth operator.','A neat piece of work.']
  };
  let mode = 'free', size = 5, game = null, activePointerId = null;
  let lastCell = null, side = 0, notified = false, hintPreview = null, hintUntil = 0;
  let storageAvailable = true, saveWarningShown = false;
  let showDotNumbers = false;
  try { showDotNumbers = localStorage.getItem(DOT_NUMBERS_KEY) === 'true'; } catch (_) {}
  function updateDotNumbersButton() {
    const button = $('numberToggle');
    button.setAttribute('aria-pressed', String(showDotNumbers));
    button.setAttribute('aria-label', showDotNumbers ? 'Hide numbers on coloured dots' : 'Show numbers on coloured dots');
    button.title = showDotNumbers ? 'Hide numeric dot labels' : 'Increase accessibility by showing numbers on each matching pair';
    $('numberToggleText').textContent = showDotNumbers ? 'Hide numbers' : 'Show numbers';
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
  function progressSlot(forMode=mode, forSize=size) {
    return forMode === 'daily' ? `daily:${today()}` : `free:${forSize}`;
  }
  function readProgress() { return readJSON(PROGRESS_KEY, {}); }
  function savedGame(forMode, forSize) {
    const stored = readProgress()[progressSlot(forMode,forSize)];
    if (!stored) return null;
    const restored = core.restore(stored);
    // A past day's puzzle should not be shown as today's challenge.
    if (!restored || (forMode === 'daily' && stored.savedDay !== today())) return null;
    return restored;
  }
  function persist() {
    if (!game) return false;
    const all = readProgress();
    const snap = core.serialize(game);
    snap.savedDay = today();
    all[progressSlot()] = snap;
    // Keep the most recent days only; personal results remain in statistics.
    Object.keys(all).filter(k => k.startsWith('daily:') && k !== `daily:${today()}`)
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
  function updateHome() {
    $('solvedTag').hidden = !dailySolved();
    $('dailyStartText').textContent = dailySolved() ? 'View today’s result' :
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
  function label() { return mode === 'daily' ? 'Daily challenge' : labels[size]; }
  function dailyLevelSeed() { return core.hash(`gridclub-dottrails-daily-v04a-${today()}-11`); }
  function freshGame() {
    const seed = mode === 'daily' ? dailyLevelSeed() : randomSeed();
    return core.create(core.generate(size,seed,{daily:mode==='daily'}));
  }
  function setGame(newGameObject) {
    game = newGameObject;
    // Re-entering a puzzle from Home is an explicit request to play, not to see
    // the Pause screen. Progress was saved when the player left.
    if (game.paused && !game.finishedAt) core.resume(game);
    notified = false; activePointerId = null;lastCell = null;hintPreview=null;hintUntil=0;
    $('win').classList.remove('show');
    $('incomplete').hidden = true; $('hintStatus').hidden = true;
    $('modeTitle').textContent = mode === 'daily' ? `Daily challenge · ${today()}` : `${label()} · ${size}×${size}`;
    $('boardTitle').textContent = mode === 'daily' ? 'Daily Dot Trails' : `Dot Trails · ${label()}`;
    $('next').textContent = mode === 'daily' ? 'Try Free Play' : 'Next puzzle';
    $('new').hidden = mode === 'daily';
    document.querySelectorAll('[data-size]').forEach(button => {
      const selected = Number(button.dataset.size) === size;
      button.classList.toggle('active',selected);
      button.setAttribute('aria-pressed',String(selected));
    });
    $('pauseLayer').hidden = true;
    render();
    persist();
    requestAnimationFrame(resize);
  }
  function start(nextMode) {
    mode = nextMode;
    size = mode === 'daily' ? 11 : loadDifficulty();
    $('home').hidden = true;$('gameScreen').hidden = false;
    $('difficulty').hidden = mode === 'daily';
    setGame(savedGame(mode,size) || freshGame());
  }
  function newGame(requested=size) {
    if (mode === 'daily') return; // Today's ranked candidate should not regenerate.
    size = core.SIZES.includes(requested) ? requested : 5;
    saveDifficulty();setGame(freshGame());
  }
  function switchDifficulty(newSize) {
    if (mode !== 'free') return;
    suspendSilently();
    size = newSize;saveDifficulty();
    setGame(savedGame('free',size) || freshGame());
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
    const k = mode==='daily' ? 'daily' : String(size);
    const elapsedMs = Math.round(core.elapsed(game));
    const previousBest = item.best[k];
    const info = {newBest:previousBest===undefined||elapsedMs<previousBest,hadBest:previousBest!==undefined};
    if(info.newBest) item.best[k] = elapsedMs;
    const date = today();
    const result = {
      attemptId:game.attemptId, game:'dotTrails', mode, date, size,
      puzzleId:`dottrails-v04a-${size}-${game.level.seed}-${mode==='daily'?date:'free'}`,
      elapsedMs, moves:game.moves, hints:game.hints, resets:game.resets,
      assisted:game.hints>0, verified:false, sync:'not-configured',
      firstDaily:mode!=='daily'||!item.daily[date],
      finishedAt:new Date(game.finishedAt).toISOString()
    };
    result.headline=pickHeadline(info,stats);
    item.results.push(result);item.results=item.results.slice(-250);
    item.pending.push(result);item.pending=item.pending.slice(-250);
    item.completions=(item.completions||0)+1;
    item.byDifficulty ||= {};
    item.byDifficulty[k]=(item.byDifficulty[k]||0)+1;
    item.lastResult=result;
    if(mode==='daily'&&!item.daily[date])item.daily[date]=result;
    const ok=writeJSON(STATS_KEY,stats);
    if(!ok)result.saveFailed=true;
    return result;
  }
  function showWin(result) {
    $('winTitle').textContent=result.headline||'Nice one.';
    $('winMessage').textContent=`${label()} · ${fmtSeconds(result.elapsedMs)} · ${result.moves} moves`;
    $('winCategory').textContent=result.assisted?'Assisted completion · hint used':'Unassisted completion';
    if (!storageAvailable || result.saveFailed) {
      $('resultStatus').textContent='Your browser could not save this result. Please keep this page open.';
    } else if (!navigator.onLine) {
      $('resultStatus').textContent="You're offline, but your achievement is saved. We'll try and get this result on the leaderboard once you're online.";
    } else {
      $('resultStatus').textContent='Achievement saved on this device.';
    }
    $('futureNotice').textContent='Leaderboard uploads and verification are not live until v0.4b. Offline results may not qualify for official rankings.';
    $('win').classList.add('show');
  }
  function render() {
    if(!game)return;
    const matched=game.level.pairs.filter(p=>core.connected(game,p.id)).length;
    const occupied=core.filled(game),total=size*size;
    $('pairs').textContent=`${matched}/${game.level.pairs.length}`;
    $('moves').textContent=String(game.moves);
    $('cells').textContent=`${occupied}/${total} squares`;
    $('progress').style.width=`${occupied/total*100}%`;
    $('time').textContent=fmtSeconds(core.elapsed(game));
    $('pauseButton').disabled=!!game.finishedAt || game.paused;
    $('incomplete').hidden=!!game.finishedAt||matched!==game.level.pairs.length||occupied===total;
    if(hintPreview && Date.now()>hintUntil){hintPreview=null;$('hintStatus').hidden=true;}
    if(game.finishedAt&&!notified){
      notified=true;
      const result=recordCompletion();showWin(result);
      if(navigator.vibrate)navigator.vibrate([30,40,50]);
      updateHome();persist();
    }
    draw();
  }
  function update() {persist();render();}
  function clearHint() {hintPreview=null;hintUntil=0;$('hintStatus').hidden=true;}
  function pauseGame() {
    if(!game||game.finishedAt)return;
    if(activePointerId!==null)release();
    clearHint();
    if(core.pause(game)){
      activePointerId=null;lastCell=null;
      $('pauseLayer').hidden=false;persist();render();
    }
  }
  function resumeGame() {
    if(!game||game.finishedAt)return;
    core.resume(game);$('pauseLayer').hidden=true;persist();render();
    requestAnimationFrame(resize);
  }
  function saveAndSuspend() {if(game){pauseGame();persist();}}
  function suspendSilently() {
    if (!game) return;
    if (activePointerId !== null) release();
    clearHint();
    if (!game.finishedAt) core.pause(game);
    persist();
  }
  function returnHome() {
    // Back is navigation, never a request to open the Pause overlay.
    suspendSilently();
    $('pauseLayer').hidden = true;
    $('gameScreen').hidden = true;
    $('home').hidden = false;
    updateHome();
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
      if(core.adjacent(last,p))core.move(game,p);
      else {
        const via={x:p.x,y:last.y};
        if(core.adjacent(last,via))core.move(game,via);
        if(core.adjacent(via,p))core.move(game,p);
      }
      last=p;
    }
  }
  canvas.addEventListener('pointerdown',event=>{
    if(!game||game.finishedAt||game.paused||activePointerId!==null)return;
    const p=pointerCell(event);
    if(!p||!core.begin(game,p))return;
    clearHint();event.preventDefault();activePointerId=event.pointerId;lastCell=p;
    try{canvas.setPointerCapture(event.pointerId);}catch(_){}
    render();
  });
  canvas.addEventListener('pointermove',event=>{
    if(activePointerId!==event.pointerId||!game||!lastCell)return;
    const p=pointerCell(event);
    if(p&&!core.eq(p,lastCell)){advance(lastCell,p);lastCell=p;render();}
  });
  function release(event) {
    if(activePointerId===null||(event&&event.pointerId!==activePointerId))return;
    const p=event&&pointerCell(event);
    if(p&&lastCell&&!core.eq(p,lastCell))advance(lastCell,p);
    activePointerId=null;lastCell=null;core.end(game);update();
  }
  canvas.addEventListener('pointerup',release);
  canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('lostpointercapture',release);
  $('dailyStart').onclick=()=>start('daily');
  $('freeStart').onclick=()=>start('free');
  $('back').onclick=returnHome;
  $('pauseButton').onclick=pauseGame;
  $('resumeButton').onclick=resumeGame;
  $('pauseBack').onclick=returnHome;
  $('numberToggle').onclick=()=>{
    showDotNumbers=!showDotNumbers;
    try { localStorage.setItem(DOT_NUMBERS_KEY,String(showDotNumbers)); } catch (_) {}
    updateDotNumbersButton();draw();
  };
  updateDotNumbersButton();
  $('help').onclick=()=>alert('Connect matching dots without crossing lines and fill every square. Lift your finger to leave a partly drawn path, then continue from its loose end. Tap a coloured dot to clear its line. Use Show numbers to label matching dot pairs if helpful. Hint shows a short section of one possible solution without drawing it. Pausing is free and hides the entire puzzle. Undo and Reset do not rewind the clock.');
  $('undo').onclick=()=>{if(game?.paused)return;clearHint();core.undo(game);update();};
  $('hint').onclick=()=>{
    if(!game||game.paused||game.finishedAt)return;
    clearHint();
    const suggested=core.hint(game);
    $('hintStatus').hidden=false;
    if(!suggested){$('hintStatus').textContent='No hint fits your existing lines. Try adjusting a connection first.';return;}
    hintPreview=suggested;hintUntil=Date.now()+9000;
    $('hintStatus').textContent=suggested.reroute ? 'All pairs are connected, but some squares are empty. This highlighted route suggests a connection to rethink; you may need to adjust neighbouring paths.' : 'A short section of one possible solution is highlighted for 9 seconds. Your lines were not changed.';
    update();
  };
  $('reset').onclick=()=>{if(!game||game.paused)return;clearHint();core.reset(game);update();};
  $('new').onclick=()=>{if(game && !game.finishedAt && core.filled(game)>0 && !confirm('Start a fresh puzzle? Your current unfinished puzzle will be replaced.'))return;newGame();};
  $('next').onclick=()=>mode==='daily'?start('free'):newGame();
  document.querySelectorAll('[data-size]').forEach(button=>button.onclick=()=>switchDifficulty(Number(button.dataset.size)));
  $('share').onclick=async()=>{
    const text=`🧩 Grid Club · Dot Trails\n${mode==='daily'?`Daily challenge ${today()}`:`${label()} (${size}×${size})`} solved in ${game.moves} moves and ${fmtSeconds(core.elapsed(game))}${game.hints?' · Assisted':''}.`;
    try {if(navigator.share)await navigator.share({text});else if(navigator.clipboard){await navigator.clipboard.writeText(text);alert('Result copied!');}else prompt('Copy your result:',text);}catch(_){}
  };
  document.addEventListener('visibilitychange',()=>{if(document.hidden)saveAndSuspend();});
  window.addEventListener('pagehide',saveAndSuspend);
  window.addEventListener('resize',resize);
  window.addEventListener('offline',()=>{$('connectivity').textContent='Offline mode · progress saved locally';$('connectivity').hidden=false;});
  window.addEventListener('online',()=>{$('connectivity').hidden=true;});
  if(!navigator.onLine){$('connectivity').textContent='Offline mode · progress saved locally';$('connectivity').hidden=false;}
  updateHome();
  setInterval(()=>{
    if(game&&!$('gameScreen').hidden){render();if(!game.paused&&!game.finishedAt)persist();}
  },1000);
})();
