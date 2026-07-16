// 3D war-table terrain definitions — colors + extrusion heights per terrain
export const TERRAIN_3D = {
  plains: { color: "#6B6344", h: 0.16 },
  deltas: { color: "#55624A", h: 0.14 },
  forest: { color: "#40503A", h: 0.22 },
  hills: { color: "#6E583C", h: 0.36 },
  highlands: { color: "#645842", h: 0.46 },
  mountains: { color: "#57525A", h: 0.64 },
  marsh: { color: "#485542", h: 0.12 },
  industrial: { color: "#54463C", h: 0.2 },
};
export const NEUTRAL_3D = { color: "#524C44", h: 0.16 };
export const SEA_COLOR = "#16242E";
export const FOG_COLOR = "#17130F";
export const BRASS = "#E0A32E";
export const RES_COLOR_3D = { manpower: "#C9B88A", steel: "#9FA8B5", fuel: "#C79A6B" };
export const RES_SHORT_3D = { manpower: "M", steel: "S", fuel: "F" };
export const BONUS_LABEL = { oil_field: "OIL", coal_depot: "COAL", iron_foundry: "IRON" };

// Axial hex coords -> 3D world position (pointy-top, unit hex radius)
export const pos3 = (q, r) => [Math.sqrt(3) * (q + r / 2), 0, 1.5 * r];