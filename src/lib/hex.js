export const HEX_SIZE = 34;

export const NEIGHBOR_DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

export const axialToPixel = (q, r, s = HEX_SIZE) => ({
  x: s * Math.sqrt(3) * (q + r / 2),
  y: s * 1.5 * r,
});

export const hexPoints = (cx, cy, s = HEX_SIZE) =>
  Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + s * Math.cos(a)).toFixed(1)},${(cy + s * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

export const keyOf = (q, r) => `${q},${r}`;

export const hexDistance = (a, b) =>
  (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2;