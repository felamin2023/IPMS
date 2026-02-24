import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

type TouchedFields = {
  name: boolean;
  email: boolean;
  password: boolean;
  college: boolean;
  program: boolean;
};

export default function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Name is UI-only for now (your signUp currently uses email + password)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // New UI-only fields (kept client-side; signUp() signature still uses email+password)
  const [college, setCollege] = useState("");
  const [program, setProgram] = useState("");
  const [role] = useState<"department_user">("department_user");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

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
  const inputError =
    "ring-1 ring-red-300 focus:ring-red-400 bg-red-50/60 placeholder:text-red-400";

  const handleBlur = (field: keyof TouchedFields) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Static lists matching seeded colleges/programs (UI-only). Kept local to avoid adding network requests.
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
      await signUp(email.trim(), password);
      navigate("/signin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#edf0fb] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Left Side - Greeting Panel */}
          <div className="relative bg-linear-to-b from-[#5f6ad8] to-[#5a2ccf] text-white flex items-center justify-center px-6 py-12 md:py-14 rounded-b-[70px] md:rounded-bl-none md:rounded-tr-[90px] md:rounded-br-[90px]">
            <div className="text-center max-w-[275px]">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Create an Account
              </h2>
              <p className="text-xs md:text-sm text-white/90 leading-relaxed mb-6">
                Register your department account to access the request tracking
                system.
              </p>

              <Link
                to="/signin"
                className="inline-flex items-center justify-center px-10 py-2.5 border border-white rounded-full text-sm font-semibold tracking-wide hover:bg-white hover:text-[#5a2ccf] transition"
              >
                SIGN IN
              </Link>
            </div>
          </div>

          {/* Right Side - Form (scrolls internally if content gets tall) */}
          <div className="px-6 py-6 md:px-8 md:py-8 flex items-center justify-center">
            <div className="w-full max-w-sm">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-5">
                Create Account
              </h1>

              {/* Social Buttons (UI only) */}
              <div className="flex items-center justify-center mb-3">
                <button
                  type="button"
                  aria-label="Sign up with Google"
                  className="flex w-[80%] items-center justify-center gap-2 rounded-full bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
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
                          ? inputError
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
                        {college ? "Select Program" : "Select Department first"}
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
                          ? inputError
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
                  <input
                    id="password"
                    type="password"
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
                        ? inputError
                        : inputOk
                    }`}
                  />

                  {/* Floating password requirements (only while typing/focused) */}
                  {showPasswordRequirements && (
                    <div className="absolute left-0 bottom-full z-30 mb-2 w-full rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
                      <p className="mb-2 text-xs text-gray-600">
                        Requirement: 8+ chars, uppercase, lowercase, and number.
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

                  {/* Validation error container (reserved height to avoid layout shift) */}
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

                {/* Role is defaulted to department_user; admin accounts are created manually. */}

                <div className="flex justify-center pt-2 relative">
                  <button
                    type="submit"
                    disabled={loading || !isFormValid}
                    className="rounded-md bg-linear-to-r from-[#6b4cf6] to-[#592cd4] px-5 py-2 text-sm font-semibold text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 w-36"
                  >
                    {loading ? "SIGNING UP..." : "SIGN UP"}
                  </button>
                </div>
              </form>

              <p className="mt-5 text-center text-sm text-gray-600 md:hidden">
                Already have an account?{" "}
                <Link
                  to="/signin"
                  className="font-semibold text-purple-700 hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
