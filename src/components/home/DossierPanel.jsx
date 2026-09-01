import React from "react";
import WarEffortDial from "@/components/home/WarEffortDial";

// Compact service dossier — commander stats around a brass war-effort gauge
export default function DossierPanel({ profile, factionCount }) {
  const rows = [
    ["FRONTS FOUGHT", profile?.gamesPlayed ?? "—"],
    ["VICTORIES", profile?.gamesWon ?? "—"],
    ["CAMPAIGNS", profile?.campaignsCompleted ?? "—"],
    ["BANNERS", factionCount ?? "—"],
  ];
  return (
    <div className="cq-panel cq-brackets p-4">
      <p className="cq-label mb-1">Service Dossier</p>
      <div className="flex items-center gap-3 mb-3">
        <WarEffortDial won={profile?.gamesWon ?? 0} played={profile?.gamesPlayed ?? 0} />
        <p className="font-heading font-semibold tracking-wide text-foreground text-sm truncate">
          {profile?.displayName || "Unidentified Commander"}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="border border-border rounded-sm bg-background/50 px-2.5 py-1.5">
            <p className="font-mono text-[8px] text-muted-foreground tracking-[0.2em]">{label}</p>
            <p className="font-display text-xl text-brass-bright leading-none mt-0.5">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}