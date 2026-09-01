// ---------------------------------------------------------------------------
// THE ARMS CATALOGUE — canonical (Lane I).
//
// "Rifles" is a class, not a weapon. Squads carry named weapon patterns from
// fictional manufacturers, in specific calibres, at a rolled quality grade.
//
// This module is ALSO the single place in the repository where armour
// mathematics exists (drift guard 12). ARMOUR_CLASSES, PEN_TABLE, TYPE_MATRIX
// and resolveHit are the Universal Damage Model; Lane A imports resolveHit
// rather than writing its own penetration code, and Lane J keys its vehicle
// facings off ARMOUR_CLASSES. No other file may re-derive penetration.
//
// Plain JavaScript in a .ts file, exactly as base44/shared/tactical.ts is:
// no TypeScript syntax, no imports. Every exported table is a PURE DATA
// LITERAL, because test/arms-mirror.test.js lifts each one out of this file
// TEXTUALLY (test/helpers/extract-const.js) and evaluates it — a computed
// table cannot be mirror-tested.
//
// Mirror: src/lib/arms.js — identical table content, identical function
// bodies, no UI-only fields on either side.
// ---------------------------------------------------------------------------

// The one RNG. Copied verbatim from src/lib/macro/worlds.js — a Deno shared
// module cannot import from src/, so copying is correct (Lane B is told the
// same). Every roll in this catalogue draws from one mulberry32 stream.
export const mulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Rounding helpers. Not exported: nothing outside this module should be
// re-rounding this module's numbers.
const round4 = (n) => Math.round(n * 10000) / 10000;

// ---------------------------------------------------------------------------
// 1. Vocabulary
//
// Declared as data so every test has an authority to check against rather
// than a hard-coded list copied into the test file.
// ---------------------------------------------------------------------------

export const DAMAGE_TYPES = ['kinetic', 'explosive', 'shaped', 'incendiary', 'fragmentation', 'concussive', 'chemical'];

export const WEAPON_CLASSES = ['sidearm', 'carbine', 'rifle', 'smg', 'lmg', 'hmg', 'shotgun', 'marksman', 'anti_armor', 'flame', 'mortar', 'crawler_gun', 'artillery', 'aircraft_gun'];

export const MOD_SLOTS = ['barrel', 'optic', 'magazine', 'stock', 'muzzle', 'bayonet', 'ammunition', 'mount'];

// The shipped ten-house key vocabulary (FACTION_ROSTER §1). A local allowlist
// for the access maps below — not a claim on Lane H's faction data.
export const HOUSE_KEYS = ['reclamation', 'combine', 'synod', 'covenant', 'ascendancy', 'commonweal', 'salvage', 'emberwright', 'procession', 'outrider'];

// The value space of WeaponPattern.appliesTo: Lane A's guaranteed nine, plus
// Lane F's declared additions. Declared locally on purpose — a shared Deno
// module never imports tactical.ts to borrow a union.
export const APPLIES_TO_KEYS = [
  'riflemen', 'assault', 'gunners', 'scouts', 'mortars', 'pioneers', 'crawler', 'artillery', 'fighter',
  'stormtroops', 'sappers', 'ski_troops', 'digger_corps', 'pilgrim_levy', 'provost', 'marksmen', 'flame_team', 'autocar_scouts', 'siege_mortar', 'land_dreadnought',
];

// Which regiment stock feeds a calibre — the shipped column set
// (COLUMN_KEYS in base44/shared/tactical.ts).
export const LOGISTICS_CLASSES = ['riflemen', 'crawler', 'artillery', 'fighter'];

// ---------------------------------------------------------------------------
// 2. THE UNIVERSAL DAMAGE MODEL
//
// Every target on the field — a figure, a squad stand, a vehicle facing, a
// poured work — declares one of these seven classes. `sealed` is a physical
// claim, not a rating: a sealed hull keeps fume and flame out of the crew
// compartment, which is why incendiary and chemical die against it and why
// `fortified` (immensely thick, wholly unsealed, full of men who must breathe)
// is the exception that proves the rule.
// ---------------------------------------------------------------------------

