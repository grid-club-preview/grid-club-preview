/* Shared, dependency-free Dot Connect puzzle engine. */
(function (root) {
  'use strict';
  function hash(key) {
    let h = 2166136261 >>> 0;
    for (const b of new TextEncoder().encode(key)) {
      h = Math.imul(h ^ b, 16777619) >>> 0;
    }
    return h;
  }
  function random(seed) {
    let state = seed >>> 0;
    return (bound) => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state % bound;
    };
  }
  function generate(size, seed) {
    if (![5, 6, 7].includes(size)) throw new Error('Unsupported size');
    const pick = random(seed);
    const vertical = pick(2) === 1, flipX = pick(2) === 1, flipY = pick(2) === 1;
    const snake = [];
    for (let row = 0; row < size; row++) {
      for (let step = 0; step < size; step++) {
        const col = row % 2 === 0 ? step : size - 1 - step;
        const px = vertical ? row : col, py = vertical ? col : row;
        snake.push({ x: flipX ? size - 1 - px : px, y: flipY ? size - 1 - py : py });
      }
    }
    const lengths = Array(size).fill(size);
    for (let n = 0; n < size * 4; n++) {
      const donor = pick(size), receiver = pick(size);
      if (donor !== receiver && lengths[donor] > 3 && lengths[receiver] < size + 3) {
        lengths[donor]--; lengths[receiver]++;
      }
    }
    const order = Array.from({ length: size }, (_, i) => i);
    for (let i = size - 1; i >= 1; i--) {
      const j = pick(i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
    const solution = Array.from({ length: size }, () => []);
    let cursor = 0;
    for (let i = 0; i < size; i++) {
      solution[order[i]] = snake.slice(cursor, cursor + lengths[i]);
      cursor += lengths[i];
    }
    const pairs = solution.map((path, id) => ({ id, a: path[0], b: path[path.length - 1] }));
    return { size, seed, solution, pairs };
  }
  const eq = (a, b) => !!a && !!b && a.x === b.x && a.y === b.y;
  const adjacent = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
  function create(level) {
    return { level, paths: {}, undo: [], moves: 0, startedAt: Date.now(), finishedAt: null, drag: null, snapshot: {} };
  }
  function copyPaths(paths) { return JSON.parse(JSON.stringify(paths)); }
  function endpoint(g, p) {
    const pair = g.level.pairs.find(q => eq(q.a, p) || eq(q.b, p));
    return pair ? pair.id : null;
  }
  function owner(g, p) {
    for (const [id, path] of Object.entries(g.paths)) if (path.some(q => eq(q, p))) return Number(id);
    return null;
  }
  function connected(g, id) {
    const pair = g.level.pairs[id], path = g.paths[id];
    if (!path || path.length < 2) return false;
    return (eq(path[0], pair.a) && eq(path[path.length-1], pair.b)) ||
           (eq(path[0], pair.b) && eq(path[path.length-1], pair.a));
  }
  function filled(g) { return new Set(Object.values(g.paths).flat().map(p => `${p.x},${p.y}`)).size; }
  function check(g) {
    if (g.level.pairs.every(pair => connected(g, pair.id)) && filled(g) === g.level.size ** 2) {
      g.finishedAt = Date.now();
    }
  }
  function begin(g, p) {
    if (g.finishedAt) return;
    const id = endpoint(g, p);
    if (id === null) return;
    g.snapshot = copyPaths(g.paths);
    g.paths[id] = [p];
    g.drag = id;
  }
  function move(g, p) {
    if (g.drag === null || g.finishedAt) return;
    if (p.x < 0 || p.y < 0 || p.x >= g.level.size || p.y >= g.level.size) return;
    const id = g.drag, path = g.paths[id], last = path[path.length - 1];
    if (!adjacent(last, p) || connected(g, id)) return;
    const occupier = owner(g, p), marked = endpoint(g, p);
    if (occupier !== null && occupier !== id) return;
    if (marked !== null && marked !== id) return;
    const prior = path.findIndex(q => eq(q, p));
    if (prior >= 0) g.paths[id] = path.slice(0, prior + 1);
    else path.push(p);
  }
  function end(g) {
    if (g.drag === null) return;
    g.drag = null;
    if (JSON.stringify(g.snapshot) !== JSON.stringify(g.paths)) {
      g.undo.push(g.snapshot);
      if (g.undo.length > 30) g.undo.shift();
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
    const id = (g.level.pairs.find(pair => !connected(g, pair.id)) ||
      g.level.pairs.find(pair => JSON.stringify(g.paths[pair.id]) !== JSON.stringify(g.level.solution[pair.id])))?.id;
    if (id === undefined) return;
    g.undo.push(copyPaths(g.paths));
    const answer = g.level.solution[id];
    for (const other of g.level.pairs) {
      if (other.id === id) continue;
      if (g.paths[other.id]?.some(p => answer.some(q => eq(p, q)))) delete g.paths[other.id];
    }
    g.paths[id] = answer.map(p => ({ ...p }));
    g.moves++;
    check(g);
  }
  function reset(g) {
    g.paths = {}; g.undo = []; g.moves = 0; g.startedAt = Date.now();
    g.finishedAt = null; g.drag = null;
  }
  const core = { hash, generate, create, endpoint, owner, connected, filled, begin, move, end, undo, hint, reset, adjacent, eq };
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
  root.GridCore = core;
})(typeof globalThis === 'object' ? globalThis : this);
