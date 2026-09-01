// Mirrors base44/shared/tactical.ts — for the deployment-phase preview and the
// arena UI. The server remains the authority; nothing here decides an outcome.

export const TROOPS = {
  riflemen:  { key: 'riflemen',  label: 'Rifle Company',    short: 'Rifles',   speed: 3, attack: 1, defense: 2, reach: 1, from: 'riflemen', blurb: 'The spine of every column — cheap, stubborn, everywhere.' },
  gunners:   { key: 'gunners',   label: 'Machine-Gun Crew', short: 'Gunners',  speed: 2, attack: 2, defense: 2, reach: 2, from: 'riflemen', blurb: 'Rifle companies retrained to the heavy guns. Slow, but they reach.' },
  scouts:    { key: 'scouts',    label: 'Scout Section',    short: 'Scouts',   speed: 5, attack: 1, defense: 1, reach: 1, from: 'riflemen', blurb: 'Runners and range-takers. Fast, fragile, and they see first.' },
  crawler:   { key: 'crawler',   label: 'Diesel Crawler',   short: 'Crawlers', speed: 2, attack: 3, defense: 3, reach: 1, from: 'crawler', blurb: 'Armor on treads. It breaks lines and drags the pace down.' },
  artillery: { key: 'artillery', label: 'Siege Artillery',  short: 'Guns',     speed: 1, attack: 4, defense: 1, reach: 4, from: 'artillery', blurb: 'Reaches across the field. Helpless if the field comes to it.' },
  fighter:   { key: 'fighter',   label: 'Prop Fighter',     short: 'Fighters', speed: 6, attack: 3, defense: 1, reach: 3, from: 'fighter', blurb: 'Fast, far-reaching, and paper-thin under fire.' },
};
export const TROOP_KEYS = Object.keys(TROOPS);
export const COLUMN_KEYS = ['riflemen', 'crawler', 'artillery', 'fighter'];

export const ACTIONS = {
  volley:           { key: 'volley',           label: 'Volley',           dmg: 1.0, desc: 'A measured exchange of fire.' },
  hold:             { key: 'hold',             label: 'Hold Ground',      dmg: 0,   guard: 1.45, self: true, desc: 'Blunt incoming fire until your next order.' },
  suppressing_fire: { key: 'suppressing_fire', label: 'Suppressing Fire', dmg: 0.8, suppress: 1, requires: { riflemen: 1, gunners: 1 }, desc: 'Pin the target — it fights at reduced effect next turn.' },
  creeping_barrage: { key: 'creeping_barrage', label: 'Creeping Barrage', dmg: 1.55, noMove: true, requires: { artillery: 1, riflemen: 1 }, desc: 'Devastating. The formation cannot displace this turn.' },
  combined_assault: { key: 'combined_assault', label: 'Combined Assault', dmg: 1.6, recoil: 0.18, reach: 1, requires: { crawler: 1, riflemen: 1 }, desc: 'Brutal at contact range — and costly.' },
  recon_in_force:   { key: 'recon_in_force',   label: 'Recon-in-Force',   dmg: 0.55, mark: 2, requires: { scouts: 1, crawler: 1 }, desc: 'Mark the target — every formation strikes it harder.' },
  strafing_run:     { key: 'strafing_run',     label: 'Strafing Run',     dmg: 1.3, pierce: 0.4, requires: { fighter: 1 }, desc: 'Cuts through cover and dug-in positions.' },
  entrench:         { key: 'entrench',         label: 'Entrench',         dmg: 0,   guard: 1.9, self: true, requires: { riflemen: 3 }, desc: 'Turn ground into works. Very hard to shift.' },
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

export function poolCost(troops = {}) {
  const cost = {};
  for (const k of TROOP_KEYS) {
    const n = troops[k] || 0;
    if (n > 0) cost[TROOPS[k].from] = (cost[TROOPS[k].from] || 0) + n;
  }
  return cost;
}

export const dominantTroop = (troops = {}) =>
  TROOP_KEYS.reduce((best, k) => ((troops[k] || 0) > (troops[best] || 0) ? k : best), 'riflemen');

// Axial → pixel, pointy-top hexes
export const hexPixel = (q, r, size) => ({ x: size * Math.sqrt(3) * (q + r / 2), y: size * 1.5 * r });
export const hexCorners = (size) =>
  [0, 1, 2, 3, 4, 5].map((i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(size * Math.cos(a)).toFixed(2)},${(size * Math.sin(a)).toFixed(2)}`;
  }).join(' ');