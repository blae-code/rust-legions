import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import GameChat from "@/components/game/chat/GameChat";
import HostLobbyPanel from "@/components/game/lobby/HostLobbyPanel";
import LobbySlotRow from "@/components/game/lobby/LobbySlotRow";
import { getImage } from "@/lib/imageLibrary";
import { WORLDS } from "@/lib/macro/worlds";

export default function LobbyView({ game, onJoin, onStart, onAction, busy, error }) {
  const [myFactions, setMyFactions] = useState([]);
  const [factionId, setFactionId] = useState("");
  const [copied, setCopied] = useState(false);

  const iAmIn = game.mySlot !== null && game.mySlot !== undefined;
  const openSlots = game.factions.filter((f) => f.isOpen).length;

  useEffect(() => {
    if (!iAmIn) {
      base44.auth.me().then((u) =>
        base44.entities.Faction.filter({ created_by_id: u.id }).then(setMyFactions)
      );
    }
  }, [iAmIn]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="cq-panel p-6 relative overflow-hidden isolate">
        {getImage("bg_lobby") && (
          <img src={getImage("bg_lobby")} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-[0.15] pointer-events-none select-none -z-10" />
        )}
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <h2 className="cq-display text-3xl mb-1 mt-1">{game.name}</h2>
        <p className="cq-label mb-4">
          Staging area — waiting for commanders
          {" · "}Theater:{" "}
          <Link
            to={`/star-map?planet=${game.planetId || "cindara"}`}
            className="text-brass hover:text-brass-bright transition-colors"
            title="Survey the theater on the War Table"
          >
            {WORLDS.find((p) => p.id === game.planetId)?.name || "Cindara"}
          </Link>
        </p>
        <div className="space-y-2">
          {game.factions.map((f) => (
            <LobbySlotRow
              key={f.slotIndex}
              faction={f}
              isHost={game.isHost}
              busy={busy}
              onSetSlotType={(slotIndex, type, doctrine) => onAction({ action: "setSlotType", slotIndex, type, doctrine })}
            />
          ))}
        </div>

        {game.isHost && (
          <div className="mt-4">
            <HostLobbyPanel game={game} busy={busy} onConfigure={(cfg) => onAction({ action: "configureLobby", ...cfg })} />
          </div>
        )}

        {!iAmIn && openSlots > 0 && (
          <div className="mt-4 flex gap-2">
            <select
              value={factionId}
              onChange={(e) => setFactionId(e.target.value)}
              className="flex-1 bg-input border border-border rounded-sm text-sm p-2 text-secondary-foreground font-heading tracking-wide"
            >
              <option value="">Choose your faction…</option>
              {myFactions.map((f) => (
                <option key={f.id} value={f.id}>{f.factionName}</option>
              ))}
            </select>
            <Button disabled={!factionId || busy} onClick={() => onJoin(factionId)} className="bg-brass hover:bg-brass-bright text-primary-foreground font-heading uppercase text-xs tracking-[0.2em]">
              Join War
            </Button>
          </div>
        )}
        {!iAmIn && myFactions.length === 0 && (
          <p className="text-xs text-muted-foreground mt-2">You need a faction first — visit the Faction Builder.</p>
        )}

        {error && <p className="text-xs text-rust mt-2 font-mono">{error}</p>}

        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" onClick={copyLink} className="border-border text-secondary-foreground text-xs font-heading tracking-wide">
            {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            {copied ? "Copied" : "Copy invite link"}
          </Button>
          {game.isHost && (
            <Button
              size="sm"
              disabled={openSlots > 0 || busy}
              onClick={onStart}
              className="bg-rust hover:bg-destructive text-destructive-foreground font-heading uppercase text-xs tracking-[0.2em] ml-auto"
            >
              {openSlots > 0 ? `Waiting for ${openSlots} more` : "Declare War"}
            </Button>
          )}
        </div>
      </div>

      <GameChat gameId={game.id} myName={game.factions.find((f) => f.isMe)?.factionName || "Commander"} />
    </div>
  );
}