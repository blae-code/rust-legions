import React from "react";
import { Sun, CloudRain, CloudFog, CloudLightning, Snowflake, Users, Cog, Fuel } from "lucide-react";

const WX_ICON = { clear: Sun, rain: CloudRain, fog: CloudFog, storm: CloudLightning, snow: Snowflake };

const Res = ({ icon: Icon, value, tone }) => (
  <div className="flex items-center gap-1.5">
    <Icon className={`w-3.5 h-3.5 ${tone}`} />
    <span className="font-mono text-xs text-foreground">{value}</span>
  </div>
);

// The top command rail: standing account, the turn, the weather, and the tabs
// that swap the right-hand column.
export default function CommandBar({ field, tab, onTab, turn }) {
  const Wx = WX_ICON[field.meta.weather] || Sun;
  const TABS = ["Order of Battle", "Signals", "Survey"];

  return (
    <div className="cq-panel flex flex-wrap items-center gap-x-5 gap-y-2 px-3 py-2">
      <div className="flex items-center gap-4">
        <Res icon={Users} value="12,480" tone="text-olive" />
        <Res icon={Cog} value="3,125" tone="text-steel" />
        <Res icon={Fuel} value="1,014" tone="text-brass" />
      </div>

      <div className="h-5 w-px bg-border" />

      <div className="flex items-center gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => onTab(t)}
            className={`cq-metal font-heading uppercase tracking-widest text-[10px] px-2.5 py-1 rounded-sm border transition-colors ${
              tab === t
                ? "border-brass text-brass-bright bg-brass/10"
                : "border-transparent text-secondary-foreground hover:border-brass/50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Wx className="w-3.5 h-3.5 text-brass" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {field.meta.weather}
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Turn {turn} · 22 Sixthmonth 189 F.I.
        </span>
      </div>
    </div>
  );
}