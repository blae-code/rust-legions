import React from "react";

// A labeled row of mutually exclusive stamped-plate choices
export default function ChoiceGroup({ label, options, value, onPick }) {
  return (
    <div>
      <p className="cq-label mb-1.5">{label}</p>
      <div className="grid sm:grid-cols-3 gap-1.5">
        {options.map((o) => {
          const active = value === o.id;
          return (
            <button key={o.id} onClick={() => onPick(o.id)}
              className={`cq-metal text-left rounded-sm border px-3 py-2 transition-colors ${
                active ? "border-rust bg-rust/10" : "border-border hover:border-brass/60"
              }`}>
              <span className={`block font-heading text-sm tracking-wide ${active ? "text-brass-bright" : "text-secondary-foreground"}`}>
                {o.label}
              </span>
              <span className="block text-[10px] text-muted-foreground">{o.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}