// GURPS-style point-buy perk effects (mirrors src/lib/pointBuy.js) — shared by
// gameEngine and concurrentPlay so the compiled modifiers never drift.
const RESOURCE_KEYS = ['manpower', 'steel', 'fuel'];

export const PERK_MODS = {
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
  // ── LANE H: nomad-keel requisitions ──
  // The same eight ids as the tail of src/lib/pointBuy.js PERKS, in the same
  // order. test/rules-mirror.test.js asserts the two key sets are equal, and
  // test/presets.test.js asserts that every row below reduces through
  // compileMods() — only unitStat / unitCost / income / armyCap / startBonus /
  // capitalDefense / disposition are reduced, so nothing else may appear here
  // or it would be silently inert. `artillery` is a legal UNIT_TYPES key that
  // no shipped perk had ever named; it is used deliberately.
  draught_columns: { income: { steel: 1, fuel: -1 } },
  boarding_parties: { unitStat: { riflemen: { attack: 1 } }, unitCost: { riflemen: { manpower: 1 } } },
  field_refit_train: { unitCost: { crawler: { steel: -1 } } },
  ranging_batteries: { unitStat: { artillery: { attack: 1 } } },
  swath_bound: { income: { manpower: -1 } },
  stripped_escorts: { unitStat: { crawler: { defense: -1 } }, unitCost: { crawler: { steel: -1 } } },
  tribute_graze: { income: { fuel: -1 }, disposition: -10 },
  exposed_batteries: { unitStat: { artillery: { defense: -1 } } },
};

export function compileMods(picks = []) {
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

export function mergeMods(m, add = {}) {
  for (const [u, stats] of Object.entries(add.unitStat || {})) {
    m.unitStat[u] = m.unitStat[u] || {};
    for (const [s, v] of Object.entries(stats)) m.unitStat[u][s] = (m.unitStat[u][s] || 0) + v;
  }
  for (const k of RESOURCE_KEYS) m.income[k] += (add.income || {})[k] || 0;
  m.armyCap += add.armyCap || 0;
  m.capitalDefense += add.capitalDefense || 0;
  m.supplyRange = (m.supplyRange || 0) + (add.supplyRange || 0);
}