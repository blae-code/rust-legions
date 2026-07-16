// Synthesized storm-front ambience — rolling thunder & distant artillery (Web Audio, no assets)
import { sfxEnabled } from "@/lib/sfx";

let ctx = null;
const ac = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
};

// Browsers require a user gesture before audio — call on first pointer/key input
export function unlockAmbience() {
  try {
    const c = ac();
    if (c.state === "suspended") c.resume();
  } catch { /* audio unavailable */ }
}

const ready = () => {
  if (!sfxEnabled()) return null;
  try {
    const c = ac();
    return c.state === "running" ? c : null;
  } catch {
    return null;
  }
};

const noiseBuffer = (c, seconds) => {
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
};

// Long rolling thunder — filtered noise with a crack, a body swell, and a dying rumble
export function playThunder(delay = 1.2) {
  const c = ready();
  if (!c) return;
  const t = c.currentTime + delay;
  const dur = 3.5 + Math.random() * 2;

  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, dur + 0.2);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(340, t);
  lp.frequency.exponentialRampToValueAtTime(55, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.11, t + 0.08); // initial crack
  g.gain.exponentialRampToValueAtTime(0.035, t + 0.6);
  g.gain.exponentialRampToValueAtTime(0.08, t + 1.1 + Math.random()); // rolling swell
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(lp).connect(g).connect(c.destination);
  src.start(t);
  src.stop(t + dur + 0.2);

  // Sub-bass body under the roll
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(50, t);
  osc.frequency.exponentialRampToValueAtTime(26, t + dur * 0.8);
  const og = c.createGain();
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(0.05, t + 0.15);
  og.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.8);
  osc.connect(og).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur);
}

// Distant artillery — muffled concussive thump carried on the wind
export function playArtillery(delay = 0.2) {
  const c = ready();
  if (!c) return;
  const t = c.currentTime + delay;

  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 1.4);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(240, t);
  lp.frequency.exponentialRampToValueAtTime(45, t + 1.1);
  const g = c.createGain();
  g.gain.setValueAtTime(0.055, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
  src.connect(lp).connect(g).connect(c.destination);
  src.start(t);
  src.stop(t + 1.4);

  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(58, t);
  osc.frequency.exponentialRampToValueAtTime(24, t + 0.9);
  const og = c.createGain();
  og.gain.setValueAtTime(0.05, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
  osc.connect(og).connect(c.destination);
  osc.start(t);
  osc.stop(t + 1);
}