// Ministry rank ladder — every promotion earned by fronts fought and won.
export const RANKS = [
  { id: "recruit", label: "Recruit of the Line", insignia: "▮", wins: 0 },
  { id: "lieutenant", label: "Field Lieutenant", insignia: "▮▮", wins: 1 },
  { id: "captain", label: "Line Captain", insignia: "▮▮▮", wins: 3 },
  { id: "colonel", label: "Iron Colonel", insignia: "✦", wins: 6 },
  { id: "marshal", label: "Marshal of the Rust", insignia: "✦✦", wins: 12 },
];

export function rankFor(wins = 0) {
  const idx = RANKS.reduce((best, r, i) => (wins >= r.wins ? i : best), 0);
  return { ...RANKS[idx], index: idx, next: RANKS[idx + 1] || null };
}

// Decorations awarded strictly on traceable career figures.
export function decorationsFor(profile = {}, factionCount = 0) {
  const wins = profile.gamesWon ?? 0;
  const played = profile.gamesPlayed ?? 0;
  return [
    { id: "first_blood", icon: "⚔", label: "First Blood", req: "Win a front", earned: wins >= 1 },
    { id: "marshals_cross", icon: "✠", label: "The Marshal's Cross", req: "Five career victories", earned: wins >= 5 },
    { id: "veteran", icon: "⚒", label: "Veteran of the Line", req: "Ten fronts fought", earned: played >= 10 },
    { id: "campaigner", icon: "✪", label: "Campaigner", req: "Complete a campaign", earned: (profile.campaignsCompleted ?? 0) >= 1 },
    { id: "standard_bearer", icon: "⚑", label: "Standard Bearer", req: "Forge three banners", earned: factionCount >= 3 },
    { id: "cartographer", icon: "◈", label: "Ministry Cartographer", req: "Draft a war chart", earned: (profile.mapsCreated ?? 0) >= 1 },
  ];
}