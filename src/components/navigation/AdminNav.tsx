import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // <-- adjust path if needed
import {
  LayoutDashboard,
  FilePlus2,
  ClipboardList,
  CheckSquare,
  Activity,
  BarChart3,
  Settings2,
  FileText,
  LogOut,
} from "lucide-react";

type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Create Request", to: "/admin/create-request", icon: FilePlus2 },
  { label: "Procurement Requests", to: "/admin/requests", icon: FileText },
  { label: "Approvals", to: "/admin/approvals", icon: CheckSquare },
  { label: "Monitoring", to: "/admin/monitoring", icon: Activity },
  { label: "Reports", to: "/admin/reports", icon: BarChart3 },
  { label: "Settings", to: "/admin/settings", icon: Settings2 },
];

export default function AdminNav({ hideBrand }: { hideBrand?: boolean }) {
  const { signOut } = useAuth();

  return (
    <aside className="h-full w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Brand */}
      {!hideBrand && (
        <div className="h-17 flex px-3.5 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div className="text-lg font-semibold tracking-tight">IPMS</div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="p-3.5 flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={[
                          "h-5 w-5 transition-colors",
                          isActive
                            ? "text-blue-600"
                            : "text-gray-500 group-hover:text-gray-700",
                        ].join(" ")}
                      />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
        {/* Mobile-only sign out so it's always reachable on small screens */}
        <div className="mt-3 md:hidden">
          <button
            type="button"
            onClick={signOut}
            className="w-full group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Sign out (sticks to bottom) */}
      <div className="p-3.5 border-t border-gray-200 shrink-0">
        <button
          type="button"
          onClick={signOut}
          className="w-full group flex items-center gap-3 rounded-xl px-4 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          <LogOut className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
