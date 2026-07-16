import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const UNITS = {
  riflemen: { cost: 3, attack: 1, defense: 2, domain: 'land' },
  crawler: { cost: 6, attack: 3, defense: 2, domain: 'land' },
  gunboat: { cost: 7, attack: 2, defense: 2, domain: 'sea' },
  fighter: { cost: 10, attack: 3, defense: 1, domain: 'air' },
};
const UNIT_KEYS = ['riflemen', 'crawler', 'gunboat', 'fighter'];
const CASUALTY_ORDER = ['riflemen', 'crawler', 'gunboat', 'fighter'];
const COLORS = ['#B33A3A', '#3A6EA5', '#5A7D4F', '#B5722F'];
const NPC_NAMES = {
  aggressive: ['The Iron Vanguard', 'Crimson Pact', 'The Warhost of Vel'],
  economic: ['The Foundry Combine', 'Merchant Syndicate of Ost', 'The Ledger Union'],
  defensive: ['The Bulwark Concord', 'Wardens of the Pale', 'The Granite Compact'],
};

const totalUnits = (u = {}) => UNIT_KEYS.reduce((s, k) => s + (u[k] || 0), 0);
const roll = () => 1 + Math.floor(Math.random() * 6);

function traitBonus(traits = [], unit, kind) {
  let b = 0;
  for (const t of traits) {
    const e = t.effect || {};
    if (e.type === kind && (!e.unit || e.unit === unit)) b += e.value || 0;
  }
  return b;
}

function rollHits(units, statKey, traits) {
  const kind = statKey === 'attack' ? 'attack_bonus' : 'defense_bonus';
  let hits = 0;
  for (const k of UNIT_KEYS) {
    const stat = Math.min(UNITS[k][statKey] + traitBonus(traits, k, kind), 5);
    for (let i = 0; i < (units[k] || 0); i++) if (roll() <= stat) hits++;
  }
  return hits;
}

function removeCasualties(units, n) {
  let left = n;
  for (const k of CASUALTY_ORDER) {
    while (left > 0 && (units[k] || 0) > 0) { units[k]--; left--; }
  }
}

function resolveCombat(attUnits, defUnits, attTraits, defTraits) {
  const att = { ...attUnits };
  const def = { ...defUnits };
  let rounds = 0;
  let attLosses = 0, defLosses = 0;
  while (totalUnits(att) > 0 && totalUnits(def) > 0 && rounds < 25) {
    rounds++;
    const aHits = rollHits(att, 'attack', attTraits);
    const dHits = rollHits(def, 'defense', defTraits);
    const aRemove = Math.min(dHits, totalUnits(att));
    const dRemove = Math.min(aHits, totalUnits(def));
    removeCasualties(att, aRemove);
    removeCasualties(def, dRemove);
    attLosses += aRemove;
    defLosses += dRemove;
  }
  return { att, def, rounds, attLosses, defLosses, defenderWiped: totalUnits(def) === 0, attackerWiped: totalUnits(att) === 0 };
}

function effectiveCosts(game, slotIdx) {
  const slot = game.factionSlots[slotIdx];
  const costs = {};
  const ownsFoundry = Object.entries(game.territoryStates).some(([tid, st]) => {
    const tile = game.tiles.find((t) => t.id === tid);
    return st.owner === slotIdx && tile?.resourceBonus === 'iron_foundry';
  });
  for (const k of UNIT_KEYS) {
    let c = UNITS[k].cost - traitBonus(slot.traits, k, 'unit_discount');
    if (k === 'crawler' && ownsFoundry) c -= 1;
    costs[k] = Math.max(c, 1);
  }
  return costs;
}

function collectIncome(game, slotIdx) {
  const slot = game.factionSlots[slotIdx];
  // Capital lost => no income
  if (slot.capitalTileId && game.territoryStates[slot.capitalTileId]?.owner !== slotIdx) return 0;
  let income = 0;
  for (const [tid, st] of Object.entries(game.territoryStates)) {
    if (st.owner !== slotIdx) continue;
    const tile = game.tiles.find((t) => t.id === tid);
    if (!tile || tile.isSea) continue;
    income += tile.baseIncome || 0;
    if (tile.resourceBonus === 'oil_field') income += 2;
    if (tile.resourceBonus === 'coal_depot') income += 1;
  }
  income += traitBonus(slot.traits, null, 'income_flat');
  game.treasuries[String(slotIdx)] = (game.treasuries[String(slotIdx)] || 0) + income;
  return income;
}

