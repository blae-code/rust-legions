// Putting a bought force onto the ground.
//
// The generator already publishes each side's deployment strip, so deployment
// is simply: take the passable hexes of your strip, spread the stands down it,
// and leave the middle of the board empty for the battle itself.
import { toStands } from "./roster";

const strip = (field, side) =>
  field.deploy[side]
    .filter((hx) => {
      const tile = field.tiles[`${hx.q},${hx.r}`];
      return tile && tile.moveCost !== null;
    })
    // down the rows first, so a force lines up as a front rather than a column
    .sort((a, b) => a.r - b.r || a.q - b.q);

// Every other hex, so stands are not shoulder to shoulder along the strip.
const spaced = (hexes) => {
  const wide = hexes.filter((_, i) => i % 2 === 0);
  return wide.length ? wide : hexes;
};

const place = (stands, hexes) =>
  stands.map((s, i) => {
    const hx = hexes[Math.min(i, hexes.length - 1)];
    return { ...s, q: hx.q, r: hx.r };
  });

/**
 * Deploy both forces of a launched skirmish onto a generated field.
 * @param {object} field generateField(order.opts)
 * @param {object} order the saved skirmish order
 */
export function deployForces(field, order) {
  const foe = order.side === "attacker" ? "defender" : "attacker";
  const mine = place(toStands(order.force, order.side), spaced(strip(field, order.side)));
  const theirs = place(toStands(order.enemyForce, foe), spaced(strip(field, foe)));
  return [...mine, ...theirs];
}