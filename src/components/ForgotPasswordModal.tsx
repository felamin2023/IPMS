import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalStep = "email" | "otp" | "newPassword";

export default function ForgotPasswordModal({
  isOpen,
  onClose,
}: ForgotPasswordModalProps) {
  const { sendPasswordResetOtp, resetPasswordWithOtp } = useAuth();

  // Step tracking
  const [step, setStep] = useState<ModalStep>("email");
  const [email, setEmail] = useState("");
  const [sentOtp, setSentOtp] = useState<string | null>(null);
  const [otp, setOtp] = useState<string[]>(Array(8).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setStep("email");
      setEmail("");
      setSentOtp(null);
      setOtp(Array(8).fill(""));
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      setSuccess(false);
      setResendTimer(0);
    }
  }, [isOpen]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // Auto-close modal on success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => onClose(), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email.trim()) {
        throw new Error("Please enter your email address.");
      }

      const code = await sendPasswordResetOtp(email);
      setSentOtp(code);
      setOtp(Array(8).fill(""));
      setStep("otp");
      setResendTimer(60);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to send reset code",
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const enteredOtp = otp.join("");

    if (enteredOtp.length !== 8) {
      setError("Please enter all 8 digits of the code.");
      return;
    }

    if (enteredOtp !== sentOtp) {
      setError("The code you entered is incorrect. Please try again.");
      setOtp(Array(8).fill(""));
      if (inputRefs.current[0]) inputRefs.current[0].focus();
      return;
    }

    // Proceed to password reset step
    setStep("newPassword");
    setError("");
  };

  // Step 3: Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!newPassword.trim()) {
        throw new Error("Please enter a new password.");
      }

      if (newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters long.");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      await resetPasswordWithOtp(email, newPassword);

      // Success: show message and auto-close modal after 3 seconds
      setSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to update password",
      );
    } finally {
      setLoading(false);
    }
  };

  // OTP input handler
  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Keep only last digit if pasted
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setError("");
    setLoading(true);

    try {
      const code = await sendPasswordResetOtp(email);
      setSentOtp(code);
      setOtp(Array(8).fill(""));
      setResendTimer(60);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  // Back button
  const handleBack = () => {
    setError("");
    if (step === "otp") {
      setStep("email");
      setOtp(Array(8).fill(""));
    } else if (step === "newPassword") {
      setStep("otp");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-blue-400 to-blue-600 px-6 py-4 text-white">
          <h2 className="text-lg font-bold">Reset Password</h2>
          <p className="mt-1 text-xs text-blue-50">
            {step === "email" && "Enter your email to receive a reset code"}
            {step === "otp" && "Enter the 8-digit code sent to your email"}
            {step === "newPassword" && "Create your new password"}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {success && (
            <div className="text-center py-6">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-green-100 p-3">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Password Updated!
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Your password has been reset successfully. Redirecting you to
                sign in...
              </p>
            </div>
          )}
          {!success && (
            <>
              {error && (
                <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
              {/* Step 1: Email */}
              {step === "email" && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required
                      className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 rounded-md border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-md bg-gradient-to-r from-blue-400 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 transition"
                    >
                      {loading ? "Sending..." : "Send Code"}
                    </button>
                  </div>
                </form>
              )}
              {/* Step 2: OTP Verification */}
              {step === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <p className="mb-4 text-sm text-gray-600">
                      We've sent an 8-digit code to <strong>{email}</strong>
                    </p>

                    <div className="flex gap-1 justify-center mb-4">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            inputRefs.current[index] = el;
                          }}
                          type="text"
                          value={digit}
                          onChange={(e) =>
                            handleOtpChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          maxLength={1}
                          inputMode="numeric"
                          className="h-10 w-9 sm:h-12 sm:w-10 rounded-lg border-2 border-gray-300 bg-gray-50 text-center text-base sm:text-lg font-bold text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      ))}
                    </div>

                    <p className="text-xs text-gray-500 text-center mb-4">
                      Code expires in 10 minutes
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 rounded-md border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-md bg-gradient-to-r from-blue-400 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 transition"
                    >
                      {loading ? "Verifying..." : "Verify Code"}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0 || loading}
                    className="w-full text-center text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition"
                  >
                    {resendTimer > 0
                      ? `Resend code in ${resendTimer}s`
                      : "Resend code"}
                  </button>
                </form>
              )}
              {/* Step 3: New Password */}
              {step === "newPassword" && (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13.875 18.825A10.05 10.05 0 0 1 12 19.5c-5.523 0-10-4.477-10-10a9.96 9.96 0 0 1 1.175-4.125M6.343 6.343A9.962 9.962 0 0 1 12 4.5c5.523 0 10 4.477 10 10 0 1.356-.265 2.65-.743 3.816M3 3l18 18"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      At least 8 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13.875 18.825A10.05 10.05 0 0 1 12 19.5c-5.523 0-10-4.477-10-10a9.96 9.96 0 0 1 1.175-4.125M6.343 6.343A9.962 9.962 0 0 1 12 4.5c5.523 0 10 4.477 10 10 0 1.356-.265 2.65-.743 3.816M3 3l18 18"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 rounded-md border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-md bg-gradient-to-r from-blue-400 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 transition"
                    >
                      {loading ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              )}{" "}
            </>
          )}{" "}
        </div>
      </div>
    </div>
  );
}
