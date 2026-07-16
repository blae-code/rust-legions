// ============================================================
// RUST LEGIONS — MASTER AUDIO LIBRARY
// The single source of truth for every sound asset the app needs.
// Each entry is a placeholder "recording": when audio is produced or
// sourced, set its `url`. Entries without a url show "Awaiting Recording"
// in the Asset Registry; their prompts are written to be usable directly
// as generation briefs for future audio production.
// ============================================================

// House sound direction — appended to every generation brief
export const AUDIO_HOUSE_STYLE =
  "Worn dieselpunk machinery of the 1930s: heavy iron, brass and leather, overdriven diesel engines, valve radios and field telegraphs. Recordings should feel like period field recordings — tape hiss, room grit and mechanical imperfection welcome, no modern digital sheen, no synthesizer character, no sci-fi effects";

export const AUDIO_CATEGORIES = {
  score: { label: "Orchestral Score", desc: "Rotating menu soundtrack pieces and commissioned original themes" },
  ui_sfx: { label: "Interface Mechanisms", desc: "Recorded replacements for the synthesized menu and command-desk sounds" },
  battle_sfx: { label: "Battle Reports", desc: "Combat one-shots layered into attacks, bombardments and mass battles" },
  ambience: { label: "Ambient Beds", desc: "Long looping atmosphere beds under menus, lobbies and the war table" },
};

const FP = (f) => "https://commons.wikimedia.org/wiki/Special:FilePath/" + f;
const A = (key, category, title, desc, prompt, duration, url = null) =>
  ({ key, category, title, desc, prompt, duration, url });