function ownedTiles(game, slotIdx) {
  return Object.entries(game.territoryStates).filter(([, st]) => st.owner === slotIdx).map(([tid]) => tid);
}

function checkEliminations(game) {
  for (const slot of game.factionSlots) {
    if (!slot.eliminated && ownedTiles(game, slot.slotIndex).length === 0) {
      slot.eliminated = true;
      game.combatLog.push({ turn: game.turnNumber, type: 'event', text: `${slot.factionName} has been eliminated.` });
    }
  }
}

function checkWin(game) {
  const alive = game.factionSlots.filter((s) => !s.eliminated);
  if (alive.length === 1) {
    game.status = 'complete';
    game.winnerSlot = alive[0].slotIndex;
    return;
  }
  // Sole holder of all capitals
  const capitalTiles = game.tiles.filter((t) => t.isCapital).map((t) => t.id);
  if (capitalTiles.length > 0) {
    const owners = new Set(capitalTiles.map((tid) => game.territoryStates[tid]?.owner));
    if (owners.size === 1 && !owners.has(null) && owners.has([...owners][0])) {
      const winner = [...owners][0];
      if (typeof winner === 'number') {
        game.status = 'complete';
        game.winnerSlot = winner;
      }
    }
  }
}

function checkCampaignWin(game) {
  if (game.mode !== 'campaign' || game.status !== 'active') return;
  const humanSlot = game.factionSlots.find((s) => !s.isNPC);
  if (!humanSlot || humanSlot.eliminated) return;
  const cond = game.campaignWinCondition || {};
  if (cond.type === 'survive' && game.turnNumber > (cond.value || 10)) {
    game.status = 'complete';
    game.winnerSlot = humanSlot.slotIndex;
  } else if (cond.type === 'territory') {
    const land = game.tiles.filter((t) => !t.isSea).length;
    const mine = ownedTiles(game, humanSlot.slotIndex).filter((tid) => !game.tiles.find((t) => t.id === tid)?.isSea).length;
    if (land > 0 && (mine / land) * 100 >= (cond.value || 60)) {
      game.status = 'complete';
      game.winnerSlot = humanSlot.slotIndex;
    }
  }
  // 'capitals' handled by standard checkWin
}

function validAttackUnits(units, targetTile) {
  // Sea tiles: only gunboats and fighters. Land tiles: no gunboats.
  for (const k of UNIT_KEYS) {
    if ((units[k] || 0) <= 0) continue;
    if (targetTile.isSea && k !== 'gunboat' && k !== 'fighter') return false;
    if (!targetTile.isSea && k === 'gunboat') return false;
  }
  return true;
}