export const ARMOUR_CLASSES = {
  none:       { key: 'none',       armourValue: 0,  sealed: false, blurb: "Cloth, courage and a field coat; the Ministry issues no plate to a levy and enters the omission as mobility." },
  soft:       { key: 'soft',       armourValue: 1,  sealed: false, blurb: "Greatcoat, webbing and a sandbag lip — enough to turn a spent fragment, and nothing that arrives with intent." },
  light:      { key: 'light',      armourValue: 3,  sealed: false, blurb: "Sapper plate, an autocar's skin or a well-cut foxhole: proof against small arms at distance and against nothing at hand." },
  medium:     { key: 'medium',     armourValue: 6,  sealed: true,  blurb: "A line crawler's riveted hull, sealed against fume and flame, and the standard by which the ordnance boards price a gun." },
  heavy:      { key: 'heavy',      armourValue: 10, sealed: true,  blurb: "A breakthrough crawler's glacis — face-hardened, sloped and sealed; rifle fire arrives on it as weather." },
  superheavy: { key: 'superheavy', armourValue: 14, sealed: true,  blurb: "A land-fort's belt, laid in courses like masonry; the board keeps a separate ledger for what has ever moved it." },
  fortified:  { key: 'fortified',  armourValue: 12, sealed: false, blurb: "Poured works — a bunker, a keel's casemate: thicker than any hull, and full of men who must go on breathing." },
};

// PEN_TABLE — the penetration curve.
//
// LOOKUP RULE (penMultFor): rows are sorted by minDelta DESCENDING; return the
// `mult` of the FIRST row whose minDelta <= delta, where
// delta = weapon armour penetration − the target's armour value. The ordering
// is what makes the lookup unambiguous: exactly one row can be first.
//
// The final row is the mandatory mult: 0 row (drift guard 12) and uses -999
// rather than -Infinity so the literal survives Function() evaluation and a
// deep-equal across the mirror cleanly. Its effect is the whole point of the
// model: a rifle squad literally cannot scratch a heavy crawler. It may still
// pin the crew — see SUPPRESSION.
export const PEN_TABLE = [
  { minDelta: 6,    mult: 1.5 },
  { minDelta: 3,    mult: 1.25 },
  { minDelta: 0,    mult: 1 },
  { minDelta: -2,   mult: 0.6 },
  { minDelta: -4,   mult: 0.3 },
  { minDelta: -6,   mult: 0.1 },
  { minDelta: -999, mult: 0 },
];

// TYPE_MATRIX — 7 damage types × 7 armour classes = 49 numbers, no holes, no
// defaults, no fallback in code. The design intent each row encodes:
//
//  kinetic       the reference curve; solid shot degrades gently with plate
//  explosive     good against men and works, wasteful against sloped plate
//  shaped        beats plate but wastes on soft — a jet needs something to bite
//  incendiary    ignores plate, dies against a sealed hull, walks into a bunker
//  fragmentation shreds soft, spent on light and above
//  concussive    low damage everywhere; it is bought for suppression, not kills
//  chemical      stopped dead by any sealed hull; lethal in unsealed works
//
// One row reads as a contradiction until you separate the two mechanisms, so
// it is written down here rather than rediscovered: incendiary against
// `fortified` is 0.9, yet a flame projector still resolves to ZERO against a
// bunker. Both are right. The SEAL is what stops incendiary on a hull — the
// type matrix. The THICKNESS is what stops it on a poured work — the
// PEN_TABLE, and a hand-carried projector arrives with almost no penetration.
// So flame pins a bunker and artillery reduces it, and the 0.9 is reserved
// for the incendiary SHELL that arrives with penetration behind it. Do not
// "fix" this by raising a flame weapon's armour penetration: that would also
// let it scratch a heavy crawler, which is the one thing the model forbids.
export const TYPE_MATRIX = {
  kinetic:       { none: 1,    soft: 1,    light: 0.95, medium: 0.9,  heavy: 0.8,  superheavy: 0.7,  fortified: 0.6 },
  explosive:     { none: 1.1,  soft: 1.15, light: 1,    medium: 0.85, heavy: 0.7,  superheavy: 0.55, fortified: 0.9 },
  shaped:        { none: 0.5,  soft: 0.5,  light: 0.9,  medium: 1.25, heavy: 1.4,  superheavy: 1.45, fortified: 1.2 },
  incendiary:    { none: 1.2,  soft: 1.3,  light: 1.1,  medium: 0.3,  heavy: 0.2,  superheavy: 0.15, fortified: 0.9 },
  fragmentation: { none: 1.35, soft: 1.4,  light: 0.45, medium: 0.15, heavy: 0.05, superheavy: 0,    fortified: 0.1 },
  concussive:    { none: 0.8,  soft: 0.85, light: 0.7,  medium: 0.5,  heavy: 0.35, superheavy: 0.25, fortified: 0.45 },
  chemical:      { none: 1.3,  soft: 1.2,  light: 0.9,  medium: 0,    heavy: 0,    superheavy: 0,    fortified: 0.6 },
};

