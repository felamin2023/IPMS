import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface SettingsPasswordSecurityProps {
  email: string;
}

export default function SettingsPasswordSecurity({
  email,
}: SettingsPasswordSecurityProps) {
  const { sendPasswordResetOtp, resetPasswordWithOtp } = useAuth();

  const [sentOtp, setSentOtp] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = window.setTimeout(() => {
      setResendTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendTimer]);

  useEffect(() => {
    setSentOtp(null);
    setOtpCode("");
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setResendTimer(0);
    setError("");
    setSuccess("");
  }, [email]);

  async function handleSendOtp() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("No email is available for this account.");
      return;
    }

    setError("");
    setSuccess("");
    setSendingOtp(true);

    try {
      const code = await sendPasswordResetOtp(trimmedEmail);
      setSentOtp(code);
      setResendTimer(60);
      setOtpCode("");
      setSuccess("A reset code has been sent to your email.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset code.",
      );
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleUpdatePassword() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("No email is available for this account.");
      return;
    }

    if (!sentOtp) {
      setError("Please send an OTP code first.");
      return;
    }

    if (otpCode.length !== 8) {
      setError("OTP code must be exactly 8 digits.");
      return;
    }

    if (otpCode !== sentOtp) {
      setError("Invalid OTP code. Please try again.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    setError("");
    setSuccess("");
    setUpdatingPassword(true);

    try {
      await resetPasswordWithOtp(trimmedEmail, newPassword);
      setSuccess("Password updated successfully.");
      setSentOtp(null);
      setOtpCode("");
      setNewPassword("");
      setConfirmPassword("");
      setResendTimer(0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update password.",
      );
    } finally {
      setUpdatingPassword(false);
    }
  }

  return (
    <div className="space-y-4 px-6 py-6">
      <p className="text-sm text-gray-600">
        Change your password using a one-time reset code sent to your account
        email.
      </p>

      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Account Email
        </div>
        <div className="mt-1 text-sm font-medium text-gray-800">
          {email || "No email detected"}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSendOtp}
          disabled={sendingOtp || resendTimer > 0 || !email.trim()}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {sentOtp ? "Resend OTP" : "Send OTP"}
        </button>

        {resendTimer > 0 && (
          <span className="text-xs text-gray-500">
            You can resend in {resendTimer}s
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-gray-700">OTP Code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={8}
            placeholder="8-digit code"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
            className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            New Password
          </label>
          <div className="relative mt-2">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-11 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={showNewPassword ? "Hide password" : "Show password"}
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <div className="relative mt-2">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-11 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleUpdatePassword}
          disabled={updatingPassword || !sentOtp}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updatingPassword ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          Update Password
        </button>
      </div>
    </div>
  );
}
