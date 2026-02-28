import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import NotificationModal from "../../components/NotificationModal";

type TouchedFields = {
  name: boolean;
  email: boolean;
  password: boolean;
  college: boolean;
  program: boolean;
};

/* ───────────────────────── OTP step component ───────────────────────── */

function OtpVerification({
  email,
  profile,
  onBack,
}: {
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    role: string;
    collegeId: string | null;
    programId: string | null;
  };
  onBack: () => void;
}) {
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  const OTP_LENGTH = 8;
  const RESEND_COOLDOWN = 60; // seconds

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState<"success" | "error" | "info">(
    "info",
  );

  // Countdown timer for resend button
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Accept only single digits
    if (value && !/^\d$/.test(value)) return;

    const next = [...digits];
    next[index] = value;
    setDigits(next);

    // Auto-advance to next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < OTP_LENGTH; i++) {
      next[i] = pasted[i] || "";
    }
    setDigits(next);
    // Focus the input after the last pasted digit
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const otpCode = digits.join("");
  const isComplete = otpCode.length === OTP_LENGTH;

  const handleVerify = useCallback(async () => {
    if (!isComplete) return;
    setError("");
    setLoading(true);
    try {
      await verifyOtp(email, otpCode, profile);
      setNotifType("success");
      setNotifMessage("Email verified! Redirecting to sign in...");
      setNotifOpen(true);
      setTimeout(() => navigate("/signin"), 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setError(msg);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [isComplete, otpCode, email, profile, verifyOtp, navigate]);

  const handleResend = async () => {
    setError("");
    try {
      await resendOtp(email);
      setResendTimer(RESEND_COOLDOWN);
      setNotifType("info");
      setNotifMessage("A new verification code has been sent to your email.");
      setNotifOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend code";
      setError(msg);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto text-center">
      {/* Email icon */}
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
        <svg
          className="h-8 w-8 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
          />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-1">
        Verify Your Email
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        We sent a verification code to{" "}
        <span className="font-medium text-gray-700">{email}</span>
      </p>

      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* OTP digit inputs: grid that becomes 4 cols on small screens (2 rows) and 8 cols on sm+ (single row) */}
      <div
        className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-6 justify-items-center"
        onPaste={handlePaste}
      >
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="h-12 w-full max-w-[48px] sm:max-w-[40px] rounded-lg border-2 border-gray-200 bg-gray-50 text-center text-lg font-semibold text-gray-800 outline-none transition-colors focus:border-blue-500 focus:bg-white"
          />
        ))}
      </div>

      {/* Verify button */}
      <button
        onClick={handleVerify}
        disabled={!isComplete || loading}
        className="w-full rounded-md bg-gradient-to-r from-[#93c5fd] to-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 mb-4"
      >
        {loading ? "VERIFYING..." : "VERIFY"}
      </button>

      {/* Resend & Back */}
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 transition"
        >
          &larr; Back
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendTimer > 0}
          className={`font-medium transition ${
            resendTimer > 0
              ? "text-gray-400 cursor-not-allowed"
              : "text-blue-600 hover:text-blue-700"
          }`}
        >
          {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
        </button>
      </div>

      <NotificationModal
        open={notifOpen}
        title={
          notifType === "success"
            ? "Success"
            : notifType === "error"
              ? "Error"
              : "Notice"
        }
        message={notifMessage}
        type={notifType}
        onClose={() => setNotifOpen(false)}
      />
    </div>
  );
}

/* ───────────────────────── Main SignUp component ───────────────────────── */

