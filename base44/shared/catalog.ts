// ---------- The Catalog: doctrine, creeds, armory and relic projects ----------
//
// CANONICAL. This module is the single source of truth for the research tree
// (`TECHS`), the Four Departures (`CREEDS`), the State Armory (`ARMORY_ITEMS`)
// and the Tier-III relic projects (`RELIC_PROJECTS`). The frontend mirrors in
// `src/lib/doctrine.js` and `src/lib/armory.js` must stay deep-equal to it, and
// `test/catalog-mirror.test.js` is the mechanical proof — see CLAUDE.md's "One
// Critical Invariant".
//
// `base44/functions/gameEngine/entry.ts` and `base44/functions/concurrentPlay/entry.ts`
// still carry their own inlined `TECHS` / `ARMORY` tables. They import this module
// and retire those copies at plan phase C3 (`docs/TACTICAL_SQUAD_PLAN.md` §5);
// until then the frontend mirrors are a strict SUPERSET of the backend tables and
// `test/rules-mirror.test.js` is narrowed to say exactly that.
//
// DATA ONLY. Every export is a pure object literal — no imports, no functions, no
// types, no `as const`, no spreads, no computed keys. `test/helpers/extract-const.js`
// lifts these tables TEXTUALLY and evaluates the slice with no access to module
// scope, so a single referenced identifier would break every mirror test. Helpers
// live in `src/lib`.
//
// Shapes: `docs/TACTICAL_SQUAD_PLAN.md` §4 (`Tech`, `Creed`, `ArmoryItem`,
// `RelicProject`). Design record and cost curve: `docs/TECH_DESIGN.md`.
// Lore authority: `docs/LORE.md` (§2 the Four Departures, §5 the leavings).

