// src/pages/user/Home.tsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FilePlus2,
  FileText,
  Activity,
  Clock,
  CheckCircle2,
  Package,
  ArrowRight,
} from "lucide-react";

type Status = "Pending Approval" | "Approved" | "In Progress" | "Completed";

type RequestRow = {
  requestNo: string;
  title: string;
  department: string;
  dateSubmitted: string;
  amount: number;
  status: Status;
};

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    "Pending Approval": "bg-amber-100 text-amber-700",
    Approved: "bg-green-100 text-green-700",
    "In Progress": "bg-blue-100 text-blue-700",
    Completed: "bg-violet-100 text-violet-700",
  };

  const label = status === "Pending Approval" ? "Pending\nApproval" : status;

  return (
    <span
      className={[
        "inline-flex items-center justify-center",
        "min-w-[120px] px-4 py-2",
        "rounded-full text-xs font-semibold",
        "text-center leading-tight whitespace-pre-line",
        map[status],
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "blue" | "amber" | "green" | "violet";
}) {
  const toneMap = {
    blue: {
      iconBg: "bg-blue-50",
      iconText: "text-blue-600",
      border: "border-blue-200",
    },
    amber: {
      iconBg: "bg-amber-50",
      iconText: "text-amber-600",
      border: "border-amber-200",
    },
    green: {
      iconBg: "bg-green-50",
      iconText: "text-green-600",
      border: "border-green-200",
    },
    violet: {
      iconBg: "bg-violet-50",
      iconText: "text-violet-600",
      border: "border-violet-200",
    },
  }[tone];

  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm ${toneMap.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-gray-600">{title}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            {value}
          </div>
        </div>
        <div
          className={`h-10 w-10 rounded-xl ${toneMap.iconBg} flex items-center justify-center`}
        >
          <Icon className={`h-5 w-5 ${toneMap.iconText}`} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.email ? user.email.split("@")[0] : "Guest");

  const prettyRole = "Procurement Officer";

  const stats = useMemo(
    () => ({
      total: 12,
      pending: 3,
      inProgress: 4,
      completed: 5,
    }),
    [],
  );

  const recent = useMemo<RequestRow[]>(
    () => [
      {
        requestNo: "PR-2024-0248",
        title: "Office Supplies - Accounting Dept",
        department: "Accounting",
        dateSubmitted: "2024-02-15",
        amount: 1250,
        status: "Pending Approval",
      },
      {
        requestNo: "PR-2024-0246",
        title: "Computer Hardware - 10 Units",
        department: "IT Department",
        dateSubmitted: "2024-02-14",
        amount: 12000,
        status: "In Progress",
      },
      {
        requestNo: "PR-2024-0245",
        title: "Furniture - Faculty Lounge",
        department: "Facilities",
        dateSubmitted: "2024-02-14",
        amount: 3800,
        status: "Completed",
      },
      {
        requestNo: "PR-2024-0244",
        title: "Library Books Purchase",
        department: "Library",
        dateSubmitted: "2024-02-13",
        amount: 5200,
        status: "Approved",
      },
    ],
    [],
  );

  const money = useMemo(
    () =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
    [],
  );

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-5 flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Welcome, {displayName}
          </h1>
          <p className="text-sm text-gray-500">
            {prettyRole} • Track your procurement requests and monitor progress
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Link
            to="/create-request"
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Create Request
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  Submit a new procurement request
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <FilePlus2 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
              Start now <ArrowRight className="h-4 w-4" />
            </div>
          </Link>

          <Link
            to="/requests"
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  My Requests
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  View all submitted requests
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <FileText className="h-5 w-5 text-violet-600" />
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
              Open list <ArrowRight className="h-4 w-4" />
            </div>
          </Link>

          <Link
            to="/monitoring"
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Monitoring
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  Track progress and timeline
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
              Track now <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Requests"
            value={stats.total}
            icon={FileText}
            tone="blue"
          />
          <StatCard
            title="Pending Approval"
            value={stats.pending}
            icon={Clock}
            tone="amber"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={CheckCircle2}
            tone="green"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={Package}
            tone="violet"
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm min-w-0">
            <div className="border-b border-gray-200 px-6 py-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Recent Requests
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Latest requests you submitted
                </div>
              </div>
              <Link
                to="/requests"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View all
              </Link>
            </div>

            <div className="overflow-x-auto min-w-0">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-6 py-3">Request No.</th>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {recent.map((r) => (
                    <tr key={r.requestNo} className="text-sm text-gray-700">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {r.requestNo}
                      </td>
                      <td className="px-6 py-4">{r.title}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {r.dateSubmitted}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                        {money.format(r.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <StatusPill status={r.status} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">
              How it works
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Quick guide to your request status flow
            </p>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">
                  1) Submit
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Create a request with complete details.
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 p-4">
                <div className="text-sm font-semibold text-gray-900">
                  2) Pending Approval
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Request is waiting for approvers.
                </div>
              </div>

              <div className="rounded-xl bg-blue-50 p-4">
                <div className="text-sm font-semibold text-gray-900">
                  3) In Progress
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Procurement processing and PO steps.
                </div>
              </div>

              <div className="rounded-xl bg-green-50 p-4">
                <div className="text-sm font-semibold text-gray-900">
                  4) Completed
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Done and delivered / finalized.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