export const AUDIO_LIBRARY = [
  // ---------- ORCHESTRAL SCORE (rotation — sourced public-domain recordings) ----------
  A("score_mars", "score", "Holst — Mars, the Bringer of War", "Menu rotation piece 1 (public domain, Musopen/Skidmore)",
    "Relentless 5/4 orchestral war machine: snarling low brass ostinato, col legno strings like marching boots, building to a crushing dissonant climax. Menacing, mechanical, inevitable — the sound of a front igniting", "7:20",
    "https://upload.wikimedia.org/wikipedia/commons/5/54/Gustav_Holst_-_the_planets%2C_op._32_-_i._mars%2C_the_bringer_of_war.ogg"),
  A("score_bald_mountain", "score", "Mussorgsky — Night on Bald Mountain", "Menu rotation piece 2 (public domain, Musopen)",
    "Wild orchestral storm: shrieking strings, blasting brass fanfares and pounding timpani in a demonic nocturnal revel, collapsing into an exhausted, bell-tolled dawn. Chaos and dread with a quiet ending", "11:00",
    FP("Modest_Mussorgsky_-_night_on_bald_mountain.ogg")),
  A("score_jupiter", "score", "Holst — Jupiter, the Bringer of Jollity", "Menu rotation piece 3 (public domain, Musopen/Skidmore)",
    "Broad-shouldered orchestral optimism: bustling string figures, brass chorales and the great noble hymn tune at the center — industrial-grade hope, the restoration humanity is fighting for", "8:00",
    FP("Gustav_Holst_-_the_planets,_op._32_-_iv._jupiter,_the_bringer_of_jollity.ogg")),
  A("score_mountain_king", "score", "Grieg — In the Hall of the Mountain King", "Menu rotation piece 4 (public domain, Musopen/CNSO)",
    "Creeping orchestral march that accelerates from tiptoeing bassoons to a frenzied full-orchestra stampede — mounting menace, machinery spinning out of control", "2:30",
    FP("Musopen_-_In_the_Hall_Of_The_Mountain_King.ogg")),
  A("score_mercury", "score", "Holst — Mercury, the Winged Messenger", "Menu rotation piece 5 (public domain, USAF Band)",
    "Quicksilver orchestral scherzo: darting woodwinds and shimmering celesta trading fragments at speed — dispatches flying between fronts, light relief in the rotation", "4:00",
    FP("Holst_The_Planets_Mercury.ogg")),
  // ---------- ORCHESTRAL SCORE (original commissions — awaiting recording) ----------
  A("score_main_theme", "score", "Original — The Abandoned World (Main Theme)", "Commissioned title theme for the home screen",
    "Slow orchestral theme in a minor key, 3-4 minutes: lone distant horn call over deep string drones, answered by a full brass chorale that swells with grim resolve, military snare entering at the halfway mark, ending unresolved on the horn call again. Mood: a vast empty world, buried power, riveted-together hope", "3:30"),
  A("score_battle_underscore", "score", "Original — The Grinding Front (Battle Underscore)", "Low-intensity loop under mass battles",
    "Seamlessly looping 2-minute orchestral tension bed: low cello and bass ostinato at 80 BPM like slow pistons, sparse timpani strikes, muted trumpet fragments, no melodic resolution ever — sustained pressure without climax so battle SFX sit on top", "2:00 loop"),
  A("score_victory", "score", "Original — The Silent Guns (Victory)", "Sting + short piece for the victory screen",
    "45-second orchestral victory piece: opens with a single held trumpet note over silence, blossoms into a weary but triumphant brass hymn with bells, ends in warm sustained strings. Triumph that cost too much — dawn over a quiet battlefield, not a parade", "0:45"),
  A("score_defeat", "score", "Original — The Long Retreat (Defeat)", "Sting + short piece for the defeat screen",
    "45-second orchestral lament: solo cello line over a slow funeral drum, joined by low clarinet in bare two-part counterpoint, fading into rain-like string harmonics. Grey, dignified grief — a column of survivors walking away", "0:45"),

  // ---------- INTERFACE MECHANISMS ----------
  A("ui_menu_click", "ui_sfx", "Menu Select — Bakelite Switch", "Recorded replacement for the synthesized menu select click",
    "Single heavy bakelite rotary switch or breaker button being pressed home: sharp dry click transient, a deep dampened thock from the housing, and a faint metallic latch settle — 150ms total, close-miked, no reverb tail", "0:00.15"),
  A("ui_menu_hover", "ui_sfx", "Menu Hover — Gear Pawl Tick", "Recorded replacement for the synthesized hover tick",
    "Single tiny mechanical tick: a ratchet pawl passing one gear tooth, or a fingernail tap on a brass instrument bezel — under 50ms, extremely dry and quiet, felt more than heard", "0:00.05"),
  A("ui_breaker_lever", "ui_sfx", "Confirm — Breaker Lever", "Major confirmations: start game, end turn commitment",
    "Large electrical breaker lever thrown home in two stages: the heave (sliding iron friction, 200ms) then the slam (sharp contact clack with a brief buzzing arc hiss) — the sound of a decision that cannot be unmade", "0:00.6"),
  A("ui_telegraph", "ui_sfx", "Notification — Field Telegraph", "Incoming chat messages and diplomatic envoys",
    "Two quick clicks of a brass telegraph key on a wooden desk, slight spring rebound after each — dry, small, urgent; period Morse operator character", "0:00.4"),
  A("ui_stamp", "ui_sfx", "Order Issued — Ministry Stamp", "End turn and decree resolutions",
    "Heavy rubber stamp slammed onto a paper-covered wooden ledger desk: deep percussive thud with paper slap, desk objects rattling briefly after impact — authoritative, final", "0:00.5"),
  A("ui_drawer", "ui_sfx", "Requisition — Ledger Drawer", "Purchases and treasury transactions",
    "Iron coins dropped into a tin cup (two short clinks) followed by a heavy wooden ledger drawer rolling shut on runners and latching — 700ms, close-miked office atmosphere", "0:00.7"),
  A("ui_radio_tune", "ui_sfx", "Panel Open — Valve Radio", "Opening dossiers, archives and intel panels",
    "Valve radio being tuned for one second: warm static bed, two brief squelches of passing stations, settling onto a faint carrier hum — worn 1930s receiver character", "0:01"),
  A("ui_page_turn", "ui_sfx", "Dossier — Page Turn", "Paging through chronicles, patch dispatches and reports",
    "Single sheet of heavy dry paper turned in a cardboard folder: crisp leaf rustle with a soft folder tap at the end — 400ms, very dry", "0:00.4"),

  // ---------- BATTLE REPORTS ----------
  A("bt_artillery", "battle_sfx", "Artillery Report", "Bombard action and battle barrages",
    "Single heavy field-gun firing at 100m: sharp cracking muzzle report, immediate deep concussion that pushes low air, then two seconds of shell rumble receding downrange and faint debris patter — outdoor, open-field acoustics", "0:03"),
  A("bt_muzzle_crack", "battle_sfx", "Rifle Volley", "Infantry attacks and battle round resolutions",
    "Ragged volley of eight to twelve bolt-action rifles fired near-simultaneously at 50m: overlapping dry cracks with brief echo off low hills, spent-case tinkles and bolt-cycling clatter in the last second", "0:02"),
  A("bt_treads", "battle_sfx", "Crawler Advance", "Armor movement and army marches",
    "Heavy tracked vehicle passing at 20m for three seconds: laboring diesel chug under squealing track links and clattering road wheels, one gear-change lurch midway — mud-choked, straining machinery", "0:03"),
  A("bt_shell_whistle", "battle_sfx", "Incoming Shell", "Defensive events and combat resolution reveals",
    "Incoming artillery shell: two-second descending whistle growing louder, terminating in a muffled ground burst with earth and clod fallout — the whistle is the sound, the burst stays distant-feeling", "0:03"),
  A("bt_rout_horn", "battle_sfx", "The Rout — Signal Horn", "Morale breaks and army disintegration",
    "Lone brass signal horn blowing three falling notes, slightly cracked on the last, over faint distant shouting and running feet — the order to fall back, mournful and ragged", "0:03"),
  A("bt_victory_bell", "battle_sfx", "Zone Taken — Field Bell", "Territory captures",
    "Single heavy iron bell struck twice, slow, with long outdoor decay — a captured village church bell announcing new ownership, austere rather than celebratory", "0:04"),

  // ---------- AMBIENT BEDS ----------
  A("amb_wasteland_wind", "ambience", "Wasteland Wind", "Bed under the home menu storm-front backdrop",
    "Seamlessly looping two-minute bed: steady desolate wind over open ground with occasional gusts rattling loose corrugated iron and singing faintly in wire fences, very distant intermittent thunder — no birds, no life", "2:00 loop"),
  A("amb_front_rumble", "ambience", "The Distant Front", "Bed under lobby and pregame screens",
    "Seamlessly looping two-minute bed: irregular artillery rumble many miles away (felt as soft low thuds, never sharp), faint drone of aircraft passing high once, sparse and mostly quiet — war as weather on the horizon", "2:00 loop"),
  A("amb_rain_canvas", "ambience", "Rain on Canvas", "Bed for rain-weather scenes and dispatches",
    "Seamlessly looping ninety-second bed: steady rain drumming on a taut canvas command tent from inside, occasional heavier gust, one soft drip into a tin cup every few seconds — intimate, enclosed", "1:30 loop"),
  A("amb_engine_deck", "ambience", "Fortress Engine Deck", "Bed for the Fortress Bay and refit screens",
    "Seamlessly looping two-minute bed: vast idling diesel plant heard through a hull — deep rhythmic thrum, hissing steam relief every twenty seconds, distant clanking chain hoists and muffled shouted orders — the inside of a moving city", "2:00 loop"),
  A("amb_war_room", "ambience", "The War Room", "Bed for the game lobby and diplomacy desk",
    "Seamlessly looping two-minute bed: hushed bunker war room — papers shuffling, a telegraph clicking intermittently in the next room, slow ceiling fan, one distant muffled phone ring, low murmured conversation without intelligible words", "2:00 loop"),
];

export const getAudio = (key) => AUDIO_LIBRARY.find((a) => a.key === key)?.url || null;
export const audioLibraryStats = () => ({
  total: AUDIO_LIBRARY.length,
  delivered: AUDIO_LIBRARY.filter((a) => a.url).length,
});