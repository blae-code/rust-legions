import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const RESOURCE_LABELS = { manpower: 'Manpower', steel: 'Steel', fuel: 'Fuel' };

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
    if (game.chronicleDocUrl) return Response.json({ skipped: 'Already exported', url: game.chronicleDocUrl });

    const winner = game.winnerSlot !== undefined && game.winnerSlot !== null ? game.factionSlots?.[game.winnerSlot] : null;

    // Build the chronicle as styled lines: { text, style }
    const lines = [];
    lines.push({ text: `War Chronicle — ${game.name}`, style: 'HEADING_1' });
    lines.push({
      text: `${game.mode === 'campaign' ? 'Campaign' : 'Multiplayer front'} · ${game.turnNumber} turns · Victor: ${winner ? winner.factionName : 'None'} · Concluded ${new Date().toISOString().slice(0, 10)}`,
      style: 'SUBTITLE',
    });
    lines.push({ text: `Belligerents: ${(game.factionSlots || []).map((s) => `${s.factionName}${s.isNPC ? ' (NPC)' : ''}`).join(', ')}`, style: 'NORMAL_TEXT' });

    const byTurn = {};
    for (const e of game.combatLog || []) {
      const t = e.turn || 0;
      (byTurn[t] = byTurn[t] || []).push(e);
    }
    for (const turn of Object.keys(byTurn).map(Number).sort((a, b) => a - b)) {
      lines.push({ text: `Turn ${turn}`, style: 'HEADING_2' });
      for (const e of byTurn[turn]) {
        if (e.type === 'capture') {
          const bits = [`${e.faction} seized ${e.tileName} from ${e.from}`];
          if (e.resource) bits.push(`+${e.amount} ${RESOURCE_LABELS[e.resource] || e.resource}`);
          if (e.bonus) bits.push(`bonus: ${String(e.bonus).replace(/_/g, ' ')}`);
          if ((e.buildings || []).length) bits.push(`structures captured: ${e.buildings.join(', ')}`);
          if (e.isCapital) bits.push('CAPITAL TAKEN');
          lines.push({ text: `⚑ ${bits.join(' — ')}`, style: 'NORMAL_TEXT' });
        } else if (e.type === 'combat') {
          lines.push({
            text: `⚔ ${e.attacker} vs ${e.defender} at ${e.tileName} — ${e.outcome} after ${e.rounds} round${e.rounds === 1 ? '' : 's'} (attacker lost ${e.attLosses}, defender lost ${e.defLosses})`,
            style: 'NORMAL_TEXT',
          });
        } else {
          lines.push({ text: `• ${e.text}`, style: 'NORMAL_TEXT' });
        }
      }
    }

    const { accessToken } = await svc.connectors.getConnection('googledocs');
    const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `War Chronicle — ${game.name} (${new Date().toISOString().slice(0, 10)})` }),
    });
    const doc = await createRes.json();
    if (!createRes.ok) return Response.json({ error: doc.error?.message || 'Failed to create document' }, { status: 502 });

    // One insertText plus paragraph styles applied to tracked ranges
    const requests = [];
    let index = 1;
    let fullText = '';
    const ranges = [];
    for (const line of lines) {
      const text = line.text + '\n';
      ranges.push({ start: index, end: index + text.length, style: line.style });
      fullText += text;
      index += text.length;
    }
    requests.push({ insertText: { location: { index: 1 }, text: fullText } });
    for (const r of ranges) {
      if (r.style === 'NORMAL_TEXT') continue;
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: r.start, endIndex: r.end },
          paragraphStyle: { namedStyleType: r.style },
          fields: 'namedStyleType',
        },
      });
    }
    const updRes = await fetch(`https://docs.googleapis.com/v1/documents/${doc.documentId}:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    });
    if (!updRes.ok) {
      const err = await updRes.json();
      return Response.json({ error: err.error?.message || 'Failed to write document' }, { status: 502 });
    }

    const url = `https://docs.google.com/document/d/${doc.documentId}/edit`;
    await svc.entities.Game.update(game.id, { chronicleDocUrl: url });
    return Response.json({ ok: true, url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});