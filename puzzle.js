/* Grid Club · Dot Trails v0.3
 * A complete puzzle is built from a shuffled Hamiltonian route, split into
 * non-overlapping coloured paths. Every generated board therefore has at least
 * one valid, full-grid solution. Pure JS: runs in browsers and in Node tests.
 */
(function (root) {
  'use strict';
  const SIZES = [5, 7, 9, 11];
  const PAIRS = { 5: 5, 7: 6, 9: 8, 11: 9 };
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
    const count = PAIRS[size], total = size * size;
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
  function copyPaths(paths) { return JSON.parse(JSON.stringify(paths)); }
  function create(level) {
    return { level, paths: {}, undo: [], moves: 0, hints: 0, resets: 0,
      startedAt: Date.now(), finishedAt: null, drag: null, snapshot: {}, tapClear: false };
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
        filled(g) === g.level.size ** 2) g.finishedAt = Date.now();
  }
  function begin(g, p) {
    if (g.finishedAt) return false;
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
    if (g.drag === null || g.finishedAt) return false;
    if (p.x < 0 || p.y < 0 || p.x >= g.level.size || p.y >= g.level.size) return false;
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
  function hint(g) {
    if (g.finishedAt) return;
    let id = g.level.pairs.find(pair => !connected(g, pair.id))?.id;
    if (id === undefined) {
      id = g.level.pairs.find(pair => !samePath(g.paths[pair.id], g.level.solution[pair.id]))?.id;
    }
    if (id === undefined) return;
    const answer = g.level.solution[id];
    g.undo.push(copyPaths(g.paths));
    if (g.undo.length > 50) g.undo.shift();
    for (const other of g.level.pairs) {
      if (other.id !== id && g.paths[other.id]?.some(p => answer.some(q => eq(p, q)))) {
        delete g.paths[other.id];
      }
    }
    g.paths[id] = answer.map(p => ({...p}));
    g.moves++;g.hints++;
    check(g);
  }
  function samePath(a, b) {
    return !!a && a.length === b.length &&
      (a.every((p, i) => eq(p, b[i])) || a.every((p, i) => eq(p, b[b.length - 1 - i])));
  }
  function reset(g) {
    g.paths = {};g.undo = [];g.moves = 0;g.hints = 0;g.resets++;
    g.startedAt = Date.now();g.finishedAt = null;g.drag = null;
  }
  const core = { SIZES, hash, generate, create, endpoint, owner, connected,
    filled, begin, move, end, undo, hint, reset, adjacent, eq, samePath, quality };
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
  root.GridCore = core;
})(typeof globalThis === 'object' ? globalThis : this);
