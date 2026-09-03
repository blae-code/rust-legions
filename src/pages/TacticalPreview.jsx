import React, { useMemo, useState } from "react";
import { generateField, PALETTES } from "@/lib/tactical/field";
import { SAMPLE_ORBAT, neighborsOf } from "@/lib/tactical/orbat";
import BattlefieldBoard from "@/components/tactical/BattlefieldBoard";
import FieldControls from "@/components/tactical/FieldControls";
import TileInspector from "@/components/tactical/TileInspector";
import CommandBar from "@/components/tactical/hud/CommandBar";
import StandPanel from "@/components/tactical/hud/StandPanel";
import SignalsLog from "@/components/tactical/hud/SignalsLog";
import OrbatList from "@/components/tactical/hud/OrbatList";
import BuildProgress from "@/components/tactical/BuildProgress";

// The tactical arena as a hex-wargame command surface: counters on painted
// ground, an assault forecast on every contact, and service cards on the rail.
export default function TacticalPreview() {
  const [opts, setOpts] = useState({ seed: 20260903, nodeKind: "town", weather: "clear", fortBonus: 2 });
  const [hover, setHover] = useState(null);
  const [selectedId, setSelectedId] = useState("a4");
  const [targetId, setTargetId] = useState("d1");
  const [tab, setTab] = useState("Order of Battle");

  const field = useMemo(() => generateField(opts), [opts]);
  const palette = PALETTES[field.meta.nodeKind];

  const selected = SAMPLE_ORBAT.find((s) => s.id === selectedId) || null;
  const target = SAMPLE_ORBAT.find((s) => s.id === targetId) || null;

  // Clicking one of our own counters selects it; clicking an enemy in contact
  // with the selection designates it as the target instead.
  const handleSelect = (stand) => {
    if (selected && stand.side !== selected.side) {
      const inContact = neighborsOf(selected.q, selected.r).some((n) => n.q === stand.q && n.r === stand.r);
      if (inContact) {
        setTargetId(stand.id);
        return;
      }
    }
    setSelectedId(stand.id);
    setTargetId(null);
  };

  return (
    <div className="cq-page-in max-w-[1800px] mx-auto px-3 py-3 space-y-2">
      <CommandBar field={field} tab={tab} onTab={setTab} turn={7} />

      <div className="grid xl:grid-cols-[1fr_296px] gap-2 items-start">
        <div className="cq-panel cq-brackets p-2 cq-board relative overflow-hidden">
          <BattlefieldBoard
            field={field}
            stands={SAMPLE_ORBAT}
            selectedId={selectedId}
            targetId={targetId}
            onSelectStand={handleSelect}
            onClearSelection={() => setTargetId(null)}
            onHoverTile={setHover}
          />
          {field.meta.weather === "rain" && <div className="absolute inset-0 cq-rain" />}
          {field.meta.weather === "snow" && <div className="absolute inset-0 cq-snowfall" />}
          {field.meta.weather === "fog" && <div className="absolute inset-0 cq-fogbank" />}
          {field.meta.weather === "storm" && (
            <>
              <div className="absolute inset-0 cq-rain" />
              <div className="absolute inset-0 cq-stormflash bg-slate-200" />
            </>
          )}
          <div className="absolute top-2 left-2 cq-slip px-2 py-1 pointer-events-none">
            <p className="font-mono text-[9px] tracking-widest text-brass-bright">
              {palette.label.toUpperCase()} · {field.w}×{field.h}
            </p>
          </div>
        </div>

        <aside className="space-y-2">
          {tab === "Order of Battle" && (
            <div className="cq-panel p-2.5">
              <OrbatList stands={SAMPLE_ORBAT} selectedId={selectedId} onSelect={handleSelect} />
            </div>
          )}

          {tab === "Signals" && (
            <div className="cq-panel p-2.5">
              <p className="cq-label text-rust mb-2">Signals Intercept</p>
              <SignalsLog />
            </div>
          )}

          {tab === "Survey" && (
            <>
              <div className="cq-panel p-2.5">
                <p className="cq-label text-rust mb-2.5">Survey Orders</p>
                <FieldControls opts={opts} onChange={(patch) => setOpts((o) => ({ ...o, ...patch }))} />
              </div>
              <div className="cq-slip p-2.5">
                <TileInspector tile={hover} />
              </div>
              <BuildProgress />
            </>
          )}
        </aside>
      </div>

      <div className="grid md:grid-cols-2 gap-2">
        <StandPanel stand={selected} role="selected" />
        <StandPanel stand={target} role="target" />
      </div>
    </div>
  );
}