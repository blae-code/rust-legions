// ---------------------------------------------------------------------------
// Command vehicles — a general is no mere foot officer: each fights from a
// specialized machine suited to their specialty. Mirrors src/lib/commandVehicles.js
// (guarded by test/rules-mirror.test.js). Lifted out of gameEngine/entry.ts to
// keep that file under the platform line limit ahead of the tactical handoff.
// ---------------------------------------------------------------------------
export const COMMAND_VEHICLES = {
  butcher: { key: 'mauler', label: '"Mauler" Assault Crawler', effect: '+10% damage dealt', dmgOut: 1.1 },
  fox: { key: 'vixen', label: '"Vixen" Scout Autocar', effect: '+1 battle skill', skill: 1 },
  bulwark: { key: 'redoubt', label: '"Redoubt" Armored Wagon', effect: '−10% damage taken', dmgIn: 0.9 },
  firebrand: { key: 'clarion', label: '"Clarion" Signal Wagon', effect: '−15% morale damage taken', moraleIn: 0.85 },
};
export const SUPREME_VEHICLE = { key: 'paramount', label: '"Paramount" Command Land-Train', effect: '+1 battle skill · −10% morale damage taken', skill: 1, moraleIn: 0.9 };

// Vehicle refit bays — the equipment bay bolsters the attending army; the weapon
// bay mounts arms themed to the general's vehicle.
export const VEHICLE_MODS = {
  quartermaster_rig: { bay: 'equipment', label: 'Quartermaster Rig', cost: { steel: 3, manpower: 1 }, dmgIn: 0.95, effect: '−5% damage taken' },
  observation_balloon: { bay: 'equipment', label: 'Observation Balloon', cost: { steel: 2, fuel: 2 }, skill: 1, effect: '+1 battle skill' },
  field_hospital: { bay: 'equipment', label: 'Field Hospital Trailer', cost: { manpower: 3, steel: 1 }, moraleIn: 0.9, effect: '−10% morale damage taken' },
  breaker_ram: { bay: 'weapon', trait: 'butcher', label: 'Breaker Ram', cost: { steel: 4, fuel: 1 }, dmgOut: 1.1, effect: '+10% damage dealt' },
  whisper_battery: { bay: 'weapon', trait: 'fox', label: 'Whisper Battery', cost: { steel: 3, fuel: 2 }, skill: 1, effect: '+1 battle skill' },
  bastion_casemate: { bay: 'weapon', trait: 'bulwark', label: 'Bastion Casemate', cost: { steel: 5 }, dmgIn: 0.9, effect: '−10% damage taken' },
  thunder_klaxon: { bay: 'weapon', trait: 'firebrand', label: 'Thunder Klaxon', cost: { steel: 2, fuel: 2, manpower: 1 }, moraleOut: 1.15, effect: '+15% morale damage dealt' },
};

// A general's effective vehicle: the trait chassis plus any bay modifications
export const vehicleOf = (g) => {
  if (!g || !g.id) return null;
  const chassis = g.supreme ? SUPREME_VEHICLE : COMMAND_VEHICLES[g.trait] || null;
  if (!chassis) return null;
  const v = { ...chassis, mods: [] };
  for (const key of Object.values(g.vehicleMods || {})) {
    const m = VEHICLE_MODS[key];
    if (!m) continue;
    v.skill = (v.skill || 0) + (m.skill || 0);
    v.dmgOut = (v.dmgOut || 1) * (m.dmgOut || 1);
    v.dmgIn = (v.dmgIn || 1) * (m.dmgIn || 1);
    v.moraleIn = (v.moraleIn || 1) * (m.moraleIn || 1);
    v.moraleOut = (v.moraleOut || 1) * (m.moraleOut || 1);
    v.mods.push(m.label);
  }
  return v;
};