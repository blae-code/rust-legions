export const MANEUVERS = {
  all_out_attack: { label: "All-Out Attack", icon: "⚔", desc: "Throw everything forward. Devastating, but reckless and costly." },
  attack: { label: "Attack", icon: "🗡", desc: "A measured offensive push. Balanced risk and reward." },
  defend: { label: "Hold the Line", icon: "🛡", desc: "Dig in. Hard to dislodge, minimal casualties either way." },
  flank: { label: "Flanking Maneuver", icon: "↯", desc: "A risky envelopment. Shatters enemy morale when it lands." },
  feint: { label: "Feint", icon: "🎭", desc: "Deceive the enemy — win the round and gain +2 on the next." },
  rally: { label: "Rally the Ranks", icon: "🚩", desc: "Restore your force's morale at the cost of initiative." },
};

export const SIGNATURE_MANEUVERS = {
  relentless_pursuit: { label: "Relentless Pursuit", icon: "🐺", desc: "Signature of the Butcher — hound the wavering enemy. Brutal damage and morale shock." },
  ambush: { label: "Staged Ambush", icon: "🕸", desc: "Signature of the Old Fox — a prepared trap that strikes hard while shielding your ranks." },
  iron_wall: { label: "Iron Wall", icon: "⛨", desc: "Signature of the Bulwark — an immovable defense, nearly unbreakable this round." },
  inspiring_charge: { label: "Inspiring Charge", icon: "🎺", desc: "Signature of the Firebrand — press the attack while rallying morale (+20)." },
};

// Recovery period (rounds) after firing a signature maneuver — scales with intensity
export const SIGNATURE_COOLDOWNS = {
  relentless_pursuit: 4,
  ambush: 3,
  iron_wall: 3,
  inspiring_charge: 2,
};

export const ALL_MANEUVERS = { ...MANEUVERS, ...SIGNATURE_MANEUVERS };

export const MANEUVER_KEYS = Object.keys(MANEUVERS);

export const REGIMENT_LABELS = {
  riflemen: "Rifle Companies",
  crawler: "Crawler Squadrons",
  fighter: "Fighter Wings",
};

export const ARMY_UNIT_KEYS = ["riflemen", "crawler", "fighter"];