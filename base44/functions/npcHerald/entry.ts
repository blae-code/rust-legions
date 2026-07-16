import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Background AI herald — gives each NPC faction a living, doctrine-driven voice.
// Reads the war's current state (control, dispositions, recent front reports) and
// writes one in-character radio broadcast per NPC faction per turn.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const svc = base44.asServiceRole;
    const { gameId } = await req.json();
    const game = await svc.entities.Game.get(gameId).catch(() => null);
    if (!game) return Response.json({ error: 'Game not found' }, { status: 404 });
    const isParty = (game.factionSlots || []).some((s) => s.userId === user.id) || game.hostUserId === user.id;
    if (!isParty) return Response.json({ error: 'You are not a party to this game' }, { status: 403 });
    if (game.status !== 'active') return Response.json({ dispatches: [] });

    const npcs = (game.factionSlots || []).filter((s) => s.isNPC && !s.eliminated);
    if (npcs.length === 0) return Response.json({ dispatches: [] });

    // One broadcast per faction per turn — skip anything already on the wire
    const existing = await svc.entities.NpcDispatch.filter({ gameId, turnNumber: game.turnNumber });
    const due = npcs.filter((n) => !existing.some((e) => e.factionName === n.factionName));
    if (due.length === 0) return Response.json({ dispatches: [], skipped: true });

    const nameOf = (i) => game.factionSlots[i]?.factionName || 'an unknown faction';
    const land = game.tiles.filter((t) => !t.isSea).length || 1;
    const controlPct = (idx) =>
      Math.round((100 * game.tiles.filter((t) => !t.isSea && game.territoryStates[t.id]?.owner === idx).length) / land);
    const recent = (game.combatLog || []).slice(-14)
      .map((e) => e.text || `${e.attacker} attacked ${e.defender} at ${e.tileName} — ${e.outcome}`)
      .join('\n');

    const personas = {
      aggressive: 'a brutal, taunting warlord horde. Voice: short violent sentences, contempt for the weak, glory in fire and steel.',
      economic: 'a coldly transactional merchant combine. Voice: everything priced in ledgers; threats phrased as invoices, tariffs and market forecasts.',
      defensive: 'stoic wall-wardens. Voice: terse, grim, patient; speaks of stone, endurance, and the folly of those who attack.',
    };

    const briefs = due.map((n) => {
      const disp = Object.entries(n.dispositions || {})
        .map(([k, v]) => `${nameOf(Number(k))}: ${v > 20 ? 'friendly' : v < -20 ? 'hostile' : 'wary'} (${v})`)
        .join(', ');
      return `- "${n.factionName}" (doctrine: ${n.doctrine}) — persona: ${personas[n.doctrine] || personas.aggressive} Controls ${controlPct(n.slotIndex)}% of the land. Attitudes toward others: ${disp || 'none recorded'}.`;
    }).join('\n');

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You write in-character radio broadcasts for NPC factions in a gritty dieselpunk turn-based wargame set on an abandoned continent. It is turn ${game.turnNumber}; the weather is ${game.weather || 'clear'}.

Recent front reports (newest last):
${recent || 'The front is quiet.'}

NPC factions needing a broadcast this turn:
${briefs}

For EACH faction listed, write exactly one intercepted radio broadcast of 1-2 sentences (max 40 words) in that faction's distinct voice and persona. React to the real recent events above — name specific factions, places and outcomes where possible; reference their attitudes (gloat at hostiles, court friendlies). Never break character, never mention game mechanics or turns. Also give each broadcast a single-word mood (e.g. wrathful, gloating, wary, smug, grim).`,
      response_json_schema: {
        type: 'object',
        properties: {
          dispatches: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                factionName: { type: 'string' },
                mood: { type: 'string' },
                text: { type: 'string' },
              },
            },
          },
        },
      },
    });

    const records = (res.dispatches || [])
      .filter((d) => d.text && due.some((n) => n.factionName === d.factionName))
      .map((d) => ({
        gameId,
        turnNumber: game.turnNumber,
        factionName: d.factionName,
        doctrine: due.find((n) => n.factionName === d.factionName)?.doctrine || '',
        mood: (d.mood || '').toLowerCase(),
        text: d.text,
      }));
    if (records.length > 0) await svc.entities.NpcDispatch.bulkCreate(records);
    return Response.json({ dispatches: records });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});