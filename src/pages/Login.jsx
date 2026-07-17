import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, Lock } from "lucide-react";
import AuthScene, { AuthFootLink } from "@/components/auth/AuthScene";
import { AuthField, AuthSubmit, ProviderButton, AuthError, AuthDivider } from "@/components/auth/AuthControls";

// Field-terminal authentication — the in-repo login the whole app redirects to.
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Callsign or cipher not recognised.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => base44.auth.loginWithProvider("google", "/");

  return (
    <AuthScene
      eyebrow="Ministry of War · Secure Channel"
      title="Report for Duty"
      subtitle="PRESENT YOUR CREDENTIALS TO RESUME COMMAND"
      footer={
        <span className="font-mono text-[11px] text-muted-foreground tracking-wide">
          No commission on file?{" "}
          <AuthFootLink to="/register">Request one →</AuthFootLink>
        </span>
      }
    >
      <ProviderButton onClick={handleGoogle} />
      <AuthDivider />

      <AuthError>{error}</AuthError>

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
        <div>
          <AuthField
            label="Cipher"
            hint="ACCESS PASSWORD"
            icon={Lock}
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex justify-end mt-1.5">
            <AuthFootLink to="/forgot-password">Cipher lost?</AuthFootLink>
          </div>
        </div>

        <AuthSubmit loading={loading} loadingLabel="Authenticating…">
          Authenticate →
        </AuthSubmit>
      </form>
    </AuthScene>
  );
}
