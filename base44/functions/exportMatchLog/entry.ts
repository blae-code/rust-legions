import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { ensureTab, appendRows } from '../../shared/sheetsRegistry.ts';

// Every field report of a concluded war, filed line by line for balance review.
const TAB = 'Match Log';
const HEADER = [
  'Logged At', 'Game', 'Mode', 'World', 'Day', 'Type', 'Attacker / Faction',
  'Defender', 'Site', 'Outcome', 'Attacker Losses', 'Defender Losses', 'Detail',
];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole;
    const { gameId } = await req.json();
    const game = await svc.entities.Game.get(gameId);
    if (!game) return Response.json({ error: 'Game not found' }, { status: 404 });
    if (game.status !== 'complete') return Response.json({ error: 'The war is still in progress' }, { status: 400 });

    const ts = new Date().toISOString();
    const rows = (game.combatLog || []).map((e) => {
      const detail = e.type === 'capture'
        ? [e.isCapital ? 'capital' : null, e.resource ? `+${e.amount}/turn ${e.resource}` : null,
           (e.buildings || []).length ? `${e.buildings.length} structures` : null].filter(Boolean).join(' · ')
        : e.text || '';
      return [
        ts, game.name, game.mode, game.planetId || 'cindara', e.turn || '', e.type || 'event',
        e.attacker || e.faction || '', e.defender || e.from || '', e.tileName || '',
        e.outcome || '', e.attLosses ?? '', e.defLosses ?? '', detail,
      ];
    });

    if (rows.length === 0) return Response.json({ ok: true, rows: 0, skipped: 'No field reports on file' });

    const { accessToken } = await svc.connectors.getConnection('googlesheets');
    if (await ensureTab(accessToken, TAB)) await appendRows(accessToken, TAB, [HEADER]);
    await appendRows(accessToken, TAB, rows);

    return Response.json({ ok: true, rows: rows.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}