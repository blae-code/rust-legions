// Neutral settlement lore & charter terms (mirrors src/lib/macro/settlementLore.js).
// Every unclaimed site kept its own history through the collapse.
export const LORE_ERAS = ['Combine era', 'the Ash Years', 'the Long March', 'the Silent Decade', 'the Second Collapse'];

export const LORE_HOOKS = {
  city: [
    'was a Combine assembly seat until the works went cold; its council still meets, gavel and all, over a dead switchboard',
    'burned for eleven days and was rebuilt from the tram lines outward — the streets follow the old rails',
    'kept its foundry lit by rationing coal one shovel at a time for two generations',
  ],
  town: [
    'survived on a single artesian well the elders refuse to map for outsiders',
    "traded its children's labor for diesel and has never forgiven the convoy that took them",
    'holds an annual muster where every household reads the name of someone the roads took',
  ],
  depot: [
    'was a Combine fuel terminal, sealed by its own crew when the orders stopped coming',
    'has been bled by four different armies and still meters every litre in a leather ledger',
    'sits atop a cracking plant the locals maintain but do not understand',
  ],
  ruin: [
    'was abandoned mid-shift — lunch pails still sit on the benches',
    'was struck from every Combine chart, and nobody living knows why',
    'was picked over by scavengers for a century, yet the deepest levels remain sealed',
  ],
};

export const LORE_SPOILS = { city: { steel: 4 }, town: { manpower: 3 }, depot: { fuel: 4 }, ruin: { steel: 3 } };

// Deterministic per-node: the same site always tells the same story
export const loreHash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

export function settlementDossier(node) {
  const h = loreHash(node.id + node.name);
  const hooks = LORE_HOOKS[node.kind] || LORE_HOOKS.town;
  const era = LORE_ERAS[h % LORE_ERAS.length];
  const hook = hooks[(h >> 3) % hooks.length];
  const spoilBase = LORE_SPOILS[node.kind] || { manpower: 2 };
  const [res, amt] = Object.entries(spoilBase)[0];
  return { title: node.name, era, text: `${node.name} ${hook}. Standing since ${era}.`, spoils: { [res]: amt + ((h >> 7) % 3) } };
}

// Standing accords with a held settlement's populace
export const POLICY_COOLDOWN_DAYS = 3;
export const POLICY_LOG = {
  integrate: 'integrates the populace of',
  trade: 'opens the market roads of',
  tax: 'levies a war tax on',
};

// Terms a commander may offer a newly surveyed settlement
export function charterOptions(dossier) {
  const [res, amt] = Object.entries(dossier.spoils || { manpower: 2 })[0];
  return [
    { id: 'requisition', label: 'Requisition the Stores', detail: `Strip the depots bare — +${amt * 2} ${res} now, and the townsfolk remember it.` },
    { id: 'levy', label: 'Raise a Levy', detail: `Take the stores and press volunteers — +${amt} ${res} and +3 manpower.` },
    { id: 'autonomy', label: 'Grant a Charter of Autonomy', detail: `Leave the stores be — the settlement yields +1 ${res} every day it stays yours.` },
  ];
}