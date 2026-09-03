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
  open: "#C4B899",
  field: "#C6C293",
  road: "#D2C29C",
  rail: "#C1B594",
  rubble: "#B5A88D",
  ruins: "#B1A488",
  building: "#A6987E",
  wall: "#8C8066",
  woods: "#94A277",
  hedgerow: "#A2AC83",
  crater: "#BAAD90",
  water: "#8FA9B8",
  marsh: "#A5B199",
  hill: "#C8B489",
  fuel_tank: "#B79A85",
  precursor_wall: "#9AA5A7",
};

// Ink used for structures, contours and hydrography.
export const INK = {
  line: "#3B3323",
  soft: "#3B332366",
  water: "#3E6C86",
  green: "#4C5F38",
  contour: "#8A6E3F",
  red: "#8C3A2A",
};

// Which hexes chain together into continuous linear features across the sheet.
export const NETWORK_GROUPS = {
  road: ["road"],
  rail: ["rail"],
  water: ["water", "marsh"],
};