import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// ---------- Rules definitions ----------
const RESOURCE_KEYS = ['manpower', 'steel', 'fuel'];
const TERRAIN_RESOURCE = {
  plains: 'manpower', deltas: 'manpower', forest: 'manpower',
  hills: 'steel', highlands: 'steel', mountains: 'steel',
  marsh: 'fuel',
};

// ---------- Weather ----------
const WEATHER_TYPES = {
  clear: { label: 'Clear Skies', weight: 35 },
  rain: { label: 'Driving Rain', weight: 22 },
  fog: { label: 'Heavy Fog', weight: 18 },
  storm: { label: 'Thunderstorm', weight: 12 },
  snow: { label: 'Falling Snow', weight: 13 },
};
const ROUGH_TERRAIN = ['mountains', 'highlands', 'marsh'];

// Elevation tiers — attacking uphill is punished, striking downhill rewarded
const TERRAIN_ELEVATION = { mountains: 3, highlands: 2, hills: 1 };
const elevOf = (tile) => (tile && !tile.isSea ? TERRAIN_ELEVATION[tile.terrain] || 0 : 0);
// Attacker modifier for the slope of the assault
const slopeMod = (fromTile, toTile) => {
  const d = elevOf(toTile) - elevOf(fromTile);
  return d > 0 ? -1 : d < 0 ? 1 : 0;
};
function rollWeather() {
  const total = Object.values(WEATHER_TYPES).reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const [k, w] of Object.entries(WEATHER_TYPES)) { r -= w.weight; if (r <= 0) return k; }
  return 'clear';
}

const UNITS = {
  riflemen: { points: 5, cost: { manpower: 2, steel: 1 }, attack: 1, defense: 2, domain: 'land', deployAt: 'barracks' },
  crawler: { points: 12, cost: { steel: 3, fuel: 2 }, attack: 3, defense: 2, domain: 'land', deployAt: 'foundry' },
  gunboat: { points: 10, cost: { steel: 3, fuel: 1 }, attack: 2, defense: 2, domain: 'sea', deployAt: 'foundry' },
  fighter: { points: 15, cost: { steel: 2, fuel: 3 }, attack: 3, defense: 1, domain: 'air', deployAt: 'airstrip' },
  artillery: { points: 10, cost: { steel: 3, manpower: 1 }, attack: 1, defense: 1, domain: 'land', deployAt: 'foundry' },
};
const UNIT_KEYS = ['riflemen', 'crawler', 'gunboat', 'fighter', 'artillery'];
const CASUALTY_ORDER = ['riflemen', 'crawler', 'gunboat', 'artillery', 'fighter'];

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

// ---------- Research / doctrine tree (mirrors src/lib/doctrine.js) ----------
const TECHS = {
  standardized_calibers: { label: 'Standardized Calibers', cost: 3, prereq: null, mods: { unitStat: { riflemen: { attack: 1 } } } },
  hardened_plate: { label: 'Hardened Plate', cost: 4, prereq: 'standardized_calibers', mods: { unitStat: { crawler: { defense: 1 } } } },
  combined_arms: { label: 'Combined Arms Doctrine', cost: 6, prereq: 'hardened_plate', mods: { unitStat: { crawler: { attack: 1 }, fighter: { attack: 1 } } } },
  rationalized_foundries: { label: 'Rationalized Foundries', cost: 3, prereq: null, mods: { income: { steel: 1 } } },
  synthetic_fuel: { label: 'Synthetic Fuel Program', cost: 4, prereq: 'rationalized_foundries', mods: { income: { fuel: 1 } } },
  total_mobilization: { label: 'Total Mobilization', cost: 6, prereq: 'synthetic_fuel', mods: { income: { manpower: 1 }, armyCap: 20 } },
  field_kitchens: { label: 'Field Kitchens', cost: 3, prereq: null, mods: { armyCap: 10 } },
  motorized_supply: { label: 'Motorized Supply Trains', cost: 4, prereq: 'field_kitchens', mods: { supplyRange: 1 } },
  general_staff_academy: { label: 'General Staff Academy', cost: 6, prereq: 'motorized_supply', mods: { capitalDefense: 1, unitStat: { riflemen: { defense: 1 } } } },
};

function mergeMods(m, add = {}) {
  for (const [u, stats] of Object.entries(add.unitStat || {})) {
    m.unitStat[u] = m.unitStat[u] || {};
    for (const [s, v] of Object.entries(stats)) m.unitStat[u][s] = (m.unitStat[u][s] || 0) + v;
  }
  for (const k of RESOURCE_KEYS) m.income[k] += (add.income || {})[k] || 0;
  m.armyCap += add.armyCap || 0;
  m.capitalDefense += add.capitalDefense || 0;
  m.supplyRange = (m.supplyRange || 0) + (add.supplyRange || 0);
}

// One research point per completed round for each faction with a set focus
function tickResearch(game) {
  for (const slot of game.factionSlots) {
    if (slot.eliminated || slot.isNPC) continue;
    const r = slot.research;
    if (!r || !r.focus) continue;
    const tech = TECHS[r.focus];
    if (!tech || (r.completed || []).includes(r.focus)) { r.focus = null; continue; }
    r.progress = r.progress || {};
    r.progress[r.focus] = (r.progress[r.focus] || 0) + 1;
    if (r.progress[r.focus] >= tech.cost) {
      r.completed = r.completed || [];
      r.completed.push(r.focus);
      if (!slot.mods) slot.mods = compileMods(slot.pointBuy);
      mergeMods(slot.mods, tech.mods);
      game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${slot.factionName}'s doctrine advances — ${tech.label} enters service.` });
      r.focus = null;
    }
  }
}

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
  if (game.worldModel === 'macro') {
    for (const [nid, owner] of Object.entries(game.macro?.control || {})) {
      if (owner !== slotIdx) continue;
      const node = game.macro.nodes.find((n) => n.id === nid);
      const y = MACRO_SETTLEMENT_YIELD[node?.kind] || {};
      for (const k of RESOURCE_KEYS) out[k] += y[k] || 0;
    }
    return out;
  }
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
  for (const a of game.armies || []) {
    if (a.owner !== slotIdx) continue;
    for (const k of UNIT_KEYS) pts += (a.regiments[k] || 0) * UNITS[k].points;
  }
  for (const c of game.macro?.columns || []) {
    if (c.owner !== slotIdx) continue;
    for (const k of UNIT_KEYS) pts += (c.regiments[k] || 0) * UNITS[k].points;
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
  if (game.worldModel === 'macro') return macroCollectIncome(game, slotIdx);
  const slot = game.factionSlots[slotIdx];
  ensureBase(game, slot);
  // Refit convoys arrive at the start of the owner's turn
  for (const g of slot.generals || []) {
    if (g.pendingRefit && game.turnNumber >= g.pendingRefit.readyTurn) {
      g.vehicleMods = g.vehicleMods || {};
      g.vehicleMods[g.pendingRefit.bay] = g.pendingRefit.modKey;
      game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `A supply convoy reaches ${g.name}'s command vehicle — ${VEHICLE_MODS[g.pendingRefit.modKey]?.label || 'new fittings'} installed.` });
      g.pendingRefit = null;
    }
  }
  if (slot.base?.pendingRefits?.length) {
    const remaining = [];
    for (const p of slot.base.pendingRefits) {
      if (game.turnNumber >= p.readyTurn) {
        slot.base.modules = slot.base.modules || {};
        slot.base.modules[p.slot] = p.moduleKey;
        game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `A heavy convoy reaches ${slot.factionName}'s fortress-base — ${BASE_MODULES[p.moduleKey]?.label || 'new fittings'} bolted into the ${p.slot} bay.` });
      } else remaining.push(p);
    }
    slot.base.pendingRefits = remaining;
  }
  // Out-of-supply attrition — cut-off field armies wither at the start of each turn
  const supplied = computeSupply(game, slotIdx);
  for (const a of [...(game.armies || []).filter((x) => x.owner === slotIdx)]) {
    if (supplied.has(a.tileId)) continue;
    removeCasualties(a.regiments, 1);
    if (totalUnits(a.regiments) === 0) {
      game.armies = game.armies.filter((x) => x.id !== a.id);
      generalFate(game, a);
      game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `The ${a.name} disintegrates — starved of supply.` });
    } else {
      game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `The ${a.name} is cut off from supply and loses a company to attrition.` });
    }
  }
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
  // On-board industry works produce wherever the base stands on friendly ground
  const bIncome = baseModule(slot.base, 'industry')?.income;
  if (bIncome && slot.base && game.territoryStates[slot.base.tileId]?.owner === slotIdx) {
    for (const k of RESOURCE_KEYS) prod[k] += bIncome[k] || 0;
  }
  const treasury = getTreasury(game, slotIdx);
  for (const k of RESOURCE_KEYS) treasury[k] = (treasury[k] || 0) + prod[k];
}

function ownedTiles(game, slotIdx) {
  return Object.entries(game.territoryStates).filter(([, st]) => st.owner === slotIdx).map(([tid]) => tid);
}

function landControlPct(game, slotIdx) {
  if (game.worldModel === 'macro') return macroControlPct(game, slotIdx);
  const land = game.tiles.filter((t) => !t.isSea);
  if (land.length === 0) return 0;
  const mine = land.filter((t) => game.territoryStates[t.id]?.owner === slotIdx).length;
  return (mine / land.length) * 100;
}