function doAttack(game, slotIdx, fromTileId, toTileId, committed) {
  const fromSt = game.territoryStates[fromTileId];
  const toSt = game.territoryStates[toTileId];
  const fromTile = game.tiles.find((t) => t.id === fromTileId);
  const toTile = game.tiles.find((t) => t.id === toTileId);
  if (!fromTile || !toTile) throw new Error('Invalid tiles');
  if (fromSt.owner !== slotIdx) throw new Error('You do not control the attacking territory');
  if (toSt.owner === slotIdx) throw new Error('Cannot attack your own territory');
  if (!fromTile.adjacentIds.includes(toTileId)) throw new Error('Territories are not adjacent');
  if (!validAttackUnits(committed, toTile)) throw new Error('Those units cannot attack that terrain');
  for (const k of UNIT_KEYS) {
    if ((committed[k] || 0) > (fromSt.units[k] || 0)) throw new Error('Not enough units');
  }
  if (totalUnits(committed) === 0) throw new Error('No units committed');

  // Remove committed from source
  for (const k of UNIT_KEYS) fromSt.units[k] = (fromSt.units[k] || 0) - (committed[k] || 0);

  const attSlot = game.factionSlots[slotIdx];
  const defSlot = toSt.owner !== null && toSt.owner !== undefined ? game.factionSlots[toSt.owner] : null;
  const result = resolveCombat(committed, toSt.units, attSlot.traits || [], defSlot?.traits || []);

  let outcome;
  if (result.defenderWiped && totalUnits(result.att) > 0) {
    // Capture — fighters need company on land? Allow any surviving attacker to hold.
    toSt.owner = slotIdx;
    toSt.units = result.att;
    outcome = 'captured';
  } else if (result.attackerWiped) {
    toSt.units = result.def;
    outcome = 'repelled';
  } else {
    // Stalemate/retreat: survivors return home
    toSt.units = result.def;
    for (const k of UNIT_KEYS) fromSt.units[k] = (fromSt.units[k] || 0) + (result.att[k] || 0);
    outcome = 'retreated';
  }

  game.combatLog.push({
    turn: game.turnNumber,
    type: 'combat',
    attacker: attSlot.factionName,
    defender: defSlot ? defSlot.factionName : 'Neutral garrison',
    tileName: toTile.name,
    rounds: result.rounds,
    attLosses: result.attLosses,
    defLosses: result.defLosses,
    outcome,
  });

  checkEliminations(game);
  checkWin(game);
  checkCampaignWin(game);
  return outcome;
}

// ---------- NPC AI ----------
function npcTakeTurn(game, slotIdx) {
  const slot = game.factionSlots[slotIdx];
  const doctrine = slot.doctrine || 'aggressive';
  const costs = effectiveCosts(game, slotIdx);
  const tkey = String(slotIdx);

  const myTiles = ownedTiles(game, slotIdx);
  const tileById = (id) => game.tiles.find((t) => t.id === id);

  // Frontline tiles: owned land tiles adjacent to non-owned land
  const frontline = myTiles.filter((tid) => {
    const t = tileById(tid);
    return t && !t.isSea && t.adjacentIds.some((aid) => {
      const at = tileById(aid);
      return at && !at.isSea && game.territoryStates[aid].owner !== slotIdx;
    });
  });

  // --- Purchase ---
  let budget = game.treasuries[tkey] || 0;
  if (doctrine === 'economic') budget = Math.floor(budget * 0.7);
  const placeTile = doctrine === 'defensive'
    ? (slot.capitalTileId && game.territoryStates[slot.capitalTileId]?.owner === slotIdx ? slot.capitalTileId : frontline[0] || myTiles[0])
    : (frontline[0] || slot.capitalTileId || myTiles[0]);
  if (placeTile) {
    const st = game.territoryStates[placeTile];
    while (budget >= costs.riflemen) {
      if (doctrine === 'aggressive' && budget >= costs.crawler) {
        st.units.crawler = (st.units.crawler || 0) + 1;
        budget -= costs.crawler;
        game.treasuries[tkey] -= costs.crawler;
      } else {
        st.units.riflemen = (st.units.riflemen || 0) + 1;
        budget -= costs.riflemen;
        game.treasuries[tkey] -= costs.riflemen;
      }
    }
  }

  // --- Attacks ---
  const thresholds = { aggressive: 0.9, economic: 1.5, defensive: 2.0 };
  const threshold = thresholds[doctrine];
  let attacks = 0;
  for (let pass = 0; pass < 5 && attacks < 3 && game.status === 'active'; pass++) {
    const candidates = [];
    for (const tid of ownedTiles(game, slotIdx)) {
      const t = tileById(tid);
      if (!t || t.isSea) continue;
      const myUnits = game.territoryStates[tid].units;
      const myStrength = UNIT_KEYS.reduce((s, k) => s + (myUnits[k] || 0) * UNITS[k].attack, 0);
      if (myStrength <= 1) continue;
      for (const aid of t.adjacentIds) {
        const at = tileById(aid);
        const ast = game.territoryStates[aid];
        if (!at || at.isSea || ast.owner === slotIdx) continue;
        const defStrength = Math.max(UNIT_KEYS.reduce((s, k) => s + (ast.units[k] || 0) * UNITS[k].defense, 0), 1);
        const ratio = myStrength / defStrength;
        if (ratio < threshold) continue;
        // Disposition: prefer attacking factions this NPC dislikes
        let dispWeight = 0;
        if (ast.owner !== null && ast.owner !== undefined) {
          const disp = (slot.dispositions || {})[String(ast.owner)] || 0;
          dispWeight = -disp / 40;
        }
        const value = (at.baseIncome || 0) * 0.3 + (at.isCapital ? 3 : 0) + (at.resourceBonus ? 1 : 0);
        candidates.push({ from: tid, to: aid, score: ratio + dispWeight + value });
      }
    }
    if (candidates.length === 0) break;
    candidates.sort((a, b) => b.score - a.score);
    const pick = candidates[0];
    const srcUnits = game.territoryStates[pick.from].units;
    const committed = {};
    for (const k of ['riflemen', 'crawler', 'fighter']) {
      committed[k] = k === 'riflemen' ? Math.max((srcUnits[k] || 0) - 1, 0) : (srcUnits[k] || 0);
    }
    if (totalUnits(committed) === 0) break;
    try {
      doAttack(game, slotIdx, pick.from, pick.to, committed);
      attacks++;
    } catch {
      break;
    }
  }
}

