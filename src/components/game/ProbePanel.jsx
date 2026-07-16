import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import IntelReport from "@/components/game/IntelReport";

export default function ProbePanel({ game, tile, busy, onProbe }) {
  const [intel, setIntel] = useState(null);
  if (!tile || tile.visible === false || tile.isSea) return null;
  if (!game.isMyTurn || game.status !== "active") return null;
  const owner = tile.state?.owner;
  if (owner === game.mySlot) return null;
  const adjacentToMe =
    (tile.adjacentIds || []).some((aid) => game.tiles.find((t) => t.id === aid)?.state?.owner === game.mySlot) ||
    (game.armies || []).some((a) => a.owner === game.mySlot && (tile.adjacentIds || []).includes(a.tileId));
  if (!adjacentToMe) return null;

  const handleProbe = async () => {
    const result = await onProbe(tile.id);
    if (result) setIntel(result);
  };

  return (
    <div className="cq-panel p-3">
      <p className="cq-label mb-2">Reconnaissance</p>
      <p className="text-[10px] font-mono text-muted-foreground mb-2">
        Send a scout patrol into {tile.name} to gather partial intel on its garrison, defenses, and enemy commanders before committing to battle.
      </p>
      <Button size="sm" variant="outline" disabled={busy || (game.myResources?.fuel || 0) < 1} onClick={handleProbe} className="w-full">
        <Eye className="w-3.5 h-3.5" /> Send Scouts · ⛽ 1
      </Button>
      {(game.myResources?.fuel || 0) < 1 && (
        <p className="text-[9px] font-mono text-rust mt-1">Insufficient fuel for a patrol.</p>
      )}
      <IntelReport intel={intel} onClose={() => setIntel(null)} />
    </div>
  );
}