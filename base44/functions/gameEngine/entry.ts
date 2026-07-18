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





function factionProduction(game, slotIdx) {
  const out = emptyResources();
  for (const [nid, owner] of Object.entries(game.macro?.control || {})) {
    if (owner !== slotIdx) continue;
    const node = game.macro.nodes.find((n) => n.id === nid);
    const y = MACRO_SETTLEMENT_YIELD[node?.kind] || {};
    for (const k of RESOURCE_KEYS) out[k] += y[k] || 0;
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
const MACRO_CONTINENT_NODES = [
  { id: 'kesselgrad', name: 'Kesselgrad', kind: 'city', x: 113, y: 135 },
  { id: 'ashvale', name: 'Ashvale', kind: 'town', x: 178, y: 102 },
  { id: 'rustwater', name: 'Rustwater', kind: 'city', x: 257, y: 95 },
  { id: 'ironmoor', name: 'Ironmoor', kind: 'town', x: 351, y: 110 },
  { id: 'veldt_cross', name: 'Veldt Cross', kind: 'crossroads', x: 156, y: 185 },
  { id: 'foundry_91', name: 'Foundry 91', kind: 'depot', x: 228, y: 164 },
  { id: 'greyspire', name: 'Greyspire', kind: 'city', x: 308, y: 171 },
  { id: 'pale_marsh', name: 'Pale Marsh', kind: 'ruin', x: 390, y: 178 },
  { id: 'cinder_flats', name: 'Cinder Flats', kind: 'depot', x: 117, y: 243 },
  { id: 'old_lorry', name: 'Old Lorry', kind: 'town', x: 192, y: 236 },
  { id: 'saltglass', name: 'Saltglass', kind: 'crossroads', x: 272, y: 228 },
  { id: 'verge', name: 'The Verge', kind: 'city', x: 351, y: 243 },
  { id: 'thornfield', name: 'Thornfield', kind: 'ruin', x: 167, y: 293 },
  { id: 'terminus', name: 'Terminus', kind: 'city', x: 275, y: 297 },
  { id: 'black_quay', name: 'Black Quay', kind: 'town', x: 380, y: 300 },
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
  macroResolveInterceptions(game); // hostile columns caught on the same road
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
    posture: c.owner === slotIdx ? macroPostureOf(c) : undefined,
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
        posture: macroNpcPosture(slot.doctrine),
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
  if (b.macro.interception) return macroApplyInterceptionOutcome(game, b, attackerWon);
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

// --- Interception (slice M3b — docs/MACRO_ENGINE.md §7) ---
const MACRO_POSTURES = ['aggressive', 'evasive'];
const macroPostureOf = (c) => (c.posture === 'evasive' ? 'evasive' : 'aggressive');
const macroNpcPosture = (doctrine) => (doctrine === 'aggressive' ? 'aggressive' : 'evasive');
const macroEdgeKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);
// A road segment is chokepoint ground if either end is a crossroads (a route
// junction — the taxonomy's ambush candidate) or carries an explicit flag
const macroIsChokeEdge = (game, a, b) =>
  [a, b].some((id) => { const n = macroNode(game.macro, id); return n && (n.chokepoint || n.kind === 'crossroads'); });

// Run a transient macro battle to completion with both sides AI-commanded — used
// for dawn interceptions, where no player is present to issue orders.
function macroAutoResolveBattle(game, b) {
  game.activeBattle = b;
  let guard = 0;
  while (game.activeBattle === b && guard++ < 40) {
    setChoice(b.attacker, aiManeuver(b.attacker, game.factionSlots[b.attacker.slot]?.doctrine));
    setChoice(b.defender, aiManeuver(b.defender, game.factionSlots[b.defender.slot]?.doctrine));
    resolveBattleRound(game, b);
  }
  if (game.activeBattle === b) finishBattle(game, b, totalUnits(b.attacker.units) >= totalUnits(b.defender.units));
}

// Build a 1v1 road encounter as a battle object (columns stay on the roster;
// results are applied at outcome). Attacker is the column that pressed the fight.
function macroBuildInterception(game, attacker, defender, towardId) {
  const weather = game.weather || 'clear';
  const side = (col) => {
    const slot = game.factionSlots[col.owner];
    const g = (slot.generals || []).find((x) => x.id === col.generalId) || { name: 'Field Officer', strategy: 9 };
    const rank = armyRank(col.battles || 0);
    const trait = traitByKey(g.trait);
    return {
      slot: col.owner, armyId: col.id, armyName: col.name, generalName: g.name, generalId: g.id || null,
      strategy: g.strategy, units: { ...col.regiments }, morale: 100, choice: null, nextBonus: 0, losses: 0,
      signature: trait?.signature || null, sigCooldown: 0, vetBonus: rank.bonus, rank: rank.label,
      vehicle: vehicleOf(g), supplyPenalty: 0, weatherPenalty: 0, elevMod: 0, design: null,
    };
  };
  if (game.factionSlots[defender.owner]?.isNPC) shiftDisposition(game, defender.owner, attacker.owner, -8);
  const where = `the road to ${macroNode(game.macro, towardId)?.name || 'the front'}`;
  const b = {
    id: genId(), worldModel: 'macro', tileId: null, tileName: where,
    macro: { interception: true, attackerColumnId: attacker.id, defenderColumnId: defender.id },
    attacker: side(attacker),
    defender: { ...side(defender), absorbedArmies: [], fortBonus: 0, terrainBonus: 0, interactive: false },
    round: 1, terrain: null, weather,
    log: [`${game.factionSlots[attacker.owner].factionName}'s ${attacker.name} runs down the ${defender.name} on ${where}.`],
  };
  b.attacker.absorbedArmies = [];
  game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `Interception on ${where} — ${attacker.name} catches the ${defender.name}.` });
  return b;
}