function advanceTurn(game) {
  let guard = 0;
  while (guard++ < 20 && game.status === 'active') {
    game.currentTurnIndex = (game.currentTurnIndex + 1) % game.turnOrder.length;
    if (game.currentTurnIndex === 0) game.turnNumber++;
    const slotIdx = game.turnOrder[game.currentTurnIndex];
    const slot = game.factionSlots[slotIdx];
    if (slot.eliminated) continue;
    collectIncome(game, slotIdx);
    if (slot.isNPC) {
      npcTakeTurn(game, slotIdx);
      checkCampaignWin(game);
      continue;
    }
    return; // human's turn
  }
}

// ---------- Fog of war ----------
function visibleStateFor(game, slotIdx) {
  const revealAll = game.status !== 'active' || slotIdx === null;
  const visible = new Set();
  if (!revealAll) {
    for (const [tid, st] of Object.entries(game.territoryStates)) {
      if (st.owner === slotIdx) {
        visible.add(tid);
        const tile = game.tiles.find((t) => t.id === tid);
        for (const aid of tile?.adjacentIds || []) visible.add(aid);
      }
    }
  }
  return game.tiles.map((tile) => {
    if (revealAll || visible.has(tile.id)) {
      return { ...tile, visible: true, state: game.territoryStates[tile.id] || { owner: null, units: {} } };
    }
    return { id: tile.id, q: tile.q, r: tile.r, isSea: tile.isSea, visible: false };
  });
}

