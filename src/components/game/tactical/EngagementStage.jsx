import React from "react";
import { Loader2 } from "lucide-react";
import StageFrame from "@/components/game/tactical/StageFrame";
import ResolutionElection from "@/components/game/tactical/ResolutionElection";
import DeploymentScreen from "@/components/game/tactical/DeploymentScreen";

// Routes a tactical engagement to its current stage: election → deployment → the field
export default function EngagementStage({ battle, busy, onAction }) {
  if (battle.mode === null) {
    return (
      <StageFrame>
        <ResolutionElection battle={battle} busy={busy} onElect={(mode) => onAction({ action: "battleSetMode", mode })} />
      </StageFrame>
    );
  }
  const t = battle.tactical;
  if (t?.status === "deploy" && !t.deployed[battle.myRole]) {
    return (
      <StageFrame wide>
        <DeploymentScreen tactical={t} battle={battle} busy={busy} onDeploy={(formations) => onAction({ action: "tacticalDeploy", formations })} />
      </StageFrame>
    );
  }
  return (
    <StageFrame>
      <div className="text-center pt-2 mb-3">
        <p className="cq-label text-rust">Set-Piece Engagement{t?.status === "fighting" ? ` — Round ${t.round}` : ""}</p>
        <h2 className="cq-display text-2xl">The Field at {battle.tileName}</h2>
      </div>
      <div className="border border-border rounded-sm bg-background/60 p-3 mb-3 max-h-40 overflow-y-auto space-y-1">
        {(t?.log || battle.log).map((line, i) => (
          <p key={i} className="text-[11px] font-mono text-muted-foreground border-l-2 border-brass/40 pl-2">{line}</p>
        ))}
      </div>
      <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-heading tracking-widest uppercase py-3">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        {t?.status === "deploy" ? "Your order of battle is sealed — the enemy staff is still drawing up theirs…" : "Runners carry orders across the field…"}
      </p>
    </StageFrame>
  );
}