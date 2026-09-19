// Medal registry — mirrors the server's combatHonors milestone rules.
export const MEDALS = {
  iron_hammer: { label: "Order of the Iron Hammer", icon: "⚒", desc: "Three consecutive victories", requirement: "Win three consecutive battles with the same general. A defeat resets that general’s streak." },
  brass_star: { label: "Brass Star of Command", icon: "✪", desc: "A decisive victory with minimal casualties", requirement: "Win a battle while losing no more than 10% of your starting companies, against an enemy that began with at least three companies." },
  defiant_standard: { label: "The Defiant Standard", icon: "⚑", desc: "Victory against a superior force", requirement: "Win a battle against an enemy whose starting company count was more than 1.5 times your own." },
  marshals_cross: { label: "The Marshal's Cross", icon: "✠", desc: "Five career victories", requirement: "Win five battles with the same general during an operation. Victories need not be consecutive." },
};