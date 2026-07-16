import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Swords, Flag } from "lucide-react";
import Typewriter from "@/components/home/Typewriter";

const HERO_IMG = "https://media.base44.com/images/public/6a58196dcd485ecc774cae1b/3b5791ea2_generated_image.png";

export default function HeroSection({ firstName }) {
  return (
    <div className="relative -mx-4 -mt-6 overflow-hidden border-b border-border">
      <motion.img
        src={HERO_IMG}
        alt="Crawlers advancing at dawn"
        className="w-full h-[420px] sm:h-[520px] object-cover"
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 8, ease: "easeOut" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/20" />
      <div className="absolute inset-0 cq-smoke" />
      <div className="absolute inset-0 cq-scanlines opacity-40" />
      <div className="absolute inset-0 cq-vignette" />

      {/* Corner coordinates — war map dressing */}
      <div className="absolute top-4 left-4 font-mono text-[10px] text-brass/70 tracking-widest cq-flicker">
        GRID 47°N · SECTOR IX
      </div>
      <div className="absolute top-4 right-4 font-mono text-[10px] text-brass/70 tracking-widest hidden sm:block">
        <Typewriter text="SIGNAL: ENCRYPTED ▮▮▮  //  DECODING TRANSMISSION..." delay={1200} speed={45} />
      </div>
      <motion.div
        className="cq-stamp absolute top-10 right-6 text-lg hidden md:block"
        initial={{ opacity: 0, scale: 2.2, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: -8 }}
        transition={{ delay: 1.4, duration: 0.25, ease: "easeIn" }}
      >
        Classified
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 max-w-7xl mx-auto">
        <motion.p
          className="cq-label text-brass-bright mb-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          ⁜ Priority Dispatch — The Front Awaits
        </motion.p>
        <motion.h1
          className="cq-display text-6xl sm:text-8xl leading-[0.9]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
        >
          Rust<br />Legions
        </motion.h1>
        <motion.p
          className="text-sm sm:text-base text-secondary-foreground font-heading tracking-wide mt-3 max-w-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.7 }}
        >
          Command your faction through fog and fire. Seize territory, requisition armor,
          and break the enemy line{firstName ? `, Commander ${firstName}` : ""}.
        </motion.p>
        <motion.div
          className="flex flex-wrap gap-3 mt-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <Link to="/new-game">
            <Button size="lg" className="bg-rust hover:bg-destructive text-destructive-foreground font-heading uppercase tracking-[0.25em] shadow-lg shadow-rust/20">
              <Swords className="w-4 h-4 mr-2" /> Open a Front
            </Button>
          </Link>
          <Link to="/faction-builder">
            <Button size="lg" variant="outline" className="border-brass/60 text-brass-bright hover:bg-brass/10 font-heading uppercase tracking-[0.25em] backdrop-blur-sm">
              <Flag className="w-4 h-4 mr-2" /> Forge a Faction
            </Button>
          </Link>
        </motion.div>
      </div>
      <div className="cq-hazard absolute bottom-0 left-0 right-0" />
    </div>
  );
}