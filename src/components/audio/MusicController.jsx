import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Music, VolumeX } from "lucide-react";
import { playSfx } from "@/lib/sfx";
import ScorePanel from "@/components/audio/ScorePanel";
import {
  startScore, unlockAmbience, musicEnabled, setMusicEnabled,
  musicVolume, setMusicVolume, skipScore, currentTrackTitle, onScoreChange,
} from "@/lib/ambience";

// Persistent gramophone controls — floats over every pregame screen.
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
    playSfx("select");
    const next = !on;
    setMusicEnabled(next);
    setOn(next);
    setTitle(currentTrackTitle());
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-end gap-2">
      <AnimatePresence>
        {open && (
          <ScorePanel
            on={on} title={title} vol={vol}
            onVol={(v) => { setVol(v); setMusicVolume(v); }}
            onSkip={() => { playSfx("select"); skipScore(); setTitle(currentTrackTitle()); }}
            onToggle={toggle}
          />
        )}
      </AnimatePresence>
      <button
        onClick={() => { playSfx("select"); setOpen(!open); }}
        title="Menu score — click for controls"
        aria-label="Soundtrack controls"
        className={`relative cq-metal p-2.5 rounded-sm border transition-colors hover:border-brass-bright ${
          on ? "border-brass/60 text-brass-bright" : "border-border text-muted-foreground"
        }`}
      >
        {on ? <Music className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        {on && title && (
          <span className="cq-lamp absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-brass-bright text-brass-bright" />
        )}
      </button>
    </div>
  );
}