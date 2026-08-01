// Standing accords a commander may cut with a held settlement's populace.
// Mirrors the policy yields in base44/functions/gameEngine/entry.ts.
export const POLICY_COOLDOWN_DAYS = 3;

export const POLICIES = [
  {
    id: "integrate",
    label: "Integrate",
    blurb: "Swear the townsfolk to the faction — their sons march with your columns.",
    bonus: "+2 manpower daily",
  },
  {
    id: "trade",
    label: "Trade",
    blurb: "Open the market roads and let the caravans run under your flag.",
    bonus: "+1 steel & +1 fuel daily",
  },
  {
    id: "tax",
    label: "Tax",
    blurb: "Quarter the war ministry here and squeeze the ledgers dry.",
    bonus: "Doubles the settlement's own yield",
  },
];

export const policyById = (id) => POLICIES.find((p) => p.id === id) || null;