// src/pages/admin/Requests.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  Eye,
  Download,
  Loader2,
  Check,
  XCircle,
  PlayCircle,
  RotateCcw,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchRequestsLight,
  fetchRequestById,
  updateRequestStatus,
  sendSpecialStatusNotice,
  getResumeStatusAfterReturnForAction,
  type RequestRow,
  type RequestStatus,
  DEFAULT_STATUS_NOTES,
  STATUS_SHORT_LABELS,
  STATUS_TONE,
  STATUS_FLOW,
  STATUS_RESPONSIBLE_ROLE,
  normalizeFlowStatus,
} from "../../lib/requests";
import { supabase } from "../../lib/supabase";
import { generatePrDocument } from "../../lib/generatePr";
import StatusTimeline from "../../components/StatusTimeline";

type SpecialNoticeStatus = "notice_of_meeting" | "hope_approval" | "issuance";

const SPECIAL_NOTICE_STATUSES: SpecialNoticeStatus[] = [
  "notice_of_meeting",
  "hope_approval",
  "issuance",
];

function isSpecialNoticeStatus(
  status: RequestStatus,
): status is SpecialNoticeStatus {
  return SPECIAL_NOTICE_STATUSES.includes(status as SpecialNoticeStatus);
}

function parseEmailList(value: string) {
  return value
    .split(/[,;\n]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function validateEmails(emails: string[]) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emails.every((email) => emailPattern.test(email));
}

function getSpecialNoticeTitle(status: SpecialNoticeStatus) {
  switch (status) {
    case "notice_of_meeting":
      return "Notice of Meeting";
    case "hope_approval":
      return "HoPE Approval Notice";
    case "issuance":
      return "Issuance and Utilization Notice";
    default:
      return "Special Notice";
  }
}

function StatusPill({ status }: { status: RequestStatus }) {
  const toneMap: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    violet: "bg-violet-100 text-violet-700",
    emerald: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
  };
  const tone = STATUS_TONE[status] ?? "gray";

  return (
    <span
      className={[
        "inline-flex items-center justify-center",
        "min-w-[100px] px-3 py-1.5",
        "rounded-full text-xs font-semibold",
        "text-center leading-tight",
        toneMap[tone] ?? "bg-gray-100 text-gray-700",
      ].join(" ")}
    >
      {STATUS_SHORT_LABELS[status] ?? status}
    </span>
  );
}

function itemsTotal(items?: { unit_cost: number | null; qty: number }[]) {
  if (!items) return 0;
  return items.reduce(
    (sum, it) => sum + (it.unit_cost ?? 0) * (it.qty ?? 0),
    0,
  );
}

function formatPrLabel(request: RequestRow) {
  return request.pr_no ?? "No PR yet";
}

function parseContractFileUrls(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((entry) => typeof entry === "string");
    }
  } catch {
    // Fall back to treating the value as a single URL.
  }
  return [value];
}

type ActionConfig = {
  label: string;
  status: RequestStatus;
  icon: typeof XCircle;
  tone: "amber" | "blue" | "green" | "violet" | "red";
};

type ActionSet = {
  primary?: ActionConfig;
  negative?: ActionConfig;
};

