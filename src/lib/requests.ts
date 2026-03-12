// src/lib/requests.ts
// Service layer for request CRUD operations via Supabase

import { supabase } from "./supabase";
import {
  createNotification,
  notifyUsersByRole,
} from "./notifications";

// ── Types ──────────────────────────────────────────────

export type RequestStatus =
  | "draft"
  | "request_sent"
  | "request_reviewed"
  | "pr_number_assigned"
  | "notice_of_meeting"
  | "endorsed_to_bac"
  | "resolution_approved"
  | "under_supplier_quotation"
  | "quotations_received"
  | "under_quotation_evaluation"
  | "hope_approval"
  | "abstract_prepared"
  | "contract_awarded"
  | "po_issued"
  | "ntp_issued"
  | "noa_po_ntp_posted"
  | "po_delivered"
  | "po_received_supply"
  | "items_for_inspection"
  | "under_inspection"
  | "under_warehousing"
  | "issuance"
  | "completed"
  | "returned_for_revision";

/** The ordered steps a request walks through (excluding returned_for_revision). */
export const STATUS_FLOW: RequestStatus[] = [
  "request_sent",
  "request_reviewed",
  "pr_number_assigned",
  "notice_of_meeting",
  "endorsed_to_bac",
  "resolution_approved",
  "under_supplier_quotation",
  "quotations_received",
  "under_quotation_evaluation",
  "hope_approval",
  "abstract_prepared",
  "contract_awarded",
  "po_issued",
  "ntp_issued",
  "noa_po_ntp_posted",
  "po_delivered",
  "po_received_supply",
  "items_for_inspection",
  "under_inspection",
  "under_warehousing",
  "issuance",
  "completed",
];

export const STATUS_LABELS: Record<RequestStatus, string> = {
  draft: "Draft",
  request_sent: "Request Sent",
  request_reviewed: "Request Reviewed and Validated",
  pr_number_assigned: "PR Number Assigned",
  notice_of_meeting: "Notice of Meeting",
  endorsed_to_bac: "Endorsed to BAC for Procurement Mode Evaluation",
  resolution_approved: "Resolution Approved",
  under_supplier_quotation: "Under Supplier Quotation Process",
  quotations_received: "Supplier Quotations Received",
  under_quotation_evaluation: "Under Quotation Evaluation",
  hope_approval: "For HoPE Approval of BAC Recommendation",
  abstract_prepared: "Abstract Prepared",
  contract_awarded: "Contract Awarded",
  po_issued: "Contract Signed and Purchase Order Issued",
  ntp_issued: "Notice to Proceed Issued",
  noa_po_ntp_posted: "NOA, PO/Contract and NTP Issued",
  po_delivered: "Purchase Order Delivered/Picked Up",
  po_received_supply: "Purchase Order Received by Supply Office",
  items_for_inspection: "Items Endorsed for Inspection",
  under_inspection: "Under Checking and Inspection",
  under_warehousing: "Under Storing and Warehousing for Inventory",
  issuance: "Issuance and Utilization to End-users",
  completed: "Issuance and Utilization Completed",
  returned_for_revision: "Returned to User for Revision",
};

/** Short labels for compact displays (pills, table headers). */
export const STATUS_SHORT_LABELS: Record<RequestStatus, string> = {
  draft: "Draft",
  request_sent: "Request Sent",
  request_reviewed: "Reviewed & Validated",
  pr_number_assigned: "PR Assigned",
  notice_of_meeting: "Notice of Meeting",
  endorsed_to_bac: "Endorsed to BAC",
  resolution_approved: "Resolution Approved",
  under_supplier_quotation: "Supplier Quotation",
  quotations_received: "Quotations Received",
  under_quotation_evaluation: "Quotation Eval",
  hope_approval: "HoPE Approval",
  abstract_prepared: "Abstract Prepared",
  contract_awarded: "Contract Awarded",
  po_issued: "PO Issued",
  ntp_issued: "NTP Issued",
  noa_po_ntp_posted: "NOA/PO/NTP Posted",
  po_delivered: "PO Delivered",
  po_received_supply: "Received by Supply",
  items_for_inspection: "For Inspection",
  under_inspection: "Under Inspection",
  under_warehousing: "Warehousing",
  issuance: "Issuance",
  completed: "Completed",
  returned_for_revision: "Returned for Revision",
};

