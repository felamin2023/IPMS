// src/pages/admin/Dashboard.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  Package,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import {
  fetchRequestStats,
  fetchRequests,
  type RequestRow,
  type RequestStatus,
  STATUS_LABELS,
} from "../../lib/requests";

type StatCardProps = {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  theme: "blue" | "amber" | "green" | "violet";
};

function StatCard({ title, value, sub, icon: Icon, theme }: StatCardProps) {
  const themeMap = {
    blue: {
      border: "border-blue-200",
      iconBg: "bg-blue-50",
      iconText: "text-blue-600",
    },
    amber: {
      border: "border-amber-200",
      iconBg: "bg-amber-50",
      iconText: "text-amber-600",
    },
    green: {
      border: "border-green-200",
      iconBg: "bg-green-50",
      iconText: "text-green-600",
    },
    violet: {
      border: "border-violet-200",
      iconBg: "bg-violet-50",
      iconText: "text-violet-600",
    },
  }[theme];

  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm ${themeMap.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-gray-600">{title}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            {value}
          </div>
          <div className="mt-2 text-xs text-gray-500">{sub}</div>
        </div>
        <div
          className={`h-10 w-10 rounded-xl ${themeMap.iconBg} flex items-center justify-center`}
        >
          <Icon className={`h-5 w-5 ${themeMap.iconText}`} />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: RequestStatus }) {
  const map: Record<RequestStatus, string> = {
    submitted: "bg-gray-100 text-gray-700",
    head_review: "bg-amber-100 text-amber-700",
    budget_review: "bg-blue-100 text-blue-700",
    procurement_processing: "bg-green-100 text-green-700",
    purchase_order: "bg-violet-100 text-violet-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function itemsTotal(items?: { unit_cost: number | null; qty: number }[]) {
  if (!items) return 0;
  return items.reduce((s, it) => s + (it.unit_cost ?? 0) * (it.qty ?? 0), 0);
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    headReview: 0,
    budgetReview: 0,
    procurementProcessing: 0,
    purchaseOrder: 0,
    rejected: 0,
  });
  const [recent, setRecent] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, all] = await Promise.all([
        fetchRequestStats(),
        fetchRequests(),
      ]);
      setStats(s);
      setRecent(all.slice(0, 5));
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statusDistribution = useMemo(
    () =>
      [
        { name: "Submitted", value: stats.submitted, color: "#6b7280" },
        { name: "Head Review", value: stats.headReview, color: "#f59e0b" },
        { name: "Budget Review", value: stats.budgetReview, color: "#3b82f6" },
        {
          name: "Procurement",
          value: stats.procurementProcessing,
          color: "#22c55e",
        },
        {
          name: "Purchase Order",
          value: stats.purchaseOrder,
          color: "#8b5cf6",
        },
        { name: "Rejected", value: stats.rejected, color: "#ef4444" },
      ].filter((d) => d.value > 0),
    [stats],
  );

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-5">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Procurement overview and statistics
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Requests"
            value={stats.total}
            sub="all time"
            icon={FileText}
            theme="blue"
          />
          <StatCard
            title="Pending Review"
            value={stats.submitted}
            sub="awaiting head review"
            icon={Clock}
            theme="amber"
          />
          <StatCard
            title="In Progress"
            value={
              stats.headReview +
              stats.budgetReview +
              stats.procurementProcessing
            }
            sub="under processing"
            icon={CheckCircle2}
            theme="green"
          />
          <StatCard
            title="Purchase Orders"
            value={stats.purchaseOrder}
            sub="completed"
            icon={Package}
            theme="violet"
          />
        </div>

        {/* Charts */}
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 text-sm font-semibold text-gray-900">
              Status Distribution
            </div>
            <div className="h-[280px]">
              {statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={2}
                    >
                      {statusDistribution.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={24} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                  No data
                </div>
              )}
            </div>
          </div>

          {/* Summary counts as a simple stat grid */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 text-sm font-semibold text-gray-900">
              Status Breakdown
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: "Submitted",
                  count: stats.submitted,
                  color: "bg-gray-100 text-gray-700",
                },
                {
                  label: "Head Review",
                  count: stats.headReview,
                  color: "bg-amber-100 text-amber-700",
                },
                {
                  label: "Budget Review",
                  count: stats.budgetReview,
                  color: "bg-blue-100 text-blue-700",
                },
                {
                  label: "Procurement",
                  count: stats.procurementProcessing,
                  color: "bg-green-100 text-green-700",
                },
                {
                  label: "Purchase Order",
                  count: stats.purchaseOrder,
                  color: "bg-violet-100 text-violet-700",
                },
                {
                  label: "Rejected",
                  count: stats.rejected,
                  color: "bg-red-100 text-red-700",
                },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-gray-50 p-4">
                  <div className="text-xs font-semibold uppercase text-gray-500">
                    {s.label}
                  </div>
                  <div className="mt-1 text-2xl font-bold text-gray-900">
                    {s.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Requests */}
        <div className="mt-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="text-sm font-semibold text-gray-900">
              Recent Requests
            </div>
            <div className="mt-1 text-xs text-gray-500">
              Latest procurement requests submitted
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">PR Number</th>
                  <th className="px-5 py-3">Purpose</th>
                  <th className="px-5 py-3">Requester</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recent.map((r) => (
                  <tr key={r.id} className="text-sm text-gray-700">
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {r.pr_no ?? "—"}
                    </td>
                    <td className="px-5 py-4 max-w-[200px] truncate">
                      {r.purpose || "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {r.creator
                        ? `${r.creator.first_name} ${r.creator.last_name}`
                        : "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 font-medium whitespace-nowrap">
                      {money.format(itemsTotal(r.items))}
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={r.status} />
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm text-gray-500"
                    >
                      No requests yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
