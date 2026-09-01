// The warrant is the identity. No email, no password, no personal details —
// a redeemed code and the callsign the commander chose, held on this terminal.
const KEY = "rl_warrant_v1";

export function getWarrant() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setWarrant({ warrantId, code, callsign }) {
  localStorage.setItem(KEY, JSON.stringify({ warrantId, code, callsign }));
}

export function clearWarrant() {
  localStorage.removeItem(KEY);
}

export function callsignOf() {
  return getWarrant()?.callsign || null;
}