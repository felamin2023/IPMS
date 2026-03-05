// src/pages/admin/Monitoring.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  Package,
  Check,
  Loader2,
  XCircle,
} from "lucide-react";
import {
  fetchRequests,
  type RequestRow,
  type RequestStatus,
  STATUS_LABELS,
  STATUS_FLOW,
} from "../../lib/requests";

// ── helpers ────────────────────────────────────────────

function stepIndexFor(status: RequestStatus): number {
  if (status === "rejected") return -1; // special
  const idx = STATUS_FLOW.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function progressFor(status: RequestStatus): { text: string; value: number } {
  if (status === "rejected") return { text: "Rejected", value: 0 };
  if (status === "purchase_order")
    return {
      text: `${STATUS_FLOW.length} of ${STATUS_FLOW.length}`,
      value: 100,
    };
  const idx = STATUS_FLOW.indexOf(status);
  const step = idx === -1 ? 1 : idx + 1;
  return {
    text: `${step} of ${STATUS_FLOW.length}`,
    value: Math.round((step / STATUS_FLOW.length) * 100),
  };
}

const TONE_MAP: Record<string, string> = {
  gray: "bg-gray-100 text-gray-700",
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  violet: "bg-violet-100 text-violet-700",
};

const STATUS_TONE_MAP: Record<RequestStatus, string> = {
  submitted: "gray",
  head_review: "amber",
  budget_review: "blue",
  procurement_processing: "green",
  purchase_order: "violet",
  rejected: "red",
};

function Pill({ status }: { status: RequestStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${TONE_MAP[STATUS_TONE_MAP[status]] ?? TONE_MAP.gray}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
      <div
        className="h-2 rounded-full bg-blue-600"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

const STEP_ICONS = [FileText, Clock, CheckCircle2, Package, Check] as const;

function StepIcon({
  index,
  activeIndex,
  icon: Icon,
}: {
  index: number;
  activeIndex: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const isDone = index < activeIndex;
  const isActive = index === activeIndex;

  const ring = isDone
    ? "bg-green-500 text-white"
    : isActive
      ? "bg-blue-600 text-white"
      : "bg-white text-gray-400 border border-gray-200";

  return (
    <div
      className={`h-11 w-11 rounded-full flex items-center justify-center ${ring}`}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

export default function Monitoring() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch non-completed, non-rejected requests (active pipeline)
      const all = await fetchRequests();
      // Show all except completed (admins may want to see the pipeline)
      const active = all.filter((r) => r.status !== "rejected");
      setRequests(active);
      if (active.length > 0 && !selectedId) setSelectedId(active[0].id);
    } catch (err) {
      console.error("Failed to load monitoring data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selected = useMemo(
    () => requests.find((r) => r.id === selectedId) ?? null,
    [requests, selectedId],
  );

  const activeStepIndex = selected ? stepIndexFor(selected.status) : 0;

  const steps = useMemo(
    () =>
      STATUS_FLOW.map((s, i) => ({
        key: s,
        label: STATUS_LABELS[s],
        icon: STEP_ICONS[i] ?? Check,
      })),
    [],
  );

  // Build timeline from real status_logs
  const timeline = useMemo(() => {
    if (!selected?.status_logs) return [];
    return [...selected.status_logs]
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
      .map((log, i, arr) => ({
        title: STATUS_LABELS[log.status as RequestStatus] ?? log.status,
        desc: log.note ?? "",
        by: log.updater
          ? `${log.updater.first_name} ${log.updater.last_name}`
          : undefined,
        time: new Date(log.created_at).toLocaleString(),
        state: (i < arr.length - 1 ? "done" : "current") as
          | "done"
          | "current"
          | "todo",
      }));
  }, [selected]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">
            Monitoring &amp; Tracking
          </h1>
          <p className="text-sm text-gray-500">No active requests to track.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Monitoring &amp; Tracking
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track the progress of procurement requests
          </p>
        </div>

        {/* Top Cards — show up to 6 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {requests.slice(0, 6).map((r) => {
            const active = r.id === selectedId;
            const prog = progressFor(r.status);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedId(r.id)}
                className={[
                  "rounded-2xl border bg-white p-5 text-left shadow-sm transition-colors",
                  active
                    ? "border-blue-200 ring-2 ring-blue-100"
                    : "border-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                <div className="text-sm font-semibold text-blue-700">
                  {r.pr_no ?? r.id.slice(0, 8)}
                </div>
                <div className="mt-2 text-lg font-semibold text-gray-900 line-clamp-1">
                  {r.purpose || "No purpose"}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {r.college?.code ?? "—"}
                  {r.creator &&
                    ` · ${r.creator.first_name} ${r.creator.last_name}`}
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span className="font-medium">{prog.text}</span>
                </div>
                <ProgressBar value={prog.value} />

                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="text-sm text-gray-600">Current Status:</div>
                  <Pill status={r.status} />
                </div>

                <div className="mt-2 text-xs text-gray-400">
                  Last updated: {new Date(r.updated_at).toLocaleDateString()}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Tracking */}
        {selected && (
          <div className="mt-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="text-lg font-semibold text-gray-900">
                Detailed Tracking
              </div>
              <div className="mt-1 text-sm text-gray-500">
                Request: {selected.pr_no ?? "—"} —{" "}
                {selected.purpose || "No purpose"}
              </div>
            </div>

            <div className="px-6 py-6">
              {/* Steps */}
              {selected.status !== "rejected" ? (
                <div className="relative">
                  <div className="absolute left-6 right-6 top-[22px] h-[3px] rounded-full bg-gray-200" />
                  <div
                    className="absolute left-6 top-[22px] h-[3px] rounded-full bg-green-500"
                    style={{
                      width: `calc(${(activeStepIndex / (steps.length - 1)) * 100}% + 2.75rem)`,
                    }}
                  />

                  <div
                    className="relative grid items-start gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {steps.map((s, idx) => (
                      <div
                        key={s.key}
                        className="flex flex-col items-center gap-3"
                      >
                        <StepIcon
                          index={idx}
                          activeIndex={activeStepIndex}
                          icon={s.icon}
                        />
                        <div className="text-center text-xs font-medium text-gray-600 whitespace-pre-line">
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span className="text-sm font-semibold">
                    This request was rejected
                  </span>
                </div>
              )}

              {/* Activity Timeline */}
              <div className="mt-8">
                <div className="text-sm font-semibold text-gray-900">
                  Activity Timeline
                </div>

                {timeline.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">
                    No status history recorded yet.
                  </p>
                ) : (
                  <div className="mt-4 space-y-5">
                    {timeline.map((t, i) => {
                      const isDone = t.state === "done";
                      return (
                        <div key={i} className="flex items-start gap-4">
                          <div className="relative">
                            <div
                              className={[
                                "h-8 w-8 rounded-full flex items-center justify-center",
                                isDone
                                  ? "bg-green-100 text-green-600"
                                  : "bg-white text-gray-400 border border-gray-200",
                              ].join(" ")}
                            >
                              {isDone ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <Clock className="h-4 w-4" />
                              )}
                            </div>
                            {i !== timeline.length - 1 && (
                              <div
                                className={[
                                  "absolute left-1/2 top-8 h-10 w-px -translate-x-1/2",
                                  isDone ? "bg-green-500" : "bg-gray-200",
                                ].join(" ")}
                              />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {t.title}
                                </div>
                                {t.desc && (
                                  <div className="mt-1 text-sm text-gray-600">
                                    {t.desc}
                                  </div>
                                )}
                                {t.by && (
                                  <div className="mt-1 text-xs text-gray-400">
                                    By: {t.by}
                                  </div>
                                )}
                                {t.state === "current" && (
                                  <div className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-amber-700">
                                    <span>⏳</span> Current Status
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 whitespace-nowrap">
                                {t.time}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status Indicators */}
        <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-gray-900">
            Status Indicators
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STATUS_FLOW.map((s, i) => {
              const Icon = STEP_ICONS[i] ?? Check;
              const bg =
                [
                  "bg-gray-50",
                  "bg-amber-50",
                  "bg-blue-50",
                  "bg-green-50",
                  "bg-violet-50",
                ][i] ?? "bg-gray-50";
              const iconColor =
                [
                  "text-gray-500",
                  "text-amber-600",
                  "text-blue-600",
                  "text-green-600",
                  "text-violet-600",
                ][i] ?? "text-gray-500";
              return (
                <div key={s} className={`rounded-xl ${bg} p-4`}>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                    <div className="text-sm font-semibold text-gray-900">
                      {STATUS_LABELS[s]}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {
                      [
                        "Request filed",
                        "Dept head reviewing",
                        "Awaiting budget approval",
                        "Procurement in progress",
                        "PO issued / completed",
                      ][i]
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
