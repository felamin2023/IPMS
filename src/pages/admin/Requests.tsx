// src/pages/admin/Requests.tsx
import { useMemo, useState, useEffect } from "react";
import { Download, Search, Filter, Eye, Pencil, BarChart3 } from "lucide-react";

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

  // force 2-line label so width stays consistent
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

export default function Requests() {
  const data = useMemo<RequestRow[]>(
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
        requestNo: "PR-2024-0247",
        title: "Laboratory Equipment",
        department: "Science Lab",
        dateSubmitted: "2024-02-15",
        amount: 8500,
        status: "Approved",
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
      {
        requestNo: "PR-2024-0243",
        title: "Cleaning Supplies - Facilities",
        department: "Facilities",
        dateSubmitted: "2024-02-13",
        amount: 850,
        status: "Pending Approval",
      },
      {
        requestNo: "PR-2024-0242",
        title: "Engineering Tools",
        department: "Engineering",
        dateSubmitted: "2024-02-12",
        amount: 6400,
        status: "In Progress",
      },
      {
        requestNo: "PR-2024-0241",
        title: "Software Licenses",
        department: "IT Department",
        dateSubmitted: "2024-02-12",
        amount: 9800,
        status: "Completed",
      },
    ],
    [],
  );

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | Status>("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((r) => {
      const matchesQuery =
        !q ||
        r.requestNo.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q);

      const matchesStatus = !status || r.status === status;

      return matchesQuery && matchesStatus;
    });
  }, [data, query, status]);

  const money = useMemo(
    () =>
      new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
    [],
  );

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Procurement Requests
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage all procurement requests
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            onClick={() => alert("Export (UI only)")}
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Filters */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="Search by request number, title, or department..."
                />
              </div>

              {/* Filter icon + dropdown */}
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500">
                  <Filter className="h-4 w-4" />
                </div>

                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as any);
                    setPage(1);
                  }}
                  className="h-10 min-w-[160px] rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">All Status</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3">Request Number</th>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Date Submitted</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {current.map((r) => (
                  <tr key={r.requestNo} className="text-sm text-gray-700">
                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">
                        {r.requestNo}
                      </div>
                    </td>
                    <td className="px-5 py-4">{r.title}</td>
                    <td className="px-5 py-4 text-gray-600">{r.department}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {r.dateSubmitted}
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {money.format(r.amount)}
                    </td>

                    {/* centered + consistent width */}
                    <td className="px-5 py-4">
                      <div className="flex justify-center">
                        <StatusPill status={r.status} />
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 text-blue-600">
                        <button
                          type="button"
                          className="hover:text-blue-700"
                          onClick={() => alert(`View ${r.requestNo} (UI only)`)}
                          aria-label="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="text-gray-500 hover:text-gray-700"
                          onClick={() => alert(`Edit ${r.requestNo} (UI only)`)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="text-gray-500 hover:text-gray-700"
                          onClick={() =>
                            alert(`Analytics ${r.requestNo} (UI only)`)
                          }
                          aria-label="Analytics"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {current.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-sm text-gray-500"
                    >
                      No requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination */}
          <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">
              Showing {current.length} of {filtered.length} requests
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>

              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={[
                    "h-9 w-9 rounded-lg border text-sm font-semibold",
                    page === p
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                  ].join(" ")}
                  onClick={() => setPage(Math.min(totalPages, p))}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
