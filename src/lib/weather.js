export const WEATHER_META = {
  clear: { icon: "☀", label: "Clear Skies", effects: [] },
  rain: {
    icon: "🌧",
    label: "Driving Rain",
    effects: [
      "Attackers −1 to hit",
      "Artillery barrages less accurate",
      "Mountains, highlands & marsh impassable",
    ],
  },
  fog: {
    icon: "🌫",
    label: "Heavy Fog",
    effects: [
      "Defenders −1 — attackers strike unseen",
      "Recon probes bring back half the intel",
    ],
  },
  storm: {
    icon: "⛈",
    label: "Thunderstorm",
    effects: ["Aircraft & gunboats grounded — no moves or attacks"],
  },
};