import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Front management — host controls (pause, resume, cancel, settings) plus
// full Ministry (app-admin) oversight of every live and archived front.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const svc = base44.asServiceRole;
    const body = await req.json();
    const { action, gameId } = body;
    const isAdmin = user.role === 'admin';

    // ----- Ministry registry: every front on file (admin only) -----
    if (action === 'listGames') {
      if (!isAdmin) return Response.json({ error: 'Ministry clearance required' }, { status: 403 });
      const games = await svc.entities.Game.list('-updated_date', 200);
      const profiles = await svc.entities.UserProfile.list('-created_date', 500);
      const callsignOf = {};
      for (const p of profiles) callsignOf[p.created_by_id] = p.displayName;
      return Response.json({
        games: games.map((g) => ({
          id: g.id,
          name: g.name,
          mode: g.mode,
          status: g.status,
          turnNumber: g.turnNumber,
          playerCount: (g.factionSlots || []).length,
          humanCount: (g.factionSlots || []).filter((s) => !s.isNPC).length,
          openSeats: (g.factionSlots || []).filter((s) => !s.isNPC && !s.userId).length,
          hostCallsign: callsignOf[g.hostUserId] || 'Unknown',
          isMine: g.hostUserId === user.id,
          winnerName: g.winnerSlot !== undefined && g.winnerSlot !== null ? g.factionSlots?.[g.winnerSlot]?.factionName || null : null,
          updatedDate: g.updated_date,
          createdDate: g.created_date,
        })),
      });
    }

    // ----- Per-front management: host or Ministry -----
    const game = gameId ? await svc.entities.Game.get(gameId).catch(() => null) : null;
    if (!game) return Response.json({ error: 'That front is not on file' }, { status: 404 });
    if (!isAdmin && game.hostUserId !== user.id) {
      return Response.json({ error: 'Only the host or the Ministry may manage this front' }, { status: 403 });
    }

    const log = (text) => {
      game.combatLog = game.combatLog || [];
      game.combatLog.push({ turn: game.turnNumber || 1, type: 'event', text });
    };

    if (action === 'pauseGame') {
      if (!['active', 'lobby'].includes(game.status)) {
        return Response.json({ error: 'Only a live front can be suspended' }, { status: 400 });
      }
      log('The Ministry suspends operations on this front — all orders are held.');
      await svc.entities.Game.update(game.id, { status: 'paused', pausedStatus: game.status, combatLog: game.combatLog });
      return Response.json({ ok: true });
    }

    if (action === 'resumeGame') {
      if (game.status !== 'paused') return Response.json({ error: 'This front is not suspended' }, { status: 400 });
      const restored = game.pausedStatus === 'lobby' ? 'lobby' : 'active';
      log('The suspension is lifted — operations resume.');
      await svc.entities.Game.update(game.id, { status: restored, pausedStatus: null, combatLog: game.combatLog });
      return Response.json({ ok: true });
    }

    if (action === 'cancelGame') {
      if (['complete', 'cancelled'].includes(game.status)) {
        return Response.json({ error: 'This front is already closed' }, { status: 400 });
      }
      log('By order of the host, this front is struck from the register — the war ends without decision.');
      await svc.entities.Game.update(game.id, { status: 'cancelled', pausedStatus: null, activeBattle: null, combatLog: game.combatLog });
      return Response.json({ ok: true });
    }

    if (action === 'deleteGame') {
      if (!isAdmin) return Response.json({ error: 'Only the Ministry may destroy a file outright' }, { status: 403 });
      await svc.entities.Game.delete(game.id);
      return Response.json({ ok: true });
    }

    if (action === 'updateSettings') {
      const patch = {};
      if (body.name !== undefined) {
        const name = String(body.name).trim().slice(0, 60);
        if (!name) return Response.json({ error: 'A front needs a name' }, { status: 400 });
        patch.name = name;
      }
      if (body.campaignWinCondition !== undefined) {
        if (game.mode !== 'campaign') return Response.json({ error: 'Victory conditions apply to campaigns only' }, { status: 400 });
        const { type, value } = body.campaignWinCondition || {};
        if (!['survive', 'territory'].includes(type)) return Response.json({ error: 'Unknown win condition' }, { status: 400 });
        patch.campaignWinCondition = { type, value: Math.max(Number(value) || 0, 1) };
      }
      if (Object.keys(patch).length === 0) return Response.json({ error: 'Nothing to amend' }, { status: 400 });
      if (patch.name && patch.name !== game.name) log(`The operation is redesignated "${patch.name}".`);
      if (patch.campaignWinCondition) {
        const c = patch.campaignWinCondition;
        log(`The campaign directive is amended — ${c.type === 'survive' ? `survive ${c.value} days` : `hold ${c.value}% of settlements`}.`);
      }
      patch.combatLog = game.combatLog;
      await svc.entities.Game.update(game.id, patch);
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}