import React from "react";
import { Link } from "react-router-dom";
import WarEffortDial from "@/components/home/WarEffortDial";
import RankPlate from "@/components/home/dossier/RankPlate";
import DecorationStrip from "@/components/home/dossier/DecorationStrip";
import CommandTip from "@/components/ui/CommandTip";
import { decorationsFor } from "@/lib/serviceRecord";
import { playSfx } from "@/lib/sfx";
import { Medal, Flag } from "lucide-react";

const PRESENCE = {
  on_duty: { label: "On Duty", tone: "text-olive border-olive/60" },
  reserve: { label: "Reserve", tone: "text-brass border-brass/50" },
  dark: { label: "Gone Dark", tone: "text-muted-foreground border-border" },
};

// Service dossier — the commander's record, stamped as a Ministry file card.
export default function DossierPanel({ profile, factionCount }) {
  const presence = PRESENCE[profile?.presence || "on_duty"];
  const decorations = decorationsFor(profile || {}, factionCount ?? 0);
  const played = profile?.gamesPlayed ?? 0;
  const won = profile?.gamesWon ?? 0;
  const rows = [
    ["FRONTS FOUGHT", played, "Multiplayer wars entered."],
    ["VICTORIES", won, "Fronts carried to a decisive end."],
    ["LOSSES", Math.max(0, played - won), "Fronts fought and lost — recorded without comment."],
    ["CAMPAIGNS", profile?.campaignsCompleted ?? 0, "Solo campaigns seen through to their win condition."],
    ["BANNERS", factionCount ?? 0, "Factions forged in the Foundry."],
    ["CHARTS", profile?.mapsCreated ?? 0, "War charts drafted and filed."],
  ];

  return (
    <div className="cq-slip p-3.5">
      <div className="flex items-center justify-between mb-2">
        <p className="cq-label text-brass/80">Service Dossier</p>
        <span className={`cq-tag ${presence.tone}`}>{presence.label}</span>
      </div>
      <div className="cq-hazard mb-2.5 opacity-50" />

      <div className="flex items-start gap-3">
        <WarEffortDial won={won} played={played} />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div>
            <p className="font-mono text-[8px] text-muted-foreground tracking-[0.2em]">CALLSIGN</p>
            <p className="font-display text-lg text-brass-bright leading-none tracking-[0.08em] truncate">
              {profile?.displayName || "Unidentified"}
            </p>
          </div>
          <RankPlate wins={won} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 mt-3">
        {rows.map(([label, value, tip]) => (
          <CommandTip key={label} title={label} body={tip} side="top">
            <div className="border border-border rounded-sm bg-background/50 px-2 py-1.5">
              <p className="font-mono text-[7px] text-muted-foreground tracking-[0.18em] truncate">{label}</p>
              <p className="font-display text-lg text-brass-bright leading-none mt-0.5">{value}</p>
            </div>
          </CommandTip>
        ))}
      </div>

      <div className="mt-3">
        <DecorationStrip decorations={decorations} />
      </div>

      <div className="grid grid-cols-2 gap-1.5 mt-3">
        <Link
          to="/leaderboard"
          onClick={() => playSfx("select")}
          className="cq-metal flex items-center justify-center gap-1.5 rounded-sm border border-border hover:border-brass/60 px-2 py-1.5 font-heading uppercase tracking-[0.15em] text-[9px] text-muted-foreground hover:text-brass-bright transition-colors"
        >
          <Medal className="w-3 h-3" /> Roll of Honour
        </Link>
        <Link
          to="/faction-builder"
          onClick={() => playSfx("select")}
          className="cq-metal flex items-center justify-center gap-1.5 rounded-sm border border-border hover:border-brass/60 px-2 py-1.5 font-heading uppercase tracking-[0.15em] text-[9px] text-muted-foreground hover:text-brass-bright transition-colors"
        >
          <Flag className="w-3 h-3" /> Forge Banner
        </Link>
      </div>

      <p className="font-mono text-[8px] text-muted-foreground/50 tracking-[0.22em] text-center pt-2.5">
        FILE {(profile?.displayName || "UNKNOWN").slice(0, 4).toUpperCase()}-{String(played).padStart(3, "0")} · MINISTRY PERSONNEL BUREAU
      </p>
    </div>
  );
}