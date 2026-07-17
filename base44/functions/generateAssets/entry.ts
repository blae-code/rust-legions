import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// ============================================================
// generateAssets — batch image generation for the Asset Registry.
// Admin-only. Takes a small batch of { key, prompt } plates and mints
// each via the Base44 image integration, returning { key, url } results.
//
// The frontend (Asset Registry → Directorate generator) builds the
// pending list from src/lib/imageLibrary.js, prepends HOUSE_STYLE, and
// posts it here in chunks. Generated URLs are pasted back into
// src/lib/imagePlates.js (PLATE_URLS) — the repo's delivery convention.
//
// Batches are capped server-side so a single invocation stays well under
// the function execution-time limit; the client loops over chunks.
// ============================================================

const MAX_BATCH = 8;

// Pull a URL out of whatever shape the image integration returns.
const extractUrl = (r) =>
  r?.url || r?.image_url || r?.imageUrl || r?.data?.url || r?.result?.url || null;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden — the Illustration Directorate is admin-only' }, { status: 403 });
    }

    const body = await req.json();
    const style = typeof body?.style === 'string' ? body.style.trim() : '';
    const items = Array.isArray(body?.items) ? body.items : null;
    if (!items || items.length === 0) {
      return Response.json({ error: 'items[] (each { key, prompt }) is required' }, { status: 400 });
    }
    if (items.length > MAX_BATCH) {
      return Response.json(
        { error: `Batch too large: ${items.length} > ${MAX_BATCH}. Send smaller chunks.` },
        { status: 400 },
      );
    }

    const results = [];
    // Sequential on purpose — image generation is heavy; parallel calls risk
    // rate limits and blowing the function time budget on a big batch.
    for (const item of items) {
      const key = item?.key;
      const brief = typeof item?.prompt === 'string' ? item.prompt.trim() : '';
      if (!key || !brief) {
        results.push({ key: key || null, ok: false, error: 'missing key or prompt' });
        continue;
      }
      const prompt = style ? `${style}. ${brief}` : brief;
      try {
        const res = await base44.integrations.Core.GenerateImage({ prompt });
        const url = extractUrl(res);
        if (url) results.push({ key, ok: true, url });
        else results.push({ key, ok: false, error: 'no url in generation result' });
      } catch (err) {
        results.push({ key, ok: false, error: err?.message || String(err) });
      }
    }

    const delivered = results.filter((r) => r.ok).length;
    return Response.json({ results, delivered, failed: results.length - delivered });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
