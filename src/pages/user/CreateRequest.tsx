// src/pages/user/CreateRequest.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  createRequest,
  fetchUserProfile,
  type RequestItemInput,
} from "../../lib/requests";

type ItemRow = RequestItemInput & { key: number };

let nextKey = 1;

function emptyItem(): ItemRow {
  return {
    key: nextKey++,
    qty: 1,
    itemDescription: "",
    uom: "pcs",
    unitCost: 0,
  };
}

export default function CreateRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [purpose, setPurpose] = useState("");
  const [fundSource, setFundSource] = useState("");
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Resolved from user profile — read-only
  const [profile, setProfile] = useState<any>(null);
  const collegeId = profile?.college_id ?? "";
  const programId = profile?.program_id ?? "";
  const collegeName = profile?.college
    ? `${profile.college.code} – ${profile.college.name}`
    : "";
  const programName = profile?.program
    ? `${profile.program.code} – ${profile.program.name}`
    : "";

  useEffect(() => {
    if (!user?.id) return;
    fetchUserProfile(user.id).then(setProfile).catch(console.error);
  }, [user?.id]);

  const uomOptions = useMemo(
    () => [
      "pcs",
      "box",
      "ream",
      "set",
      "unit",
      "pack",
      "roll",
      "bottle",
      "lot",
    ],
    [],
  );

  function updateItem(key: number, field: keyof RequestItemInput, value: any) {
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, [field]: value } : it)),
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    if (!collegeId || !programId) {
      setError("College and Program are required.");
      return;
    }
    if (items.some((it) => !it.itemDescription.trim())) {
      setError("All items must have a description.");
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
        createdBy: user.id,
        items: items.map((it) => ({
          qty: it.qty,
          itemDescription: it.itemDescription,
          uom: it.uom,
          unitCost: it.unitCost || undefined,
        })),
      });
      navigate("/requests");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  const money = useMemo(
    () =>
      new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }),
    [],
  );

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

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Card */}
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6">
              {/* College + Program (read-only from profile) */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    College
                  </label>
                  <div className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700">
                    {collegeName || (
                      <span className="text-gray-400">Loading…</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Program
                  </label>
                  <div className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700">
                    {programName || (
                      <span className="text-gray-400">Loading…</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Purpose <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="mt-2 min-h-[80px] w-full resize-y rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="Describe the purpose of this procurement request"
                  required
                />
              </div>

              {/* Fund Source */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Fund Source{" "}
                  <span className="text-xs font-normal text-gray-400">
                    (Optional)
                  </span>
                </label>
                <input
                  value={fundSource}
                  onChange={(e) => setFundSource(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g., General Fund, MOOE"
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Request Items <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4" /> Add Item
                  </button>
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

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                        <div className="md:col-span-2">
                          <label className="text-xs text-gray-500">
                            Description <span className="text-red-500">*</span>
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
                            placeholder="Item description"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-500">Qty *</label>
                          <input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={(e) =>
                              updateItem(
                                item.key,
                                "qty",
                                parseInt(e.target.value) || 1,
                              )
                            }
                            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-xs text-gray-500">UOM</label>
                          <select
                            value={item.uom}
                            onChange={(e) =>
                              updateItem(item.key, "uom", e.target.value)
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

                        <div>
                          <label className="text-xs text-gray-500">
                            Unit Cost
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.unitCost ?? ""}
                            onChange={(e) =>
                              updateItem(
                                item.key,
                                "unitCost",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {item.unitCost ? (
                        <div className="mt-2 text-right text-xs text-gray-500">
                          Subtotal: {money.format(item.unitCost * item.qty)}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                {totalAmount > 0 && (
                  <div className="mt-4 flex justify-end">
                    <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                      Total Estimated Cost: {money.format(totalAmount)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4 rounded-b-2xl">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
