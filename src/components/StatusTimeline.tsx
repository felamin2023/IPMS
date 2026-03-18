import { CheckCircle2, Circle, Clock, RotateCcw } from "lucide-react";
import {
  STATUS_FLOW,
  STATUS_LABELS,
  STATUS_TONE,
  STATUS_RESPONSIBLE_ROLE,
  ROLE_LABELS,
  getDisplayNote,
  type RequestStatus,
  type StatusLogRow,
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
    if (!map.has(log.status)) {
      map.set(log.status, {
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
  const currentIdx = STATUS_FLOW.indexOf(currentStatus);
  const isReturned =
    currentStatus === "returned_for_revision" ||
    currentStatus === "returned_for_action";
  const currentReturnStatus = isReturned
    ? (currentStatus as "returned_for_revision" | "returned_for_action")
    : null;

  // Also check if there's a return log entry.
  const returnedLog = currentReturnStatus
    ? logMap.get(currentReturnStatus)
    : null;

  return (
    <div className="relative">
      <div className="text-xs font-semibold uppercase text-gray-500 mb-3">
        Order Tracking
      </div>

      <ol className="relative">
        {/* Show return status at the top if it's the current status */}
        {isReturned && (
          <li className="relative pl-8 pb-6">
            {/* Connector line */}
            <div className="absolute left-[13px] top-7 bottom-0 w-0.5 bg-gray-200" />
            {/* Icon */}
            <div className="absolute left-0 top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white ring-4 ring-red-50">
              <RotateCcw className="h-3.5 w-3.5" />
            </div>
            {/* Content */}
            <div className="ml-2">
              <p className="text-sm font-semibold text-red-700">
                {STATUS_LABELS[currentReturnStatus!]}
              </p>
              {returnedLog && (
                <>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDateTime(returnedLog.date)}
                    {returnedLog.updater &&
                      ` — ${returnedLog.updater.first_name} ${returnedLog.updater.last_name}`}
                  </p>
                  {returnedLog.note && (
                    <p className="text-xs text-red-600 mt-0.5 italic">
                      &ldquo;
                      {getDisplayNote(currentReturnStatus!, returnedLog.note)}
                      &rdquo;
                    </p>
                  )}
                </>
              )}
            </div>
          </li>
        )}

        {STATUS_FLOW.map((status, idx) => {
          const log = logMap.get(status);
          const isCompleted = isReturned
            ? !!log // if returned, steps that have logs are "completed"
            : idx <= currentIdx;
          const isCurrent = !isReturned && idx === currentIdx;
          const isPending = !isCompleted;
          const tone = STATUS_TONE[status];
          const isLast = idx === STATUS_FLOW.length - 1;
          const role = STATUS_RESPONSIBLE_ROLE[status];

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
