// Compiles the closing record of a war from the state the server already sends:
// each commander's battle record, their holdings at the armistice, and the
// milestones the campaign turned on.

export function buildCommanderRecords(game) {
  const log = game.combatLog || [];
  const control = game.macro?.control || {};

  return (game.factions || [])
    .map((f) => {
      const name = f.factionName;
      const battles = log.filter((e) => e.type === "combat" && (e.attacker === name || e.defender === name));
      const won = battles.filter(
        (e) => (e.attacker === name && e.outcome === "captured") || (e.defender === name && e.outcome !== "captured")
      );
      const captures = log.filter((e) => e.type === "capture" && e.faction === name);
      const suffered = battles.reduce(
        (sum, e) => sum + (e.attacker === name ? e.attLosses || 0 : e.defLosses || 0),
        0
      );
      const inflicted = battles.reduce(
        (sum, e) => sum + (e.attacker === name ? e.defLosses || 0 : e.attLosses || 0),
        0
      );
      const holdings = Object.values(control).filter((slot) => slot === f.slotIndex).length;

      return {
        ...f,
        outcome: game.winnerName === name ? "Victory" : f.eliminated ? "Eliminated" : "Armistice",
        battles: battles.length,
        won: won.length,
        assaultsLed: battles.filter((e) => e.attacker === name).length,
        captures: captures.length,
        capitals: captures.filter((e) => e.isCapital).length,
        inflicted,
        suffered,
        holdings,
      };
    })
    .sort((a, b) => {
      if (a.outcome === "Victory") return -1;
      if (b.outcome === "Victory") return 1;
      return b.holdings - a.holdings;
    });
}

// The turning points, in the order they happened
export function buildMilestones(game) {
  const log = game.combatLog || [];
  const marks = [];

  const firstBlood = log.find((e) => e.type === "combat");
  if (firstBlood) {
    marks.push({
      turn: firstBlood.turn,
      kind: "blood",
      text: `First blood at ${firstBlood.tileName} — ${firstBlood.attacker} opened fire on ${firstBlood.defender}.`,
    });
  }

  for (const e of log) {
    if (e.type === "capture" && e.isCapital) {
      marks.push({ turn: e.turn, kind: "capital", text: `${e.faction} seized the seat of ${e.tileName}${e.from ? ` from ${e.from}` : ""}.` });
    } else if (e.type === "event") {
      marks.push({ turn: e.turn, kind: "event", text: e.text });
    }
  }

  // The bloodiest single engagement of the war
  const battles = log.filter((e) => e.type === "combat");
  if (battles.length) {
    const worst = battles.reduce((a, b) =>
      (b.attLosses || 0) + (b.defLosses || 0) > (a.attLosses || 0) + (a.defLosses || 0) ? b : a
    );
    marks.push({
      turn: worst.turn,
      kind: "bloodiest",
      text: `The bloodiest day of the war fell on ${worst.tileName} — ${(worst.attLosses || 0) + (worst.defLosses || 0)} regiments broken.`,
    });
  }

  for (const f of game.factions || []) {
    if (f.eliminated) marks.push({ turn: null, kind: "fall", text: `${f.factionName} was struck from the register.` });
  }

  if (game.winnerName) {
    marks.push({ turn: game.turnNumber, kind: "victory", text: `${game.winnerName} carried the war and dictated the armistice.` });
  }

  return marks.sort((a, b) => (a.turn ?? 9999) - (b.turn ?? 9999));
}