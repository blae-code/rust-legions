// Menu soundtrack — Gustav Holst, "The Planets: I. Mars, the Bringer of War" (1914).
// Public-domain recording by the Skidmore College Orchestra, courtesy of Musopen
// (hosted on Wikimedia Commons). Loops throughout the pregame session; the user
// holds full control (on/off + volume), persisted in localStorage.

const OGG_URL = "https://upload.wikimedia.org/wikipedia/commons/5/54/Gustav_Holst_-_the_planets%2C_op._32_-_i._mars%2C_the_bringer_of_war.ogg";
const MP3_URL = "https://upload.wikimedia.org/wikipedia/commons/transcoded/5/54/Gustav_Holst_-_the_planets%2C_op._32_-_i._mars%2C_the_bringer_of_war.ogg/Gustav_Holst_-_the_planets%2C_op._32_-_i._mars%2C_the_bringer_of_war.ogg.mp3";

const MUSIC_ON_KEY = "cq_music_on";
const MUSIC_VOL_KEY = "cq_music_vol";
const DEFAULT_VOLUME = 0.35;

let track = null;
let fadeTimer = null;
let suppressed = false; // true while an active war is on screen

export function musicEnabled() {
  return localStorage.getItem(MUSIC_ON_KEY) !== "0";
}

export function musicVolume() {
  const v = parseFloat(localStorage.getItem(MUSIC_VOL_KEY));
  return Number.isFinite(v) ? Math.min(Math.max(v, 0), 1) : DEFAULT_VOLUME;
}

export function setMusicVolume(v) {
  localStorage.setItem(MUSIC_VOL_KEY, String(v));
  if (track) {
    clearInterval(fadeTimer);
    track.volume = v;
  }
}

export function setMusicEnabled(on) {
  localStorage.setItem(MUSIC_ON_KEY, on ? "1" : "0");
  if (on) startScore();
  else stopScore();
}

const fadeTo = (audio, target, ms, onDone) => {
  clearInterval(fadeTimer);
  const step = (target - audio.volume) / (ms / 80);
  fadeTimer = setInterval(() => {
    const v = audio.volume + step;
    if ((step > 0 && v >= target) || (step < 0 && v <= target)) {
      audio.volume = target;
      clearInterval(fadeTimer);
      onDone?.();
    } else {
      audio.volume = v;
    }
  }, 80);
};

// Start the looping score (idempotent). Browsers require a user gesture first —
// call again from unlockAmbience if the initial attempt is blocked.
export function startScore() {
  if (track || suppressed || !musicEnabled()) return;
  try {
    const audio = new Audio();
    audio.src = audio.canPlayType("audio/ogg; codecs=vorbis") ? OGG_URL : MP3_URL;
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    const p = audio.play();
    if (p?.catch) p.catch(() => { /* autoplay blocked — retried on first gesture */ });
    fadeTo(audio, musicVolume(), 4000);
    track = audio;
  } catch { /* audio unavailable */ }
}

// Call on the first pointer/key input — satisfies autoplay policy
export function unlockAmbience() {
  if (suppressed || !musicEnabled()) return;
  if (!track) { startScore(); return; }
  if (track.paused) {
    const p = track.play();
    if (p?.catch) p.catch(() => { /* still blocked */ });
    fadeTo(track, musicVolume(), 4000);
  }
}

// Fade out and release the track
export function stopScore() {
  if (!track) return;
  const audio = track;
  track = null;
  fadeTo(audio, 0, 1200, () => {
    audio.pause();
    audio.src = "";
  });
}

// Active battles silence the score without touching the user's preference
export function setScoreSuppressed(s) {
  if (suppressed === s) return;
  suppressed = s;
  if (s) stopScore();
  else startScore();
}