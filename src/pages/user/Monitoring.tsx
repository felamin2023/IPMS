// src/pages/user/Monitoring.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchRequestsLight,
  fetchRequestById,
  type RequestRow,
  type RequestStatus,
  STATUS_SHORT_LABELS,
  STATUS_TONE,
  STATUS_FLOW,
} from "../../lib/requests";
import StatusTimeline from "../../components/StatusTimeline";

// ── helpers ────────────────────────────────────────────

function progressFor(status: RequestStatus): { text: string; value: number } {
  if (status === "returned_for_revision")
    return { text: "Returned for Revision", value: 0 };
  if (status === "completed")
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
  emerald: "bg-emerald-100 text-emerald-700",
};

function Pill({ status }: { status: RequestStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${TONE_MAP[STATUS_TONE[status]] ?? TONE_MAP.gray}`}
    >
      {STATUS_SHORT_LABELS[status]}
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

export default function Monitoring() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedFull, setSelectedFull] = useState<RequestRow | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const all = await fetchRequestsLight({ createdBy: user.id });
      const active = all.filter(
        (r) => r.status !== "completed" && r.status !== "returned_for_revision",
      );
      const display = active.length > 0 ? active : all;
      setRequests(display);
      if (display.length > 0 && !selectedId) {
        setSelectedId(display[0].id);
        fetchRequestById(display[0].id)
          .then(setSelectedFull)
          .catch(() => {});
      }
    } catch (err) {
      console.error("Failed to load monitoring data:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleSelect(id: string) {
    setSelectedId(id);
    setSelectedFull(null);
    fetchRequestById(id)
      .then(setSelectedFull)
      .catch(() => {});
  }

  const selected = useMemo(
    () => selectedFull ?? requests.find((r) => r.id === selectedId) ?? null,
    [requests, selectedId, selectedFull],
  );

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
          <p className="text-sm text-gray-500">
            No requests to track yet. Submit a request to start tracking.
          </p>
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
            Track the progress of your procurement requests
          </p>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {requests.slice(0, 6).map((r) => {
            const active = r.id === selectedId;
            const prog = progressFor(r.status);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelect(r.id)}
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
              <StatusTimeline
                currentStatus={selected.status}
                statusLogs={selected.status_logs}
              />
            </div>
          </div>
        )}

        {/* Status Indicators */}
        <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-gray-900">
            Status Indicators
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STATUS_FLOW.map((s) => {
              const toneToColors: Record<string, { bg: string; icon: string }> =
                {
                  gray: { bg: "bg-gray-50", icon: "text-gray-500" },
                  amber: { bg: "bg-amber-50", icon: "text-amber-600" },
                  blue: { bg: "bg-blue-50", icon: "text-blue-600" },
                  green: { bg: "bg-green-50", icon: "text-green-600" },
                  violet: { bg: "bg-violet-50", icon: "text-violet-600" },
                  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600" },
                  red: { bg: "bg-red-50", icon: "text-red-600" },
                };
              const tone = STATUS_TONE[s] ?? "gray";
              const colors = toneToColors[tone] ?? toneToColors.gray;
              return (
                <div key={s} className={`rounded-xl ${colors.bg} p-4`}>
                  <div className="flex items-center gap-2">
                    <Check className={`h-4 w-4 ${colors.icon}`} />
                    <div className="text-sm font-semibold text-gray-900">
                      {STATUS_SHORT_LABELS[s]}
                    </div>
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
