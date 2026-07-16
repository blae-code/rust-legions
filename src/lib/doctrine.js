// Frontend mirror of the research/doctrine tree in gameEngine & concurrentPlay — display only.
// Progress: 1 research point per completed full round; focus may be set at any time, even off-turn.
export const DOCTRINE_BRANCHES = {
  armament: { label: "Armament", icon: "⚔", blurb: "Guns, plate and the doctrine of the assault" },
  industry: { label: "Industry", icon: "🏭", blurb: "Foundries, fuel and total mobilization" },
  logistics: { label: "Logistics", icon: "🚚", blurb: "Supply trains, field kitchens and the staff college" },
};

export const TECHS = {
  standardized_calibers: { branch: "armament", tier: 1, label: "Standardized Calibers", cost: 3, prereq: null, effect: "Riflemen attack +1", desc: "One cartridge for every rifle on the front — no more scavenging mismatched rounds." },
  hardened_plate: { branch: "armament", tier: 2, label: "Hardened Plate", cost: 4, prereq: "standardized_calibers", effect: "Crawler defense +1", desc: "Face-hardened armor rolled in the deep foundries turns all but the heaviest shot." },
  combined_arms: { branch: "armament", tier: 3, label: "Combined Arms Doctrine", cost: 6, prereq: "hardened_plate", effect: "Crawler & fighter attack +1", desc: "Armor, air and infantry strike as one fist — the culmination of the new war." },
  rationalized_foundries: { branch: "industry", tier: 1, label: "Rationalized Foundries", cost: 3, prereq: null, effect: "+1 Steel income", desc: "Time-and-motion men walk the casting floors; the same coal pours more steel." },
  synthetic_fuel: { branch: "industry", tier: 2, label: "Synthetic Fuel Program", cost: 4, prereq: "rationalized_foundries", effect: "+1 Fuel income", desc: "Coal liquefaction plants free the war effort from the shrinking oil fields." },
  total_mobilization: { branch: "industry", tier: 3, label: "Total Mobilization", cost: 6, prereq: "synthetic_fuel", effect: "+1 Manpower income · army cap +20", desc: "Every hand, every furnace, every hour — the entire nation becomes the war machine." },
  field_kitchens: { branch: "logistics", tier: 1, label: "Field Kitchens", cost: 3, prereq: null, effect: "Army cap +10", desc: "An army marches on its stomach; hot rations keep more companies in the field." },
  motorized_supply: { branch: "logistics", tier: 2, label: "Motorized Supply Trains", cost: 4, prereq: "field_kitchens", effect: "Supply range +1", desc: "Trucks replace mules — the supply net reaches one zone deeper into the front." },
  general_staff_academy: { branch: "logistics", tier: 3, label: "General Staff Academy", cost: 6, prereq: "motorized_supply", effect: "Capital defense +1 · riflemen defense +1", desc: "A generation of officers schooled in the hard arithmetic of the trenches." },
};

export const techsByBranch = (branch) =>
  Object.entries(TECHS).filter(([, t]) => t.branch === branch).sort((a, b) => a[1].tier - b[1].tier);