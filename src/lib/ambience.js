// Ambient war-front score — a slow, dark drone with a wind bed (Web Audio, no assets).
// Replaces the old thunder/artillery one-shots: sustained tones synthesize convincingly,
// percussive booms do not.
import { sfxEnabled } from "@/lib/sfx";

let ctx = null;
let score = null;

const ac = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
};

// Browsers require a user gesture before audio — call on first pointer/key input
export function unlockAmbience() {
  try {
    const c = ac();
    if (c.state === "suspended") c.resume().then(() => startScore());
    else startScore();
  } catch { /* audio unavailable */ }
}

const loopedNoise = (c) => {
  const buf = c.createBuffer(1, c.sampleRate * 4, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
};

// Start the continuous menu score (idempotent)
export function startScore() {
  try {
    if (score || !sfxEnabled()) return;
    const c = ac();
    if (c.state !== "running") return;
    const t = c.currentTime;

    const master = c.createGain();
    master.gain.setValueAtTime(0.0001, t);
    master.gain.exponentialRampToValueAtTime(0.07, t + 5); // slow fade-in
    master.connect(c.destination);

    const nodes = [master];

    // Dark drone — root, fifth, and a detuned octave breathing against each other
    const voices = [
      { freq: 55, type: "sine", gain: 0.5 },      // A1 root
      { freq: 82.4, type: "sine", gain: 0.3 },    // E2 fifth
      { freq: 110.4, type: "triangle", gain: 0.12 }, // detuned octave shimmer
    ];
    for (const v of voices) {
      const osc = c.createOscillator();
      osc.type = v.type;
      osc.frequency.value = v.freq;
      const g = c.createGain();
      g.gain.value = v.gain;
      // Very slow breathing on each voice, offset so the chord never sits still
      const lfo = c.createOscillator();
      lfo.frequency.value = 0.03 + Math.random() * 0.04;
      const lfoG = c.createGain();
      lfoG.gain.value = v.gain * 0.35;
      lfo.connect(lfoG).connect(g.gain);
      osc.connect(g).connect(master);
      osc.start(t);
      lfo.start(t);
      nodes.push(osc, lfo);
    }

    // Wind bed — band-limited noise, swelling gently
    const wind = loopedNoise(c);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 420;
    bp.Q.value = 0.6;
    const wg = c.createGain();
    wg.gain.value = 0.05;
    const windLfo = c.createOscillator();
    windLfo.frequency.value = 0.07;
    const windLfoG = c.createGain();
    windLfoG.gain.value = 0.028;
    windLfo.connect(windLfoG).connect(wg.gain);
    wind.connect(bp).connect(wg).connect(master);
    wind.start(t);
    windLfo.start(t);
    nodes.push(wind, windLfo);

    score = { master, nodes };
  } catch { /* audio unavailable */ }
}

// Fade out and tear down the score
export function stopScore() {
  if (!score) return;
  try {
    const c = ac();
    const t = c.currentTime;
    score.master.gain.cancelScheduledValues(t);
    score.master.gain.setValueAtTime(Math.max(score.master.gain.value, 0.0001), t);
    score.master.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    const nodes = score.nodes;
    setTimeout(() => {
      for (const n of nodes) { try { n.stop?.(); } catch { /* already stopped */ } try { n.disconnect(); } catch { /* detached */ } }
    }, 1400);
  } catch { /* audio unavailable */ }
  score = null;
}