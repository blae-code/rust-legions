import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// ---------- Rules definitions ----------
const RESOURCE_KEYS = ['manpower', 'steel', 'fuel'];

// ---------- Weather ----------
const WEATHER_TYPES = {
  clear: { label: 'Clear Skies', weight: 35 },
  rain: { label: 'Driving Rain', weight: 22 },
  fog: { label: 'Heavy Fog', weight: 18 },
  storm: { label: 'Thunderstorm', weight: 12 },
  snow: { label: 'Falling Snow', weight: 13 },
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

// ---------- Precursor relics (mirrors src/lib/relics.js) ----------
// Deep ruins hide Combine-age technology. Taking such a ruin excavates whatever
// lies under it; the find is permanent and folds into the faction's modifiers.
const RELICS = {
  cogitator_array: { label: 'Combine Cogitator Array', lore: 'A calculating engine that still hums. Staff work sharpens overnight.', mods: { capitalDefense: 1, unitStat: { riflemen: { defense: 1 } } } },
  pattern_dies: { label: 'Pattern Stamping Dies', lore: 'Original hull dies for a foundry line thought lost.', mods: { income: { steel: 1 } } },
  cracking_column: { label: 'Catalytic Cracking Column', lore: 'Pre-collapse refining plant, sealed and intact.', mods: { income: { fuel: 1 } } },
  census_vault: { label: 'The Census Vault', lore: 'Muster rolls of a dead age — and the settlements that still answer them.', mods: { income: { manpower: 1 }, armyCap: 10 } },
  reactive_lattice: { label: 'Reactive Armor Lattice', lore: 'Plate that hardens as it is struck. The crawler works cannot reproduce it.', mods: { unitStat: { crawler: { defense: 1 } } } },
  survey_engine: { label: 'Cartographic Survey Engine', lore: 'It charts routes no living quartermaster has walked.', mods: { supplyRange: 1 } },
  gun_lathes: { label: 'Precision Gun Lathes', lore: 'Barrels bored true to Combine tolerance.', mods: { unitStat: { riflemen: { attack: 1 }, crawler: { attack: 1 } } } },
};
const RELIC_KEYS = Object.keys(RELICS);

// Complete a matched set and the pieces work as their makers intended
const RELIC_SETS = {
  foundry_patrimony: {
    label: 'The Foundry Patrimony',
    members: ['pattern_dies', 'cracking_column', 'gun_lathes', 'reactive_lattice'],
    mods: { income: { steel: 2, fuel: 1 }, unitStat: { crawler: { attack: 1, defense: 1 } } },
  },
  administrative_codex: {
    label: 'The Administrative Codex',
    members: ['cogitator_array', 'census_vault', 'survey_engine'],
    mods: { income: { manpower: 2 }, armyCap: 15, supplyRange: 1 },
  },
};

// Seed dig sites into the deep ruins of a freshly started world
function seedRelics(game) {
  const ruins = game.macro.nodes.filter((n) => n.kind === 'ruin');
  const pool = [...RELIC_KEYS].sort(() => Math.random() - 0.5);
  const count = Math.min(ruins.length, Math.max(3, Math.round(ruins.length * 0.45)), pool.length);
  const picked = [...ruins].sort(() => Math.random() - 0.5).slice(0, count);
  game.macro.relics = {};
  picked.forEach((n, i) => { game.macro.relics[n.id] = { id: pool[i], foundBy: null, foundTurn: null }; });
}

// Taking ground over an undisturbed dig site excavates it
function excavateRelic(game, slotIdx, nodeId) {
  const site = (game.macro.relics || {})[nodeId];
  if (!site || site.foundBy !== null && site.foundBy !== undefined) return;
  const relic = RELICS[site.id];
  if (!relic) return;
  site.foundBy = slotIdx;
  site.foundTurn = game.turnNumber;
  const slot = game.factionSlots[slotIdx];
  slot.relics = slot.relics || [];
  slot.relics.push(site.id);
  if (!slot.mods) slot.mods = compileMods(slot.pointBuy);
  mergeMods(slot.mods, relic.mods);
  game.combatLog.push({
    turn: game.turnNumber, type: 'event',
    text: `${slot.factionName}'s engineers break the seals beneath ${macroNode(game.macro, nodeId)?.name} — the ${relic.label} is recovered. ${relic.lore}`,
  });

  // A matched set assembled: the pieces finally work as their makers intended
  slot.relicSets = slot.relicSets || [];
  for (const [setId, set] of Object.entries(RELIC_SETS)) {
    if (slot.relicSets.includes(setId)) continue;
    if (!set.members.every((m) => slot.relics.includes(m))) continue;
    slot.relicSets.push(setId);
    mergeMods(slot.mods, set.mods);
    game.combatLog.push({
      turn: game.turnNumber, type: 'event',
      text: `${slot.factionName} assembles ${set.label} — the recovered works are brought into concert, and the whole is greater than its parts.`,
    });
  }
}

// ---------- Neutral settlement lore & occupation crises (shared modules) ----------
import { settlementDossier, charterOptions, POLICY_COOLDOWN_DAYS, POLICY_LOG } from '../../shared/settlementLore.ts';
import {
  CRISES, rollCrisisId, crisisView, crisisOption, clampStability,
  STABILITY_START, STABILITY_REVOLT_BELOW, CRISIS_FESTER_STABILITY, CRISIS_CHANCE,
} from '../../shared/settlementCrisis.ts';

// The first faction into an unclaimed settlement surveys it: the history is
// recorded on the chart, and whatever stores remain are carted off.
function surveySettlement(game, slotIdx, nodeId) {
  const node = macroNode(game.macro, nodeId);
  if (!node || node.kind === 'crossroads') return;
  game.macro.dossiers = game.macro.dossiers || {};
  if (game.macro.dossiers[nodeId]) return;
  const d = settlementDossier(node);
  const slot = game.factionSlots[slotIdx];
  game.macro.dossiers[nodeId] = { ...d, foundBy: slotIdx, foundTurn: game.turnNumber, faction: slot.factionName };
  // The elders await terms — the commander must settle the charter before the
  // stores move (resolved via the macroResolveCharter action).
  game.macro.charters = game.macro.charters || [];
  game.macro.charters.push({ nodeId, slot: slotIdx, turn: game.turnNumber });
  game.combatLog.push({
    turn: game.turnNumber, type: 'event',
    text: `${slot.factionName}'s survey party files a dossier on ${node.name}: ${d.text} The elders await terms.`,
  });
  // NPC staffs settle terms on the spot, by doctrine
  if (slot.isNPC) {
    const entry = game.macro.charters.pop();
    applyCharter(game, entry, slot.doctrine === 'economic' ? 'autonomy' : slot.doctrine === 'defensive' ? 'levy' : 'requisition');
  }
}

function applyCharter(game, entry, choiceId) {
  const d = game.macro.dossiers?.[entry.nodeId];
  const node = macroNode(game.macro, entry.nodeId);
  if (!d) return 'The dossier is missing.';
  const [res, amt] = Object.entries(d.spoils || { manpower: 2 })[0];
  const t = getTreasury(game, entry.slot);
  let text;
  if (choiceId === 'requisition') {
    t[res] = (t[res] || 0) + amt * 2;
    text = `strips ${node?.name} to the rafters — +${amt * 2} ${res} hauled off.`;
  } else if (choiceId === 'levy') {
    t[res] = (t[res] || 0) + amt;
    t.manpower = (t.manpower || 0) + 3;
    text = `raises a levy at ${node?.name} — +${amt} ${res}, +3 manpower.`;
  } else {
    game.macro.charterBoost = game.macro.charterBoost || {};
    game.macro.charterBoost[entry.nodeId] = res;
    text = `signs a charter of autonomy with ${node?.name} — the settlement pledges +1 ${res} daily.`;
  }
  d.charter = choiceId;
  game.combatLog.push({
    turn: game.turnNumber, type: 'event',
    text: `${game.factionSlots[entry.slot]?.factionName} ${text}`,
  });
  return null;
}

// ---------- The Bazaar: barter with a settlement's populace ----------
// (mirrors src/lib/barter.js) Locals will swap stores with an occupying force,
// and will treat a gifted precursor relic as a civic treasure — the settlement
// pledges a standing tribute in return.
import { BARTER_COOLDOWN_DAYS, barterDeals } from '../../shared/barterDeals.ts';
const BARTER_PRIMARY = (kind) => Object.keys(MACRO_SETTLEMENT_YIELD[kind] || {})[0] || 'manpower';

// Relics inside an assembled set are never given away — breaking a set is not offered
function barterableRelics(slot) {
  const locked = new Set();
  for (const setId of slot.relicSets || []) for (const m of RELIC_SETS[setId]?.members || []) locked.add(m);
  return (slot.relics || []).filter((r) => !locked.has(r));
}

function negateMods(mods = {}) {
  const out = { unitStat: {}, income: {}, armyCap: -(mods.armyCap || 0), capitalDefense: -(mods.capitalDefense || 0), supplyRange: -(mods.supplyRange || 0) };
  for (const [u, stats] of Object.entries(mods.unitStat || {})) {
    out.unitStat[u] = {};
    for (const [s, v] of Object.entries(stats)) out.unitStat[u][s] = -v;
  }
  for (const k of RESOURCE_KEYS) out.income[k] = -((mods.income || {})[k] || 0);
  return out;
}

const MAP_CONTROL_PCT = 60;
// Stalemate prevention (War of Attrition)
const ATTRITION_TRIGGER_TURNS = 8;   // turns without a capture before attrition is declared
const ATTRITION_DEADLINE_TURNS = 10; // attrition turns before the war is decided on points
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





function factionProduction(game, slotIdx) {
  const out = emptyResources();
  for (const [nid, owner] of Object.entries(game.macro?.control || {})) {
    if (owner !== slotIdx) continue;
    const node = (game.macro?.nodes || []).find((n) => n.id === nid);
    const y = MACRO_SETTLEMENT_YIELD[node?.kind] || {};
    for (const k of RESOURCE_KEYS) out[k] += y[k] || 0;
    const boost = game.macro?.charterBoost?.[nid];
    if (boost) out[boost] += 1;
    // Standing tribute pledged at the bazaar
    const bz = game.macro?.bazaarBoost?.[nid];
    if (bz?.res) out[bz.res] += bz.amt || 0;
    // Standing accord with the local populace (integrate / trade / tax)
    const pol = game.macro?.policies?.[nid]?.policy;
    if (pol === 'integrate') out.manpower += 2;
    else if (pol === 'trade') { out.steel += 1; out.fuel += 1; }
    else if (pol === 'tax') {
      const primary = Object.keys(y)[0];
      if (primary) out[primary] += y[primary] || 0;
    }
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

// Daily settlement income (docs/MACRO_ENGINE.md §8)
function collectIncome(game, slotIdx) {
  return macroCollectIncome(game, slotIdx);
}
function landControlPct(game, slotIdx) {
  return macroControlPct(game, slotIdx);
}



// Map-control victory: hold >= 60% of land zones at the start of your turn
function checkMapControl(game) {
  if (game.status !== 'active') return;
  macroCheckWin(game);
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


function removeCasualties(units, n) {
  let left = n;
  for (const k of CASUALTY_ORDER) {
    while (left > 0 && (units[k] || 0) > 0) { units[k]--; left--; }
  }
}

// ---------- Generals & field armies (GURPS-style mass combat) ----------
const GENERAL_FIRST = ['Aldric', 'Vessa', 'Korin', 'Maren', 'Dain', 'Ottil', 'Ryske', 'Halvar', 'Ingrid', 'Casmir', 'Petra', 'Emeric'];
const GENERAL_LAST = ['Vance', 'Odt', 'Krael', 'Morvane', 'Stahl', 'Redgrave', 'Voss', 'Harrow', 'Calder', 'Brandt'];
const DOCTRINE_EPITHET = { aggressive: 'the Unrelenting', economic: 'the Provisioner', defensive: 'the Unbroken' };
const RECRUIT_GENERAL_COST = { manpower: 4 };


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


// General personality traits — each unlocks one signature maneuver
const GENERAL_TRAITS = [{ key: 'butcher', label: 'the Butcher', signature: 'relentless_pursuit' }, { key: 'fox', label: 'the Old Fox', signature: 'ambush' }, { key: 'bulwark', label: 'the Bulwark', signature: 'iron_wall' }, { key: 'firebrand', label: 'the Firebrand', signature: 'inspiring_charge' }];
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
const VETERANCY = [{ min: 5, label: 'Elite', bonus: 3 }, { min: 3, label: 'Veteran', bonus: 2 }, { min: 1, label: 'Seasoned', bonus: 1 }, { min: 0, label: 'Green', bonus: 0 }];
const armyRank = (battles = 0) => VETERANCY.find((v) => battles >= v.min);

// Thematic medals — awarded once per general when a battle milestone is reached
const MEDALS = { iron_hammer: { label: 'Order of the Iron Hammer', desc: 'Three consecutive victories' }, brass_star: { label: 'Brass Star of Command', desc: 'A decisive victory with minimal casualties' }, defiant_standard: { label: 'The Defiant Standard', desc: 'Victory against a superior force' }, marshals_cross: { label: "The Marshal's Cross", desc: 'Five career victories' } };

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


function battleSkill(side, other) {
  const m = MANEUVERS[side.choice];
  const ratio = Math.max(forcePoints(side.units), 1) / Math.max(forcePoints(other.units), 1);
  const strengthMod = Math.max(Math.min(Math.round(Math.log2(ratio) * 2), 4), -4);
  return side.strategy + m.skill + strengthMod + (side.fortBonus || 0) + (side.terrainBonus || 0) + (side.vetBonus || 0) + (side.nextBonus || 0) + (side.supplyPenalty || 0) + (side.weatherPenalty || 0) + (side.elevMod || 0) + ((side.design || {}).skill || 0) + ((side.vehicle || {}).skill || 0);
}

function finishBattle(game, b, attackerWon) {
  const attSlotObj = game.factionSlots[b.attacker.slot];
  const defSlotObj = b.defender.slot !== null ? game.factionSlots[b.defender.slot] : null;
  const outcome = macroApplyBattleOutcome(game, b, attackerWon);
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
  macroCheckWin(game); checkCampaignWin(game);
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
      macroAdvanceDay(game); // dawn resolution — all columns march
      tickCrises(game);      // occupation crises, stability & revolts
      tickAttrition(game);   // stalemate watchdog — declare/grind/resolve attrition
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
      macroNpcTurn(game, slotIdx);
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

const MACRO_ROUTE_QUALITY = { highway: 1.25, road: 1.0, track: 0.75, trail: 0.5, sealane: 0.6 };
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
const MACRO_CHART = { w: 1000, h: 620 };
const macroDist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const MACRO_NAME_PREFIX = ['Ash', 'Iron', 'Rust', 'Grey', 'Black', 'Pale', 'Cold', 'Dust', 'Slag', 'Tar', 'Bone', 'Cinder', 'Salt', 'Storm', 'Coal', 'Brass', 'Mire', 'Fen', 'Krael', 'Vost', 'Dead', 'Low', 'Red', 'Gaunt', 'Hollow'];
const MACRO_NAME_SUFFIX = ['fall', 'reach', 'moor', 'hold', 'gate', 'yard', 'haven', 'spur', 'cross', 'field', 'quay', 'ridge', 'hollow', 'works', 'barrow', 'march', 'point', 'deep', 'watch', 'stead'];
const MACRO_KIND_POOL = ['town', 'town', 'town', 'depot', 'depot', 'crossroads', 'crossroads', 'ruin', 'ruin', 'city'];
const macroMilesFor = (d) => Math.min(170, Math.max(30, Math.round(d * 1.1)));
const macroSeaMilesFor = (d) => Math.min(180, Math.max(60, Math.round(d * 0.9)));
const macroQualityFor = (d, rand) =>
  d < 55 ? (rand() < 0.35 ? 'highway' : 'road') : d < 95 ? (rand() < 0.5 ? 'road' : 'track') : d < 140 ? 'track' : 'trail';

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
const MACRO_CONTINENT_NODES = [['kesselgrad', 'Kesselgrad', 'city', 113, 135], ['ashvale', 'Ashvale', 'town', 178, 102], ['rustwater', 'Rustwater', 'city', 257, 95], ['ironmoor', 'Ironmoor', 'town', 351, 110], ['veldt_cross', 'Veldt Cross', 'crossroads', 156, 185], ['foundry_91', 'Foundry 91', 'depot', 228, 164], ['greyspire', 'Greyspire', 'city', 308, 171], ['pale_marsh', 'Pale Marsh', 'ruin', 390, 178], ['cinder_flats', 'Cinder Flats', 'depot', 117, 243], ['old_lorry', 'Old Lorry', 'town', 192, 236], ['saltglass', 'Saltglass', 'crossroads', 272, 228], ['verge', 'The Verge', 'city', 351, 243], ['thornfield', 'Thornfield', 'ruin', 167, 293], ['terminus', 'Terminus', 'city', 275, 297], ['black_quay', 'Black Quay', 'town', 380, 300]].map(([id, name, kind, x, y]) => ({ id, name, kind, x, y }));
const MACRO_CONTINENT_ROUTES = [['kesselgrad', 'ashvale', 42, 'road'], ['ashvale', 'rustwater', 48, 'highway'], ['rustwater', 'ironmoor', 55, 'highway'], ['kesselgrad', 'veldt_cross', 38, 'road'], ['ashvale', 'veldt_cross', 46, 'track'], ['veldt_cross', 'foundry_91', 40, 'road'], ['rustwater', 'foundry_91', 44, 'track'], ['foundry_91', 'greyspire', 46, 'road'], ['rustwater', 'greyspire', 52, 'road'], ['ironmoor', 'greyspire', 42, 'track'], ['ironmoor', 'pale_marsh', 46, 'trail'], ['greyspire', 'pale_marsh', 50, 'trail'], ['veldt_cross', 'cinder_flats', 40, 'track'], ['kesselgrad', 'cinder_flats', 62, 'trail'], ['veldt_cross', 'old_lorry', 36, 'road'], ['old_lorry', 'foundry_91', 44, 'track'], ['old_lorry', 'saltglass', 44, 'road'], ['foundry_91', 'saltglass', 42, 'track'], ['saltglass', 'greyspire', 38, 'road'], ['saltglass', 'verge', 46, 'highway'], ['greyspire', 'verge', 45, 'road'], ['verge', 'pale_marsh', 40, 'trail'], ['cinder_flats', 'thornfield', 42, 'trail'], ['old_lorry', 'thornfield', 38, 'track'], ['thornfield', 'terminus', 58, 'road'], ['saltglass', 'terminus', 40, 'road'], ['terminus', 'black_quay', 56, 'highway'], ['verge', 'black_quay', 38, 'road']];
const MACRO_WORLDS = {
  cindara: { seed: 1917, count: 45, clusters: 2, authored: true },
  veyra: { seed: 2044, count: 55, clusters: 3 },
  morhollow: { seed: 3121, count: 45, clusters: 2 },
};

// Coastline for one node cluster: sample directions around the centroid and
// push the coast out past the farthest settlement each way, with seeded noise,
// then smooth. The +55 margin keeps every node on dry land (CI-locked client-side).
function macroContinentOutline(nodes, rand) {
  const cx = nodes.reduce((s, n) => s + n.x, 0) / nodes.length;
  const cy = nodes.reduce((s, n) => s + n.y, 0) / nodes.length;
  const S = 28;
  const raw = [];
  for (let i = 0; i < S; i++) {
    const a = (i / S) * Math.PI * 2;
    const dx = Math.cos(a), dy = Math.sin(a);
    let r = 46;
    for (const n of nodes) {
      const proj = (n.x - cx) * dx + (n.y - cy) * dy;
      const perp = Math.abs(-(n.x - cx) * dy + (n.y - cy) * dx);
      if (perp < 110) r = Math.max(r, proj + 55 - perp * 0.2);
    }
    raw.push(r + rand() * 24);
  }
  const smooth = raw.map((r, i) => (raw[(i + S - 1) % S] + r * 2 + raw[(i + 1) % S]) / 4);
  return smooth.map((r, i) => {
    const a = (i / S) * Math.PI * 2;
    return [Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r)];
  });
}

// Group nodes into landmasses by proximity (< 170 chart units shares a continent)
function macroClusterNodes(nodes) {
  const parent = {};
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (const n of nodes) parent[n.id] = n.id;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (macroDist(nodes[i], nodes[j]) < 170) parent[find(nodes[i].id)] = find(nodes[j].id);
    }
  }
  const groups = new Map();
  for (const n of nodes) {
    const root = find(n.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(n);
  }
  return [...groups.values()];
}

// Build the full world from placed nodes (mirrors buildWorldFromNodes in
// src/lib/macro/worlds.js): cluster into continents, grow coastlines, lace
// missing land routes, bridge landmasses with Convoy Lanes. Also consumes
// map-builder charts (authored nodes + optional authored routes).
function macroBuildWorld(nodes, routes, seed) {
  const rand = macroMulberry32((seed || 1) ^ 0x5eed);
  const out = routes.map((r) => [...r]);
  const has = (a, b) => out.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const clusters = macroClusterNodes(nodes);

  for (const cluster of clusters) {
    for (const n of cluster) {
      const linked = out.filter(([a, b]) => a === n.id || b === n.id).length;
      if (linked >= 2) continue;
      const near = cluster.filter((o) => o !== n).map((o) => ({ o, d: macroDist(n, o) })).sort((a, b) => a.d - b.d);
      const links = 2 + (rand() < 0.35 ? 1 : 0);
      for (const { o, d } of near.slice(0, links)) {
        if (d > 190 || has(n.id, o.id)) continue;
        out.push([n.id, o.id, macroMilesFor(d), macroQualityFor(d, rand)]);
      }
    }
    const parent = {};
    const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    for (const n of cluster) parent[n.id] = n.id;
    const ids = new Set(cluster.map((n) => n.id));
    for (const [a, b] of out) if (ids.has(a) && ids.has(b)) parent[find(a)] = find(b);
    for (;;) {
      const comps = new Map();
      for (const n of cluster) {
        const root = find(n.id);
        if (!comps.has(root)) comps.set(root, []);
        comps.get(root).push(n);
      }
      if (comps.size <= 1) break;
      const [main, ...rest] = [...comps.values()].sort((a, b) => b.length - a.length);
      let best = null;
      for (const island of rest) for (const a of island) for (const b of main) {
        const d = macroDist(a, b);
        if (!best || d < best.d) best = { a, b, d };
      }
      out.push([best.a.id, best.b.id, macroMilesFor(best.d), best.d < 140 ? 'track' : 'trail']);
      parent[find(best.a.id)] = find(best.b.id);
    }
  }

  // Convoy Lanes: bridge continents by their closest coastal pair
  const cparent = clusters.map((_, i) => i);
  const cfind = (i) => (cparent[i] === i ? i : (cparent[i] = cfind(cparent[i])));
  for (;;) {
    const comps = new Set(clusters.map((_, i) => cfind(i)));
    if (comps.size <= 1) break;
    let best = null;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        if (cfind(i) === cfind(j)) continue;
        for (const a of clusters[i]) for (const b of clusters[j]) {
          const d = macroDist(a, b);
          if (!best || d < best.d) best = { a, b, d, i, j };
        }
      }
    }
    out.push([best.a.id, best.b.id, macroSeaMilesFor(best.d), 'sealane']);
    cparent[cfind(best.i)] = cfind(best.j);
  }

  const continents = clusters.map((cluster, i) => ({
    id: `land_${i}`,
    nodeIds: cluster.map((n) => n.id),
    outline: macroContinentOutline(cluster, rand),
  }));
  return { nodes, routes: out, continents, size: { ...MACRO_CHART } };
}

function macroGenerateWorld(worldId) {
  const spec = MACRO_WORLDS[worldId] || MACRO_WORLDS.cindara;
  const rand = macroMulberry32(spec.seed);
  const nodes = spec.authored ? MACRO_CONTINENT_NODES.map((n) => ({ ...n })) : [];
  const routes = spec.authored ? MACRO_CONTINENT_ROUTES.map((r) => [...r]) : [];
  const used = new Set(nodes.map((n) => n.name));
  const avoid = spec.authored
    ? { x: nodes.reduce((s, n) => s + n.x, 0) / nodes.length, y: nodes.reduce((s, n) => s + n.y, 0) / nodes.length }
    : null;

  const centers = [];
  let guard = 0;
  while (centers.length < spec.clusters && guard++ < 500) {
    const c = { x: 170 + rand() * (MACRO_CHART.w - 340), y: 140 + rand() * (MACRO_CHART.h - 280) };
    if (centers.every((o) => macroDist(c, o) > 330) && (!avoid || macroDist(c, avoid) > 330)) centers.push(c);
  }

  let serial = 0;
  centers.forEach((center, ci) => {
    const share = Math.ceil(spec.count / centers.length);
    let placed = 0, g = 0;
    while (placed < share && g++ < share * 50) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand()) * 135;
      const cand = {
        id: `w${spec.seed}_${ci}_${serial++}`,
        name: macroMakeName(rand, used),
        kind: MACRO_KIND_POOL[(rand() * MACRO_KIND_POOL.length) | 0],
        x: Math.round(Math.min(Math.max(center.x + Math.cos(a) * r, 45), MACRO_CHART.w - 45)),
        y: Math.round(Math.min(Math.max(center.y + Math.sin(a) * r, 45), MACRO_CHART.h - 45)),
      };
      if (nodes.every((n) => macroDist(n, cand) > 26)) { nodes.push(cand); placed++; }
      else used.delete(cand.name);
    }
  });

  return { seed: spec.seed, ...macroBuildWorld(nodes, routes, spec.seed) };
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

