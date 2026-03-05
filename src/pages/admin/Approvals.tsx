// src/pages/admin/Approvals.tsx
import { useCallback, useEffect, useState } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Check,
  FileText,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchRequests,
  approveRequest,
  rejectRequest,
  type RequestRow,
  type RequestStatus,
  STATUS_LABELS,
} from "../../lib/requests";

function money(n: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(n);
}

function Badge({ text, tone }: { text: string; tone?: string }) {
  const cls =
    tone === "green"
      ? "bg-green-100 text-green-700"
      : tone === "red"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cls}`}
    >
      {text}
    </span>
  );
}

function Step({
  label,
  state,
}: {
  label: string;
  state: "done" | "current" | "todo";
}) {
  const map = {
    done: {
      ring: "bg-green-500 text-white",
      icon: <Check className="h-4 w-4" />,
    },
    current: {
      ring: "bg-amber-500 text-white",
      icon: <Clock className="h-4 w-4" />,
    },
    todo: {
      ring: "bg-white text-gray-400 border border-gray-200",
      icon: <User className="h-4 w-4" />,
    },
  }[state];

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`h-11 w-11 rounded-full flex items-center justify-center ${map.ring}`}
      >
        {map.icon}
      </div>
      <div className="text-xs font-medium text-gray-600 text-center">
        {label}
      </div>
    </div>
  );
}

function getStepState(
  status: RequestStatus,
  step:
    | "submitted"
    | "head_review"
    | "budget_review"
    | "procurement"
    | "purchase_order",
): "done" | "current" | "todo" {
  const order: Record<string, number> = {
    submitted: 0,
    head_review: 1,
    budget_review: 2,
    procurement_processing: 3,
    purchase_order: 4,
  };
  const stepOrder: Record<string, number> = {
    submitted: 0,
    head_review: 1,
    budget_review: 2,
    procurement: 3,
    purchase_order: 4,
  };
  const current = order[status] ?? 0;
  const stepIdx = stepOrder[step];
  if (current > stepIdx) return "done";
  if (current === stepIdx) return "current";
  return "todo";
}

function itemsTotal(items?: { unit_cost: number | null; qty: number }[]) {
  if (!items) return 0;
  return items.reduce(
    (sum, it) => sum + (it.unit_cost ?? 0) * (it.qty ?? 0),
    0,
  );
}

export default function Approvals() {
  const { user } = useAuth();
  const [pending, setPending] = useState<RequestRow[]>([]);
  const [recentActions, setRecentActions] = useState<RequestRow[]>([]);
  const [selected, setSelected] = useState<RequestRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const all = await fetchRequests();
      const pendingList = all.filter((r) => r.status === "submitted");
      const actionedList = all
        .filter((r) => r.status === "head_review" || r.status === "rejected")
        .slice(0, 5);
      setPending(pendingList);
      setRecentActions(actionedList);
      if (pendingList.length > 0 && !selected) {
        setSelected(pendingList[0]);
      }
    } catch (err) {
      console.error("Failed to load approvals:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleApprove() {
    if (!selected || !user?.id) return;
    setActing(true);
    try {
      await approveRequest(selected.id, user.id);
      setSelected(null);
      await loadData();
    } catch (err) {
      console.error("Approve failed:", err);
    } finally {
      setActing(false);
    }
  }

  async function handleReject() {
    if (!selected || !user?.id) return;
    setActing(true);
    try {
      await rejectRequest(selected.id, user.id, rejectNote || undefined);
      setShowRejectModal(false);
      setRejectNote("");
      setSelected(null);
      await loadData();
    } catch (err) {
      console.error("Reject failed:", err);
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Department Head Review
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and approve or reject pending procurement requests
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
          {/* LEFT COLUMN */}
          <div className="space-y-4">
            {/* Approval Queue */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 text-sm font-semibold text-gray-900">
                Pending Review ({pending.length})
              </div>

              {pending.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">
                  <FileText className="mx-auto h-8 w-8 mb-2 text-gray-300" />
                  No pending requests
                </div>
              ) : (
                <div className="space-y-3">
                  {pending.map((q) => {
                    const active = q.id === selected?.id;
                    const total = itemsTotal(q.items);
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setSelected(q)}
                        className={[
                          "w-full rounded-xl border p-4 text-left transition-colors",
                          active
                            ? "border-blue-200 bg-blue-50"
                            : "border-gray-200 bg-white hover:bg-gray-50",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-blue-700">
                              {q.pr_no ?? "—"}
                            </div>
                            <div className="mt-1 text-sm font-semibold text-gray-900 line-clamp-2">
                              {q.purpose || "No purpose specified"}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {q.college?.code} / {q.program?.code}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                            {total > 0 && (
                              <div className="text-sm font-semibold text-gray-900">
                                {money(total)}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Actions */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 text-sm font-semibold text-gray-900">
                Recent Actions
              </div>

              {recentActions.length === 0 ? (
                <div className="py-4 text-center text-sm text-gray-400">
                  No recent actions
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActions.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4"
                    >
                      <div>
                        <div className="text-xs text-gray-500">
                          {a.pr_no ?? "—"}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-gray-900 line-clamp-1">
                          {a.purpose || "No purpose"}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {new Date(a.updated_at).toLocaleDateString()}
                        </div>
                      </div>

                      {a.status !== "rejected" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          {selected ? (
            <div className="space-y-4">
              {/* Details */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {selected.purpose || "No purpose specified"}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {selected.pr_no ?? "—"}
                    </div>
                  </div>
                  <Badge text={STATUS_LABELS[selected.status]} />
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      College / Program
                    </div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {selected.college?.name ?? "—"} /{" "}
                      {selected.program?.name ?? "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Requested By
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-900">
                      <User className="h-4 w-4 text-gray-400" />
                      {selected.creator
                        ? `${selected.creator.first_name} ${selected.creator.last_name}`
                        : "Unknown"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Date Submitted
                    </div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {new Date(selected.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Estimated Amount
                    </div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">
                      {money(itemsTotal(selected.items))}
                    </div>
                  </div>

                  {selected.fund_source && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Fund Source
                      </div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {selected.fund_source}
                      </div>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                {selected.items && selected.items.length > 0 && (
                  <div className="mt-6">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                      Request Items
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            <th className="px-4 py-2">Stock No.</th>
                            <th className="px-4 py-2">Description</th>
                            <th className="px-4 py-2">Qty</th>
                            <th className="px-4 py-2">UOM</th>
                            <th className="px-4 py-2">Unit Cost</th>
                            <th className="px-4 py-2">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selected.items.map((item) => (
                            <tr key={item.id} className="text-gray-700">
                              <td className="px-4 py-2 text-gray-500">
                                {item.stock_no || "—"}
                              </td>
                              <td className="px-4 py-2">
                                {item.item_description}
                              </td>
                              <td className="px-4 py-2">{item.qty}</td>
                              <td className="px-4 py-2">{item.uom}</td>
                              <td className="px-4 py-2">
                                {item.unit_cost
                                  ? money(Number(item.unit_cost))
                                  : "—"}
                              </td>
                              <td className="px-4 py-2 font-medium">
                                {item.total_cost
                                  ? money(Number(item.total_cost))
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 text-sm font-semibold text-gray-900">
                  Approval Progress
                </div>

                <div className="relative">
                  <div className="absolute left-6 right-6 top-[22px] h-[2px] bg-gray-200" />

                  <div className="relative grid grid-cols-5">
                    <Step
                      label="Submitted"
                      state={getStepState(selected.status, "submitted")}
                    />
                    <Step
                      label="Head Review"
                      state={getStepState(selected.status, "head_review")}
                    />
                    <Step
                      label="Budget Review"
                      state={getStepState(selected.status, "budget_review")}
                    />
                    <Step
                      label="Procurement"
                      state={getStepState(selected.status, "procurement")}
                    />
                    <Step
                      label="Purchase Order"
                      state={getStepState(selected.status, "purchase_order")}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons — only show for pending requests */}
              {selected.status === "submitted" && (
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="text-sm font-semibold text-gray-900">
                    Department Head Decision
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Review the details above and approve or reject this request
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={acting}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      onClick={() => setShowRejectModal(true)}
                    >
                      <XCircle className="h-5 w-5" />
                      Reject Request
                    </button>

                    <button
                      type="button"
                      disabled={acting}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      onClick={handleApprove}
                    >
                      {acting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5" />
                      )}
                      Approve Request
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-20 shadow-sm">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-300" />
                <div className="mt-3 text-sm text-gray-500">
                  Select a request from the queue to review
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="text-lg font-semibold text-gray-900">
              Reject Request
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Provide a reason for rejecting this request (optional)
            </p>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              className="mt-4 w-full min-h-[80px] rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
              placeholder="Reason for rejection..."
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectNote("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={acting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                onClick={handleReject}
              >
                {acting ? "Rejecting…" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
