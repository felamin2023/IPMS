import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // <-- adjust path if needed
import { fetchMonitoringUnreadTotal } from "../../lib/requests";
import { supabase } from "../../lib/supabase";
import {
  LayoutDashboard,
  FilePlus2,
  ClipboardList,
  CheckSquare,
  Activity,
  BarChart3,
  Settings2,
  FileText,
  HelpCircle,
  LogOut,
} from "lucide-react";

type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Roles allowed to see this item. If omitted, visible to all admin-like roles. */
  roles?: string[];
};

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  {
    label: "Create Request",
    to: "/admin/create-request",
    icon: FilePlus2,
    roles: ["department_user"],
  },
  { label: "Procurement Requests", to: "/admin/requests", icon: FileText },
  {
    label: "Approvals",
    to: "/admin/approvals",
    icon: CheckSquare,
    roles: ["accounting_admin"],
  },
  { label: "Monitoring", to: "/admin/monitoring", icon: Activity },
  {
    label: "Reports",
    to: "/admin/reports",
    icon: BarChart3,
    roles: ["procurement_admin"],
  },
  { label: "Settings", to: "/admin/settings", icon: Settings2 },
  { label: "Support", to: "/admin/support", icon: HelpCircle },
];

export default function AdminNav({ hideBrand }: { hideBrand?: boolean }) {
  const { signOut, role, user } = useAuth();
  const [monitoringUnread, setMonitoringUnread] = useState(0);

  const loadMonitoringUnread = useCallback(async () => {
    if (!user?.id) {
      setMonitoringUnread(0);
      return;
    }

    try {
      const total = await fetchMonitoringUnreadTotal({
        userId: user.id,
        role,
      });
      setMonitoringUnread(total);
    } catch {
      // no-op for nav badge
    }
  }, [user?.id, role]);

  useEffect(() => {
    if (!user?.id) {
      setMonitoringUnread(0);
      return;
    }

    void loadMonitoringUnread();

    const refresh = () => {
      void loadMonitoringUnread();
    };

    const channel = supabase
      .channel(`admin-nav-monitoring-unread-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "request_messages",
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "request_message_reads",
          filter: `user_id=eq.${user.id}`,
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "request_message_reads",
          filter: `user_id=eq.${user.id}`,
        },
        refresh,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, loadMonitoringUnread]);

  const visibleItems = navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  );

  return (
    <aside className="h-full w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Brand */}
      {!hideBrand && (
        <div className="h-17 flex px-3.5 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div className="text-lg font-semibold tracking-tight">ARMS</div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="p-3.5 flex-1">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
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
                      {item.to === "/admin/monitoring" &&
                        monitoringUnread > 0 && (
                          <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
                            {monitoringUnread > 99 ? "99+" : monitoringUnread}
                          </span>
                        )}
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
