// The Ministry Archive — the wiki corpus.
//
// AUTHORITY: docs/LORE.md governs lore; docs/GAME_RULES.md + the engine govern rules.
// This file is a READER SURFACE. Entries here must never invent canon — when an entry
// needs something the source documents don't say, mark it status "thin" and log the
// question in src/lib/wiki/register.js instead of writing an answer.
//
// Entry schema:
//   id       stable slug (used in the URL hash and in `see` links)
//   title    display title
//   folk     optional worn folk name — the second register (LORE §0.2)
//   category one of CATEGORIES below
//   tag      short stencilled source citation
//   status   'canon' | 'contested' | 'unanswered' | 'thin'   (see STATUS)
//   summary  one-line standfirst, shown in search results
//   blocks   ManualBlock blocks (see src/lib/fieldManual.js for the schema)
//   see      related entry ids
//   manual   optional Field Manual chapter id for the full regulation

export const CATEGORIES = [
  { id: "cosmology", label: "The World & Its Sky" },
  { id: "history", label: "History in Fragments" },
  { id: "powers", label: "Peoples & Powers" },
  { id: "war", label: "The Machine of War" },
  { id: "leavings", label: "The Leavings" },
  { id: "theaters", label: "Charted Theaters" },
  { id: "lexicon", label: "Lexicon" },
];

export const STATUS = {
  canon: { label: "Ministry-Sealed", hint: "Held true and cross-checked against the governing documents.", tone: "brass" },
  contested: { label: "Sources Disputed", hint: "Attributed fragments that contradict one another. The contradiction is the record.", tone: "steel" },
  unanswered: { label: "Never Answered", hint: "Canonically unanswerable. No document, character or system may resolve it.", tone: "rust" },
  thin: { label: "Under Survey", hint: "Thin ground — logged in the Marginalia as an outstanding query.", tone: "olive" },
};

