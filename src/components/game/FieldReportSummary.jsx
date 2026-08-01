import React, { useMemo } from "react";

// Ministry field report — a living tally of the war, compiled from the combat
// log. Re-renders on every state poll, so it updates as turns resolve.
export default function FieldReportSummary({ entries = [], factions = [], turnNumber }) {
  const report = useMemo(() => {
    const byName = {};
    for (const f of factions) {
      byName[f.factionName] = { faction: f, assaults: 0, victories: 0, seized: 0, inflicted: 0, suffered: 0 };
    }
    let lastAction = null;
    for (const e of entries) {
      if (e.type === "combat") {
        const att = byName[e.attacker];
        const def = byName[e.defender];
        if (att) {
          att.assaults += 1;
          if (e.outcome === "captured") att.victories += 1;
          att.inflicted += e.defLosses || 0;
          att.suffered += e.attLosses || 0;
        }
        if (def) {
          if (e.outcome !== "captured") def.victories += 1;
          def.inflicted += e.attLosses || 0;
          def.suffered += e.defLosses || 0;
        }
        lastAction = e;
      } else if (e.type === "capture") {
        if (byName[e.faction]) byName[e.faction].seized += 1;
      }
    }
    return { rows: Object.values(byName).filter((r) => !r.faction.eliminated), lastAction };
  }, [entries, factions]);

  const totalBattles = entries.filter((e) => e.type === "combat").length;

  return (
    <div className="cq-panel cq-brackets relative overflow-hidden p-4">
      <div className="cq-hazard absolute top-0 left-0 right-0" />
      <div className="flex items-baseline gap-2 pt-1 mb-1">
        <h3 className="cq-label">Field Report</h3>
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        <span className="font-mono text-[9px] text-muted-foreground tracking-widest">DAY {turnNumber}</span>
      </div>
      <p className="font-mono text-[9px] text-muted-foreground tracking-widest mb-3">
        {totalBattles} ENGAGEMENT{totalBattles === 1 ? "" : "S"} ON RECORD · COMPILED BY THE SIGNALS DIRECTORATE
      </p>

      <div className="space-y-2">
        {report.rows.map(({ faction, assaults, victories, seized, inflicted, suffered }) => (
          <div key={faction.slotIndex} className="border border-border rounded-sm bg-secondary/30 px-2.5 py-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-full ring-1 ring-black/50" style={{ background: faction.color }} />
              <span className="font-heading uppercase tracking-wide text-xs text-secondary-foreground">
                {faction.factionName}
              </span>
              {faction.isNPC && <span className="font-mono text-[8px] text-muted-foreground">NPC</span>}
            </div>
            <div className="grid grid-cols-4 gap-1 text-center">
              {[
                ["ASSAULTS", assaults, "text-foreground"],
                ["VICTORIES", victories, "text-brass-bright"],
                ["SEIZED", seized, "text-olive"],
                ["LOSSES", suffered, "text-rust"],
              ].map(([label, value, tone]) => (
                <div key={label}>
                  <p className={`font-mono text-sm leading-none ${tone}`}>{value}</p>
                  <p className="font-mono text-[7px] text-muted-foreground tracking-widest mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <p className="font-mono text-[8px] text-muted-foreground tracking-widest mt-1 text-center">
              COMPANIES BROKEN: {inflicted} INFLICTED / {suffered} SUFFERED
            </p>
          </div>
        ))}
      </div>

      {report.lastAction && (
        <p className="font-mono text-[9px] text-brass mt-3 border-t border-border pt-2">
          LAST ENGAGEMENT — T{report.lastAction.turn} · {report.lastAction.attacker?.toUpperCase()} VS{" "}
          {report.lastAction.defender?.toUpperCase()} AT {report.lastAction.tileName?.toUpperCase()} ·{" "}
          {report.lastAction.outcome?.toUpperCase()}
        </p>
      )}
      {!report.lastAction && (
        <p className="font-mono text-[9px] text-muted-foreground mt-3 border-t border-border pt-2">
          NO ENGAGEMENTS YET — THE FRONT IS QUIET.
        </p>
      )}
    </div>
  );
}