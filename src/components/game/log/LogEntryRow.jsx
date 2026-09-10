import React from "react";

const TONE = {
  combat: "border-rust/60",
  capture: "border-olive/60",
  march: "border-steel/60",
  event: "border-brass/40",
};

// One line of the running war log — styled by the kind of report it is
export default function LogEntryRow({ entry: e, fresh }) {
  return (
    <div
      className={`border-l-2 pl-2 py-0.5 text-muted-foreground transition-colors duration-1000 ${TONE[e.type] || TONE.event} ${
        fresh ? "bg-brass/10" : "bg-transparent"
      }`}
    >
      <span className="text-steel font-mono mr-1">T{e.turn}</span>
      {e.type === "march" ? (
        <span>
          <span className="text-secondary-foreground">{e.columnName}</span> marches
          {e.from && <span> from <span className="text-secondary-foreground">{e.from}</span></span>}
          {" "}to <span className="text-brass-bright">{e.tileName}</span>
          {e.etaDays ? <span className="text-steel"> · {e.etaDays}d out</span> : null}
        </span>
      ) : e.type === "capture" ? (
        <span>
          <span className="text-brass-bright font-semibold">{e.faction}</span> seized{" "}
          <span className="text-secondary-foreground">{e.isCapital ? "★ " : ""}{e.tileName}</span>
          {e.from && <span> from <span className="text-secondary-foreground">{e.from}</span></span>}
          {e.resource && <span className="text-olive"> · +{e.amount}/turn</span>}
        </span>
      ) : e.type === "combat" ? (
        <span>
          <span className="text-secondary-foreground">{e.attacker}</span> assaulted{" "}
          <span className="text-secondary-foreground">{e.tileName}</span> ({e.defender}) —{" "}
          {e.outcome === "captured" && <span className="text-olive font-semibold">ground taken</span>}
          {e.outcome === "repelled" && <span className="text-rust font-semibold">assault repelled</span>}
          {e.outcome === "retreated" && <span className="text-brass-bright font-semibold">forces withdrew</span>}
          {" "}· losses {e.attLosses}/{e.defLosses}
        </span>
      ) : (
        <span className="text-brass">{e.text}</span>
      )}
    </div>
  );
}