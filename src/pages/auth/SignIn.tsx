import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { setRememberMe } from "../../lib/supabase";
import ForgotPasswordModal from "../../components/ForgotPasswordModal";

const RECENT_SIGNUP_EMAILS_KEY = "ipms-recent-signup-emails";

export default function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMeState] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [savedEmails, setSavedEmails] = useState<string[]>([]);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_SIGNUP_EMAILS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const unique = Array.from(
        new Set(
          parsed.map((value) => String(value || "").trim()).filter(Boolean),
        ),
      );
      setSavedEmails(unique.slice(0, 5));
    } catch {
      // Ignore storage parse errors and continue with an empty list.
      setSavedEmails([]);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      setRememberMe(rememberMe);
      const role = await signIn(email, password);
      if (role === "department_user") {
        navigate("/");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f6ff] to-[#ffffff] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)] overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Top (mobile) / Left (desktop) - Sign In Form */}
          <div className="px-6 py-6 md:px-8 md:py-8 flex items-center justify-center">
            <div className="w-full max-w-xs">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-5">
                Sign In
              </h1>

              {error && (
                <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <form onSubmit={handleSubmit} className="space-y-2">
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
                    onFocus={() => setShowEmailSuggestions(true)}
                    onBlur={() => {
                      // Delay close so onMouseDown on a suggestion can run first.
                      setTimeout(() => setShowEmailSuggestions(false), 120);
                    }}
                    autoComplete="email"
                    required
                    className="w-full rounded-md bg-gray-100 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  {showEmailSuggestions && savedEmails.length > 0 && (
                    <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg">
                      {savedEmails.map((savedEmail) => (
                        <button
                          key={savedEmail}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setEmail(savedEmail);
                            setShowEmailSuggestions(false);
                          }}
                          className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50"
                        >
                          {savedEmail}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-0.5 text-xs min-h-[0.75rem]"></div>
                </div>

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
                      autoComplete="current-password"
                      required
                      className="w-full rounded-md bg-gray-100 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-400"
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
                  <div className="mt-0.5 text-xs min-h-[0.75rem]"></div>
                </div>

                <div className="flex items-center justify-between mb-3 text-xs">
                  <label className="inline-flex items-center gap-2 text-gray-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMeState(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="pt-1 flex justify-center">
                  <button
                    type="submit"
                    disabled={loading}
                    className="min-w-[170px] rounded-md bg-gradient-to-r from-[#93c5fd] to-[#2563eb] px-6 py-2.5 text-sm font-semibold text-white shadow hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? "SIGNING IN..." : "SIGN IN"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Bottom (mobile) / Right (desktop) - Greeting Panel */}
          <div className="relative bg-gradient-to-b from-[#60a5fa] to-[#1e3a8a] text-white flex items-center justify-center px-6 py-8 md:py-14 rounded-t-[36px] md:rounded-t-none md:rounded-l-[90px]">
            <div className="text-center max-w-[300px]">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                New to the System?
              </h2>
              <p className="text-xs md:text-sm text-white/90 leading-relaxed mb-6">
                Create an account to submit requests and monitor status updates.
              </p>

              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-10 py-2.5 border border-white rounded-full text-sm font-semibold tracking-wide hover:bg-white hover:text-[#1e3a8a] transition"
              >
                SIGN UP
              </Link>
            </div>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
    </div>
  );
}