function getActions(
  request: RequestRow,
  userRole: string | null | undefined,
): ActionSet {
  if (!userRole) return {};

  const current = request.status;
  const idx = STATUS_FLOW.indexOf(normalizeFlowStatus(current));

  // Special case: requests returned for personal action can be validated and
  // advanced by the role responsible for the next status after the return point.
  if (current === "returned_for_action") {
    const resumeStatus = getResumeStatusAfterReturnForAction(request);
    if (!resumeStatus) return {};
    const responsibleRole = STATUS_RESPONSIBLE_ROLE[resumeStatus];
    if (userRole !== responsibleRole) return {};
    return {
      primary: {
        label: "Validate & Approve",
        status: resumeStatus,
        icon: PlayCircle,
        tone: "blue",
      },
    };
  }

  // If this is the last status (completed) or returned, no further actions
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return {};

  const nextStatus = STATUS_FLOW[idx + 1];

  // Check if the user's role is allowed to advance to the next status
  const responsibleRole = STATUS_RESPONSIBLE_ROLE[nextStatus];
  const canAdvance = userRole === responsibleRole;

  // Return button: only the role responsible for advancing can also return,
  // and only workflow actors (Accounting / Procurement / Supply) have return capability.
  const canReturn =
    canAdvance &&
    (userRole === "accounting_admin" ||
      userRole === "procurement_admin" ||
      userRole === "supply_admin");

  if (!canAdvance && !canReturn) return {};

  // Determine label and tone for the next step
  const toneByPhase =
    idx < 2 ? "amber" : idx < 14 ? "blue" : idx < 20 ? "violet" : "green";

  return {
    ...(canAdvance
      ? {
          primary: {
            label: STATUS_SHORT_LABELS[nextStatus] ?? nextStatus,
            status: nextStatus,
            icon: PlayCircle,
            tone: toneByPhase,
          },
        }
      : {}),
    ...(canReturn
      ? {
          negative: {
            label: "Return",
            status:
              current === "request_sent"
                ? ("returned_for_revision" as RequestStatus)
                : ("returned_for_action" as RequestStatus),
            icon: RotateCcw,
            tone: "red",
          },
        }
      : {}),
  };
}