// Dijkstra over march-days for a given column pace. opts.landOnly excludes
// Convoy Lanes — the fortress-base cannot be shipped (boarding/naval is ahead).
function macroFindPath(macro, fromId, toId, dayRate, opts = {}) {
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
      if (opts.landOnly && quality === 'sealane') continue;
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

// Legacy fronts filed before the macro engine carry no chart — every reader
// below treats a missing chart as an empty theater rather than throwing.
const macroSettlements = (macro) => (macro?.nodes || []).filter((n) => n.kind !== 'crossroads');
const macroColumnsAt = (game, nodeId) => (game.macro?.columns || []).filter((c) => c.nodeId === nodeId);
const macroForeignBaseAt = (game, nodeId, slotIdx) =>
  Object.entries(game.macro?.bases || {}).some(([slot, b]) => Number(slot) !== slotIdx && b.nodeId === nodeId);
// A node blocks foreign movement when foreign columns hold it or a foreign
// fortress-base is anchored there (boarding assaults arrive in slice M5)
const macroBlockedAgainst = (game, nodeId, slotIdx) =>
  macroColumnsAt(game, nodeId).some((c) => c.owner !== slotIdx) || macroForeignBaseAt(game, nodeId, slotIdx);

// Supply envelope (§8): effective-mile reach from the fortress-base and any
// controlled fuel depot, flowing only through routes whose far node the faction
// controls or that stand neutral. Returns the Set of in-supply node ids.
function macroSupplied(game, slotIdx) {
  const macro = game.macro;
  if (!macro?.nodes) return new Set();
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
  const mine = settlements.filter((n) => game.macro.control?.[n.id] === slotIdx).length;
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
    const yieldKeys = Object.keys(MACRO_SETTLEMENT_YIELD[node.kind] || {});
    game.combatLog.push({
      turn: game.turnNumber, type: 'capture', faction: taker, tileName: node.name,
      from: prevOwner === null || prevOwner === undefined ? null : game.factionSlots[prevOwner]?.factionName || null,
      resource: yieldKeys[0] || null, amount: yieldKeys[0] ? (MACRO_SETTLEMENT_YIELD[node.kind] || {})[yieldKeys[0]] : 0,
      buildings: [], isCapital: false,
    });
    noteCapture(game);
    if (prevOwner === null || prevOwner === undefined) surveySettlement(game, column.owner, nodeId);
  }
  excavateRelic(game, column.owner, nodeId);
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

// ---------- Faction stability & occupation crises ----------
// Held settlements throw up trouble; the commander's answer moves stability.
// A protectorate that loses its grip starts shedding ground at dawn.
function getStability(slot) {
  if (typeof slot.stability !== 'number') slot.stability = STABILITY_START;
  return slot.stability;
}

// Apply a chosen response: pay, collect, and move stability
function resolveCrisis(game, entry, choiceId) {
  const opt = crisisOption(entry.crisisId, choiceId);
  if (!opt) return 'Unknown response';
  const slot = game.factionSlots[entry.slot];
  const t = getTreasury(game, entry.slot);
  if (opt.give && !canAfford(t, opt.give)) return 'You cannot cover that response';
  if (opt.give) pay(t, opt.give);
  for (const k of RESOURCE_KEYS) t[k] = (t[k] || 0) + ((opt.gain || {})[k] || 0);
  getStability(slot);
  slot.stability = clampStability(slot.stability + (opt.stability || 0));
  game.combatLog.push({
    turn: game.turnNumber, type: 'event',
    text: `${slot.factionName} answers the ${CRISES[entry.crisisId].title.toLowerCase()} at ${macroNode(game.macro, entry.nodeId)?.name} — ${opt.label.toLowerCase()}. Stability ${(opt.stability || 0) >= 0 ? '+' : ''}${opt.stability || 0} (now ${slot.stability}).`,
  });
  return null;
}

// Dawn: unanswered crises fester, new trouble surfaces, shaky ground revolts
function tickCrises(game) {
  if (game.status !== 'active' || !game.macro?.nodes) return;
  game.macro.crises = game.macro.crises || [];
  for (const slot of game.factionSlots) {
    if (slot.eliminated) continue;
    const idx = slot.slotIndex;
    getStability(slot);
    const held = game.macro.nodes.filter(
      (n) => game.macro.control[n.id] === idx && n.kind !== 'crossroads' && game.macro.dossiers?.[n.id]
    );
    const pending = game.macro.crises.find((c) => c.slot === idx);
    if (pending) {
      slot.stability = clampStability(slot.stability - CRISIS_FESTER_STABILITY);
      game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${slot.factionName} leaves the trouble at ${macroNode(game.macro, pending.nodeId)?.name} unanswered — stability slips to ${slot.stability}.` });
    } else if (held.length > 0 && Math.random() < CRISIS_CHANCE) {
      const node = held[Math.floor(Math.random() * held.length)];
      const crisisId = rollCrisisId(node.kind);
      const entry = { slot: idx, nodeId: node.id, crisisId, turn: game.turnNumber };
      if (slot.isNPC) resolveCrisis(game, entry, CRISES[crisisId].options[slot.doctrine === 'economic' ? 1 : 0].id);
      else {
        game.macro.crises.push(entry);
        game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${CRISES[crisisId].title} at ${node.name} — ${slot.factionName}'s staff awaits a ruling.` });
      }
    }
    // A protectorate losing its grip sheds ground
    if (slot.stability < STABILITY_REVOLT_BELOW && held.length > 0 && Math.random() < 0.35) {
      const lost = held[Math.floor(Math.random() * held.length)];
      if (game.macro.bases?.[String(idx)]?.nodeId !== lost.id && macroColumnsAt(game, lost.id).length === 0) {
        game.macro.control[lost.id] = null;
        slot.stability = clampStability(slot.stability + 6); // the grievance is spent with the ground
        game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${lost.name} throws off ${slot.factionName}'s administration — the flag comes down and the settlement stands alone.` });
      }
    }
  }
}

