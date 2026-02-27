// src/pages/admin/Monitoring.tsx
import { useMemo, useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  Package,
  Box,
  Check,
} from "lucide-react";

type StepKey = "submitted" | "review" | "approved" | "po" | "completed";

type TrackingItem = {
  id: string;
  title: string;
  dept: string;
  progressText: string; // "2 of 5"
  progressValue: number; // 0-100
  status: { label: string; tone: "blue" | "green" | "gray" };
  updatedAt: string;
  activeStepIndex: number; // 0..4
};

type TimelineItem = {
  title: string;
  desc: string;
  by?: string;
  time: string;
  state: "done" | "current" | "todo";
};

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: "blue" | "green" | "gray";
}) {
  const map = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    gray: "bg-gray-100 text-gray-700",
  }[tone];

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${map}`}
    >
      {label}
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

function StepIcon({
  index,
  activeIndex,
  icon: Icon,
  doneColorClass,
}: {
  index: number;
  activeIndex: number;
  icon: React.ComponentType<{ className?: string }>;
  doneColorClass: string;
}) {
  const isDone = index < activeIndex;
  const isActive = index === activeIndex;

  const ring = isDone
    ? `${doneColorClass} text-white`
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
  const cards = useMemo<TrackingItem[]>(
    () => [
      {
        id: "PR-2024-0248",
        title: "Office Supplies - Accounting Dept",
        dept: "Accounting",
        progressText: "2 of 5",
        progressValue: 40,
        status: { label: "Under Review", tone: "blue" },
        updatedAt: "Last updated: 2024-02-15 10:30 AM",
        activeStepIndex: 1,
      },
      {
        id: "PR-2024-0247",
        title: "Laboratory Equipment",
        dept: "Science Lab",
        progressText: "4 of 5",
        progressValue: 80,
        status: { label: "Purchase Order Generated", tone: "blue" },
        updatedAt: "Last updated: 2024-02-15 09:15 AM",
        activeStepIndex: 3,
      },
      {
        id: "PR-2024-0246",
        title: "Computer Hardware",
        dept: "IT Department",
        progressText: "3 of 5",
        progressValue: 60,
        status: { label: "Approved", tone: "green" },
        updatedAt: "Last updated: 2024-02-14 03:45 PM",
        activeStepIndex: 2,
      },
    ],
    [],
  );

  const [selected, setSelected] = useState<TrackingItem>(cards[0]);

  const steps = useMemo(
    () => [
      { key: "submitted" as StepKey, label: "Submitted", icon: FileText },
      { key: "review" as StepKey, label: "Under Review", icon: Clock },
      { key: "approved" as StepKey, label: "Approved", icon: CheckCircle2 },
      { key: "po" as StepKey, label: "Purchase\nOrder\nGenerated", icon: Box },
      { key: "completed" as StepKey, label: "Completed", icon: Check },
    ],
    [],
  );

  const timeline = useMemo<TimelineItem[]>(
    () => [
      {
        title: "Request Submitted",
        desc: "Procurement request created and submitted",
        by: "Jane Smith",
        time: "Feb 15, 2024 • 10:30 AM",
        state: "done",
      },
      {
        title: "Department Head Review",
        desc: "Reviewed and forwarded to budget officer",
        by: "Michael Brown",
        time: "Feb 15, 2024 • 11:45 AM",
        state: "done",
      },
      {
        title: "Budget Review",
        desc: "Awaiting budget officer approval",
        time: "Feb 15, 2024 • 2:15 PM",
        state: "current",
      },
      {
        title: "Procurement Processing",
        desc: "Will begin after budget approval",
        time: "Pending",
        state: "todo",
      },
      {
        title: "Purchase Order",
        desc: "PO will be generated upon final approval",
        time: "Pending",
        state: "todo",
      },
    ],
    [],
  );

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

        {/* Top Cards */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {cards.map((c) => {
            const active = c.id === selected.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c)}
                className={[
                  "rounded-2xl border bg-white p-5 text-left shadow-sm transition-colors",
                  active
                    ? "border-blue-200 ring-2 ring-blue-100"
                    : "border-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                <div className="text-sm font-semibold text-blue-700">
                  {c.id}
                </div>
                <div className="mt-2 text-lg font-semibold text-gray-900">
                  {c.title}
                </div>
                <div className="mt-2 text-sm text-gray-500">{c.dept}</div>

                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span className="font-medium">{c.progressText}</span>
                </div>
                <ProgressBar value={c.progressValue} />

                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="text-sm text-gray-600">Current Status:</div>
                  <Pill label={c.status.label} tone={c.status.tone} />
                </div>

                <div className="mt-2 text-xs text-gray-400">{c.updatedAt}</div>
              </button>
            );
          })}
        </div>

        {/* Detailed Tracking */}
        <div className="mt-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="text-lg font-semibold text-gray-900">
              Detailed Tracking
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Request: {selected.id} - {selected.title.split(" - ")[0]}
            </div>
          </div>

          {/* Steps */}
          <div className="px-6 py-6">
            <div className="relative">
              {/* base line */}
              <div className="absolute left-6 right-6 top-[22px] h-[3px] rounded-full bg-gray-200" />
              {/* progress line */}
              <div
                className="absolute left-6 top-[22px] h-[3px] rounded-full bg-green-500"
                style={{
                  width: `calc(${(selected.activeStepIndex / 4) * 100}% + 2.75rem)`,
                }}
              />

              <div className="relative grid grid-cols-5 items-start gap-2">
                {steps.map((s, idx) => {
                  const Icon = s.icon;
                  const isDone = idx < selected.activeStepIndex;
                  const doneColor = idx <= 1 ? "bg-green-500" : "bg-green-500";

                  return (
                    <div
                      key={s.key}
                      className="flex flex-col items-center gap-3"
                    >
                      <StepIcon
                        index={idx}
                        activeIndex={selected.activeStepIndex}
                        icon={Icon}
                        doneColorClass={isDone ? doneColor : "bg-green-500"}
                      />
                      <div className="text-center text-xs font-medium text-gray-600 whitespace-pre-line">
                        {s.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="mt-8">
              <div className="text-sm font-semibold text-gray-900">
                Activity Timeline
              </div>

              <div className="mt-4 space-y-5">
                {timeline.map((t, i) => {
                  const isDone = t.state === "done";
                  const isCurrent = t.state === "current";

                  return (
                    <div key={i} className="flex items-start gap-4">
                      <div className="relative">
                        <div
                          className={[
                            "h-8 w-8 rounded-full flex items-center justify-center",
                            isDone
                              ? "bg-green-100 text-green-600"
                              : isCurrent
                                ? "bg-white text-gray-400 border border-gray-200"
                                : "bg-white text-gray-400 border border-gray-200",
                          ].join(" ")}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>

                        {/* vertical line */}
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
                            <div className="mt-1 text-sm text-gray-600">
                              {t.desc}
                            </div>
                            {t.by && (
                              <div className="mt-1 text-xs text-gray-400">
                                By: {t.by}
                              </div>
                            )}
                            {t.state === "current" && (
                              <div className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-amber-700">
                                <span>⏳</span> Pending Action
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{t.time}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-gray-900">
            Status Indicators
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div className="text-sm font-semibold text-gray-900">
                  Submitted
                </div>
              </div>
              <div className="mt-1 text-xs text-gray-500">Request filed</div>
            </div>

            <div className="rounded-xl bg-amber-50 p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <div className="text-sm font-semibold text-gray-900">
                  Under Review
                </div>
              </div>
              <div className="mt-1 text-xs text-gray-500">Being evaluated</div>
            </div>

            <div className="rounded-xl bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div className="text-sm font-semibold text-gray-900">
                  Approved
                </div>
              </div>
              <div className="mt-1 text-xs text-gray-500">Ready for PO</div>
            </div>

            <div className="rounded-xl bg-blue-50 p-4">
              <div className="flex items-center gap-2">
                <Box className="h-4 w-4 text-blue-600" />
                <div className="text-sm font-semibold text-gray-900">
                  PO Generated
                </div>
              </div>
              <div className="mt-1 text-xs text-gray-500">Order placed</div>
            </div>

            <div className="rounded-xl bg-violet-50 p-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-violet-600" />
                <div className="text-sm font-semibold text-gray-900">
                  Completed
                </div>
              </div>
              <div className="mt-1 text-xs text-gray-500">Delivered</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
