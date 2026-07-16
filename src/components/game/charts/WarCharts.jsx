import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import ChartFrame from "./ChartFrame";

const AXIS = { stroke: "#6B6155", fontSize: 9, fontFamily: "'IBM Plex Mono', monospace" };
const GRID = { stroke: "#3B342D", strokeDasharray: "3 4" };
const TOOLTIP_STYLE = {
  background: "#1B1713",
  border: "1px solid #6B5B3A",
  borderRadius: 2,
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 10,
  color: "#EDE6D6",
};

function WarChart({ kicker, title, data, factions, unit, domain }) {
  return (
    <ChartFrame kicker={kicker} title={title}>
      <ResponsiveContainer width="100%" height={190}>
        <LineChart data={data} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="turn" tick={AXIS} tickLine={false} axisLine={{ stroke: "#3B342D" }} tickFormatter={(t) => `T${t}`} />
          <YAxis tick={AXIS} tickLine={false} axisLine={{ stroke: "#3B342D" }} domain={domain} unit={unit} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(t) => `TURN ${t}`} formatter={(v, name) => [`${v}${unit || ""}`, name]} />
          {factions.map((f) => (
            <Line
              key={f.slotIndex}
              type="stepAfter"
              dataKey={f.factionName}
              stroke={f.color}
              strokeWidth={1.8}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
              isAnimationActive={true}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 px-1">
        {factions.map((f) => (
          <span key={f.slotIndex} className={`flex items-center gap-1.5 font-mono text-[9px] tracking-widest ${f.eliminated ? "opacity-40 line-through" : ""} text-muted-foreground`}>
            <span className="w-2 h-2 rounded-full border border-black/50" style={{ background: f.color }} /> {f.factionName?.toUpperCase()}
          </span>
        ))}
      </div>
    </ChartFrame>
  );
}

export default function WarCharts({ history = [], factions = [] }) {
  if (history.length < 2) return null;
  const controlData = history.map((s) => ({
    turn: s.turn,
    ...Object.fromEntries(factions.map((f) => [f.factionName, s.control?.[String(f.slotIndex)] ?? 0])),
  }));
  const prodData = history.map((s) => ({
    turn: s.turn,
    ...Object.fromEntries(factions.map((f) => {
      const p = s.production?.[String(f.slotIndex)] || {};
      return [f.factionName, (p.manpower || 0) + (p.steel || 0) + (p.fuel || 0)];
    })),
  }));
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <WarChart kicker="Intelligence Estimate" title="Territorial Control" data={controlData} factions={factions} unit="%" domain={[0, 100]} />
      <WarChart kicker="Industrial Census" title="War Production Output" data={prodData} factions={factions} domain={[0, "auto"]} />
    </div>
  );
}