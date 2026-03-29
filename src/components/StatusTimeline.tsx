import { CheckCircle2, Circle, Clock, RotateCcw } from "lucide-react";
import {
  STATUS_FLOW,
  STATUS_LABELS,
  STATUS_TONE,
  STATUS_RESPONSIBLE_ROLE,
  ROLE_LABELS,
  getDisplayNote,
  normalizeFlowStatus,
  type RequestStatus,
  type StatusLogRow,
  type UserRole,
} from "../lib/requests";

interface StatusTimelineProps {
  currentStatus: RequestStatus;
  statusLogs?: StatusLogRow[];
}

/** Map each status to its earliest log entry (for date display). */
function buildLogMap(logs: StatusLogRow[]) {
  const map = new Map<
    string,
    {
      date: string;
      note: string | null;
      updater?: { first_name: string; last_name: string };
    }
  >();
  // Sort ascending so the earliest entry per status wins
  const sorted = [...logs].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  for (const log of sorted) {
    const normalizedStatus = normalizeFlowStatus(log.status as RequestStatus);
    if (!map.has(normalizedStatus)) {
      map.set(normalizedStatus, {
        date: log.created_at,
        note: log.note,
        updater: log.updater,
      });
    }
  }
  return map;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " at " +
    d.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  );
}

const toneBg: Record<string, string> = {
  gray: "bg-gray-500",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  red: "bg-red-500",
};

