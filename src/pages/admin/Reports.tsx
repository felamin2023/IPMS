// src/pages/admin/Reports.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  CalendarDays,
  FileText,
  TrendingUp,
  DollarSign,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  fetchReportData,
  fetchRequestsLight,
  type ReportRow,
  type RequestStatus,
  STATUS_SHORT_LABELS,
} from "../../lib/requests";

/* ── helpers ─────────────────────────────────────────── */

const phpMoney = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

function itemsTotal(items?: { unit_cost: number | null; qty: number }[]) {
  if (!items) return 0;
  return items.reduce(
    (sum, it) => sum + (it.unit_cost ?? 0) * (it.qty ?? 0),
    0,
  );
}

/** Avg days between the first and last status-log entry of completed requests. */
function avgCycleDays(rows: ReportRow[]): number {
  const completed = rows.filter((r) => r.status === "completed");
  if (completed.length === 0) return 0;

  let totalDays = 0;
  let counted = 0;

  for (const r of completed) {
    const logs = r.status_logs ?? [];
    if (logs.length < 2) continue;
    const sorted = [...logs].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const first = new Date(sorted[0].created_at).getTime();
    const last = new Date(sorted[sorted.length - 1].created_at).getTime();
    const days = (last - first) / (1000 * 60 * 60 * 24);
    if (days > 0) {
      totalDays += days;
      counted++;
    }
  }
  return counted > 0 ? Math.round((totalDays / counted) * 10) / 10 : 0;
}

/* ── sub-components ──────────────────────────────────── */

type StatCardProps = {
  title: string;
  value: string;
  sub: string;
  theme: "blue" | "violet" | "green" | "amber";
  icon: React.ComponentType<{ className?: string }>;
};

function StatCard({ title, value, sub, theme, icon: Icon }: StatCardProps) {
  const map = {
    blue: {
      border: "border-blue-200",
      iconBg: "bg-blue-50",
      iconText: "text-blue-600",
    },
    violet: {
      border: "border-violet-200",
      iconBg: "bg-violet-50",
      iconText: "text-violet-600",
    },
    green: {
      border: "border-green-200",
      iconBg: "bg-green-50",
      iconText: "text-green-600",
    },
    amber: {
      border: "border-amber-200",
      iconBg: "bg-amber-50",
      iconText: "text-amber-600",
    },
  }[theme];

  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm ${map.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-gray-600">{title}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            {value}
          </div>
          <div className="mt-2 text-xs text-gray-500">{sub}</div>
        </div>
        <div
          className={`h-10 w-10 rounded-xl ${map.iconBg} flex items-center justify-center`}
        >
          <Icon className={`h-5 w-5 ${map.iconText}`} />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-green-600"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <div className="text-sm font-semibold text-gray-700">{value}%</div>
    </div>
  );
}

/* ── main component ──────────────────────────────────── */

