import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import LoreTransmission from "@/components/induction/LoreTransmission";
import CommissionPapers from "@/components/induction/CommissionPapers";
import CommissionSeal from "@/components/induction/CommissionSeal";

// One-time first-login ceremony: transmission → commission papers → ministry seal
export default function InductionExperience({ user, onComplete }) {
  const [stage, setStage] = useState("transmission");
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);

  const commission = async (name) => {
    setSaving(true);
    const p = await base44.entities.UserProfile.create({ displayName: name });
    setProfile(p);
    setSaving(false);
    setStage("seal");
  };

  return (
    <div className="fixed inset-0 z-[70] bg-background overflow-hidden">
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 120%, hsl(8 55% 42% / 0.14), transparent 60%), radial-gradient(ellipse at 50% -20%, hsl(38 65% 48% / 0.10), transparent 55%)" }} />
      <div className="absolute inset-0 cq-scanlines opacity-30 pointer-events-none" />
      <div className="absolute inset-0 cq-vignette pointer-events-none" />
      <div className="relative h-full flex items-center justify-center p-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {stage === "transmission" && (
            <motion.div key="t" exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-xl">
              <LoreTransmission onDone={() => setStage("papers")} />
            </motion.div>
          )}
          {stage === "papers" && (
            <motion.div key="p" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-xl">
              <CommissionPapers defaultName={user.full_name || ""} saving={saving} onSign={commission} />
            </motion.div>
          )}
          {stage === "seal" && (
            <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-xl">
              <CommissionSeal name={profile?.displayName} onDone={() => onComplete(profile)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}