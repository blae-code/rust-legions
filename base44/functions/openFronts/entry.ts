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

    return Response.json({
      games: open.map((g) => ({
        id: g.id,
        name: g.name,
        planetId: g.planetId || 'cindara',
        playerCount: (g.factionSlots || []).length,
        openSlots: (g.factionSlots || []).filter((s) => !s.isNPC && !s.userId).length,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}