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
// tier 1 = 3 RP, tier 2 = 4 RP, tier 3 = 6 RP, tier 4 = 9 RP — so a whole branch
// is 22 RP and the whole tree is 110 RP. No single game finishes the tree; that
// is the intent (`docs/TECH_DESIGN.md` §8).
//
// `prereq` is a key, an array of keys (all of which must be completed), or null.
// Every prereq sits at a strictly lower tier than the tech that names it, which
// is what makes cycles impossible. Each branch's tier-4 capstone names at least
// one prereq from a DIFFERENT branch: the top of a branch is never reachable by
// climbing that branch alone.
//
// `effect` is the human one-line summary rendered in the Doctrine Book.
// `effects[]` is the machine encoding the engine applies, in the §4 effect-key
// vocabulary. The two always agree; prose describes, numbers decide.
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
  bonded_manifests: { key: "bonded_manifests", branch: "industry", tier: 3, label: "Bonded Manifests", cost: 6, prereq: "synthetic_fuel", creedLock: "finished_ledger", effect: "+1 Steel income · +1 Fuel income", effects: [{ scope: "economy", key: "income.steel", value: 1 }, { scope: "economy", key: "income.fuel", value: 1 }], desc: "The ledger is closed and nobody is coming; what cannot be begged is bought. Bonded manifests move salvage between keels at rates the counting houses will actually honor." },
  continuous_casting: { key: "continuous_casting", branch: "industry", tier: 4, label: "Continuous Casting Order", cost: 9, prereq: ["total_mobilization", "motorized_supply"], effect: "+2 Steel income · crawler armor +1", effects: [{ scope: "economy", key: "income.steel", value: 2 }, { scope: "tactical", key: "unit.crawler.armor", value: 1 }], desc: "The furnaces are never banked again. Plate leaves the line still glowing and is bolted onto hulls within the watch, and the swath behind the keel runs black for a ten-day." },
  // ── Logistics — supply trains, field kitchens and the staff college ──
  field_kitchens: { key: "field_kitchens", branch: "logistics", tier: 1, label: "Field Kitchens", cost: 3, prereq: null, effect: "Army cap +10", effects: [{ scope: "macro", key: "armyCap", value: 10 }], desc: "An army marches on its stomach; hot rations keep more companies in the field." },
  motorized_supply: { key: "motorized_supply", branch: "logistics", tier: 2, label: "Motorized Supply Trains", cost: 4, prereq: "field_kitchens", effect: "Supply range +1", effects: [{ scope: "macro", key: "supplyRange", value: 1 }], desc: "Trucks replace mules — the supply net reaches one zone deeper into the front." },
  general_staff_academy: { key: "general_staff_academy", branch: "logistics", tier: 3, label: "General Staff Academy", cost: 6, prereq: "motorized_supply", effect: "Capital defense +1 · riflemen defense +1", effects: [{ scope: "macro", key: "capitalDefense", value: 1 }, { scope: "macro", key: "unit.riflemen.defense", value: 1 }], desc: "A generation of officers schooled in the hard arithmetic of the trenches." },
  grand_quartermastery: { key: "grand_quartermastery", branch: "logistics", tier: 4, label: "Grand Quartermastery", cost: 9, prereq: ["general_staff_academy", "synthetic_fuel"], effect: "Supply range +1 · army cap +20 · crawler speed +1", effects: [{ scope: "macro", key: "supplyRange", value: 1 }, { scope: "macro", key: "armyCap", value: 20 }, { scope: "macro", key: "unit.crawler.speed", value: 1 }], desc: "One office writes every manifest on the March. Columns that once waited on the keel draw instead from depots laid down ahead of them, and nothing halts to eat." },
  // ── Signals — red traffic, listening posts and the reading of the enemy ──
  red_traffic_discipline: { key: "red_traffic_discipline", branch: "signals", tier: 1, label: "Red-Traffic Discipline", cost: 3, prereq: null, effect: "Initiative +1", effects: [{ scope: "tactical", key: "initiative", value: 1 }], desc: "Combat-band chatter is cut to call-signs and numbers. Orders arrive while they still mean something, and the enemy's listeners are handed nothing but the sound of counting." },
  listening_posts: { key: "listening_posts", branch: "signals", tier: 2, label: "Listening Posts", cost: 4, prereq: "red_traffic_discipline", effect: "Line of sight +1", effects: [{ scope: "macro", key: "losRange", value: 1 }], desc: "Wire teams raise masts along the swath and leave crews behind to sit in the cold with them. The March sees one day further than it marches." },
  traffic_analysis: { key: "traffic_analysis", branch: "signals", tier: 3, label: "Traffic Analysis", cost: 6, prereq: ["listening_posts", "motorized_supply"], effect: "Initiative +1 · morale tests +1", effects: [{ scope: "tactical", key: "initiative", value: 1 }, { scope: "tactical", key: "moraleTest", value: 1 }], desc: "Nobody breaks the enemy's cipher; the office counts his messages instead. Volume, hour and bearing tell the staff where the blow falls, and a warned line does not waver." },
  vigil_watch: { key: "vigil_watch", branch: "signals", tier: 3, label: "The Vigil Watch", cost: 6, prereq: "listening_posts", creedLock: "recall", effect: "Line of sight +2", effects: [{ scope: "macro", key: "losRange", value: 2 }], desc: "Masts are raised for the Recall as much as for the war. Crews keep watch on the sky between the Lamp and the Coal, and see every column that moves beneath it." },
  intercept_bureau: { key: "intercept_bureau", branch: "signals", tier: 4, label: "The Intercept Bureau", cost: 9, prereq: ["traffic_analysis", "general_staff_academy"], effect: "Line of sight +2 · initiative +1 · morale tests +1", effects: [{ scope: "macro", key: "losRange", value: 2 }, { scope: "tactical", key: "initiative", value: 1 }, { scope: "tactical", key: "moraleTest", value: 1 }], desc: "Every listening post reports to one room, and the room reports the enemy's next three days. Marches are met before they arrive; ambushes are attended rather than suffered." },
  // ── Reclamation — digs, assays and what the leavings are worth once opened ──
  survey_cadres: { key: "survey_cadres", branch: "reclamation", tier: 1, label: "Survey Cadres", cost: 3, prereq: null, effect: "Dig speed +1", effects: [{ scope: "macro", key: "digSpeed", value: 1 }], desc: "Prospectors schooled to read a ruin before breaking it: which seals are sound, which floor is a lid, which red flag was planted by an honest crew." },
  assay_procedure: { key: "assay_procedure", branch: "reclamation", tier: 2, label: "Assay Procedure", cost: 4, prereq: "survey_cadres", effect: "Fragment yield +1", effects: [{ scope: "economy", key: "fragmentYield", value: 1 }], desc: "Finds are classed at the pit head instead of the keel — cache, engine, cipher, wake — and nothing worth carrying is left in the spoil for the next house to walk over." },
  sealing_protocols: { key: "sealing_protocols", branch: "reclamation", tier: 2, label: "Sealing Protocols", cost: 4, prereq: "survey_cadres", creedLock: "flight", effect: "Capital defense +1 · riflemen morale +1", effects: [{ scope: "macro", key: "capitalDefense", value: 1 }, { scope: "tactical", key: "unit.riflemen.morale", value: 1 }], desc: "Chart the find, weld the door, post the flag, march away whole. Crews who are never ordered to open a Wake come back with their nerve and their number intact." },
  deep_shaft_works: { key: "deep_shaft_works", branch: "reclamation", tier: 3, label: "Deep-Shaft Works", cost: 6, prereq: ["assay_procedure", "field_kitchens"], effect: "Dig speed +1 · +1 Manpower income", effects: [{ scope: "macro", key: "digSpeed", value: 1 }, { scope: "economy", key: "income.manpower", value: 1 }], desc: "Winches, sumps and a standing camp at the pit head. A site that once ate a march's daylight is worked in shifts, and hands come to where the digging is." },
  stripping_yards: { key: "stripping_yards", branch: "reclamation", tier: 3, label: "The Stripping Yards", cost: 6, prereq: ["assay_procedure", "rationalized_foundries"], creedLock: "discarding", effect: "Fragment yield +2 · +1 Steel income", effects: [{ scope: "economy", key: "fragmentYield", value: 2 }, { scope: "economy", key: "income.steel", value: 1 }], desc: "We were the gear they left behind; we owe their gear no better. Objects enter the yards whole and leave as fragments, alloy and a very great deal of scrap." },
  pattern_book: { key: "pattern_book", branch: "reclamation", tier: 4, label: "The Pattern Book", cost: 9, prereq: ["assay_procedure", "traffic_analysis"], effect: "Dig speed +2 · fragment yield +1 · build turns -1", effects: [{ scope: "macro", key: "digSpeed", value: 2 }, { scope: "economy", key: "fragmentYield", value: 1 }, { scope: "economy", key: "buildTurns", value: -1 }], desc: "Four hundred years of smudged copies, indexed at last against the pages they were copied from. The bureau no longer guesses what a thing was for, and the works run shorter." },
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