// Research points accrue at 1 per completed full round; focus may be set at any
// time, even off-turn. Cost is fixed by tier and uniform across branches —
// tier 1 = 3 RP, tier 2 = 4 RP, tier 3 = 6 RP, tier 4 = 9 RP. One node per tier
// is a 22 RP spine, but a branch holds more nodes than that and every capstone
// names a prerequisite outside its own branch, so the cheapest first capstone
// bills 25 RP and clearing all five branches is 138 RP. No single game finishes
// the tree; that is the intent (`docs/TECH_DESIGN.md` §8, which publishes the
// per-branch table `test/catalog-mirror.test.js` checks against these tables).
//
// `prereq` is a key, an array of keys (all of which must be completed), or null.
// Every prereq sits at a strictly lower tier than the tech that names it, which
// is what makes cycles impossible. Each branch's tier-4 capstone names at least
// one prereq from a DIFFERENT branch: the top of a branch is never reachable by
// climbing that branch alone.
//
// `effect` is the human one-line summary rendered in the Doctrine Book.
// `effects[]` is the machine encoding the engine applies, in the §4 effect-key
// vocabulary. The two always agree; prose describes, numbers decide — and the
// mirror test enforces it: the set of signed integers in `effect` must equal the
// set of `effects[].value`, so a rebalanced number cannot be left out of the copy.
//
// SCOPE IS A PROPERTY OF THE EFFECT KEY, NOT OF THE ROW. An effect key is routed
// to exactly one subsystem, everywhere it appears, and the test fails any key that
// is emitted under two scopes. The rule for `unit.<type>.<stat>`:
//
//   macro     attack · defense · speed   — army strength and movement on the chart
//   tactical  melee · ranged · armor · morale — resolved inside a battle
//
// and for the rest: `initiative` / `moraleTest` are tactical; `armyCap`,
// `supplyRange`, `capitalDefense`, `losRange` and `digSpeed` are macro; `income.*`,
// `fragmentYield` and `buildTurns` are economy.
//
// DECLARATION ORDER: within a branch block, creed-locked rows are declared LAST, so
// the branch's open spine reads top to bottom. Three of the five branches are
// therefore NOT declared in tier order, which is deliberate — it is what keeps the
// sort inside `techsByBranch` load-bearing rather than incidentally satisfied.
export const TECHS = {
  // ── Armament — guns, plate and the doctrine of the assault ──
  standardized_calibers: { key: "standardized_calibers", branch: "armament", tier: 1, label: "Standardized Calibers", cost: 3, prereq: null, effect: "Riflemen attack +1", effects: [{ scope: "macro", key: "unit.riflemen.attack", value: 1 }], desc: "One cartridge for every rifle on the front — no more scavenging mismatched rounds." },
  hardened_plate: { key: "hardened_plate", branch: "armament", tier: 2, label: "Hardened Plate", cost: 4, prereq: "standardized_calibers", effect: "Crawler defense +1", effects: [{ scope: "macro", key: "unit.crawler.defense", value: 1 }], desc: "Face-hardened armor rolled in the deep foundries turns all but the heaviest shot." },
  combined_arms: { key: "combined_arms", branch: "armament", tier: 3, label: "Combined Arms Doctrine", cost: 6, prereq: "hardened_plate", effect: "Crawler & fighter attack +1", effects: [{ scope: "macro", key: "unit.crawler.attack", value: 1 }, { scope: "macro", key: "unit.fighter.attack", value: 1 }], desc: "Armor, air and infantry strike as one fist — the culmination of the new war." },
  boarding_doctrine: { key: "boarding_doctrine", branch: "armament", tier: 3, label: "Boarding Doctrine", cost: 6, prereq: ["hardened_plate", "field_kitchens"], effect: "Riflemen melee +1 · riflemen morale +1", effects: [{ scope: "tactical", key: "unit.riflemen.melee", value: 1 }, { scope: "tactical", key: "unit.riflemen.morale", value: 1 }], desc: "A keel is taken deck by deck or not at all. Storm parties drill on gutted hulls until the corridors hold no surprise worth the name." },
  saturation_barrage: { key: "saturation_barrage", branch: "armament", tier: 4, label: "Saturation Barrage", cost: 9, prereq: ["combined_arms", "rationalized_foundries"], effect: "Artillery attack +2 · crawler attack +1", effects: [{ scope: "macro", key: "unit.artillery.attack", value: 2 }, { scope: "macro", key: "unit.crawler.attack", value: 1 }], desc: "The Ministry stops counting shells and starts counting minutes. Ground is not contested but erased, and the crawlers walk in over ash the guns have already paid for." },
  // ── Industry — foundries, fuel and total mobilization ──
  rationalized_foundries: { key: "rationalized_foundries", branch: "industry", tier: 1, label: "Rationalized Foundries", cost: 3, prereq: null, effect: "+1 Steel income", effects: [{ scope: "economy", key: "income.steel", value: 1 }], desc: "Time-and-motion men walk the casting floors; the same coal pours more steel." },
  synthetic_fuel: { key: "synthetic_fuel", branch: "industry", tier: 2, label: "Synthetic Fuel Program", cost: 4, prereq: "rationalized_foundries", effect: "+1 Fuel income", effects: [{ scope: "economy", key: "income.fuel", value: 1 }], desc: "Coal liquefaction plants free the war effort from the shrinking oil fields." },
  total_mobilization: { key: "total_mobilization", branch: "industry", tier: 3, label: "Total Mobilization", cost: 6, prereq: "synthetic_fuel", effect: "+1 Manpower income · army cap +20", effects: [{ scope: "economy", key: "income.manpower", value: 1 }, { scope: "macro", key: "armyCap", value: 20 }], desc: "Every hand, every furnace, every hour — the entire nation becomes the war machine." },
  continuous_casting: { key: "continuous_casting", branch: "industry", tier: 4, label: "Continuous Casting Order", cost: 9, prereq: ["total_mobilization", "motorized_supply"], effect: "+2 Steel income · crawler armor +1", effects: [{ scope: "economy", key: "income.steel", value: 2 }, { scope: "tactical", key: "unit.crawler.armor", value: 1 }], desc: "The furnaces are never banked again. Plate leaves the line still glowing and is bolted onto hulls within the watch, and the swath behind the keel runs black for a ten-day." },
  bonded_manifests: { key: "bonded_manifests", branch: "industry", tier: 3, label: "Bonded Manifests", cost: 6, prereq: "synthetic_fuel", creedLock: "finished_ledger", effect: "+1 Steel income · +1 Fuel income", effects: [{ scope: "economy", key: "income.steel", value: 1 }, { scope: "economy", key: "income.fuel", value: 1 }], desc: "The ledger is closed and nobody is coming; what cannot be begged is bought. Bonded manifests move salvage between keels at rates the counting houses will actually honor." },
  // ── Logistics — supply trains, field kitchens and the staff college ──
  field_kitchens: { key: "field_kitchens", branch: "logistics", tier: 1, label: "Field Kitchens", cost: 3, prereq: null, effect: "Army cap +10", effects: [{ scope: "macro", key: "armyCap", value: 10 }], desc: "An army marches on its stomach; hot rations keep more companies in the field." },
  motorized_supply: { key: "motorized_supply", branch: "logistics", tier: 2, label: "Motorized Supply Trains", cost: 4, prereq: "field_kitchens", effect: "Supply range +1", effects: [{ scope: "macro", key: "supplyRange", value: 1 }], desc: "Trucks replace mules — the supply net reaches one zone deeper into the front." },
  general_staff_academy: { key: "general_staff_academy", branch: "logistics", tier: 3, label: "General Staff Academy", cost: 6, prereq: "motorized_supply", effect: "Capital defense +1 · riflemen defense +1", effects: [{ scope: "macro", key: "capitalDefense", value: 1 }, { scope: "macro", key: "unit.riflemen.defense", value: 1 }], desc: "A generation of officers schooled in the hard arithmetic of the trenches." },
  grand_quartermastery: { key: "grand_quartermastery", branch: "logistics", tier: 4, label: "Grand Quartermastery", cost: 9, prereq: ["general_staff_academy", "synthetic_fuel"], effect: "Supply range +1 · army cap +20 · crawler speed +1", effects: [{ scope: "macro", key: "supplyRange", value: 1 }, { scope: "macro", key: "armyCap", value: 20 }, { scope: "macro", key: "unit.crawler.speed", value: 1 }], desc: "One office writes every manifest on the March. Columns that once waited on the keel draw instead from depots laid down ahead of them, and nothing halts to eat." },
  // ── Signals — red traffic, listening posts and the reading of the enemy ──
  red_traffic_discipline: { key: "red_traffic_discipline", branch: "signals", tier: 1, label: "Red-Traffic Discipline", cost: 3, prereq: null, effect: "Initiative +1", effects: [{ scope: "tactical", key: "initiative", value: 1 }], desc: "Combat-band chatter is cut to call-signs and numbers. Orders arrive while they still mean something, and the enemy's listeners are handed nothing but the sound of counting." },
  listening_posts: { key: "listening_posts", branch: "signals", tier: 2, label: "Listening Posts", cost: 4, prereq: "red_traffic_discipline", effect: "Line of sight +1", effects: [{ scope: "macro", key: "losRange", value: 1 }], desc: "Wire teams raise masts along the swath and leave crews behind to sit in the cold with them. The March sees one day further than it marches." },
  traffic_analysis: { key: "traffic_analysis", branch: "signals", tier: 3, label: "Traffic Analysis", cost: 6, prereq: ["listening_posts", "motorized_supply"], effect: "Initiative +1 · morale tests +1", effects: [{ scope: "tactical", key: "initiative", value: 1 }, { scope: "tactical", key: "moraleTest", value: 1 }], desc: "Nobody breaks the enemy's cipher; the office counts his messages instead. Volume, hour and bearing tell the staff where the blow falls, and a warned line does not waver." },
  intercept_bureau: { key: "intercept_bureau", branch: "signals", tier: 4, label: "The Intercept Bureau", cost: 9, prereq: ["traffic_analysis", "general_staff_academy"], effect: "Line of sight +2 · initiative +1 · morale tests +1", effects: [{ scope: "macro", key: "losRange", value: 2 }, { scope: "tactical", key: "initiative", value: 1 }, { scope: "tactical", key: "moraleTest", value: 1 }], desc: "Every listening post reports to one room, and the room reports the enemy's next three days. Marches are met before they arrive; ambushes are attended rather than suffered." },
  vigil_watch: { key: "vigil_watch", branch: "signals", tier: 3, label: "The Vigil Watch", cost: 6, prereq: "listening_posts", creedLock: "recall", effect: "Line of sight +2", effects: [{ scope: "macro", key: "losRange", value: 2 }], desc: "Masts are raised for the Recall as much as for the war. Crews keep watch on the sky between the Lamp and the Coal, and see every column that moves beneath it." },
  // ── Reclamation — digs, assays and what the leavings are worth once opened ──
  survey_cadres: { key: "survey_cadres", branch: "reclamation", tier: 1, label: "Survey Cadres", cost: 3, prereq: null, effect: "Dig speed +1", effects: [{ scope: "macro", key: "digSpeed", value: 1 }], desc: "Prospectors schooled to read a ruin before breaking it: which seals are sound, which floor is a lid, which red flag was planted by an honest crew." },
  assay_procedure: { key: "assay_procedure", branch: "reclamation", tier: 2, label: "Assay Procedure", cost: 4, prereq: "survey_cadres", effect: "Fragment yield +1", effects: [{ scope: "economy", key: "fragmentYield", value: 1 }], desc: "Finds are classed at the pit head instead of the keel — cache, engine, cipher, wake — and nothing worth carrying is left in the spoil for the next house to walk over." },
  deep_shaft_works: { key: "deep_shaft_works", branch: "reclamation", tier: 3, label: "Deep-Shaft Works", cost: 6, prereq: ["assay_procedure", "field_kitchens"], effect: "Dig speed +1 · +1 Manpower income", effects: [{ scope: "macro", key: "digSpeed", value: 1 }, { scope: "economy", key: "income.manpower", value: 1 }], desc: "Winches, sumps and a standing camp at the pit head. A site that once ate a march's daylight is worked in shifts, and hands come to where the digging is." },
  pattern_book: { key: "pattern_book", branch: "reclamation", tier: 4, label: "The Pattern Book", cost: 9, prereq: ["assay_procedure", "traffic_analysis"], effect: "Dig speed +2 · fragment yield +1 · build turns -1", effects: [{ scope: "macro", key: "digSpeed", value: 2 }, { scope: "economy", key: "fragmentYield", value: 1 }, { scope: "economy", key: "buildTurns", value: -1 }], desc: "Four hundred years of smudged copies, indexed at last against the pages they were copied from. The bureau no longer guesses what a thing was for, and the works run shorter." },
  sealing_protocols: { key: "sealing_protocols", branch: "reclamation", tier: 2, label: "Sealing Protocols", cost: 4, prereq: "survey_cadres", creedLock: "flight", effect: "Capital defense +1 · riflemen morale +1", effects: [{ scope: "macro", key: "capitalDefense", value: 1 }, { scope: "tactical", key: "unit.riflemen.morale", value: 1 }], desc: "Chart the find, weld the door, post the flag, march away whole. Crews who are never ordered to open a Wake come back with their nerve and their number intact." },
  stripping_yards: { key: "stripping_yards", branch: "reclamation", tier: 3, label: "The Stripping Yards", cost: 6, prereq: ["assay_procedure", "rationalized_foundries"], creedLock: "discarding", effect: "Fragment yield +2 · +1 Steel income", effects: [{ scope: "economy", key: "fragmentYield", value: 2 }, { scope: "economy", key: "income.steel", value: 1 }], desc: "We were the gear they left behind; we owe their gear no better. Objects enter the yards whole and leave as fragments, alloy and a very great deal of scrap." },
};