export default function StatusTimeline({
  currentStatus,
  statusLogs = [],
}: StatusTimelineProps) {
  const logMap = buildLogMap(statusLogs);
  const currentIdx = STATUS_FLOW.indexOf(normalizeFlowStatus(currentStatus));
  const isReturned =
    currentStatus === "returned_for_revision" ||
    currentStatus === "returned_for_action";
  const returnLogs = [...statusLogs]
    .filter(
      (log) =>
        log.status === "returned_for_revision" ||
        log.status === "returned_for_action",
    )
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  const nextLoggedDate: Array<number | null> = Array(STATUS_FLOW.length).fill(
    null,
  );
  let nextDate: number | null = null;
  for (let i = STATUS_FLOW.length - 1; i >= 0; i -= 1) {
    const log = logMap.get(STATUS_FLOW[i]);
    if (log) {
      nextDate = new Date(log.date).getTime();
    }
    nextLoggedDate[i] = nextDate;
  }

  const timelineEntries: Array<
    | {
        type: "status";
        status: RequestStatus;
        log?: {
          date: string;
          note: string | null;
          updater?: { first_name: string; last_name: string };
        };
        isCompleted: boolean;
        isCurrent: boolean;
        isPending: boolean;
        tone: string;
        role: UserRole;
      }
    | { type: "return"; log: StatusLogRow }
  > = [];
  let prevLoggedDate: number | null = null;
  let returnIdx = 0;

  STATUS_FLOW.forEach((status, idx) => {
    const log = logMap.get(status);
    const isCompleted = isReturned ? !!log : idx <= currentIdx;
    const isCurrent = !isReturned && idx === currentIdx;
    const isPending = !isCompleted;
    const tone = STATUS_TONE[status];
    const role = STATUS_RESPONSIBLE_ROLE[status];
    const nextDateLimit = nextLoggedDate[idx] ?? Number.POSITIVE_INFINITY;
    const currentLogDate = log ? new Date(log.date).getTime() : null;

    while (returnIdx < returnLogs.length) {
      const returnLog = returnLogs[returnIdx];
      const returnTime = new Date(returnLog.created_at).getTime();
      const lowerBound = prevLoggedDate ?? Number.NEGATIVE_INFINITY;
      if (returnTime <= nextDateLimit && returnTime > lowerBound) {
        timelineEntries.push({ type: "return", log: returnLog });
        returnIdx += 1;
        continue;
      }
      break;
    }

    timelineEntries.push({
      type: "status",
      status,
      log,
      isCompleted,
      isCurrent,
      isPending,
      tone,
      role,
    });

    if (currentLogDate != null) {
      prevLoggedDate = currentLogDate;
    }
  });

  while (returnIdx < returnLogs.length) {
    timelineEntries.push({ type: "return", log: returnLogs[returnIdx] });
    returnIdx += 1;
  }

  return (
    <div className="relative">
      <div className="text-xs font-semibold uppercase text-gray-500 mb-3">
        Order Tracking
      </div>

      <ol className="relative">
        {timelineEntries.map((entry, index) => {
          const isLast = index === timelineEntries.length - 1;
          if (entry.type === "return") {
            const status = entry.log.status as
              | "returned_for_revision"
              | "returned_for_action";
            return (
              <li key={entry.log.id} className="relative pl-8 pb-6 last:pb-0">
                {!isLast && (
                  <div className="absolute left-[13px] top-7 bottom-0 w-0.5 bg-gray-200" />
                )}
                <div className="absolute left-0 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white ring-4 ring-red-50">
                  <RotateCcw className="h-3.5 w-3.5" />
                </div>
                <div className="ml-2">
                  <p className="text-sm font-semibold text-red-700">
                    {STATUS_LABELS[status]}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDateTime(entry.log.created_at)}
                    {entry.log.updater &&
                      ` — ${entry.log.updater.first_name} ${entry.log.updater.last_name}`}
                  </p>
                  {entry.log.note && (
                    <p className="text-xs text-red-600 mt-0.5 italic">
                      &ldquo;{getDisplayNote(status, entry.log.note)}&rdquo;
                    </p>
                  )}
                </div>
              </li>
            );
          }

          const { status, log, isCompleted, isCurrent, isPending, tone, role } =
            entry;

          return (
            <li key={status} className="relative pl-8 pb-6 last:pb-0">
              {/* Connector line (except last) */}
              {!isLast && (
                <div
                  className={[
                    "absolute left-[13px] top-7 bottom-0 w-0.5",
                    isCompleted && !isCurrent
                      ? (toneBg[tone] ?? "bg-gray-300")
                      : "bg-gray-200",
                  ].join(" ")}
                  style={{ opacity: isCompleted && !isCurrent ? 0.4 : 1 }}
                />
              )}

              {/* Icon */}
              {isCompleted ? (
                <div
                  className={[
                    "absolute left-0 top-0.5 flex h-7 w-7 items-center justify-center rounded-full text-white ring-4",
                    isCurrent
                      ? `${toneBg[tone]} ring-blue-50`
                      : `${toneBg[tone]} ring-white`,
                  ].join(" ")}
                  style={{ opacity: isCurrent ? 1 : 0.85 }}
                >
                  {isCurrent ? (
                    <Clock className="h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                </div>
              ) : (
                <div className="absolute left-0 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-400 ring-4 ring-white">
                  <Circle className="h-3.5 w-3.5" />
                </div>
              )}

              {/* Content */}
              <div className="ml-2">
                <p
                  className={[
                    "text-sm font-semibold",
                    isCurrent
                      ? "text-blue-700"
                      : isCompleted
                        ? "text-gray-900"
                        : "text-gray-400",
                  ].join(" ")}
                >
                  {STATUS_LABELS[status]}
                  {isCurrent && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      Current
                    </span>
                  )}
                </p>

                {/* Role responsible */}
                <p
                  className={`text-[11px] ${isPending ? "text-gray-300" : "text-gray-400"}`}
                >
                  {ROLE_LABELS[role]}
                </p>

                {/* Date/time and note from log */}
                {log && (
                  <>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDateTime(log.date)}
                      {log.updater &&
                        ` — ${log.updater.first_name} ${log.updater.last_name}`}
                    </p>
                    {log.note && (
                      <p className="text-xs text-gray-500 mt-0.5 italic">
                        &ldquo;{getDisplayNote(status, log.note)}&rdquo;
                      </p>
                    )}
                  </>
                )}

                {/* For pending steps, show nothing extra */}
                {isPending && !log && (
                  <p className="text-xs text-gray-300 mt-0.5">Pending</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
