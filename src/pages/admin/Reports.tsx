import { useMemo } from "react";
import {
  Download,
  CalendarDays,
  FileText,
  TrendingUp,
  DollarSign,
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

type StatCardProps = {
  title: string;
  value: string;
  sub: string;
  change: string;
  theme: "blue" | "violet" | "green" | "amber";
  icon: React.ComponentType<{ className?: string }>;
};

function StatCard({
  title,
  value,
  sub,
  change,
  theme,
  icon: Icon,
}: StatCardProps) {
  const map = {
    blue: {
      border: "border-blue-200",
      iconBg: "bg-blue-50",
      iconText: "text-blue-600",
      changeText: "text-green-600",
    },
    violet: {
      border: "border-violet-200",
      iconBg: "bg-violet-50",
      iconText: "text-violet-600",
      changeText: "text-green-600",
    },
    green: {
      border: "border-green-200",
      iconBg: "bg-green-50",
      iconText: "text-green-600",
      changeText: "text-green-600",
    },
    amber: {
      border: "border-amber-200",
      iconBg: "bg-amber-50",
      iconText: "text-amber-600",
      changeText: "text-green-600",
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
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className={`${map.changeText} font-semibold`}>{change}</span>
            <span className="text-gray-500">{sub}</span>
          </div>
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

export default function Reports() {
  const stats = useMemo(
    () => ({
      avgCycle: "6.8",
      totalRequests: "248",
      approvalRate: "94%",
      totalValue: "$463K",
    }),
    [],
  );

  const cycleTime = useMemo(
    () => [
      { month: "Jan", avgDays: 8.0 },
      { month: "Feb", avgDays: 7.2 },
      { month: "Mar", avgDays: 9.1 },
      { month: "Apr", avgDays: 6.2 },
      { month: "May", avgDays: 7.0 },
      { month: "Jun", avgDays: 5.4 },
    ],
    [],
  );

  const requestsByMonth = useMemo(
    () => [
      { month: "Jan", requests: 28 },
      { month: "Feb", requests: 32 },
      { month: "Mar", requests: 26 },
      { month: "Apr", requests: 35 },
      { month: "May", requests: 42 },
      { month: "Jun", requests: 38 },
    ],
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

  const deptActivity = useMemo(
    () => [
      { dept: "IT", requests: 45 },
      { dept: "Science", requests: 38 },
      { dept: "Library", requests: 32 },
      { dept: "Facilities", requests: 28 },
      { dept: "Accounting", requests: 25 },
      { dept: "Engineering", requests: 22 },
    ],
    [],
  );

  const deptPerformance = useMemo(
    () => [
      {
        dept: "IT",
        totalRequests: 45,
        totalValue: 125000,
        avgValue: 2778,
        completionRate: 95,
      },
      {
        dept: "Science",
        totalRequests: 38,
        totalValue: 98000,
        avgValue: 2579,
        completionRate: 86,
      },
      {
        dept: "Library",
        totalRequests: 32,
        totalValue: 65000,
        avgValue: 2031,
        completionRate: 97,
      },
      {
        dept: "Facilities",
        totalRequests: 28,
        totalValue: 52000,
        avgValue: 1857,
        completionRate: 81,
      },
      {
        dept: "Accounting",
        totalRequests: 25,
        totalValue: 38000,
        avgValue: 1520,
        completionRate: 84,
      },
      {
        dept: "Engineering",
        totalRequests: 22,
        totalValue: 85000,
        avgValue: 3864,
        completionRate: 85,
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
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            onClick={() => alert("Export report (UI only)")}
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Avg. Cycle Time"
            value={`${stats.avgCycle} days`}
            change="↘ -15%"
            sub="vs last period"
            theme="blue"
            icon={CalendarDays}
          />
          <StatCard
            title="Total Requests"
            value={stats.totalRequests}
            change="↗ +12%"
            sub="vs last period"
            theme="violet"
            icon={FileText}
          />
          <StatCard
            title="Approval Rate"
            value={stats.approvalRate}
            change="↗ +2%"
            sub="vs last period"
            theme="green"
            icon={TrendingUp}
          />
          <StatCard
            title="Total Value"
            value={stats.totalValue}
            change="↗ +18%"
            sub="vs last period"
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
              Average days from request to completion
            </div>

            <div className="mt-4 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cycleTime}>
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
              Total procurement requests submitted
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
              Breakdown of request statuses
            </div>

            <div className="mt-4 h-[280px]">
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
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">
              Department Activity
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Requests by department
            </div>

            <div className="mt-4 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptActivity} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="dept" width={90} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="requests" name="Requests" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="mt-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="text-sm font-semibold text-gray-900">
              Department Performance
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Detailed breakdown by department
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Total Requests</th>
                  <th className="px-6 py-3">Total Value</th>
                  <th className="px-6 py-3">Avg. Request Value</th>
                  <th className="px-6 py-3">Completion Rate</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {deptPerformance.map((d) => (
                  <tr key={d.dept} className="text-sm text-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {d.dept}
                    </td>
                    <td className="px-6 py-4">{d.totalRequests}</td>
                    <td className="px-6 py-4">{money.format(d.totalValue)}</td>
                    <td className="px-6 py-4">{money.format(d.avgValue)}</td>
                    <td className="px-6 py-4">
                      <ProgressBar value={d.completionRate} />
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
