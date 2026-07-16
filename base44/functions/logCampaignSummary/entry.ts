import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Final campaign summary — one row per human commander, appended to the
// "Campaign Summary" tab of the War Record spreadsheet when a session ends.
const SPREADSHEET_ID = '1SM95xZ_tuBxajlG1JMfAIF_7cqLb9qzs36EkbmnxFSA';
const TAB = 'Campaign Summary';
const HEADER = ['Logged At', 'Game', 'Mode', 'Turns', 'Commander', 'Faction', 'Outcome', 'Total Games Won', 'Manpower', 'Steel', 'Fuel', 'Milestones'];
const MEDALS = {
  iron_hammer: 'Order of the Iron Hammer',
  brass_star: 'Brass Star of Command',
  defiant_standard: 'The Defiant Standard',
  marshals_cross: "The Marshal's Cross",
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const svc = base44.asServiceRole;
    const { gameId } = await req.json();
    const game = await svc.entities.Game.get(gameId);
    if (!game) return Response.json({ error: 'Game not found' }, { status: 404 });
    if (game.status !== 'complete') return Response.json({ error: 'The war is still in progress' }, { status: 400 });

    // All-time victories per commander, across every finished war
    const finished = await svc.entities.Game.filter({ status: 'complete' }, '-updated_date', 500);
    const winsByUser = {};
    for (const g of finished) {
      const w = g.winnerSlot !== undefined && g.winnerSlot !== null ? g.factionSlots?.[g.winnerSlot] : null;
      if (w && !w.isNPC && w.userId) winsByUser[w.userId] = (winsByUser[w.userId] || 0) + 1;
    }

    const humans = (game.factionSlots || []).filter((s) => !s.isNPC && s.userId);
    const summary = humans.map((s) => {
      const t = game.treasuries?.[s.slotIndex] ?? game.treasuries?.[String(s.slotIndex)] ?? {};
      const won = game.winnerSlot === s.slotIndex;
      const milestones = [];
      if (won) milestones.push('Won the war');
      if (s.eliminated) milestones.push('Faction eliminated');
      (s.generals || []).flatMap((g) => g.medals || []).forEach((m) => milestones.push(MEDALS[m] || m));
      const techs = s.research?.completed?.length || 0;
      if (techs) milestones.push(`${techs} doctrine${techs > 1 ? 's' : ''} researched`);
      const unlocks = s.unlocks?.length || 0;
      if (unlocks) milestones.push(`${unlocks} armory unlock${unlocks > 1 ? 's' : ''}`);
      if (s.baseLost) milestones.push('Fortress-base lost');
      return {
        commander: s.userId,
        faction: s.factionName,
        outcome: won ? 'Victory' : s.eliminated ? 'Eliminated' : 'Armistice',
        totalWins: winsByUser[s.userId] || 0,
        resources: { manpower: t.manpower || 0, steel: t.steel || 0, fuel: t.fuel || 0 },
        milestones,
      };
    });

    const alreadyLogged = !!game.summaryLogged;
    if (!alreadyLogged && summary.length > 0) {
      const { accessToken } = await svc.connectors.getConnection('googlesheets');
      const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
      const append = (values) => fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(TAB + '!A1')}:append?valueInputOption=USER_ENTERED`,
        { method: 'POST', headers, body: JSON.stringify({ values }) }
      );

      // Ensure the tab exists — create it with a header row on first use
      const tabRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`, {
        method: 'POST', headers,
        body: JSON.stringify({ requests: [{ addSheet: { properties: { title: TAB } } }] }),
      });
      if (tabRes.ok) await append([HEADER]);

      const ts = new Date().toISOString();
      const rows = summary.map((r) => [
        ts, game.name, game.mode, game.turnNumber, r.commander, r.faction, r.outcome,
        r.totalWins, r.resources.manpower, r.resources.steel, r.resources.fuel,
        r.milestones.join(' · ') || '—',
      ]);
      const res = await append(rows);
      if (!res.ok) {
        const data = await res.json();
        return Response.json({ error: data.error?.message || 'Sheets append failed' }, { status: 502 });
      }
      await svc.entities.Game.update(game.id, { summaryLogged: true });
    }

    return Response.json({ ok: true, alreadyLogged, summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});