import React from "react";

export default function CombatLog({ entries = [] }) {
  return (
    <div className="cq-panel cq-brackets p-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="cq-label">Field Reports</h3>
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        <span className="w-1.5 h-1.5 rounded-full bg-rust text-rust cq-lamp animate-pulse" />
      </div>
      <div className="space-y-1.5 max-h-52 overflow-y-auto text-xs">
        {entries.length === 0 && <p className="text-muted-foreground">No engagements reported.</p>}
        {[...entries].reverse().map((e, i) => (
          <div key={i} className="text-muted-foreground border-l-2 border-brass/40 pl-2">
            <span className="text-steel font-mono mr-1">T{e.turn}</span>
            {e.type === "event" ? (
              <span className="text-brass">{e.text}</span>
            ) : (
              <span>
                <span className="text-secondary-foreground">{e.attacker}</span> assaulted{" "}
                <span className="text-secondary-foreground">{e.tileName}</span> ({e.defender}) —{" "}
                {e.outcome === "captured" && <span className="text-olive font-semibold">zone captured</span>}
                {e.outcome === "repelled" && <span className="text-rust font-semibold">assault repelled</span>}
                {e.outcome === "retreated" && <span className="text-brass-bright font-semibold">forces withdrew</span>}
                {" "}· losses {e.attLosses}/{e.defLosses}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}