import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const PREFIXES = ["Ash", "Vor", "Kes", "Bren", "Mor", "Grau", "Stahl", "Dun", "Kar", "Vel", "Ost", "Rud", "Hald", "Zel"];
const SUFFIXES = ["feld", "grad", "mark", "holm", "bruck", "stad", "wald", "fen", "gard", "dorf", "hafen", "moor"];
const TERRAINS = ["plains", "hills", "forest", "marsh", "highlands"];
const RESOURCES = ["oil_field", "coal_depot", "iron_foundry"];

const key = (q, r) => `${q},${r}`;
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const hexDist = (a, b) => (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2;

function generateTiles(tileCount, playerCount, seaRatio) {
  // Grow a connected blob from origin
  const placed = new Map();
  placed.set(key(0, 0), { q: 0, r: 0 });
  const frontier = [[0, 0]];
  while (placed.size < tileCount) {
    const [q, r] = frontier[Math.floor(Math.random() * frontier.length)];
    const open = DIRS.map(([dq, dr]) => [q + dq, r + dr]).filter(([nq, nr]) => !placed.has(key(nq, nr)));
    if (open.length === 0) {
      frontier.splice(frontier.findIndex(([fq, fr]) => fq === q && fr === r), 1);
      if (frontier.length === 0) frontier.push([0, 0]);
      continue;
    }
    const [nq, nr] = rand(open);
    placed.set(key(nq, nr), { q: nq, r: nr });
    frontier.push([nq, nr]);
  }

  const coords = [...placed.values()];
  const usedNames = new Set();
  const makeName = () => {
    for (let i = 0; i < 50; i++) {
      const n = rand(PREFIXES) + rand(SUFFIXES);
      if (!usedNames.has(n)) { usedNames.add(n); return n; }
    }
    return rand(PREFIXES) + rand(SUFFIXES) + Math.floor(Math.random() * 99);
  };

  const tiles = coords.map((c, i) => ({
    id: `t${i}`,
    q: c.q,
    r: c.r,
    name: makeName(),
    terrain: rand(TERRAINS),
    baseIncome: 1 + Math.floor(Math.random() * 4),
    resourceBonus: null,
    isCapital: false,
    isSea: false,
    adjacentIds: [],
  }));

  const byCoord = new Map(tiles.map((t) => [key(t.q, t.r), t]));

  // Mark sea tiles, keeping land connected
  const landConnected = (seaSet) => {
    const land = tiles.filter((t) => !seaSet.has(t.id));
    if (land.length === 0) return false;
    const seen = new Set([land[0].id]);
    const queue = [land[0]];
    while (queue.length) {
      const t = queue.pop();
      for (const [dq, dr] of DIRS) {
        const n = byCoord.get(key(t.q + dq, t.r + dr));
        if (n && !seaSet.has(n.id) && !seen.has(n.id)) { seen.add(n.id); queue.push(n); }
      }
    }
    return seen.size === land.length;
  };

  const seaSet = new Set();
  const seaTarget = Math.floor(tileCount * seaRatio);
  const shuffled = [...tiles].sort(() => Math.random() - 0.5);
  for (const t of shuffled) {
    if (seaSet.size >= seaTarget) break;
    seaSet.add(t.id);
    if (!landConnected(seaSet)) seaSet.delete(t.id);
  }
  for (const t of tiles) {
    if (seaSet.has(t.id)) {
      t.isSea = true;
      t.terrain = "sea";
      t.baseIncome = 0;
      t.name = rand(["Grey", "Iron", "Black", "Storm", "Cinder"]) + " " + rand(["Reach", "Sound", "Gulf", "Strait", "Deep"]);
    }
  }

  // Adjacency
  for (const t of tiles) {
    t.adjacentIds = DIRS.map(([dq, dr]) => byCoord.get(key(t.q + dq, t.r + dr))).filter(Boolean).map((n) => n.id);
  }

  // Capitals: greedy farthest-apart land tiles
  const land = tiles.filter((t) => !t.isSea);
  const capitals = [land[Math.floor(Math.random() * land.length)]];
  while (capitals.length < playerCount) {
    let best = null, bestScore = -1;
    for (const t of land) {
      if (capitals.includes(t)) continue;
      const score = Math.min(...capitals.map((c) => hexDist(t, c)));
      if (score > bestScore) { bestScore = score; best = t; }
    }
    capitals.push(best);
  }
  for (const c of capitals) {
    c.isCapital = true;
    c.baseIncome = Math.max(3, c.baseIncome);
  }

  // Resources on ~20% of non-capital land
  for (const t of land) {
    if (!t.isCapital && Math.random() < 0.22) t.resourceBonus = rand(RESOURCES);
  }

  return tiles;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const tileCount = Math.min(Math.max(body.tileCount || 26, 12), 60);
    const playerCount = Math.min(Math.max(body.playerCount || 2, 2), 4);
    const seaRatio = Math.min(Math.max(body.seaRatio ?? 0.15, 0), 0.3);

    const tiles = generateTiles(tileCount, playerCount, seaRatio);
    const name = body.name || ("The " + ["Shattered", "Ashen", "Rusted", "Broken", "Scorched"][Math.floor(Math.random() * 5)] + " " + ["Reach", "Frontier", "Marches", "Expanse", "Theater"][Math.floor(Math.random() * 5)]);

    const map = { name, tiles, recommendedPlayerCount: playerCount, isPublished: true, description: "Procedurally generated theater of war." };

    if (body.save) {
      const saved = await base44.entities.GameMap.create(map);
      return Response.json({ map: saved });
    }
    return Response.json({ map });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});