// src/lib/notifications.ts
// Service layer for in-app notifications

import { supabase } from "./supabase";

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  request_id: string | null;
  read: boolean;
  created_at: string;
}

// ── Create Notification ───────────────────────────────

export async function createNotification(params: {
  userId: string;
  title: string;
  body: string;
  type: string;
  requestId?: string;
}) {
  const { error } = await supabase.from("notifications").insert({
    id: crypto.randomUUID(),
    user_id: params.userId,
    title: params.title,
    body: params.body,
    type: params.type,
    request_id: params.requestId ?? null,
  });
  if (error) console.error("Failed to create notification:", error);
}

// ── Fetch Notifications ───────────────────────────────

export async function fetchNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as NotificationRow[];
}

// ── Mark as Read ──────────────────────────────────────

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw error;
}

// ── Notify users by role ──────────────────────────────

/**
 * Send a notification to all users with a given role.
 * Used when a request status changes and the next responsible role
 * needs to be alerted.
 */
export async function notifyUsersByRole(params: {
  role: string;
  title: string;
  body: string;
  type: string;
  requestId?: string;
}) {
  const { data: users, error } = await supabase
    .from("users")
    .select("id")
    .eq("role", params.role);

  if (error || !users) {
    console.error("Failed to fetch users for notification:", error);
    return;
  }

  const rows = users.map((u) => ({
    id: crypto.randomUUID(),
    user_id: u.id,
    title: params.title,
    body: params.body,
    type: params.type,
    request_id: params.requestId ?? null,
  }));

  if (rows.length > 0) {
    const { error: insErr } = await supabase.from("notifications").insert(rows);
    if (insErr) console.error("Failed to batch-insert notifications:", insErr);
  }
}
