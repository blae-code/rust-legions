import React from "react";

// Ambient weather layer over the tactical map — purely visual
export default function WeatherOverlay({ weather }) {
  if (!weather || weather === "clear") return null;
  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden rounded">
      {(weather === "rain" || weather === "storm") && <div className="absolute inset-0 cq-rain" />}
      {weather === "fog" && <div className="absolute inset-0 cq-fogbank" />}
      {weather === "storm" && <div className="absolute inset-0 cq-stormflash bg-white" />}
    </div>
  );
}