function checkEliminations(game) {
  for (const slot of game.factionSlots) {
    if (!slot.eliminated && ownedTiles(game, slot.slotIndex).length === 0) {
      slot.eliminated = true;
      game.armies = (game.armies || []).filter((a) => a.owner !== slot.slotIndex);
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
  if (game.worldModel === 'macro') return macroCheckWin(game);
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

// ---------- Supply & logistics ----------
// Supply hubs: capitals, fortifications, barracks. Supply flows through contiguous
// friendly land; rough terrain costs more logistics range to cross.
const SUPPLY_RANGE = 4;
const SUPPLY_MOVE_COST = { mountains: 2, marsh: 2, highlands: 2 };
const supplyCost = (tile) => SUPPLY_MOVE_COST[tile.terrain] || 1;

function isSupplySource(slotIdx, tile, st) {
  if (!tile || tile.isSea || st.owner !== slotIdx) return false;
  return !!tile.isCapital || hasBuilding(st, 'fortifications') || hasBuilding(st, 'barracks');
}

// Dijkstra from every supply hub through friendly land — returns the Set of supplied tile ids
function computeSupply(game, slotIdx) {
  const range = SUPPLY_RANGE + (slotMods(game.factionSlots[slotIdx]).supplyRange || 0);
  const dist = {};
  const queue = [];
  for (const t of game.tiles) {
    const st = game.territoryStates[t.id];
    if (st && isSupplySource(slotIdx, t, st)) { dist[t.id] = 0; queue.push(t.id); }
  }
  // The fortress-base is a prime supply hub wherever it stands
  const bTile = game.factionSlots[slotIdx]?.base?.tileId;
  if (bTile && game.territoryStates[bTile]?.owner === slotIdx && dist[bTile] === undefined) { dist[bTile] = 0; queue.push(bTile); }
  while (queue.length > 0) {
    queue.sort((a, b) => dist[a] - dist[b]);
    const cur = queue.shift();
    const tile = game.tiles.find((t) => t.id === cur);
    for (const aid of tile?.adjacentIds || []) {
      const at = game.tiles.find((t) => t.id === aid);
      const ast = game.territoryStates[aid];
      if (!at || at.isSea || !ast || ast.owner !== slotIdx) continue;
      const nd = dist[cur] + supplyCost(at);
      if (nd > range) continue;
      if (dist[aid] === undefined || nd < dist[aid]) { dist[aid] = nd; queue.push(aid); }
    }
  }
  return new Set(Object.keys(dist));
}

// ---------- Diplomacy ----------
const PACT_DURATIONS = { truce: 5, nap: 10 };
const PACT_LABELS = { truce: 'ceasefire truce', nap: 'non-aggression pact' };
const RES_VALUE = { manpower: 1, steel: 1.5, fuel: 1.5 };
const relKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
function getDiplo(game) {
  if (!game.diplomacy || typeof game.diplomacy !== 'object') game.diplomacy = {};
  game.diplomacy.relations = game.diplomacy.relations || {};
  game.diplomacy.offers = game.diplomacy.offers || [];
  game.diplomacy.lastProposal = game.diplomacy.lastProposal || {};
  return game.diplomacy;
}
function relationOf(game, a, b) {
  const r = getDiplo(game).relations[relKey(a, b)];
  if (!r) return null;
  if (r.until !== null && r.until !== undefined && game.turnNumber >= r.until) return null;
  return r;
}
const atPeace = (game, a, b) => !!relationOf(game, a, b);
function shiftDisposition(game, npcSlotIdx, otherSlotIdx, delta) {
  const npc = game.factionSlots[npcSlotIdx];
  if (!npc?.isNPC) return;
  npc.dispositions = npc.dispositions || {};
  const k = String(otherSlotIdx);
  npc.dispositions[k] = Math.max(Math.min((npc.dispositions[k] || 0) + delta, 100), -100);
}
const offerValue = (r = {}) => RESOURCE_KEYS.reduce((s, k) => s + (r[k] || 0) * RES_VALUE[k], 0);

// ---------- Mobile fortress-bases (mirrors src/lib/baseModules.js) ----------
const BASE_MODULES = {
  riveted_plating: { slot: 'armor', label: 'Riveted Plating', cost: { steel: 5 }, defense: 2 },
  bulwark_hull: { slot: 'armor', label: 'Bulwark Hull', cost: { steel: 9, fuel: 2 }, defense: 4 },
  crawler_drives: { slot: 'engine', label: 'Crawler Drives', cost: { steel: 4, fuel: 3 }, moves: 1 },
  leviathan_turbines: { slot: 'engine', label: 'Leviathan Turbines', cost: { steel: 6, fuel: 6 }, moves: 1, allTerrain: true },
  salvage_refinery: { slot: 'industry', label: 'Salvage Refinery', cost: { steel: 4, fuel: 2 }, income: { fuel: 2 } },
  arc_smelters: { slot: 'industry', label: 'Arc Smelters', cost: { steel: 6, manpower: 2 }, income: { steel: 2 } },
  habitat_decks: { slot: 'industry', label: 'Habitat Decks', cost: { steel: 5 }, income: { manpower: 2 } },
  // Prototype modules — must be unlocked via off-turn armory research (concurrentPlay)
  citadel_plate: { slot: 'armor', label: 'Citadel Plate', cost: { steel: 12, fuel: 3 }, defense: 6, unlock: true },
  juggernaut_reactors: { slot: 'engine', label: 'Juggernaut Reactors', cost: { steel: 8, fuel: 8 }, moves: 1, allTerrain: true, moveCost: 1, unlock: true },
  munitions_works: { slot: 'industry', label: 'Munitions Works', cost: { steel: 8, manpower: 3 }, income: { manpower: 1, steel: 1, fuel: 1 }, unlock: true },
};
const BASE_MOVE_COST = { fuel: 2 };
// Older games predate bases — spawn one on the capital the first time it is needed
function ensureBase(game, slot) {
  if (!slot) return null;
  if (!slot.base && !slot.baseLost && slot.capitalTileId && game.territoryStates?.[slot.capitalTileId]?.owner === slot.slotIndex) {
    slot.base = { tileId: slot.capitalTileId, modules: {}, movedTurn: 0 };
  }
  return slot.base || null;
}
const baseModule = (base, slotName) => (base?.modules?.[slotName] ? BASE_MODULES[base.modules[slotName]] : null);
// The hull itself is worth +1 defense; armor modules stack on top
function baseDefenseAt(game, defSlotIdx, tileId) {
  if (defSlotIdx === null || defSlotIdx === undefined) return 0;
  const base = game.factionSlots[defSlotIdx]?.base;
  if (!base || base.tileId !== tileId) return 0;
  return 1 + (baseModule(base, 'armor')?.defense || 0);
}
function wreckBasesAt(game, tileId, newOwner) {
  for (const s of game.factionSlots) {
    if (s.base && s.base.tileId === tileId && s.slotIndex !== newOwner) {
      s.base = null;
      s.baseLost = true;
      game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${s.factionName}'s fortress-base is overrun and burns where it stands.` });
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

function resolveCombat(attUnits, defUnits, attTraits, defTraits, defFortBonus = 0, attStatMods = {}, defStatMods = {}, attFlat = 0) {
  const att = { ...attUnits };
  const def = { ...defUnits };
  let rounds = 0;
  let attLosses = 0, defLosses = 0;
  while (totalUnits(att) > 0 && totalUnits(def) > 0 && rounds < 25) {
    rounds++;
    const aHits = rollHits(att, 'attack', attTraits, attFlat, attStatMods);
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
  if (toSt.owner !== null && toSt.owner !== undefined && atPeace(game, slotIdx, toSt.owner)) throw new Error('A signed accord forbids attacking that faction');
  if (!validAttackUnits(committed, toTile)) throw new Error('Those units cannot attack that terrain');
  const weather = game.weather || 'clear';
  if (weather === 'storm' && ((committed.fighter || 0) > 0 || (committed.gunboat || 0) > 0)) throw new Error('The storm grounds all aircraft and gunboats this turn');
  if (weather === 'rain' && !toTile.isSea && ROUGH_TERRAIN.includes(toTile.terrain)) throw new Error('Driving rain has washed out the roads — that ground is impassable this turn');
  if (weather === 'snow' && (committed.crawler || 0) > 0) throw new Error('Crawler engines freeze in the snowfall — armor cannot attack this turn');
  for (const k of UNIT_KEYS) {
    if ((committed[k] || 0) > (fromSt.units[k] || 0)) throw new Error('Not enough units');
  }
  if (totalUnits(committed) === 0) throw new Error('No units committed');

  // Enemy field armies stationed on the target reinforce its defense
  for (const a of (game.armies || []).filter((a) => a.tileId === toTileId && a.owner !== slotIdx)) {
    for (const k of UNIT_KEYS) toSt.units[k] = (toSt.units[k] || 0) + (a.regiments[k] || 0);
  }
  game.armies = (game.armies || []).filter((a) => !(a.tileId === toTileId && a.owner !== slotIdx));

  for (const k of UNIT_KEYS) fromSt.units[k] = (fromSt.units[k] || 0) - (committed[k] || 0);

  const attSlot = game.factionSlots[slotIdx];
  const defSlot = toSt.owner !== null && toSt.owner !== undefined ? game.factionSlots[toSt.owner] : null;
  if (defSlot?.isNPC) shiftDisposition(game, toSt.owner, slotIdx, -8);
  const attM = slotMods(attSlot);
  const defM = defSlot ? slotMods(defSlot) : {};
  const capBonus = defSlot && defSlot.capitalTileId === toTileId ? (defM.capitalDefense || 0) : 0;
  const terrDef = toTile.isSea ? 0 : (TERRAIN_BATTLE_MODS[toTile.terrain] || 0);
  const attSlope = toTile.isSea ? 0 : slopeMod(fromTile, toTile);
  const attFlat = (weather === 'rain' || weather === 'snow' ? -1 : 0) + attSlope;
  // Snapshot the defending fortress-base before combat — it may be wrecked on capture
  const defBaseDefense = baseDefenseAt(game, toSt.owner, toTileId);
  const defBaseModules = defBaseDefense > 0 ? { ...(game.factionSlots[toSt.owner]?.base?.modules || {}) } : null;
  const result = resolveCombat(committed, toSt.units, attSlot.traits || [], defSlot?.traits || [], fortLevel(toSt) + capBonus + terrDef + defBaseDefense + (weather === 'fog' ? -1 : 0), attM.unitStat || {}, defM.unitStat || {}, attFlat);

  let outcome;
  if (result.defenderWiped && totalUnits(result.att) > 0) {
    wreckBasesAt(game, toTileId, slotIdx);
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
    modifiers: { terrain: terrDef, elevation: attSlope, weather, fort: fortLevel(toSt) + capBonus, baseDefense: defBaseDefense },
    baseModules: defBaseModules,
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
  if (!computeSupply(game, slotIdx).has(tileId)) throw new Error('Zone is cut off from supply — engineers cannot reach it');
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
        if (ast.owner !== null && ast.owner !== undefined && atPeace(game, slotIdx, ast.owner)) continue;
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
    const w = game.weather || 'clear';
    const npcCommitKeys = w === 'storm' ? ['riflemen', 'crawler'] : w === 'snow' ? ['riflemen', 'fighter'] : ['riflemen', 'crawler', 'fighter'];
    for (const k of npcCommitKeys) {
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

// ---------- Generals & field armies (GURPS-style mass combat) ----------
const GENERAL_FIRST = ['Aldric', 'Vessa', 'Korin', 'Maren', 'Dain', 'Ottil', 'Ryske', 'Halvar', 'Ingrid', 'Casmir', 'Petra', 'Emeric'];
const GENERAL_LAST = ['Vance', 'Odt', 'Krael', 'Morvane', 'Stahl', 'Redgrave', 'Voss', 'Harrow', 'Calder', 'Brandt'];
const DOCTRINE_EPITHET = { aggressive: 'the Unrelenting', economic: 'the Provisioner', defensive: 'the Unbroken' };
const RECRUIT_GENERAL_COST = { manpower: 4 };
const PROBE_COST = { fuel: 1 };

// ---------- Army designs (Stellaris-style templates; mirrors src/lib/armyDesign.js) ----------
const DESIGN_OPTIONS = {
  formation: {
    line: {},
    vanguard: { dmgOut: 1.2, dmgIn: 1.15 },
    skirmish: { dmgOut: 0.85, dmgIn: 0.85 },
    column: { dmgOut: 0.95, moraleIn: 0.85 },
  },
  weapon: {
    rifles: {},
    trench_guns: { dmgOut: 1.1, cost: { steel: 2 } },
    mortars: { skill: 1, cost: { steel: 3 } },
  },
  armor: {
    standard: {},
    plated: { dmgIn: 0.85, cost: { steel: 3 } },
    scout: { skill: 1, dmgIn: 1.1, cost: { fuel: 1 } },
  },
  support: {
    none: {},
    medics: { dmgIn: 0.9, cost: { manpower: 2 } },
    signals: { skill: 1, cost: { fuel: 2 } },
    commissars: { moraleIn: 0.8, cost: { manpower: 2 } },
  },
};

function compileDesign(rec) {
  const out = { skill: 0, dmgOut: 1, dmgIn: 1, moraleIn: 1, cost: emptyResources() };
  for (const slot of Object.keys(DESIGN_OPTIONS)) {
    const opt = DESIGN_OPTIONS[slot][rec[slot]] || {};
    out.skill += opt.skill || 0;
    out.dmgOut *= opt.dmgOut || 1;
    out.dmgIn *= opt.dmgIn || 1;
    out.moraleIn *= opt.moraleIn || 1;
    for (const k of RESOURCE_KEYS) out.cost[k] += (opt.cost || {})[k] || 0;
  }
  return out;
}
const ARMY_UNIT_KEYS = ['riflemen', 'crawler', 'fighter'];
const ARMY_ORDINALS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
const d3 = () => 1 + Math.floor(Math.random() * 3);
const roll3d6 = () => roll() + roll() + roll();
const genId = () => Math.random().toString(36).slice(2, 10);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const forcePoints = (u = {}) => UNIT_KEYS.reduce((s, k) => s + (u[k] || 0) * UNITS[k].points, 0);

const MANEUVERS = {
  all_out_attack: { label: 'All-Out Attack', skill: -2, dmgOut: 1.6, dmgIn: 1.5, moraleOut: 1.3 },
  attack: { label: 'Attack', skill: 0, dmgOut: 1.0, dmgIn: 1.0, moraleOut: 1.0 },
  defend: { label: 'Hold the Line', skill: 2, dmgOut: 0.5, dmgIn: 0.6, moraleOut: 0.7 },
  flank: { label: 'Flanking Maneuver', skill: -1, dmgOut: 1.3, dmgIn: 0.8, moraleOut: 1.5 },
  feint: { label: 'Feint', skill: 1, dmgOut: 0.3, dmgIn: 0.7, moraleOut: 0.8, nextBonus: 2 },
  rally: { label: 'Rally the Ranks', skill: 0, dmgOut: 0.2, dmgIn: 0.9, moraleOut: 0.5, rally: 20 },
  // Signature maneuvers — unlocked by a general's trait; cooldown scales with intensity
  relentless_pursuit: { label: 'Relentless Pursuit', skill: -1, dmgOut: 1.5, dmgIn: 1.2, moraleOut: 1.9, signature: true, cooldown: 4 },
  ambush: { label: 'Staged Ambush', skill: 2, dmgOut: 1.3, dmgIn: 0.7, moraleOut: 1.2, signature: true, cooldown: 3 },
  iron_wall: { label: 'Iron Wall', skill: 3, dmgOut: 0.3, dmgIn: 0.35, moraleOut: 0.6, signature: true, cooldown: 3 },
  inspiring_charge: { label: 'Inspiring Charge', skill: 0, dmgOut: 1.1, dmgIn: 1.0, moraleOut: 1.2, rally: 20, signature: true, cooldown: 2 },
};

// Terrain gives the defender a battle-skill edge
const TERRAIN_BATTLE_MODS = { mountains: 2, hills: 1, highlands: 1, forest: 1, marsh: 1, industrial: 1, plains: 0, deltas: 0 };

// General personality traits — each unlocks one signature maneuver
const GENERAL_TRAITS = [
  { key: 'butcher', label: 'the Butcher', signature: 'relentless_pursuit' },
  { key: 'fox', label: 'the Old Fox', signature: 'ambush' },
  { key: 'bulwark', label: 'the Bulwark', signature: 'iron_wall' },
  { key: 'firebrand', label: 'the Firebrand', signature: 'inspiring_charge' },
];
const DOCTRINE_TRAIT = { aggressive: 'butcher', economic: 'fox', defensive: 'bulwark' };
const traitByKey = (k) => GENERAL_TRAITS.find((t) => t.key === k) || null;

// Command vehicles — a general is no mere foot officer: each fights from a
// specialized machine suited to their specialty (mirrors src/lib/commandVehicles.js)
const COMMAND_VEHICLES = {
  butcher: { key: 'mauler', label: '"Mauler" Assault Crawler', effect: '+10% damage dealt', dmgOut: 1.1 },
  fox: { key: 'vixen', label: '"Vixen" Scout Autocar', effect: '+1 battle skill', skill: 1 },
  bulwark: { key: 'redoubt', label: '"Redoubt" Armored Wagon', effect: '−10% damage taken', dmgIn: 0.9 },
  firebrand: { key: 'clarion', label: '"Clarion" Signal Wagon', effect: '−15% morale damage taken', moraleIn: 0.85 },
};
const SUPREME_VEHICLE = { key: 'paramount', label: '"Paramount" Command Land-Train', effect: '+1 battle skill · −10% morale damage taken', skill: 1, moraleIn: 0.9 };

// Vehicle refit bays (mirrors src/lib/commandVehicles.js) — the equipment bay bolsters
// the attending army; the weapon bay mounts arms themed to the general's vehicle.
const VEHICLE_MODS = {
  quartermaster_rig: { bay: 'equipment', label: 'Quartermaster Rig', cost: { steel: 3, manpower: 1 }, dmgIn: 0.95, effect: '−5% damage taken' },
  observation_balloon: { bay: 'equipment', label: 'Observation Balloon', cost: { steel: 2, fuel: 2 }, skill: 1, effect: '+1 battle skill' },
  field_hospital: { bay: 'equipment', label: 'Field Hospital Trailer', cost: { manpower: 3, steel: 1 }, moraleIn: 0.9, effect: '−10% morale damage taken' },
  breaker_ram: { bay: 'weapon', trait: 'butcher', label: 'Breaker Ram', cost: { steel: 4, fuel: 1 }, dmgOut: 1.1, effect: '+10% damage dealt' },
  whisper_battery: { bay: 'weapon', trait: 'fox', label: 'Whisper Battery', cost: { steel: 3, fuel: 2 }, skill: 1, effect: '+1 battle skill' },
  bastion_casemate: { bay: 'weapon', trait: 'bulwark', label: 'Bastion Casemate', cost: { steel: 5 }, dmgIn: 0.9, effect: '−10% damage taken' },
  thunder_klaxon: { bay: 'weapon', trait: 'firebrand', label: 'Thunder Klaxon', cost: { steel: 2, fuel: 2, manpower: 1 }, moraleOut: 1.15, effect: '+15% morale damage dealt' },
};
// Supply-route refits take a turn to arrive but run 25% cheaper
const convoyCost = (cost) => Object.fromEntries(Object.entries(cost).map(([k, v]) => [k, Math.ceil(v * 0.75)]));
// Refit sites scale with unit size: command vehicles refit at any barracks/foundry
// (or alongside the fortress-base); the base itself needs heavy gantry cranes —
// capitals or a level-2 foundry only.
function vehicleDepotAt(game, slotIdx, tileId) {
  const st = game.territoryStates[tileId];
  if (!st || st.owner !== slotIdx) return false;
  if (game.factionSlots[slotIdx]?.base?.tileId === tileId) return true;
  return hasBuilding(st, 'barracks') || hasBuilding(st, 'foundry');
}
function gantryDepotAt(game, slotIdx, tileId) {
  const st = game.territoryStates[tileId];
  if (!st || st.owner !== slotIdx) return false;
  const tile = game.tiles.find((t) => t.id === tileId);
  if (tile?.isCapital) return true;
  return activeBuildings(st).some((b) => b.type === 'foundry' && (b.level || 0) >= 2);
}

// A general's effective vehicle: the trait chassis plus any bay modifications
const vehicleOf = (g) => {
  if (!g || !g.id) return null;
  const chassis = g.supreme ? SUPREME_VEHICLE : COMMAND_VEHICLES[g.trait] || null;
  if (!chassis) return null;
  const v = { ...chassis, mods: [] };
  for (const key of Object.values(g.vehicleMods || {})) {
    const m = VEHICLE_MODS[key];
    if (!m) continue;
    v.skill = (v.skill || 0) + (m.skill || 0);
    v.dmgOut = (v.dmgOut || 1) * (m.dmgOut || 1);
    v.dmgIn = (v.dmgIn || 1) * (m.dmgIn || 1);
    v.moraleIn = (v.moraleIn || 1) * (m.moraleIn || 1);
    v.moraleOut = (v.moraleOut || 1) * (m.moraleOut || 1);
    v.mods.push(m.label);
  }
  return v;
};

// Army veterancy — battles survived harden a field army
const VETERANCY = [
  { min: 5, label: 'Elite', bonus: 3 },
  { min: 3, label: 'Veteran', bonus: 2 },
  { min: 1, label: 'Seasoned', bonus: 1 },
  { min: 0, label: 'Green', bonus: 0 },
];
const armyRank = (battles = 0) => VETERANCY.find((v) => battles >= v.min);

// Thematic medals — awarded once per general when a battle milestone is reached
const MEDALS = {
  iron_hammer: { label: 'Order of the Iron Hammer', desc: 'Three consecutive victories' },
  brass_star: { label: 'Brass Star of Command', desc: 'A decisive victory with minimal casualties' },
  defiant_standard: { label: 'The Defiant Standard', desc: 'Victory against a superior force' },
  marshals_cross: { label: "The Marshal's Cross", desc: 'Five career victories' },
};

function awardMedal(game, g, key) {
  g.medals = g.medals || [];
  if (g.medals.includes(key)) return;
  g.medals.push(key);
  game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${g.name} is decorated with the ${MEDALS[key].label} — ${MEDALS[key].desc.toLowerCase()}.` });
}

// Update win streaks and hand out battle-milestone medals after a mass battle concludes
function recordBattleHonors(game, b, attackerWon) {
  const sides = [
    { s: b.attacker, foe: b.defender, won: attackerWon },
    { s: b.defender, foe: b.attacker, won: !attackerWon },
  ];
  for (const { s, foe, won } of sides) {
    if (s.slot === null || s.slot === undefined || !s.generalId) continue;
    const g = (game.factionSlots[s.slot].generals || []).find((x) => x.id === s.generalId);
    if (!g) continue;
    if (!won) { g.streak = 0; continue; }
    g.streak = (g.streak || 0) + 1;
    if (g.streak >= 3) awardMedal(game, g, 'iron_hammer');
    if ((g.victories || 0) >= 5) awardMedal(game, g, 'marshals_cross');
    const myStart = totalUnits(s.units) + s.losses;
    const foeStart = totalUnits(foe.units) + foe.losses;
    if (myStart > 0 && s.losses / myStart <= 0.1 && foeStart >= 3) awardMedal(game, g, 'brass_star');
    if (foeStart > myStart * 1.5) awardMedal(game, g, 'defiant_standard');
  }
}

function creditVictory(game, slotIdx, generalId) {
  if (slotIdx === null || slotIdx === undefined || !generalId) return;
  const g = (game.factionSlots[slotIdx]?.generals || []).find((x) => x.id === generalId);
  if (!g) return;
  g.victories = (g.victories || 0) + 1;
  if (g.victories % 2 === 0 && g.strategy < 14) {
    g.strategy++;
    game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${g.name} is decorated for victory — strategy rises to ${g.strategy}.` });
  }
}

function setChoice(side, maneuver) {
  side.choice = maneuver;
}

function supremeCommander(slot) {
  const bonus = { aggressive: { strategy: 2, leadership: 0 }, economic: { strategy: 0, leadership: 2 }, defensive: { strategy: 1, leadership: 1 } }[slot.doctrine] || { strategy: 1, leadership: 1 };
  return {
    id: genId(), name: `Marshal ${pick(GENERAL_FIRST)} ${pick(GENERAL_LAST)}`,
    epithet: DOCTRINE_EPITHET[slot.doctrine] || 'the Steadfast',
    strategy: 10 + bonus.strategy, leadership: 10 + bonus.leadership, supreme: true,
    trait: DOCTRINE_TRAIT[slot.doctrine] || 'firebrand', victories: 0,
  };
}

function randomGeneral() {
  return { id: genId(), name: `Gen. ${pick(GENERAL_FIRST)} ${pick(GENERAL_LAST)}`, epithet: null, strategy: 6 + d3() + d3(), leadership: 6 + d3() + d3(), supreme: false, trait: pick(GENERAL_TRAITS).key, victories: 0 };
}

function freeGenerals(game, slot) {
  const commanding = new Set((game.armies || []).map((a) => a.generalId));
  for (const c of game.macro?.columns || []) if (c.generalId) commanding.add(c.generalId);
  return (slot.generals || []).filter((g) => !commanding.has(g.id));
}

function generalFate(game, armyLike) {
  const slot = game.factionSlots[armyLike.owner];
  const g = (slot.generals || []).find((x) => x.id === armyLike.generalId);
  if (!g || g.supreme) return;
  if (Math.random() < 0.5) {
    slot.generals = slot.generals.filter((x) => x.id !== g.id);
    game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${g.name} fell with the ${armyLike.name || 'field army'}.` });
  }
}

function aiManeuver(side, doctrine = 'defensive') {
  if (side.signature && (side.sigCooldown || 0) === 0 && (side.morale < 55 || Math.random() < 0.25)) return side.signature;
  if (side.morale < 35 && Math.random() < 0.5) return 'rally';
  const table = {
    aggressive: ['all_out_attack', 'attack', 'flank', 'attack'],
    economic: ['defend', 'feint', 'attack', 'defend'],
    defensive: ['defend', 'defend', 'rally', 'attack'],
  };
  return pick(table[doctrine] || table.defensive);
}

function defenderIsLive(game, defSlotObj) {
  if (!defSlotObj || defSlotObj.isNPC || !defSlotObj.userId) return false;
  const seen = Date.parse((game.lastSeen || {})[defSlotObj.userId] || '') || 0;
  return Date.now() - seen < 60000;
}

// Returns { battle: true } or { captured: true } for an unopposed march
function createBattle(game, slotIdx, army, toTileId) {
  const fromTile = game.tiles.find((t) => t.id === army.tileId);
  const toTile = game.tiles.find((t) => t.id === toTileId);
  if (!toTile || !fromTile) throw new Error('Invalid target');
  if (toTile.isSea) throw new Error('Field armies cannot enter sea zones');
  if (!fromTile.adjacentIds.includes(toTileId)) throw new Error('Target zone is not adjacent');
  const st = game.territoryStates[toTileId];
  if (st.owner === slotIdx) throw new Error('Target is friendly — march instead');
  if (st.owner !== null && st.owner !== undefined && atPeace(game, slotIdx, st.owner)) throw new Error('A signed accord forbids engaging that faction');

  const weather = game.weather || 'clear';
  const attSlotObj = game.factionSlots[slotIdx];
  const defSlotIdx = st.owner !== null && st.owner !== undefined ? st.owner : null;
  const defSlotObj = defSlotIdx !== null ? game.factionSlots[defSlotIdx] : null;
  if (defSlotObj?.isNPC) shiftDisposition(game, defSlotIdx, slotIdx, -8);

  // Fold garrison + any enemy field armies on the zone into one defense force
  const defUnits = { ...st.units };
  let defGeneral = null;
  let defDesign = null;
  let defVetBattles = 0;
  const absorbed = [];
  for (const a of (game.armies || []).filter((a) => a.tileId === toTileId && a.owner !== slotIdx)) {
    for (const k of ARMY_UNIT_KEYS) defUnits[k] = (defUnits[k] || 0) + (a.regiments[k] || 0);
    defVetBattles = Math.max(defVetBattles, a.battles || 0);
    const g = (game.factionSlots[a.owner].generals || []).find((x) => x.id === a.generalId);
    if (g && (!defGeneral || g.strategy > defGeneral.strategy)) { defGeneral = g; defDesign = a.design || null; }
    absorbed.push({ owner: a.owner, generalId: a.generalId, name: a.name, id: a.id });
  }

  // Unopposed march — capture without a battle
  if (totalUnits(defUnits) === 0) {
    wreckBasesAt(game, toTileId, slotIdx);
    st.owner = slotIdx;
    st.units = {};
    army.tileId = toTileId;
    game.combatLog.push({
      turn: game.turnNumber, type: 'capture', faction: attSlotObj.factionName, tileName: toTile.name,
      from: defSlotObj ? defSlotObj.factionName : 'Neutral garrison',
      resource: TERRAIN_RESOURCE[toTile.terrain] || 'manpower', amount: toTile.baseIncome || 1,
      bonus: toTile.resourceBonus || null,
      buildings: (st.buildings || []).filter((b) => (b.level || 0) > 0).map((b) => b.type),
      isCapital: !!toTile.isCapital,
    });
    checkEliminations(game); checkWin(game); checkCampaignWin(game);
    return { captured: true };
  }

  const attGeneral = (attSlotObj.generals || []).find((g) => g.id === army.generalId) || { name: 'Field Officer', strategy: 9, leadership: 9 };
  const capBonus = defSlotObj && defSlotObj.capitalTileId === toTileId ? (slotMods(defSlotObj).capitalDefense || 0) : 0;
  const terrainBonus = TERRAIN_BATTLE_MODS[toTile.terrain] || 0;
  const eMod = slopeMod(fromTile, toTile);
  const attTrait = traitByKey(attGeneral.trait);
  const defTrait = traitByKey(defGeneral?.trait);
  const attRank = armyRank(army.battles || 0);
  const defRank = armyRank(defVetBattles);
  const attSupplied = computeSupply(game, slotIdx).has(army.tileId);
  const defSupplied = defSlotIdx === null ? true : computeSupply(game, defSlotIdx).has(toTileId);

  game.activeBattle = {
    id: genId(), tileId: toTileId, tileName: toTile.name, fromTileId: army.tileId,
    attacker: {
      slot: slotIdx, armyId: army.id, armyName: army.name, generalName: attGeneral.name, generalId: attGeneral.id || null,
      strategy: attGeneral.strategy, units: { ...army.regiments }, morale: 100, choice: null, nextBonus: 0, losses: 0,
      signature: attTrait?.signature || null, sigCooldown: 0, vetBonus: attRank.bonus, rank: attRank.label,
      vehicle: vehicleOf(attGeneral),
      supplyPenalty: attSupplied ? 0 : -2,
      weatherPenalty: weather === 'rain' || weather === 'snow' ? -1 : 0,
      elevMod: eMod,
      design: army.design || null,
    },
    defender: {
      slot: defSlotIdx, absorbedArmies: absorbed,
      generalName: defGeneral ? defGeneral.name : 'Garrison Commander',
      strategy: defGeneral ? defGeneral.strategy : 9,
      units: defUnits, morale: 100, fortBonus: fortLevel(st) + capBonus + baseDefenseAt(game, defSlotIdx, toTileId), terrainBonus,
      generalId: defGeneral?.id || null,
      signature: defTrait?.signature || null, sigCooldown: 0, vetBonus: defRank.bonus, rank: defRank.label,
      vehicle: vehicleOf(defGeneral),
      supplyPenalty: defSupplied ? 0 : -2,
      weatherPenalty: weather === 'fog' ? -1 : 0,
      design: defDesign,
      choice: null, nextBonus: 0, losses: 0,
      interactive: defenderIsLive(game, defSlotObj),
    },
    round: 1,
    terrain: toTile.terrain,
    weather,
    log: [`The ${army.name} under ${attGeneral.name} engages at ${toTile.name}${terrainBonus > 0 ? ` — the ${toTile.terrain} favors the defense (+${terrainBonus})` : ''}.`],
  };
  const attVeh = vehicleOf(attGeneral), defVeh = vehicleOf(defGeneral);
  if (attVeh) game.activeBattle.log.push(`${attGeneral.name} directs the assault from the ${attVeh.label}.`);
  if (defVeh) game.activeBattle.log.push(`${defGeneral.name} anchors the defense from the ${defVeh.label}.`);
  if (!attSupplied) game.activeBattle.log.push(`${attGeneral.name}'s columns fight cut off from supply — every shell is rationed (−2).`);
  if (!defSupplied) game.activeBattle.log.push(`The defenders of ${toTile.name} are under siege — stores run thin (−2).`);
  if (weather === 'rain') game.activeBattle.log.push('Driving rain turns the field to mud — the assault bogs down (attacker −1).');
  if (weather === 'fog') game.activeBattle.log.push('Heavy fog cloaks the assault columns — the defense fires blind (defender −1).');
  if (weather === 'snow') game.activeBattle.log.push('Deep snow drags at the assault columns (attacker −1).');
  if (eMod < 0) game.activeBattle.log.push(`The assault climbs uphill into ${toTile.name} — the grade favors the defense (attacker −1).`);
  if (eMod > 0) game.activeBattle.log.push(`${attGeneral.name} strikes downhill — momentum carries the assault (attacker +1).`);
  // Defenders are committed to the battle; the zone stands empty until it resolves
  game.armies = (game.armies || []).filter((a) => !absorbed.some((x) => x.id === a.id));
  st.units = {};
  game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `Mass battle joined at ${toTile.name}.` });
  return { battle: true };
}

function battleSkill(side, other) {
  const m = MANEUVERS[side.choice];
  const ratio = Math.max(forcePoints(side.units), 1) / Math.max(forcePoints(other.units), 1);
  const strengthMod = Math.max(Math.min(Math.round(Math.log2(ratio) * 2), 4), -4);
  return side.strategy + m.skill + strengthMod + (side.fortBonus || 0) + (side.terrainBonus || 0) + (side.vetBonus || 0) + (side.nextBonus || 0) + (side.supplyPenalty || 0) + (side.weatherPenalty || 0) + (side.elevMod || 0) + ((side.design || {}).skill || 0) + ((side.vehicle || {}).skill || 0);
}

function finishBattle(game, b, attackerWon) {
  const attSlotObj = game.factionSlots[b.attacker.slot];
  const defSlotObj = b.defender.slot !== null ? game.factionSlots[b.defender.slot] : null;
  let outcome;
  if (b.worldModel === 'macro') {
    outcome = macroApplyBattleOutcome(game, b, attackerWon);
  } else {
  const st = game.territoryStates[b.tileId];
  const toTile = game.tiles.find((t) => t.id === b.tileId);
  const army = (game.armies || []).find((a) => a.id === b.attacker.armyId);
  if (attackerWon) {
    wreckBasesAt(game, b.tileId, b.attacker.slot);
    st.owner = b.attacker.slot;
    st.units = {};
    if (army) { army.tileId = b.tileId; army.regiments = b.attacker.units; army.battles = (army.battles || 0) + 1; }
    creditVictory(game, b.attacker.slot, army?.generalId);
    for (const dead of b.defender.absorbedArmies || []) generalFate(game, dead);
    outcome = 'captured';
    game.combatLog.push({
      turn: game.turnNumber, type: 'capture', faction: attSlotObj.factionName, tileName: b.tileName,
      from: defSlotObj ? defSlotObj.factionName : 'Neutral garrison',
      resource: TERRAIN_RESOURCE[toTile?.terrain] || 'manpower', amount: toTile?.baseIncome || 1,
      bonus: toTile?.resourceBonus || null,
      buildings: (st.buildings || []).filter((x) => (x.level || 0) > 0).map((x) => x.type),
      isCapital: !!toTile?.isCapital,
    });
  } else {
    st.units = b.defender.units; // survivors garrison the zone
    creditVictory(game, b.defender.slot, b.defender.generalId);
    if (totalUnits(b.attacker.units) > 0 && army) {
      army.regiments = b.attacker.units; // routed survivors fall back to the staging zone
      army.battles = (army.battles || 0) + 1;
      outcome = 'retreated';
    } else {
      if (army) { game.armies = game.armies.filter((a) => a.id !== army.id); generalFate(game, army); }
      outcome = 'repelled';
    }
  }
  }
  recordBattleHonors(game, b, attackerWon);
  game.combatLog.push({
    turn: game.turnNumber, type: 'combat', attacker: attSlotObj.factionName,
    defender: defSlotObj ? defSlotObj.factionName : 'Neutral garrison',
    tileName: b.tileName, rounds: b.round - 1, attLosses: b.attacker.losses, defLosses: b.defender.losses, outcome,
  });
  // Post-battle after-action report
  const sideReport = (s, fac) => ({
    faction: fac, general: s.generalName, losses: s.losses, remaining: totalUnits(s.units),
    morale: Math.max(s.morale, 0), rank: s.rank || null, maneuvers: s.maneuvers || {},
  });
  game.lastBattle = {
    id: b.id, turn: game.turnNumber, tileName: b.tileName, terrain: b.terrain,
    terrainBonus: b.defender.terrainBonus || 0, fortBonus: b.defender.fortBonus || 0,
    rounds: b.round - 1, outcome,
    attackerSlot: b.attacker.slot, defenderSlot: b.defender.slot,
    attacker: sideReport(b.attacker, attSlotObj.factionName),
    defender: sideReport(b.defender, defSlotObj ? defSlotObj.factionName : 'Neutral garrison'),
  };
  // File the full round-by-round record in the game's dispatch archive
  game.lastBattle.history = b.history || [];
  game.battleArchives = game.battleArchives || [];
  game.battleArchives.push(game.lastBattle);
  if (game.battleArchives.length > 15) game.battleArchives.shift();
  game.activeBattle = null;
  if (b.worldModel === 'macro') { macroCheckWin(game); checkCampaignWin(game); }
  else { checkEliminations(game); checkWin(game); checkCampaignWin(game); }
}

function resolveBattleRound(game, b) {
  const A = b.attacker, D = b.defender;
  const aL0 = A.losses, dL0 = D.losses;
  // Tally maneuvers for the post-battle report
  for (const s of [A, D]) {
    s.maneuvers = s.maneuvers || {};
    s.maneuvers[s.choice] = (s.maneuvers[s.choice] || 0) + 1;
  }
  const aMargin = battleSkill(A, D) - roll3d6();
  const dMargin = battleSkill(D, A) - roll3d6();
  A.nextBonus = 0; D.nextBonus = 0;
  for (const s of [A, D]) {
    const m = MANEUVERS[s.choice];
    if (m.rally) s.morale = Math.min(s.morale + m.rally, 100);
  }
  if (aMargin === dMargin) {
    for (const s of [A, D]) {
      const t = totalUnits(s.units);
      const l = Math.min(Math.round(t * 0.05), t);
      removeCasualties(s.units, l);
      s.losses += l;
      s.morale -= 4;
    }
    b.log.push(`R${b.round} — The lines grind together; neither commander finds an opening.`);
  } else {
    const win = aMargin > dMargin ? A : D;
    const lose = win === A ? D : A;
    const marginDiff = Math.min(Math.abs(aMargin - dMargin), 6);
    const wm = MANEUVERS[win.choice], lm = MANEUVERS[lose.choice];
    const lTotal = totalUnits(lose.units);
    const lLoss = Math.min(Math.max(Math.round(lTotal * Math.min(0.07 + 0.06 * marginDiff, 0.45) * wm.dmgOut * lm.dmgIn * ((win.design || {}).dmgOut || 1) * ((lose.design || {}).dmgIn || 1) * ((win.vehicle || {}).dmgOut || 1) * ((lose.vehicle || {}).dmgIn || 1)), 1), lTotal);
    removeCasualties(lose.units, lLoss);
    lose.losses += lLoss;
    const wTotal = totalUnits(win.units);
    const wLoss = Math.min(Math.round(wTotal * 0.05 * lm.dmgOut * wm.dmgIn * ((lose.design || {}).dmgOut || 1) * ((win.design || {}).dmgIn || 1) * ((lose.vehicle || {}).dmgOut || 1) * ((win.vehicle || {}).dmgIn || 1)), wTotal);
    removeCasualties(win.units, wLoss);
    win.losses += wLoss;
    lose.morale -= Math.round((10 + 5 * marginDiff) * wm.moraleOut * ((win.vehicle || {}).moraleOut || 1) * ((lose.design || {}).moraleIn || 1) * ((lose.vehicle || {}).moraleIn || 1));
    win.morale -= wLoss > 0 ? 4 : 2;
    if (wm.nextBonus) win.nextBonus = wm.nextBonus;
    b.log.push(`R${b.round} — ${win.generalName}'s ${wm.label.toLowerCase()} carries the field: ${lLoss} enemy compan${lLoss === 1 ? 'y' : 'ies'} broken (morale ${Math.max(lose.morale, 0)}).`);
  }
  // Signature cooldowns — firing one locks it for its intensity-based recovery period
  for (const s of [A, D]) {
    const m = MANEUVERS[s.choice];
    if (m?.signature) s.sigCooldown = m.cooldown || 3;
    else if ((s.sigCooldown || 0) > 0) s.sigCooldown--;
  }
  // Archive this round's orders for the dispatch file
  b.history = b.history || [];
  b.history.push({
    round: b.round,
    att: { maneuver: A.choice, losses: A.losses - aL0, morale: Math.max(A.morale, 0), remaining: totalUnits(A.units) },
    def: { maneuver: D.choice, losses: D.losses - dL0, morale: Math.max(D.morale, 0), remaining: totalUnits(D.units) },
    text: b.log[b.log.length - 1] || '',
  });
  A.choice = null; D.choice = null;
  b.round++;
  const aDead = totalUnits(A.units) === 0, dDead = totalUnits(D.units) === 0;
  if (dDead || (D.morale <= 0 && !aDead)) {
    b.log.push(`${D.generalName}'s force ${dDead ? 'is annihilated' : 'breaks and routs'}.`);
    finishBattle(game, b, true);
  } else if (aDead || A.morale <= 0 || b.round > 15) {
    b.log.push(aDead ? `${A.generalName}'s army is destroyed.` : `${A.generalName} sounds the withdrawal.`);
    finishBattle(game, b, false);
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
      const w = rollWeather();
      if (w !== (game.weather || 'clear')) {
        game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `The weather turns — ${WEATHER_TYPES[w].label.toLowerCase()} settles over the front.` });
      }
      game.weather = w;
      if (game.worldModel === 'macro') macroAdvanceDay(game); // dawn resolution — all columns march
      recordSnapshot(game);
      tickResearch(game);
      // Lapsed accords — hostilities may resume
      if (game.diplomacy?.relations) {
        for (const [k, r] of Object.entries(game.diplomacy.relations)) {
          if (r.until !== null && r.until !== undefined && game.turnNumber >= r.until) {
            delete game.diplomacy.relations[k];
            const [a, b] = k.split('-').map(Number);
            game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `The ${PACT_LABELS[r.status] || 'accord'} between ${game.factionSlots[a]?.factionName} and ${game.factionSlots[b]?.factionName} has lapsed — hostilities may resume.` });
          }
        }
      }
    }
    const slotIdx = game.turnOrder[game.currentTurnIndex];
    const slot = game.factionSlots[slotIdx];
    if (slot.eliminated) continue;
    checkMapControl(game, slotIdx);
    if (game.status !== 'active') return;
    collectIncome(game, slotIdx);
    if (slot.isNPC) {
      if (game.worldModel === 'macro') macroNpcTurn(game, slotIdx);
      else npcTakeTurn(game, slotIdx);
      checkCampaignWin(game);
      continue;
    }
    return; // human's turn
  }
}

// ---------- Macro engine (v2.x slice M1 — docs/MACRO_ENGINE.md) ----------
// Macro games (worldModel: 'macro') fight on a node-and-route graph instead of
// hexes. The world is generated ONCE here at creation (mirroring the client
// generator in src/lib/macro/) and stored on the Game — the stored graph is the
// single truth both sides render and validate against.

const MACRO_ROUTE_QUALITY = { highway: 1.25, road: 1.0, track: 0.75, trail: 0.5 };
const MACRO_UNIT_MARCH = { riflemen: { rate: 20, ground: true }, crawler: { rate: 16, ground: true }, artillery: { rate: 12, ground: true }, fighter: { rate: 90, ground: false } };
const MACRO_COLUMN_KEYS = ['riflemen', 'crawler', 'artillery', 'fighter'];
const MACRO_SETTLEMENT_YIELD = { city: { steel: 2, manpower: 2 }, town: { manpower: 2 }, depot: { fuel: 2 }, ruin: { steel: 1 }, crossroads: {} };
const MACRO_ESCORT = { riflemen: 2, crawler: 1 };
const MACRO_SCOUT_HOPS = 1;
// Supply & the fortress-base (slice M3 — docs/MACRO_ENGINE.md §8)
const MACRO_BASE_DAY_RATE = 10;        // the base is the slowest thing on the map
const MACRO_SUPPLY_MILES = 220;        // effective-mile envelope from base/depots (~3 road-days)
const MACRO_ATTRITION_DAYS = 2;        // out of supply: lose 1 company per this many days
const MACRO_CASUALTY_ORDER = ['fighter', 'artillery', 'crawler', 'riflemen'];

// -- deterministic world generation (mirrors src/lib/macro/graph.js + planets.js) --
const macroMulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const macroVec = (lat, lon) => {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return [-Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)];
};
const macroAngDeg = (a, b) => {
  const A = macroVec(a.lat, a.lon), B = macroVec(b.lat, b.lon);
  const dot = Math.min(Math.max(A[0] * B[0] + A[1] * B[1] + A[2] * B[2], -1), 1);
  return (Math.acos(dot) * 180) / Math.PI;
};
const MACRO_NAME_PREFIX = ['Ash', 'Iron', 'Rust', 'Grey', 'Black', 'Pale', 'Cold', 'Dust', 'Slag', 'Tar', 'Bone', 'Cinder', 'Salt', 'Storm', 'Coal', 'Brass', 'Mire', 'Fen', 'Krael', 'Vost', 'Dead', 'Low', 'Red', 'Gaunt', 'Hollow'];
const MACRO_NAME_SUFFIX = ['fall', 'reach', 'moor', 'hold', 'gate', 'yard', 'haven', 'spur', 'cross', 'field', 'quay', 'ridge', 'hollow', 'works', 'barrow', 'march', 'point', 'deep', 'watch', 'stead'];
const MACRO_KIND_POOL = ['town', 'town', 'town', 'depot', 'depot', 'crossroads', 'crossroads', 'ruin', 'ruin', 'city'];
const macroMilesFor = (d) => Math.min(160, Math.max(30, Math.round(d * 4.5)));
const macroQualityFor = (d, rand) =>
  d < 13 ? (rand() < 0.35 ? 'highway' : 'road') : d < 21 ? (rand() < 0.5 ? 'road' : 'track') : d < 30 ? 'track' : 'trail';

