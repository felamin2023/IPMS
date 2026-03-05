// src/lib/requests.ts
// Service layer for request CRUD operations via Supabase

import { supabase } from "./supabase";

// ── Types ──────────────────────────────────────────────

export type RequestStatus =
  | "submitted"
  | "head_review"
  | "budget_review"
  | "procurement_processing"
  | "purchase_order"
  | "rejected";

/** The ordered steps a request walks through (excluding rejected). */
export const STATUS_FLOW: RequestStatus[] = [
  "submitted",
  "head_review",
  "budget_review",
  "procurement_processing",
  "purchase_order",
];

export const STATUS_LABELS: Record<RequestStatus, string> = {
  submitted: "Request Submitted",
  head_review: "Head Review",
  budget_review: "Budget Review",
  procurement_processing: "Procurement Processing",
  purchase_order: "Purchase Order",
  rejected: "Rejected",
};

export const STATUS_TONE: Record<RequestStatus, string> = {
  submitted: "gray",
  head_review: "amber",
  budget_review: "blue",
  procurement_processing: "green",
  purchase_order: "violet",
  rejected: "red",
};

export interface RequestItemInput {
  qty: number;
  itemDescription: string;
  uom: string;
  unitCost?: number;
}

export interface RequestRow {
  id: string;
  pr_no: string | null;
  college_id: string;
  program_id: string;
  purpose: string | null;
  fund_source: string | null;
  status: RequestStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  // joined
  college?: { id: string; code: string; name: string };
  program?: { id: string; code: string; name: string };
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  };
  items?: RequestItemRow[];
  status_logs?: StatusLogRow[];
}

export interface RequestItemRow {
  id: string;
  request_id: string;
  stock_no: string | null;
  qty: number;
  item_description: string;
  uom: string;
  unit_cost: number | null;
  total_cost: number | null;
}

export interface StatusLogRow {
  id: string;
  request_id: string;
  status: string;
  note: string | null;
  updated_by: string;
  created_at: string;
  updater?: { id: string; first_name: string; last_name: string };
}

// ── PR Number generation ───────────────────────────────

