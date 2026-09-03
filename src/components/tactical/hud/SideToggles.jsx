import React from "react";

const SIDES = [
  { key: "attacker", label: "Attacker" },
  { key: "defender", label: "Defender" },
];

const Row = ({ label, value, onChange }) => (
  <div className="flex items-center gap-1.5">
    <span className="font-mono text-[8px] text-muted-foreground tracking-widest w-14">{label}</span>
    {SIDES.map((s) => (
      <button
        key={s.key}
        onClick={() => onChange(s.key)}
        className={`cq-metal font-heading uppercase tracking-widest text-[9px] px-1.5 py-0.5 rounded-sm border ${
          value === s.key ? "border-brass/70 text-brass-bright" : "border-border text-muted-foreground"
        }`}
      >
        {s.label}
      </button>
    ))}
  </div>
);

// Who is at the table, and whose hour it is. Orders are only issuable when the
// two agree; otherwise a counter yields intel and nothing else.
export default function SideToggles({ viewSide, turnSide, onView, onTurn }) {
  return (
    <div className="cq-slip px-2 py-1.5 space-y-1">
      <Row label="VIEWING" value={viewSide} onChange={onView} />
      <Row label="THE HOUR" value={turnSide} onChange={onTurn} />
    </div>
  );
}