import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// ---------- Rules definitions ----------
const RESOURCE_KEYS = ['manpower', 'steel', 'fuel'];
const TERRAIN_RESOURCE = {
  plains: 'manpower', deltas: 'manpower', forest: 'manpower',
  hills: 'steel', highlands: 'steel', mountains: 'steel',
  marsh: 'fuel',
};

const UNITS = {
  riflemen: { points: 5, cost: { manpower: 2, steel: 1 }, attack: 1, defense: 2, domain: 'land', deployAt: 'barracks' },
  crawler: { points: 12, cost: { steel: 3, fuel: 2 }, attack: 3, defense: 2, domain: 'land', deployAt: 'foundry' },
  gunboat: { points: 10, cost: { steel: 3, fuel: 1 }, attack: 2, defense: 2, domain: 'sea', deployAt: 'foundry' },
  fighter: { points: 15, cost: { steel: 2, fuel: 3 }, attack: 3, defense: 1, domain: 'air', deployAt: 'airstrip' },
};
const UNIT_KEYS = ['riflemen', 'crawler', 'gunboat', 'fighter'];
const CASUALTY_ORDER = ['riflemen', 'crawler', 'gunboat', 'fighter'];

const BUILDINGS = {
  barracks: { cost: { steel: 4 }, upgradeCost: { steel: 6 } },
  foundry: { cost: { manpower: 3, fuel: 2 }, upgradeCost: { manpower: 4, fuel: 3 } },
  refinery: { cost: { steel: 4 }, upgradeCost: { steel: 6 } },
  fortifications: { cost: { steel: 5 }, upgradeCost: { steel: 7 } },
  airstrip: { cost: { steel: 3, fuel: 3 } },
};

// GURPS-style point-buy perk effects (mirrors src/lib/pointBuy.js)
const PERK_MODS = {
  veteran_corps: { unitStat: { riflemen: { attack: 1 } } },
  industrial_base: { income: { steel: 1 } },
  oil_concessions: { income: { fuel: 1 } },
  deep_reserves: { income: { manpower: 1 } },
  conscription: { unitCost: { riflemen: { manpower: -1 } } },
  mobilization_doctrine: { armyCap: 15 },
  war_chest: { startBonus: 4 },
  home_guard: { capitalDefense: 1 },
  war_weary: { armyCap: -15 },
  fuel_shortage: { income: { fuel: -1 } },
  rusting_arsenal: { unitCost: { crawler: { steel: 1 } } },
  green_recruits: { unitStat: { riflemen: { defense: -1 } } },
  depleted_stockpiles: { startBonus: -4 },
  brittle_industry: { income: { steel: -1 } },
  pariah_state: { disposition: -10 },
  trench_gear: { unitStat: { riflemen: { defense: 1 } } },
  flame_projectors: { unitStat: { crawler: { attack: 1 } }, unitCost: { crawler: { fuel: 1 } } },
  heavy_plating: { unitStat: { crawler: { defense: 1 } } },
  naval_rams: { unitStat: { gunboat: { attack: 1 } } },
  drop_tanks: { unitStat: { fighter: { defense: 1 } } },
};

function compileMods(picks = []) {
  const m = { unitStat: {}, unitCost: {}, income: { manpower: 0, steel: 0, fuel: 0 }, armyCap: 0, startBonus: 0, capitalDefense: 0, disposition: 0 };
  for (const id of picks) {
    const p = PERK_MODS[id];
    if (!p) continue;
    for (const [unit, stats] of Object.entries(p.unitStat || {})) {
      m.unitStat[unit] = m.unitStat[unit] || {};
      for (const [s, v] of Object.entries(stats)) m.unitStat[unit][s] = (m.unitStat[unit][s] || 0) + v;
    }
    for (const [unit, res] of Object.entries(p.unitCost || {})) {
      m.unitCost[unit] = m.unitCost[unit] || {};
      for (const [r, v] of Object.entries(res)) m.unitCost[unit][r] = (m.unitCost[unit][r] || 0) + v;
    }
    for (const k of RESOURCE_KEYS) m.income[k] += (p.income || {})[k] || 0;
    m.armyCap += p.armyCap || 0;
    m.startBonus += p.startBonus || 0;
    m.capitalDefense += p.capitalDefense || 0;
    m.disposition += p.disposition || 0;
  }
  return m;
}

const slotMods = (slot) => slot?.mods || compileMods(slot?.pointBuy);

const MAP_CONTROL_PCT = 60;
const ARMY_CAP_FLOOR = 90;
const ARMY_CAP_PER_MANPOWER = 10;
const START_RESOURCES = { manpower: 6, steel: 10, fuel: 6 };

const COLORS = ['#B33A3A', '#3A6EA5', '#5A7D4F', '#B5722F'];
const NPC_NAMES = {
  aggressive: ['The Iron Vanguard', 'Crimson Pact', 'The Warhost of Vel'],
  economic: ['The Foundry Combine', 'Merchant Syndicate of Ost', 'The Ledger Union'],
  defensive: ['The Bulwark Concord', 'Wardens of the Pale', 'The Granite Compact'],
};

const totalUnits = (u = {}) => UNIT_KEYS.reduce((s, k) => s + (u[k] || 0), 0);
const roll = () => 1 + Math.floor(Math.random() * 6);
const emptyResources = () => ({ manpower: 0, steel: 0, fuel: 0 });

function traitBonus(traits = [], unit, kind) {
  let b = 0;
  for (const t of traits) {
    const e = t.effect || {};
    if (e.type === kind && (!e.unit || e.unit === unit)) b += e.value || 0;
  }
  return b;
}

