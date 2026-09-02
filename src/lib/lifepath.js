// Lifepath faction-builder choice tree. Player choices are later synthesized by AI.
// An option may include `requires: { chapterId: choiceId }` to gate on earlier choices.

export const LIFEPATH_CHAPTERS = [
  {
    id: "era",
    title: "Founding Era",
    prompt: "How was your nation born?",
    options: [
      { id: "revolt", label: "Workers' Revolt", desc: "Foundry laborers rose against the old barons, seizing the machines that had chained them." },
      { id: "collapse", label: "Collapse of the Old Empire", desc: "When the empire's diesel arteries ran dry, your people carved a state from its rusting bones." },
      { id: "frontier", label: "Frontier Colonization", desc: "Pioneers hauled boilers and rail into the wastes, founding a nation where no map dared draw borders." },
    ],
  },
  {
    id: "land",
    title: "Homeland",
    prompt: "What ground did your people claim?",
    options: [
      { id: "forges", label: "The Highland Forges", desc: "Mountain valleys black with foundry smoke, rich in iron and coal." },
      { id: "deltas", label: "The River Deltas", desc: "Fertile floodplains and crowded ports, where trade and grain flow together." },
      { id: "steppes", label: "The Ashen Steppes", desc: "Endless windburnt plains — hard land that breeds hard soldiers." },
    ],
  },
  {
    id: "crisis",
    title: "First Crisis",
    prompt: "Every young nation is tested. What was your trial?",
    options: [
      { id: "famine", label: "The Hunger Winter", desc: "Crops failed and the silos emptied. Your people learned rationing, and remembrance." },
      { id: "borderwar", label: "The Border War", desc: "A neighbor tested your frontier with crawlers and shells. You answered." },
      { id: "purge", label: "The Counter-Revolution", desc: "The old barons struck back from exile. The revolt had to be defended in blood.", requires: { era: "revolt" } },
      { id: "succession", label: "The Succession Feud", desc: "Imperial pretenders fought over your provinces until you crowned your own order.", requires: { era: "collapse" } },
      { id: "isolation", label: "The Cut Rail", desc: "The homeland severed your supply line. You survived a year alone in the wastes.", requires: { era: "frontier" } },
    ],
  },
  {
    id: "event",
    title: "The Long War",
    prompt: "In the great war that reshaped the continent, your nation…",
    options: [
      { id: "profiteer", label: "Armed Both Sides", desc: "Your foundries ran day and night, selling crawlers to anyone with coin." },
      { id: "bled", label: "Bled on the Front", desc: "A generation vanished into the mud, but the line held and legends were made." },
      { id: "neutral", label: "Fortified and Watched", desc: "You sealed the passes, dug in deep, and let the world exhaust itself." },
    ],
  },
  // ── LANE H: Chapter VI — The Standard (ADDITION ONLY) ────────────────────
  // The four chapters above are frozen: `test/presets.test.js` deep-equals them
  // against a fixture, so this chapter is proven to be an addition and not an
  // edit. `availableOptions`, `DOCTRINES`, `PHILOSOPHIES` and `VALUES` are
  // untouched, and no option carries a `requires` gate — a house may raise any
  // of the four standards regardless of how it answered the first five
  // chapters, which is the point: the standard is chosen last, on the march.
  //
  // Each option maps one-to-one onto a `std_*` plate that ALREADY EXISTS in the
  // LIFEPATH & CHRONICLE block of src/lib/imageLibrary.js. No new plate is
  // registered here, and each of the four is used exactly once.
  //
  // `effect` is the synthesizeFaction trait-effect schema — the same one every
  // preset trait is validated and clamped against: type is one of
  // income_flat | unit_discount | attack_bonus | defense_bonus; `unit` is
  // required for all but income_flat and must be riflemen | crawler | gunboat |
  // fighter; `value` is 1 or 2 and anything outside that is clamped silently,
  // so all four ship the small effect the contract asks for, value 1.
  // `unit_discount` is deliberately unused: the chapter is data, not a closed
  // set, and a later Field Amendment may spend it without fighting a gate here.
  {
    id: "standard",
    title: "VI — The Standard",
    prompt: "Every keel raises one thing its people will re-form on when the line breaks. What flies over yours?",
    options: [
      {
        id: "column",
        label: "The Column of Honors",
        desc: "A plain staff, and on it the name of every engagement the house has walked away from. Nothing sacred, nothing borrowed — the honors are the argument, and men who can read them advance faster than men who cannot.",
        plate: "std_column",
        effect: { type: "attack_bonus", unit: "riflemen", value: 1 },
      },
      {
        id: "reliquary",
        label: "The Reliquary Standard",
        desc: "A shrine-banner with a housed Object sewn into its head, carried at the front of the muster and guarded like a keel. Ground it has been planted on does not get given up, and the parishes note who was standing on it.",
        plate: "std_reliquary",
        effect: { type: "defense_bonus", unit: "riflemen", value: 1 },
      },
      {
        id: "black",
        label: "The Black Standard",
        desc: "Dark cloth, one blood-red mark, and a reputation the house has spent a generation earning. It rides with the armour because that is where it is read from, and hulls under it are closed with less enthusiasm than hulls without.",
        plate: "std_black",
        effect: { type: "defense_bonus", unit: "crawler", value: 1 },
      },
      {
        id: "first_keel",
        label: "The First Keel's Pennant",
        desc: "The original pennant of 141 F.I., or a claim to it nobody has successfully disputed. Communes and parishes tithe to it out of long habit, and the tithe arrives whether or not the house is winning.",
        plate: "std_first_keel",
        effect: { type: "income_flat", value: 1 },
      },
    ],
  },
];

export const DOCTRINES = [
  { id: "aggressive", label: "Doctrine of the Hammer", desc: "Offense wins wars. Strike first, strike hard." },
  { id: "economic", label: "Doctrine of the Furnace", desc: "Wars are won in the foundry. Out-produce, then overwhelm." },
  { id: "defensive", label: "Doctrine of the Bulwark", desc: "Let them break upon your walls, then take what remains." },
];

export const PHILOSOPHIES = [
  { id: "industrial", label: "Industrial Collectivism", desc: "The foundry is the state; the state is the foundry." },
  { id: "mercantile", label: "Mercantile League", desc: "Every shell sold, every contract honored — profit is power." },
  { id: "agrarian", label: "Agrarian Reserve", desc: "Grain and garrison. Feed the people, and they will fight forever." },
];

export const VALUES = [
  { id: "honor", label: "Martial Honor", desc: "Oaths kept, colors never struck." },
  { id: "progress", label: "Relentless Progress", desc: "Newer engines, bigger guns, no looking back." },
  { id: "survival", label: "Survival Above All", desc: "There is no shame in outliving your enemies." },
];

export const availableOptions = (chapter, choices) =>
  chapter.options.filter(
    (o) => !o.requires || Object.entries(o.requires).every(([ch, id]) => choices[ch] === id)
  );