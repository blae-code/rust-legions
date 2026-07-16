import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Off-turn ("concurrent play") actions — planning that never touches contested state.
// Research focus may be set at any time, even when it is not your turn.
// Tech catalog mirrors gameEngine and src/lib/doctrine.js.
const TECHS = {
  standardized_calibers: { cost: 3, prereq: null },
  hardened_plate: { cost: 4, prereq: 'standardized_calibers' },
  combined_arms: { cost: 6, prereq: 'hardened_plate' },
  rationalized_foundries: { cost: 3, prereq: null },
  synthetic_fuel: { cost: 4, prereq: 'rationalized_foundries' },
  total_mobilization: { cost: 6, prereq: 'synthetic_fuel' },
  field_kitchens: { cost: 3, prereq: null },
  motorized_supply: { cost: 4, prereq: 'field_kitchens' },
  general_staff_academy: { cost: 6, prereq: 'motorized_supply' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const svc = base44.asServiceRole;
    const { action, gameId, techId } = await req.json();

    const game = await svc.entities.Game.get(gameId);
    if (!game) return Response.json({ error: 'Game not found' }, { status: 404 });
    const slot = (game.factionSlots || []).find((s) => s.userId === user.id);
    if (!slot) return Response.json({ error: 'You are not a party to this game' }, { status: 403 });
    if (game.status !== 'active') return Response.json({ error: 'Game is not active' }, { status: 400 });

    if (action === 'setResearchFocus') {
      slot.research = slot.research || { focus: null, progress: {}, completed: [] };
      if (techId === null || techId === undefined) {
        slot.research.focus = null;
      } else {
        const tech = TECHS[techId];
        if (!tech) return Response.json({ error: 'Unknown doctrine' }, { status: 400 });
        if ((slot.research.completed || []).includes(techId)) return Response.json({ error: 'That doctrine is already in service' }, { status: 400 });
        if (tech.prereq && !(slot.research.completed || []).includes(tech.prereq)) {
          return Response.json({ error: 'Its prerequisite doctrine has not yet entered service' }, { status: 400 });
        }
        slot.research.focus = techId;
      }
      await svc.entities.Game.update(game.id, { factionSlots: game.factionSlots });
      return Response.json({ ok: true, research: slot.research });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});