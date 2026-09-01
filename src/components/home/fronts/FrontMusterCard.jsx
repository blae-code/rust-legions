import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe2, UserRound, Map as MapIcon, LogIn } from "lucide-react";
import { WORLDS } from "@/lib/macro/worlds";
import { WEATHER_META } from "@/lib/weather";
import { playSfx } from "@/lib/sfx";
import SeatPips from "@/components/home/fronts/SeatPips";
import CommandTip from "@/components/ui/CommandTip";

// A single mustering front, stamped as a recruiting-board notice with quick launch.
export default function FrontMusterCard({ front, index }) {
  const world = WORLDS.find((w) => w.id === front.planetId);
  const weather = WEATHER_META[front.weather] || WEATHER_META.clear;
  const filled = front.claimedSlots + front.npcSlots;
  const strength = front.playerCount > 0 ? filled / front.playerCount : 0;
  const nearlyFull = front.openSlots === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
    >
      <Link
        to={`/game/${front.id}`}
        onMouseEnter={() => playSfx("hover")}
        onClick={() => playSfx("select")}
        className={`cq-metal group relative block rounded-sm border px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(0,0,0,0.55)] ${
          nearlyFull ? "border-rust/60 bg-rust/5" : "border-border bg-card/70 hover:border-brass/60"
        }`}
        style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
      >
        <div className="flex items-start gap-2">
          <span className={`self-stretch w-1 rounded-full shrink-0 ${nearlyFull ? "bg-rust cq-lamp text-rust" : "bg-border group-hover:bg-brass/70"} transition-colors`} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-heading uppercase tracking-[0.15em] text-sm text-foreground/90 truncate group-hover:text-brass-bright transition-colors">
                {front.name}
              </p>
              {nearlyFull && <span className="cq-tag border-rust/60 text-rust shrink-0">Last Seat</span>}
            </div>

            {/* Field particulars */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 font-mono text-[9px] text-muted-foreground tracking-widest">
              <span className="flex items-center gap-1">
                <Globe2 className="w-2.5 h-2.5 text-brass/60" />
                {(world?.name || front.planetId).toUpperCase()}
              </span>
              {front.mapName && (
                <span className="flex items-center gap-1 truncate max-w-[140px]">
                  <MapIcon className="w-2.5 h-2.5 text-brass/60" /> {front.mapName.toUpperCase()}
                </span>
              )}
              <span title={weather.label}>{weather.icon} {weather.label.toUpperCase()}</span>
              {front.hostCallsign && (
                <span className="flex items-center gap-1">
                  <UserRound className="w-2.5 h-2.5 text-brass/60" /> HOST {front.hostCallsign.toUpperCase()}
                </span>
              )}
            </div>

            {/* Muster strength gauge + seat board */}
            <div className="flex items-center gap-2 mt-2">
              <SeatPips seats={front.seats || []} />
              <div className="flex-1 h-1.5 rounded-sm bg-background/70 border border-border/60 overflow-hidden min-w-[40px]">
                <motion.div
                  className="h-full"
                  style={{
                    background: "linear-gradient(90deg, hsl(var(--brass) / 0.5), hsl(var(--brass)))",
                    boxShadow: "0 0 5px hsl(var(--brass) / 0.5)",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(6, strength * 100)}%` }}
                  transition={{ duration: 0.8, delay: 0.15 + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <span className="font-mono text-[9px] text-muted-foreground shrink-0">
                {filled}/{front.playerCount}
              </span>
            </div>
          </div>

          {/* Quick launch */}
          <CommandTip title="Report In" body="Take a chair at this table and pick your banner in the lobby." side="left">
            <span className="cq-metal shrink-0 flex items-center gap-1 rounded-sm border border-brass/50 bg-brass/10 px-2 py-1 font-heading uppercase tracking-[0.15em] text-[10px] text-brass-bright group-hover:bg-brass/20 transition-colors">
              <LogIn className="w-3 h-3" /> {front.openSlots} Open
            </span>
          </CommandTip>
        </div>
      </Link>
    </motion.div>
  );
}