// The Four Departures (`docs/LORE.md` §2) — the four readings of why the Empire
// left, and the only legal `creedLock` values in this catalog. `axisLean` is the
// row's position on the Creed axis of `docs/VISION.md` §6.1 (Reclaimer −1 …
// Restorationist +1). The Flight and the Finished Ledger both sit at 0 and for
// opposite reasons: one refuses the precursor road, the other simply does not
// believe anyone is at the other end of it.
export const CREEDS = {
  recall: { key: "recall", label: "The Recall", axisLean: 1, blurb: "The Empire was summoned home to some crisis and means to return. Preserve the works, learn the ways, light the signal; the Key is an appeal." },
  finished_ledger: { key: "finished_ledger", label: "The Finished Ledger", axisLean: 0, blurb: "The planet stopped paying and the crews went home. Nothing personal, and nobody is coming: passage off the Ground is built or bought, never granted." },
  flight: { key: "flight", label: "The Flight", axisLean: 0, blurb: "They did not withdraw, they fled. Whatever they ran from has our address, and so the Key must never be turned by any hand." },
  discarding: { key: "discarding", label: "The Discarding", axisLean: -1, blurb: "Ward is the flattering word: humanity was site labor, discarded with the rest of the gear. We ask the Landlords nothing and climb on our own hull." },
};

