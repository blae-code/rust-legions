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
    quirks: [],
    appliesTo: ['riflemen', 'pioneers', 'provost'],
    blurb: "Six chambers, a frame a pit-boss could beat straight on an anvil, and a lanyard ring because the Works assumed it would be dropped. It has settled more disputes over a seam than over an enemy.",
  },
  sy214_writ_yard_automatic_mk3: {
    key: 'sy214_writ_yard_automatic_mk3', label: "Writ 214 Yard Automatic, Mk III",
    maker: 'salvage_court_prize_yard', calibre: 'p9_service', class: 'sidearm', tier: 'I', pts: 0.35,
    base: { accuracy: 0.42, rateOfFire: 2, damage: 1.5, armorPen: 0.9, range: 2, reliability: 0.72, weight: 0.95, damageType: 'kinetic', aoe: null },
    slots: ['magazine', 'barrel', 'muzzle'],
    quirks: [],
    appliesTo: ['assault', 'scouts', 'provost'],
    blurb: "Adjudicated from four incompatible frames and sold back to the party that lost three of them. It empties in a breath, and the Yard's warranty is the writ number stamped over the old maker's mark.",
  },
  fs188_reliquary_officers_sidearm_mk2: {
    key: 'fs188_reliquary_officers_sidearm_mk2', label: "Reliquary 188 Officer's Sidearm, Mk II",
    maker: 'ferrymen_shrine_armoury', calibre: 'p9_service', class: 'sidearm', tier: 'II:Wake', pts: 0.65,
    base: { accuracy: 0.62, rateOfFire: 0.9, damage: 1.9, armorPen: 1.1, range: 3, reliability: 0.92, weight: 1.45, damageType: 'kinetic', aoe: null },
    slots: ['barrel', 'optic', 'stock'],
    quirks: [],
    appliesTo: ['riflemen', 'provost', 'marksmen'],
    blurb: "Fitted by one hand, numbered against a vigil, and issued with a detachable shoulder stock nobody has ever been seen to use. Officers who carry one decline to surrender it at rotation, and the Armoury has stopped asking.",
  },

  // --- carbine ---------------------------------------------------------
  ow197_courier_dust_carbine_mk2: {
    key: 'ow197_courier_dust_carbine_mk2', label: "Courier 197 Dust Carbine, Mk II",
    maker: 'outrider_wheelwrights', calibre: 'c11_carbine', class: 'carbine', tier: 'I', pts: 0.85,
    base: { accuracy: 0.52, rateOfFire: 1.3, damage: 2.1, armorPen: 2, range: 4, reliability: 0.88, weight: 2.6, damageType: 'kinetic', aoe: null },
    slots: ['barrel', 'stock', 'magazine'],
    quirks: [],
    appliesTo: ['scouts', 'autocar_scouts', 'ski_troops'],
    blurb: "Thin-walled, sealed at the action and stripped of every ounce the Compact could argue away. It rides a season in dust without seeing a bench and stops mattering at any distance a courier would rather not be at.",
  },
  hw203_sledge_short_rifle_mk1: {
    key: 'hw203_sledge_short_rifle_mk1', label: "Sledge 203 Short Rifle, Mk I",
    maker: 'hundredweight_works', calibre: 'c11_carbine', class: 'carbine', tier: 'I', pts: 0.95,
    base: { accuracy: 0.5, rateOfFire: 1.1, damage: 2.4, armorPen: 2.2, range: 5, reliability: 0.9, weight: 3.5, damageType: 'kinetic', aoe: null },
    slots: ['barrel', 'bayonet', 'stock'],
    quirks: [],
    appliesTo: ['riflemen', 'pioneers', 'digger_corps'],
    blurb: "The line rifle with a hand of barrel taken off it, for men who work in galleries and load onto wagons. The Works cut the sights down to match and priced it as a saving rather than a compromise.",
  },
  rs241_unity_column_carbine_mk4: {
    key: 'rs241_unity_column_carbine_mk4', label: "Unity 241 Column Carbine, Mk IV",
    maker: 'reclamation_state_arsenal', calibre: 'c11_carbine', class: 'carbine', tier: 'I', pts: 0.9,
    base: { accuracy: 0.46, rateOfFire: 1.6, damage: 2.2, armorPen: 2, range: 4, reliability: 0.78, weight: 3.9, damageType: 'kinetic', aoe: null },
    slots: ['magazine', 'stock', 'bayonet'],
    quirks: [],
    appliesTo: ['riflemen', 'assault', 'autocar_scouts'],
    blurb: "Stamped by the shift rather than the craftsman, and issued to whoever is riding the column that week. It fits every Reclamation hand and stops in every weather the drawings did not anticipate.",
  },

  // --- rifle -----------------------------------------------------------
  hw141_levy_rifle_mk2: {
    key: 'hw141_levy_rifle_mk2', label: "Hundredweight 141 Levy Rifle, Mk II",
    maker: 'hundredweight_works', calibre: 'r13_line', class: 'rifle', tier: 'I', pts: 1,
    base: { accuracy: 0.55, rateOfFire: 1, damage: 2.8, armorPen: 2.5, range: 7, reliability: 0.85, weight: 4.3, damageType: 'kinetic', aoe: null },
    slots: ['barrel', 'optic', 'stock', 'bayonet'],
    quirks: [],
    appliesTo: ['riflemen', 'pilgrim_levy', 'pioneers'],
    blurb: "The rifle the First March was fought with and the rifle every ordnance board still prices against: plain, forgiving, and certified in the year the Ministry started counting. One point per figure, and the whole ledger is drawn from it.",
  },
  rs229_verdict_service_rifle_mk3: {
    key: 'rs229_verdict_service_rifle_mk3', label: "Verdict 229 Service Rifle, Mk III",
    maker: 'reclamation_state_arsenal', calibre: 'r13_line', class: 'rifle', tier: 'I', pts: 1.5,
    base: { accuracy: 0.5, rateOfFire: 1.8, damage: 2.7, armorPen: 2.4, range: 6, reliability: 0.76, weight: 5.1, damageType: 'kinetic', aoe: null },
    slots: ['magazine', 'bayonet', 'muzzle', 'stock'],
    quirks: [],
    appliesTo: ['riflemen', 'assault', 'stormtroops'],
    blurb: "A self-loader drawn around the shift clock: generous tolerances, a gas port that will pass anything, and a cyclic rate that empties the magazine before the holder can think better of it. The Arsenal considers a rifle that outlives its bearer to have been overbuilt.",
  },
  cl252_waymark_pattern_rifle_mk1: {
    key: 'cl252_waymark_pattern_rifle_mk1', label: "Waymark 252 Pattern Rifle, Mk I",
    maker: 'crossloom_pattern_house', calibre: 'r13_line', class: 'rifle', tier: 'I', pts: 1.2,
    base: { accuracy: 0.57, rateOfFire: 1.1, damage: 2.9, armorPen: 2.6, range: 8, reliability: 0.87, weight: 5.4, damageType: 'kinetic', aoe: null },
    slots: ['barrel', 'optic', 'stock', 'bayonet'],
    quirks: [],
    appliesTo: ['riflemen', 'provost', 'pilgrim_levy'],
    blurb: "Nothing brilliant and nothing brittle: no component in it is beyond the reach of a middling workshop, which is exactly what the waystation chartered the house to guarantee. The price is metal, and the Meet-ground pays it gladly.",
  },
  as268_copperline_long_rifle_mk2: {
    key: 'as268_copperline_long_rifle_mk2', label: "Copperline 268 Long Rifle, Mk II",
    maker: 'ascendancy_signal_works', calibre: 'r13_line', class: 'rifle', tier: 'II:Ciph', pts: 1.05,
    base: { accuracy: 0.58, rateOfFire: 0.9, damage: 2.3, armorPen: 2.5, range: 10, reliability: 0.84, weight: 5.2, damageType: 'kinetic', aoe: null },
    slots: ['optic', 'barrel', 'stock'],
    quirks: [],
    appliesTo: ['riflemen', 'marksmen', 'scouts'],
    blurb: "A long barrel, a light bullet and a ranging table printed on the stock, on the Ascendancy's reasoning that a shot recorded at distance is worth more than a shot that merely kills nearby. Its riflemen find that doctrine easier to admire than to survive.",
  },
  em276_cinder_breaching_rifle_mk1: {
    key: 'em276_cinder_breaching_rifle_mk1', label: "Cinder 276 Breaching Rifle, Mk I",
    maker: 'emberwright_foundries', calibre: 'r13_line', class: 'rifle', tier: 'II:Eng', pts: 0.9,
    base: { accuracy: 0.52, rateOfFire: 0.8, damage: 3.4, armorPen: 3.3, range: 7, reliability: 0.88, weight: 6.2, damageType: 'kinetic', aoe: null },
    slots: ['barrel', 'muzzle', 'bayonet'],
    quirks: [],
    appliesTo: ['riflemen', 'sappers', 'stormtroops'],
    blurb: "Proofed twice, chambered tight and loaded hot, for the men who go through a firing slit rather than past it. It is the heaviest thing the Foundries will admit is still a rifle, and it is at the ceiling of what a rifle is permitted to open.",
  },
  ow311_dustpromise_field_rifle_mk2: {
    key: 'ow311_dustpromise_field_rifle_mk2', label: "Dustpromise 311 Field Rifle, Mk II",
    maker: 'outrider_wheelwrights', calibre: 'r13_line', class: 'rifle', tier: 'I', pts: 1.05,
    base: { accuracy: 0.53, rateOfFire: 1.2, damage: 2.6, armorPen: 2.4, range: 6, reliability: 0.89, weight: 3.4, damageType: 'kinetic', aoe: null },
    slots: ['stock', 'magazine', 'optic'],
    quirks: [],
    appliesTo: ['riflemen', 'scouts', 'autocar_scouts', 'ski_troops'],
    blurb: "The lightest full-calibre rifle anyone on the Ground will sell you, and the Wheelwrights will tell you what it cost: a hand of reach and a barrel that walks when it gets hot. A rifle that is present weighs more, in the end, than one left behind.",
  },
  fs159_ninefold_vigil_rifle_mk1: {
    key: 'fs159_ninefold_vigil_rifle_mk1', label: "Ninefold 159 Vigil Rifle, Mk I",
    maker: 'ferrymen_shrine_armoury', calibre: 'r13_line', class: 'rifle', tier: 'II:Wake', pts: 1.15,
    base: { accuracy: 0.64, rateOfFire: 0.8, damage: 3, armorPen: 2.7, range: 9, reliability: 0.9, weight: 5.8, damageType: 'kinetic', aoe: null },
    slots: ['optic', 'barrel', 'bayonet', 'stock'],
    quirks: [],
    appliesTo: ['riflemen', 'pilgrim_levy', 'marksmen'],
    blurb: "Barrel lapped, trigger stoned, stock cut from cradle timber and inscribed with the fitter's name and the date of the vigil. Nine Cradles holds that a weapon is a promise kept in metal; the front holds that promises are slow.",
  },

  // --- smg -------------------------------------------------------------
  rs236_levy_trench_automatic_mk2: {
    key: 'rs236_levy_trench_automatic_mk2', label: "Levy 236 Trench Automatic, Mk II",
    maker: 'reclamation_state_arsenal', calibre: 'sm10_stub', class: 'smg', tier: 'I', pts: 1.05,
    base: { accuracy: 0.4, rateOfFire: 3.4, damage: 1.4, armorPen: 1, range: 3, reliability: 0.75, weight: 3.8, damageType: 'kinetic', aoe: null },
    slots: ['magazine', 'stock', 'muzzle'],
    quirks: [],
    appliesTo: ['assault', 'stormtroops', 'riflemen'],
    blurb: "Pressed housings, a bolt like a length of bar stock, and a stub cartridge chosen so a levy could be armed for a room rather than a field. Nothing in it is precise and nothing in it is expensive.",
  },
  sy288_knife_room_gun_mk5: {
    key: 'sy288_knife_room_gun_mk5', label: "Knife 288 Room Gun, Mk V",
    maker: 'salvage_court_prize_yard', calibre: 'sm10_stub', class: 'smg', tier: 'I', pts: 0.45,
    base: { accuracy: 0.36, rateOfFire: 3.8, damage: 1.3, armorPen: 0.9, range: 2, reliability: 0.66, weight: 2.6, damageType: 'kinetic', aoe: null },
    slots: ['magazine', 'barrel'],
    quirks: [],
    appliesTo: ['assault', 'provost', 'sappers'],
    blurb: "Fifth mark, fourth original maker, and no two in a crate quite alike. Bailiff-armourers sell it by the armful for boarding work and decline, politely, to discuss the fifth magazine.",
  },
  ow259_skimline_saddle_gun_mk1: {
    key: 'ow259_skimline_saddle_gun_mk1', label: "Skimline 259 Saddle Gun, Mk I",
    maker: 'outrider_wheelwrights', calibre: 'sm10_stub', class: 'smg', tier: 'I', pts: 1,
    base: { accuracy: 0.44, rateOfFire: 2.8, damage: 1.5, armorPen: 1.1, range: 3, reliability: 0.86, weight: 2.2, damageType: 'kinetic', aoe: null },
    slots: ['stock', 'magazine', 'muzzle'],
    quirks: [],
    appliesTo: ['autocar_scouts', 'scouts', 'ski_troops'],
    blurb: "Made to be fired one-handed off a moving running board and stowed under a seat for a week afterwards. The folding stock is the only ounce the Wheelwrights did not argue away, and they argued about it.",
  },

  // --- lmg -------------------------------------------------------------
  hw184_combine_squad_automatic_mk3: {
    key: 'hw184_combine_squad_automatic_mk3', label: "Combine 184 Squad Automatic, Mk III",
    maker: 'hundredweight_works', calibre: 'r13_belt', class: 'lmg', tier: 'I', pts: 2.1,
    base: { accuracy: 0.45, rateOfFire: 2.6, damage: 2.8, armorPen: 2.5, range: 8, reliability: 0.86, weight: 10.4, damageType: 'kinetic', aoe: null },
    slots: ['barrel', 'magazine', 'mount', 'stock'],
    quirks: [],
    appliesTo: ['gunners', 'riflemen', 'pioneers'],
    blurb: "One man carries it, one man carries the belt, and the squad's rifles feed from the same crate — which was the entire argument for the link. Quick-change barrel, coarse threads, and a bipod stiff enough to lever a wagon.",
  },
  rs257_ironworks_belt_gun_mk2: {
    key: 'rs257_ironworks_belt_gun_mk2', label: "Ironworks 257 Belt Gun, Mk II",
    maker: 'reclamation_state_arsenal', calibre: 'r13_belt', class: 'lmg', tier: 'I', pts: 2.3,
    base: { accuracy: 0.4, rateOfFire: 3.2, damage: 2.9, armorPen: 2.5, range: 8, reliability: 0.74, weight: 12.5, damageType: 'kinetic', aoe: null },
    slots: ['magazine', 'barrel', 'mount'],
    quirks: [],
    appliesTo: ['gunners', 'assault', 'stormtroops'],
    blurb: "The Arsenal's answer to a machine-gun is more machine-gun: a cyclic rate no gunner asked for and a barrel that must be changed before the doctrine says it must. It wins a firefight in the first minute or not at all.",
  },
  cl274_knotwork_light_gun_mk1: {
    key: 'cl274_knotwork_light_gun_mk1', label: "Knotwork 274 Light Gun, Mk I",
    maker: 'crossloom_pattern_house', calibre: 'r13_belt', class: 'lmg', tier: 'II:Eng', pts: 2.6,
    base: { accuracy: 0.48, rateOfFire: 2.4, damage: 3, armorPen: 2.7, range: 9, reliability: 0.88, weight: 13.2, damageType: 'kinetic', aoe: null },
    slots: ['mount', 'optic', 'barrel', 'magazine'],
    quirks: [],
    appliesTo: ['gunners', 'provost', 'pilgrim_levy'],
    blurb: "Drawn so that a middling workshop can make the parts and any house can hold the licence, which is why its belts fit guns that fit nothing else. It is heavier than its rivals and outlasts all of them.",
  },

  // --- hmg -------------------------------------------------------------
  cl206_tollgate_sustained_gun_mk2: {
    key: 'cl206_tollgate_sustained_gun_mk2', label: "Tollgate 206 Sustained Gun, Mk II",
    maker: 'crossloom_pattern_house', calibre: 'mg13_sustained', class: 'hmg', tier: 'I', pts: 3.9,
    base: { accuracy: 0.46, rateOfFire: 4, damage: 3.2, armorPen: 3, range: 10, reliability: 0.9, weight: 28, damageType: 'kinetic', aoe: null },
    slots: ['mount', 'barrel', 'magazine', 'optic'],
    quirks: [],
    appliesTo: ['gunners', 'crawler', 'land_dreadnought'],
    blurb: "Water-jacketed, tripod-fed and expected to fire all night without anyone's opinion being sought. The Pattern House licenses the drawings to every house on the Ground, and every house has mounted it on something.",
  },
  em233_anvilgate_heavy_gun_mk1: {
    key: 'em233_anvilgate_heavy_gun_mk1', label: "Anvilgate 233 Heavy Gun, Mk I",
    maker: 'emberwright_foundries', calibre: 'mg13_sustained', class: 'hmg', tier: 'II:Eng', pts: 4,
    base: { accuracy: 0.44, rateOfFire: 3.2, damage: 3.8, armorPen: 3.4, range: 11, reliability: 0.9, weight: 34, damageType: 'kinetic', aoe: null },
    slots: ['mount', 'barrel', 'ammunition'],
    quirks: [],
    appliesTo: ['gunners', 'crawler', 'land_dreadnought'],
    blurb: "A gun cut to bite an autocar's skin rather than the man behind it, at the absolute ceiling of what the Foundries are allowed to call a machine-gun. Two men lift it; a crawler carries it; a line crawler ignores it.",
  },
  rs299_state_pintle_gun_mk4: {
    key: 'rs299_state_pintle_gun_mk4', label: "State 299 Pintle Gun, Mk IV",
    maker: 'reclamation_state_arsenal', calibre: 'mg13_sustained', class: 'hmg', tier: 'I', pts: 3.2,
    base: { accuracy: 0.38, rateOfFire: 5, damage: 3, armorPen: 2.9, range: 9, reliability: 0.72, weight: 24, damageType: 'kinetic', aoe: null },
    slots: ['mount', 'magazine', 'muzzle'],
    quirks: [],
    appliesTo: ['crawler', 'fighter', 'gunners'],
    blurb: "Fitted to hatch rings, wing roots and anything else with a pintle, on the Arsenal's view that a stoppage on a mount is cheaper than a stoppage in a hand. It is loud, wasteful and always where it was needed.",
  },

  // --- shotgun ---------------------------------------------------------
  sy245_bailiff_boarding_gun_mk2: {
    key: 'sy245_bailiff_boarding_gun_mk2', label: "Bailiff 245 Boarding Gun, Mk II",
    maker: 'salvage_court_prize_yard', calibre: 'sg20_bore', class: 'shotgun', tier: 'I', pts: 1.4,
    base: { accuracy: 0.5, rateOfFire: 1.4, damage: 3.8, armorPen: 1, range: 2, reliability: 0.74, weight: 3.4, damageType: 'fragmentation', aoe: null },
    slots: ['barrel', 'ammunition', 'bayonet'],
    quirks: [],
    appliesTo: ['assault', 'provost', 'sappers'],
    blurb: "The bore forgives a barrel nobody has measured, which is why the Yard standardised on it for boarding work. Ruinous against a greatcoat at the length of a gangway, and an insult to plate at any distance whatever.",
  },
  hw218_sledge_trench_sweeper_mk1: {
    key: 'hw218_sledge_trench_sweeper_mk1', label: "Sledge 218 Trench Sweeper, Mk I",
    maker: 'hundredweight_works', calibre: 'sg20_bore', class: 'shotgun', tier: 'I', pts: 1.6,
    base: { accuracy: 0.54, rateOfFire: 1.1, damage: 4.2, armorPen: 1.2, range: 3, reliability: 0.9, weight: 4.6, damageType: 'fragmentation', aoe: null },
    slots: ['barrel', 'bayonet', 'ammunition', 'stock'],
    quirks: [],
    appliesTo: ['riflemen', 'pioneers', 'digger_corps'],
    blurb: "A gallery gun before it was a trench gun: heavy walls, a long bayonet lug and a paper shell of buck the Works has never seen a reason to improve. It clears a firebay in one pull and reloads slowly enough to regret it.",
  },

  // --- marksman --------------------------------------------------------
  fs171_ferryman_watch_rifle_mk2: {
    key: 'fs171_ferryman_watch_rifle_mk2', label: "Ferryman 171 Watch Rifle, Mk II",
    maker: 'ferrymen_shrine_armoury', calibre: 'r13_line', class: 'marksman', tier: 'II:Wake', pts: 1,
    base: { accuracy: 0.78, rateOfFire: 0.6, damage: 3.2, armorPen: 2.8, range: 10, reliability: 0.92, weight: 6, damageType: 'kinetic', aoe: null },
    slots: ['optic', 'barrel', 'stock', 'ammunition'],
    quirks: [],
    appliesTo: ['marksmen', 'scouts', 'riflemen'],
    blurb: "Selected from the vigil rifles by the fitter who made them and kept back for the watch that stands over a crossing. Ground glass, a stoned trigger, and a rate of fire that assumes one shot was the plan.",
  },
  as294_longear_ranging_rifle_mk1: {
    key: 'as294_longear_ranging_rifle_mk1', label: "Longear 294 Ranging Rifle, Mk I",
    maker: 'ascendancy_signal_works', calibre: 'r13_line', class: 'marksman', tier: 'II:Ciph', pts: 0.8,
    base: { accuracy: 0.82, rateOfFire: 0.5, damage: 2.2, armorPen: 2.5, range: 10, reliability: 0.85, weight: 5.6, damageType: 'kinetic', aoe: null },
    slots: ['optic', 'barrel', 'ammunition'],
    quirks: [],
    appliesTo: ['marksmen', 'scouts'],
    blurb: "An instrument that happens to shoot: the sight is the weapon and the barrel is its mounting. Signal Works marksmen are trained to report the fall of shot before they are trained to reload.",
  },
  hw262_bottoms_selected_rifle_mk3: {
    key: 'hw262_bottoms_selected_rifle_mk3', label: "Bottoms 262 Selected Rifle, Mk III",
    maker: 'hundredweight_works', calibre: 'r13_line', class: 'marksman', tier: 'I', pts: 1.45,
    base: { accuracy: 0.68, rateOfFire: 0.9, damage: 2.9, armorPen: 2.6, range: 9, reliability: 0.9, weight: 4.8, damageType: 'kinetic', aoe: null },
    slots: ['optic', 'stock', 'bayonet'],
    quirks: [],
    appliesTo: ['marksmen', 'riflemen', 'provost'],
    blurb: "Not designed: chosen. Every hundredth levy rifle off the line shoots better than the ninety-nine around it, and the Works has built a whole doctrine out of putting a sight on that one and saying nothing further.",
  },

  // --- anti_armor ------------------------------------------------------
  em214_winter_anti_crawler_rifle_mk2: {
    key: 'em214_winter_anti_crawler_rifle_mk2', label: "Winter 214 Anti-Crawler Rifle, Mk II",
    maker: 'emberwright_foundries', calibre: 'hr17_heavy', class: 'anti_armor', tier: 'II:Eng', pts: 2.3,
    base: { accuracy: 0.5, rateOfFire: 0.6, damage: 5.5, armorPen: 8, range: 6, reliability: 0.85, weight: 18, damageType: 'kinetic', aoe: null },
    slots: ['barrel', 'optic', 'ammunition', 'mount'],
    quirks: [],
    appliesTo: ['gunners', 'sappers', 'riflemen'],
    blurb: "The Foundries' answer to the first crawler that walked through a rifle company: a long tapered case, a hardened core, and a recoil the Union has never pretended to have solved. It is issued by the round and answered for by the round.",
  },
  cl281_openhand_shaped_lance_mk1: {
    key: 'cl281_openhand_shaped_lance_mk1', label: "Openhand 281 Shaped Lance, Mk I",
    maker: 'crossloom_pattern_house', calibre: 'hr17_heavy', class: 'anti_armor', tier: 'II:Eng', pts: 2.4,
    base: { accuracy: 0.46, rateOfFire: 0.4, damage: 7.5, armorPen: 9, range: 4, reliability: 0.8, weight: 12, damageType: 'shaped', aoe: null },
    slots: ['optic', 'ammunition', 'mount'],
    quirks: [],
    appliesTo: ['sappers', 'pioneers', 'assault', 'stormtroops'],
    blurb: "A tube, a lined cone and a drawing anyone may hold: the Pattern House published it rather than sell it, and every house on the Ground has since made its own. The jet needs plate to bite, and finds men a waste of a charge.",
  },
  hw302_sledge_shoulder_gun_mk1: {
    key: 'hw302_sledge_shoulder_gun_mk1', label: "Sledge 302 Shoulder Gun, Mk I",
    maker: 'hundredweight_works', calibre: 'hr17_heavy', class: 'anti_armor', tier: 'I', pts: 1.7,
    base: { accuracy: 0.42, rateOfFire: 0.5, damage: 6.4, armorPen: 7, range: 3, reliability: 0.86, weight: 9.5, damageType: 'shaped', aoe: { radius: 1, falloff: 0.6 } },
    slots: ['ammunition', 'stock'],
    quirks: [],
    appliesTo: ['riflemen', 'assault', 'pioneers', 'ski_troops'],
    blurb: "The cheap answer, and the Works is not ashamed of it: a stamped tube, a coarse sight and a charge that must be walked to within a stone's throw of the hull. Everything about it assumes the man carrying it would rather be elsewhere.",
  },

  // --- flame -----------------------------------------------------------
  tp226_seamfire_trench_projector_mk2: {
    key: 'tp226_seamfire_trench_projector_mk2', label: "Seamfire 226 Trench Projector, Mk II",
    maker: 'tarpool_burnworks', calibre: 'fg2_fuel', class: 'flame', tier: 'I', pts: 2,
    base: { accuracy: 0.6, rateOfFire: 1.2, damage: 4.4, armorPen: 1, range: 2, reliability: 0.7, weight: 22, damageType: 'incendiary', aoe: { radius: 1, falloff: 0.5 } },
    slots: ['barrel', 'ammunition', 'mount'],
    quirks: [],
    appliesTo: ['flame_team', 'pioneers', 'sappers'],
    blurb: "Thickened seam tar thrown from a pressure vessel nobody enjoys carrying, over a parapet and through a firing slit. It drives a garrison off its loopholes and has never once opened a hull.",
  },
  tp305_slagline_hull_projector_mk1: {
    key: 'tp305_slagline_hull_projector_mk1', label: "Slagline 305 Hull Projector, Mk I",
    maker: 'tarpool_burnworks', calibre: 'fg2_fuel', class: 'flame', tier: 'II:Eng', pts: 3,
    base: { accuracy: 0.62, rateOfFire: 1.6, damage: 5.2, armorPen: 1.2, range: 3, reliability: 0.68, weight: 30, damageType: 'incendiary', aoe: { radius: 2, falloff: 0.4 } },
    slots: ['mount', 'ammunition', 'barrel'],
    quirks: [],
    appliesTo: ['crawler', 'flame_team', 'land_dreadnought'],
    blurb: "The projector a crawler carries instead of a man: a bow mounting, a hull tank and a reach that finally justifies the pressure. Quartermasters cost it as ammunition and insurers decline it entirely.",
  },
  hw249_bottoms_gallery_burner_mk1: {
    key: 'hw249_bottoms_gallery_burner_mk1', label: "Bottoms 249 Gallery Burner, Mk I",
    maker: 'hundredweight_works', calibre: 'fg2_fuel', class: 'flame', tier: 'I', pts: 1.1,
    base: { accuracy: 0.58, rateOfFire: 1, damage: 3.6, armorPen: 0.9, range: 2, reliability: 0.84, weight: 19, damageType: 'incendiary', aoe: { radius: 1, falloff: 0.6 } },
    slots: ['ammunition', 'stock', 'barrel'],
    quirks: [],
    appliesTo: ['digger_corps', 'pioneers', 'flame_team'],
    blurb: "A mining tool the Works never bothered to redraw for the front: lower pressure, thinner fuel, and valves a gallery crew can strip by lamplight. It burns a working face clear, and a trench is only a working face on its side.",
  },

  // --- mortar ----------------------------------------------------------
  cl221_crossloom_light_mortar_mk2: {
    key: 'cl221_crossloom_light_mortar_mk2', label: "Crossloom 221 Light Mortar, Mk II",
    maker: 'crossloom_pattern_house', calibre: 'm50_bore', class: 'mortar', tier: 'I', pts: 2.8,
    base: { accuracy: 0.5, rateOfFire: 1.4, damage: 4.5, armorPen: 2, range: 9, reliability: 0.9, weight: 19, damageType: 'fragmentation', aoe: { radius: 2, falloff: 0.35 } },
    slots: ['mount', 'ammunition', 'optic'],
    quirks: [],
    appliesTo: ['mortars', 'riflemen', 'pioneers'],
    blurb: "Baseplate, tube and a bag of finned bombs one man can carry six of — the licence is free and the drawings are posted at the Meet-ground. It answers a machine-gun without waiting on a battery, which is the whole of its argument.",
  },
  rs263_verdict_commune_mortar_mk3: {
    key: 'rs263_verdict_commune_mortar_mk3', label: "Verdict 263 Commune Mortar, Mk III",
    maker: 'reclamation_state_arsenal', calibre: 'm50_bore', class: 'mortar', tier: 'I', pts: 2.6,
    base: { accuracy: 0.42, rateOfFire: 2, damage: 4.2, armorPen: 1.8, range: 8, reliability: 0.76, weight: 16, damageType: 'fragmentation', aoe: { radius: 2, falloff: 0.4 } },
    slots: ['mount', 'ammunition', 'magazine'],
    quirks: [],
    appliesTo: ['mortars', 'assault', 'pilgrim_levy'],
    blurb: "Thin-walled, generous with case, and dropped down the tube faster than the crew can be told to stop. The Arsenal prints the safe rate on the baseplate and has never expected it to be observed.",
  },
  rs278_state_concussion_mortar_mk2: {
    key: 'rs278_state_concussion_mortar_mk2', label: "State 278 Concussion Mortar, Mk II",
    maker: 'reclamation_state_arsenal', calibre: 'm50_bore', class: 'mortar', tier: 'I', pts: 2.4,
    base: { accuracy: 0.4, rateOfFire: 2.2, damage: 6, armorPen: 2.4, range: 9, reliability: 0.76, weight: 21, damageType: 'concussive', aoe: { radius: 2, falloff: 0.3 } },
    slots: ['mount', 'ammunition', 'muzzle'],
    quirks: [],
    appliesTo: ['mortars', 'assault', 'stormtroops'],
    blurb: "A blast bomb with almost no case: it kills badly and pins beautifully, which is exactly what the Arsenal bought it for. Ordnance boards price it as suppression and score it as nothing at all.",
  },
  em239_forgeworks_battalion_mortar_mk1: {
    key: 'em239_forgeworks_battalion_mortar_mk1', label: "Forgeworks 239 Battalion Mortar, Mk I",
    maker: 'emberwright_foundries', calibre: 'm81_bore', class: 'mortar', tier: 'II:Eng', pts: 3.6,
    base: { accuracy: 0.48, rateOfFire: 0.9, damage: 7.8, armorPen: 3.2, range: 13, reliability: 0.88, weight: 58, damageType: 'fragmentation', aoe: { radius: 3, falloff: 0.3 } },
    slots: ['mount', 'optic', 'ammunition'],
    quirks: [],
    appliesTo: ['mortars', 'siege_mortar', 'artillery'],
    blurb: "The battalion bore, cut thick and proofed twice because the Foundries do not believe in thin tubes. It reaches over any ridge on the field and arrives with enough case to settle what is behind it.",
  },
  tp313_firetongue_incendiary_mortar_mk1: {
    key: 'tp313_firetongue_incendiary_mortar_mk1', label: "Firetongue 313 Incendiary Mortar, Mk I",
    maker: 'tarpool_burnworks', calibre: 'm50_bore', class: 'mortar', tier: 'II:Cache', pts: 2.4,
    base: { accuracy: 0.44, rateOfFire: 1.2, damage: 5.6, armorPen: 2.2, range: 8, reliability: 0.72, weight: 20, damageType: 'incendiary', aoe: { radius: 2, falloff: 0.35 } },
    slots: ['mount', 'ammunition', 'optic'],
    quirks: [],
    appliesTo: ['mortars', 'flame_team', 'pilgrim_levy'],
    blurb: "The Burnworks' filling in somebody else's bomb, which is how Tarpool prefers to sell anything. It puts fire on a position the projector teams cannot walk to, and it will not be quenched by anyone still in it.",
  },
  tp317_tarpool_fume_mortar_mk1: {
    key: 'tp317_tarpool_fume_mortar_mk1', label: "Tarpool 317 Fume Mortar, Mk I",
    maker: 'tarpool_burnworks', calibre: 'm81_bore', class: 'mortar', tier: 'II:Cache', pts: 2.5,
    base: { accuracy: 0.45, rateOfFire: 0.7, damage: 7, armorPen: 4.2, range: 12, reliability: 0.74, weight: 62, damageType: 'chemical', aoe: { radius: 3, falloff: 0.15 } },
    slots: ['mount', 'ammunition', 'optic'],
    quirks: [],
    appliesTo: ['mortars', 'siege_mortar', 'pioneers'],
    blurb: "The Burnworks sells the filling to every house at once and calls that a moral position. It empties a trench line and a poured work of everyone who must go on breathing, and it does not scratch a sealed hull.",
  },

  // --- crawler_gun -----------------------------------------------------
  em247_emberwright_hull_gun_mk2: {
    key: 'em247_emberwright_hull_gun_mk2', label: "Emberwright 247 Hull Gun, Mk II",
    maker: 'emberwright_foundries', calibre: 'cg37_bore', class: 'crawler_gun', tier: 'II:Eng', pts: 4.9,
    base: { accuracy: 0.55, rateOfFire: 1, damage: 6.5, armorPen: 9, range: 10, reliability: 0.88, weight: 98, damageType: 'kinetic', aoe: null },
    slots: ['mount', 'optic', 'barrel', 'ammunition'],
    quirks: [],
    appliesTo: ['crawler', 'land_dreadnought'],
    blurb: "The first bore the Foundries cut specifically to open a hull rather than a formation, and the gun most line crawlers still carry. Fast, flat, and increasingly embarrassed by what it meets on a modern glacis.",
  },
  sy277_prizeyard_turret_gun_mk3: {
    key: 'sy277_prizeyard_turret_gun_mk3', label: "Prizeyard 277 Turret Gun, Mk III",
    maker: 'salvage_court_prize_yard', calibre: 'cg37_bore', class: 'crawler_gun', tier: 'II:Cache', pts: 4.5,
    base: { accuracy: 0.46, rateOfFire: 1.8, damage: 5.6, armorPen: 7, range: 9, reliability: 0.7, weight: 86, damageType: 'kinetic', aoe: null },
    slots: ['mount', 'magazine', 'ammunition'],
    quirks: [],
    appliesTo: ['crawler', 'autocar_scouts'],
    blurb: "Re-bored from three condemned tubes and married to a turret ring it was never drawn for, which the Court records as an improvement. It opens a line crawler twice as fast as the original and is spent entirely on a land-fort's belt.",
  },
  em291_forgeworks_breakthrough_gun_mk1: {
    key: 'em291_forgeworks_breakthrough_gun_mk1', label: "Forgeworks 291 Breakthrough Gun, Mk I",
    maker: 'emberwright_foundries', calibre: 'cg57_bore', class: 'crawler_gun', tier: 'III', pts: 8.5,
    base: { accuracy: 0.54, rateOfFire: 0.7, damage: 10, armorPen: 13, range: 12, reliability: 0.9, weight: 165, damageType: 'kinetic', aoe: null },
    slots: ['mount', 'optic', 'barrel', 'ammunition'],
    quirks: [],
    appliesTo: ['crawler', 'land_dreadnought'],
    blurb: "The Foundries' reply to their own success: the same doctrine at a bore that still means it against face-hardened plate. It costs a larger ring, a longer loader, and a crawler built around the gun rather than the other way about.",
  },
  cl318_tollgate_casemate_gun_mk1: {
    key: 'cl318_tollgate_casemate_gun_mk1', label: "Tollgate 318 Casemate Gun, Mk I",
    maker: 'crossloom_pattern_house', calibre: 'cg57_bore', class: 'crawler_gun', tier: 'II:Eng', pts: 8.8,
    base: { accuracy: 0.5, rateOfFire: 0.6, damage: 9, armorPen: 12, range: 11, reliability: 0.9, weight: 190, damageType: 'shaped', aoe: null },
    slots: ['mount', 'optic', 'ammunition'],
    quirks: [],
    appliesTo: ['crawler', 'land_dreadnought'],
    blurb: "A lined shell in a short casemate tube, drawn for keels that must answer a belt without carrying a breakthrough gun's ring. The jet wants plate and wastes itself on anything softer, which the Pattern House prints on the crate.",
  },

  // --- artillery -------------------------------------------------------
  cl235_crossloom_field_piece_mk2: {
    key: 'cl235_crossloom_field_piece_mk2', label: "Crossloom 235 Field Piece, Mk II",
    maker: 'crossloom_pattern_house', calibre: 'a105_shell', class: 'artillery', tier: 'I', pts: 11,
    base: { accuracy: 0.5, rateOfFire: 0.8, damage: 14, armorPen: 7, range: 16, reliability: 0.9, weight: 295, damageType: 'explosive', aoe: { radius: 3, falloff: 0.25 } },
    slots: ['mount', 'optic', 'ammunition', 'barrel'],
    quirks: [],
    appliesTo: ['artillery', 'siege_mortar'],
    blurb: "The divisional piece, on the reasoning that a single shell weight is a single contract. It decides more field engagements than anything else on the Ground, and is almost never seen by the people it decides them against.",
  },
  as256_beacon_ranging_gun_mk1: {
    key: 'as256_beacon_ranging_gun_mk1', label: "Beacon 256 Ranging Gun, Mk I",
    maker: 'ascendancy_signal_works', calibre: 'a105_shell', class: 'artillery', tier: 'II:Ciph', pts: 9.5,
    base: { accuracy: 0.56, rateOfFire: 0.7, damage: 11.5, armorPen: 6.5, range: 22, reliability: 0.88, weight: 280, damageType: 'explosive', aoe: { radius: 3, falloff: 0.3 } },
    slots: ['mount', 'optic', 'ammunition'],
    quirks: [],
    appliesTo: ['artillery', 'siege_mortar'],
    blurb: "A lighter shell pushed further than a sensible board would push it, laid by transmitted correction rather than by eye. The Ascendancy would rather register a target for the whole column than break one itself.",
  },
  em284_anvilgate_siege_howitzer_mk2: {
    key: 'em284_anvilgate_siege_howitzer_mk2', label: "Anvilgate 284 Siege Howitzer, Mk II",
    maker: 'emberwright_foundries', calibre: 'a150_shell', class: 'artillery', tier: 'II:Eng', pts: 13,
    base: { accuracy: 0.46, rateOfFire: 0.6, damage: 22, armorPen: 10, range: 20, reliability: 0.9, weight: 540, damageType: 'explosive', aoe: { radius: 4, falloff: 0.2 } },
    slots: ['mount', 'optic', 'ammunition', 'barrel'],
    quirks: [],
    appliesTo: ['artillery', 'siege_mortar', 'land_dreadnought'],
    blurb: "The works-breaker: two men and a cradle to load, a delay fuse, and a ceiling to answer for. Everything the Foundries believe about steel is in the breech, and the breech is why nobody has improved on it.",
  },
  fs198_reliquary_keel_gun_mk1: {
    key: 'fs198_reliquary_keel_gun_mk1', label: "Reliquary 198 Keel Gun, Mk I",
    maker: 'ferrymen_shrine_armoury', calibre: 'a150_shell', class: 'artillery', tier: 'III', pts: 15,
    base: { accuracy: 0.55, rateOfFire: 0.45, damage: 24, armorPen: 14, range: 22, reliability: 0.93, weight: 620, damageType: 'kinetic', aoe: { radius: 4, falloff: 0.2 } },
    slots: ['mount', 'optic', 'ammunition', 'barrel'],
    quirks: [],
    appliesTo: ['land_dreadnought', 'artillery', 'siege_mortar'],
    blurb: "A land-fort's main armament, laid on its keel rather than on a carriage and blessed once a season whether or not it has fired. Solid shot, a full charge, and the only gun in the catalogue that meets a belt on equal terms.",
  },

  // --- aircraft_gun ----------------------------------------------------
  as272_antenna_wing_cannon_mk2: {
    key: 'as272_antenna_wing_cannon_mk2', label: "Antenna 272 Wing Cannon, Mk II",
    maker: 'ascendancy_signal_works', calibre: 'ac20_aircraft', class: 'aircraft_gun', tier: 'II:Ciph', pts: 13,
    base: { accuracy: 0.5, rateOfFire: 3.6, damage: 6.5, armorPen: 6, range: 7, reliability: 0.85, weight: 46, damageType: 'kinetic', aoe: null },
    slots: ['mount', 'magazine', 'ammunition'],
    quirks: [],
    appliesTo: ['fighter'],
    blurb: "Wing-rooted, harmonised on the bench and impossible to reload in flight, so every gram of it was argued over twice. It arrives in a two-second burst, opens an autocar, scratches a line crawler, and is spent entirely on a land-fort's belt.",
  },
  sy296_adjudicated_nose_battery_mk1: {
    key: 'sy296_adjudicated_nose_battery_mk1', label: "Adjudicated 296 Nose Battery, Mk I",
    maker: 'salvage_court_prize_yard', calibre: 'ac20_aircraft', class: 'aircraft_gun', tier: 'II:Cache', pts: 6.5,
    base: { accuracy: 0.42, rateOfFire: 5, damage: 5.5, armorPen: 5, range: 5, reliability: 0.7, weight: 40, damageType: 'explosive', aoe: { radius: 1, falloff: 0.6 } },
    slots: ['mount', 'magazine', 'muzzle'],
    quirks: [],
    appliesTo: ['fighter'],
    blurb: "Four condemned tubes adjudicated into one nose mounting and sold with a writ instead of a proof mark. It throws everything it has in the first pass, and the Yard's own pilots decline the fourth gun.",
  },
};
