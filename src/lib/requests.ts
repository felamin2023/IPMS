// src/lib/requests.ts
// Service layer for request CRUD operations via Supabase

import { supabase } from "./supabase";
import { createNotification, notifyUsersByRole } from "./notifications";

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
  | "items_for_inspection"
  | "under_inspection"
  | "under_warehousing"
  | "issuance"
  | "completed"
  | "returned_for_revision"
  | "returned_for_action";

// Keep legacy statuses for backwards compatibility with historical logs.
export type LegacyRequestStatus = "pr_number_assigned";

/** The ordered steps a request walks through (excluding returned_for_revision). */
export const STATUS_FLOW: RequestStatus[] = [
  "request_sent",
  "request_reviewed",
  "endorsed_to_bac",
  "resolution_approved",
  "under_supplier_quotation",
  "quotations_received",
  "notice_of_meeting",
  "under_quotation_evaluation",
  "hope_approval",
  "abstract_prepared",
  "contract_awarded",
  "noa_po_ntp_posted",
  "po_issued",
  "ntp_issued",
  "po_delivered",
  "items_for_inspection",
  "under_inspection",
  "under_warehousing",
  "issuance",
  "completed",
];

export function normalizeFlowStatus(
  status: RequestStatus | string,
): RequestStatus {
  return status === "po_received_supply"
    ? "po_delivered"
    : (status as RequestStatus);
}

export const STATUS_LABELS: Record<RequestStatus, string> = {
  draft: "Draft",
  request_sent: "Request Sent",
  request_reviewed: "Purchase Request Reviewed and Validated",
  pr_number_assigned: "PR Number Assigned (Legacy)",
  notice_of_meeting: "Notice of Meeting",
  endorsed_to_bac:
    "Endorsed to BAC for Evaluation and Determination of the Mode of Purchase",
  resolution_approved: "Resolution Approved",
  under_supplier_quotation: "Canvassing in Progress",
  quotations_received: "Supplier Quotations Received",
  under_quotation_evaluation: "Opening of Bids",
  hope_approval: "A Resolution Recommending the Award of Contract",
  abstract_prepared: "Abstract of Quotations Prepared",
  contract_awarded: "Notice of Award Sent to Supplier",
  po_issued: "Purchase Order Created and Issued",
  ntp_issued: "Notice to Proceed Issued",
  noa_po_ntp_posted: "Signed Notice of Award is Returned to Procurement",
  po_delivered: "Purchase Order Delivered/Picked Up",
  items_for_inspection: "Items Endorsed for Inspection",
  under_inspection: "Under Checking and Inspection",
  under_warehousing: "Under Storing and Warehousing for Inventory",
  issuance: "Issuance and Utilization Completed",
  completed: "Procurement Complete",
  returned_for_revision: "Returned to User for Revision",
  returned_for_action: "Returned to User for Personal Action",
};

/** Default notes for each status step to be saved in logs or displayed to users. */
export const DEFAULT_STATUS_NOTES: Record<RequestStatus, string> = {
  draft: "Request is in draft mode.",
  request_sent:
    "The end-user has created and sent a purchase request. PR numbers are assigned automatically.",
  request_reviewed:
    "The Accounting Administrator has reviewed and validated the purchase request and issued certification as to source of allotment.",
  pr_number_assigned: "PR Number has been assigned.",
  notice_of_meeting:
    "Notice of meeting has been sent to BAC, Accounting Administrator, and end-user.",
  endorsed_to_bac:
    "Purchase request has been endorsed to BAC for evaluation and determination of the mode of purchase.",
  resolution_approved:
    "The resolution has been approved by HoPE/Campus Director.",
  under_supplier_quotation: "Supplier canvassing is in progress.",
  quotations_received:
    "The Procurement Office has received quotations from suppliers.",
  under_quotation_evaluation:
    "Submitted bids are being opened and recorded for evaluation.",
  hope_approval: "Contract awarding.",
  abstract_prepared: "Formal Abstract of Supplier Bids issued.",
  contract_awarded: "Notice of Award (NOA) issued to supplier.",
  po_issued: "Purchase Order created and issued.",
  ntp_issued: "Notice to Proceed issued to the winning supplier.",
  noa_po_ntp_posted:
    "The supplier/awardee has signed the Notice of Award and returned it to the Procurement Office.",
  po_delivered: "Purchase order is delivered/picked up.",
  items_for_inspection:
    "Items are endorsed for inspection for conformance to specifications.",
  under_inspection:
    "Items delivered are checked and inspected against the Purchase Order.",
  under_warehousing:
    "Items received are stored for book recording and inventory purposes.",
  issuance: "Items are issued to the end-users and utilization is completed.",
  completed: "Procurement complete.",
  returned_for_revision: "Request returned to user for revision.",
  returned_for_action:
    "Request returned to user for personal action outside the system.",
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
  under_supplier_quotation: "Canvassing",
  quotations_received: "Quotations Received",
  under_quotation_evaluation: "Opening of Bids",
  hope_approval: "Contract Awarding",
  abstract_prepared: "Abstract Prepared",
  contract_awarded: "Notice of Award",
  po_issued: "PO Issued",
  ntp_issued: "NTP Issued",
  noa_po_ntp_posted: "NOA Returned",
  po_delivered: "PO Delivered",
  items_for_inspection: "For Inspection",
  under_inspection: "Under Inspection",
  under_warehousing: "Warehousing",
  issuance: "Issuance Complete",
  completed: "Complete",
  returned_for_revision: "Returned for Revision",
  returned_for_action: "Returned for Personal Fix",
};

