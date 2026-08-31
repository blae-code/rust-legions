import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// The baton has passed — wire an email nudge to the commander whose turn it now is.
// Invoked by the "Turn Baton Telegraph" workflow whenever a Game's turn advances.
// Only fires for active multiplayer games with at least two distinct human players,
// so solo campaigns and hotseat-testing games never generate mail.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { gameId } = await req.json();
    if (!gameId) return Response.json({ error: 'gameId required' }, { status: 400 });

    const game = await base44.asServiceRole.entities.Game.get(gameId);
    if (!game) return Response.json({ skipped: 'game not found' });
    if (game.status !== 'active' || game.mode !== 'multiplayer') {
      return Response.json({ skipped: 'not an active multiplayer game' });
    }

    const slots = game.factionSlots || [];
    const humans = new Set(slots.filter((s) => !s.isNPC && s.userId && !s.eliminated).map((s) => s.userId));
    if (humans.size < 2) return Response.json({ skipped: 'fewer than two human commanders' });

    const currentSlotIndex = (game.turnOrder || [])[game.currentTurnIndex || 0];
    const slot = slots.find((s) => s.slotIndex === currentSlotIndex);
    if (!slot || slot.isNPC || !slot.userId || slot.eliminated) {
      return Response.json({ skipped: 'current slot is not a human commander' });
    }

    const users = await base44.asServiceRole.entities.User.filter({ id: slot.userId });
    const user = users[0];
    if (!user?.email) return Response.json({ skipped: 'commander has no email on file' });

    const gameUrl = `https://rust-legions.base44.app/game/${game.id}`;
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Rust Legions — Ministry of War',
      to: user.email,
      subject: `⚑ Your turn, Commander — ${game.name} (Day ${game.turnNumber})`,
      body: [
        `MINISTRY OF WAR — FIELD TELEGRAPH`,
        ``,
        `Commander,`,
        ``,
        `The baton has passed. ${slot.factionName} holds the initiative on "${game.name}" — Day ${game.turnNumber} of the March.`,
        ``,
        `Your armies await orders: ${gameUrl}`,
        ``,
        `— Signals Directorate, Terminal 7-A`,
        `ALL TRANSMISSIONS MONITORED`,
      ].join('\n'),
    });

    return Response.json({ ok: true, notified: user.email, faction: slot.factionName });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}