function macroApplyInterceptionOutcome(game, b, attackerWon) {
  const cols = game.macro.columns || [];
  const attCol = cols.find((c) => c.id === b.macro.attackerColumnId);
  const defCol = cols.find((c) => c.id === b.macro.defenderColumnId);
  const winnerCol = attackerWon ? attCol : defCol;
  const loserCol = attackerWon ? defCol : attCol;
  const winnerUnits = attackerWon ? b.attacker.units : b.defender.units;
  const loserUnits = attackerWon ? b.defender.units : b.attacker.units;
  if (winnerCol) {
    winnerCol.regiments = winnerUnits;
    winnerCol.battles = (winnerCol.battles || 0) + 1;
    creditVictory(game, winnerCol.owner, winnerCol.generalId);
  }
  if (loserCol) {
    if (totalUnits(loserUnits) > 0) {
      loserCol.regiments = loserUnits;
      loserCol.battles = (loserCol.battles || 0) + 1;
      const rear = loserCol.march ? loserCol.march.path[0] : loserCol.nodeId;
      loserCol.nodeId = rear;
      delete loserCol.march; // thrown back off the road, halted
    } else {
      game.macro.columns = game.macro.columns.filter((c) => c.id !== loserCol.id);
      generalFate(game, loserCol);
    }
  }
  return attackerWon ? 'intercepted' : 'evaded';
}

// Dawn interception sweep: one engagement per road segment shared by hostile
// columns. The faster column's posture decides; a chokepoint lets an aggressive
// slower column force the fight.
function macroResolveInterceptions(game) {
  const byEdge = {};
  for (const c of game.macro.columns || []) {
    if (!c.march || c.march.path.length < 2) continue;
    const key = macroEdgeKey(c.march.path[0], c.march.path[1]);
    (byEdge[key] = byEdge[key] || []).push(c);
  }
  for (const [key, group] of Object.entries(byEdge)) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((x, y) => (x.id < y.id ? -1 : 1));
    let pair = null;
    for (let i = 0; i < sorted.length && !pair; i++) {
      for (let j = i + 1; j < sorted.length && !pair; j++) {
        if (sorted[i].owner !== sorted[j].owner && !atPeace(game, sorted[i].owner, sorted[j].owner)) pair = [sorted[i], sorted[j]];
      }
    }
    if (!pair) continue;
    const [x, y] = pair;
    const rx = macroDayRate(x.regiments) || 0, ry = macroDayRate(y.regiments) || 0;
    const faster = rx >= ry ? x : y;
    const slower = faster === x ? y : x;
    const [a, b] = key.split('|');
    let attacker = null;
    if (macroPostureOf(faster) === 'aggressive') attacker = faster;
    else if (macroIsChokeEdge(game, a, b) && macroPostureOf(slower) === 'aggressive') attacker = slower;
    if (!attacker) {
      game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${game.factionSlots[faster.owner].factionName}'s ${faster.name} slips past the ${slower.name} on the road.` });
      continue;
    }
    const defender = attacker === x ? y : x;
    const toward = attacker.march.path[1];
    macroAutoResolveBattle(game, macroBuildInterception(game, attacker, defender, toward));
  }
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
      if (mapId) {
        const m = await svc.entities.GameMap.get(mapId).catch(() => null);
        if (!m || !(m.nodes || []).length) return Response.json({ error: 'That chart is not on file' }, { status: 400 });
        macroWorld = { seed: 7, ...macroBuildWorld(m.nodes.map((n) => ({ ...n })), (m.routes || []).map((r) => [...r]), 7) };
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

      const chosenPlanet = planetId || 'cindara';
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
        worldModel: 'macro',
        macro: macroVisibleFor(game, mySlot),
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
        myUnlocks: mySlot !== null ? (mySlotObj.unlocks || []) : null,
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
            posture: slot.isNPC ? macroNpcPosture(slot.doctrine) : 'aggressive',
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

    GAME_ACTIONS.macroSetPosture = async () => {
      requireMacro();
      const slotIdx = requireMyTurn();
      const { columnId, posture } = body;
      if (!MACRO_POSTURES.includes(posture)) return Response.json({ error: 'Unknown posture' }, { status: 400 });
      const column = (game.macro.columns || []).find((c) => c.id === columnId && c.owner === slotIdx);
      if (!column) return Response.json({ error: 'Column not found' }, { status: 404 });
      column.posture = posture;
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
        nodeId, posture: 'aggressive',
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