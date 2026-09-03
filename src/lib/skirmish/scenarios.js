// ---------------------------------------------------------------------------
// The scenario library — premade set-piece engagements.
//
// A scenario is nothing but a fixed set of generator arguments plus a briefing
// and a points allowance. That is deliberate: the board a campaign draws for a
// macro node is the board a skirmish fights on, so a scenario never needs its
// own terrain format — only a seed, a node kind, a sky and a works level.
// ---------------------------------------------------------------------------

export const SCENARIOS = [
  {
    id: "hedgerow_morning",
    name: "Hedgerow Morning",
    sheet: "SHEET 12-B",
    nodeKind: "town",
    weather: "clear",
    fortBonus: 1,
    seed: 481207,
    points: 900,
    objective: "Clear the township before the ammunition runs out.",
    blurb: "Field boundaries, a chapel and one metalled road out. Bad ground for armour, worse for haste.",
  },
  {
    id: "ward_by_ward",
    name: "Ward By Ward",
    sheet: "SHEET 03-A",
    nodeKind: "city",
    weather: "fog",
    fortBonus: 3,
    seed: 990331,
    points: 1200,
    objective: "Take the ward. Every block is held and sight dies at four hexes.",
    blurb: "A city reduced to its street plan. Sappers earn their pay here; crawlers burn in the rubble.",
  },
  {
    id: "sidings_and_drums",
    name: "Sidings And Drums",
    sheet: "SHEET 21-C",
    nodeKind: "depot",
    weather: "rain",
    fortBonus: 1,
    seed: 66211,
    points: 1000,
    objective: "Seize the depot intact — mind your fire discipline near the drums.",
    blurb: "Hardstanding, sidings and naphtha. Little to hide behind and a great deal to burn.",
  },
  {
    id: "the_open_lane",
    name: "The Open Lane",
    sheet: "SHEET 07-A",
    nodeKind: "crossroads",
    weather: "clear",
    fortBonus: 0,
    seed: 130977,
    points: 1100,
    objective: "Hold the crossroads. A meeting engagement — neither side is dug in.",
    blurb: "Rolling country and one lane. The armour will settle this before the infantry arrive.",
  },
  {
    id: "cold_crest",
    name: "Cold Crest",
    sheet: "SHEET 44-F",
    nodeKind: "crossroads",
    weather: "snow",
    fortBonus: 2,
    seed: 700114,
    points: 950,
    objective: "Carry the rise. Cold engines, short sight, and tracks the enemy can read.",
    blurb: "A rise worth a battalion, held by men who arrived first and have had time to dig.",
  },
  {
    id: "precursor_dig",
    name: "The Precursor Dig",
    sheet: "SHEET 88-X",
    nodeKind: "ruin",
    weather: "storm",
    fortBonus: 2,
    seed: 314159,
    points: 1300,
    objective: "Hold the dig site until the storm passes.",
    blurb: "Shelled by three generations of prospectors. The old geometry is still standing, unweathered.",
  },
  {
    id: "last_township",
    name: "The Last Township",
    sheet: "SHEET 12-K",
    nodeKind: "town",
    weather: "rain",
    fortBonus: 3,
    seed: 24601,
    points: 1400,
    objective: "Break a works-heavy defence in the mud. The attacker is expected to spend heavily.",
    blurb: "Three lines of trench behind a hedge bank. The Ministry calls this an orderly withdrawal.",
  },
  {
    id: "fog_on_the_wire",
    name: "Fog On The Wire",
    sheet: "SHEET 09-D",
    nodeKind: "city",
    weather: "fog",
    fortBonus: 0,
    seed: 585858,
    points: 800,
    objective: "A small, blind, close-quarter action. Whoever finds the other first wins it.",
    blurb: "Two patrols in a dead ward, feeling for each other through the murk.",
  },
];

export const scenarioById = (id) => SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];