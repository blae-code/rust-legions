import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const SPREADSHEET_ID = '1SM95xZ_tuBxajlG1JMfAIF_7cqLb9qzs36EkbmnxFSA';
const RANGE = 'War Record!A1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const svc = base44.asServiceRole;
    const { gameId } = await req.json();
    const game = await svc.entities.Game.get(gameId);
    if (!game) return Response.json({ error: 'Game not found' }, { status: 404 });
    if (game.status !== 'complete') return Response.json({ skipped: 'Game not complete' });
    if (game.loggedToSheet) return Response.json({ skipped: 'Already logged' });

    const winner = game.winnerSlot !== undefined && game.winnerSlot !== null ? game.factionSlots?.[game.winnerSlot] : null;
    const combats = (game.combatLog || []).filter((e) => e.type === 'combat');
    const captures = (game.combatLog || []).filter((e) => e.type === 'capture');
    const attLosses = combats.reduce((s, e) => s + (e.attLosses || 0), 0);
    const defLosses = combats.reduce((s, e) => s + (e.defLosses || 0), 0);
    const row = [
      new Date().toISOString(),
      game.name,
      game.mode,
      game.turnNumber,
      winner ? winner.factionName : 'None',
      winner ? (winner.isNPC ? 'NPC' : 'Player') : '',
      winner?.userId || '',
      (game.factionSlots || []).map((s) => `${s.factionName}${s.isNPC ? ' (NPC)' : ''}`).join(', '),
      combats.length,
      attLosses,
      defLosses,
      captures.length,
    ];

    const { accessToken } = await svc.connectors.getConnection('googlesheets');
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(RANGE)}:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] }),
      }
    );
    const data = await res.json();
    if (!res.ok) return Response.json({ error: data.error?.message || 'Sheets append failed' }, { status: 502 });

    await svc.entities.Game.update(game.id, { loggedToSheet: true });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});