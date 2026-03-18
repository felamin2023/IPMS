// src/pages/user/Requests.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Eye,
  Download,
  Loader2,
  X,
  PackageCheck,
  Edit,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchRequestsLight,
  fetchRequestById,
  confirmReceipt,
  canEditReturnedRequest,
  type RequestRow,
  type RequestStatus,
  STATUS_SHORT_LABELS,
  STATUS_TONE,
  STATUS_FLOW,
  getDisplayNote,
} from "../../lib/requests";
import { supabase } from "../../lib/supabase";
import { generatePrDocument } from "../../lib/generatePr.ts";
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

export default function Requests() {
  const { user } = useAuth();
  const [data, setData] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | RequestStatus>("");
  const [viewRequest, setViewRequest] = useState<RequestRow | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [noteModal, setNoteModal] = useState<{
    title: string;
    note: string;
  } | null>(null);
  const [receiptRequest, setReceiptRequest] = useState<RequestRow | null>(null);
  const [receiptItems, setReceiptItems] = useState<
    { id: string; receivedQty: number; damageNotes: string }[]
  >([]);
  const [submittingReceipt, setSubmittingReceipt] = useState(false);

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

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const rows = await fetchRequestsLight({ createdBy: user.id });
      setData(rows);
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user?.id) return;

    const refresh = () => {
      void loadData();
    };

    const channel = supabase
      .channel(`user-requests-records-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "requests",
          filter: `created_by=eq.${user.id}`,
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "requests",
          filter: `created_by=eq.${user.id}`,
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "requests",
          filter: `created_by=eq.${user.id}`,
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
      const matchesQuery =
        !q ||
        (r.pr_no ?? "").toLowerCase().includes(q) ||
        (r.purpose ?? "").toLowerCase().includes(q) ||
        (r.college?.code ?? "").toLowerCase().includes(q) ||
        (r.program?.code ?? "").toLowerCase().includes(q);

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

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            My Procurement Requests
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View your submitted procurement requests
          </p>
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
                  placeholder="Search by PR number, purpose, college..."
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

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px]">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-5 py-3">PR Number</th>
                      <th className="px-5 py-3">Purpose</th>
                      <th className="px-5 py-3">College / Program</th>
                      <th className="px-5 py-3">Date Submitted</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3 text-center">Status</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {current.map((r) => (
                      <tr key={r.id} className="text-sm text-gray-700">
                        <td className="px-5 py-4 font-medium text-gray-900">
                          {r.pr_no ?? "No PR yet"}
                        </td>
                        <td className="px-5 py-4 max-w-[200px] truncate">
                          {r.purpose || "—"}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {r.college?.code} / {r.program?.code}
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-4 font-semibold text-gray-900 whitespace-nowrap">
                          {money.format(itemsTotal(r.items))}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-col items-center gap-1">
                            <StatusPill status={r.status} />
                            {(r.status === "returned_for_revision" ||
                              r.status === "returned_for_action") &&
                              (() => {
                                const latestLog = r.status_logs
                                  ?.filter(
                                    (l) => l.note && l.status === r.status,
                                  )
                                  .sort(
                                    (a, b) =>
                                      new Date(b.created_at).getTime() -
                                      new Date(a.created_at).getTime(),
                                  )[0];
                                const note = latestLog
                                  ? getDisplayNote(
                                      latestLog.status,
                                      latestLog.note,
                                    )
                                  : null;
                                return note ? (
                                  <button
                                    type="button"
                                    className="text-xs text-red-600 hover:text-red-800 underline underline-offset-2 max-w-[140px] truncate"
                                    title={note}
                                    onClick={() =>
                                      setNoteModal({
                                        title:
                                          r.status === "returned_for_revision"
                                            ? "Return Note (For Revision)"
                                            : "Return Note (For Personal Fix)",
                                        note,
                                      })
                                    }
                                  >
                                    View Note
                                  </button>
                                ) : null;
                              })()}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-700 text-sm"
                              onClick={() => openView(r)}
                            >
                              {viewLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                              View
                            </button>
                            {r.status === "issuance" && (
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-emerald-600 font-semibold hover:text-emerald-700 text-sm"
                                onClick={() => {
                                  setReceiptRequest(r);
                                  setReceiptItems(
                                    (r.items ?? []).map((it) => ({
                                      id: it.id,
                                      receivedQty: it.qty,
                                      damageNotes: "",
                                    })),
                                  );
                                }}
                              >
                                <PackageCheck className="h-4 w-4" />
                                Confirm Receipt
                              </button>
                            )}
                            {STATUS_FLOW.indexOf(r.status) >= 1 && (
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-green-600 font-semibold hover:text-green-700 text-sm"
                                onClick={() => generatePrDocument(r)}
                              >
                                <Download className="h-4 w-4" />
                                PR
                              </button>
                            )}
                            {canEditReturnedRequest(r) && (
                              <Link
                                to={`/user/edit-request/${r.id}`}
                                className="inline-flex items-center gap-1 text-orange-600 font-semibold hover:text-orange-700 text-sm"
                              >
                                <Edit className="h-4 w-4" />
                                Edit & Resubmit
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {current.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-10 text-center text-sm text-gray-500"
                        >
                          {data.length === 0
                            ? "You haven't submitted any requests yet."
                            : "No requests found."}
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
                  {viewRequest.pr_no ?? "No PR yet"}
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

            {/* Return Note Banner */}
            {(viewRequest.status === "returned_for_revision" ||
              viewRequest.status === "returned_for_action") &&
              (() => {
                const returnStatus = viewRequest.status;
                const returnLog = viewRequest.status_logs
                  ?.filter((l) => l.status === returnStatus)
                  .sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() -
                      new Date(a.created_at).getTime(),
                  )[0];
                return returnLog ? (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-red-600 text-xs font-bold">
                          !
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-red-800">
                          {returnStatus === "returned_for_revision"
                            ? "Returned for Revision"
                            : "Returned for Personal Fix"}
                        </div>
                        <p className="mt-1 text-sm text-red-700">
                          {getDisplayNote(returnStatus, returnLog.note) ||
                            "This request has been returned. Please coordinate with the assigned office for details."}
                        </p>
                        <div className="mt-2 text-xs text-red-500">
                          {returnLog.updater
                            ? `By ${returnLog.updater.first_name} ${returnLog.updater.last_name}`
                            : ""}
                          {" • "}
                          {new Date(returnLog.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

            {/* Issuance — prompt to confirm receipt */}
            {viewRequest.status === "issuance" && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <div className="text-sm font-semibold text-emerald-800">
                      Items Ready for Pickup
                    </div>
                    <p className="mt-1 text-sm text-emerald-700">
                      Your items have been issued. Please confirm receipt and
                      report any concerns.
                    </p>
                    <button
                      type="button"
                      className="mt-2 inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      onClick={() => {
                        setReceiptRequest(viewRequest);
                        setReceiptItems(
                          (viewRequest.items ?? []).map((it) => ({
                            id: it.id,
                            receivedQty: it.qty,
                            damageNotes: "",
                          })),
                        );
                        setViewRequest(null);
                      }}
                    >
                      <PackageCheck className="h-3.5 w-3.5" />
                      Confirm Receipt
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Status Timeline */}
            <StatusTimeline
              currentStatus={viewRequest.status}
              statusLogs={viewRequest.status_logs}
            />

            {/* Download button */}
            {STATUS_FLOW.indexOf(viewRequest.status) >= 1 && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  onClick={() => generatePrDocument(viewRequest)}
                >
                  <Download className="h-4 w-4" />
                  Download PR Document
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note-only Modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="text-lg font-semibold text-gray-900">
                {noteModal.title}
              </div>
              <button
                onClick={() => setNoteModal(null)}
                className="rounded-lg p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 whitespace-pre-wrap">
              {noteModal.note}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setNoteModal(null)}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Confirmation Modal */}
      {receiptRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  Confirm Receipt of Items
                </div>
                <div className="text-sm text-gray-500">
                  {receiptRequest.pr_no ?? "No PR yet"} —{" "}
                  {receiptRequest.purpose || "No purpose"}
                </div>
              </div>
              <button
                onClick={() => {
                  setReceiptRequest(null);
                  setReceiptItems([]);
                }}
                className="rounded-lg p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Please verify the items you received. Adjust the received quantity
              if different from ordered, and note any damages or concerns.
            </p>

            <div className="space-y-4">
              {receiptRequest.items?.map((item, idx) => {
                const feedback = receiptItems[idx];
                if (!feedback) return null;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <div className="text-sm font-semibold text-gray-900">
                      {item.item_description}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Ordered: {item.qty} {item.uom}
                      {item.unit_cost
                        ? ` · ${money.format(Number(item.unit_cost))} each`
                        : ""}
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-gray-600">
                          Received Qty
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={item.qty}
                          value={feedback.receivedQty}
                          onChange={(e) => {
                            const val = Math.max(
                              0,
                              Math.min(item.qty, Number(e.target.value) || 0),
                            );
                            setReceiptItems((prev) =>
                              prev.map((f, i) =>
                                i === idx ? { ...f, receivedQty: val } : f,
                              ),
                            );
                          }}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                        />
                        {feedback.receivedQty < item.qty && (
                          <div className="mt-1 text-xs text-amber-600">
                            {item.qty - feedback.receivedQty} item(s) missing
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-600">
                          Damage / Concerns
                        </label>
                        <input
                          type="text"
                          value={feedback.damageNotes}
                          onChange={(e) =>
                            setReceiptItems((prev) =>
                              prev.map((f, i) =>
                                i === idx
                                  ? { ...f, damageNotes: e.target.value }
                                  : f,
                              ),
                            )
                          }
                          placeholder="None"
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setReceiptRequest(null);
                  setReceiptItems([]);
                }}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReceipt}
                onClick={async () => {
                  if (!user?.id || !receiptRequest) return;
                  setSubmittingReceipt(true);
                  try {
                    await confirmReceipt(
                      receiptRequest.id,
                      user.id,
                      receiptItems.map((f) => ({
                        itemId: f.id,
                        receivedQty: f.receivedQty,
                        damageNotes: f.damageNotes,
                      })),
                    );
                    setReceiptRequest(null);
                    setReceiptItems([]);
                    await loadData();
                  } catch (err) {
                    console.error("Failed to confirm receipt:", err);
                    alert(
                      err instanceof Error
                        ? err.message
                        : "Failed to confirm receipt",
                    );
                  } finally {
                    setSubmittingReceipt(false);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {submittingReceipt ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PackageCheck className="h-4 w-4" />
                )}
                Confirm Receipt & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
