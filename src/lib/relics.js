// Precursor relics — display mirror of the engine's RELICS table
// (base44/functions/gameEngine/entry.ts). The backend stays authoritative; this
// only names and explains what getState reveals.

export const RELICS = {
  cogitator_array: { label: "Combine Cogitator Array", effect: "Capital defense +1 · riflemen defense +1" },
  pattern_dies: { label: "Pattern Stamping Dies", effect: "Steel income +1 per day" },
  cracking_column: { label: "Catalytic Cracking Column", effect: "Fuel income +1 per day" },
  census_vault: { label: "The Census Vault", effect: "Manpower income +1 · army cap +10" },
  reactive_lattice: { label: "Reactive Armor Lattice", effect: "Crawler defense +1" },
  survey_engine: { label: "Cartographic Survey Engine", effect: "Supply range extended" },
  gun_lathes: { label: "Precision Gun Lathes", effect: "Riflemen & crawler attack +1" },
};

// Matched sets — assembling every piece grants a standing faction bonus
export const RELIC_SETS = {
  foundry_patrimony: {
    label: "The Foundry Patrimony",
    members: ["pattern_dies", "cracking_column", "gun_lathes", "reactive_lattice"],
    effect: "Steel +2 · Fuel +1 per day · crawler attack & defense +1",
  },
  administrative_codex: {
    label: "The Administrative Codex",
    members: ["cogitator_array", "census_vault", "survey_engine"],
    effect: "Manpower +2 per day · army cap +15 · supply range extended",
  },
};