import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, UserPlus, Check } from "lucide-react";
import { isReachable, isLive } from "@/lib/presence";
import { playSfx } from "@/lib/sfx";

// Summon commanders who are on duty right now into this mustering front.
export default function InviteCommandersPanel({ game }) {
  const [rows, setRows] = useState(null);
  const [myCallsign, setMyCallsign] = useState(null);
  const [sent, setSent] = useState([]);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      const all = await base44.entities.UserProfile.list("-lastSeenAt", 100);
      setMyCallsign(all.find((p) => p.created_by_id === u.id)?.displayName || null);
      setRows(all.filter((p) => p.created_by_id !== u.id && isLive(p)));
    }).catch(() => setRows([]));
  }, []);

  const summon = async (p) => {
    playSfx("build");
    setSent((s) => [...s, p.id]);
    await base44.entities.LobbyInvite.create({
      gameId: game.id,
      gameName: game.name,
      toUserId: p.created_by_id,
      toCallsign: p.displayName,
      fromCallsign: myCallsign || "UNSIGNED",
      note: "A seat awaits you at this front.",
    });
  };

  return (
    <div className="cq-panel p-3 space-y-2">
      <p className="cq-label flex items-center gap-1.5 text-brass">
        <UserPlus className="w-3 h-3" /> Summon Commanders on Duty
      </p>
      {rows === null ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      ) : rows.length === 0 ? (
        <p className="font-mono text-[10px] text-muted-foreground tracking-widest py-2 text-center">
          NO COMMANDERS ON THE WIRE — SHARE THE INVITE LINK INSTEAD
        </p>
      ) : (
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {rows.map((p) => {
            const done = sent.includes(p.id);
            const reachable = isReachable(p);
            return (
              <div key={p.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-sm border border-border bg-secondary/30">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${reachable ? "bg-olive" : "bg-brass"}`} />
                <span className="font-heading uppercase tracking-widest text-xs text-secondary-foreground truncate">{p.displayName}</span>
                <span className="font-mono text-[9px] text-muted-foreground ml-auto shrink-0">
                  {reachable ? "ON DUTY" : "IN RESERVE"}
                </span>
                <button
                  disabled={done}
                  onClick={() => summon(p)}
                  className="font-heading uppercase tracking-widest text-[10px] text-brass hover:text-brass-bright disabled:text-olive shrink-0"
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : "Summon"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}