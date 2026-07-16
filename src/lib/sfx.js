// Synthesized dieselpunk ambient SFX — Web Audio API, no assets needed.
let ctx = null;
const ac = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
};

let enabled = typeof localStorage !== "undefined" && localStorage.getItem("cq_sfx") !== "off";
export const sfxEnabled = () => enabled;
export const setSfxEnabled = (v) => {
  enabled = v;
  localStorage.setItem("cq_sfx", v ? "on" : "off");
};

const noiseBuffer = (c, seconds = 0.5) => {
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
};

// Filtered noise burst (rumbles, booms, steam)
function noise(c, { duration = 0.4, gain = 0.08, filterType = "lowpass", freq = 400, freqEnd, delay = 0 }) {
  const t = c.currentTime + delay;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, duration + 0.1);
  const filter = c.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(freq, t);
  if (freqEnd) filter.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filter).connect(g).connect(c.destination);
  src.start(t);
  src.stop(t + duration + 0.1);
}

// Pitched blip / clank tone
function tone(c, { freq = 440, freqEnd, duration = 0.15, gain = 0.06, type = "triangle", delay = 0 }) {
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

const SOUNDS = {
  // Diesel engines + track clatter
  move(c) {
    noise(c, { duration: 0.55, gain: 0.07, freq: 220, freqEnd: 90 });
    tone(c, { freq: 55, freqEnd: 40, duration: 0.5, gain: 0.05, type: "sawtooth" });
    noise(c, { duration: 0.1, gain: 0.03, filterType: "bandpass", freq: 1800, delay: 0.12 });
    noise(c, { duration: 0.1, gain: 0.03, filterType: "bandpass", freq: 1600, delay: 0.28 });
  },
  // Artillery crack + concussive boom
  attack(c) {
    noise(c, { duration: 0.08, gain: 0.09, filterType: "highpass", freq: 2500 });
    noise(c, { duration: 0.7, gain: 0.12, freq: 350, freqEnd: 50, delay: 0.04 });
    tone(c, { freq: 70, freqEnd: 30, duration: 0.6, gain: 0.08, type: "sine", delay: 0.04 });
  },
  // Hammer on steel — riveting a new structure
  build(c) {
    tone(c, { freq: 900, freqEnd: 500, duration: 0.09, gain: 0.06, type: "square" });
    noise(c, { duration: 0.12, gain: 0.05, filterType: "bandpass", freq: 3200 });
    tone(c, { freq: 750, freqEnd: 420, duration: 0.09, gain: 0.05, type: "square", delay: 0.22 });
    noise(c, { duration: 0.12, gain: 0.04, filterType: "bandpass", freq: 2800, delay: 0.22 });
    noise(c, { duration: 0.4, gain: 0.03, filterType: "highpass", freq: 4000, delay: 0.38 }); // steam hiss
  },
  // Brass requisition register
  purchase(c) {
    tone(c, { freq: 660, duration: 0.08, gain: 0.05, type: "triangle" });
    tone(c, { freq: 880, duration: 0.12, gain: 0.05, type: "triangle", delay: 0.09 });
    noise(c, { duration: 0.08, gain: 0.02, filterType: "bandpass", freq: 5000, delay: 0.09 });
  },
  // Heavy ledger stamp — orders sealed
  endTurn(c) {
    tone(c, { freq: 120, freqEnd: 45, duration: 0.25, gain: 0.09, type: "sine" });
    noise(c, { duration: 0.15, gain: 0.05, freq: 500, freqEnd: 120 });
  },
};

export function playSfx(name) {
  if (!enabled || !SOUNDS[name]) return;
  try {
    SOUNDS[name](ac());
  } catch {
    // Audio unavailable (autoplay policy, unsupported) — stay silent
  }
}