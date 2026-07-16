import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export default function LobbyView({ game, onJoin, onStart, busy, error }) {
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
      <div className="border border-stone-800 bg-[#1C1714] rounded-lg p-6">
        <h2 className="text-xl font-bold uppercase tracking-widest text-stone-100 mb-1">{game.name}</h2>
        <p className="text-xs text-stone-500 mb-4">Staging area — waiting for commanders</p>
        <div className="space-y-2">
          {game.factions.map((f) => (
            <div key={f.slotIndex} className="flex items-center gap-3 border border-stone-800 rounded p-3">
              <div className="w-3 h-3 rounded-full" style={{ background: f.color }} />
              <span className="text-sm text-stone-300 flex-1">
                {f.factionName || <span className="text-stone-600 italic">Open slot — awaiting commander</span>}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-stone-500">
                {f.isNPC ? `NPC · ${f.doctrine}` : f.isMe ? "You" : f.isOpen ? "Open" : "Player"}
              </span>
            </div>
          ))}
        </div>

        {!iAmIn && openSlots > 0 && (
          <div className="mt-4 flex gap-2">
            <select
              value={factionId}
              onChange={(e) => setFactionId(e.target.value)}
              className="flex-1 bg-stone-900 border border-stone-700 rounded text-sm p-2 text-stone-300"
            >
              <option value="">Choose your faction…</option>
              {myFactions.map((f) => (
                <option key={f.id} value={f.id}>{f.factionName}</option>
              ))}
            </select>
            <Button disabled={!factionId || busy} onClick={() => onJoin(factionId)} className="bg-amber-800 hover:bg-amber-700 uppercase text-xs tracking-wider">
              Join War
            </Button>
          </div>
        )}
        {!iAmIn && myFactions.length === 0 && (
          <p className="text-xs text-stone-500 mt-2">You need a faction first — visit the Faction Builder.</p>
        )}

        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" onClick={copyLink} className="border-stone-700 text-stone-300 text-xs">
            {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            {copied ? "Copied" : "Copy invite link"}
          </Button>
          {game.isHost && (
            <Button
              size="sm"
              disabled={openSlots > 0 || busy}
              onClick={onStart}
              className="bg-red-900 hover:bg-red-800 uppercase text-xs tracking-wider ml-auto"
            >
              {openSlots > 0 ? `Waiting for ${openSlots} more` : "Declare War"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}