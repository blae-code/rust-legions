import React, { useEffect, useState } from "react";
import { Wind } from "lucide-react";
import { playSfx } from "@/lib/sfx";
import { WEATHER_META } from "@/lib/weather";
import {
  soundscapeEnabled, setSoundscapeEnabled,
  soundscapeVolume, setSoundscapeVolume,
  onSoundscapeChange, soundscapeRunning,
} from "@/lib/soundscape";

// Field Ambience tap — toggles the ambient bed and trims its level. The readout
// names the theater air currently being rendered.
export default function SoundscapeControl({ planetName, weather }) {
  const [on, setOn] = useState(soundscapeEnabled());
  const [vol, setVol] = useState(soundscapeVolume());
  const [open, setOpen] = useState(false);

  useEffect(() => onSoundscapeChange(() => setOn(soundscapeEnabled() && soundscapeRunning())), []);

  const toggle = () => {
    playSfx("select");
    const next = !soundscapeEnabled();
    setSoundscapeEnabled(next);
    setOn(next);
  };

  const label = WEATHER_META?.[weather]?.label || weather;

  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        onClick={toggle}
        onMouseEnter={() => { playSfx("hover"); setOpen(true); }}
        title="Field ambience — atmospheric bed"
        className={`p-1.5 rounded-sm border transition-colors ${on ? "border-brass/50 text-brass-bright" : "border-border text-muted-foreground hover:text-brass-bright hover:border-brass/50"}`}
      >
        <Wind className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-52 cq-panel p-2.5 space-y-2">
          <p className="cq-label text-brass">Field Ambience</p>
          <p className="font-mono text-[9px] text-muted-foreground tracking-widest">
            {(planetName || "CINDARA").toUpperCase()} · {String(label).toUpperCase()}
          </p>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={vol}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVol(v);
              setSoundscapeVolume(v);
            }}
            className="w-full accent-brass"
            aria-label="Ambience volume"
          />
          <p className="font-mono text-[9px] text-muted-foreground">
            {on ? "BED LIVE" : "BED SILENT"} · {Math.round(vol * 100)}%
          </p>
        </div>
      )}
    </div>
  );
}