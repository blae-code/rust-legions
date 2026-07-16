import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Map, Users, ArrowRight } from "lucide-react";

export default function FeaturedMaps({ maps }) {
  if (!maps || maps.length === 0) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {maps.map((m, i) => {
        const landZones = (m.tiles || []).filter((t) => !t.isSea).length;
        return (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
          >
            <Link to="/new-game" className="cq-panel cq-brackets group block p-5 hover:border-brass/50 transition-colors relative overflow-hidden">
              <Map className="absolute -bottom-4 -right-4 w-24 h-24 text-brass/5 group-hover:text-brass/10 transition-colors" />
              <p className="cq-label text-brass mb-1">Theater Dossier</p>
              <h3 className="font-heading font-semibold text-lg uppercase tracking-wide text-foreground">{m.name}</h3>
              {m.loreBlurb && <p className="text-xs text-muted-foreground leading-relaxed mt-1.5 line-clamp-2">{m.loreBlurb}</p>}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <span className="font-mono text-[10px] text-muted-foreground tracking-widest flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> {m.recommendedPlayerCount}P · {landZones} ZONES
                </span>
                <span className="text-brass-bright text-xs font-heading uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Deploy <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}