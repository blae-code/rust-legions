// Frontend mirror of the fortress-base module catalog in gameEngine — display only
export const MODULE_SLOTS = {
  armor: { label: "Armor Bay", icon: "🛡", blurb: "Plating bolted over the hull — holds when the base's zone is attacked" },
  engine: { label: "Engine Bay", icon: "⚙", blurb: "Drive systems for the great treads — mobility across the front" },
  industry: { label: "Industry Bay", icon: "🏭", blurb: "On-board works — income while the base stands on friendly ground" },
};

export const BASE_MODULES = {
  riveted_plating: { slot: "armor", label: "Riveted Plating", cost: { steel: 5 }, defense: 2, desc: "+2 defense when the base's zone is attacked" },
  bulwark_hull: { slot: "armor", label: "Bulwark Hull", cost: { steel: 9, fuel: 2 }, defense: 4, desc: "+4 defense when the base's zone is attacked" },
  crawler_drives: { slot: "engine", label: "Crawler Drives", cost: { steel: 4, fuel: 3 }, moves: 1, desc: "The base may crawl 1 zone per turn across open ground" },
  leviathan_turbines: { slot: "engine", label: "Leviathan Turbines", cost: { steel: 6, fuel: 6 }, moves: 1, allTerrain: true, desc: "1 zone per turn — and the treads cross mountains, highlands and marsh" },
  salvage_refinery: { slot: "industry", label: "Salvage Refinery", cost: { steel: 4, fuel: 2 }, income: { fuel: 2 }, desc: "+2 Fuel income while the base stands on your ground" },
  arc_smelters: { slot: "industry", label: "Arc Smelters", cost: { steel: 6, manpower: 2 }, income: { steel: 2 }, desc: "+2 Steel income while the base stands on your ground" },
  habitat_decks: { slot: "industry", label: "Habitat Decks", cost: { steel: 5 }, income: { manpower: 2 }, desc: "+2 Manpower income while the base stands on your ground" },
  // Prototype modules — must first be certified in the State Armory (off-turn research)
  citadel_plate: { slot: "armor", label: "Citadel Plate", cost: { steel: 12, fuel: 3 }, defense: 6, unlock: true, desc: "+6 defense when the base's zone is attacked (prototype)" },
  juggernaut_reactors: { slot: "engine", label: "Juggernaut Reactors", cost: { steel: 8, fuel: 8 }, moves: 1, allTerrain: true, moveCost: 1, unlock: true, desc: "All-terrain, and each march burns only 1 Fuel (prototype)" },
  munitions_works: { slot: "industry", label: "Munitions Works", cost: { steel: 8, manpower: 3 }, income: { manpower: 1, steel: 1, fuel: 1 }, unlock: true, desc: "+1 of every resource while the base stands on your ground (prototype)" },
};

export const BASE_MOVE_COST = { fuel: 2 };

// Derived hull statistics for a given bay loadout ({armor, engine, industry} → module keys)
export function computeBaseStats(modules = {}) {
  const get = (f) => (modules[f] ? BASE_MODULES[modules[f]] : null);
  return {
    defense: 1 + (get("armor")?.defense || 0),
    moves: get("engine")?.moves || 0,
    allTerrain: !!get("engine")?.allTerrain,
    income: get("industry")?.income || null,
  };
}