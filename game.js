(() => {
  'use strict';
  const core = GridCore;
  const colours = ['#ff6478','#4cbdff','#ffcb4d','#6ce388','#d187ff','#ff9254','#4be5d6'];
  const $ = id => document.getElementById(id);
  const day = () => new Date().toISOString().slice(0, 10);
  let game, mode = 'free', size = 5, pointerActive = false, lastCell = null, notified = false;
  const canvas = $('board'), ctx = canvas.getContext('2d');
  let side = 0;

  function newGame(chosen = size) {
    size = chosen;
    const seed = mode === 'daily' ? core.hash(`gridclub-dot-v1-${day()}-${size}`) : (crypto.getRandomValues(new Uint32Array(1))[0]);
    game = core.create(core.generate(size, seed));
    notified = false; pointerActive = false; lastCell = null;
    document.querySelectorAll('[data-size]').forEach(button => button.classList.toggle('active', Number(button.dataset.size) === size));
    $('win').classList.remove('show');
    $('next').hidden = mode === 'daily';
    update();
  }
  function start(nextMode) {
    mode = nextMode;
    $('home').hidden = true; $('gameScreen').hidden = false;
    $('difficulty').hidden = mode === 'daily';
    $('new').hidden = mode === 'daily';
    $('modeTitle').textContent = mode === 'daily' ? 'Daily challenge' : 'Free play';
    newGame(mode === 'daily' ? 6 : 5);
    requestAnimationFrame(resize);
  }
  function resize() {
    if ($('gameScreen').hidden || !game) return;
    side = Math.round(canvas.getBoundingClientRect().width);
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.floor(side * dpr);
    canvas.height = Math.floor(side * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function roundedRect(x, y, w, h, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
  }
  function draw() {
    if (!game || !side) return;
    ctx.clearRect(0, 0, side, side);
    roundedRect(0, 0, side, side, 17, '#0e1424');
    const cell = side / size;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const inset = cell * .035;
      roundedRect(x * cell + inset, y * cell + inset, cell - inset * 2, cell - inset * 2, cell * .13, '#253147');
    }
    for (const [id, nodes] of Object.entries(game.paths)) {
      if (!nodes.length) continue;
      ctx.beginPath();
      nodes.forEach((p, i) => i ? ctx.lineTo((p.x+.5)*cell, (p.y+.5)*cell) : ctx.moveTo((p.x+.5)*cell, (p.y+.5)*cell));
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = cell * .29;
      ctx.strokeStyle = colours[Number(id)]; ctx.globalAlpha = .88; ctx.stroke(); ctx.globalAlpha = 1;
    }
    for (const pair of game.level.pairs) for (const p of [pair.a, pair.b]) {
      const x = (p.x+.5)*cell, y=(p.y+.5)*cell, radius=cell*.285;
      ctx.beginPath();ctx.arc(x,y,radius*1.32,0,Math.PI*2);ctx.fillStyle=colours[pair.id];ctx.globalAlpha=.17;ctx.fill();ctx.globalAlpha=1;
      ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fillStyle=colours[pair.id];ctx.fill();
      ctx.beginPath();ctx.arc(x-radius*.1,y-radius*.19,radius*.24,0,Math.PI*2);ctx.fillStyle='#ffffff44';ctx.fill();
    }
  }
  function update() {
    if (!game) return;
    $('pairs').textContent = `${game.level.pairs.filter(p => core.connected(game, p.id)).length}/${size}`;
    $('moves').textContent = String(game.moves);
    $('cells').textContent = `${core.filled(game)}/${size*size} squares`;
    $('progress').style.width = `${core.filled(game)/(size*size)*100}%`;
    const secs = Math.max(0, Math.floor(((game.finishedAt || Date.now()) - game.startedAt)/1000));
    $('time').textContent = `${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;
    if (game.finishedAt && !notified) {
      notified = true;
      $('win').classList.add('show');
      if (mode === 'daily') { try { localStorage.setItem('gridclub-daily', day()); } catch (_) {} }
      if (navigator.vibrate) navigator.vibrate([30,40,50]);
    }
    draw();
  }
  function pointerCell(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left)/rect.width * size);
    const y = Math.floor((event.clientY - rect.top)/rect.height * size);
    return x >= 0 && y >= 0 && x < size && y < size ? { x,y } : null;
  }
  function advance(old, next) {
    let {x,y} = old;
    while (x !== next.x) { x += x < next.x ? 1 : -1; core.move(game, {x,y}); }
    while (y !== next.y) { y += y < next.y ? 1 : -1; core.move(game, {x,y}); }
  }
  canvas.addEventListener('pointerdown', event => {
    if (!game || game.finishedAt) return;
    const p = pointerCell(event); if (!p) return;
    pointerActive = true;lastCell=p;core.begin(game,p);
    canvas.setPointerCapture(event.pointerId); update();
  });
  canvas.addEventListener('pointermove', event => {
    if (!pointerActive || !game) return;
    const p = pointerCell(event);
    if (p && lastCell && !core.eq(p,lastCell)) { advance(lastCell,p);lastCell=p;update(); }
  });
  function release() {
    if (!pointerActive) return;
    pointerActive=false;lastCell=null;core.end(game);update();
  }
  canvas.addEventListener('pointerup',release);
  canvas.addEventListener('pointercancel',release);
  $('dailyStart').onclick = () => start('daily');
  $('freeStart').onclick = () => start('free');
  $('back').onclick = () => {
    $('gameScreen').hidden = true;$('home').hidden = false;
    $('solvedTag').style.display = safeDailySolved() ? 'inline' : 'none';
  };
  function safeDailySolved() { try { return localStorage.getItem('gridclub-daily') === day(); } catch (_) { return false; } }
  $('solvedTag').style.display = safeDailySolved() ? 'inline' : 'none';
  $('help').onclick = () => alert('Drag from a coloured dot through adjacent squares to its matching dot. Lines cannot cross. Fill every square. Hint completes one correct path; Undo reverts the last change.');
  $('undo').onclick = () => { core.undo(game);update(); };
  $('hint').onclick = () => { core.hint(game);update(); };
  $('reset').onclick = () => { core.reset(game);notified=false;$('win').classList.remove('show');update(); };
  $('new').onclick = () => newGame();
  $('next').onclick = () => newGame();
  document.querySelectorAll('[data-size]').forEach(button => button.onclick = () => newGame(Number(button.dataset.size)));
  $('share').onclick = async () => {
    const text = `🟣 Grid Club · Dot Connect\n${mode==='daily' ? `Daily challenge ${day()}` : `${size}×${size} puzzle`} solved in ${game.moves} moves. 🧩`;
    try { if (navigator.share) await navigator.share({text});
          else if (navigator.clipboard) { await navigator.clipboard.writeText(text); alert('Result copied!'); }
          else prompt('Copy your result:',text); } catch (_) {}
  };
  window.addEventListener('resize', resize);
  setInterval(() => { if (game && !$('gameScreen').hidden) update(); }, 1000);
})();
