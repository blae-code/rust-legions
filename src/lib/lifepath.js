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