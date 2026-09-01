import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// The Warrant Office. Codes are the only way onto the roll:
// - status  : does the calling commander hold a valid, unrevoked warrant?
// - redeem  : bind an open warrant to the caller (service role — users cannot write codes)
// - list/issue/revoke/restore/remove : admin only
function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no look-alikes
  const block = (n) => Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `RL-${block(4)}-${block(4)}`;
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action;
    const svc = base44.asServiceRole.entities.EnlistmentCode;
    const isAdmin = user.role === 'admin';

    // ---- Any authenticated commander ----
    if (action === 'status') {
      const held = await svc.filter({ redeemedByUserId: user.id });
      const valid = held.find((c) => c.status === 'redeemed');
      return Response.json({
        granted: isAdmin || !!valid,
        isAdmin,
        revoked: !valid && held.some((c) => c.status === 'revoked'),
        code: valid?.code || null,
      });
    }

    if (action === 'redeem') {
      const code = String(body.code || '').trim().toUpperCase();
      if (!code) return Response.json({ error: 'No warrant code given' }, { status: 400 });

      const existing = await svc.filter({ redeemedByUserId: user.id });
      if (existing.some((c) => c.status === 'redeemed')) return Response.json({ granted: true });

      const matches = await svc.filter({ code });
      const warrant = matches[0];
      if (!warrant) return Response.json({ error: 'No such warrant is on file' }, { status: 400 });
      if (warrant.status === 'revoked') return Response.json({ error: 'This warrant has been revoked' }, { status: 403 });
      if (warrant.status === 'redeemed') return Response.json({ error: 'This warrant has already been redeemed' }, { status: 409 });

      await svc.update(warrant.id, {
        status: 'redeemed',
        redeemedByUserId: user.id,
        redeemedAt: new Date().toISOString(),
      });
      return Response.json({ granted: true });
    }

    // ---- Warrant Office (admin only) ----
    if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });

    if (action === 'list') {
      const codes = await svc.list('-created_date', 500);
      return Response.json({ codes });
    }

    if (action === 'issue') {
      const count = Math.min(Math.max(parseInt(body.count, 10) || 1, 1), 25);
      const rows = Array.from({ length: count }, () => ({
        code: makeCode(),
        label: body.label || '',
        note: body.note || '',
        status: 'open',
      }));
      const created = await svc.bulkCreate(rows);
      return Response.json({ created });
    }

    if (action === 'revoke') {
      await svc.update(body.id, { status: 'revoked' });
      return Response.json({ ok: true });
    }

    if (action === 'restore') {
      const matches = await svc.filter({ id: body.id });
      const warrant = matches[0];
      if (!warrant) return Response.json({ error: 'No such warrant' }, { status: 404 });
      // A warrant already bound to a commander returns to their hands; an unused one reopens.
      await svc.update(body.id, { status: warrant.redeemedByUserId ? 'redeemed' : 'open' });
      return Response.json({ ok: true });
    }

    if (action === 'remove') {
      await svc.delete(body.id);
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}