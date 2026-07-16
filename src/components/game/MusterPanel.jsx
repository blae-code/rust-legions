import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";
import { ARMY_UNIT_KEYS, REGIMENT_LABELS } from "@/lib/massCombat";
import GeneralPortrait from "@/components/game/GeneralPortrait";
import { base44 } from "@/api/base44Client";
import { compileDesign } from "@/lib/armyDesign";
import { costString } from "@/lib/units";

export default function MusterPanel({ game, tile, busy, onMuster }) {
  const [levy, setLevy] = useState({});
  const [generalId, setGeneralId] = useState("");
  const [designs, setDesigns] = useState([]);
  const [designId, setDesignId] = useState("");

  useEffect(() => { setLevy({}); setGeneralId(""); }, [tile?.id]);

  useEffect(() => {
    (async () => {
      const me = await base44.auth.me();
      setDesigns(await base44.entities.ArmyDesign.filter({ created_by_id: me.id }, "-updated_date"));
    })().catch(() => {});
  }, []);

  if (!tile || tile.visible === false || tile.isSea || !game.isMyTurn) return null;
  const st = tile.state || {};
  if (st.owner !== game.mySlot) return null;
  const hasBarracks = (st.buildings || []).some((b) => b.type === "barracks" && (b.level || 0) > 0);
  if (!hasBarracks) return null;

  const myArmies = (game.armies || []).filter((a) => a.owner === game.mySlot);
  const freeGenerals = (game.myGenerals || []).filter((g) => !myArmies.some((a) => a.general?.id === g.id));
  const total = ARMY_UNIT_KEYS.reduce((s, k) => s + (levy[k] || 0), 0);
  const chosen = generalId || (freeGenerals[0]?.id ?? "recruit");
  const recruitCost = game.generalCost?.manpower || 4;
  const canAffordRecruit = (game.myResources?.manpower || 0) >= recruitCost;
  const disabled = busy || total === 0 || (chosen === "recruit" && !canAffordRecruit);

  const step = (k, d) => setLevy((p) => ({ ...p, [k]: Math.max(Math.min((p[k] || 0) + d, st.units?.[k] || 0), 0) }));

  return (
    <div className="cq-panel cq-brackets p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Flag className="w-3.5 h-3.5 text-brass" />
        <h3 className="cq-label">Levy a Field Army</h3>
      </div>
      <p className="text-[10px] font-mono text-muted-foreground">Draw companies from the {tile.name} garrison into a mobile army under a general.</p>
      {ARMY_UNIT_KEYS.map((k) => (
        <div key={k} className="flex items-center justify-between text-xs">
          <span className="text-secondary-foreground font-heading tracking-wide">{REGIMENT_LABELS[k]} <span className="text-muted-foreground font-mono">({st.units?.[k] || 0} garrisoned)</span></span>
          <span className="flex items-center gap-2">
            <button onClick={() => step(k, -1)} className="w-5 h-5 border border-border rounded-sm text-muted-foreground hover:border-brass/60">−</button>
            <span className="font-mono w-5 text-center text-brass-bright">{levy[k] || 0}</span>
            <button onClick={() => step(k, 1)} className="w-5 h-5 border border-border rounded-sm text-muted-foreground hover:border-brass/60">+</button>
          </span>
        </div>
      ))}
      <div className="flex items-center gap-2">
        {chosen !== "recruit" && <GeneralPortrait general={freeGenerals.find((g) => g.id === chosen)} size={44} />}
        <select
          value={chosen}
          onChange={(e) => setGeneralId(e.target.value)}
          className="flex-1 min-w-0 bg-input border border-border rounded-sm text-xs px-2 py-1.5 text-secondary-foreground font-mono"
        >
          {freeGenerals.map((g) => (
            <option key={g.id} value={g.id}>{g.name}{g.supreme ? " ★" : ""}{g.traitLabel ? ` “${g.traitLabel}”` : ""} — Strategy {g.strategy}</option>
          ))}
          <option value="recruit">Commission a new general ({recruitCost} Manpower)</option>
        </select>
      </div>
      {chosen === "recruit" && !canAffordRecruit && <p className="text-[10px] text-rust font-mono">Insufficient manpower to commission a general.</p>}
      {designs.length > 0 && (
        <select
          value={designId}
          onChange={(e) => setDesignId(e.target.value)}
          className="w-full bg-input border border-border rounded-sm text-xs px-2 py-1.5 text-secondary-foreground font-mono"
        >
          <option value="">Standard pattern — no design</option>
          {designs.map((d) => {
            const cost = costString(compileDesign(d).cost);
            return <option key={d.id} value={d.id}>{d.name}{cost !== "Free" ? ` — +${cost}` : ""}</option>;
          })}
        </select>
      )}
      <Button size="sm" disabled={disabled} onClick={() => onMuster(tile.id, levy, chosen, designId || null)} className="w-full bg-brass hover:bg-brass-bright text-primary-foreground font-heading uppercase text-xs tracking-[0.2em]">
        Muster Army
      </Button>
    </div>
  );
}