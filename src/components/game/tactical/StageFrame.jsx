import React from "react";
import { motion } from "framer-motion";

// Full-screen war-table overlay shared by every engagement stage
export default function StageFrame({ children, wide = false, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.94, y: 22, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 26 }}
        className={`cq-panel cq-brackets relative w-full ${wide ? "max-w-[1400px]" : "max-w-2xl"} max-h-[94vh] overflow-y-auto p-4 sm:p-5 ${className}`}
      >
        <div className="cq-hazard absolute top-0 left-0 right-0" />
        <div className="absolute inset-0 cq-scanlines opacity-10 pointer-events-none" />
        <div className="relative">{children}</div>
      </motion.div>
    </motion.div>
  );
}