import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mail, Lock, KeyRound } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "@/components/ui/use-toast";
import AuthScene, { AuthFootLink } from "@/components/auth/AuthScene";
import { AuthField, AuthSubmit, ProviderButton, AuthError, AuthDivider } from "@/components/auth/AuthControls";

// Request a commission — account creation, then the emailed cipher-code (OTP) step.
export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Ciphers do not match.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "The Ministry could not open a file.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Verification code rejected.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "Code dispatched", description: "A new cipher-code is on its way to your channel." });
    } catch (err) {
      setError(err.message || "Failed to re-send the code.");
    }
  };

  const handleGoogle = () => base44.auth.loginWithProvider("google", "/");

  if (showOtp) {
    return (
      <AuthScene
        eyebrow="Ministry of War · Verification"
        title="Confirm the Channel"
        subtitle={`A ONE-TIME CIPHER-CODE WAS DISPATCHED TO ${email.toUpperCase()}`}
        stamp="Pending"
        footer={
          <span className="font-mono text-[11px] text-muted-foreground tracking-wide">
            Code never arrived?{" "}
            <button onClick={handleResend} className="font-heading uppercase tracking-[0.15em] text-xs text-brass hover:text-brass-bright transition-colors">
              Re-dispatch →
            </button>
          </span>
        }
      >
        <AuthError>{error}</AuthError>
        <div className="flex flex-col items-center gap-2">
          <KeyRound className="w-5 h-5 text-brass/70" />
          <p className="cq-label text-center">Enter the six-figure cipher</p>
          <div className="flex justify-center py-3">
            <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>
        <AuthSubmit
          loading={loading}
          loadingLabel="Verifying…"
          disabled={otpCode.length < 6}
          onClick={handleVerify}
          type="button"
        >
          Confirm & Enlist →
        </AuthSubmit>
      </AuthScene>
    );
  }

  return (
    <AuthScene
      eyebrow="Ministry of War · Enlistment"
      title="Request a Commission"
      subtitle="OPEN A COMMANDER'S FILE TO JOIN THE MARCH"
      footer={
        <span className="font-mono text-[11px] text-muted-foreground tracking-wide">
          Already commissioned?{" "}
          <AuthFootLink to="/login">Report for duty →</AuthFootLink>
        </span>
      }
    >
      <ProviderButton onClick={handleGoogle} />
      <AuthDivider label="or open a file" />

      <AuthError>{error}</AuthError>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="Callsign"
          hint="YOUR EMAIL"
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
        <AuthField
          label="Cipher"
          hint="CHOOSE A PASSWORD"
          icon={Lock}
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        <AuthSubmit loading={loading} loadingLabel="Opening file…">
          Request Commission →
        </AuthSubmit>
      </form>
    </AuthScene>
  );
}