export default function Reports() {
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchReportData();
      setData(rows);
    } catch (err) {
      console.error("Failed to load report data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── derived metrics ─────────────────────────────── */

  const totalRequests = data.length;

  const totalValue = useMemo(
    () => data.reduce((sum, r) => sum + itemsTotal(r.items), 0),
    [data],
  );

  const completedCount = useMemo(
    () => data.filter((r) => r.status === "completed").length,
    [data],
  );

  const returnedCount = useMemo(
    () => data.filter((r) => r.status === "returned_for_revision").length,
    [data],
  );

  const completionRate =
    totalRequests > 0 ? Math.round((completedCount / totalRequests) * 100) : 0;

  const cycleDays = useMemo(() => avgCycleDays(data), [data]);

  /* ── requests by month (last 6 months) ───────────── */

  const requestsByMonth = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleString("en-US", { month: "short" }),
      });
    }

    const counts: Record<string, number> = {};
    for (const m of months) counts[m.key] = 0;

    for (const r of data) {
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in counts) counts[key]++;
    }

    return months.map((m) => ({ month: m.label, requests: counts[m.key] }));
  }, [data]);

  /* ── cycle time by month (completed requests only) ── */

  const cycleByMonth = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleString("en-US", { month: "short" }),
      });
    }

    const buckets: Record<string, number[]> = {};
    for (const m of months) buckets[m.key] = [];

    for (const r of data) {
      if (r.status !== "completed") continue;
      const logs = r.status_logs ?? [];
      if (logs.length < 2) continue;
      const sorted = [...logs].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      const days =
        (new Date(sorted[sorted.length - 1].created_at).getTime() -
          new Date(sorted[0].created_at).getTime()) /
        (1000 * 60 * 60 * 24);
      const completedAt = new Date(sorted[sorted.length - 1].created_at);
      const key = `${completedAt.getFullYear()}-${String(completedAt.getMonth() + 1).padStart(2, "0")}`;
      if (key in buckets && days > 0) buckets[key].push(days);
    }

    return months.map((m) => {
      const arr = buckets[m.key];
      const avg =
        arr.length > 0
          ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
          : 0;
      return { month: m.label, avgDays: avg };
    });
  }, [data]);

  /* ── status distribution (grouped) ─────────────────── */

  const statusDistribution = useMemo(() => {
    const groups: {
      name: string;
      statuses: RequestStatus[];
      color: string;
    }[] = [
      {
        name: "Pending Review",
        statuses: ["request_sent", "returned_for_revision"],
        color: "#f59e0b",
      },
      {
        name: "Accounting Review",
        statuses: ["request_reviewed"],
        color: "#d97706",
      },
      {
        name: "Procurement",
        statuses: [
          "notice_of_meeting",
          "endorsed_to_bac",
          "resolution_approved",
          "under_supplier_quotation",
          "quotations_received",
          "under_quotation_evaluation",
          "hope_approval",
          "abstract_prepared",
          "contract_awarded",
          "po_issued",
          "ntp_issued",
          "noa_po_ntp_posted",
        ],
        color: "#3b82f6",
      },
      {
        name: "Supply",
        statuses: [
          "po_delivered",
          "items_for_inspection",
          "under_inspection",
          "under_warehousing",
          "issuance",
        ],
        color: "#8b5cf6",
      },
      { name: "Completed", statuses: ["completed"], color: "#22c55e" },
    ];

    return groups
      .map((g) => ({
        name: g.name,
        value: data.filter((r) => g.statuses.includes(r.status)).length,
        color: g.color,
      }))
      .filter((g) => g.value > 0);
  }, [data]);

  /* ── college activity & performance ────────────────── */

  const collegeMetrics = useMemo(() => {
    const map: Record<
      string,
      { code: string; total: number; value: number; completed: number }
    > = {};

    for (const r of data) {
      const code = r.college?.code ?? "Unknown";
      if (!map[code]) map[code] = { code, total: 0, value: 0, completed: 0 };
      map[code].total++;
      map[code].value += itemsTotal(r.items);
      if (r.status === "completed") map[code].completed++;
    }

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [data]);

  const collegeActivity = useMemo(
    () => collegeMetrics.map((c) => ({ dept: c.code, requests: c.total })),
    [collegeMetrics],
  );

  const collegePerformance = useMemo(
    () =>
      collegeMetrics.map((c) => ({
        dept: c.code,
        totalRequests: c.total,
        totalValue: c.value,
        avgValue: c.total > 0 ? Math.round(c.value / c.total) : 0,
        completionRate:
          c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0,
      })),
    [collegeMetrics],
  );

  /* ── CSV export ────────────────────────────────────── */

  const [exporting, setExporting] = useState(false);

  async function exportCsv() {
    setExporting(true);
    try {
      const all = await fetchRequestsLight();
      const header = [
        "PR Number",
        "College",
        "Program",
        "Purpose",
        "Status",
        "Total Value",
        "Requester",
        "Date Created",
      ].join(",");

      const rows = all.map((r) =>
        [
          r.pr_no ?? "",
          r.college?.code ?? "",
          r.program?.code ?? "",
          `"${(r.purpose ?? "").replace(/"/g, '""')}"`,
          STATUS_SHORT_LABELS[r.status] ?? r.status,
          itemsTotal(r.items).toFixed(2),
          r.creator ? `${r.creator.first_name} ${r.creator.last_name}` : "",
          new Date(r.created_at).toLocaleDateString(),
        ].join(","),
      );

      const csv = [header, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `procurement-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }

  /* ── render ────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Reports &amp; Analytics
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Procurement performance insights and metrics
            </p>
          </div>

          <button
            type="button"
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            onClick={exportCsv}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? "Exporting..." : "Export Report"}
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Avg. Cycle Time"
            value={cycleDays > 0 ? `${cycleDays} days` : "—"}
            sub="Completed requests only"
            theme="blue"
            icon={CalendarDays}
          />
          <StatCard
            title="Total Requests"
            value={String(totalRequests)}
            sub={`${returnedCount} returned for revision`}
            theme="violet"
            icon={FileText}
          />
          <StatCard
            title="Completion Rate"
            value={totalRequests > 0 ? `${completionRate}%` : "—"}
            sub={`${completedCount} of ${totalRequests} completed`}
            theme="green"
            icon={TrendingUp}
          />
          <StatCard
            title="Total Value"
            value={phpMoney.format(totalValue)}
            sub="Sum of all request items"
            theme="amber"
            icon={DollarSign}
          />
        </div>

        {/* Charts row 1 */}
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">
              Procurement Cycle Time
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Average days from request to completion (last 6 months)
            </div>

            <div className="mt-4 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cycleByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    dataKey="avgDays"
                    name="Avg Days"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">
              Requests by Month
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Total procurement requests submitted (last 6 months)
            </div>

            <div className="mt-4 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={requestsByMonth} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="requests" name="Requests" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">
              Status Distribution
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Breakdown of request statuses by phase
            </div>

            <div className="mt-4 h-[280px]">
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
                      {statusDistribution.map((s, idx) => (
                        <Cell key={idx} fill={s.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={24} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  No data yet
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">
              College Activity
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Requests by college
            </div>

            <div className="mt-4 h-[280px]">
              {collegeActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={collegeActivity}
                    layout="vertical"
                    barSize={18}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="dept" width={90} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="requests" name="Requests" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                  No data yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="mt-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="text-sm font-semibold text-gray-900">
              College Performance
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Detailed breakdown by college
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3">College</th>
                  <th className="px-6 py-3">Total Requests</th>
                  <th className="px-6 py-3">Total Value</th>
                  <th className="px-6 py-3">Avg. Request Value</th>
                  <th className="px-6 py-3">Completion Rate</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {collegePerformance.length > 0 ? (
                  collegePerformance.map((d) => (
                    <tr key={d.dept} className="text-sm text-gray-700">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {d.dept}
                      </td>
                      <td className="px-6 py-4">{d.totalRequests}</td>
                      <td className="px-6 py-4">
                        {phpMoney.format(d.totalValue)}
                      </td>
                      <td className="px-6 py-4">
                        {phpMoney.format(d.avgValue)}
                      </td>
                      <td className="px-6 py-4">
                        <ProgressBar value={d.completionRate} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-sm text-gray-400"
                    >
                      No data yet
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