export const OLD_NOTES_MAP: Record<string, string> = {
  "Request created and sent":
    "End-user has created and sent a purchase request.",
  "Request reviewed and validated by TWG":
    "The Accounting Administrator has reviewed and validated the purchase request and issued certification as to source of allotment.",
  "Status updated to Request Reviewed and Validated":
    "The Accounting Administrator has reviewed and validated the purchase request and issued certification as to source of allotment.",
  "Status updated to PR Number Assigned": "PR Number has been assigned.",
  "Status updated to Notice of Meeting":
    "Notice of meeting has been sent to BAC, Accounting Administrator, and end-user.",
  "Status updated to Endorsed to BAC for Procurement Mode Evaluation":
    "Purchase request has been endorsed to BAC for evaluation and determination of the mode of purchase.",
  "Status updated to Resolution Approved":
    "The resolution has been approved by HoPE/Campus Director.",
  "Status updated to Under Supplier Quotation Process":
    "Supplier canvassing is in progress.",
  "Status updated to Supplier Quotations Received":
    "The Procurement Office has received quotations from suppliers.",
  "Status updated to Under Quotation Evaluation":
    "Submitted bids are being opened and recorded for evaluation.",
  "Status updated to For HoPE Approval of BAC Recommendation":
    "Resolution recommending award of contract is being prepared.",
  "Status updated to Abstract Prepared":
    "Formal Abstract of Supplier Bids issued.",
  "Status updated to Contract Awarded":
    "Notice of Award (NOA) sent to supplier.",
  "Status updated to Contract Signed and Purchase Order Issued":
    "Purchase Order created and issued.",
  "Status updated to Notice to Proceed Issued":
    "Notice to Proceed Issued to the winning supplier.",
  "Status updated to NOA, PO/Contract and NTP Issued":
    "Signed Notice of Award returned to Procurement Office.",
  "Status updated to Purchase Order Delivered/Picked Up":
    "Purchase order is delivered/picked up.",
  "Status updated to Purchase Order Received by Supply Office":
    "Purchase Order Received by the Supply Office from the supplier.",
  "Status updated to Items Endorsed for Inspection":
    "Items are endorsed for inspection for conformance of items to specifications.",
  "Status updated to Under Checking and Inspection":
    "Items delivered are checked and inspected against the Purchase Order.",
  "Status updated to Under Storing and Warehousing for Inventory":
    "Items received are stored for book recording and inventory purposes.",
  "Status updated to Issuance and Utilization to End-users":
    "Items are issued to the end-users and utilization is completed.",
  "Status updated to Issuance and Utilization Completed":
    "Procurement complete.",
};

export function getDisplayNote(
  status: RequestStatus | string,
  note: string | null,
) {
  if (!note) return null;
  if (OLD_NOTES_MAP[note]) return OLD_NOTES_MAP[note];
  const asStatus = status as RequestStatus;
  if (
    STATUS_LABELS[asStatus] &&
    note === `Status updated to ${STATUS_LABELS[asStatus]}`
  ) {
    return DEFAULT_STATUS_NOTES[asStatus] ?? note;
  }
  return note;
}

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
  items_for_inspection: "violet",
  under_inspection: "violet",
  under_warehousing: "violet",
  issuance: "emerald",
  completed: "emerald",
  returned_for_revision: "red",
  returned_for_action: "red",
};

/** Which role is responsible for advancing to each status. */
export type UserRole =
  | "department_user"
  | "accounting_admin"
  | "procurement_admin"
  | "supply_admin";

export const STATUS_RESPONSIBLE_ROLE: Record<RequestStatus, UserRole> = {
  draft: "department_user",
  request_sent: "department_user",
  request_reviewed: "accounting_admin",
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
  items_for_inspection: "supply_admin",
  under_inspection: "supply_admin",
  under_warehousing: "supply_admin",
  issuance: "supply_admin",
  completed: "department_user",
  returned_for_revision: "accounting_admin",
  // Fallback owner for display only; authorization for this status is handled in updateRequestStatus.
  returned_for_action: "procurement_admin",
};

const RETURN_STATUS_ALLOWED_ROLES: UserRole[] = [
  "accounting_admin",
  "procurement_admin",
  "supply_admin",
];

/** Statuses grouped by responsible role (phase). */
export const ROLE_LABELS: Record<UserRole, string> = {
  department_user: "End User (Department)",
  accounting_admin: "Accounting Administrator",
  procurement_admin: "Procurement Office Administrator",
  supply_admin: "Supply Office Administrator",
};

export function normalizeUserRole(
  role: string | null | undefined,
): UserRole | null {
  if (
    role === "department_user" ||
    role === "accounting_admin" ||
    role === "procurement_admin" ||
    role === "supply_admin"
  ) {
    return role;
  }
  return null;
}

/**
 * Returns which role currently handles the request at its current status.
 * This is computed from the next workflow status owner.
 */
export function getChatHandlerRole(status: RequestStatus): UserRole | null {
  if (status === "completed") {
    return null;
  }

  if (status === "returned_for_revision" || status === "returned_for_action") {
    return "department_user";
  }

  const idx = STATUS_FLOW.indexOf(normalizeFlowStatus(status));
  if (idx < 0 || idx >= STATUS_FLOW.length - 1) {
    return null;
  }

  const nextStatus = STATUS_FLOW[idx + 1];
  return STATUS_RESPONSIBLE_ROLE[nextStatus];
}

export function shouldShowUnreadChatForStatus(params: {
  role: string | null | undefined;
  status: RequestStatus;
}) {
  const normalizedRole = normalizeUserRole(params.role);
  if (!normalizedRole) {
    return false;
  }

  if (normalizedRole === "department_user") {
    return true;
  }

  return getChatHandlerRole(params.status) === normalizedRole;
}

export interface RequestItemInput {
  qty: number;
  itemDescription: string;
  category?: string;
  preferredBrand?: string;
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
  requested_by?: string | null;
  requested_by_designation?: string | null;
  reviewed_by?: string | null;
  reviewed_by_designation?: string | null;
  contract_amount?: number | null;
  contract_file_url?: string | null;
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
  pr_groups?: RequestPrGroupRow[];
}

export interface RequestItemRow {
  id: string;
  request_id: string;
  stock_no: string | null;
  qty: number;
  item_description: string;
  category?: string | null;
  preferred_brand?: string | null;
  uom: string;
  unit_cost: number | null;
  total_cost: number | null;
  received_qty: number | null;
  damage_notes: string | null;
  inspection_notes?: string | null;
  inspection_file_url?: string | null;
}

export interface RequestItemUsageRow {
  id: string;
  items?: Array<
    Pick<RequestItemRow, "qty" | "item_description" | "category" | "uom">
  >;
}

async function assignMainPrNoWithRetry(params: {
  requestId: string;
  maxAttempts?: number;
}) {
  const maxAttempts = params.maxAttempts ?? 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const mainPrNo = await generateMainPrNo();
    const { error } = await supabase
      .from("requests")
      .update({ pr_no: mainPrNo })
      .eq("id", params.requestId);

    if (!error) return mainPrNo;

    if (error.code === "23505" && attempt < maxAttempts) {
      continue;
    }

    throw error;
  }

  return null;
}

