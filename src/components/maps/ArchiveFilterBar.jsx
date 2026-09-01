import React from "react";
import { WORLDS } from "@/lib/macro/worlds";
import { SlidersHorizontal } from "lucide-react";

const SORTS = [
  ["newest", "Newest"],
  ["top", "Best Rated"],
  ["most", "Most Assessed"],
];

const Select = ({ label, value, onChange, children }) => (
  <label className="flex-1 min-w-0">
    <span className="font-heading uppercase tracking-[0.15em] text-[8px] text-muted-foreground/80">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-input border border-border rounded-sm p-1.5 mt-0.5 text-xs text-secondary-foreground font-heading tracking-wide"
      aria-label={label}
    >
      {children}
    </select>
  </label>
);

// The filing clerk's desk — sort order and survey filters.
export default function ArchiveFilterBar({ sortBy, setSortBy, planetFilter, setPlanetFilter, countFilter, setCountFilter, shown, total }) {
  return (
    <div className="cq-panel p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="cq-label flex items-center gap-1.5 text-brass/80">
          <SlidersHorizontal className="w-3 h-3" /> Filing Order
        </p>
        <span className="font-mono text-[9px] text-muted-foreground tracking-widest">{shown}/{total} DRAWN</span>
      </div>

      <div className="flex gap-1">
        {SORTS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`flex-1 font-heading uppercase tracking-[0.1em] text-[9px] px-1.5 py-1 rounded-sm border transition-colors ${
              sortBy === key
                ? "border-brass/60 bg-brass/15 text-brass-bright"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Select label="Theater World" value={planetFilter} onChange={setPlanetFilter}>
          <option value="all">All worlds</option>
          {WORLDS.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </Select>
        <Select label="Commanders" value={countFilter} onChange={setCountFilter}>
          <option value="all">Any</option>
          {[2, 3, 4].map((n) => <option key={n} value={n}>{n} commanders</option>)}
        </Select>
      </div>
    </div>
  );
}