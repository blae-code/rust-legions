import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { playSfx } from "@/lib/sfx";
import BattleForce from "@/components/game/BattleForce";
import BattleDiorama from "@/components/game/BattleDiorama";
import InitiativeTracker from "@/components/game/InitiativeTracker";
import BattleSparks from "@/components/game/BattleSparks";
import { ALL_MANEUVERS, MANEUVER_KEYS, SIGNATURE_MANEUVERS, SIGNATURE_COOLDOWNS } from "@/lib/massCombat";
import { WEATHER_META } from "@/lib/weather";

export default function BattleView({ battle, busy, onChoose }) {
  const [fx, setFx] = useState(0);
  const [shaking, setShaking] = useState(false);
  const prevRound = useRef(0);

  // A round resolved — fire sparks and shake the war table
  useEffect(() => {
    const r = battle?.round || 0;
    if (prevRound.current > 0 && r > prevRound.current) setFx(Date.now());
    prevRound.current = r;
  }, [battle?.round]);

  useEffect(() => {
    if (!fx) return;
    setShaking(true);
    const t = setTimeout(() => setShaking(false), 550);
    return () => clearTimeout(t);
  }, [fx]);

  // Contact — the guns open up the moment the battle screen forms
  const prevBattle = useRef(false);
  useEffect(() => {
    if (battle && !prevBattle.current) playSfx("attack");
    prevBattle.current = !!battle;
  }, [battle]);

  if (!battle) return null;
  const iAmAttacker = battle.myRole === "attacker";
  const mySide = iAmAttacker ? battle.attacker : battle.defender;
  const maneuverKeys = [...MANEUVER_KEYS];
  if (mySide.signature && SIGNATURE_MANEUVERS[mySide.signature]) maneuverKeys.push(mySide.signature);
  const sigCooldown = mySide.sigCooldown || 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 26, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
        className={`cq-panel cq-brackets w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 relative ${shaking ? "cq-shake" : ""}`}
      >
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <BattleSparks burst={fx} />
        <div className="text-center pt-2 mb-4">
          <p className="cq-label text-rust">Mass Battle — Round {battle.round}</p>
          <h2 className="cq-display text-2xl">The Battle of {battle.tileName}</h2>
          {(battle.fortBonus > 0 || battle.terrainBonus > 0) && (
            <p className="font-mono text-[9px] text-steel mt-0.5">
              {battle.fortBonus > 0 && <>DEFENDER ENTRENCHED · FORTIFICATION +{battle.fortBonus}</>}
              {battle.fortBonus > 0 && battle.terrainBonus > 0 && " · "}
              {battle.terrainBonus > 0 && <>{battle.terrain?.toUpperCase()} TERRAIN +{battle.terrainBonus} DEF</>}
            </p>
          )}
          {(battle.attacker?.elevMod || 0) !== 0 && (
            <p className="font-mono text-[9px] text-steel mt-0.5">
              {battle.attacker.elevMod < 0 ? "UPHILL ASSAULT — ATTACKER −1" : "DOWNHILL ATTACK — ATTACKER +1"}
            </p>
          )}
          {battle.weather && battle.weather !== "clear" && (
            <p className="font-mono text-[9px] text-brass mt-0.5">
              {WEATHER_META[battle.weather]?.icon} {WEATHER_META[battle.weather]?.label.toUpperCase()} — {battle.weather === "rain" ? "ATTACKER −1" : battle.weather === "snow" ? "ATTACKER −1 · ARMOR FROZEN" : battle.weather === "fog" ? "DEFENDER −1" : "AIRCRAFT GROUNDED"}
            </p>
          )}
        </div>

        <BattleDiorama attacker={battle.attacker} defender={battle.defender} fx={fx} />

        <InitiativeTracker attacker={battle.attacker} defender={battle.defender} round={battle.round} />

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
              {maneuverKeys.map((key) => {
                const sig = !!SIGNATURE_MANEUVERS[key];
                const onCooldown = sig && sigCooldown > 0;
                return (
                  <button
                    key={key}
                    disabled={busy || onCooldown}
                    onClick={() => onChoose(key)}
                    onMouseEnter={() => playSfx("hover")}
                    className={`text-left border rounded-sm p-2.5 transition-colors disabled:opacity-50 ${
                      onCooldown ? "border-rust/50 bg-rust/5 cursor-not-allowed" : sig ? "border-brass/70 bg-brass/10 hover:bg-brass/20" : "border-border hover:border-brass/70 hover:bg-brass/10"
                    }`}
                  >
                    <p className={`text-xs font-heading font-semibold tracking-wide ${onCooldown ? "text-muted-foreground" : sig ? "text-brass-bright" : "text-secondary-foreground"}`}>{ALL_MANEUVERS[key].icon} {ALL_MANEUVERS[key].label}</p>
                    <p className="text-[9px] font-mono text-muted-foreground mt-0.5 leading-snug">{ALL_MANEUVERS[key].desc}</p>
                    {sig && (
                      onCooldown ? (
                        <p className="text-[9px] font-mono text-rust mt-1 tracking-widest">⚙ RECHARGING · {sigCooldown} ROUND{sigCooldown === 1 ? "" : "S"}</p>
                      ) : (
                        <p className="text-[9px] font-mono text-brass/70 mt-1 tracking-widest">COOLDOWN AFTER USE · {SIGNATURE_COOLDOWNS[key] || 3} ROUNDS</p>
                      )
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-heading tracking-widest uppercase py-3">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Couriers race to the enemy command post…
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}