// The State Armory (`docs/GAME_RULES.md` §20, extended by `docs/GEAR_LIBRARY.md` §2).
// One table, three kinds:
//
//   `module`        a fortress-bay design. The Armory purchase CERTIFIES the
//                   prototype; `effects[]` is what the module does once it is
//                   fitted in its bay, which is why the three shipped modules
//                   carry no `mods` in the backend today.
//   `decree`        an act of the Assembly. It applies the moment the seal dries,
//                   and it also MOVES AN AXIS: every decree carries `axis` and
//                   `direction` from the four ideology axes of `docs/VISION.md`
//                   §6.1 (authority −1 Council Rule … +1 Iron Autocracy; economy
//                   −1 War Communalism … +1 Charter Syndicates; creed −1 Reclaimer
//                   … +1 Restorationist; mobilization −1 Citizen Levy … +1
//                   Professional Corps). A decree is a trade, never a pure gain:
//                   every decree this lane authors carries at least one PENALTY
//                   effect — a negative value, or a POSITIVE `buildTurns`, where
//                   the sign is inverted because more turns is the price. The four
//                   decrees that predate this catalog are exempt and only those
//                   four: their `effects[]` is a faithful encoding of a frozen
//                   `desc`, not a fresh design.
//   `relic_project` the Armory face of a `RELIC_PROJECTS` row — same key, same
//                   `cost`, tier `III`.
//
// No two rows of the same `kind` share an effect signature: a fragment-gated row
// whose effect vector already exists on a cheaper ungated row is a purchase nobody
// has a reason to make, and the test rejects it.
//
// KNOWN DIVERGENCE, for the platform lane: `docs/GEAR_LIBRARY.md` describes the
// Pattern Shop as reducing Armory certification COST by a quarter. §4's effect-key
// vocabulary has no cost-modifier key and no percentage semantics, so the row is
// encoded here with the closest true statement it can make — `buildTurns -2`. If
// the vocabulary ever gains a certification-cost key, this row is the first
// consumer. See `docs/prompts/PLATFORM_HANDOFF.md`, Lane G.
//
// `tier` is the GEAR_LIBRARY gate: `I` is buildable with conventional resources
// alone and carries NO `cost.fragments`; `II:Cache` / `II:Eng` / `II:Ciph` /
// `II:Wake` each demand exactly their own fragment class and nothing else; `III`
// is a relic project and may demand several. Every cost value is a positive
// integer — the sign of an effect is where a trade is expressed, never the price.
//
// `creedLock` names a `CREEDS` key. None of the four shipped decrees carries one:
// a live save that has already enacted them must not become illegal.
export const ARMORY_ITEMS = {
  // ── Fortress modules — certified in the Armory, fitted in the bays ──
  citadel_plate: { key: "citadel_plate", label: "Citadel Plate", kind: "module", tier: "I", cost: { steel: 6, manpower: 2 }, effects: [{ scope: "macro", key: "capitalDefense", value: 6 }], desc: "Certify +6 defense prototype armor for the Refit Yard" },
  juggernaut_reactors: { key: "juggernaut_reactors", label: "Juggernaut Reactors", kind: "module", tier: "I", cost: { steel: 5, fuel: 4 }, effects: [{ scope: "economy", key: "income.fuel", value: 1 }], desc: "Certify an all-terrain prototype engine that marches on 1 Fuel instead of 2" },
  munitions_works: { key: "munitions_works", label: "Munitions Works", kind: "module", tier: "I", cost: { steel: 6, fuel: 3 }, effects: [{ scope: "economy", key: "income.steel", value: 1 }, { scope: "economy", key: "income.fuel", value: 1 }, { scope: "economy", key: "income.manpower", value: 1 }], desc: "Certify a prototype industry deck yielding +1 of every resource" },
  field_assay: { key: "field_assay", label: "Field Assay Office", kind: "module", tier: "I", cost: { steel: 4, manpower: 3 }, effects: [{ scope: "economy", key: "fragmentYield", value: 1 }], desc: "A bench, a scale and a licensed assayer at the pit head. Finds are classed where they are lifted, and the keel stops carrying spoil home to learn it was spoil." },
  cipher_hall: { key: "cipher_hall", label: "Cipher Hall", kind: "module", tier: "I", cost: { steel: 6, manpower: 4 }, effects: [{ scope: "economy", key: "fragmentYield", value: 1 }, { scope: "economy", key: "buildTurns", value: -1 }], desc: "Two sealed housings, a reading room and a standing guard. Objects held here are studied rather than stored, and the works that need them no longer wait on a courier." },
  muster_decks: { key: "muster_decks", label: "Muster Decks", kind: "module", tier: "I", cost: { steel: 5, manpower: 4 }, effects: [{ scope: "macro", key: "armyCap", value: 10 }], desc: "Barracks, drill floor and a ramp wide enough for a company in column. Recruits are raised at the keel and walk aboard, instead of marching a fortnight to reach it." },
  sortie_gates: { key: "sortie_gates", label: "Sortie Gates", kind: "module", tier: "I", cost: { steel: 5, manpower: 2 }, effects: [{ scope: "tactical", key: "initiative", value: 2 }], desc: "Four ports cut low in the skirt armor, each with its own ramp and klaxon. A keel that can be ringed can still be the one that opens the fighting." },
  granary_decks: { key: "granary_decks", label: "Granary Decks", kind: "module", tier: "I", cost: { steel: 4, manpower: 5 }, effects: [{ scope: "macro", key: "supplyRange", value: 1 }, { scope: "tactical", key: "moraleTest", value: 1 }], desc: "Sealed bins, salt cellars and a quartermaster who answers to the Ministry alone. A ringed keel is starved out or it is not taken, and these decks decide which." },
  assembly_hall: { key: "assembly_hall", label: "Assembly Hall", kind: "module", tier: "I", cost: { steel: 5, manpower: 5 }, effects: [{ scope: "tactical", key: "moraleTest", value: 1 }, { scope: "macro", key: "armyCap", value: 5 }], desc: "A floor, a rail and benches for the parish delegates. A house that lets its people be heard at the Sessions finds the levy answers faster when it is called." },
  pilgrim_berths: { key: "pilgrim_berths", label: "Pilgrim Berths", kind: "module", tier: "I", cost: { steel: 3, manpower: 6 }, effects: [{ scope: "economy", key: "income.manpower", value: 1 }], desc: "Bunks for the walkers who follow every keel to the Anchor Fields. They are fed, counted and put to work, and a few of them stay on the muster roll." },
  ministry_mast: { key: "ministry_mast", label: "Ministry Mast", kind: "module", tier: "I", cost: { steel: 4, fuel: 2 }, effects: [{ scope: "macro", key: "losRange", value: 1 }], desc: "A lattice mast, a heliograph and a wire office that never closes. Field Orders reach the columns off-turn, and the herald's word travels one full day further than it did." },
  launch_rails: { key: "launch_rails", label: "Launch Rails", kind: "module", tier: "II:Eng", cost: { steel: 7, fuel: 5, fragments: { engine: 3 } }, effects: [{ scope: "macro", key: "unit.fighter.attack", value: 1 }, { scope: "macro", key: "unit.fighter.speed", value: 1 }], desc: "Precursor rail stock, cut down and bolted to the upper deck. The air wing rebases to the keel between sorties and comes off the rails already at speed." },
  march_klaxons: { key: "march_klaxons", label: "March Klaxons", kind: "module", tier: "II:Ciph", cost: { steel: 6, fuel: 3, fragments: { cipher: 3 } }, effects: [{ scope: "macro", key: "unit.riflemen.speed", value: 1 }, { scope: "macro", key: "unit.crawler.speed", value: 1 }], desc: "Cipher-cut horns on the upper works, sounding a cadence nobody taught us. Columns inside the keel's shadow step to it without being ordered to, and the day's ground comes cheaper." },
  sloped_casemates: { key: "sloped_casemates", label: "Sloped Casemates", kind: "module", tier: "II:Cache", cost: { steel: 9, manpower: 3, fragments: { cache: 3 } }, effects: [{ scope: "macro", key: "capitalDefense", value: 3 }, { scope: "macro", key: "unit.riflemen.defense", value: 1 }], desc: "Cache alloy rolled thin and hung at an angle no shell likes. Boarding parties lose a deck to the geometry before a single storm party has fired." },
  pattern_shop: { key: "pattern_shop", label: "Pattern Shop", kind: "module", tier: "II:Cache", cost: { steel: 8, fuel: 4, fragments: { cache: 2 } }, effects: [{ scope: "economy", key: "buildTurns", value: -2 }], desc: "Cache-alloy jigs, master gauges and a shelf of analyzed patterns. Certification stops being an argument between two foundries and becomes a drawing, and the works come off the floor a full watch and a half early." },
  // ── Ideology decrees — the axis moves the moment the seal dries ──
  war_bonds_decree: { key: "war_bonds_decree", label: "Decree of War Bonds", kind: "decree", tier: "I", axis: "economy", direction: 1, cost: { manpower: 3, fuel: 2 }, effects: [{ scope: "economy", key: "income.steel", value: 1 }], desc: "+1 Steel income — the treasury issues war scrip" },
  fuel_ration_act: { key: "fuel_ration_act", label: "Fuel Rationing Act", kind: "decree", tier: "I", axis: "economy", direction: -1, cost: { steel: 4, manpower: 2 }, effects: [{ scope: "economy", key: "income.fuel", value: 1 }], desc: "+1 Fuel income — civilian stocks are seized for the front" },
  universal_levy: { key: "universal_levy", label: "Decree of the Universal Levy", kind: "decree", tier: "I", axis: "mobilization", direction: -1, cost: { steel: 3, manpower: 3 }, effects: [{ scope: "macro", key: "armyCap", value: 15 }], desc: "+15 army cap — every citizen owes service" },
  hearth_and_bulwark: { key: "hearth_and_bulwark", label: "Hearth & Bulwark Edict", kind: "decree", tier: "I", axis: "authority", direction: -1, cost: { steel: 5, manpower: 2 }, effects: [{ scope: "macro", key: "capitalDefense", value: 1 }, { scope: "macro", key: "unit.riflemen.defense", value: 1 }], desc: "+1 capital defense and +1 riflemen defense — the home front digs in" },
  emergency_powers_act: { key: "emergency_powers_act", label: "The Emergency Powers Act", kind: "decree", tier: "I", axis: "authority", direction: 1, cost: { steel: 4, manpower: 3 }, effects: [{ scope: "tactical", key: "initiative", value: 1 }, { scope: "tactical", key: "moraleTest", value: -1 }], desc: "The Assembly hands the Marshal absolute command for the duration and adjourns. Orders arrive a day sooner and are obeyed without argument; nothing said afterward will rally a broken line." },
  sealed_sites_order: { key: "sealed_sites_order", label: "The Sealed-Sites Order", kind: "decree", tier: "I", axis: "authority", direction: 1, creedLock: "flight", cost: { steel: 5, manpower: 4 }, effects: [{ scope: "macro", key: "capitalDefense", value: 1 }, { scope: "tactical", key: "moraleTest", value: 1 }, { scope: "economy", key: "fragmentYield", value: -1 }], desc: "Chart it, weld it, flag it, march on. The Ministry forbids the opening of any Wake under its flag, and the crews who obey come home whole and carrying less." },
  standing_corps_act: { key: "standing_corps_act", label: "The Standing Corps Act", kind: "decree", tier: "I", axis: "mobilization", direction: 1, cost: { steel: 4, manpower: 6 }, effects: [{ scope: "macro", key: "unit.riflemen.defense", value: 1 }, { scope: "macro", key: "armyCap", value: -10 }], desc: "Service becomes a trade with a wage, a pension and a term of years. The line holds where a levy would have broken, and the muster roll is a great deal shorter." },
  charter_of_passage: { key: "charter_of_passage", label: "The Charter of Passage", kind: "decree", tier: "I", axis: "economy", direction: 1, creedLock: "finished_ledger", cost: { steel: 6, fuel: 3 }, effects: [{ scope: "economy", key: "income.steel", value: 1 }, { scope: "economy", key: "income.fuel", value: 1 }, { scope: "economy", key: "income.manpower", value: -1 }], desc: "Nobody is coming, so passage is bought. Chartered houses carry the Ministry's freight at published rates, take their cut in metal and fuel, and hire away the hands that loaded it." },
  reliquary_act: { key: "reliquary_act", label: "The Reliquary Act", kind: "decree", tier: "I", axis: "creed", direction: 1, cost: { steel: 5, manpower: 4 }, effects: [{ scope: "macro", key: "digSpeed", value: 1 }, { scope: "economy", key: "buildTurns", value: -1 }, { scope: "economy", key: "income.steel", value: -1 }], desc: "A find is consecrated where it lies and worked by licensed crews. The digging goes faster and the works go shorter; the foundries wait, because nothing consecrated goes into a furnace." },
  writ_of_consecration: { key: "writ_of_consecration", label: "The Writ of Consecration", kind: "decree", tier: "I", axis: "creed", direction: 1, creedLock: "recall", cost: { steel: 4, manpower: 5 }, effects: [{ scope: "tactical", key: "moraleTest", value: 1 }, { scope: "economy", key: "fragmentYield", value: 1 }, { scope: "economy", key: "income.steel", value: -1 }], desc: "Every Object is entered on the Recall's roll and held against the day the works answer. Crews dig with a purpose and the yards are told, again, to take less." },
  breaking_yards_act: { key: "breaking_yards_act", label: "The Breaking-Yards Act", kind: "decree", tier: "I", axis: "creed", direction: -1, creedLock: "discarding", cost: { steel: 3, manpower: 5 }, effects: [{ scope: "economy", key: "income.steel", value: 2 }, { scope: "economy", key: "fragmentYield", value: 1 }, { scope: "economy", key: "buildTurns", value: 1 }], desc: "What was left for us we may break. Objects go to the yards whole and leave as metal, alloy and scrap; the works that wanted them whole wait another season." },
  ordinance_common_metal: { key: "ordinance_common_metal", label: "The Ordinance of Common Metal", kind: "decree", tier: "I", axis: "creed", direction: -1, cost: { steel: 4, manpower: 3 }, effects: [{ scope: "economy", key: "income.steel", value: 2 }, { scope: "economy", key: "fragmentYield", value: -1 }], desc: "No find is holy and no seam is spared. Everything lifted is weighed as metal at the foundry gate, and the assayers stop being paid to argue otherwise." },
  wakewatch_act: { key: "wakewatch_act", label: "The Wakewatch Act", kind: "decree", tier: "II:Wake", axis: "economy", direction: 1, cost: { steel: 7, manpower: 4, fragments: { wake: 3 } }, effects: [{ scope: "macro", key: "unit.artillery.attack", value: 1 }, { scope: "tactical", key: "unit.artillery.ranged", value: 1 }, { scope: "tactical", key: "unit.riflemen.morale", value: -1 }], desc: "Chartered crews are licensed to hunt live Wakes and paid by the core. The guns that come back off those hulls outrange anything the foundries have drawn; the crews that come back tell the line what it cost them." },
  // ── Relic projects — the Armory face of the four Tier-III works ──
  land_dreadnought: { key: "land_dreadnought", label: "The Land-Dreadnought", kind: "relic_project", tier: "III", cost: { steel: 30, fuel: 18, manpower: 12, fragments: { engine: 6, cache: 4 } }, effects: [{ scope: "macro", key: "armyCap", value: 20 }, { scope: "macro", key: "capitalDefense", value: 3 }, { scope: "tactical", key: "unit.crawler.armor", value: 1 }], desc: "A second keel, lesser and meaner: an imperial engine walled in plate until it can take what a fortress takes. The only house that fields two hulls is the house that built one." },
  lance_carriage: { key: "lance_carriage", label: "The Lance Carriage", kind: "relic_project", tier: "III", cost: { steel: 22, fuel: 14, manpower: 8, fragments: { wake: 6, engine: 3 } }, effects: [{ scope: "macro", key: "unit.artillery.attack", value: 3 }, { scope: "tactical", key: "unit.artillery.ranged", value: 2 }, { scope: "macro", key: "capitalDefense", value: -1 }], desc: "A Wake's own gun, cradled on a rail carriage and pointed outward at last. It reaches over fortification instead of through it, and the bay it displaces is never given back." },
  the_beacon: { key: "the_beacon", label: "The Beacon", kind: "relic_project", tier: "III", creedLock: "recall", cost: { steel: 26, fuel: 10, manpower: 20, fragments: { cipher: 8, wake: 4 } }, effects: [{ scope: "macro", key: "losRange", value: 3 }, { scope: "tactical", key: "moraleTest", value: 2 }, { scope: "economy", key: "income.manpower", value: 1 }], desc: "A cipher-cut mast raised to call the Absent home. Every house on the Ground can see the light and count the days; some of them walk toward it and enlist." },
  the_new_ignition: { key: "the_new_ignition", label: "The New Ignition", kind: "relic_project", tier: "III", creedLock: "discarding", cost: { steel: 40, fuel: 24, manpower: 16, fragments: { cache: 8, engine: 6 } }, effects: [{ scope: "economy", key: "income.steel", value: 2 }, { scope: "economy", key: "income.fuel", value: 2 }, { scope: "macro", key: "armyCap", value: -20 }], desc: "A human foundry aimed at the sky — the first hull that is ours. It eats the whole war economy's surplus and every hand the levy can spare, and it asks nobody." },
};

