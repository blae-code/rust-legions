export const MANEUVERS = {
  all_out_attack: { label: "All-Out Attack", icon: "⚔", desc: "Throw everything forward. Devastating, but reckless and costly." },
  attack: { label: "Attack", icon: "🗡", desc: "A measured offensive push. Balanced risk and reward." },
  defend: { label: "Hold the Line", icon: "🛡", desc: "Dig in. Hard to dislodge, minimal casualties either way." },
  flank: { label: "Flanking Maneuver", icon: "↯", desc: "A risky envelopment. Shatters enemy morale when it lands." },
  feint: { label: "Feint", icon: "🎭", desc: "Deceive the enemy — win the round and gain +2 on the next." },
  rally: { label: "Rally the Ranks", icon: "🚩", desc: "Restore your force's morale at the cost of initiative." },
};

export const MANEUVER_KEYS = Object.keys(MANEUVERS);

export const REGIMENT_LABELS = {
  riflemen: "Rifle Companies",
  crawler: "Crawler Squadrons",
  fighter: "Fighter Wings",
};

export const ARMY_UNIT_KEYS = ["riflemen", "crawler", "fighter"];