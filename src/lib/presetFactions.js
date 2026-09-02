// Preset factions — ready-made nations a commander can requisition without the
// lifepath wizard or the synthesizeFaction LLM call. Each entry matches the
// shape FactionBuilder passes to base44.entities.Faction.create(...), so the
// quick-forge path is a pure client-side entity create with zero backend/credit
// dependency. Every roster is a "legal" ledger under src/lib/pointBuy.js
// (netPoints <= 0, <= 3 liabilities, one upgrade per unit) so it would also pass
// the interactive builder. Traits use the effect schema validated by
// base44/functions/synthesizeFaction (type in income_flat|unit_discount|
// attack_bonus|defense_bonus; unit in riflemen|crawler|gunboat|fighter; value 1-2).
//
// ── LANE H (2026-09-02): 3 presets -> 13 ───────────────────────────────────
// The ten Great Houses of `docs/FACTION_ROSTER.md` §1 join the three legacy
// rows. THE THREE LEGACY ROWS ARE ADDITIVE-ONLY: `id`, `factionName`,
// `doctrine`, `insigniaDescription`, `lore`, `traits`, `pointBuy.picks`,
// `npcDispositions` and the existing `lifepathChoices.{preset,doctrine,
// philosophy,value}` are byte-identical to what shipped, INCLUDING the legacy
// `philosophy` values (`war_economy`/`industry`/`fortress`) and `value` values
// (`glory`/`order`/`endurance`) that appear in neither `PHILOSOPHIES` nor
// `VALUES`. Those are not typos and must not be "fixed" — live saves reference
// them. `test/presets.test.js` freezes all three against a fixture.
//
// ADDITIVE FIELDS, per `docs/TACTICAL_SQUAD_PLAN.md` §4 as amended:
//   house         the plate stem — `house_<house>_crest` exists in IMAGE_LIBRARY
//   uniqueRoster  { squads, upgrades, decree, patterns } — Lane F/G/I keys
//   heraldVoice   the HERALD_VOICES.md pack key; always equals `house`
//   lifepathChoices.standard  one of the four shipped `std_*` plates
//   lifepathChoices.seeds     the four VISION §6.1 ideology axes, each -3..3
//
// NO `keel` FIELD (§4 AMENDMENT Q3b). A house's keel is not stored on the row;
// it is looked up from `house` through `KEEL_BY_HOUSE` below. The amendment says
// the keel plate "is keyed off the existing `house` value"; the plates an earlier
// lane actually shipped are keyed by KEEL SLUG (`keel_iron_verdict`), not by
// house stem (`keel_reclamation`), and existing catalog keys are never renamed.
// The lookup is what reconciles the two without adding a field or a plate.
//
// THE DEPARTURE IS DERIVED, NEVER STORED (`docs/prompts/PLATFORM_HANDOFF.md` G4:
// "a house's Departure can be derived from its axis position rather than stored
// twice"). `DEPARTURE_BY_CREED_SEED` is that derivation, written out over the
// WHOLE legal domain of the axis rather than as a rule with a default, so there
// is no seed value it silently fails to answer for.
//
// LEDGERS REWIRED FOR THE NOMAD-KEEL PERKS (Lane H, step 2). Eight new rows in
// `src/lib/pointBuy.js` cover the March itself — the graze, the swath, the
// draught columns and the boarding deck — and content nothing picks is not
// shipped content, so seven of the TEN AUTHORED houses now spend at least one.
// The THREE LEGACY LEDGERS ARE UNTOUCHED and stay byte-identical. Every rewrite
// below is a swap inside a still-legal ledger, not an addition on top of one:
// `MAX_LIABILITIES` is 3 and eight of the thirteen ledgers were already at the
// cap, so a new liability had to displace an old one rather than join it.
//
//   iron_reclamation   fuel_shortage + pariah_state -> tribute_graze
//                      COMPILES IDENTICALLY (-1 fuel income, -10 disposition):
//                      two separate misfortunes restated as the one act that
//                      causes both, and a liability slot freed doing it.
//   charter_combine    home_guard -> draught_columns   (a house of circuits
//                      insures its columns; it does not garrison a capital)
//   covenant_of_locks  brittle_industry -> swath_bound (a house that fills in
//                      the shafts behind it musters nobody from that ground)
//   signal_ascendancy  conscription -> ranging_batteries,
//                      fuel_shortage -> exposed_batteries (guns forward and
//                      exposed: everything it fires on is out of its own sight)
//   salvage_court      + boarding_parties, brittle_industry -> green_recruits
//                      (ferocious, brittle and expensive boarders)
//   emberwright_union  + field_refit_train, depleted_stockpiles ->
//                      exposed_batteries (the yard mounted the guns where it
//                      had room)
//   outrider_compact   rusting_arsenal -> stripped_escorts (plate cut away to
//                      keep the outrider ring fast — and net 0 rather than -1)
//
// `bastion_synod`, `commonweal_march` and `long_procession` keep the ledgers
// they shipped with: each is already at the liability cap and in character, and
// spending a perk on a house to satisfy a count is how a catalog gets padded.

