import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Fronts still in staging with an unclaimed human seat that the caller has not joined.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const svc = base44.asServiceRole;

    const games = await svc.entities.Game.list('-updated_date', 100);
    const open = games.filter((g) =>
      g.status === 'lobby' &&
      g.mode !== 'campaign' &&
      !(g.factionSlots || []).some((s) => s.userId === user.id) &&
      (g.factionSlots || []).some((s) => !s.isNPC && !s.userId));

    // Host callsigns only — never a real name or email.
    const hostIds = [...new Set(open.map((g) => g.hostUserId).filter(Boolean))];
    const callsigns = {};
    for (const id of hostIds) {
      const profiles = await svc.entities.UserProfile.filter({ created_by_id: id });
      if (profiles[0]?.displayName) callsigns[id] = profiles[0].displayName;
    }

    // Chart names for fronts staged on a published custom map.
    const mapIds = [...new Set(open.map((g) => g.mapId).filter(Boolean))];
    const mapNames = {};
    for (const id of mapIds) {
      const m = await svc.entities.GameMap.filter({ id });
      if (m[0]?.name) mapNames[id] = m[0].name;
    }

    return Response.json({
      games: open.map((g) => {
        const slots = g.factionSlots || [];
        return {
          id: g.id,
          name: g.name,
          planetId: g.planetId || 'cindara',
          worldModel: g.worldModel || 'hex',
          weather: g.weather || 'clear',
          mapName: g.mapId ? (mapNames[g.mapId] || null) : null,
          hostCallsign: g.hostUserId ? (callsigns[g.hostUserId] || null) : null,
          updatedAt: g.updated_date,
          playerCount: slots.length,
          npcSlots: slots.filter((s) => s.isNPC).length,
          claimedSlots: slots.filter((s) => !s.isNPC && s.userId).length,
          openSlots: slots.filter((s) => !s.isNPC && !s.userId).length,
          // Seat map for the roster pips — claimed / open / npc, in table order
          seats: slots.map((s) => ({
            state: s.isNPC ? 'npc' : s.userId ? 'claimed' : 'open',
            color: s.color || null,
            factionName: s.factionName || null,
          })),
        };
      }),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}