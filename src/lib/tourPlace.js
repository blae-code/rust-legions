// Where a briefing card sits relative to the surface it describes.
// Prefer under the spotlight, then over it, then alongside it — always centred
// on the target so the card reads as a label for that box, never floating off
// at the far edge of a wide panel. Everything is clamped inside the viewport.
const M = 14; // clearance between the card and the spotlight
const EDGE = 12; // never closer than this to the window edge

const clamp = (v, lo, hi) => Math.max(lo, Math.min(v, hi));

export default function placeCard(spot, card, win) {
  const maxLeft = Math.max(win.w - card.w - EDGE, EDGE);
  const maxTop = Math.max(win.h - card.h - EDGE, EDGE);
  const centreX = clamp(spot.left + spot.width / 2 - card.w / 2, EDGE, maxLeft);
  const centreY = clamp(spot.top + spot.height / 2 - card.h / 2, EDGE, maxTop);

  // Under, then over — the natural reading order for a callout
  if (spot.top + spot.height + M + card.h + EDGE <= win.h)
    return { top: spot.top + spot.height + M, left: centreX, side: "below" };
  if (spot.top - M - card.h >= EDGE)
    return { top: spot.top - M - card.h, left: centreX, side: "above" };

  // A tall surface (the chart) gets the card alongside it instead
  if (spot.left + spot.width + M + card.w + EDGE <= win.w)
    return { top: centreY, left: spot.left + spot.width + M, side: "right" };
  if (spot.left - M - card.w >= EDGE)
    return { top: centreY, left: spot.left - M - card.w, side: "left" };

  // Nothing clears the box — sit inside its lower edge rather than off-screen
  return { top: clamp(spot.top + spot.height - card.h - M, EDGE, maxTop), left: centreX, side: "inside" };
}