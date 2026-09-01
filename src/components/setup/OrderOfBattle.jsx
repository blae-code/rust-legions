import React from "react";
import { motion } from "framer-motion";
import { Loader2, Swords } from "lucide-react";
import { WORLDS } from "@/lib/macro/worlds";
import { WorldSilhouette } from "@/components/setup/PlanetPicker";
import { DOCTRINE_META } from "@/components/setup/FactionSelect";

function Line({ label, value, tone = "text-foreground" }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-border/60 py-1">
      <span className="font-mono text-[8px] text-muted-foreground tracking-[0.2em] shrink-0">{label}</span>
      <span className={`font-heading text-[11px] uppercase tracking-[0.1em] text-right truncate ${tone}`}>{value}</span>
    </div>
  );
}

// The live requisition summary — updates as the directive is drafted, ends in the muster order.
export default function OrderOfBattle({
  name, factionName, planetId, mapName, humanCount, npcs, isCampaign,
  winType, winValue, canCreate, creating, error, onCreate,
}) {
  const world = WORLDS.find((w) => w.id === planetId);
  const totalSlots = humanCount + npcs.length;

  return (
    <div className="cq-slip p-4 xl:sticky xl:top-4">
      <p className="cq-label text-brass/80">Order of Battle</p>
      <div className="cq-hazard my-2 opacity-50" />

      {world && (
        <motion.div key={world.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative rounded-sm border border-border overflow-hidden mb-2">
          <WorldSilhouette world={world} className="w-full h-20" />
          <div className="absolute inset-0 cq-scanlines opacity-30 pointer-events-none" />
          <span className="absolute bottom-1 left-2 font-display text-sm tracking-[0.2em] text-brass-bright drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] uppercase">
            {world.name}
          </span>
        </motion.div>
      )}

      <Line label="OPERATION" value={name || "— UNNAMED —"} tone={name ? "text-brass-bright" : "text-muted-foreground/60"} />
      <Line label="MODE" value={isCampaign ? "Solo Campaign" : "Multiplayer Front"} tone={isCampaign ? "text-rust" : "text-foreground"} />
      <Line label="BANNER" value={factionName || "— NO BANNER —"} tone={factionName ? "text-foreground" : "text-rust"} />
      <Line label="CHART" value={mapName || "Generated theater"} />
      <Line label="SEATS" value={`${humanCount} HUMAN · ${npcs.length} MACHINE`} />
      {isCampaign && (
        <Line label="VICTORY" value={winType === "survive" ? `Survive ${winValue} days` : `Hold ${winValue}% of settlements`} tone="text-brass-bright" />
      )}

      {/* Force composition strip */}
      <div className="flex gap-1 mt-2.5">
        {Array.from({ length: 4 }).map((_, i) => {
          const isHuman = i < humanCount;
          const npc = npcs[i - humanCount];
          const filled = i < totalSlots;
          const D = npc ? DOCTRINE_META[npc] : null;
          return (
            <div key={i} className={`flex-1 h-2 rounded-sm ${
              !filled ? "border border-dashed border-border" : isHuman ? "bg-brass/70" : "bg-rust/60"
            }`} title={!filled ? "Empty" : isHuman ? "Human commander" : `NPC — ${D?.label}`} />
          );
        })}
      </div>
      <div className="flex justify-between font-mono text-[7px] text-muted-foreground/70 tracking-[0.2em] mt-1">
        <span>■ HUMAN</span><span>■ MACHINE</span><span>□ EMPTY</span>
      </div>

      {error && (
        <p className="font-mono text-[10px] text-rust tracking-wide mt-2.5 border border-rust/40 bg-rust/10 rounded-sm px-2 py-1.5">{error}</p>
      )}

      <motion.button
        whileTap={{ scale: 0.98 }}
        disabled={!canCreate || creating}
        onClick={onCreate}
        className="cq-metal cq-warning-edge relative w-full mt-3 h-12 rounded-sm border border-rust/70 bg-rust text-destructive-foreground font-heading uppercase tracking-[0.3em] text-sm flex items-center justify-center gap-2 pl-4 disabled:opacity-40 disabled:pointer-events-none hover:brightness-110 transition-all"
      >
        {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
        {creating ? "Mustering…" : "Muster Forces"}
      </motion.button>
      <p className="font-mono text-[8px] text-muted-foreground/50 tracking-[0.2em] text-center mt-2">
        {canCreate ? "THE MINISTRY AWAITS YOUR SIGNATURE" : "SELECT A BANNER AND FILL AT LEAST TWO SEATS"}
      </p>
    </div>
  );
}