// ---------------------------------------------------------------------------
// Tactical formation battles — canonical rules & derivations.
// Imported by base44/functions/gameEngine (server authority). The client keeps
// a preview-only mirror at src/lib/tactical/data.js for the design phase.
// ---------------------------------------------------------------------------

// speed: march pace (lowest in a formation sets the whole formation's pace)
// reach: how far it can put fire (highest in a formation sets engagement range)
export const TROOPS = {
  riflemen:  { key: 'riflemen',  label: 'Rifle Company',    speed: 3, attack: 1, defense: 2, reach: 1, from: 'riflemen' },
  gunners:   { key: 'gunners',   label: 'Machine-Gun Crew', speed: 2, attack: 2, defense: 2, reach: 2, from: 'riflemen' },
  scouts:    { key: 'scouts',    label: 'Scout Section',    speed: 5, attack: 1, defense: 1, reach: 1, from: 'riflemen' },
  crawler:   { key: 'crawler',   label: 'Diesel Crawler',   speed: 2, attack: 3, defense: 3, reach: 1, from: 'crawler' },
  artillery: { key: 'artillery', label: 'Siege Artillery',  speed: 1, attack: 4, defense: 1, reach: 4, from: 'artillery' },
  fighter:   { key: 'fighter',   label: 'Prop Fighter',     speed: 6, attack: 3, defense: 1, reach: 3, from: 'fighter' },
};
export const TROOP_KEYS = Object.keys(TROOPS);
export const CASUALTY_ORDER = ['scouts', 'riflemen', 'gunners', 'crawler', 'artillery', 'fighter'];
export const COLUMN_KEYS = ['riflemen', 'crawler', 'artillery', 'fighter'];

// requires: minimum company counts by troop type for the order to be issued
export const ACTIONS = {
  volley:            { key: 'volley',            label: 'Volley',            dmg: 1.0 },
  hold:              { key: 'hold',              label: 'Hold Ground',       dmg: 0,   guard: 1.45, self: true },
  suppressing_fire:  { key: 'suppressing_fire',  label: 'Suppressing Fire',  dmg: 0.8, suppress: 1, requires: { riflemen: 1, gunners: 1 } },
  creeping_barrage:  { key: 'creeping_barrage',  label: 'Creeping Barrage',  dmg: 1.55, noMove: true, requires: { artillery: 1, riflemen: 1 } },
  combined_assault:  { key: 'combined_assault',  label: 'Combined Assault',  dmg: 1.6, recoil: 0.18, reach: 1, requires: { crawler: 1, riflemen: 1 } },
  recon_in_force:    { key: 'recon_in_force',    label: 'Recon-in-Force',    dmg: 0.55, mark: 2, requires: { scouts: 1, crawler: 1 } },
  strafing_run:      { key: 'strafing_run',      label: 'Strafing Run',      dmg: 1.3, pierce: 0.4, requires: { fighter: 1 } },
  entrench:          { key: 'entrench',          label: 'Entrench',          dmg: 0,   guard: 1.9, self: true, requires: { riflemen: 3 } },
};

export const SIZE = { dmgPerCompany: 0.05, dmgCap: 1.55, defPerCompany: 0.04, defCap: 1.45, paceDrag: 5, commandLimit: 8 };

export const hexDistance = (a, b) => {
  const dq = a.q - b.q, dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
};

export const formationSize = (troops = {}) => TROOP_KEYS.reduce((s, k) => s + (troops[k] || 0), 0);

export function deriveFormation(troops = {}) {
  const keys = TROOP_KEYS.filter((k) => (troops[k] || 0) > 0);
  const size = formationSize(troops);
  if (size === 0) return { size: 0, pace: 0, move: 0, reach: 0, attack: 0, defense: 0, dmgMult: 1, defMult: 1, initiative: 0, actions: [], strained: false };
  const basePace = Math.min(...keys.map((k) => TROOPS[k].speed));
  const drag = Math.floor(size / SIZE.paceDrag);
  const pace = Math.max(1, basePace - drag);
  const reach = Math.max(...keys.map((k) => TROOPS[k].reach));
  const attack = keys.reduce((s, k) => s + TROOPS[k].attack * troops[k], 0);
  const defense = keys.reduce((s, k) => s + TROOPS[k].defense * troops[k], 0);
  return {
    size, pace, move: Math.max(1, Math.round(pace * 0.8)), reach, attack, defense,
    dmgMult: Math.min(1 + (size - 1) * SIZE.dmgPerCompany, SIZE.dmgCap),
    defMult: Math.min(1 + (size - 1) * SIZE.defPerCompany, SIZE.defCap),
    initiative: pace * 10 + (troops.scouts || 0) * 3 - drag,
    actions: Object.values(ACTIONS)
      .filter((a) => !a.requires || Object.entries(a.requires).every(([k, n]) => (troops[k] || 0) >= n))
      .map((a) => a.key),
    strained: size > SIZE.commandLimit,
  };
}

// A slotted troop draws from its source regiment (gunners & scouts are retrained rifle companies)
export function poolCost(troops = {}) {
  const cost = {};
  for (const k of TROOP_KEYS) {
    const n = troops[k] || 0;
    if (n > 0) cost[TROOPS[k].from] = (cost[TROOPS[k].from] || 0) + n;
  }
  return cost;
}

// Survivors fold back into column regiments
export function toRegiments(formations = []) {
  const out = Object.fromEntries(COLUMN_KEYS.map((k) => [k, 0]));
  for (const f of formations) for (const k of TROOP_KEYS) out[TROOPS[k].from] += f.troops[k] || 0;
  return out;
}