// ---------------------------------------------------------------------------
// Order of battle — the counter model.
//
// A stand on the board is a COUNTER, not a figure: a stamped plate carrying its
// own numbers, the way a hex wargame does it. Everything the counter prints
// lives here, so the board, the unit panels and the event log all read one
// source.
//
// `atk`/`def` are display values for the preview's exchange estimate only. Real
// resolution is server-side in base44/shared/tacticalEngine.ts and will replace
// estimateExchange when the arena is wired to it.
// ---------------------------------------------------------------------------

export const UNIT_TYPES = {
  riflemen:         { label: "Riflemen",         token: "unit_riflemen_token",         arm: "inf",   atk: 5,  def: 5,  maxStr: 40 },
  stormtroops:      { label: "Stormtroops",      token: "unit_stormtroops_token",      arm: "inf",   atk: 8,  def: 6,  maxStr: 35 },
  sappers:          { label: "Sappers",          token: "unit_sappers_token",          arm: "inf",   atk: 6,  def: 5,  maxStr: 30 },
  marksmen:         { label: "Marksmen",         token: "unit_marksmen_token",         arm: "inf",   atk: 7,  def: 3,  maxStr: 20 },
  flame_team:       { label: "Flame Team",       token: "unit_flame_team_token",       arm: "inf",   atk: 9,  def: 3,  maxStr: 18 },
  pilgrim_levy:     { label: "Pilgrim Levy",     token: "unit_pilgrim_levy_token",     arm: "inf",   atk: 4,  def: 3,  maxStr: 50 },
  digger_corps:     { label: "Digger Corps",     token: "unit_digger_corps_token",     arm: "inf",   atk: 4,  def: 5,  maxStr: 30 },
  provost:          { label: "Provost Section",  token: "unit_provost_token",          arm: "inf",   atk: 4,  def: 6,  maxStr: 25 },
  crawler:          { label: "Line Crawler",     token: "unit_crawler_token",          arm: "armor", atk: 9,  def: 10, maxStr: 12 },
  land_dreadnought: { label: "Land Dreadnought", token: "unit_land_dreadnought_token", arm: "armor", atk: 14, def: 16, maxStr: 6 },
  autocar_scouts:   { label: "Autocar Scouts",   token: "unit_autocar_scouts_token",   arm: "recon", atk: 4,  def: 4,  maxStr: 10 },
  artillery:        { label: "Field Battery",    token: "unit_artillery_token",         arm: "gun",   atk: 11, def: 2,  maxStr: 8 },
  siege_mortar:     { label: "Siege Mortar",     token: "unit_siege_mortar_token",     arm: "gun",   atk: 13, def: 2,  maxStr: 6 },
};

// Motorized arms carry fuel; foot and towed do not — the counter prints a dash.
export const CARRIES_FUEL = ["armor", "recon"];

export const ARM_LABEL = { inf: "Foot", armor: "Mechanized", recon: "Reconnaissance", gun: "Ordnance" };

const S = (id, side, type, name, q, r, str, ammo, fuel, entrench, vet, moved = false) =>
  ({ id, side, type, name, q, r, str, ammo, fuel, entrench, vet, moved });

// A live engagement, mid-turn: the attacker has closed on the defender's works
// west of the objective and one assault company is in contact on three sides.
export const SAMPLE_ORBAT = [
  S("a1", "attacker", "riflemen", "141st Levy Rifles", 2, 2, 34, 6, null, 1, 1),
  S("a2", "attacker", "riflemen", "97th Levy Rifles", 3, 4, 40, 8, null, 0, 0),
  S("a3", "attacker", "crawler", "2nd Crawler Squadron", 5, 3, 10, 5, 34, 0, 2),
  S("a4", "attacker", "stormtroops", "1st Storm Company", 7, 5, 28, 4, null, 0, 3),
  S("a5", "attacker", "sappers", "12th Sapper Company", 6, 7, 24, 7, null, 1, 2),
  S("a6", "attacker", "artillery", "3rd Field Battery", 2, 6, 8, 9, null, 2, 1),
  S("a7", "attacker", "autocar_scouts", "Outrider Troop", 4, 8, 8, 6, 51, null, 1, true),
  S("a8", "attacker", "marksmen", "Selected Marksmen", 3, 6, 17, 10, null, 1, 2),
  S("a9", "attacker", "siege_mortar", "Siege Mortar 'Anvilgate'", 1, 5, 6, 3, null, 3, 1),
  S("d1", "defender", "riflemen", "25th Line Rifles", 8, 5, 22, 5, null, 2, 1),
  S("d2", "defender", "riflemen", "76th Line Rifles", 8, 4, 15, 2, null, 3, 0),
  S("d3", "defender", "provost", "Provost Detachment", 7, 6, 19, 6, null, 2, 2),
  S("d4", "defender", "crawler", "9th Crawler Squadron", 10, 3, 8, 4, 22, 0, 2),
  S("d5", "defender", "land_dreadnought", "'Lockjaw'", 12, 6, 6, 6, 40, 0, 3),
  S("d6", "defender", "artillery", "88th Heavy Battery", 13, 4, 7, 8, null, 2, 1),
  S("d7", "defender", "marksmen", "Watch Marksmen", 11, 8, 12, 9, null, 1, 2),
  S("d8", "defender", "pilgrim_levy", "Pilgrim Levy", 10, 7, 44, 3, null, 1, 0),
];

// The dispatch feed — what the signals section has logged this turn.
export const SAMPLE_LOG = [
  { id: 1, tone: "loss", text: "76th Line Rifles reduced — 15 of 40 effective" },
  { id: 2, tone: "kill", text: "97th Levy Rifles destroyed 12th Provost Section" },
  { id: 3, tone: "info", text: "1st Storm Company in contact on three faces" },
  { id: 4, tone: "loss", text: "25th Line Rifles at low strength" },
  { id: 5, tone: "kill", text: "3rd Field Battery silenced 88th Heavy Battery" },
  { id: 6, tone: "info", text: "Outrider Troop has expended its movement" },
  { id: 7, tone: "warn", text: "9th Crawler Squadron fuel below one march" },
  { id: 8, tone: "kill", text: "12th Sapper Company breached the wire" },
  { id: 9, tone: "info", text: "Weather holding clear — sight unlimited" },
];

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/**
 * Display-only exchange estimate for the attack preview chips. Returns the
 * losses each side would take. The engine owns the real roll; this exists so
 * the HUD can show a forecast before the arena is wired.
 */
export function estimateExchange(att, def, cover = 0) {
  const A = UNIT_TYPES[att.type];
  const D = UNIT_TYPES[def.type];
  const supplied = att.ammo > 0 ? 1 : 0.25;
  const shield = 1 + cover * 0.3 + (def.entrench || 0) * 0.25;
  const dealt = clamp(Math.round(((A.atk * att.str * supplied) / (D.def * 1.6)) / shield), 1, def.str);
  const back = clamp(Math.round((D.atk * def.str) / (A.def * 3.2)), 0, att.str);
  return { dealt, back };
}

export const neighborsOf = (q, r) => [
  { q: q + 1, r }, { q: q + 1, r: r - 1 }, { q, r: r - 1 },
  { q: q - 1, r }, { q: q - 1, r: r + 1 }, { q, r: r + 1 },
];