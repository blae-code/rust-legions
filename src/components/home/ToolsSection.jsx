import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Map, PenTool, Shield, Compass, ChevronRight } from "lucide-react";

const WAR_ROOM_IMG = "https://media.base44.com/images/public/6a58196dcd485ecc774cae1b/0b44e3267_generated_image.png";

const TOOLS = [
  { to: "/maps", icon: Map, title: "Map Library", desc: "Survey every registered theater of war — browse and preview published fronts." },
  { to: "/map-editor", icon: PenTool, title: "Cartography Bureau", desc: "Draft new battlegrounds tile by tile and commit them to the archive." },
  { to: "/army-designer", icon: Shield, title: "Army Design Bureau", desc: "Draft doctrine patterns — formation, weapons, armor and support — for your field armies." },
  { to: "/roadmap", icon: Compass, title: "Forward Doctrine", desc: "The Ministry's line of advance — the mobile-base redesign and the coming Air and Sea theaters." },
];

export default function ToolsSection() {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {TOOLS.map((t, i) => (
        <motion.div
          key={t.to}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, duration: 0.45 }}
        >
          <Link to={t.to} className="relative block overflow-hidden rounded border border-border group h-40">
            <img src={WAR_ROOM_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:opacity-50 group-hover:scale-105 transition-all duration-700" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
            <div className="relative p-5 h-full flex flex-col justify-end">
              <t.icon className="w-5 h-5 text-brass mb-2" />
              <h3 className="font-heading font-semibold text-lg tracking-wide text-foreground group-hover:text-brass-bright transition-colors">{t.title}</h3>
              <p className="text-xs text-muted-foreground max-w-xs">{t.desc}</p>
              <ChevronRight className="absolute right-4 bottom-5 w-4 h-4 text-brass/60 group-hover:translate-x-1 group-hover:text-brass-bright transition-all" />
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}