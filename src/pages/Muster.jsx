import React, { useState } from "react";
import { KeyRound, ShieldAlert, UserRound } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AuthScene from "@/components/auth/AuthScene";
import { AuthField, AuthSubmit, AuthError } from "@/components/auth/AuthControls";
import { setWarrant } from "@/lib/warrant";

// The muster point — a commander is enrolled by warrant code and callsign alone.
// No email, no password, no personal particulars are ever asked for or kept.
export default function Muster({ revoked, onMustered }) {
  const [code, setCode] = useState("");
  const [callsign, setCallsign] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("enlistmentCodes", { action: "muster", code, callsign });
      if (res.data?.granted) {
        setWarrant({ warrantId: res.data.warrantId, code: res.data.code, callsign: res.data.callsign });
        onMustered();
      } else {
        setError(res.data?.error || "The warrant was refused.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "The warrant was refused.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScene
      eyebrow="Ministry of War · Muster Point"
      title={revoked ? "Warrant Rescinded" : "Sign the Muster Roll"}
      subtitle={
        revoked
          ? "YOUR COMMISSION HAS BEEN WITHDRAWN BY THE HIGH COMMAND"
          : "PRESENT YOUR WARRANT AND GIVE THE NAME YOU WILL BE KNOWN BY"
      }
      stamp={revoked ? "Revoked" : "Sealed"}
      footer={
        <span className="font-mono text-[11px] text-muted-foreground tracking-wide">
          The Ministry keeps no names but the one you choose — no address, no particulars, no file.
        </span>
      }
    >
      {revoked && (
        <div className="cq-slip rounded-sm px-3 py-2 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-rust shrink-0 mt-0.5" />
          <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
            The warrant held on this terminal was rescinded. A fresh code must be issued before you may
            rejoin the march.
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
        <AuthField
          label="Callsign"
          hint="HOW THE WIRE WILL ADDRESS YOU — NOT YOUR REAL NAME"
          icon={UserRound}
          id="callsign"
          placeholder="IRONHOLD"
          value={callsign}
          onChange={(e) => setCallsign(e.target.value.slice(0, 24))}
          required
        />
        <AuthSubmit
          loading={loading}
          loadingLabel="Signing the roll…"
          disabled={code.trim().length < 4 || callsign.trim().length < 2}
        >
          Sign On →
        </AuthSubmit>
      </form>

      <p className="font-mono text-[9px] text-muted-foreground/60 tracking-[0.2em] leading-relaxed pt-1">
        WARRANT NO. AND CALLSIGN ONLY · NO CORRESPONDENCE ADDRESS ON FILE
      </p>
    </AuthScene>
  );
}