async function generatePrNo(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PR-${year}-`;

  // Get the highest existing PR number for this year
  const { data } = await supabase
    .from("requests")
    .select("pr_no")
    .like("pr_no", `${prefix}%`)
    .order("pr_no", { ascending: false })
    .limit(1);

  let seq = 1;
  if (data && data.length > 0 && data[0].pr_no) {
    const last = data[0].pr_no as string;
    const lastSeq = parseInt(last.replace(prefix, ""), 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

// ── Create Request ─────────────────────────────────────

export async function createRequest(params: {
  collegeId: string;
  programId: string;
  purpose: string;
  fundSource?: string;
  createdBy: string;
  items: RequestItemInput[];
}) {
  const prNo = await generatePrNo();

  const requestId = crypto.randomUUID();

  // Insert the request
  const { data: request, error: reqError } = await supabase
    .from("requests")
    .insert({
      id: requestId,
      pr_no: prNo,
      college_id: params.collegeId,
      program_id: params.programId,
      purpose: params.purpose,
      fund_source: params.fundSource ?? null,
      status: "submitted" as RequestStatus,
      created_by: params.createdBy,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (reqError) throw reqError;

  // Insert items (stock_no auto-generated from item index)
  if (params.items.length > 0) {
    const itemRows = params.items.map((item, idx) => ({
      id: crypto.randomUUID(),
      request_id: request.id,
      stock_no: String(idx + 1),
      qty: item.qty,
      item_description: item.itemDescription,
      uom: item.uom,
      unit_cost: item.unitCost ?? null,
      total_cost: item.unitCost ? item.unitCost * item.qty : null,
    }));

    const { error: itemError } = await supabase
      .from("request_items")
      .insert(itemRows);
    if (itemError) throw itemError;
  }

  // Insert initial status log
  await supabase.from("request_status_logs").insert({
    id: crypto.randomUUID(),
    request_id: request.id,
    status: "submitted",
    note: "Request submitted",
    updated_by: params.createdBy,
  });

  return { ...request, pr_no: prNo } as RequestRow;
}

// ── Fetch Requests ────────────────────────────────────

export async function fetchRequests(filters?: {
  status?: RequestStatus;
  createdBy?: string;
}) {
  let query = supabase
    .from("requests")
    .select(
      `
      *,
      college:colleges(*),
      program:programs(*),
      creator:users!requests_created_by_fkey(id, first_name, last_name, email),
      items:request_items(*),
      status_logs:request_status_logs(*, updater:users!request_status_logs_updated_by_fkey(id, first_name, last_name))
    `,
    )
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.createdBy) {
    query = query.eq("created_by", filters.createdBy);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as RequestRow[];
}

export async function fetchRequestById(id: string) {
  const { data, error } = await supabase
    .from("requests")
    .select(
      `
      *,
      college:colleges(*),
      program:programs(*),
      creator:users!requests_created_by_fkey(id, first_name, last_name, email),
      items:request_items(*),
      status_logs:request_status_logs(*, updater:users!request_status_logs_updated_by_fkey(id, first_name, last_name))
    `,
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as RequestRow;
}

// ── Fetch pending requests for approval ────────────────

export async function fetchPendingRequests() {
  return fetchRequests({ status: "submitted" });
}

// ── Send status-update email via Edge Function ─────────

async function sendStatusEmail(params: {
  email: string;
  recipientName: string;
  prNo: string;
  statusLabel: string;
  note?: string;
}) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "send-status-email",
      {
        body: {
          email: params.email,
          recipientName: params.recipientName,
          prNo: params.prNo,
          statusLabel: params.statusLabel,
          note: params.note ?? null,
        },
      },
    );
    if (error) console.error("Status email error:", error);
    else console.log("Status email sent:", data);
  } catch (err) {
    // Don't throw — email failure should not block the status update
    console.error("Failed to send status email:", err);
  }
}

// ── Update Request Status ──────────────────────────────

export async function updateRequestStatus(params: {
  requestId: string;
  newStatus: RequestStatus;
  updatedBy: string;
  note?: string;
}) {
  const { error: updateError } = await supabase
    .from("requests")
    .update({ status: params.newStatus, updated_at: new Date().toISOString() })
    .eq("id", params.requestId);

  if (updateError) throw updateError;

  // Insert status log
  const { error: logError } = await supabase
    .from("request_status_logs")
    .insert({
      id: crypto.randomUUID(),
      request_id: params.requestId,
      status: params.newStatus,
      note: params.note ?? null,
      updated_by: params.updatedBy,
    });

  if (logError) throw logError;

  // Send email notification to the request creator (fire-and-forget)
  try {
    const { data: request, error: fetchErr } = await supabase
      .from("requests")
      .select(
        "pr_no, created_by, creator:users!requests_created_by_fkey(email, first_name, last_name)",
      )
      .eq("id", params.requestId)
      .single();

    console.log("[email-notify] request data:", JSON.stringify(request));
    if (fetchErr) console.error("[email-notify] fetch error:", fetchErr);

    if (request?.creator) {
      // Supabase may return the joined row as an object or a single-element array
      const raw = request.creator as unknown;
      const creator = (Array.isArray(raw) ? raw[0] : raw) as {
        email: string | null;
        first_name: string;
        last_name: string;
      } | null;

      console.log("[email-notify] creator:", JSON.stringify(creator));

      if (creator?.email) {
        console.log("[email-notify] Sending email to:", creator.email);
        sendStatusEmail({
          email: creator.email,
          recipientName: `${creator.first_name} ${creator.last_name}`,
          prNo: request.pr_no ?? params.requestId,
          statusLabel: STATUS_LABELS[params.newStatus],
          note: params.note,
        });
      } else {
        console.warn("[email-notify] No email found for creator");
      }
    } else {
      console.warn("[email-notify] No creator found on request");
    }
  } catch (err) {
    console.error("Could not fetch request for email notification:", err);
  }
}

// ── Accept/Reject by Department Head ───────────────────

export async function approveRequest(
  requestId: string,
  adminId: string,
  note?: string,
) {
  await updateRequestStatus({
    requestId,
    newStatus: "head_review",
    updatedBy: adminId,
    note: note || "Reviewed by Department Head",
  });
}

export async function rejectRequest(
  requestId: string,
  adminId: string,
  note?: string,
) {
  await updateRequestStatus({
    requestId,
    newStatus: "rejected",
    updatedBy: adminId,
    note: note || "Rejected by Department Head",
  });
}

// ── Fetch colleges and programs ────────────────────────

export async function fetchColleges() {
  const { data, error } = await supabase
    .from("colleges")
    .select("*")
    .order("code");
  if (error) throw error;
  return data ?? [];
}

export async function fetchPrograms(collegeId?: string) {
  let query = supabase
    .from("programs")
    .select("*")
    .eq("is_active", true)
    .order("code");
  if (collegeId) query = query.eq("college_id", collegeId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// ── Stats ──────────────────────────────────────────────

export async function fetchRequestStats(userId?: string) {
  let query = supabase.from("requests").select("status");
  if (userId) query = query.eq("created_by", userId);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  return {
    total: rows.length,
    submitted: rows.filter((r) => r.status === "submitted").length,
    headReview: rows.filter((r) => r.status === "head_review").length,
    budgetReview: rows.filter((r) => r.status === "budget_review").length,
    procurementProcessing: rows.filter(
      (r) => r.status === "procurement_processing",
    ).length,
    purchaseOrder: rows.filter((r) => r.status === "purchase_order").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
  };
}

// ── User profile helper ────────────────────────────────

export async function fetchUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*, college:colleges(*), program:programs(*)")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}
