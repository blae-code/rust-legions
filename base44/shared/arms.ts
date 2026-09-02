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
const round2 = (n) => Math.round(n * 100) / 100;

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
    lore: "A metal-headed paper shell of buck, standardised by the Prize Yard for boarding work because the bore forgives a barrel nobody has measured. Ruinous against a greatcoat, useless against a skirt of plate at any distance whatever.",
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

// ---------------------------------------------------------------------------
// 6. Weapon patterns
//
// A named, dated design from one maker, chambered for one calibre. This is the
// row a squad actually carries; `class` is what it is for, `calibre` is what
// feeds it, and `maker` is why it shoots the way it does.
//
// NOMENCLATURE is a hard format and is regex-tested:
//   <maker name-stem> <3-digit pattern year> <name>, Mk <roman>
// The year is the F.I. year the pattern was certified and lies between 141
// (First March) and 383 (the present). The label must begin with one of that
// maker's nameStems, so a reader can place a weapon before reading its numbers.
//
// EVERY ROW MUST BE LEGIBLE AS ITS MAKER. The maker's signature is applied on
// top of `base` at resolution time, but the authored base numbers lean the same
// way, so the two never fight: a State Arsenal weapon is already fast and
// already fragile before the signature makes it more so; a Signal Works weapon
// is already long and already light-hitting; a Wheelwright weapon is already
// short and already thin. A pattern whose base contradicts its maker's lean is
// a bug in the catalogue, not a subtlety.
//
// CALIBRE COHERENCE is tested: each of damage, armorPen, range and weight sits
// within ±50 % of the calibre's reference values. That is what stops a "rifle"
// which is secretly an artillery piece.
//
// THE SMALL-ARMS PENETRATION BUDGET IS THE ONE NUMBER THAT IS NOT NEGOTIABLE.
// For every pattern of class sidearm, carbine, rifle, smg, lmg, hmg, shotgun,
// marksman or flame, `base.armorPen` PLUS the maker's signature lean must stay
// strictly under 4 — a heavy glacis rates 10, and a delta of −6 still lets a
// tenth of the damage through. Only the Emberwright Foundries lean penetration
// (+0.5), which is why an Emberwright small arm tops out at a base of 3.4.
// Weapons of class anti_armor, crawler_gun and artillery must do the opposite
// and bite a heavy target for something greater than zero. mortar and
// aircraft_gun are deliberately unconstrained: a mortar is bought to kill men
// and a wing cannon is bought to kill aircraft, and neither is expected to
// answer for a crawler.
//
// VEHICLE ARMAMENT. Lane J draws its hardpoint weapons from this table BY KEY,
// so the crawler_gun, hmg, flame, mortar, artillery and aircraft_gun rows are
// written to be mounted, not merely to exist: they carry the `mount` slot, they
// list `crawler` / `land_dreadnought` / `fighter` in `appliesTo`, and their
// weights are frankly beyond a man. The ladder those rows describe, in the
// order a land engagement discovers it: a wing cannon opens an autocar and is
// spent on a breakthrough crawler's glacis; a light crawler gun opens a line
// crawler and is spent on a land-fort's belt; a heavy crawler gun opens the
// belt; a siege howitzer opens the works the belt was poured to protect.
//
// `quirks` is [] on every row in this pass and is populated when QUIRKS lands.
// ---------------------------------------------------------------------------

