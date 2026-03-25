// src/pages/admin/CreateRequest.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  createRequest,
  fetchColleges,
  fetchPrograms,
  fetchUserProfile,
  type RequestItemInput,
} from "../../lib/requests";
import ppmpCatalog from "../../lib/ppmpCatalog.json";

type ItemRow = RequestItemInput & {
  key: number;
  qtyInput: string;
  unitCostInput: string;
};

let nextKey = 1;

function emptyItem(): ItemRow {
  return {
    key: nextKey++,
    qty: 1,
    qtyInput: "1",
    itemDescription: "",
    preferredBrand: "",
    category: "",
    uom: "pcs",
    unitCost: 0,
    unitCostInput: "0",
  };
}

export default function CreateRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const nameRegex = /^[A-Za-z\s.'-]+$/;

  const [purpose, setPurpose] = useState("");
  const [fundSource, setFundSource] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [reviewedBy, setReviewedBy] = useState("");
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [colleges, setColleges] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [collegeId, setCollegeId] = useState("");
  const [programId, setProgramId] = useState("");

  useEffect(() => {
    fetchColleges().then(setColleges).catch(console.error);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetchUserProfile(user.id)
      .then((p) => {
        if (p?.college_id) setCollegeId(p.college_id);
        if (p?.program_id) setProgramId(p.program_id);
        if (!requestedBy.trim() && p?.first_name) {
          const fullName = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
          if (fullName) {
            setRequestedBy(fullName);
          }
        }
      })
      .catch(console.error);
  }, [user?.id, requestedBy]);

  useEffect(() => {
    if (collegeId) {
      fetchPrograms(collegeId).then(setPrograms).catch(console.error);
    } else {
      setPrograms([]);
    }
  }, [collegeId]);

  const categoryOptions = useMemo(() => {
    const all = ppmpCatalog.map((entry) => entry.category);
    return Array.from(new Set(all)).sort((a, b) => a.localeCompare(b));
  }, []);

  const uomOptions = useMemo(() => {
    const base = [
      "piece",
      "pc",
      "unit",
      "set",
      "lot",
      "pair",
      "box",
      "pack",
      "ream",
      "roll",
      "bundle",
      "book",
      "pad",
      "notebook",
      "cartridge",
      "bottle",
      "can",
      "tube",
      "sheet",
      "liter",
      "L",
      "milliliter",
      "mL",
      "gallon",
      "container",
      "drum",
      "kilogram",
      "kg",
      "gram",
      "g",
      "ton",
      "meter",
      "m",
      "centimeter",
      "cm",
      "inch",
      "foot",
      "ft",
      "square meter",
      "sqm",
      "cubic meter",
      "cu.m",
      "bag",
      "sack",
      "pail",
      "rod",
      "bar",
      "panel",
      "length",
      "coil",
      "kilo",
      "tray",
      "dozen",
      "sachet",
      "license",
      "subscription",
    ];
    const catalogUoms = ppmpCatalog
      .flatMap((entry) => entry.items.map((item) => item.uom))
      .filter(Boolean);
    return Array.from(new Set([...base, ...catalogUoms])).sort((a, b) =>
      a.localeCompare(b),
    );
  }, []);

  function updateItem(key: number, field: string, value: any) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.key !== key) return it;
        if (field === "category") {
          return { ...it, category: value, itemDescription: "" };
        }
        if (field === "preferredBrand") {
          return { ...it, preferredBrand: value };
        }
        if (field === "qtyInput") {
          const parsed = parseInt(value, 10);
          return {
            ...it,
            qtyInput: value,
            qty: Number.isFinite(parsed) && parsed > 0 ? parsed : it.qty,
          };
        }
        if (field === "unitCostInput") {
          const parsed = parseFloat(value);
          return {
            ...it,
            unitCostInput: value,
            unitCost: Number.isFinite(parsed) ? parsed : it.unitCost,
          };
        }
        return { ...it, [field]: value };
      }),
    );
  }

  function removeItem(key: number) {
    setItems((prev) =>
      prev.length > 1 ? prev.filter((it) => it.key !== key) : prev,
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  const totalAmount = useMemo(
    () => items.reduce((sum, it) => sum + (it.unitCost ?? 0) * it.qty, 0),
    [items],
  );

  const money = useMemo(
    () =>
      new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }),
    [],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    if (!collegeId || !programId) {
      setError("Please select a college and program.");
      return;
    }
    if (!purpose.trim()) {
      setError("Purpose is required.");
      return;
    }
    if (!fundSource.trim()) {
      setError("Fund source is required.");
      return;
    }
    if (items.some((it) => !it.itemDescription.trim())) {
      setError("Each item must have a description.");
      return;
    }
    if (items.some((it) => !it.category?.trim())) {
      setError("Each item must have a category.");
      return;
    }
    if (!requestedBy.trim() || !reviewedBy.trim()) {
      setError("Requested by and Reviewed by are required.");
      return;
    }
    if (!nameRegex.test(requestedBy.trim())) {
      setError("Requested by must contain letters only.");
      return;
    }
    if (!nameRegex.test(reviewedBy.trim())) {
      setError("Reviewed by must contain letters only.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await createRequest({
        collegeId,
        programId,
        purpose,
        fundSource: fundSource || undefined,
        requestedBy: requestedBy || undefined,
        reviewedBy: reviewedBy || undefined,
        createdBy: user.id,
        items: items.map((it) => ({
          qty: it.qty,
          itemDescription: it.itemDescription,
          category: it.category,
          preferredBrand: it.preferredBrand,
          uom: it.uom,
          unitCost: it.unitCost || undefined,
        })),
      });
      navigate("/admin/requests");
    } catch (err: any) {
      console.error("Create request failed:", err);
      setError(err.message ?? "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Create Procurement Request
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Fill in the details to create a new procurement request
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="p-6 space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* College & Program */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  College <span className="text-red-500">*</span>
                </label>
                <select
                  value={collegeId}
                  onChange={(e) => {
                    setCollegeId(e.target.value);
                    setProgramId("");
                  }}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  required
                >
                  <option value="" disabled>
                    Select College
                  </option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Program <span className="text-red-500">*</span>
                </label>
                <select
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  required
                  disabled={!collegeId}
                >
                  <option value="" disabled>
                    Select Program
                  </option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Purpose & Fund Source */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Purpose <span className="text-red-500">*</span>
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                required
              >
                <option value="">Select purpose</option>
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Fund Source <span className="text-red-500">*</span>
              </label>
              <select
                value={fundSource}
                onChange={(e) => setFundSource(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                required
              >
                <option value="">Select fund source</option>
                <option value="General Appropriations Act (GAA)">
                  General Appropriations Act (GAA)
                </option>
                <option value="School Trust Fund (STF)">
                  School Trust Fund (STF)
                </option>
                <option value="Income Generating Projects (IGP)">
                  Income Generating Projects (IGP)
                </option>
              </select>
            </div>

            {/* Requested / Reviewed By */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Requested by <span className="text-red-500">*</span>
                </label>
                <input
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="Name of requester"
                  spellCheck
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Reviewed by <span className="text-red-500">*</span>
                </label>
                <input
                  value={reviewedBy}
                  onChange={(e) => setReviewedBy(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="Name of reviewer"
                  spellCheck
                  required
                />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700">
                  Items <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {items.map((it, idx) => (
                  <div
                    key={it.key}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-500">
                        Item {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(it.key)}
                        className="text-red-400 hover:text-red-600"
                        disabled={items.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-500">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={it.category || ""}
                          onChange={(e) =>
                            updateItem(it.key, "category", e.target.value)
                          }
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                          required
                        >
                          <option value="">Select category</option>
                          {categoryOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-500">
                          Description <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={it.itemDescription}
                          onChange={(e) =>
                            updateItem(
                              it.key,
                              "itemDescription",
                              e.target.value,
                            )
                          }
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                          placeholder="Item description"
                          spellCheck
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-500">
                          Preferred Brand with Detailed Specifications
                        </label>
                        <input
                          value={it.preferredBrand || ""}
                          onChange={(e) =>
                            updateItem(it.key, "preferredBrand", e.target.value)
                          }
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                          placeholder="Notes (for internal reference only)"
                          spellCheck
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-500">Qty *</label>
                        <input
                          type="number"
                          min={1}
                          step="1"
                          value={it.qtyInput}
                          onChange={(e) =>
                            updateItem(it.key, "qtyInput", e.target.value)
                          }
                          onBlur={(e) => {
                            if (!e.target.value) {
                              updateItem(it.key, "qtyInput", "1");
                            }
                          }}
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-500">UOM</label>
                        <select
                          value={it.uom}
                          onChange={(e) =>
                            updateItem(it.key, "uom", e.target.value)
                          }
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                        >
                          {uomOptions.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-xs text-gray-500">
                          Unit Cost
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={it.unitCostInput}
                          onChange={(e) =>
                            updateItem(it.key, "unitCostInput", e.target.value)
                          }
                          onBlur={(e) => {
                            if (!e.target.value) {
                              updateItem(it.key, "unitCostInput", "0");
                            }
                          }}
                          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-3 text-right text-sm font-semibold text-gray-900">
                Total: {money.format(totalAmount)}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4 rounded-b-2xl">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
