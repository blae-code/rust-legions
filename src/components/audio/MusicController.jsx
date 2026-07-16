import React, { useState, useEffect } from "react";
import { Music, VolumeX, SkipForward } from "lucide-react";
import {
  startScore, unlockAmbience, musicEnabled, setMusicEnabled,
  musicVolume, setMusicVolume, skipScore, currentTrackTitle, onScoreChange,
} from "@/lib/ambience";

// Persistent score controls — floats over every pregame screen.
// Starts the rotating soundtrack, handles the browser autoplay unlock, and gives
// the user full control: on/off, volume and skip, remembered between sessions.
export default function MusicController() {
  const [on, setOn] = useState(musicEnabled());
  const [vol, setVol] = useState(musicVolume());
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(currentTrackTitle());

  useEffect(() => {
    startScore();
    const unsub = onScoreChange(() => setTitle(currentTrackTitle()));
    const unlock = () => { unlockAmbience(); setTitle(currentTrackTitle()); };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      unsub();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const toggle = () => {
    const next = !on;
    setMusicEnabled(next);
    setOn(next);
    setTitle(currentTrackTitle());
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2">
      {open && (
        <div className="cq-panel px-3 py-2.5 flex items-center gap-3">
          <span className="font-mono text-[8px] text-muted-foreground tracking-widest whitespace-nowrap hidden sm:block max-w-[220px] truncate">
            {on && title ? title : "SCORE MUTED"}
          </span>
          <input
            type="range" min="0" max="100" value={Math.round(vol * 100)}
            onChange={(e) => { const v = e.target.value / 100; setVol(v); setMusicVolume(v); }}
            title="Score volume"
            className="w-24 accent-[hsl(var(--rust))]"
          />
          <button
            onClick={() => { skipScore(); setTitle(currentTrackTitle()); }}
            disabled={!on}
            title="Next piece"
            className="p-1 rounded-sm border border-border text-muted-foreground hover:text-brass-bright hover:border-brass/50 transition-colors disabled:opacity-40"
          >
            <SkipForward className="w-3 h-3" />
          </button>
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