export const WEAPON_PATTERNS = {
  // --- sidearm ---------------------------------------------------------
  hw166_bottoms_pit_revolver_mk1: {
    key: 'hw166_bottoms_pit_revolver_mk1', label: "Bottoms 166 Pit Revolver, Mk I",
    maker: 'hundredweight_works', calibre: 'p9_service', class: 'sidearm', tier: 'I', pts: 0.6,
    base: { accuracy: 0.5, rateOfFire: 1.2, damage: 1.7, armorPen: 1, range: 2, reliability: 0.9, weight: 1.2, damageType: 'kinetic', aoe: null },
    slots: ['barrel', 'ammunition', 'stock'],
    quirks: ['gallery_worked'],
    appliesTo: ['riflemen', 'pioneers', 'provost'],
    blurb: "Six chambers, a frame a pit-boss could beat straight on an anvil, and a lanyard ring because the Works assumed it would be dropped. It has settled more disputes over a seam than over an enemy.",
  },
  sy214_writ_yard_automatic_mk3: {
    key: 'sy214_writ_yard_automatic_mk3', label: "Writ 214 Yard Automatic, Mk III",
    maker: 'salvage_court_prize_yard', calibre: 'p9_service', class: 'sidearm', tier: 'I', pts: 0.35,
    base: { accuracy: 0.42, rateOfFire: 2, damage: 1.5, armorPen: 0.9, range: 2, reliability: 0.72, weight: 0.95, damageType: 'kinetic', aoe: null },
    slots: ['magazine', 'barrel', 'muzzle'],
    quirks: ['prize_taken', 'barrel_droop'],
    appliesTo: ['assault', 'scouts', 'provost'],
    blurb: "Adjudicated from four incompatible frames and sold back to the party that lost three of them. It empties in a breath, and the Yard's warranty is the writ number stamped over the old maker's mark.",
  },
  fs188_reliquary_officers_sidearm_mk2: {
    key: 'fs188_reliquary_officers_sidearm_mk2', label: "Reliquary 188 Officer's Sidearm, Mk II",
    maker: 'ferrymen_shrine_armoury', calibre: 'p9_service', class: 'sidearm', tier: 'II:Wake', pts: 0.65,
    base: { accuracy: 0.62, rateOfFire: 0.9, damage: 1.9, armorPen: 1.1, range: 3, reliability: 0.92, weight: 1.45, damageType: 'kinetic', aoe: null },
    slots: ['barrel', 'optic', 'stock'],
    quirks: ['hand_lapped', 'ferrymans_blessing'],
    appliesTo: ['riflemen', 'provost', 'marksmen'],
    blurb: "Fitted by one hand, numbered against a vigil, and issued with a detachable shoulder stock nobody has ever been seen to use. Officers who carry one decline to surrender it at rotation, and the Armoury has stopped asking.",
  },

  // --- carbine ---------------------------------------------------------
  ow197_courier_dust_carbine_mk2: {
    key: 'ow197_courier_dust_carbine_mk2', label: "Courier 197 Dust Carbine, Mk II",
    maker: 'outrider_wheelwrights', calibre: 'c11_carbine', class: 'carbine', tier: 'I', pts: 0.85,
    base: { accuracy: 0.52, rateOfFire: 1.3, damage: 2.1, armorPen: 2, range: 4, reliability: 0.88, weight: 2.6, damageType: 'kinetic', aoe: null },
    slots: ['barrel', 'stock', 'magazine'],
    quirks: ['dust_sealed', 'close_bound'],
    appliesTo: ['scouts', 'autocar_scouts', 'ski_troops'],
    blurb: "Thin-walled, sealed at the action and stripped of every ounce the Compact could argue away. It rides a season in dust without seeing a bench and stops mattering at any distance a courier would rather not be at.",
  },
  hw203_sledge_short_rifle_mk1: {
    key: 'hw203_sledge_short_rifle_mk1', label: "Sledge 203 Short Rifle, Mk I",
    maker: 'hundredweight_works', calibre: 'c11_carbine', class: 'carbine', tier: 'I', pts: 0.95,
    base: { accuracy: 0.5, rateOfFire: 1.1, damage: 2.4, armorPen: 2.2, range: 5, reliability: 0.9, weight: 3.5, damageType: 'kinetic', aoe: null },
    slots: ['barrel', 'bayonet', 'stock'],
    quirks: ['gallery_worked'],
    appliesTo: ['riflemen', 'pioneers', 'digger_corps'],
    blurb: "The line rifle with a hand of barrel taken off it, for men who work in galleries and load onto wagons. The Works cut the sights down to match and priced it as a saving rather than a compromise.",
  },
  rs241_unity_column_carbine_mk4: {
    key: 'rs241_unity_column_carbine_mk4', label: "Unity 241 Column Carbine, Mk IV",
    maker: 'reclamation_state_arsenal', calibre: 'c11_carbine', class: 'carbine', tier: 'I', pts: 0.9,
    base: { accuracy: 0.46, rateOfFire: 1.6, damage: 2.2, armorPen: 2, range: 4, reliability: 0.78, weight: 3.9, damageType: 'kinetic', aoe: null },
    slots: ['magazine', 'stock', 'bayonet'],
    quirks: ['runs_hot'],
    appliesTo: ['riflemen', 'assault', 'autocar_scouts'],
    blurb: "Stamped by the shift rather than the craftsman, and issued to whoever is riding the column that week. It fits every Reclamation hand and stops in every weather the drawings did not anticipate.",
  },

  // --- rifle -----------------------------------------------------------
  hw141_levy_rifle_mk2: {
    key: 'hw141_levy_rifle_mk2', label: "Hundredweight 141 Levy Rifle, Mk II",
    maker: 'hundredweight_works', calibre: 'r13_line', class: 'rifle', tier: 'I', pts: 1,
    base: { accuracy: 0.55, rateOfFire: 1, damage: 2.8, armorPen: 2.5, range: 7, reliability: 0.85, weight: 4.3, damageType: 'kinetic', aoe: null },
    slots: ['barrel', 'optic', 'stock', 'bayonet'],
    quirks: ['settles_in'],
    appliesTo: ['riflemen', 'pilgrim_levy', 'pioneers'],
    blurb: "The rifle the First March was fought with and the rifle every ordnance board still prices against: plain, forgiving, and certified in the year the Ministry started counting. One point per figure, and the whole ledger is drawn from it.",
  },
  rs229_verdict_service_rifle_mk3: {
    key: 'rs229_verdict_service_rifle_mk3', label: "Verdict 229 Service Rifle, Mk III",
    maker: 'reclamation_state_arsenal', calibre: 'r13_line', class: 'rifle', tier: 'I', pts: 1.5,
    base: { accuracy: 0.5, rateOfFire: 1.8, damage: 2.7, armorPen: 2.4, range: 6, reliability: 0.76, weight: 5.1, damageType: 'kinetic', aoe: null },
    slots: ['magazine', 'bayonet', 'muzzle', 'stock'],
    quirks: ['runs_hot'],
    appliesTo: ['riflemen', 'assault', 'stormtroops'],
    blurb: "A self-loader drawn around the shift clock: generous tolerances, a gas port that will pass anything, and a cyclic rate that empties the magazine before the holder can think better of it. The Arsenal considers a rifle that outlives its bearer to have been overbuilt.",
  },
  cl252_waymark_pattern_rifle_mk1: {
    key: 'cl252_waymark_pattern_rifle_mk1', label: "Waymark 252 Pattern Rifle, Mk I",
    maker: 'crossloom_pattern_house', calibre: 'r13_line', class: 'rifle', tier: 'I', pts: 1.2,
    base: { accuracy: 0.57, rateOfFire: 1.1, damage: 2.9, armorPen: 2.6, range: 8, reliability: 0.87, weight: 5.4, damageType: 'kinetic', aoe: null },
    slots: ['barrel', 'optic', 'stock', 'bayonet'],
    quirks: ['proof_stamped'],
    appliesTo: ['riflemen', 'provost', 'pilgrim_levy'],
    blurb: "Nothing brilliant and nothing brittle: no component in it is beyond the reach of a middling workshop, which is exactly what the waystation chartered the house to guarantee. The price is metal, and the Meet-ground pays it gladly.",
  },
  as268_copperline_long_rifle_mk2: {
    key: 'as268_copperline_long_rifle_mk2', label: "Copperline 268 Long Rifle, Mk II",
    maker: 'ascendancy_signal_works', calibre: 'r13_line', class: 'rifle', tier: 'II:Ciph', pts: 1.05,
    base: { accuracy: 0.58, rateOfFire: 0.9, damage: 2.3, armorPen: 2.5, range: 10, reliability: 0.84, weight: 5.2, damageType: 'kinetic', aoe: null },
    slots: ['optic', 'barrel', 'stock'],
    quirks: ['ranged_by_wire'],
    appliesTo: ['riflemen', 'marksmen', 'scouts'],
    blurb: "A long barrel, a light bullet and a ranging table printed on the stock, on the Ascendancy's reasoning that a shot recorded at distance is worth more than a shot that merely kills nearby. Its riflemen find that doctrine easier to admire than to survive.",
  },
  em276_cinder_breaching_rifle_mk1: {
    key: 'em276_cinder_breaching_rifle_mk1', label: "Cinder 276 Breaching Rifle, Mk I",
    maker: 'emberwright_foundries', calibre: 'r13_line', class: 'rifle', tier: 'II:Eng', pts: 0.9,
    base: { accuracy: 0.52, rateOfFire: 0.8, damage: 3.4, armorPen: 3.3, range: 7, reliability: 0.88, weight: 6.2, damageType: 'kinetic', aoe: null },
    slots: ['barrel', 'muzzle', 'bayonet'],
    quirks: ['cold_forged', 'plate_hungry'],
    appliesTo: ['riflemen', 'sappers', 'stormtroops'],
    blurb: "Proofed twice, chambered tight and loaded hot, for the men who go through a firing slit rather than past it. It is the heaviest thing the Foundries will admit is still a rifle, and it is at the ceiling of what a rifle is permitted to open.",
  },
  ow311_dustpromise_field_rifle_mk2: {
    key: 'ow311_dustpromise_field_rifle_mk2', label: "Dustpromise 311 Field Rifle, Mk II",
    maker: 'outrider_wheelwrights', calibre: 'r13_line', class: 'rifle', tier: 'I', pts: 1.05,
    base: { accuracy: 0.53, rateOfFire: 1.2, damage: 2.6, armorPen: 2.4, range: 6, reliability: 0.89, weight: 3.4, damageType: 'kinetic', aoe: null },
    slots: ['stock', 'magazine', 'optic'],
    quirks: ['dust_sealed'],
    appliesTo: ['riflemen', 'scouts', 'autocar_scouts', 'ski_troops'],
    blurb: "The lightest full-calibre rifle anyone on the Ground will sell you, and the Wheelwrights will tell you what it cost: a hand of reach and a barrel that walks when it gets hot. A rifle that is present weighs more, in the end, than one left behind.",
  },
  fs159_ninefold_vigil_rifle_mk1: {
    key: 'fs159_ninefold_vigil_rifle_mk1', label: "Ninefold 159 Vigil Rifle, Mk I",
    maker: 'ferrymen_shrine_armoury', calibre: 'r13_line', class: 'rifle', tier: 'II:Wake', pts: 1.15,
    base: { accuracy: 0.64, rateOfFire: 0.8, damage: 3, armorPen: 2.7, range: 9, reliability: 0.9, weight: 5.8, damageType: 'kinetic', aoe: null },
    slots: ['optic', 'barrel', 'bayonet', 'stock'],
    quirks: ['ferrymans_blessing', 'hand_lapped'],
    appliesTo: ['riflemen', 'pilgrim_levy', 'marksmen'],
    blurb: "Barrel lapped, trigger stoned, stock cut from cradle timber and inscribed with the fitter's name and the date of the vigil. Nine Cradles holds that a weapon is a promise kept in metal; the front holds that promises are slow.",
  },

  // --- smg -------------------------------------------------------------
  rs236_levy_trench_automatic_mk2: {
    key: 'rs236_levy_trench_automatic_mk2', label: "Levy 236 Trench Automatic, Mk II",
    maker: 'reclamation_state_arsenal', calibre: 'sm10_stub', class: 'smg', tier: 'I', pts: 1.05,
    base: { accuracy: 0.4, rateOfFire: 3.4, damage: 1.4, armorPen: 1, range: 3, reliability: 0.75, weight: 3.8, damageType: 'kinetic', aoe: null },
    slots: ['magazine', 'stock', 'muzzle'],
    quirks: ['runs_hot', 'close_bound'],
    appliesTo: ['assault', 'stormtroops', 'riflemen'],
    blurb: "Pressed housings, a bolt like a length of bar stock, and a stub cartridge chosen so a levy could be armed for a room rather than a field. Nothing in it is precise and nothing in it is expensive.",
  },
  sy288_knife_room_gun_mk5: {
    key: 'sy288_knife_room_gun_mk5', label: "Knife 288 Room Gun, Mk V",
    maker: 'salvage_court_prize_yard', calibre: 'sm10_stub', class: 'smg', tier: 'I', pts: 0.45,
    base: { accuracy: 0.36, rateOfFire: 3.8, damage: 1.3, armorPen: 0.9, range: 2, reliability: 0.66, weight: 2.6, damageType: 'kinetic', aoe: null },
    slots: ['magazine', 'barrel'],
    quirks: ['prize_taken', 'point_blank_bite'],
    appliesTo: ['assault', 'provost', 'sappers'],
    blurb: "Fifth mark, fourth original maker, and no two in a crate quite alike. Bailiff-armourers sell it by the armful for boarding work and decline, politely, to discuss the fifth magazine.",
  },
  ow259_skimline_saddle_gun_mk1: {
    key: 'ow259_skimline_saddle_gun_mk1', label: "Skimline 259 Saddle Gun, Mk I",
    maker: 'outrider_wheelwrights', calibre: 'sm10_stub', class: 'smg', tier: 'I', pts: 1,
    base: { accuracy: 0.44, rateOfFire: 2.8, damage: 1.5, armorPen: 1.1, range: 3, reliability: 0.86, weight: 2.2, damageType: 'kinetic', aoe: null },
    slots: ['stock', 'magazine', 'muzzle'],
    quirks: ['dust_sealed', 'short_stocked'],
    appliesTo: ['autocar_scouts', 'scouts', 'ski_troops'],
    blurb: "Made to be fired one-handed off a moving running board and stowed under a seat for a week afterwards. The folding stock is the only ounce the Wheelwrights did not argue away, and they argued about it.",
  },

  // --- lmg -------------------------------------------------------------
  hw184_combine_squad_automatic_mk3: {
    key: 'hw184_combine_squad_automatic_mk3', label: "Combine 184 Squad Automatic, Mk III",
    maker: 'hundredweight_works', calibre: 'r13_belt', class: 'lmg', tier: 'I', pts: 2.1,
    base: { accuracy: 0.45, rateOfFire: 2.6, damage: 2.8, armorPen: 2.5, range: 8, reliability: 0.86, weight: 10.4, damageType: 'kinetic', aoe: null },
    slots: ['barrel', 'magazine', 'mount', 'stock'],
    quirks: ['crew_drilled'],
    appliesTo: ['gunners', 'riflemen', 'pioneers'],
    blurb: "One man carries it, one man carries the belt, and the squad's rifles feed from the same crate — which was the entire argument for the link. Quick-change barrel, coarse threads, and a bipod stiff enough to lever a wagon.",
  },
  rs257_ironworks_belt_gun_mk2: {
    key: 'rs257_ironworks_belt_gun_mk2', label: "Ironworks 257 Belt Gun, Mk II",
    maker: 'reclamation_state_arsenal', calibre: 'r13_belt', class: 'lmg', tier: 'I', pts: 2.3,
    base: { accuracy: 0.4, rateOfFire: 3.2, damage: 2.9, armorPen: 2.5, range: 8, reliability: 0.74, weight: 12.5, damageType: 'kinetic', aoe: null },
    slots: ['magazine', 'barrel', 'mount'],
    quirks: ['runs_hot', 'belt_shared'],
    appliesTo: ['gunners', 'assault', 'stormtroops'],
    blurb: "The Arsenal's answer to a machine-gun is more machine-gun: a cyclic rate no gunner asked for and a barrel that must be changed before the doctrine says it must. It wins a firefight in the first minute or not at all.",
  },
  cl274_knotwork_light_gun_mk1: {
    key: 'cl274_knotwork_light_gun_mk1', label: "Knotwork 274 Light Gun, Mk I",
    maker: 'crossloom_pattern_house', calibre: 'r13_belt', class: 'lmg', tier: 'II:Eng', pts: 2.6,
    base: { accuracy: 0.48, rateOfFire: 2.4, damage: 3, armorPen: 2.7, range: 9, reliability: 0.88, weight: 13.2, damageType: 'kinetic', aoe: null },
    slots: ['mount', 'optic', 'barrel', 'magazine'],
    quirks: ['proof_stamped', 'loaders_mate'],
    appliesTo: ['gunners', 'provost', 'pilgrim_levy'],
    blurb: "Drawn so that a middling workshop can make the parts and any house can hold the licence, which is why its belts fit guns that fit nothing else. It is heavier than its rivals and outlasts all of them.",
  },

  // --- hmg -------------------------------------------------------------
  cl206_tollgate_sustained_gun_mk2: {
    key: 'cl206_tollgate_sustained_gun_mk2', label: "Tollgate 206 Sustained Gun, Mk II",
    maker: 'crossloom_pattern_house', calibre: 'mg13_sustained', class: 'hmg', tier: 'I', pts: 3.9,
    base: { accuracy: 0.46, rateOfFire: 4, damage: 3.2, armorPen: 3, range: 10, reliability: 0.9, weight: 28, damageType: 'kinetic', aoe: null },
    slots: ['mount', 'barrel', 'magazine', 'optic'],
    quirks: ['crew_drilled', 'loaders_mate'],
    appliesTo: ['gunners', 'crawler', 'land_dreadnought'],
    blurb: "Water-jacketed, tripod-fed and expected to fire all night without anyone's opinion being sought. The Pattern House licenses the drawings to every house on the Ground, and every house has mounted it on something.",
  },
  em233_anvilgate_heavy_gun_mk1: {
    key: 'em233_anvilgate_heavy_gun_mk1', label: "Anvilgate 233 Heavy Gun, Mk I",
    maker: 'emberwright_foundries', calibre: 'mg13_sustained', class: 'hmg', tier: 'II:Eng', pts: 4,
    base: { accuracy: 0.44, rateOfFire: 3.2, damage: 3.8, armorPen: 3.4, range: 11, reliability: 0.9, weight: 34, damageType: 'kinetic', aoe: null },
    slots: ['mount', 'barrel', 'ammunition'],
    quirks: ['cold_forged', 'barrel_droop'],
    appliesTo: ['gunners', 'crawler', 'land_dreadnought'],
    blurb: "A gun cut to bite an autocar's skin rather than the man behind it, at the absolute ceiling of what the Foundries are allowed to call a machine-gun. Two men lift it; a crawler carries it; a line crawler ignores it.",
  },
  rs299_state_pintle_gun_mk4: {
    key: 'rs299_state_pintle_gun_mk4', label: "State 299 Pintle Gun, Mk IV",
    maker: 'reclamation_state_arsenal', calibre: 'mg13_sustained', class: 'hmg', tier: 'I', pts: 3.2,
    base: { accuracy: 0.38, rateOfFire: 5, damage: 3, armorPen: 2.9, range: 9, reliability: 0.72, weight: 24, damageType: 'kinetic', aoe: null },
    slots: ['mount', 'magazine', 'muzzle'],
    quirks: ['runs_hot', 'belt_shared'],
    appliesTo: ['crawler', 'fighter', 'gunners'],
    blurb: "Fitted to hatch rings, wing roots and anything else with a pintle, on the Arsenal's view that a stoppage on a mount is cheaper than a stoppage in a hand. It is loud, wasteful and always where it was needed.",
  },

  // --- shotgun ---------------------------------------------------------
  sy245_bailiff_boarding_gun_mk2: {
    key: 'sy245_bailiff_boarding_gun_mk2', label: "Bailiff 245 Boarding Gun, Mk II",
    maker: 'salvage_court_prize_yard', calibre: 'sg20_bore', class: 'shotgun', tier: 'I', pts: 1.4,
    base: { accuracy: 0.5, rateOfFire: 1.4, damage: 3.8, armorPen: 1, range: 2, reliability: 0.74, weight: 3.4, damageType: 'fragmentation', aoe: null },
    slots: ['barrel', 'ammunition', 'bayonet'],
    quirks: ['prize_taken', 'point_blank_bite'],
    appliesTo: ['assault', 'provost', 'sappers'],
    blurb: "The bore forgives a barrel nobody has measured, which is why the Yard standardised on it for boarding work. Ruinous against a greatcoat at the length of a gangway, and an insult to plate at any distance whatever.",
  },
  hw218_sledge_trench_sweeper_mk1: {
    key: 'hw218_sledge_trench_sweeper_mk1', label: "Sledge 218 Trench Sweeper, Mk I",
    maker: 'hundredweight_works', calibre: 'sg20_bore', class: 'shotgun', tier: 'I', pts: 1.6,
    base: { accuracy: 0.54, rateOfFire: 1.1, damage: 4.2, armorPen: 1.2, range: 3, reliability: 0.9, weight: 4.6, damageType: 'fragmentation', aoe: null },
    slots: ['barrel', 'bayonet', 'ammunition', 'stock'],
    quirks: ['point_blank_bite', 'gallery_worked'],
    appliesTo: ['riflemen', 'pioneers', 'digger_corps'],
    blurb: "A gallery gun before it was a trench gun: heavy walls, a long bayonet lug and a paper shell of buck the Works has never seen a reason to improve. It clears a firebay in one pull and reloads slowly enough to regret it.",
  },

  // --- marksman --------------------------------------------------------
  fs171_ferryman_watch_rifle_mk2: {
    key: 'fs171_ferryman_watch_rifle_mk2', label: "Ferryman 171 Watch Rifle, Mk II",
    maker: 'ferrymen_shrine_armoury', calibre: 'r13_line', class: 'marksman', tier: 'II:Wake', pts: 1,
    base: { accuracy: 0.78, rateOfFire: 0.6, damage: 3.2, armorPen: 2.8, range: 10, reliability: 0.92, weight: 6, damageType: 'kinetic', aoe: null },
    slots: ['optic', 'barrel', 'stock', 'ammunition'],
    quirks: ['hand_lapped', 'settles_in'],
    appliesTo: ['marksmen', 'scouts', 'riflemen'],
    blurb: "Selected from the vigil rifles by the fitter who made them and kept back for the watch that stands over a crossing. Ground glass, a stoned trigger, and a rate of fire that assumes one shot was the plan.",
  },
  as294_longear_ranging_rifle_mk1: {
    key: 'as294_longear_ranging_rifle_mk1', label: "Longear 294 Ranging Rifle, Mk I",
    maker: 'ascendancy_signal_works', calibre: 'r13_line', class: 'marksman', tier: 'II:Ciph', pts: 0.8,
    base: { accuracy: 0.82, rateOfFire: 0.5, damage: 2.2, armorPen: 2.5, range: 10, reliability: 0.85, weight: 5.6, damageType: 'kinetic', aoe: null },
    slots: ['optic', 'barrel', 'ammunition'],
    quirks: ['ranged_by_wire', 'dark_run_sights'],
    appliesTo: ['marksmen', 'scouts'],
    blurb: "An instrument that happens to shoot: the sight is the weapon and the barrel is its mounting. Signal Works marksmen are trained to report the fall of shot before they are trained to reload.",
  },
  hw262_bottoms_selected_rifle_mk3: {
    key: 'hw262_bottoms_selected_rifle_mk3', label: "Bottoms 262 Selected Rifle, Mk III",
    maker: 'hundredweight_works', calibre: 'r13_line', class: 'marksman', tier: 'I', pts: 1.45,
    base: { accuracy: 0.68, rateOfFire: 0.9, damage: 2.9, armorPen: 2.6, range: 9, reliability: 0.9, weight: 4.8, damageType: 'kinetic', aoe: null },
    slots: ['optic', 'stock', 'bayonet'],
    quirks: ['settles_in', 'glare_cut_sights'],
    appliesTo: ['marksmen', 'riflemen', 'provost'],
    blurb: "Not designed: chosen. Every hundredth levy rifle off the line shoots better than the ninety-nine around it, and the Works has built a whole doctrine out of putting a sight on that one and saying nothing further.",
  },

  // --- anti_armor ------------------------------------------------------
  em214_winter_anti_crawler_rifle_mk2: {
    key: 'em214_winter_anti_crawler_rifle_mk2', label: "Winter 214 Anti-Crawler Rifle, Mk II",
    maker: 'emberwright_foundries', calibre: 'hr17_heavy', class: 'anti_armor', tier: 'II:Eng', pts: 2.3,
    base: { accuracy: 0.5, rateOfFire: 0.6, damage: 5.5, armorPen: 8, range: 6, reliability: 0.85, weight: 18, damageType: 'kinetic', aoe: null },
    slots: ['barrel', 'optic', 'ammunition', 'mount'],
    quirks: ['cold_forged', 'plate_hungry'],
    appliesTo: ['gunners', 'sappers', 'riflemen'],
    blurb: "The Foundries' answer to the first crawler that walked through a rifle company: a long tapered case, a hardened core, and a recoil the Union has never pretended to have solved. It is issued by the round and answered for by the round.",
  },
  cl281_openhand_shaped_lance_mk1: {
    key: 'cl281_openhand_shaped_lance_mk1', label: "Openhand 281 Shaped Lance, Mk I",
    maker: 'crossloom_pattern_house', calibre: 'hr17_heavy', class: 'anti_armor', tier: 'II:Eng', pts: 2.4,
    base: { accuracy: 0.46, rateOfFire: 0.4, damage: 7.5, armorPen: 9, range: 4, reliability: 0.8, weight: 12, damageType: 'shaped', aoe: null },
    slots: ['optic', 'ammunition', 'mount'],
    quirks: ['plate_hungry', 'proof_stamped'],
    appliesTo: ['sappers', 'pioneers', 'assault', 'stormtroops'],
    blurb: "A tube, a lined cone and a drawing anyone may hold: the Pattern House published it rather than sell it, and every house on the Ground has since made its own. The jet needs plate to bite, and finds men a waste of a charge.",
  },
  hw302_sledge_shoulder_gun_mk1: {
    key: 'hw302_sledge_shoulder_gun_mk1', label: "Sledge 302 Shoulder Gun, Mk I",
    maker: 'hundredweight_works', calibre: 'hr17_heavy', class: 'anti_armor', tier: 'I', pts: 1.7,
    base: { accuracy: 0.42, rateOfFire: 0.5, damage: 6.4, armorPen: 7, range: 3, reliability: 0.86, weight: 9.5, damageType: 'shaped', aoe: { radius: 1, falloff: 0.6 } },
    slots: ['ammunition', 'stock'],
    quirks: ['close_bound', 'plate_hungry'],
    appliesTo: ['riflemen', 'assault', 'pioneers', 'ski_troops'],
    blurb: "The cheap answer, and the Works is not ashamed of it: a stamped tube, a coarse sight and a charge that must be walked to within a stone's throw of the hull. Everything about it assumes the man carrying it would rather be elsewhere.",
  },

  // --- flame -----------------------------------------------------------
  tp226_seamfire_trench_projector_mk2: {
    key: 'tp226_seamfire_trench_projector_mk2', label: "Seamfire 226 Trench Projector, Mk II",
    maker: 'tarpool_burnworks', calibre: 'fg2_fuel', class: 'flame', tier: 'I', pts: 2,
    base: { accuracy: 0.6, rateOfFire: 1.2, damage: 4.4, armorPen: 1, range: 2, reliability: 0.7, weight: 22, damageType: 'incendiary', aoe: { radius: 1, falloff: 0.5 } },
    slots: ['barrel', 'ammunition', 'mount'],
    quirks: ['runs_hot', 'point_blank_bite'],
    appliesTo: ['flame_team', 'pioneers', 'sappers'],
    blurb: "Thickened seam tar thrown from a pressure vessel nobody enjoys carrying, over a parapet and through a firing slit. It drives a garrison off its loopholes and has never once opened a hull.",
  },
  tp305_slagline_hull_projector_mk1: {
    key: 'tp305_slagline_hull_projector_mk1', label: "Slagline 305 Hull Projector, Mk I",
    maker: 'tarpool_burnworks', calibre: 'fg2_fuel', class: 'flame', tier: 'II:Eng', pts: 3,
    base: { accuracy: 0.62, rateOfFire: 1.6, damage: 5.2, armorPen: 1.2, range: 3, reliability: 0.68, weight: 30, damageType: 'incendiary', aoe: { radius: 2, falloff: 0.4 } },
    slots: ['mount', 'ammunition', 'barrel'],
    quirks: ['runs_hot'],
    appliesTo: ['crawler', 'flame_team', 'land_dreadnought'],
    blurb: "The projector a crawler carries instead of a man: a bow mounting, a hull tank and a reach that finally justifies the pressure. Quartermasters cost it as ammunition and insurers decline it entirely.",
  },
  hw249_bottoms_gallery_burner_mk1: {
    key: 'hw249_bottoms_gallery_burner_mk1', label: "Bottoms 249 Gallery Burner, Mk I",
    maker: 'hundredweight_works', calibre: 'fg2_fuel', class: 'flame', tier: 'I', pts: 1.1,
    base: { accuracy: 0.58, rateOfFire: 1, damage: 3.6, armorPen: 0.9, range: 2, reliability: 0.84, weight: 19, damageType: 'incendiary', aoe: { radius: 1, falloff: 0.6 } },
    slots: ['ammunition', 'stock', 'barrel'],
    quirks: ['gallery_worked', 'close_bound'],
    appliesTo: ['digger_corps', 'pioneers', 'flame_team'],
    blurb: "A mining tool the Works never bothered to redraw for the front: lower pressure, thinner fuel, and valves a gallery crew can strip by lamplight. It burns a working face clear, and a trench is only a working face on its side.",
  },

  // --- mortar ----------------------------------------------------------
  cl221_crossloom_light_mortar_mk2: {
    key: 'cl221_crossloom_light_mortar_mk2', label: "Crossloom 221 Light Mortar, Mk II",
    maker: 'crossloom_pattern_house', calibre: 'm50_bore', class: 'mortar', tier: 'I', pts: 2.8,
    base: { accuracy: 0.5, rateOfFire: 1.4, damage: 4.5, armorPen: 2, range: 9, reliability: 0.9, weight: 19, damageType: 'fragmentation', aoe: { radius: 2, falloff: 0.35 } },
    slots: ['mount', 'ammunition', 'optic'],
    quirks: ['loaders_mate', 'proof_stamped'],
    appliesTo: ['mortars', 'riflemen', 'pioneers'],
    blurb: "Baseplate, tube and a bag of finned bombs one man can carry six of — the licence is free and the drawings are posted at the Meet-ground. It answers a machine-gun without waiting on a battery, which is the whole of its argument.",
  },
  rs263_verdict_commune_mortar_mk3: {
    key: 'rs263_verdict_commune_mortar_mk3', label: "Verdict 263 Commune Mortar, Mk III",
    maker: 'reclamation_state_arsenal', calibre: 'm50_bore', class: 'mortar', tier: 'I', pts: 2.6,
    base: { accuracy: 0.42, rateOfFire: 2, damage: 4.2, armorPen: 1.8, range: 8, reliability: 0.76, weight: 16, damageType: 'fragmentation', aoe: { radius: 2, falloff: 0.4 } },
    slots: ['mount', 'ammunition', 'magazine'],
    quirks: ['crew_drilled'],
    appliesTo: ['mortars', 'assault', 'pilgrim_levy'],
    blurb: "Thin-walled, generous with case, and dropped down the tube faster than the crew can be told to stop. The Arsenal prints the safe rate on the baseplate and has never expected it to be observed.",
  },
  rs278_state_concussion_mortar_mk2: {
    key: 'rs278_state_concussion_mortar_mk2', label: "State 278 Concussion Mortar, Mk II",
    maker: 'reclamation_state_arsenal', calibre: 'm50_bore', class: 'mortar', tier: 'I', pts: 2.4,
    base: { accuracy: 0.4, rateOfFire: 2.2, damage: 6, armorPen: 2.4, range: 9, reliability: 0.76, weight: 21, damageType: 'concussive', aoe: { radius: 2, falloff: 0.3 } },
    slots: ['mount', 'ammunition', 'muzzle'],
    quirks: ['crew_drilled', 'ledger_kept'],
    appliesTo: ['mortars', 'assault', 'stormtroops'],
    blurb: "A blast bomb with almost no case: it kills badly and pins beautifully, which is exactly what the Arsenal bought it for. Ordnance boards price it as suppression and score it as nothing at all.",
  },
  em239_forgeworks_battalion_mortar_mk1: {
    key: 'em239_forgeworks_battalion_mortar_mk1', label: "Forgeworks 239 Battalion Mortar, Mk I",
    maker: 'emberwright_foundries', calibre: 'm81_bore', class: 'mortar', tier: 'II:Eng', pts: 3.6,
    base: { accuracy: 0.48, rateOfFire: 0.9, damage: 7.8, armorPen: 3.2, range: 13, reliability: 0.88, weight: 58, damageType: 'fragmentation', aoe: { radius: 3, falloff: 0.3 } },
    slots: ['mount', 'optic', 'ammunition'],
    quirks: ['cold_forged', 'settles_in'],
    appliesTo: ['mortars', 'siege_mortar', 'artillery'],
    blurb: "The battalion bore, cut thick and proofed twice because the Foundries do not believe in thin tubes. It reaches over any ridge on the field and arrives with enough case to settle what is behind it.",
  },
  tp313_firetongue_incendiary_mortar_mk1: {
    key: 'tp313_firetongue_incendiary_mortar_mk1', label: "Firetongue 313 Incendiary Mortar, Mk I",
    maker: 'tarpool_burnworks', calibre: 'm50_bore', class: 'mortar', tier: 'II:Cache', pts: 2.4,
    base: { accuracy: 0.44, rateOfFire: 1.2, damage: 5.6, armorPen: 2.2, range: 8, reliability: 0.72, weight: 20, damageType: 'incendiary', aoe: { radius: 2, falloff: 0.35 } },
    slots: ['mount', 'ammunition', 'optic'],
    quirks: ['settles_in'],
    appliesTo: ['mortars', 'flame_team', 'pilgrim_levy'],
    blurb: "The Burnworks' filling in somebody else's bomb, which is how Tarpool prefers to sell anything. It puts fire on a position the projector teams cannot walk to, and it will not be quenched by anyone still in it.",
  },
  tp317_tarpool_fume_mortar_mk1: {
    key: 'tp317_tarpool_fume_mortar_mk1', label: "Tarpool 317 Fume Mortar, Mk I",
    maker: 'tarpool_burnworks', calibre: 'm81_bore', class: 'mortar', tier: 'II:Cache', pts: 2.5,
    base: { accuracy: 0.45, rateOfFire: 0.7, damage: 7, armorPen: 4.2, range: 12, reliability: 0.74, weight: 62, damageType: 'chemical', aoe: { radius: 3, falloff: 0.15 } },
    slots: ['mount', 'ammunition', 'optic'],
    quirks: ['mire_shod', 'ledger_kept'],
    appliesTo: ['mortars', 'siege_mortar', 'pioneers'],
    blurb: "The Burnworks sells the filling to every house at once and calls that a moral position. It empties a trench line and a poured work of everyone who must go on breathing, and it does not scratch a sealed hull.",
  },

  // --- crawler_gun -----------------------------------------------------
  em247_emberwright_hull_gun_mk2: {
    key: 'em247_emberwright_hull_gun_mk2', label: "Emberwright 247 Hull Gun, Mk II",
    maker: 'emberwright_foundries', calibre: 'cg37_bore', class: 'crawler_gun', tier: 'II:Eng', pts: 4.9,
    base: { accuracy: 0.55, rateOfFire: 1, damage: 6.5, armorPen: 9, range: 10, reliability: 0.88, weight: 98, damageType: 'kinetic', aoe: null },
    slots: ['mount', 'optic', 'barrel', 'ammunition'],
    quirks: ['cold_forged', 'plate_hungry'],
    appliesTo: ['crawler', 'land_dreadnought'],
    blurb: "The first bore the Foundries cut specifically to open a hull rather than a formation, and the gun most line crawlers still carry. Fast, flat, and increasingly embarrassed by what it meets on a modern glacis.",
  },
  sy277_prizeyard_turret_gun_mk3: {
    key: 'sy277_prizeyard_turret_gun_mk3', label: "Prizeyard 277 Turret Gun, Mk III",
    maker: 'salvage_court_prize_yard', calibre: 'cg37_bore', class: 'crawler_gun', tier: 'II:Cache', pts: 4.5,
    base: { accuracy: 0.46, rateOfFire: 1.8, damage: 5.6, armorPen: 7, range: 9, reliability: 0.7, weight: 86, damageType: 'kinetic', aoe: null },
    slots: ['mount', 'magazine', 'ammunition'],
    quirks: ['prize_taken', 'barrel_droop'],
    appliesTo: ['crawler', 'autocar_scouts'],
    blurb: "Re-bored from three condemned tubes and married to a turret ring it was never drawn for, which the Court records as an improvement. It opens a line crawler twice as fast as the original and is spent entirely on a land-fort's belt.",
  },
  em291_forgeworks_breakthrough_gun_mk1: {
    key: 'em291_forgeworks_breakthrough_gun_mk1', label: "Forgeworks 291 Breakthrough Gun, Mk I",
    maker: 'emberwright_foundries', calibre: 'cg57_bore', class: 'crawler_gun', tier: 'III', pts: 8.5,
    base: { accuracy: 0.54, rateOfFire: 0.7, damage: 10, armorPen: 13, range: 12, reliability: 0.9, weight: 165, damageType: 'kinetic', aoe: null },
    slots: ['mount', 'optic', 'barrel', 'ammunition'],
    quirks: ['plate_hungry', 'cold_forged'],
    appliesTo: ['crawler', 'land_dreadnought'],
    blurb: "The Foundries' reply to their own success: the same doctrine at a bore that still means it against face-hardened plate. It costs a larger ring, a longer loader, and a crawler built around the gun rather than the other way about.",
  },
  cl318_tollgate_casemate_gun_mk1: {
    key: 'cl318_tollgate_casemate_gun_mk1', label: "Tollgate 318 Casemate Gun, Mk I",
    maker: 'crossloom_pattern_house', calibre: 'cg57_bore', class: 'crawler_gun', tier: 'II:Eng', pts: 8.8,
    base: { accuracy: 0.5, rateOfFire: 0.6, damage: 9, armorPen: 12, range: 11, reliability: 0.9, weight: 190, damageType: 'shaped', aoe: null },
    slots: ['mount', 'optic', 'ammunition'],
    quirks: ['proof_stamped', 'plate_hungry'],
    appliesTo: ['crawler', 'land_dreadnought'],
    blurb: "A lined shell in a short casemate tube, drawn for keels that must answer a belt without carrying a breakthrough gun's ring. The jet wants plate and wastes itself on anything softer, which the Pattern House prints on the crate.",
  },

  // --- artillery -------------------------------------------------------
  cl235_crossloom_field_piece_mk2: {
    key: 'cl235_crossloom_field_piece_mk2', label: "Crossloom 235 Field Piece, Mk II",
    maker: 'crossloom_pattern_house', calibre: 'a105_shell', class: 'artillery', tier: 'I', pts: 11,
    base: { accuracy: 0.5, rateOfFire: 0.8, damage: 14, armorPen: 7, range: 16, reliability: 0.9, weight: 295, damageType: 'explosive', aoe: { radius: 3, falloff: 0.25 } },
    slots: ['mount', 'optic', 'ammunition', 'barrel'],
    quirks: ['crew_drilled', 'loaders_mate'],
    appliesTo: ['artillery', 'siege_mortar'],
    blurb: "The divisional piece, on the reasoning that a single shell weight is a single contract. It decides more field engagements than anything else on the Ground, and is almost never seen by the people it decides them against.",
  },
  as256_beacon_ranging_gun_mk1: {
    key: 'as256_beacon_ranging_gun_mk1', label: "Beacon 256 Ranging Gun, Mk I",
    maker: 'ascendancy_signal_works', calibre: 'a105_shell', class: 'artillery', tier: 'II:Ciph', pts: 9.5,
    base: { accuracy: 0.56, rateOfFire: 0.7, damage: 11.5, armorPen: 6.5, range: 22, reliability: 0.88, weight: 280, damageType: 'explosive', aoe: { radius: 3, falloff: 0.3 } },
    slots: ['mount', 'optic', 'ammunition'],
    quirks: ['ranged_by_wire', 'settles_in'],
    appliesTo: ['artillery', 'siege_mortar'],
    blurb: "A lighter shell pushed further than a sensible board would push it, laid by transmitted correction rather than by eye. The Ascendancy would rather register a target for the whole column than break one itself.",
  },
  em284_anvilgate_siege_howitzer_mk2: {
    key: 'em284_anvilgate_siege_howitzer_mk2', label: "Anvilgate 284 Siege Howitzer, Mk II",
    maker: 'emberwright_foundries', calibre: 'a150_shell', class: 'artillery', tier: 'II:Eng', pts: 13,
    base: { accuracy: 0.46, rateOfFire: 0.6, damage: 22, armorPen: 10, range: 20, reliability: 0.9, weight: 540, damageType: 'explosive', aoe: { radius: 4, falloff: 0.2 } },
    slots: ['mount', 'optic', 'ammunition', 'barrel'],
    quirks: ['crew_drilled', 'ledger_kept'],
    appliesTo: ['artillery', 'siege_mortar', 'land_dreadnought'],
    blurb: "The works-breaker: two men and a cradle to load, a delay fuse, and a ceiling to answer for. Everything the Foundries believe about steel is in the breech, and the breech is why nobody has improved on it.",
  },
  fs198_reliquary_keel_gun_mk1: {
    key: 'fs198_reliquary_keel_gun_mk1', label: "Reliquary 198 Keel Gun, Mk I",
    maker: 'ferrymen_shrine_armoury', calibre: 'a150_shell', class: 'artillery', tier: 'III', pts: 15,
    base: { accuracy: 0.55, rateOfFire: 0.45, damage: 24, armorPen: 14, range: 22, reliability: 0.93, weight: 620, damageType: 'kinetic', aoe: { radius: 4, falloff: 0.2 } },
    slots: ['mount', 'optic', 'ammunition', 'barrel'],
    quirks: ['ferrymans_blessing', 'hand_lapped'],
    appliesTo: ['land_dreadnought', 'artillery', 'siege_mortar'],
    blurb: "A land-fort's main armament, laid on its keel rather than on a carriage and blessed once a season whether or not it has fired. Solid shot, a full charge, and the only gun in the catalogue that meets a belt on equal terms.",
  },

  // --- aircraft_gun ----------------------------------------------------
  as272_antenna_wing_cannon_mk2: {
    key: 'as272_antenna_wing_cannon_mk2', label: "Antenna 272 Wing Cannon, Mk II",
    maker: 'ascendancy_signal_works', calibre: 'ac20_aircraft', class: 'aircraft_gun', tier: 'II:Ciph', pts: 13,
    base: { accuracy: 0.5, rateOfFire: 3.6, damage: 6.5, armorPen: 6, range: 7, reliability: 0.85, weight: 46, damageType: 'kinetic', aoe: null },
    slots: ['mount', 'magazine', 'ammunition'],
    quirks: ['ranged_by_wire', 'glare_cut_sights'],
    appliesTo: ['fighter'],
    blurb: "Wing-rooted, harmonised on the bench and impossible to reload in flight, so every gram of it was argued over twice. It arrives in a two-second burst, opens an autocar, scratches a line crawler, and is spent entirely on a land-fort's belt.",
  },
  sy296_adjudicated_nose_battery_mk1: {
    key: 'sy296_adjudicated_nose_battery_mk1', label: "Adjudicated 296 Nose Battery, Mk I",
    maker: 'salvage_court_prize_yard', calibre: 'ac20_aircraft', class: 'aircraft_gun', tier: 'II:Cache', pts: 6.5,
    base: { accuracy: 0.42, rateOfFire: 5, damage: 5.5, armorPen: 5, range: 5, reliability: 0.7, weight: 40, damageType: 'explosive', aoe: { radius: 1, falloff: 0.6 } },
    slots: ['mount', 'magazine', 'muzzle'],
    quirks: ['prize_taken', 'barrel_droop'],
    appliesTo: ['fighter'],
    blurb: "Four condemned tubes adjudicated into one nose mounting and sold with a writ instead of a proof mark. It throws everything it has in the first pass, and the Yard's own pilots decline the fourth gun.",
  },
};