export const STATUS_TONE: Record<RequestStatus, string> = {
  draft: "slate",
  request_sent: "gray",
  request_reviewed: "amber",
  pr_number_assigned: "amber",
  notice_of_meeting: "blue",
  endorsed_to_bac: "blue",
  resolution_approved: "blue",
  under_supplier_quotation: "blue",
  quotations_received: "blue",
  under_quotation_evaluation: "blue",
  hope_approval: "blue",
  abstract_prepared: "blue",
  contract_awarded: "green",
  po_issued: "green",
  ntp_issued: "green",
  noa_po_ntp_posted: "green",
  po_delivered: "violet",
  po_received_supply: "violet",
  items_for_inspection: "violet",
  under_inspection: "violet",
  under_warehousing: "violet",
  issuance: "emerald",
  completed: "emerald",
  returned_for_revision: "red",
};

/** Which role is responsible for advancing to each status. */
export type UserRole = "department_user" | "twg" | "procurement_admin" | "supply_admin";

export const STATUS_RESPONSIBLE_ROLE: Record<RequestStatus, UserRole> = {
  draft: "department_user",
  request_sent: "department_user",
  request_reviewed: "twg",
  pr_number_assigned: "procurement_admin",
  notice_of_meeting: "procurement_admin",
  endorsed_to_bac: "procurement_admin",
  resolution_approved: "procurement_admin",
  under_supplier_quotation: "procurement_admin",
  quotations_received: "procurement_admin",
  under_quotation_evaluation: "procurement_admin",
  hope_approval: "procurement_admin",
  abstract_prepared: "procurement_admin",
  contract_awarded: "procurement_admin",
  po_issued: "procurement_admin",
  ntp_issued: "procurement_admin",
  noa_po_ntp_posted: "procurement_admin",
  po_delivered: "supply_admin",
  po_received_supply: "supply_admin",
  items_for_inspection: "supply_admin",
  under_inspection: "supply_admin",
  under_warehousing: "supply_admin",
  issuance: "supply_admin",
  completed: "department_user",
  returned_for_revision: "twg",
};