// A hit that does no damage still suppresses. The numeric weight of that is
// declared once, as data, so no lane invents its own pinning constant.
export const SUPPRESSION = { onZeroEffect: 0.5, concussiveBonus: 0.5 };

// penMultFor(delta) — the PEN_TABLE lookup rule, in code. Never returns
// undefined: the -999 row catches every delta the field can produce.
export const penMultFor = (delta) => {
  for (let i = 0; i < PEN_TABLE.length; i++) {
    if (delta >= PEN_TABLE[i].minDelta) return PEN_TABLE[i].mult;
  }
  return 0;
};

// resolveHit({ weapon, target }) → { effective, suppressOnly }
//
// `weapon` is a WeaponBase (or the damage profile loadoutProfile() reduces a
// squad to); `target` is an ARMOUR_CLASSES ROW, not a key. This is the only
// armour math in the repository — Lane A imports it, Lane J is forbidden a
// second copy. The return object has exactly two keys.
//
//   delta        = weapon.armorPen − the target's armour value
//   penMult      = penMultFor(delta)
//   typeMult     = TYPE_MATRIX[weapon.damageType][target.key]
//   effective    = round4(weapon.damage × penMult × typeMult)
//   suppressOnly = effective === 0   (the hit did nothing, and may still pin)
export const resolveHit = ({ weapon, target }) => {
  const delta = weapon.armorPen - target.armourValue;
  const penMult = penMultFor(delta);
  const typeMult = TYPE_MATRIX[weapon.damageType][target.key];
  const effective = round4(weapon.damage * penMult * typeMult);
  return { effective, suppressOnly: effective === 0 };
};

// resolveAoe({ weapon, victims }) → [{ effective, suppressOnly }]
//
// `victims` is [{ target: ArmourClass row, dist: hexes from burst centre }].
// Point fire (aoe === null) hits nothing here; victims beyond the radius are
// omitted from the result rather than returned as zeroes. Every victim is
// rolled against ITS OWN armour class, and this calls resolveHit to do it —
// there is deliberately no second copy of the arithmetic.
export const resolveAoe = ({ weapon, victims }) => {
  if (!weapon.aoe) return [];
  const out = [];
  for (let i = 0; i < victims.length; i++) {
    const v = victims[i];
    if (v.dist > weapon.aoe.radius) continue;
    const falloffMult = Math.max(0, 1 - weapon.aoe.falloff * v.dist);
    const scaled = { ...weapon, damage: round4(weapon.damage * falloffMult) };
    out.push(resolveHit({ weapon: scaled, target: v.target }));
  }
  return out;
};

// ---------------------------------------------------------------------------
// 3. Quality grades
//
// `mult` is MULTIPLICATIVE (an absent key is ×1) — it is the only
// multiplicative layer in the resolution order; maker signatures, mods and
// quirks are all additive deltas. `issue` is the neutral grade because the
// entire Points Audit is priced at issue.
//
// Quality is NOT gated by tierCap: tierCap gates the pattern pool only, so a
// levy rifle can come out of a dig as a relic and a [III] pattern can come out
// of a prize yard as scrap. rollWeight is an integer; the five sum to 1000.
//
// The grade's colour and visual belong to the Base44 session, not to this
// lane. Reference a grade by qualityKey and never name a colour.
// ---------------------------------------------------------------------------