// The four Tier-III works (`docs/TECH_DESIGN.md` §2). A project is a card on the
// map's clock, not a research node: it needs an Object of its class housed in the
// Laboratory, doctrine prerequisites of which at least one is Reclamation, heavy
// conventional resources, classed fragments, and `buildDays` of on-clock
// construction that enemy probes and intercepts can see running. Each has a paired
// `ARMORY_ITEMS` row of kind `relic_project` carrying the identical `cost`.
// `buildDays` is a positive integer count of in-game days and is NOT the `buildTurns`
// effect key, which is a signed modifier where negative means the works finish sooner.
export const RELIC_PROJECTS = {
  land_dreadnought: { key: "land_dreadnought", label: "The Land-Dreadnought", objectClass: "engine", prereq: ["continuous_casting", "pattern_book"], buildDays: 24, cost: { steel: 30, fuel: 18, manpower: 12, fragments: { engine: 6, cache: 4 } }, effects: [{ scope: "macro", key: "armyCap", value: 20 }, { scope: "macro", key: "capitalDefense", value: 3 }, { scope: "tactical", key: "unit.crawler.armor", value: 1 }], desc: "A second keel, lesser and meaner: an imperial engine walled in plate until it can take what a fortress takes. The only house that fields two hulls is the house that built one." },
  lance_carriage: { key: "lance_carriage", label: "The Lance Carriage", objectClass: "wake", prereq: ["saturation_barrage", "assay_procedure"], buildDays: 18, cost: { steel: 22, fuel: 14, manpower: 8, fragments: { wake: 6, engine: 3 } }, effects: [{ scope: "macro", key: "unit.artillery.attack", value: 3 }, { scope: "tactical", key: "unit.artillery.ranged", value: 2 }, { scope: "macro", key: "capitalDefense", value: -1 }], desc: "A Wake's own gun, cradled on a rail carriage and pointed outward at last. It reaches over fortification instead of through it, and the bay it displaces is never given back." },
  the_beacon: { key: "the_beacon", label: "The Beacon", objectClass: "cipher", prereq: ["intercept_bureau", "pattern_book"], buildDays: 40, creedLock: "recall", cost: { steel: 26, fuel: 10, manpower: 20, fragments: { cipher: 8, wake: 4 } }, effects: [{ scope: "macro", key: "losRange", value: 3 }, { scope: "tactical", key: "moraleTest", value: 2 }, { scope: "economy", key: "income.manpower", value: 1 }], desc: "A cipher-cut mast raised to call the Absent home. Every house on the Ground can see the light and count the days; some of them walk toward it and enlist." },
  the_new_ignition: { key: "the_new_ignition", label: "The New Ignition", objectClass: "cache", prereq: ["deep_shaft_works", "continuous_casting"], buildDays: 40, creedLock: "discarding", cost: { steel: 40, fuel: 24, manpower: 16, fragments: { cache: 8, engine: 6 } }, effects: [{ scope: "economy", key: "income.steel", value: 2 }, { scope: "economy", key: "income.fuel", value: 2 }, { scope: "macro", key: "armyCap", value: -20 }], desc: "A human foundry aimed at the sky — the first hull that is ours. It eats the whole war economy's surplus and every hand the levy can spare, and it asks nobody." },
};
