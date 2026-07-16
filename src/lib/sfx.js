// Synthesized dieselpunk SFX — Web Audio API, no assets. Everything runs through
// a grit stage (waveshaper distortion) so tones sound like worn, overdriven machinery.
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

// Soft-clip distortion curve — the "diesel grit" stage
let gritCurve = null;
const grit = (c, amount = 18) => {
  const shaper = c.createWaveShaper();
  if (!gritCurve) {
    gritCurve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      gritCurve[i] = Math.tanh(amount * x) / Math.tanh(amount);
    }
  }
  shaper.curve = gritCurve;
  return shaper;
};

// Filtered noise burst (rumbles, booms, steam, debris)
function noise(c, { duration = 0.4, gain = 0.08, filterType = "lowpass", freq = 400, freqEnd, delay = 0, dirty = false }) {
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
  const chain = dirty ? src.connect(filter).connect(grit(c)).connect(g) : src.connect(filter).connect(g);
  chain.connect(c.destination);
  src.start(t);
  src.stop(t + duration + 0.1);
}

// Pitched tone, optionally driven through the grit stage
function tone(c, { freq = 440, freqEnd, duration = 0.15, gain = 0.06, type = "triangle", delay = 0, dirty = false }) {
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  const chain = dirty ? osc.connect(grit(c)).connect(g) : osc.connect(g);
  chain.connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

// Struck metal — stacked inharmonic partials, like a wrench on a boiler plate
function clank(c, { base = 340, duration = 0.3, gain = 0.05, delay = 0 }) {
  const partials = [1, 1.51, 2.32, 3.17];
  partials.forEach((p, i) => {
    tone(c, { freq: base * p, freqEnd: base * p * 0.92, duration: duration * (1 - i * 0.18), gain: gain / (i + 1.2), type: "triangle", delay });
  });
  noise(c, { duration: 0.05, gain: gain * 0.7, filterType: "bandpass", freq: base * 6, delay });
}

// Laboring diesel engine — LFO-chopped sawtooth chug
function chug(c, { duration = 0.7, gain = 0.06, freq = 48, rate = 11, delay = 0 }) {
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.linearRampToValueAtTime(freq * 1.35, t + duration * 0.4);
  osc.frequency.linearRampToValueAtTime(freq * 0.9, t + duration);
  const lfo = c.createOscillator();
  lfo.type = "square";
  lfo.frequency.setValueAtTime(rate, t);
  lfo.frequency.linearRampToValueAtTime(rate * 1.6, t + duration);
  const lfoGain = c.createGain();
  lfoGain.gain.value = gain * 0.5;
  const g = c.createGain();
  g.gain.setValueAtTime(gain * 0.5, t);
  g.gain.setValueAtTime(gain * 0.5, t + duration * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  lfo.connect(lfoGain).connect(g.gain);
  osc.connect(grit(c)).connect(g).connect(c.destination);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + duration + 0.05);
  lfo.stop(t + duration + 0.05);
}

const SOUNDS = {
  // Column on the move — diesel chug, track squeal, clattering road wheels
  move(c) {
    chug(c, { duration: 0.8, gain: 0.07, freq: 46, rate: 10 });
    noise(c, { duration: 0.7, gain: 0.045, freq: 260, freqEnd: 80, dirty: true });
    noise(c, { duration: 0.18, gain: 0.02, filterType: "bandpass", freq: 2400, freqEnd: 1700, delay: 0.15 }); // track squeal
    clank(c, { base: 520, duration: 0.12, gain: 0.02, delay: 0.3 });
    clank(c, { base: 460, duration: 0.12, gain: 0.018, delay: 0.5 });
  },
  // Big gun — sharp muzzle crack, overdriven concussion, falling debris
  attack(c) {
    noise(c, { duration: 0.06, gain: 0.13, filterType: "highpass", freq: 2000, dirty: true }); // crack
    noise(c, { duration: 1.0, gain: 0.14, freq: 300, freqEnd: 38, delay: 0.03, dirty: true }); // concussion
    tone(c, { freq: 62, freqEnd: 24, duration: 0.9, gain: 0.09, type: "sine", delay: 0.03 }); // sub thump
    noise(c, { duration: 0.5, gain: 0.025, filterType: "bandpass", freq: 1400, freqEnd: 500, delay: 0.35 }); // debris rain
    clank(c, { base: 700, duration: 0.2, gain: 0.015, delay: 0.55 }); // shrapnel on steel
  },
  // Construction — heavy rivet hammering on plate, then a boiler steam vent
  build(c) {
    clank(c, { base: 300, duration: 0.28, gain: 0.06 });
    tone(c, { freq: 90, freqEnd: 55, duration: 0.15, gain: 0.05, type: "square", dirty: true }); // hammer body
    clank(c, { base: 260, duration: 0.26, gain: 0.05, delay: 0.24 });
    tone(c, { freq: 80, freqEnd: 50, duration: 0.15, gain: 0.045, type: "square", dirty: true, delay: 0.24 });
    noise(c, { duration: 0.55, gain: 0.03, filterType: "highpass", freq: 3500, freqEnd: 6000, delay: 0.46 }); // steam hiss
  },
  // Requisition — iron coins into a tin, heavy ledger drawer slamming shut
  purchase(c) {
    clank(c, { base: 620, duration: 0.14, gain: 0.03 });
    clank(c, { base: 540, duration: 0.14, gain: 0.028, delay: 0.09 });
    tone(c, { freq: 140, freqEnd: 70, duration: 0.18, gain: 0.05, type: "square", dirty: true, delay: 0.2 }); // drawer slam
    noise(c, { duration: 0.08, gain: 0.02, filterType: "bandpass", freq: 1800, delay: 0.2 });
  },
  // Menu hover — dry valve-radio crackle
  hover(c) {
    noise(c, { duration: 0.05, gain: 0.02, filterType: "bandpass", freq: 1500, dirty: true });
    tone(c, { freq: 880, freqEnd: 620, duration: 0.04, gain: 0.012, type: "square" });
  },
  // Menu select — heavy breaker lever thrown home
  select(c) {
    tone(c, { freq: 200, freqEnd: 90, duration: 0.14, gain: 0.055, type: "square", dirty: true });
    clank(c, { base: 380, duration: 0.16, gain: 0.03, delay: 0.05 });
    noise(c, { duration: 0.12, gain: 0.015, filterType: "highpass", freq: 4000, delay: 0.1 }); // contact hiss
  },
  // End turn — field telegraph key, then the orders stamp slams the ledger
  endTurn(c) {
    noise(c, { duration: 0.04, gain: 0.025, filterType: "bandpass", freq: 2600 }); // key click
    noise(c, { duration: 0.04, gain: 0.02, filterType: "bandpass", freq: 2600, delay: 0.1 });
    tone(c, { freq: 110, freqEnd: 38, duration: 0.35, gain: 0.11, type: "sine", delay: 0.22 }); // stamp thud
    noise(c, { duration: 0.2, gain: 0.06, freq: 450, freqEnd: 90, delay: 0.22, dirty: true });
    clank(c, { base: 240, duration: 0.2, gain: 0.02, delay: 0.24 }); // desk rattle
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