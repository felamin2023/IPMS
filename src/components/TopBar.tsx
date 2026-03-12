import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Bell,
  Menu,
  User as UserIcon,
  MoreHorizontal,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Inbox,
} from "lucide-react";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationRow,
} from "../lib/notifications";

interface TopBarProps {
  onOpenMobile?: () => void;
}

export default function TopBar({ onOpenMobile }: TopBarProps) {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const roleLabels: Record<string, string> = {
    department_user: "End User (Department)",
    twg: "Technical Working Group",
    procurement_admin: "Procurement Administrator",
    supply_admin: "Supply Administrator",
  };
  const prettyRole = role ? (roleLabels[role] ?? role) : "User";
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.email ? user.email.split("@")[0] : "Guest");

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<"all" | "unread">("all");
  const notifRef = useRef<HTMLDivElement | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  // Fetch notifications on mount and every 30 seconds
  const loadNotifs = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Look up internal user id from auth id
      const { data: profile } = await (await import("../lib/requests")).fetchUserProfile(user.id).then((p: any) => ({ data: p })).catch(() => ({ data: null }));
      const internalId = profile?.id;
      if (!internalId) return;
      const rows = await fetchNotifications(internalId);
      setNotifications(rows);
    } catch {
      // silently ignore
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifs();
    const timer = setInterval(loadNotifs, 30_000);
    return () => clearInterval(timer);
  }, [loadNotifs]);

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

  function notifIcon(type: string) {
    switch (type) {
      case "return_note":
        return { icon: AlertTriangle, bg: "bg-red-100", color: "text-red-600" };
      case "new_request":
        return { icon: Inbox, bg: "bg-amber-100", color: "text-amber-600" };
      case "receipt_confirmed":
        return { icon: CheckCircle2, bg: "bg-green-100", color: "text-green-600" };
      default:
        return { icon: FileText, bg: "bg-blue-100", color: "text-blue-600" };
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  }

  async function handleNotifClick(n: NotificationRow) {
    if (!n.read) {
      await markNotificationRead(n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    setNotifOpen(false);
    // Navigate to appropriate page based on role
    if (n.request_id) {
      if (role === "department_user") {
        navigate("/requests");
      } else {
        navigate("/admin/requests");
      }
    }
  }

  async function handleMarkAllRead() {
    if (!user?.id) return;
    try {
      const { fetchUserProfile } = await import("../lib/requests");
      const profile = await fetchUserProfile(user.id);
      if (profile?.id) {
        await markAllNotificationsRead(profile.id);
        setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
      }
    } catch {
      // silently ignore
    }
  }

  const visibleNotifs =
    notifTab === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

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
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {visibleNotifs.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    No notifications
                  </div>
                ) : (
                  visibleNotifs.map((n) => {
                    const { icon: Icon, bg, color } = notifIcon(n.type);
                    return (
                      <button
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                          !n.read ? "bg-blue-50/50" : ""
                        }`}
                      >
                        {/* Avatar / icon */}
                        <div className="relative flex-shrink-0">
                          <div
                            className={`h-12 w-12 rounded-full ${bg} flex items-center justify-center`}
                          >
                            <Icon className={`h-5 w-5 ${color}`} />
                          </div>
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p
                            className={`text-[13px] leading-snug ${
                              !n.read
                                ? "font-semibold text-gray-900"
                                : "text-gray-600"
                            }`}
                          >
                            {n.title}
                          </p>
                          <p className="text-[13px] leading-snug text-gray-500">
                            {n.body}
                          </p>
                          <span
                            className={`mt-0.5 block text-xs ${
                              !n.read
                                ? "text-blue-600 font-semibold"
                                : "text-gray-400"
                            }`}
                          >
                            {timeAgo(n.created_at)} ago
                          </span>
                        </div>

                        {/* Unread dot */}
                        {!n.read && (
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
