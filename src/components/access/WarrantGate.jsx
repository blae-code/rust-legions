import React, { useState } from "react";
import { KeyRound, ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AuthScene from "@/components/auth/AuthScene";
import { AuthField, AuthSubmit, AuthError } from "@/components/auth/AuthControls";

// The checkpoint. No warrant, no war room — a code is the only way past.
export default function WarrantGate({ revoked, onGranted }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("enlistmentCodes", { action: "redeem", code });
      if (res.data?.granted) onGranted();
      else setError(res.data?.error || "The warrant was refused.");
    } catch (err) {
      setError(err.response?.data?.error || "The warrant was refused.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScene
      eyebrow="Ministry of War · Warrant Office"
      title={revoked ? "Warrant Rescinded" : "Present Your Warrant"}
      subtitle={
        revoked
          ? "YOUR COMMISSION HAS BEEN WITHDRAWN BY THE HIGH COMMAND"
          : "ENLISTMENT IS BY WARRANT ONLY — ENTER THE CODE YOU WERE ISSUED"
      }
      stamp={revoked ? "Revoked" : "Sealed"}
      footer={
        <span className="font-mono text-[11px] text-muted-foreground tracking-wide">
          No warrant? None are issued on request — the High Command issues them directly.
        </span>
      }
    >
      {revoked && (
        <div className="cq-slip rounded-sm px-3 py-2 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-rust shrink-0 mt-0.5" />
          <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
            A previously redeemed warrant on this file was rescinded. A fresh code must be issued before you
            may rejoin the march.
          </p>
        </div>
      )}

      <AuthError>{error}</AuthError>

      <form onSubmit={submit} className="space-y-4">
        <AuthField
          label="Warrant Code"
          hint="AS ISSUED — RL-XXXX-XXXX"
          icon={KeyRound}
          id="warrant"
          autoFocus
          placeholder="RL-XXXX-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
        />
        <AuthSubmit loading={loading} loadingLabel="Presenting…" disabled={code.trim().length < 4}>
          Redeem Warrant →
        </AuthSubmit>
      </form>
    </AuthScene>
  );
}