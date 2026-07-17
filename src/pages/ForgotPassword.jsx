import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, CheckCircle2 } from "lucide-react";
import AuthScene, { AuthFootLink } from "@/components/auth/AuthScene";
import { AuthField, AuthSubmit } from "@/components/auth/AuthControls";

// Cipher recovery — dispatch a reset link to the commander's channel.
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Always report success — never reveal whether a file exists.
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthScene
      eyebrow="Ministry of War · Cipher Recovery"
      title="Recover Access"
      subtitle="WE WILL DISPATCH A RESET DIRECTIVE TO YOUR CHANNEL"
      footer={
        <span className="font-mono text-[11px] text-muted-foreground tracking-wide">
          <AuthFootLink to="/login">← Back to the terminal</AuthFootLink>
        </span>
      }
    >
      {sent ? (
        <div className="flex flex-col items-center text-center gap-3 py-4">
          <CheckCircle2 className="w-9 h-9 text-emerald-400" />
          <p className="font-heading tracking-wide text-foreground/90">
            If a file exists on that channel, a reset directive is on its way.
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/70 tracking-widest">
            CHECK YOUR INBOX — AND THE SPAM TRENCH
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField
            label="Callsign"
            hint="REGISTERED EMAIL"
            icon={Mail}
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="commander@front.gov"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <AuthSubmit loading={loading} loadingLabel="Dispatching…">
            Dispatch Reset Directive →
          </AuthSubmit>
        </form>
      )}
    </AuthScene>
  );
}
