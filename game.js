/* Grid Club · Dot Trails v0.3 · browser UI and local statistics */
(() => {
  'use strict';
  const core = GridCore;
  const $ = id => document.getElementById(id);
  // Nine distinct colours are needed on the 11×11 board.
  const colours = ['#ff667a', '#55c5ff', '#ffd15b', '#70e6a0', '#bd91ff',
    '#ff9a55', '#53e2e4', '#f780d8', '#a8d25c', '#c7adff'];
  const labels = {5:'Easy', 7:'Medium', 9:'Hard', 11:'Expert'};
  const canvas = $('board');
  const ctx = canvas.getContext('2d');
  const utcDay = () => new Date().toISOString().slice(0, 10);
  const STATS_KEY = 'gridclub-stats-v1';
  const DIFFICULTY_KEY = 'gridclub-dottrails-size';
  let game = null, mode = 'free', size = 5, activePointerId = null;
  let lastCell = null, side = 0, notified = false;

  // Keep a common data model for all eventual Grid Club games. Credits are
  // deliberately inactive in v0.3: no rewards or purchases are yet offered.
  function readStats() {
    try {
      const stored = JSON.parse(localStorage.getItem(STATS_KEY) || '{}') || {};
      return { ...stored, version: 1,
        wallet: { credits: 0, ...(stored.wallet || {}) },
        games: { ...(stored.games || {}),
          dotTrails: { completions: 0, daily: {}, ...((stored.games || {}).dotTrails || {}) }
        }
      };
    } catch (_) { return { version:1, wallet:{credits:0}, games:{dotTrails:{completions:0,daily:{}}} }; }
  }
  function recordCompletion() {
    try {
      const stats = readStats();
      stats.games ||= {};
      stats.games.dotTrails ||= { completions:0, daily:{} };
      const item = stats.games.dotTrails;
      item.completions = (item.completions || 0) + 1;
      item.byDifficulty ||= {};
      item.byDifficulty[mode === 'daily' ? 'daily' : String(size)] = (item.byDifficulty[mode === 'daily' ? 'daily' : String(size)] || 0) + 1;
      item.lastResult = { mode, size, moves:game.moves, hints:game.hints,
        resets:game.resets, elapsedSeconds:Math.round((game.finishedAt - game.startedAt)/1000),
        finishedAt:new Date(game.finishedAt).toISOString() };
      if (mode === 'daily') { item.daily ||= {}; item.daily[utcDay()] = item.lastResult; }
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (_) { /* browser privacy modes may disallow storage */ }
  }
  function dailySolved() {
    try { return !!readStats().games.dotTrails?.daily?.[utcDay()] || localStorage.getItem('gridclub-daily') === utcDay(); }
    catch (_) { return false; }
  }
  function updateHome() { $('solvedTag').hidden = !dailySolved(); }
  function saveDifficulty() { try { localStorage.setItem(DIFFICULTY_KEY, String(size)); } catch (_) {} }
  function loadDifficulty() { try { const val=Number(localStorage.getItem(DIFFICULTY_KEY)); return core.SIZES.includes(val) ? val : 5; } catch (_) { return 5; } }
  function randomSeed() {
    if (globalThis.crypto?.getRandomValues) return crypto.getRandomValues(new Uint32Array(1))[0];
    return Math.floor(Math.random() * 0x100000000);
  }
  function label() { return mode === 'daily' ? 'Daily challenge' : labels[size]; }
  function newGame(requested = size) {
    size = mode === 'daily' ? 11 : requested;
    if (!core.SIZES.includes(size)) size = 5;
    if (mode === 'free') saveDifficulty();
    const seed = mode === 'daily' ? core.hash(`gridclub-dottrails-daily-v03-${utcDay()}-11`) : randomSeed();
    game = core.create(core.generate(size, seed, { daily: mode === 'daily' }));
    notified = false; activePointerId = null; lastCell = null;
    $('win').classList.remove('show');
    $('incomplete').hidden = true;
    $('modeTitle').textContent = mode === 'daily' ? `Daily challenge · ${utcDay()}` : `${label()} · ${size}×${size}`;
    $('boardTitle').textContent = mode === 'daily' ? 'Daily Dot Trails' : `Dot Trails · ${labels[size]}`;
    $('next').hidden = mode === 'daily';
    document.querySelectorAll('[data-size]').forEach(button => {
      const selected = Number(button.dataset.size) === size;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    update();
    requestAnimationFrame(resize);
  }
  function start(nextMode) {
    mode = nextMode;
    $('home').hidden = true;
    $('gameScreen').hidden = false;
    $('difficulty').hidden = mode === 'daily';
    $('new').hidden = mode === 'daily';
    newGame(mode === 'daily' ? 11 : loadDifficulty());
  }
  function resize() {
    if ($('gameScreen').hidden || !game) return;
    side = Math.round(canvas.getBoundingClientRect().width);
    if (!side) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.floor(side * dpr);
    canvas.height = Math.floor(side * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function roundedRect(x,y,w,h,r,color) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill();
  }
  function draw() {
    if (!game || !side) return;
    ctx.clearRect(0,0,side,side);
    roundedRect(0,0,side,side,16,'#0e1424');
    const cell = side / size;
    for (let y=0;y<size;y++) for (let x=0;x<size;x++) {
      const inset=cell*.035;
      roundedRect(x*cell+inset,y*cell+inset,cell-2*inset,cell-2*inset,Math.max(2,cell*.12),'#253147');
    }
    for (const [id, path] of Object.entries(game.paths)) {
      if (!path?.length) continue;
      ctx.beginPath();
      path.forEach((p,i) => i ? ctx.lineTo((p.x+.5)*cell,(p.y+.5)*cell) : ctx.moveTo((p.x+.5)*cell,(p.y+.5)*cell));
      ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=cell*.30;
      ctx.strokeStyle=colours[Number(id)%colours.length];ctx.globalAlpha=.92;ctx.stroke();ctx.globalAlpha=1;
      // Visually distinguish the loose end so the player knows where to resume.
      if (path.length>1 && !core.connected(game, Number(id))) {
        const tip=path[path.length-1];
        ctx.beginPath();ctx.arc((tip.x+.5)*cell,(tip.y+.5)*cell,cell*.14,0,Math.PI*2);
        ctx.fillStyle='#ffffff';ctx.fill();
      }
    }
    for (const pair of game.level.pairs) for (const p of [pair.a,pair.b]) {
      const x=(p.x+.5)*cell,y=(p.y+.5)*cell,r=cell*.29;
      ctx.beginPath();ctx.arc(x,y,r*1.31,0,Math.PI*2);
      ctx.fillStyle=colours[pair.id];ctx.globalAlpha=.2;ctx.fill();ctx.globalAlpha=1;
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fillStyle=colours[pair.id];ctx.fill();
      ctx.beginPath();ctx.arc(x-r*.1,y-r*.16,r*.2,0,Math.PI*2);ctx.fillStyle='#ffffff55';ctx.fill();
    }
  }
  function fmtSeconds(n) {
    return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
  }
  function update() {
    if (!game) return;
    const matched=game.level.pairs.filter(pair => core.connected(game,pair.id)).length;
    const occupied=core.filled(game), total=size*size;
    $('pairs').textContent=`${matched}/${game.level.pairs.length}`;
    $('moves').textContent=String(game.moves);
    $('cells').textContent=`${occupied}/${total} squares`;
    $('progress').style.width=`${occupied/total*100}%`;
    $('time').textContent=fmtSeconds(Math.max(0,Math.floor(((game.finishedAt || Date.now())-game.startedAt)/1000)));
    $('incomplete').hidden = !!game.finishedAt || matched !== game.level.pairs.length || occupied === total;
    if (game.finishedAt && !notified) {
      notified=true;
      recordCompletion();
      $('winMessage').textContent=`${label()} · ${fmtSeconds(Math.round((game.finishedAt-game.startedAt)/1000))} · ${game.moves} moves`;
      $('win').classList.add('show');
      if (mode==='daily') { try { localStorage.setItem('gridclub-daily',utcDay()); } catch (_) {} }
      if (navigator.vibrate) navigator.vibrate([30,40,50]);
    }
    draw();
  }
  function pointerCell(event) {
    const rect=canvas.getBoundingClientRect();
    const x=Math.floor((event.clientX-rect.left)/rect.width*size);
    const y=Math.floor((event.clientY-rect.top)/rect.height*size);
    return x>=0&&y>=0&&x<size&&y<size ? {x,y}:null;
  }
  // Sample a pointer's route instead of jumping across an entire row when the
  // finger moves quickly. Each intermediate square must be adjacent.
  function advance(from,to) {
    const dx=to.x-from.x,dy=to.y-from.y;
    const steps=Math.max(Math.abs(dx),Math.abs(dy))*5;
    let last=from;
    for(let i=1;i<=steps;i++) {
      const p={x:Math.round(from.x+dx*i/steps),y:Math.round(from.y+dy*i/steps)};
      if(core.eq(last,p)) continue;
      if(core.adjacent(last,p)) core.move(game,p);
      else { // diagonal: select axis closest to the travelled pointer
        const via={x:p.x,y:last.y};
        if(core.adjacent(last,via)) core.move(game,via);
        if(core.adjacent(via,p)) core.move(game,p);
      }
      last=p;
    }
  }
  canvas.addEventListener('pointerdown', event => {
    if (!game || game.finishedAt || activePointerId !== null) return;
    const p=pointerCell(event);
    if(!p || !core.begin(game,p)) return;
    event.preventDefault();
    activePointerId=event.pointerId;lastCell=p;
    try{canvas.setPointerCapture(event.pointerId);}catch(_){}
    update();
  });
  canvas.addEventListener('pointermove', event => {
    if(activePointerId!==event.pointerId || !game || !lastCell) return;
    const p=pointerCell(event);
    if(p && !core.eq(p,lastCell)) {advance(lastCell,p);lastCell=p;update();}
  });
  function release(event) {
    if(activePointerId===null || (event && event.pointerId!==activePointerId)) return;
    // Capture the release square, especially when a fast drag ends at a dot.
    const p=event && pointerCell(event);
    if(p && lastCell && !core.eq(p,lastCell)) advance(lastCell,p);
    activePointerId=null;lastCell=null;
    core.end(game);update();
  }
  canvas.addEventListener('pointerup',release);
  canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('lostpointercapture',release);
  $('dailyStart').onclick=()=>start('daily');
  $('freeStart').onclick=()=>start('free');
  $('back').onclick=()=>{
    if(activePointerId!==null) release();
    $('gameScreen').hidden=true;$('home').hidden=false;updateHome();
  };
  $('help').onclick=()=>alert('Dot Trails: Connect matching coloured dots without crossing lines, and fill every square. Lift your finger at any time: your unfinished line stays in place. Resume by dragging from its loose end. Tap a coloured dot to clear its existing line. Undo reverses one change; Hint reveals one solution path.');
  $('undo').onclick=()=>{core.undo(game);update();};
  $('hint').onclick=()=>{core.hint(game);update();};
  $('reset').onclick=()=>{core.reset(game);notified=false;$('win').classList.remove('show');update();};
  $('new').onclick=()=>newGame();
  $('next').onclick=()=>newGame();
  document.querySelectorAll('[data-size]').forEach(button=>button.onclick=()=>newGame(Number(button.dataset.size)));
  $('share').onclick=async()=>{
    const text=`🧩 Grid Club · Dot Trails\n${mode==='daily' ? `Daily challenge ${utcDay()}` : `${label()} (${size}×${size})`} solved in ${game.moves} moves and ${fmtSeconds(Math.round((game.finishedAt-game.startedAt)/1000))}.`;
    try{
      if(navigator.share) await navigator.share({text});
      else if(navigator.clipboard) { await navigator.clipboard.writeText(text);alert('Result copied!'); }
      else prompt('Copy your result:',text);
    }catch(_){ }
  };
  window.addEventListener('resize',resize);
  updateHome();
  setInterval(()=>{if(game && !$('gameScreen').hidden)update();},1000);
})();
