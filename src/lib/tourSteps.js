// The guided in-game tour — briefings pinned to data-tour targets on the war room.
// Steps whose target isn't on screen (spectators, missing panels) are skipped.

export const TOUR_DONE_KEY = "cq_game_tour_done_v1";

export const GAME_TOUR_STEPS = [
  {
    target: "command-bar",
    title: "The Command Bar",
    body: "Your war at a glance — the operation's name, the current day, and every faction on the front. The lit lamp marks whose turn it is.",
  },
  {
    target: "chart",
    title: "The Ministry Chart",
    body: "Drag to pan, wheel to zoom. Click any surveyed site to open its orders wheel — march columns, mount assaults, muster new forces, or roll your fortress-base. Fog hides ground no scout has seen.",
  },
  {
    target: "order-of-march",
    title: "Order of March",
    body: "Every column in the field: its commander, strength in points, day-rate, and destination. Issue March or Halt orders straight from the roster.",
  },
  {
    target: "resources",
    title: "The Treasury",
    body: "Your resources with their daily income, faction stability, army points against the cap, and land control against the victory target.",
  },
  {
    target: "desks",
    title: "The Ministry Desks",
    body: "These small desks are your bureaus — Faction Overview, the Quartermaster's Ledger, the Protectorate Register, the Governor's Desk, and the Archive. Most may be worked off-turn while you wait.",
  },
  {
    target: "field-wire",
    title: "The Field Wire",
    body: "A live channel to every commander in this war. Coordinate, negotiate, or gloat — the wire carries it all.",
  },
  {
    target: "end-turn",
    title: "End Turn",
    body: "When your orders are filed, pass the baton. Marches resolve day by day, and you'll be wired when command returns to you.",
  },
];