function macroMakeName(rand, used) {
  for (let i = 0; i < 60; i++) {
    const n = MACRO_NAME_PREFIX[(rand() * MACRO_NAME_PREFIX.length) | 0] + MACRO_NAME_SUFFIX[(rand() * MACRO_NAME_SUFFIX.length) | 0];
    if (!used.has(n)) { used.add(n); return n; }
  }
  const fallback = `Station ${used.size + 1}`;
  used.add(fallback);
  return fallback;
}

// The authored continent (mirrors MACRO_NODES/MACRO_ROUTES in src/lib/macro/graph.js)
const MACRO_CONTINENT_NODES = [
  { id: 'kesselgrad', name: 'Kesselgrad', kind: 'city', lat: 23.6, lon: -61 },
  { id: 'ashvale', name: 'Ashvale', kind: 'town', lat: 30.8, lon: -47.5 },
  { id: 'rustwater', name: 'Rustwater', kind: 'city', lat: 32.4, lon: -31 },
  { id: 'ironmoor', name: 'Ironmoor', kind: 'town', lat: 29.2, lon: -11.5 },
  { id: 'veldt_cross', name: 'Veldt Cross', kind: 'crossroads', lat: 12.4, lon: -52 },
  { id: 'foundry_91', name: 'Foundry 91', kind: 'depot', lat: 17.2, lon: -37 },
  { id: 'greyspire', name: 'Greyspire', kind: 'city', lat: 15.6, lon: -20.5 },
  { id: 'pale_marsh', name: 'Pale Marsh', kind: 'ruin', lat: 14, lon: -3.25 },
  { id: 'cinder_flats', name: 'Cinder Flats', kind: 'depot', lat: -0.4, lon: -60.25 },
  { id: 'old_lorry', name: 'Old Lorry', kind: 'town', lat: 1.2, lon: -44.5 },
  { id: 'saltglass', name: 'Saltglass', kind: 'crossroads', lat: 2.8, lon: -28 },
  { id: 'verge', name: 'The Verge', kind: 'city', lat: -0.4, lon: -11.5 },
  { id: 'thornfield', name: 'Thornfield', kind: 'ruin', lat: -11.6, lon: -49.75 },
  { id: 'terminus', name: 'Terminus', kind: 'city', lat: -12.4, lon: -27.25 },
  { id: 'black_quay', name: 'Black Quay', kind: 'town', lat: -13.2, lon: -5.5 },
];
const MACRO_CONTINENT_ROUTES = [
  ['kesselgrad', 'ashvale', 42, 'road'], ['ashvale', 'rustwater', 48, 'highway'],
  ['rustwater', 'ironmoor', 55, 'highway'], ['kesselgrad', 'veldt_cross', 38, 'road'],
  ['ashvale', 'veldt_cross', 46, 'track'], ['veldt_cross', 'foundry_91', 40, 'road'],
  ['rustwater', 'foundry_91', 44, 'track'], ['foundry_91', 'greyspire', 46, 'road'],
  ['rustwater', 'greyspire', 52, 'road'], ['ironmoor', 'greyspire', 42, 'track'],
  ['ironmoor', 'pale_marsh', 46, 'trail'], ['greyspire', 'pale_marsh', 50, 'trail'],
  ['veldt_cross', 'cinder_flats', 40, 'track'], ['kesselgrad', 'cinder_flats', 62, 'trail'],
  ['veldt_cross', 'old_lorry', 36, 'road'], ['old_lorry', 'foundry_91', 44, 'track'],
  ['old_lorry', 'saltglass', 44, 'road'], ['foundry_91', 'saltglass', 42, 'track'],
  ['saltglass', 'greyspire', 38, 'road'], ['saltglass', 'verge', 46, 'highway'],
  ['greyspire', 'verge', 45, 'road'], ['verge', 'pale_marsh', 40, 'trail'],
  ['cinder_flats', 'thornfield', 42, 'trail'], ['old_lorry', 'thornfield', 38, 'track'],
  ['thornfield', 'terminus', 58, 'road'], ['saltglass', 'terminus', 40, 'road'],
  ['terminus', 'black_quay', 56, 'highway'], ['verge', 'black_quay', 38, 'road'],
];
const MACRO_PLANETS = {
  cindara: { seed: 1917, count: 45, authored: true },
  veyra: { seed: 2044, count: 55 },
  morhollow: { seed: 3121, count: 45 },
};

