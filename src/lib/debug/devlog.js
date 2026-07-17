// devlog — observational QA/debug instrumentation for Rust Legions.
//
// Pure client-side. Captures three streams for the in-app Dev Console overlay:
//   1. events   — console.error/warn + window errors + unhandled rejections + dlog() calls
//   2. network  — every base44.functions.invoke() call (action, params, timing, ok/err)
//   3. state    — the latest getState() payload per gameId (for the State inspector)
//
// Disabled by default in production: recording only happens when enabled() is true
// (import.meta.env.DEV, or the persisted `rl_debug` localStorage flag, which admins/QA
// can flip live via the Ctrl+Shift+D hotkey or window.__RL.enable()).

const EVENT_CAP = 400;
const NET_CAP = 250;
const FLAG_KEY = "rl_debug";

let seq = 0;
const nextId = () => ++seq;

const state = {
  events: [], // { id, t, level, source, msg, detail }
  network: [], // { id, t, name, action, params, ms, ok, status, size, error, response }
  lastState: {}, // { [gameId]: { at, ms, data } }
  installed: false,
};

const subscribers = new Set();
let notifyQueued = false;
function notify() {
  // Coalesce bursts (a 4s poll can fan out several records) into one paint.
  if (notifyQueued) return;
  notifyQueued = true;
  Promise.resolve().then(() => {
    notifyQueued = false;
    subscribers.forEach((fn) => {
      try {
        fn();
      } catch {
        /* a broken subscriber must never break logging */
      }
    });
  });
}

export function enabled() {
  try {
    if (import.meta.env && import.meta.env.DEV) return true;
  } catch {
    /* import.meta may be unavailable in some contexts */
  }
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function setEnabled(on) {
  try {
    if (on) localStorage.setItem(FLAG_KEY, "1");
    else localStorage.removeItem(FLAG_KEY);
  } catch {
    /* private mode / storage disabled */
  }
  // Let mounted UI react to a live toggle without a reload.
  try {
    window.dispatchEvent(new CustomEvent("rl-debug-toggle", { detail: { enabled: !!on } }));
  } catch {
    /* non-browser */
  }
  notify();
}

// Shallow, size-bounded snapshot so we never retain giant payloads or live references.
function summarize(value, depth = 0) {
  if (value == null) return value;
  const type = typeof value;
  if (type === "string") return value.length > 500 ? value.slice(0, 500) + "…(+" + (value.length - 500) + ")" : value;
  if (type === "number" || type === "boolean") return value;
  if (type === "function") return "ƒ()";
  if (Array.isArray(value)) {
    if (depth >= 4) return `[Array(${value.length})]`;
    return value.slice(0, 60).map((v) => summarize(v, depth + 1));
  }
  if (type === "object") {
    if (depth >= 4) return "{…}";
    const out = {};
    for (const k of Object.keys(value).slice(0, 80)) out[k] = summarize(value[k], depth + 1);
    return out;
  }
  return String(value);
}

function pushEvent(level, source, args) {
  if (!enabled()) return;
  const parts = Array.from(args).map((a) => {
    if (a instanceof Error) return a.stack || a.message;
    if (typeof a === "string") return a;
    try {
      return summarize(a);
    } catch {
      return String(a);
    }
  });
  const msg = parts.map((p) => (typeof p === "string" ? p : JSON.stringify(p))).join(" ");
  state.events.push({ id: nextId(), t: Date.now(), level, source, msg, detail: parts.length > 1 ? parts : parts[0] });
  if (state.events.length > EVENT_CAP) state.events.splice(0, state.events.length - EVENT_CAP);
  notify();
}

// Public logging helper for app code that wants explicit dev breadcrumbs.
export const dlog = {
  debug: (...a) => pushEvent("debug", "app", a),
  info: (...a) => pushEvent("info", "app", a),
  warn: (...a) => pushEvent("warn", "app", a),
  error: (...a) => pushEvent("error", "app", a),
};

// Called by the base44 client invoke() wrapper for every backend call.
export function recordInvoke({ name, action, payload, ms, ok, status, res, error }) {
  if (!enabled()) return;
  let size;
  try {
    if (res != null) size = JSON.stringify(res).length;
  } catch {
    /* circular / non-serializable */
  }
  const rec = {
    id: nextId(),
    t: Date.now(),
    name,
    action,
    params: summarize(payload),
    ms: Math.round(ms),
    ok,
    status,
    size,
    error: error ? error.message || String(error) : undefined,
    response: ok ? summarize(res && res.data !== undefined ? res.data : res) : undefined,
  };
  state.network.push(rec);
  if (state.network.length > NET_CAP) state.network.splice(0, state.network.length - NET_CAP);

  // Stash the freshest getState per game for the State inspector.
  if (name === "gameEngine" && action === "getState" && ok) {
    const gameId = payload && payload.gameId;
    const data = res && res.data !== undefined ? res.data : res;
    if (gameId) state.lastState[gameId] = { at: Date.now(), ms: Math.round(ms), data };
  }
  notify();
}

export function getEvents() {
  return state.events;
}
export function getNetwork() {
  return state.network;
}
export function getLastStates() {
  return state.lastState;
}
export function clearLog(which) {
  if (!which || which === "events") state.events = [];
  if (!which || which === "network") state.network = [];
  notify();
}

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

// Idempotent global capture hooks. Console patches call through to the originals,
// so normal logging is untouched.
export function install() {
  if (state.installed || typeof window === "undefined") return;
  state.installed = true;

  const wrap = (level) => {
    const orig = console[level] ? console[level].bind(console) : () => {};
    console[level] = (...args) => {
      pushEvent(level, "console", args);
      orig(...args);
    };
  };
  wrap("error");
  wrap("warn");

  window.addEventListener("error", (e) => {
    pushEvent("error", "window", [e.message, e.filename ? `${e.filename}:${e.lineno}:${e.colno}` : "", e.error]);
  });
  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason;
    pushEvent("error", "promise", [r instanceof Error ? r : "Unhandled rejection: " + (r && r.message ? r.message : String(r))]);
  });

  // Console handle for QA sessions.
  window.__RL = {
    enable: () => setEnabled(true),
    disable: () => setEnabled(false),
    enabled,
    events: getEvents,
    network: getNetwork,
    state: getLastStates,
    clear: clearLog,
    log: dlog,
  };
}
