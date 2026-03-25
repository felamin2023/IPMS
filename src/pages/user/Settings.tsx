// src/pages/user/Settings.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Loader2, User, Key } from "lucide-react";
import { supabase } from "../../lib/supabase";
import SettingsPasswordSecurity from "../../components/SettingsPasswordSecurity";

const ROLE_POSITION_LABEL: Record<string, string> = {
  department_user: "Department User",
  accounting_admin: "Accounting Administrator",
  procurement_admin: "Procurement Administrator",
  supply_admin: "Supply Administrator",
};

const ROLE_DEPARTMENT_LABEL: Record<string, string> = {
  department_user: "Department",
  accounting_admin: "Accounting Administrator",
  procurement_admin: "Procurement & Supply Office",
  supply_admin: "Supply Office",
};

export default function Settings() {
  const { user } = useAuth();

  const [profile, setProfile] = useState({
    fullName: (user?.user_metadata?.full_name as string) ?? "",
    email: user?.email ?? "",
    position: "",
    department: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const splitFullName = (value: string) => {
    const normalized = value.trim().replace(/\s+/g, " ");
    const [firstName, ...rest] = normalized.split(" ");
    const lastName = rest.join(" ");
    return {
      normalized,
      firstName,
      lastName,
    };
  };

  useEffect(() => {
    if (!user?.id) return;

    let active = true;

    const loadProfile = async () => {
      const { data } = await supabase
        .from("users")
        .select(
          "first_name, last_name, email, role, college:colleges(code, name), program:programs(code, name)",
        )
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      const dbFullName = data
        ? `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim()
        : "";
      const metaFullName =
        (user.user_metadata?.full_name as string | undefined) ||
        `${(user.user_metadata?.first_name as string | undefined) ?? ""} ${(user.user_metadata?.last_name as string | undefined) ?? ""}`.trim();

      const roleKey = (data?.role as string | undefined) ?? "";
      const program = Array.isArray(data?.program)
        ? data.program[0]
        : data?.program;
      const college = Array.isArray(data?.college)
        ? data.college[0]
        : data?.college;
      const programName = (program?.name as string | undefined) ?? "";
      const programCode = (program?.code as string | undefined) ?? "";
      const collegeName = (college?.name as string | undefined) ?? "";
      const collegeCode = (college?.code as string | undefined) ?? "";

      let resolvedDepartment = "";
      if (programName && collegeName) {
        resolvedDepartment = `${programName} (${collegeName})`;
      } else if (programName) {
        resolvedDepartment = programName;
      } else if (programCode) {
        resolvedDepartment = programCode;
      } else if (collegeName) {
        resolvedDepartment = collegeName;
      } else if (collegeCode) {
        resolvedDepartment = collegeCode;
      }

      setProfile((prev) => ({
        ...prev,
        fullName: dbFullName || metaFullName || prev.fullName,
        email: data?.email || user.email || prev.email,
        position: ROLE_POSITION_LABEL[roleKey] || prev.position,
        department:
          resolvedDepartment ||
          ROLE_DEPARTMENT_LABEL[roleKey] ||
          prev.department,
      }));
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [user?.id, user?.email, user?.user_metadata]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    const { normalized, firstName, lastName } = splitFullName(profile.fullName);

    if (!normalized || !firstName) {
      setProfileError("Please enter a valid full name.");
      setProfileMessage("");
      return;
    }

    setSavingProfile(true);
    setProfileError("");
    setProfileMessage("");

    try {
      const { error } = await supabase
        .from("users")
        .update({
          first_name: firstName,
          last_name: lastName,
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: normalized,
          first_name: firstName,
          last_name: lastName,
        },
      });

      if (metadataError) {
        console.error("Failed to sync auth metadata:", metadataError);
      }

      setProfile((prev) => ({ ...prev, fullName: normalized }));
      setProfileMessage("Profile updated successfully.");
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Failed to save profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  };

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
                    className="mt-2 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
                    value={profile.email}
                    readOnly
                    disabled
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Position
                  </label>
                  <input
                    className="mt-2 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
                    value={profile.position}
                    readOnly
                    disabled
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <input
                    className="mt-2 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
                    value={profile.department}
                    readOnly
                    disabled
                  />
                </div>
              </div>

              {profileError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {profileError}
                </div>
              )}

              {profileMessage && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {profileMessage}
                </div>
              )}

              <div className="mt-4 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={savingProfile || !profile.fullName.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProfile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Save profile
                </button>
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
                  Reset your password via OTP
                </div>
              </div>
            </div>
            <SettingsPasswordSecurity email={profile.email} />
          </div>
        </div>
      </div>
    </div>
  );
}
