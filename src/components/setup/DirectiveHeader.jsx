import React from "react";
import { motion } from "framer-motion";

// Stamped directive masthead — serial, dateline, classification band.
export default function DirectiveHeader() {
  const now = new Date();
  const serial = `D-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}`;
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="cq-label text-rust">War Ministry · Standing Directive {serial}</p>
          <div className="relative inline-block">
            <h1 className="cq-display text-4xl sm:text-5xl leading-[0.9]">Open a New Front</h1>
            <motion.span
              className="cq-stamp absolute -right-24 top-1 text-[10px] whitespace-nowrap hidden sm:block"
              initial={{ opacity: 0, scale: 1.6, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: -8 }}
              transition={{ delay: 0.5, duration: 0.25, ease: "easeOut" }}
            >
              Authorized
            </motion.span>
          </div>
        </div>
        <div className="text-right hidden md:block">
          <p className="font-mono text-[9px] text-muted-foreground tracking-[0.25em] leading-relaxed">
            FORM 7-K · REQUISITION OF THEATER<br />
            FILE IN TRIPLICATE · DESTROY THE FOURTH COPY
          </p>
        </div>
      </div>
      <div className="cq-hazard mt-3" />
    </motion.div>
  );
}