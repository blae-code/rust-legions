import React, { useMemo, useState } from "react";
import { generateField, PALETTES, WEATHER_FIELD } from "@/lib/tactical/field";
import BattlefieldBoard from "@/components/tactical/BattlefieldBoard";
import FieldControls from "@/components/tactical/FieldControls";
import TileInspector from "@/components/tactical/TileInspector";
import BuildProgress from "@/components/tactical/BuildProgress";

// The live tactical build surface. Every board here comes out of the REAL
// generator mirror, so what is drawn is what the engine will resolve on.
export default function TacticalPreview() {
  const [opts, setOpts] = useState({ seed: 20260903, nodeKind: "city", weather: "clear", fortBonus: 2 });
  const [hover, setHover] = useState(null);

  const field = useMemo(() => generateField(opts), [opts]);
  const palette = PALETTES[field.meta.nodeKind];
  const wx = WEATHER_FIELD[field.meta.weather];

  return (
    <div className="cq-page-in max-w-[1600px] mx-auto px-4 py-6 space-y-5">
      <header className="cq-panel p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="cq-label text-rust">Ministry of War · Tactical Establishment</p>
            <h1 className="cq-display text-3xl mt-0.5">The Set-Piece Ground</h1>
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest mt-1">
              LIVE BUILD SURFACE · PATCH 1.3.0 · {field.w}×{field.h} AXIAL
            </p>
          </div>
          <div className="text-right">
            <p className="cq-display text-lg leading-none text-brass-bright">{palette.label}</p>
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest mt-1">
              {wx.label.toUpperCase()} · SIGHT {wx.losCap === 99 ? "UNLIMITED" : `${wx.losCap} HEX`}
              {wx.groundsFighters && " · AIRFIELDS SHUT"}
            </p>
          </div>
        </div>
        <div className="cq-hazard mt-3" />
        <p className="font-mono text-[10px] text-muted-foreground mt-2 leading-relaxed">{palette.blurb}</p>
      </header>

      <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">
        <div className="cq-panel cq-brackets p-3 cq-board relative overflow-hidden">
          <BattlefieldBoard field={field} onHoverTile={setHover} />
          {/* weather is a live bed over the ground, exactly as the arena will run it */}
          {field.meta.weather === "rain" && <div className="absolute inset-0 cq-rain" />}
          {field.meta.weather === "snow" && <div className="absolute inset-0 cq-snowfall" />}
          {field.meta.weather === "fog" && <div className="absolute inset-0 cq-fogbank" />}
          {field.meta.weather === "storm" && (
            <>
              <div className="absolute inset-0 cq-rain" />
              <div className="absolute inset-0 cq-stormflash bg-slate-200" />
            </>
          )}
          <div className="absolute inset-0 cq-scanlines opacity-40" />
        </div>

        <aside className="space-y-5">
          <div className="cq-panel p-3.5">
            <p className="cq-label text-rust mb-3">Survey Orders</p>
            <FieldControls opts={opts} onChange={(patch) => setOpts((o) => ({ ...o, ...patch }))} />
          </div>
          <div className="cq-slip p-3.5">
            <TileInspector tile={hover} />
          </div>
          <BuildProgress />
        </aside>
      </div>
    </div>
  );
}