// src/pages/admin/Requests.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  Search,
  Filter,
  Eye,
  Loader2,
  X,
  PlayCircle,
  XCircle,
  RotateCcw,
  Check,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchRequests,
  updateRequestStatus,
  type RequestRow,
  type RequestStatus,
  STATUS_LABELS,
  STATUS_SHORT_LABELS,
  STATUS_TONE,
  STATUS_FLOW,
  STATUS_RESPONSIBLE_ROLE,
} from "../../lib/requests";
import { generatePrDocument } from "../../lib/generatePr";
import StatusTimeline from "../../components/StatusTimeline";

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

/**
 * Return contextual action buttons based on current status AND the user's role.
 * Only shows actions if the user's role is responsible for the next status.
 */
function getActions(
  current: RequestStatus,
  userRole: string | null,
): {
  primary?: {
    label: string;
    status: RequestStatus;
    icon: typeof Check;
    tone: string;
  };
  negative?: {
    label: string;
    status: RequestStatus;
    icon: typeof XCircle;
    tone: string;
  };
} {
  const idx = STATUS_FLOW.indexOf(current);

  // Special case: returned requests can be re-validated by TWG
  if (current === "returned_for_revision" && userRole === "twg") {
    return {
      primary: {
        label: "Validate & Approve",
        status: "request_reviewed" as RequestStatus,
        icon: PlayCircle,
        tone: "amber",
      },
    };
  }

  // If this is the last status (completed) or returned, no further actions
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return {};

  const nextStatus = STATUS_FLOW[idx + 1];

  // Check if the user's role is allowed to advance to the next status
  const responsibleRole = STATUS_RESPONSIBLE_ROLE[nextStatus];
  const canAdvance = userRole === responsibleRole;

  // Check if the user's role can return for revision (TWG only)
  const canReturn = userRole === "twg";

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
            status: "returned_for_revision" as RequestStatus,
            icon: RotateCcw,
            tone: "red",
          },
        }
      : {}),
  };
}

export default function Requests() {
  const { user, role } = useAuth();
  const [data, setData] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | RequestStatus>("");
  const [viewRequest, setViewRequest] = useState<RequestRow | null>(null);
  const [advancing, setAdvancing] = useState<string | null>(null);

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
      const rows = await fetchRequests();
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((r) => {
      const matchesQuery =
        !q ||
        (r.pr_no ?? "").toLowerCase().includes(q) ||
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
  ) {
    if (!user?.id) return;
    setAdvancing(requestId);
    try {
      await updateRequestStatus({
        requestId,
        newStatus,
        updatedBy: user.id,
        note: note || `Status updated to ${STATUS_LABELS[newStatus]}`,
      });
      await loadData();
    } catch (err) {
      console.error("Status update failed:", err);
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
                </select>
              </div>
            </div>
          </div>

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
                      const actions = getActions(r.status, role);
                      return (
                        <tr key={r.id} className="text-sm text-gray-700">
                          <td className="px-5 py-4">
                            <div className="font-medium text-gray-900">
                              {r.pr_no ?? "—"}
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
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50"
                                onClick={() => setViewRequest(r)}
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              {/* Download PR */}
                              {STATUS_FLOW.indexOf(r.status) >= 1 && (
                                <button
                                  type="button"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-green-600 hover:bg-green-50"
                                  onClick={() => generatePrDocument(r)}
                                  title="Download PR"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                              )}

                              {/* Primary action */}
                              {actions.primary && (
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
                                  onClick={() =>
                                    handleAdvanceStatus(
                                      r.id,
                                      actions.primary!.status,
                                    )
                                  }
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {viewRequest.pr_no ?? "—"}
                </div>
                <div className="text-sm text-gray-500">
                  {viewRequest.purpose || "No purpose"}
                </div>
              </div>
              <button
                onClick={() => setViewRequest(null)}
                className="rounded-lg p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <div className="text-xs font-semibold uppercase text-gray-500">
                  College
                </div>
                <div className="mt-1 text-gray-900">
                  {viewRequest.college?.name ?? "—"}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-gray-500">
                  Program
                </div>
                <div className="mt-1 text-gray-900">
                  {viewRequest.program?.name ?? "—"}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-gray-500">
                  Requester
                </div>
                <div className="mt-1 text-gray-900">
                  {viewRequest.creator
                    ? `${viewRequest.creator.first_name} ${viewRequest.creator.last_name}`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-gray-500">
                  Status
                </div>
                <div className="mt-1">
                  <StatusPill status={viewRequest.status} />
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-gray-500">
                  Date
                </div>
                <div className="mt-1 text-gray-900">
                  {new Date(viewRequest.created_at).toLocaleDateString()}
                </div>
              </div>
              {viewRequest.fund_source && (
                <div>
                  <div className="text-xs font-semibold uppercase text-gray-500">
                    Fund Source
                  </div>
                  <div className="mt-1 text-gray-900">
                    {viewRequest.fund_source}
                  </div>
                </div>
              )}
            </div>

            {viewRequest.items && viewRequest.items.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold uppercase text-gray-500 mb-2">
                  Items
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-xs font-semibold uppercase text-gray-500">
                        <th className="px-3 py-2">Description</th>
                        <th className="px-3 py-2">Qty</th>
                        <th className="px-3 py-2">UOM</th>
                        <th className="px-3 py-2">Unit Cost</th>
                        <th className="px-3 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewRequest.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2">{item.item_description}</td>
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

            {/* Status Timeline */}
            <StatusTimeline
              currentStatus={viewRequest.status}
              statusLogs={viewRequest.status_logs}
            />
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
