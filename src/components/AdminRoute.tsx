import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wraps admin-only routes.
 * For now it checks a custom claim or user_metadata.role === "ADMIN".
 * Adjust the check based on how you store roles (e.g. Prisma lookup, Supabase RLS, etc.).
 */
export default function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/signin" replace />;

  const role = (user.user_metadata as { role?: string })?.role;
  if (role !== "ADMIN") return <Navigate to="/" replace />;

  return <Outlet />;
}
