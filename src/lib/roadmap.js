// Forward Operations Doctrine — the roadmap data behind /roadmap.
//
// Diegetic planning dossiers for the game's phased future, sourced from
// docs/VISION.md §3–§7. This is a display surface only (no gameplay rules) —
// when a phase actually ships it becomes a Field Amendment (Patch) and the
// rules doc is updated. Keep statuses honest against VISION.md.

// status: "live" (shipped, in service) | "design" (docs-first, prototypes only)
//         | "planned" (committed direction, unstarted)
// theater: "land" | "air" | "sea" — drives the accent treatment.

export const PHASES = [
  {
    id: "v1",
    era: "v1.x",
    codename: "The Vanilla Front",
    title: "Core War Doctrine",
    theater: "land",
    status: "live",
    tagline: "The baseline war is fought and won on solid ground.",
    summary:
      "The live-service baseline. Territorial conquest under fog of war, a typed war economy, field armies under named generals, round-by-round mass battles with secret maneuvers, and the first slice of the mobile fortress-base doctrine — all in active service and patched as Field Amendments.",
    prereq: null,
    highlights: [
      { title: "Territorial conquest & fog of war", done: true, note: "Hex theaters, garrison combat, artillery, recon probes." },
      { title: "Mass battles", done: true, note: "Generals, maneuvers, morale, signatures, veterancy, medals, command-vehicle refits." },
      { title: "The Envoy Accords (diplomacy)", done: true, note: "Truces, non-aggression pacts, trade, binding accords, NPC dispositions." },
      { title: "Fortress-base slice", done: true, note: "Three module bays, refit yard, base movement, wreck-on-capture." },
      { title: "Research tree & State Armory", done: true, note: "Doctrine research plus off-turn prototype and decree unlocks." },
    ],
    aim: "Stabilise to a confident v1.0 — the solid ground every later theater is launched from.",
  },
  {
    id: "v2",
    era: "v2.x",
    codename: "The Long March",
    title: "Mobile Bases & the Macro Map",
    theater: "land",
    status: "design",
    tagline: "Capitals come off their foundations. The whole world becomes a road.",
    summary:
      "The largest planned redesign. Permanent capitals are replaced by nomadic mobile fortress-bases roaming a continuous, painterly macro map; permanent settlements become minor polities to trade with, coerce, or raid; and the abandonment premise becomes mechanical — buried precursor technology, contested dig sites, and a relic victory: assembling the Key, the way off the dead world.",
    prereq: "Launches from a stable v1.0 core.",
    highlights: [
      { title: "Full mobile-base rules", done: false, note: "Boarding assaults, base-loss consequences, the remaining module families (hangar, lab, habitat, aura)." },
      { title: "Graph macro map", done: false, note: "Node-and-route world, one turn = one day, GURPS-style march rates set by the slowest column. Client sandbox live at /star-map — the War Table; server wiring ahead." },
      { title: "Precursor technology", done: false, note: "Dig sites, relics as unique modules, and the relic-based victory — assembling the Key, the way off-world." },
      { title: "Settlements as minor polities", done: false, note: "Neutral harvesters with dispositions — traded with, coerced, or raided by whichever fortress rolls past." },
      { title: "Political Ideology Lifepath", done: false, note: "Sessions of the Assembly: in-war decrees shifting four ideology axes with real, permanent mechanical weight." },
    ],
    aim: "Turn the game from a map-painting war into a nomad's hunt across a living world.",
  },
  {
    id: "air",
    era: "Expansion I",
    codename: "The High Frontier",
    title: "AIR Theater",
    theater: "air",
    status: "planned",
    tagline: "The war leaves the ground. Sky-fortresses and pulp aviation.",
    summary:
      "The first full expansion after the core redesign. A Sky Captain-inspired aerial theater grafted onto the dieselpunk base: altitude becomes a movement layer, air lanes cross terrain that stops treads, and piracy stalks the sky. The endgame question the design chases: airborne mobile bases — fortresses that fly.",
    prereq: "Ships after v2.x — needs the mobile base & macro map in place first.",
    highlights: [
      { title: "Airships & sky-fortresses", done: false, note: "A new class of unit and, potentially, a new class of mobile base." },
      { title: "Altitude as a movement layer", done: false, note: "Air lanes overlaying the macro-map graph; heights that ignore ground terrain." },
      { title: "Air piracy", done: false, note: "Fast raiders that run down columns and convoys from above — the Mount & Blade chase, in the clouds." },
      { title: "Rocketeer / pulp-aviation flavour", done: false, note: "The Sky Captain and the World of Tomorrow tone, riveted onto the ash-and-signal-red identity." },
    ],
    aim: "Add a vertical dimension of maneuver and raiding without abandoning the dieselpunk soul.",
  },
  {
    id: "sea",
    era: "Expansion II",
    codename: "The Drowned Roads",
    title: "SEA Theater",
    theater: "sea",
    status: "planned",
    tagline: "The oceans open. Floating fortresses and drowned precursor vaults.",
    summary:
      "The second expansion. A Waterworld / Foxhole-naval theater that finally opens the oceans as a true front: naval mobile bases as floating fortress flotillas, sea-borne settlements, amphibious operations, and deep-sea precursor vaults. It resolves the standing sea-transport gap not as a stopgap patch but as a full theater of war.",
    prereq: "Ships after the Air expansion — last of the committed sequence.",
    highlights: [
      { title: "Naval mobile bases", done: false, note: "Floating fortress flotillas — the nomad doctrine, afloat." },
      { title: "Amphibious operations", done: false, note: "Crossing water and storming coasts; the real answer to split-continent maps." },
      { title: "Sea-borne settlements", done: false, note: "Minor polities on the water, harvesting the deep." },
      { title: "Deep-sea precursor vaults", done: false, note: "The richest, most contested caches of all — sunk where only a fleet can reach." },
    ],
    aim: "Close the last unreachable theater and make water a front to be won, not a wall.",
  },
];

// Standing near-term candidates that can ship as vanilla-era Field Amendments
// independent of the big expansions (docs/VISION.md §7.1). Shown as a secondary
// "amendments queue" so the roadmap doesn't read as 'nothing until v2.x'.
export const AMENDMENTS = [
  { title: "Sea-transport convoy", note: "Stopgap ferry action between friendly coasts, ahead of the full Sea theater." },
  { title: "Neutral war market", note: "Lossy resource conversion (~3:1) when no willing trade partner exists." },
  { title: "Stalemate protection", note: "Optional turn deadline with auto-skip and a max-turn scored victory." },
  { title: "Field Manual", note: "In-game ministry codex — combat math, weather, supply, veterancy, and the lore bible." },
  { title: "Turn notifications", note: "Email nudge to registered players when the baton passes." },
];

export const STATUS_META = {
  live: { label: "In Service", blurb: "Deployed and patched on the front." },
  design: { label: "On the Drafting Table", blurb: "Doctrine committed; prototypes only. Not yet in play." },
  planned: { label: "Committed Direction", blurb: "Sanctioned for a future amendment. Not yet begun." },
};
