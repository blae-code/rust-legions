import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link2, Check, MapPin, Users, GitBranch, Globe2, Swords } from "lucide-react";
import MinistryChart from "@/components/chart/MinistryChart";
import MapRatingPanel from "@/components/maps/MapRatingPanel";
import StarRating from "@/components/maps/StarRating";
import SurveyStat from "@/components/maps/SurveyStat";
import { playSfx } from "@/lib/sfx";

// The survey dossier for one chart — plate, figures, and the assessment desk.
export default function ChartDossier({ map, world, planet, author, rating, ratings, onRatingsChange }) {
  const [copied, setCopied] = useState(false);

  const share = () => {
    navigator.clipboard.writeText(`${window.location.origin}/maps?mapId=${map.id}`);
    playSfx("select");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <motion.div key={map.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="cq-slip rounded-sm">
      <div className="cq-hazard opacity-70" />
      <div className="p-4 space-y-3">
        {/* File head */}
        <div className="flex justify-between items-start gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="cq-label text-brass/80">Survey Dossier</p>
            <h2 className="cq-display text-2xl leading-tight truncate">{map.name}</h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {author && <p className="font-mono text-[9px] text-brass/80 tracking-widest">CHARTED BY {author.toUpperCase()}</p>}
              {rating.count > 0 && (
                <span className="flex items-center gap-1">
                  <StarRating value={Math.round(rating.avg)} size="w-3 h-3" />
                  <span className="font-mono text-[9px] text-muted-foreground">{rating.avg.toFixed(1)} · {rating.count} ASSESSED</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={share} className="text-xs">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />} {copied ? "Copied" : "Share"}
            </Button>
            <Link to={`/new-game?mapId=${map.id}`} onClick={() => playSfx("select")}>
              <Button size="sm" variant="destructive" className="text-xs"><Swords className="w-3.5 h-3.5" /> Fight Here</Button>
            </Link>
          </div>
        </div>

        {map.description && (
          <p className="text-xs text-secondary-foreground leading-relaxed border-l-2 border-brass/40 pl-2.5">{map.description}</p>
        )}

        {/* Survey figures */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <SurveyStat icon={MapPin} label="Settlements" value={(map.nodes || []).length} />
          <SurveyStat icon={GitBranch} label="Supply Routes" value={(map.routes || []).length} />
          <SurveyStat icon={Users} label="Commanders" value={map.recommendedPlayerCount || 2} />
          <SurveyStat icon={Globe2} label="World" value={planet} />
        </div>

        <MinistryChart world={world} height="44vh" />

        <MapRatingPanel map={map} ratings={ratings} onRatingsChange={onRatingsChange} />

        <p className="font-mono text-[8px] text-muted-foreground/60 tracking-[0.2em] pt-1">
          SURVEY FILED {new Date(map.created_date).toLocaleDateString()} · ASSESSMENTS ARE PERMANENT RECORD
        </p>
      </div>
    </motion.div>
  );
}