// ---------- Resources & buildings ----------
function activeBuildings(st) {
  return (st?.buildings || []).filter((b) => (b.level || 0) > 0);
}

function hasBuilding(st, type) {
  return activeBuildings(st).some((b) => b.type === type);
}

function fortLevel(st) {
  const f = activeBuildings(st).find((b) => b.type === 'fortifications');
  return f ? f.level : 0;
}

function tileProduction(tile, st) {
  const out = emptyResources();
  if (!tile || tile.isSea) return out;
  const type = TERRAIN_RESOURCE[tile.terrain] || 'manpower';
  out[type] += tile.baseIncome || 1;
  if (tile.resourceBonus === 'oil_field') out.fuel += 2;
  if (tile.resourceBonus === 'coal_depot') out.steel += 1;
  if (tile.resourceBonus === 'iron_foundry') out.steel += 1;
  for (const b of activeBuildings(st)) {
    if (b.type === 'barracks') out.manpower += b.level;
    if (b.type === 'foundry') out.steel += b.level;
    if (b.type === 'refinery') out.fuel += 2 * b.level;
  }
  return out;
}

function factionProduction(game, slotIdx) {
  const out = emptyResources();
  for (const [tid, st] of Object.entries(game.territoryStates)) {
    if (st.owner !== slotIdx) continue;
    const tile = game.tiles.find((t) => t.id === tid);
    const p = tileProduction(tile, st);
    for (const k of RESOURCE_KEYS) out[k] += p[k];
  }
  return out;
}

function getTreasury(game, slotIdx) {
  const tkey = String(slotIdx);
  if (!game.treasuries[tkey] || typeof game.treasuries[tkey] !== 'object') {
    game.treasuries[tkey] = emptyResources();
  }
  return game.treasuries[tkey];
}

function canAfford(treasury, cost) {
  return RESOURCE_KEYS.every((k) => (treasury[k] || 0) >= (cost[k] || 0));
}

function pay(treasury, cost) {
  for (const k of RESOURCE_KEYS) treasury[k] = (treasury[k] || 0) - (cost[k] || 0);
}

function armyPoints(game, slotIdx) {
  let pts = 0;
  for (const st of Object.values(game.territoryStates)) {
    if (st.owner !== slotIdx) continue;
    for (const k of UNIT_KEYS) pts += (st.units[k] || 0) * UNITS[k].points;
  }
  return pts;
}

function armyCap(game, slotIdx) {
  const prod = factionProduction(game, slotIdx);
  return Math.max(ARMY_CAP_FLOOR, prod.manpower * ARMY_CAP_PER_MANPOWER) + (slotMods(game.factionSlots[slotIdx]).armyCap || 0);
}

function effectiveCosts(game, slotIdx) {
  const slot = game.factionSlots[slotIdx];
  const ownsIronFoundry = Object.entries(game.territoryStates).some(([tid, st]) => {
    const tile = game.tiles.find((t) => t.id === tid);
    return st.owner === slotIdx && tile?.resourceBonus === 'iron_foundry';
  });
  const mods = slotMods(slot);
  const costs = {};
  for (const k of UNIT_KEYS) {
    const c = { ...UNITS[k].cost };
    const cm = (mods.unitCost || {})[k] || {};
    for (const rk of Object.keys(cm)) c[rk] = Math.max((c[rk] || 0) + cm[rk], 0);
    const disc = traitBonus(slot.traits, k, 'unit_discount');
    if (disc > 0 && c.steel) c.steel = Math.max(c.steel - disc, 0);
    if (k === 'crawler' && ownsIronFoundry && c.steel) c.steel = Math.max(c.steel - 1, 1);
    costs[k] = c;
  }
  return costs;
}

// Complete pending constructions, then collect typed income
function collectIncome(game, slotIdx) {
  const slot = game.factionSlots[slotIdx];
  // Constructions complete at the start of the owner's turn
  for (const st of Object.values(game.territoryStates)) {
    if (st.owner !== slotIdx) continue;
    for (const b of st.buildings || []) {
      if (b.pending) { b.level = (b.level || 0) + 1; b.pending = false; }
    }
  }
  // Capital lost => no income
  if (slot.capitalTileId && game.territoryStates[slot.capitalTileId]?.owner !== slotIdx) return;
  const prod = factionProduction(game, slotIdx);
  prod.manpower += traitBonus(slot.traits, null, 'income_flat');
  const incomeMods = slotMods(slot).income || {};
  for (const k of RESOURCE_KEYS) prod[k] = Math.max(prod[k] + (incomeMods[k] || 0), 0);
  const treasury = getTreasury(game, slotIdx);
  for (const k of RESOURCE_KEYS) treasury[k] = (treasury[k] || 0) + prod[k];
}

function ownedTiles(game, slotIdx) {
  return Object.entries(game.territoryStates).filter(([, st]) => st.owner === slotIdx).map(([tid]) => tid);
}

function landControlPct(game, slotIdx) {
  const land = game.tiles.filter((t) => !t.isSea);
  if (land.length === 0) return 0;
  const mine = land.filter((t) => game.territoryStates[t.id]?.owner === slotIdx).length;
  return (mine / land.length) * 100;
}

