import React, { useState } from "react";
import { FileSpreadsheet, Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { playSfx } from "@/lib/sfx";

// Files the whole war with the War Record spreadsheet: the result row, the
// commanders' summary, and every field report for balance review.
export default function SheetExportButton({ gameId }) {
  const [state, setState] = useState("idle"); // idle | working | done | error
  const [error, setError] = useState("");
  const [rows, setRows] = useState(0);

  const send = async () => {
    playSfx("select");
    setState("working");
    setError("");
    try {
      await base44.functions.invoke("logGameToSheet", { gameId });
      await base44.functions.invoke("logCampaignSummary", { gameId });
      const res = await base44.functions.invoke("exportMatchLog", { gameId });
      setRows(res.data?.rows || 0);
      setState("done");
    } catch (e) {
      setError(e.response?.data?.error || "The registry refused the filing");
      setState("error");
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <Button
        size="sm"
        variant="outline"
        disabled={state === "working"}
        onClick={send}
        className="border-brass/50 text-brass-bright"
      >
        {state === "working" ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : state === "done" ? <Check className="w-3.5 h-3.5" />
          : <FileSpreadsheet className="w-3.5 h-3.5" />}
        {state === "done" ? "Filed to the Registry" : "File to War Record"}
      </Button>
      {state === "done" && (
        <p className="font-mono text-[9px] text-olive tracking-widest">
          RESULT, SUMMARY AND {rows} FIELD REPORT{rows === 1 ? "" : "S"} LODGED
        </p>
      )}
      {state === "error" && <p className="font-mono text-[9px] text-rust tracking-widest">✕ {error.toUpperCase()}</p>}
    </div>
  );
}