// ---------- Stalemate prevention: War of Attrition ----------
function getAttrition(game) {
  if (!game.attrition || typeof game.attrition !== 'object') {
    game.attrition = { lastCaptureTurn: game.turnNumber, active: false, since: null };
  }
  return game.attrition;
}

// Every settlement capture resets the clock — and lifts an active attrition
function noteCapture(game) {
  const at = getAttrition(game);
  at.lastCaptureTurn = game.turnNumber;
  if (at.active) {
    at.active = false;
    at.since = null;
    game.combatLog.push({ turn: game.turnNumber, type: 'event', text: 'Ground changes hands — the war of attrition is lifted; the Ministry stands down.' });
  }
}

// Dawn check: declare attrition after a captureless stretch; while active,
// every faction's strongest column bleeds a company daily, and at the deadline
// the war is decided on points (control %, tiebroken by army strength).
function tickAttrition(game) {
  if (game.status !== 'active') return;
  const at = getAttrition(game);
  if (!at.active) {
    if (game.turnNumber - (at.lastCaptureTurn || 1) >= ATTRITION_TRIGGER_TURNS) {
      at.active = true;
      at.since = game.turnNumber;
      game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `The front has frozen for ${ATTRITION_TRIGGER_TURNS} days — the Ministry declares a WAR OF ATTRITION. Take ground within ${ATTRITION_DEADLINE_TURNS} days or the war is decided on points.` });
    }
    return;
  }
  // The grind — attrition gnaws at every faction's strongest column
  for (const slot of game.factionSlots) {
    if (slot.eliminated) continue;
    const cols = (game.macro.columns || []).filter((c) => c.owner === slot.slotIndex && macroTotalCompanies(c) > 1);
    if (cols.length === 0) continue;
    const biggest = cols.reduce((a, b) => (macroTotalCompanies(b) > macroTotalCompanies(a) ? b : a));
    macroAttrit(biggest);
  }
  if (game.turnNumber >= at.since + ATTRITION_DEADLINE_TURNS) {
    let best = null;
    for (const slot of game.factionSlots) {
      if (slot.eliminated) continue;
      const score = macroControlPct(game, slot.slotIndex) * 1000 + armyPoints(game, slot.slotIndex);
      if (!best || score > best.score) best = { slot, score };
    }
    if (best) {
      game.status = 'complete';
      game.winnerSlot = best.slot.slotIndex;
      game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `The war of attrition runs its course — ${best.slot.factionName} holds the strongest position and is awarded the decision.` });
    }
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
    continents: game.macro.continents || [],
    size: game.macro.size || { ...MACRO_CHART },
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
    // Settlement dossiers filed by whoever first marched in
    dossiers: Object.entries(game.macro.dossiers || {})
      .filter(([nid]) => observed(nid))
      .map(([nid, d]) => ({ nodeId: nid, ...d })),
    // Standing accords with local populaces (only your own are legible)
    policies: Object.fromEntries(
      Object.entries(game.macro.policies || {}).filter(([nid]) => observed(nid) && game.macro.control[nid] === slotIdx)
    ),
    // Bazaar: standing tributes pledged, and when each market last traded
    bazaarBoost: Object.fromEntries(Object.entries(game.macro.bazaarBoost || {}).filter(([nid]) => observed(nid))),
    barters: Object.fromEntries(Object.entries(game.macro.barters || {}).filter(([nid]) => observed(nid))),
    barterCooldown: BARTER_COOLDOWN_DAYS,
    // Charters of autonomy standing on the chart
    charterBoost: Object.fromEntries(Object.entries(game.macro.charterBoost || {}).filter(([nid]) => observed(nid))),
    // Terms awaiting this commander at a freshly surveyed settlement
    charter: (() => {
      const e = (game.macro.charters || []).find((c) => c.slot === slotIdx);
      if (!e) return null;
      const d = game.macro.dossiers?.[e.nodeId];
      if (!d) return null;
      return { nodeId: e.nodeId, dossier: d, options: charterOptions(d) };
    })(),
    // Occupation crisis awaiting this commander's ruling
    crisis: (() => {
      const e = (game.macro.crises || []).find((c) => c.slot === slotIdx);
      return e ? crisisView(e, macroNode(game.macro, e.nodeId)?.name || 'the settlement') : null;
    })(),
    // Dig sites: an observed deep ruin shows survey traces; the find itself is
    // only named once someone has broken the seals.
    relicSites: Object.entries(game.macro.relics || {})
      .filter(([nid]) => observed(nid))
      .map(([nid, s]) => ({
        nodeId: nid,
        found: s.foundBy !== null && s.foundBy !== undefined,
        foundBy: s.foundBy ?? null,
        relic: s.foundBy !== null && s.foundBy !== undefined ? s.id : null,
      })),
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
    noteCapture(game);
    surveySettlement(game, b.attacker.slot, b.macro.nodeId); // no-ops if already on file
    excavateRelic(game, b.attacker.slot, b.macro.nodeId);
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

