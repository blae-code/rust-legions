// The launched skirmish, handed from the setup sheet to the tactical arena.
// Held in sessionStorage so a reload during a battle re-enters that battle
// rather than dropping the commander onto the standing sample engagement.
const KEY = "cq_skirmish";

export function saveSkirmish(order) {
  sessionStorage.setItem(KEY, JSON.stringify(order));
}

// Snapshot the actual field and units, not just the procedural setup seed.
// Deployment drafts stay inside snapshot; only commencing sets order.placements.
export function saveSkirmishSnapshot(order, state) {
  const saved = {
    ...order,
    opts: state.opts,
    snapshot: { ...state, version: 1, savedAt: new Date().toISOString() },
  };
  saveSkirmish(saved);
  return saved;
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