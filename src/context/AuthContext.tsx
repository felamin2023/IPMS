import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface ProfileData {
  firstName: string;
  lastName: string;
  role: string;
  collegeId?: string | null; // UUID
  programId?: string | null; // UUID
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: string | null;
  loading: boolean;
  checkEmailExists: (email: string) => Promise<boolean>;
  signUp: (
    email: string,
    password: string,
    profile?: ProfileData,
  ) => Promise<void>;
  verifyOtp: (
    email: string,
    token: string,
    profile?: ProfileData,
  ) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<string>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper: fetch the application role from the `users` table
  const fetchRole = async (userId: string) => {
    const { data: userRow, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (!error && userRow?.role) {
      setRole(userRow.role as string);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        fetchRole(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        fetchRole(session.user.id);
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Check if an email already exists in the `users` table.
   */
  const checkEmailExists = async (email: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (error) {
      console.error("Email check error:", error);
      return false;
    }
    return data !== null;
  };

  // Helper: compute SHA-256 hex of a password (browser-safe)
  const hashPassword = async (password: string) => {
    if (!password) return "";
    const enc = new TextEncoder();
    const data = enc.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  /**
   * Step 1 — create the Supabase Auth user.
   * Supabase sends a confirmation email with an OTP code.
   * Profile metadata is stored in user_metadata so it survives until verification.
   */
  const signUp = async (
    email: string,
    password: string,
    profile?: ProfileData,
  ) => {
    // Compute a password hash to persist in the `users` table later.
    // We store the hash in Auth user metadata temporarily so it can be
    // copied to the `users` table after OTP verification.
    const passwordHash = await hashPassword(password);

    const metadata = profile
      ? {
          first_name: profile.firstName,
          last_name: profile.lastName,
          role: profile.role,
          college_id: profile.collegeId ?? null,
          program_id: profile.programId ?? null,
          password_hash: passwordHash,
        }
      : { password_hash: passwordHash };

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    if (error) throw error;
  };

  /**
   * Step 2 — verify the OTP the user received via email.
   * On success, insert a user row into the `users` table.
   */
  const verifyOtp = async (
    email: string,
    token: string,
    profile?: ProfileData,
  ) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });
    if (error) throw error;

    // Insert user row after successful verification
    const userId = data.user?.id ?? null;
    // Prefer password_hash from the user's metadata (set during signUp).
    const metadataHash = data.user?.user_metadata?.password_hash ?? "";

    if (userId) {
      // Prefer profile values passed from the UI; fall back to metadata.
      const firstName =
        profile?.firstName ?? data.user?.user_metadata?.first_name ?? "";
      const lastName =
        profile?.lastName ?? data.user?.user_metadata?.last_name ?? "";
      const role =
        profile?.role ??
        (data.user?.user_metadata?.role as any) ??
        "department_user";
      const collegeId =
        profile?.collegeId ?? data.user?.user_metadata?.college_id ?? null;
      const programId =
        profile?.programId ?? data.user?.user_metadata?.program_id ?? null;

      const { error: insertError } = await supabase.from("users").insert([
        {
          id: userId,
          email,
          first_name: firstName,
          last_name: lastName,
          password_hash: metadataHash || "",
          role,
          college_id: collegeId ?? null,
          program_id: programId ?? null,
        },
      ]);

      if (insertError) {
        console.error("User row insert error:", insertError);
        throw new Error(
          "Account verified but failed to create user profile. Please contact support.",
        );
      }
    }
  };

  /**
   * Re-send the OTP confirmation email.
   */
  const resendOtp = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    // Try normal Supabase auth first
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error) {
      // Auth succeeded via Supabase — load the application role from `users` table.
      const userId = data.user?.id ?? null;
      let resolvedRole = "department_user";
      if (userId) {
        const { data: userRow, error: qErr } = await supabase
          .from("users")
          .select("role")
          .eq("id", userId)
          .maybeSingle();
        if (!qErr && userRow?.role) resolvedRole = userRow.role as string;
      }
      setRole(resolvedRole);
      return resolvedRole;
    }

    // Fallback for legacy/seeded users: verify password against `users.password_hash`.
    try {
      const { data: userRow, error: qErr } = await supabase
        .from("users")
        .select("id, password_hash, role")
        .eq("email", email)
        .maybeSingle();

      if (qErr || !userRow) throw error;

      const suppliedHash = await hashPassword(password);
      if (!userRow.password_hash || suppliedHash !== userRow.password_hash) {
        throw error;
      }

      // Treat as authenticated locally: set user/session in context so app behaves as signed-in.
      const fakeUser = { id: userRow.id, email } as unknown as User;
      const resolvedRole = (userRow.role as string) ?? "department_user";
      setUser(fakeUser);
      setSession({} as Session);
      setRole(resolvedRole);
      return resolvedRole;
    } catch (fallbackErr) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        role,
        loading,
        checkEmailExists,
        signUp,
        verifyOtp,
        resendOtp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
