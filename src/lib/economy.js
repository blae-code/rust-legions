import { TERRAIN_RESOURCE, activeBuildings, hasBuilding } from "@/lib/units";

// Cosmetic mirror of gameEngine tileProduction — display only, backend is authoritative
export function tileProduction(tile, state) {
  const out = { manpower: 0, steel: 0, fuel: 0 };
  if (!tile || tile.isSea) return out;
  out[TERRAIN_RESOURCE[tile.terrain] || "manpower"] += tile.baseIncome || 1;
  if (tile.resourceBonus === "oil_field") out.fuel += 2;
  if (tile.resourceBonus === "coal_depot") out.steel += 1;
  if (tile.resourceBonus === "iron_foundry") out.steel += 1;
  for (const b of activeBuildings(state)) {
    if (b.type === "barracks") out.manpower += b.level;
    if (b.type === "foundry") out.steel += b.level;
    if (b.type === "refinery") out.fuel += 2 * b.level;
  }
  return out;
}

// Zones that anchor the supply net: capitals, fortifications, barracks, the fortress-base
export function isSupplyHub(tile, state, myBase) {
  if (!tile || tile.isSea) return false;
  if (myBase && myBase.tileId === tile.id) return true;
  return !!tile.isCapital || hasBuilding(state, "fortifications") || hasBuilding(state, "barracks");
}

// Full quartermaster report for the current player
export function economyReport(game) {
  const supplied = new Set(game.suppliedTiles || []);
  const zones = game.tiles
    .filter((t) => t.visible !== false && !t.isSea && t.state?.owner === game.mySlot)
    .map((t) => ({
      id: t.id,
      name: t.name,
      terrain: t.terrain,
      bonus: t.resourceBonus || null,
      isCapital: !!t.isCapital,
      isHub: isSupplyHub(t, t.state, game.myBase),
      inSupply: supplied.has(t.id),
      production: tileProduction(t, t.state),
    }))
    .sort((a, b) => (b.isHub ? 1 : 0) - (a.isHub ? 1 : 0));
  return {
    zones,
    hubs: zones.filter((z) => z.isHub),
    cutOff: zones.filter((z) => !z.inSupply),
    armiesOut: (game.armies || []).filter((a) => a.owner === game.mySlot && a.inSupply === false),
  };
}