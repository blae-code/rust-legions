// Frontend mirror of the fortress-base module catalog in gameEngine — display only
export const MODULE_SLOTS = {
  armor: { label: "Armor Bay", icon: "🛡" },
  engine: { label: "Engine Bay", icon: "⚙" },
  industry: { label: "Industry Bay", icon: "🏭" },
};

export const BASE_MODULES = {
  riveted_plating: { slot: "armor", label: "Riveted Plating", cost: { steel: 5 }, desc: "+2 defense when the base's zone is attacked" },
  bulwark_hull: { slot: "armor", label: "Bulwark Hull", cost: { steel: 9, fuel: 2 }, desc: "+4 defense when the base's zone is attacked" },
  crawler_drives: { slot: "engine", label: "Crawler Drives", cost: { steel: 4, fuel: 3 }, desc: "The base may crawl 1 zone per turn across open ground" },
  leviathan_turbines: { slot: "engine", label: "Leviathan Turbines", cost: { steel: 6, fuel: 6 }, desc: "1 zone per turn — and the treads cross mountains, highlands and marsh" },
  salvage_refinery: { slot: "industry", label: "Salvage Refinery", cost: { steel: 4, fuel: 2 }, desc: "+2 Fuel income while the base stands on your ground" },
  arc_smelters: { slot: "industry", label: "Arc Smelters", cost: { steel: 6, manpower: 2 }, desc: "+2 Steel income while the base stands on your ground" },
  habitat_decks: { slot: "industry", label: "Habitat Decks", cost: { steel: 5 }, desc: "+2 Manpower income while the base stands on your ground" },
};

export const BASE_MOVE_COST = { fuel: 2 };