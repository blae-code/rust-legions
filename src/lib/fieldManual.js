// Field Manual — in-game codex content, curated for players from docs/GAME_RULES.md
// (Field Regulations) and docs/LORE.md (Ground Almanac). Display only: this is a
// reader surface, not a rules source. When the rules change, update GAME_RULES.md +
// the engine/mirrors first, then reflect the player-facing summary here.
//
// Block schema consumed by <ManualBlock>:
//   { p: string }                     paragraph
//   { h: string }                     sub-heading
//   { lead: string }                  emphasised standfirst line
//   { list: string[] }                bulleted list
//   { table: { head: string[], rows: string[][] } }
//   { note: string }                  ministry callout
//   { quote: string, cite?: string }  pulled quotation
//
// Every chapter: { id, title, tag?, blocks[] }. `tag` is a short stencilled label.

export const RULES = {
  title: "Field Regulations",
  subtitle: "War Ministry Field Manual — issued to all commanding officers",
  chapters: [
    {
      id: "victory",
      title: "Conditions of Victory",
      tag: "Doctrine §1",
      blocks: [
        { lead: "A war on the Ground ends one of four ways. Know which you are fighting toward." },
        {
          table: {
            head: ["Condition", "Requirement"],
            rows: [
              ["Map Control", "Hold ≥ 60% of land zones at the start of your turn."],
              ["Capital Domination", "Own every capital tile on the map."],
              ["Last Standing", "All rival houses eliminated (a house falls when it holds zero tiles)."],
              ["Campaign (solo)", "Meet the scenario charter — survive N turns, or hold N% of the land."],
            ],
          },
        },
        { note: "An eliminated house loses its field armies as well as its ground. There is no coming back to the March once the last zone is gone." },
      ],
    },
    {
      id: "economy",
      title: "Resources & the Treasury",
      tag: "Doctrine §2",
      blocks: [
        { p: "Three commodities run the war: Manpower, Steel, and Fuel. Every house opens its ledger at 6 Manpower / 10 Steel / 6 Fuel, adjusted by point-buy provisions." },
        { p: "Income is drawn at the START of your turn, one commodity per worked zone, set by its ground:" },
        {
          table: {
            head: ["Ground", "Yields"],
            rows: [
              ["Plains, deltas, forest", "Manpower"],
              ["Hills, highlands, mountains", "Steel"],
              ["Marsh", "Fuel"],
            ],
          },
        },
        { h: "Resource seams" },
        { list: [
          "Oil field: +2 Fuel.",
          "Coal depot: +1 Steel.",
          "Iron foundry: +1 Steel, and −1 Steel on the owner's crawler cost (never below 1).",
        ] },
        { note: "A house that loses its capital draws ZERO income until it is retaken. Guard the seat of the keel." },
      ],
    },
    {
      id: "buildings",
      title: "Works & Construction",
      tag: "Doctrine §3",
      blocks: [
        { p: "One build slot per land zone; capitals carry two. One construction or upgrade begins per action and completes — level +1 — at the start of your NEXT turn. Maximum level 2 where upgradeable. The zone must be in supply to build." },
        {
          table: {
            head: ["Work", "Cost", "Upgrade", "Effect / level"],
            rows: [
              ["Barracks", "4 Steel", "6 Steel", "+1 Manpower; deploys riflemen; supply hub; muster site"],
              ["Foundry", "3 MP + 2 Fuel", "4 MP + 3 Fuel", "+1 Steel; deploys crawlers/artillery; coastal builds gunboats"],
              ["Refinery", "4 Steel", "6 Steel", "+2 Fuel"],
              ["Fortifications", "5 Steel", "7 Steel", "+level zone defence; supply hub"],
              ["Airstrip", "3 Steel + 3 Fuel", "—", "deploys fighters"],
            ],
          },
        },
        { p: "Captured zones keep any completed works standing on them." },
      ],
    },
    {
      id: "units",
      title: "The Order of Battle",
      tag: "Doctrine §4",
      blocks: [
        {
          table: {
            head: ["Unit", "Pts", "Cost", "Atk", "Def", "Domain", "Deploys at"],
            rows: [
              ["Riflemen", "5", "2 MP + 1 St", "1", "2", "land", "Barracks"],
              ["Crawler", "12", "3 St + 2 F", "3", "2", "land", "Foundry"],
              ["Gunboat", "10", "3 St + 1 F", "2", "2", "sea", "adjacent coastal Foundry"],
              ["Fighter", "15", "2 St + 3 F", "3", "1", "air", "Airstrip"],
              ["Artillery", "10", "3 St + 1 MP", "1", "1", "land", "Foundry"],
            ],
          },
        },
        { h: "Standing rules" },
        { list: [
          "Army cap (all points, garrison + field): max(90, Manpower income × 10), adjusted by provisions.",
          "Casualties fall in order: riflemen → crawler → gunboat → artillery → fighter.",
          "Land units cannot enter the sea; gunboats cannot come ashore; fighters strike land or sea.",
          "Purchase requires the target zone to be in supply.",
        ] },
      ],
    },
    {
      id: "garrison-combat",
      title: "Garrison Combat",
      tag: "Doctrine §5",
      blocks: [
        { p: "Zone-versus-zone fighting between adjacent tiles. Commit specific companies from one tile against the next." },
        { list: [
          "Each round, every company rolls 1d6 and hits on a roll ≤ its effective stat (clamped 1–5). Rounds resolve simultaneously until one side is wiped, or 25 rounds pass.",
          "Defender bonuses: fortification level + capital defence provisions + terrain + fortress-base hull.",
          "Attacker modifiers: weather (rain/snow −1) and slope (uphill −1, downhill +1).",
          "Any enemy field army standing on the target folds into its defence first.",
        ] },
        { h: "Outcomes" },
        { list: [
          "Captured — defenders wiped; your survivors garrison the ground.",
          "Repelled — your attack is wiped out.",
          "Retreated — the round cap is reached; survivors fall back home.",
        ] },
      ],
    },
    {
      id: "terrain",
      title: "Ground & Elevation",
      tag: "Doctrine §6",
      blocks: [
        { p: "Terrain grants the defender a standing bonus (garrison defence / mass-battle skill):" },
        {
          table: {
            head: ["Ground", "Defence"],
            rows: [
              ["Mountains", "+2"],
              ["Hills, highlands, forest, marsh, industrial", "+1"],
              ["Plains, deltas", "0"],
            ],
          },
        },
        { p: "Elevation tiers: mountains 3, highlands 2, hills 1, all else 0. Attacking UPHILL is −1; DOWNHILL is +1 (both combat systems, and +1 to bombard hit numbers firing downhill)." },
      ],
    },
    {
      id: "supply",
      title: "Supply & Logistics",
      tag: "Doctrine §7",
      blocks: [
        { p: "Supply hubs: capitals, any completed Fortifications or Barracks, and the fortress-base wherever it stands on friendly ground. Supply flows 4 range through contiguous friendly land (1 per tile; mountains/marsh/highlands cost 2)." },
        { h: "Out of supply" },
        { list: [
          "Field armies lose 1 company to attrition at the start of your turn (an emptied army disbands, with a general fate check).",
          "Cut-off forces fight at −2 battle skill; besieged defenders share that penalty.",
          "Severed zones cannot build, purchase, or reinforce.",
        ] },
      ],
    },
    {
      id: "weather",
      title: "The Weather Office",
      tag: "Doctrine §8",
      blocks: [
        { p: "Weather is rolled for the whole front each full turn cycle (weights: clear 35, rain 22, fog 18, storm 12, snow 13)." },
        {
          table: {
            head: ["Front", "Effect"],
            rows: [
              ["Clear", "None."],
              ["Rain", "Attacker −1; mountains/highlands/marsh impassable; bombards hit only on ≤2."],
              ["Fog", "Defender −1; probe intel halved."],
              ["Storm", "Fighters and gunboats cannot move or attack."],
              ["Snow", "Crawlers cannot move or attack; crawler-bearing armies cannot march; attacker −1."],
            ],
          },
        },
      ],
    },
    {
      id: "mass-combat",
      title: "Field Armies, Generals & Mass Battles",
      tag: "Doctrine §9",
      blocks: [
        { lead: "The set-piece war. Field armies march the map under named generals and fight round by round with secret, simultaneous maneuvers." },
        { h: "Mustering" },
        { list: [
          "Requires a completed Barracks on owned ground; draws companies from the garrison.",
          "Led by a general — take a free one or recruit for 4 Manpower (random strategy/leadership 6 + d3 + d3).",
          "Each house opens with a Marshal (supreme commander, base 10/10 + doctrine bonus). Marshals never die.",
        ] },
        { h: "Progression & honours" },
        { list: [
          "+1 strategy per 2 victories (to 14). Non-supreme generals face a 50% death chance when their army is destroyed.",
          "Veterancy: Green / Seasoned +1 / Veteran +2 / Elite +3 battle skill.",
          "Medals: Iron Hammer (3-win streak), Brass Star (win with ≤10% losses vs a force ≥3), Defiant Standard (beat a foe ≥1.5× your start), Marshal's Cross (5 career wins).",
        ] },
        { h: "The maneuver deck" },
        {
          table: {
            head: ["Maneuver", "Skill", "DmgOut", "DmgIn", "Note"],
            rows: [
              ["All-Out Attack", "−2", "1.6", "1.5", ""],
              ["Attack", "0", "1.0", "1.0", ""],
              ["Hold the Line", "+2", "0.5", "0.6", ""],
              ["Flanking Maneuver", "−1", "1.3", "0.8", ""],
              ["Feint", "+1", "0.3", "0.7", "+2 skill next round"],
              ["Rally the Ranks", "0", "0.2", "0.9", "+20 own morale"],
              ["Relentless Pursuit ★", "−1", "1.5", "1.2", "Butcher signature · cd 4"],
              ["Staged Ambush ★", "+2", "1.3", "0.7", "Fox signature · cd 3"],
              ["Iron Wall ★", "+3", "0.3", "0.35", "Bulwark signature · cd 3"],
              ["Inspiring Charge ★", "0", "1.1", "1.0", "Firebrand signature · cd 2"],
            ],
          },
        },
        { note: "A battle ends on annihilation, on a morale rout (≤ 0), or after 15 rounds — at which point the attacker withdraws to their staging ground. Both sides open at 100 morale." },
        { p: "If the defender's presence heartbeat is under 60 seconds old, they play their maneuvers live; otherwise the field AI picks by doctrine." },
      ],
    },
    {
      id: "bombard-recon",
      title: "Bombardment & Reconnaissance",
      tag: "Doctrine §10–12",
      blocks: [
        { h: "Artillery bombardment" },
        { list: [
          "Shell one adjacent enemy land zone from a zone holding artillery. Costs 1 Fuel; once per firing zone per turn.",
          "Each gun rolls 1d6, hitting on ≤3 (≤2 in rain; +1 firing downhill). Each hit kills one company. Bombardment never takes ground.",
        ] },
        { h: "Reconnaissance probe" },
        { list: [
          "Costs 1 Fuel; the target must be adjacent to your zones or armies.",
          "Returns partial intel, each detail rolled independently (halved in fog): garrisons 70%, fort level 70%, works 60%, army regiments 60%, rank 70%, general trait/strategy 50%.",
        ] },
      ],
    },
    {
      id: "designs",
      title: "The Army Design Bureau",
      tag: "Doctrine §11",
      blocks: [
        { p: "Persistent doctrine templates, applied at muster for a resource surcharge. One option per slot:" },
        {
          table: {
            head: ["Slot", "Option", "Effect", "Surcharge"],
            rows: [
              ["Formation", "Vanguard", "dmgOut ×1.2, dmgIn ×1.15", "—"],
              ["", "Skirmish", "dmgOut ×0.85, dmgIn ×0.85", "—"],
              ["", "Column", "dmgOut ×0.95, moraleIn ×0.85", "—"],
              ["Weapon", "Trench Guns", "dmgOut ×1.1", "2 Steel"],
              ["", "Mortars", "+1 skill", "3 Steel"],
              ["Armor", "Plated", "dmgIn ×0.85", "3 Steel"],
              ["", "Scout", "+1 skill, dmgIn ×1.1", "1 Fuel"],
              ["Support", "Medics", "dmgIn ×0.9", "2 MP"],
              ["", "Signals", "+1 skill", "2 Fuel"],
              ["", "Commissars", "moraleIn ×0.8", "2 MP"],
            ],
          },
        },
      ],
    },
    {
      id: "diplomacy",
      title: "The Envoy Desk",
      tag: "Doctrine §17",
      blocks: [
        { p: "Dispatch one envoy per rival house per turn. Accords forbid attack, engagement, and bombardment between the parties until they lapse — a lapse is announced, and hostilities may resume." },
        {
          table: {
            head: ["Proposal", "Terms"],
            rows: [
              ["Truce", "Ceasefire, 5 turns."],
              ["Non-Aggression Pact", "10 turns."],
              ["Trade", "Resource exchange (steel & fuel valued ×1.5, manpower ×1)."],
            ],
          },
        },
        { p: "NPC houses judge by disposition (−100…+100): a truce needs ≥ −15, a pact ≥ +10, a trade a fair-and-coverable offer. Signing lifts disposition; attacks and refusals sour it." },
      ],
    },
    {
      id: "fortress",
      title: "The Fortress-Base (Keel)",
      tag: "Doctrine §18",
      blocks: [
        { lead: "Every house rides one keel — capital, factory, and supply heart on treads. Its hull grants +1 defence to its zone and makes it a prime supply hub wherever it stands on friendly ground." },
        { h: "Module bays (one per bay)" },
        {
          table: {
            head: ["Bay", "Module", "Cost", "Effect"],
            rows: [
              ["Armor", "Riveted Plating", "5 St", "+2 zone defence"],
              ["", "Bulwark Hull", "9 St + 2 F", "+4 zone defence"],
              ["", "Citadel Plate ★", "12 St + 3 F", "+6 zone defence"],
              ["Engine", "Crawler Drives", "4 St + 3 F", "move 1 zone/turn (open ground)"],
              ["", "Leviathan Turbines", "6 St + 6 F", "move 1 zone/turn, crosses rough terrain"],
              ["", "Juggernaut Reactors ★", "8 St + 8 F", "all-terrain; march costs 1 Fuel not 2"],
              ["Industry", "Salvage Refinery", "4 St + 2 F", "+2 Fuel"],
              ["", "Arc Smelters", "6 St + 2 MP", "+2 Steel"],
              ["", "Habitat Decks", "5 St", "+2 Manpower"],
              ["", "Munitions Works ★", "8 St + 3 MP", "+1 of every resource"],
            ],
          },
        },
        { note: "★ prototypes must first be certified in the State Armory. Movement needs an engine module, costs 2 Fuel (1 with Juggernaut Reactors), and is blocked in snow or mid-battle. If the keel's zone is captured, the base is WRECKED permanently — it is never rebuilt." },
      ],
    },
    {
      id: "research-armory",
      title: "War Sciences & the State Armory",
      tag: "Doctrine §19–20",
      blocks: [
        { p: "Set one research focus (changeable any time, even off-turn). One research point accrues per completed turn cycle; a finished tech merges permanently. NPC houses do not research." },
        {
          table: {
            head: ["Branch", "Tier 1 (3)", "Tier 2 (4)", "Tier 3 (6)"],
            rows: [
              ["Armament", "+1 rifle atk", "+1 crawler def", "+1 crawler & fighter atk"],
              ["Industry", "+1 Steel", "+1 Fuel", "+1 MP, +20 cap"],
              ["Logistics", "+10 cap", "+1 supply range", "+1 capital & rifle def"],
            ],
          },
        },
        { p: "The State Armory takes one-time treasury purchases at any time: certify ★ fortress prototypes for the Refit Yard, and enact ideology decrees (War Bonds, Fuel Rationing, Universal Levy, Hearth & Bulwark) whose bonuses apply at once." },
      ],
    },
    {
      id: "command-vehicles",
      title: "Command Vehicles & Refit Logistics",
      tag: "Doctrine §21",
      blocks: [
        { p: "Every general fights from a command vehicle themed to their trait — the Butcher's Mauler, the Fox's Vixen, the Bulwark's Redoubt, the Firebrand's Clarion, the Supreme's Paramount — each hooking into mass-combat skill, damage, and morale." },
        { h: "The scarcity of refit" },
        { list: [
          "Command vehicles refit instantly at any friendly Barracks or Foundry, or alongside the keel.",
          "The keel itself needs heavy gantry cranes: a capital or a level-2 Foundry only.",
          "Anywhere in supply, refits arrive by convoy next turn at 25% off — economical but slow.",
          "Cut off with no site in reach, no refit is possible.",
        ] },
      ],
    },
  ],
};

