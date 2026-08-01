// Occupation crises (mirrored for display in src/lib/settlementCrisis.js).
// Held settlements throw up trouble: shortages, strikes, uprisings. The
// commander answers, and the answer moves faction STABILITY — the Ministry's
// measure of how firmly the protectorate holds together. Low stability and
// settlements start slipping out of your hands entirely.

export const STABILITY_START = 70;
export const STABILITY_REVOLT_BELOW = 35;   // below this, held ground may revolt at dawn
export const CRISIS_FESTER_STABILITY = 3;   // stability lost per day a crisis sits unanswered
export const CRISIS_CHANCE = 0.3;           // chance per dawn a new crisis surfaces

// give = paid from the treasury · gain = hauled in · stability = delta
export const CRISES = {
  fuel_shortage: {
    title: 'Fuel Shortage',
    text: (n) => `The pumps at ${n} run dry days early — the meters were doctored, and the depot crews want answers before they touch another drum.`,
    options: [
      { id: 'ration', label: 'Ration the Drums', detail: 'Cut civilian allocation to the bone. +3 fuel, and the town remembers the cold.', gain: { fuel: 3 }, stability: -10 },
      { id: 'ship_in', label: 'Ship In Reserves', detail: 'Run your own convoy to cover the shortfall. −3 fuel, −2 steel, the crews are steadied.', give: { fuel: 3, steel: 2 }, stability: 8 },
      { id: 'ignore', label: 'Let Them Sort It Out', detail: 'Post no order at all. Nothing spent, nothing gained, and the pumps stay half-dead.', stability: -4 },
    ],
  },
  uprising: {
    title: 'Local Resistance Rising',
    text: (n) => `Cells in ${n} have cut the signal lines and posted lists of collaborators on the works gate. Come dawn, someone will act on those lists.`,
    options: [
      { id: 'crackdown', label: 'Order a Crackdown', detail: 'Sweep the quarter with the garrison. +4 manpower pressed, but the town turns cold.', gain: { manpower: 4 }, stability: -16 },
      { id: 'parley', label: 'Parley with the Cells', detail: 'Hear them out and pay off grievances. −4 steel, −2 manpower, and the rising subsides.', give: { steel: 4, manpower: 2 }, stability: 12 },
      { id: 'withdraw_garrison', label: 'Pull the Garrison Back', detail: 'Let the quarter police itself. Nothing spent — but authority erodes.', stability: -6 },
    ],
  },
  foreman_strike: {
    title: "Foremen's Strike",
    text: (n) => `The line foremen at ${n} have downed tools over war quotas. The furnaces are banked and cooling by the hour.`,
    options: [
      { id: 'break_strike', label: 'Break the Strike', detail: 'Put officers on the floor. +4 steel now, and the shops seethe.', gain: { steel: 4 }, stability: -12 },
      { id: 'concede', label: 'Concede the Quotas', detail: 'Cut the quota and feed the shifts. −3 manpower, and the works restart willingly.', give: { manpower: 3 }, stability: 10 },
      { id: 'wait_out', label: 'Wait Them Out', detail: 'Say nothing and let the cold do the arguing. Nothing spent, nothing settled.', stability: -3 },
    ],
  },
  refugees: {
    title: 'Refugee Column at the Gate',
    text: (n) => `Two hundred road-worn refugees have reached ${n} ahead of the fighting and are camped against the wall.`,
    options: [
      { id: 'take_in', label: 'Open the Gates', detail: 'Feed and house them. −3 steel, −2 fuel, and word of it travels. +4 manpower over time.', give: { steel: 3, fuel: 2 }, gain: { manpower: 4 }, stability: 10 },
      { id: 'conscript', label: 'Conscript the Able', detail: 'Take those who can march and turn the rest away. +5 manpower, and the town watches.', gain: { manpower: 5 }, stability: -11 },
      { id: 'turn_away', label: 'Turn the Column Away', detail: 'Send them down the road. Nothing spent — and nothing forgiven.', stability: -7 },
    ],
  },
};

const CRISIS_IDS = Object.keys(CRISES);

// Depots throw fuel trouble; cities throw industrial trouble; anywhere can rise up
export function rollCrisisId(kind, rand = Math.random) {
  const weights = CRISIS_IDS.map((id) => {
    if (id === 'fuel_shortage') return kind === 'depot' ? 4 : 1;
    if (id === 'foreman_strike') return kind === 'city' ? 4 : 1;
    if (id === 'uprising') return 3;
    return 2;
  });
  let r = rand() * weights.reduce((s, w) => s + w, 0);
  for (let i = 0; i < CRISIS_IDS.length; i++) { r -= weights[i]; if (r <= 0) return CRISIS_IDS[i]; }
  return 'uprising';
}

// Player-facing shape of a pending crisis
export function crisisView(entry, nodeName) {
  const c = CRISES[entry.crisisId];
  if (!c) return null;
  return {
    nodeId: entry.nodeId, nodeName, crisisId: entry.crisisId, turn: entry.turn,
    title: c.title, text: c.text(nodeName), options: c.options,
  };
}

export const crisisOption = (crisisId, choiceId) =>
  (CRISES[crisisId]?.options || []).find((o) => o.id === choiceId) || null;

export const clampStability = (v) => Math.max(0, Math.min(100, v));