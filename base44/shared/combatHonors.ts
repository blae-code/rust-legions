// Existing combat milestones, now also retained on the commander's faction record.
export const MEDALS = {
  iron_hammer: { label: 'Order of the Iron Hammer', desc: 'Three consecutive victories' },
  brass_star: { label: 'Brass Star of Command', desc: 'A decisive victory with minimal casualties' },
  defiant_standard: { label: 'The Defiant Standard', desc: 'Victory against a superior force' },
  marshals_cross: { label: "The Marshal's Cross", desc: 'Five career victories' },
};

export function slotMedals(slot = {}) {
  const earned = new Set([...(slot.medals || []), ...(slot.generals || []).flatMap((g) => g.medals || [])]);
  return Object.keys(MEDALS).filter((key) => earned.has(key));
}

function awardMedal(game, slot, general, key, battle) {
  slot.medals = [...new Set([...slotMedals(slot), key])];
  general.medals = general.medals || [];
  if (general.medals.includes(key)) return;
  general.medals.push(key);
  game.combatLog.push({
    turn: game.turnNumber, type: 'event', medal: key, slot: slot.slotIndex,
    generalId: general.id, battleId: battle.id,
    text: `${general.name} is decorated with the ${MEDALS[key].label} — ${MEDALS[key].desc.toLowerCase()}.`,
  });
}

export function recordBattleHonors(game, battle, attackerWon, countUnits) {
  const sides = [
    { s: battle.attacker, foe: battle.defender, won: attackerWon },
    { s: battle.defender, foe: battle.attacker, won: !attackerWon },
  ];
  for (const { s, foe, won } of sides) {
    if (s.slot === null || s.slot === undefined || !s.generalId) continue;
    const slot = game.factionSlots[s.slot];
    const general = (slot?.generals || []).find((g) => g.id === s.generalId);
    if (!general) continue;
    if (!won) { general.streak = 0; continue; }
    general.streak = (general.streak || 0) + 1;
    const award = (key) => awardMedal(game, slot, general, key, battle);
    if (general.streak >= 3) award('iron_hammer');
    if ((general.victories || 0) >= 5) award('marshals_cross');
    const myStart = countUnits(s.units) + (s.losses || 0);
    const foeStart = countUnits(foe.units) + (foe.losses || 0);
    if (myStart > 0 && (s.losses || 0) / myStart <= 0.1 && foeStart >= 3) award('brass_star');
    if (foeStart > myStart * 1.5) award('defiant_standard');
  }
}