import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Off-turn ("concurrent play") actions — planning that never touches contested state.
// Research focus may be set at any time, even when it is not your turn.
// Tech catalog mirrors gameEngine and src/lib/doctrine.js.
const TECHS = {
  standardized_calibers: { cost: 3, prereq: null },
  hardened_plate: { cost: 4, prereq: 'standardized_calibers' },
  combined_arms: { cost: 6, prereq: 'hardened_plate' },
  rationalized_foundries: { cost: 3, prereq: null },
  synthetic_fuel: { cost: 4, prereq: 'rationalized_foundries' },
  total_mobilization: { cost: 6, prereq: 'synthetic_fuel' },
  field_kitchens: { cost: 3, prereq: null },
  motorized_supply: { cost: 4, prereq: 'field_kitchens' },
  general_staff_academy: { cost: 6, prereq: 'motorized_supply' },
};

// ---- Armory: one-time resource unlocks, purchasable off-turn (mirrors src/lib/armory.js) ----
const RESOURCE_KEYS = ['manpower', 'steel', 'fuel'];
const ARMORY = {
  citadel_plate: { label: 'Citadel Plate', kind: 'module', cost: { steel: 6, manpower: 2 } },
  juggernaut_reactors: { label: 'Juggernaut Reactors', kind: 'module', cost: { steel: 5, fuel: 4 } },
  munitions_works: { label: 'Munitions Works', kind: 'module', cost: { steel: 6, fuel: 3 } },
  war_bonds_decree: { label: 'Decree of War Bonds', kind: 'decree', cost: { manpower: 3, fuel: 2 }, mods: { income: { steel: 1 } } },
  fuel_ration_act: { label: 'Fuel Rationing Act', kind: 'decree', cost: { steel: 4, manpower: 2 }, mods: { income: { fuel: 1 } } },
  universal_levy: { label: 'Decree of the Universal Levy', kind: 'decree', cost: { steel: 3, manpower: 3 }, mods: { armyCap: 15 } },
  hearth_and_bulwark: { label: 'Hearth & Bulwark Edict', kind: 'decree', cost: { steel: 5, manpower: 2 }, mods: { capitalDefense: 1, unitStat: { riflemen: { defense: 1 } } } },
};

// Point-buy perk compiler (mirror of gameEngine) — used only to bootstrap slot.mods on legacy games
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const svc = base44.asServiceRole;
    const { action, gameId, techId, itemId } = await req.json();

    const game = await svc.entities.Game.get(gameId);
    if (!game) return Response.json({ error: 'Game not found' }, { status: 404 });
    const slot = (game.factionSlots || []).find((s) => s.userId === user.id);
    if (!slot) return Response.json({ error: 'You are not a party to this game' }, { status: 403 });
    if (game.status !== 'active') return Response.json({ error: 'Game is not active' }, { status: 400 });

    if (action === 'setResearchFocus') {
      slot.research = slot.research || { focus: null, progress: {}, completed: [] };
      if (techId === null || techId === undefined) {
        slot.research.focus = null;
      } else {
        const tech = TECHS[techId];
        if (!tech) return Response.json({ error: 'Unknown doctrine' }, { status: 400 });
        if ((slot.research.completed || []).includes(techId)) return Response.json({ error: 'That doctrine is already in service' }, { status: 400 });
        if (tech.prereq && !(slot.research.completed || []).includes(tech.prereq)) {
          return Response.json({ error: 'Its prerequisite doctrine has not yet entered service' }, { status: 400 });
        }
        slot.research.focus = techId;
      }
      await svc.entities.Game.update(game.id, { factionSlots: game.factionSlots });
      return Response.json({ ok: true, research: slot.research });
    }

    // Spend resources off-turn to unlock a prototype module or enact an ideology decree
    if (action === 'unlockItem') {
      const item = ARMORY[itemId];
      if (!item) return Response.json({ error: 'Unknown project' }, { status: 400 });
      if (slot.eliminated) return Response.json({ error: 'Your faction has been eliminated' }, { status: 400 });
      slot.unlocks = slot.unlocks || [];
      if (slot.unlocks.includes(itemId)) return Response.json({ error: 'That project is already in service' }, { status: 400 });
      const tkey = String(slot.slotIndex);
      if (!game.treasuries[tkey] || typeof game.treasuries[tkey] !== 'object') game.treasuries[tkey] = { manpower: 0, steel: 0, fuel: 0 };
      const treasury = game.treasuries[tkey];
      if (!RESOURCE_KEYS.every((k) => (treasury[k] || 0) >= (item.cost[k] || 0))) {
        return Response.json({ error: 'Insufficient resources in the treasury' }, { status: 400 });
      }
      for (const k of RESOURCE_KEYS) treasury[k] = (treasury[k] || 0) - (item.cost[k] || 0);
      slot.unlocks.push(itemId);
      if (item.mods) {
        if (!slot.mods) slot.mods = compileMods(slot.pointBuy);
        mergeMods(slot.mods, item.mods);
      }
      game.combatLog = game.combatLog || [];
      game.combatLog.push({
        turn: game.turnNumber, type: 'event',
        text: item.kind === 'decree'
          ? `${slot.factionName} enacts the ${item.label}.`
          : `${slot.factionName}'s engineers certify the ${item.label} prototype for the refit yards.`,
      });
      await svc.entities.Game.update(game.id, { factionSlots: game.factionSlots, treasuries: game.treasuries, combatLog: game.combatLog });
      return Response.json({ ok: true, unlocks: slot.unlocks, resources: treasury });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});