// ============================================================
// CONQUEST TACTICS — MASTER IMAGE LIBRARY
// The single source of truth for every art asset the app needs.
// Each entry is a placeholder "plate": when an image is produced,
// set its `url`. Components read via getImage(key) and fall back
// to their current icons/tokens when the plate is still pending.
// ============================================================

import { PLATE_URLS } from "@/lib/imagePlates";

// House art direction — prepend to every generation prompt
export const HOUSE_STYLE =
  "Gritty dieselpunk, 1930s industrial wartime aesthetic, worn riveted steel and brass, muted olive-rust-umber palette, painterly concept art, dramatic side lighting, film grain, weathered and rationed, in the visual family of Foxhole and Iron Harvest";

export const IMAGE_CATEGORIES = {
  commanders: { label: "Commander Portraits", desc: "Generals & marshals shown on army panels, battle views and muster screens" },
  avatars: { label: "Player Profile Portraits", desc: "Selectable commander avatars for the player dossier" },
  factions: { label: "Faction Crests & Sigils", desc: "Banners and insignia for factions, lobbies and turn indicators" },
  units: { label: "Unit Plates", desc: "Token portraits and action illustrations replacing generic unit icons" },
  fortress: { label: "Fortress-Bases & Modules", desc: "Mobile base exteriors and module bay art for the Fortress Bay panel" },
  buildings: { label: "Structures", desc: "Building illustrations for the construction panel and tile views" },
  terrain: { label: "Terrain Plates", desc: "Zone artwork for tile panels, probes and battle backdrops" },
  weather: { label: "Weather Seals", desc: "Stamped weather markers for the front-line forecast" },
  resources: { label: "Resource Tokens", desc: "Manpower, steel and fuel markers replacing emoji icons" },
  medals: { label: "Medals & Decorations", desc: "Combat honors pinned to decorated generals" },
  maneuvers: { label: "Maneuver Cards", desc: "Order-card art for the mass-battle maneuver buttons" },
  effects: { label: "Effect Textures", desc: "Explosion, smoke and grit textures layered into battle FX" },
  backdrops: { label: "Atmospheric Backdrops", desc: "Full-scene art for menus, ceremonies and battle dioramas" },
  ui: { label: "Ministry Marks & Stamps", desc: "Seals, stamps and crests for the diegetic paperwork UI" },
};

const P = (key, category, title, desc, prompt, aspect = "1:1") =>
  ({ key, category, title, desc, prompt, aspect, url: PLATE_URLS[key] || null });

