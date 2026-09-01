import React from "react";
import { motion } from "framer-motion";
import { MapPin, Users } from "lucide-react";
import StarRating from "@/components/maps/StarRating";
import { playSfx } from "@/lib/sfx";

// One chart in the index drawer — a tabbed survey card.
export default function ChartIndexCard({ map, planet, author, rating, selected, index, onSelect }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.25 }}
      onClick={() => { playSfx("select"); onSelect(map.id); }}
      className={`cq-metal relative w-full text-left border rounded-sm p-3 pl-4 transition-colors ${
        selected ? "border-brass bg-brass/10" : "border-border bg-card hover:border-steel"
      }`}
    >
      {/* Drawer tab spine */}
      <span className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-sm ${selected ? "bg-brass" : "bg-border"}`} />

      <div className="flex items-start justify-between gap-2">
        <p className={`font-heading font-semibold tracking-wide text-sm truncate ${selected ? "text-brass-bright" : "text-foreground"}`}>
          {map.name}
        </p>
        {rating.count > 0 && (
          <span className="flex items-center gap-1 shrink-0">
            <StarRating value={Math.round(rating.avg)} size="w-3 h-3" />
            <span className="font-mono text-[9px] text-muted-foreground">({rating.count})</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5 mt-1 font-mono text-[9px] text-muted-foreground tracking-wider">
        <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{(map.nodes || []).length}</span>
        <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />{map.recommendedPlayerCount || 2}</span>
        <span className="truncate">{planet}</span>
      </div>

      {author && (
        <p className="font-mono text-[9px] text-brass/80 tracking-widest mt-1">CHARTED BY {author.toUpperCase()}</p>
      )}
      {map.description && <p className="text-[11px] text-muted-foreground/70 mt-1 line-clamp-2 leading-snug">{map.description}</p>}
    </motion.button>
  );
}