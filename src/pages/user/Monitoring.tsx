// src/pages/user/Monitoring.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchRequestsLight,
  fetchRequestById,
  fetchUnreadChatCounts,
  type RequestRow,
  type RequestStatus,
  STATUS_SHORT_LABELS,
  STATUS_TONE,
  STATUS_FLOW,
  normalizeFlowStatus,
} from "../../lib/requests";
import { supabase } from "../../lib/supabase";
import StatusTimeline from "../../components/StatusTimeline";
import RequestChatPanel from "../../components/RequestChatPanel";

// ── helpers ────────────────────────────────────────────

function progressFor(
  status: RequestStatus,
  statusLogs?: RequestRow["status_logs"],
): { text: string; value: number } {
  if (status === "returned_for_revision" || status === "returned_for_action") {
    const lastNonReturn = (statusLogs ?? [])
      .filter(
        (log) =>
          log.status !== "returned_for_revision" &&
          log.status !== "returned_for_action",
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];
    const lastStatus = lastNonReturn
      ? normalizeFlowStatus(lastNonReturn.status as RequestStatus)
      : null;
    const idx = lastStatus ? STATUS_FLOW.indexOf(lastStatus) : -1;
    const step = idx === -1 ? 1 : idx + 1;
    return {
      text: "Returned to User",
      value: Math.round((step / STATUS_FLOW.length) * 100),
    };
  }
  if (status === "completed")
    return {
      text: `${STATUS_FLOW.length} of ${STATUS_FLOW.length}`,
      value: 100,
    };
  const idx = STATUS_FLOW.indexOf(normalizeFlowStatus(status));
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

function formatPrLabel(request: RequestRow) {
  const groups = request.pr_groups ?? [];
  if (groups.length === 0) return request.pr_no ?? request.id.slice(0, 8);
  if (groups.length === 1) return groups[0].pr_no;
  const [first, ...rest] = groups;
  return `${first.pr_no} +${rest.length}`;
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

export default function Monitoring() {
  const { user, role } = useAuth();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [unreadByRequest, setUnreadByRequest] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedFull, setSelectedFull] = useState<RequestRow | null>(null);
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const loadUnreadCounts = useCallback(
    async (requestIds: string[]) => {
      if (!user?.id || requestIds.length === 0) {
        setUnreadByRequest({});
        return;
      }

      try {
        const counts = await fetchUnreadChatCounts({
          userId: user.id,
          requestIds,
        });
        setUnreadByRequest(counts);
      } catch (err) {
        console.error("Failed to load unread chat counts:", err);
      }
    },
    [user?.id, role],
  );

  const loadData = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!user?.id) return;
      if (!options?.silent) {
        setLoading(true);
      }
      try {
        const all = await fetchRequestsLight({ createdBy: user.id });
        const active = all.filter((r) => r.status !== "completed");
        setRequests(active);
        void loadUnreadCounts(active.map((r) => r.id));
        if (active.length > 0) {
          const targetId = selectedId ?? active[0].id;
          if (!selectedId) {
            setSelectedId(targetId);
          }
          fetchRequestById(targetId)
            .then(setSelectedFull)
            .catch(() => {});
        } else {
          setSelectedFull(null);
        }
      } catch (err) {
        console.error("Failed to load monitoring data:", err);
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [user?.id, loadUnreadCounts, selectedId],
  );

  useEffect(() => {
    if (!user?.id || requests.length === 0) {
      return;
    }

    const refresh = () => {
      void loadUnreadCounts(requests.map((r) => r.id));
    };

    const channel = supabase
      .channel(`user-monitoring-unread-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "request_messages",
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "request_message_reads",
          filter: `user_id=eq.${user.id}`,
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "request_message_reads",
          filter: `user_id=eq.${user.id}`,
        },
        refresh,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, requests, loadUnreadCounts]);

  useEffect(() => {
    if (!selectedId) return;
    const card = cardRefs.current[selectedId];
    if (!card) return;
    card.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [selectedId, requests]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user?.id) return;

    const refresh = () => {
      void loadData({ silent: true });
    };

    const channel = supabase
      .channel(`user-monitoring-records-${user.id}`)
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

  const contractFileUrls = useMemo(
    () => parseContractFileUrls(selected?.contract_file_url),
    [selected?.contract_file_url],
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
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-4">
            {requests.map((r) => {
              const active = r.id === selectedId;
              const prog = progressFor(r.status, r.status_logs);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelect(r.id)}
                  ref={(el) => {
                    cardRefs.current[r.id] = el;
                  }}
                  className={[
                    "w-[360px] shrink-0 rounded-2xl border bg-white p-5 text-left shadow-sm transition-colors",
                    active
                      ? "border-blue-500 bg-blue-50 ring-4 ring-blue-200 shadow-md"
                      : "border-gray-200 hover:bg-gray-50",
                  ].join(" ")}
                >
                  <div className="text-sm font-semibold text-blue-700">
                    <div className="flex items-center justify-between gap-2">
                      <span>{formatPrLabel(r)}</span>
                      {(unreadByRequest[r.id] ?? 0) > 0 && (
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">
                          {unreadByRequest[r.id] > 99
                            ? "99+"
                            : unreadByRequest[r.id]}
                        </span>
                      )}
                    </div>
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
        </div>

        {/* Detailed Tracking */}
        {selected && (
          <div className="mt-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="text-lg font-semibold text-gray-900">
                Detailed Tracking
              </div>
              <div className="mt-1 text-sm text-gray-500">
                Request: {formatPrLabel(selected)} —{" "}
                {selected.purpose || "No purpose"}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="border-b border-gray-200 px-6 py-6 lg:border-b-0 lg:border-r">
                <StatusTimeline
                  currentStatus={selected.status}
                  statusLogs={selected.status_logs}
                />
              </div>
              <RequestChatPanel
                request={selected}
                currentUserId={user?.id}
                currentUserRole={role}
              />
            </div>

            {(selected.contract_amount != null ||
              selected.contract_file_url) && (
              <div className="mx-6 mt-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-blue-50 to-white px-5 py-4 text-blue-900">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">
                      Contract Details
                    </div>
                    <div className="mt-1 text-xs text-blue-700">
                      Uploaded files are available for viewing.
                    </div>
                  </div>
                  {selected.contract_amount != null && (
                    <div className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-800">
                      Amount: {selected.contract_amount}
                    </div>
                  )}
                </div>

                {contractFileUrls.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {contractFileUrls.map((url, index) => (
                      <a
                        key={`${url}-${index}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700 hover:border-blue-300 hover:text-blue-800"
                      >
                        {`View Contract File${contractFileUrls.length > 1 ? " " + (index + 1) : ""}`}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
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
