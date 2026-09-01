import React from "react";
import { motion } from "framer-motion";
import { Target, CloudSnow, Compass, Stamp } from "lucide-react";
import { WORLDS } from "@/lib/macro/worlds";
import { WEATHER_META } from "@/lib/weather";

// OPERATION BRIEFING — Ministry of War form B-17. Typed, stamped, and pinned
// to the staging board before the first column moves.
function Field({ label, children }) {
  return (
    <div className="border-t border-dashed border-brass/25 pt-2">
      <p className="cq-label text-[9px] text-brass/80">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export default function BriefingDossier({ game, bare = false }) {
  const world = WORLDS.find((w) => w.id === (game.planetId || "cindara")) || WORLDS[0];
  const weather = WEATHER_META[game.weather || "clear"] || WEATHER_META.clear;

  const nodes = game.macro?.nodes?.length || world.nodes.length;
  const routes = game.macro?.routes || world.routes;
  const lanes = routes.filter((r) => r[3] === "sealane").length;
  const landmasses = (game.macro?.continents || world.continents).length;

  const objective =
    game.mode === "campaign"
      ? game.campaignWinCondition?.description ||
        `Hold ${game.campaignWinCondition?.controlTarget || game.mapControlTarget || 60}% of the charted continent and break every rival's fortress-base.`
      : `Seize and hold ${game.mapControlTarget || 60}% of charted ground, or drive every rival commander from the field.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, rotate: -0.4 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.45 }}
      className={bare ? "relative overflow-hidden rounded-sm p-1" : "cq-slip relative overflow-hidden rounded-sm p-5"}
    >
      {/* Punched filing holes down the margin */}
      <div className="absolute left-2 top-8 bottom-8 w-2 flex flex-col justify-between pointer-events-none">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="w-2 h-2 rounded-full bg-background border border-black/60 shadow-inner" />
        ))}
      </div>

      <div className="pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[9px] text-muted-foreground tracking-[0.3em]">
              MINISTRY OF WAR · FORM B-17 · OPERATION BRIEFING
            </p>
            <h3 className="cq-display text-2xl leading-none mt-1">{game.name}</h3>
            <p className="font-mono text-[9px] text-muted-foreground tracking-widest mt-1">
              THEATER {world.name.toUpperCase()} · {game.mode === "campaign" ? "CAMPAIGN" : "MULTIPLAYER"} ·
              {" "}{game.factions.length} COMMANDER SLOTS
            </p>
          </div>
          <motion.span
            initial={{ scale: 2.2, opacity: 0, rotate: -22 }}
            animate={{ scale: 1, opacity: 1, rotate: -9 }}
            transition={{ type: "spring", stiffness: 420, damping: 20, delay: 0.4 }}
            className="cq-stamp text-[10px] shrink-0"
          >
            Restricted
          </motion.span>
        </div>

        <div className="cq-hazard w-32 my-3" />

        <div className="space-y-3">
          <Field label="I · Terrain Survey">
            <p className="text-sm text-secondary-foreground leading-relaxed">{world.blurb}</p>
            <p className="font-mono text-[10px] text-muted-foreground tracking-widest mt-1.5">
              {nodes} CHARTED SITES · {routes.length} ROUTES · {lanes} CONVOY LANES · {landmasses} LANDMASSES
            </p>
          </Field>

          <Field label="II · Mission Objective">
            <div className="flex gap-2">
              <Target className="w-4 h-4 text-rust shrink-0 mt-0.5" />
              <p className="text-sm text-foreground leading-relaxed">{objective}</p>
            </div>
          </Field>

          <Field label="III · Environmental Modifiers">
            <div className="flex items-center gap-2">
              <CloudSnow className="w-4 h-4 text-steel shrink-0" />
              <p className="font-heading uppercase tracking-[0.15em] text-sm text-brass-bright">
                {weather.icon} {weather.label}
              </p>
            </div>
            <ul className="mt-1.5 space-y-1">
              {weather.effects.length === 0 ? (
                <li className="font-mono text-[10px] text-olive tracking-widest">
                  ▸ NO ADVERSE CONDITIONS EXPECTED AT MUSTER
                </li>
              ) : (
                weather.effects.map((e) => (
                  <li key={e} className="font-mono text-[10px] text-muted-foreground tracking-wide">▸ {e.toUpperCase()}</li>
                ))
              )}
            </ul>
            <p className="font-mono text-[9px] text-rust/90 tracking-widest mt-2">
              ⚠ WEATHER TURNS WITHOUT WARNING ONCE THE FRONT IS LIVE
            </p>
          </Field>

          <Field label="IV · Signature">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Stamp className="w-3.5 h-3.5 text-brass/70" />
              <p className="font-mono text-[9px] tracking-[0.25em]">
                ISSUED BY THE HONOURS DIRECTORATE · DESTROY AFTER READING
              </p>
              <Compass className="w-3.5 h-3.5 ml-auto text-brass/50" />
            </div>
          </Field>
        </div>
      </div>
    </motion.div>
  );
}