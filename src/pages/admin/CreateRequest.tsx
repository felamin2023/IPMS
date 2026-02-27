// src/pages/admin/CreateRequest.tsx
import { useMemo, useState } from "react";
import { Save, Send } from "lucide-react";

type FormState = {
  title: string;
  department: string;
  description: string;
  quantity: string;
  estimatedCost: string;
  preferredSupplier: string;
  notes: string;
};

export default function CreateRequest() {
  const departments = useMemo(
    () => [
      "Accounting",
      "Science Lab",
      "IT Department",
      "Facilities",
      "Library",
      "Administration",
    ],
    [],
  );

  const [form, setForm] = useState<FormState>({
    title: "",
    department: "",
    description: "",
    quantity: "",
    estimatedCost: "",
    preferredSupplier: "",
    notes: "",
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSaveDraft(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    // UI-only placeholder
    alert("Draft saved (UI only).");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // UI-only placeholder
    alert("Request submitted (UI only).");
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Create Procurement Request
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Fill in the details to create a new procurement request
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Request Title */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Request Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g., Office Supplies - Accounting Department"
                  required
                />
              </div>

              {/* Department */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Department / Office <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.department}
                  onChange={(e) => update("department", e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  <option value="" disabled>
                    Select Department
                  </option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Item Description */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Item Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  className="mt-2 min-h-[110px] w-full resize-y rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="Provide a detailed description of the items or services needed"
                  required
                />
              </div>

              {/* Quantity + Estimated Cost */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.quantity}
                    onChange={(e) => update("quantity", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g., 50"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Estimated Cost <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.estimatedCost}
                    onChange={(e) => update("estimatedCost", e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g., $1,500"
                    required
                  />
                </div>
              </div>

              {/* Preferred Supplier (Optional) */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Preferred Supplier{" "}
                  <span className="text-xs font-normal text-gray-400">
                    (Optional)
                  </span>
                </label>
                <input
                  value={form.preferredSupplier}
                  onChange={(e) => update("preferredSupplier", e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter supplier name if you have a preference"
                />
              </div>

              {/* Justification / Notes */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Justification / Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  className="mt-2 min-h-[110px] w-full resize-y rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="Explain why this procurement is necessary and how it will be used"
                  required
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4 rounded-b-2xl">
            <button
              type="button"
              onClick={onSaveDraft}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