// The Creed axis of `docs/VISION.md` §6.1 runs -3 (Reclaimer) .. +3
// (Restorationist), and `docs/LORE.md` §2 gives it four readings. Three sit ON
// the axis; the fourth does not:
//
//   +1 .. +3  the Recall           preserve the works, light the signal
//    0        the Finished Ledger  nobody is coming; passage is bought or built
//   -1        the Flight           they FLED; the Key must never be turned
//   -2 .. -3  the Discarding       we were equipment; we climb on our own hull
//
// The -1 band is the one that needs saying out loud. LORE §2 calls the Flight
// "the axis's dark orthogonal" — its holders read Reclaimer-side because they
// reject the inheritance, but they reject it to SEAL it, not to smelt it. The
// roster's own asterisk on the Covenant's `Creed -1*` is a note about exactly
// this position. `CREEDS[k].axisLean` cannot carry the distinction on its own:
// `flight` and `finished_ledger` both lean 0, so the lean is 2-to-1 ambiguous
// and this table, not the lean, is the mapping.
//
// WHERE THE TEN DEPARTURES COME FROM, stated exactly. `docs/LORE.md` §7 names a
// Departure for FOUR houses — Reclamation ("the Discarding, armed"), Combine
// ("the Ledger, incorporated"), Bastion Synod ("worthy of the Recall") and
// Covenant ("the Flight, militant") — and those four are what this table was
// read against. The other six are read off `docs/FACTION_ROSTER.md` §1's own
// `Theory` column and LORE §2's "who holds it" table, which is where the
// remaining houses are placed. An earlier draft of this comment claimed §7
// gave all ten; it does not, and the claim is exactly the false-justification
// defect the wave-4 addendum names. One conflict is open and is NOT resolved
// here: LORE §2 files the Emberwrights under the Finished Ledger while their
// seed, their §7 line and Lane G's `the_new_ignition` creedLock all read the
// Discarding. FACTION_ROSTER §6.2 flags it for the LORE owner.
export const DEPARTURE_BY_CREED_SEED = {
  "-3": "discarding",
  "-2": "discarding",
  "-1": "flight",
  "0": "finished_ledger",
  "1": "recall",
  "2": "recall",
  "3": "recall",
};

