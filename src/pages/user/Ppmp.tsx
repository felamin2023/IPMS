import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Save,
  Trash2,
  CheckCircle,
  PencilLine,
  Eye,
  X,
  Download,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  completePpmpPlan,
  createPpmpPlan,
  fetchPrograms,
  fetchCompletedRequestsForProgram,
  fetchUserPpmpPlans,
  fetchUserProfile,
  updatePpmpPlan,
  type PpmpPlanRow,
  type RequestItemUsageRow,
} from "../../lib/requests";
import { generatePpmpDocument } from "../../lib/generatePpmp";
import ppmpCatalog from "../../lib/ppmpCatalog.json";

type PpmpItemRow = {
  key: number;
  category: string;
  itemDescription: string;
  qtyInput: string;
  qty: number;
  uom: string;
  unitPriceInput: string;
  unitPrice: number;
};

type PpmpItemSummary = {
  key: string;
  category: string;
  itemDescription: string;
  uom: string;
  ppmpQty: number;
  takenQty: number;
  remainingQty: number;
};

let nextKey = 1;

function emptyItem(): PpmpItemRow {
  return {
    key: nextKey++,
    category: "",
    itemDescription: "",
    qtyInput: "1",
    qty: 1,
    uom: "",
    unitPriceInput: "0",
    unitPrice: 0,
  };
}

function isExpired(plan: PpmpPlanRow) {
  if (!plan.expires_at) return false;
  return new Date(plan.expires_at).getTime() < Date.now();
}

function getPlanStatus(plan: PpmpPlanRow) {
  if (!plan.completed_at) return "Pending";
  return isExpired(plan) ? "Expired" : "Active";
}