export const QUALITY_GRADES = {
  scrap:   { key: 'scrap',   mult: { damage: 0.85, accuracy: 0.85, rateOfFire: 0.9,  reliability: 0.75 }, ptsMult: 0.7,  rollWeight: 300 },
  issue:   { key: 'issue',   mult: { damage: 1,    accuracy: 1,    rateOfFire: 1,    reliability: 1 },    ptsMult: 1,    rollWeight: 420 },
  proofed: { key: 'proofed', mult: { damage: 1.08, accuracy: 1.1,  rateOfFire: 1.05, reliability: 1.1 },  ptsMult: 1.25, rollWeight: 190 },
  master:  { key: 'master',  mult: { damage: 1.18, accuracy: 1.22, rateOfFire: 1.12, reliability: 1.2 },  ptsMult: 1.6,  rollWeight: 75 },
  relic:   { key: 'relic',   mult: { damage: 1.35, accuracy: 1.4,  rateOfFire: 1.25, reliability: 1.3 },  ptsMult: 2.4,  rollWeight: 15 },
};

// ---------------------------------------------------------------------------
// 4. Manufacturers
//
// Faction access to a maker's patterns, and what the Ministry charges for the
// privilege. A house fielding a captured pattern pays half again.
// ---------------------------------------------------------------------------

export const ACCESS_COST = { native: 1, licensed: 1.25, captured: 1.5 };