function checkEliminations(game) {
  for (const slot of game.factionSlots) {
    if (!slot.eliminated && ownedTiles(game, slot.slotIndex).length === 0) {
      slot.eliminated = true;
      game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${slot.factionName} has been eliminated.` });
    }
  }
}

function checkWin(game) {
  const alive = game.factionSlots.filter((s) => !s.eliminated);
  if (alive.length === 1) {
    game.status = 'complete';
    game.winnerSlot = alive[0].slotIndex;
    return;
  }
  const capitalTiles = game.tiles.filter((t) => t.isCapital).map((t) => t.id);
  if (capitalTiles.length > 0) {
    const owners = new Set(capitalTiles.map((tid) => game.territoryStates[tid]?.owner));
    if (owners.size === 1) {
      const winner = [...owners][0];
      if (typeof winner === 'number') {
        game.status = 'complete';
        game.winnerSlot = winner;
      }
    }
  }
}

// Map-control victory: hold >= 60% of land zones at the start of your turn
function checkMapControl(game, slotIdx) {
  if (game.status !== 'active') return;
  if (landControlPct(game, slotIdx) >= MAP_CONTROL_PCT) {
    game.status = 'complete';
    game.winnerSlot = slotIdx;
    game.combatLog.push({
      turn: game.turnNumber, type: 'event',
      text: `${game.factionSlots[slotIdx].factionName} controls the continent — victory by map control.`,
    });
  }
}

function checkCampaignWin(game) {
  if (game.mode !== 'campaign' || game.status !== 'active') return;
  const humanSlot = game.factionSlots.find((s) => !s.isNPC);
  if (!humanSlot || humanSlot.eliminated) return;
  const cond = game.campaignWinCondition || {};
  if (cond.type === 'survive' && game.turnNumber > (cond.value || 10)) {
    game.status = 'complete';
    game.winnerSlot = humanSlot.slotIndex;
  } else if (cond.type === 'territory') {
    if (landControlPct(game, humanSlot.slotIndex) >= (cond.value || 60)) {
      game.status = 'complete';
      game.winnerSlot = humanSlot.slotIndex;
    }
  }
}

// ---------- Combat ----------
function rollHits(units, statKey, traits, flatBonus = 0, unitStatMods = {}) {
  const kind = statKey === 'attack' ? 'attack_bonus' : 'defense_bonus';
  let hits = 0;
  for (const k of UNIT_KEYS) {
    const perkMod = (unitStatMods[k] || {})[statKey] || 0;
    const stat = Math.max(Math.min(UNITS[k][statKey] + traitBonus(traits, k, kind) + perkMod + flatBonus, 5), 1);
    for (let i = 0; i < (units[k] || 0); i++) if (roll() <= stat) hits++;
  }
  return hits;
}

function removeCasualties(units, n) {
  let left = n;
  for (const k of CASUALTY_ORDER) {
    while (left > 0 && (units[k] || 0) > 0) { units[k]--; left--; }
  }
}

function resolveCombat(attUnits, defUnits, attTraits, defTraits, defFortBonus = 0, attStatMods = {}, defStatMods = {}) {
  const att = { ...attUnits };
  const def = { ...defUnits };
  let rounds = 0;
  let attLosses = 0, defLosses = 0;
  while (totalUnits(att) > 0 && totalUnits(def) > 0 && rounds < 25) {
    rounds++;
    const aHits = rollHits(att, 'attack', attTraits, 0, attStatMods);
    const dHits = rollHits(def, 'defense', defTraits, defFortBonus, defStatMods);
    const aRemove = Math.min(dHits, totalUnits(att));
    const dRemove = Math.min(aHits, totalUnits(def));
    removeCasualties(att, aRemove);
    removeCasualties(def, dRemove);
    attLosses += aRemove;
    defLosses += dRemove;
  }
  return { att, def, rounds, attLosses, defLosses, defenderWiped: totalUnits(def) === 0, attackerWiped: totalUnits(att) === 0 };
}

function validAttackUnits(units, targetTile) {
  for (const k of UNIT_KEYS) {
    if ((units[k] || 0) <= 0) continue;
    if (targetTile.isSea && k !== 'gunboat' && k !== 'fighter') return false;
    if (!targetTile.isSea && k === 'gunboat') return false;
  }
  return true;
}

function doAttack(game, slotIdx, fromTileId, toTileId, committed) {
  const fromSt = game.territoryStates[fromTileId];
  const toSt = game.territoryStates[toTileId];
  const fromTile = game.tiles.find((t) => t.id === fromTileId);
  const toTile = game.tiles.find((t) => t.id === toTileId);
  if (!fromTile || !toTile) throw new Error('Invalid tiles');
  if (fromSt.owner !== slotIdx) throw new Error('You do not control the attacking territory');
  if (toSt.owner === slotIdx) throw new Error('Cannot attack your own territory');
  if (!fromTile.adjacentIds.includes(toTileId)) throw new Error('Territories are not adjacent');
  if (!validAttackUnits(committed, toTile)) throw new Error('Those units cannot attack that terrain');
  for (const k of UNIT_KEYS) {
    if ((committed[k] || 0) > (fromSt.units[k] || 0)) throw new Error('Not enough units');
  }
  if (totalUnits(committed) === 0) throw new Error('No units committed');

  for (const k of UNIT_KEYS) fromSt.units[k] = (fromSt.units[k] || 0) - (committed[k] || 0);

  const attSlot = game.factionSlots[slotIdx];
  const defSlot = toSt.owner !== null && toSt.owner !== undefined ? game.factionSlots[toSt.owner] : null;
  const attM = slotMods(attSlot);
  const defM = defSlot ? slotMods(defSlot) : {};
  const capBonus = defSlot && defSlot.capitalTileId === toTileId ? (defM.capitalDefense || 0) : 0;
  const result = resolveCombat(committed, toSt.units, attSlot.traits || [], defSlot?.traits || [], fortLevel(toSt) + capBonus, attM.unitStat || {}, defM.unitStat || {});

  let outcome;
  if (result.defenderWiped && totalUnits(result.att) > 0) {
    toSt.owner = slotIdx;
    toSt.units = result.att;
    outcome = 'captured';
    // Detailed capture record — what was seized and from whom
    game.combatLog.push({
      turn: game.turnNumber,
      type: 'capture',
      faction: attSlot.factionName,
      tileName: toTile.name,
      from: defSlot ? defSlot.factionName : 'Neutral garrison',
      resource: toTile.isSea ? null : (TERRAIN_RESOURCE[toTile.terrain] || 'manpower'),
      amount: toTile.isSea ? 0 : (toTile.baseIncome || 1),
      bonus: toTile.resourceBonus || null,
      buildings: (toSt.buildings || []).filter((b) => (b.level || 0) > 0).map((b) => b.type),
      isCapital: !!toTile.isCapital,
    });
  } else if (result.attackerWiped) {
    toSt.units = result.def;
    outcome = 'repelled';
  } else {
    toSt.units = result.def;
    for (const k of UNIT_KEYS) fromSt.units[k] = (fromSt.units[k] || 0) + (result.att[k] || 0);
    outcome = 'retreated';
  }

  game.combatLog.push({
    turn: game.turnNumber,
    type: 'combat',
    attacker: attSlot.factionName,
    defender: defSlot ? defSlot.factionName : 'Neutral garrison',
    tileName: toTile.name,
    rounds: result.rounds,
    attLosses: result.attLosses,
    defLosses: result.defLosses,
    outcome,
  });

  checkEliminations(game);
  checkWin(game);
  checkCampaignWin(game);
  return outcome;
}

// ---------- Build ----------
function doBuild(game, slotIdx, tileId, buildingType) {
  const st = game.territoryStates[tileId];
  const tile = game.tiles.find((t) => t.id === tileId);
  const def = BUILDINGS[buildingType];
  if (!tile || !st) throw new Error('Invalid tile');
  if (!def) throw new Error('Unknown building');
  if (tile.isSea) throw new Error('Cannot build at sea');
  if (st.owner !== slotIdx) throw new Error('You do not control that territory');
  if (!st.buildings) st.buildings = [];
  const treasury = getTreasury(game, slotIdx);
  const existing = st.buildings.find((b) => b.type === buildingType);
  if (existing) {
    // Upgrade
    if (existing.pending) throw new Error('Construction already underway');
    if (!def.upgradeCost) throw new Error('This structure cannot be upgraded');
    if (existing.level >= 2) throw new Error('Already at maximum level');
    if (!canAfford(treasury, def.upgradeCost)) throw new Error('Insufficient resources');
    pay(treasury, def.upgradeCost);
    existing.pending = true;
  } else {
    const slotLimit = tile.isCapital ? 2 : 1;
    if (st.buildings.length >= slotLimit) throw new Error('No free build slot in this zone');
    if (!canAfford(treasury, def.cost)) throw new Error('Insufficient resources');
    pay(treasury, def.cost);
    st.buildings.push({ type: buildingType, level: 0, pending: true });
  }
}

// ---------- Deploy validation ----------
function deployError(game, slotIdx, tile, st, unitKey) {
  const unit = UNITS[unitKey];
  if (unit.domain === 'sea') {
    if (!tile.isSea) return 'Gunboats must be placed on a sea zone';
    const hasFoundryCoast = tile.adjacentIds.some((aid) => {
      const ast = game.territoryStates[aid];
      return ast?.owner === slotIdx && hasBuilding(ast, 'foundry');
    });
    if (!hasFoundryCoast) return 'Gunboats need an adjacent coastal Foundry you control';
    return null;
  }
  if (tile.isSea) return 'Land units cannot be placed at sea';
  if (st.owner !== slotIdx) return 'You must deploy on your own territory';
  if (!hasBuilding(st, unit.deployAt)) return `Requires a completed ${unit.deployAt} in this zone`;
  return null;
}

// ---------- NPC AI ----------
function npcTakeTurn(game, slotIdx) {
  const slot = game.factionSlots[slotIdx];
  const doctrine = slot.doctrine || 'aggressive';
  const costs = effectiveCosts(game, slotIdx);
  const treasury = getTreasury(game, slotIdx);
  const tileById = (id) => game.tiles.find((t) => t.id === id);

  const myTiles = ownedTiles(game, slotIdx);
  const frontline = myTiles.filter((tid) => {
    const t = tileById(tid);
    return t && !t.isSea && t.adjacentIds.some((aid) => {
      const at = tileById(aid);
      return at && !at.isSea && game.territoryStates[aid].owner !== slotIdx;
    });
  });

  // --- Build (one construction per turn, doctrine priority) ---
  const buildPrio = {
    aggressive: ['foundry', 'barracks', 'airstrip'],
    economic: ['refinery', 'foundry', 'barracks'],
    defensive: ['fortifications', 'barracks', 'foundry'],
  }[doctrine];
  const buildSites = [slot.capitalTileId, ...frontline, ...myTiles].filter(Boolean);
  outer:
  for (const type of buildPrio) {
    for (const tid of buildSites) {
      const t = tileById(tid);
      const st = game.territoryStates[tid];
      if (!t || t.isSea || st.owner !== slotIdx) continue;
      if ((st.buildings || []).some((b) => b.type === type)) continue;
      if ((st.buildings || []).length >= (t.isCapital ? 2 : 1)) continue;
      if (!canAfford(treasury, BUILDINGS[type].cost)) continue;
      try { doBuild(game, slotIdx, tid, type); break outer; } catch { /* try next */ }
    }
  }

  // --- Purchase (respect deploy buildings + points cap) ---
  const cap = armyCap(game, slotIdx);
  let pts = armyPoints(game, slotIdx);
  const eligibleTiles = (type) => {
    const list = myTiles.filter((tid) => {
      const t = tileById(tid);
      return t && !t.isSea && hasBuilding(game.territoryStates[tid], type);
    });
    return list.sort((a, b) => (frontline.includes(b) ? 1 : 0) - (frontline.includes(a) ? 1 : 0));
  };
  let guard = 0;
  while (guard++ < 30) {
    const foundrySites = eligibleTiles('foundry');
    const barracksSites = eligibleTiles('barracks');
    if (doctrine !== 'defensive' && foundrySites.length > 0 && canAfford(treasury, costs.crawler) && pts + UNITS.crawler.points <= cap) {
      pay(treasury, costs.crawler);
      const st = game.territoryStates[foundrySites[0]];
      st.units.crawler = (st.units.crawler || 0) + 1;
      pts += UNITS.crawler.points;
    } else if (barracksSites.length > 0 && canAfford(treasury, costs.riflemen) && pts + UNITS.riflemen.points <= cap) {
      pay(treasury, costs.riflemen);
      const placeTid = doctrine === 'defensive' && game.territoryStates[slot.capitalTileId]?.owner === slotIdx && hasBuilding(game.territoryStates[slot.capitalTileId], 'barracks')
        ? slot.capitalTileId : barracksSites[0];
      const st = game.territoryStates[placeTid];
      st.units.riflemen = (st.units.riflemen || 0) + 1;
      pts += UNITS.riflemen.points;
    } else break;
  }

  // --- Attacks ---
  const thresholds = { aggressive: 0.9, economic: 1.5, defensive: 2.0 };
  const threshold = thresholds[doctrine];
  let attacks = 0;
  for (let pass = 0; pass < 5 && attacks < 3 && game.status === 'active'; pass++) {
    const candidates = [];
    for (const tid of ownedTiles(game, slotIdx)) {
      const t = tileById(tid);
      if (!t || t.isSea) continue;
      const myUnits = game.territoryStates[tid].units;
      const myStrength = UNIT_KEYS.reduce((s, k) => s + (myUnits[k] || 0) * UNITS[k].attack, 0);
      if (myStrength <= 1) continue;
      for (const aid of t.adjacentIds) {
        const at = tileById(aid);
        const ast = game.territoryStates[aid];
        if (!at || at.isSea || ast.owner === slotIdx) continue;
        const defStrength = Math.max(UNIT_KEYS.reduce((s, k) => s + (ast.units[k] || 0) * (UNITS[k].defense + fortLevel(ast)), 0), 1);
        const ratio = myStrength / defStrength;
        if (ratio < threshold) continue;
        let dispWeight = 0;
        if (ast.owner !== null && ast.owner !== undefined) {
          const disp = (slot.dispositions || {})[String(ast.owner)] || 0;
          dispWeight = -disp / 40;
        }
        const buildingValue = (ast.buildings || []).length * 1.5;
        const value = (at.baseIncome || 0) * 0.3 + (at.isCapital ? 3 : 0) + (at.resourceBonus ? 1 : 0) + buildingValue;
        candidates.push({ from: tid, to: aid, score: ratio + dispWeight + value });
      }
    }
    if (candidates.length === 0) break;
    candidates.sort((a, b) => b.score - a.score);
    const pick = candidates[0];
    const srcUnits = game.territoryStates[pick.from].units;
    const committed = {};
    for (const k of ['riflemen', 'crawler', 'fighter']) {
      committed[k] = k === 'riflemen' ? Math.max((srcUnits[k] || 0) - 1, 0) : (srcUnits[k] || 0);
    }
    if (totalUnits(committed) === 0) break;
    try {
      doAttack(game, slotIdx, pick.from, pick.to, committed);
      attacks++;
    } catch {
      break;
    }
  }
}

// ---------- Turn stat snapshots ----------
function recordSnapshot(game) {
  if (!game.statHistory) game.statHistory = [];
  const snap = { turn: game.turnNumber, control: {}, production: {} };
  for (const slot of game.factionSlots) {
    const key = String(slot.slotIndex);
    if (slot.eliminated) {
      snap.control[key] = 0;
      snap.production[key] = { manpower: 0, steel: 0, fuel: 0 };
    } else {
      snap.control[key] = Math.round(landControlPct(game, slot.slotIndex));
      snap.production[key] = factionProduction(game, slot.slotIndex);
    }
  }
  const i = game.statHistory.findIndex((s) => s.turn === snap.turn);
  if (i >= 0) game.statHistory[i] = snap; else game.statHistory.push(snap);
  if (game.statHistory.length > 200) game.statHistory.shift();
}

function advanceTurn(game) {
  let guard = 0;
  while (guard++ < 20 && game.status === 'active') {
    game.currentTurnIndex = (game.currentTurnIndex + 1) % game.turnOrder.length;
    if (game.currentTurnIndex === 0) {
      game.turnNumber++;
      recordSnapshot(game);
    }
    const slotIdx = game.turnOrder[game.currentTurnIndex];
    const slot = game.factionSlots[slotIdx];
    if (slot.eliminated) continue;
    checkMapControl(game, slotIdx);
    if (game.status !== 'active') return;
    collectIncome(game, slotIdx);
    if (slot.isNPC) {
      npcTakeTurn(game, slotIdx);
      checkCampaignWin(game);
      continue;
    }
    return; // human's turn
  }
}

// ---------- Fog of war ----------
function visibleStateFor(game, slotIdx) {
  const revealAll = game.status !== 'active' || slotIdx === null;
  const visible = new Set();
  if (!revealAll) {
    for (const [tid, st] of Object.entries(game.territoryStates)) {
      if (st.owner === slotIdx) {
        visible.add(tid);
        const tile = game.tiles.find((t) => t.id === tid);
        for (const aid of tile?.adjacentIds || []) visible.add(aid);
      }
    }
  }
  return game.tiles.map((tile) => {
    if (revealAll || visible.has(tile.id)) {
      return { ...tile, visible: true, state: game.territoryStates[tile.id] || { owner: null, units: {} } };
    }
    return { id: tile.id, q: tile.q, r: tile.r, isSea: tile.isSea, visible: false };
  });
}

// ---------- HTTP handler ----------
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const svc = base44.asServiceRole;
    const body = await req.json();
    const { action } = body;

    // ----- listMyGames -----
    if (action === 'listMyGames') {
      const games = await svc.entities.Game.list('-updated_date', 100);
      const mine = games.filter((g) => (g.factionSlots || []).some((s) => s.userId === user.id) || g.hostUserId === user.id);
      return Response.json({
        games: mine.map((g) => ({
          id: g.id, name: g.name, mode: g.mode, status: g.status, turnNumber: g.turnNumber,
          playerCount: (g.factionSlots || []).length,
          isMyTurn: g.status === 'active' && g.factionSlots?.[g.turnOrder?.[g.currentTurnIndex]]?.userId === user.id,
          winnerName: g.status === 'complete' && g.winnerSlot !== undefined && g.winnerSlot !== null ? g.factionSlots?.[g.winnerSlot]?.factionName : null,
        })),
      });
    }

    // ----- createGame -----
    if (action === 'createGame') {
      const { name, mode = 'multiplayer', mapId, mapData, factionId, humanCount = 2, npcConfigs = [], campaignWinCondition } = body;
      let tiles;
      if (mapId) {
        const m = await svc.entities.GameMap.get(mapId);
        tiles = m.tiles;
      } else if (mapData?.tiles) {
        tiles = mapData.tiles;
      } else {
        return Response.json({ error: 'A map is required' }, { status: 400 });
      }
      const faction = await svc.entities.Faction.get(factionId);
      if (!faction) return Response.json({ error: 'Faction not found' }, { status: 404 });

      const humans = Math.min(Math.max(humanCount, 1), 4);
      const npcs = npcConfigs.slice(0, 4 - humans);
      const total = humans + npcs.length;
      if (total < 2) return Response.json({ error: 'At least 2 factions required' }, { status: 400 });
      if (mode === 'campaign' && humans !== 1) return Response.json({ error: 'Campaign mode is solo' }, { status: 400 });

      const slots = [];
      slots.push({
        slotIndex: 0, userId: user.id, factionId, factionName: faction.factionName,
        isNPC: false, doctrine: faction.doctrine, traits: faction.traits || [],
        pointBuy: faction.pointBuy?.picks || [],
        npcDispositions: faction.npcDispositions || {}, color: COLORS[0], eliminated: false,
      });
      for (let i = 1; i < humans; i++) {
        slots.push({ slotIndex: i, userId: null, factionId: null, factionName: null, isNPC: false, traits: [], pointBuy: [], color: COLORS[i], eliminated: false });
      }
      npcs.forEach((cfg, j) => {
        const idx = humans + j;
        const names = NPC_NAMES[cfg.doctrine] || NPC_NAMES.aggressive;
        slots.push({
          slotIndex: idx, userId: null, isNPC: true, doctrine: cfg.doctrine || 'aggressive',
          factionName: names[Math.floor(Math.random() * names.length)],
          traits: [], pointBuy: [], dispositions: {}, color: COLORS[idx], eliminated: false,
        });
      });

      const game = await svc.entities.Game.create({
        name: name || 'Unnamed Front', mode, status: 'lobby', mapId: mapId || null, tiles,
        factionSlots: slots, turnOrder: slots.map((s) => s.slotIndex), currentTurnIndex: 0,
        turnNumber: 1, territoryStates: {}, treasuries: {}, combatLog: [],
        campaignWinCondition: campaignWinCondition || {}, hostUserId: user.id,
      });
      return Response.json({ gameId: game.id });
    }

    // All remaining actions operate on an existing game
    const game = await svc.entities.Game.get(body.gameId);
    if (!game) return Response.json({ error: 'Game not found' }, { status: 404 });
    const mySlotObj = (game.factionSlots || []).find((s) => s.userId === user.id);
    const mySlot = mySlotObj ? mySlotObj.slotIndex : null;

    // ----- getState -----
    if (action === 'getState') {
      const currentSlotIdx = game.turnOrder?.[game.currentTurnIndex];
      const active = game.status === 'active';
      return Response.json({
        id: game.id, name: game.name, mode: game.mode, status: game.status,
        turnNumber: game.turnNumber, currentSlot: currentSlotIdx,
        isMyTurn: active && game.factionSlots?.[currentSlotIdx]?.userId === user.id,
        mySlot,
        myResources: mySlot !== null ? getTreasury(game, mySlot) : null,
        myProduction: mySlot !== null && active ? factionProduction(game, mySlot) : null,
        myArmyPoints: mySlot !== null && active ? armyPoints(game, mySlot) : 0,
        myArmyCap: mySlot !== null && active ? armyCap(game, mySlot) : 0,
        myLandControl: mySlot !== null && active ? Math.round(landControlPct(game, mySlot)) : 0,
        mapControlTarget: MAP_CONTROL_PCT,
        myCosts: mySlot !== null && active ? effectiveCosts(game, mySlot) : null,
        isHost: game.hostUserId === user.id,
        campaignWinCondition: game.campaignWinCondition,
        factions: (game.factionSlots || []).map((s) => ({
          slotIndex: s.slotIndex, factionName: s.factionName, isNPC: s.isNPC,
          doctrine: s.doctrine, color: s.color, eliminated: s.eliminated,
          isOpen: !s.isNPC && !s.userId, isMe: s.userId === user.id, traits: s.userId === user.id ? s.traits : undefined,
        })),
        tiles: visibleStateFor(game, mySlot),
        combatLog: game.status === 'complete' ? (game.combatLog || []) : (game.combatLog || []).slice(-30),
        statHistory: game.statHistory || [],
        winnerSlot: game.winnerSlot,
        winnerName: game.winnerSlot !== undefined && game.winnerSlot !== null ? game.factionSlots?.[game.winnerSlot]?.factionName : null,
      });
    }

    // ----- joinGame -----
    if (action === 'joinGame') {
      if (game.status !== 'lobby') return Response.json({ error: 'Game already started' }, { status: 400 });
      if (mySlot !== null) return Response.json({ error: 'Already joined' }, { status: 400 });
      const open = game.factionSlots.find((s) => !s.isNPC && !s.userId);
      if (!open) return Response.json({ error: 'No open slots' }, { status: 400 });
      const faction = await svc.entities.Faction.get(body.factionId);
      if (!faction) return Response.json({ error: 'Faction not found' }, { status: 404 });
      open.userId = user.id;
      open.factionId = faction.id;
      open.factionName = faction.factionName;
      open.doctrine = faction.doctrine;
      open.traits = faction.traits || [];
      open.pointBuy = faction.pointBuy?.picks || [];
      open.npcDispositions = faction.npcDispositions || {};
      await svc.entities.Game.update(game.id, { factionSlots: game.factionSlots });
      return Response.json({ ok: true, slotIndex: open.slotIndex });
    }

    // ----- startGame -----
    if (action === 'startGame') {
      if (game.hostUserId !== user.id) return Response.json({ error: 'Only the host can start' }, { status: 403 });
      if (game.status !== 'lobby') return Response.json({ error: 'Game already started' }, { status: 400 });
      if (game.factionSlots.some((s) => !s.isNPC && !s.userId)) return Response.json({ error: 'Waiting for players to join' }, { status: 400 });

      const tiles = game.tiles;
      const land = tiles.filter((t) => !t.isSea);
      let capitals = land.filter((t) => t.isCapital);
      if (capitals.length < game.factionSlots.length) {
        const sorted = [...land].sort((a, b) => (b.baseIncome || 0) - (a.baseIncome || 0));
        for (const t of sorted) {
          if (capitals.length >= game.factionSlots.length) break;
          if (!capitals.includes(t)) { t.isCapital = true; capitals.push(t); }
        }
      }

      const states = {};
      for (const t of tiles) {
        states[t.id] = t.isSea ? { owner: null, units: {}, buildings: [] } : { owner: null, units: { riflemen: 1 }, buildings: [] };
      }
      game.factionSlots.forEach((slot, i) => {
        slot.mods = compileMods(slot.pointBuy);
        const cap = capitals[i];
        slot.capitalTileId = cap.id;
        // Capitals start with an operational Barracks
        states[cap.id] = { owner: slot.slotIndex, units: { riflemen: 4, crawler: 2 }, buildings: [{ type: 'barracks', level: 1, pending: false }] };
        for (const aid of cap.adjacentIds) {
          const at = tiles.find((t) => t.id === aid);
          if (at && !at.isSea && !at.isCapital && states[aid].owner === null) {
            states[aid] = { owner: slot.slotIndex, units: { riflemen: 2 }, buildings: [] };
          }
        }
        const startBonus = slot.mods.startBonus || 0;
        game.treasuries[String(slot.slotIndex)] = Object.fromEntries(RESOURCE_KEYS.map((k) => [k, Math.max(START_RESOURCES[k] + startBonus, 0)]));
      });

      for (const npc of game.factionSlots.filter((s) => s.isNPC)) {
        npc.dispositions = {};
        for (const h of game.factionSlots.filter((s) => !s.isNPC)) {
          npc.dispositions[String(h.slotIndex)] = ((h.npcDispositions || {})[npc.doctrine] || 0) + (slotMods(h).disposition || 0);
        }
      }

      game.status = 'active';
      game.territoryStates = states;
      game.combatLog.push({ turn: 1, type: 'event', text: 'War has been declared. The front ignites.' });
      collectIncome(game, game.turnOrder[0]);
      recordSnapshot(game);

      await svc.entities.Game.update(game.id, {
        status: 'active', tiles: game.tiles, factionSlots: game.factionSlots,
        territoryStates: game.territoryStates, treasuries: game.treasuries, combatLog: game.combatLog,
        statHistory: game.statHistory,
      });
      return Response.json({ ok: true });
    }

    // ----- In-turn actions -----
    const requireMyTurn = () => {
      if (game.status !== 'active') throw new Error('Game is not active');
      const cur = game.turnOrder[game.currentTurnIndex];
      if (game.factionSlots[cur]?.userId !== user.id) throw new Error('Not your turn');
      return cur;
    };

    if (action === 'moveUnits') {
      const slotIdx = requireMyTurn();
      const { fromTileId, toTileId, units } = body;
      const fromSt = game.territoryStates[fromTileId];
      const toSt = game.territoryStates[toTileId];
      const fromTile = game.tiles.find((t) => t.id === fromTileId);
      const toTile = game.tiles.find((t) => t.id === toTileId);
      if (!fromTile || !toTile) return Response.json({ error: 'Invalid tiles' }, { status: 400 });
      if (fromSt.owner !== slotIdx) return Response.json({ error: 'You do not control that territory' }, { status: 400 });
      if (toSt.owner !== slotIdx) return Response.json({ error: 'Destination must be friendly — use Attack for enemy territory' }, { status: 400 });
      if (!fromTile.adjacentIds.includes(toTileId)) return Response.json({ error: 'Territories are not adjacent' }, { status: 400 });
      for (const k of UNIT_KEYS) {
        const n = units[k] || 0;
        if (n <= 0) continue;
        if (n > (fromSt.units[k] || 0)) return Response.json({ error: 'Not enough units' }, { status: 400 });
        const domain = UNITS[k].domain;
        if (domain === 'land' && toTile.isSea) return Response.json({ error: 'Land units cannot enter sea zones' }, { status: 400 });
        if (domain === 'sea' && !toTile.isSea) return Response.json({ error: 'Gunboats cannot move onto land' }, { status: 400 });
      }
      for (const k of UNIT_KEYS) {
        const n = units[k] || 0;
        fromSt.units[k] = (fromSt.units[k] || 0) - n;
        toSt.units[k] = (toSt.units[k] || 0) + n;
      }
      await svc.entities.Game.update(game.id, { territoryStates: game.territoryStates });
      return Response.json({ ok: true });
    }

    if (action === 'build') {
      const slotIdx = requireMyTurn();
      try {
        doBuild(game, slotIdx, body.tileId, body.buildingType);
      } catch (e) {
        return Response.json({ error: e.message }, { status: 400 });
      }
      await svc.entities.Game.update(game.id, { territoryStates: game.territoryStates, treasuries: game.treasuries });
      return Response.json({ ok: true, resources: getTreasury(game, slotIdx) });
    }

    if (action === 'purchaseUnits') {
      const slotIdx = requireMyTurn();
      const { tileId, units } = body;
      const st = game.territoryStates[tileId];
      const tile = game.tiles.find((t) => t.id === tileId);
      if (!tile || !st) return Response.json({ error: 'Invalid tile' }, { status: 400 });
      if (!tile.isSea && st.owner !== slotIdx) return Response.json({ error: 'You must place units on your own territory' }, { status: 400 });
      const costs = effectiveCosts(game, slotIdx);
      const totalCost = emptyResources();
      let purchasePoints = 0;
      for (const k of UNIT_KEYS) {
        const n = units[k] || 0;
        if (n < 0) return Response.json({ error: 'Invalid quantity' }, { status: 400 });
        if (n === 0) continue;
        const err = deployError(game, slotIdx, tile, st, k);
        if (err) return Response.json({ error: err }, { status: 400 });
        for (const rk of RESOURCE_KEYS) totalCost[rk] += n * (costs[k][rk] || 0);
        purchasePoints += n * UNITS[k].points;
      }
      if (purchasePoints === 0) return Response.json({ error: 'Nothing to purchase' }, { status: 400 });
      const treasury = getTreasury(game, slotIdx);
      if (!canAfford(treasury, totalCost)) return Response.json({ error: 'Insufficient resources' }, { status: 400 });
      const cap = armyCap(game, slotIdx);
      if (armyPoints(game, slotIdx) + purchasePoints > cap) {
        return Response.json({ error: `Army cap exceeded — ${cap} points max (raise Manpower income to field more)` }, { status: 400 });
      }
      pay(treasury, totalCost);
      for (const k of UNIT_KEYS) st.units[k] = (st.units[k] || 0) + (units[k] || 0);
      if (tile.isSea && (st.owner === null || st.owner === undefined)) st.owner = slotIdx;
      await svc.entities.Game.update(game.id, { territoryStates: game.territoryStates, treasuries: game.treasuries });
      return Response.json({ ok: true, resources: treasury });
    }

    if (action === 'attack') {
      const slotIdx = requireMyTurn();
      const { fromTileId, toTileId, units } = body;
      let outcome;
      try {
        outcome = doAttack(game, slotIdx, fromTileId, toTileId, units);
      } catch (e) {
        return Response.json({ error: e.message }, { status: 400 });
      }
      if (game.status !== 'active') recordSnapshot(game);
      await svc.entities.Game.update(game.id, {
        territoryStates: game.territoryStates, factionSlots: game.factionSlots,
        combatLog: game.combatLog, status: game.status, winnerSlot: game.winnerSlot,
        statHistory: game.statHistory,
      });
      return Response.json({ ok: true, outcome });
    }

    if (action === 'endTurn') {
      requireMyTurn();
      checkCampaignWin(game);
      if (game.status === 'active') advanceTurn(game);
      if (game.status !== 'active') recordSnapshot(game);
      await svc.entities.Game.update(game.id, {
        territoryStates: game.territoryStates, factionSlots: game.factionSlots,
        treasuries: game.treasuries, combatLog: game.combatLog,
        currentTurnIndex: game.currentTurnIndex, turnNumber: game.turnNumber,
        status: game.status, winnerSlot: game.winnerSlot, statHistory: game.statHistory,
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});