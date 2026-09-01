import React from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { playSfx } from "@/lib/sfx";

// Summons from mustering lobbies — accept to march straight to the staging area.
export default function InviteInbox({ invites, onRefresh, onClose }) {
  const navigate = useNavigate();

  const respond = async (invite, status) => {
    playSfx("select");
    await base44.entities.LobbyInvite.update(invite.id, { status });
    await onRefresh();
    if (status === "accepted") {
      onClose?.();
      navigate(`/game/${invite.gameId}`);
    }
  };

  if (invites.length === 0) {
    return <p className="font-mono text-[10px] text-muted-foreground tracking-widest py-3 text-center">NO SUMMONS PENDING</p>;
  }

  return (
    <div className="space-y-1.5">
      {invites.map((inv) => (
        <div key={inv.id} className="cq-slip p-2.5 space-y-1.5">
          <p className="font-heading uppercase tracking-widest text-xs text-brass-bright truncate">{inv.gameName || "Unnamed front"}</p>
          <p className="font-mono text-[9px] text-muted-foreground tracking-widest">SUMMONED BY {(inv.fromCallsign || "UNKNOWN").toUpperCase()}</p>
          {inv.note && <p className="font-mono text-[10px] text-secondary-foreground">{inv.note}</p>}
          <div className="flex gap-1.5 pt-0.5">
            <Button size="sm" onClick={() => respond(inv, "accepted")} className="flex-1 text-[10px] h-7">Report In</Button>
            <Button size="sm" variant="outline" onClick={() => respond(inv, "declined")} className="text-[10px] h-7">Decline</Button>
          </div>
        </div>
      ))}
    </div>
  );
}