// ---------------------------------------------------------------------------
// 7. Modifications
//
// A fitted change to a pattern, occupying ONE of the eight ModSlots. Two
// modifications may never share a slot on the same weapon — that is enforced
// in rollWeapon and asserted over 500 rolled instances.
//
// `mods` and `tradeoff` are both additive Partial<WeaponBase> deltas. They are
// NOT multipliers: QualityGrade.mult is the only multiplicative layer in the
// whole module. Their key sets are disjoint, and the split is not decorative —
// `mods` is what the fitter sold you and `tradeoff` is what he did not mention.
//
// EVERY MODIFICATION HAS A NON-EMPTY, GENUINELY NEGATIVE TRADEOFF. A mod that
// is pure upside is a bug in this lane, not a good deal: it collapses the
// choice the slot exists to pose. The direction of "worse" is fixed and
// asserted — negative for accuracy, rateOfFire, damage, armorPen, range and
// reliability; POSITIVE for weight, because weight is the one field where more
// is worse (it is what drags a squad's speed in deriveLoadout).
//
// TWO NON-NUMERIC KEYS ARE PERMITTED IN `mods` AND FORBIDDEN IN `tradeoff`:
// `damageType` and `aoe`. Both are REPLACEMENTS rather than deltas (resolution
// order step 7), and neither is better or worse in the abstract — a shaped
// filling is a trade, not an upgrade — which is why a mod that sets one must
// still pay for it with a numeric cost. Asserted.
//
// ⚠ THE ONE HARD CONSTRAINT, AND IT IS THE SAME ONE THE WHOLE MODEL RESTS ON:
// NO MODIFICATION THAT ADDS `armorPen` MAY BE FITTED TO A SMALL ARM. The class
// sweep proves that no sidearm, carbine, rifle, smg, lmg, hmg, shotgun,
// marksman or flame weapon can scratch heavy armour AT ISSUE GRADE AND UNMODDED
// — which is a far weaker claim than the one the design actually makes. Quality
// cannot break it (the grade multipliers never touch armorPen) and no quirk can
// break it (none of them writes armorPen either), so the only remaining way in
// is a modification. The two mods that add penetration — ammo_hardened_core and
// ammo_shaped_charge — therefore list only anti_armor, crawler_gun, artillery
// and aircraft_gun in `appliesTo`, and a test sweeps the whole table to prove
// no armorPen-adding mod is ever legal on a small arm. Adding one is how a
// rifle company quietly acquires the ability to kill crawlers.
// ---------------------------------------------------------------------------