export const ENTRIES = [
  // ── The World & Its Sky ───────────────────────────────────────────────
  {
    id: "the-ground",
    title: "The Ground",
    folk: "the Site",
    category: "cosmology",
    tag: "Almanac §1",
    status: "canon",
    summary: "The world itself — a pilfered planet with no agreed name, worked out and left behind.",
    blocks: [
      { lead: "It was rich once. The Empire took the richness up and away for longer than memory holds." },
      { p: "The ministries call it the Ground. The oldest imperial fragments call it the Site — not a home, not a colony, but a work-site designation, and that single word is the detail that keeps archivists awake. What the great houses fight over now are the dregs: thin seams, lean lodes, and the ruins of the machines that did the taking." },
      { p: "By any honest ledger it is a dead world: habitable, stubborn, spent. Which is why every house that matters has stopped trying to hold it and started looking for the way off it." },
      { note: "Every system in the game rests on this premise. Ground is worth taking for its yield, never for its permanence — hold it while it pays, then march." },
    ],
    see: ["ground-rot", "the-key", "the-empire", "anchor-fields"],
  },
  {
    id: "the-empire",
    title: "The Empire",
    folk: "the Wardens · the Landlords · the Absent",
    category: "cosmology",
    tag: "Almanac §2",
    status: "unanswered",
    summary: "The vast interstellar power that wardened humanity, stripped the world, and left without explanation.",
    blocks: [
      { p: "Humanity did not evolve here and did not come here free. It came — or was brought — as the ward of an interstellar empire: fed, ordered, put to purpose, and never told anything. Then, on a day no calendar preserved, the Empire left. Not wound down, not withdrawn in stages: left, suddenly, completely, taking its fleets and its answers." },
      { h: "Its three names" },
      { list: [
        "The Wardens — the ministries' formal term.",
        "The Landlords — settler slang. They collected, didn't they?",
        "The Absent — the careful, neutral usage, preferred in writing.",
      ] },
      { note: "Sealed by canon law: the Empire's true name, its present fate, why humanity was wardened at all, and whether anything is ever coming back may never be answered by any document, character or system." },
    ],
    see: ["four-departures", "the-withdrawal", "creed-axis", "the-leavings"],
  },
  {
    id: "four-departures",
    title: "The Four Departures",
    category: "cosmology",
    tag: "Almanac §2",
    status: "contested",
    summary: "The four rival readings of why the Empire left — and the argument beneath every war on the Ground.",
    blocks: [
      { lead: "Nobody disputes that the Empire left. Everything since is a fight over what the suddenness meant." },
      {
        table: {
          head: ["Departure", "The claim", "Held by"],
          rows: [
            ["The Recall", "Summoned home to a crisis; the wardship is suspended, not ended. The Key is an appeal.", "Restorationist orthodoxy; the Synod; the Procession"],
            ["The Finished Ledger", "The planet stopped paying. The job was done and the crews went home. No one is coming.", "The Combine; the Emberwrights; anyone who keeps books"],
            ["The Flight", "They did not withdraw — they fled. The Key must never be turned.", "The Covenant of Locks; the outriders who won't dig"],
            ["The Discarding", "'Ward' is the flattering word. Humanity was site labour, discarded with the gear.", "The hard-Reclaimer houses; much of the Commonweal"],
          ],
        },
      },
      { p: "A house's Departure is not decoration. It decides what it will dig, what it will seal, whom it will treat with, and what it believes victory would even look like." },
    ],
    see: ["the-empire", "creed-axis", "the-key", "great-houses"],
  },
  {
    id: "the-reckoning",
    title: "The Reckoning",
    folk: "the Landlords' shift schedule",
    category: "cosmology",
    tag: "Almanac §3.1",
    status: "canon",
    summary: "A 36-hour day, a ten-day week, a 400-day year — counted in years since First Ignition.",
    blocks: [
      { p: "The Ground's day runs 36 hours: a long light and a longer dark, lived in watches. Ten days make a ten-day; four ten-days make a month; ten months — 400 days — make one year. Years are counted F.I., since First Ignition. The present is 383 F.I." },
      { p: "Ministries date documents Day N of the Xth Month, 383 F.I. Armies keep their own count besides: \"Day 214 of the March.\"" },
      { h: "Why the week is a scar" },
      { p: "The solar year is the Ground's own, but the ten-day is the Empire's quota cycle. Under the Wardship, manifests were posted and quotas counted every tenth day — lift-day — and on the last lift-day, no manifest came. Humanity still measures its weeks in the Landlords' shift schedule, and no ministry has found the nerve to change it." },
      { quote: "…and on the last lift-day no manifest was posted, and the sky-cradles stood open, and no one came to count us.", cite: "fragment, provenance disputed, kept under glass at the Nine Cradles" },
    ],
    see: ["the-lamp-and-the-coal", "the-wardship", "the-withdrawal"],
  },
  {
    id: "the-lamp-and-the-coal",
    title: "The Lamp & the Coal",
    folk: "the First and Second Lights",
    category: "cosmology",
    tag: "Almanac §3.1",
    status: "canon",
    summary: "Two moons ride the long nights; which of them is up decides who travels.",
    blocks: [
      { list: [
        "The First Light, the Lamp — broad, slow and pale. Bright nights ride under a full Lamp, and the Lamp hangs the people it catches.",
        "The Second Light, the Coal — small, fast, an ash-black stone that occults stars as it passes.",
      ] },
      { p: "A night with only the Coal up is a dark-run: beloved of raiders, runners and everyone the Lamp would hang. When the Coal crosses the Lamp's face the parishes hold vigil, and even the ministries post no convoys." },
      { quote: "Between the Lamp and the Coal.", cite: "settler idiom for any hour when nothing is certain" },
    ],
    see: ["the-reckoning", "the-settled"],
  },
  {
    id: "ground-rot",
    title: "Ground-Rot",
    folk: "the Rent",
    category: "cosmology",
    tag: "Almanac §4",
    status: "unanswered",
    summary: "The sickness that falls on any population that sits still too long — and the reason the great powers roll.",
    blocks: [
      { lead: "The Ground keeps no cities." },
      { p: "Settle too many people too densely too long — above all on worked ground, which is most ground worth having — and the rot sets in: wasting, failed harvests, stillbirths, and the dreams the diggers call machine-sleep. Ministries measure rot-counts. Parishes call it the Rent, and say the Landlords are still collecting." },
      { p: "Whether it is the wound of the extraction, the exhaust of what lies buried, or something older is never answered. What it forces is the shape of the world: settlements stay small, the great powers stay moving, and a living still-city is rare, walled, and lying about something." },
      { note: "This is the in-world justification for the fortress-base. A house that stops marching is not merely outmanoeuvred — it is rotting." },
    ],
    see: ["fortress-base", "the-settled", "the-ground", "machine-sleep"],
  },
  {
    id: "anchor-fields",
    title: "The Anchor Fields",
    folk: "the cradles",
    category: "cosmology",
    tag: "Almanac §6",
    status: "canon",
    summary: "The vast cradle-ruins where the Empire's lifting works stood — the holiest and most contested ground there is.",
    blocks: [
      { p: "Where the Empire's lifting structures stood, the world's wealth went up. What remains are the Anchor Fields: acres of severed cradle-work, still standing, still pointed at the sky." },
      { list: [
        "To those awaiting the Recall, a pilgrimage site.",
        "To those balancing the Finished Ledger, a quarry.",
        "To the Covenant of Locks, a perimeter to be sealed at any cost.",
      ] },
      { p: "No house has ever taken an Anchor Field and been left alone on it." },
    ],
    see: ["four-departures", "the-key", "the-leavings", "the-settled"],
  },

  // ── History in Fragments ──────────────────────────────────────────────
  {
    id: "history-thread",
    title: "The Ministries' Thread",
    category: "history",
    tag: "Almanac §3",
    status: "contested",
    summary: "The best available sequence of eras, knotted together from bones and grudges.",
    blocks: [
      { p: "No history of the Ground is trusted whole. What follows is the ministries' best thread." },
      {
        table: {
          head: ["Era", "What is said"],
          rows: [
            ["The Wardship", "Humanity under the Empire, put to the extraction. Almost nothing firsthand survives."],
            ["The Withdrawal", "The sudden departure; the founding trauma. Hours or days, not years."],
            ["The Quiet Centuries", "Scattered survival among the ruins; memory eroding into hymn and grudge."],
            ["The Ignition — 0 F.I.", "A fuel seam struck, a sealed cache pried open. Diesel civilisation, scavenged not invented."],
            ["The Cartel Wars — c.90–141", "Seam-cartels fight over the dregs. Fixed cities rise on the richest ruins — and sicken."],
            ["The First March — 141 F.I.", "At the Siege of the Hundredweight, a combine unbolts its refinery onto treads and drives out."],
            ["The Present — 383 F.I.", "The great houses roam a spent world, racing for the scraps that might amount to the Key."],
          ],
        },
      },
    ],
    see: ["the-wardship", "the-withdrawal", "the-ignition", "the-first-march", "the-present"],
  },
  {
    id: "the-wardship",
    title: "The Wardship",
    category: "history",
    tag: "Almanac §3",
    status: "unanswered",
    summary: "The era under the Empire. Duration unknown; almost nothing survives firsthand.",
    blocks: [
      { p: "Humanity fed, counted, and put to work at the extraction. The wards were not given records — or the records went up with everything else." },
      { p: "What remains is in the bones: every human language on the Ground shares the same words for quota, manifest and lift-day. The vocabulary of the era outlived every account of it." },
    ],
    see: ["the-empire", "the-reckoning", "the-withdrawal", "lexicon-wardship-words"],
  },
  {
    id: "the-withdrawal",
    title: "The Withdrawal",
    category: "history",
    tag: "Almanac §3",
    status: "unanswered",
    summary: "The founding trauma. The date is lost; every account that claims to be an account says hours or days.",
    blocks: [
      { p: "The Empire's leaving broke more than it left. Orbital works dropped. Sites sealed mid-shift. Wards were abandoned amid machinery they had operated for generations and never understood." },
      { note: "Why it was sudden is the sealed question at the centre of the setting. Fragments may hint; nothing may confirm." },
    ],
    see: ["the-empire", "four-departures", "quiet-centuries", "the-leavings"],
  },
  {
    id: "quiet-centuries",
    title: "The Quiet Centuries",
    folk: "the Quiet",
    category: "history",
    tag: "Almanac §3",
    status: "thin",
    summary: "Scattered survival among the ruins, with memory eroding into hymn and grudge.",
    blocks: [
      { p: "No power could feed an army far from home. Holdings failed, compacts failed, and the ruins were stripped by people who no longer knew what they were stripping." },
      { p: "The era gave the Ground its religion, its grudges and its slang: to this day, settlers say the Quiet when they mean death." },
      { note: "Under survey — the Quiet Centuries carry almost no named events, places or figures. See the Marginalia." },
    ],
    see: ["the-withdrawal", "the-ignition", "history-thread"],
  },
  {
    id: "the-ignition",
    title: "The Ignition",
    category: "history",
    tag: "Almanac §3 · 0 F.I.",
    status: "canon",
    summary: "A fuel seam struck and a cache pried open — diesel civilisation begins, scavenged rather than invented.",
    blocks: [
      { p: "A fuel seam was struck, and in the same generation the first sealed cache was pried open. What followed was not invention but reproduction: imperial scrap, copied badly, at scale." },
      { p: "This is why the Ground fields thousand-ton land-fortresses and no thinking machines, and no wings that reach past the weather. Humanity reproduced what it could pry open, and the Empire did not leave its starships behind." },
      { note: "A single intact relic is a page of the original book — which is why Ciphers are hunted harder than fuel." },
    ],
    see: ["cartel-wars", "the-leavings", "the-key", "fortress-base"],
  },
  {
    id: "cartel-wars",
    title: "The Cartel Wars",
    category: "history",
    tag: "Almanac §3 · c.90–141 F.I.",
    status: "canon",
    summary: "Fifty years of seam-cartels fighting over the dregs, from fixed cities that were already sickening.",
    blocks: [
      { p: "The cartels built upward and inward on the richest ruins, and the rot arrived on schedule. The still-cities of this era are ruins with very good bones — and the reason no serious power has trusted a wall since." },
    ],
    see: ["ground-rot", "the-first-march", "the-settled"],
  },
  {
    id: "the-first-march",
    title: "The First March",
    category: "history",
    tag: "Almanac §3 · 141 F.I.",
    status: "canon",
    summary: "At the Siege of the Hundredweight an encircled combine put its refinery on treads and drove out.",
    blocks: [
      { lead: "The First Keel. Every fortress-base since traces — or forges — lineage to it." },
      { p: "Encircled and starving, a mining combine unbolted its refinery, mounted it on salvaged treads and drove through the lines. Within a generation the age of fortress-bases, the Long March era, had begun." },
    ],
    see: ["fortress-base", "keels-and-names", "the-present"],
  },
  {
    id: "the-present",
    title: "The Present — 383 F.I.",
    category: "history",
    tag: "Almanac §3",
    status: "canon",
    summary: "The Long March: ten houses roaming a spent world, racing for the Key.",
    blocks: [
      { p: "Nations travel as mobile fortress-bases, taking settlements for their yield and moving on when the ground is spent. Territory is held only as long as supply reaches it." },
      { p: "Nobody agrees what the Key is — a signal, a ship, a door, an appeal — but every house believes it will be the one to find it, and that finding it will justify everything done on the road there." },
    ],
    see: ["the-key", "great-houses", "fortress-base", "supply"],
  },

  // ── Peoples & Powers ──────────────────────────────────────────────────
  {
    id: "great-houses",
    title: "The Great Houses",
    category: "powers",
    tag: "Almanac §7",
    status: "canon",
    summary: "Ten powers, every one an answer to the Departure and a bid for the Key.",
    blocks: [
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
    see: ["four-departures", "creed-axis", "doctrines", "keels-and-names"],
  },
  {
    id: "creed-axis",
    title: "The Creed Axis",
    category: "powers",
    tag: "Almanac §2",
    status: "canon",
    summary: "Restorationist against Reclaimer — the Departure argument made mechanical.",
    blocks: [
      { list: [
        "Restorationist — the way up runs through the Empire's works: reawaken, retrieve, or be retrieved.",
        "Reclaimer — humanity builds its own ascent and owes the Landlords not even curiosity.",
        "The Flight — the axis's dark orthogonal: those who would break the Key rather than turn it.",
      ] },
      { p: "Creed decides which relics a house covets and which it buries, and it is the first thing an envoy is judged on." },
    ],
    see: ["four-departures", "great-houses", "the-leavings", "accords"],
  },
  {
    id: "doctrines",
    title: "The Three Doctrines",
    category: "powers",
    tag: "Doctrine · Codex",
    status: "canon",
    summary: "Aggressive, Economic, Defensive — the three ways a nation makes war.",
    blocks: [
      { h: "Aggressive" },
      { p: "War is a debt that compounds — pay it early, in full, on someone else's ground. Hard marches, all-out attacks, armories built for the first ten days of a campaign rather than the last ten. Their diplomats are rarely received twice." },
      { h: "Economic" },
      { p: "The war is decided in the ledger long before the field. Trade ground for time, take the foundry cities and fuel depots, endure the early raids, and field an overwhelming late army funded by holdings nobody contested. The weakness is the opening." },
      { h: "Defensive" },
      { p: "Let the enemy break himself on prepared ground, then take what remains. Riflemen in cover, crawlers under doubled plate, generals who hold where others counterattack. They rarely win quickly and are extraordinarily hard to remove." },
      { note: "Doctrine also drives NPC houses: it sets their maneuver choices in mass battle and their disposition at the envoy desk." },
    ],
    see: ["mass-battle", "accords", "great-houses"],
    manual: "mass-combat",
  },
  {
    id: "the-settled",
    title: "The Settled",
    category: "powers",
    tag: "Almanac §6",
    status: "thin",
    summary: "Burn-towns, mining combines, farm communes, waystations, scrap-parishes, still-cities — polities of their ground and nothing beyond it.",
    blocks: [
      { p: "Settlements trade with, submit to, or are raided by whichever fortress rolls past — and they remember. They hold no ambition off their own ground, which is exactly why they outlive the houses that pass through." },
      { p: "A still-city that is genuinely alive is rare, walled, and lying about something." },
      { note: "Under survey — settlement types are named but individually thin, and the protectorate and accord systems currently treat them more uniformly than the canon implies. See the Marginalia." },
    ],
    see: ["ground-rot", "accords", "anchor-fields", "great-houses"],
  },
  {
    id: "commanders",
    title: "Commanders & Generals",
    category: "powers",
    tag: "Doctrine §9",
    status: "canon",
    summary: "Named officers who lead field armies, accrue veterancy and honours, and can be killed.",
    blocks: [
      { p: "Each house opens with a Marshal — supreme commander, base 10/10 plus a doctrine bonus. Marshals never die. Every other general is recruited or taken free, gains +1 strategy per two victories to a ceiling of 14, and faces an even chance of death when their army is destroyed." },
      { list: [
        "Veterancy: Green, Seasoned (+1), Veteran (+2), Elite (+3) battle skill.",
        "Traits shape a signature maneuver: Butcher, Fox, Bulwark, Firebrand, Supreme.",
        "Every general fights from a command vehicle themed to their trait.",
      ] },
      { p: "Decorations are kept on the service record: the Order of the Iron Hammer, the Brass Star of Command, the Defiant Standard, the Marshal's Cross." },
    ],
    see: ["mass-battle", "doctrines", "supply"],
    manual: "mass-combat",
  },

  // ── The Machine of War ────────────────────────────────────────────────
  {
    id: "fortress-base",
    title: "The Fortress-Base",
    folk: "the keel",
    category: "war",
    tag: "Doctrine §18",
    status: "canon",
    summary: "Capital, factory and supply heart on treads — one per house, and never rebuilt if lost.",
    blocks: [
      { lead: "Every house rides one keel. Its hull grants +1 defence to its zone and makes it a prime supply hub wherever it stands on friendly ground." },
      { list: [
        "Three module bays — Armor, Engine, Industry — one module apiece.",
        "Movement needs an engine module, costs 2 Fuel (1 with Juggernaut Reactors), and is blocked in snow or mid-battle.",
        "★ prototype modules must first be certified in the State Armory.",
      ] },
      { note: "If the keel's zone is captured the base is WRECKED permanently. There is no rebuilding it, and no second keel." },
      { p: "In world terms the keel is the answer to ground-rot: a polity that cannot afford to sit still puts its capital on treads." },
    ],
    see: ["ground-rot", "keels-and-names", "supply", "the-first-march"],
    manual: "fortress",
  },
  {
    id: "keels-and-names",
    title: "Keels & Their Names",
    category: "war",
    tag: "Almanac §8",
    status: "canon",
    summary: "The naming law of fortress-bases: an abstract noun bound to a hard material.",
    blocks: [
      { p: "The full style is: the [Name], [Ordinal] Keel of [House]." },
      { p: "Names are vows, debts or verdicts. Vow of Coal. Debt of Winters. Verdict of Iron. Patience of Rust. A keel named for a virtue it does not have is a keel with a story behind it." },
    ],
    see: ["fortress-base", "the-first-march", "great-houses"],
  },
  {
    id: "supply",
    title: "Supply & the Swath",
    category: "war",
    tag: "Doctrine §7",
    status: "canon",
    summary: "Ground is held only as far as supply reaches; beyond that, armies waste away where they stand.",
    blocks: [
      { p: "Supply hubs are capitals, completed Fortifications or Barracks, and the keel wherever it stands on friendly ground. Supply flows 4 range through contiguous friendly land — 1 per tile, 2 through mountains, marsh and highlands." },
      { h: "Out of supply" },
      { list: [
        "Field armies lose a company to attrition at the start of your turn.",
        "Cut-off forces fight at −2 battle skill; besieged defenders share the penalty.",
        "Severed zones cannot build, purchase or reinforce.",
      ] },
      { p: "The depleted trail a keel leaves behind it is a swath: ground that has already paid, and will not pay again soon." },
    ],
    see: ["fortress-base", "economy", "weather", "the-present"],
    manual: "supply",
  },
  {
    id: "economy",
    title: "Manpower, Steel & Fuel",
    category: "war",
    tag: "Doctrine §2",
    status: "canon",
    summary: "Three commodities run the war, drawn one per worked zone at the start of your turn.",
    blocks: [
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
      { p: "Seams sweeten the draw: an oil field gives +2 Fuel, a coal depot +1 Steel, an iron foundry +1 Steel and a standing discount on crawlers." },
      { note: "A house that loses its capital draws ZERO income until it is retaken." },
    ],
    see: ["supply", "works", "order-of-battle"],
    manual: "economy",
  },
  {
    id: "works",
    title: "Works & Construction",
    category: "war",
    tag: "Doctrine §3",
    status: "canon",
    summary: "Barracks, Foundries, Refineries, Fortifications and Airstrips — one slot per zone, two on capitals.",
    blocks: [
      { p: "One construction or upgrade begins per action and completes at the start of your next turn, to a maximum of level 2. The zone must be in supply to build, and captured zones keep any completed works standing on them." },
      { p: "Works are the only permanence a house gets on ground it does not intend to keep — which is why abandoned Barracks litter every old swath on the chart." },
    ],
    see: ["economy", "supply", "order-of-battle"],
    manual: "buildings",
  },
  {
    id: "order-of-battle",
    title: "The Order of Battle",
    category: "war",
    tag: "Doctrine §4",
    status: "canon",
    summary: "Riflemen, crawlers, gunboats, fighters and artillery — the whole of what the Ground can build.",
    blocks: [
      { p: "Five company types, priced in points against an army cap, and no more. The Ground fields thousand-ton land-fortresses and no thinking machines, and nothing that flies past the weather — a limit set by the Ignition, not by doctrine." },
      { list: [
        "Casualties fall in order: riflemen → crawler → gunboat → artillery → fighter.",
        "Land companies cannot enter the sea; gunboats cannot come ashore; fighters strike land or sea.",
        "Purchase requires the target zone to be in supply.",
      ] },
    ],
    see: ["the-ignition", "economy", "garrison-combat", "mass-battle"],
    manual: "units",
  },
  {
    id: "garrison-combat",
    title: "Garrison Combat",
    category: "war",
    tag: "Doctrine §5",
    status: "canon",
    summary: "Zone against adjacent zone — companies roll dice until one side is wiped or the clock runs out.",
    blocks: [
      { p: "Each round, every committed company rolls 1d6 and hits on a roll at or under its effective stat. Rounds resolve simultaneously until one side is wiped or twenty-five rounds pass. Any enemy field army standing on the target folds into its defence first." },
      { list: [
        "Captured — defenders wiped; your survivors garrison the ground.",
        "Repelled — your attack is wiped out.",
        "Retreated — the round cap is reached; survivors fall back home.",
      ] },
    ],
    see: ["mass-battle", "terrain", "weather", "bombardment"],
    manual: "garrison-combat",
  },
  {
    id: "mass-battle",
    title: "Field Armies & Mass Battle",
    category: "war",
    tag: "Doctrine §9",
    status: "canon",
    summary: "The set-piece war: armies under named generals trade secret, simultaneous maneuvers over fifteen rounds.",
    blocks: [
      { p: "Field armies muster from a completed Barracks, march the chart under a general, and fight round by round. Both sides open at 100 morale; a battle ends on annihilation, on a rout, or after fifteen rounds — at which point the attacker withdraws to their staging ground." },
      { p: "Ten maneuvers are available, four of them trait signatures on cooldown. Choices are secret and simultaneous: the whole system is a bluff played through a fog." },
      { note: "If the defender's presence heartbeat is under sixty seconds old they play their maneuvers live; otherwise the field AI plays their doctrine for them." },
    ],
    see: ["commanders", "doctrines", "army-designs", "garrison-combat"],
    manual: "mass-combat",
  },
  {
    id: "army-designs",
    title: "The Army Design Bureau",
    category: "war",
    tag: "Doctrine §11",
    status: "canon",
    summary: "Persistent doctrine templates — formation, weapon, armor and support — applied at muster for a surcharge.",
    blocks: [
      { p: "A design is filed once and recalled every time an army musters: vanguard or skirmish or column, trench guns or mortars, plated or scout, medics or signals or commissars. Each option shifts damage, skill or morale, and each costs resources at the moment of mustering." },
    ],
    see: ["mass-battle", "order-of-battle", "economy"],
    manual: "designs",
  },
  {
    id: "terrain",
    title: "Ground & Elevation",
    category: "war",
    tag: "Doctrine §6",
    status: "canon",
    summary: "Terrain pays the defender; height pays whoever holds it.",
    blocks: [
      { p: "Mountains grant +2 defence; hills, highlands, forest, marsh and industrial ground +1; plains and deltas nothing. Elevation runs mountains 3, highlands 2, hills 1, all else 0 — attacking uphill is −1, downhill +1, in both combat systems." },
    ],
    see: ["garrison-combat", "supply", "weather"],
    manual: "terrain",
  },
  {
    id: "weather",
    title: "The Weather Office",
    category: "war",
    tag: "Doctrine §8",
    status: "canon",
    summary: "One front-wide weather roll per turn cycle, and it decides what can move at all.",
    blocks: [
      {
        table: {
          head: ["Front", "Effect"],
          rows: [
            ["Clear", "None."],
            ["Rain", "Attacker −1; mountains, highlands and marsh impassable; bombards hit only on ≤2."],
            ["Fog", "Defender −1; probe intel halved."],
            ["Storm", "Fighters and gunboats cannot move or attack."],
            ["Snow", "Crawlers cannot move or attack; crawler-bearing armies cannot march; attacker −1."],
          ],
        },
      },
      { p: "Weather is the Ground asserting itself. Brine-fog rots gun steel on Morhollow, and Veyran dust can strand a column mid-march." },
    ],
    see: ["terrain", "supply", "theaters-index"],
    manual: "weather",
  },
  {
    id: "bombardment",
    title: "Bombardment & Reconnaissance",
    category: "war",
    tag: "Doctrine §10–12",
    status: "canon",
    summary: "Guns that kill without taking ground, and probes that buy partial truth.",
    blocks: [
      { p: "Artillery shells one adjacent enemy land zone for 1 Fuel, once per firing zone per turn. Each gun hits on ≤3 — ≤2 in rain, +1 firing downhill — and each hit kills a company. Bombardment never takes ground." },
      { p: "A reconnaissance probe costs 1 Fuel against an adjacent target and returns partial intel, every detail rolled independently and halved in fog. You are never told everything, and you are never told what you were not told." },
    ],
    see: ["garrison-combat", "weather", "fog-of-war"],
    manual: "bombard-recon",
  },
  {
    id: "fog-of-war",
    title: "Fog of War",
    category: "war",
    tag: "Doctrine · Engine",
    status: "thin",
    summary: "What a house may see of the chart, and what it must infer.",
    blocks: [
      { p: "Knowledge on the Ground is bought: by adjacency, by probe, and by the memory of what a zone looked like the last time anyone stood near it. Old sightings are kept and shown as last known, not as fact." },
      { note: "Under survey — the fog rules are implemented in the engine but only partly written down as regulation, which is exactly the kind of gap this Archive exists to catch. See the Marginalia." },
    ],
    see: ["bombardment", "garrison-combat", "supply"],
  },
  {
    id: "accords",
    title: "The Envoy Desk & Accords",
    category: "war",
    tag: "Doctrine §17",
    status: "canon",
    summary: "Truces, pacts and trades — signed, honoured until they lapse, and remembered when broken.",
    blocks: [
      { p: "One envoy per rival house per turn. An accord forbids attack, engagement and bombardment between the parties until it lapses; the lapse is announced, and hostilities may resume the moment it does." },
      { p: "NPC houses judge by disposition: a truce needs bare tolerance, a pact needs warmth, and a trade needs an offer that is both fair and coverable. Signing lifts disposition. Attacks and refusals sour it, and nothing sours it like a broken accord." },
    ],
    see: ["doctrines", "great-houses", "the-settled", "creed-axis"],
    manual: "diplomacy",
  },
  {
    id: "war-sciences",
    title: "War Sciences & the State Armory",
    category: "war",
    tag: "Doctrine §19–20",
    status: "canon",
    summary: "Three research branches, and a treasury counter for prototypes and decrees.",
    blocks: [
      { p: "One research focus at a time, changeable at will; a point accrues per completed turn cycle, and a finished technology merges permanently. Armament, Industry and Logistics each run three tiers. NPC houses do not research." },
      { p: "The State Armory takes one-time purchases at any time: certifying ★ fortress prototypes for the Refit Yard, and enacting ideology decrees — War Bonds, Fuel Rationing, Universal Levy, Hearth & Bulwark — whose bonuses apply at once." },
      { note: "Nothing researched on the Ground is invented. Every branch is a better reading of imperial scrap." },
    ],
    see: ["the-ignition", "fortress-base", "economy"],
    manual: "research-armory",
  },
  {
    id: "victory",
    title: "Conditions of Victory",
    category: "war",
    tag: "Doctrine §1",
    status: "canon",
    summary: "Map control, capital domination, last standing — or a solo scenario charter.",
    blocks: [
      { p: "Hold three-fifths of the land zones at the start of your turn; or own every capital; or outlive every rival house. A house falls when it holds zero tiles, and it loses its field armies with its ground." },
      { note: "There is no coming back to the March once the last zone is gone." },
    ],
    see: ["supply", "fortress-base", "the-key"],
    manual: "victory",
  },

  // ── The Leavings ──────────────────────────────────────────────────────
  {
    id: "the-leavings",
    title: "The Leavings",
    folk: "Object [N]",
    category: "leavings",
    tag: "Almanac §5",
    status: "canon",
    summary: "What the Empire abandoned, in four survey classes — and the red flag that outranks every creed.",
    blocks: [
      {
        table: {
          head: ["Class", "What it is", "In the war"],
          rows: [
            ["Caches", "Sealed stores — alloys, fuel, components", "One-off windfalls; the 'break it for parts' temptation"],
            ["Engines", "Functional imperial machinery", "Unique base modules — found, never built"],
            ["Ciphers", "Archives, cores, marked stones — information", "Progress toward the Key; the Synod's obsession"],
            ["Wakes", "Machinery still running", "Hazards: wardens that stir, beacons that answer to no one"],
          ],
        },
      },
      { p: "The ministries assign Object numbers; the folk assign names within the week. A red flag flies over every unclassified find — the one signal every house honours, because a misread Wake buries all creeds equally." },
      { p: "Every digger knows the arithmetic: the Ciphers are pages, the Engines are parts, and somewhere in the sum of them is a way past the sky." },
    ],
    see: ["the-key", "the-empire", "dig-sites", "creed-axis"],
  },
  {
    id: "the-key",
    title: "The Key",
    category: "leavings",
    tag: "Almanac §2 · the prize",
    status: "unanswered",
    summary: "The assembled way off-world. Nobody agrees what it is, and every house believes it will be the one to find it.",
    blocks: [
      { p: "A signal, a ship, a door, an appeal — the readings track the Departures exactly. To the Recall it is an appeal; to the Finished Ledger a purchase; to the Flight a thing that must never be turned; to the Discarding a hull built with human hands." },
      { note: "Hope on the Ground is industrial-grade. If humanity reaches the stars it will be riveted, fueled and paid for. The sky is an engineering problem wearing a religion." },
    ],
    see: ["four-departures", "the-leavings", "anchor-fields", "victory"],
  },
  {
    id: "dig-sites",
    title: "Dig Sites & the Red Flag",
    category: "leavings",
    tag: "Almanac §5",
    status: "thin",
    summary: "The digger trade: excavation, classification, and the flag that stops an advance.",
    blocks: [
      { p: "Excavation sites carry cold designations and folk names in the same breath — Excavation Site 112, Grandmother's Door. Diggers are their own culture, contracted by houses and loyal to the flag rather than the banner." },
      { note: "Under survey — relic sets and the Vault exist in play, but excavation as an act on the chart is barely represented. Logged in the Marginalia as the setting's largest open gap." },
    ],
    see: ["the-leavings", "the-key", "machine-sleep"],
  },
  {
    id: "machine-sleep",
    title: "Machine-Sleep",
    category: "leavings",
    tag: "Almanac §4",
    status: "unanswered",
    summary: "The dreams the diggers report near worked ground and running Wakes.",
    blocks: [
      { p: "Reported consistently, described inconsistently, and never explained. The ministries file it under rot symptoms; the parishes file it under the Rent; the diggers do not file it at all, and simply stop digging when it starts." },
    ],
    see: ["ground-rot", "the-leavings", "dig-sites"],
  },

  // ── Charted Theaters ──────────────────────────────────────────────────
  {
    id: "theaters-index",
    title: "The Charted Theaters",
    category: "theaters",
    tag: "Cartography Bureau",
    status: "canon",
    summary: "Three surveyed worlds carry campaigns: Cindara, Veyra and Morhollow.",
    blocks: [
      { list: [
        "Cindara, the Ash Theater — an intact highway grid under a century of unburied industry.",
        "Veyra, the Rust Archipelago — dune belts, foundry islands, and the richest sealed depots on any chart.",
        "Morhollow, the Brine-Fog Theater — no roads that survive a season, and fog that rots gun steel.",
      ] },
      { p: "Each theater is charted separately by the Bureau, and each punishes a different habit: Cindara rewards speed on the roads, Veyra rewards fuel discipline, Morhollow rewards nothing but supply." },
    ],
    see: ["cindara", "veyra", "morhollow", "weather"],
  },
  {
    id: "cindara",
    title: "Cindara",
    folk: "the Ash Theater",
    category: "theaters",
    tag: "Codex · Planetary",
    status: "canon",
    summary: "The first world the Combine industrialised and the first it abandoned.",
    blocks: [
      { p: "For two centuries its western continent fed the foundry belts, until the seams ran shallow and the great stacks were banked one by one. What finished it was not exhaustion but a war of ledgers that starved the cities before a single shell fell on them." },
      { p: "The ash that names the theater is not volcanic. It is a century of unburied industry, lifted off the slag fields by the westerlies and laid back down over everything." },
      { note: "Nomad fortress-bases returned here first, drawn by the intact highway grid and the deep ruins nobody had the fuel to strip." },
    ],
    see: ["theaters-index", "veyra", "morhollow"],
  },
  {
    id: "veyra",
    title: "Veyra",
    folk: "the Rust Archipelago",
    category: "theaters",
    tag: "Codex · Planetary",
    status: "canon",
    summary: "Never settled so much as parked on — and now the richest prize on any chart.",
    blocks: [
      { p: "Its dune belts buried the pre-collapse highways within a generation, and the foundry islands were worked by crews who never intended to stay. They stayed. When the lanes closed the crews became populations, and the populations became claimants; Veyran law is still written in salvage rights." },
      { p: "Its depots hold sealed pre-collapse fuel — enough to move a fortress-base across a continent, guarded by nothing but distance and dust." },
    ],
    see: ["theaters-index", "cindara", "morhollow", "the-leavings"],
  },
  {
    id: "morhollow",
    title: "Morhollow",
    folk: "the Brine-Fog Theater",
    category: "theaters",
    tag: "Codex · Planetary",
    status: "canon",
    summary: "A world that keeps no roads, where cartography is a running argument.",
    blocks: [
      { p: "Its salt-ice quays were cut for a fishing trade that outlived the Combine by a decade and the collapse by not at all. Trails laid in one season are gone under the frost by the next, which is why the Bureau charts Morhollow more often than any other theater." },
      { p: "Its fog is brine, not water. It rots gun steel, blinds spotters, and hides whole columns until they are within a day's march." },
      { note: "Every Morhollow campaign is a supply campaign. Commanders who fight it like open ground lose their columns to privation, not to the enemy." },
    ],
    see: ["theaters-index", "supply", "weather"],
  },

  // ── Lexicon ───────────────────────────────────────────────────────────
  {
    id: "lexicon-wardship-words",
    title: "Words Out of the Wardship",
    category: "lexicon",
    tag: "Almanac §9",
    status: "canon",
    summary: "The vocabulary every tongue on the Ground shares, inherited from the era nobody remembers.",
    blocks: [
      {
        table: {
          head: ["Term", "Meaning"],
          rows: [
            ["quota", "What was owed, and counted."],
            ["manifest", "The posted list. Its absence marks the Withdrawal."],
            ["lift-day", "Every tenth day; the Empire's counting day, still the week's spine."],
            ["the cradles", "The lifting works, and the Anchor Fields they left."],
          ],
        },
      },
    ],
    see: ["the-wardship", "the-reckoning", "anchor-fields", "lexicon-march"],
  },
  {
    id: "lexicon-march",
    title: "Glossary of the March",
    category: "lexicon",
    tag: "Almanac §9",
    status: "canon",
    summary: "The working vocabulary of the present age, official register and folk register both.",
    blocks: [
      {
        table: {
          head: ["Term", "Meaning"],
          rows: [
            ["the Ground / the Site", "The world, in ministry and imperial usage."],
            ["the Wardens / Landlords / Absent", "The departed empire, by its three names."],
            ["the Key", "The assembled way off-world — the headline prize."],
            ["the leavings", "Relic material, of any class."],
            ["F.I.", "Years since First Ignition; now 383."],
            ["the Lamp / the Coal", "The two moons. A dark-run is a Coal-only night."],
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
      { note: "Two registers, always: cold official designation and worn folk name. Write only one and the world goes flat." },
    ],
    see: ["lexicon-wardship-words", "the-ground", "ground-rot", "the-leavings"],
  },
];

export const ENTRY_BY_ID = Object.fromEntries(ENTRIES.map((e) => [e.id, e]));

// Flatten an entry to a lowercase haystack for search.
export function entryText(entry) {
  const parts = [entry.title, entry.folk || "", entry.summary, entry.tag || ""];
  for (const b of entry.blocks) {
    if (b.p) parts.push(b.p);
    if (b.h) parts.push(b.h);
    if (b.lead) parts.push(b.lead);
    if (b.note) parts.push(b.note);
    if (b.quote) parts.push(b.quote);
    if (b.list) parts.push(b.list.join(" "));
    if (b.table) parts.push(b.table.head.join(" "), b.table.rows.flat().join(" "));
  }
  return parts.join(" ").toLowerCase();
}

// Entries that link TO this one — the Archive's back-references.
export function citedBy(id) {
  return ENTRIES.filter((e) => e.id !== id && (e.see || []).includes(id));
}