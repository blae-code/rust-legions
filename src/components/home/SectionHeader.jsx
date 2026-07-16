import React from "react";

export default function SectionHeader({ icon: Icon, kicker, title }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-4 h-4 text-brass shrink-0" />}
        <p className="cq-label text-brass">{kicker}</p>
        <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      </div>
      <h2 className="cq-display text-3xl sm:text-4xl mt-1">{title}</h2>
    </div>
  );
}