export interface RequestPrGroupRow {
  id: string;
  request_id: string;
  category: string;
  pr_no: string;
  created_at: string;
}

export interface PpmpPlanRow {
  id: string;
  created_by: string;
  college_id: string;
  program_id: string;
  module2_data: unknown | null;
  module3_rows: unknown | null;
  expires_at: string | null;
  realign_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
  items?: PpmpItemRow[];
}

export interface PpmpItemRow {
  id: string;
  plan_id: string;
  category: string;
  item_description: string;
  qty: number;
  uom: string;
  unit_price: number | null;
}

export interface StatusLogRow {
  id: string;
  request_id: string;
  status: string;
  note: string | null;
  updated_by: string;
  created_at: string;
  updater?: {
    id: string;
    first_name: string;
    last_name: string;
    role?: UserRole;
  };
}

export interface RequestMessageRow {
  id: string;
  request_id: string;
  sender_id: string;
  sender_role: UserRole;
  message: string;
  created_at: string;
  sender?:
    | {
        id: string;
        first_name: string;
        last_name: string;
        role: UserRole;
      }[]
    | {
        id: string;
        first_name: string;
        last_name: string;
        role: UserRole;
      };
}

export type UnreadChatCountMap = Record<string, number>;

function normalizeMessageSender(row: RequestMessageRow): RequestMessageRow {
  const rawSender = row.sender as unknown;
  if (Array.isArray(rawSender)) {
    return {
      ...row,
      sender: (rawSender[0] ?? undefined) as RequestMessageRow["sender"],
    };
  }
  return row;
}

// ── PR Number generation ───────────────────────────────

