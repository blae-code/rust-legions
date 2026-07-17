import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import StormFront25D from "@/components/home/StormFront25D";
import Typewriter from "@/components/home/Typewriter";

// The immersive shell every auth surface (login / register / reset) sits inside.
// It shares the home screen's living war-front backdrop so the very first screen
// a commander sees already reads as the game, never a web form. Pages supply the
// terminal-panel contents; AuthScene owns all the chrome, HUD strips, and motion.

// Left-hand title lockup — constant across every auth page.
function BrandLockup() {
  return (
    <div className="hidden lg:flex flex-col justify-center min-w-0">
      <p className="cq-label text-rust mb-2">The continent burns · A commander is wanted</p>
      <div className="relative inline-block self-start">
        <h1 className="cq-display text-7xl xl:text-8xl leading-[0.85]">
          Rust<br />
          <span className="text-brass-bright">Legions</span>
        </h1>
        <span className="cq-stamp absolute -right-6 top-1 text-xs whitespace-nowrap">Field Terminal</span>
      </div>
      <div className="cq-hazard w-48 mt-5" />
      <p className="font-mono text-[11px] text-foreground/70 tracking-wide mt-5 max-w-sm leading-relaxed">
        <Typewriter
          text="A dieselpunk war for a buried world. Raise your legions, hold the line, and dig for what was left beneath the ash."
          speed={16}
          delay={400}
        />
      </p>
      <div className="flex items-center gap-2 mt-6">
        <span className="w-2 h-2 rounded-full bg-emerald-400 cq-lamp text-emerald-400" />
        <span className="font-mono text-[10px] text-muted-foreground tracking-[0.3em]">SECURE CHANNEL · LINK LIVE</span>
      </div>
    </div>
  );
}

export default function AuthScene({ eyebrow, title, subtitle, children, footer, stamp }) {
  return (
    <div className="relative h-[100dvh] overflow-hidden bg-background">
      <StormFront25D />

      {/* Readability + CRT atmosphere over the living backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/92 via-background/70 to-background/40 pointer-events-none" />
      <div className="absolute inset-0 cq-scanlines opacity-20 pointer-events-none" />
      <div className="absolute inset-0 cq-vignette pointer-events-none" />

      <div className="relative z-10 h-full max-w-[1600px] mx-auto px-4 md:px-10 py-4 flex flex-col">
        {/* Top HUD strip */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-brass font-display text-lg tracking-[0.25em] uppercase">
            <Shield className="w-4 h-4" /> Rust Legions
          </div>
          <p className="font-mono text-[10px] text-muted-foreground tracking-[0.3em] hidden sm:block cq-flicker">
            ⁜ MINISTRY OF WAR · FIELD TERMINAL 7-A ⁜
          </p>
        </div>

        {/* Main deck */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12 items-center py-4 overflow-y-auto">
          <BrandLockup />

          {/* Credentials terminal */}
          <div className="w-full max-w-md justify-self-center lg:justify-self-end">
            {/* Compact title for small screens where the lockup is hidden */}
            <div className="lg:hidden text-center mb-5">
              <h1 className="cq-display text-5xl leading-none">
                Rust <span className="text-brass-bright">Legions</span>
              </h1>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="cq-panel cq-brackets relative overflow-hidden"
            >
              <div className="cq-hazard" />
              {stamp && (
                <span className="cq-stamp absolute right-4 top-8 text-[10px] whitespace-nowrap z-10">{stamp}</span>
              )}
              <div className="p-6 sm:p-8">
                <p className="cq-label text-rust">{eyebrow}</p>
                <h2 className="cq-display text-3xl sm:text-4xl mt-1 leading-none">{title}</h2>
                {subtitle && (
                  <p className="font-mono text-[10px] text-muted-foreground tracking-widest mt-2.5 leading-relaxed">
                    {subtitle}
                  </p>
                )}

                <div className="mt-6">{children}</div>
              </div>

              {footer && (
                <div className="border-t border-border/50 bg-background/30 px-6 sm:px-8 py-4 text-center">
                  {footer}
                </div>
              )}
            </motion.div>

            <p className="font-mono text-[8px] text-muted-foreground/50 tracking-[0.3em] text-center mt-4 leading-relaxed">
              DOCUMENT CLASS: RESTRICTED · ALL TRANSMISSIONS MONITORED
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shared footer link — small brass action used at the base of the terminal panel.
export function AuthFootLink({ to, children }) {
  return (
    <Link
      to={to}
      className="font-heading uppercase tracking-[0.15em] text-xs text-brass hover:text-brass-bright transition-colors"
    >
      {children}
    </Link>
  );
}
