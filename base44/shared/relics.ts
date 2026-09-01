// ---------- Precursor relics (mirrors src/lib/relics.js) ----------
// Deep ruins hide Combine-age technology. Taking such a ruin excavates whatever
// lies under it; the find is permanent and folds into the faction's modifiers.
import { compileMods, mergeMods } from './perkMods.ts';

export const RELICS = {
  cogitator_array: { label: 'Combine Cogitator Array', lore: 'A calculating engine that still hums. Staff work sharpens overnight.', mods: { capitalDefense: 1, unitStat: { riflemen: { defense: 1 } } } },
  pattern_dies: { label: 'Pattern Stamping Dies', lore: 'Original hull dies for a foundry line thought lost.', mods: { income: { steel: 1 } } },
  cracking_column: { label: 'Catalytic Cracking Column', lore: 'Pre-collapse refining plant, sealed and intact.', mods: { income: { fuel: 1 } } },
  census_vault: { label: 'The Census Vault', lore: 'Muster rolls of a dead age — and the settlements that still answer them.', mods: { income: { manpower: 1 }, armyCap: 10 } },
  reactive_lattice: { label: 'Reactive Armor Lattice', lore: 'Plate that hardens as it is struck. The crawler works cannot reproduce it.', mods: { unitStat: { crawler: { defense: 1 } } } },
  survey_engine: { label: 'Cartographic Survey Engine', lore: 'It charts routes no living quartermaster has walked.', mods: { supplyRange: 1 } },
  gun_lathes: { label: 'Precision Gun Lathes', lore: 'Barrels bored true to Combine tolerance.', mods: { unitStat: { riflemen: { attack: 1 }, crawler: { attack: 1 } } } },
};
export const RELIC_KEYS = Object.keys(RELICS);

// Complete a matched set and the pieces work as their makers intended
export const RELIC_SETS = {
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
export function seedRelics(game) {
  const ruins = game.macro.nodes.filter((n) => n.kind === 'ruin');
  const pool = [...RELIC_KEYS].sort(() => Math.random() - 0.5);
  const count = Math.min(ruins.length, Math.max(3, Math.round(ruins.length * 0.45)), pool.length);
  const picked = [...ruins].sort(() => Math.random() - 0.5).slice(0, count);
  game.macro.relics = {};
  picked.forEach((n, i) => { game.macro.relics[n.id] = { id: pool[i], foundBy: null, foundTurn: null }; });
}

// Taking ground over an undisturbed dig site excavates it
export function excavateRelic(game, slotIdx, nodeId) {
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
  const nodeName = game.macro.nodes.find((n) => n.id === nodeId)?.name;
  game.combatLog.push({
    turn: game.turnNumber, type: 'event',
    text: `${slot.factionName}'s engineers break the seals beneath ${nodeName} — the ${relic.label} is recovered. ${relic.lore}`,
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