// MANUFACTURERS — works, guilds and armouries, each tied to a Great House
// (LORE §7 / FACTION_ROSTER §1) or a settlement culture (LORE §6 /
// FACTION_ROSTER §2).
//
// `signature` is a HOUSE SIGNATURE: additive WeaponBase deltas applied to
// EVERYTHING that maker builds, in resolveWeapon step 2. Every signature
// carries at least one genuine cost — a lean, not a bonus. Weight is the one
// field where a positive number is the cost.
//
// `nameStems` are the words a pattern's label may begin with; `access` covers
// all ten houses and names at least one native. Lore is 60–100 words.
//
// ⚠ Lane J APPENDS motor-works rows (keys mw_*) to this table after Lane I
// merges, in BOTH arms.ts and arms.js. Keep it a flat one-row-per-block
// literal, append new rows at the END, and never assert an exact row count —
// the gate is >= 8.
export const MANUFACTURERS = {
  hundredweight_works: {
    key: 'hundredweight_works',
    label: "The Hundredweight Combine Works",
    culture: 'hundredweight_bottoms',
    signature: { accuracy: -0.03, reliability: 0.06, weight: 0.2 },
    nameStems: ["Hundredweight", "Bottoms", "Sledge", "Combine"],
    access: { reclamation: 'native', combine: 'licensed', synod: 'licensed', covenant: 'licensed', ascendancy: 'licensed', commonweal: 'native', salvage: 'captured', emberwright: 'licensed', procession: 'licensed', outrider: 'licensed' },
    lore: "The Combine Works began as the maintenance shop of a mining concern and has never entirely stopped behaving like one. Its patterns are heavy, plain and forgiving: oversized chambers, coarse threads, sights a frightened man can still find in the dark. Ordnance boards across the Ground price every other weapon against a Hundredweight, and the Works is quietly proud of that and quietly poor because of it. It licenses freely, holds no house's warrant, and stamps each receiver with the tonnage mark of the seam it was born over.",
  },
  reclamation_state_arsenal: {
    key: 'reclamation_state_arsenal',
    label: "The State Arsenal of the Reclamation",
    houseKey: 'reclamation',
    signature: { rateOfFire: 0.35, reliability: -0.07, weight: 0.4 },
    nameStems: ["Verdict", "Levy", "State", "Ironworks", "Unity"],
    access: { reclamation: 'native', combine: 'licensed', synod: 'captured', covenant: 'captured', ascendancy: 'licensed', commonweal: 'licensed', salvage: 'captured', emberwright: 'licensed', procession: 'captured', outrider: 'captured' },
    lore: "The State Arsenal exists to arm a levy faster than the levy can be raised. Its shops are measured in shifts rather than craftsmen, and its patterns are drawn around that fact: stamped housings, generous tolerances, a cyclic rate that empties a magazine before the holder can think better of it. Unity is the doctrine and the defect — an Arsenal weapon fits any Reclamation hand and stops in any weather the drawings did not anticipate. The Arsenal holds that a rifle outliving its bearer was a rifle overbuilt.",
  },
  emberwright_foundries: {
    key: 'emberwright_foundries',
    label: "The Emberwright Union Foundries",
    houseKey: 'emberwright',
    signature: { armorPen: 0.5, rateOfFire: -0.2, weight: 0.9 },
    nameStems: ["Emberwright", "Winter", "Cinder", "Forgeworks", "Anvilgate"],
    access: { reclamation: 'licensed', combine: 'licensed', synod: 'captured', covenant: 'captured', ascendancy: 'licensed', commonweal: 'licensed', salvage: 'captured', emberwright: 'native', procession: 'captured', outrider: 'licensed' },
    lore: "Ash-scarred and methodical, the Foundries answer every question with steel. Emberwright barrels run thicker than the drawings require, their breeches are proofed twice, and their shot is cut to bite plate rather than flesh. Union engineers publish tolerances the way parishes publish hymns and will argue a decimal for a season. What they will not do is make anything light. An Emberwright weapon is carried by two men or by a crawler, arrives late to every advance, and opens whatever the advance found waiting for it.",
  },
  ferrymen_shrine_armoury: {
    key: 'ferrymen_shrine_armoury',
    label: "The Ferrymen's Shrine-Armoury",
    houseKey: 'synod',
    culture: 'nine_cradles',
    signature: { accuracy: 0.06, reliability: 0.05, rateOfFire: -0.25, weight: 0.6 },
    nameStems: ["Cradle", "Ferryman", "Reliquary", "Vigilant", "Ninefold"],
    access: { reclamation: 'captured', combine: 'licensed', synod: 'native', covenant: 'captured', ascendancy: 'licensed', commonweal: 'licensed', salvage: 'captured', emberwright: 'captured', procession: 'native', outrider: 'licensed' },
    lore: "Weapons leave the shrine-armoury of the Nine Cradles blessed, numbered and slower than the front would like. Each is fitted by one hand from breech to muzzle: barrel lapped, trigger stoned, stock cut from cradle timber and inscribed with the fitter's name and the date of the vigil. The Ferrymen hold that a weapon is a promise kept in metal, and that promises are not mass-produced. Line officers who have carried one rarely surrender it at rotation, and the Armoury's ledgers have quietly stopped pretending otherwise.",
  },
  salvage_court_prize_yard: {
    key: 'salvage_court_prize_yard',
    label: "The Prize Yard of the Salvage Court",
    houseKey: 'salvage',
    signature: { rateOfFire: 0.4, reliability: -0.14, weight: -0.2 },
    nameStems: ["Prizeyard", "Writ", "Knife", "Adjudicated", "Bailiff"],
    access: { reclamation: 'captured', combine: 'licensed', synod: 'captured', covenant: 'captured', ascendancy: 'captured', commonweal: 'captured', salvage: 'native', emberwright: 'captured', procession: 'captured', outrider: 'licensed' },
    lore: "The Prize Yard does not manufacture so much as adjudicate. Captured receivers are re-bored, mismatched furniture is married, and the whole is stamped with a writ number and sold to the party who lost it, at a mark-up the Court considers just. Yard patterns fire fast, weigh little and fail without warning; the warranty is the writ, and the writ is the point. Bailiff-armourers boast that nothing in the yard was ever bought, and that nothing sold out of it has ever been returned.",
  },
  crossloom_pattern_house: {
    key: 'crossloom_pattern_house',
    label: "The Crossloom Pattern House",
    culture: 'crossloom',
    signature: { accuracy: 0.02, reliability: 0.03, weight: 0.8 },
    nameStems: ["Crossloom", "Waymark", "Knotwork", "Tollgate", "Openhand"],
    access: { reclamation: 'licensed', combine: 'native', synod: 'licensed', covenant: 'licensed', ascendancy: 'licensed', commonweal: 'licensed', salvage: 'licensed', emberwright: 'licensed', procession: 'captured', outrider: 'licensed' },
    lore: "Crossloom sells drawings, not favours. The pattern house was chartered so that a keel could refit at the Meet-ground without asking anyone's permission, and its designs are deliberately unremarkable: nothing brilliant, nothing brittle, no component beyond the reach of a middling workshop. The price is mass — a Crossloom weapon carries all the metal it takes to be repairable anywhere. Ten houses hold licences and none holds the drawings, which is precisely the arrangement the waystation's neutrality was built to survive.",
  },
  ascendancy_signal_works: {
    key: 'ascendancy_signal_works',
    label: "The Signal Works of the Ascendancy",
    houseKey: 'ascendancy',
    signature: { range: 1, accuracy: 0.07, damage: -0.35 },
    nameStems: ["Testimony", "Copperline", "Longear", "Beacon", "Antenna"],
    access: { reclamation: 'captured', combine: 'licensed', synod: 'licensed', covenant: 'captured', ascendancy: 'native', commonweal: 'licensed', salvage: 'captured', emberwright: 'captured', procession: 'captured', outrider: 'licensed' },
    lore: "The Signal Works builds instruments that happen to shoot. Its barrels are long, its sights are ground glass, its ranging tables are printed on the stock, and its projectiles are light enough to be pushed further than a sensible ordnance board would push them. The Ascendancy holds that a shot seen and recorded at distance is worth more than a shot that merely kills nearby — a doctrine its riflemen find easier to admire than to survive. Every receiver carries a transmission serial as well as a number.",
  },
  outrider_wheelwrights: {
    key: 'outrider_wheelwrights',
    label: "The Outrider Wheelwrights",
    houseKey: 'outrider',
    signature: { weight: -0.9, reliability: 0.05, range: -0.8 },
    nameStems: ["Outrider", "Dustpromise", "Wheelwright", "Skimline", "Courier"],
    access: { reclamation: 'captured', combine: 'licensed', synod: 'captured', covenant: 'licensed', ascendancy: 'captured', commonweal: 'licensed', salvage: 'licensed', emberwright: 'captured', procession: 'captured', outrider: 'native' },
    lore: "The Wheelwrights arm people who must carry everything they own at a trot. Their patterns are short, thin-walled and stripped of every ounce the Compact could argue away, with sealed actions that will run a season in dust without seeing a bench. What was traded away is reach: an Outrider weapon is decisive at conversational distance and merely irritating beyond it. Couriers accept the bargain, on the reasoning that a rifle which is present weighs more, in the end, than a rifle that was left behind.",
  },
  tarpool_burnworks: {
    key: 'tarpool_burnworks',
    label: "The Tarpool Burnworks",
    culture: 'tarpool',
    signature: { damage: 0.45, reliability: -0.12 },
    nameStems: ["Tarpool", "Seamfire", "Burnworks", "Slagline", "Firetongue"],
    access: { reclamation: 'licensed', combine: 'licensed', synod: 'captured', covenant: 'captured', ascendancy: 'licensed', commonweal: 'licensed', salvage: 'licensed', emberwright: 'native', procession: 'licensed', outrider: 'licensed' },
    lore: "The Burnworks grew out of a seam fire that has never been put out, and its trade has followed the flame ever since: thickened fuels, incendiary fillings and the projectors that deliver them. Tarpool sells to every house at once and considers that a moral position. Its patterns hit far harder than their weight suggests and are trusted by no quartermaster alive — pressure vessels sweat, valves stick, and the works' own proof-house has burned to the ground three times. Prices are posted daily, in chalk.",
  },
};