export const IMAGE_LIBRARY = [
  // ---------- COMMANDER PORTRAITS ----------
  P("cmdr_butcher", "commanders", "General — 'the Butcher'", "Portrait for generals with the Butcher trait (Relentless Pursuit)",
    "Brutal scarred general, shaved head, heavy jaw, blood-dark greatcoat with brass gorget, cold stare, smoke rising behind"),
  P("cmdr_fox", "commanders", "General — 'the Old Fox'", "Portrait for generals with the Old Fox trait (Staged Ambush)",
    "Elderly wiry general, sly knowing smile, monocle, fur-collared field coat, map table and lamplight behind"),
  P("cmdr_bulwark", "commanders", "General — 'the Bulwark'", "Portrait for generals with the Bulwark trait (Iron Wall)",
    "Massive stoic general, square build, dented breastplate over uniform, sandbags and concrete behind, immovable expression"),
  P("cmdr_firebrand", "commanders", "General — 'the Firebrand'", "Portrait for generals with the Firebrand trait (Inspiring Charge)",
    "Young charismatic general mid-shout, raised gloved fist, banner whipping behind, embers in the air, fierce bright eyes"),
  P("cmdr_marshal_aggressive", "commanders", "Supreme Marshal — Aggressive doctrine", "Supreme commander portrait for aggressive factions",
    "Hawk-faced supreme marshal, black and rust dress uniform crowded with campaign bars, war-room glow, predatory calm"),
  P("cmdr_marshal_economic", "commanders", "Supreme Marshal — Economic doctrine", "Supreme commander portrait for economic factions",
    "Shrewd supreme marshal with ledger and fountain pen, wire spectacles, olive dress uniform, freight yard through window behind"),
  P("cmdr_marshal_defensive", "commanders", "Supreme Marshal — Defensive doctrine", "Supreme commander portrait for defensive factions",
    "Grey-bearded supreme marshal, greatcoat heavy with mud, binoculars around neck, standing before a concrete bunker line"),
  P("cmdr_field_a", "commanders", "Field Officer A", "Generic pool portrait for unnamed field officers",
    "Weary mid-career officer, stubble, cigarette, rain-slick helmet pushed back, trench periscope in hand"),
  P("cmdr_field_b", "commanders", "Field Officer B", "Generic pool portrait for unnamed field officers",
    "Stern woman officer, tight braid under peaked cap, signal-corps armband, field telephone at her ear"),
  P("cmdr_field_c", "commanders", "Field Officer C", "Generic pool portrait for unnamed field officers",
    "Grizzled artillery captain, powder-burned gloves, ear protectors around neck, shell casings stacked behind"),
  P("cmdr_field_d", "commanders", "Field Officer D", "Generic pool portrait for unnamed field officers",
    "Young tank commander half out of a crawler hatch, goggles up, oil-smudged grin, diesel smoke behind"),

  // ---------- PLAYER AVATARS ----------
  P("avatar_01", "avatars", "Avatar — The Veteran", "Player profile portrait option",
    "Portrait of a hardened veteran commander, eyepatch, brass-buttoned greatcoat, neutral backdrop of riveted steel plate"),
  P("avatar_02", "avatars", "Avatar — The Tactician", "Player profile portrait option",
    "Portrait of a calculating young strategist, slicked hair, compass and dividers in breast pocket, steel plate backdrop"),
  P("avatar_03", "avatars", "Avatar — The Quartermaster", "Player profile portrait option",
    "Portrait of a broad cheerful logistics officer, clipboard, grease-stained cuffs, steel plate backdrop"),
  P("avatar_04", "avatars", "Avatar — The Aviatrix", "Player profile portrait option",
    "Portrait of a fearless pilot commander, leather flight cap and goggles, white scarf, steel plate backdrop"),
  P("avatar_05", "avatars", "Avatar — The Engineer", "Player profile portrait option",
    "Portrait of a soot-marked engineer commander, welding goggles on forehead, wrench over shoulder, steel plate backdrop"),
  P("avatar_06", "avatars", "Avatar — The Commissar", "Player profile portrait option",
    "Portrait of a severe political officer, long dark coat, red armband with gear emblem, steel plate backdrop"),
  P("avatar_07", "avatars", "Avatar — The Scout", "Player profile portrait option",
    "Portrait of a wiry reconnaissance officer, camouflage cloak, field glasses, wind-burned face, steel plate backdrop"),
  P("avatar_08", "avatars", "Avatar — The Old Guard", "Player profile portrait option",
    "Portrait of an ancient decorated commander, white walrus mustache, chest full of tarnished medals, steel plate backdrop"),

  // ---------- FACTION CRESTS ----------
  P("crest_aggressive", "factions", "Doctrine Crest — Aggressive", "Emblem for aggressive-doctrine factions",
    "Military crest emblem: snarling iron wolf head over crossed shells, rivet-ringed shield, brass on gunmetal, flat insignia design"),
  P("crest_economic", "factions", "Doctrine Crest — Economic", "Emblem for economic-doctrine factions",
    "Military crest emblem: gear and wheat-sheaf over a ledger scale, rivet-ringed shield, brass on gunmetal, flat insignia design"),
  P("crest_defensive", "factions", "Doctrine Crest — Defensive", "Emblem for defensive-doctrine factions",
    "Military crest emblem: squat bastion tower behind a wall of pikes, rivet-ringed shield, brass on gunmetal, flat insignia design"),
  P("sigil_red", "factions", "House Sigil — Crimson", "Generic sigil for slot color #B33A3A",
    "Battle standard sigil: crimson diving falcon over a broken cog, distressed banner cloth texture, flat heraldic design"),
  P("sigil_blue", "factions", "House Sigil — Cobalt", "Generic sigil for slot color #3A6EA5",
    "Battle standard sigil: cobalt anchor-and-lightning mark, distressed banner cloth texture, flat heraldic design"),
  P("sigil_green", "factions", "House Sigil — Moss", "Generic sigil for slot color #5A7D4F",
    "Battle standard sigil: moss-green stag skull with antlers of pipework, distressed banner cloth, flat heraldic design"),
  P("sigil_amber", "factions", "House Sigil — Amber", "Generic sigil for slot color #B5722F",
    "Battle standard sigil: amber rising sun behind a crawler silhouette, distressed banner cloth, flat heraldic design"),

  // ---------- UNIT PLATES ----------
  P("unit_riflemen_token", "units", "Riflemen — Token", "Roster/token portrait for Riflemen",
    "Squad of trench riflemen shoulder to shoulder, fixed bayonets, mud-caked greatcoats, bust-height token composition"),
  P("unit_crawler_token", "units", "Diesel Crawler — Token", "Roster/token portrait for the Diesel Crawler",
    "Hulking riveted land crawler tank, multiple treads, smokestacks, three-quarter token composition"),
  P("unit_gunboat_token", "units", "Ironclad Gunboat — Token", "Roster/token portrait for the Ironclad Gunboat",
    "Low iron gunboat bristling with deck guns, bow wave, coal smoke trailing, three-quarter token composition"),
  P("unit_fighter_token", "units", "Prop Fighter — Token", "Roster/token portrait for the Prop Fighter",
    "Stub-winged prop fighter with exposed radial engine, banking hard, three-quarter token composition"),
  P("unit_artillery_token", "units", "Siege Artillery — Token", "Roster/token portrait for Siege Artillery",
    "Enormous rail-mounted siege gun with crew loading a shell taller than a man, three-quarter token composition"),
  P("unit_riflemen_action", "units", "Riflemen — Action Plate", "Wide action illustration for battle reports",
    "Riflemen going over the top through wire and smoke, muzzle flashes, one waving the line forward", "4:3"),
  P("unit_crawler_action", "units", "Diesel Crawler — Action Plate", "Wide action illustration for battle reports",
    "Diesel crawler breaching a trench line at night, headlamp beams through smoke, infantry sheltering behind", "4:3"),
  P("unit_gunboat_action", "units", "Ironclad Gunboat — Action Plate", "Wide action illustration for battle reports",
    "Gunboat broadside at dusk on a river delta, muzzle bloom reflected in black water", "4:3"),
  P("unit_fighter_action", "units", "Prop Fighter — Action Plate", "Wide action illustration for battle reports",
    "Prop fighters strafing a supply column, tracers converging, dust and burning trucks below", "4:3"),
  P("unit_artillery_action", "units", "Siege Artillery — Action Plate", "Wide action illustration for battle reports",
    "Siege battery firing at night, whole scene lit by muzzle flash, crew braced against the concussion", "4:3"),

  // ---------- FORTRESS-BASES & MODULES ----------
  P("base_aggressive", "fortress", "Fortress-Base — War Pattern", "Base exterior for aggressive factions",
    "Colossal mobile fortress on tank treads, bristling with gun turrets and ram prow, city-block scale, marching through wasteland", "4:3"),
  P("base_economic", "fortress", "Fortress-Base — Foundry Pattern", "Base exterior for economic factions",
    "Colossal mobile fortress-factory on treads, smokestacks and cranes, ore hoppers, glowing furnace vents, city-block scale", "4:3"),
  P("base_defensive", "fortress", "Fortress-Base — Bastion Pattern", "Base exterior for defensive factions",
    "Colossal mobile fortress like a rolling citadel, layered armor skirts, watchtowers, searchlights, city-block scale", "4:3"),
  P("mod_riveted_plating", "fortress", "Module — Riveted Plating", "Armor bay module art",
    "Close detail of massive overlapping riveted armor plates being bolted onto a hull, sparks, technical plate composition"),
  P("mod_bulwark_hull", "fortress", "Module — Bulwark Hull", "Armor bay module art",
    "Cross-section of layered composite fortress hull with internal bracing, blueprint-meets-painting technical plate"),
  P("mod_crawler_drives", "fortress", "Module — Crawler Drives", "Engine bay module art",
    "Gargantuan tread drive assembly, gears taller than workers beside it, oil sheen, technical plate composition"),
  P("mod_leviathan_turbines", "fortress", "Module — Leviathan Turbines", "Engine bay module art",
    "Twin monstrous diesel turbines with heat shimmer and blue exhaust flames, engineers dwarfed below, technical plate"),
  P("mod_salvage_refinery", "fortress", "Module — Salvage Refinery", "Industry bay module art",
    "On-board refinery deck, cracking towers and pipework, fuel drums on chain hoists, sodium lamp glow, technical plate"),
  P("mod_arc_smelters", "fortress", "Module — Arc Smelters", "Industry bay module art",
    "On-board arc smelter pouring white-hot steel, silhouetted crew with face shields, technical plate composition"),
  P("mod_habitat_decks", "fortress", "Module — Habitat Decks", "Industry bay module art",
    "Stacked habitat decks inside a fortress hull, laundry lines between bunks, families of the march, warm lamplight, technical plate"),

  // ---------- BUILDINGS ----------
  P("bld_barracks", "buildings", "Barracks", "Construction panel illustration",
    "Corrugated-iron barracks compound with drill yard, recruits mustering at dawn, banner pole, illustration plate"),
  P("bld_foundry", "buildings", "Foundry", "Construction panel illustration",
    "Smoke-belching foundry hall, crawler hulls on assembly line, crane gantries, orange furnace light, illustration plate"),
  P("bld_refinery", "buildings", "Refinery", "Construction panel illustration",
    "Field fuel refinery, cracking towers and spherical tanks, flare stack burning, pipeline into the mud, illustration plate"),
  P("bld_fortifications", "buildings", "Fortifications", "Construction panel illustration",
    "Concrete bunker line with dragon's teeth, wire, camouflaged gun ports, illustration plate"),
  P("bld_airstrip", "buildings", "Airstrip", "Construction panel illustration",
    "Forward dirt airstrip, prop fighters under camouflage netting, windsock, fuel bowser, illustration plate"),

  // ---------- TERRAIN ----------
  P("terr_plains", "terrain", "Plains", "Tile panel & probe intel artwork",
    "Windswept shell-pocked grassland plain, distant telegraph poles, low grey sky, landscape plate", "4:3"),
  P("terr_deltas", "terrain", "Deltas", "Tile panel & probe intel artwork",
    "Braided river delta with reed banks, pontoon crossings, mist on the water, landscape plate", "4:3"),
  P("terr_forest", "terrain", "Forest", "Tile panel & probe intel artwork",
    "Dark shattered pine forest, splintered trunks, fog between trees, faint trench line, landscape plate", "4:3"),
  P("terr_hills", "terrain", "Hills", "Tile panel & probe intel artwork",
    "Rolling scarred hills with mine heads and slag heaps, switchback roads, landscape plate", "4:3"),
  P("terr_highlands", "terrain", "Highlands", "Tile panel & probe intel artwork",
    "Bleak stony highlands, wind-bent grass, cairns and a ruined watchpost, driving cloud, landscape plate", "4:3"),
  P("terr_mountains", "terrain", "Mountains", "Tile panel & probe intel artwork",
    "Jagged iron-grey mountain pass, narrow supply road cut into cliff, snow line above, landscape plate", "4:3"),
  P("terr_marsh", "terrain", "Marsh", "Tile panel & probe intel artwork",
    "Oil-slicked marshland, dead trees, duckboard paths, gas lanterns on poles, sulfur haze, landscape plate", "4:3"),
  P("terr_industrial", "terrain", "Industrial", "Tile panel & probe intel artwork",
    "Ruined industrial district, collapsed factory sheds, rail sidings, chimney stumps, landscape plate", "4:3"),
  P("terr_sea", "terrain", "Sea Zone", "Tile panel & probe intel artwork",
    "Cold iron-grey sea under low cloud, distant smoke column on the horizon, whitecaps, landscape plate", "4:3"),

  // ---------- WEATHER ----------
  P("wx_clear", "weather", "Clear Skies", "Weather badge seal",
    "Round stamped brass weather seal: sun disc over an open field, engraved metal emblem style"),
  P("wx_rain", "weather", "Driving Rain", "Weather badge seal",
    "Round stamped brass weather seal: slanted rain over a drowning road, engraved metal emblem style"),
  P("wx_fog", "weather", "Heavy Fog", "Weather badge seal",
    "Round stamped brass weather seal: fog banks swallowing a watchtower, engraved metal emblem style"),
  P("wx_storm", "weather", "Thunderstorm", "Weather badge seal",
    "Round stamped brass weather seal: lightning bolt splitting a cloud anvil, engraved metal emblem style"),
  P("wx_snow", "weather", "Falling Snow", "Weather badge seal",
    "Round stamped brass weather seal: snowflakes over a frozen crawler, engraved metal emblem style"),

  // ---------- RESOURCES ----------
  P("res_manpower", "resources", "Manpower Token", "Replaces the 👥 icon",
    "Small stamped metal token: three helmeted silhouettes shoulder to shoulder, coin-like relief, brass finish"),
  P("res_steel", "resources", "Steel Token", "Replaces the ⚙ icon",
    "Small stamped metal token: I-beam and gear in relief, coin-like, gunmetal finish"),
  P("res_fuel", "resources", "Fuel Token", "Replaces the 🛢 icon",
    "Small stamped metal token: fuel drum with a flame in relief, coin-like, oily bronze finish"),

  // ---------- MEDALS ----------
  P("medal_iron_hammer", "medals", "Order of the Iron Hammer", "Three consecutive victories",
    "Military medal: black iron hammer on a cog-toothed star, red-and-black ribbon, worn enamel, catalog photo style"),
  P("medal_brass_star", "medals", "Brass Star of Command", "Decisive victory with minimal casualties",
    "Military medal: polished brass five-point star with laurel, gold-and-olive ribbon, catalog photo style"),
  P("medal_defiant_standard", "medals", "The Defiant Standard", "Victory against a superior force",
    "Military medal: torn battle flag cast in silver on a shield, grey-and-crimson ribbon, catalog photo style"),
  P("medal_marshals_cross", "medals", "The Marshal's Cross", "Five career victories",
    "Military medal: heavy cross pattée with crossed batons, deep blue ribbon with brass edge, catalog photo style"),

  // ---------- MANEUVER CARDS ----------
  P("mnv_all_out_attack", "maneuvers", "All-Out Attack", "Order card art",
    "Order-card illustration: entire line charging from trenches into smoke, bayonets down, reckless momentum", "4:3"),
  P("mnv_attack", "maneuvers", "Attack", "Order card art",
    "Order-card illustration: disciplined advance by squads, covering fire, textbook assault", "4:3"),
  P("mnv_defend", "maneuvers", "Hold the Line", "Order card art",
    "Order-card illustration: braced defenders behind sandbags and wire, fixed machine gun arcs", "4:3"),
  P("mnv_flank", "maneuvers", "Flanking Maneuver", "Order card art",
    "Order-card illustration: column slipping through a smoke screen around the enemy's edge, arrows of movement", "4:3"),
  P("mnv_feint", "maneuvers", "Feint", "Order card art",
    "Order-card illustration: dummy attack with flares and noise makers while the real force waits in shadow", "4:3"),
  P("mnv_rally", "maneuvers", "Rally the Ranks", "Order card art",
    "Order-card illustration: officer on a crate under a shot-torn banner, exhausted troops reforming around him", "4:3"),

  // ---------- EFFECT TEXTURES ----------
  P("fx_explosion", "effects", "Shell Burst", "Explosion overlay texture for battle FX",
    "Single artillery shell burst on black background, orange core and earth thrown skyward, isolated VFX element"),
  P("fx_muzzle", "effects", "Muzzle Bloom", "Muzzle flash overlay texture",
    "Single side-on muzzle flash on black background, star-shaped bloom with smoke ring, isolated VFX element"),
  P("fx_smoke", "effects", "Drifting Smoke", "Smoke overlay texture for dioramas",
    "Wide drifting battlefield smoke bank on black background, layered grey-brown, isolated VFX element", "4:3"),
  P("fx_sparks", "effects", "Weld Sparks", "Spark shower texture for refit/impact FX",
    "Shower of white-orange weld sparks on black background, motion streaks, isolated VFX element"),
  P("fx_grit", "effects", "Grit & Scratches", "Full-screen wear overlay for panels",
    "Seamless texture of scratched oil-stained metal with dust and film grain, tileable, very subtle contrast", "4:3"),

  // ---------- BACKDROPS ----------
  P("bg_home_hero", "backdrops", "Home — The Marching Front", "Alternate hero backdrop for the command deck",
    "Vast panorama: a mobile fortress-base on the horizon at dusk, columns of troops and crawlers marching toward it, artillery flashes far off", "16:9"),
  P("bg_lobby", "backdrops", "Lobby — The War Room", "Backdrop for the game lobby",
    "Underground war room, giant map table lit by a single lamp, officers leaning over it, wire and pipes overhead", "16:9"),
  P("bg_victory", "backdrops", "Victory — The Silent Guns", "End-of-war victory screen",
    "Dawn over a quiet battlefield, soldiers resting on a captured fortress rampart, tattered banner raised, golden light", "16:9"),
  P("bg_defeat", "backdrops", "Defeat — The Long Retreat", "End-of-war defeat screen",
    "Column of survivors retreating through rain past a burning fortress-base, heads down, grey palette", "16:9"),
  P("bg_commission", "backdrops", "Commission Papers Texture", "Paper backdrop for the induction ceremony",
    "Aged ministry document paper, faint watermark crest, fold lines, ink smudges, typewriter margins, flat texture", "4:3"),
  P("bg_parchment_map", "backdrops", "War-Table Map Parchment", "Underlay texture for map surfaces",
    "Aged field-map paper with faint grid, coffee rings, grease-pencil arrows half erased, flat texture", "4:3"),
  P("bg_battle_day", "backdrops", "Battle Diorama — Overcast Front", "Backdrop behind the battle diorama",
    "Wide shallow battlefield strip, cratered no-man's-land, ruined farmhouse, overcast sky, staging space at bottom", "16:9"),
  P("bg_battle_storm", "backdrops", "Battle Diorama — Storm Front", "Storm-weather diorama backdrop",
    "Wide shallow battlefield strip under a thunderstorm, lightning silhouetting wrecks, rain sheets, staging space at bottom", "16:9"),

  // ---------- MINISTRY MARKS ----------
  P("ui_app_crest", "ui", "App Crest", "Master crest for the home screen and login",
    "Grand ministry crest: shield with crossed cannon and gear, fortress-base silhouette above, scroll reading space below, brass relief"),
  P("ui_ministry_seal", "ui", "Ministry of War Seal", "Seal for dispatches and patch notes",
    "Circular embossed wax-and-brass official seal, gear-toothed border, stern eagle over a cog, worn edges"),
  P("ui_classified_stamp", "ui", "CLASSIFIED Stamp", "Overlay stamp for intel and dossiers",
    "Red ink rubber stamp reading CLASSIFIED in stencil letters, uneven ink coverage, transparent background"),
  P("ui_wax_seal", "ui", "Envoy Wax Seal", "Seal for diplomacy offers and accords",
    "Deep red wax seal with a handshake-over-cog impression, cracked edge, on transparent background"),
  P("ui_divider", "ui", "Ordnance Divider", "Decorative section divider ornament",
    "Horizontal ornament: engraved line of rivets and small shells flanking a central gear, brass on transparent background", "16:9"),
];

export const getImage = (key) => IMAGE_LIBRARY.find((i) => i.key === key)?.url || null;
export const libraryStats = () => ({
  total: IMAGE_LIBRARY.length,
  delivered: IMAGE_LIBRARY.filter((i) => i.url).length,
});