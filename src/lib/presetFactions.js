// Preset factions — ready-made nations a commander can requisition without the
// lifepath wizard or the synthesizeFaction LLM call. Each entry matches the
// shape FactionBuilder passes to base44.entities.Faction.create(...), so the
// quick-forge path is a pure client-side entity create with zero backend/credit
// dependency. Every roster is a "legal" ledger under src/lib/pointBuy.js
// (netPoints <= 0, <= 3 liabilities, one upgrade per unit) so it would also pass
// the interactive builder. Traits use the effect schema validated by
// base44/functions/synthesizeFaction (type in income_flat|unit_discount|
// attack_bonus|defense_bonus; unit in riflemen|crawler|gunboat|fighter; value 1-2).

export const PRESET_FACTIONS = [
  {
    id: "kessel_pact",
    factionName: "The Kessel Pact",
    doctrine: "aggressive",
    insigniaDescription:
      "A clenched iron gauntlet crushing a spent artillery shell, stamped over a field of rust-red.",
    lore:
      "Forged from frontier freeholds that survived the First Attrition by striking before they could be struck, the Kessel Pact keeps no reserves it will not spend. Its columns move at a punishing pace, its foundries turn out flame-crawlers faster than crews can be trained for them, and its diplomats are, by long habit, unwelcome. The Pact wins early or not at all.",
    traits: [
      { name: "Shock Vanguard", description: "Assault riflemen are drilled to close and kill first.", effect: { type: "attack_bonus", unit: "riflemen", value: 1 } },
      { name: "Flamewrights", description: "Crawler crews favour overpressure and burn.", effect: { type: "attack_bonus", unit: "crawler", value: 1 } },
      { name: "Requisition Raids", description: "The Pact takes its manpower where it marches.", effect: { type: "unit_discount", unit: "riflemen", value: 1 } },
    ],
    pointBuy: { picks: ["veteran_corps", "flame_projectors", "green_recruits", "fuel_shortage", "pariah_state"] },
    npcDispositions: { aggressive: 5, economic: -15, defensive: -10 },
    lifepathChoices: { preset: true, doctrine: "aggressive", philosophy: "war_economy", value: "glory" },
    isNPC: false,
  },
  {
    id: "iron_synod",
    factionName: "The Iron Synod",
    doctrine: "economic",
    insigniaDescription:
      "Three foundry stacks bound by a brass gear-ring, venting stylised smoke against deep umber.",
    lore:
      "The Synod believes wars are won in the ledger long before the field. Its clustered foundry-cities out-produce every neighbour, funding a war machine that starts lean and ends overwhelming. Old requisition debts left its stockpiles thin and its army cap modest, and its crawler lines run dear — but give the Synod ten turns and it will bury you in steel.",
    traits: [
      { name: "Foundry Cities", description: "The great stacks never cool.", effect: { type: "income_flat", value: 2 } },
      { name: "Assembly Lines", description: "Standardised hulls come off the line cheap.", effect: { type: "unit_discount", unit: "crawler", value: 1 } },
      { name: "Deep Ledgers", description: "Every seam and siding is accounted for.", effect: { type: "income_flat", value: 1 } },
    ],
    pointBuy: { picks: ["industrial_base", "oil_concessions", "war_weary", "depleted_stockpiles", "rusting_arsenal"] },
    npcDispositions: { aggressive: -10, economic: 10, defensive: 5 },
    lifepathChoices: { preset: true, doctrine: "economic", philosophy: "industry", value: "order" },
    isNPC: false,
  },
  {
    id: "grauwall_marches",
    factionName: "The Grauwall Marches",
    doctrine: "defensive",
    insigniaDescription:
      "A grey rampart of overlapping shields beneath a single watch-lantern, on weathered olive.",
    lore:
      "The Marches were raised on the losing side of three invasions and learned the only lesson that mattered: let the enemy break himself on your walls, then take what remains. Its riflemen dig in as reflex, its crawlers carry doubled plate, and its war-weary, fuel-starved economy is built to endure a long siege rather than win a short race. Patience is the Grauwall doctrine.",
    traits: [
      { name: "Entrenched", description: "Marchmen fight from prepared ground by instinct.", effect: { type: "defense_bonus", unit: "riflemen", value: 1 } },
      { name: "Ironclad Hulls", description: "Every crawler carries a second skin of plate.", effect: { type: "defense_bonus", unit: "crawler", value: 1 } },
      { name: "Stubborn Provisioning", description: "The Marches hoard against the long winter.", effect: { type: "income_flat", value: 1 } },
    ],
    pointBuy: { picks: ["trench_gear", "heavy_plating", "war_weary", "fuel_shortage", "depleted_stockpiles"] },
    npcDispositions: { aggressive: -5, economic: 5, defensive: 10 },
    lifepathChoices: { preset: true, doctrine: "defensive", philosophy: "fortress", value: "endurance" },
    isNPC: false,
  },
];

// Strip presentation-only fields (id) before handing the record to the SDK.
export function presetToFactionRecord(preset) {
  const { id, ...record } = preset;
  return record;
}
