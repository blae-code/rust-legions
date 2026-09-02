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

// ── THE TEN NAMED POLITIES (Lane H, docs/FACTION_ROSTER.md §2) ─────────────
// The ten grounds the roster names, so they stop being hashed dossiers and
// start being places. PURE DATA LITERAL, and it must stay one: test/presets
// lifts it textually with extract-const.js, which throws on a spread, a
// computed key or a call.
//
// ROW GRAMMAR, and every field of it is checked in test/presets.test.js:
//   name     equals the node name on the chart, exactly
//   kind     a key of LORE_HOOKS — nothing else, because the hashed path
//            falls back through those same four
//   culture  the roster §2 culture, lowercase
//   era      one of LORE_ERAS, byte-identical
//   hook     LORE_HOOKS grammar — a lowercase verb phrase completing
//            `${name} ${hook}.`
//   crisis   ONE bespoke occupation-crisis line: what goes wrong for whoever
//            garrisons this ground, in this ground's own terms
//   charter  ONE bespoke charter term, stating its own number
//   spoils   LORE_SPOILS grammar — exactly one of steel/manpower/fuel, 2..5
//   plate    an existing set_* plate key; no settlement plate is added here
export const NAMED_POLITIES = {
  hundredweight_bottoms: {
    name: "Hundredweight Bottoms",
    kind: "town",
    culture: "mining combine",
    era: "the Long March",
    hook: "unbolted its own refinery under siege and drove it out through the lines, and has measured every house since against that morning",
    crisis: "A garrison here inherits the siege rota with the gate: the pit crews work one shift in three below the reach of any writ, and what is settled down there arrives on the surface already done.",
    charter: "The Bottoms will cut at full tonnage for an occupier who leaves three hundredweight in every ten in the town's own bunkers, weighed on the town's own beam.",
    spoils: { steel: 5 },
    plate: "set_hundredweight",
  },
  nine_cradles: {
    name: "The Nine Cradles",
    kind: "ruin",
    culture: "scrap-parish",
    era: "the Ash Years",
    hook: "keeps the last posted manifest under glass and a lamp lit beneath cradles that have stood open since the sky went quiet",
    crisis: "The parish shelters any garrison and obstructs every one of them the same way — by standing in the cut, unarmed and in numbers, until the diggers put their tools down.",
    charter: "The Cradles grant a keel open shrines and free passage for as long as it lifts nothing from inside the Anchor Field ring: one Object raised and the charter is void that same day.",
    spoils: { steel: 3 },
    plate: "set_nine_cradles",
  },
  tarpool: {
    name: "Tarpool",
    kind: "depot",
    culture: "burn-town",
    era: "the Second Collapse",
    hook: "burns where it stands and sells the fire by the barrel to every side of the same war on the same afternoon",
    crisis: "Occupation ends the town's neutrality and its trade in the same hour, and the seam-fire crews — never paid by anybody but the buyers — let the galleries run toward the tank farm to make the point.",
    charter: "Tarpool meters fuel to a garrison at the standing price and no discount, provided its wharves stay open to two other flags of the town's choosing.",
    spoils: { fuel: 5 },
    plate: "set_tarpool",
  },
  gray_commons: {
    name: "The Gray Commons",
    kind: "town",
    culture: "farm commune",
    era: "Combine era",
    hook: "feeds half a region off the flats and has never broken a levy pact, nor forgiven one broken against it",
    crisis: "The Commons does not riot; it stops sowing, and a federation that stops sowing needs four seasons to start again, whoever is standing in the granary by then.",
    charter: "The Commons victuals a keel out of the common store on one term: every fourth wagon comes back in seed, in season, or the pact is entered as broken.",
    spoils: { manpower: 4 },
    plate: "set_gray_commons",
  },
  crossloom: {
    name: "Crossloom",
    kind: "town",
    culture: "waystation",
    era: "Combine era",
    hook: "knots the great routes together and keeps the Meet under a peace older than any house now living",
    crisis: "A flag over Crossloom is a flag over everybody's Meet, and the routes re-knot around it inside a season — leaving the occupier holding a crossroads that has quietly stopped being one.",
    charter: "Crossloom quarters a garrison inside the wall and outside the Meet, and asks one thing for it: that the truce ground stay open to all comers on the ten-day, armed parties included.",
    spoils: { fuel: 3 },
    plate: "set_crossloom",
  },
  vault_of_winters: {
    name: "Vault-of-Winters",
    kind: "city",
    culture: "still-city",
    era: "Combine era",
    hook: "is walled, lamplit and lying — a fixed city that should have died of the Rent three generations ago and conspicuously has not",
    crisis: "Every occupation of the Vault has ended the same way: the gate holds, the tolls are paid, and the garrison's own rot-counts climb the longer it keeps men below the third cellar line.",
    charter: "The Vault pays a garrison in tolls rather than stores, at its own posted rate, and its charter carries one clause and one number: nobody goes below the third cellar.",
    spoils: { steel: 4 },
    plate: "set_vault_of_winters",
  },
  chandlery: {
    name: "The Chandlery",
    kind: "depot",
    culture: "waystation-provisioner",
    era: "the Long March",
    hook: "victuals, plates and crews the keels that come to it, and enters every one of them in ledgers no outsider has read",
    crisis: "Seize the Chandlery and the counting house burns its own ledgers within the hour; the loss is not the stores, it is that no house can any longer tell which keels are provisioned and which are running on nerve.",
    charter: "The Chandlery refits a keel on account at the standing rate, on one condition: the ledger stays the town's property, and the house that opens it forfeits the account.",
    spoils: { manpower: 3 },
    plate: "set_chandlery",
  },
  redwater_digs: {
    name: "Redwater Digs",
    kind: "ruin",
    culture: "digger camp",
    era: "the Silent Decade",
    hook: "squats a contested dig on no charter but its own nerve and runs a book on which house will arrive first",
    crisis: "The Digs cannot be garrisoned so much as inherited: hold them and you hold an unclassified cut, a red flag already flying, and several hundred freelancers who will walk out in the dark the first time the flag is ignored.",
    charter: "Redwater sells fragments to its occupier at the price it sells them to anyone else, and takes one term for it: the camp keeps its own evacuation call, and no garrison countermands it.",
    spoils: { steel: 2 },
    plate: "set_redwater",
  },
  quiet_parish: {
    name: "The Quiet Parish",
    kind: "town",
    culture: "scrap-parish",
    era: "the Ash Years",
    hook: "seals what the diggers open and pays hard coin for every shaft it sees filled",
    crisis: "A garrison here is offered money on its first day and every day after to collapse a working, and the parish keeps a list of the ones that took it — a list it reads aloud.",
    charter: "The Parish quarters and provisions a keel for nothing at all, so long as that keel closes one working a season and lets the congregation witness the fill.",
    spoils: { manpower: 2 },
    plate: "set_quiet_parish",
  },
  kettleharrow: {
    name: "Kettleharrow",
    kind: "ruin",
    culture: "still-city rim",
    era: "the Second Collapse",
    hook: "lives on the lip of a dead city, harvesting its bones and losing a few of its own to the interior every year",
    crisis: "The rim guides are the only reason anything comes back out of the interior, and an occupier who conscripts them finds the salvage stops inside two ten-days and the city keeps what it has taken.",
    charter: "Kettleharrow guides an occupier's salvage parties for a cut of two loads in ten, and names — free, and in writing — the galleries it will not enter for any cut at all.",
    spoils: { steel: 4 },
    plate: "set_kettleharrow",
  },
};

// Derived lookup, BESIDE the literal and never instead of it: the chart carries
// node names, not slugs, so the dossier path resolves by name.
export const POLITY_BY_NAME = Object.fromEntries(
  Object.values(NAMED_POLITIES).map((row) => [row.name, row]),
);

// Deterministic per-node: the same site always tells the same story
export const loreHash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

export function settlementDossier(node) {
  // A named polity tells its own story; everything else falls through to the
  // hashed path below, byte-for-byte as it shipped. The spoils object is COPIED
  // out rather than handed over: the caller stores the dossier on the game
  // record and the charter path reads it back, and a shared reference would let
  // a save mutate the canon table.
  const named = POLITY_BY_NAME[node.name];
  if (named) {
    return { title: node.name, era: named.era, text: `${node.name} ${named.hook}.`, spoils: { ...named.spoils } };
  }
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