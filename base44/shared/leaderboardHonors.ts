import { slotMedals } from './combatHonors.ts';

// Called only after authentication. Return public honours, never private war state.
export async function leaderboardHonors(svc) {
  const profiles = await svc.entities.UserProfile.list('-gamesWon', 200);
  const honours = new Map(profiles.map((p) => [p.created_by_id, new Set()]));
  if (profiles.length) {
    for (let skip = 0; ; skip += 100) {
      const games = await svc.entities.Game.filter(
        { status: { $in: ['active', 'paused', 'complete', 'cancelled'] } }, 'created_date', 100, skip,
      );
      for (const game of games) {
        for (const slot of game.factionSlots || []) {
          if (slot.isNPC || !honours.has(slot.userId)) continue;
          for (const medal of slotMedals(slot)) honours.get(slot.userId).add(medal);
        }
      }
      if (games.length < 100) break;
    }
  }
  return profiles.map((p) => ({
    id: p.id, displayName: p.displayName,
    gamesPlayed: p.gamesPlayed || 0, gamesWon: p.gamesWon || 0,
    campaignsCompleted: p.campaignsCompleted || 0, mapsCreated: p.mapsCreated || 0,
    medals: [...(honours.get(p.created_by_id) || [])],
  }));
}