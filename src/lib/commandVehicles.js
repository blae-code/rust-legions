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

// Vehicle refit bays — mirrors VEHICLE_MODS in the gameEngine backend.
// Equipment bolsters the attending army; weapons are themed to the general's vehicle.
export const VEHICLE_MODS = {
  quartermaster_rig: { bay: "equipment", label: "Quartermaster Rig", cost: { steel: 3, manpower: 1 }, effect: "−5% damage taken" },
  observation_balloon: { bay: "equipment", label: "Observation Balloon", cost: { steel: 2, fuel: 2 }, effect: "+1 battle skill" },
  field_hospital: { bay: "equipment", label: "Field Hospital Trailer", cost: { manpower: 3, steel: 1 }, effect: "−10% morale damage taken" },
  breaker_ram: { bay: "weapon", trait: "butcher", label: "Breaker Ram", cost: { steel: 4, fuel: 1 }, effect: "+10% damage dealt" },
  whisper_battery: { bay: "weapon", trait: "fox", label: "Whisper Battery", cost: { steel: 3, fuel: 2 }, effect: "+1 battle skill" },
  bastion_casemate: { bay: "weapon", trait: "bulwark", label: "Bastion Casemate", cost: { steel: 5 }, effect: "−10% damage taken" },
  thunder_klaxon: { bay: "weapon", trait: "firebrand", label: "Thunder Klaxon", cost: { steel: 2, fuel: 2, manpower: 1 }, effect: "+15% morale damage dealt" },
};

// Supply-route refits arrive next turn but run 25% cheaper
export const convoyCost = (cost = {}) =>
  Object.fromEntries(Object.entries(cost).map(([k, v]) => [k, Math.ceil(v * 0.75)]));

export function getCommandVehicle(general) {
  if (!general) return null;
  if (general.supreme) return SUPREME_VEHICLE;
  return COMMAND_VEHICLES[general.trait] || null;
}