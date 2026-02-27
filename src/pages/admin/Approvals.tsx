// src/pages/admin/Approvals.tsx
import { useMemo, useState } from "react";
import { Clock, CheckCircle2, XCircle, User, Check } from "lucide-react";

type QueueItem = {
  id: string;
  title: string;
  dept: string;
  amount: number;
};

type ActionItem = {
  id: string;
  title: string;
  date: string;
  status: "approved" | "rejected";
};

function money(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
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
      line: "bg-amber-400",
      icon: <Check className="h-4 w-4" />,
    },
    current: {
      ring: "bg-amber-500 text-white",
      line: "bg-gray-200",
      icon: <Clock className="h-4 w-4" />,
    },
    todo: {
      ring: "bg-white text-gray-400 border border-gray-200",
      line: "bg-gray-200",
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
      <div className="text-xs font-medium text-gray-600">{label}</div>
    </div>
  );
}

export default function Approvals() {
  const queue = useMemo<QueueItem[]>(
    () => [
      {
        id: "PR-2024-0248",
        title: "Office Supplies - Accounting Dept",
        dept: "Accounting",
        amount: 1250,
      },
      {
        id: "PR-2024-0243",
        title: "Cleaning Supplies - Facilities",
        dept: "Facilities",
        amount: 850,
      },
    ],
    [],
  );

  const recentActions = useMemo<ActionItem[]>(
    () => [
      {
        id: "PR-2024-0247",
        title: "Laboratory Equipment",
        date: "2024-02-15",
        status: "approved",
      },
      {
        id: "PR-2024-0244",
        title: "Library Books Purchase",
        date: "2024-02-13",
        status: "approved",
      },
      {
        id: "PR-2024-0240",
        title: "Marketing Materials",
        date: "2024-02-10",
        status: "rejected",
      },
    ],
    [],
  );

  const [selected, setSelected] = useState(queue[0]);

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Approval Workflow
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and approve pending procurement requests
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
          {/* LEFT COLUMN */}
          <div className="space-y-4">
            {/* Approval Queue */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 text-sm font-semibold text-gray-900">
                Approval Queue
              </div>

              <div className="space-y-3">
                {queue.map((q) => {
                  const active = q.id === selected?.id;
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
                            {q.id}
                          </div>
                          <div className="mt-2 text-sm font-semibold text-gray-900">
                            {q.title}
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            {q.dept}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Clock className="h-4 w-4 text-amber-500" />
                          <div className="text-sm font-semibold text-gray-900">
                            {money(q.amount)}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Actions */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 text-sm font-semibold text-gray-900">
                Recent Actions
              </div>

              <div className="space-y-3">
                {recentActions.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4"
                  >
                    <div>
                      <div className="text-xs text-gray-500">{a.id}</div>
                      <div className="mt-1 text-sm font-semibold text-gray-900">
                        {a.title}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{a.date}</div>
                    </div>

                    {a.status === "approved" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            {/* Details */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {selected?.title}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {selected?.id}
                  </div>
                </div>
                <Badge text="Pending Signature" />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Department
                  </div>
                  <div className="mt-1 text-sm font-medium text-gray-900">
                    {selected?.dept}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Requested By
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-900">
                    <User className="h-4 w-4 text-gray-400" />
                    Jane Smith
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date Submitted
                  </div>
                  <div className="mt-1 text-sm font-medium text-gray-900">
                    2024-02-15
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Estimated Amount
                  </div>
                  <div className="mt-1 text-lg font-semibold text-gray-900">
                    {selected ? money(selected.amount) : "-"}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Description
                </div>
                <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  Purchase of office supplies including paper, pens, folders,
                  and desk organizers
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4 text-sm font-semibold text-gray-900">
                Approval Progress
              </div>

              <div className="relative">
                {/* line behind */}
                <div className="absolute left-6 right-6 top-[22px] h-[2px] bg-gray-200" />
                {/* completed line portion */}
                <div className="absolute left-6 top-[22px] h-[2px] w-[33%] bg-amber-400" />

                <div className="relative grid grid-cols-4">
                  <Step label="Department Head" state="done" />
                  <Step label="Budget Officer" state="current" />
                  <Step label="Procurement Officer" state="todo" />
                  <Step label="Finance Director" state="todo" />
                </div>
              </div>
            </div>

            {/* Digital Signature */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">
                Digital Signature
              </div>
              <p className="mt-1 text-sm text-gray-500">
                As the current approver, you can approve or reject this request
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                  onClick={() => alert("Rejected (UI only)")}
                >
                  <XCircle className="h-5 w-5" />
                  Reject Request
                </button>

                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
                  onClick={() => alert("Approved (UI only)")}
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Approve Request
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
