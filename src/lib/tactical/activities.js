// ---------------------------------------------------------------------------
// Battlefield activities — what a static counter is DOING right now.
//
// Counters stay still. State is read from a badge struck onto the plate plus a
// sound cue of the same key, so "firing light" and "firing siege" are two
// different reads even at a glance across the board.
//
// `ms` is how long the badge holds before the stand returns to standing-by; the
// sound cue is authored to fit inside it.
// ---------------------------------------------------------------------------

export const ACTIVITIES = {
  firing_light:      { label: "Small Arms",       short: "SM ARMS",  tone: "#E8C46A", ms: 900 },
  firing_sustained:  { label: "Sustained Fire",   short: "SUSTAIN",  tone: "#E8A63A", ms: 1100 },
  firing_light_gun:  { label: "Light Gun",        short: "LT GUN",   tone: "#F09A3C", ms: 1000 },
  firing_heavy_gun:  { label: "Heavy Gun",        short: "HVY GUN",  tone: "#F0713C", ms: 1600 },
  firing_siege:      { label: "Siege Piece",      short: "SIEGE",    tone: "#E2483A", ms: 2400 },
  firing_gas:        { label: "Gas Shells",       short: "GAS",      tone: "#8FBF6A", ms: 1800 },
  grenade:           { label: "Grenades",         short: "GRENADE",  tone: "#D98E4A", ms: 1200 },
  flame:             { label: "Flame Projector",  short: "FLAME",    tone: "#E0642A", ms: 1600 },
  melee:             { label: "Close Assault",    short: "ASSAULT",  tone: "#C9553F", ms: 1000 },
  move_foot:         { label: "On the March",     short: "MARCH",    tone: "#9AA98C", ms: 1100 },
  move_tracked:      { label: "Under Power",      short: "POWER",    tone: "#8FA3B5", ms: 1300 },
  digging:           { label: "Entrenching",      short: "DIG IN",   tone: "#A8946B", ms: 1400 },
  constructing:      { label: "Field Works",      short: "WORKS",    tone: "#C0A55E", ms: 1800 },
  repairing:         { label: "Under Repair",     short: "REPAIR",   tone: "#7FA8A0", ms: 1400 },
  spotting:          { label: "Observing",        short: "OBSERVE",  tone: "#8AB0C9", ms: 1000 },
  reloading:         { label: "Resupplying",      short: "RESUPPLY", tone: "#B5A97F", ms: 1000 },
  suppressed:        { label: "Pinned Down",      short: "PINNED",   tone: "#B5563F", ms: 1300 },
  destroyed:         { label: "Destroyed",        short: "LOST",     tone: "#7A3028", ms: 2600 },
  rally:             { label: "Rallying",         short: "RALLY",    tone: "#D9C58F", ms: 1200 },
};

export const ACTIVITY_KEYS = Object.keys(ACTIVITIES);

// The orders a commander can issue by hand, grouped as the rail presents them.
export const ORDER_GROUPS = [
  { label: "Fire", keys: ["firing_light", "firing_sustained", "firing_light_gun", "firing_heavy_gun", "firing_siege", "firing_gas"] },
  { label: "Assault", keys: ["grenade", "flame", "melee"] },
  { label: "Movement", keys: ["move_foot", "move_tracked"] },
  { label: "Works & Support", keys: ["digging", "constructing", "repairing", "spotting", "reloading"] },
  { label: "Condition", keys: ["suppressed", "rally", "destroyed"] },
];