export const LORE = {
  title: "Ground Almanac",
  subtitle: "The Lore Bible — what the ministries hold true, and what they never answer",
  chapters: [
    {
      id: "the-ground",
      title: "The Ground, a Pilfered World",
      tag: "Almanac §1",
      blocks: [
        { p: "The world has no agreed name. The ministries call it the Ground; the oldest imperial fragments call it the Site — not a home, not a colony, but a work-site designation. It was rich once. The Empire took the richness up and away for longer than memory holds, and the great houses now fight over the dregs: thin seams, lean lodes, and the ruins of the machines that did the taking." },
        { p: "It is, by any honest ledger, a dead world — habitable, stubborn, but spent. Which is why every house that matters is looking for the way off it." },
      ],
    },
    {
      id: "departures",
      title: "The Empire & the Four Departures",
      tag: "Almanac §2",
      blocks: [
        { p: "Humanity did not evolve here and did not come free. It came — or was brought — as the ward of a vast interstellar empire: fed, ordered, put to purpose, never told anything. The Ground's names for it are its own: the Wardens, the Landlords, the Absent. And then, on a day no calendar preserved, the Empire left — suddenly, completely, taking its fleets and its answers." },
        { lead: "Why the suddenness is the question under every war on the Ground. Four readings dominate." },
        {
          table: {
            head: ["Departure", "The claim", "Held by"],
            rows: [
              ["The Recall", "The Empire was summoned home and means to return; the wardship is suspended, not ended. Be ready; the Key is an appeal.", "Restorationist orthodoxy; the Synod"],
              ["The Finished Ledger", "The planet stopped paying; the job was done and the crews went home. No one is coming.", "The Combine; the Emberwrights"],
              ["The Flight", "They did not withdraw — they fled something. The Key must never be turned.", "The Covenant of Locks"],
              ["The Discarding", "'Ward' is the flattering word; humanity was site labour, discarded with the gear. We owe them nothing.", "The hard-Reclaimer houses"],
            ],
          },
        },
        { note: "The Creed axis is this argument made mechanical: Restorationists hold that the way up runs through the Empire's works; Reclaimers hold that humanity builds its own ascent and owes the Landlords not even curiosity." },
      ],
    },
    {
      id: "reckoning",
      title: "The Reckoning — Calendar & the Two Moons",
      tag: "Almanac §3.1",
      blocks: [
        { p: "The Ground's day runs 36 hours — a long light and a longer dark, lived in watches. Ten days make a ten-day; four ten-days make a month; ten months — 400 days — make one solar year. Years are counted F.I., since First Ignition. The present is 383 F.I." },
        { p: "The reckoning is a scar. The ten-day is the Empire's own quota cycle: under the Wardship the manifests were posted and quotas counted every tenth day — lift-day — and on the last lift-day no manifest came. Humanity still measures its weeks in the Landlords' shift schedule." },
        { h: "The two Lights" },
        { list: [
          "The First Light, the Lamp — broad, slow, pale. Bright nights ride under a full Lamp.",
          "The Second Light, the Coal — small, fast, an ash-black stone that occults stars. A Coal-only night is a dark-run, beloved of raiders and runners.",
        ] },
        { quote: "…and on the last lift-day no manifest was posted, and the sky-cradles stood open, and no one came to count us.", cite: "fragment, provenance disputed, kept under glass at the Nine Cradles" },
      ],
    },
    {
      id: "history",
      title: "History, in Fragments",
      tag: "Almanac §3",
      blocks: [
        { p: "No history of the Ground is trusted whole. What follows is the ministries' best thread, knotted from bones and grudges." },
        {
          table: {
            head: ["Era", "What is said"],
            rows: [
              ["The Wardship", "Humanity under the Empire, put to the extraction. Almost nothing survives firsthand — but every tongue shares the words quota, manifest, lift-day."],
              ["The Withdrawal", "The sudden departure; the founding trauma. Days or hours, not years. Orbital works dropped; sites sealed mid-shift."],
              ["The Quiet Centuries", "Scattered survival among the ruins; memory eroding into hymn and grudge."],
              ["The Ignition — 0 F.I.", "A fuel seam struck and a sealed cache pried open. Diesel civilisation is born — not invented but scavenged from imperial scrap."],
              ["The Cartel Wars — c.90–141", "The seam-cartels fight over the dregs. Fixed cities rise on the richest ruins — and sicken."],
              ["The First March — 141 F.I.", "At the Siege of the Hundredweight a mining combine unbolts its refinery onto treads and drives out: the First Keel. The Long March era begins."],
              ["The Present — 383 F.I.", "The great houses roam a spent world, racing for the scraps that might, assembled, amount to the Key: the way off."],
            ],
          },
        },
      ],
    },
    {
      id: "rot",
      title: "Ground-Rot — Why Nothing Large Sits Still",
      tag: "Almanac §4",
      blocks: [
        { p: "The Ground keeps no cities. Settle too many people too densely too long — above all on worked ground — and the rot sets in: wasting, failed harvests, stillbirths, and the dreams the diggers call machine-sleep." },
        { p: "Ministries measure rot-counts; parishes call it the Rent and say the Landlords still collect. Whether it is the wound of the extraction, the exhaust of what lies buried, or something older is never answered. What it forces is the shape of the world: settlements stay small, the great powers stay moving, and a living still-city is rare, walled, and lying about something." },
      ],
    },
    {
      id: "leavings",
      title: "The Leavings — Precursor Relics",
      tag: "Almanac §5",
      blocks: [
        { p: "What the Empire abandoned, the Ground calls the leavings; the ministries assign Object numbers, the folk assign names within the week. Four classes, per the captured survey typology:" },
        {
          table: {
            head: ["Class", "What it is", "In the war"],
            rows: [
              ["Caches", "Sealed stores — alloys, fuel, components", "One-off windfalls; the 'break it for parts' temptation"],
              ["Engines", "Functional imperial machinery", "The unique base modules — found, never built"],
              ["Ciphers", "Archives, cores, marked stones — information", "Progress toward the Key; the Synod's obsession"],
              ["Wakes", "Machinery still running", "Hazards: wardens that stir, beacons that answer to no one"],
            ],
          },
        },
        { note: "A red flag flies over every unclassified find — the one signal every house honours, because a misread Wake buries all creeds equally." },
      ],
    },
    {
      id: "settled",
      title: "The Settled",
      tag: "Almanac §6",
      blocks: [
        { p: "Settlements are polities of their ground and nothing beyond it: burn-towns, mining combines, farm communes, waystations, scrap-parishes, still-cities. They trade with, submit to, or are raided by whichever fortress rolls past — and they remember." },
        { p: "The Anchor Fields — the vast cradle-ruins where the Empire's lifting structures stood, where the world's wealth went up — are the holiest and most contested ground of all: pilgrimage to those awaiting the Recall, quarry to those balancing the Finished Ledger, sealed perimeter wherever the Covenant can hold one." },
      ],
    },
    {
      id: "houses",
      title: "The Great Houses",
      tag: "Almanac §7",
      blocks: [
        { p: "Ten houses, every one an answer to the Departure and a bid for the Key:" },
        {
          table: {
            head: ["House", "Its bid"],
            rows: [
              ["Iron Reclamation", "Unify humanity and build its own hull — the Discarding, armed."],
              ["Charter Combine", "Own the ticket booth whenever the way up opens — the Ledger, incorporated."],
              ["Bastion Synod", "Preserve the means until humanity is worthy of the Recall."],
              ["Covenant of Locks", "Exist so that no one turns the Key at all — the Flight, militant."],
              ["Signal Ascendancy", "Broadcast to the Absent, demanding an answer or an audition."],
              ["Commonweal March", "A people who cannot feed each other have no business among stars."],
              ["Salvage Court", "Adjudicate everyone else's salvage at knifepoint."],
              ["Emberwright Union", "Beat the Rent and build the New Ignition — a foundry aimed at the sky."],
              ["Long Procession", "Crusade to gather the leavings into worthy hands."],
              ["Outrider Compact", "Keep the doors shut, the dead paid, and the intelligence priced fairly."],
            ],
          },
        },
      ],
    },
    {
      id: "keels",
      title: "Keels & Their Names",
      tag: "Almanac §8",
      blocks: [
        { p: "Every fortress-base traces — or forges — lineage to the First Keel of 141 F.I. The full style is: the [Name], [Ordinal] Keel of [House]." },
        { p: "Names are vows, debts, or verdicts: an abstract noun bound to a hard material. Vow of Coal. Debt of Winters. Verdict of Iron. Patience of Rust." },
      ],
    },
    {
      id: "glossary",
      title: "Glossary of the March",
      tag: "Almanac §9",
      blocks: [
        {
          table: {
            head: ["Term", "Meaning"],
            rows: [
              ["the Ground / the Site", "The world, in ministry and imperial usage."],
              ["the Wardens / Landlords / Absent", "The departed empire, by its three names."],
              ["the Wardship / the Withdrawal", "The era under the Empire / its sudden leaving."],
              ["lift-day / manifest / quota", "Wardship-era words surviving in every tongue."],
              ["the Key", "The assembled way off-world — the headline prize."],
              ["the leavings", "Relic material, of any class."],
              ["F.I.", "Years since First Ignition (now 383). A year is 10 months of 4 ten-days — 400 days of 36 hours."],
              ["the Lamp / the Coal", "The two moons; a dark-run is a Coal-only night."],
              ["keel", "A fortress-base and its lineage."],
              ["the March", "A house's campaign."],
              ["the Rent / rot-count", "Ground-rot, folk and official."],
              ["Anchor Field", "A cradle-ruin of the Empire's lifting works."],
              ["Object [N] / red flag", "A relic designation / an unclassified find — don't touch."],
              ["machine-sleep", "The diggers' dreams."],
              ["red traffic", "Combat-band radio."],
              ["the Quiet", "The lost centuries; settler slang for death."],
              ["swath", "A keel's depleted trail."],
            ],
          },
        },
      ],
    },
  ],
};

export const BOOKS = [RULES, LORE];
