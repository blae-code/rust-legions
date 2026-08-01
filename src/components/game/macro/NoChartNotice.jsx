import React from "react";

// Legacy fronts filed before the macro engine carry no chart — say so plainly
// instead of rendering an empty war table.
export default function NoChartNotice() {
  return (
    <div className="cq-panel p-6 text-center">
      <p className="cq-label mb-1">Ministry Tactical Chart</p>
      <p className="font-mono text-[10px] text-muted-foreground tracking-widest">
        NO CHART ON FILE FOR THIS FRONT — IT PREDATES THE SURVEY. DECLARE A NEW WAR TO TAKE THE FIELD.
      </p>
    </div>
  );
}