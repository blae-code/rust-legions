// Access and input checks shared by the gameplay entry points.
export const isGameParticipant = (game, user) =>
  game.hostUserId === user.id || (game.factionSlots || []).some((s) => s.userId === user.id);

export function gameActionError(game, user, action) {
  const participant = isGameParticipant(game, user);
  const openLobby = game.status === 'lobby' && game.mode === 'multiplayer';
  if (action === 'getState') {
    return participant || user.role === 'admin' || openLobby ? null : { status: 403, error: 'Only commanders in this operation may read its reports.' };
  }
  if (!participant && !(action === 'joinGame' && openLobby) && !(user.role === 'admin' && ['configureLobby', 'setSlotType'].includes(action))) {
    return { status: 403, error: 'You hold no command in this operation.' };
  }
  if (['paused', 'cancelled', 'complete'].includes(game.status)) {
    return { status: 409, error: 'This operation is not accepting orders.' };
  }
  if (game.activeBattle && ['macroPlotMarch', 'macroMoveBase', 'macroHalt', 'macroMusterColumn', 'macroDisbandColumn', 'endTurn'].includes(action)) {
    return { status: 409, error: 'Resolve the current battle before issuing strategic force orders.' };
  }
  return null;
}

export function validResourceOffer(value, keys) {
  return !!value && typeof value === 'object' && !Array.isArray(value) &&
    Object.entries(value).every(([key, amount]) => keys.includes(key) && Number.isSafeInteger(amount) && amount >= 0);
}

export function validCampaignCondition(value) {
  return !!value && ['survive', 'territory'].includes(value.type) &&
    Number.isSafeInteger(value.value) && value.value >= 1 &&
    (value.type !== 'territory' || value.value <= 100);
}

export function campaignAnnalsSummary(game) {
  return {
    id: game.id, name: game.name, planetId: game.planetId, turnNumber: game.turnNumber,
    winnerSlot: game.winnerSlot,
    factionSlots: (game.factionSlots || []).map((s) => ({ factionName: s.factionName, color: s.color })),
    battleCount: (game.combatLog || []).filter((e) => e.type === 'combat').length,
    captureCount: (game.combatLog || []).filter((e) => e.type === 'capture').length,
  };
}