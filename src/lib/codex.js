// The Archive — static lore the codex reads from. Planetary histories are keyed
// to the campaign worlds in src/lib/macro/worlds.js; doctrines describe the three
// ways a nation makes war. Campaign outcomes are read live from played games.

export const PLANET_LORE = {
  cindara: {
    epithet: "The Ash Theater",
    history: [
      "Cindara was the first world the Combine industrialized and the first it abandoned. For two centuries its western continent fed the foundry belts, until the seams ran shallow and the great stacks were banked one by one.",
      "What finished it was not exhaustion but the First Attrition — a war of ledgers that starved the cities before a single shell fell on them. The convoy lanes went unescorted, the depots emptied, and by the third winter Kesselgrad's population had walked out along the highways.",
      "The ash that gives the theater its name is not volcanic. It is a century of unburied industry, lifted off the slag fields by the westerlies and laid back down over everything.",
    ],
    notes: "Nomad fortress-bases returned here first, drawn by the intact highway grid and the deep ruins nobody had the fuel to strip.",
  },
  veyra: {
    epithet: "The Rust Archipelago",
    history: [
      "Veyra was never settled so much as parked on. Its dune belts buried the pre-collapse highways within a generation, and the foundry islands were worked by crews who never intended to stay.",
      "They stayed. When the lanes closed, the crews became populations, and the populations became claimants. Veyran law is still written in salvage rights.",
      "Its depots remain the richest prize on any chart — sealed pre-collapse fuel, enough to move a fortress-base across a continent, guarded by nothing but distance and dust.",
    ],
    notes: "Veyran dust storms are dense enough to strand a column mid-march; local quartermasters plan every route around the drifts.",
  },
  morhollow: {
    epithet: "The Brine-Fog Theater",
    history: [
      "Morhollow's salt-ice quays were cut for a fishing trade that outlived the Combine by a decade and the collapse by not at all.",
      "The world keeps no roads. Trails laid in one season are gone under the frost by the next, and cartography here is a running argument rather than a record — which is why the Bureau charts Morhollow more often than any other theater.",
      "Its fog is brine, not water. It rots gun steel, blinds spotters, and hides whole columns until they are within a day's march.",
    ],
    notes: "Every Morhollow campaign is a supply campaign. Commanders who fight it like open ground lose their columns to privation, not to the enemy.",
  },
};

export const DOCTRINE_LORE = {
  aggressive: {
    label: "Aggressive Doctrine",
    summary: "War is a debt that compounds. Pay it early, in full, on someone else's ground.",
    body: "Aggressive nations spend what they have while they have it. Their columns march hard, their generals favour the all-out attack and the flanking maneuver, and their armories are built for the first ten days of a campaign rather than the last ten. Their diplomats are rarely received twice.",
  },
  economic: {
    label: "Economic Doctrine",
    summary: "The war is decided in the ledger, long before it is decided in the field.",
    body: "Economic nations trade ground for time. They take the foundry cities and fuel depots first, endure the early raids, and field an overwhelming late army funded by holdings nobody contested. Their weakness is the opening — a determined rival can end them before the ledger turns.",
  },
  defensive: {
    label: "Defensive Doctrine",
    summary: "Let the enemy break himself on prepared ground, then take what remains.",
    body: "Defensive nations dig in as reflex. Their riflemen fight from cover, their crawlers carry doubled plate, and their generals hold the line where others would counterattack. They rarely win quickly, and they are extraordinarily difficult to remove.",
  },
};

export const ERAS = [
  { name: "The Combine Age", detail: "Three centuries of industrial union across the charted worlds. Highways, foundry belts and convoy lanes date from here — everything since has been salvage." },
  { name: "The First Attrition", detail: "A war fought with ledgers and blockades rather than columns. It emptied more cities than any battle and ended the Combine without a decisive engagement." },
  { name: "The Long Quiet", detail: "Roughly eighty years of scattered holdings, failed compacts and stripped ruins. No power could feed an army far from home." },
  { name: "The Long March", detail: "The present age. Nations travel as mobile fortress-bases, taking settlements for their yield and moving on when the ground is spent. Territory is held only as long as supply reaches it." },
];