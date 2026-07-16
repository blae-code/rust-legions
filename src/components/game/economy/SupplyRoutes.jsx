import React from "react";
import { Anchor, AlertTriangle, Flag } from "lucide-react";

// Active supply network readout: hubs, coverage, and cut-off formations
export default function SupplyRoutes({ report, myBase }) {
  const { zones, hubs, cutOff, armiesOut } = report;
  const covered = zones.length - cutOff.length;
  return (
    <div className="space-y-3">
      <div className="cq-panel p-3">
        <div className="flex items-center justify-between">
          <p className="cq-label">Network coverage</p>
          <p className="font-mono text-xs text-secondary-foreground">{covered}/{zones.length} zones</p>
        </div>
        <div className="h-1.5 bg-secondary rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-olive" style={{ width: zones.length ? `${(covered / zones.length) * 100}%` : "0%" }} />
        </div>
      </div>
      <div>
        <p className="cq-label mb-1.5 flex items-center gap-1.5"><Anchor className="w-3 h-3" /> Supply hubs</p>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {hubs.map((h) => (
            <div key={h.id} className="flex items-center justify-between text-[11px] font-mono px-2 py-1 border border-border rounded-sm text-secondary-foreground">
              <span>{h.name}{h.isCapital && <span className="text-brass"> ★ Capital</span>}</span>
              {myBase?.tileId === h.id && <span className="text-brass-bright">FORTRESS-BASE</span>}
            </div>
          ))}
          {hubs.length === 0 && <p className="text-[11px] font-mono text-muted-foreground px-2">No hubs — build a Barracks or Fortifications</p>}
        </div>
      </div>
      {cutOff.length > 0 && (
        <div>
          <p className="cq-label mb-1.5 text-rust flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> Cut off from supply</p>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {cutOff.map((z) => (
              <p key={z.id} className="text-[11px] font-mono text-rust px-2 py-1 border border-rust/40 rounded-sm">{z.name}</p>
            ))}
          </div>
        </div>
      )}
      {armiesOut.length > 0 && (
        <div>
          <p className="cq-label mb-1.5 text-rust flex items-center gap-1.5"><Flag className="w-3 h-3" /> Formations out of supply</p>
          {armiesOut.map((a) => (
            <p key={a.id} className="text-[11px] font-mono text-rust px-2 py-1">The {a.name} is starving — attrition each turn</p>
          ))}
        </div>
      )}
      {cutOff.length === 0 && armiesOut.length === 0 && zones.length > 0 && (
        <p className="text-[11px] font-mono text-olive px-1">All zones and formations are on open supply lines.</p>
      )}
    </div>
  );
}