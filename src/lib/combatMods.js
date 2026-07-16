// Mirrors gameEngine combat modifiers — for UI previews only
export const TERRAIN_DEF = { mountains: 2, hills: 1, highlands: 1, forest: 1, marsh: 1, industrial: 1, plains: 0, deltas: 0 };
export const TERRAIN_ELEVATION = { mountains: 3, highlands: 2, hills: 1 };

export const elevOf = (tile) => (tile && !tile.isSea ? TERRAIN_ELEVATION[tile.terrain] || 0 : 0);

// Attacker modifier for the slope of the assault
export const slopeMod = (fromTile, toTile) => {
  const d = elevOf(toTile) - elevOf(fromTile);
  return d > 0 ? -1 : d < 0 ? 1 : 0;
};