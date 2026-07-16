import React from "react";
import { PERKS, PERK_BY_ID, netPoints, pickError, MAX_LIABILITIES } from "@/lib/pointBuy";

const SECTIONS = [
  { cat: "asset", title: "National Assets", hint: "Cost points" },
  { cat: "upgrade", title: "Unit Upgrades", hint: "Cost points · one per unit type" },
  { cat: "liability", title: "Liabilities", hint: `Grant points · max ${MAX_LIABILITIES}` },
];

export default function PointBuyPanel({ picks, setPicks }) {
  const net = netPoints(picks);
  const err = pickError(picks);

  const toggle = (id) => {
    if (picks.includes(id)) return setPicks(picks.filter((p) => p !== id));
    const perk = PERK_BY_ID[id];
    let next = picks;
    if (perk.cat === "upgrade") next = next.filter((p) => PERK_BY_ID[p].unit !== perk.unit || PERK_BY_ID[p].cat !== "upgrade");
    setPicks([...next, id]);
  };

  return (
    <div className="space-y-5">
      <div className={`flex items-center justify-between border rounded-sm px-4 py-2.5 ${net > 0 ? "border-rust bg-rust/10" : "border-brass/50 bg-brass/5"}`}>
        <span className="cq-label">Requisition Ledger</span>
        <span className={`font-mono text-sm font-semibold ${net > 0 ? "text-rust" : "text-brass-bright"}`}>
          {net > 0 ? `−${net} pts overdrawn` : net < 0 ? `+${-net} pts in reserve` : "Balanced"}
        </span>
      </div>
      {SECTIONS.map((sec) => (
        <div key={sec.cat}>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-sm font-heading font-semibold tracking-wide text-foreground">{sec.title}</h3>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">{sec.hint}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {PERKS.filter((p) => p.cat === sec.cat).map((p) => {
              const on = picks.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className={`text-left border rounded-sm p-3 transition-colors ${on ? "border-brass bg-brass/10" : "border-border hover:border-steel"}`}
                >
                  <div className="flex justify-between items-baseline gap-2">
                    <p className="font-heading font-semibold tracking-wide text-foreground text-xs">{p.label}</p>
                    <span className={`font-mono text-[11px] shrink-0 ${p.pts < 0 ? "text-olive" : "text-brass-bright"}`}>
                      {p.pts < 0 ? `+${-p.pts}` : `−${p.pts}`} pts
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{p.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {err && <p className="text-xs text-rust font-mono">{err}</p>}
    </div>
  );
}