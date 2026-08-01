// Ambient dieselpunk soundscape — a continuous, fully synthesized field bed for
// the war room. No assets: looping filtered noise (wind + precipitation), a low
// planetary drone, and intermittent distant machinery, all shaped by the active
// theater planet and the day's weather. Layers cross-fade when either changes.

const ON_KEY = "cq_amb_on";
const VOL_KEY = "cq_amb_vol";
const DEFAULT_VOLUME = 0.4;

// Each planet carries its own air: how the wind is filtered, how heavy the
// ground drone sits, and how often its ruined industry stirs.
const PLANETS = {
  cindara: { wind: 620, windQ: 0.7, windGain: 0.05, drone: 52, droneGain: 0.035, gust: 0.055, machineFreq: 46, industry: 1 },
  veyra: { wind: 1150, windQ: 1.1, windGain: 0.058, drone: 44, droneGain: 0.03, gust: 0.085, machineFreq: 40, industry: 1.35 },
  morhollow: { wind: 1750, windQ: 2.2, windGain: 0.05, drone: 36, droneGain: 0.042, gust: 0.035, machineFreq: 34, industry: 0.6 },
};

// Weather reshapes that air — muffling it, soaking it, or filling it with sleet.
const WEATHER = {
  clear: { windMul: 1, windGainMul: 1, precip: 0, precipFreq: 3000, precipQ: 0.5, droneMul: 1 },
  rain: { windMul: 0.85, windGainMul: 0.9, precip: 0.05, precipFreq: 3400, precipQ: 0.4, droneMul: 1 },
  fog: { windMul: 0.4, windGainMul: 0.65, precip: 0, precipFreq: 900, precipQ: 0.5, droneMul: 1.15 },
  storm: { windMul: 1.25, windGainMul: 1.35, precip: 0.07, precipFreq: 2600, precipQ: 0.35, droneMul: 1.2 },
  snow: { windMul: 0.7, windGainMul: 0.75, precip: 0.022, precipFreq: 5200, precipQ: 0.8, droneMul: 0.9 },
};

let ctx = null;
let master = null;
let wind = null;      // { src, filter, gain }
let precip = null;    // { src, filter, gain }
let drone = null;     // { osc, gain }
let gust = null;      // { lfo, depth }
let running = false;
let eventTimer = null;
let current = { planetId: "cindara", weather: "clear" };

const listeners = new Set();
const notify = () => listeners.forEach((cb) => cb());
export function onSoundscapeChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export const soundscapeEnabled = () =>
  typeof localStorage === "undefined" || localStorage.getItem(ON_KEY) === "1";
export const soundscapeRunning = () => running;
export function soundscapeVolume() {
  const v = parseFloat(localStorage.getItem(VOL_KEY));
  return Number.isFinite(v) ? Math.min(Math.max(v, 0), 1) : DEFAULT_VOLUME;
}

const spec = () => ({
  p: PLANETS[current.planetId] || PLANETS.cindara,
  w: WEATHER[current.weather] || WEATHER.clear,
});