// house stem -> keel slug. The keel plate is `keel_<slug>`; the crest is
// `house_<stem>_crest`. The ten roster slugs are fixed by the plates the art
// lane already shipped; the three legacy slugs are new and follow the LORE §8
// naming pattern (an abstract noun bound to a material — a vow, a debt or a
// verdict).
export const KEEL_BY_HOUSE = {
  reclamation: "iron_verdict",
  combine: "vow_of_coal",
  synod: "reliquary_adamant",
  covenant: "vigil_of_chains",
  ascendancy: "testimony_of_copper",
  commonweal: "bond_of_bread",
  salvage: "writ_of_knives",
  emberwright: "debt_of_winters",
  procession: "burden_of_bells",
  outrider: "promise_of_dust",
  kessel: "debt_of_ash",
  ironsynod: "ledger_of_brass",
  grauwall: "verdict_of_stone",
};

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
    house: "kessel",
    uniqueRoster: {
      squads: ["assault", "flame_team"],
      upgrades: ["storm_hoods", "drum_magazines"],
      decree: "universal_levy",
      patterns: ["tp226_seamfire_trench_projector_mk2", "hw302_sledge_shoulder_gun_mk1"],
    },
    heraldVoice: "kessel",
    lifepathChoices: {
      preset: true,
      doctrine: "aggressive",
      philosophy: "war_economy",
      value: "glory",
      standard: "std_black",
      seeds: { authority: 2, economy: -1, creed: -2, mobilization: -2 },
    },
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
    house: "ironsynod",
    uniqueRoster: {
      squads: ["crawler", "gunners"],
      upgrades: ["armor_skirts", "drum_magazines"],
      decree: "war_bonds_decree",
      patterns: ["cl206_tollgate_sustained_gun_mk2", "hw184_combine_squad_automatic_mk3"],
    },
    heraldVoice: "ironsynod",
    lifepathChoices: {
      preset: true,
      doctrine: "economic",
      philosophy: "industry",
      value: "order",
      standard: "std_column",
      seeds: { authority: 1, economy: 2, creed: 0, mobilization: 1 },
    },
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
    house: "grauwall",
    uniqueRoster: {
      squads: ["riflemen", "pioneers"],
      upgrades: ["wire_spades", "sapper_plate"],
      decree: "fuel_ration_act",
      patterns: ["hw141_levy_rifle_mk2", "cl221_crossloom_light_mortar_mk2"],
    },
    heraldVoice: "grauwall",
    lifepathChoices: {
      preset: true,
      doctrine: "defensive",
      philosophy: "fortress",
      value: "endurance",
      standard: "std_column",
      seeds: { authority: 0, economy: -1, creed: 0, mobilization: -1 },
    },
    isNPC: false,
  },
  // ── THE TEN GREAT HOUSES (docs/FACTION_ROSTER.md §1, in roster order) ──
  // Each row's `doctrine` and `lifepathChoices.seeds` are read off that house's
  // roster entry and are asserted against it in test/presets.test.js — the doc
  // and the data cannot drift apart in one direction only. `uniqueRoster.squads`
  // and `.upgrades` are the house's signature pair from roster §5 (signature,
  // never exclusive); `.patterns` are Lane I patterns whose `appliesTo` covers at
  // least one of those squads; `.decree` is the house's own act of the Assembly,
  // and where that decree carries a `creedLock` the lock equals the Departure
  // this house's Creed seed derives to.
  {
    id: "iron_reclamation",
    factionName: "The Iron Reclamation",
    doctrine: "aggressive",
    insigniaDescription:
      "A mailed fist closing on a broken crown above an anvil, the field crossed by a numbered bulletin ribbon.",
    lore:
      "The Reclamation began as a mutual-defence pact between four sledge-crews and ended as an administration. It holds, without apology, that humanity was equipment — used, then left in the yard — and that a discarded thing owes its makers nothing but the labour of getting up. Every ten-day the Bulletins go out numbered and unsigned: the levy quota, the fuel allocation, the names struck from the roll. The Iron Verdict grazes in a straight line and does not negotiate its route. Its columns are enormous, young and briefly trained; its foundries are adequate and no better; its neighbours are entered in the ledger as ground not yet administered. Officers are taught that mercy is a scheduling problem. What the Reclamation wants is not the Key as an appeal but the Key as a machine, built by its own hands on a hull it welded itself, and every house standing between is simply unadministered ground.",
    traits: [
      { name: "The Numbered Levy", description: "Quota, not recruitment — the Bulletins name the ten-day's intake.", effect: { type: "unit_discount", unit: "riflemen", value: 1 } },
      { name: "Bulletin Discipline", description: "One order, read the same way in every column of the march.", effect: { type: "attack_bonus", unit: "riflemen", value: 1 } },
      { name: "Administered Ground", description: "Ground the Reclamation crosses is assessed before it is left.", effect: { type: "income_flat", value: 1 } },
    ],
    pointBuy: { picks: ["conscription", "veteran_corps", "brittle_industry", "tribute_graze"] },
    npcDispositions: { aggressive: 12, economic: -8, defensive: -6 },
    house: "reclamation",
    uniqueRoster: {
      squads: ["stormtroops", "riflemen"],
      upgrades: ["radio_pack", "sapper_plate"],
      decree: "emergency_powers_act",
      patterns: ["rs229_verdict_service_rifle_mk3", "rs236_levy_trench_automatic_mk2", "rs257_ironworks_belt_gun_mk2"],
    },
    heraldVoice: "reclamation",
    lifepathChoices: {
      preset: true,
      doctrine: "aggressive",
      philosophy: "industrial",
      value: "honor",
      standard: "std_column",
      seeds: { authority: 2, economy: 0, creed: -2, mobilization: -1 },
    },
    isNPC: false,
  },
  {
    id: "charter_combine",
    factionName: "The Charter Combine",
    doctrine: "economic",
    insigniaDescription:
      "A balance-scale hung between a coal-shovel and a coupling-hook, the beam dead level, on brass over green.",
    lore:
      "The Combine insures against theology. Its clerks will tell you, politely, that the planet stopped paying and the crews went home, that nothing personal was meant by it, and that passage off the Ground will therefore be bought like anything else is bought. So the Combine sells: harvest contracts, escort clauses, bonded warehousing, and the small mercy of credit at a rate. The Vow of Coal keeps three ledger-halls and no shrine. Its columns run to schedule because a late column is a penalty clause, and its provosts keep the yards quiet because a written-off asset is a written-off contract. It fights when the arithmetic requires it, at the range its underwriters approve, and it prefers a dependency to a victory — a house that owes the Combine grain does not need to be conquered. Ask the Combine what it believes and it will hand you a schedule of fees for the answer.",
    traits: [
      { name: "Underwritten Columns", description: "Every march is insured, and the premium is paid in season.", effect: { type: "income_flat", value: 2 } },
      { name: "Bought Hulls", description: "The Combine does not build crawlers; it takes delivery of them.", effect: { type: "unit_discount", unit: "crawler", value: 1 } },
      { name: "Escort Clause", description: "No cargo moves unaccompanied, and the escort is in the contract.", effect: { type: "defense_bonus", unit: "gunboat", value: 1 } },
    ],
    pointBuy: { picks: ["oil_concessions", "war_chest", "draught_columns", "war_weary", "green_recruits", "rusting_arsenal"] },
    npcDispositions: { aggressive: -14, economic: 14, defensive: 2 },
    house: "combine",
    uniqueRoster: {
      squads: ["autocar_scouts", "provost"],
      upgrades: ["armor_skirts", "drum_magazines"],
      decree: "charter_of_passage",
      patterns: ["cl252_waymark_pattern_rifle_mk1", "cl274_knotwork_light_gun_mk1", "sy277_prizeyard_turret_gun_mk3"],
    },
    heraldVoice: "combine",
    lifepathChoices: {
      preset: true,
      doctrine: "economic",
      philosophy: "mercantile",
      value: "progress",
      standard: "std_black",
      seeds: { authority: -1, economy: 2, creed: 0, mobilization: 0 },
    },
    isNPC: false,
  },
  {
    id: "bastion_synod",
    factionName: "The Bastion Synod",
    doctrine: "defensive",
    insigniaDescription:
      "A vault door standing open one hand's width with a lamp set in the gap, ringed by nine keys.",
    lore:
      "The Synod holds the Recall: the Wardens were summoned away, the wardship is suspended, and the works must be kept fit for the day the Absent look back. So it hoards. The Reliquary Adamant is a keel built around a vault, and everything the Synod does runs downstream of that — revetments finished a season before they are needed, marksmen who will not waste a round, parish covenants trading shelter for tithe and cipher-fragments. It does not strip the Anchor Fields; it maintains them, and posts a watch. Synod doctrine reckons in decades and holds a lost year cheaper than a lost archive. Rival heralds call this cowardice. The Preservation Roll answers as it always answers, by reading the list of what is still intact: so many stones, so many pages, so many lamps still lit, and the Ground one more year from forgetting how to be worthy of an answer.",
    traits: [
      { name: "Keel-Shrine Revetments", description: "The ground is prepared before the Synod is asked to hold it.", effect: { type: "defense_bonus", unit: "riflemen", value: 1 } },
      { name: "Adamant Plate", description: "Vault-grade steel, cut for the hull and grudged to the crews.", effect: { type: "defense_bonus", unit: "crawler", value: 1 } },
      { name: "The Preservation Roll", description: "Tithe and covenant, read aloud and collected on the ten-day.", effect: { type: "income_flat", value: 1 } },
    ],
    pointBuy: { picks: ["conscription", "home_guard", "trench_gear", "war_weary", "fuel_shortage", "rusting_arsenal"] },
    npcDispositions: { aggressive: -10, economic: 4, defensive: 15 },
    house: "synod",
    uniqueRoster: {
      squads: ["marksmen", "pioneers"],
      upgrades: ["marksman_pattern", "wire_spades"],
      decree: "reliquary_act",
      patterns: ["fs171_ferryman_watch_rifle_mk2", "fs159_ninefold_vigil_rifle_mk1", "fs188_reliquary_officers_sidearm_mk2"],
    },
    heraldVoice: "synod",
    lifepathChoices: {
      preset: true,
      doctrine: "defensive",
      philosophy: "agrarian",
      value: "survival",
      standard: "std_reliquary",
      seeds: { authority: -1, economy: 0, creed: 2, mobilization: 1 },
    },
    isNPC: false,
  },
  {
    id: "covenant_of_locks",
    factionName: "The Covenant of Locks",
    doctrine: "aggressive",
    insigniaDescription:
      "A chain drawn taut across a shaft-mouth and sealed with wax, no key shown anywhere on the field.",
    lore:
      "The Covenant reads the Withdrawal as a rout. Something came, or something woke, and the Wardens ran and left the doors ajar — so the war aim of the Vigil of Chains is that nobody on any side ever turns the Key. Its companies march to close: shafts filled, galleries burned out, Anchor Field approaches cratered, and the men who sell shaft-plans hanged in the yard where the plans were sold. This is not a house that hoards the leavings, and not one that smelts them either; it buries them and posts a guard on the spoil. It keeps no relic economy worth the name and a conventional army that frightens people who have seen one, because a lock is only as good as the garrison standing on it. Covenant heralds date every warning and keep it short. The lock at a place held today. See that it holds tomorrow.",
    traits: [
      { name: "Breaching Companies", description: "Men trained to reach a shaft-head through whatever is in front of it.", effect: { type: "attack_bonus", unit: "riflemen", value: 2 } },
      { name: "Warding Columns", description: "Hulls plated for the standing watch, not for the advance.", effect: { type: "defense_bonus", unit: "crawler", value: 1 } },
      { name: "Sworn to the Seal", description: "The Covenant never lacks volunteers; it lacks reasons to refuse them.", effect: { type: "unit_discount", unit: "riflemen", value: 1 } },
    ],
    pointBuy: { picks: ["mobilization_doctrine", "conscription", "swath_bound", "fuel_shortage", "pariah_state"] },
    npcDispositions: { aggressive: 13, economic: -12, defensive: 6 },
    house: "covenant",
    uniqueRoster: {
      squads: ["sappers", "flame_team"],
      upgrades: ["sapper_plate", "storm_hoods"],
      decree: "sealed_sites_order",
      patterns: ["em276_cinder_breaching_rifle_mk1", "cl281_openhand_shaped_lance_mk1", "hw249_bottoms_gallery_burner_mk1"],
    },
    heraldVoice: "covenant",
    lifepathChoices: {
      preset: true,
      doctrine: "aggressive",
      philosophy: "industrial",
      value: "survival",
      standard: "std_black",
      seeds: { authority: 1, economy: -1, creed: -1, mobilization: 1 },
    },
    isNPC: false,
  },
  {
    id: "signal_ascendancy",
    factionName: "The Signal Ascendancy",
    doctrine: "economic",
    insigniaDescription:
      "A copper mast rising from an open mouth, its wire carried past the shield's edge and deliberately not ended.",
    lore:
      "The Ascendancy's position is that the Absent never left the sky, only stopped answering, and that the correct response to being ignored is to become impossible to ignore. So the Testimony of Copper transmits: continuously, expensively, upward, in every cipher its scholars have wrenched out of the Anchor Fields. Its monument works are built to be legible from altitude. Its battles are fought to a fire plan, on map references, by crews who will never see the thing they are shooting at, and are staged where the smoke will carry. Ascendancy quartermasters buy antenna wire before they buy bread and consider this defensible. What unsettles rivals is not the grandeur; it is that the addresses are courteous, and copied to all humanity, and that not one of them has ever conceded that nobody is listening. The Ascendancy is auditioning for a patron it cannot prove exists, and it has never missed a broadcast.",
    traits: [
      { name: "Broadcast Fire Plan", description: "Every gun on the same ciphered warrant, laid before the light.", effect: { type: "attack_bonus", unit: "crawler", value: 1 } },
      { name: "Testimony Tolls", description: "The Array sells listening time to houses that will not admit to buying it.", effect: { type: "income_flat", value: 2 } },
      { name: "Antenna Wings", description: "Aircraft flown as relay masts first and as fighters second.", effect: { type: "attack_bonus", unit: "fighter", value: 1 } },
    ],
    pointBuy: { picks: ["industrial_base", "war_chest", "ranging_batteries", "green_recruits", "war_weary", "exposed_batteries"] },
    npcDispositions: { aggressive: -2, economic: 12, defensive: -4 },
    house: "ascendancy",
    uniqueRoster: {
      squads: ["siege_mortar", "marksmen"],
      upgrades: ["gas_shells", "radio_pack"],
      decree: "wakewatch_act",
      patterns: ["as294_longear_ranging_rifle_mk1", "as256_beacon_ranging_gun_mk1", "as268_copperline_long_rifle_mk2"],
    },
    heraldVoice: "ascendancy",
    lifepathChoices: {
      preset: true,
      doctrine: "economic",
      philosophy: "industrial",
      value: "progress",
      standard: "std_reliquary",
      seeds: { authority: 1, economy: 1, creed: 1, mobilization: 0 },
    },
    isNPC: false,
  },
  {
    id: "commonweal_march",
    factionName: "The Commonweal March",
    doctrine: "defensive",
    insigniaDescription:
      "A sheaf of grain bound with a levy-cord and quartered by the marks of the subscribing communes, on undyed cloth.",
    lore:
      "The Commonweal is a republic that had to learn to roll. Forty-odd communes pooled their levies, subscribed a hull between them and named it the Bond of Bread, and the arrangement has never once been simple. Nothing is decided aboard without an Assembly, and the Assembly sits at inconvenient hours. Its people hold that no Warden is coming and that none is owed anything: a people who cannot feed each other have no business among the stars, so the March feeds first and argues second. Its levies are enormous, cheap and stubborn past reason — commune sections dig before they are ordered to, and hold ground long after the ground has stopped mattering. Its foundries are small. Its advances are slow, because an advance is a motion and motions are debated. The March has lost battles to procedure and won wars by still being there when everyone else adjourned.",
    traits: [
      { name: "Subscription Levies", description: "Each commune sends its share, and the share is agreed in advance.", effect: { type: "unit_discount", unit: "riflemen", value: 1 } },
      { name: "Bedrock Companies", description: "Sections that dig on arrival and argue about withdrawing.", effect: { type: "defense_bonus", unit: "riflemen", value: 2 } },
      { name: "The Shared Harvest", description: "Provender pooled across the communes and issued against the roll.", effect: { type: "income_flat", value: 1 } },
    ],
    pointBuy: { picks: ["deep_reserves", "home_guard", "brittle_industry", "rusting_arsenal", "fuel_shortage"] },
    npcDispositions: { aggressive: -16, economic: 6, defensive: 13 },
    house: "commonweal",
    uniqueRoster: {
      squads: ["digger_corps", "provost"],
      upgrades: ["wire_spades", "marksman_pattern"],
      decree: "hearth_and_bulwark",
      patterns: ["hw203_sledge_short_rifle_mk1", "hw218_sledge_trench_sweeper_mk1", "hw166_bottoms_pit_revolver_mk1"],
    },
    heraldVoice: "commonweal",
    lifepathChoices: {
      preset: true,
      doctrine: "defensive",
      philosophy: "agrarian",
      value: "honor",
      standard: "std_first_keel",
      seeds: { authority: -3, economy: -2, creed: -2, mobilization: -2 },
    },
    isNPC: false,
  },
  {
    id: "salvage_court",
    factionName: "The Salvage Court",
    doctrine: "aggressive",
    insigniaDescription:
      "A boarding hook laid across a folded writ, both pinned by a knife driven through the seal.",
    lore:
      "The Court is a robbery wearing a wig. Its founding writ holds that property in motion or in abandonment is contestable salvage, that contest is a matter for adjudication, and that the Writ of Knives is the court of competent jurisdiction. Everything else follows from that with terrible consistency. Bailiff-companies serve notice by boarding. Prize crews are hard, well paid and hanged for informality. Convoys, draught columns and depots are the docket; grazing ground is somebody else's problem, because the Court eats what other houses carry. Its notices are issued after the fact, in perfect form, itemised, sealed and delivered to the party who used to own the goods. Nobody has ever successfully appealed one. Ask the Court about the Key and its clerks will note that it is presently unassigned property, that the Ledger closed a long time ago, and that when the thing surfaces there will be a hearing.",
    traits: [
      { name: "Writ of Prize", description: "Every seizure is adjudicated, valued and entered the same watch.", effect: { type: "income_flat", value: 1 } },
      { name: "Boarding Rams", description: "Notice is served hull to hull, at a range where drums beat aim.", effect: { type: "attack_bonus", unit: "gunboat", value: 2 } },
      { name: "Adjudicated Hulls", description: "The Court's crawlers were all somebody else's crawlers first.", effect: { type: "unit_discount", unit: "crawler", value: 1 } },
    ],
    pointBuy: { picks: ["veteran_corps", "naval_rams", "boarding_parties", "green_recruits", "rusting_arsenal", "pariah_state"] },
    npcDispositions: { aggressive: 16, economic: 8, defensive: -14 },
    house: "salvage",
    uniqueRoster: {
      squads: ["autocar_scouts", "assault"],
      upgrades: ["mine_flails", "drum_magazines"],
      decree: "ordinance_common_metal",
      patterns: ["sy288_knife_room_gun_mk5", "sy245_bailiff_boarding_gun_mk2", "sy277_prizeyard_turret_gun_mk3"],
    },
    heraldVoice: "salvage",
    lifepathChoices: {
      preset: true,
      doctrine: "aggressive",
      philosophy: "mercantile",
      value: "survival",
      standard: "std_black",
      seeds: { authority: 1, economy: 2, creed: 0, mobilization: 1 },
    },
    isNPC: false,
  },
  {
    id: "emberwright_union",
    factionName: "The Emberwright Union",
    doctrine: "economic",
    insigniaDescription:
      "A cold forge with one live coal at its heart, the coal the only red permitted on the field.",
    lore:
      "Emberwrights carry the ash of dead cities in their family names and the Rent in their bones; the Union was assembled out of the still-city exodus by people who watched fixed ground kill everyone they knew. Their heresy is simple, and unforgivable to three other houses: the Rent can be beaten, ground-rot is an engineering fault and not a debt owed to anybody, and the New Ignition will prove it. The Debt of Winters is a foundry with treads. Leavings go into its yards and come out as parts, tolerances and test results, and nobody aboard apologises for that. Union circulars read like engineering reports because they are, and once in a great while, near the bottom of a page of measurements, one of them says something close to awe. The Union does not expect to be forgiven the stripping. It expects to hand humanity a hull that works, and to be judged on the hull.",
    traits: [
      { name: "Foundry Keel", description: "The stacks are the hull; the hull is the works.", effect: { type: "income_flat", value: 2 } },
      { name: "Pattern Discipline", description: "One drawing, one tolerance, and a crawler that any yard can mend.", effect: { type: "unit_discount", unit: "crawler", value: 1 } },
      { name: "Cinder Plate", description: "Reclaimed plate, twice-fired, cut to a number rather than to a habit.", effect: { type: "defense_bonus", unit: "crawler", value: 1 } },
    ],
    pointBuy: { picks: ["industrial_base", "oil_concessions", "field_refit_train", "green_recruits", "war_weary", "exposed_batteries"] },
    npcDispositions: { aggressive: -6, economic: 16, defensive: 2 },
    house: "emberwright",
    uniqueRoster: {
      squads: ["land_dreadnought", "sappers"],
      upgrades: ["armor_skirts", "sapper_plate"],
      decree: "breaking_yards_act",
      patterns: ["em291_forgeworks_breakthrough_gun_mk1", "em214_winter_anti_crawler_rifle_mk2", "tp305_slagline_hull_projector_mk1"],
    },
    heraldVoice: "emberwright",
    lifepathChoices: {
      preset: true,
      doctrine: "economic",
      philosophy: "industrial",
      value: "progress",
      standard: "std_column",
      seeds: { authority: 0, economy: -1, creed: -2, mobilization: 1 },
    },
    isNPC: false,
  },
  {
    id: "long_procession",
    factionName: "The Long Procession",
    doctrine: "aggressive",
    insigniaDescription:
      "A processional bell slung inverted from a shrine-wagon's yoke above a road of worn stations.",
    lore:
      "Where the Synod keeps the inheritance, the Procession comes to take it out of unworthy hands, and it has not yet met a hand it judged worthy. The Burden of Bells is a pilgrim keel: shrine-wagons at the core, a vast unpaid levy walking around them, and a liturgy that marks the march station by station so that nobody has to think about the distance. The Recall is not doctrine aboard so much as weather — the works will be kept, the signal will be lit, and the Absent will find the Ground swept when they look at it again. Its levies are devout, numerous and barely trained; its heralds sing the day's stations at dusk and the names of the dead at dawn. A contested dig turns the Procession into something that cannot be argued with or burned off. Between digs it drifts, ringing, looking for the next thing to be certain about.",
    traits: [
      { name: "The Bell Muster", description: "The levy assembles to the bell and is fed from the shrine-wagons.", effect: { type: "unit_discount", unit: "riflemen", value: 1 } },
      { name: "Station by Station", description: "Devotion carried at the pace of the march, and it does not tire.", effect: { type: "attack_bonus", unit: "riflemen", value: 1 } },
      { name: "Shrine-Wagon Escort", description: "The reliquary hulls are plated first and abandoned last.", effect: { type: "defense_bonus", unit: "crawler", value: 1 } },
    ],
    pointBuy: { picks: ["mobilization_doctrine", "deep_reserves", "green_recruits", "fuel_shortage", "pariah_state"] },
    npcDispositions: { aggressive: 15, economic: -10, defensive: -2 },
    house: "procession",
    uniqueRoster: {
      squads: ["pilgrim_levy", "flame_team"],
      upgrades: ["wire_spades", "storm_hoods"],
      decree: "writ_of_consecration",
      patterns: ["fs159_ninefold_vigil_rifle_mk1", "tp313_firetongue_incendiary_mortar_mk1", "rs263_verdict_commune_mortar_mk3"],
    },
    heraldVoice: "procession",
    lifepathChoices: {
      preset: true,
      doctrine: "aggressive",
      philosophy: "agrarian",
      value: "honor",
      standard: "std_reliquary",
      seeds: { authority: 2, economy: -1, creed: 3, mobilization: -2 },
    },
    isNPC: false,
  },
  {
    id: "outrider_compact",
    factionName: "The Outrider Compact",
    doctrine: "economic",
    insigniaDescription:
      "A rider's stirrup enclosing a shut door, with dust drawn as three horizontal strokes beneath.",
    lore:
      "The Compact is the smallest keel on the Ground and the only one that is proud of it. The Promise of Dust runs light, grazes wide and never sits, ringed at all hours by outrider columns that see three days further than anybody else's scouts. Its people are herders and couriers who read the Withdrawal as a warning and not a summons: leave the doors shut, pay the dead, and sell the map to whoever intends to walk through them anyway. It digs nothing. It sells everything else — routes, weather, column strengths, the position of somebody's flank — priced honestly and delivered on time, because a courier who is wrong once is a courier nobody buys from twice. Pin the Compact against hard ground and it breaks like a dropped lamp. Nobody has managed to do it in eleven years, which the Compact regards as the whole of its military doctrine.",
    traits: [
      { name: "Skim and Sell", description: "The Compact grazes thin ground and makes the difference up in intelligence.", effect: { type: "income_flat", value: 1 } },
      { name: "Long-Legged Wings", description: "Aircraft flown as couriers, and built to come home from further out.", effect: { type: "defense_bonus", unit: "fighter", value: 1 } },
      { name: "Saddle Guns", description: "Everything the Compact fields shoots from the move or does not shoot.", effect: { type: "attack_bonus", unit: "crawler", value: 1 } },
    ],
    pointBuy: { picks: ["oil_concessions", "drop_tanks", "depleted_stockpiles", "brittle_industry", "stripped_escorts"] },
    npcDispositions: { aggressive: -4, economic: 11, defensive: -8 },
    house: "outrider",
    uniqueRoster: {
      squads: ["ski_troops", "autocar_scouts"],
      upgrades: ["ski_conversions", "radio_pack"],
      decree: "standing_corps_act",
      patterns: ["ow197_courier_dust_carbine_mk2", "ow311_dustpromise_field_rifle_mk2", "ow259_skimline_saddle_gun_mk1"],
    },
    heraldVoice: "outrider",
    lifepathChoices: {
      preset: true,
      doctrine: "economic",
      philosophy: "mercantile",
      value: "survival",
      standard: "std_column",
      seeds: { authority: -2, economy: 1, creed: -1, mobilization: 2 },
    },
    isNPC: false,
  },
];

// Strip the presentation-only fields before handing the record to the SDK.
// `base44/entities/Faction.jsonc` has no column for any of them and the entity
// change is platform-owned, so a preset's `id`, `house`, `uniqueRoster` and
// `heraldVoice` must not reach `Faction.create(...)`. There is no `keel` to
// strip — §4 amendment Q3b keeps it off the row (see `KEEL_BY_HOUSE`).
export function presetToFactionRecord(preset) {
  const { id, house, uniqueRoster, heraldVoice, ...record } = preset;
  return record;
}

// The Departure a preset holds, derived from its Creed-axis seed. Never stored
// on the row; `docs/prompts/PLATFORM_HANDOFF.md` G4 asks for exactly this so
// `creedLock` has one thing to compare against. Returns a `CREEDS` key.
export const departureOf = (preset) =>
  DEPARTURE_BY_CREED_SEED[String(preset?.lifepathChoices?.seeds?.creed)];

// The keel slug a house sails, for the `keel_<slug>` plate. See KEEL_BY_HOUSE.
export const keelOf = (preset) => KEEL_BY_HOUSE[preset?.house];
