// The launched skirmish, handed from the setup sheet to the tactical arena.
// Held in sessionStorage so a reload during a battle re-enters that battle
// rather than dropping the commander onto the standing sample engagement.
const KEY = "cq_skirmish";

export function saveSkirmish(order) {
  sessionStorage.setItem(KEY, JSON.stringify(order));
}

export function readSkirmish() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function clearSkirmish() {
  sessionStorage.removeItem(KEY);
}