/** Statuses grouped by responsible role (phase). */
export const ROLE_LABELS: Record<UserRole, string> = {
  department_user: "End User (Department)",
  twg: "Technical Working Group (TWG)",
  procurement_admin: "Procurement Office Administrator",
  supply_admin: "Supply Office Administrator",
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
  received_qty: number | null;
  damage_notes: string | null;
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

// ── Draft Management ───────────────────────────────────

/**
 * Save a new draft (no PR number, status = draft).
 * If a draftId is provided, updates the existing draft instead.
 */
export async function saveDraft(params: {
  draftId?: string;
  collegeId: string;
  programId: string;
  purpose?: string;
  fundSource?: string;
  createdBy: string;
  items: RequestItemInput[];
}): Promise<RequestRow> {
  const requestId = params.draftId ?? crypto.randomUUID();

  if (params.draftId) {
    // Update existing draft
    const { error: updateErr } = await supabase
      .from("requests")
      .update({
        purpose: params.purpose ?? null,
        fund_source: params.fundSource ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.draftId)
      .eq("status", "draft");
    if (updateErr) throw updateErr;

    // Replace items: delete old, insert new
    await supabase.from("request_items").delete().eq("request_id", params.draftId);
  } else {
    // Create new draft (no PR number)
    const { error: reqError } = await supabase
      .from("requests")
      .insert({
        id: requestId,
        pr_no: null,
        college_id: params.collegeId,
        program_id: params.programId,
        purpose: params.purpose ?? null,
        fund_source: params.fundSource ?? null,
        status: "draft" as RequestStatus,
        created_by: params.createdBy,
        updated_at: new Date().toISOString(),
      });
    if (reqError) throw reqError;
  }

  // Insert items
  if (params.items.length > 0) {
    const itemRows = params.items
      .filter((it) => it.itemDescription.trim())
      .map((item, idx) => ({
        id: crypto.randomUUID(),
        request_id: requestId,
        stock_no: String(idx + 1),
        qty: item.qty,
        item_description: item.itemDescription,
        uom: item.uom,
        unit_cost: item.unitCost ?? null,
        total_cost: item.unitCost ? item.unitCost * item.qty : null,
      }));

    if (itemRows.length > 0) {
      const { error: itemError } = await supabase.from("request_items").insert(itemRows);
      if (itemError) throw itemError;
    }
  }

  return { id: requestId, status: "draft" as RequestStatus } as RequestRow;
}

/** Fetch all drafts for a user. */
export async function fetchDrafts(userId: string): Promise<RequestRow[]> {
  const { data, error } = await supabase
    .from("requests")
    .select(
      `
      *,
      college:colleges(*),
      program:programs(*),
      items:request_items(*)
    `,
    )
    .eq("created_by", userId)
    .eq("status", "draft")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as RequestRow[];
}

/** Submit a draft: assign PR number, change status to request_sent. */
export async function submitDraft(
  draftId: string,
  userId: string,
): Promise<RequestRow> {
  const prNo = await generatePrNo();

  const { error: updateErr } = await supabase
    .from("requests")
    .update({
      pr_no: prNo,
      status: "request_sent" as RequestStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId)
    .eq("status", "draft");
  if (updateErr) throw updateErr;

  // Insert initial status log
  await supabase.from("request_status_logs").insert({
    id: crypto.randomUUID(),
    request_id: draftId,
    status: "request_sent",
    note: "Request created and sent",
    updated_by: userId,
  });

  // Notify TWG users
  await notifyUsersByRole({
    role: "twg",
    title: `New request ${prNo} submitted`,
    body: "A new procurement request needs review",
    type: "new_request",
    requestId: draftId,
  });

  return { id: draftId, pr_no: prNo, status: "request_sent" as RequestStatus } as RequestRow;
}

/** Delete a draft. */
export async function deleteDraft(draftId: string) {
  const { error } = await supabase
    .from("requests")
    .delete()
    .eq("id", draftId)
    .eq("status", "draft");
  if (error) throw error;
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
      status: "request_sent" as RequestStatus,
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
    status: "request_sent",
    note: "Request created and sent",
    updated_by: params.createdBy,
  });

  // Notify TWG users that a new request needs review
  await notifyUsersByRole({
    role: "twg",
    title: `New request ${prNo} submitted`,
    body: params.purpose || "A new procurement request needs review",
    type: "new_request",
    requestId: request.id,
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
  } else {
    // Exclude drafts from general listings
    query = query.neq("status", "draft");
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
  return fetchRequests({ status: "request_sent" });
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
  // ── Role-based guard: verify the user is allowed to set this status ──
  const { data: updater, error: userErr } = await supabase
    .from("users")
    .select("role")
    .eq("id", params.updatedBy)
    .single();

  if (userErr || !updater) {
    throw new Error("Could not verify user role.");
  }

  const userRole = updater.role as UserRole;
  const responsibleRole = STATUS_RESPONSIBLE_ROLE[params.newStatus];

  // Role must match the responsible role for the target status
  if (userRole !== responsibleRole) {
    throw new Error(
      `Your role (${ROLE_LABELS[userRole]}) is not authorized to set status to "${STATUS_LABELS[params.newStatus]}". ` +
        `This action requires: ${ROLE_LABELS[responsibleRole]}.`,
    );
  }

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
          statusLabel: STATUS_LABELS[params.newStatus] ?? params.newStatus,
          note: params.note,
        });
      } else {
        console.warn("[email-notify] No email found for creator");
      }

      // ── In-app notification to the request creator ──
      const prLabel = request.pr_no ?? "Request";
      const notifType =
        params.newStatus === "returned_for_revision"
          ? "return_note"
          : "status_update";

      await createNotification({
        userId: request.created_by,
        title: `${prLabel} — ${STATUS_SHORT_LABELS[params.newStatus]}`,
        body: params.note || `Status updated to ${STATUS_LABELS[params.newStatus]}`,
        type: notifType,
        requestId: params.requestId,
      });

      // ── In-app notification to the responsible role for the next step ──
      const nextIdx = STATUS_FLOW.indexOf(params.newStatus) + 1;
      const nextStatus = STATUS_FLOW[nextIdx] as RequestStatus | undefined;
      if (nextStatus) {
        const nextRole = STATUS_RESPONSIBLE_ROLE[nextStatus];
        // Only notify if the next responsible role differs from the updater's role
        if (nextRole !== userRole) {
          await notifyUsersByRole({
            role: nextRole,
            title: `${prLabel} needs your attention`,
            body: `${STATUS_LABELS[params.newStatus]} — ready for ${STATUS_SHORT_LABELS[nextStatus]}`,
            type: "new_request",
            requestId: params.requestId,
          });
        }
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
  userId: string,
  note?: string,
) {
  await updateRequestStatus({
    requestId,
    newStatus: "request_reviewed",
    updatedBy: userId,
    note: note || "Request reviewed and validated by TWG",
  });
}

export async function returnForRevision(
  requestId: string,
  userId: string,
  note?: string,
) {
  await updateRequestStatus({
    requestId,
    newStatus: "returned_for_revision",
    updatedBy: userId,
    note: note || "Returned to end user for revision",
  });
}

/** Advance a request to the next status in the flow. */
export async function advanceStatus(
  requestId: string,
  userId: string,
  nextStatus: RequestStatus,
  note?: string,
) {
  await updateRequestStatus({
    requestId,
    newStatus: nextStatus,
    updatedBy: userId,
    note: note ?? `Status updated to ${STATUS_LABELS[nextStatus]}`,
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
  let query = supabase.from("requests").select("status").neq("status", "draft");
  if (userId) query = query.eq("created_by", userId);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];

  // Group by phase for dashboard
  const twgStatuses: RequestStatus[] = ["request_reviewed", "pr_number_assigned"];
  const procurementStatuses: RequestStatus[] = [
    "notice_of_meeting", "endorsed_to_bac", "resolution_approved",
    "under_supplier_quotation", "quotations_received", "under_quotation_evaluation",
    "hope_approval", "abstract_prepared", "contract_awarded",
    "po_issued", "ntp_issued", "noa_po_ntp_posted",
  ];
  const supplyStatuses: RequestStatus[] = [
    "po_delivered", "po_received_supply", "items_for_inspection",
    "under_inspection", "under_warehousing", "issuance",
  ];

  return {
    total: rows.length,
    requestSent: rows.filter((r) => r.status === "request_sent").length,
    twgPhase: rows.filter((r) => twgStatuses.includes(r.status as RequestStatus)).length,
    procurementPhase: rows.filter((r) => procurementStatuses.includes(r.status as RequestStatus)).length,
    supplyPhase: rows.filter((r) => supplyStatuses.includes(r.status as RequestStatus)).length,
    completed: rows.filter((r) => r.status === "completed").length,
    returned: rows.filter((r) => r.status === "returned_for_revision").length,
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

// ── Receipt confirmation (department user) ───────────────

export interface ReceiptItemFeedback {
  itemId: string;
  receivedQty: number;
  damageNotes: string;
}

/**
 * Department user confirms receipt of items.
 * Saves per-item feedback and advances status to completed.
 */
export async function confirmReceipt(
  requestId: string,
  userId: string,
  items: ReceiptItemFeedback[],
  overallNote?: string,
) {
  // Update each item with received qty and damage notes
  for (const item of items) {
    const { error } = await supabase
      .from("request_items")
      .update({
        received_qty: item.receivedQty,
        damage_notes: item.damageNotes || null,
      })
      .eq("id", item.itemId);
    if (error) throw error;
  }

  // Build summary note
  const hasDamage = items.some((i) => i.damageNotes.trim());
  const summaryNote =
    overallNote ||
    (hasDamage
      ? "Items received with noted concerns. See item details."
      : "All items received in good condition.");

  // Advance to completed
  await updateRequestStatus({
    requestId,
    newStatus: "completed",
    updatedBy: userId,
    note: summaryNote,
  });
}
