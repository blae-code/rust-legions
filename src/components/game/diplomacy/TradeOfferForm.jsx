import React, { useState } from "react";
import { RESOURCE_KEYS, RESOURCE_META } from "@/lib/units";

function ResourceRow({ label, values, setValues, max }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="cq-label w-16 shrink-0">{label}</span>
      {RESOURCE_KEYS.map((k) => (
        <div key={k} className="flex items-center gap-1 font-mono text-[10px] text-secondary-foreground">
          <span title={RESOURCE_META[k].label}>{RESOURCE_META[k].icon}</span>
          <button type="button" onClick={() => setValues({ ...values, [k]: Math.max((values[k] || 0) - 1, 0) })} className="px-1.5 border border-border rounded-sm hover:border-brass/60">−</button>
          <span className="w-4 text-center">{values[k] || 0}</span>
          <button type="button" onClick={() => setValues({ ...values, [k]: Math.min((values[k] || 0) + 1, max ? (max[k] || 0) : 99) })} className="px-1.5 border border-border rounded-sm hover:border-brass/60">+</button>
        </div>
      ))}
    </div>
  );
}

export default function TradeOfferForm({ myResources, busy, onSend }) {
  const [give, setGive] = useState({});
  const [want, setWant] = useState({});
  const total = RESOURCE_KEYS.reduce((s, k) => s + (give[k] || 0) + (want[k] || 0), 0);

  return (
    <div className="mt-2.5 border border-brass/30 rounded-sm bg-background/50 p-2.5 space-y-2">
      <ResourceRow label="You give" values={give} setValues={setGive} max={myResources} />
      <ResourceRow label="You ask" values={want} setValues={setWant} />
      <button
        disabled={busy || total === 0}
        onClick={() => onSend(give, want)}
        className="w-full cq-metal bg-primary text-primary-foreground font-heading uppercase tracking-[0.2em] text-[10px] py-1.5 rounded-sm disabled:opacity-50"
      >
        Dispatch Envoy with Terms
      </button>
    </div>
  );
}