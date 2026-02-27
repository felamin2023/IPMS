// src/components/navigation/UserNav.tsx
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // same style as AdminNav
import {
  Home,
  FilePlus2,
  FileText,
  Activity,
  ClipboardList,
  Settings2,
  LogOut,
} from "lucide-react";

type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { label: "Home", to: "/", icon: Home },
  { label: "Create Request", to: "/create-request", icon: FilePlus2 },
  { label: "Procurement Requests", to: "/requests", icon: FileText },
  { label: "Monitoring", to: "/monitoring", icon: Activity },
  { label: "Settings", to: "/settings", icon: Settings2 },
];

export default function UserNav({ hideBrand }: { hideBrand?: boolean }) {
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
                  end={item.to === "/"} // Home active only on "/"
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
