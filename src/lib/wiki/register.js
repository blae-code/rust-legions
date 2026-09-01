// The Marginalia — the Archive's drift & gap register.
//
// Purpose: catch the two failure modes of a growing setting.
//   DRIFT — two surfaces telling the story differently (docs vs engine vs UI copy).
//   GAP   — something the setting implies but neither the rules nor the world provide.
//
// This is player-visible on purpose: the Ministry admits what it has not surveyed.
// Keep it honest. When a query is answered, delete it and update the entry it
// belonged to — a resolved query left standing is itself drift.

export const SEVERITY = {
  drift: { label: "Drift", note: "Two records disagree. Reconcile before either is built on." },
  gap: { label: "Gap", note: "The setting implies it; nothing yet provides it." },
  thin: { label: "Thin Ground", note: "Named but unwritten. Safe to leave; risky to lean on." },
};

export const QUERIES = [
  {
    id: "q-dig-sites",
    severity: "gap",
    title: "Excavation is a premise with no act",
    entry: "dig-sites",
    body: "The hunt for the leavings is the stated motive of every house, and the four survey classes are fully defined — but on the chart, excavation is not something a commander does. Relic sets and the Vault exist; digging does not.",
    want: "Dig sites as chart features: a zone action that costs fuel and turns, yields by class, and can wake a Wake.",
  },
  {
    id: "q-key-progress",
    severity: "gap",
    title: "The Key is the prize and tracks nothing",
    entry: "the-key",
    body: "Ciphers are canonically progress toward the Key, and victory conditions are entirely territorial. A house can win the March without ever advancing the thing it says it is fighting for.",
    want: "Either a Key-progress track (a fourth victory route) or an explicit ruling that the Key is unreachable within one war.",
  },
  {
    id: "q-settlement-lore",
    severity: "thin",
    title: "Settlement types are named, not written",
    entry: "the-settled",
    body: "Burn-towns, mining combines, farm communes, waystations, scrap-parishes and still-cities are listed in the Almanac. In play they behave nearly identically, and only the dossiers distinguish them at all.",
    want: "One distinguishing mechanic or standing attitude per settlement type, so the type is legible without reading its file.",
  },
  {
    id: "q-fog-regulation",
    severity: "drift",
    title: "Fog of war is implemented but not regulated",
    entry: "fog-of-war",
    body: "The engine keeps last-seen state and rations probe intel, but the Field Regulations only describe fog through the recon probe. A player cannot learn from the manual what they are permitted to see.",
    want: "A Field Regulations chapter on visibility, last-known state, and what an accord or a probe does to it.",
  },
  {
    id: "q-quiet-centuries",
    severity: "thin",
    title: "The Quiet Centuries have no landmarks",
    entry: "quiet-centuries",
    body: "Roughly eighty years of the timeline carry no named place, event or figure — while the Cartel Wars and the First March both do. Any lore written into that window has nothing to anchor against.",
    want: "Two or three attributed fragments from the Quiet: a failed compact, a stripped site, a surviving hymn.",
  },
  {
    id: "q-rot-mechanics",
    severity: "gap",
    title: "Ground-rot explains the game but never touches it",
    entry: "ground-rot",
    body: "The rot is the stated reason nothing large sits still, and the whole fortress-base premise rests on it. Mechanically, a house that never moves its keel suffers nothing for it.",
    want: "A standing cost for a stationary keel — rising rot-count, falling yield on a worked swath, or both.",
  },
  {
    id: "q-house-representation",
    severity: "drift",
    title: "Ten canonical houses, three doctrines",
    entry: "great-houses",
    body: "The Almanac names ten great houses with distinct bids for the Key. The game models nations by three doctrines plus a lifepath, so a Covenant of Locks and a Charter Combine can be mechanically identical.",
    want: "Creed as a second axis alongside doctrine, or the ten houses as playable presets that carry their bid into the rules.",
  },
  {
    id: "q-stalemate",
    severity: "gap",
    title: "No stalemate clock in multiplayer",
    entry: "victory",
    body: "Victory requires taking ground. Two dug-in defensive houses on prepared terrain can hold indefinitely, and nothing in the regulations ever forces the issue.",
    want: "A late-war pressure: attrition on long-held swaths, a shrinking supply range, or a declared final turn.",
  },
  {
    id: "q-moon-cycle",
    severity: "thin",
    title: "The Lamp and the Coal don't turn",
    entry: "the-lamp-and-the-coal",
    body: "A dark-run is canonically when raiders and runners move, and vigil nights halt convoys. The turn cycle rolls weather but never tracks which moon is up.",
    want: "A moon phase alongside weather, even if it only modifies one thing — a night march, or probe range.",
  },
];

export const QUERIES_BY_ENTRY = QUERIES.reduce((acc, q) => {
  if (!q.entry) return acc;
  (acc[q.entry] ||= []).push(q);
  return acc;
}, {});