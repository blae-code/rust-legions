// Command vehicles — mirrors COMMAND_VEHICLES in the gameEngine backend.
// Generals aren't foot officers: each fights from a machine suited to their specialty.
export const COMMAND_VEHICLES = {
  butcher: { label: '"Mauler" Assault Crawler', icon: "🛠", effect: "+10% damage dealt", desc: "A ram-prowed breaching crawler — the Butcher leads every push from its cupola." },
  fox: { label: '"Vixen" Scout Autocar', icon: "🔭", effect: "+1 battle skill", desc: "A fast, low-slung autocar bristling with periscopes — the Old Fox reads the field first." },
  bulwark: { label: '"Redoubt" Armored Wagon', icon: "⛨", effect: "−10% damage taken", desc: "A rolling casemate of riveted plate — the Bulwark's lines hold behind its bulk." },
  firebrand: { label: '"Clarion" Signal Wagon', icon: "📯", effect: "−15% morale damage taken", desc: "A klaxon-crowned signal wagon — the Firebrand's voice carries over any barrage." },
};

export const SUPREME_VEHICLE = {
  label: '"Paramount" Command Land-Train',
  icon: "🚂",
  effect: "+1 battle skill · −10% morale damage taken",
  desc: "The marshal's armored land-train — a mobile general staff, map room and rallying standard in one.",
};

export function getCommandVehicle(general) {
  if (!general) return null;
  if (general.supreme) return SUPREME_VEHICLE;
  return COMMAND_VEHICLES[general.trait] || null;
}