export const MODIFICATIONS = {
  // --- barrel ----------------------------------------------------------
  barrel_long_pattern: {
    key: 'barrel_long_pattern', label: "Long-Pattern Barrel Assembly", slot: 'barrel', pts: 0.3,
    appliesTo: ['sidearm', 'carbine', 'rifle', 'smg', 'lmg', 'hmg', 'marksman', 'anti_armor'],
    mods: { accuracy: 0.05, range: 1 },
    tradeoff: { weight: 0.6, rateOfFire: -0.05 },
    blurb: "A hand more barrel, and the ranging tables redrawn to match. The board approves it for anyone who fires from a fixed position and quietly regrets it for anyone who has to run.",
  },
  barrel_cut_down: {
    key: 'barrel_cut_down', label: "Cut-Down Barrel", slot: 'barrel', pts: 0.1,
    appliesTo: ['carbine', 'rifle', 'lmg', 'shotgun', 'marksman'],
    mods: { weight: -0.7, rateOfFire: 0.1 },
    tradeoff: { range: -2, accuracy: -0.05 },
    blurb: "Taken off at the armourer's bench with a hacksaw and a file, on the authority of whoever has to carry it. Handy in a gallery, an embarrassment on a ridge.",
  },
  barrel_heavy_profile: {
    key: 'barrel_heavy_profile', label: "Heavy-Profile Barrel", slot: 'barrel', pts: 0.35,
    appliesTo: ['rifle', 'lmg', 'hmg', 'marksman', 'anti_armor', 'crawler_gun'],
    mods: { accuracy: 0.08, reliability: 0.05 },
    tradeoff: { weight: 1.1, rateOfFire: -0.1 },
    blurb: "Thicker walls, slower to heat and slower to stop mattering. Every ordnance board on the Ground has approved this fitting and no quartermaster has ever thanked one for it.",
  },
  barrel_chrome_bore: {
    key: 'barrel_chrome_bore', label: "Chrome-Lined Bore", slot: 'barrel', pts: 0.3,
    appliesTo: ['sidearm', 'carbine', 'rifle', 'smg', 'lmg', 'hmg', 'shotgun', 'marksman', 'flame', 'anti_armor', 'crawler_gun', 'artillery'],
    mods: { reliability: 0.09 },
    tradeoff: { accuracy: -0.03, weight: 0.2 },
    blurb: "A plated bore that shrugs off fouling, damp and the third week of a wet season. The plating is a shade thicker in places than the drawings intended, and the groups open accordingly.",
  },
  barrel_quick_change: {
    key: 'barrel_quick_change', label: "Quick-Change Barrel Sleeve", slot: 'barrel', pts: 0.4,
    appliesTo: ['lmg', 'hmg', 'crawler_gun', 'aircraft_gun'],
    mods: { rateOfFire: 0.45 },
    tradeoff: { accuracy: -0.05, weight: 0.8 },
    blurb: "A latch, an asbestos mitt and a spare tube in the number two's pack, so a gun that has run white can be back in action in a count of ten. Nothing that unlatches ever returns to the same zero.",
  },
  barrel_yard_relined: {
    key: 'barrel_yard_relined', label: "Prize-Yard Re-Lining", slot: 'barrel', pts: 0.05,
    appliesTo: ['sidearm', 'carbine', 'rifle', 'smg', 'lmg', 'hmg', 'shotgun', 'flame', 'anti_armor', 'crawler_gun'],
    mods: { damage: 0.3, weight: -0.15 },
    tradeoff: { accuracy: -0.07, reliability: -0.06 },
    blurb: "A condemned tube re-bored a size over, sleeved, and stamped with a writ number where the proof mark used to be. It hits harder than the drawings allow, for exactly as long as it lasts.",
  },
  barrel_seam_bored: {
    key: 'barrel_seam_bored', label: "Seam-Bored Projector Tube", slot: 'barrel', pts: 0.35,
    appliesTo: ['flame'],
    mods: { range: 1, damage: 0.4 },
    tradeoff: { weight: 1.4, reliability: -0.05 },
    blurb: "A longer throwing tube bored on the Burnworks' own seam gear, which throws the thickened grade a hex further and one pressure test closer to the edge of its vessel.",
  },

  // --- optic -----------------------------------------------------------
  optic_ranging_telescope: {
    key: 'optic_ranging_telescope', label: "Ranging Telescope", slot: 'optic', pts: 0.5,
    appliesTo: ['rifle', 'lmg', 'hmg', 'marksman', 'anti_armor', 'mortar', 'crawler_gun', 'artillery'],
    mods: { accuracy: 0.11, range: 1 },
    tradeoff: { weight: 0.5, rateOfFire: -0.15 },
    blurb: "Ground glass, a graticule etched to the calibre's own drop table, and a mount the armourer will not let you adjust. You will see further and you will fire less often.",
  },
  optic_open_battle_sight: {
    key: 'optic_open_battle_sight', label: "Open Battle Sight", slot: 'optic', pts: 0.05,
    appliesTo: ['sidearm', 'carbine', 'rifle', 'smg', 'lmg', 'shotgun', 'marksman'],
    mods: { rateOfFire: 0.25 },
    tradeoff: { accuracy: -0.06, range: -1 },
    blurb: "The leaf folded flat and the graduations ignored, on the Ministry's own finding that most of the Ground's shooting happens inside two hexes and none of it happens slowly.",
  },
  optic_ministry_rangefinder: {
    key: 'optic_ministry_rangefinder', label: "Ministry Coincidence Rangefinder", slot: 'optic', pts: 0.9,
    appliesTo: ['hmg', 'anti_armor', 'mortar', 'crawler_gun', 'artillery'],
    mods: { accuracy: 0.13, range: 2 },
    tradeoff: { weight: 2.6, rateOfFire: -0.2 },
    blurb: "A cased optical instrument with two windows and one answer, issued against signature and returned against signature. It converts a gun crew into a survey party for the length of a laying.",
  },
  optic_dark_run_prism: {
    key: 'optic_dark_run_prism', label: "Dark-Run Prism", slot: 'optic', pts: 0.45,
    appliesTo: ['sidearm', 'carbine', 'rifle', 'lmg', 'hmg', 'marksman', 'anti_armor', 'crawler_gun'],
    mods: { accuracy: 0.07 },
    tradeoff: { range: -1, weight: 0.4 },
    blurb: "A wide gathering prism cut for a dark run: it makes a shape out of a smudge at the cost of most of the field around it, which is a bargain nobody enjoys making twice.",
  },
  optic_ghost_ring: {
    key: 'optic_ghost_ring', label: "Ghost-Ring Aperture", slot: 'optic', pts: 0.2,
    appliesTo: ['sidearm', 'carbine', 'rifle', 'smg', 'lmg', 'shotgun', 'marksman'],
    mods: { accuracy: 0.04, rateOfFire: 0.12 },
    tradeoff: { range: -1 },
    blurb: "A thin ring the eye stops seeing the moment it is used properly. Fast onto a target at conversational distance, and no help whatever in placing a shot beyond one.",
  },

  // --- magazine --------------------------------------------------------
  magazine_drum: {
    key: 'magazine_drum', label: "Drum Magazine", slot: 'magazine', pts: 0.35,
    appliesTo: ['carbine', 'rifle', 'smg', 'lmg', 'hmg', 'aircraft_gun'],
    mods: { rateOfFire: 0.5 },
    tradeoff: { reliability: -0.12, weight: 1.2 },
    blurb: "A spring-wound pan holding more rounds than a man can account for and feeding them in an order the spring decides. Loved in the first minute of an assault and cursed in the second.",
  },
  magazine_extended_box: {
    key: 'magazine_extended_box', label: "Extended Box Magazine", slot: 'magazine', pts: 0.2,
    appliesTo: ['sidearm', 'carbine', 'rifle', 'smg', 'lmg', 'marksman'],
    mods: { rateOfFire: 0.2 },
    tradeoff: { weight: 0.5 },
    blurb: "The issue box lengthened by half, which is exactly as much as a man can lie down behind. Nothing about it is clever and everything about it works.",
  },
  magazine_stripper_guide: {
    key: 'magazine_stripper_guide', label: "Stripper-Clip Guide", slot: 'magazine', pts: 0.1,
    appliesTo: ['carbine', 'rifle', 'marksman', 'shotgun'],
    mods: { rateOfFire: 0.15 },
    tradeoff: { accuracy: -0.03 },
    blurb: "A milled guide on the bridge so a full clip goes down in one motion. The milling takes metal off the one part of the receiver the sights are indexed against.",
  },
  magazine_belt_feed: {
    key: 'magazine_belt_feed', label: "Disintegrating Belt Feed", slot: 'magazine', pts: 0.55,
    appliesTo: ['lmg', 'hmg', 'crawler_gun', 'aircraft_gun'],
    mods: { rateOfFire: 0.8 },
    tradeoff: { weight: 2.4, accuracy: -0.05 },
    blurb: "A feed tray, a pawl and two hundred links that come apart as they pass. It turns a gun into a supply problem, and every doctrine on the Ground has decided that is worth it.",
  },
  magazine_ready_rack: {
    key: 'magazine_ready_rack', label: "Ready-Rack Cradle", slot: 'magazine', pts: 0.4,
    appliesTo: ['hmg', 'mortar', 'crawler_gun', 'artillery'],
    mods: { rateOfFire: 0.3 },
    tradeoff: { weight: 3.2, reliability: -0.04 },
    blurb: "Shell stowage at the loader's elbow rather than at the wagon, which halves the laying interval and puts the ready charges precisely where a hit would find them.",
  },
  magazine_lightened_follower: {
    key: 'magazine_lightened_follower', label: "Lightened Follower Set", slot: 'magazine', pts: 0.15,
    appliesTo: ['sidearm', 'carbine', 'rifle', 'smg', 'lmg'],
    mods: { weight: -0.4, rateOfFire: 0.1 },
    tradeoff: { reliability: -0.09 },
    blurb: "Pressed followers and a lighter spring, saving a pound across a man's pouches. The last two rounds in every magazine now present at an angle the extractor was not consulted about.",
  },

  // --- stock -----------------------------------------------------------
  stock_bipod: {
    key: 'stock_bipod', label: "Folding Bipod", slot: 'stock', pts: 0.3,
    appliesTo: ['rifle', 'lmg', 'hmg', 'marksman', 'anti_armor'],
    mods: { accuracy: 0.12 },
    tradeoff: { weight: 0.9 },
    blurb: "Two sprung legs that fold under the fore-end and take the weapon's weight off a tired man's arms. They also add that weight to every hex he walks before he lies down behind it.",
  },
  stock_fitted_cheekpiece: {
    key: 'stock_fitted_cheekpiece', label: "Fitted Cheekpiece", slot: 'stock', pts: 0.25,
    appliesTo: ['sidearm', 'carbine', 'rifle', 'shotgun', 'marksman'],
    mods: { accuracy: 0.07 },
    tradeoff: { weight: 0.35 },
    blurb: "Cradle timber built up under the comb until the eye falls onto the sight without being asked. Fitted to one face, and worth nothing at all on the next.",
  },
  stock_folding: {
    key: 'stock_folding', label: "Folding Stock Assembly", slot: 'stock', pts: 0.2,
    appliesTo: ['sidearm', 'carbine', 'rifle', 'smg', 'shotgun', 'flame'],
    mods: { weight: -0.55 },
    tradeoff: { accuracy: -0.06, rateOfFire: -0.05 },
    blurb: "A hinge, a catch and a wire frame, so the thing goes under a coat or into an autocar's footwell. Everything a hinge does to a shoulder weld, it does.",
  },
  stock_recoil_pad: {
    key: 'stock_recoil_pad', label: "Sprung Recoil Pad", slot: 'stock', pts: 0.25,
    appliesTo: ['carbine', 'rifle', 'lmg', 'shotgun', 'marksman', 'anti_armor'],
    mods: { rateOfFire: 0.15, accuracy: 0.03 },
    tradeoff: { weight: 0.45 },
    blurb: "A sprung buttplate that lets a man take the ninth shot as willingly as the first. The Foundries fit them as standard and pretend the reason is comfort.",
  },
  stock_harness_frame: {
    key: 'stock_harness_frame', label: "Carrying-Harness Frame", slot: 'stock', pts: 0.2,
    appliesTo: ['lmg', 'hmg', 'flame', 'anti_armor'],
    mods: { weight: -1.2 },
    tradeoff: { accuracy: -0.08, rateOfFire: -0.08 },
    blurb: "A shoulder frame that carries the weapon's weight on a man's hips instead of his hands, and holds it in a position from which nothing can be aimed or worked quickly.",
  },
  stock_shoulder_brace: {
    key: 'stock_shoulder_brace', label: "Heavy Shoulder Brace", slot: 'stock', pts: 0.35,
    appliesTo: ['rifle', 'lmg', 'marksman', 'anti_armor'],
    mods: { accuracy: 0.1, reliability: 0.03 },
    tradeoff: { weight: 1.5, rateOfFire: -0.05 },
    blurb: "A braced steel butt cast for weapons that would otherwise dislocate the man behind them. Emberwright issues one with every heavy rifle and counts it against the rifle's weight, not the man's.",
  },

  // --- muzzle ----------------------------------------------------------
  muzzle_brake: {
    key: 'muzzle_brake', label: "Slotted Muzzle Brake", slot: 'muzzle', pts: 0.3,
    appliesTo: ['sidearm', 'rifle', 'smg', 'lmg', 'hmg', 'marksman', 'anti_armor', 'mortar', 'crawler_gun', 'artillery', 'aircraft_gun'],
    mods: { rateOfFire: 0.3, accuracy: 0.04 },
    tradeoff: { reliability: -0.05, weight: 0.4 },
    blurb: "Ported baffles that throw the recoil sideways at everyone standing beside you and hold the muzzle down for the next round. The blast comes back into the action along with everything the blast picked up.",
  },
  muzzle_flash_hider: {
    key: 'muzzle_flash_hider', label: "Cone Flash Hider", slot: 'muzzle', pts: 0.2,
    appliesTo: ['sidearm', 'carbine', 'rifle', 'smg', 'lmg', 'hmg', 'marksman'],
    mods: { accuracy: 0.05 },
    tradeoff: { weight: 0.25, rateOfFire: -0.05 },
    blurb: "A slotted cone that keeps the firer's own night vision and denies the other side a bearing. It adds a thing at the muzzle that can catch, and on a dark run it will.",
  },
  muzzle_ported_compensator: {
    key: 'muzzle_ported_compensator', label: "Ported Compensator", slot: 'muzzle', pts: 0.25,
    appliesTo: ['sidearm', 'carbine', 'rifle', 'smg', 'shotgun', 'aircraft_gun'],
    mods: { accuracy: 0.09 },
    tradeoff: { damage: -0.25, weight: 0.3 },
    blurb: "Gas bled upward through a row of ports so the muzzle stays where it was put. The gas bled is gas that was pushing the shot, and the ordnance board has the figures.",
  },
  muzzle_grenade_cup: {
    key: 'muzzle_grenade_cup', label: "Muzzle Grenade Cup", slot: 'muzzle', pts: 0.5,
    appliesTo: ['carbine', 'rifle', 'shotgun'],
    mods: { damage: 0.6, aoe: { radius: 1, falloff: 0.6 } },
    tradeoff: { rateOfFire: -0.35, accuracy: -0.06, weight: 0.7 },
    blurb: "A cup clamped over the muzzle and a ballistite cartridge in the chamber, which turns one rifleman in every section into a very short-ranged battery. Nothing else can be done with the weapon while it is fitted.",
  },
  muzzle_blast_diffuser: {
    key: 'muzzle_blast_diffuser', label: "Blast Diffuser Shroud", slot: 'muzzle', pts: 0.35,
    appliesTo: ['hmg', 'mortar', 'crawler_gun', 'artillery'],
    mods: { reliability: 0.07, accuracy: 0.05 },
    tradeoff: { weight: 3, range: -1 },
    blurb: "A drum shroud that keeps the muzzle blast off the crew, the sights and the pit's own parapet. It also keeps a measurable fraction of the charge off the shell.",
  },

  // --- bayonet ---------------------------------------------------------
  //
  // The bayonet slot is the ONLY channel this catalogue has for melee. A
  // fitted blade's `mods.damage` is its melee contribution and nothing else:
  // deriveLoadout resolves each weapon twice, once with the blade and once
  // without, and takes the DIFFERENCE as melee while the ranged term is
  // computed from the bladeless resolve. A bayonet must never make a weapon
  // shoot harder, and the two-resolve reduction is what guarantees it.
  bayonet_socket_blade: {
    key: 'bayonet_socket_blade', label: "Socket Blade", slot: 'bayonet', pts: 0.15,
    appliesTo: ['carbine', 'rifle', 'shotgun', 'marksman'],
    mods: { damage: 1.2 },
    tradeoff: { accuracy: -0.03, weight: 0.5 },
    blurb: "A triangular blade on a collar, issued in the same quantity as rifles and lost at roughly twice the rate. It is the Ministry's official position that the trench is entered with it fixed.",
  },
  bayonet_trench_knife_lug: {
    key: 'bayonet_trench_knife_lug', label: "Trench-Knife Lug", slot: 'bayonet', pts: 0.1,
    appliesTo: ['sidearm', 'carbine', 'rifle', 'smg', 'shotgun'],
    mods: { damage: 0.8 },
    tradeoff: { weight: 0.3 },
    blurb: "A lug welded on so the man's own knife becomes the weapon's blade, which saves the Ministry an issue item and saves the man an argument about which he would rather have.",
  },
  bayonet_sword_pattern: {
    key: 'bayonet_sword_pattern', label: "Sword-Pattern Bayonet", slot: 'bayonet', pts: 0.25,
    appliesTo: ['rifle', 'marksman'],
    mods: { damage: 1.9 },
    tradeoff: { accuracy: -0.07, weight: 1.1, rateOfFire: -0.05 },
    blurb: "Two hands of ground steel, sharpened on one edge and ceremonial on the other. It is very good at what it is for and it hangs off the muzzle like a grudge.",
  },
  bayonet_pioneer_spade: {
    key: 'bayonet_pioneer_spade', label: "Pioneer Spade Fitting", slot: 'bayonet', pts: 0.15,
    appliesTo: ['carbine', 'rifle', 'shotgun', 'marksman'],
    mods: { damage: 1.05 },
    tradeoff: { weight: 0.85, accuracy: -0.02 },
    blurb: "The section's entrenching spade sharpened along both edges and cut to seat on the bayonet lug. A digger corps will tell you it has never once been used for digging afterwards.",
  },

  // --- ammunition ------------------------------------------------------
  ammo_hardened_core: {
    key: 'ammo_hardened_core', label: "Hardened-Core Lot", slot: 'ammunition', pts: 0.6,
    appliesTo: ['anti_armor', 'crawler_gun', 'artillery', 'aircraft_gun'],
    mods: { armorPen: 1.2 },
    tradeoff: { damage: -0.5, weight: 0.15 },
    blurb: "A dense core in a light jacket, cut to punch a small clean hole through something that objects. Whatever is behind the hole is the crew's problem, not the projectile's.",
  },
  ammo_hollow_base: {
    key: 'ammo_hollow_base', label: "Hollow-Base Lot", slot: 'ammunition', pts: 0.25,
    appliesTo: ['sidearm', 'carbine', 'rifle', 'smg', 'lmg', 'hmg', 'shotgun', 'marksman'],
    mods: { damage: 0.7 },
    tradeoff: { armorPen: -0.6, range: -1 },
    blurb: "A soft slug with a hollowed skirt that upsets on contact and stops travelling. Ruinous on a man in a coat, and stopped by the first honest piece of plate it meets.",
  },
  ammo_shaped_charge: {
    key: 'ammo_shaped_charge', label: "Shaped-Charge Lot", slot: 'ammunition', pts: 0.8,
    appliesTo: ['anti_armor', 'crawler_gun', 'artillery'],
    mods: { damageType: 'shaped', armorPen: 1 },
    tradeoff: { damage: -0.6, range: -2, rateOfFire: -0.1 },
    blurb: "A copper cone and a stand-off fuse, which converts the filling into one jet aimed at a single point. It cares nothing for how fast it arrived and everything for what it arrived against.",
  },
  ammo_case_filled: {
    key: 'ammo_case_filled', label: "Case-Filled Lot", slot: 'ammunition', pts: 0.4,
    appliesTo: ['mortar', 'crawler_gun', 'artillery'],
    mods: { damageType: 'fragmentation', aoe: { radius: 2, falloff: 0.35 } },
    tradeoff: { armorPen: -2, damage: -0.5 },
    blurb: "Thin walls and a generous case charge, so the shell arrives as several hundred pieces of itself. Against men in the open it is decisive; against anything plated it is expensive noise.",
  },
  ammo_thickened_charge: {
    key: 'ammo_thickened_charge', label: "Thickened-Charge Lot", slot: 'ammunition', pts: 0.5,
    appliesTo: ['flame', 'mortar', 'artillery'],
    mods: { damageType: 'incendiary', damage: 0.5 },
    tradeoff: { armorPen: -1, reliability: -0.08 },
    blurb: "Tarpool's seam grade cut to cling rather than splash, filled at the works and carted no further than the works will guarantee. It goes through a firing slit and stays there.",
  },
  ammo_fume_filling: {
    key: 'ammo_fume_filling', label: "Fume Filling", slot: 'ammunition', pts: 0.45,
    appliesTo: ['mortar', 'artillery'],
    mods: { damageType: 'chemical' },
    tradeoff: { damage: -1.2, armorPen: -1.5, reliability: -0.06 },
    blurb: "A thin-walled carrier and a filling the Ministry lists by weight and never by name. It empties a work, a gallery and a trench, and it dies at the first sealed hatch on the field.",
  },
  ammo_proof_lot: {
    key: 'ammo_proof_lot', label: "Proof-House Lot", slot: 'ammunition', pts: 0.55,
    appliesTo: ['sidearm', 'carbine', 'rifle', 'smg', 'lmg', 'hmg', 'shotgun', 'marksman', 'anti_armor', 'flame', 'mortar', 'crawler_gun', 'artillery', 'aircraft_gun'],
    mods: { reliability: 0.1, accuracy: 0.05 },
    tradeoff: { weight: 0.15 },
    blurb: "One lot, one machine, one afternoon, every round weighed and every case gauged. It costs what it costs and there is nothing else in the catalogue that improves a bad weapon so much.",
  },
  ammo_reduced_charge: {
    key: 'ammo_reduced_charge', label: "Reduced-Charge Lot", slot: 'ammunition', pts: 0.2,
    appliesTo: ['sidearm', 'carbine', 'rifle', 'smg', 'lmg', 'hmg', 'shotgun', 'marksman'],
    mods: { accuracy: 0.07, reliability: 0.05 },
    tradeoff: { damage: -0.5, range: -2 },
    blurb: "A short charge behind a heavy bullet: quiet, gentle on the action, and lethargic. Signals sections and provosts draw it; line companies decline it in writing.",
  },
  ammo_overpressure_lot: {
    key: 'ammo_overpressure_lot', label: "Overpressure Lot", slot: 'ammunition', pts: 0.3,
    appliesTo: ['sidearm', 'carbine', 'rifle', 'smg', 'lmg', 'hmg', 'shotgun', 'marksman', 'anti_armor', 'crawler_gun', 'artillery', 'aircraft_gun'],
    mods: { damage: 0.6, range: 1 },
    tradeoff: { reliability: -0.13, weight: 0.1 },
    blurb: "Loaded above the drawings on the theory that the proof pressure is a suggestion. It reaches further, hits harder, and shortens every component's life including, occasionally, the firer's.",
  },

  // --- mount -----------------------------------------------------------
  mount_pintle: {
    key: 'mount_pintle', label: "Pintle Mounting", slot: 'mount', pts: 0.3,
    appliesTo: ['lmg', 'hmg', 'anti_armor', 'flame', 'mortar', 'aircraft_gun'],
    mods: { accuracy: 0.05, rateOfFire: 0.05 },
    tradeoff: { weight: 3.5 },
    blurb: "A socket, a post and a spade grip, welded wherever the crawler's deck will take it. The simplest mounting the Ground has and the one every other mounting is measured against.",
  },
  mount_sprung_cradle: {
    key: 'mount_sprung_cradle', label: "Sprung Recoil Cradle", slot: 'mount', pts: 0.6,
    appliesTo: ['hmg', 'mortar', 'crawler_gun', 'artillery'],
    mods: { accuracy: 0.1, rateOfFire: 0.12 },
    tradeoff: { weight: 9 },
    blurb: "Hydro-spring buffers that take the gun's recoil into the mounting instead of into the ground, so the piece returns to its own laying between rounds rather than being relaid.",
  },
  mount_traversing_ring: {
    key: 'mount_traversing_ring', label: "Traversing Ring Mounting", slot: 'mount', pts: 0.7,
    appliesTo: ['hmg', 'crawler_gun', 'artillery', 'aircraft_gun'],
    mods: { rateOfFire: 0.28 },
    tradeoff: { weight: 14, accuracy: -0.04 },
    blurb: "A geared ring that brings the whole arc under one man's left hand. It weighs what a ring of that diameter weighs, and it has never once been described as precise.",
  },
  mount_dug_in_platform: {
    key: 'mount_dug_in_platform', label: "Dug-In Platform Bed", slot: 'mount', pts: 0.4,
    appliesTo: ['lmg', 'hmg', 'anti_armor', 'mortar', 'artillery'],
    mods: { accuracy: 0.15, reliability: 0.05 },
    tradeoff: { weight: 7, rateOfFire: -0.12 },
    blurb: "Baulks, a spade-plate and an afternoon's work, after which the weapon is laid on one arc and is not going anywhere. Sappers approve of it; everyone who has had to leave in a hurry does not.",
  },
  mount_casemate_trunnion: {
    key: 'mount_casemate_trunnion', label: "Casemate Trunnion Block", slot: 'mount', pts: 0.65,
    appliesTo: ['flame', 'crawler_gun', 'artillery'],
    mods: { accuracy: 0.09, reliability: 0.07 },
    tradeoff: { weight: 20, range: -1 },
    blurb: "The gun set into the hull itself on a cast block, with the plate closed around it and the barrel shortened to clear the works. Nothing is steadier and nothing is less able to look elsewhere.",
  },
};

