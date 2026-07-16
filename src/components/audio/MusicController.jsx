import React, { useState, useEffect } from "react";
import { Music, VolumeX } from "lucide-react";
import { startScore, unlockAmbience, musicEnabled, setMusicEnabled, musicVolume, setMusicVolume } from "@/lib/ambience";

// Persistent score controls — floats over every pregame screen.
// Starts the soundtrack, handles the browser autoplay unlock, and gives the
// user full control: on/off plus volume, remembered between sessions.
export default function MusicController() {
  const [on, setOn] = useState(musicEnabled());
  const [vol, setVol] = useState(musicVolume());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    startScore();
    const unlock = () => unlockAmbience();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const toggle = () => { setMusicEnabled(!on); setOn(!on); };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      {open && (
        <div className="cq-panel px-3 py-2.5 flex items-center gap-3">
          <span className="font-mono text-[8px] text-muted-foreground tracking-widest whitespace-nowrap hidden sm:block">
            HOLST · MARS, THE BRINGER OF WAR
          </span>
          <input
            type="range" min="0" max="100" value={Math.round(vol * 100)}
            onChange={(e) => { const v = e.target.value / 100; setVol(v); setMusicVolume(v); }}
            title="Score volume"
            className="w-24 accent-[hsl(var(--rust))]"
          />
          <button onClick={toggle}
            className={`font-heading uppercase tracking-widest text-[9px] px-2 py-1 rounded-sm border transition-colors ${
              on ? "border-brass/60 text-brass-bright" : "border-rust/60 text-rust"
            }`}>
            {on ? "Playing" : "Muted"}
          </button>
        </div>
      )}
      <button onClick={() => setOpen(!open)} title="Menu score — click for controls"
        className={`cq-metal p-2.5 rounded-sm border transition-colors ${
          on ? "border-brass/60 text-brass-bright" : "border-border text-muted-foreground"
        }`}>
        {on ? <Music className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </button>
    </div>
  );
}