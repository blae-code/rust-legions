import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, DoorOpen, RotateCw, Plus } from "lucide-react";
import { playSfx } from "@/lib/sfx";
import FrontMusterCard from "@/components/home/fronts/FrontMusterCard";
import CommandTip from "@/components/ui/CommandTip";

// THE MUSTER BOARD — every staging front with an unclaimed chair, posted for the taking.
export default function OpenFrontsPanel() {
  const [fronts, setFronts] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = useCallback(() => {
    setRefreshing(true);
    base44.functions
      .invoke("openFronts", {})
      .then((r) => setFronts(r.data.games || []))
      .catch(() => setFronts([]))
      .finally(() => setRefreshing(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const shown = (fronts || []).filter((f) => (filter === "last" ? f.openSlots === 1 : true));
  const totalSeats = (fronts || []).reduce((n, f) => n + f.openSlots, 0);

  return (
    <div className="cq-panel cq-brackets p-3 flex flex-col min-h-0 h-full">
      {/* Board header */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <p className="cq-label flex items-center gap-1.5 text-brass/80">
          <DoorOpen className="w-3.5 h-3.5" /> The Muster Board
        </p>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-muted-foreground tracking-widest">
            {fronts?.length ?? 0} FRONT{fronts?.length === 1 ? "" : "S"} · {totalSeats} SEAT{totalSeats === 1 ? "" : "S"}
          </span>
          <CommandTip title="Re-read the Wire" body="Pull the latest muster notices from the Ministry." side="left">
            <button
              onClick={() => { playSfx("select"); load(); }}
              className="p-1 rounded-sm border border-border text-muted-foreground hover:text-brass hover:border-brass/60 transition-colors"
              aria-label="Refresh open fronts"
            >
              <RotateCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </CommandTip>
        </div>
      </div>
      <div className="cq-hazard my-2 opacity-60 shrink-0" />

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-2 shrink-0">
        {[["all", "All Fronts"], ["last", "Last Seat"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`font-heading uppercase tracking-[0.15em] text-[9px] px-2 py-0.5 rounded-sm border transition-colors ${
              filter === key
                ? "border-brass/60 bg-brass/15 text-brass-bright"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {fronts === null ? (
        <div className="flex items-center gap-2 py-6 justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-brass/70" />
          <span className="font-mono text-[9px] text-muted-foreground tracking-[0.25em]">READING THE WIRE…</span>
        </div>
      ) : shown.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 gap-2">
          <DoorOpen className="w-6 h-6 text-muted-foreground/40" />
          <p className="font-mono text-[10px] text-muted-foreground tracking-[0.2em] leading-relaxed max-w-[240px]">
            {filter === "last"
              ? "NO FRONT STANDS ONE SEAT FROM MUSTER."
              : "THE BOARD IS BARE — NO FRONT AWAITS A COMMANDER. POST ONE AND LET THEM COME TO YOU."}
          </p>
          <Link
            to="/new-game"
            onClick={() => playSfx("select")}
            className="cq-metal mt-1 flex items-center gap-1.5 rounded-sm border border-brass/50 bg-brass/10 px-3 py-1.5 font-heading uppercase tracking-[0.15em] text-[10px] text-brass-bright hover:bg-brass/20 transition-colors"
          >
            <Plus className="w-3 h-3" /> Post a Front
          </Link>
        </div>
      ) : (
        <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
          {shown.map((f, i) => (
            <FrontMusterCard key={f.id} front={f} index={i} />
          ))}
        </div>
      )}

      {shown.length > 0 && (
        <Link
          to="/new-game"
          onClick={() => playSfx("select")}
          className="cq-metal mt-2 shrink-0 flex items-center justify-center gap-1.5 rounded-sm border border-border hover:border-brass/60 px-3 py-1.5 font-heading uppercase tracking-[0.15em] text-[10px] text-muted-foreground hover:text-brass-bright transition-colors"
        >
          <Plus className="w-3 h-3" /> Post Your Own Front
        </Link>
      )}

      <p className="font-mono text-[8px] text-muted-foreground/50 tracking-[0.25em] text-center pt-2 shrink-0">
        MUSTER NOTICES · POSTED BY ORDER OF THE MINISTRY
      </p>
    </div>
  );
}