function noiseLoop(c, seconds = 4) {
  const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

const ramp = (param, value, seconds = 2.5) => {
  const t = ctx.currentTime;
  param.cancelScheduledValues(t);
  param.setValueAtTime(param.value, t);
  param.linearRampToValueAtTime(value, t + seconds);
};

// Push the current planet/weather values into the live layers
function applySpec(seconds = 2.5) {
  if (!running) return;
  const { p, w } = spec();
  ramp(wind.filter.frequency, p.wind * w.windMul, seconds);
  wind.filter.Q.value = p.windQ;
  ramp(wind.gain.gain, p.windGain * w.windGainMul, seconds);
  ramp(gust.depth.gain, p.windGain * w.windGainMul * 0.6, seconds);
  gust.lfo.frequency.value = p.gust;
  ramp(precip.filter.frequency, w.precipFreq, seconds);
  precip.filter.Q.value = w.precipQ;
  ramp(precip.gain.gain, w.precip, seconds);
  ramp(drone.osc.frequency, p.drone * w.droneMul, seconds);
  ramp(drone.gain.gain, p.droneGain, seconds);
}

// Distant, miles-away industry and weather punctuation — never in the foreground
function fireEvent() {
  if (!running) return;
  const { p } = spec();
  const t = ctx.currentTime;
  const roll = Math.random();

  if (current.weather === "storm" && roll < 0.4) {
    // Thunder rolling over the front
    const src = noiseLoop(ctx, 3);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(280, t);
    f.frequency.exponentialRampToValueAtTime(50, t + 2.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    src.connect(f).connect(g).connect(master);
    src.start(t);
    src.stop(t + 2.8);
  } else if (current.weather === "fog" && roll < 0.45) {
    // A convoy horn calling through the murk
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(112, t);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 420;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.035, t + 0.5);
    g.gain.setValueAtTime(0.035, t + 1.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    osc.connect(f).connect(g).connect(master);
    osc.start(t);
    osc.stop(t + 2.5);
  } else {
    // Worn machinery labouring somewhere beyond the ridge
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(p.machineFreq, t);
    osc.frequency.linearRampToValueAtTime(p.machineFreq * 1.2, t + 1.1);
    osc.frequency.linearRampToValueAtTime(p.machineFreq * 0.95, t + 2.2);
    const lfo = ctx.createOscillator();
    lfo.type = "square";
    lfo.frequency.value = 7.5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.016;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 340;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.02, t + 0.6);
    g.gain.setValueAtTime(0.02, t + 1.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    lfo.connect(lfoGain).connect(g.gain);
    osc.connect(f).connect(g).connect(master);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + 2.5);
    lfo.stop(t + 2.5);
  }

  const gap = (9 + Math.random() * 16) / (p.industry || 1);
  eventTimer = setTimeout(fireEvent, gap * 1000);
}

function build() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const windSrc = noiseLoop(ctx);
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = "bandpass";
  const windGain = ctx.createGain();
  windGain.gain.value = 0;
  windSrc.connect(windFilter).connect(windGain).connect(master);
  windSrc.start();
  wind = { src: windSrc, filter: windFilter, gain: windGain };

  // Slow gusting — an LFO breathing on the wind layer's gain
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  const depth = ctx.createGain();
  depth.gain.value = 0;
  lfo.connect(depth).connect(windGain.gain);
  lfo.start();
  gust = { lfo, depth };

  const precipSrc = noiseLoop(ctx);
  const precipFilter = ctx.createBiquadFilter();
  precipFilter.type = "bandpass";
  const precipGain = ctx.createGain();
  precipGain.gain.value = 0;
  precipSrc.connect(precipFilter).connect(precipGain).connect(master);
  precipSrc.start();
  precip = { src: precipSrc, filter: precipFilter, gain: precipGain };

  const osc = ctx.createOscillator();
  osc.type = "sine";
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0;
  osc.connect(droneGain).connect(master);
  osc.start();
  drone = { osc, gain: droneGain };
}

function start() {
  if (running || !soundscapeEnabled()) return;
  try {
    if (!ctx) build();
    if (ctx.state === "suspended") ctx.resume();
    running = true;
    applySpec(0.01);
    ramp(master.gain, soundscapeVolume(), 3);
    eventTimer = setTimeout(fireEvent, 6000);
    notify();
  } catch {
    running = false; // audio unavailable
  }
}

function stop(immediate = false) {
  clearTimeout(eventTimer);
  eventTimer = null;
  if (!running) return;
  running = false;
  if (master) ramp(master.gain, 0, immediate ? 0.05 : 1.2);
  notify();
}

// Point the bed at a theater. Called whenever the planet or weather changes;
// starts the bed on first call and cross-fades thereafter.
export function setSoundscape({ planetId, weather }) {
  const next = { planetId: planetId || current.planetId, weather: weather || "clear" };
  const changed = next.planetId !== current.planetId || next.weather !== current.weather;
  current = next;
  if (!soundscapeEnabled()) return;
  if (!running) start();
  else if (changed) applySpec(3);
}

export function stopSoundscape() {
  stop(true);
}

export function setSoundscapeEnabled(on) {
  localStorage.setItem(ON_KEY, on ? "1" : "0");
  if (on) start();
  else stop(true);
  notify();
}

export function setSoundscapeVolume(v) {
  localStorage.setItem(VOL_KEY, String(v));
  if (running && master) ramp(master.gain, v, 0.2);
  notify();
}

// What the bed is currently rendering — for the HUD readout
export const soundscapeLabel = () => ({ planetId: current.planetId, weather: current.weather });