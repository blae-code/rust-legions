import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { appParams } from "@/lib/app-params";
import {
  enabled as isEnabled,
  setEnabled,
  subscribe,
  getEvents,
  getNetwork,
  getLastStates,
  clearLog,
} from "@/lib/debug/devlog";
import JsonView from "@/components/debug/JsonView";

// Floating observational dev overlay. Always mounted (from Layout) so the
// Ctrl+Shift+D hotkey works, but renders nothing unless the debug flag is on.
// Zero gameplay coupling — reads only what the devlog captured.

const fmtTime = (t) => {
  const d = new Date(t);
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
};

const LEVEL_STYLE = {
  error: "text-rust",
  warn: "text-brass-bright",
  info: "text-olive",
  debug: "text-muted-foreground",
};

const TABS = ["log", "network", "state", "info"];

function Handle({ onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      title="Open Dev Console (Ctrl+Shift+D)"
      className="fixed bottom-3 left-3 z-[70] px-2 py-1 rounded-sm border border-rust/60 bg-card/95 text-rust font-mono text-[10px] tracking-widest uppercase shadow-lg hover:bg-rust/10"
    >
      ⚠ DEV
    </button>
  );
}

export default function DevConsole() {
  // `tick` bumps on every devlog notify (subscribe below). The devlog ring
  // buffers are mutated in place (stable array reference), so the filtered
  // memos below MUST key on `tick` — otherwise they'd freeze at first paint.
  const [tick, force] = useState(0);
  const [on, setOn] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("network");
  const [filter, setFilter] = useState("");
  const [levels, setLevels] = useState({ error: true, warn: true, info: true, debug: true });
  const [expanded, setExpanded] = useState(null); // network row id
  const [stateGame, setStateGame] = useState(null);
  const [autoscroll, setAutoscroll] = useState(true);
  const location = useLocation();
  const streamRef = useRef(null);

  // React to enable/disable (hotkey, window.__RL, other tabs) and to new records.
  useEffect(() => {
    const syncOn = () => setOn(isEnabled());
    syncOn();
    const unsub = subscribe(() => force((n) => n + 1));
    window.addEventListener("rl-debug-toggle", syncOn);
    window.addEventListener("storage", syncOn);
    return () => {
      unsub();
      window.removeEventListener("rl-debug-toggle", syncOn);
      window.removeEventListener("storage", syncOn);
    };
  }, []);

  // Global toggle hotkey — works even when the flag is off, so QA can summon it.
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        const next = !isEnabled();
        setEnabled(next);
        if (next) setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const events = getEvents();
  const network = getNetwork();
  const states = getLastStates();

  const shownEvents = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return events.filter(
      (e) => levels[e.level] !== false && (!f || e.msg.toLowerCase().includes(f) || e.source.includes(f))
    );
  }, [events, filter, levels, tick]);

  const shownNet = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return network;
    return network.filter(
      (r) => `${r.name} ${r.action || ""}`.toLowerCase().includes(f) || (r.error || "").toLowerCase().includes(f)
    );
  }, [network, filter, tick]);

  const gameIds = Object.keys(states);
  const activeGame = stateGame || gameIds[gameIds.length - 1];

  // Autoscroll the active stream to newest.
  useEffect(() => {
    if (autoscroll && open && streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  });

  if (!on) return null;
  if (!open) return <Handle onOpen={() => setOpen(true)} />;

  const copy = (obj) => {
    try {
      navigator.clipboard.writeText(typeof obj === "string" ? obj : JSON.stringify(obj, null, 2));
    } catch {
      /* clipboard blocked */
    }
  };

  const okCount = network.filter((r) => r.ok).length;
  const errCount = network.length - okCount;

  return (
    <div className="fixed bottom-0 left-0 z-[70] w-[min(620px,100vw)] font-mono text-[11px] shadow-2xl">
      <div className="cq-panel rounded-t border-b-0 flex flex-col" style={{ height: "46vh", maxHeight: 520 }}>
        {/* title bar */}
        <div className="flex items-center gap-2 px-2 h-8 border-b border-border bg-card/95 shrink-0">
          <span className="text-rust font-heading tracking-[0.2em] uppercase text-[10px]">⚠ Dev Console</span>
          <div className="flex gap-1 ml-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-2 py-0.5 rounded-sm uppercase tracking-wider text-[10px] transition-colors ${
                  tab === t ? "bg-brass/15 text-brass-bright" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
                {t === "network" && network.length ? ` ${network.length}` : ""}
                {t === "log" && events.length ? ` ${events.length}` : ""}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setEnabled(false)} title="Disable (Ctrl+Shift+D)" className="text-muted-foreground hover:text-rust">
              off
            </button>
            <button onClick={() => setOpen(false)} title="Collapse" className="text-muted-foreground hover:text-foreground text-sm leading-none">
              ▬
            </button>
          </div>
        </div>

        {/* toolbar */}
        {(tab === "log" || tab === "network") && (
          <div className="flex items-center gap-2 px-2 h-7 border-b border-border/60 shrink-0">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="filter…"
              className="bg-secondary/40 border border-border rounded-sm px-1.5 py-0.5 text-[11px] w-36 focus:outline-none focus:border-brass/60"
            />
            {tab === "log" &&
              ["error", "warn", "info", "debug"].map((lv) => (
                <button
                  key={lv}
                  onClick={() => setLevels((s) => ({ ...s, [lv]: !s[lv] }))}
                  className={`px-1 rounded-sm text-[10px] uppercase ${
                    levels[lv] ? LEVEL_STYLE[lv] : "text-muted-foreground/40 line-through"
                  }`}
                >
                  {lv}
                </button>
              ))}
            {tab === "network" && (
              <span className="text-muted-foreground text-[10px]">
                <span className="text-olive">{okCount} ok</span> · <span className="text-rust">{errCount} err</span>
              </span>
            )}
            <label className="ml-auto flex items-center gap-1 text-muted-foreground text-[10px] cursor-pointer">
              <input type="checkbox" checked={autoscroll} onChange={(e) => setAutoscroll(e.target.checked)} className="accent-brass" />
              follow
            </label>
            <button onClick={() => clearLog(tab === "log" ? "events" : "network")} className="text-muted-foreground hover:text-rust text-[10px]">
              clear
            </button>
          </div>
        )}

        {/* body */}
        <div ref={streamRef} className="flex-1 overflow-auto px-2 py-1">
          {tab === "log" &&
            (shownEvents.length === 0 ? (
              <Empty label="No events captured yet." />
            ) : (
              shownEvents.map((e) => (
                <div key={e.id} className="leading-5 border-b border-border/20 py-0.5 flex gap-2">
                  <span className="text-muted-foreground/60 shrink-0">{fmtTime(e.t)}</span>
                  <span className={`${LEVEL_STYLE[e.level]} shrink-0 w-9`}>{e.level}</span>
                  <span className="text-muted-foreground/50 shrink-0">{e.source}</span>
                  <span className="whitespace-pre-wrap break-all">{e.msg}</span>
                </div>
              ))
            ))}

          {tab === "network" &&
            (shownNet.length === 0 ? (
              <Empty label="No backend calls captured yet." />
            ) : (
              shownNet.map((r) => (
                <div key={r.id} className="border-b border-border/20 py-0.5">
                  <button
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    className="w-full text-left flex gap-2 items-center hover:text-brass-bright"
                  >
                    <span className="text-muted-foreground/60 shrink-0">{fmtTime(r.t)}</span>
                    <span className={`shrink-0 w-4 ${r.ok ? "text-olive" : "text-rust"}`}>{r.ok ? "✓" : "✗"}</span>
                    <span className="text-brass shrink-0">{r.name}</span>
                    {r.action && <span className="text-foreground">{r.action}</span>}
                    <span className="ml-auto text-muted-foreground/70 shrink-0">{r.ms}ms{r.size ? ` · ${(r.size / 1024).toFixed(1)}k` : ""}</span>
                  </button>
                  {r.error && <div className="text-rust pl-6 whitespace-pre-wrap break-all">{r.error}</div>}
                  {expanded === r.id && (
                    <div className="pl-4 py-1 space-y-1">
                      <div className="text-brass/70">params</div>
                      <JsonView data={r.params} defaultOpen />
                      {r.response !== undefined && (
                        <>
                          <div className="text-brass/70 flex items-center gap-2">
                            response <button onClick={() => copy(r.response)} className="text-muted-foreground hover:text-foreground text-[10px]">copy</button>
                          </div>
                          <JsonView data={r.response} />
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))
            ))}

          {tab === "state" &&
            (gameIds.length === 0 ? (
              <Empty label="No getState payload captured yet — open a game." />
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2 sticky top-0 bg-card/95 py-1">
                  <select
                    value={activeGame}
                    onChange={(e) => setStateGame(e.target.value)}
                    className="bg-secondary/40 border border-border rounded-sm px-1 py-0.5 text-[11px] max-w-[240px]"
                  >
                    {gameIds.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                  {states[activeGame] && (
                    <span className="text-muted-foreground/70 text-[10px]">
                      {fmtTime(states[activeGame].at)} · {states[activeGame].ms}ms
                    </span>
                  )}
                  <button onClick={() => copy(states[activeGame]?.data)} className="ml-auto text-muted-foreground hover:text-foreground text-[10px]">
                    copy
                  </button>
                </div>
                {states[activeGame] && <JsonView data={states[activeGame].data} />}
              </div>
            ))}

          {tab === "info" && (
            <div className="space-y-1 leading-6">
              <Info k="build" v={import.meta.env.DEV ? "dev (vite)" : "production"} />
              <Info k="route" v={location.pathname + location.search} />
              <Info k="appId" v={appParams.appId || "—"} />
              <Info k="functionsVersion" v={appParams.functionsVersion || "—"} />
              <Info k="appBaseUrl" v={appParams.appBaseUrl || "—"} />
              <Info k="events / network" v={`${events.length} / ${network.length}`} />
              <Info k="games seen" v={gameIds.length || "0"} />
              <Info k="viewport" v={`${window.innerWidth}×${window.innerHeight}`} />
              <Info k="userAgent" v={navigator.userAgent} />
              <div className="pt-2 text-muted-foreground/70 text-[10px] leading-5">
                Toggle: <span className="text-brass">Ctrl+Shift+D</span> · Console: <span className="text-brass">window.__RL</span> ·
                Breadcrumbs: <span className="text-brass">import {"{ dlog }"} from "@/lib/debug/devlog"</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Empty({ label }) {
  return <div className="text-muted-foreground/50 italic py-6 text-center">{label}</div>;
}

function Info({ k, v }) {
  return (
    <div className="flex gap-2">
      <span className="text-brass/70 shrink-0 w-32">{k}</span>
      <span className="text-foreground break-all">{String(v)}</span>
    </div>
  );
}