// ---------------------------------------------------------------------------
// 8. Quirks
//
// A named characteristic of a weapon — of the DESIGN when it is authored onto
// a pattern, of the INDIVIDUAL WEAPON when rollWeapon hangs one on an instance.
//
// EVERY QUIRK CARRIES A MACHINE-EVALUABLE CONDITION (drift guard 11). "Machine
// evaluable" is enforced rather than asserted: the condition vocabulary is the
// data table below, evaluateQuirk is the pure function that reads it, and a
// quirk whose effect exists only in its blurb cannot be expressed. Prose
// describes; numbers decide.
//
// THE CONTEXT VOCABULARY — what a caller must put in `ctx`, and what each
// condition key reads out of it. Anything absent reads as "condition not met",
// so a partial context is safe and an empty context switches every conditional
// quirk off. That property is load-bearing: the Points Audit prices every
// pattern with ctx = {}, so a pattern's authored quirks never move its price.
//
//   always              (nothing)                     — always true
//   weather             ctx.weather              'clear'|'rain'|'snow'|'fog'|'storm'
//   terrain             ctx.terrain              a tactical field terrain key (Lane B)
//   night               ctx.night === true       — a dark run (LORE §3.1)
//   adjacent_specialist ctx.adjacentSpecialists  string[] of SpecialistKey
//   consecutive_fire    ctx.consecutiveFire      number — fire orders in a row, >= value
//   vs_house            ctx.vsHouse + ctx.nativeHouses  — see below
//   vs_armour_class     ctx.vsArmourClass        an ArmourClassKey
//   quality_at_least    ctx.quality              a QualityKey, ranked by QUALITY_ORDER
//   range_at_most       ctx.range                number of hexes to the target, <= value
//   figures_at_least    ctx.figures              number of figures still standing, >= value
//   round_at_least      ctx.round                battle round number, >= value
//
// `vs_house` with the value 'native_house' resolves against the MAKER, not
// against a fixed house: it is met when ctx.vsHouse appears in ctx.nativeHouses.
// resolveWeapon fills ctx.nativeHouses and ctx.quality from the instance itself
// before it evaluates anything, because both are properties of the weapon
// rather than of the battlefield and no caller should have to look them up.
//
// ⚠ NO QUIRK ANYWHERE WRITES `armorPen`, AND THAT IS NOT AN OVERSIGHT. Quality
// multipliers never touch penetration and no small-arm-legal modification adds
// it either, so this table is the last remaining way an infantry weapon could
// acquire the ability to open a hull. Leaving it shut is what turns the class
// sweep from "no rifle penetrates heavy armour at issue grade, unmodded" into
// "no rifle penetrates heavy armour, ever, at any grade, however fitted, under
// any condition". A test sweeps this table to keep it that way.
//
// ⚠ A QUIRK WITH `condition.key === 'always'` IS AN INSTANCE QUIRK AND IS NEVER
// AUTHORED ONTO A PATTERN. An unconditional modifier attached to a design is
// indistinguishable from the design's own numbers and belongs in `base`; what
// it genuinely describes is the individual weapon — this one shoots low, this
// one has never jammed — which is exactly what rollWeapon hangs on an instance.
// Asserted, in both directions.
// ---------------------------------------------------------------------------