export default function SignUp() {
  const { signUp, checkEmailExists } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [college, setCollege] = useState("");
  const [program, setProgram] = useState("");
  const [role] = useState<"department_user">("department_user");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // OTP step state (normal behavior)
  const [showOtp, setShowOtp] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<{
    firstName: string;
    lastName: string;
    role: string;
    collegeId: string | null;
    programId: string | null;
  } | null>(null);

  const [touched, setTouched] = useState<TouchedFields>({
    name: false,
    email: false,
    password: false,
    college: false,
    program: false,
  });

  // Validation rules
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nameRegex = /^[A-Za-z\s.'-]+$/;

  const passwordChecks = useMemo(
    () => ({
      minLength: password.length >= 8,
      hasLower: /[a-z]/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
    }),
    [password],
  );

  const nameError = useMemo(() => {
    const trimmed = name.trim();
    if (!trimmed) return "Name is required.";
    if (trimmed.length < 2) return "Name must be at least 2 characters.";
    if (!nameRegex.test(trimmed)) {
      return "Name can only contain letters, spaces, apostrophes, dots, and hyphens.";
    }
    return "";
  }, [name]);

  const emailError = useMemo(() => {
    const trimmed = email.trim();
    if (!trimmed) return "Email is required.";
    if (!emailRegex.test(trimmed)) return "Please enter a valid email address.";
    return "";
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) return "Password is required.";
    if (!passwordChecks.minLength)
      return "Password must be at least 8 characters.";
    if (!passwordChecks.hasLower)
      return "Password must include a lowercase letter.";
    if (!passwordChecks.hasUpper)
      return "Password must include an uppercase letter.";
    if (!passwordChecks.hasNumber) return "Password must include a number.";
    return "";
  }, [password, passwordChecks]);

  const isFormValid = !nameError && !emailError && !passwordError;
  const showFieldError = (field: keyof TouchedFields) =>
    touched[field] || submitted;
  const showPasswordRequirements = isPasswordFocused && password.length > 0;

  const inputBase =
    "w-full rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-800 placeholder:text-gray-500 outline-none focus:ring-2";
  const inputOk = "focus:ring-purple-400";
  const inputErr =
    "ring-1 ring-red-300 focus:ring-red-400 bg-red-50/60 placeholder:text-red-400";

  const handleBlur = (field: keyof TouchedFields) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Static lists matching seeded colleges/programs
  const colleges = [
    { code: "CAFE", name: "College of Agriculture, Forestry and Environment" },
    { code: "CAS", name: "College of Arts and Sciences" },
    { code: "COE", name: "College of Education" },
    { code: "CHMT", name: "College of Hotel Management and Tourism" },
    { code: "COTE", name: "College of Technology and Engineering" },
  ];

  const programsByCollege: Record<string, { code: string; name: string }[]> = {
    CAFE: [
      { code: "BSF", name: "Bachelor of Science in Forestry" },
      { code: "BSES", name: "Bachelor of Science in Environmental Science" },
      { code: "BSA", name: "Bachelor of Science in Agriculture" },
    ],
    CAS: [
      { code: "BAEL", name: "Bachelor of Arts in English Language Studies" },
      { code: "BALIT", name: "Bachelor of Arts in Literature" },
      { code: "BSP", name: "Bachelor of Science in Psychology" },
    ],
    COE: [
      { code: "BEED", name: "Bachelor of Elementary Education" },
      {
        code: "BTLED-HE",
        name: "Bachelor of Technology and Livelihood Education Major in Home Economics",
      },
      {
        code: "BSED-ENG",
        name: "Bachelor of Secondary Education Major in English",
      },
      {
        code: "BSED-MATH",
        name: "Bachelor of Secondary Education Major in Mathematics",
      },
    ],
    CHMT: [
      { code: "BSHM", name: "Bachelor of Science in Hotel Management" },
      { code: "BSTM", name: "Bachelor of Science in Tourism Management" },
    ],
    COTE: [
      { code: "BSIE", name: "Bachelor of Science in Industrial Engineering" },
      { code: "BSIT", name: "Bachelor of Science in Information Technology" },
      {
        code: "BIT-AUTO",
        name: "Bachelor of Industrial Technology Major in Automotive Technology",
      },
      {
        code: "BIT-COMP",
        name: "Bachelor of Industrial Technology Major in Computer Technology",
      },
      {
        code: "BIT-DRAFT",
        name: "Bachelor of Industrial Technology Major in Drafting Technology",
      },
      {
        code: "BIT-ELEC",
        name: "Bachelor of Industrial Technology Major in Electronics Technology",
      },
      {
        code: "BIT-GAR",
        name: "Bachelor of Industrial Technology Major in Garments Technology",
      },
    ],
  };

  const filteredPrograms = useMemo(() => {
    return college ? (programsByCollege[college] ?? []) : [];
  }, [college]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError("");

    if (!isFormValid) return;

    try {
      setLoading(true);

      // 1. Check if email already exists in the users table
      const emailTaken = await checkEmailExists(email.trim());
      if (emailTaken) {
        throw new Error(
          "This email is already registered. Please sign in instead.",
        );
      }

      // 2. Resolve college/program codes to UUIDs
      let collegeUuid: string | null = null;
      let programUuid: string | null = null;

      if (college) {
        const { data: collegeRow } = await supabase
          .from("colleges")
          .select("id")
          .eq("code", college)
          .single();
        collegeUuid = collegeRow?.id ?? null;
      }

      if (program && collegeUuid) {
        const { data: programRow } = await supabase
          .from("programs")
          .select("id")
          .eq("code", program)
          .eq("college_id", collegeUuid)
          .single();
        programUuid = programRow?.id ?? null;
      }

      // 3. Split name into first / last (best-effort)
      const trimmed = name.trim();
      const [firstName, ...rest] = trimmed.split(/\s+/);
      const lastName = rest.length ? rest.join(" ") : "";

      const profileData = {
        firstName: firstName || "",
        lastName: lastName || "",
        role,
        collegeId: collegeUuid,
        programId: programUuid,
      };

      // 4. Create Supabase Auth user (sends OTP email)
      await signUp(email.trim(), password, profileData);

      // Save profile data so the OTP step can pass it to verifyOtp
      setPendingProfile(profileData);
      setShowOtp(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign up failed";
      setError(msg);
      setNotifType("error");
      setNotifMessage(msg);
      setNotifOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState<"success" | "error" | "info">(
    "info",
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f6ff] to-[#ffffff] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Top (mobile) / Right (desktop) - Form / OTP */}
          <div className="px-6 py-6 md:px-8 md:py-8 flex items-center justify-center md:order-2">
            {showOtp && pendingProfile ? (
              <OtpVerification
                email={email.trim()}
                profile={pendingProfile}
                onBack={() => setShowOtp(false)}
              />
            ) : (
              <div className="w-full max-w-sm">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-5">
                  Create Account
                </h1>

                {/* Social Buttons (UI only) */}
                <div className="flex items-center justify-center mb-3">
                  <button
                    type="button"
                    aria-label="Sign up with Google"
                    className="flex w-[80%] items-center justify-center gap-4 rounded-full bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </button>
                </div>

                <p className="text-center text-xs text-gray-500 mb-5">
                  or use your email for registration
                </p>

                {error && (
                  <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                  </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Name */}
                    <div className="relative">
                      <label htmlFor="name" className="sr-only">
                        Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => handleBlur("name")}
                        autoComplete="name"
                        required
                        className={`${inputBase} ${
                          showFieldError("name") && nameError
                            ? inputErr
                            : inputOk
                        }`}
                      />
                      <div className="mt-0.5 text-xs min-h-[0.75rem] relative">
                        {showFieldError("name") && nameError && (
                          <p className="text-red-600 absolute left-0 top-0">
                            {nameError}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Department / College */}
                    <div className="relative">
                      <label htmlFor="college" className="sr-only">
                        Department
                      </label>
                      <select
                        id="college"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        onBlur={() => handleBlur("college")}
                        className={`${inputBase} appearance-none`}
                      >
                        <option value="">Select Department</option>
                        {colleges.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Program (depends on selected college) */}
                    <div className="relative">
                      <label htmlFor="program" className="sr-only">
                        Program
                      </label>
                      <select
                        id="program"
                        value={program}
                        onChange={(e) => setProgram(e.target.value)}
                        onBlur={() => handleBlur("program")}
                        disabled={!college}
                        className={`${inputBase} appearance-none ${!college ? "opacity-60" : ""}`}
                      >
                        <option value="">
                          {college
                            ? "Select Program"
                            : "Select Department first"}
                        </option>
                        {filteredPrograms.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.name} ({p.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Email */}
                    <div className="relative">
                      <label htmlFor="email" className="sr-only">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => handleBlur("email")}
                        autoComplete="email"
                        required
                        className={`${inputBase} ${
                          showFieldError("email") && emailError
                            ? inputErr
                            : inputOk
                        }`}
                      />
                      <div className="mt-0.5 text-xs min-h-[0.75rem] relative">
                        {showFieldError("email") && emailError && (
                          <p className="text-red-600 absolute left-0 top-0">
                            {emailError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <label htmlFor="password" className="sr-only">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => {
                          setIsPasswordFocused(false);
                          handleBlur("password");
                        }}
                        autoComplete="new-password"
                        required
                        className={`${inputBase} ${
                          showFieldError("password") && passwordError
                            ? inputErr
                            : inputOk
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
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

                    {/* Floating password requirements (only while typing/focused) */}
                    {showPasswordRequirements && (
                      <div className="absolute left-0 bottom-full z-30 mb-2 w-full rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
                        <p className="mb-2 text-xs text-gray-600">
                          Requirement: 8+ chars, uppercase, lowercase, and
                          number.
                        </p>

                        <div className="grid grid-cols-1 gap-0.5 text-xs">
                          <p
                            className={
                              passwordChecks.minLength
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            • At least 8 characters
                          </p>
                          <p
                            className={
                              passwordChecks.hasUpper
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            • At least 1 uppercase letter
                          </p>
                          <p
                            className={
                              passwordChecks.hasLower
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            • At least 1 lowercase letter
                          </p>
                          <p
                            className={
                              passwordChecks.hasNumber
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            • At least 1 number
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Validation error container */}
                    <div className="mt-0.5 text-xs min-h-[1rem] relative">
                      <p
                        className={`absolute left-0 top-0 text-xs ${
                          showFieldError("password") && passwordError
                            ? "text-red-600"
                            : "opacity-0"
                        }`}
                      >
                        {showFieldError("password") && passwordError
                          ? passwordError
                          : " "}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center pt-2 relative">
                    <button
                      type="submit"
                      disabled={loading || !isFormValid}
                      className="rounded-md bg-gradient-to-r from-[#93c5fd] to-[#2563eb] px-5 py-2 text-sm font-semibold text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 w-36"
                    >
                      {loading ? "SIGNING UP..." : "SIGN UP"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Bottom (mobile) / Left (desktop) - Greeting Panel */}
          <div className="relative bg-gradient-to-b from-[#60a5fa] to-[#1e3a8a] text-white flex items-center justify-center px-6 py-7 md:py-14 md:order-1 rounded-t-[36px] md:rounded-t-none md:rounded-tr-[90px] md:rounded-br-[90px]">
            <div className="text-center max-w-[295px] ">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 ">
                {showOtp ? "Check Your Email" : "Already have an account?"}
              </h2>
              <p className="text-xs md:text-sm text-white/90 leading-relaxed mb-6">
                {showOtp
                  ? "Enter the verification code we sent to your email to complete registration."
                  : "Sign in to access your department account and the request tracking system."}
              </p>

              <Link
                to="/signin"
                className="inline-flex items-center justify-center px-10 py-2.5 border border-white rounded-full text-sm font-semibold tracking-wide hover:bg-white hover:text-[#1e3a8a] transition"
              >
                SIGN IN
              </Link>
            </div>
          </div>
        </div>
      </div>
      <NotificationModal
        open={notifOpen}
        title={notifType === "error" ? "Error" : "Notice"}
        message={notifMessage}
        type={notifType}
        onClose={() => setNotifOpen(false)}
      />
    </div>
  );
}
