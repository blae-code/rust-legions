// Shared metadata for patch change categories — stamped ministry codes
export const CHANGE_CATEGORIES = {
  new_content: { code: "NEW", label: "New Materiel", color: "text-brass-bright", border: "border-brass/60", desc: "Fresh content deployed to the front" },
  balance: { code: "BAL", label: "Rebalancing", color: "text-olive", border: "border-olive/60", desc: "Adjustments to combat arithmetic" },
  mechanics: { code: "MEC", label: "Doctrine Revision", color: "text-steel", border: "border-steel/60", desc: "Changes to core systems of war" },
  fix: { code: "FIX", label: "Field Repairs", color: "text-rust", border: "border-rust/60", desc: "Defects corrected by the engineers" },
  ui: { code: "INT", label: "Interface", color: "text-secondary-foreground", border: "border-border", desc: "Command console improvements" },
  audio: { code: "AUD", label: "Signals & Sound", color: "text-muted-foreground", border: "border-border", desc: "Auditory theater adjustments" },
};

export const CATEGORY_KEYS = Object.keys(CHANGE_CATEGORIES);