function macroGenerateWorld(planetId) {
  const spec = MACRO_PLANETS[planetId] || MACRO_PLANETS.cindara;
  const rand = macroMulberry32(spec.seed);
  const baseNodes = spec.authored ? MACRO_CONTINENT_NODES.map((n) => ({ ...n })) : [];
  const baseRoutes = spec.authored ? MACRO_CONTINENT_ROUTES.map((r) => [...r]) : [];
  const nodes = [...baseNodes];
  const used = new Set(nodes.map((n) => n.name));
  let serial = 0, guard = 0;
  while (nodes.length < baseNodes.length + spec.count && guard++ < spec.count * 40) {
    const cand = {
      id: `p${spec.seed}_${serial++}`,
      name: macroMakeName(rand, used),
      kind: MACRO_KIND_POOL[(rand() * MACRO_KIND_POOL.length) | 0],
      lat: rand() * 150 - 75,
      lon: rand() * 360 - 180,
    };
    if (nodes.every((n) => macroAngDeg(n, cand) > 8.5)) nodes.push(cand);
    else used.delete(cand.name);
  }
  const routes = baseRoutes;
  const has = (a, b) => routes.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  for (const n of nodes.slice(baseNodes.length)) {
    const near = nodes.filter((o) => o !== n).map((o) => ({ o, d: macroAngDeg(n, o) })).sort((a, b) => a.d - b.d);
    const links = 2 + (rand() < 0.35 ? 1 : 0);
    for (const { o, d } of near.slice(0, links)) {
      if (d > 42 || has(n.id, o.id)) continue;
      routes.push([n.id, o.id, macroMilesFor(d), macroQualityFor(d, rand)]);
    }
  }
  // Connectivity pass — bridge isolated clusters (mirrors src/lib/macro/planets.js)
  const parent = {};
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (const n of nodes) parent[n.id] = n.id;
  for (const [a, b] of routes) parent[find(a)] = find(b);
  for (;;) {
    const comps = new Map();
    for (const n of nodes) {
      const root = find(n.id);
      if (!comps.has(root)) comps.set(root, []);
      comps.get(root).push(n);
    }
    if (comps.size <= 1) break;
    const [main, ...rest] = [...comps.values()].sort((a, b) => b.length - a.length);
    let best = null;
    for (const island of rest) {
      for (const a of island) {
        for (const b of main) {
          const d = macroAngDeg(a, b);
          if (!best || d < best.d) best = { a, b, d };
        }
      }
    }
    routes.push([best.a.id, best.b.id, macroMilesFor(best.d), macroQualityFor(best.d, rand)]);
    parent[find(best.a.id)] = find(best.b.id);
  }
  return { seed: spec.seed, nodes, routes };
}

// -- graph helpers --
const macroNode = (macro, id) => macro.nodes.find((n) => n.id === id);
const macroRouteBetween = (macro, a, b) =>
  macro.routes.find(([x, y]) => (x === a && y === b) || (x === b && y === a));

function macroDayRate(regiments = {}) {
  let rate = null;
  for (const [k, def] of Object.entries(MACRO_UNIT_MARCH)) {
    if (!def.ground || (regiments[k] || 0) <= 0) continue;
    rate = rate === null ? def.rate : Math.min(rate, def.rate);
  }
  return rate;
}

// Rain and snow slow wheels harder than boots (docs/MACRO_ENGINE.md §4)
function macroWeatherMult(weather, regiments = {}) {
  if (weather !== 'rain' && weather !== 'snow') return 1;
  const wheels = (regiments.crawler || 0) > 0 || (regiments.artillery || 0) > 0;
  return wheels ? 0.6 : 0.85;
}

// Dijkstra over march-days for a given column pace
function macroFindPath(macro, fromId, toId, dayRate) {
  if (!dayRate || fromId === toId) return null;
  const dist = { [fromId]: 0 };
  const prev = {};
  const done = new Set();
  const queue = [fromId];
  while (queue.length > 0) {
    queue.sort((a, b) => dist[a] - dist[b]);
    const cur = queue.shift();
    if (cur === toId) break;
    if (done.has(cur)) continue;
    done.add(cur);
    for (const route of macro.routes) {
      const [a, b, miles, quality] = route;
      if (a !== cur && b !== cur) continue;
      const next = a === cur ? b : a;
      if (done.has(next)) continue;
      const nd = dist[cur] + miles / (dayRate * MACRO_ROUTE_QUALITY[quality]);
      if (dist[next] === undefined || nd < dist[next]) {
        dist[next] = nd;
        prev[next] = cur;
        queue.push(next);
      }
    }
  }
  if (dist[toId] === undefined) return null;
  const path = [toId];
  while (path[0] !== fromId) path.unshift(prev[path[0]]);
  return { path, totalDays: dist[toId] };
}

const macroSettlements = (macro) => macro.nodes.filter((n) => n.kind !== 'crossroads');
const macroColumnsAt = (game, nodeId) => (game.macro.columns || []).filter((c) => c.nodeId === nodeId);
const macroForeignBaseAt = (game, nodeId, slotIdx) =>
  Object.entries(game.macro.bases || {}).some(([slot, b]) => Number(slot) !== slotIdx && b.nodeId === nodeId);
// A node blocks foreign movement when foreign columns hold it or a foreign
// fortress-base is anchored there (boarding assaults arrive in slice M5)
const macroBlockedAgainst = (game, nodeId, slotIdx) =>
  macroColumnsAt(game, nodeId).some((c) => c.owner !== slotIdx) || macroForeignBaseAt(game, nodeId, slotIdx);

// Supply envelope (§8): effective-mile reach from the fortress-base and any
// controlled fuel depot, flowing only through routes whose far node the faction
// controls or that stand neutral. Returns the Set of in-supply node ids.
function macroSupplied(game, slotIdx) {
  const macro = game.macro;
  const passable = (nid) => macro.control[nid] === slotIdx || macro.control[nid] === null || macro.control[nid] === undefined;
  const sources = [];
  const base = macro.bases?.[String(slotIdx)];
  if (base?.nodeId) sources.push(base.nodeId);
  for (const n of macro.nodes) if (n.kind === 'depot' && macro.control[n.id] === slotIdx) sources.push(n.id);
  const dist = {};
  const queue = [];
  for (const s of sources) { dist[s] = 0; queue.push(s); }
  while (queue.length > 0) {
    queue.sort((a, b) => dist[a] - dist[b]);
    const cur = queue.shift();
    for (const route of macro.routes) {
      const [a, b, miles, quality] = route;
      if (a !== cur && b !== cur) continue;
      const next = a === cur ? b : a;
      if (!passable(next)) continue;
      const nd = dist[cur] + miles / MACRO_ROUTE_QUALITY[quality]; // effective miles
      if (nd > MACRO_SUPPLY_MILES) continue;
      if (dist[next] === undefined || nd < dist[next]) { dist[next] = nd; queue.push(next); }
    }
  }
  return new Set(Object.keys(dist));
}

// Where a column effectively sits for supply purposes: its node, or the origin
// of the leg it is marching (the last friendly ground it touched)
const macroColumnAnchor = (column) => column.nodeId || column.march?.path[0];

function macroControlPct(game, slotIdx) {
  const settlements = macroSettlements(game.macro);
  if (settlements.length === 0) return 0;
  const mine = settlements.filter((n) => game.macro.control[n.id] === slotIdx).length;
  return (mine / settlements.length) * 100;
}

// A column enters a node it now holds uncontested: flip control and log the
// take. Ground held by a faction under a signed accord is passed through, not
// seized — a truce protects territory as well as troops.
function macroFlipControl(game, column, nodeId) {
  const prevOwner = game.macro.control[nodeId];
  if (prevOwner === column.owner) return;
  if (prevOwner !== null && prevOwner !== undefined && atPeace(game, column.owner, prevOwner)) return;
  game.macro.control[nodeId] = column.owner;
  const node = macroNode(game.macro, nodeId);
  if (node && node.kind !== 'crossroads') {
    const taker = game.factionSlots[column.owner].factionName;
    const from = prevOwner === null || prevOwner === undefined ? '' : ` from ${game.factionSlots[prevOwner].factionName}`;
    game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${taker}'s ${column.name} takes ${node.name}${from}.` });
  }
}

// Advance one marching mover (column or fortress-base) by `days` of budget along
// its plan. `rate` is the base pace; supply half-rate and weather fold in per
// leg. onArrive(nodeId) fires as each node is reached. Contact ahead halts it.
function macroAdvanceMover(game, mover, rate, days, suppliedSet, onArrive) {
  let budget = days;
  const halfRate = suppliedSet && !suppliedSet.has(macroColumnAnchor(mover)) ? 0.5 : 1;
  while (budget > 0 && mover.march) {
    const { path } = mover.march;
    if (path.length < 2) { mover.nodeId = path[0]; delete mover.march; break; }
    const next = path[1];
    if (macroBlockedAgainst(game, next, mover.owner)) {
      mover.nodeId = path[0];
      delete mover.march;
      game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${game.factionSlots[mover.owner].factionName}'s ${mover.name} halts at contact outside ${macroNode(game.macro, next)?.name} — awaiting orders to engage.` });
      break;
    }
    const route = macroRouteBetween(game.macro, path[0], next);
    if (!route) { mover.nodeId = path[0]; delete mover.march; break; }
    delete mover.nodeId; // on the road
    const effRate = rate * MACRO_ROUTE_QUALITY[route[3]] * macroWeatherMult(game.weather || 'clear', mover.regiments || {}) * halfRate;
    const daysLeft = (route[2] - mover.march.legMiles) / effRate;
    if (budget >= daysLeft) {
      budget -= daysLeft;
      path.shift();
      mover.march.legMiles = 0;
      onArrive(path[0]);
      if (path.length === 1) { mover.nodeId = path[0]; delete mover.march; }
    } else {
      mover.march.legMiles += budget * effRate;
      budget = 0;
    }
  }
}

// Dawn resolution — every marching column and fortress-base advances one day.
// Out-of-supply columns march at half rate and bleed a company each attrition
// window; contact ahead halts a mover short of it (docs/MACRO_ENGINE.md §7–§8).
function macroAdvanceDay(game) {
  // Supply is measured from the pre-dawn positions, once per faction
  const supplied = {};
  for (const slot of game.factionSlots) supplied[slot.slotIndex] = macroSupplied(game, slot.slotIndex);

  // Fortress-bases first — a base arriving re-anchors that faction's supply
  for (const [slotKey, b] of Object.entries(game.macro.bases || {})) {
    if (!b.march) continue;
    const slot = Number(slotKey);
    const mover = { ...b, owner: slot, name: `${game.factionSlots[slot].factionName} fortress-base`, regiments: {} };
    macroAdvanceMover(game, mover, MACRO_BASE_DAY_RATE, 1, null, (nid) => {
      const col = { owner: slot, name: mover.name };
      macroFlipControl(game, col, nid);
    });
    b.nodeId = mover.nodeId;
    if (mover.march) b.march = mover.march; else delete b.march;
  }

  for (const column of game.macro.columns || []) {
    const rate = macroDayRate(column.regiments);
    // Out-of-supply attrition applies whether marching or halted
    const inSupply = supplied[column.owner].has(macroColumnAnchor(column));
    if (!inSupply) {
      column.outOfSupplyDays = (column.outOfSupplyDays || 0) + 1;
      if (column.outOfSupplyDays >= MACRO_ATTRITION_DAYS && macroTotalCompanies(column) > 1) {
        column.outOfSupplyDays = 0;
        macroAttrit(column);
        game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${game.factionSlots[column.owner].factionName}'s ${column.name} loses a company to privation — cut off from supply.` });
      }
    } else {
      column.outOfSupplyDays = 0;
    }
    if (!column.march || !rate) continue;
    macroAdvanceMover(game, column, rate, 1, supplied[column.owner], (nid) => macroFlipControl(game, column, nid));
  }
  macroCheckWin(game);
}

