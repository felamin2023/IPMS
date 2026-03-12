// src/pages/user/Home.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
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
  Loader2,
} from "lucide-react";
import {
  fetchRequestStats,
  fetchRequestsLight,
  type RequestRow,
  type RequestStatus,
  STATUS_SHORT_LABELS,
  STATUS_TONE,
} from "../../lib/requests";

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

function itemsTotal(items?: { unit_cost: number | null; qty: number }[]) {
  if (!items) return 0;
  return items.reduce((s, it) => s + (it.unit_cost ?? 0) * (it.qty ?? 0), 0);
}

export default function Home() {
  const { user } = useAuth();

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.email ? user.email.split("@")[0] : "Guest");

  const [stats, setStats] = useState({
    total: 0,
    requestSent: 0,
    twgPhase: 0,
    procurementPhase: 0,
    supplyPhase: 0,
    completed: 0,
    returned: 0,
  });
  const [recent, setRecent] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [s, all] = await Promise.all([
        fetchRequestStats(user.id),
        fetchRequestsLight({ createdBy: user.id }),
      ]);
      setStats(s);
      setRecent(all.slice(0, 4));
    } catch (err) {
      console.error("Home load error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const money = useMemo(
    () =>
      new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }),
    [],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-5 flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Welcome, {displayName}
          </h1>
          <p className="text-sm text-gray-500">
            Track your procurement requests and monitor progress
          </p>
        </div>

        {/* Quick Actions */}
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

        {/* Stats */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Requests"
            value={stats.total}
            icon={FileText}
            tone="blue"
          />
          <StatCard
            title="Pending Review"
            value={stats.requestSent}
            icon={Clock}
            tone="amber"
          />
          <StatCard
            title="In Progress"
            value={stats.twgPhase + stats.procurementPhase + stats.supplyPhase}
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

        {/* Recent + How it works */}
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
                    <th className="px-6 py-3">PR No.</th>
                    <th className="px-6 py-3">Purpose</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recent.map((r) => (
                    <tr key={r.id} className="text-sm text-gray-700">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {r.pr_no ?? "—"}
                      </td>
                      <td className="px-6 py-4 max-w-[180px] truncate">
                        {r.purpose || "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                        {money.format(itemsTotal(r.items))}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <StatusPill status={r.status} />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {recent.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-10 text-center text-sm text-gray-500"
                      >
                        No requests yet. Create your first request!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* How it works */}
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
                  1) Create & Send Request
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Submit a new procurement request with complete details.
                </div>
              </div>
              <div className="rounded-xl bg-amber-50 p-4">
                <div className="text-sm font-semibold text-gray-900">
                  2) TWG Review & Validation
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Technical Working Group reviews items and assigns PR number.
                </div>
              </div>
              <div className="rounded-xl bg-blue-50 p-4">
                <div className="text-sm font-semibold text-gray-900">
                  3) Procurement Processing
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  BAC evaluation, quotations, contract award and PO issuance.
                </div>
              </div>
              <div className="rounded-xl bg-violet-50 p-4">
                <div className="text-sm font-semibold text-gray-900">
                  4) Supply Office Processing
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Delivery, inspection, warehousing and final issuance.
                </div>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4">
                <div className="text-sm font-semibold text-gray-900">
                  5) Completed
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Items issued to end users — procurement fully completed.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
