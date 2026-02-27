// src/pages/admin/Dashboard.tsx
import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { FileText, Clock, CheckCircle2, Package, Eye } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type StatCardProps = {
  title: string;
  value: string | number;
  sub: string;
  changeText: string;
  icon: React.ComponentType<{ className?: string }>;
  theme: "blue" | "amber" | "green" | "violet";
};

function StatCard({
  title,
  value,
  sub,
  changeText,
  icon: Icon,
  theme,
}: StatCardProps) {
  const themeMap = {
    blue: {
      border: "border-blue-200",
      iconBg: "bg-blue-50",
      iconText: "text-blue-600",
      changeText: "text-green-600",
    },
    amber: {
      border: "border-amber-200",
      iconBg: "bg-amber-50",
      iconText: "text-amber-600",
      changeText: "text-green-600",
    },
    green: {
      border: "border-green-200",
      iconBg: "bg-green-50",
      iconText: "text-green-600",
      changeText: "text-green-600",
    },
    violet: {
      border: "border-violet-200",
      iconBg: "bg-violet-50",
      iconText: "text-violet-600",
      changeText: "text-green-600",
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
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className={`${themeMap.changeText} font-semibold`}>
              {changeText}
            </span>
            <span className="text-gray-500">{sub}</span>
          </div>
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

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Pending Approval": "bg-amber-100 text-amber-700",
    Approved: "bg-green-100 text-green-700",
    "In Progress": "bg-blue-100 text-blue-700",
    Completed: "bg-violet-100 text-violet-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

export default function Dashboard() {
  const stats = useMemo(
    () => ({
      totalRequests: 248,
      pendingApprovals: 42,
      approvedRequests: 186,
      completedProcurements: 164,
    }),
    [],
  );

  const statusDistribution = useMemo(
    () => [
      { name: "Approved", value: 186, color: "#22c55e" },
      { name: "Completed", value: 164, color: "#8b5cf6" },
      { name: "In Progress", value: 64, color: "#3b82f6" },
      { name: "Pending", value: 42, color: "#f59e0b" },
    ],
    [],
  );

  const monthlyTrends = useMemo(
    () => [
      { month: "Jan", requests: 28, completed: 24 },
      { month: "Feb", requests: 32, completed: 28 },
      { month: "Mar", requests: 26, completed: 22 },
      { month: "Apr", requests: 35, completed: 30 },
      { month: "May", requests: 42, completed: 35 },
      { month: "Jun", requests: 38, completed: 32 },
    ],
    [],
  );

  const recentRequests = useMemo(
    () => [
      {
        requestNo: "PR-2024-0248",
        title: "Office Supplies - Accounting Dept",
        department: "Accounting",
        date: "2024-02-15",
        amount: 1250,
        status: "Pending Approval",
      },
      {
        requestNo: "PR-2024-0247",
        title: "Laboratory Equipment",
        department: "Science Lab",
        date: "2024-02-15",
        amount: 8500,
        status: "Approved",
      },
      {
        requestNo: "PR-2024-0246",
        title: "Computer Hardware",
        department: "IT Department",
        date: "2024-02-14",
        amount: 12000,
        status: "In Progress",
      },
      {
        requestNo: "PR-2024-0245",
        title: "Furniture - Faculty Lounge",
        department: "Facilities",
        date: "2024-02-14",
        amount: 3800,
        status: "Completed",
      },
      {
        requestNo: "PR-2024-0244",
        title: "Library Books Purchase",
        department: "Library",
        date: "2024-02-13",
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Procurement overview and statistics
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Requests"
            value={stats.totalRequests}
            changeText="↗ +12%"
            sub="vs last month"
            icon={FileText}
            theme="blue"
          />
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            changeText="↗ +5"
            sub="vs last month"
            icon={Clock}
            theme="amber"
          />
          <StatCard
            title="Approved Requests"
            value={stats.approvedRequests}
            changeText="↗ +8%"
            sub="vs last month"
            icon={CheckCircle2}
            theme="green"
          />
          <StatCard
            title="Completed Procurements"
            value={stats.completedProcurements}
            changeText="↗ +15"
            sub="vs last month"
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
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 text-sm font-semibold text-gray-900">
              Monthly Trends
            </div>

            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="requests" name="Requests" fill="#3b82f6" />
                  <Bar dataKey="completed" name="Completed" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
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
                  <th className="px-5 py-3">Request Number</th>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {recentRequests.map((r) => (
                  <tr key={r.requestNo} className="text-sm text-gray-700">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">
                        {r.requestNo}
                      </div>
                    </td>
                    <td className="px-5 py-4">{r.title}</td>
                    <td className="px-5 py-4">{r.department}</td>
                    <td className="px-5 py-4">{r.date}</td>
                    <td className="px-5 py-4">{money.format(r.amount)}</td>
                    <td className="px-5 py-4">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-5 py-4">
                      <button className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