// ---------- End macro engine (harness marker) ----------

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
      const { name, mode = 'multiplayer', mapId, factionId, humanCount = 2, npcConfigs = [], campaignWinCondition, planetId } = body;
      // Every operation fights on the ministry chart. A charted map from the
      // Cartography Bureau supplies the settlements; otherwise the theater
      // world generates them. Either way macroBuildWorld grows the landmasses.
      let macroWorld = null;
      let mapPlanet = null;
      if (mapId) {
        const m = await svc.entities.GameMap.get(mapId).catch(() => null);
        if (!m || !(m.nodes || []).length) return Response.json({ error: 'That chart is not on file' }, { status: 400 });
        mapPlanet = m.planetId || null;
        macroWorld = { seed: 7, ...macroBuildWorld(m.nodes.map((n) => ({ ...n })), (m.routes || []).map((r) => [...r]), 7) };
      }
      const faction = factionId ? await svc.entities.Faction.get(factionId).catch(() => null) : null;
      if (!faction) return Response.json({ error: 'That faction is no longer on file — pick or forge another before mustering' }, { status: 404 });

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
        name: name || 'Unnamed Front', mode, status: 'lobby', mapId: mapId || null, tiles: [],
        planetId: chosenPlanet,
        worldModel: 'macro',
        macro: { ...(macroWorld || macroGenerateWorld(chosenPlanet)), control: {}, bases: {}, columns: [] },
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
    // Normalize the stored chart so every reader can trust its shape
    if (game.macro && typeof game.macro === 'object') {
      game.macro.control = game.macro.control || {};
      game.macro.bases = game.macro.bases || {};
      game.macro.columns = game.macro.columns || [];
    }
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
        attrition: (() => {
          const at = game.attrition || {};
          return {
            active: !!at.active,
            since: at.since ?? null,
            deadline: at.active ? at.since + ATTRITION_DEADLINE_TURNS : null,
            turnsSinceCapture: game.turnNumber - (at.lastCaptureTurn ?? game.turnNumber),
            triggerAt: ATTRITION_TRIGGER_TURNS,
          };
        })(),
        worldModel: 'macro',
        mapId: game.mapId || null,
        // Legacy fronts filed before the macro engine carry no chart — hand back
        // an empty theater instead of crashing the war room
        macro: game.macro?.nodes ? macroVisibleFor(game, mySlot) : { seed: 0, nodes: [], routes: [], continents: [], size: { ...MACRO_CHART }, control: {}, observed: [], supplied: [], bases: [], columns: [], settlementCount: 0 },
        isMyTurn: active && game.factionSlots?.[currentSlotIdx]?.userId === user.id,
        mySlot,
        myResources: mySlot !== null ? getTreasury(game, mySlot) : null,
        myProduction: mySlot !== null && active ? factionProduction(game, mySlot) : null,
        myArmyPoints: mySlot !== null && active ? armyPoints(game, mySlot) : 0,
        myArmyCap: mySlot !== null && active ? armyCap(game, mySlot) : 0,
        myLandControl: mySlot !== null && active ? Math.round(landControlPct(game, mySlot)) : 0,
        mapControlTarget: MAP_CONTROL_PCT,
        myCosts: mySlot !== null && active ? effectiveCosts(game, mySlot) : null,
        myResearch: mySlot !== null ? (mySlotObj.research || { focus: null, progress: {}, completed: [] }) : null,
        myRelics: mySlot !== null
          ? (mySlotObj.relics || []).map((id) => ({ id, label: RELICS[id]?.label, lore: RELICS[id]?.lore }))
          : null,
        myRelicSets: mySlot !== null ? (mySlotObj.relicSets || []) : null,
        relicTotal: Object.keys(game.macro?.relics || {}).length,
        relicsFound: Object.values(game.macro?.relics || {}).filter((s) => s.foundBy !== null && s.foundBy !== undefined).length,
        myUnlocks: mySlot !== null ? (mySlotObj.unlocks || []) : null,
        myStability: mySlot !== null ? getStability(mySlotObj) : null,
        isHost: game.hostUserId === user.id,
        campaignWinCondition: game.campaignWinCondition,
        factions: (game.factionSlots || []).map((s) => ({
          slotIndex: s.slotIndex, factionName: s.factionName, isNPC: s.isNPC,
          doctrine: s.doctrine, color: s.color, eliminated: s.eliminated,
          isOpen: !s.isNPC && !s.userId, isMe: s.userId === user.id, traits: s.userId === user.id ? s.traits : undefined,
        })),
        combatLog: game.status === 'complete' ? (game.combatLog || []) : (game.combatLog || []).slice(-30),
        statHistory: game.statHistory || [],
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
      const faction = body.factionId ? await svc.entities.Faction.get(body.factionId).catch(() => null) : null;
      if (!faction) return Response.json({ error: 'That faction is no longer on file — pick or forge another before joining' }, { status: 404 });
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

    // ----- Host lobby administration (staging only) -----
    const requireHostInLobby = () => {
      if (game.hostUserId !== user.id) throw new Error('Only the host may amend the staging orders');
      if (game.status !== 'lobby') throw new Error('The front is already live — orders are locked');
    };

    // Re-issue the theater: swap the charted map and/or the planet, regenerating
    // the world the operation will be fought on.
    GAME_ACTIONS.configureLobby = async () => {
      requireHostInLobby();
      const { mapId, planetId, mode, campaignWinCondition } = body;
      const patch = {};

      if (mode !== undefined && mode !== game.mode) {
        if (!['multiplayer', 'campaign'].includes(mode)) return Response.json({ error: 'Unknown mode' }, { status: 400 });
        const humans = game.factionSlots.filter((s) => !s.isNPC).length;
        if (mode === 'campaign' && humans !== 1) {
          return Response.json({ error: 'Campaign mode is solo — convert the other human slots to NPC factions first' }, { status: 400 });
        }
        game.mode = mode;
        patch.mode = mode;
      }

      const wantsWorldRebuild = mapId !== undefined || planetId !== undefined;
      if (wantsWorldRebuild) {
        const nextMapId = mapId === undefined ? game.mapId : mapId || null;
        let nextPlanet = planetId === undefined ? (game.planetId || 'cindara') : planetId;
        let world = null;
        if (nextMapId) {
          const m = await svc.entities.GameMap.get(nextMapId).catch(() => null);
          if (!m || !(m.nodes || []).length) return Response.json({ error: 'That chart is not on file' }, { status: 400 });
          if (planetId === undefined && m.planetId) nextPlanet = m.planetId;
          world = { seed: 7, ...macroBuildWorld(m.nodes.map((n) => ({ ...n })), (m.routes || []).map((r) => [...r]), 7) };
        } else {
          world = macroGenerateWorld(nextPlanet);
        }
        game.mapId = nextMapId;
        game.planetId = nextPlanet;
        game.macro = { ...world, control: {}, bases: {}, columns: [] };
        patch.mapId = nextMapId;
        patch.planetId = nextPlanet;
        patch.macro = game.macro;
      }

      if (campaignWinCondition !== undefined) {
        const { type, value } = campaignWinCondition || {};
        if (type && !['survive', 'territory'].includes(type)) return Response.json({ error: 'Unknown win condition' }, { status: 400 });
        const cond = type ? { type, value: Math.max(Number(value) || 0, 1) } : {};
        game.campaignWinCondition = cond;
        patch.campaignWinCondition = cond;
      }

      if (Object.keys(patch).length > 0) await svc.entities.Game.update(game.id, patch);
      return Response.json({ ok: true });
    }

    // Convert a slot between an open human seat and an NPC faction. A seated
    // commander is stood down first — their chair simply opens back up.
    GAME_ACTIONS.setSlotType = async () => {
      requireHostInLobby();
      const { slotIndex, type, doctrine } = body;
      const slot = game.factionSlots[slotIndex];
      if (!slot) return Response.json({ error: 'No such slot' }, { status: 404 });
      if (slot.userId === user.id) return Response.json({ error: 'You cannot vacate your own command' }, { status: 400 });
      if (!['npc', 'open'].includes(type)) return Response.json({ error: 'Unknown slot type' }, { status: 400 });

      if (type === 'npc') {
        const d = ['aggressive', 'economic', 'defensive'].includes(doctrine) ? doctrine : 'aggressive';
        const names = NPC_NAMES[d];
        const taken = new Set(game.factionSlots.map((s) => s.factionName));
        slot.isNPC = true;
        slot.userId = null;
        slot.factionId = null;
        slot.doctrine = d;
        // Keep the roster distinct — an NPC only renames when its doctrine shifts
        if (!slot.factionName || !names.includes(slot.factionName)) {
          slot.factionName = names.find((n) => !taken.has(n)) || names[0];
        }
        slot.traits = [];
        slot.pointBuy = [];
        slot.dispositions = {};
      } else {
        if (game.mode === 'campaign' && !slot.isNPC) {
          return Response.json({ error: 'Campaign mode is solo — that seat must stay an NPC faction' }, { status: 400 });
        }
        slot.isNPC = false;
        slot.userId = null;
        slot.factionId = null;
        slot.factionName = null;
        slot.doctrine = null;
        slot.traits = [];
        slot.pointBuy = [];
        delete slot.dispositions;
      }
      await svc.entities.Game.update(game.id, { factionSlots: game.factionSlots });
      return Response.json({ ok: true });
    }

    // ----- startGame -----
    GAME_ACTIONS.startGame = async () => {
      if (game.hostUserId !== user.id) return Response.json({ error: 'Only the host can start' }, { status: 403 });
      if (game.status !== 'lobby') return Response.json({ error: 'Game already started' }, { status: 400 });
      if (game.factionSlots.some((s) => !s.isNPC && !s.userId)) return Response.json({ error: 'Waiting for players to join' }, { status: 400 });

      if (game.worldModel === 'macro') {
        // Macro setup (docs/MACRO_ENGINE.md §9): spread spawn cities, anchor
        // bases, field one escort column per faction
        seedRelics(game);
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





    // ----- Mass combat: muster / march / battle -----
    const persistWar = () => svc.entities.Game.update(game.id, {
      territoryStates: game.territoryStates, treasuries: game.treasuries,
      factionSlots: game.factionSlots, armies: game.armies || [],
      combatLog: game.combatLog, activeBattle: game.activeBattle || null,
      lastBattle: game.lastBattle || null,
      battleArchives: game.battleArchives || [],
      diplomacy: game.diplomacy || null,
      macro: game.macro || null,
      attrition: game.attrition || null,
      status: game.status, winnerSlot: game.winnerSlot, statHistory: game.statHistory,
    });





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
      statHistory: game.statHistory, attrition: game.attrition || null,
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

    // Settle terms with a newly surveyed settlement (off-turn allowed — the
    // elders wait on the commander who took the ground, not on the clock)
    GAME_ACTIONS.macroResolveCharter = async () => {
      requireMacro();
      const mySlot = game.factionSlots.findIndex((s) => s.userId === user.id);
      if (mySlot < 0) return Response.json({ error: 'You hold no command here' }, { status: 403 });
      const list = game.macro.charters || [];
      const idx = list.findIndex((c) => c.slot === mySlot && c.nodeId === body.nodeId);
      if (idx < 0) return Response.json({ error: 'No terms pending at that settlement' }, { status: 404 });
      const valid = ['requisition', 'levy', 'autonomy'];
      if (!valid.includes(body.choiceId)) return Response.json({ error: 'Unknown terms' }, { status: 400 });
      const err = applyCharter(game, list[idx], body.choiceId);
      if (err) return Response.json({ error: err }, { status: 400 });
      list.splice(idx, 1);
      await persistMacro();
      return Response.json({ ok: true });
    }

    // Standing accord with a captured settlement's populace. Terms may be
    // re-cut, but the locals need time to trust a new arrangement.
    GAME_ACTIONS.macroSetPolicy = async () => {
      requireMacro();
      const slotIdx = requireMyTurn();
      const { nodeId, policy } = body;
      if (!['integrate', 'trade', 'tax'].includes(policy)) return Response.json({ error: 'Unknown terms' }, { status: 400 });
      if (game.macro.control[nodeId] !== slotIdx) return Response.json({ error: 'You do not hold that settlement' }, { status: 403 });
      if (!game.macro.dossiers?.[nodeId]) return Response.json({ error: 'That settlement has not been surveyed' }, { status: 400 });
      game.macro.policies = game.macro.policies || {};
      const cur = game.macro.policies[nodeId];
      if (cur?.policy === policy) return Response.json({ error: 'Those terms already stand' }, { status: 400 });
      if (cur && game.turnNumber - cur.since < POLICY_COOLDOWN_DAYS) {
        return Response.json({ error: `The locals are still settling into the last arrangement — ${POLICY_COOLDOWN_DAYS - (game.turnNumber - cur.since)} day(s) remain` }, { status: 400 });
      }
      game.macro.policies[nodeId] = { policy, since: game.turnNumber };
      game.combatLog.push({
        turn: game.turnNumber, type: 'event',
        text: `${game.factionSlots[slotIdx].factionName} ${POLICY_LOG[policy]} ${macroNode(game.macro, nodeId)?.name}.`,
      });
      await persistMacro();
      return Response.json({ ok: true });
    }

    // Barter at a held settlement's market — stores or a salvaged relic swapped
    // for materiel or a standing tribute.
    GAME_ACTIONS.macroBarter = async () => {
      requireMacro();
      const slotIdx = requireMyTurn();
      const { nodeId, dealId, relicId } = body;
      const node = macroNode(game.macro, nodeId);
      if (!node) return Response.json({ error: 'Uncharted settlement' }, { status: 400 });
      if (game.macro.control[nodeId] !== slotIdx) return Response.json({ error: 'You do not hold that settlement' }, { status: 403 });
      if (!game.macro.dossiers?.[nodeId]) return Response.json({ error: 'That settlement has not been surveyed' }, { status: 400 });
      const deal = barterDeals(BARTER_PRIMARY(node.kind)).find((d) => d.id === dealId);
      if (!deal) return Response.json({ error: 'The market does not offer that' }, { status: 400 });
      game.macro.barters = game.macro.barters || {};
      const last = game.macro.barters[nodeId];
      if (last && game.turnNumber - last.turn < BARTER_COOLDOWN_DAYS) {
        return Response.json({ error: `The market is picked over — ${BARTER_COOLDOWN_DAYS - (game.turnNumber - last.turn)} day(s) before it restocks` }, { status: 400 });
      }
      const slot = game.factionSlots[slotIdx];
      const treasury = getTreasury(game, slotIdx);
      let handed = null;
      if (deal.relic) {
        if (!barterableRelics(slot).includes(relicId)) return Response.json({ error: 'You hold no such loose relic' }, { status: 400 });
        slot.relics = slot.relics.filter((r) => r !== relicId);
        if (!slot.mods) slot.mods = compileMods(slot.pointBuy);
        mergeMods(slot.mods, negateMods(RELICS[relicId].mods));
        handed = RELICS[relicId].label;
      } else if (!canAfford(treasury, deal.give)) {
        return Response.json({ error: 'You cannot cover those terms' }, { status: 400 });
      } else pay(treasury, deal.give);
      for (const k of RESOURCE_KEYS) treasury[k] = (treasury[k] || 0) + ((deal.gain || {})[k] || 0);
      if (deal.boost) {
        game.macro.bazaarBoost = game.macro.bazaarBoost || {};
        const cur = game.macro.bazaarBoost[nodeId];
        game.macro.bazaarBoost[nodeId] = { res: deal.boost.res, amt: Math.max(cur?.res === deal.boost.res ? cur.amt : 0, deal.boost.amt) };
      }
      game.macro.barters[nodeId] = { turn: game.turnNumber, dealId };
      game.combatLog.push({
        turn: game.turnNumber, type: 'event',
        text: handed
          ? `${slot.factionName} gifts the ${handed} to the people of ${node.name} — it is enshrined in the square, and the settlement pledges a standing tribute.`
          : `${slot.factionName} trades at the ${node.name} market — ${deal.label.toLowerCase()}.`,
      });
      await persistMacro();
      return Response.json({ ok: true });
    }

    // Rule on an occupation crisis (off-turn allowed — the staff needs an answer now)
    GAME_ACTIONS.macroResolveCrisis = async () => {
      requireMacro();
      if (mySlot === null) return Response.json({ error: 'You hold no command here' }, { status: 403 });
      const list = game.macro.crises || [];
      const idx = list.findIndex((c) => c.slot === mySlot && c.nodeId === body.nodeId);
      if (idx < 0) return Response.json({ error: 'No crisis pending at that settlement' }, { status: 404 });
      const err = resolveCrisis(game, list[idx], body.choiceId);
      if (err) return Response.json({ error: err }, { status: 400 });
      list.splice(idx, 1);
      await persistMacro();
      return Response.json({ ok: true });
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
      const found = macroFindPath(game.macro, from, toNodeId, MACRO_BASE_DAY_RATE, { landOnly: true });
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
        attrition: game.attrition || null,
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