const macroTotalCompanies = (column) => MACRO_COLUMN_KEYS.reduce((s, k) => s + (column.regiments[k] || 0), 0);
// Privation takes the least essential company first (air, then guns, then armor)
function macroAttrit(column) {
  for (const k of MACRO_CASUALTY_ORDER) {
    if ((column.regiments[k] || 0) > 0) { column.regiments[k] -= 1; return; }
  }
}

function macroCheckWin(game) {
  if (game.status !== 'active') return;
  for (const slot of game.factionSlots) {
    if (slot.eliminated) continue;
    if (macroControlPct(game, slot.slotIndex) >= MAP_CONTROL_PCT) {
      game.status = 'complete';
      game.winnerSlot = slot.slotIndex;
      game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${slot.factionName} holds the settled world — the long march is over.` });
      return;
    }
  }
}

function macroCollectIncome(game, slotIdx) {
  const treasury = getTreasury(game, slotIdx);
  const prod = factionProduction(game, slotIdx);
  for (const k of RESOURCE_KEYS) treasury[k] = (treasury[k] || 0) + (prod[k] || 0);
}

// Observed set: controlled nodes, base node, column positions — plus scout hops
function macroObserved(game, slotIdx) {
  const seen = new Set();
  for (const [nid, owner] of Object.entries(game.macro.control)) if (owner === slotIdx) seen.add(nid);
  const base = game.macro.bases?.[String(slotIdx)];
  if (base?.nodeId) seen.add(base.nodeId);
  if (base?.march) { seen.add(base.march.path[0]); seen.add(base.march.path[1]); }
  for (const c of game.macro.columns || []) {
    if (c.owner !== slotIdx) continue;
    if (c.nodeId) seen.add(c.nodeId);
    if (c.march) { seen.add(c.march.path[0]); seen.add(c.march.path[1]); }
  }
  for (let hop = 0; hop < MACRO_SCOUT_HOPS; hop++) {
    const edge = [...seen];
    for (const [a, b] of game.macro.routes) {
      if (edge.includes(a)) seen.add(b);
      if (edge.includes(b)) seen.add(a);
    }
  }
  return seen;
}

// Fog-filtered macro state: geography is public, intel is not (§6)
function macroVisibleFor(game, slotIdx) {
  const revealAll = game.status !== 'active' || slotIdx === null;
  const seen = revealAll ? null : macroObserved(game, slotIdx);
  const observed = (nid) => revealAll || seen.has(nid);
  const mySupply = slotIdx !== null ? macroSupplied(game, slotIdx) : new Set();
  const columnView = (c) => ({
    id: c.id, owner: c.owner, name: c.name,
    nodeId: c.nodeId || null,
    march: c.march ? { edge: [c.march.path[0], c.march.path[1]], legMiles: c.march.legMiles, path: c.owner === slotIdx ? c.march.path : undefined } : null,
    strength: forcePoints(c.regiments),
    regiments: c.owner === slotIdx ? c.regiments : undefined,
    dayRate: c.owner === slotIdx ? macroDayRate(c.regiments) : undefined,
    inSupply: c.owner === slotIdx ? mySupply.has(macroColumnAnchor(c)) : undefined,
    general: (() => {
      const g = (game.factionSlots[c.owner]?.generals || []).find((x) => x.id === c.generalId);
      return g ? (c.owner === slotIdx ? { id: g.id, name: g.name, strategy: g.strategy } : { name: g.name }) : null;
    })(),
  });
  return {
    seed: game.macro.seed,
    nodes: game.macro.nodes,
    routes: game.macro.routes,
    control: Object.fromEntries(Object.entries(game.macro.control).filter(([nid]) => observed(nid))),
    observed: revealAll ? game.macro.nodes.map((n) => n.id) : [...seen],
    supplied: slotIdx !== null ? [...mySupply].filter(observed) : [],
    bases: Object.entries(game.macro.bases || {})
      .filter(([slot, b]) => Number(slot) === slotIdx || observed(b.nodeId) || (b.march && (observed(b.march.path[0]) || observed(b.march.path[1]))))
      .map(([slot, b]) => ({ slot: Number(slot), nodeId: b.nodeId || null, march: Number(slot) === slotIdx && b.march ? { edge: [b.march.path[0], b.march.path[1]], legMiles: b.march.legMiles, path: b.march.path } : b.march ? { edge: [b.march.path[0], b.march.path[1]], legMiles: b.march.legMiles } : null })),
    columns: (game.macro.columns || [])
      .filter((c) => c.owner === slotIdx || (c.nodeId ? observed(c.nodeId) : observed(c.march.path[0]) || observed(c.march.path[1])))
      .map(columnView),
    settlementCount: macroSettlements(game.macro).length,
  };
}

// Doctrine-flavored greedy expansion (§10): plot idle columns at neutral
// settlements, muster a second column when the treasury allows
function macroNpcTurn(game, slotIdx) {
  const slot = game.factionSlots[slotIdx];
  const macro = game.macro;
  const myColumns = (macro.columns || []).filter((c) => c.owner === slotIdx);
  const targeted = new Set(myColumns.filter((c) => c.march).map((c) => c.march.path[c.march.path.length - 1]));
  for (const column of myColumns) {
    if (column.march || !column.nodeId) continue;
    const rate = macroDayRate(column.regiments);
    if (!rate) continue;
    const candidates = macroSettlements(macro)
      .filter((n) => macro.control[n.id] !== slotIdx && !targeted.has(n.id))
      .filter((n) => !macroBlockedAgainst(game, n.id, slotIdx));
    let best = null;
    for (const n of candidates) {
      const found = macroFindPath(macro, column.nodeId, n.id, rate);
      if (!found) continue;
      const yieldScore = Object.values(MACRO_SETTLEMENT_YIELD[n.kind] || {}).reduce((s, v) => s + v, 0);
      const score = slot.doctrine === 'economic' ? found.totalDays - yieldScore : found.totalDays;
      if (!best || score < best.score) best = { node: n, found, score };
    }
    if (best) {
      column.march = { path: best.found.path, legMiles: 0 };
      targeted.add(best.node.id);
    }
  }
  const treasury = getTreasury(game, slotIdx);
  if (myColumns.length < 3) {
    const cost = { manpower: 2 * (UNITS.riflemen.cost.manpower || 0), steel: 2 * (UNITS.riflemen.cost.steel || 0) };
    const base = macro.bases?.[String(slotIdx)];
    if (base?.nodeId && canAfford(treasury, cost)) {
      pay(treasury, cost);
      slot.armiesRaised = (slot.armiesRaised || 0) + 1;
      macro.columns.push({
        id: genId(), owner: slotIdx, generalId: null, battles: 0,
        name: `${ARMY_ORDINALS[Math.min((slot.armiesRaised || 1) - 1, 8)]} Column`,
        regiments: { riflemen: 2 }, nodeId: base.nodeId,
      });
    }
  }
}

// Spawn cities: greedy max-min spread over march-day distances
function macroSpawnCities(macro, count) {
  const cities = macro.nodes.filter((n) => n.kind === 'city');
  const pool = cities.length >= count ? cities : macroSettlements(macro);
  const dist = (a, b) => macroFindPath(macro, a.id, b.id, 16)?.totalDays ?? Infinity;
  const picked = [pool[0]];
  while (picked.length < count) {
    let best = null;
    for (const cand of pool) {
      if (picked.includes(cand)) continue;
      const minD = Math.min(...picked.map((p) => dist(cand, p)));
      if (minD === Infinity) continue;
      if (!best || minD > best.minD) best = { cand, minD };
    }
    if (!best) break;
    picked.push(best.cand);
  }
  return picked;
}

// Mass battle on the graph (slice M2): a deliberate assault from an adjacent
// node. All defending columns fold into one force under their best general —
// same absorption rule as hex zone defense. Committed defenders leave the
// roster until the outcome; the existing round engine runs unchanged.
function macroCreateBattle(game, slotIdx, column, nodeId) {
  const node = macroNode(game.macro, nodeId);
  const weather = game.weather || 'clear';
  const attSlotObj = game.factionSlots[slotIdx];
  const defenders = macroColumnsAt(game, nodeId).filter((c) => c.owner !== slotIdx);
  const defSlotIdx = defenders[0].owner;
  const defSlotObj = game.factionSlots[defSlotIdx];
  if (defSlotObj?.isNPC) shiftDisposition(game, defSlotIdx, slotIdx, -8);

  const defUnits = {};
  let defGeneral = null;
  let defVetBattles = 0;
  const absorbed = [];
  for (const c of defenders) {
    for (const k of MACRO_COLUMN_KEYS) defUnits[k] = (defUnits[k] || 0) + (c.regiments[k] || 0);
    defVetBattles = Math.max(defVetBattles, c.battles || 0);
    const g = (defSlotObj.generals || []).find((x) => x.id === c.generalId);
    if (g && (!defGeneral || g.strategy > defGeneral.strategy)) defGeneral = g;
    absorbed.push({ owner: c.owner, generalId: c.generalId, name: c.name, id: c.id });
  }

  const attGeneral = (attSlotObj.generals || []).find((g) => g.id === column.generalId) || { name: 'Field Officer', strategy: 9, leadership: 9 };
  const attTrait = traitByKey(attGeneral.trait);
  const defTrait = traitByKey(defGeneral?.trait);
  const attRank = armyRank(column.battles || 0);
  const defRank = armyRank(defVetBattles);

  game.activeBattle = {
    id: genId(), worldModel: 'macro', tileId: null, tileName: node.name,
    macro: { nodeId, fromNodeId: column.nodeId, attackerColumnId: column.id, defVetBattles },
    attacker: {
      slot: slotIdx, armyId: column.id, armyName: column.name, generalName: attGeneral.name, generalId: attGeneral.id || null,
      strategy: attGeneral.strategy, units: { ...column.regiments }, morale: 100, choice: null, nextBonus: 0, losses: 0,
      signature: attTrait?.signature || null, sigCooldown: 0, vetBonus: attRank.bonus, rank: attRank.label,
      vehicle: vehicleOf(attGeneral),
      supplyPenalty: 0,
      weatherPenalty: weather === 'rain' || weather === 'snow' ? -1 : 0,
      elevMod: 0,
      design: null,
    },
    defender: {
      slot: defSlotIdx, absorbedArmies: absorbed,
      generalName: defGeneral ? defGeneral.name : 'Column Commander',
      strategy: defGeneral ? defGeneral.strategy : 9,
      units: defUnits, morale: 100, fortBonus: 0, terrainBonus: 0,
      generalId: defGeneral?.id || null,
      signature: defTrait?.signature || null, sigCooldown: 0, vetBonus: defRank.bonus, rank: defRank.label,
      vehicle: vehicleOf(defGeneral),
      supplyPenalty: 0,
      weatherPenalty: weather === 'fog' ? -1 : 0,
      design: null,
      choice: null, nextBonus: 0, losses: 0,
      interactive: defenderIsLive(game, defSlotObj),
    },
    round: 1,
    terrain: null,
    weather,
    log: [`The ${column.name} under ${attGeneral.name} assaults ${node.name}.`],
  };
  const attVeh = vehicleOf(attGeneral), defVeh = vehicleOf(defGeneral);
  if (attVeh) game.activeBattle.log.push(`${attGeneral.name} directs the assault from the ${attVeh.label}.`);
  if (defVeh) game.activeBattle.log.push(`${defGeneral.name} anchors the defense from the ${defVeh.label}.`);
  if (weather === 'rain') game.activeBattle.log.push('Driving rain turns the road to mud — the assault bogs down (attacker −1).');
  if (weather === 'fog') game.activeBattle.log.push('Heavy fog cloaks the assault columns — the defense fires blind (defender −1).');
  if (weather === 'snow') game.activeBattle.log.push('Deep snow drags at the assault columns (attacker −1).');
  game.macro.columns = game.macro.columns.filter((c) => !absorbed.some((x) => x.id === c.id));
  game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `Mass battle joined at ${node.name}.` });
}

// Apply a finished macro battle's outcome to columns and control; returns the
// outcome label. The shared finishBattle tail (honors, archive) runs after.
function macroApplyBattleOutcome(game, b, attackerWon) {
  const node = macroNode(game.macro, b.macro.nodeId);
  const attSlotObj = game.factionSlots[b.attacker.slot];
  const defSlotObj = game.factionSlots[b.defender.slot];
  const column = (game.macro.columns || []).find((c) => c.id === b.macro.attackerColumnId);
  if (attackerWon) {
    for (const dead of b.defender.absorbedArmies || []) generalFate(game, dead);
    if (column) {
      column.regiments = b.attacker.units;
      column.battles = (column.battles || 0) + 1;
      column.nodeId = b.macro.nodeId;
      delete column.march;
    }
    creditVictory(game, b.attacker.slot, column?.generalId);
    game.macro.control[b.macro.nodeId] = b.attacker.slot;
    const yieldKeys = Object.keys(MACRO_SETTLEMENT_YIELD[node?.kind] || {});
    game.combatLog.push({
      turn: game.turnNumber, type: 'capture', faction: attSlotObj.factionName, tileName: b.tileName,
      from: defSlotObj.factionName,
      resource: yieldKeys[0] || 'manpower', amount: (MACRO_SETTLEMENT_YIELD[node?.kind] || {})[yieldKeys[0]] || 1,
      bonus: null, buildings: [], isCapital: false,
    });
    return 'captured';
  }
  creditVictory(game, b.defender.slot, b.defender.generalId);
  if (totalUnits(b.defender.units) > 0) {
    // The defense reforms as a single column under its commanding general
    game.macro.columns.push({
      id: genId(), owner: b.defender.slot, generalId: b.defender.generalId || null,
      battles: (b.macro.defVetBattles || 0) + 1,
      name: (b.defender.absorbedArmies || [])[0]?.name || 'Defense Column',
      regiments: Object.fromEntries(MACRO_COLUMN_KEYS.map((k) => [k, b.defender.units[k] || 0])),
      nodeId: b.macro.nodeId,
    });
  }
  if (totalUnits(b.attacker.units) > 0 && column) {
    column.regiments = b.attacker.units; // routed survivors hold at the staging node
    column.battles = (column.battles || 0) + 1;
    return 'retreated';
  }
  if (column) {
    game.macro.columns = game.macro.columns.filter((c) => c.id !== column.id);
    generalFate(game, column);
  }
  return 'repelled';
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
    for (const a of game.armies || []) {
      if (a.owner === slotIdx) {
        visible.add(a.tileId);
        const tile = game.tiles.find((t) => t.id === a.tileId);
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

    // Action registries. Handlers are registered as they are declared below and
    // dispatched at the end. PREGAME actions run before a game is loaded;
    // GAME_ACTIONS run against the fetched `game`. null-prototype so unknown or
    // inherited keys ("toString", …) can never resolve to a handler.
    const PREGAME = Object.create(null);
    const GAME_ACTIONS = Object.create(null);

    // ----- listMyGames -----
    PREGAME.listMyGames = async () => {
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
    PREGAME.createGame = async () => {
      const { name, mode = 'multiplayer', mapId, mapData, factionId, humanCount = 2, npcConfigs = [], campaignWinCondition, planetId, worldModel = 'hex' } = body;
      let tiles = [];
      let mapPlanet = null;
      if (worldModel === 'macro') {
        // Macro operations fight on the planet's node-and-route graph — no hex map
      } else if (mapId) {
        const m = await svc.entities.GameMap.get(mapId);
        tiles = m.tiles;
        mapPlanet = m.planetId || null;
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

      const chosenPlanet = planetId || mapPlanet || 'cindara';
      const game = await svc.entities.Game.create({
        name: name || 'Unnamed Front', mode, status: 'lobby', mapId: mapId || null, tiles,
        planetId: chosenPlanet,
        worldModel,
        macro: worldModel === 'macro' ? { ...macroGenerateWorld(chosenPlanet), control: {}, bases: {}, columns: [] } : null,
        factionSlots: slots, turnOrder: slots.map((s) => s.slotIndex), currentTurnIndex: 0,
        turnNumber: 1, territoryStates: {}, treasuries: {}, combatLog: [],
        campaignWinCondition: campaignWinCondition || {}, hostUserId: user.id,
      });
      return Response.json({ gameId: game.id });
    }

    // Dispatch pre-game actions (they must not require a loaded game).
    if (PREGAME[action]) return await PREGAME[action]();

    // All remaining actions operate on an existing game
    const game = await svc.entities.Game.get(body.gameId);
    if (!game) return Response.json({ error: 'Game not found' }, { status: 404 });
    const mySlotObj = (game.factionSlots || []).find((s) => s.userId === user.id);
    const mySlot = mySlotObj ? mySlotObj.slotIndex : null;

    // ----- getState -----
    GAME_ACTIONS.getState = async () => {
      const currentSlotIdx = game.turnOrder?.[game.currentTurnIndex];
      const active = game.status === 'active';
      // Presence heartbeat — drives live vs auto battle defense
      if (mySlot !== null && active) {
        game.lastSeen = game.lastSeen || {};
        const prev = Date.parse(game.lastSeen[user.id] || '') || 0;
        if (Date.now() - prev > 20000) {
          game.lastSeen[user.id] = new Date().toISOString();
          await svc.entities.Game.update(game.id, { lastSeen: game.lastSeen });
        }
      }
      const mySupplied = mySlot !== null && active ? computeSupply(game, mySlot) : new Set();
      const tilesOut = visibleStateFor(game, mySlot);
      const visibleTileIds = new Set(tilesOut.filter((t) => t.visible !== false).map((t) => t.id));
      const ab = game.activeBattle;
      let battle = null;
      if (ab) {
        const defOwnerObj = ab.defender.slot !== null && ab.defender.slot !== undefined ? game.factionSlots[ab.defender.slot] : null;
        const myRole = game.factionSlots[ab.attacker.slot]?.userId === user.id ? 'attacker' : defOwnerObj?.userId === user.id ? 'defender' : null;
        if (myRole) {
          const sideView = (s, fac) => ({ faction: fac, general: s.generalName, strategy: s.strategy, units: s.units, morale: Math.max(s.morale, 0), losses: s.losses, chosen: !!s.choice, signature: s.signature || null, sigCooldown: s.sigCooldown || 0, vetBonus: s.vetBonus || 0, rank: s.rank || null, elevMod: s.elevMod || 0, design: s.design?.name || null, vehicle: s.vehicle ? { label: s.vehicle.label, effect: s.vehicle.effect, mods: s.vehicle.mods || [] } : null });
          battle = {
            tileName: ab.tileName, round: ab.round, myRole, terrain: ab.terrain || null, weather: ab.weather || 'clear', terrainBonus: ab.defender.terrainBonus || 0,
            attacker: sideView(ab.attacker, game.factionSlots[ab.attacker.slot]?.factionName),
            defender: sideView(ab.defender, defOwnerObj ? defOwnerObj.factionName : 'Neutral Garrison'),
            fortBonus: ab.defender.fortBonus,
            log: ab.log.slice(-14),
            waitingOnMe: !(myRole === 'attacker' ? ab.attacker : ab.defender).choice,
          };
        }
      }
      return Response.json({
        armies: (game.armies || []).filter((a) => a.owner === mySlot || visibleTileIds.has(a.tileId)).map((a) => {
          const g = (game.factionSlots[a.owner].generals || []).find((x) => x.id === a.generalId);
          return {
            id: a.id, owner: a.owner, tileId: a.tileId, name: a.name,
            strength: forcePoints(a.regiments),
            battles: a.battles || 0, rank: armyRank(a.battles || 0).label,
            inSupply: a.owner === mySlot ? mySupplied.has(a.tileId) : undefined,
            design: a.design?.name || null,
            regiments: a.owner === mySlot ? a.regiments : undefined,
            vehicleDepot: a.owner === mySlot && active ? vehicleDepotAt(game, mySlot, a.tileId) : undefined,
            general: g ? (a.owner === mySlot ? { ...g, traitLabel: traitByKey(g.trait)?.label || null, vehicle: vehicleOf(g) } : { name: g.name }) : null,
          };
        }),
        myGenerals: (mySlotObj?.generals || []).map((g) => ({ ...g, traitLabel: traitByKey(g.trait)?.label || null, vehicle: vehicleOf(g) })),
        generalCost: RECRUIT_GENERAL_COST,
        battle,
        battleArchives: (game.battleArchives || []).filter((x) =>
          game.factionSlots[x.attackerSlot]?.userId === user.id ||
          (x.defenderSlot !== null && x.defenderSlot !== undefined && game.factionSlots[x.defenderSlot]?.userId === user.id)),
        battleReport: (() => {
          const lb = game.lastBattle;
          if (!lb) return null;
          const isParty = game.factionSlots[lb.attackerSlot]?.userId === user.id ||
            (lb.defenderSlot !== null && lb.defenderSlot !== undefined && game.factionSlots[lb.defenderSlot]?.userId === user.id);
          return isParty ? lb : null;
        })(),
        id: game.id, name: game.name, mode: game.mode, status: game.status,
        turnNumber: game.turnNumber, currentSlot: currentSlotIdx,
        weather: game.weather || 'clear',
        planetId: game.planetId || 'cindara',
        worldModel: game.worldModel || 'hex',
        macro: game.worldModel === 'macro' ? macroVisibleFor(game, mySlot) : null,
        isMyTurn: active && game.factionSlots?.[currentSlotIdx]?.userId === user.id,
        mySlot,
        myResources: mySlot !== null ? getTreasury(game, mySlot) : null,
        myProduction: mySlot !== null && active ? factionProduction(game, mySlot) : null,
        myArmyPoints: mySlot !== null && active ? armyPoints(game, mySlot) : 0,
        myArmyCap: mySlot !== null && active ? armyCap(game, mySlot) : 0,
        myLandControl: mySlot !== null && active ? Math.round(landControlPct(game, mySlot)) : 0,
        mapControlTarget: MAP_CONTROL_PCT,
        suppliedTiles: [...mySupplied],
        myCosts: mySlot !== null && active ? effectiveCosts(game, mySlot) : null,
        myResearch: mySlot !== null ? (mySlotObj.research || { focus: null, progress: {}, completed: [] }) : null,
        myUnlocks: mySlot !== null ? (mySlotObj.unlocks || []) : null,
        isHost: game.hostUserId === user.id,
        campaignWinCondition: game.campaignWinCondition,
        factions: (game.factionSlots || []).map((s) => ({
          slotIndex: s.slotIndex, factionName: s.factionName, isNPC: s.isNPC,
          doctrine: s.doctrine, color: s.color, eliminated: s.eliminated,
          isOpen: !s.isNPC && !s.userId, isMe: s.userId === user.id, traits: s.userId === user.id ? s.traits : undefined,
        })),
        tiles: tilesOut,
        combatLog: game.status === 'complete' ? (game.combatLog || []) : (game.combatLog || []).slice(-30),
        statHistory: game.statHistory || [],
        myBase: (() => {
          if (mySlot === null) return null;
          const base = ensureBase(game, game.factionSlots[mySlot]);
          if (!base) return null;
          const bt = game.tiles.find((t) => t.id === base.tileId);
          return {
            tileId: base.tileId, tileName: bt?.name || null, modules: base.modules || {},
            atGantry: gantryDepotAt(game, mySlot, base.tileId),
            inSupply: mySupplied.has(base.tileId),
            pendingRefits: base.pendingRefits || [],
            movedThisTurn: base.movedTurn === game.turnNumber,
            defense: 1 + (baseModule(base, 'armor')?.defense || 0),
            income: baseModule(base, 'industry')?.income || null,
            canMove: !!baseModule(base, 'engine'),
            allTerrain: !!baseModule(base, 'engine')?.allTerrain,
          };
        })(),
        bases: game.factionSlots.filter((s) => s.base && (s.slotIndex === mySlot || visibleTileIds.has(s.base.tileId))).map((s) => ({ slot: s.slotIndex, tileId: s.base.tileId, factionName: s.factionName, color: s.color })),
        diplomacy: mySlot !== null ? {
          stances: game.factionSlots.filter((s) => s.slotIndex !== mySlot).map((s) => {
            const rel = relationOf(game, mySlot, s.slotIndex);
            return {
              slot: s.slotIndex, factionName: s.factionName, isNPC: s.isNPC, eliminated: s.eliminated, color: s.color,
              status: rel ? rel.status : 'war', until: rel?.until ?? null,
              disposition: s.isNPC ? ((s.dispositions || {})[String(mySlot)] ?? 0) : null,
            };
          }),
          incoming: (game.diplomacy?.offers || []).filter((o) => o.to === mySlot),
          outgoing: (game.diplomacy?.offers || []).filter((o) => o.from === mySlot),
          accords: Object.entries(game.diplomacy?.relations || {})
            .filter(([, r]) => r.until === null || r.until === undefined || game.turnNumber < r.until)
            .map(([k, r]) => {
              const [a, b] = k.split('-').map(Number);
              return { aName: game.factionSlots[a]?.factionName, bName: game.factionSlots[b]?.factionName, status: r.status, since: r.since, until: r.until ?? null };
            }),
          trades: [...(game.diplomacy?.tradeLog || [])].slice(-8).reverse(),
        } : null,
        winnerSlot: game.winnerSlot,
        winnerName: game.winnerSlot !== undefined && game.winnerSlot !== null ? game.factionSlots?.[game.winnerSlot]?.factionName : null,
      });
    }

    // ----- joinGame -----
    GAME_ACTIONS.joinGame = async () => {
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
    GAME_ACTIONS.startGame = async () => {
      if (game.hostUserId !== user.id) return Response.json({ error: 'Only the host can start' }, { status: 403 });
      if (game.status !== 'lobby') return Response.json({ error: 'Game already started' }, { status: 400 });
      if (game.factionSlots.some((s) => !s.isNPC && !s.userId)) return Response.json({ error: 'Waiting for players to join' }, { status: 400 });

      if (game.worldModel === 'macro') {
        // Macro setup (docs/MACRO_ENGINE.md §9): spread spawn cities, anchor
        // bases, field one escort column per faction
        const spawns = macroSpawnCities(game.macro, game.factionSlots.length);
        if (spawns.length < game.factionSlots.length) return Response.json({ error: 'Not enough spawn settlements on this world' }, { status: 400 });
        game.factionSlots.forEach((slot, i) => {
          slot.mods = compileMods(slot.pointBuy);
          slot.research = { focus: null, progress: {}, completed: [] };
          slot.generals = slot.isNPC ? [] : [supremeCommander(slot)];
          slot.armiesRaised = 1;
          const spawn = spawns[i];
          game.macro.control[spawn.id] = slot.slotIndex;
          game.macro.bases[String(slot.slotIndex)] = { nodeId: spawn.id };
          game.macro.columns.push({
            id: genId(), owner: slot.slotIndex, battles: 0,
            generalId: slot.isNPC ? null : slot.generals[0].id,
            name: '1st Column',
            regiments: { ...MACRO_ESCORT }, nodeId: spawn.id,
          });
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
        game.weather = 'clear';
        game.territoryStates = {};
        game.armies = [];
        game.lastSeen = {};
        game.combatLog.push({ turn: 1, type: 'event', text: 'The long march begins — columns roll out from the spawn cities.' });
        collectIncome(game, game.turnOrder[0]);
        recordSnapshot(game);
        await svc.entities.Game.update(game.id, {
          status: 'active', weather: 'clear', factionSlots: game.factionSlots,
          macro: game.macro, territoryStates: {}, treasuries: game.treasuries,
          combatLog: game.combatLog, statHistory: game.statHistory, armies: [], lastSeen: {},
        });
        return Response.json({ ok: true });
      }

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
        slot.research = { focus: null, progress: {}, completed: [] };
        slot.generals = slot.isNPC ? [] : [supremeCommander(slot)];
        slot.armiesRaised = 0;
        const cap = capitals[i];
        slot.capitalTileId = cap.id;
        slot.base = { tileId: cap.id, modules: {}, movedTurn: 0 };
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
      game.weather = 'clear';
      game.territoryStates = states;
      game.armies = [];
      game.lastSeen = {};
      game.combatLog.push({ turn: 1, type: 'event', text: 'War has been declared. The front ignites.' });
      collectIncome(game, game.turnOrder[0]);
      recordSnapshot(game);

      await svc.entities.Game.update(game.id, {
        status: 'active', weather: 'clear', tiles: game.tiles, factionSlots: game.factionSlots,
        territoryStates: game.territoryStates, treasuries: game.treasuries, combatLog: game.combatLog,
        statHistory: game.statHistory, armies: [], lastSeen: {},
      });
      return Response.json({ ok: true });
    }

    // Ship the after-action summary to the master Google Sheet when a game just concluded
    const logIfComplete = async () => {
      if (game.status !== 'complete') return;
      if (!game.loggedToSheet) {
        try { await base44.functions.invoke('logGameToSheet', { gameId: game.id }); } catch { /* record-keeping must never block play */ }
      }
      if (!game.chronicleDocUrl) {
        try { await base44.functions.invoke('exportChronicleToDoc', { gameId: game.id }); } catch { /* record-keeping must never block play */ }
      }
    };

    // ----- In-turn actions -----
    const requireMyTurn = () => {
      if (game.status !== 'active') throw new Error('Game is not active');
      const cur = game.turnOrder[game.currentTurnIndex];
      if (game.factionSlots[cur]?.userId !== user.id) throw new Error('Not your turn');
      return cur;
    };

    GAME_ACTIONS.moveUnits = async () => {
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
      const weather = game.weather || 'clear';
      if (weather === 'rain' && !toTile.isSea && ROUGH_TERRAIN.includes(toTile.terrain)) return Response.json({ error: 'Driving rain has washed out the roads — mountains, highlands and marsh are impassable this turn' }, { status: 400 });
      for (const k of UNIT_KEYS) {
        const n = units[k] || 0;
        if (n <= 0) continue;
        if (weather === 'storm' && (k === 'fighter' || k === 'gunboat')) return Response.json({ error: 'The storm grounds aircraft and gunboats this turn' }, { status: 400 });
        if (weather === 'snow' && k === 'crawler') return Response.json({ error: 'Crawler engines freeze in the snowfall — armor cannot move this turn' }, { status: 400 });
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

    GAME_ACTIONS.build = async () => {
      const slotIdx = requireMyTurn();
      try {
        doBuild(game, slotIdx, body.tileId, body.buildingType);
      } catch (e) {
        return Response.json({ error: e.message }, { status: 400 });
      }
      await svc.entities.Game.update(game.id, { territoryStates: game.territoryStates, treasuries: game.treasuries });
      return Response.json({ ok: true, resources: getTreasury(game, slotIdx) });
    }

    GAME_ACTIONS.purchaseUnits = async () => {
      const slotIdx = requireMyTurn();
      const { tileId, units } = body;
      const st = game.territoryStates[tileId];
      const tile = game.tiles.find((t) => t.id === tileId);
      if (!tile || !st) return Response.json({ error: 'Invalid tile' }, { status: 400 });
      if (!tile.isSea && st.owner !== slotIdx) return Response.json({ error: 'You must place units on your own territory' }, { status: 400 });
      if (!tile.isSea && !computeSupply(game, slotIdx).has(tileId)) return Response.json({ error: 'Zone is cut off from supply — fresh units cannot reach it' }, { status: 400 });
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

    GAME_ACTIONS.attack = async () => {
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
      await logIfComplete();
      const report = [...game.combatLog].reverse().find((e) => e.type === 'combat') || null;
      return Response.json({ ok: true, outcome, report });
    }

    // ----- Mass combat: muster / march / battle -----
    const persistWar = () => svc.entities.Game.update(game.id, {
      territoryStates: game.territoryStates, treasuries: game.treasuries,
      factionSlots: game.factionSlots, armies: game.armies || [],
      combatLog: game.combatLog, activeBattle: game.activeBattle || null,
      lastBattle: game.lastBattle || null,
      battleArchives: game.battleArchives || [],
      diplomacy: game.diplomacy || null,
      macro: game.macro || null,
      status: game.status, winnerSlot: game.winnerSlot, statHistory: game.statHistory,
    });

    GAME_ACTIONS.musterArmy = async () => {
      const slotIdx = requireMyTurn();
      if (game.activeBattle) return Response.json({ error: 'Resolve the ongoing battle first' }, { status: 400 });
      const { tileId, regiments = {}, generalId } = body;
      const st = game.territoryStates[tileId];
      const tile = game.tiles.find((t) => t.id === tileId);
      if (!tile || !st || tile.isSea) return Response.json({ error: 'Invalid muster site' }, { status: 400 });
      if (st.owner !== slotIdx) return Response.json({ error: 'You must muster on your own territory' }, { status: 400 });
      if (!hasBuilding(st, 'barracks')) return Response.json({ error: 'Levying an army requires a completed Barracks' }, { status: 400 });
      let taken = 0;
      for (const k of ARMY_UNIT_KEYS) {
        const n = regiments[k] || 0;
        if (n < 0 || n > (st.units[k] || 0)) return Response.json({ error: 'Not enough garrisoned troops to levy' }, { status: 400 });
        taken += n;
      }
      if (taken === 0) return Response.json({ error: 'An army needs at least one company' }, { status: 400 });
      const slot = game.factionSlots[slotIdx];
      slot.generals = slot.generals || [];
      let general;
      if (generalId === 'recruit') {
        const treasury = getTreasury(game, slotIdx);
        if (!canAfford(treasury, RECRUIT_GENERAL_COST)) return Response.json({ error: 'Insufficient manpower to commission a general' }, { status: 400 });
        pay(treasury, RECRUIT_GENERAL_COST);
        general = randomGeneral();
        slot.generals.push(general);
      } else {
        general = freeGenerals(game, slot).find((g) => g.id === generalId);
        if (!general) return Response.json({ error: 'That general is unavailable' }, { status: 400 });
      }
      // Optional doctrine design — outfits the army for a resource surcharge
      let design = null;
      if (body.designId) {
        const rec = await svc.entities.ArmyDesign.get(body.designId).catch(() => null);
        if (!rec || rec.created_by_id !== user.id) return Response.json({ error: 'Army design not found' }, { status: 400 });
        design = compileDesign(rec);
        design.name = rec.name;
        const dTreasury = getTreasury(game, slotIdx);
        if (!canAfford(dTreasury, design.cost)) return Response.json({ error: 'Insufficient resources to outfit this design' }, { status: 400 });
        pay(dTreasury, design.cost);
      }
      for (const k of ARMY_UNIT_KEYS) st.units[k] = (st.units[k] || 0) - (regiments[k] || 0);
      game.armies = game.armies || [];
      slot.armiesRaised = (slot.armiesRaised || 0) + 1;
      const army = {
        id: genId(), owner: slotIdx, tileId,
        name: `${ARMY_ORDINALS[Math.min(slot.armiesRaised - 1, 8)]} Field Army`,
        generalId: general.id,
        battles: 0,
        design: design ? { name: design.name, skill: design.skill, dmgOut: design.dmgOut, dmgIn: design.dmgIn, moraleIn: design.moraleIn } : null,
        regiments: Object.fromEntries(ARMY_UNIT_KEYS.map((k) => [k, regiments[k] || 0])),
      };
      game.armies.push(army);
      game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${slot.factionName} levies the ${army.name} under ${general.name}.` });
      await persistWar();
      return Response.json({ ok: true, armyId: army.id, general });
    }

    GAME_ACTIONS.moveArmy = async () => {
      const slotIdx = requireMyTurn();
      if (game.activeBattle) return Response.json({ error: 'Resolve the ongoing battle first' }, { status: 400 });
      const { armyId, toTileId } = body;
      const army = (game.armies || []).find((a) => a.id === armyId && a.owner === slotIdx);
      if (!army) return Response.json({ error: 'Army not found' }, { status: 404 });
      const toSt = game.territoryStates[toTileId];
      const toTile = game.tiles.find((t) => t.id === toTileId);
      if (!toTile || !toSt) return Response.json({ error: 'Invalid destination' }, { status: 400 });
      if ((game.weather || 'clear') === 'rain' && !toTile.isSea && ROUGH_TERRAIN.includes(toTile.terrain)) return Response.json({ error: 'Driving rain has washed out the roads — rough terrain is impassable this turn' }, { status: 400 });
      if ((game.weather || 'clear') === 'snow' && (army.regiments.crawler || 0) > 0) return Response.json({ error: 'Snow chokes the fuel lines — armies fielding crawlers cannot march this turn' }, { status: 400 });
      if (toSt.owner === slotIdx) {
        if (toTile.isSea) return Response.json({ error: 'Field armies cannot enter sea zones' }, { status: 400 });
        const fromTile = game.tiles.find((t) => t.id === army.tileId);
        if (!fromTile.adjacentIds.includes(toTileId)) return Response.json({ error: 'Destination is not adjacent' }, { status: 400 });
        army.tileId = toTileId;
        await persistWar();
        return Response.json({ ok: true });
      }
      let result;
      try {
        result = createBattle(game, slotIdx, army, toTileId);
      } catch (e) {
        return Response.json({ error: e.message }, { status: 400 });
      }
      if (game.status !== 'active') recordSnapshot(game);
      await persistWar();
      await logIfComplete();
      return Response.json({ ok: true, ...result });
    }

    GAME_ACTIONS.disbandArmy = async () => {
      const slotIdx = requireMyTurn();
      if (game.activeBattle) return Response.json({ error: 'Resolve the ongoing battle first' }, { status: 400 });
      const army = (game.armies || []).find((a) => a.id === body.armyId && a.owner === slotIdx);
      if (!army) return Response.json({ error: 'Army not found' }, { status: 404 });
      const st = game.territoryStates[army.tileId];
      if (st.owner !== slotIdx) return Response.json({ error: 'An army can only disband on friendly soil' }, { status: 400 });
      for (const k of ARMY_UNIT_KEYS) st.units[k] = (st.units[k] || 0) + (army.regiments[k] || 0);
      game.armies = game.armies.filter((a) => a.id !== army.id);
      await persistWar();
      return Response.json({ ok: true });
    }

    // ----- Rearm & reinforce: feed garrison companies into a supplied field army -----
    GAME_ACTIONS.reinforceArmy = async () => {
      const slotIdx = requireMyTurn();
      if (game.activeBattle) return Response.json({ error: 'Resolve the ongoing battle first' }, { status: 400 });
      const { armyId, regiments = {} } = body;
      const army = (game.armies || []).find((a) => a.id === armyId && a.owner === slotIdx);
      if (!army) return Response.json({ error: 'Army not found' }, { status: 404 });
      const st = game.territoryStates[army.tileId];
      if (st.owner !== slotIdx) return Response.json({ error: 'Reinforcement requires friendly ground' }, { status: 400 });
      if (!computeSupply(game, slotIdx).has(army.tileId)) return Response.json({ error: 'This zone is cut off from supply — no reinforcements can reach the army' }, { status: 400 });
      let moved = 0;
      for (const k of ARMY_UNIT_KEYS) {
        const n = regiments[k] || 0;
        if (n < 0 || n > (st.units[k] || 0)) return Response.json({ error: 'Not enough garrisoned troops' }, { status: 400 });
        moved += n;
      }
      if (moved === 0) return Response.json({ error: 'No companies selected' }, { status: 400 });
      for (const k of ARMY_UNIT_KEYS) {
        st.units[k] = (st.units[k] || 0) - (regiments[k] || 0);
        army.regiments[k] = (army.regiments[k] || 0) + (regiments[k] || 0);
      }
      await persistWar();
      return Response.json({ ok: true });
    }

    GAME_ACTIONS.battleChoice = async () => {
      const b = game.activeBattle;
      if (!b) return Response.json({ error: 'No battle in progress' }, { status: 400 });
      const { maneuver } = body;
      if (!MANEUVERS[maneuver]) return Response.json({ error: 'Unknown maneuver' }, { status: 400 });
      const defSlotObj = b.defender.slot !== null && b.defender.slot !== undefined ? game.factionSlots[b.defender.slot] : null;
      const isAtt = game.factionSlots[b.attacker.slot]?.userId === user.id;
      const isDef = defSlotObj?.userId === user.id;
      if (!isAtt && !isDef) return Response.json({ error: 'You are not a party to this battle' }, { status: 403 });
      const side = isAtt ? b.attacker : b.defender;
      if (side.choice) return Response.json({ error: 'Orders already issued for this round' }, { status: 400 });
      if (MANEUVERS[maneuver].signature && side.signature !== maneuver) {
        return Response.json({ error: 'That signature maneuver is not available' }, { status: 400 });
      }
      if (MANEUVERS[maneuver].signature && (side.sigCooldown || 0) > 0) {
        return Response.json({ error: `Your signature maneuver is recovering — ${side.sigCooldown} round${side.sigCooldown === 1 ? '' : 's'} remaining` }, { status: 400 });
      }
      setChoice(side, maneuver);
      // Auto-command the defense when it is not live (NPC, neutral, or offline commander)
      if (b.attacker.choice && !b.defender.choice) {
        const live = b.defender.interactive && defenderIsLive(game, defSlotObj);
        if (!live) setChoice(b.defender, aiManeuver(b.defender, defSlotObj?.doctrine));
      }
      if (b.attacker.choice && b.defender.choice) resolveBattleRound(game, b);
      if (game.status !== 'active') recordSnapshot(game);
      await persistWar();
      await logIfComplete();
      return Response.json({ ok: true, resolved: !game.activeBattle });
    }

    // ----- Artillery bombardment: shell an adjacent enemy zone without risking troops -----
    GAME_ACTIONS.bombard = async () => {
      const slotIdx = requireMyTurn();
      if (game.activeBattle) return Response.json({ error: 'Resolve the ongoing battle first' }, { status: 400 });
      const { fromTileId, toTileId } = body;
      const fromSt = game.territoryStates[fromTileId];
      const toSt = game.territoryStates[toTileId];
      const fromTile = game.tiles.find((t) => t.id === fromTileId);
      const toTile = game.tiles.find((t) => t.id === toTileId);
      if (!fromTile || !toTile || !fromSt || !toSt) return Response.json({ error: 'Invalid tiles' }, { status: 400 });
      if (fromSt.owner !== slotIdx) return Response.json({ error: 'You do not control the firing zone' }, { status: 400 });
      if ((fromSt.units.artillery || 0) <= 0) return Response.json({ error: 'No artillery emplaced in this zone' }, { status: 400 });
      if (toSt.owner === slotIdx) return Response.json({ error: 'Cannot shell your own territory' }, { status: 400 });
      if (toTile.isSea) return Response.json({ error: 'Artillery cannot shell sea zones' }, { status: 400 });
      if (!fromTile.adjacentIds.includes(toTileId)) return Response.json({ error: 'Target zone is out of range' }, { status: 400 });
      if (toSt.owner !== null && toSt.owner !== undefined && atPeace(game, slotIdx, toSt.owner)) return Response.json({ error: 'A signed accord forbids shelling that faction' }, { status: 400 });
      if (fromSt.lastBombardTurn === game.turnNumber) return Response.json({ error: 'These guns have already fired this turn' }, { status: 400 });
      const treasury = getTreasury(game, slotIdx);
      if (!canAfford(treasury, { fuel: 1 })) return Response.json({ error: 'Insufficient fuel for a barrage' }, { status: 400 });
      pay(treasury, { fuel: 1 });
      fromSt.lastBombardTurn = game.turnNumber;
      if (toSt.owner !== null && toSt.owner !== undefined && game.factionSlots[toSt.owner]?.isNPC) shiftDisposition(game, toSt.owner, slotIdx, -5);
      // Each gun rolls — hits on 3 or less. Casualties only; bombardment never captures ground.
      let hits = 0;
      const hitOn = ((game.weather || 'clear') === 'rain' ? 2 : 3) + (elevOf(fromTile) > elevOf(toTile) ? 1 : 0);
      for (let i = 0; i < (fromSt.units.artillery || 0); i++) if (roll() <= hitOn) hits++;
      const destroyed = Math.min(hits, totalUnits(toSt.units));
      removeCasualties(toSt.units, destroyed);
      const attName = game.factionSlots[slotIdx].factionName;
      game.combatLog.push({
        turn: game.turnNumber, type: 'event',
        text: `${attName}'s artillery bombards ${toTile.name} — ${destroyed === 0 ? 'the shells fall wide' : `${destroyed} enemy compan${destroyed === 1 ? 'y is' : 'ies are'} destroyed`}.`,
      });
      await svc.entities.Game.update(game.id, { territoryStates: game.territoryStates, treasuries: game.treasuries, factionSlots: game.factionSlots, combatLog: game.combatLog });
      return Response.json({ ok: true, destroyed, resources: treasury });
    }

    // ----- Reconnaissance probe -----
    GAME_ACTIONS.probe = async () => {
      const slotIdx = requireMyTurn();
      if (game.activeBattle) return Response.json({ error: 'Resolve the ongoing battle first' }, { status: 400 });
      const tile = game.tiles.find((t) => t.id === body.tileId);
      const st = game.territoryStates[body.tileId];
      if (!tile || !st || tile.isSea) return Response.json({ error: 'Invalid probe target' }, { status: 400 });
      if (st.owner === slotIdx) return Response.json({ error: 'You already hold that zone' }, { status: 400 });
      const adjacent = tile.adjacentIds.some((aid) => game.territoryStates[aid]?.owner === slotIdx) ||
        (game.armies || []).some((a) => a.owner === slotIdx && tile.adjacentIds.includes(a.tileId));
      if (!adjacent) return Response.json({ error: 'Scouts can only probe zones adjacent to your lines' }, { status: 400 });
      const treasury = getTreasury(game, slotIdx);
      if (!canAfford(treasury, PROBE_COST)) return Response.json({ error: 'Insufficient fuel to mount a patrol' }, { status: 400 });
      pay(treasury, PROBE_COST);
      // Scouts bring back partial intel — each detail has a chance of being observed
      const seen = (p) => Math.random() < ((game.weather || 'clear') === 'fog' ? p * 0.5 : p);
      const garrison = {};
      for (const k of UNIT_KEYS) garrison[k] = seen(0.7) ? (st.units[k] || 0) : null;
      const armies = (game.armies || []).filter((a) => a.tileId === body.tileId && a.owner !== slotIdx).map((a) => {
        const g = (game.factionSlots[a.owner].generals || []).find((x) => x.id === a.generalId);
        return {
          name: a.name,
          regiments: Object.fromEntries(ARMY_UNIT_KEYS.map((k) => [k, seen(0.6) ? (a.regiments[k] || 0) : null])),
          rank: seen(0.7) ? armyRank(a.battles || 0).label : null,
          general: g ? {
            name: g.name,
            trait: seen(0.5) ? (traitByKey(g.trait)?.label || null) : null,
            strategy: seen(0.5) ? g.strategy : null,
          } : null,
        };
      });
      const intel = {
        tileName: tile.name, terrain: tile.terrain,
        owner: st.owner !== null && st.owner !== undefined ? game.factionSlots[st.owner].factionName : 'Neutral garrison',
        garrison,
        fortLevel: seen(0.7) ? fortLevel(st) : null,
        buildings: seen(0.6) ? activeBuildings(st).map((b) => b.type) : null,
        armies,
      };
      game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${game.factionSlots[slotIdx].factionName} scouts probe ${tile.name}.` });
      await svc.entities.Game.update(game.id, { treasuries: game.treasuries, combatLog: game.combatLog });
      return Response.json({ ok: true, intel, resources: treasury });
    }

    // ----- Command vehicle refits: equipment & trait-themed weapons -----
    GAME_ACTIONS.refitVehicle = async () => {
      const slotIdx = requireMyTurn();
      if (game.activeBattle) return Response.json({ error: 'Resolve the ongoing battle first' }, { status: 400 });
      const slot = game.factionSlots[slotIdx];
      const g = (slot.generals || []).find((x) => x.id === body.generalId);
      if (!g) return Response.json({ error: 'General not found' }, { status: 404 });
      const mod = VEHICLE_MODS[body.modKey];
      if (!mod) return Response.json({ error: 'Unknown modification' }, { status: 400 });
      if (mod.bay === 'weapon' && !g.supreme && mod.trait !== g.trait) return Response.json({ error: "That weapon does not fit this general's vehicle" }, { status: 400 });
      g.vehicleMods = g.vehicleMods || {};
      if (g.vehicleMods[mod.bay] === body.modKey) return Response.json({ error: 'That modification is already fitted' }, { status: 400 });
      if (g.pendingRefit) return Response.json({ error: 'A refit convoy is already en route to this vehicle' }, { status: 400 });
      // Locate the vehicle — with its army in the field, or at the fortress-base between commands
      const army = (game.armies || []).find((a) => a.owner === slotIdx && a.generalId === g.id);
      const tileId = army ? army.tileId : slot.base?.tileId;
      if (!tileId) return Response.json({ error: "The general's vehicle cannot be reached for refit" }, { status: 400 });
      const treasury = getTreasury(game, slotIdx);
      if (vehicleDepotAt(game, slotIdx, tileId)) {
        if (!canAfford(treasury, mod.cost)) return Response.json({ error: 'Insufficient resources for the refit' }, { status: 400 });
        pay(treasury, mod.cost);
        g.vehicleMods[mod.bay] = body.modKey;
        game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${g.name}'s command vehicle is refitted at the depot — ${mod.label} fitted to the ${mod.bay} bay.` });
      } else if (computeSupply(game, slotIdx).has(tileId)) {
        const cost = convoyCost(mod.cost);
        if (!canAfford(treasury, cost)) return Response.json({ error: 'Insufficient resources for the refit' }, { status: 400 });
        pay(treasury, cost);
        g.pendingRefit = { bay: mod.bay, modKey: body.modKey, readyTurn: game.turnNumber + 1 };
        game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `A refit convoy departs for ${g.name}'s command vehicle — the ${mod.label} arrives next turn.` });
      } else {
        return Response.json({ error: 'No depot in reach and the vehicle is cut off from supply — refits need a barracks, a foundry, the fortress-base, or an open supply route' }, { status: 400 });
      }
      await persistWar();
      return Response.json({ ok: true, resources: treasury });
    }

    // ----- Mobile fortress-base: module refits & the great treads -----
    GAME_ACTIONS.installModule = async () => {
      const slotIdx = requireMyTurn();
      const slot = game.factionSlots[slotIdx];
      const base = ensureBase(game, slot);
      if (!base) return Response.json({ error: 'Your fortress-base has been lost' }, { status: 400 });
      const mod = BASE_MODULES[body.moduleKey];
      if (!mod) return Response.json({ error: 'Unknown module' }, { status: 400 });
      if (mod.unlock && !(slot.unlocks || []).includes(body.moduleKey)) return Response.json({ error: 'That prototype has not been certified by your researchers' }, { status: 400 });
      base.modules = base.modules || {};
      if (base.modules[mod.slot] === body.moduleKey) return Response.json({ error: 'That module is already installed' }, { status: 400 });
      if ((base.pendingRefits || []).some((p) => p.slot === mod.slot)) return Response.json({ error: 'A convoy is already hauling a module for that bay' }, { status: 400 });
      const treasury = getTreasury(game, slotIdx);
      // Heavy modules need gantry cranes — otherwise they arrive by supply convoy (slower, 25% cheaper)
      if (gantryDepotAt(game, slotIdx, base.tileId)) {
        if (!canAfford(treasury, mod.cost)) return Response.json({ error: 'Insufficient resources for the refit' }, { status: 400 });
        pay(treasury, mod.cost);
        const old = base.modules[mod.slot];
        base.modules[mod.slot] = body.moduleKey;
        game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${slot.factionName}'s fortress-base is refitted under the gantry cranes — ${mod.label} ${old ? `replaces the ${BASE_MODULES[old]?.label || 'old fittings'}` : `installed in the ${mod.slot} bay`}.` });
      } else if (computeSupply(game, slotIdx).has(base.tileId)) {
        const cost = convoyCost(mod.cost);
        if (!canAfford(treasury, cost)) return Response.json({ error: 'Insufficient resources for the refit' }, { status: 400 });
        pay(treasury, cost);
        base.pendingRefits = base.pendingRefits || [];
        base.pendingRefits.push({ slot: mod.slot, moduleKey: body.moduleKey, readyTurn: game.turnNumber + 1 });
        game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${slot.factionName} dispatches a heavy convoy — the ${mod.label} will reach the fortress-base next turn.` });
      } else {
        return Response.json({ error: 'No gantry cranes here and the base is cut off from supply — refits require a capital, a level-2 Foundry, or an open supply route' }, { status: 400 });
      }
      await svc.entities.Game.update(game.id, { factionSlots: game.factionSlots, treasuries: game.treasuries, combatLog: game.combatLog });
      return Response.json({ ok: true, resources: treasury });
    }

    GAME_ACTIONS.moveBase = async () => {
      const slotIdx = requireMyTurn();
      if (game.activeBattle) return Response.json({ error: 'Resolve the ongoing battle first' }, { status: 400 });
      const slot = game.factionSlots[slotIdx];
      const base = ensureBase(game, slot);
      if (!base) return Response.json({ error: 'Your fortress-base has been lost' }, { status: 400 });
      const engine = baseModule(base, 'engine');
      if (!engine) return Response.json({ error: 'The base has no engine module — install Crawler Drives to get it moving' }, { status: 400 });
      if (base.movedTurn === game.turnNumber) return Response.json({ error: 'The great treads have already ground forward this turn' }, { status: 400 });
      const fromTile = game.tiles.find((t) => t.id === base.tileId);
      const toTile = game.tiles.find((t) => t.id === body.toTileId);
      const toSt = game.territoryStates[body.toTileId];
      if (!toTile || !toSt || toTile.isSea) return Response.json({ error: 'Invalid destination' }, { status: 400 });
      if (!fromTile?.adjacentIds?.includes(body.toTileId)) return Response.json({ error: 'The base can only crawl one zone per turn' }, { status: 400 });
      if (toSt.owner !== slotIdx) return Response.json({ error: 'The base can only move through territory you control' }, { status: 400 });
      if (ROUGH_TERRAIN.includes(toTile.terrain) && !engine.allTerrain) return Response.json({ error: 'That ground is too rough — only Leviathan Turbines can cross it' }, { status: 400 });
      if ((game.weather || 'clear') === 'snow') return Response.json({ error: 'The great engines freeze in the snowfall — the base cannot move this turn' }, { status: 400 });
      const treasury = getTreasury(game, slotIdx);
      const marchCost = { fuel: engine.moveCost || BASE_MOVE_COST.fuel };
      if (!canAfford(treasury, marchCost)) return Response.json({ error: 'Insufficient fuel to fire the great engines' }, { status: 400 });
      pay(treasury, marchCost);
      base.tileId = body.toTileId;
      base.movedTurn = game.turnNumber;
      game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${slot.factionName}'s fortress-base grinds into ${toTile.name}.` });
      await svc.entities.Game.update(game.id, { factionSlots: game.factionSlots, treasuries: game.treasuries, combatLog: game.combatLog });
      return Response.json({ ok: true, resources: treasury });
    }

    // ----- Diplomacy: envoys, accords & the war market -----
    GAME_ACTIONS.proposeDiplomacy = async () => {
      const slotIdx = requireMyTurn();
      const { targetSlot, kind, give = {}, want = {} } = body;
      const target = game.factionSlots[targetSlot];
      if (!target || targetSlot === slotIdx || target.eliminated) return Response.json({ error: 'Invalid faction' }, { status: 400 });
      if (!['truce', 'nap', 'trade'].includes(kind)) return Response.json({ error: 'Unknown proposal' }, { status: 400 });
      const dip = getDiplo(game);
      if (kind !== 'trade' && atPeace(game, slotIdx, targetSlot)) return Response.json({ error: 'An accord already stands with that faction' }, { status: 400 });
      const lpKey = `${slotIdx}>${targetSlot}`;
      if (dip.lastProposal[lpKey] === game.turnNumber) return Response.json({ error: 'Your envoy has already called on that faction this turn' }, { status: 400 });
      if (kind === 'trade') {
        for (const k of RESOURCE_KEYS) if ((give[k] || 0) < 0 || (want[k] || 0) < 0) return Response.json({ error: 'Invalid terms' }, { status: 400 });
        if (offerValue(give) === 0 && offerValue(want) === 0) return Response.json({ error: 'The envoy needs terms to carry' }, { status: 400 });
        if (!canAfford(getTreasury(game, slotIdx), give)) return Response.json({ error: 'You cannot cover what you offer' }, { status: 400 });
      }
      dip.lastProposal[lpKey] = game.turnNumber;
      const myName = game.factionSlots[slotIdx].factionName;
      const sealAccord = () => {
        dip.relations[relKey(slotIdx, targetSlot)] = { status: kind, since: game.turnNumber, until: game.turnNumber + PACT_DURATIONS[kind] };
        game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${myName} and ${target.factionName} sign a ${PACT_LABELS[kind]} — arms rest until turn ${game.turnNumber + PACT_DURATIONS[kind]}.` });
      };
      const executeTrade = () => {
        const mine = getTreasury(game, slotIdx);
        const theirs = getTreasury(game, targetSlot);
        pay(mine, give); pay(theirs, want);
        for (const k of RESOURCE_KEYS) { mine[k] = (mine[k] || 0) + (want[k] || 0); theirs[k] = (theirs[k] || 0) + (give[k] || 0); }
        dip.tradeLog = dip.tradeLog || [];
        dip.tradeLog.push({ turn: game.turnNumber, a: myName, b: target.factionName, give, want });
        if (dip.tradeLog.length > 20) dip.tradeLog.shift();
        game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${myName} and ${target.factionName} conclude an exchange of war materiel.` });
      };
      const persistDiplo = () => svc.entities.Game.update(game.id, {
        treasuries: game.treasuries, factionSlots: game.factionSlots, combatLog: game.combatLog, diplomacy: game.diplomacy,
      });
      if (target.isNPC) {
        // NPC envoys weigh the offer against their disposition toward you
        const d = (target.dispositions || {})[String(slotIdx)] || 0;
        let accepted;
        if (kind === 'truce') accepted = d >= -15;
        else if (kind === 'nap') accepted = d >= 10;
        else accepted = offerValue(give) > 0 && offerValue(give) >= offerValue(want) * 1.15 && canAfford(getTreasury(game, targetSlot), want);
        if (accepted) {
          if (kind === 'trade') executeTrade(); else sealAccord();
          shiftDisposition(game, targetSlot, slotIdx, kind === 'trade' ? 6 : 10);
        } else {
          shiftDisposition(game, targetSlot, slotIdx, -3);
          game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${target.factionName} turns ${myName}'s envoy away.` });
        }
        await persistDiplo();
        return Response.json({ ok: true, accepted });
      }
      dip.offers.push({ id: genId(), from: slotIdx, to: targetSlot, kind, give, want, turn: game.turnNumber });
      game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${myName} dispatches an envoy to ${target.factionName}.` });
      await persistDiplo();
      return Response.json({ ok: true, pending: true });
    }

    GAME_ACTIONS.respondDiplomacy = async () => {
      if (game.status !== 'active') return Response.json({ error: 'Game is not active' }, { status: 400 });
      if (mySlot === null) return Response.json({ error: 'You are not a party to this game' }, { status: 403 });
      const dip = getDiplo(game);
      const offer = dip.offers.find((o) => o.id === body.offerId);
      if (!offer || offer.to !== mySlot) return Response.json({ error: 'Offer not found' }, { status: 404 });
      dip.offers = dip.offers.filter((o) => o.id !== offer.id);
      const fromName = game.factionSlots[offer.from].factionName;
      const myName = game.factionSlots[mySlot].factionName;
      if (body.accept) {
        if (offer.kind === 'trade') {
          const fromT = getTreasury(game, offer.from);
          const myT = getTreasury(game, mySlot);
          if (!canAfford(fromT, offer.give) || !canAfford(myT, offer.want)) {
            await svc.entities.Game.update(game.id, { diplomacy: game.diplomacy });
            return Response.json({ error: 'One side can no longer cover the exchange — the offer is void' }, { status: 400 });
          }
          pay(fromT, offer.give); pay(myT, offer.want);
          for (const k of RESOURCE_KEYS) { fromT[k] = (fromT[k] || 0) + (offer.want[k] || 0); myT[k] = (myT[k] || 0) + (offer.give[k] || 0); }
          dip.tradeLog = dip.tradeLog || [];
          dip.tradeLog.push({ turn: game.turnNumber, a: fromName, b: myName, give: offer.give, want: offer.want });
          if (dip.tradeLog.length > 20) dip.tradeLog.shift();
          game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${myName} and ${fromName} conclude an exchange of war materiel.` });
        } else {
          dip.relations[relKey(offer.from, mySlot)] = { status: offer.kind, since: game.turnNumber, until: game.turnNumber + PACT_DURATIONS[offer.kind] };
          game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${myName} and ${fromName} sign a ${PACT_LABELS[offer.kind]} — arms rest until turn ${game.turnNumber + PACT_DURATIONS[offer.kind]}.` });
        }
      } else {
        game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${myName} declines ${fromName}'s proposal.` });
      }
      await svc.entities.Game.update(game.id, { treasuries: game.treasuries, combatLog: game.combatLog, diplomacy: game.diplomacy });
      return Response.json({ ok: true });
    }

    // ----- Macro operations (worldModel: 'macro' — docs/MACRO_ENGINE.md §5) -----
    const requireMacro = () => {
      if (game.worldModel !== 'macro') throw new Error('This is not a macro operation');
    };
    const persistMacro = () => svc.entities.Game.update(game.id, {
      macro: game.macro, treasuries: game.treasuries, factionSlots: game.factionSlots,
      combatLog: game.combatLog, status: game.status, winnerSlot: game.winnerSlot,
      statHistory: game.statHistory,
    });

    GAME_ACTIONS.macroPlotMarch = async () => {
      requireMacro();
      const slotIdx = requireMyTurn();
      const { columnId, toNodeId } = body;
      const column = (game.macro.columns || []).find((c) => c.id === columnId && c.owner === slotIdx);
      if (!column) return Response.json({ error: 'Column not found' }, { status: 404 });
      if (!macroNode(game.macro, toNodeId)) return Response.json({ error: 'Uncharted destination' }, { status: 400 });
      const rate = macroDayRate(column.regiments);
      if (!rate) return Response.json({ error: 'No ground elements — the column cannot march' }, { status: 400 });
      if (macroForeignBaseAt(game, toNodeId, slotIdx)) {
        return Response.json({ error: "A foreign fortress-base anchors that ground — boarding assaults await a later Field Amendment" }, { status: 400 });
      }
      if (macroColumnsAt(game, toNodeId).some((c) => c.owner !== slotIdx)) {
        return Response.json({ error: 'A foreign column holds that ground — march adjacent and order an assault' }, { status: 400 });
      }
      // Mid-leg redirects take effect from the node ahead (docs/MACRO_ENGINE.md §2)
      const from = column.nodeId || column.march.path[1];
      if (from === toNodeId) {
        if (column.nodeId) return Response.json({ error: 'The column is already there' }, { status: 400 });
        column.march.path = column.march.path.slice(0, 2); // finish the current leg, halt
        await persistMacro();
        return Response.json({ ok: true, etaDays: null });
      }
      const found = macroFindPath(game.macro, from, toNodeId, rate);
      if (!found) return Response.json({ error: 'No overland route reaches that objective' }, { status: 400 });
      if (column.nodeId) {
        column.march = { path: found.path, legMiles: 0 };
      } else {
        column.march = { path: [column.march.path[0], ...found.path], legMiles: column.march.legMiles };
      }
      await persistMacro();
      return Response.json({ ok: true, etaDays: Math.ceil(found.totalDays) });
    }

    GAME_ACTIONS.macroMoveBase = async () => {
      requireMacro();
      const slotIdx = requireMyTurn();
      const { toNodeId } = body;
      const b = game.macro.bases?.[String(slotIdx)];
      if (!b) return Response.json({ error: 'No fortress-base' }, { status: 404 });
      if (!macroNode(game.macro, toNodeId)) return Response.json({ error: 'Uncharted destination' }, { status: 400 });
      const from = b.nodeId || b.march?.path[1];
      if (from === toNodeId) return Response.json({ error: 'The base is already there' }, { status: 400 });
      if (macroForeignBaseAt(game, toNodeId, slotIdx) || macroColumnsAt(game, toNodeId).some((c) => c.owner !== slotIdx)) {
        return Response.json({ error: 'Foreign forces hold that ground — the base cannot roll into contested territory' }, { status: 400 });
      }
      const found = macroFindPath(game.macro, from, toNodeId, MACRO_BASE_DAY_RATE);
      if (!found) return Response.json({ error: 'No overland route reaches that ground' }, { status: 400 });
      if (b.nodeId) b.march = { path: found.path, legMiles: 0 };
      else b.march = { path: [b.march.path[0], ...found.path], legMiles: b.march.legMiles };
      delete b.nodeId;
      await persistMacro();
      return Response.json({ ok: true, etaDays: Math.ceil(found.totalDays) });
    }

    GAME_ACTIONS.macroEngage = async () => {
      requireMacro();
      const slotIdx = requireMyTurn();
      if (game.activeBattle) return Response.json({ error: 'A battle rages — resolve it first' }, { status: 400 });
      const { columnId, toNodeId } = body;
      const column = (game.macro.columns || []).find((c) => c.id === columnId && c.owner === slotIdx);
      if (!column) return Response.json({ error: 'Column not found' }, { status: 404 });
      if (!column.nodeId) return Response.json({ error: 'The column is on the road — it must halt before assaulting' }, { status: 400 });
      if (!macroRouteBetween(game.macro, column.nodeId, toNodeId)) return Response.json({ error: 'No route reaches that ground from the staging node' }, { status: 400 });
      if (macroForeignBaseAt(game, toNodeId, slotIdx)) {
        return Response.json({ error: "A foreign fortress-base anchors that ground — boarding assaults await a later Field Amendment" }, { status: 400 });
      }
      const defenders = macroColumnsAt(game, toNodeId).filter((c) => c.owner !== slotIdx);
      if (defenders.length === 0) return Response.json({ error: 'No foreign column holds that ground — march instead' }, { status: 400 });
      if (atPeace(game, slotIdx, defenders[0].owner)) return Response.json({ error: 'A signed accord forbids engaging that faction' }, { status: 400 });
      if (!macroDayRate(column.regiments)) return Response.json({ error: 'No ground elements — the column cannot assault' }, { status: 400 });
      delete column.march; // committed to the assault
      macroCreateBattle(game, slotIdx, column, toNodeId);
      await persistWar();
      return Response.json({ ok: true, battle: true });
    }

    GAME_ACTIONS.macroHalt = async () => {
      requireMacro();
      const slotIdx = requireMyTurn();
      const column = (game.macro.columns || []).find((c) => c.id === body.columnId && c.owner === slotIdx);
      if (!column) return Response.json({ error: 'Column not found' }, { status: 404 });
      if (!column.march) return Response.json({ error: 'The column is already halted' }, { status: 400 });
      if (column.nodeId) delete column.march;          // never departed — stand down in place
      else column.march.path = column.march.path.slice(0, 2); // finish the leg underway, then halt
      await persistMacro();
      return Response.json({ ok: true });
    }

    GAME_ACTIONS.macroMusterColumn = async () => {
      requireMacro();
      const slotIdx = requireMyTurn();
      const { nodeId, regiments = {}, generalId } = body;
      const node = macroNode(game.macro, nodeId);
      if (!node) return Response.json({ error: 'Uncharted muster site' }, { status: 400 });
      const isBaseNode = game.macro.bases?.[String(slotIdx)]?.nodeId === nodeId;
      if (game.macro.control[nodeId] !== slotIdx) return Response.json({ error: 'You must muster on ground you control' }, { status: 400 });
      if (node.kind !== 'city' && !isBaseNode) return Response.json({ error: 'Columns are levied at cities or the fortress-base' }, { status: 400 });
      const costs = effectiveCosts(game, slotIdx);
      const totalCost = emptyResources();
      let points = 0, companies = 0;
      for (const k of MACRO_COLUMN_KEYS) {
        const n = regiments[k] || 0;
        if (n < 0) return Response.json({ error: 'Invalid quantity' }, { status: 400 });
        companies += n;
        points += n * UNITS[k].points;
        for (const rk of RESOURCE_KEYS) totalCost[rk] += n * (costs[k][rk] || 0);
      }
      if (companies === 0) return Response.json({ error: 'A column needs at least one company' }, { status: 400 });
      const treasury = getTreasury(game, slotIdx);
      if (!canAfford(treasury, totalCost)) return Response.json({ error: 'Insufficient resources' }, { status: 400 });
      const cap = armyCap(game, slotIdx);
      if (armyPoints(game, slotIdx) + points > cap) {
        return Response.json({ error: `Army cap exceeded — ${cap} points max (take more settlements to raise it)` }, { status: 400 });
      }
      const slot = game.factionSlots[slotIdx];
      slot.generals = slot.generals || [];
      let general;
      if (generalId === 'recruit') {
        if (!canAfford(treasury, RECRUIT_GENERAL_COST)) return Response.json({ error: 'Insufficient manpower to commission a general' }, { status: 400 });
        pay(treasury, RECRUIT_GENERAL_COST);
        general = randomGeneral();
        slot.generals.push(general);
      } else {
        general = freeGenerals(game, slot).find((g) => g.id === generalId);
        if (!general) return Response.json({ error: 'That general is unavailable' }, { status: 400 });
      }
      pay(treasury, totalCost);
      slot.armiesRaised = (slot.armiesRaised || 0) + 1;
      const column = {
        id: genId(), owner: slotIdx, battles: 0, generalId: general.id,
        name: `${ARMY_ORDINALS[Math.min(slot.armiesRaised - 1, 8)]} Column`,
        regiments: Object.fromEntries(MACRO_COLUMN_KEYS.map((k) => [k, regiments[k] || 0])),
        nodeId,
      };
      game.macro.columns.push(column);
      game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${slot.factionName} levies the ${column.name} under ${general.name} at ${node.name}.` });
      await persistMacro();
      return Response.json({ ok: true, columnId: column.id, general });
    }

    GAME_ACTIONS.macroDisbandColumn = async () => {
      requireMacro();
      const slotIdx = requireMyTurn();
      const column = (game.macro.columns || []).find((c) => c.id === body.columnId && c.owner === slotIdx);
      if (!column) return Response.json({ error: 'Column not found' }, { status: 404 });
      if (!column.nodeId || game.macro.control[column.nodeId] !== slotIdx) {
        return Response.json({ error: 'Columns disband only at a controlled settlement' }, { status: 400 });
      }
      game.macro.columns = game.macro.columns.filter((c) => c.id !== column.id);
      game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${game.factionSlots[slotIdx].factionName}'s ${column.name} is dissolved at ${macroNode(game.macro, column.nodeId)?.name}.` });
      await persistMacro();
      return Response.json({ ok: true });
    }

    GAME_ACTIONS.endTurn = async () => {
      requireMyTurn();
      if (game.activeBattle) return Response.json({ error: 'A battle rages — resolve it before ending your turn' }, { status: 400 });
      checkCampaignWin(game);
      if (game.status === 'active') advanceTurn(game);
      if (game.status !== 'active') recordSnapshot(game);
      await svc.entities.Game.update(game.id, {
        territoryStates: game.territoryStates, factionSlots: game.factionSlots,
        treasuries: game.treasuries, combatLog: game.combatLog,
        currentTurnIndex: game.currentTurnIndex, turnNumber: game.turnNumber, weather: game.weather || 'clear',
        diplomacy: game.diplomacy || null,
        macro: game.macro || null,
        status: game.status, winnerSlot: game.winnerSlot, statHistory: game.statHistory,
      });
      await logIfComplete();
      return Response.json({ ok: true });
    }

    // Dispatch the game action registered above.
    const handler = GAME_ACTIONS[action];
    if (!handler) return Response.json({ error: 'Unknown action' }, { status: 400 });
    return await handler();
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});