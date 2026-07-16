import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Settings, Volume2, VolumeX } from "lucide-react";
import { playSfx, sfxEnabled, setSfxEnabled } from "@/lib/sfx";
import ScorePanel from "@/components/audio/ScorePanel";
import {
  startScore, unlockAmbience, musicEnabled, setMusicEnabled,
  musicVolume, setMusicVolume, skipScore, currentTrackTitle, onScoreChange,
} from "@/lib/ambience";

// Unified HUD audio cluster — a gear opens the audio settings (score + SFX),
// the speaker is the single master mute for all game audio.
export default function AudioHud() {
  const [music, setMusic] = useState(musicEnabled());
  const [sfx, setSfx] = useState(sfxEnabled());
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

  const anyOn = music || sfx;
  const toggleAll = () => {
    const next = !anyOn;
    setMusicEnabled(next);
    setMusic(next);
    setSfxEnabled(next);
    setSfx(next);
    if (next) playSfx("select");
    setTitle(currentTrackTitle());
  };

  const toggleMusic = () => {
    playSfx("select");
    const next = !music;
    setMusicEnabled(next);
    setMusic(next);
    setTitle(currentTrackTitle());
  };

  const btnCls = (on) =>
    `p-1.5 rounded-sm border transition-colors ${on ? "border-brass/50 text-brass-bright" : "border-border text-muted-foreground"} hover:border-brass-bright`;

  return (
    <div className="relative flex items-center gap-2">
      <button onClick={() => { playSfx("select"); setOpen(!open); }} title="Audio settings" aria-label="Audio settings" className={btnCls(open)}>
        <Settings className="w-3.5 h-3.5" />
      </button>
      <button onClick={toggleAll} title={anyOn ? "Mute all audio" : "Enable all audio"} aria-label="Master audio" className={btnCls(anyOn)}>
        {anyOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
      </button>
      <AnimatePresence>
        {open && (
          <div className="absolute right-0 top-full mt-2 z-50 space-y-1.5 w-max">
            <ScorePanel
              on={music} title={title} vol={vol}
              onVol={(v) => { setVol(v); setMusicVolume(v); }}
              onSkip={() => { playSfx("select"); skipScore(); setTitle(currentTrackTitle()); }}
              onToggle={toggleMusic}
            />
            <motion.div
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="cq-panel px-3 py-2 flex items-center justify-between gap-4"
            >
              <span className="font-mono text-[8px] tracking-[0.25em] text-muted-foreground">BATTLEFIELD SFX</span>
              <button
                onClick={() => { const next = !sfx; setSfxEnabled(next); setSfx(next); if (next) playSfx("select"); }}
                className={`font-heading uppercase tracking-widest text-[9px] px-2 py-1 rounded-sm border transition-colors ${
                  sfx ? "border-brass/60 text-brass-bright hover:border-brass-bright" : "border-rust/60 text-rust hover:text-primary-foreground hover:bg-rust/80"
                }`}
              >
                {sfx ? "On" : "Muted"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}