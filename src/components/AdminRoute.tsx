import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ADMIN_ROLES = ["twg", "procurement_admin", "supply_admin"];

/**
 * Wraps admin-only routes.
 * Allows admin, twg, procurement_admin, and supply_admin roles.
 */
export default function AdminRoute() {
  const { user, role, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/signin" replace />;
  if (!role || !ADMIN_ROLES.includes(role)) return <Navigate to="/" replace />;

  return <Outlet />;
}
