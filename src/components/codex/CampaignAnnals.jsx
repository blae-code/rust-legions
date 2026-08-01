import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { WORLDS } from "@/lib/macro/worlds";
import CodexEntry from "./CodexEntry";

// The Annals — outcomes of every campaign fought to a conclusion.
export default function CampaignAnnals() {
  const [wars, setWars] = useState(null);

  useEffect(() => {
    base44.entities.Game.filter({ status: "complete" }, "-updated_date", 40)
      .then(setWars)
      .catch(() => setWars([]));
  }, []);

  if (!wars) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-brass" />
      </div>
    );
  }

  if (wars.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-sm p-6 text-center space-y-2">
        <p className="font-heading uppercase tracking-[0.2em] text-sm text-brass">No campaigns concluded</p>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          The annals record only wars fought to their end. Carry a campaign to victory — or to the
          Ministry's forced decision — and its outcome is filed here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {wars.map((g) => {
        const winner = g.factionSlots?.[g.winnerSlot];
        const planet = WORLDS.find((w) => w.id === g.planetId)?.name || "Cindara";
        const captures = (g.combatLog || []).filter((e) => e.type === "capture").length;
        const battles = (g.combatLog || []).filter((e) => e.type === "combat").length;
        return (
          <CodexEntry
            key={g.id}
            title={g.name}
            subtitle={`${planet.toUpperCase()} · ${g.turnNumber} DAYS`}
            accent={winner?.color}
          >
            <p className="text-secondary-foreground">
              {winner
                ? `${winner.factionName} carried the war after ${g.turnNumber} days on ${planet}.`
                : `The war on ${planet} ended after ${g.turnNumber} days with no faction holding the field.`}
            </p>
            <p className="font-mono text-[10px] tracking-widest">
              {battles} MASS BATTLE{battles === 1 ? "" : "S"} · {captures} SETTLEMENT{captures === 1 ? "" : "S"} CHANGED HANDS · {(g.factionSlots || []).length} BELLIGERENTS
            </p>
            <p className="text-[11px]">
              Belligerents: {(g.factionSlots || []).map((s) => s.factionName || "Unclaimed").join(" · ")}
            </p>
          </CodexEntry>
        );
      })}
    </div>
  );
}