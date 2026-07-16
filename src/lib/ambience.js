// Menu soundtrack — a rotating playlist of public-domain orchestral recordings
// (Musopen / US service band recordings hosted on Wikimedia Commons).
// Pieces play in sequence and loop back to the start; the user holds full
// control (on/off + volume + skip), persisted in localStorage.

const FP = (f) => "https://commons.wikimedia.org/wiki/Special:FilePath/" + f;

export const PLAYLIST = [
  { title: "HOLST · MARS, THE BRINGER OF WAR", url: "https://upload.wikimedia.org/wikipedia/commons/5/54/Gustav_Holst_-_the_planets%2C_op._32_-_i._mars%2C_the_bringer_of_war.ogg" },
  { title: "MUSSORGSKY · NIGHT ON BALD MOUNTAIN", url: FP("Modest_Mussorgsky_-_night_on_bald_mountain.ogg") },
  { title: "HOLST · JUPITER, THE BRINGER OF JOLLITY", url: FP("Gustav_Holst_-_the_planets,_op._32_-_iv._jupiter,_the_bringer_of_jollity.ogg") },
  { title: "GRIEG · IN THE HALL OF THE MOUNTAIN KING", url: FP("Musopen_-_In_the_Hall_Of_The_Mountain_King.ogg") },
  { title: "HOLST · MERCURY, THE WINGED MESSENGER", url: FP("Holst_The_Planets_Mercury.ogg") },
];

const MUSIC_ON_KEY = "cq_music_on";
const MUSIC_VOL_KEY = "cq_music_vol";
const DEFAULT_VOLUME = 0.35;

let track = null;
let trackIdx = Math.floor(Math.random() * PLAYLIST.length); // vary the opening piece per visit
let suppressed = false; // true while an active war is on screen

// Window-level registry of every live score element. Survives module reloads,
// so muting can always silence tracks started by any earlier module instance.
const REG = (window.__cqScoreReg = window.__cqScoreReg || new Set());
const killAudio = (audio) => {
  clearInterval(audio._fade);
  audio.onended = null;
  audio.onerror = null;
  audio.pause();
  audio.src = "";
  REG.delete(audio);
};
// Hard-stop every registered element except `keep` (if given)
const killGhosts = (keep) => {
  REG.forEach((a) => { if (a !== keep) killAudio(a); });
};

const listeners = new Set();
const notify = () => listeners.forEach((cb) => cb());
// Subscribe to score state changes (track started/stopped) — returns unsubscribe
export function onScoreChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
export function currentTrackTitle() {
  return track ? PLAYLIST[trackIdx].title : null;
}

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
    clearInterval(track._fade);
    track.volume = v;
  }
}

export function setMusicEnabled(on) {
  localStorage.setItem(MUSIC_ON_KEY, on ? "1" : "0");
  if (on) startScore();
  else stopScore();
}

// Each audio element carries its own fade timer, so a new track starting can
// never cancel an old track's fade-out (which used to leave ghosts playing).
const fadeTo = (audio, target, ms, onDone) => {
  clearInterval(audio._fade);
  const step = (target - audio.volume) / (ms / 80);
  if (Math.abs(step) < 0.0005) { // already at target — settle immediately
    audio.volume = target;
    onDone?.();
    return;
  }
  audio._fade = setInterval(() => {
    const v = audio.volume + step;
    if ((step > 0 && v >= target) || (step < 0 && v <= target)) {
      audio.volume = target;
      clearInterval(audio._fade);
      onDone?.();
    } else {
      audio.volume = v;
    }
  }, 80);
};

function playIndex(i, attempts = 0) {
  if (suppressed || !musicEnabled() || attempts >= PLAYLIST.length) return;
  trackIdx = ((i % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
  try {
    const audio = new Audio(PLAYLIST[trackIdx].url);
    audio.preload = "auto";
    audio.volume = 0;
    audio.onended = () => {
      if (track !== audio) return;
      track = null;
      playIndex(trackIdx + 1);
    };
    audio.onerror = () => {
      if (track !== audio) return;
      track = null;
      playIndex(trackIdx + 1, attempts + 1); // skip unplayable recordings
    };
    REG.add(audio);
    const p = audio.play();
    if (p?.catch) p.catch(() => { /* autoplay blocked — retried on first gesture */ });
    fadeTo(audio, musicVolume(), 4000);
    track = audio;
    killGhosts(audio); // one voice only — silence anything left over
    notify();
  } catch { /* audio unavailable */ }
}

// Start the rotating score (idempotent). Browsers require a user gesture first —
// call again from unlockAmbience if the initial attempt is blocked.
export function startScore() {
  if (track || suppressed || !musicEnabled()) return;
  playIndex(trackIdx);
}

// Advance to the next piece in the rotation immediately
export function skipScore() {
  if (!track) return;
  const audio = track;
  track = null;
  killAudio(audio);
  playIndex(trackIdx + 1);
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

// Fade out fast and release the track — silence is guaranteed even if the
// fade is interrupted, and any stray elements are hard-stopped too.
export function stopScore() {
  const audio = track;
  track = null;
  killGhosts(audio);
  if (audio) {
    fadeTo(audio, 0, 400, () => killAudio(audio));
    setTimeout(() => killAudio(audio), 600); // hard stop, no matter what
  }
  notify();
}

// Active battles silence the score without touching the user's preference
export function setScoreSuppressed(s) {
  if (suppressed === s) return;
  suppressed = s;
  if (s) stopScore();
  else startScore();
}