import React, { useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { Plus, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TROOPS, COLUMN_KEYS, poolCost, formationSize } from "@/lib/tactical/data";
import { playSfx } from "@/lib/sfx";
import ReserveRack from "@/components/game/tactical/ReserveRack";
import FormationSlip from "@/components/game/tactical/FormationSlip";

const ORD = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
const newId = () => Math.random().toString(36).slice(2, 8);
const blank = (i) => ({ id: newId(), name: `${ORD[i]} Formation`, troops: {} });

// Form 9-D — the Order of Battle. Drag company chits from the reserve into sub-divisions.
export default function DeploymentScreen({ tactical, battle, busy, onDeploy }) {
  const [formations, setFormations] = useState([blank(0)]);
  const pool = tactical.myPool || {};
  const spent = {};
  for (const f of formations) for (const [k, n] of Object.entries(poolCost(f.troops))) spent[k] = (spent[k] || 0) + n;
  const remaining = Object.fromEntries(COLUMN_KEYS.map((k) => [k, (pool[k] || 0) - (spent[k] || 0)]));
  const committed = formations.reduce((s, f) => s + formationSize(f.troops), 0);
  const fielded = formations.filter((f) => formationSize(f.troops) > 0);

  const adjust = (fid, troop, delta) => setFormations((fs) => fs.map((f) => {
    if (f.id !== fid) return f;
    if (delta > 0 && remaining[TROOPS[troop].from] <= 0) return f;
    const n = Math.max(0, (f.troops[troop] || 0) + delta);
    const troops = { ...f.troops, [troop]: n };
    if (n === 0) delete troops[troop];
    return { ...f, troops };
  }));

  const onDragEnd = ({ draggableId, destination }) => {
    if (!destination) return;
    const from = draggableId.startsWith("pool-") ? "pool" : draggableId.split(":")[1];
    const troop = draggableId.startsWith("pool-") ? draggableId.slice(5) : draggableId.split(":")[2];
    const to = destination.droppableId === "pool" ? "pool" : destination.droppableId.slice(5);
    if (from === to) return;
    if (from === "pool" && remaining[TROOPS[troop].from] <= 0) return;
    if (from !== "pool") adjust(from, troop, -1);
    if (to !== "pool") setFormations((fs) => fs.map((f) => f.id !== to ? f : { ...f, troops: { ...f.troops, [troop]: (f.troops[troop] || 0) + 1 } }));
    playSfx("select");
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="text-center pt-2 mb-4 relative">
        <p className="cq-label text-rust">Form 9-D · Order of Battle · {battle.myRole === "attacker" ? "Assault Staff" : "Defending Staff"}</p>
        <h2 className="cq-display text-2xl">Deployment at {battle.tileName}</h2>
        <p className="font-mono text-[9px] text-muted-foreground tracking-[0.2em] mt-0.5">DIVIDE THE COLUMN INTO FORMATIONS · EACH TAKES THE FIELD AS ONE BODY</p>
        <span className="cq-stamp absolute right-0 top-1 text-[10px] hidden sm:block">Pending Seal</span>
      </div>

      <div className="grid lg:grid-cols-[270px_1fr] gap-3 items-start">
        <ReserveRack remaining={remaining} />
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {formations.map((f, i) => (
            <FormationSlip
              key={f.id} formation={f} ordinal={ORD[i]} canRemove={formations.length > 1}
              onRename={(name) => setFormations((fs) => fs.map((x) => x.id === f.id ? { ...x, name } : x))}
              onAdjust={(troop, d) => adjust(f.id, troop, d)}
              onRemove={() => { playSfx("select"); setFormations((fs) => fs.filter((x) => x.id !== f.id)); }}
            />
          ))}
          {formations.length < 10 && (
            <button
              type="button"
              onClick={() => { playSfx("select"); setFormations((fs) => [...fs, blank(fs.length)]); }}
              className="cq-metal min-h-[200px] rounded-sm border border-dashed border-brass/40 hover:border-brass hover:bg-brass/5 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-brass-bright transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-heading uppercase tracking-[0.2em] text-[10px]">Raise Sub-Division</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-border/70">
        <p className="font-mono text-[9px] text-muted-foreground tracking-[0.2em]">
          {committed} COMPAN{committed === 1 ? "Y" : "IES"} COMMITTED IN {fielded.length} FORMATION{fielded.length === 1 ? "" : "S"} · {COLUMN_KEYS.reduce((s, k) => s + Math.max(remaining[k], 0), 0)} HELD IN RESERVE
        </p>
        <Button disabled={busy || fielded.length === 0} onClick={() => onDeploy(fielded.map(({ name, troops }) => ({ name, troops })))} className="text-xs">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Seal the Order of Battle
        </Button>
      </div>
    </DragDropContext>
  );
}