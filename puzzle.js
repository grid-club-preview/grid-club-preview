/* Grid Club · Dot Trails v0.4a
 * A complete puzzle is built from a shuffled Hamiltonian route, split into
 * non-overlapping coloured paths. Every generated board therefore has at least
 * one valid, full-grid solution. Pure JS: runs in browsers and in Node tests.
 */
(function (root) {
  'use strict';
  const SIZES = [5, 7, 9, 11];
  const PAIR_RANGES = {5:[3,5], 7:[5,7], 9:[7,10], 11:[9,12]};
  const eq = (a, b) => !!a && !!b && a.x === b.x && a.y === b.y;
  const adjacent = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
  const key = p => `${p.x},${p.y}`;
  function hash(value) {
    let h = 2166136261 >>> 0;
    for (const byte of new TextEncoder().encode(value)) h = Math.imul(h ^ byte, 16777619) >>> 0;
    return h >>> 0;
  }
  function random(seed) {
    let x = seed >>> 0;
    return bound => {
      x = (x + 0x6D2B79F5) >>> 0;
      let t = Math.imul(x ^ (x >>> 15), x | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) % bound;
    };
  }
  function snake(size) {
    const route = [];
    for (let y = 0; y < size; y++) for (let s = 0; s < size; s++) {
      route.push({ x: y % 2 ? size - 1 - s : s, y });
    }
    return route;
  }
  // Backbite steps keep one path visiting every square exactly once, but
  // turn the obvious snake into an irregular, twisting full-board route.
  function bendRoute(route, size, pick, attempts) {
    for (let step = 0; step < attempts; step++) {
      const start = pick(2) === 0;
      const endpoint = start ? route[0] : route[route.length - 1];
      const neighbours = [
        { x: endpoint.x + 1, y: endpoint.y },
        { x: endpoint.x - 1, y: endpoint.y },
        { x: endpoint.x, y: endpoint.y + 1 },
        { x: endpoint.x, y: endpoint.y - 1 }
      ].filter(p => p.x >= 0 && p.y >= 0 && p.x < size && p.y < size);
      const next = neighbours[pick(neighbours.length)];
      const index = route.findIndex(p => eq(p, next));
      if (start && index > 1) {
        route = route.slice(0, index).reverse().concat(route.slice(index));
      } else if (!start && index < route.length - 2) {
        route = route.slice(0, index + 1).concat(route.slice(index + 1).reverse());
      }
    }
    return route;
  }
  function splitRoute(route, size, pick) {
    const [minPairs, maxPairs] = PAIR_RANGES[size];
    const count = minPairs + pick(maxPairs - minPairs + 1), total = size * size;
    const base = Math.floor(total / count);
    const lengths = Array.from({length: count}, (_, i) => base + (i < total % count ? 1 : 0));
    const minimum = size <= 5 ? 3 : 4;
    const maximum = Math.ceil(total / count * 1.75);
    for (let i = 0; i < count * 8; i++) {
      const a = pick(count), b = pick(count);
      if (a !== b && lengths[a] > minimum && lengths[b] < maximum) { lengths[a]--; lengths[b]++; }
    }
    const ids = Array.from({length: count}, (_, i) => i);
    for (let i = count - 1; i > 0; i--) {
      const j = pick(i + 1);
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    const solution = Array.from({length: count}, () => []);
    let offset = 0;
    for (let i = 0; i < count; i++) {
      solution[ids[i]] = route.slice(offset, offset + lengths[i]);
      offset += lengths[i];
    }
    return solution;
  }
  function quality(solution) {
    let score = 0;
    for (const path of solution) {
      const a = path[0], b = path[path.length - 1];
      const direct = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      let turns = 0;
      for (let i = 2; i < path.length; i++) {
        if (path[i].x - path[i-1].x !== path[i-1].x - path[i-2].x ||
            path[i].y - path[i-1].y !== path[i-1].y - path[i-2].y) turns++;
      }
      score += turns * 2 + Math.min(direct, 6) + Math.min(path.length - direct - 1, 10);
      if (direct <= 1) score -= 8;
    }
    return score;
  }
  function generate(size, seed, options = {}) {
    if (!SIZES.includes(size)) throw new Error('Unsupported board size');
    const pick = random(seed);
    let best = null, bestQuality = -Infinity;
    const candidates = options.daily ? 8 : 4;
    for (let n = 0; n < candidates; n++) {
      const route = bendRoute(snake(size), size, pick, size * size * (options.daily ? 15 : 10));
      const solution = splitRoute(route, size, pick);
      const value = quality(solution);
      if (value > bestQuality) { bestQuality = value; best = solution; }
    }
    return {
      size, seed, solution: best,
      pairs: best.map((path, id) => ({id, a: path[0], b: path[path.length - 1]})),
      difficulty: options.daily ? 'daily' : String(size)
    };
  }
  // Curated obstacles may be added ONLY to fixed numbered puzzles. The blocked
  // squares correspond to complete paths in the original reference solution,
  // so every remaining playable square still has an explicit valid route.
  // Do not use this transformation for random or ranked Daily puzzles.
  function withBlocked(level, cells) {
    if (!Array.isArray(cells) || !cells.length) return level;
    const blocked = new Set();
    for (const raw of cells) {
      const x = Array.isArray(raw) ? raw[0] : raw?.x;
      const y = Array.isArray(raw) ? raw[1] : raw?.y;
      if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 ||
          x >= level.size || y >= level.size || blocked.has(`${x},${y}`))
        throw new Error('Invalid blocked-square catalogue');
      blocked.add(`${x},${y}`);
    }
    const kept=[];
    const covered=new Set();
    for (const path of level.solution) {
      const count=path.filter(p=>blocked.has(key(p))).length;
      if (count>0 && count!==path.length)
        throw new Error('Blocked square intersects a required solution path');
      if (count===path.length) for(const p of path)covered.add(key(p));
      else kept.push(path);
    }
    if (covered.size!==blocked.size || kept.length<3)
      throw new Error('Blocked-square catalogue does not preserve a valid board');
    const solution=kept.map(path=>path.map(p=>({...p})));
    return {...level, blocked:[...blocked].map(k=>{
      const [x,y]=k.split(',').map(Number);return {x,y};
    }), solution, pairs:solution.map((path,id)=>({id,a:path[0],b:path[path.length-1]}))};
  }
  // Extra coloured pairs for selected fixed Levels only. The original
  // full-grid solution and all existing blocked squares stay intact.
  // Splitting a long complete reference path preserves a valid solution.
  function withExtraPairs(level,extra=0){
    if(!Number.isInteger(extra)||extra<0||extra>4)throw new Error('Invalid extra pair count');
    if(!extra)return level;
    const solution=level.solution.map(path=>path.map(p=>({...p})));
    for(let n=0;n<extra;n++){
      let longest=-1;
      for(let i=0;i<solution.length;i++){
        if(solution[i].length>=8&&(longest<0||solution[i].length>solution[longest].length))longest=i;
      }
      if(longest<0)throw new Error('Not enough path length for extra pairs');
      const path=solution[longest],cut=Math.floor(path.length/2);
      solution.splice(longest,1,path.slice(0,cut),path.slice(cut));
    }
    return {...level,solution,pairs:solution.map((path,id)=>({id,a:path[0],b:path[path.length-1]})),extraPairs:extra};
  }
  function isBlocked(level,p){
    return !!level?.blocked?.some(cell=>eq(cell,p));
  }
  function playableCells(level){return level.size*level.size-(level.blocked?.length||0);}
  function copyPaths(paths) { return JSON.parse(JSON.stringify(paths)); }
  function create(level) {
    const now = Date.now();
    return { level, paths: {}, undo: [], moves: 0, hints: 0, resets: 0,
      startedAt: now, clockStartedAt: now, elapsedMs: 0, paused: false,
      finishedAt: null, drag: null, snapshot: {}, tapClear: false,
      attemptId: `${level.seed}-${now}-${Math.random().toString(36).slice(2,10)}` };
  }
  function elapsed(g, now = Date.now()) {
    return Math.max(0, g.elapsedMs + (!g.paused && !g.finishedAt && g.clockStartedAt ? Math.max(0, now - g.clockStartedAt) : 0));
  }
  function pause(g, now = Date.now()) {
    if (!g || g.paused || g.finishedAt) return false;
    g.elapsedMs = elapsed(g, now);
    g.clockStartedAt = null; g.paused = true;
    g.drag = null; g.tapClear = false;
    return true;
  }
  function resume(g, now = Date.now()) {
    if (!g || !g.paused || g.finishedAt) return false;
    g.paused = false; g.clockStartedAt = now;
    return true;
  }
  // Persist a snapshot with a frozen clock, so a browser crash/relaunch cannot
  // silently add the time the app was closed to a player's elapsed time.
  function serialize(g, now = Date.now()) {
    if (!g) return null;
    return {
      version: 2, level: g.level, paths: copyPaths(g.paths),
      undo: (g.undo || []).slice(-50), moves: g.moves, hints: g.hints,
      resets: g.resets, startedAt: g.startedAt, finishedAt: g.finishedAt,
      elapsedMs: elapsed(g, now), paused: true, attemptId: g.attemptId
    };
  }
  function restore(data) {
    if (!data || data.version !== 2 || !data.level || !SIZES.includes(data.level.size) ||
        !Array.isArray(data.level.pairs) || !Array.isArray(data.level.solution)) return null;
    const g = create(data.level);
    g.paths = copyPaths(data.paths || {});
    g.undo = Array.isArray(data.undo) ? data.undo.slice(-50) : [];
    for (const k of ['moves','hints','resets']) g[k] = Number.isFinite(data[k]) ? Math.max(0, Math.floor(data[k])) : 0;
    g.startedAt = Number.isFinite(data.startedAt) ? data.startedAt : Date.now();
    g.finishedAt = Number.isFinite(data.finishedAt) ? data.finishedAt : null;
    g.elapsedMs = Number.isFinite(data.elapsedMs) ? Math.max(0, data.elapsedMs) : 0;
    g.clockStartedAt = null; g.paused = true; g.drag = null; g.snapshot = {};
    g.attemptId = typeof data.attemptId === 'string' ? data.attemptId : g.attemptId;
    // Only restore saved paths if they are well-formed and non-overlapping.
    const seen = new Set();
    for (const [id, path] of Object.entries(g.paths)) {
      const pair = g.level.pairs[Number(id)];
      if (!pair || !Array.isArray(path) || !path.length ||
          !path.every((p,i) => p && Number.isInteger(p.x) && Number.isInteger(p.y) && p.x >= 0 && p.y >= 0 && p.x < g.level.size && p.y < g.level.size && !isBlocked(g.level,p) &&
            (i === 0 || adjacent(path[i-1],p)) && !seen.has(key(p)))) return null;
      if (!eq(path[0],pair.a) && !eq(path[0],pair.b)) return null;
      path.forEach(p => seen.add(key(p)));
    }
    return g;

  }
  function endpoint(g, p) {
    const pair = g.level.pairs.find(q => eq(q.a, p) || eq(q.b, p));
    return pair ? pair.id : null;
  }
  function owner(g, p) {
    for (const [id, path] of Object.entries(g.paths)) {
      if (path.some(node => eq(node, p))) return Number(id);
    }
    return null;
  }
  function connected(g, id) {
    const pair = g.level.pairs[id], path = g.paths[id];
    if (!path || path.length < 2) return false;
    return (eq(path[0], pair.a) && eq(path[path.length - 1], pair.b)) ||
           (eq(path[0], pair.b) && eq(path[path.length - 1], pair.a));
  }
  function filled(g) {
    return new Set(Object.values(g.paths).flat().map(key)).size;
  }
  function check(g) {
    if (g.level.pairs.every(pair => connected(g, pair.id)) &&
        filled(g) === playableCells(g.level)) {
      const now = Date.now();
      g.elapsedMs = elapsed(g, now);
      g.clockStartedAt = null;
      g.finishedAt = now;
    }
  }
  function begin(g, p) {
    if (g.finishedAt || g.paused) return false;
    if(isBlocked(g.level,p))return false;
    const existingId = owner(g, p);
    // Resume an unfinished path by pressing the final square of that path.
    if (existingId !== null) {
      const path = g.paths[existingId];
      if (!connected(g, existingId) && path.length > 1 && eq(path[path.length - 1], p)) {
        g.snapshot = copyPaths(g.paths);
        g.drag = existingId;
        g.tapClear = false;
        return true;
      }
    }
    const id = endpoint(g, p);
    if (id === null) return false;
    g.snapshot = copyPaths(g.paths);
    g.tapClear = !!(g.paths[id] && g.paths[id].length > 1);
    g.paths[id] = [p];
    g.drag = id;
    return true;
  }
  function move(g, p) {
    if (g.drag === null || g.finishedAt || g.paused) return false;
    if (p.x < 0 || p.y < 0 || p.x >= g.level.size || p.y >= g.level.size || isBlocked(g.level,p)) return false;
    const id = g.drag, path = g.paths[id], last = path[path.length - 1];
    if (!adjacent(last, p) || connected(g, id)) return false;
    const occupier = owner(g, p), marked = endpoint(g, p);
    if (occupier !== null && occupier !== id) return false;
    if (marked !== null && marked !== id) return false;
    const prior = path.findIndex(node => eq(node, p));
    if (prior >= 0) g.paths[id] = path.slice(0, prior + 1);
    else path.push(p);
    g.tapClear = false;
    return true;
  }
  function end(g) {
    if (g.drag === null) return;
    const id = g.drag;
    g.drag = null;
    // Tapping an already drawn pair's dot clears it. Dragging starts again.
    if (g.tapClear && g.paths[id]?.length === 1) delete g.paths[id];
    g.tapClear = false;
    if (JSON.stringify(g.snapshot) !== JSON.stringify(g.paths)) {
      g.undo.push(g.snapshot);
      if (g.undo.length > 50) g.undo.shift();
      g.moves++;
    }
    check(g);
  }
  function undo(g) {
    if (g.finishedAt || !g.undo.length) return;
    g.paths = g.undo.pop();
    g.moves++;
  }
  // Hint is a temporary preview, NOT a change to the player's paths.
  // It uses one generated full-board answer; other valid solutions may exist.
  // Prefer a segment that extends a player's matching partial route, then an
  // untouched pair with a clear hint segment. Never erase the player's work.
  function hint(g) {
    if (!g || g.finishedAt || g.paused) return null;
    const answerPaths = g.level.solution;
    const allConnectedButIncomplete = g.level.pairs.every(pair => connected(g, pair.id)) && filled(g) < playableCells(g.level);
    const choices = [];
    for (const pair of g.level.pairs) {
      const answer = answerPaths[pair.id];
      const current = g.paths[pair.id] || [];
      if (connected(g, pair.id) && !allConnectedButIncomplete) continue;
      if (allConnectedButIncomplete && samePath(current, answer)) continue;
      let candidate = null;
      if (current.length) {
        const forward = answer.slice();
        const backward = answer.slice().reverse();
        const match = [forward, backward].find(full => current.every((p, i) => eq(p, full[i])));
        if (match && match.length > current.length) {
          // Include current loose end for a visible continuous guide.
          candidate = match.slice(current.length-1, Math.min(match.length,current.length+4));
        }
      } else {
        candidate = answer.slice(0, Math.min(5, answer.length));
      }
      if (allConnectedButIncomplete) candidate = answer.slice(0, Math.min(5, answer.length));
      if (!candidate || candidate.length < 2) continue;
      const noConflict = candidate.every(p => {
        const occupant = owner(g,p);
        return occupant === null || occupant === pair.id;
      });
      if (noConflict || allConnectedButIncomplete) choices.push({pairId:pair.id, cells:candidate, reroute:allConnectedButIncomplete});
    }
    if (!choices.length) return null;
    choices.sort((a,b) => b.cells.length-a.cells.length);
    g.hints++;
    return choices[0];
  }
  function samePath(a, b) {
    return !!a && a.length === b.length &&
      (a.every((p, i) => eq(p, b[i])) || a.every((p, i) => eq(p, b[b.length - 1 - i])));
  }
  function reset(g) {
    if (g.finishedAt || g.paused) return;
    g.paths = {};g.undo = [];g.moves++;g.resets++;
    // Reset clears lines, not the clock or previously used hints/moves.
    g.drag = null;g.tapClear = false;
  }
  const core = { SIZES, hash, generate, withBlocked, withExtraPairs, isBlocked, playableCells, create, endpoint, owner, connected,
    filled, begin, move, end, undo, hint, reset, adjacent, eq, samePath, quality,
    elapsed, pause, resume, serialize, restore, PAIR_RANGES };
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
  root.GridCore = core;
})(typeof globalThis === 'object' ? globalThis : this);
