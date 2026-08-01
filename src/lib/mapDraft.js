// Cartography Bureau draft desk — an unfiled chart survives a stray navigation
// or a reload; the Bureau keeps the working copy on the drafting table.
const KEY = "cq.mapDraft.v1";

export function loadDraft() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft) {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* drafting table is full — carry on */
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}