export default function Requests() {
  const { user, role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | RequestStatus>("");
  const [viewRequest, setViewRequest] = useState<RequestRow | null>(null);
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [actionError, setActionError] = useState<string>("");
  const [specialNoticeModal, setSpecialNoticeModal] = useState<{
    request: RequestRow;
    newStatus: SpecialNoticeStatus;
  } | null>(null);
  const [extraEmails, setExtraEmails] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingVenue, setMeetingVenue] = useState("");
  const [specialNoticeError, setSpecialNoticeError] = useState("");
  const viewContractFiles = viewRequest
    ? parseContractFileUrls(viewRequest.contract_file_url)
    : [];

  async function openView(r: RequestRow) {
    setViewLoading(true);
    try {
      const full = await fetchRequestById(r.id);
      setViewRequest(full);
    } catch {
      setViewRequest(r);
    } finally {
      setViewLoading(false);
    }
  }

  async function openViewById(requestId: string) {
    setViewLoading(true);
    try {
      const full = await fetchRequestById(requestId);
      setViewRequest(full);
    } catch (err) {
      console.error("Failed to load request view:", err);
    } finally {
      setViewLoading(false);
    }
  }

  // Return/Decline modal state
  const [noteModal, setNoteModal] = useState<{
    requestId: string;
    newStatus: RequestStatus;
    title: string;
  } | null>(null);
  const [noteText, setNoteText] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchRequestsLight();
      setData(rows);
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId) return;
    void openViewById(openId);
  }, [searchParams]);

  useEffect(() => {
    if (!user?.id) return;

    const refresh = () => {
      void loadData();
    };

    const channel = supabase
      .channel(`admin-requests-records-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "requests",
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "requests",
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "requests",
        },
        refresh,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, loadData]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((r) => {
      const prMatches =
        (r.pr_no ?? "").toLowerCase().includes(q) ||
        (r.pr_groups ?? [])
          .map((g) => g.pr_no.toLowerCase())
          .some((value) => value.includes(q));

      const matchesQuery =
        !q ||
        prMatches ||
        (r.purpose ?? "").toLowerCase().includes(q) ||
        (r.college?.code ?? "").toLowerCase().includes(q) ||
        (r.program?.code ?? "").toLowerCase().includes(q) ||
        (r.creator
          ? `${r.creator.first_name} ${r.creator.last_name}`
              .toLowerCase()
              .includes(q)
          : false);

      const matchesStatus = !statusFilter || r.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [data, query, statusFilter]);

  const money = useMemo(
    () =>
      new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }),
    [],
  );

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  async function handleAdvanceStatus(
    requestId: string,
    newStatus: RequestStatus,
    note?: string,
    additionalNotice?: {
      status: SpecialNoticeStatus;
      ownerName: string;
      ownerEmail?: string | null;
      prNo: string;
      additionalEmails: string[];
      meetingDate?: string;
      meetingTime?: string;
      venue?: string;
    },
  ) {
    if (!user?.id) return;
    setAdvancing(requestId);
    setActionError("");
    try {
      await updateRequestStatus({
        requestId,
        newStatus,
        updatedBy: user.id,
        note: note || DEFAULT_STATUS_NOTES[newStatus],
      });

      if (additionalNotice) {
        try {
          await sendSpecialStatusNotice({
            status: additionalNotice.status,
            prNo: additionalNotice.prNo,
            ownerName: additionalNotice.ownerName,
            ownerEmail: additionalNotice.ownerEmail,
            additionalEmails: additionalNotice.additionalEmails,
            meetingDate: additionalNotice.meetingDate,
            meetingTime: additionalNotice.meetingTime,
            venue: additionalNotice.venue,
          });
        } catch (extraNoticeError) {
          const message =
            extraNoticeError instanceof Error
              ? extraNoticeError.message
              : "Failed to send additional email notification.";
          setActionError(
            `Status updated, but additional email failed: ${message}`,
          );
        }
      }

      await loadData();
    } catch (err) {
      console.error("Status update failed:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update request status. Please try again.";
      setActionError(message);
    } finally {
      setAdvancing(null);
    }
  }

  /** Open note modal for negative actions (Return / Decline). */
  function openNoteModal(
    requestId: string,
    newStatus: RequestStatus,
    title: string,
  ) {
    setNoteModal({ requestId, newStatus, title });
    setNoteText("");
  }

  async function submitNoteModal() {
    if (!noteModal) return;
    await handleAdvanceStatus(
      noteModal.requestId,
      noteModal.newStatus,
      noteText || undefined,
    );
    setNoteModal(null);
    setNoteText("");
  }

  async function submitSpecialNoticeModal() {
    if (!specialNoticeModal) return;

    const ownerEmail = specialNoticeModal.request.creator?.email;
    if (!ownerEmail) {
      setSpecialNoticeError(
        "Cannot send additional notice because the request owner has no email address.",
      );
      return;
    }

    const parsedEmails = parseEmailList(extraEmails);
    if (parsedEmails.length > 0 && !validateEmails(parsedEmails)) {
      setSpecialNoticeError(
        "One or more additional email addresses are invalid.",
      );
      return;
    }

    if (
      (specialNoticeModal.newStatus === "notice_of_meeting" ||
        specialNoticeModal.newStatus === "hope_approval") &&
      (!meetingDate || !meetingTime || !meetingVenue.trim())
    ) {
      setSpecialNoticeError(
        "Please provide date, time, and venue for this meeting notice.",
      );
      return;
    }

    setSpecialNoticeError("");

    const ownerName = specialNoticeModal.request.creator
      ? `${specialNoticeModal.request.creator.first_name} ${specialNoticeModal.request.creator.last_name}`
      : "Request Owner";

    await handleAdvanceStatus(
      specialNoticeModal.request.id,
      specialNoticeModal.newStatus,
      undefined,
      {
        status: specialNoticeModal.newStatus,
        ownerName,
        ownerEmail,
        prNo:
          specialNoticeModal.request.pr_groups?.[0]?.pr_no ??
          specialNoticeModal.request.pr_no ??
          specialNoticeModal.request.id,
        additionalEmails: parsedEmails,
        meetingDate: meetingDate || undefined,
        meetingTime: meetingTime || undefined,
        venue: meetingVenue.trim() || undefined,
      },
    );

    setSpecialNoticeModal(null);
    setExtraEmails("");
    setMeetingDate("");
    setMeetingTime("");
    setMeetingVenue("");
    setSpecialNoticeError("");
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              All Procurement Requests
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage all procurement requests
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Filters */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="Search by PR number, purpose, college, requester..."
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500">
                  <Filter className="h-4 w-4" />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setPage(1);
                  }}
                  className="h-10 min-w-[160px] rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">All Status</option>
                  {STATUS_FLOW.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_SHORT_LABELS[s]}
                    </option>
                  ))}
                  <option value="returned_for_revision">
                    Returned for Revision
                  </option>
                  <option value="returned_for_action">
                    Returned for Personal Fix
                  </option>
                </select>
              </div>
            </div>
          </div>

          {actionError && (
            <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {actionError}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1020px]">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-5 py-3">PR Number</th>
                      <th className="px-5 py-3">Purpose</th>
                      <th className="px-5 py-3">Requester</th>
                      <th className="px-5 py-3">College</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {current.map((r) => {
                      const actions = getActions(r, role);
                      return (
                        <tr key={r.id} className="text-sm text-gray-700">
                          <td className="px-5 py-4">
                            <div className="font-medium text-gray-900">
                              {formatPrLabel(r)}
                            </div>
                          </td>
                          <td className="px-5 py-4 max-w-[180px] truncate">
                            {r.purpose || "—"}
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            {r.creator
                              ? `${r.creator.first_name} ${r.creator.last_name}`
                              : "—"}
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            {r.college?.code ?? "—"}
                          </td>
                          <td className="px-5 py-4 text-gray-600">
                            {new Date(r.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4 font-medium text-gray-900 whitespace-nowrap">
                            {money.format(itemsTotal(r.items))}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-center">
                              <StatusPill status={r.status} />
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {/* View */}
                              <button
                                type="button"
                                disabled={viewLoading}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                                onClick={() => openView(r)}
                                title="View details"
                              >
                                {viewLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>

                              {/* Download PR */}
                              {STATUS_FLOW.indexOf(
                                normalizeFlowStatus(r.status),
                              ) >= 1 && (
                                <button
                                  type="button"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-green-600 hover:bg-green-50"
                                  onClick={async () => {
                                    try {
                                      const full = await fetchRequestById(r.id);
                                      generatePrDocument(full);
                                    } catch (err) {
                                      console.error(
                                        "Failed to load request for PR download:",
                                        err,
                                      );
                                      generatePrDocument(r);
                                    }
                                  }}
                                  title="Download PR"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                              )}

                              {r.status === "contract_awarded" &&
                                (role === "procurement_admin" ||
                                  role === "supply_admin") && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={advancing === r.id}
                                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                                      onClick={() =>
                                        handleAdvanceStatus(r.id, "po_issued")
                                      }
                                      title="Purchase Order Issued (Supply)"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                      PO Issued
                                    </button>
                                    <button
                                      type="button"
                                      disabled={advancing === r.id}
                                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                                      onClick={() =>
                                        handleAdvanceStatus(r.id, "ntp_issued")
                                      }
                                      title="Notice to Proceed Issued (Procurement)"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                      NTP Issued
                                    </button>
                                  </>
                                )}

                              {/* Primary action */}
                              {actions.primary &&
                                r.status !== "contract_awarded" && (
                                  <button
                                    type="button"
                                    disabled={advancing === r.id}
                                    className={[
                                      "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50",
                                      actions.primary.tone === "amber"
                                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                        : actions.primary.tone === "blue"
                                          ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                          : actions.primary.tone === "green"
                                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                                            : "bg-violet-50 text-violet-700 hover:bg-violet-100",
                                    ].join(" ")}
                                    onClick={() => {
                                      const nextStatus =
                                        actions.primary!.status;
                                      if (isSpecialNoticeStatus(nextStatus)) {
                                        setSpecialNoticeModal({
                                          request: r,
                                          newStatus: nextStatus,
                                        });
                                        setExtraEmails("");
                                        setMeetingDate("");
                                        setMeetingTime("");
                                        setMeetingVenue("");
                                        setSpecialNoticeError("");
                                        return;
                                      }

                                      handleAdvanceStatus(r.id, nextStatus);
                                    }}
                                    title={actions.primary.label}
                                  >
                                    <actions.primary.icon className="h-3.5 w-3.5" />
                                    {actions.primary.label}
                                  </button>
                                )}

                              {/* Negative action (opens note modal) */}
                              {actions.negative && (
                                <button
                                  type="button"
                                  disabled={advancing === r.id}
                                  className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                                  onClick={() =>
                                    openNoteModal(
                                      r.id,
                                      actions.negative!.status,
                                      actions.negative!.label,
                                    )
                                  }
                                  title={actions.negative.label}
                                >
                                  <actions.negative.icon className="h-3.5 w-3.5" />
                                  {actions.negative.label}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {current.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-5 py-10 text-center text-sm text-gray-500"
                        >
                          No requests found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer / Pagination */}
              <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-500">
                  Showing {current.length} of {filtered.length} requests
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>

                  {Array.from(
                    { length: Math.min(totalPages, 5) },
                    (_, i) => i + 1,
                  ).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={[
                        "h-9 w-9 rounded-lg border text-sm font-semibold",
                        page === p
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                      ].join(" ")}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xl font-semibold text-gray-900">
                    {formatPrLabel(viewRequest)}
                  </div>
                  {viewRequest.pr_groups &&
                    viewRequest.pr_groups.length > 0 && (
                      <div className="mt-1 text-xs text-gray-500">
                        {viewRequest.pr_groups
                          .map((g) => `${g.pr_no} — ${g.category}`)
                          .join(" | ")}
                      </div>
                    )}
                  <div className="mt-1 text-sm text-gray-500">
                    {viewRequest.purpose || "No purpose"}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setViewRequest(null);
                    if (searchParams.has("open")) {
                      searchParams.delete("open");
                      setSearchParams(searchParams, { replace: true });
                    }
                  }}
                  className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm mb-5">
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    College
                  </div>
                  <div className="mt-1 text-gray-900">
                    {viewRequest.college?.name ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Program
                  </div>
                  <div className="mt-1 text-gray-900">
                    {viewRequest.program?.name ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Requester
                  </div>
                  <div className="mt-1 text-gray-900">
                    {viewRequest.creator
                      ? `${viewRequest.creator.first_name} ${viewRequest.creator.last_name}`
                      : "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </div>
                  <div className="mt-1">
                    <StatusPill status={viewRequest.status} />
                  </div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Date
                  </div>
                  <div className="mt-1 text-gray-900">
                    {new Date(viewRequest.created_at).toLocaleDateString()}
                  </div>
                </div>
                {viewRequest.fund_source && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Fund Source
                    </div>
                    <div className="mt-1 text-gray-900">
                      {viewRequest.fund_source}
                    </div>
                  </div>
                )}
                {viewRequest.requested_by && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Requested by
                    </div>
                    <div className="mt-1 text-gray-900">
                      {viewRequest.requested_by}
                    </div>
                  </div>
                )}
                {viewRequest.reviewed_by && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Reviewed by
                    </div>
                    <div className="mt-1 text-gray-900">
                      {viewRequest.reviewed_by}
                    </div>
                  </div>
                )}
              </div>

              {viewRequest.items && viewRequest.items.length > 0 && (
                <div className="mb-5">
                  <div className="text-xs font-semibold uppercase text-gray-500 mb-2">
                    Items
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-semibold uppercase text-gray-500">
                          <th className="px-3 py-2">Category</th>
                          <th className="px-3 py-2">Description</th>
                          <th className="px-3 py-2">Preferred Brand</th>
                          <th className="px-3 py-2">Qty</th>
                          <th className="px-3 py-2">UOM</th>
                          <th className="px-3 py-2">Unit Cost</th>
                          <th className="px-3 py-2">Total</th>
                          <th className="px-3 py-2">Inspection Notes</th>
                          <th className="px-3 py-2">Inspection File</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {viewRequest.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2 text-gray-500">
                              {item.category || "—"}
                            </td>
                            <td className="px-3 py-2">
                              {item.item_description}
                            </td>
                            <td className="px-3 py-2">
                              {item.preferred_brand || "—"}
                            </td>
                            <td className="px-3 py-2">{item.qty}</td>
                            <td className="px-3 py-2">{item.uom}</td>
                            <td className="px-3 py-2">
                              {item.unit_cost
                                ? money.format(Number(item.unit_cost))
                                : "—"}
                            </td>
                            <td className="px-3 py-2 font-medium">
                              {item.total_cost
                                ? money.format(Number(item.total_cost))
                                : "—"}
                            </td>
                            <td className="px-3 py-2">
                              {item.inspection_notes || "—"}
                            </td>
                            <td className="px-3 py-2">
                              {item.inspection_file_url ? (
                                <a
                                  href={item.inspection_file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  View
                                </a>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2 text-right text-sm font-semibold text-gray-900">
                    Total: {money.format(itemsTotal(viewRequest.items))}
                  </div>
                </div>
              )}

              {(viewRequest.contract_amount != null ||
                viewRequest.contract_file_url) && (
                <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  <div className="font-semibold">Contract Details</div>
                  {viewRequest.contract_amount != null && (
                    <div className="mt-1">
                      Amount:{" "}
                      {money.format(Number(viewRequest.contract_amount))}
                    </div>
                  )}
                  {viewContractFiles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-3">
                      {viewContractFiles.map((url, index) => (
                        <a
                          key={`${url}-${index}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          {`View Contract File${viewContractFiles.length > 1 ? " " + (index + 1) : ""}`}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase text-gray-500 mb-2">
                  Order Tracking
                </div>
                <StatusTimeline
                  currentStatus={viewRequest.status}
                  statusLogs={viewRequest.status_logs}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Notice Modal for Selected Statuses */}
      {specialNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {getSpecialNoticeTitle(specialNoticeModal.newStatus)}
              </h3>
              <button
                onClick={() => setSpecialNoticeModal(null)}
                className="rounded-lg p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              This action sends an automated notice to the request owner. You
              may add additional recipients for this update.
            </p>

            {specialNoticeError && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {specialNoticeError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Owner Email (auto)
                </label>
                <input
                  type="text"
                  readOnly
                  value={
                    specialNoticeModal.request.creator?.email ??
                    "No owner email"
                  }
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Additional Recipient Emails (optional)
                </label>
                <textarea
                  value={extraEmails}
                  onChange={(e) => setExtraEmails(e.target.value)}
                  placeholder="name1@email.com, name2@email.com"
                  className="w-full min-h-[84px] resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {(specialNoticeModal.newStatus === "notice_of_meeting" ||
                specialNoticeModal.newStatus === "hope_approval") && (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Meeting Date
                      </label>
                      <input
                        type="date"
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Meeting Time
                      </label>
                      <input
                        type="time"
                        value={meetingTime}
                        onChange={(e) => setMeetingTime(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Venue / Platform
                    </label>
                    <input
                      type="text"
                      value={meetingVenue}
                      onChange={(e) => setMeetingVenue(e.target.value)}
                      placeholder="Conference Room / Online Link"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </>
              )}

              {specialNoticeModal.newStatus === "issuance" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Pick-up / Delivery Venue (optional)
                  </label>
                  <input
                    type="text"
                    value={meetingVenue}
                    onChange={(e) => setMeetingVenue(e.target.value)}
                    placeholder="Supply Office / Delivery Point"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSpecialNoticeModal(null)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={advancing === specialNoticeModal.request.id}
                onClick={submitSpecialNoticeModal}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {advancing === specialNoticeModal.request.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
                Confirm & Send Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return / Decline Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {noteModal.title}
              </h3>
              <button
                onClick={() => setNoteModal(null)}
                className="rounded-lg p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-3">
              Please provide a reason or note for the requester.
            </p>

            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full min-h-[100px] resize-y rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              placeholder="Reason for returning/declining this request..."
              autoFocus
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setNoteModal(null)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={advancing !== null}
                onClick={submitNoteModal}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {advancing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Confirm {noteModal.title}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