// The rank order quality_at_least compares against, and the order rollWeapon
// walks when it draws a grade. Declared as data so neither the evaluator nor
// the roller carries a hard-coded list.
export const QUALITY_ORDER = ['scrap', 'issue', 'proofed', 'master', 'relic'];

// The specialist keys an adjacent_specialist condition may name: Lane A's five
// (§3) plus Lane F's five. Declared locally, never imported — and the platform
// lane reconciles it if Lane F renames one.
export const SPECIALIST_KEYS = ['medic', 'signaler', 'commissar', 'heavy_gunner', 'sapper', 'chaplain', 'cartographer', 'forward_observer', 'provost_sergeant', 'relic_bearer'];

// The condition vocabulary, as data. `valueType` says what `condition.value`
// must be: 'none' means the condition takes no value and must not carry one.
export const QUIRK_CONDITION_KEYS = {
  always: { valueType: 'none' },
  weather: { valueType: 'string' },
  terrain: { valueType: 'string' },
  night: { valueType: 'none' },
  adjacent_specialist: { valueType: 'string' },
  consecutive_fire: { valueType: 'number' },
  vs_house: { valueType: 'string' },
  vs_armour_class: { valueType: 'string' },
  quality_at_least: { valueType: 'string' },
  range_at_most: { valueType: 'number' },
  figures_at_least: { valueType: 'number' },
  round_at_least: { valueType: 'number' },
};

export const QUIRKS = {
  // --- always: the individual weapon's own history ----------------------
  shoots_low: {
    key: 'shoots_low', label: "Shoots Low",
    mods: { accuracy: -0.06, damage: 0.2 },
    condition: { key: 'always' },
    blurb: "It has printed low and left since the day it was proofed. The section knows the hold-over, nobody has ever written it down, and the extra bite at the bottom of the group is nobody's idea of compensation.",
  },
  sweet_barrel: {
    key: 'sweet_barrel', label: "Sweet Barrel",
    mods: { accuracy: 0.07 },
    condition: { key: 'always' },
    blurb: "One tube in a hundred comes off the gear better than the drawings ask for, and the armourer who finds it says nothing and issues it to the best shot in the company.",
  },
  sticky_action: {
    key: 'sticky_action', label: "Sticky Action",
    mods: { rateOfFire: -0.12, reliability: -0.04 },
    condition: { key: 'always' },
    blurb: "Something in the bolt way was never quite finished, and no amount of stoning has found it. It works. It simply does not want to.",
  },
  worn_in: {
    key: 'worn_in', label: "Worn In",
    mods: { reliability: 0.06, weight: -0.1 },
    condition: { key: 'always' },
    blurb: "Ten thousand rounds have lapped every bearing surface into agreement with every other, and taken the bluing, the sharp edges and a little of the metal with them.",
  },
  condemned_lot: {
    key: 'condemned_lot', label: "Condemned Lot",
    mods: { damage: 0.3, reliability: -0.16 },
    condition: { key: 'always' },
    blurb: "Struck off the proof register for a fault the inspector recorded and the Prize Yard did not read. It is loaded hotter than it should be and it will let somebody know.",
  },

  // --- weather ---------------------------------------------------------
  cold_forged: {
    key: 'cold_forged', label: "Cold-Forged",
    mods: { reliability: 0.1 },
    condition: { key: 'weather', value: 'snow' },
    blurb: "Forged and finished at the Emberwright benches through a Union winter, with clearances cut for a metal that has already shrunk. It comes into its own on the day everything else stops.",
  },
  damp_proofed: {
    key: 'damp_proofed', label: "Damp-Proofed",
    mods: { reliability: 0.12 },
    condition: { key: 'weather', value: 'rain' },
    blurb: "Waxed furniture, a sealed magazine well and a lacquered case mouth on every round. The fitting costs an afternoon and returns it on the first wet week of the season.",
  },
  dust_sealed: {
    key: 'dust_sealed', label: "Dust-Sealed",
    mods: { reliability: 0.1, accuracy: 0.03 },
    condition: { key: 'weather', value: 'storm' },
    blurb: "A felt-lipped dust cover over the ejection port and a shrouded gas way, fitted as standard by people who have watched a storm take a company's rifles out of action in an hour.",
  },
  glare_cut_sights: {
    key: 'glare_cut_sights', label: "Glare-Cut Sights",
    mods: { accuracy: 0.06 },
    condition: { key: 'weather', value: 'clear' },
    blurb: "Smoked leaves and a matted rib, so a bright sky stops washing the foresight out. On any other day it is a slightly darker sight picture and nothing more.",
  },
  close_laid: {
    key: 'close_laid', label: "Close-Laid",
    mods: { rateOfFire: 0.15 },
    condition: { key: 'weather', value: 'fog' },
    blurb: "Zeroed for the distance a man can actually see in a fog bank and worked from a rest at that distance, on the sound reasoning that nothing further away is going to be identified anyway.",
  },

  // --- terrain ---------------------------------------------------------
  gallery_worked: {
    key: 'gallery_worked', label: "Gallery-Worked",
    mods: { accuracy: 0.08 },
    condition: { key: 'terrain', value: 'rubble' },
    blurb: "Cut short, braced at the fore-end and sighted for the length of a pit gallery. Among fallen courses and broken works it handles as though the ground were drawn for it, because it was.",
  },
  mire_shod: {
    key: 'mire_shod', label: "Mire-Shod",
    mods: { reliability: 0.1 },
    condition: { key: 'terrain', value: 'marsh' },
    blurb: "Broadened bipod shoes, a plugged muzzle cap and a drain cut in the butt. Marsh work destroys weapons that were not thought about beforehand, and this one was.",
  },
  short_stocked: {
    key: 'short_stocked', label: "Short-Stocked",
    mods: { rateOfFire: 0.12, accuracy: 0.04 },
    condition: { key: 'terrain', value: 'woods' },
    blurb: "An inch off the butt and the sling moved forward, so the weapon comes up inside a thicket instead of catching on it. Every scout arm on the Ground is issued this way and pretends it is an accident.",
  },

  // --- night -----------------------------------------------------------
  dark_run_sights: {
    key: 'dark_run_sights', label: "Dark-Run Sights",
    mods: { accuracy: 0.1 },
    condition: { key: 'night' },
    blurb: "Luminous salts bedded into the foresight and the rear notch, renewed every third season out of a tin the armourer signs for. On a dark run it is the difference between shooting and firing.",
  },
  flashless_charge: {
    key: 'flashless_charge', label: "Flashless Charge",
    mods: { accuracy: 0.05, reliability: 0.04 },
    condition: { key: 'night' },
    blurb: "A cooler propellant that leaves the muzzle without announcing the position to everyone on the ridge. The Ministry issues it by the lot and counts the empties.",
  },

  // --- adjacent_specialist ---------------------------------------------
  ferrymans_blessing: {
    key: 'ferrymans_blessing', label: "Ferryman's Blessing",
    mods: { morale: 1 },
    condition: { key: 'adjacent_specialist', value: 'relic_bearer' },
    blurb: "Numbered against a vigil at the Nine Cradles and inscribed with the fitter's name. Beside a relic-bearer the men holding one believe the inscription, and the Ministry has stopped arguing about whether that counts.",
  },
  ranged_by_wire: {
    key: 'ranged_by_wire', label: "Ranged By Wire",
    mods: { range: 2, accuracy: 0.05 },
    condition: { key: 'adjacent_specialist', value: 'signaler' },
    blurb: "Ascendancy furniture carries a terminal post and a ranging card cut for the signals net. With a signaler at the elbow the weapon is laid off somebody else's eyes.",
  },
  belt_shared: {
    key: 'belt_shared', label: "Belt-Shared",
    mods: { rateOfFire: 0.2 },
    condition: { key: 'adjacent_specialist', value: 'heavy_gunner' },
    blurb: "Chambered and linked so a section's automatic and its rifles draw out of one crate. Beside a heavy gunner nobody stops to count, which is the entire argument for standardising a cartridge.",
  },

  // --- consecutive_fire ------------------------------------------------
  runs_hot: {
    key: 'runs_hot', label: "Runs Hot",
    mods: { rateOfFire: 0.15, reliability: -0.1 },
    condition: { key: 'consecutive_fire', value: 2 },
    blurb: "The cyclic rate climbs with the barrel temperature, which the Arsenal describes as a feature and the men describe as the point at which it starts eating belts and its own extractor.",
  },
  barrel_droop: {
    key: 'barrel_droop', label: "Barrel Droop",
    mods: { accuracy: -0.1 },
    condition: { key: 'consecutive_fire', value: 3 },
    blurb: "A thin tube held at one end goes where heat tells it to. By the third sustained order the group has walked off the aiming mark and no amount of shouting brings it back.",
  },

  // --- vs_house --------------------------------------------------------
  prize_taken: {
    key: 'prize_taken', label: "Prize-Taken",
    mods: { morale: 1 },
    condition: { key: 'vs_house', value: 'native_house' },
    blurb: "Adjudicated out of the hands it was made for, stamped with a writ number over the old maker's mark, and pointed back the way it came. The Court holds that this is the highest use a weapon can be put to.",
  },
  synod_proscribed: {
    key: 'synod_proscribed', label: "Synod-Proscribed",
    mods: { morale: 1 },
    condition: { key: 'vs_house', value: 'synod' },
    blurb: "Named in a Bastion Synod proscription list, which the men who carry it have had read to them and have chosen to take as a testimonial.",
  },

  // --- vs_armour_class -------------------------------------------------
  plate_hungry: {
    key: 'plate_hungry', label: "Plate-Hungry",
    mods: { damage: 0.8 },
    condition: { key: 'vs_armour_class', value: 'heavy' },
    blurb: "Laid, fused and drilled for one target and one target only. Against a breakthrough glacis the crew does not need to be told the range; against anything else they are slower than they should be.",
  },
  soft_shot: {
    key: 'soft_shot', label: "Soft-Shot",
    mods: { damage: 0.5 },
    condition: { key: 'vs_armour_class', value: 'none' },
    blurb: "A loading and a laying chosen for men in the open, which is what the Ground mostly contains. It is a great deal less impressive the moment the ground contains anything else.",
  },

  // --- quality_at_least ------------------------------------------------
  proof_stamped: {
    key: 'proof_stamped', label: "Proof-Stamped",
    mods: { accuracy: 0.05, reliability: 0.05 },
    condition: { key: 'quality_at_least', value: 'proofed' },
    blurb: "Two crossed hammers and a date, struck into the receiver by a proof house that put its own name beside them. A scrap-grade example of the same pattern carries the stamping and none of the meaning.",
  },
  hand_lapped: {
    key: 'hand_lapped', label: "Hand-Lapped",
    mods: { accuracy: 0.09 },
    condition: { key: 'quality_at_least', value: 'master' },
    blurb: "Bore lapped, locking surfaces stoned and the trigger let off at a weight the fitter chose rather than the drawing. It cannot be done at a shift rate and it cannot be faked.",
  },
  hair_trigger: {
    key: 'hair_trigger', label: "Hair Trigger",
    mods: { initiative: 1 },
    condition: { key: 'quality_at_least', value: 'proofed' },
    blurb: "Let off so fine that the shot is away before the intention is finished. Superb in a duel and a standing hazard on every wagon, ladder and trench-board between here and the line.",
  },

  // --- range_at_most ---------------------------------------------------
  close_bound: {
    key: 'close_bound', label: "Close-Bound",
    mods: { rateOfFire: 0.3 },
    condition: { key: 'range_at_most', value: 2 },
    blurb: "Short, quick to the shoulder and sighted no further than a man can be sure of. Inside two hexes it is the fastest thing in the section's hands.",
  },
  point_blank_bite: {
    key: 'point_blank_bite', label: "Point-Blank Bite",
    mods: { damage: 0.6, accuracy: 0.08 },
    condition: { key: 'range_at_most', value: 1 },
    blurb: "Everything the charge has, delivered before it has had a chance to spread, slow or be thought about. The boarding parties price a weapon on this number alone.",
  },

  // --- figures_at_least ------------------------------------------------
  crew_drilled: {
    key: 'crew_drilled', label: "Crew-Drilled",
    mods: { rateOfFire: 0.25, reliability: 0.05 },
    condition: { key: 'figures_at_least', value: 4 },
    blurb: "Laid, loaded, fused and served by a full detachment who have done it together often enough to stop speaking. Below four hands the drill becomes a conversation and the rate collapses.",
  },
  loaders_mate: {
    key: 'loaders_mate', label: "Loader's Mate",
    mods: { rateOfFire: 0.15 },
    condition: { key: 'figures_at_least', value: 2 },
    blurb: "A second pair of hands on the ready rounds, which is the cheapest increase in rate of fire the Ministry has ever costed and the first thing casualties take away.",
  },

  // --- round_at_least --------------------------------------------------
  settles_in: {
    key: 'settles_in', label: "Settles In",
    mods: { accuracy: 0.08, reliability: 0.05 },
    condition: { key: 'round_at_least', value: 3 },
    blurb: "Fouling beds the first rounds in, the bipod finds its own holes in the ground and the firer stops flinching. Everything about the weapon is better by the third round and nobody can quite say why.",
  },
  ledger_kept: {
    key: 'ledger_kept', label: "Ledger-Kept",
    mods: { morale: 1 },
    condition: { key: 'round_at_least', value: 5 },
    blurb: "Every round it has fired is written against its serial in a book the crew keeps in the ammunition chest. By the fifth round of an engagement the book is doing as much work as the gun.",
  },
};

