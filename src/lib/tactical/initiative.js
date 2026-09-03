// ---------------------------------------------------------------------------
// Initiative — the order counters act in.
//
// A stand's initiative is its own pace, tempered by the ground under it. A
// crawler on a road outruns everything; the same crawler in a marsh is slower
// than foot. Works and weather blunt reaction, veterancy sharpens it, and a
// stand that has already spent its orders drops to the back of the queue.
//
// Display model for the arena — real sequencing will come from the server-side
// tactical engine, which is why the shape returned here is the one it will use.
// ---------------------------------------------------------------------------
import { UNIT_TYPES } from "./orbat";

// Base pace by type: how quickly the formation can react and move off.
export const BASE_INIT = {
  autocar_scouts: 14,
  crawler: 10,
  land_dreadnought: 6,
  stormtroops: 11,
  marksmen: 9,
  flame_team: 8,
  riflemen: 7,
  sappers: 6,
  provost: 7,
  digger_corps: 5,
  pilgrim_levy: 4,
  artillery: 3,
  siege_mortar: 2,
};

const WEATHER_DRAG = { clear: 0, rain: 1, fog: 1, dust: 1, snow: 2, storm: 2 };

/**
 * One stand's initiative, with the reasons that produced it.
 * `tile` is the hex it stands on — its move cost is the terrain drag.
 */
export function initiativeOf(stand, tile, weather = "clear") {
  const base = BASE_INIT[stand.type] ?? 6;
  const reasons = [];

  const terrain = Math.max(0, (tile?.move ?? 1) - 1) * 2;
  if (terrain) reasons.push(`−${terrain} ground (${tile?.terrain || "broken"})`);

  const vet = stand.vet || 0;
  if (vet) reasons.push(`+${vet} veterancy`);

  const works = stand.entrench || 0;
  if (works) reasons.push(`−${works} dug in`);

  const drag = WEATHER_DRAG[weather] || 0;
  if (drag) reasons.push(`−${drag} ${weather}`);

  const dry = stand.ammo === 0 ? 2 : 0;
  if (dry) reasons.push("−2 out of ammunition");

  const score = Math.max(1, base + vet - terrain - works - drag - dry);
  return { score, base, reasons };
}

/**
 * The full acting queue, fastest first. Stands that have expended their orders
 * fall to the back and are marked spent.
 */
export function buildOrder(stands, field, weather = "clear") {
  return stands
    .map((s) => {
      const tile = field?.tiles?.[`${s.q},${s.r}`];
      return { stand: s, ...initiativeOf(s, tile, weather), spent: !!s.moved };
    })
    .sort((a, b) => {
      if (a.spent !== b.spent) return a.spent ? 1 : -1;
      if (b.score !== a.score) return b.score - a.score;
      return UNIT_TYPES[b.stand.type].atk - UNIT_TYPES[a.stand.type].atk;
    });
}