// ---------------------------------------------------------------------------
// 5. Calibres
//
// The cartridge, bomb, bore or fuel grade a pattern is chambered for, and the
// regiment stock that feeds it (logisticsClass ∈ LOGISTICS_CLASSES). The four
// numbers are the calibre's REFERENCE values: a pattern's own base must sit
// within ±50 % of each of them, which is what stops a "rifle" that is secretly
// an artillery piece.
//
// Ranges are hexes on the 15×11 tactical field. Weight is kilograms of the
// weapon a full example of the calibre needs to be built into — it drives the
// speed drag on a man-carried loadout, which is why crew-served and vehicle
// bores are heavy enough to be nobody's primary.
//
// The armour-penetration column is the hard one, and it is deliberate: every
// small-arm calibre tops out at 3, which against a heavy glacis (armour value
// 10) is a delta of −7 and therefore the PEN_TABLE's mult: 0 row. Only
// hr17_heavy and the vehicle bores clear it.
// ---------------------------------------------------------------------------

export const CALIBRES = {
  p9_service: {
    key: 'p9_service', label: "P.9 Service Round", class: 'sidearm',
    damage: 1.6, armorPen: 1, range: 2, weight: 1.1, logisticsClass: 'riflemen',
    lore: "Standardised by the Hundredweight Combine Works for pit-boss and signal officer alike, and adopted wholesale because it was already in every drawer on the Ground. It settles arguments in a trench and nothing further out.",
  },
  sm10_stub: {
    key: 'sm10_stub', label: "S.M.10 Stub Cartridge", class: 'smg',
    damage: 1.4, armorPen: 1, range: 3, weight: 3.4, logisticsClass: 'riflemen',
    lore: "A shortened pistol case the State Arsenal adopted so that a levy could be armed for a room rather than a field. The Salvage Court re-bores half the Ground's captured stubs to it, which is why nobody agrees whose cartridge it is.",
  },
  c11_carbine: {
    key: 'c11_carbine', label: "C.11 Short Rifle Cartridge", class: 'carbine',
    damage: 2.2, armorPen: 2, range: 5, weight: 3.6, logisticsClass: 'riflemen',
    lore: "The Outrider Compact's courier round: the line cartridge cut down until a rider could carry two hundred of them and still post a day's distance. The Wheelwrights standardised it; every scout arm on the Ground has since been drawn around it.",
  },
  r13_line: {
    key: 'r13_line', label: "R.13 Line Cartridge", class: 'rifle',
    damage: 2.8, armorPen: 2.5, range: 7, weight: 4.3, logisticsClass: 'riflemen',
    lore: "The cartridge the doctrine Standardized Calibers is about: one case, one bullet weight, one set of chamber drawings, published free by the Hundredweight Combine Works in 143 F.I. and adopted by every house that had to feed a levy. Before it, a rifle company scavenged four incompatible rounds and shot with whichever fitted; after it, ammunition ceased to be an argument and became a supply line.",
  },
  r13_belt: {
    key: 'r13_belt', label: "R.13 Belt Link", class: 'lmg',
    damage: 2.8, armorPen: 2.5, range: 8, weight: 9.8, logisticsClass: 'riflemen',
    lore: "The line cartridge on a disintegrating steel link, standardised by the State Arsenal so that a squad's automatic and a squad's rifles draw from one crate. The link is the whole invention; the round is unchanged, and deliberately so.",
  },
  hr17_heavy: {
    key: 'hr17_heavy', label: "H.R.17 Heavy Rifle Round", class: 'anti_armor',
    damage: 5.5, armorPen: 8, range: 6, weight: 16.5, logisticsClass: 'riflemen',
    lore: "The Emberwright Union's answer to the first crawler that walked through a rifle company: a long tapered case, a hardened core, and a recoil the Foundries never pretended to have solved. It is issued by the round, counted by the round, and answered for by the round.",
  },
  sg20_bore: {
    key: 'sg20_bore', label: "20-Bore Trench Shell", class: 'shotgun',
    damage: 3.6, armorPen: 1, range: 2, weight: 3.9, logisticsClass: 'riflemen',
    lore: "A brass-headed paper shell of buck, standardised by the Prize Yard for boarding work because the bore forgives a barrel nobody has measured. Ruinous against a greatcoat, useless against a skirt of plate at any distance whatever.",
  },
  mg13_sustained: {
    key: 'mg13_sustained', label: "M.G.13 Sustained-Fire Link", class: 'hmg',
    damage: 3.2, armorPen: 3, range: 9, weight: 26, logisticsClass: 'riflemen',
    lore: "The line cartridge again, loaded hot and linked heavy for a water-jacketed gun that is expected to fire all night. The Crossloom Pattern House holds the drawings and licenses them to anyone, which is why the belts fit guns that fit nothing else.",
  },
  fg2_fuel: {
    key: 'fg2_fuel', label: "F.G.2 Thickened Fuel Grade", class: 'flame',
    damage: 4, armorPen: 1, range: 2, weight: 21, logisticsClass: 'crawler',
    lore: "Tarpool's second grade: seam tar cut with light distillate until it clings, thrown from a pressure vessel nobody enjoys carrying. It goes over a parapet, through a firing slit and into a bunker's air, and stops dead at the first sealed hatch.",
  },
  m50_bore: {
    key: 'm50_bore', label: "50 mm Light Mortar Bomb", class: 'mortar',
    damage: 4.5, armorPen: 2, range: 9, weight: 18, logisticsClass: 'artillery',
    lore: "A finned bomb one man can carry six of, standardised by the Commonweal March so that a commune's levy could answer a machine-gun without waiting on a battery. Thin-walled, generous with fragments, indifferent to plate.",
  },
  m81_bore: {
    key: 'm81_bore', label: "81 mm Mortar Bomb", class: 'mortar',
    damage: 7.5, armorPen: 3, range: 13, weight: 56, logisticsClass: 'artillery',
    lore: "The battalion bore, standardised by the Crossloom Pattern House from three competing designs on the reasoning that the Ground could afford one of them. It reaches over any ridge on a tactical field and lands with enough case to matter.",
  },
  cg37_bore: {
    key: 'cg37_bore', label: "37 mm Crawler Gun Shot", class: 'crawler_gun',
    damage: 6.5, armorPen: 9, range: 10, weight: 95, logisticsClass: 'crawler',
    lore: "The first bore cut specifically to open a hull rather than a formation, standardised by the Emberwright Foundries in the decade the line crawler stopped being a novelty. Fast, flat, and increasingly embarrassed by what it meets on a modern glacis.",
  },
  cg57_bore: {
    key: 'cg57_bore', label: "57 mm Crawler Gun Shell", class: 'crawler_gun',
    damage: 10, armorPen: 13, range: 12, weight: 160, logisticsClass: 'crawler',
    lore: "The Foundries' reply to their own success: the same doctrine at a bore that still means it against face-hardened plate. It costs a larger turret ring, a longer loader and a crawler built around the gun rather than the other way about.",
  },
  a105_shell: {
    key: 'a105_shell', label: "105 mm Field Shell", class: 'artillery',
    damage: 14, armorPen: 7, range: 16, weight: 290, logisticsClass: 'artillery',
    lore: "The divisional shell, standardised by the Charter Combine because a single shell weight is a single contract. Fused for burst or delay, it is the round that most often decides a field engagement without anyone on the field seeing the gun.",
  },
  a150_shell: {
    key: 'a150_shell', label: "150 mm Siege Shell", class: 'artillery',
    damage: 22, armorPen: 10, range: 20, weight: 520, logisticsClass: 'artillery',
    lore: "The works-breaker, standardised by the Bastion Synod for the reduction of poured positions and kept in production by everyone who has since had to reduce one. Two men and a cradle to load; a bunker's ceiling to answer for.",
  },
  ac20_aircraft: {
    key: 'ac20_aircraft', label: "20 mm Aircraft Cannon Shell", class: 'aircraft_gun',
    damage: 7, armorPen: 6, range: 6, weight: 48, logisticsClass: 'fighter',
    lore: "A short high-velocity shell standardised by the Signal Works for wing mountings, where every gram is argued over and nothing may be reloaded in flight. It arrives in a two-second burst or not at all.",
  },
};