// evaluateQuirk(quirk, ctx) → boolean
//
// Pure, total and never throws: an unknown condition key, a missing ctx field
// and a malformed quirk all read as "not met". That is the safe direction —
// a condition the engine has not learned to supply switches the quirk OFF
// rather than granting it for free.
export const evaluateQuirk = (quirk, ctx) => {
  const c = quirk && quirk.condition;
  if (!c || typeof c.key !== 'string') return false;
  const x = ctx || {};
  if (c.key === 'always') return true;
  if (c.key === 'weather') return x.weather === c.value;
  if (c.key === 'terrain') return x.terrain === c.value;
  if (c.key === 'night') return x.night === true;
  if (c.key === 'adjacent_specialist') return Array.isArray(x.adjacentSpecialists) && x.adjacentSpecialists.indexOf(c.value) !== -1;
  if (c.key === 'consecutive_fire') return typeof x.consecutiveFire === 'number' && x.consecutiveFire >= c.value;
  if (c.key === 'vs_house') {
    if (c.value !== 'native_house') return x.vsHouse === c.value;
    return Array.isArray(x.nativeHouses) && typeof x.vsHouse === 'string' && x.nativeHouses.indexOf(x.vsHouse) !== -1;
  }
  if (c.key === 'vs_armour_class') return x.vsArmourClass === c.value;
  if (c.key === 'quality_at_least') {
    const have = QUALITY_ORDER.indexOf(x.quality);
    const need = QUALITY_ORDER.indexOf(c.value);
    return have !== -1 && need !== -1 && have >= need;
  }
  if (c.key === 'range_at_most') return typeof x.range === 'number' && x.range <= c.value;
  if (c.key === 'figures_at_least') return typeof x.figures === 'number' && x.figures >= c.value;
  if (c.key === 'round_at_least') return typeof x.round === 'number' && x.round >= c.value;
  return false;
};

// ---------------------------------------------------------------------------
// 9. Resolution — a WeaponInstance becomes a WeaponBase
//
// THE APPLICATION ORDER IS THE CONTRACT (ARMS_CATALOGUE.md §10). It is not an
// implementation detail and it is not commutative: quality multiplies, and
// everything else adds, so moving a step changes every number in the
// catalogue.
//
//   1. b = a copy of the pattern's own base            (all nine WeaponBase keys)
//   2. b = add(b, MANUFACTURERS[maker].signature)      (additive deltas)
//   3. b = mul(b, QUALITY_GRADES[quality].mult)        (multiplicative; absent key = x1)
//   4. for each fitted mod: b = add(b, mod.mods); b = add(b, mod.tradeoff)
//   5. for each quirk on the pattern or the instance that evaluateQuirk passes:
//        b = add(b, quirk.mods)                        (WeaponBase keys ONLY)
//   6. clamp: accuracy [0.05, 1.5] · reliability [0.05, 1] · rateOfFire [0.1, 12]
//             damage >= 0 · armorPen >= 0 · range >= 0 · weight >= 0.1
//   6b. round every numeric field to four places, so a resolved weapon is
//       comparable, printable and reproducible across engines. This does not
//       reorder anything; it is stated because the rounding is observable.
//   7. damageType and aoe pass through from the pattern unchanged unless a mod
//      or a quirk SETS them — those two are replacements, never deltas.
//
// A quirk's morale/initiative keys are deliberately dropped here: they are not
// WeaponBase fields, they never touch a shot, and §4 gives them no consumer in
// this lane. They survive on the instance for the platform lane to read.
//
// AND THEY REACH NOTHING ELSE EITHER, WHICH IS WORTH STATING PLAINLY RATHER
// THAN LEAVING A READER TO GREP FOR IT. deriveLoadout's keys are fixed by
// LOADOUT_KEYS and morale is not among them; loadoutProfile returns exactly
// four fields and none of them is morale. So every quirk in that branch of the
// union is DECLARATIVE: their conditions evaluate, their numbers
// are authored and mirrored, and no function in this lane spends them. Wiring
// them is a platform decision (PLATFORM_HANDOFF.md, Lane I) — §4's Quirk.mods
// is a UNION, and a row that mixes a WeaponBase key with a morale/initiative
// key would have half of itself silently discarded here, so no row does.
// ---------------------------------------------------------------------------

// The nine WeaponBase keys, in the order §4 declares them. Every delta is
// filtered through this list, which is what "WeaponBase keys only" means in
// code rather than in a comment.
export const WEAPON_BASE_KEYS = ['accuracy', 'rateOfFire', 'damage', 'armorPen', 'range', 'reliability', 'weight', 'damageType', 'aoe'];

// Additive for numbers, replacement for the two non-numeric fields. Mutates
// the working copy, which never escapes resolveWeapon un-cloned.
const applyDelta = (base, delta) => {
  if (!delta) return base;
  for (let i = 0; i < WEAPON_BASE_KEYS.length; i++) {
    const k = WEAPON_BASE_KEYS[i];
    if (!Object.prototype.hasOwnProperty.call(delta, k)) continue;
    const v = delta[k];
    base[k] = typeof v === 'number' && typeof base[k] === 'number' ? base[k] + v : v;
  }
  return base;
};

// The one multiplicative layer. An absent key is x1, never x0.
const applyMult = (base, mult) => {
  if (!mult) return base;
  for (let i = 0; i < WEAPON_BASE_KEYS.length; i++) {
    const k = WEAPON_BASE_KEYS[i];
    if (typeof mult[k] !== 'number' || typeof base[k] !== 'number') continue;
    base[k] = base[k] * mult[k];
  }
  return base;
};

const clampTo = (n, lo, hi) => (n < lo ? lo : n > hi ? hi : n);

// The houses a maker treats as its own — read off the access map rather than
// stored twice, so a maker with two native houses (and there is one) resolves
// a 'native_house' quirk against both.
const nativeHousesOf = (maker) => {
  const out = [];
  const keys = Object.keys(maker.access);
  for (let i = 0; i < keys.length; i++) {
    if (maker.access[keys[i]] === 'native') out.push(keys[i]);
  }
  return out;
};

// The quirk keys actually in force: the pattern's characteristics union the
// instance's own, deduplicated, filtered by evaluateQuirk against the enriched
// context.
const activeQuirkKeys = (patternQuirks, instanceQuirks, ctx) => {
  const seen = [];
  const all = (patternQuirks || []).concat(instanceQuirks || []);
  for (let i = 0; i < all.length; i++) {
    const k = all[i];
    if (seen.indexOf(k) !== -1) continue;
    if (!QUIRKS[k]) continue;
    if (!evaluateQuirk(QUIRKS[k], ctx)) continue;
    seen.push(k);
  }
  return seen;
};

// resolveWeapon(instance, ctx) → WeaponBase
//
// Pure. The instance is not mutated, the tables are not mutated, and the same
// (instance, ctx) returns a deeply-equal base every time. Throws on an unknown
// pattern or quality rather than resolving something plausible-looking.
export const resolveWeapon = (instance, ctx) => {
  const pattern = WEAPON_PATTERNS[instance.patternKey];
  if (!pattern) throw new Error("resolveWeapon: unknown pattern '" + instance.patternKey + "'");
  const grade = QUALITY_GRADES[instance.quality];
  if (!grade) throw new Error("resolveWeapon: unknown quality '" + instance.quality + "'");
  const maker = MANUFACTURERS[pattern.maker];

  const b = { accuracy: pattern.base.accuracy, rateOfFire: pattern.base.rateOfFire, damage: pattern.base.damage, armorPen: pattern.base.armorPen, range: pattern.base.range, reliability: pattern.base.reliability, weight: pattern.base.weight, damageType: pattern.base.damageType, aoe: pattern.base.aoe };

  applyDelta(b, maker.signature);
  applyMult(b, grade.mult);

  const fitted = instance.mods || [];
  for (let i = 0; i < fitted.length; i++) {
    const mod = MODIFICATIONS[fitted[i]];
    if (!mod) continue;
    applyDelta(b, mod.mods);
    applyDelta(b, mod.tradeoff);
  }

  // The instance knows two things about itself that no caller should have to
  // look up: what grade it is, and which houses its maker calls its own.
  const full = { weather: ctx && ctx.weather, terrain: ctx && ctx.terrain, night: ctx && ctx.night, adjacentSpecialists: ctx && ctx.adjacentSpecialists, consecutiveFire: ctx && ctx.consecutiveFire, vsHouse: ctx && ctx.vsHouse, vsArmourClass: ctx && ctx.vsArmourClass, range: ctx && ctx.range, figures: ctx && ctx.figures, round: ctx && ctx.round, quality: instance.quality, nativeHouses: nativeHousesOf(maker) };
  const live = activeQuirkKeys(pattern.quirks, instance.quirks, full);
  for (let i = 0; i < live.length; i++) applyDelta(b, QUIRKS[live[i]].mods);

  b.accuracy = round4(clampTo(b.accuracy, 0.05, 1.5));
  b.reliability = round4(clampTo(b.reliability, 0.05, 1));
  b.rateOfFire = round4(clampTo(b.rateOfFire, 0.1, 12));
  b.damage = round4(b.damage < 0 ? 0 : b.damage);
  b.armorPen = round4(b.armorPen < 0 ? 0 : b.armorPen);
  b.range = round4(b.range < 0 ? 0 : b.range);
  b.weight = round4(b.weight < 0.1 ? 0.1 : b.weight);
  return b;
};

// ---------------------------------------------------------------------------
// 10. rollWeapon — pure, seeded and reproducible
//
// Battle loot, dig finds and armory certifications all call this; the platform
// lane decides when it fires. ONE mulberry32(seed) stream is drawn in ONE fixed
// order, and THE ORDER IS PART OF THE CONTRACT — changing it changes every
// weapon the server has ever issued, retroactively, because a serial is
// reproduced from its seed rather than stored:
//
//   1. pattern       uniform over the filtered pool, sorted by key ascending
//   2. quality       weighted over the five rollWeights, adjusted by luck
//   3. mod count     from MOD_COUNT_BY_QUALITY, clamped to the slots available
//   4. each mod      uniform over the eligible pool, no two sharing a slot
//   5. extra quirks  a count, 0-2 uniform
//   6. each quirk    uniform over QUIRKS not already on the pattern
//   7. serial        five characters off the same stream
//
// Sorting each pool by key is what makes the draw independent of object
// insertion order, so a table row appended by a later lane cannot silently
// renumber the whole history.
// ---------------------------------------------------------------------------

// Tier height. The three II:* branches are the SAME height and differ only in
// how they are unlocked, so a cap admits every tier strictly below it plus its
// own exact tier — 'II:Eng' opens engineering patterns and not cipher ones,
// while 'III' opens everything.
export const TIER_RANK = { I: 1, 'II:Cache': 2, 'II:Eng': 2, 'II:Ciph': 2, 'II:Wake': 2, III: 3 };

// Luck is data, not code. adjustedWeight(g) = max(0, rollWeight x (1 + clamp(luck, -1, 1) x LUCK_SLOPE[g])).
// At luck 0 the adjusted weights ARE the base weights, which is what makes the
// 10 000-roll distribution test a test of the table rather than of the slope.
export const LUCK_SLOPE = { scrap: -0.6, issue: -0.2, proofed: 0.2, master: 0.5, relic: 0.9 };

// Inclusive [min, max]. Quality is NOT tier-gated — tierCap gates the pattern
// pool only — but the number of fitted modifications is, because a better
// weapon is one somebody spent time on.
export const MOD_COUNT_BY_QUALITY = { scrap: [0, 1], issue: [0, 1], proofed: [1, 2], master: [2, 3], relic: [2, 3] };

