// src/pages/user/CreateRequest.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Send, Plus, Trash2, Save, FileEdit, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  createRequest,
  fetchUserProfile,
  fetchDrafts,
  saveDraft,
  submitDraft,
  deleteDraft,
  fetchRequestById,
  canEditReturnedRequest,
  resubmitReturnedRequest,
  type RequestItemInput,
  type RequestRow,
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
  const { requestId } = useParams<{ requestId?: string }>();

  const [purpose, setPurpose] = useState("");
  const [fundSource, setFundSource] = useState("");
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Returned request editing state
  const [editingReturnedRequestId, setEditingReturnedRequestId] = useState<
    string | null
  >(null);
  const [loadingReturnedRequest, setLoadingReturnedRequest] = useState(false);

  // Draft state
  const [drafts, setDrafts] = useState<RequestRow[]>([]);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [loadingDrafts, setLoadingDrafts] = useState(false);

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

  // Load returned request if coming from edit link
  useEffect(() => {
    if (!requestId) return;
    setLoadingReturnedRequest(true);
    fetchRequestById(requestId)
      .then((req) => {
        if (!canEditReturnedRequest(req)) {
          setError(
            "This request cannot be edited. It may have already been approved or is not eligible for revision.",
          );
          setTimeout(() => navigate("/requests"), 3000);
          return;
        }
        setEditingReturnedRequestId(requestId);
        setPurpose(req.purpose || "");
        setFundSource(req.fund_source || "");
        // Map items to form items with keys
        if (req.items && req.items.length > 0) {
          const mappedItems = req.items.map((item) => ({
            key: nextKey++,
            qty: item.qty,
            itemDescription: item.item_description,
            uom: item.uom,
            unitCost: item.unit_cost ? Number(item.unit_cost) : 0,
          }));
          setItems(mappedItems);
        }
      })
      .catch((err) => {
        console.error("Failed to load returned request:", err);
        setError("Failed to load the request. Please try again.");
      })
      .finally(() => setLoadingReturnedRequest(false));
  }, [requestId, navigate]);

  // Load drafts
  useEffect(() => {
    if (!user?.id || requestId) return; // Don't load drafts if editing a returned request
    setLoadingDrafts(true);
    fetchDrafts(user.id)
      .then(setDrafts)
      .catch(console.error)
      .finally(() => setLoadingDrafts(false));
  }, [user?.id, requestId]);

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
      if (editingReturnedRequestId) {
        // Resubmit returned request
        await resubmitReturnedRequest({
          requestId: editingReturnedRequestId,
          userId: user.id,
          items: items.map((it) => ({
            qty: it.qty,
            itemDescription: it.itemDescription,
            uom: it.uom,
            unitCost: it.unitCost || undefined,
          })),
        });
      } else if (editingDraftId) {
        // Update the draft first, then submit it
        await saveDraft({
          draftId: editingDraftId,
          collegeId,
          programId,
          purpose: purpose || undefined,
          fundSource: fundSource || undefined,
          createdBy: user.id,
          items: items.map((it) => ({
            qty: it.qty,
            itemDescription: it.itemDescription,
            uom: it.uom,
            unitCost: it.unitCost || undefined,
          })),
        });
        await submitDraft(editingDraftId, user.id);
      } else {
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
      }
      navigate("/requests");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveDraft() {
    if (!user?.id || !collegeId || !programId) {
      setError("College and Program are required to save a draft.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await saveDraft({
        draftId: editingDraftId ?? undefined,
        collegeId,
        programId,
        purpose: purpose || undefined,
        fundSource: fundSource || undefined,
        createdBy: user.id,
        items: items.map((it) => ({
          qty: it.qty,
          itemDescription: it.itemDescription,
          uom: it.uom,
          unitCost: it.unitCost || undefined,
        })),
      });
      setEditingDraftId(result.id);
      // Refresh drafts list
      const updated = await fetchDrafts(user.id);
      setDrafts(updated);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save draft.");
    } finally {
      setSaving(false);
    }
  }

  function loadDraft(draft: RequestRow) {
    setEditingDraftId(draft.id);
    setPurpose(draft.purpose ?? "");
    setFundSource(draft.fund_source ?? "");
    const draftItems: ItemRow[] = (draft.items ?? []).map((it: any) => ({
      key: nextKey++,
      qty: it.qty,
      itemDescription: it.item_description,
      uom: it.uom,
      unitCost: it.unit_cost ? Number(it.unit_cost) : 0,
    }));
    setItems(draftItems.length > 0 ? draftItems : [emptyItem()]);
    setError("");
  }

  function resetForm() {
    setEditingDraftId(null);
    setEditingReturnedRequestId(null);
    setPurpose("");
    setFundSource("");
    setItems([emptyItem()]);
    setError("");
  }

  async function handleDeleteDraft(id: string) {
    try {
      await deleteDraft(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      if (editingDraftId === id) resetForm();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to delete draft.");
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
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              {editingReturnedRequestId
                ? "Resubmit Returned Request"
                : editingDraftId
                  ? "Edit Draft"
                  : "Create Procurement Request"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {editingReturnedRequestId
                ? "Make corrections and resubmit your request"
                : editingDraftId
                  ? "Continue editing your saved draft"
                  : "Fill in the details to create a new procurement request"}
            </p>
          </div>
          {(editingDraftId || editingReturnedRequestId) && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
              New Request
            </button>
          )}
        </div>

        {/* Drafts panel */}
        {(drafts.length > 0 || loadingDrafts) &&
          !editingDraftId &&
          !editingReturnedRequestId && (
            <div className="mb-5 rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                <FileEdit className="inline h-4 w-4 mr-1 -mt-0.5" />
                Saved Drafts ({drafts.length})
              </h2>
              <div className="space-y-2">
                {drafts.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {d.purpose || "Untitled draft"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {d.items?.length ?? 0} item(s) · Last saved{" "}
                        {new Date(d.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <button
                        type="button"
                        onClick={() => loadDraft(d)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        <FileEdit className="h-3.5 w-3.5" />
                        Continue
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDraft(d.id)}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete draft"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loadingReturnedRequest && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
            <div className="animate-spin">
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            Loading returned request...
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
            {!editingReturnedRequestId && (
              <button
                type="button"
                disabled={saving || submitting}
                onClick={handleSaveDraft}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving
                  ? "Saving…"
                  : editingDraftId
                    ? "Update Draft"
                    : "Save as Draft"}
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitting
                ? "Submitting…"
                : editingReturnedRequestId
                  ? "Resubmit Request"
                  : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
