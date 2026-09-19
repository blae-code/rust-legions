// ---------------------------------------------------------------------------
// Topographic sheet styling.
//
// A survey sheet, not a game board: buff paper, ink linework, and terrain read
// by SYMBOL rather than by colour. Nothing here is mechanical — the generator's
// TERRAIN table still owns cover, move cost and sight. This file only decides
// how each key is drawn on the sheet.
// ---------------------------------------------------------------------------

// Paper tints. Deliberately close together so the sheet reads as one document
// and the counters stay the brightest thing on it.
export const TOPO_FILL = {
  open: "hsl(var(--tactical-paper))",
  field: "hsl(var(--tactical-field))",
  road: "hsl(var(--tactical-paper-light) / 0.7)",
  rail: "hsl(var(--tactical-stone))",
  rubble: "hsl(var(--tactical-earth))",
  ruins: "hsl(var(--tactical-stone))",
  building: "hsl(var(--tactical-stone))",
  wall: "hsl(var(--tactical-contour) / 0.65)",
  woods: "hsl(var(--tactical-forest))",
  hedgerow: "hsl(var(--tactical-field))",
  crater: "hsl(var(--tactical-earth))",
  water: "hsl(var(--tactical-water))",
  marsh: "hsl(var(--tactical-water) / 0.55)",
  hill: "hsl(var(--tactical-earth))",
  fuel_tank: "hsl(var(--tactical-rust-ink) / 0.3)",
  precursor_wall: "hsl(var(--tactical-water))",
};

// Ink used for structures, contours and hydrography.
export const INK = {
  line: "hsl(var(--tactical-ink))",
  soft: "hsl(var(--tactical-ink) / 0.4)",
  water: "hsl(var(--tactical-water-ink))",
  green: "hsl(var(--tactical-forest-ink))",
  contour: "hsl(var(--tactical-contour))",
  red: "hsl(var(--tactical-rust-ink))",
};

// Which hexes chain together into continuous linear features across the sheet.
export const NETWORK_GROUPS = {
  road: ["road"],
  rail: ["rail"],
  water: ["water", "marsh"],
};