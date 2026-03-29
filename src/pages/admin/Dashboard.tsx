// src/pages/admin/Dashboard.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Clock, CheckCircle2, Package, Loader2 } from "lucide-react";
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
  fetchRequestsLight,
  type RequestRow,
  type RequestStatus,
  STATUS_SHORT_LABELS,
  STATUS_TONE,
} from "../../lib/requests";

type StatCardProps = {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  theme: "blue" | "amber" | "green" | "violet";
  onClick?: () => void;
};

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  theme,
  onClick,
}: StatCardProps) {
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
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border bg-white p-5 shadow-sm text-left transition ${themeMap.border} ${onClick ? "cursor-pointer hover:shadow-md" : "cursor-default"}`}
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
    </button>
  );
}

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
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${toneMap[tone] ?? "bg-gray-100 text-gray-700"}`}
    >
      {STATUS_SHORT_LABELS[status] ?? status}
    </span>
  );
}

function itemsTotal(items?: { unit_cost: number | null; qty: number }[]) {
  if (!items) return 0;
  return items.reduce((s, it) => s + (it.unit_cost ?? 0) * (it.qty ?? 0), 0);
}

function formatPrLabel(request: RequestRow) {
  const groups = request.pr_groups ?? [];
  if (groups.length === 0) return request.pr_no ?? "No PR yet";
  if (groups.length === 1) return groups[0].pr_no;
  const [first, ...rest] = groups;
  return `${first.pr_no} +${rest.length}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    requestSent: 0,
    accountingPhase: 0,
    procurementPhase: 0,
    supplyPhase: 0,
    completed: 0,
    returned: 0,
  });
  const [recent, setRecent] = useState<RequestRow[]>([]);
  const [allRequests, setAllRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStat, setActiveStat] = useState<
    "total" | "pending" | "inProgress" | "completed" | null
  >(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, all] = await Promise.all([
        fetchRequestStats(),
        fetchRequestsLight(),
      ]);
      setStats(s);
      setAllRequests(all);
      setRecent(all.slice(0, 5));
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const accountingStatuses: RequestStatus[] = ["request_reviewed"];
  const procurementStatuses: RequestStatus[] = [
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
  ];
  const supplyStatuses: RequestStatus[] = [
    "po_delivered",
    "items_for_inspection",
    "under_inspection",
    "under_warehousing",
    "issuance",
  ];

  const modalTitle =
    activeStat === "total"
      ? "Total Requests"
      : activeStat === "pending"
        ? "Pending Review"
        : activeStat === "inProgress"
          ? "In Progress"
          : activeStat === "completed"
            ? "Completed"
            : "";

  const modalRequests = useMemo(() => {
    if (!activeStat) return [] as RequestRow[];
    if (activeStat === "total") return allRequests;
    if (activeStat === "pending") {
      return allRequests.filter((r) => r.status === "request_sent");
    }
    if (activeStat === "inProgress") {
      return allRequests.filter((r) =>
        [
          ...accountingStatuses,
          ...procurementStatuses,
          ...supplyStatuses,
        ].includes(r.status),
      );
    }
    if (activeStat === "completed") {
      return allRequests.filter((r) => r.status === "completed");
    }
    return [];
  }, [
    activeStat,
    allRequests,
    accountingStatuses,
    procurementStatuses,
    supplyStatuses,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statusDistribution = useMemo(
    () =>
      [
        { name: "Request Sent", value: stats.requestSent, color: "#6b7280" },
        {
          name: "Accounting Phase",
          value: stats.accountingPhase,
          color: "#f59e0b",
        },
        {
          name: "Procurement Phase",
          value: stats.procurementPhase,
          color: "#3b82f6",
        },
        { name: "Supply Phase", value: stats.supplyPhase, color: "#8b5cf6" },
        { name: "Completed", value: stats.completed, color: "#22c55e" },
        { name: "Returned", value: stats.returned, color: "#ef4444" },
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
            onClick={() => setActiveStat("total")}
          />
          <StatCard
            title="Pending Review"
            value={stats.requestSent}
            sub="awaiting accounting review"
            icon={Clock}
            theme="amber"
            onClick={() => setActiveStat("pending")}
          />
          <StatCard
            title="In Progress"
            value={
              stats.accountingPhase + stats.procurementPhase + stats.supplyPhase
            }
            sub="under processing"
            icon={CheckCircle2}
            theme="green"
            onClick={() => setActiveStat("inProgress")}
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            sub="fully completed"
            icon={Package}
            theme="violet"
            onClick={() => setActiveStat("completed")}
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
                  label: "Request Sent",
                  count: stats.requestSent,
                  color: "bg-gray-100 text-gray-700",
                },
                {
                  label: "Accounting Phase",
                  count: stats.accountingPhase,
                  color: "bg-amber-100 text-amber-700",
                },
                {
                  label: "Procurement Phase",
                  count: stats.procurementPhase,
                  color: "bg-blue-100 text-blue-700",
                },
                {
                  label: "Supply Phase",
                  count: stats.supplyPhase,
                  color: "bg-violet-100 text-violet-700",
                },
                {
                  label: "Completed",
                  count: stats.completed,
                  color: "bg-green-100 text-green-700",
                },
                {
                  label: "Returned",
                  count: stats.returned,
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
                      {formatPrLabel(r)}
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

      {activeStat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setActiveStat(null)}
          />
          <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {modalTitle}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {modalRequests.length} record(s)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveStat(null)}
                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3">PR Number</th>
                    <th className="px-5 py-3">Purpose</th>
                    <th className="px-5 py-3">Requester</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {modalRequests.map((r) => (
                    <tr
                      key={r.id}
                      className="text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        setActiveStat(null);
                        navigate(`/admin/requests?open=${r.id}`);
                      }}
                    >
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {formatPrLabel(r)}
                      </td>
                      <td className="px-5 py-4 max-w-[220px] truncate">
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
                      <td className="px-5 py-4">
                        <StatusPill status={r.status} />
                      </td>
                    </tr>
                  ))}
                  {modalRequests.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-10 text-center text-sm text-gray-500"
                      >
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
