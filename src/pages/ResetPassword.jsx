import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Lock } from "lucide-react";
import AuthScene, { AuthFootLink } from "@/components/auth/AuthScene";
import { AuthField, AuthSubmit, AuthError } from "@/components/auth/AuthControls";

// Set a new cipher from an emailed reset directive.
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Ciphers do not match.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "The reset directive was refused.");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthScene
        eyebrow="Ministry of War · Cipher Recovery"
        title="Directive Void"
        subtitle="THIS RESET DIRECTIVE IS MISSING OR EXPIRED"
        stamp="Rejected"
        footer={
          <span className="font-mono text-[11px] text-muted-foreground tracking-wide">
            <AuthFootLink to="/forgot-password">Request a fresh directive →</AuthFootLink>
          </span>
        }
      >
        <p className="font-mono text-[11px] text-muted-foreground tracking-wide leading-relaxed text-center py-2">
          The directive you presented is incomplete. Request a new reset from the recovery desk.
        </p>
      </AuthScene>
    );
  }

  return (
    <AuthScene
      eyebrow="Ministry of War · Cipher Recovery"
      title="Set a New Cipher"
      subtitle="CHOOSE THE ACCESS CIPHER YOU WILL CARRY INTO THE FIELD"
      footer={
        <span className="font-mono text-[11px] text-muted-foreground tracking-wide">
          <AuthFootLink to="/login">← Back to the terminal</AuthFootLink>
        </span>
      }
    >
      <AuthError>{error}</AuthError>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="New Cipher"
          hint="CHOOSE A PASSWORD"
          icon={Lock}
          id="password"
          type="password"
          autoComplete="new-password"
          autoFocus
          placeholder="••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <AuthField
          label="Confirm Cipher"
          hint="REPEAT IT"
          icon={Lock}
          id="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <AuthSubmit loading={loading} loadingLabel="Committing…">
          Commit New Cipher →
        </AuthSubmit>
      </form>
    </AuthScene>
  );
}