function normalizeKey(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function makeItemKey(params: {
  category?: string | null;
  description?: string | null;
  uom?: string | null;
}) {
  return `${normalizeKey(params.category)}||${normalizeKey(
    params.description,
  )}||${normalizeKey(params.uom)}`;
}

export default function Ppmp() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [programOptions, setProgramOptions] = useState<any[]>([]);
  const [programId, setProgramId] = useState<string>("");
  const [items, setItems] = useState<PpmpItemRow[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [plans, setPlans] = useState<PpmpPlanRow[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  const [completingPlan, setCompletingPlan] = useState<PpmpPlanRow | null>(
    null,
  );
  const [expirationInput, setExpirationInput] = useState("");

  const [viewPlan, setViewPlan] = useState<PpmpPlanRow | null>(null);
  const [viewFilter, setViewFilter] = useState<"remaining" | "taken" | "all">(
    "remaining",
  );
  const [viewLoading, setViewLoading] = useState(false);
  const [viewRows, setViewRows] = useState<PpmpItemSummary[]>([]);

  const collegeId = profile?.college_id ?? "";
  const collegeName = profile?.college
    ? `${profile.college.code} – ${profile.college.name}`
    : "";

  useEffect(() => {
    if (!user?.id) return;
    fetchUserProfile(user.id)
      .then((data) => {
        setProfile(data);
        if (data?.program_id) {
          setProgramId(data.program_id);
        }
      })
      .catch(console.error);
  }, [user?.id]);

  useEffect(() => {
    if (!collegeId) return;
    fetchPrograms(collegeId)
      .then((rows) => setProgramOptions(rows))
      .catch(console.error);
  }, [collegeId]);

  const refreshPlans = async () => {
    if (!user?.id) return;
    setLoadingPlans(true);
    try {
      const data = await fetchUserPpmpPlans({ userId: user.id });
      setPlans(data);
    } catch (err) {
      console.error("Failed to load PPMP plans:", err);
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    void refreshPlans();
  }, [user?.id]);

  const categoryOptions = useMemo(() => {
    const all = ppmpCatalog.map((entry) => entry.category);
    return Array.from(new Set(all)).sort((a, b) => a.localeCompare(b));
  }, []);

  const itemsByCategory = useMemo(() => {
    const map = new Map<
      string,
      { description: string; uom: string; unitPrice: string }[]
    >();
    for (const entry of ppmpCatalog) {
      map.set(entry.category, entry.items);
    }
    return map;
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

  const activeCompletedByProgram = useMemo(() => {
    const map = new Map<string, PpmpPlanRow>();
    for (const plan of plans) {
      if (!plan.completed_at || isExpired(plan)) continue;
      if (!map.has(plan.program_id)) {
        map.set(plan.program_id, plan);
      }
    }
    return map;
  }, [plans]);

  const activeCompletedPlan = programId
    ? activeCompletedByProgram.get(programId)
    : null;
  function getProgramName(plan: PpmpPlanRow) {
    if (plan.program_id === programId) {
      return programOptions.find((p) => p.id === programId)?.name ?? "—";
    }
    return (plan as any).program?.name ?? "—";
  }

  function handleDownload(plan: PpmpPlanRow) {
    generatePpmpDocument(plan, {
      collegeName,
      programName: getProgramName(plan),
      unitName: profile?.office_name ?? profile?.department_name ?? "",
    });
  }

  async function openPlanView(plan: PpmpPlanRow) {
    setViewPlan(plan);
    setViewFilter("remaining");
    setViewLoading(true);

    try {
      const usageRows = await fetchCompletedRequestsForProgram({
        collegeId: plan.college_id,
        programId: plan.program_id,
      });
      const takenMap = new Map<string, number>();

      usageRows.forEach((row: RequestItemUsageRow) => {
        (row.items ?? []).forEach((item) => {
          const key = makeItemKey({
            category: item.category,
            description: item.item_description,
            uom: item.uom,
          });
          const current = takenMap.get(key) ?? 0;
          takenMap.set(key, current + (item.qty ?? 0));
        });
      });

      const summaries = (plan.items ?? []).map((item) => {
        const key = makeItemKey({
          category: item.category,
          description: item.item_description,
          uom: item.uom,
        });
        const takenQty = takenMap.get(key) ?? 0;
        const remainingQty = Math.max((item.qty ?? 0) - takenQty, 0);

        return {
          key: `${item.id}-${key}`,
          category: item.category,
          itemDescription: item.item_description,
          uom: item.uom,
          ppmpQty: item.qty ?? 0,
          takenQty,
          remainingQty,
        };
      });

      setViewRows(summaries);
    } catch (err) {
      console.error("Failed to load PPMP usage:", err);
      setViewRows([]);
    } finally {
      setViewLoading(false);
    }
  }

  const isBlockedByActivePlan = Boolean(
    activeCompletedPlan && activeCompletedPlan.id !== editingPlanId,
  );

  function updateItem(key: number, field: string, value: string) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.key !== key) return it;
        if (field === "category") {
          return { ...it, category: value, itemDescription: "", uom: "" };
        }
        if (field === "itemDescription") {
          const options = it.category
            ? (itemsByCategory.get(it.category) ?? [])
            : [];
          const match = options.find((opt) => opt.description === value);
          return {
            ...it,
            itemDescription: value,
            uom: match?.uom || it.uom,
            unitPriceInput: match?.unitPrice || it.unitPriceInput,
            unitPrice: match?.unitPrice
              ? parseFloat(match.unitPrice) || 0
              : it.unitPrice,
          };
        }
        if (field === "qtyInput") {
          const parsed = parseInt(value, 10);
          return {
            ...it,
            qtyInput: value,
            qty: Number.isFinite(parsed) && parsed > 0 ? parsed : it.qty,
          };
        }
        if (field === "unitPriceInput") {
          const parsed = parseFloat(value);
          return {
            ...it,
            unitPriceInput: value,
            unitPrice: Number.isFinite(parsed) ? parsed : it.unitPrice,
          };
        }
        if (field === "uom") {
          return { ...it, uom: value };
        }
        return { ...it, [field]: value };
      }),
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(key: number) {
    setItems((prev) =>
      prev.length > 1 ? prev.filter((it) => it.key !== key) : prev,
    );
  }

  function resetForm() {
    setItems([emptyItem()]);
    setEditingPlanId(null);
    setError("");
  }

  function startEditingPlan(plan: PpmpPlanRow) {
    const planItems = (plan.items ?? []).map((item) => ({
      key: nextKey++,
      category: item.category,
      itemDescription: item.item_description,
      qtyInput: String(item.qty ?? 1),
      qty: item.qty ?? 1,
      uom: item.uom,
      unitPriceInput: item.unit_price != null ? String(item.unit_price) : "0",
      unitPrice: item.unit_price != null ? Number(item.unit_price) : 0,
    }));

    setEditingPlanId(plan.id);
    setProgramId(plan.program_id);
    setItems(planItems.length > 0 ? planItems : [emptyItem()]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id || !collegeId || !programId) return;

    if (isBlockedByActivePlan) {
      setError(
        "You already have an active, completed PPMP for this program. Wait until it expires before creating a new one.",
      );
      return;
    }

    const trimmed = items.filter(
      (item) => item.itemDescription.trim() && item.category.trim(),
    );
    if (trimmed.length === 0) {
      setError("Please add at least one PPMP item.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (editingPlanId) {
        await updatePpmpPlan({
          planId: editingPlanId,
          items: trimmed.map((item) => ({
            category: item.category,
            itemDescription: item.itemDescription,
            qty: item.qty,
            uom: item.uom,
            unitPrice: item.unitPrice || undefined,
          })),
        });
      } else {
        await createPpmpPlan({
          createdBy: user.id,
          collegeId,
          programId,
          items: trimmed.map((item) => ({
            category: item.category,
            itemDescription: item.itemDescription,
            qty: item.qty,
            uom: item.uom,
            unitPrice: item.unitPrice || undefined,
          })),
        });
      }

      await refreshPlans();
      resetForm();
      navigate("/ppmp");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save PPMP.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCompletePlan() {
    if (!user?.id || !completingPlan) return;
    if (!expirationInput) {
      setError("Please provide a PPMP expiration date.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await completePpmpPlan({
        planId: completingPlan.id,
        completedBy: user.id,
        expiresAt: expirationInput,
      });
      setCompletingPlan(null);
      setExpirationInput("");
      await refreshPlans();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to complete PPMP.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            PPMP Requests
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create, complete, and realign your PPMP per program.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm mb-6">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              My PPMP Requests
            </h2>
          </div>
          {loadingPlans ? (
            <div className="px-6 py-10 text-sm text-gray-500">Loading...</div>
          ) : plans.length === 0 ? (
            <div className="px-6 py-10 text-sm text-gray-500">
              No PPMP requests yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3">Program</th>
                    <th className="px-5 py-3">Created</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Expires</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {plans.map((plan) => (
                    <tr key={plan.id}>
                      <td className="px-5 py-4">{getProgramName(plan)}</td>
                      <td className="px-5 py-4">
                        {new Date(plan.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">{getPlanStatus(plan)}</td>
                      <td className="px-5 py-4">
                        {plan.expires_at
                          ? new Date(plan.expires_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {!plan.completed_at ? (
                            <>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                                onClick={() => openPlanView(plan)}
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                onClick={() => startEditingPlan(plan)}
                              >
                                <PencilLine className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                onClick={() => {
                                  setCompletingPlan(plan);
                                  setExpirationInput("");
                                }}
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                Complete
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                                onClick={() => openPlanView(plan)}
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                                onClick={() => startEditingPlan(plan)}
                              >
                                <PencilLine className="h-3.5 w-3.5" />
                                Realignment
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                onClick={() => handleDownload(plan)}
                              >
                                <Download className="h-3.5 w-3.5" />
                                Download
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    College
                  </label>
                  <div className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700">
                    {collegeName || "—"}
                  </div>
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
                  >
                    <option value="">Select program</option>
                    {programOptions.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.code} – {program.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isBlockedByActivePlan && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  You already have an active PPMP for this program. Wait until
                  it expires before creating another.
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    PPMP Items <span className="text-red-500">*</span>
                  </label>
                </div>

                <div className="mt-3 space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={item.key}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-semibold text-gray-500">
                          Item {idx + 1}
                        </div>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                        <div className="md:col-span-2">
                          <label className="text-xs text-gray-500">
                            Category <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={item.category}
                            onChange={(e) =>
                              updateItem(item.key, "category", e.target.value)
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
                            Item <span className="text-red-500">*</span>
                          </label>
                          <input
                            value={item.itemDescription}
                            onChange={(e) =>
                              updateItem(
                                item.key,
                                "itemDescription",
                                e.target.value,
                              )
                            }
                            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                            required
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-xs text-gray-500">Qty *</label>
                          <input
                            type="number"
                            min={1}
                            step="1"
                            value={item.qtyInput}
                            onChange={(e) =>
                              updateItem(item.key, "qtyInput", e.target.value)
                            }
                            onBlur={(e) => {
                              if (!e.target.value) {
                                updateItem(item.key, "qtyInput", "1");
                              }
                            }}
                            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                            required
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-xs text-gray-500">UOM</label>
                          <select
                            value={item.uom}
                            onChange={(e) =>
                              updateItem(item.key, "uom", e.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                          >
                            <option value="">Select UOM</option>
                            {uomOptions.map((uom) => (
                              <option key={uom} value={uom}>
                                {uom}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-xs text-gray-500">
                            Unit Price
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.unitPriceInput}
                            onChange={(e) =>
                              updateItem(
                                item.key,
                                "unitPriceInput",
                                e.target.value,
                              )
                            }
                            onBlur={(e) => {
                              if (!e.target.value) {
                                updateItem(item.key, "unitPriceInput", "0");
                              }
                            }}
                            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>

                      {idx === items.length - 1 && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={addItem}
                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                          >
                            <Plus className="h-4 w-4" /> Add Item
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4 rounded-b-2xl">
            {editingPlanId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              disabled={saving || isBlockedByActivePlan}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving
                ? "Saving…"
                : editingPlanId
                  ? "Save Changes"
                  : "Save PPMP"}
            </button>
          </div>
        </form>
      </div>

      {completingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Complete PPMP
              </h3>
              <button
                onClick={() => setCompletingPlan(null)}
                className="rounded-lg p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-3">
              Please set the expiration date for this PPMP.
            </p>

            <div className="mb-4">
              <label className="text-xs font-semibold uppercase text-gray-500">
                Expiration Date
              </label>
              <input
                type="date"
                value={expirationInput}
                onChange={(e) => setExpirationInput(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCompletingPlan(null)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleCompletePlan}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                Complete PPMP
              </button>
            </div>
          </div>
        </div>
      )}

      {viewPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl h-[520px] rounded-2xl bg-white shadow-xl flex flex-col">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    PPMP Items Usage
                  </div>
                  <div className="text-sm text-gray-500">
                    {getProgramName(viewPlan)}
                  </div>
                </div>
                <button
                  onClick={() => setViewPlan(null)}
                  className="rounded-lg p-1 hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 flex-1 flex flex-col min-h-0">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="text-sm text-gray-500">
                  Completed requests are deducted from the PPMP plan.
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold uppercase text-gray-500">
                    Filter
                  </label>
                  <select
                    value={viewFilter}
                    onChange={(e) =>
                      setViewFilter(
                        e.target.value as "remaining" | "taken" | "all",
                      )
                    }
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="remaining">Remaining</option>
                    <option value="taken">Taken</option>
                    <option value="all">All</option>
                  </select>
                </div>
              </div>

              {viewLoading ? (
                <div className="py-10 text-sm text-gray-500">Loading...</div>
              ) : viewRows.length === 0 ? (
                <div className="py-10 text-sm text-gray-500">
                  No items available for this PPMP.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 flex-1 min-h-0">
                  <div className="overflow-y-auto max-h-full">
                    <table className="w-full min-w-[720px]">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Item</th>
                          <th className="px-4 py-3">UOM</th>
                          <th className="px-4 py-3 text-right">PPMP Qty</th>
                          <th className="px-4 py-3 text-right">Taken</th>
                          <th className="px-4 py-3 text-right">Remaining</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                        {viewRows
                          .filter((row) => {
                            if (viewFilter === "all") return true;
                            if (viewFilter === "taken") return row.takenQty > 0;
                            return row.remainingQty > 0;
                          })
                          .map((row) => (
                            <tr key={row.key}>
                              <td className="px-4 py-3">{row.category}</td>
                              <td className="px-4 py-3">
                                {row.itemDescription}
                              </td>
                              <td className="px-4 py-3">{row.uom || "—"}</td>
                              <td className="px-4 py-3 text-right">
                                {row.ppmpQty}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {row.takenQty}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {row.remainingQty}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