async function generateMainPrNo(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PR_${year}_`;

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

async function generateCategoryPrNo(mainPrNo: string): Promise<string> {
  const prefix = `${mainPrNo}_`;

  const { data } = await supabase
    .from("request_pr_groups")
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

  return `${prefix}${String(seq).padStart(3, "0")}`;
}

async function insertPrGroupWithRetry(params: {
  requestId: string;
  category: string;
  mainPrNo: string;
  maxAttempts?: number;
}) {
  const maxAttempts = params.maxAttempts ?? 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const prNo = await generateCategoryPrNo(params.mainPrNo);
    const { error } = await supabase.from("request_pr_groups").insert({
      id: crypto.randomUUID(),
      request_id: params.requestId,
      category: params.category,
      pr_no: prNo,
    });

    if (!error) return;

    if (error.code === "23505" && attempt < maxAttempts) {
      // Duplicate PR number: regenerate and retry.
      continue;
    }

    throw error;
  }
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
  requestedBy?: string;
  requestedByDesignation?: string;
  reviewedBy?: string;
  reviewedByDesignation?: string;
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
        requested_by: params.requestedBy ?? null,
        requested_by_designation: params.requestedByDesignation ?? null,
        reviewed_by: params.reviewedBy ?? null,
        reviewed_by_designation: params.reviewedByDesignation ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.draftId)
      .eq("status", "draft");
    if (updateErr) throw updateErr;

    // Replace items: delete old, insert new
    await supabase
      .from("request_items")
      .delete()
      .eq("request_id", params.draftId);
  } else {
    // Create new draft (no PR number)
    const { error: reqError } = await supabase.from("requests").insert({
      id: requestId,
      pr_no: null,
      college_id: params.collegeId,
      program_id: params.programId,
      purpose: params.purpose ?? null,
      fund_source: params.fundSource ?? null,
      requested_by: params.requestedBy ?? null,
      requested_by_designation: params.requestedByDesignation ?? null,
      reviewed_by: params.reviewedBy ?? null,
      reviewed_by_designation: params.reviewedByDesignation ?? null,
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
        category: item.category ?? null,
        uom: item.uom,
        unit_cost: item.unitCost ?? null,
        total_cost: item.unitCost ? item.unitCost * item.qty : null,
        preferred_brand: item.preferredBrand ?? null,
      }));

    if (itemRows.length > 0) {
      const { error: itemError } = await supabase
        .from("request_items")
        .insert(itemRows);
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

/** Submit a draft: change status to request_sent (no PR number yet). */
export async function submitDraft(
  draftId: string,
  userId: string,
): Promise<RequestRow> {
  const mainPrNo = await assignMainPrNoWithRetry({ requestId: draftId });
  if (!mainPrNo) {
    throw new Error("Failed to assign a main PR number.");
  }

  const { error: updateErr } = await supabase
    .from("requests")
    .update({
      pr_no: mainPrNo,
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
    note: DEFAULT_STATUS_NOTES["request_sent"],
    updated_by: userId,
  });

  // Generate per-category PR numbers for this draft
  const { data: items, error: itemsErr } = await supabase
    .from("request_items")
    .select("category")
    .eq("request_id", draftId);

  if (itemsErr) throw itemsErr;

  const categories = Array.from(
    new Set(
      (items ?? [])
        .map((item: { category?: string | null }) => item.category?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (categories.length > 0) {
    for (const category of categories) {
      await insertPrGroupWithRetry({
        requestId: draftId,
        category,
        mainPrNo,
      });
    }
  }

  // Notify Accounting Administrator users
  await notifyUsersByRole({
    role: "accounting_admin",
    title: "New request submitted",
    body: "A new procurement request needs review",
    type: "new_request",
    requestId: draftId,
  });

  await sendAccountingReviewEmail({
    requestId: draftId,
    prNo: mainPrNo,
  });

  return {
    id: draftId,
    pr_no: mainPrNo,
    status: "request_sent" as RequestStatus,
  } as RequestRow;
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
  requestedBy?: string;
  requestedByDesignation?: string;
  reviewedBy?: string;
  reviewedByDesignation?: string;
  createdBy: string;
  items: RequestItemInput[];
}) {
  const requestId = crypto.randomUUID();

  // Insert the request
  let request: RequestRow | null = null;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const mainPrNo = await generateMainPrNo();
    const { data, error: reqError } = await supabase
      .from("requests")
      .insert({
        id: requestId,
        pr_no: mainPrNo,
        college_id: params.collegeId,
        program_id: params.programId,
        purpose: params.purpose,
        fund_source: params.fundSource ?? null,
        requested_by: params.requestedBy ?? null,
        requested_by_designation: params.requestedByDesignation ?? null,
        reviewed_by: params.reviewedBy ?? null,
        reviewed_by_designation: params.reviewedByDesignation ?? null,
        status: "request_sent" as RequestStatus,
        created_by: params.createdBy,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!reqError) {
      request = data as RequestRow;
      break;
    }

    if (reqError.code === "23505" && attempt < 5) {
      continue;
    }

    throw reqError;
  }

  if (!request) {
    throw new Error("Failed to create request after retrying PR numbers.");
  }

  if (params.items.length > 0) {
    const itemRows = params.items.map((item, idx) => ({
      id: crypto.randomUUID(),
      request_id: request.id,
      stock_no: String(idx + 1),
      qty: item.qty,
      item_description: item.itemDescription,
      category: item.category ?? null,
      uom: item.uom,
      unit_cost: item.unitCost ?? null,
      total_cost: item.unitCost ? item.unitCost * item.qty : null,
      preferred_brand: item.preferredBrand ?? null,
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
    note: DEFAULT_STATUS_NOTES["request_sent"],
    updated_by: params.createdBy,
  });

  // Generate per-category PR numbers
  const categories = Array.from(
    new Set(
      params.items
        .map((item) => item.category?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (categories.length > 0) {
    for (const category of categories) {
      await insertPrGroupWithRetry({
        requestId: request.id,
        category,
        mainPrNo: request.pr_no ?? "",
      });
    }
  }

  // Notify Accounting Administrator users that a new request needs review
  await notifyUsersByRole({
    role: "accounting_admin",
    title: "New request submitted",
    body: params.purpose || "A new procurement request needs review",
    type: "new_request",
    requestId: request.id,
  });

  await sendAccountingReviewEmail({
    requestId: request.id,
    prNo: request.pr_no ?? "",
    purpose: params.purpose ?? null,
  });

  return request as RequestRow;
}

// ── Fetch Requests ────────────────────────────────────

/**
 * Light fetch: only core request fields + college code + creator name + items.
 * No status_logs (the heaviest join). Use for list/table views.
 */
export async function fetchRequestsLight(filters?: {
  status?: RequestStatus;
  createdBy?: string;
}) {
  let query = supabase
    .from("requests")
    .select(
      `
      *,
      college:colleges(id, code, name),
      program:programs(id, code, name),
      creator:users!requests_created_by_fkey(id, first_name, last_name, email),
      items:request_items(*),
      pr_groups:request_pr_groups(*),
      status_logs:request_status_logs(
        id,
        request_id,
        status,
        note,
        updated_by,
        created_at,
        updater:users!request_status_logs_updated_by_fkey(id, first_name, last_name, role)
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  } else {
    query = query.neq("status", "draft");
  }
  if (filters?.createdBy) {
    query = query.eq("created_by", filters.createdBy);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as RequestRow[];
}

export async function fetchCompletedRequestsForProgram(params: {
  collegeId: string;
  programId: string;
}) {
  const { data, error } = await supabase
    .from("requests")
    .select(
      `
      id,
      items:request_items(qty, item_description, category, uom)
    `,
    )
    .eq("status", "completed")
    .eq("college_id", params.collegeId)
    .eq("program_id", params.programId);

  if (error) throw error;
  return (data ?? []) as RequestItemUsageRow[];
}

/**
 * Full fetch: includes status_logs + updater. Use only when timeline/detail is needed.
 */
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
      pr_groups:request_pr_groups(*),
      status_logs:request_status_logs(*, updater:users!request_status_logs_updated_by_fkey(id, first_name, last_name, role))
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
      pr_groups:request_pr_groups(*),
      status_logs:request_status_logs(*, updater:users!request_status_logs_updated_by_fkey(id, first_name, last_name, role))
    `,
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as RequestRow;
}

// ── Request Chat ─────────────────────────────────────

export async function fetchRequestMessages(
  requestId: string,
): Promise<RequestMessageRow[]> {
  const { data, error } = await supabase
    .from("request_messages")
    .select(
      `
      id,
      request_id,
      sender_id,
      sender_role,
      message,
      created_at,
      sender:users!request_messages_sender_id_fkey(id, first_name, last_name, role)
    `,
    )
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as RequestMessageRow[]).map(normalizeMessageSender);
}

export async function sendRequestMessage(params: {
  requestId: string;
  senderId: string;
  message: string;
}) {
  const cleanMessage = params.message.trim();
  if (!cleanMessage) {
    throw new Error("Message cannot be empty.");
  }

  const [
    { data: request, error: reqError },
    { data: sender, error: senderErr },
  ] = await Promise.all([
    supabase
      .from("requests")
      .select(
        "id, created_by, status, pr_groups:request_pr_groups(pr_no), creator:users!requests_created_by_fkey(email, first_name, last_name)",
      )
      .eq("id", params.requestId)
      .single(),
    supabase
      .from("users")
      .select("id, role")
      .eq("id", params.senderId)
      .single(),
  ]);

  if (reqError || !request) {
    throw new Error("Request not found.");
  }

  if (senderErr || !sender) {
    throw new Error("Could not verify sender role.");
  }

  const senderRole = normalizeUserRole(sender.role);
  if (!senderRole) {
    throw new Error("Invalid sender role.");
  }

  const handlerRole = getChatHandlerRole(request.status as RequestStatus);
  if (!handlerRole) {
    throw new Error(
      "This conversation is read-only because the request is completed.",
    );
  }

  const isRequester = request.created_by === params.senderId;
  const isCurrentHandler =
    handlerRole !== "department_user" && senderRole === handlerRole;
  const isRequestSentParticipant =
    request.status === "request_sent" &&
    (senderRole === "department_user" || senderRole === "accounting_admin");

  if (!isRequester && !isCurrentHandler && !isRequestSentParticipant) {
    throw new Error(
      "You can only send messages if you are the request owner or the role currently handling this status.",
    );
  }

  const { data, error } = await supabase
    .from("request_messages")
    .insert({
      id: crypto.randomUUID(),
      request_id: params.requestId,
      sender_id: params.senderId,
      sender_role: senderRole,
      message: cleanMessage,
    })
    .select(
      `
      id,
      request_id,
      sender_id,
      sender_role,
      message,
      created_at,
      sender:users!request_messages_sender_id_fkey(id, first_name, last_name, role)
    `,
    )
    .single();

  if (error) throw error;

  // Send email notification to the request owner when staff replies
  try {
    if (senderRole !== "department_user" && request?.creator) {
      const creatorRaw = request.creator as unknown;
      const creator = (
        Array.isArray(creatorRaw) ? creatorRaw[0] : creatorRaw
      ) as {
        email: string | null;
        first_name: string;
        last_name: string;
      } | null;

      const prGroups = (request?.pr_groups ?? []) as { pr_no: string }[];
      const prLabel = prGroups.length > 0 ? prGroups[0].pr_no : "Request";

      if (creator?.email) {
        await supabase.functions.invoke("send-chat-notification", {
          body: {
            email: creator.email,
            recipientName: `${creator.first_name} ${creator.last_name}`,
            prNo: prLabel,
            message: cleanMessage,
          },
        });
      }
    }
  } catch (emailErr) {
    console.error("Chat email notification failed:", emailErr);
  }

  return normalizeMessageSender(data as RequestMessageRow);
}

export async function markRequestMessagesRead(params: {
  requestId: string;
  userId: string;
}) {
  const { error } = await supabase.from("request_message_reads").upsert(
    {
      user_id: params.userId,
      request_id: params.requestId,
      last_read_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,request_id",
    },
  );

  if (error) throw error;
}

export async function fetchUnreadChatCounts(params: {
  userId: string;
  requestIds: string[];
}): Promise<UnreadChatCountMap> {
  if (params.requestIds.length === 0) {
    return {};
  }

  const [{ data: messages, error: msgErr }, { data: reads, error: readErr }] =
    await Promise.all([
      supabase
        .from("request_messages")
        .select("request_id, sender_id, created_at")
        .in("request_id", params.requestIds)
        .neq("sender_id", params.userId),
      supabase
        .from("request_message_reads")
        .select("request_id, last_read_at")
        .eq("user_id", params.userId)
        .in("request_id", params.requestIds),
    ]);

  if (msgErr) throw msgErr;
  if (readErr) throw readErr;

  const readMap = new Map<string, number>();
  for (const read of reads ?? []) {
    readMap.set(
      read.request_id as string,
      new Date(read.last_read_at).getTime(),
    );
  }

  const counts: UnreadChatCountMap = {};
  for (const message of messages ?? []) {
    const requestId = message.request_id as string;
    const sentAt = new Date(message.created_at as string).getTime();
    const readAt = readMap.get(requestId) ?? 0;

    if (sentAt > readAt) {
      counts[requestId] = (counts[requestId] ?? 0) + 1;
    }
  }

  return counts;
}

export async function fetchMonitoringUnreadTotal(params: {
  userId: string;
  role: string | null | undefined;
}): Promise<number> {
  const normalizedRole = normalizeUserRole(params.role);

  let query = supabase
    .from("requests")
    .select("id, status")
    .neq("status", "draft");

  if (normalizedRole === "department_user") {
    query = query.eq("created_by", params.userId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const requestIds = (data ?? [])
    .filter((row) => {
      if (normalizedRole === "department_user") {
        return true;
      }
      return shouldShowUnreadChatForStatus({
        role: normalizedRole,
        status: row.status as RequestStatus,
      });
    })
    .map((row) => row.id as string);

  if (requestIds.length === 0) {
    return 0;
  }

  const counts = await fetchUnreadChatCounts({
    userId: params.userId,
    requestIds,
  });

  return Object.values(counts).reduce((total, value) => total + value, 0);
}

// ── Report-specific lightweight fetch ──────────────────

export interface ReportRow {
  id: string;
  status: RequestStatus;
  created_at: string;
  college: { code: string } | null;
  program: { code: string } | null;
  items: { unit_cost: number | null; qty: number }[];
  status_logs: { created_at: string }[];
}

/**
 * Minimal fetch for reports: only status, dates, college code, item costs,
 * and status_log timestamps (no updater join).
 */
export async function fetchReportData(): Promise<ReportRow[]> {
  const { data, error } = await supabase
    .from("requests")
    .select(
      `
      id, status, created_at,
      college:colleges(code),
      program:programs(code),
      items:request_items(unit_cost, qty),
      status_logs:request_status_logs(created_at)
    `,
    )
    .neq("status", "draft")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ReportRow[];
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

async function sendAccountingReviewEmail(params: {
  requestId: string;
  prNo: string;
  purpose?: string | null;
}) {
  try {
    const { data: admins, error: adminsError } = await supabase
      .from("users")
      .select("email, first_name, last_name")
      .eq("role", "accounting_admin")
      .not("email", "is", null);

    if (adminsError) {
      console.error(
        "Failed to fetch accounting admin recipients:",
        adminsError,
      );
      return;
    }

    const recipients = Array.from(
      new Map(
        (admins ?? [])
          .map((admin) => ({
            email: String(admin.email || "").trim(),
            name: `${String(admin.first_name || "").trim()} ${String(
              admin.last_name || "",
            ).trim()}`.trim(),
          }))
          .filter((entry) => Boolean(entry.email))
          .map((entry) => [entry.email.toLowerCase(), entry] as const),
      ).values(),
    );

    if (recipients.length === 0) {
      console.warn("No accounting admin emails found for review notification.");
      return;
    }

    // Fetch the request to get creator name and college
    const { data: requestData } = await supabase
      .from("requests")
      .select(
        "id, purpose, created_by, creator:users!requests_created_by_fkey(first_name, last_name), college:colleges(code, name)",
      )
      .eq("id", params.requestId)
      .single();

    const raw = requestData?.creator as unknown;
    const creatorArray = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const creator = creatorArray[0] as
      | { first_name: string; last_name: string }
      | undefined;
    const creatorName = creator
      ? `${creator.first_name} ${creator.last_name}`.trim()
      : "A user";

    const collegeRaw = requestData?.college as unknown;
    const collegeArray = Array.isArray(collegeRaw)
      ? collegeRaw
      : collegeRaw
        ? [collegeRaw]
        : [];
    const college = collegeArray[0] as
      | { code: string; name: string }
      | undefined;
    const creatorCollege = college ? `${college.code} - ${college.name}` : "";

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    // Send admin notification email
    const { error } = await supabase.functions.invoke(
      "send-admin-request-notification",
      {
        body: {
          prNo: params.prNo || params.requestId,
          creatorName,
          creatorCollege,
          purpose: params.purpose ?? null,
          recipients: recipients.map((r) => ({
            email: r.email,
            name: r.name,
          })),
        },
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : undefined,
      },
    );

    if (error) {
      console.error("Admin notification email error:", error);
    } else {
      console.log(
        "Admin notification emails sent to",
        recipients.length,
        "accounting admin(s)",
      );
    }
  } catch (err) {
    // Do not block request submission if email delivery fails.
    console.error("Failed to send accounting review email:", err);
  }
}

async function fetchUsersByRole(role: UserRole) {
  const { data, error } = await supabase
    .from("users")
    .select("email, first_name, last_name")
    .eq("role", role)
    .not("email", "is", null);

  if (error) {
    throw error;
  }

  return Array.from(
    new Map(
      (data ?? [])
        .map((user) => ({
          email: String(user.email || "").trim(),
          name: `${String(user.first_name || "").trim()} ${String(
            user.last_name || "",
          ).trim()}`.trim(),
        }))
        .filter((entry) => Boolean(entry.email))
        .map((entry) => [entry.email.toLowerCase(), entry] as const),
    ).values(),
  );
}

function getNextNotificationRoles(
  status: RequestStatus,
  currentRole: UserRole,
) {
  const startIndex = STATUS_FLOW.indexOf(normalizeFlowStatus(status));
  if (startIndex < 0) return [] as UserRole[];

  const nextStatus = STATUS_FLOW[startIndex + 1];
  if (!nextStatus) return [] as UserRole[];

  const nextRole = STATUS_RESPONSIBLE_ROLE[nextStatus];
  if (nextRole === currentRole) return [] as UserRole[];

  return [nextRole];
}

async function sendAdminRoleNotification(params: {
  requestId: string;
  role: UserRole;
  prNo: string;
  statusLabel: string;
  note?: string | null;
  ownerName: string;
  ownerCollege?: string | null;
}) {
  try {
    const recipients = await fetchUsersByRole(params.role);
    if (recipients.length === 0) {
      console.warn(`No users found for role ${params.role}.`);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    const { error } = await supabase.functions.invoke(
      "send-admin-request-notification",
      {
        body: {
          recipients: recipients.map((recipient) => ({
            email: recipient.email,
            name: recipient.name,
          })),
          prNo: params.prNo || params.requestId,
          creatorName: params.ownerName,
          creatorCollege: params.ownerCollege ?? null,
          purpose:
            `${ROLE_LABELS[params.role]} action required: ${params.statusLabel}` +
            (params.note ? `\n\nNote: ${params.note}` : ""),
        },
        headers: accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : undefined,
      },
    );

    if (error) {
      console.error(`Admin role notification error for ${params.role}:`, error);
    }
  } catch (err) {
    console.error(
      `Failed to send admin role notification for ${params.role}:`,
      err,
    );
  }
}

export interface SpecialStatusNoticeParams {
  status: "notice_of_meeting" | "hope_approval" | "issuance";
  prNo: string;
  ownerName: string;
  ownerEmail?: string | null;
  additionalEmails?: string[];
  meetingDate?: string;
  meetingTime?: string;
  venue?: string;
}

/**
 * Sends an additional formal notice email for selected workflow statuses.
 * This supplements (does not replace) the default status-update email.
 */
export async function sendSpecialStatusNotice(
  params: SpecialStatusNoticeParams,
) {
  const dedupedRecipients = Array.from(
    new Set(
      [params.ownerEmail ?? "", ...(params.additionalEmails ?? [])]
        .map((email) => email.trim())
        .filter(Boolean),
    ),
  );

  if (dedupedRecipients.length === 0) {
    return;
  }

  const { data, error } = await supabase.functions.invoke(
    "send-special-status-email",
    {
      body: {
        status: params.status,
        prNo: params.prNo,
        ownerName: params.ownerName,
        recipients: dedupedRecipients,
        meetingDate: params.meetingDate ?? null,
        meetingTime: params.meetingTime ?? null,
        venue: params.venue ?? null,
      },
    },
  );

  if (error) {
    throw new Error(error.message || "Failed to send additional notice email.");
  }

  if (data?.error) {
    throw new Error(data.error);
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

  // Some statuses can be set by multiple admin roles.
  if (params.newStatus === "returned_for_action") {
    if (!RETURN_STATUS_ALLOWED_ROLES.includes(userRole)) {
      throw new Error(
        `Your role (${ROLE_LABELS[userRole]}) is not authorized to return requests for personal action.`,
      );
    }
  } else if (
    params.newStatus === "po_issued" ||
    params.newStatus === "ntp_issued"
  ) {
    const allowed = ["procurement_admin", "supply_admin"] as UserRole[];
    if (!allowed.includes(userRole)) {
      throw new Error(
        `Your role (${ROLE_LABELS[userRole]}) is not authorized to set status to "${STATUS_LABELS[params.newStatus]}". ` +
          `This action requires: Procurement or Supply.`,
      );
    }
  } else {
    // Role must match the responsible role for the target status.
    if (userRole !== responsibleRole) {
      throw new Error(
        `Your role (${ROLE_LABELS[userRole]}) is not authorized to set status to "${STATUS_LABELS[params.newStatus]}". ` +
          `This action requires: ${ROLE_LABELS[responsibleRole]}.`,
      );
    }
  }

  const requestUpdates: {
    status: RequestStatus;
    updated_at: string;
  } = {
    status: params.newStatus,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("requests")
    .update(requestUpdates)
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
        "pr_no, created_by, pr_groups:request_pr_groups(pr_no, created_at), creator:users!requests_created_by_fkey(email, first_name, last_name), college:colleges(code, name)",
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
      const prGroups = (request?.pr_groups ?? []) as { pr_no: string }[];
      const prLabel =
        prGroups.length > 0
          ? prGroups.map((g) => g.pr_no).join(", ")
          : (request.pr_no ?? "Request");
      const notifType =
        params.newStatus === "returned_for_revision" ||
        params.newStatus === "returned_for_action"
          ? "return_note"
          : "status_update";

      await createNotification({
        userId: request.created_by,
        title: `${prLabel} — ${STATUS_SHORT_LABELS[params.newStatus]}`,
        body: params.note || DEFAULT_STATUS_NOTES[params.newStatus],
        type: notifType,
        requestId: params.requestId,
      });

      // ── In-app notification to the responsible role for the next step ──
      const nextIdx =
        STATUS_FLOW.indexOf(normalizeFlowStatus(params.newStatus)) + 1;
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

      // ── Email notification to the next two distinct responsible roles ──
      // Never broadcast status-update emails to all department users.
      // End-user updates should go only to the request owner via sendStatusEmail above.
      const emailRoles = getNextNotificationRoles(
        params.newStatus,
        userRole,
      ).filter((role) => role !== "department_user");
      if (emailRoles.length > 0) {
        const requesterName = creator
          ? `${creator.first_name} ${creator.last_name}`.trim()
          : "A user";
        const collegeRaw = request?.college as unknown;
        const collegeArray = Array.isArray(collegeRaw)
          ? collegeRaw
          : collegeRaw
            ? [collegeRaw]
            : [];
        const college = collegeArray[0] as
          | { code: string; name: string }
          | undefined;
        const requesterCollege = college
          ? `${college.code} - ${college.name}`
          : null;

        await Promise.all(
          emailRoles.map((role) =>
            sendAdminRoleNotification({
              requestId: params.requestId,
              role,
              prNo: request.pr_no ?? params.requestId,
              statusLabel: STATUS_LABELS[params.newStatus] ?? params.newStatus,
              note: params.note ?? DEFAULT_STATUS_NOTES[params.newStatus],
              ownerName: requesterName,
              ownerCollege: requesterCollege,
            }),
          ),
        );
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
    note: note || DEFAULT_STATUS_NOTES["request_reviewed"],
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

export async function returnForAction(
  requestId: string,
  userId: string,
  note?: string,
) {
  await updateRequestStatus({
    requestId,
    newStatus: "returned_for_action",
    updatedBy: userId,
    note: note || "Returned to end user for personal action",
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
    note: note ?? DEFAULT_STATUS_NOTES[nextStatus],
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

// ── PPMP Plans ───────────────────────────────────────

export async function fetchActivePpmpPlan(params: {
  userId: string;
  programId: string;
}) {
  const { data, error } = await supabase
    .from("ppmp_plans")
    .select(
      `
      *,
      items:ppmp_items(*)
    `,
    )
    .eq("created_by", params.userId)
    .eq("program_id", params.programId)
    .not("completed_at", "is", null)
    .gt("expires_at", new Date().toISOString())
    .order("completed_at", { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  return data as PpmpPlanRow;
}

export async function fetchUserPpmpPlans(params: {
  userId: string;
  programId?: string;
}) {
  let query = supabase
    .from("ppmp_plans")
    .select(
      `
      *,
      items:ppmp_items(*),
      program:programs(id, code, name)
    `,
    )
    .eq("created_by", params.userId)
    .order("created_at", { ascending: false });

  if (params.programId) {
    query = query.eq("program_id", params.programId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PpmpPlanRow[];
}

export async function createPpmpPlan(params: {
  createdBy: string;
  collegeId: string;
  programId: string;
  module2Data?: unknown;
  module3Rows?: unknown;
  items: Array<{
    category: string;
    itemDescription: string;
    qty: number;
    uom: string;
    unitPrice?: number;
  }>;
}) {
  const planId = crypto.randomUUID();

  const { error: planError } = await supabase.from("ppmp_plans").insert({
    id: planId,
    created_by: params.createdBy,
    college_id: params.collegeId,
    program_id: params.programId,
    module2_data: params.module2Data ?? null,
    module3_rows: params.module3Rows ?? null,
    expires_at: null,
    realign_at: null,
    completed_at: null,
    completed_by: null,
  });
  if (planError) throw planError;

  const items = params.items.map((item) => ({
    id: crypto.randomUUID(),
    plan_id: planId,
    category: item.category,
    item_description: item.itemDescription,
    qty: item.qty,
    uom: item.uom,
    unit_price: item.unitPrice ?? null,
  }));

  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from("ppmp_items")
      .insert(items);
    if (itemsError) throw itemsError;
  }

  return planId;
}

export async function updatePpmpPlan(params: {
  planId: string;
  module2Data?: unknown;
  module3Rows?: unknown;
  expiresAt?: string | null;
  items: Array<{
    category: string;
    itemDescription: string;
    qty: number;
    uom: string;
    unitPrice?: number;
  }>;
}) {
  const updatePayload: Record<string, unknown> = {
    module2_data: params.module2Data ?? null,
    module3_rows: params.module3Rows ?? null,
    updated_at: new Date().toISOString(),
    realign_at: new Date().toISOString(),
  };

  if (Object.prototype.hasOwnProperty.call(params, "expiresAt")) {
    updatePayload.expires_at = params.expiresAt ?? null;
  }

  const { error: updateError } = await supabase
    .from("ppmp_plans")
    .update(updatePayload)
    .eq("id", params.planId);
  if (updateError) throw updateError;

  const { error: deleteError } = await supabase
    .from("ppmp_items")
    .delete()
    .eq("plan_id", params.planId);
  if (deleteError) throw deleteError;

  const items = params.items.map((item) => ({
    id: crypto.randomUUID(),
    plan_id: params.planId,
    category: item.category,
    item_description: item.itemDescription,
    qty: item.qty,
    uom: item.uom,
    unit_price: item.unitPrice ?? null,
  }));

  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from("ppmp_items")
      .insert(items);
    if (itemsError) throw itemsError;
  }
}

export async function updatePpmpPlanExpiration(params: {
  planId: string;
  expiresAt: string;
}) {
  const { error } = await supabase
    .from("ppmp_plans")
    .update({
      expires_at: params.expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.planId);
  if (error) throw error;
}

export async function completePpmpPlan(params: {
  planId: string;
  completedBy: string;
  expiresAt: string;
}) {
  const { error } = await supabase
    .from("ppmp_plans")
    .update({
      completed_at: new Date().toISOString(),
      completed_by: params.completedBy,
      expires_at: params.expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.planId);
  if (error) throw error;
}

export async function deletePpmpPlan(params: { planId: string }) {
  const { error: deleteItemsError } = await supabase
    .from("ppmp_items")
    .delete()
    .eq("plan_id", params.planId);
  if (deleteItemsError) throw deleteItemsError;

  const { error: deletePlanError } = await supabase
    .from("ppmp_plans")
    .delete()
    .eq("id", params.planId);
  if (deletePlanError) throw deletePlanError;
}

// ── Stats ──────────────────────────────────────────────

export async function fetchRequestStats(userId?: string) {
  let query = supabase.from("requests").select("status").neq("status", "draft");
  if (userId) query = query.eq("created_by", userId);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];

  // Group by phase for dashboard
  const accountingStatuses: RequestStatus[] = ["request_reviewed"];
  const procurementStatuses: RequestStatus[] = [
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
  ];
  const supplyStatuses: RequestStatus[] = [
    "po_delivered",
    "items_for_inspection",
    "under_inspection",
    "under_warehousing",
    "issuance",
  ];

  return {
    total: rows.length,
    requestSent: rows.filter((r) => r.status === "request_sent").length,
    accountingPhase: rows.filter((r) =>
      accountingStatuses.includes(r.status as RequestStatus),
    ).length,
    procurementPhase: rows.filter((r) =>
      procurementStatuses.includes(r.status as RequestStatus),
    ).length,
    supplyPhase: rows.filter((r) =>
      supplyStatuses.includes(r.status as RequestStatus),
    ).length,
    completed: rows.filter((r) => r.status === "completed").length,
    returned: rows.filter(
      (r) =>
        r.status === "returned_for_revision" ||
        r.status === "returned_for_action",
    ).length,
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

// ── Edit eligibility check ────────────────────────────

/**
 * Determines if a request can be edited by the department user.
 * Returns true only if:
 * - Current status is "returned_for_revision"
 * - Previous status (before the return) was "request_sent"
 * - The user who returned it for revision has role "accounting_admin"
 */
export function canEditReturnedRequest(request: RequestRow): boolean {
  if (request.status !== "returned_for_revision") {
    return false;
  }

  if (!request.status_logs || request.status_logs.length < 2) {
    return false;
  }

  // Sort by created_at descending to get the most recent first.
  const sortedLogs = [...request.status_logs].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  // Find the most recent "returned_for_revision" log
  const returnLog = sortedLogs.find(
    (l) => l.status === "returned_for_revision",
  );
  if (!returnLog || !returnLog.updater) {
    return false;
  }

  // Check if the returner has "accounting_admin" role.
  if (returnLog.updater.role !== "accounting_admin") {
    return false;
  }

  // Find the status BEFORE the return (should be "request_sent").
  const returnLogIndex = sortedLogs.findIndex(
    (l) =>
      l.status === "returned_for_revision" &&
      l.created_at === returnLog.created_at,
  );

  // Look for the previous status (chronologically after, in descending order)
  if (returnLogIndex + 1 < sortedLogs.length) {
    const previousLog = sortedLogs[returnLogIndex + 1];
    return previousLog.status === "request_sent";
  }

  return false;
}

/**
 * Returns the status immediately before the latest return log for a request.
 */
export function getPreviousStatusBeforeReturn(
  request: RequestRow,
  returnStatus: "returned_for_revision" | "returned_for_action",
): RequestStatus | null {
  if (!request.status_logs || request.status_logs.length < 2) {
    return null;
  }

  const sortedLogs = [...request.status_logs].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const returnLogIndex = sortedLogs.findIndex((l) => l.status === returnStatus);
  if (returnLogIndex < 0 || returnLogIndex + 1 >= sortedLogs.length) {
    return null;
  }

  const previous = sortedLogs[returnLogIndex + 1]?.status as RequestStatus;
  return previous ?? null;
}

/**
 * Computes the next workflow status that should be used when validating a
 * request returned for personal action.
 */
export function getResumeStatusAfterReturnForAction(
  request: RequestRow,
): RequestStatus | null {
  const previous = getPreviousStatusBeforeReturn(
    request,
    "returned_for_action",
  );
  if (!previous) return null;
  const previousIdx = STATUS_FLOW.indexOf(normalizeFlowStatus(previous));
  if (previousIdx < 0 || previousIdx >= STATUS_FLOW.length - 1) {
    return null;
  }
  return STATUS_FLOW[previousIdx + 1];
}

// ── Resubmit returned request ──────────────────────────

/**
 * Allows a department user to resubmit a returned request.
 * Updates items and sets status back to "request_sent".
 */
export async function resubmitReturnedRequest(params: {
  requestId: string;
  userId: string;
  requestedBy?: string;
  requestedByDesignation?: string;
  reviewedBy?: string;
  reviewedByDesignation?: string;
  items: RequestItemInput[];
}): Promise<RequestRow> {
  // Delete old items and insert new ones
  await supabase
    .from("request_items")
    .delete()
    .eq("request_id", params.requestId);

  if (params.items.length > 0) {
    const itemRows = params.items
      .filter((it) => it.itemDescription.trim())
      .map((item, idx) => ({
        id: crypto.randomUUID(),
        request_id: params.requestId,
        stock_no: String(idx + 1),
        qty: item.qty,
        item_description: item.itemDescription,
        category: item.category ?? null,
        uom: item.uom,
        unit_cost: item.unitCost ?? null,
        total_cost: item.unitCost ? item.unitCost * item.qty : null,
        preferred_brand: item.preferredBrand ?? null,
      }));

    if (itemRows.length > 0) {
      const { error: itemError } = await supabase
        .from("request_items")
        .insert(itemRows);
      if (itemError) throw itemError;
    }
  }

  // Update request status back to "request_sent"
  const { error: updateErr } = await supabase
    .from("requests")
    .update({
      requested_by: params.requestedBy ?? null,
      requested_by_designation: params.requestedByDesignation ?? null,
      reviewed_by: params.reviewedBy ?? null,
      reviewed_by_designation: params.reviewedByDesignation ?? null,
      status: "request_sent" as RequestStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.requestId);

  if (updateErr) throw updateErr;

  // Insert status log
  const { error: logError } = await supabase
    .from("request_status_logs")
    .insert({
      id: crypto.randomUUID(),
      request_id: params.requestId,
      status: "request_sent",
      note: "Resubmitted by department user after revision",
      updated_by: params.userId,
    });

  if (logError) throw logError;

  return fetchRequestById(params.requestId);
}
