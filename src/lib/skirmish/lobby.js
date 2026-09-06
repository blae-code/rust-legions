// The muster: who sits where, what each seat has bought, and how a lobby
// becomes the battle order every seated commander carries into the arena.
import { costOf, buildAiForce } from "./roster";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const makeCode = () =>
  Array.from({ length: 5 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

export const otherSide = (side) => (side === "attacker" ? "defender" : "attacker");
export const seatsOn = (lobby, side) => (lobby.seats || []).filter((s) => s.side === side);
export const mySeat = (lobby, userId) => (lobby.seats || []).find((s) => s.userId === userId) || null;
export const sideSpent = (lobby, side) => seatsOn(lobby, side).reduce((n, s) => n + costOf(s.force || []), 0);
export const sideStands = (lobby, side) => seatsOn(lobby, side).reduce((n, s) => n + (s.force || []).length, 0);

// A side with commanders in it is human; an empty side is left to the machine.
export const isHuman = (lobby, side) => seatsOn(lobby, side).length > 0;

export const withSeat = (lobby, seat) => {
  const rest = (lobby.seats || []).filter((s) => s.userId !== seat.userId);
  return [...rest, seat];
};
export const withoutSeat = (lobby, userId) => (lobby.seats || []).filter((s) => s.userId !== userId);

/** Why the host cannot yet take the field — or null when every seat is set. */
export function fieldBlock(lobby, scenario) {
  const seats = lobby.seats || [];
  if (!seats.length) return "NO COMMANDER SEATED";
  for (const side of ["attacker", "defender"]) {
    if (!isHuman(lobby, side)) continue;
    if (sideStands(lobby, side) < 3) return `${side.toUpperCase()} NEEDS THREE STANDS`;
    if (sideSpent(lobby, side) > scenario.points) return `${side.toUpperCase()} OVER ALLOWANCE`;
  }
  if (seats.some((s) => !s.ready)) return "AWAITING READY FROM ALL SEATS";
  return null;
}

/** The battle order this commander fights under, drawn from the fielded lobby. */
export function orderFromLobby(lobby, scenario, userId) {
  const me = mySeat(lobby, userId);
  const side = me?.side || "attacker";
  const foe = otherSide(side);
  const forceOf = (sd) =>
    isHuman(lobby, sd)
      ? seatsOn(lobby, sd).flatMap((s) => (s.force || []).map((it) => ({ type: it.type, owner: s.callsign })))
      : buildAiForce(scenario.points, lobby.doctrine).map((it) => ({ type: it.type, owner: "Machine" }));
  const names = (sd) => seatsOn(lobby, sd).map((s) => s.callsign);
  return {
    lobbyId: lobby.id,
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    objective: scenario.objective,
    side,
    doctrine: lobby.doctrine,
    opts: { seed: scenario.seed, nodeKind: scenario.nodeKind, weather: scenario.weather, fortBonus: scenario.fortBonus },
    force: forceOf(side),
    enemyForce: forceOf(foe),
    allies: names(side).filter((c) => c !== me?.callsign),
    foes: isHuman(lobby, foe) ? names(foe) : [],
  };
}