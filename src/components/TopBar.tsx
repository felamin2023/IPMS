import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Bell,
  Menu,
  User as UserIcon,
  MoreHorizontal,
  FileText,
  CheckCircle2,
  ShoppingCart,
} from "lucide-react";

interface TopBarProps {
  onOpenMobile?: () => void;
}

type NotifItem = {
  id: number;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
};

export default function TopBar({ onOpenMobile }: TopBarProps) {
  const { user, role } = useAuth();

  const prettyRole = role === "admin" ? "Administrator" : "Procurement Officer";
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.email ? user.email.split("@")[0] : "Guest");

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<"all" | "unread">("all");
  const notifRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleDocClick(e: MouseEvent) {
      const target = e.target as Node | null;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
    }

    if (notifOpen) document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [notifOpen]);

  const notifications: NotifItem[] = [
    {
      id: 1,
      title: "PR-2024-0248 needs your approval",
      desc: "Office Supplies — Accounting Dept",
      time: "2h",
      unread: true,
      icon: FileText,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      id: 2,
      title: "PO #123 has been created",
      desc: "Laboratory Equipment order confirmed",
      time: "1d",
      unread: true,
      icon: ShoppingCart,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      id: 3,
      title: "PR-2024-0245 completed",
      desc: "Furniture — Faculty Lounge delivered",
      time: "3d",
      unread: false,
      icon: CheckCircle2,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
  ];

  const visibleNotifs =
    notifTab === "unread"
      ? notifications.filter((n) => n.unread)
      : notifications;
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 h-17 md:px-6 shrink-0">
      {/* Mobile hamburger */}
      <button
        type="button"
        aria-label="Open navigation"
        className="md:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        onClick={onOpenMobile}
      >
        <Menu className="h-5 w-5" />
      </button>

      <input
        aria-label="Search requests"
        className="flex-1 min-w-0 max-w-md rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm"
        placeholder="Search requests..."
      />

      <div className="ml-auto flex items-center gap-3">
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={notifOpen}
            onClick={() => setNotifOpen((s) => !s)}
            className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-50 hover:text-gray-800"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl ring-1 ring-black/5 overflow-hidden z-30">
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h3 className="text-2xl font-bold text-gray-900">
                  Notifications
                </h3>
                <button
                  className="h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-4 pb-2">
                {(["all", "unread"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setNotifTab(tab)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                      notifTab === tab
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Section label */}
              <div className="flex items-center justify-between px-4 pt-2 pb-1">
                <span className="text-sm font-semibold text-gray-900">
                  {notifTab === "unread" ? "Unread" : "Recent"}
                </span>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  See all
                </button>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {visibleNotifs.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    No notifications
                  </div>
                ) : (
                  visibleNotifs.map((n) => {
                    const Icon = n.icon;
                    return (
                      <button
                        key={n.id}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                          n.unread ? "bg-blue-50/50" : ""
                        }`}
                      >
                        {/* Avatar / icon */}
                        <div className="relative flex-shrink-0">
                          <div
                            className={`h-12 w-12 rounded-full ${n.iconBg} flex items-center justify-center`}
                          >
                            <Icon className={`h-5 w-5 ${n.iconColor}`} />
                          </div>
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p
                            className={`text-[13px] leading-snug ${
                              n.unread
                                ? "font-semibold text-gray-900"
                                : "text-gray-600"
                            }`}
                          >
                            {n.title}
                          </p>
                          <p className="text-[13px] leading-snug text-gray-500">
                            {n.desc}
                          </p>
                          <span
                            className={`mt-0.5 block text-xs ${
                              n.unread
                                ? "text-blue-600 font-semibold"
                                : "text-gray-400"
                            }`}
                          >
                            {n.time} ago
                          </span>
                        </div>

                        {/* Unread dot */}
                        {n.unread && (
                          <span className="mt-4 flex-shrink-0 h-3 w-3 rounded-full bg-blue-600" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <UserIcon className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-sm">
            <div className="font-medium text-gray-900 leading-tight">
              {displayName}
            </div>
            <div className="text-xs text-gray-500 leading-tight">
              {prettyRole}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
