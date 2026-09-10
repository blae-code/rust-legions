import React, { useState, useEffect, useRef } from "react";
import LogEntryRow from "@/components/game/log/LogEntryRow";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "combat", label: "Battles" },
  { key: "capture", label: "Captures" },
  { key: "march", label: "Movements" },
];

// The running war log — reports arrive at the bottom as they happen, and the
// panel follows them unless the commander has scrolled back through the file.
export default function CombatLog({ entries = [] }) {
  const [filter, setFilter] = useState("all");
  const scroller = useRef(null);
  const follow = useRef(true);
  const seen = useRef(0);
  const [freshFrom, setFreshFrom] = useState(0);

  const shown = filter === "all" ? entries : entries.filter((e) => e.type === filter);

  // New reports on the wire: mark them lit, then let the highlight fade
  useEffect(() => {
    if (entries.length > seen.current) {
      if (seen.current > 0) {
        setFreshFrom(seen.current);
        const t = setTimeout(() => setFreshFrom(entries.length), 2600);
        seen.current = entries.length;
        return () => clearTimeout(t);
      }
      setFreshFrom(entries.length);
    }
    seen.current = entries.length;
  }, [entries.length]);

  // Follow the tail of the log while the reader is parked at the bottom
  useEffect(() => {
    const el = scroller.current;
    if (el && follow.current) el.scrollTop = el.scrollHeight;
  }, [shown.length, filter]);

  const onScroll = () => {
    const el = scroller.current;
    if (el) follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  };

  return (
    <div className="cq-panel cq-brackets p-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="cq-label">Field Reports</h3>
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        <span className="w-1.5 h-1.5 rounded-full bg-rust text-rust cq-lamp animate-pulse" />
      </div>
      <div className="flex gap-1 mb-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => { follow.current = true; setFilter(f.key); }}
            className={`px-2 py-0.5 text-[10px] font-heading uppercase tracking-[0.2em] rounded-sm border transition-colors ${
              filter === f.key ? "border-brass/60 text-brass-bright bg-brass/10" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div ref={scroller} onScroll={onScroll} className="space-y-1 max-h-64 overflow-y-auto text-xs pr-1">
        {shown.length === 0 && <p className="text-muted-foreground">Nothing on the wire yet.</p>}
        {shown.map((e, i) => (
          <LogEntryRow key={`${e.turn}-${i}`} entry={e} fresh={entries.indexOf(e) >= freshFrom} />
        ))}
      </div>
    </div>
  );
}