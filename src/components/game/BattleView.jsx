import React from "react";
import { Loader2 } from "lucide-react";
import BattleForce from "@/components/game/BattleForce";
import { MANEUVERS, MANEUVER_KEYS } from "@/lib/massCombat";

export default function BattleView({ battle, busy, onChoose }) {
  if (!battle) return null;
  const iAmAttacker = battle.myRole === "attacker";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="cq-panel cq-brackets w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 relative">
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <div className="text-center pt-2 mb-4">
          <p className="cq-label text-rust">Mass Battle — Round {battle.round}</p>
          <h2 className="cq-display text-2xl">The Battle of {battle.tileName}</h2>
          {battle.fortBonus > 0 && <p className="font-mono text-[9px] text-steel mt-0.5">DEFENDER ENTRENCHED · FORTIFICATION +{battle.fortBonus}</p>}
        </div>

        <div className="flex gap-3 mb-4">
          <BattleForce side={battle.attacker} title="Attacker" accent="#C9752E" isMe={iAmAttacker} />
          <BattleForce side={battle.defender} title="Defender" accent="#7A93A5" isMe={!iAmAttacker} />
        </div>

        <div className="border border-border rounded-sm bg-background/60 p-3 mb-4 max-h-36 overflow-y-auto space-y-1">
          {battle.log.map((line, i) => (
            <p key={i} className="text-[11px] font-mono text-muted-foreground border-l-2 border-brass/40 pl-2">{line}</p>
          ))}
        </div>

        {battle.waitingOnMe ? (
          <div>
            <p className="cq-label mb-2">Issue orders, General</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MANEUVER_KEYS.map((key) => (
                <button
                  key={key}
                  disabled={busy}
                  onClick={() => onChoose(key)}
                  className="text-left border border-border hover:border-brass/70 hover:bg-brass/10 rounded-sm p-2.5 transition-colors disabled:opacity-50"
                >
                  <p className="text-xs font-heading font-semibold tracking-wide text-secondary-foreground">{MANEUVERS[key].icon} {MANEUVERS[key].label}</p>
                  <p className="text-[9px] font-mono text-muted-foreground mt-0.5 leading-snug">{MANEUVERS[key].desc}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-heading tracking-widest uppercase py-3">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Couriers race to the enemy command post…
          </p>
        )}
      </div>
    </div>
  );
}