// Off-turn armory research — one-time resource unlocks (mirrors concurrentPlay backend).
// Prototype modules become available in the Refit Yard; decrees apply their bonus immediately.
export const ARMORY_ITEMS = {
  citadel_plate: { label: "Citadel Plate", kind: "module", cost: { steel: 6, manpower: 2 }, desc: "Certify +6 defense prototype armor for the Refit Yard" },
  juggernaut_reactors: { label: "Juggernaut Reactors", kind: "module", cost: { steel: 5, fuel: 4 }, desc: "Certify an all-terrain prototype engine that marches on 1 Fuel instead of 2" },
  munitions_works: { label: "Munitions Works", kind: "module", cost: { steel: 6, fuel: 3 }, desc: "Certify a prototype industry deck yielding +1 of every resource" },
  war_bonds_decree: { label: "Decree of War Bonds", kind: "decree", cost: { manpower: 3, fuel: 2 }, desc: "+1 Steel income — the treasury issues war scrip" },
  fuel_ration_act: { label: "Fuel Rationing Act", kind: "decree", cost: { steel: 4, manpower: 2 }, desc: "+1 Fuel income — civilian stocks are seized for the front" },
  universal_levy: { label: "Decree of the Universal Levy", kind: "decree", cost: { steel: 3, manpower: 3 }, desc: "+15 army cap — every citizen owes service" },
  hearth_and_bulwark: { label: "Hearth & Bulwark Edict", kind: "decree", cost: { steel: 5, manpower: 2 }, desc: "+1 capital defense and +1 riflemen defense — the home front digs in" },
};

export const ARMORY_KINDS = {
  module: { icon: "🛠", label: "Fortress Prototypes", blurb: "Certified designs unlock new modules in the Refit Yard" },
  decree: { icon: "⚖", label: "Ideology Decrees", blurb: "Political edicts — their bonus takes effect the moment they are enacted" },
};

export const armoryByKind = (kind) => Object.entries(ARMORY_ITEMS).filter(([, i]) => i.kind === kind);