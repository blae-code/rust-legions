import React from "react";
import { PALETTES, WEATHER_FIELD } from "@/lib/tactical/field";

const Row = ({ label, children }) => (
  <div>
    <p className="cq-label mb-1.5">{label}</p>
    <div className="flex flex-wrap gap-1.5">{children}</div>
  </div>
);

const Chip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`cq-metal font-heading uppercase tracking-widest text-[10px] px-2.5 py-1 rounded-sm border transition-colors ${
      active
        ? "border-brass text-brass-bright bg-brass/10"
        : "border-border text-secondary-foreground hover:border-brass/60"
    }`}
  >
    {children}
  </button>
);

// Generator inputs — the same four arguments createTactical passes the engine.
export default function FieldControls({ opts, onChange }) {
  return (
    <div className="space-y-4">
      <Row label="Node Kind">
        {Object.values(PALETTES).map((p) => (
          <Chip key={p.key} active={opts.nodeKind === p.key} onClick={() => onChange({ nodeKind: p.key })}>
            {p.label}
          </Chip>
        ))}
      </Row>
      <Row label="Weather">
        {Object.values(WEATHER_FIELD).map((w) => (
          <Chip key={w.key} active={opts.weather === w.key} onClick={() => onChange({ weather: w.key })}>
            {w.label}
          </Chip>
        ))}
      </Row>
      <Row label="Defender Fortification">
        {[0, 1, 2, 3].map((n) => (
          <Chip key={n} active={opts.fortBonus === n} onClick={() => onChange({ fortBonus: n })}>
            Level {n}
          </Chip>
        ))}
      </Row>
      <Row label="Seed">
        <Chip onClick={() => onChange({ seed: (Math.random() * 1e9) | 0 })}>Re-Survey Ground</Chip>
        <span className="font-mono text-[10px] text-muted-foreground self-center tracking-widest">
          {opts.seed}
        </span>
      </Row>
    </div>
  );
}