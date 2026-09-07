// The guided in-game tour — briefings pinned to data-tour targets on the war room.
// Steps whose target isn't on screen (spectators, missing panels) are skipped.

export const TOUR_DONE_KEY = "cq_game_tour_done_v1";

export const GAME_TOUR_STEPS = [
  {
    target: "command-bar",
    title: "The Command Bar",
    body: "The operation's name, the turn number, the theatre, and every faction on the front. The lit lamp marks whose turn it is.",
  },
  {
    target: "chart",
    title: "The Ministry Chart",
    body: "The theatre map. Click a site you hold to open its orders wheel; ground no scout has seen stays under fog.",
  },
  {
    target: "order-of-march",
    title: "Order of March",
    body: "Your columns in the field, with their strength and where they are headed.",
  },
  {
    target: "resources",
    title: "Stores & Standing",
    body: "Each resource with its per-turn income, your stability, army points against the cap, and land control against the victory target.",
  },
  {
    target: "desks",
    title: "The Ministry Desks",
    body: "Your bureaus. Hover any one for its name; each opens a file you can read off-turn while you wait.",
  },
  {
    target: "field-wire",
    title: "The Field Wire",
    body: "A live message channel shared by everyone in this war.",
  },
  {
    target: "end-turn",
    title: "End Turn",
    body: "Files your orders and passes the turn. A stamped notice tells you when command returns to you.",
  },
];