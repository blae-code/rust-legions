import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import HexBoard from "@/components/hexmap/HexBoard";
import TilePanel from "@/components/game/TilePanel";
import PurchasePanel from "@/components/game/PurchasePanel";
import CombatLog from "@/components/game/CombatLog";
import LobbyView from "@/components/game/LobbyView";

export default function GamePage() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("gameEngine", { action: "getState", gameId });
      setGame(res.data);
    } catch (e) {
      setError(e.response?.data?.error || "Failed to load game");
    }
  }, [gameId]);

  useEffect(() => {
    refresh();
    pollRef.current = setInterval(refresh, 4000);
    return () => clearInterval(pollRef.current);
  }, [refresh]);

  const act = async (payload) => {
    setBusy(true);
    setError("");
    try {
      await base44.functions.invoke("gameEngine", { gameId, ...payload });
      await refresh();
    } catch (e) {
      setError(e.response?.data?.error || "Order failed");
    }
    setBusy(false);
  };

  if (!game) {
    return (
      <div className="flex justify-center py-20">
        {error ? <p className="text-red-400">{error}</p> : <Loader2 className="w-8 h-8 animate-spin text-stone-600" />}
      </div>
    );
  }

  if (game.status === "lobby") {
    return (
      <LobbyView
        game={game}
        busy={busy}
        error={error}
        onJoin={(factionId) => act({ action: "joinGame", factionId })}
        onStart={() => act({ action: "startGame" })}
      />
    );
  }

  const slotColors = Object.fromEntries(game.factions.map((f) => [f.slotIndex, f.color]));
  const currentFaction = game.factions[game.currentSlot];
  const selectedTile = game.tiles.find((t) => t.id === selectedId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 border border-stone-800 bg-[#1C1714] rounded-lg px-4 py-3">
        <div>
          <h1 className="font-bold uppercase tracking-widest text-stone-100">{game.name}</h1>
          <p className="text-xs text-stone-500">Turn {game.turnNumber} · {game.mode === "campaign" ? "Campaign" : "Multiplayer"}</p>
        </div>
        <div className="flex gap-2 flex-wrap ml-auto items-center">
          {game.factions.map((f) => (
            <div key={f.slotIndex} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded border ${
              game.currentSlot === f.slotIndex && game.status === "active" ? "border-amber-700" : "border-transparent"
            } ${f.eliminated ? "opacity-40 line-through" : ""}`}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: f.color }} />
              <span className="text-stone-300">{f.factionName}{f.isNPC && <span className="text-stone-600"> (NPC)</span>}</span>
            </div>
          ))}
        </div>
        {game.status === "active" && (
          game.isMyTurn ? (
            <Button size="sm" disabled={busy} onClick={() => act({ action: "endTurn" })} className="bg-amber-800 hover:bg-amber-700 uppercase text-xs tracking-wider">
              End Turn
            </Button>
          ) : (
            <span className="text-xs text-stone-500 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> {currentFaction?.factionName}'s turn
            </span>
          )
        )}
      </div>

      {game.status === "complete" && (
        <div className="border border-amber-800 bg-amber-950/30 rounded-lg p-4 text-center">
          <p className="uppercase tracking-widest text-amber-400 font-bold">
            {game.winnerName ? `${game.winnerName} has won the war` : "The war has ended"}
          </p>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <div className="border border-stone-800 bg-stone-950 rounded-lg p-2">
          <HexBoard
            tiles={game.tiles}
            slotColors={slotColors}
            selectedId={selectedId}
            onTileClick={(t) => setSelectedId(t.id === selectedId ? null : t.id)}
          />
        </div>
        <div className="space-y-4">
          {game.isMyTurn && game.status === "active" && (
            <div className="border border-amber-900/50 bg-amber-950/20 rounded-lg px-4 py-2 text-xs text-amber-400 uppercase tracking-wider">
              Your turn, Commander — treasury {game.myTreasury}₪
            </div>
          )}
          <TilePanel
            game={game}
            tile={selectedTile}
            busy={busy}
            onMove={(from, to, units) => act({ action: "moveUnits", fromTileId: from, toTileId: to, units })}
            onAttack={(from, to, units) => act({ action: "attack", fromTileId: from, toTileId: to, units })}
          />
          <PurchasePanel game={game} busy={busy} onPurchase={(tileId, units) => act({ action: "purchaseUnits", tileId, units })} />
          <CombatLog entries={game.combatLog} />
        </div>
      </div>
    </div>
  );
}