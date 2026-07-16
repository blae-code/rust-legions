// Frontend mirror of the diplomacy rules in gameEngine — display only; the server always wins
export const PACT_META = {
  truce: { label: "Ceasefire Truce", duration: 5, desc: "All hostilities cease for 5 turns. Neither side may attack, engage, or shell the other." },
  nap: { label: "Non-Aggression Pact", duration: 10, desc: "A formal accord — neither side may attack the other for 10 turns." },
};

export const STATUS_META = {
  war: { label: "At War", className: "border-rust/60 text-rust" },
  truce: { label: "Truce", className: "border-brass/60 text-brass-bright" },
  nap: { label: "Pact", className: "border-olive/60 text-olive" },
};

// NPC attitude bands — accepting deals raises it, aggression burns it
export function dispositionLabel(d) {
  if (d >= 40) return { label: "Friendly", color: "text-olive" };
  if (d >= 10) return { label: "Cordial", color: "text-brass-bright" };
  if (d > -10) return { label: "Wary", color: "text-muted-foreground" };
  if (d > -40) return { label: "Hostile", color: "text-rust" };
  return { label: "Vengeful", color: "text-rust" };
}