// ---------- HTTP handler ----------
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const svc = base44.asServiceRole;
    const body = await req.json();
    const { action } = body;

    // ----- listMyGames -----
    if (action === 'listMyGames') {
      const games = await svc.entities.Game.list('-updated_date', 100);
      const mine = games.filter((g) => (g.factionSlots || []).some((s) => s.userId === user.id) || g.hostUserId === user.id);
      return Response.json({
        games: mine.map((g) => ({
          id: g.id, name: g.name, mode: g.mode, status: g.status, turnNumber: g.turnNumber,
          playerCount: (g.factionSlots || []).length,
          isMyTurn: g.status === 'active' && g.factionSlots?.[g.turnOrder?.[g.currentTurnIndex]]?.userId === user.id,
          winnerName: g.status === 'complete' && g.winnerSlot !== undefined && g.winnerSlot !== null ? g.factionSlots?.[g.winnerSlot]?.factionName : null,
        })),
      });
    }

    // ----- createGame -----
    if (action === 'createGame') {
      const { name, mode = 'multiplayer', mapId, mapData, factionId, humanCount = 2, npcConfigs = [], campaignWinCondition } = body;
      let tiles;
      if (mapId) {
        const m = await svc.entities.GameMap.get(mapId);
        tiles = m.tiles;
      } else if (mapData?.tiles) {
        tiles = mapData.tiles;
      } else {
        return Response.json({ error: 'A map is required' }, { status: 400 });
      }
      const faction = await svc.entities.Faction.get(factionId);
      if (!faction) return Response.json({ error: 'Faction not found' }, { status: 404 });

      const humans = Math.min(Math.max(humanCount, 1), 4);
      const npcs = npcConfigs.slice(0, 4 - humans);
      const total = humans + npcs.length;
      if (total < 2) return Response.json({ error: 'At least 2 factions required' }, { status: 400 });
      if (mode === 'campaign' && humans !== 1) return Response.json({ error: 'Campaign mode is solo' }, { status: 400 });

      const slots = [];
      slots.push({
        slotIndex: 0, userId: user.id, factionId, factionName: faction.factionName,
        isNPC: false, doctrine: faction.doctrine, traits: faction.traits || [],
        npcDispositions: faction.npcDispositions || {}, color: COLORS[0], eliminated: false,
      });
      for (let i = 1; i < humans; i++) {
        slots.push({ slotIndex: i, userId: null, factionId: null, factionName: null, isNPC: false, traits: [], color: COLORS[i], eliminated: false });
      }
      npcs.forEach((cfg, j) => {
        const idx = humans + j;
        const names = NPC_NAMES[cfg.doctrine] || NPC_NAMES.aggressive;
        slots.push({
          slotIndex: idx, userId: null, isNPC: true, doctrine: cfg.doctrine || 'aggressive',
          factionName: names[Math.floor(Math.random() * names.length)],
          traits: [], dispositions: {}, color: COLORS[idx], eliminated: false,
        });
      });

      const game = await svc.entities.Game.create({
        name: name || 'Unnamed Front', mode, status: 'lobby', mapId: mapId || null, tiles,
        factionSlots: slots, turnOrder: slots.map((s) => s.slotIndex), currentTurnIndex: 0,
        turnNumber: 1, territoryStates: {}, treasuries: {}, combatLog: [],
        campaignWinCondition: campaignWinCondition || {}, hostUserId: user.id,
      });
      return Response.json({ gameId: game.id });
    }

    // All remaining actions operate on an existing game
    const game = await svc.entities.Game.get(body.gameId);
    if (!game) return Response.json({ error: 'Game not found' }, { status: 404 });
    const mySlotObj = (game.factionSlots || []).find((s) => s.userId === user.id);
    const mySlot = mySlotObj ? mySlotObj.slotIndex : null;

    // ----- getState -----
    if (action === 'getState') {
      const currentSlotIdx = game.turnOrder?.[game.currentTurnIndex];
      return Response.json({
        id: game.id, name: game.name, mode: game.mode, status: game.status,
        turnNumber: game.turnNumber, currentSlot: currentSlotIdx,
        isMyTurn: game.status === 'active' && game.factionSlots?.[currentSlotIdx]?.userId === user.id,
        mySlot,
        myTreasury: mySlot !== null ? game.treasuries?.[String(mySlot)] || 0 : 0,
        myCosts: mySlot !== null && game.status === 'active' ? effectiveCosts(game, mySlot) : null,
        isHost: game.hostUserId === user.id,
        campaignWinCondition: game.campaignWinCondition,
        factions: (game.factionSlots || []).map((s) => ({
          slotIndex: s.slotIndex, factionName: s.factionName, isNPC: s.isNPC,
          doctrine: s.doctrine, color: s.color, eliminated: s.eliminated,
          isOpen: !s.isNPC && !s.userId, isMe: s.userId === user.id, traits: s.userId === user.id ? s.traits : undefined,
        })),
        tiles: visibleStateFor(game, mySlot),
        combatLog: (game.combatLog || []).slice(-30),
        winnerSlot: game.winnerSlot,
        winnerName: game.winnerSlot !== undefined && game.winnerSlot !== null ? game.factionSlots?.[game.winnerSlot]?.factionName : null,
      });
    }

    // ----- joinGame -----
    if (action === 'joinGame') {
      if (game.status !== 'lobby') return Response.json({ error: 'Game already started' }, { status: 400 });
      if (mySlot !== null) return Response.json({ error: 'Already joined' }, { status: 400 });
      const open = game.factionSlots.find((s) => !s.isNPC && !s.userId);
      if (!open) return Response.json({ error: 'No open slots' }, { status: 400 });
      const faction = await svc.entities.Faction.get(body.factionId);
      if (!faction) return Response.json({ error: 'Faction not found' }, { status: 404 });
      open.userId = user.id;
      open.factionId = faction.id;
      open.factionName = faction.factionName;
      open.doctrine = faction.doctrine;
      open.traits = faction.traits || [];
      open.npcDispositions = faction.npcDispositions || {};
      await svc.entities.Game.update(game.id, { factionSlots: game.factionSlots });
      return Response.json({ ok: true, slotIndex: open.slotIndex });
    }

    // ----- startGame -----
    if (action === 'startGame') {
      if (game.hostUserId !== user.id) return Response.json({ error: 'Only the host can start' }, { status: 403 });
      if (game.status !== 'lobby') return Response.json({ error: 'Game already started' }, { status: 400 });
      if (game.factionSlots.some((s) => !s.isNPC && !s.userId)) return Response.json({ error: 'Waiting for players to join' }, { status: 400 });

      const tiles = game.tiles;
      const land = tiles.filter((t) => !t.isSea);
      let capitals = land.filter((t) => t.isCapital);
      if (capitals.length < game.factionSlots.length) {
        const sorted = [...land].sort((a, b) => (b.baseIncome || 0) - (a.baseIncome || 0));
        for (const t of sorted) {
          if (capitals.length >= game.factionSlots.length) break;
          if (!capitals.includes(t)) { t.isCapital = true; capitals.push(t); }
        }
      }

      const states = {};
      for (const t of tiles) {
        states[t.id] = t.isSea ? { owner: null, units: {} } : { owner: null, units: { riflemen: 1 } };
      }
      game.factionSlots.forEach((slot, i) => {
        const cap = capitals[i];
        slot.capitalTileId = cap.id;
        states[cap.id] = { owner: slot.slotIndex, units: { riflemen: 4, crawler: 2 } };
        for (const aid of cap.adjacentIds) {
          const at = tiles.find((t) => t.id === aid);
          if (at && !at.isSea && !at.isCapital && states[aid].owner === null) {
            states[aid] = { owner: slot.slotIndex, units: { riflemen: 2 } };
          }
        }
        game.treasuries[String(slot.slotIndex)] = 12;
      });

      // Seed NPC dispositions from human faction lifepath dispositions
      for (const npc of game.factionSlots.filter((s) => s.isNPC)) {
        npc.dispositions = {};
        for (const h of game.factionSlots.filter((s) => !s.isNPC)) {
          npc.dispositions[String(h.slotIndex)] = (h.npcDispositions || {})[npc.doctrine] || 0;
        }
      }

      game.status = 'active';
      game.territoryStates = states;
      game.combatLog.push({ turn: 1, type: 'event', text: 'War has been declared. The front ignites.' });
      collectIncome(game, game.turnOrder[0]);

      await svc.entities.Game.update(game.id, {
        status: 'active', tiles: game.tiles, factionSlots: game.factionSlots,
        territoryStates: game.territoryStates, treasuries: game.treasuries, combatLog: game.combatLog,
      });
      return Response.json({ ok: true });
    }

    // ----- In-turn actions: require active game + my turn -----
    const requireMyTurn = () => {
      if (game.status !== 'active') throw new Error('Game is not active');
      const cur = game.turnOrder[game.currentTurnIndex];
      if (game.factionSlots[cur]?.userId !== user.id) throw new Error('Not your turn');
      return cur;
    };

    if (action === 'moveUnits') {
      const slotIdx = requireMyTurn();
      const { fromTileId, toTileId, units } = body;
      const fromSt = game.territoryStates[fromTileId];
      const toSt = game.territoryStates[toTileId];
      const fromTile = game.tiles.find((t) => t.id === fromTileId);
      const toTile = game.tiles.find((t) => t.id === toTileId);
      if (!fromTile || !toTile) return Response.json({ error: 'Invalid tiles' }, { status: 400 });
      if (fromSt.owner !== slotIdx) return Response.json({ error: 'You do not control that territory' }, { status: 400 });
      if (toSt.owner !== slotIdx) return Response.json({ error: 'Destination must be friendly — use Attack for enemy territory' }, { status: 400 });
      if (!fromTile.adjacentIds.includes(toTileId)) return Response.json({ error: 'Territories are not adjacent' }, { status: 400 });
      for (const k of UNIT_KEYS) {
        const n = units[k] || 0;
        if (n <= 0) continue;
        if (n > (fromSt.units[k] || 0)) return Response.json({ error: 'Not enough units' }, { status: 400 });
        const domain = UNITS[k].domain;
        if (domain === 'land' && toTile.isSea) return Response.json({ error: 'Land units cannot enter sea zones' }, { status: 400 });
        if (domain === 'sea' && !toTile.isSea) return Response.json({ error: 'Gunboats cannot move onto land' }, { status: 400 });
      }
      for (const k of UNIT_KEYS) {
        const n = units[k] || 0;
        fromSt.units[k] = (fromSt.units[k] || 0) - n;
        toSt.units[k] = (toSt.units[k] || 0) + n;
      }
      await svc.entities.Game.update(game.id, { territoryStates: game.territoryStates });
      return Response.json({ ok: true });
    }

    if (action === 'purchaseUnits') {
      const slotIdx = requireMyTurn();
      const { tileId, units } = body;
      const st = game.territoryStates[tileId];
      const tile = game.tiles.find((t) => t.id === tileId);
      if (!tile || st.owner !== slotIdx) return Response.json({ error: 'You must place units on your own territory' }, { status: 400 });
      const costs = effectiveCosts(game, slotIdx);
      let total = 0;
      for (const k of UNIT_KEYS) {
        const n = units[k] || 0;
        if (n < 0) return Response.json({ error: 'Invalid quantity' }, { status: 400 });
        if (n > 0) {
          if (UNITS[k].domain === 'sea' && !tile.isSea) return Response.json({ error: 'Gunboats must be placed on an adjacent sea zone' }, { status: 400 });
          if (UNITS[k].domain !== 'sea' && tile.isSea) return Response.json({ error: 'Land units cannot be placed at sea' }, { status: 400 });
          total += n * costs[k];
        }
      }
      // Sea placement: allow if adjacent land tile is owned
      if (tile.isSea) {
        const hasCoast = tile.adjacentIds.some((aid) => game.territoryStates[aid]?.owner === slotIdx);
        if (!hasCoast && st.owner !== slotIdx) return Response.json({ error: 'No friendly coast adjacent to that sea zone' }, { status: 400 });
      }
      const tkey = String(slotIdx);
      if (total > (game.treasuries[tkey] || 0)) return Response.json({ error: 'Insufficient funds' }, { status: 400 });
      game.treasuries[tkey] -= total;
      for (const k of UNIT_KEYS) st.units[k] = (st.units[k] || 0) + (units[k] || 0);
      if (tile.isSea && st.owner === null) st.owner = slotIdx;
      await svc.entities.Game.update(game.id, { territoryStates: game.territoryStates, treasuries: game.treasuries });
      return Response.json({ ok: true, treasury: game.treasuries[tkey] });
    }

    if (action === 'attack') {
      const slotIdx = requireMyTurn();
      const { fromTileId, toTileId, units } = body;
      let outcome;
      try {
        outcome = doAttack(game, slotIdx, fromTileId, toTileId, units);
      } catch (e) {
        return Response.json({ error: e.message }, { status: 400 });
      }
      await svc.entities.Game.update(game.id, {
        territoryStates: game.territoryStates, factionSlots: game.factionSlots,
        combatLog: game.combatLog, status: game.status, winnerSlot: game.winnerSlot,
      });
      return Response.json({ ok: true, outcome });
    }

    if (action === 'endTurn') {
      requireMyTurn();
      checkCampaignWin(game);
      if (game.status === 'active') advanceTurn(game);
      await svc.entities.Game.update(game.id, {
        territoryStates: game.territoryStates, factionSlots: game.factionSlots,
        treasuries: game.treasuries, combatLog: game.combatLog,
        currentTurnIndex: game.currentTurnIndex, turnNumber: game.turnNumber,
        status: game.status, winnerSlot: game.winnerSlot,
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});