// src/pages/user/Settings.tsx
import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { User, Mail, Key, Globe, Settings2 } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();

  const [profile, setProfile] = useState({
    fullName: (user?.user_metadata?.full_name as string) ?? "",
    email: user?.email ?? "",
    position: "Procurement Officer",
    department: "Procurement & Supply Office",
  });

  const [toggles, setToggles] = useState({
    newRequests: true,
    approvalReminders: true,
    statusUpdates: true,
    emailDigest: false,
  });

  const [security, setSecurity] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const languages = useMemo(() => ["English", "Filipino"], []);
  const timezones = useMemo(() => ["UTC-8", "UTC-5 (ET)", "UTC+8 (PHT)"], []);

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account and preferences
          </p>
        </div>

        <div className="space-y-5">
          {/* Profile */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Profile
                </div>
                <div className="text-xs text-gray-500">
                  Update your personal details
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Full name
                  </label>
                  <input
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    value={profile.fullName}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, fullName: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Position
                  </label>
                  <input
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    value={profile.position}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, position: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <input
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    value={profile.department}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, department: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end">
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  Save profile
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Settings2 className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Notifications
                </div>
                <div className="text-xs text-gray-500">
                  Control email and in-app alerts
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="space-y-3">
                {(
                  [
                    { key: "newRequests", label: "New requests" },
                    { key: "approvalReminders", label: "Approval reminders" },
                    { key: "statusUpdates", label: "Status updates" },
                    { key: "emailDigest", label: "Email digest (daily)" },
                  ] as { key: keyof typeof toggles; label: string }[]
                ).map((t) => (
                  <div
                    key={t.key}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {t.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        Enable or disable {t.label.toLowerCase()}.
                      </div>
                    </div>
                    <div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={toggles[t.key]}
                          onChange={() =>
                            setToggles((s) => ({ ...s, [t.key]: !s[t.key] }))
                          }
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Key className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Security
                </div>
                <div className="text-xs text-gray-500">
                  Change your password
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Current password
                  </label>
                  <input
                    type="password"
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    value={security.current}
                    onChange={(e) =>
                      setSecurity((s) => ({ ...s, current: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    New password
                  </label>
                  <input
                    type="password"
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    value={security.next}
                    onChange={(e) =>
                      setSecurity((s) => ({ ...s, next: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Confirm new
                  </label>
                  <input
                    type="password"
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    value={security.confirm}
                    onChange={(e) =>
                      setSecurity((s) => ({ ...s, confirm: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end">
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  Change password
                </button>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <Globe className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Preferences
                </div>
                <div className="text-xs text-gray-500">
                  Locale and display settings
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Language
                  </label>
                  <select
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={languages[0]}
                  >
                    {languages.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Timezone
                  </label>
                  <select
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={timezones[0]}
                  >
                    {timezones.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Currency
                  </label>
                  <select
                    className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    defaultValue="USD"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="PHP">PHP (₱)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