// Serial characters. Five drawn from this alphabet, off the same stream.
const SERIAL_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const rollWeapon = ({ seed, class: weaponClass, maker, calibre, tierCap, luck }) => {
  // mulberry32 coerces its argument with `a |= 0`, so an undefined or null seed
  // silently BECOMES seed 0 and every caller that failed to derive one gets the
  // same weapon. The platform derives seeds from (gameId, turn, sourceKey,
  // index); a derivation that comes up short must fail loudly here rather than
  // hand out the seed-0 mortar forever.
  if (!Number.isFinite(seed)) throw new Error('rollWeapon: seed must be a finite number, got ' + String(seed));
  const rnd = mulberry32(seed);
  const cap = tierCap || 'III';
  const capRank = TIER_RANK[cap];
  if (capRank === undefined) throw new Error("rollWeapon: unknown tierCap '" + cap + "'");

  const pool = Object.keys(WEAPON_PATTERNS).filter((k) => {
    const p = WEAPON_PATTERNS[k];
    if (weaponClass && p.class !== weaponClass) return false;
    if (maker && p.maker !== maker) return false;
    if (calibre && p.calibre !== calibre) return false;
    return TIER_RANK[p.tier] < capRank || p.tier === cap;
  }).sort();
  if (pool.length === 0) {
    throw new Error('rollWeapon: no pattern matches { class: ' + (weaponClass || 'any') + ', maker: ' + (maker || 'any') + ', calibre: ' + (calibre || 'any') + ', tierCap: ' + cap + ' }');
  }
  const patternKey = pool[Math.floor(rnd() * pool.length)];
  const pattern = WEAPON_PATTERNS[patternKey];

  // NaN is `typeof 'number'`, and clampTo(NaN) is NaN, which makes every
  // adjusted weight NaN, makes `ticket < 0` never true, and drops the loop
  // through to its initialiser — the RAREST grade, on every seed. Only a finite
  // luck is luck; anything else is neutral.
  const l = clampTo(Number.isFinite(luck) ? luck : 0, -1, 1);
  const weights = QUALITY_ORDER.map((g) => {
    const w = QUALITY_GRADES[g].rollWeight * (1 + l * LUCK_SLOPE[g]);
    return w < 0 ? 0 : w;
  });
  let total = 0;
  for (let i = 0; i < weights.length; i++) total += weights[i];
  let ticket = rnd() * total;
  let quality = QUALITY_ORDER[QUALITY_ORDER.length - 1];
  for (let i = 0; i < QUALITY_ORDER.length; i++) {
    ticket -= weights[i];
    if (ticket < 0) { quality = QUALITY_ORDER[i]; break; }
  }

  const eligible = Object.keys(MODIFICATIONS).filter((k) => {
    const m = MODIFICATIONS[k];
    return pattern.slots.indexOf(m.slot) !== -1 && m.appliesTo.indexOf(pattern.class) !== -1;
  }).sort();
  const openSlots = [];
  for (let i = 0; i < eligible.length; i++) {
    const s = MODIFICATIONS[eligible[i]].slot;
    if (openSlots.indexOf(s) === -1) openSlots.push(s);
  }
  const bounds = MOD_COUNT_BY_QUALITY[quality];
  let want = bounds[0] + Math.floor(rnd() * (bounds[1] - bounds[0] + 1));
  if (want > openSlots.length) want = openSlots.length;

  const mods = [];
  const usedSlots = [];
  for (let i = 0; i < want; i++) {
    const free = eligible.filter((k) => mods.indexOf(k) === -1 && usedSlots.indexOf(MODIFICATIONS[k].slot) === -1);
    if (free.length === 0) break;
    const picked = free[Math.floor(rnd() * free.length)];
    mods.push(picked);
    usedSlots.push(MODIFICATIONS[picked].slot);
  }

  const extras = Math.floor(rnd() * 3);
  const quirkPool = Object.keys(QUIRKS).filter((k) => (pattern.quirks || []).indexOf(k) === -1).sort();
  const quirks = [];
  for (let i = 0; i < extras; i++) {
    const free = quirkPool.filter((k) => quirks.indexOf(k) === -1);
    if (free.length === 0) break;
    quirks.push(free[Math.floor(rnd() * free.length)]);
  }

  const stem = MANUFACTURERS[pattern.maker].nameStems[0].slice(0, 3).toUpperCase();
  const year = pattern.label.match(/ (\d{3}) /)[1];
  let five = '';
  for (let i = 0; i < 5; i++) five += SERIAL_ALPHABET.charAt(Math.floor(rnd() * SERIAL_ALPHABET.length));

  return { patternKey: patternKey, quality: quality, mods: mods, quirks: quirks, serial: stem + '-' + year + '-' + five };
};

// ---------------------------------------------------------------------------
// 11. Reduction — a squad's weapons become squad numbers
//
// THE TACTICAL ENGINE NEVER INSPECTS A WEAPON (drift guard 11). It is handed
// squad-level values by deriveLoadout and a damage profile by loadoutProfile,
// and that is the whole of its knowledge of this catalogue. Everything below
// exists to make that boundary real rather than aspirational.
//
// deriveLoadout's output keys are a strict subset of the §4 SquadType value
// keys, and LOADOUT_KEYS says what each one MEANS so deriveSquad cannot guess
// wrong: 'absolute' replaces the SquadType's base value, 'delta' is added to it.
//
// THE REDUCTION FORMULA, implemented exactly as documented in §10 of the
// catalogue:
//
//   shares:    primary 1.00 · support 0.15 · sidearm 0.10
//   b(w)       = resolveWeapon(w, ctx)                    — the weapon as carried
//   bare(w)    = resolveWeapon(w minus its bayonet-slot mods, ctx)
//   shots(w)   = b.rateOfFire x b.accuracy x b.reliability
//   fire(w)    = bare.damage x shots(w)
//   blade(w)   = max(0, b.damage - bare.damage)
//
//   ranged = round2( SUM share_w x fire(w) )
//   range  = max over instances of b.range               — the longest reach sets the reach
//   melee  = round2( SUM share_w x blade(w) )
//   weight = SUM share_w x b.weight
//   speed  = -floor( weight / WEIGHT_PER_SPEED_STEP )    — a delta, always <= 0
//   pts    = round2( SUM share_w x pattern.pts x grade.ptsMult )
//
// WHY THE WEAPON IS RESOLVED TWICE. A bayonet's value is its blade, and a
// blade must never make a weapon shoot harder. Resolving once with the blade
// and once without, and taking the DIFFERENCE as melee while computing fire
// from the bladeless damage, is what stops the same number being spent twice.
// The blade's ACCURACY cost is kept in shots(w), because a fixed bayonet
// genuinely does spoil the aim.
//
// `figures` is deliberately not consumed. Scaling a squad's output by how many
// men are left is deriveSquad's job (Lane A); this function answers only the
// question "what is ONE figure's weapon worth". `melee`, `ranged` and `pts`
// come back PER FIGURE and Lane A multiplies them by `figures`; `range` and
// `speed` describe what a figure carries and are never scaled by headcount.
//
// AN ABSENT `loadout` AND AN EMPTY ONE ARE DIFFERENT STATES, and the
// difference is not cosmetic: melee, ranged and range are ABSOLUTE, meaning
// they REPLACE the SquadType base value. §4 makes `loadout?: Loadout`
// optional and no squad row carries one yet, so a deriveSquad that called this
// unconditionally would replace every authored melee/ranged/range with a zero.
// A squad with no `loadout` at all therefore returns {} — it contributes
// nothing and overrides nothing. A squad that HAS a `loadout` holding no
// weapons is an unarmed stand, which is a legal state on the field, and it
// reduces to zeroes because zero is what an unarmed stand does.
// ---------------------------------------------------------------------------

// The §4 SquadType value keys — the allowlist deriveLoadout's output must sit
// inside. Declared locally: a shared Deno module never imports tactical.ts.
export const SQUAD_VALUE_KEYS = ['figures', 'melee', 'ranged', 'range', 'armor', 'speed', 'morale', 'pts', 'specials'];

// What each returned key means to deriveSquad.
export const LOADOUT_KEYS = { melee: 'absolute', ranged: 'absolute', range: 'absolute', speed: 'delta', pts: 'delta' };

// How much of a squad's fire each carried weapon accounts for.
export const LOADOUT_SHARES = { primary: 1, support: 0.15, sidearm: 0.1 };

// Kilograms of share-weighted weapon per step of speed drag.
const WEIGHT_PER_SPEED_STEP = 12;

// The same instance with every bayonet-slot modification taken off it.
const withoutBlades = (instance) => {
  const kept = (instance.mods || []).filter((k) => !MODIFICATIONS[k] || MODIFICATIONS[k].slot !== 'bayonet');
  return { patternKey: instance.patternKey, quality: instance.quality, mods: kept, quirks: instance.quirks, serial: instance.serial };
};

export const deriveLoadout = (squad, ctx) => {
  if (!squad || !squad.loadout) return {};
  const carried = squad.loadout;
  const order = ['primary', 'support', 'sidearm'];
  let ranged = 0;
  let melee = 0;
  let weight = 0;
  let pts = 0;
  let range = 0;
  for (let i = 0; i < order.length; i++) {
    const instance = carried[order[i]];
    if (!instance) continue;
    const share = LOADOUT_SHARES[order[i]];
    const b = resolveWeapon(instance, ctx);
    const bare = resolveWeapon(withoutBlades(instance), ctx);
    const shots = b.rateOfFire * b.accuracy * b.reliability;
    ranged += share * bare.damage * shots;
    melee += share * (b.damage > bare.damage ? b.damage - bare.damage : 0);
    weight += share * b.weight;
    if (b.range > range) range = b.range;
    pts += share * WEAPON_PATTERNS[instance.patternKey].pts * QUALITY_GRADES[instance.quality].ptsMult;
  }
  // -0 is NOT 0 to Object.is or to a deep-equal, and `speed` is a delta Lane A
  // adds to a SquadType base value. An unencumbered squad must compare equal to
  // an unarmed one, so the sign is normalised here, once, at the only place the
  // negation happens.
  const drag = Math.floor(weight / WEIGHT_PER_SPEED_STEP);
  return { melee: round2(melee), ranged: round2(ranged), range: round2(range), speed: drag === 0 ? 0 : -drag, pts: round2(pts) };
};

// loadoutProfile(squad, ctx) → { armorPen, damageType, aoe, misfire }
//
// The squad's PRIMARY weapon reduced to the three fields resolveHit needs, plus
// the chance a fire order simply does not go off. This is what Lane A and Lane C
// feed into resolveHit as the `weapon` argument — it is the reason deriveLoadout
// can keep its keys inside SQUAD_VALUE_KEYS while the engine still has enough to
// resolve penetration, and the reason the engine never sees a WeaponInstance.
//
// A squad with no primary returns an inert profile rather than throwing: an
// unarmed stand is a legal state on the field, and it should suppress nothing
// and penetrate nothing.
export const loadoutProfile = (squad, ctx) => {
  const primary = squad && squad.loadout && squad.loadout.primary;
  if (!primary) return { armorPen: 0, damageType: 'kinetic', aoe: null, misfire: 0.5 };
  const b = resolveWeapon(primary, ctx);
  const miss = 1 - b.reliability;
  return { armorPen: b.armorPen, damageType: b.damageType, aoe: b.aoe, misfire: round2(clampTo(miss, 0, 0.5)) };
};

// ---------------------------------------------------------------------------
// 12. The Points Audit — mechanical, not prose
//
// A points audit written by hand rots: someone re-tunes a barrel, nobody
// re-adds the column, and the document goes on asserting a total that its own
// tables contradict. So the audit is CODE. docs/ARMS_CATALOGUE.md §11 prints
// what these four functions return, and test/arms-mirror.test.js §21.e reads
// that table back out of the markdown and re-computes every cell — a stale
// number in the document is a failing test, not a reader's problem.
//
// Two rates, because ANTI-ARMOUR VALUE IS PRICED SEPARATELY FROM
// ANTI-PERSONNEL VALUE. One rate would make a heavy anti-crawler rifle free
// against infantry — it would be priced only on the soft-target damage it is
// bad at, and its armour-killing would cost nothing. Splitting the terms is
// what makes the anti-tank rifle pay for the thing it is FOR.
//
//   AP_RATE  anti-personnel value one point buys — calibrated so the reference
//            pattern, the 141 Levy Rifle at issue grade, costs exactly 1.
//   AA_RATE  anti-armour value one point buys. Deliberately LOWER than
//            AP_RATE: a point buys less armour-killing than it buys
//            man-killing, because on this ground armour-killing is the scarce
//            thing. At these two rates armour value costs ~1.49x per unit.
//
// THE ANCHOR, and it is not the number the brief's prose reaches for first.
// SquadType.pts is the cost of a SQUAD, not of a figure: SQUAD_TYPES.riflemen
// is 100 points for ten figures. WeaponPattern.pts is the cost of ONE weapon —
// the 141 Levy Rifle is 1 point per figure.
//
// THOSE ARE TWO DIFFERENT SCALES, AND THE JOIN BETWEEN THEM IS DECLARED HERE
// RATHER THAN LEFT FOR deriveSquad TO INFER. deriveLoadout is PER FIGURE: it
// never reads squad.figures, and a one-figure squad and a ten-figure squad
// carrying the same weapons reduce to identical numbers (asserted, so it
// cannot quietly stop being true). Its `melee`, `ranged` and `pts` are
// therefore per-figure values that Lane A multiplies by `figures` before
// applying them; `range` and `speed` describe what one figure CARRIES and are
// never scaled by headcount. A ten-figure rifle section carrying 1-point
// rifles adds 10 points to its 100-point squad — the arms layer really is a
// tenth of what the squad costs — but deriveLoadout returns the 1, not the 10.
// LOADOUT_KEYS.pts === 'delta' says where the number LANDS; this paragraph
// says what SCALE it is in, and both are needed.
// ---------------------------------------------------------------------------

export const POINTS_MODEL = {
  AP_RATE: 1.7887,
  AA_RATE: 1.2,
  rangeFactorDivisor: 20,
  apReferenceKey: 'hw141_levy_rifle_mk2',
  aaReferenceKey: 'cl281_openhand_shaped_lance_mk1',
  efficiencyCap: 1.6,
};

// The pattern as the Ministry issues it: issue grade, no mods, no context, so
// only an `always` quirk is in force. Every valuation below is priced HERE and
// nowhere else — a weapon is worth what a line soldier gets handed, not what a
// relic-grade example with three mod kits on it can do.
const issueBase = (pattern) => resolveWeapon({ patternKey: pattern.key, quality: 'issue', mods: [], quirks: [] }, {});

// Expected shots on target per fire order: how often it fires, how often it
// hits, how often it works at all.
const shotsOf = (b) => b.rateOfFire * b.accuracy * b.reliability;

// Reach is worth points. A weapon that kills at 14 hexes is not the same
// purchase as one that kills at 2, even for identical damage.
const rangeFactor = (b) => 1 + b.range / POINTS_MODEL.rangeFactorDivisor;

// Anti-personnel value: what it does to a greatcoat and a sandbag lip.
export const apValue = (pattern) => {
  const b = issueBase(pattern);
  return round4(resolveHit({ weapon: b, target: ARMOUR_CLASSES.soft }).effective * shotsOf(b) * rangeFactor(b));
};

// Anti-armour value: what it does to a breakthrough crawler's glacis. Zero for
// most of the catalogue, and that zero is the point of the whole damage model.
export const aaValue = (pattern) => {
  const b = issueBase(pattern);
  return round4(resolveHit({ weapon: b, target: ARMOUR_CLASSES.heavy }).effective * shotsOf(b) * rangeFactor(b));
};

// What the pattern OUGHT to cost, from its own numbers.
export const fairPts = (pattern) => round4(apValue(pattern) / POINTS_MODEL.AP_RATE + aaValue(pattern) / POINTS_MODEL.AA_RATE);

// What it is worth divided by what it is charged. Above 1 is a bargain; the
// cap is POINTS_MODEL.efficiencyCap and it is asserted for every pattern.
export const patternEfficiency = (pattern) => round4(fairPts(pattern) / pattern.pts);
