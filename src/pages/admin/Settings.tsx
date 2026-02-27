// src/pages/admin/Settings.tsx
import { useMemo, useState } from "react";
import { User, Bell, Lock, Globe } from "lucide-react";

type Toggles = {
  newRequests: boolean;
  approvalReminders: boolean;
  statusUpdates: boolean;
  emailDigest: boolean;
};

function CardHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-4">
      <div className="text-gray-500">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-sm font-semibold text-gray-900">{title}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  desc: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-5">
      <div>
        <div className="text-sm font-semibold text-gray-900">{label}</div>
        <div className="mt-1 text-sm text-gray-500">{desc}</div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          checked ? "bg-blue-600" : "bg-gray-200",
        ].join(" ")}
        aria-pressed={checked}
        aria-label={label}
      >
        <span
          className={[
            "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const departments = useMemo(
    () => [
      "Procurement & Supply Office",
      "Accounting",
      "IT Department",
      "Facilities",
      "Library",
      "Science Lab",
    ],
    [],
  );

  const [profile, setProfile] = useState({
    fullName: "John Doe",
    email: "john.doe@university.edu",
    position: "Procurement Officer",
    department: "Procurement & Supply Office",
  });

  const [toggles, setToggles] = useState<Toggles>({
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

  const [prefs, setPrefs] = useState({
    language: "English",
    timezone: "UTC-5 (Eastern Time)",
    dateFormat: "MM/DD/YYYY",
    currency: "USD ($)",
  });

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account and system preferences
          </p>
        </div>

        <div className="space-y-5">
          {/* Profile Settings */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <CardHeader icon={User} title="Profile Settings" />

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    value={profile.fullName}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, fullName: e.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, email: e.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Position
                  </label>
                  <input
                    value={profile.position}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, position: e.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <select
                    value={profile.department}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, department: e.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => alert("Saved (UI only)")}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <CardHeader icon={Bell} title="Notification Preferences" />

            <div className="px-6">
              <Toggle
                checked={toggles.newRequests}
                onChange={(v) => setToggles((t) => ({ ...t, newRequests: v }))}
                label="New Request Submissions"
                desc="Get notified when new requests are submitted"
              />
              <div className="h-px bg-gray-100" />
              <Toggle
                checked={toggles.approvalReminders}
                onChange={(v) =>
                  setToggles((t) => ({ ...t, approvalReminders: v }))
                }
                label="Approval Reminders"
                desc="Remind me about pending approvals"
              />
              <div className="h-px bg-gray-100" />
              <Toggle
                checked={toggles.statusUpdates}
                onChange={(v) =>
                  setToggles((t) => ({ ...t, statusUpdates: v }))
                }
                label="Status Updates"
                desc="Get notified when request status changes"
              />
              <div className="h-px bg-gray-100" />
              <Toggle
                checked={toggles.emailDigest}
                onChange={(v) => setToggles((t) => ({ ...t, emailDigest: v }))}
                label="Email Digest"
                desc="Receive daily summary of activities"
              />
            </div>
          </div>

          {/* Security */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <CardHeader icon={Lock} title="Security" />

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={security.current}
                    onChange={(e) =>
                      setSecurity((s) => ({ ...s, current: e.target.value }))
                    }
                    placeholder="Enter current password"
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={security.next}
                    onChange={(e) =>
                      setSecurity((s) => ({ ...s, next: e.target.value }))
                    }
                    placeholder="Enter new password"
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={security.confirm}
                    onChange={(e) =>
                      setSecurity((s) => ({ ...s, confirm: e.target.value }))
                    }
                    placeholder="Confirm new password"
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => alert("Updated (UI only)")}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>

          {/* System Preferences */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <CardHeader icon={Globe} title="System Preferences" />

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Language
                  </label>
                  <select
                    value={prefs.language}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, language: e.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  >
                    <option>English</option>
                    <option>Filipino</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Timezone
                  </label>
                  <select
                    value={prefs.timezone}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, timezone: e.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  >
                    <option>UTC-5 (Eastern Time)</option>
                    <option>UTC+8 (Philippine Time)</option>
                    <option>UTC+0 (UTC)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Date Format
                  </label>
                  <select
                    value={prefs.dateFormat}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, dateFormat: e.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  >
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Currency
                  </label>
                  <select
                    value={prefs.currency}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, currency: e.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  >
                    <option>USD ($)</option>
                    <option>PHP (₱)</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => alert("Saved (UI only)")}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
