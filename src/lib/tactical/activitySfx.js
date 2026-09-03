// ---------------------------------------------------------------------------
// Tactical activity sound bank — one distinct cue per battlefield action.
//
// Synthesized through the same grit stage as the rest of the game's audio
// (src/lib/sfx.js), so a rifle volley and a siege howitzer are unmistakably the
// same world. Nothing here loads a file: every cue is built from filtered
// noise, pitched tones, struck metal and diesel chug, which means a weapon
// class can be re-voiced by changing numbers rather than commissioning audio.
//
// Design rule: the cue must identify the ACTION with the sound alone — a light
// gun is a dry crack, a heavy gun has a body and a tail, sustained fire has a
// mechanical rhythm under it.
// ---------------------------------------------------------------------------
import { audioCtx, sfxEnabled, noise, tone, clank, chug } from "@/lib/sfx";

// A repeating burst — the backbone of anything that fires more than once.
const burst = (c, count, gap, fn) => {
  for (let i = 0; i < count; i++) fn(i * gap, i);
};

const BANK = {
  // Small arms — dry, close cracks with almost no tail.
  firing_light(c) {
    burst(c, 4, 0.11, (d) => {
      noise(c, { duration: 0.035, gain: 0.075, filterType: "highpass", freq: 2600, dirty: true, delay: d });
      tone(c, { freq: 200, freqEnd: 90, duration: 0.05, gain: 0.035, type: "square", dirty: true, delay: d });
      noise(c, { duration: 0.12, gain: 0.012, filterType: "bandpass", freq: 900, freqEnd: 400, delay: d + 0.03 });
    });
  },

  // Sustained fire — faster, flatter, with the action clattering underneath.
  firing_sustained(c) {
    burst(c, 11, 0.062, (d) => {
      noise(c, { duration: 0.028, gain: 0.055, filterType: "highpass", freq: 2300, dirty: true, delay: d });
      tone(c, { freq: 170, freqEnd: 85, duration: 0.04, gain: 0.03, type: "square", dirty: true, delay: d });
      clank(c, { base: 900, duration: 0.03, gain: 0.007, delay: d + 0.015 });
    });
    noise(c, { duration: 0.8, gain: 0.014, freq: 320, freqEnd: 140 });
  },

  // Light gun — one crack with a short concussion behind it.
  firing_light_gun(c) {
    noise(c, { duration: 0.05, gain: 0.12, filterType: "highpass", freq: 1800, dirty: true });
    noise(c, { duration: 0.45, gain: 0.08, freq: 420, freqEnd: 90, delay: 0.02, dirty: true });
    tone(c, { freq: 96, freqEnd: 44, duration: 0.35, gain: 0.06, type: "sine", delay: 0.02 });
    clank(c, { base: 520, duration: 0.12, gain: 0.02, delay: 0.16 });
  },

  // Heavy gun — deep body, long tail, debris coming down afterwards.
  firing_heavy_gun(c) {
    noise(c, { duration: 0.07, gain: 0.15, filterType: "highpass", freq: 1500, dirty: true });
    noise(c, { duration: 1.2, gain: 0.15, freq: 280, freqEnd: 34, delay: 0.03, dirty: true });
    tone(c, { freq: 58, freqEnd: 20, duration: 1.1, gain: 0.1, type: "sine", delay: 0.03 });
    noise(c, { duration: 0.6, gain: 0.028, filterType: "bandpass", freq: 1300, freqEnd: 450, delay: 0.4 });
    clank(c, { base: 300, duration: 0.3, gain: 0.02, delay: 0.5 });
  },

  // Siege piece — the whole hull moves. Recoil first, then the shot.
  firing_siege(c) {
    clank(c, { base: 180, duration: 0.3, gain: 0.035 });
    noise(c, { duration: 0.09, gain: 0.17, filterType: "highpass", freq: 1100, dirty: true, delay: 0.06 });
    noise(c, { duration: 1.9, gain: 0.16, freq: 240, freqEnd: 26, delay: 0.09, dirty: true });
    tone(c, { freq: 44, freqEnd: 15, duration: 1.8, gain: 0.12, type: "sine", delay: 0.09 });
    tone(c, { freq: 27, freqEnd: 12, duration: 1.6, gain: 0.09, type: "sine", delay: 0.12 });
    noise(c, { duration: 1.0, gain: 0.03, filterType: "bandpass", freq: 1100, freqEnd: 320, delay: 0.7 });
  },

  // Gas shell — a soft launch, a wet burst, then the long hiss of the cloud.
  firing_gas(c) {
    noise(c, { duration: 0.09, gain: 0.06, filterType: "lowpass", freq: 600, freqEnd: 240, dirty: true });
    noise(c, { duration: 0.3, gain: 0.05, filterType: "lowpass", freq: 900, freqEnd: 300, delay: 0.5 });
    noise(c, { duration: 1.2, gain: 0.04, filterType: "highpass", freq: 3200, freqEnd: 5600, delay: 0.6 });
    tone(c, { freq: 320, freqEnd: 180, duration: 1.0, gain: 0.02, type: "sine", delay: 0.62 });
  },

  // Grenade — the throw, a beat of nothing, then a muffled crump.
  grenade(c) {
    noise(c, { duration: 0.16, gain: 0.03, filterType: "bandpass", freq: 700, freqEnd: 2200 });
    noise(c, { duration: 0.5, gain: 0.11, freq: 520, freqEnd: 70, delay: 0.42, dirty: true });
    tone(c, { freq: 78, freqEnd: 30, duration: 0.45, gain: 0.075, type: "sine", delay: 0.42 });
    noise(c, { duration: 0.35, gain: 0.022, filterType: "bandpass", freq: 1600, freqEnd: 600, delay: 0.58 });
  },

  // Flame projector — ignition, then a low sustained roar over the hiss.
  flame(c) {
    noise(c, { duration: 0.06, gain: 0.05, filterType: "highpass", freq: 4200 });
    noise(c, { duration: 1.3, gain: 0.07, filterType: "lowpass", freq: 900, freqEnd: 380, dirty: true, delay: 0.04 });
    noise(c, { duration: 1.2, gain: 0.035, filterType: "highpass", freq: 3000, freqEnd: 5200, delay: 0.05 });
    tone(c, { freq: 70, freqEnd: 52, duration: 1.2, gain: 0.05, type: "sawtooth", dirty: true, delay: 0.05 });
  },

  // Close assault — steel on steel, no gunfire.
  melee(c) {
    clank(c, { base: 760, duration: 0.16, gain: 0.05 });
    clank(c, { base: 620, duration: 0.14, gain: 0.045, delay: 0.13 });
    clank(c, { base: 880, duration: 0.12, gain: 0.04, delay: 0.27 });
    noise(c, { duration: 0.5, gain: 0.03, filterType: "bandpass", freq: 480, freqEnd: 260, dirty: true });
  },

  // Foot movement — boots and kit over broken ground.
  move_foot(c) {
    burst(c, 6, 0.14, (d) => {
      noise(c, { duration: 0.09, gain: 0.032, filterType: "bandpass", freq: 620, freqEnd: 240, delay: d });
      noise(c, { duration: 0.04, gain: 0.012, filterType: "highpass", freq: 3800, delay: d + 0.02 });
    });
  },

  // Tracked movement — the existing diesel chug, with track clatter over it.
  move_tracked(c) {
    chug(c, { duration: 1.0, gain: 0.075, freq: 44, rate: 9 });
    noise(c, { duration: 0.9, gain: 0.05, freq: 280, freqEnd: 80, dirty: true });
    burst(c, 5, 0.18, (d) => clank(c, { base: 480 + d * 200, duration: 0.1, gain: 0.014, delay: d }));
  },

  // Entrenching — spade bites, spoil thrown clear.
  digging(c) {
    burst(c, 4, 0.28, (d) => {
      noise(c, { duration: 0.12, gain: 0.045, filterType: "bandpass", freq: 1500, freqEnd: 500, dirty: true, delay: d });
      noise(c, { duration: 0.2, gain: 0.022, filterType: "lowpass", freq: 700, freqEnd: 260, delay: d + 0.11 });
    });
  },

  // Field works — rivet hammer on plate, then the boiler vents.
  constructing(c) {
    burst(c, 4, 0.24, (d) => {
      clank(c, { base: 300 - d * 40, duration: 0.26, gain: 0.055, delay: d });
      tone(c, { freq: 90, freqEnd: 54, duration: 0.14, gain: 0.045, type: "square", dirty: true, delay: d });
    });
    noise(c, { duration: 0.6, gain: 0.03, filterType: "highpass", freq: 3600, freqEnd: 6200, delay: 0.95 });
  },

  // Repair — ratchet ticks and a spanner set down.
  repairing(c) {
    burst(c, 7, 0.055, (d) => noise(c, { duration: 0.02, gain: 0.028, filterType: "bandpass", freq: 3000, delay: d }));
    clank(c, { base: 560, duration: 0.2, gain: 0.035, delay: 0.45 });
    clank(c, { base: 420, duration: 0.18, gain: 0.028, delay: 0.62 });
  },

  // Observation — a lens turning, then the set answering.
  spotting(c) {
    burst(c, 3, 0.09, (d) => noise(c, { duration: 0.03, gain: 0.022, filterType: "bandpass", freq: 2200, delay: d }));
    tone(c, { freq: 1400, freqEnd: 1100, duration: 0.07, gain: 0.018, type: "sine", delay: 0.34 });
    noise(c, { duration: 0.3, gain: 0.016, filterType: "bandpass", freq: 1800, freqEnd: 900, delay: 0.42, dirty: true });
  },

  // Resupply — bolt worked, magazines seated, crates set down.
  reloading(c) {
    clank(c, { base: 940, duration: 0.07, gain: 0.03 });
    clank(c, { base: 700, duration: 0.09, gain: 0.032, delay: 0.13 });
    tone(c, { freq: 150, freqEnd: 80, duration: 0.1, gain: 0.035, type: "square", dirty: true, delay: 0.28 });
    clank(c, { base: 380, duration: 0.16, gain: 0.025, delay: 0.28 });
  },

  // Pinned — rounds cracking past, nothing outgoing.
  suppressed(c) {
    burst(c, 5, 0.13, (d) => {
      noise(c, { duration: 0.05, gain: 0.03, filterType: "bandpass", freq: 3400, freqEnd: 1200, delay: d });
      noise(c, { duration: 0.09, gain: 0.018, filterType: "lowpass", freq: 500, freqEnd: 200, delay: d + 0.03 });
    });
  },

  // The stand is gone — detonation, then structure coming down.
  destroyed(c) {
    noise(c, { duration: 0.08, gain: 0.16, filterType: "highpass", freq: 1600, dirty: true });
    noise(c, { duration: 1.5, gain: 0.15, freq: 300, freqEnd: 28, delay: 0.02, dirty: true });
    tone(c, { freq: 50, freqEnd: 16, duration: 1.4, gain: 0.11, type: "sine", delay: 0.02 });
    burst(c, 5, 0.16, (d) => clank(c, { base: 260 + d * 300, duration: 0.3, gain: 0.02, delay: 0.5 + d }));
    noise(c, { duration: 1.2, gain: 0.03, filterType: "lowpass", freq: 800, freqEnd: 180, delay: 0.6 });
  },

  // Rally — the klaxon, and the line steadies.
  rally(c) {
    tone(c, { freq: 210, freqEnd: 300, duration: 0.55, gain: 0.07, type: "sawtooth", dirty: true });
    tone(c, { freq: 316, freqEnd: 452, duration: 0.5, gain: 0.045, type: "sawtooth", dirty: true, delay: 0.02 });
    noise(c, { duration: 0.7, gain: 0.02, filterType: "bandpass", freq: 700, freqEnd: 420, delay: 0.5 });
  },
};

export function playActivity(key) {
  if (!sfxEnabled() || !BANK[key]) return;
  try {
    BANK[key](audioCtx());
  } catch {
    // Audio unavailable (autoplay policy, unsupported) — stay silent
  }
}