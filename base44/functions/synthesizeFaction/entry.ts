import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { choices, doctrine } = body;
    if (!choices || !doctrine) return Response.json({ error: 'choices and doctrine are required' }, { status: 400 });

    const prompt = `You are the narrative engine for "Conquest", a gritty dieselpunk turn-based strategy game inspired by Foxhole and Iron Harvest (worn metal, mud, diesel fumes, WWI-era industrial war machinery — no magic, no modern tech).

A player has completed a lifepath faction builder. Their choices, in order:
${JSON.stringify(choices, null, 2)}
Chosen military doctrine: ${doctrine}

Synthesize this into a playable faction. The lore must directly reflect and weave together EVERY lifepath choice as the faction's actual history. Tone: terse, grounded, evocative — like a military field dossier crossed with folk memory.

Rules for traits (3 to 5 traits):
- Each trait needs a name, a one-sentence description tying it to the faction's history, and exactly one mechanical effect.
- Allowed effect objects (choose type and fill fields):
  {"type":"income_flat","value":1 or 2} — bonus income per turn
  {"type":"unit_discount","unit":"riflemen"|"crawler"|"gunboat"|"fighter","value":1} — cheaper unit
  {"type":"attack_bonus","unit":"riflemen"|"crawler"|"gunboat"|"fighter","value":1} — that unit hits harder
  {"type":"defense_bonus","unit":"riflemen"|"crawler"|"gunboat"|"fighter","value":1} — that unit defends better
- Effects must thematically match the choices (e.g. foundry homeland → crawler discount; hard steppes → riflemen defense).

npcDispositions: how NPC factions of each doctrine initially feel about this faction, from -40 (hostile) to +40 (friendly), based on its history and philosophy.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          factionName: { type: "string" },
          lore: { type: "string", description: "2-3 paragraphs of faction history" },
          insigniaDescription: { type: "string", description: "One sentence describing the faction's insignia" },
          traits: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                effect: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["income_flat", "unit_discount", "attack_bonus", "defense_bonus"] },
                    unit: { type: "string", enum: ["riflemen", "crawler", "gunboat", "fighter"] },
                    value: { type: "integer" }
                  },
                  required: ["type", "value"]
                }
              },
              required: ["name", "description", "effect"]
            }
          },
          npcDispositions: {
            type: "object",
            properties: {
              aggressive: { type: "integer" },
              economic: { type: "integer" },
              defensive: { type: "integer" }
            },
            required: ["aggressive", "economic", "defensive"]
          }
        },
        required: ["factionName", "lore", "insigniaDescription", "traits", "npcDispositions"]
      }
    });

    // Clamp values defensively
    const traits = (result.traits || []).slice(0, 5).map((t) => ({
      ...t,
      effect: { ...t.effect, value: Math.min(Math.max(t.effect?.value || 1, 1), 2) }
    }));
    const clampDisp = (v) => Math.min(Math.max(v || 0, -40), 40);
    const npcDispositions = {
      aggressive: clampDisp(result.npcDispositions?.aggressive),
      economic: clampDisp(result.npcDispositions?.economic),
      defensive: clampDisp(result.npcDispositions?.defensive),
    };

    return Response.json({
      factionName: result.factionName,
      lore: result.lore,
      insigniaDescription: result.insigniaDescription,
      traits,
      npcDispositions,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});