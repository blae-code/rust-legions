import React from "react";
import { Button } from "@/components/ui/button";

const UNIT_LABELS = { riflemen: "Riflemen", crawler: "Crawlers", gunboat: "Gunboats", fighter: "Fighters" };
const Unknown = () => <span className="text-steel">?? unconfirmed</span>;

export default function IntelReport({ intel, onClose }) {
  if (!intel) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="cq-panel cq-brackets w-full max-w-md max-h-[92vh] overflow-y-auto p-5 relative">
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <div className="text-center pt-2 mb-3">
          <p className="cq-label text-rust">Field Intelligence · Classified</p>
          <h2 className="cq-display text-xl">{intel.tileName}</h2>
          <p className="text-[10px] font-mono text-muted-foreground uppercase">{intel.terrain} · Held by {intel.owner}</p>
        </div>

        <p className="cq-label mb-1">Garrison Estimate</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] font-mono text-secondary-foreground mb-3">
          {Object.entries(intel.garrison).map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-muted-foreground">{UNIT_LABELS[k]}</span>
              {v === null ? <Unknown /> : <span className="text-brass-bright">{v}</span>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-x-4 text-[11px] font-mono mb-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fortifications</span>
            {intel.fortLevel === null ? <Unknown /> : <span className="text-brass-bright">Lv {intel.fortLevel}</span>}
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Structures</span>
            {intel.buildings === null ? <Unknown /> : <span className="text-brass-bright">{intel.buildings.length ? intel.buildings.join(", ") : "none"}</span>}
          </div>
        </div>

        {intel.armies.length > 0 && (
          <>
            <p className="cq-label mb-1">Enemy Field Armies</p>
            {intel.armies.map((a, i) => (
              <div key={i} className="border border-rust/40 rounded-sm p-2 mb-2 text-[11px] font-mono">
                <p className="text-secondary-foreground font-semibold">{a.name} {a.rank ? <span className="cq-tag border-border text-muted-foreground ml-1">{a.rank}</span> : <Unknown />}</p>
                {a.general && (
                  <p className="text-muted-foreground mt-0.5">
                    {a.general.name}
                    {" · "}{a.general.trait ? <span className="text-brass-bright">{a.general.trait}</span> : <Unknown />}
                    {" · STR "}{a.general.strategy !== null ? <span className="text-brass-bright">{a.general.strategy}</span> : <Unknown />}
                  </p>
                )}
                <div className="flex gap-3 mt-1">
                  {Object.entries(a.regiments).map(([k, v]) => (
                    <span key={k} className="text-muted-foreground">{UNIT_LABELS[k]}: {v === null ? <Unknown /> : <span className="text-brass-bright">{v}</span>}</span>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        <div className="text-center mt-3">
          <Button size="sm" onClick={onClose}>Acknowledge</Button>
        </div>
      </div>
    </div>
  );
}