// src/pages/user/CreateRequest.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Send,
  Plus,
  Trash2,
  Save,
  FileEdit,
  X,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  createRequest,
  fetchUserProfile,
  fetchDrafts,
  saveDraft,
  submitDraft,
  deleteDraft,
  fetchRequestById,
  fetchPrograms,
  fetchActivePpmpPlan,
  canEditReturnedRequest,
  resubmitReturnedRequest,
  type RequestItemInput,
  type RequestRow,
} from "../../lib/requests";

type ItemRow = RequestItemInput & {
  key: number;
  qtyInput: string;
  unitCostInput: string;
  itemSearch: string;
  availableQty: number | null;
};

let nextKey = 1;

function sanitizeIntegerInput(value: string) {
  return String(value ?? "")
    .replace(/,/g, "")
    .replace(/\D/g, "");
}

function sanitizeDecimalInput(value: string) {
  const cleaned = String(value ?? "")
    .replace(/,/g, "")
    .replace(/[^\d.]/g, "");
  const dotIndex = cleaned.indexOf(".");
  if (dotIndex === -1) return cleaned;
  return (
    cleaned.slice(0, dotIndex + 1) +
    cleaned.slice(dotIndex + 1).replace(/\./g, "")
  );
}

function formatNumberInput(value: string, allowDecimal = false) {
  const cleaned = allowDecimal
    ? sanitizeDecimalInput(value)
    : sanitizeIntegerInput(value);
  if (!cleaned) return "";

  if (allowDecimal) {
    const [intPart, decimalPart] = cleaned.split(".");
    const formattedInt = (intPart || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return decimalPart === undefined
      ? formattedInt
      : `${formattedInt}.${decimalPart}`;
  }

  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function emptyItem(): ItemRow {
  return {
    key: nextKey++,
    qty: 0,
    qtyInput: "",
    itemSearch: "",
    availableQty: null,
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
  const { requestId } = useParams<{ requestId?: string }>();

  const nameRegex = /^[A-Za-z\s.'-]+$/;

  const [purpose, setPurpose] = useState("");
  const [fundSource, setFundSource] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [requestedByDesignation, setRequestedByDesignation] = useState("");
  const [reviewedBy, setReviewedBy] = useState("");
  const [reviewedByDesignation, setReviewedByDesignation] = useState("");
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
  const [openItemKey, setOpenItemKey] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
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
  const [programId, setProgramId] = useState<string>("");
  const [programOptions, setProgramOptions] = useState<any[]>([]);
  const [activePpmp, setActivePpmp] = useState<any>(null);
  const [ppmpError, setPpmpError] = useState<string>("");
  const collegeName = profile?.college
    ? `${profile.college.code} – ${profile.college.name}`
    : "";
  const programName = useMemo(() => {
    const selected = programOptions.find((p) => p.id === programId);
    return selected ? `${selected.code} – ${selected.name}` : "";
  }, [programOptions, programId]);

  useEffect(() => {
    if (!user?.id) return;
    fetchUserProfile(user.id)
      .then((data) => {
        setProfile(data);
        if (data?.program_id) {
          setProgramId(data.program_id);
        }
        if (!requestedBy.trim() && data?.first_name) {
          const fullName =
            `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();
          if (fullName) {
            setRequestedBy(fullName);
          }
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

  useEffect(() => {
    if (!user?.id || !programId) {
      setActivePpmp(null);
      setPpmpError("Select a program to check PPMP availability.");
      return;
    }
    setPpmpError("");
    fetchActivePpmpPlan({ userId: user.id, programId })
      .then((plan) => {
        setActivePpmp(plan);
      })
      .catch(() => {
        setActivePpmp(null);
        setPpmpError(
          "You need a completed PPMP for the selected program before submitting a request.",
        );
      });
  }, [user?.id, programId]);

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
        setRequestedBy(req.requested_by || "");
        setRequestedByDesignation(req.requested_by_designation || "");
        setReviewedBy(req.reviewed_by || "");
        setReviewedByDesignation(req.reviewed_by_designation || "");
        // Map items to form items with keys
        if (req.items && req.items.length > 0) {
          const mappedItems = req.items.map((item) => ({
            key: nextKey++,
            qty: item.qty,
            qtyInput: String(item.qty ?? 1),
            itemSearch: "",
            availableQty: null,
            itemDescription: item.item_description,
            category: item.category ?? "",
            preferredBrand: item.preferred_brand ?? "",
            uom: item.uom,
            unitCost: item.unit_cost ? Number(item.unit_cost) : 0,
            unitCostInput: item.unit_cost ? String(item.unit_cost) : "0",
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

  const ppmpItemsByCategory = useMemo(() => {
    const map = new Map<
      string,
      { description: string; uom: string; unitPrice: string; qty: number }[]
    >();
    const items = (activePpmp?.items ?? []) as {
      category: string;
      item_description: string;
      uom: string;
      unit_price: number | null;
      qty: number;
    }[];
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push({
        description: item.item_description,
        uom: item.uom,
        unitPrice: item.unit_price != null ? String(item.unit_price) : "",
        qty: item.qty ?? 0,
      });
      map.set(item.category, list);
    }
    return map;
  }, [activePpmp]);

  const categoryOptions = useMemo(() => {
    return Array.from(ppmpItemsByCategory.keys()).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [ppmpItemsByCategory]);

  function getAvailableCategoryOptions(currentKey: number) {
    const selectedByOthers = new Set(
      items
        .filter((row) => row.key !== currentKey)
        .map((row) => row.category?.trim())
        .filter(Boolean),
    );

    return categoryOptions.filter((category) => {
      const current = items.find((row) => row.key === currentKey);
      if (current?.category === category) return true;
      return !selectedByOthers.has(category);
    });
  }

  function getAvailableItemsForRow(row: ItemRow) {
    const options = row.category
      ? (ppmpItemsByCategory.get(row.category) ?? [])
      : [];
    const selectedByOthers = new Set(
      items
        .filter((other) => other.key !== row.key)
        .map(
          (other) =>
            `${other.category?.trim() ?? ""}||${other.itemDescription.trim()}`,
        )
        .filter((value) => !value.endsWith("||")),
    );

    return options.filter((option) => {
      const key = `${row.category}||${option.description}`;
      const isCurrent = row.itemDescription === option.description;
      return isCurrent || !selectedByOthers.has(key);
    });
  }

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
    const ppmpUoms = Array.from(ppmpItemsByCategory.values())
      .flatMap((items) => items.map((item) => item.uom))
      .filter(Boolean);
    return Array.from(new Set([...base, ...ppmpUoms])).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [ppmpItemsByCategory]);

  function updateItem(key: number, field: string, value: any) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.key !== key) return it;
        if (field === "category") {
          return {
            ...it,
            category: value,
            itemSearch: "",
            itemDescription: "",
            availableQty: null,
            qty: 0,
            qtyInput: "",
            preferredBrand: it.preferredBrand ?? "",
          };
        }
        if (field === "itemDescription") {
          const itemsForCategory = it.category
            ? (ppmpItemsByCategory.get(it.category) ?? [])
            : [];
          const match = itemsForCategory.find(
            (item) => item.description === value,
          );
          if (!match) {
            return it;
          }
          const availableQty = Math.max(Number(match.qty) || 0, 0);
          return {
            ...it,
            itemDescription: value,
            itemSearch: value,
            availableQty,
            uom: match?.uom || it.uom,
            unitCostInput: match?.unitPrice || it.unitCostInput,
            unitCost: match?.unitPrice
              ? parseFloat(match.unitPrice) || 0
              : it.unitCost,
            qty: availableQty,
            qtyInput: String(availableQty),
          };
        }
        if (field === "itemSearch") {
          return { ...it, itemSearch: value };
        }
        if (field === "preferredBrand") {
          return { ...it, preferredBrand: value };
        }
        if (field === "qtyInput") {
          const sanitized = sanitizeIntegerInput(value);
          if (sanitized === "") {
            return {
              ...it,
              qtyInput: "",
              qty: 0,
            };
          }
          const parsed = parseInt(sanitized, 10);
          const maxQty = it.availableQty ?? null;
          const bounded =
            Number.isFinite(parsed) && parsed > 0
              ? maxQty != null
                ? Math.min(parsed, maxQty)
                : parsed
              : 0;
          return {
            ...it,
            qtyInput: String(bounded),
            qty: bounded,
          };
        }
        if (field === "unitCostInput") {
          const sanitized = sanitizeDecimalInput(value);
          const parsed = parseFloat(sanitized);
          return {
            ...it,
            unitCostInput: sanitized,
            unitCost: Number.isFinite(parsed) ? parsed : it.unitCost,
          };
        }
        if (field === "uom") {
          return { ...it, uom: value };
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

  function validateBeforeSubmit() {
    if (!user?.id) return;
    if (!collegeId || !programId) {
      setError("College and Program are required.");
      return false;
    }
    if (ppmpError || !activePpmp) {
      setError("You must have an active PPMP before submitting a request.");
      return false;
    }
    if (!fundSource.trim()) {
      setError("Fund Source is required.");
      return false;
    }
    if (!requestedBy.trim() || !reviewedBy.trim()) {
      setError("Requested by and Reviewed by are required.");
      return false;
    }
    if (!requestedByDesignation.trim() || !reviewedByDesignation.trim()) {
      setError(
        "Requested by designation and Reviewed by designation are required.",
      );
      return false;
    }
    if (!nameRegex.test(requestedBy.trim())) {
      setError("Requested by must contain letters only.");
      return false;
    }
    if (!nameRegex.test(reviewedBy.trim())) {
      setError("Reviewed by must contain letters only.");
      return false;
    }
    if (items.some((it) => !it.itemDescription.trim())) {
      setError("All items must have a description.");
      return false;
    }
    if (items.some((it) => !it.category?.trim())) {
      setError("All items must have a category.");
      return false;
    }
    if (items.some((it) => it.qty < 1)) {
      setError("Quantity must be at least 1 for all items.");
      return false;
    }
    const overLimit = items.find(
      (it) => it.availableQty != null && it.qty > it.availableQty,
    );
    if (overLimit) {
      setError(
        "One or more items exceed the available PPMP quantity. Please adjust the quantities.",
      );
      return false;
    }

    const ppmpItems = (activePpmp.items ?? []) as {
      category: string;
      item_description: string;
    }[];
    const ppmpSet = new Set(
      ppmpItems.map((item) => `${item.category}||${item.item_description}`),
    );
    const invalid = items.find(
      (it) => !ppmpSet.has(`${it.category}||${it.itemDescription}`),
    );
    if (invalid) {
      setError(
        "One or more items are not in your PPMP. Please choose items from the PPMP list.",
      );
      return false;
    }

    setError("");
    return true;
  }

  async function submitRequest() {
    if (!user?.id) return;

    setSubmitting(true);
    try {
      if (editingReturnedRequestId) {
        // Resubmit returned request
        await resubmitReturnedRequest({
          requestId: editingReturnedRequestId,
          userId: user.id,
          requestedBy: requestedBy || undefined,
          requestedByDesignation: requestedByDesignation || undefined,
          reviewedBy: reviewedBy || undefined,
          reviewedByDesignation: reviewedByDesignation || undefined,
          items: items.map((it) => ({
            qty: it.qty,
            itemDescription: it.itemDescription,
            category: it.category,
            preferredBrand: it.preferredBrand,
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
          requestedBy: requestedBy || undefined,
          requestedByDesignation: requestedByDesignation || undefined,
          reviewedBy: reviewedBy || undefined,
          reviewedByDesignation: reviewedByDesignation || undefined,
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
        await submitDraft(editingDraftId, user.id);
      } else {
        await createRequest({
          collegeId,
          programId,
          purpose,
          fundSource: fundSource || undefined,
          requestedBy: requestedBy || undefined,
          requestedByDesignation: requestedByDesignation || undefined,
          reviewedBy: reviewedBy || undefined,
          reviewedByDesignation: reviewedByDesignation || undefined,
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
      }
      navigate("/requests");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateBeforeSubmit()) return;
    setSubmitConfirmOpen(true);
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
        requestedBy: requestedBy || undefined,
        requestedByDesignation: requestedByDesignation || undefined,
        reviewedBy: reviewedBy || undefined,
        reviewedByDesignation: reviewedByDesignation || undefined,
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
    setRequestedBy(draft.requested_by ?? "");
    setRequestedByDesignation(draft.requested_by_designation ?? "");
    setReviewedBy(draft.reviewed_by ?? "");
    setReviewedByDesignation(draft.reviewed_by_designation ?? "");
    const draftItems: ItemRow[] = (draft.items ?? []).map((it: any) => ({
      key: nextKey++,
      qty: it.qty,
      qtyInput: String(it.qty ?? 1),
      itemSearch: "",
      availableQty: null,
      itemDescription: it.item_description,
      category: it.category ?? "",
      preferredBrand: it.preferred_brand ?? "",
      uom: it.uom,
      unitCost: it.unit_cost ? Number(it.unit_cost) : 0,
      unitCostInput: it.unit_cost ? String(it.unit_cost) : "0",
    }));
    setItems(draftItems.length > 0 ? draftItems : [emptyItem()]);
    setError("");
  }

  function resetForm() {
    setEditingDraftId(null);
    setEditingReturnedRequestId(null);
    setPurpose("");
    setFundSource("");
    setRequestedBy("");
    setRequestedByDesignation("");
    setReviewedBy("");
    setReviewedByDesignation("");
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

        {ppmpError && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <div>
              <p className="font-semibold">PPMP required</p>
              <p>{ppmpError}</p>
              <Link
                to="/ppmp"
                className="mt-2 inline-flex text-sm font-semibold text-amber-700 hover:text-amber-800"
              >
                Create PPMP
              </Link>
            </div>
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
              {/* College + Program */}
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
                  {programName ? (
                    <div className="mt-1 text-xs text-gray-500">
                      {programName}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Purpose <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter purpose"
                  required
                />
              </div>

              {/* Fund Source */}
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
                    Designation (Requested by){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={requestedByDesignation}
                    onChange={(e) => setRequestedByDesignation(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. End-User"
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
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Designation (Reviewed by){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={reviewedByDesignation}
                    onChange={(e) => setReviewedByDesignation(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. Budget Officer"
                    spellCheck
                    required
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Request Items <span className="text-red-500">*</span>
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
                            value={item.category || ""}
                            onChange={(e) =>
                              updateItem(item.key, "category", e.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                            required
                          >
                            <option value="">Select category</option>
                            {getAvailableCategoryOptions(item.key).map(
                              (option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ),
                            )}
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-xs text-gray-500">
                            Description <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              value={item.itemSearch}
                              onChange={(e) => {
                                updateItem(
                                  item.key,
                                  "itemSearch",
                                  e.target.value,
                                );
                                setOpenItemKey(item.key);
                              }}
                              onFocus={() => setOpenItemKey(item.key)}
                              onBlur={() => {
                                setTimeout(() => setOpenItemKey(null), 150);
                              }}
                              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pr-9 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                              placeholder={
                                item.availableQty != null
                                  ? `Search item (Available: ${item.availableQty})`
                                  : "Search item"
                              }
                              spellCheck
                            />
                            <button
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                setOpenItemKey(
                                  openItemKey === item.key ? null : item.key,
                                );
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              aria-label="Toggle item list"
                            >
                              <span className="text-base">▾</span>
                            </button>
                            {openItemKey === item.key && item.category && (
                              <div className="absolute z-20 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                {getAvailableItemsForRow(item)
                                  .filter((option) =>
                                    option.description
                                      .toLowerCase()
                                      .includes(
                                        item.itemSearch.trim().toLowerCase(),
                                      ),
                                  )
                                  .map((option) => (
                                    <button
                                      key={option.description}
                                      type="button"
                                      onMouseDown={(event) => {
                                        event.preventDefault();
                                        updateItem(
                                          item.key,
                                          "itemDescription",
                                          option.description,
                                        );
                                        setOpenItemKey(null);
                                      }}
                                      className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-50"
                                    >
                                      {option.description} (Available:{" "}
                                      {option.qty})
                                    </button>
                                  ))}
                                {getAvailableItemsForRow(item).filter(
                                  (option) =>
                                    option.description
                                      .toLowerCase()
                                      .includes(
                                        item.itemSearch.trim().toLowerCase(),
                                      ),
                                ).length === 0 && (
                                  <div className="px-3 py-2 text-sm text-gray-500">
                                    No items found.
                                  </div>
                                )}
                              </div>
                            )}
                            {openItemKey === item.key && !item.category && (
                              <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  Select a category to view items.
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-xs text-gray-500">
                            Preferred Brand with Detailed Specifications
                          </label>
                          <input
                            value={item.preferredBrand || ""}
                            onChange={(e) =>
                              updateItem(
                                item.key,
                                "preferredBrand",
                                e.target.value,
                              )
                            }
                            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                            placeholder="Notes (for internal reference only)"
                            spellCheck
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-xs text-gray-500">Qty *</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatNumberInput(item.qtyInput)}
                            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                            required
                            readOnly
                            disabled={item.availableQty != null}
                          />
                          {item.availableQty != null && (
                            <div className="mt-1 text-xs text-gray-500">
                              Auto-set from PPMP quantity. Available:{" "}
                              {item.availableQty}
                            </div>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label className="text-xs text-gray-500">UOM</label>
                          <select
                            value={item.uom}
                            onChange={(e) =>
                              updateItem(item.key, "uom", e.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                            disabled
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
                            type="text"
                            inputMode="decimal"
                            value={formatNumberInput(item.unitCostInput, true)}
                            onChange={(e) =>
                              updateItem(
                                item.key,
                                "unitCostInput",
                                e.target.value,
                              )
                            }
                            onBlur={(e) => {
                              if (!sanitizeDecimalInput(e.target.value)) {
                                updateItem(item.key, "unitCostInput", "0");
                              }
                            }}
                            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                            placeholder="0.00"
                            readOnly={item.availableQty != null}
                            disabled={item.availableQty != null}
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
              type="button"
              disabled={submitting || saving}
              onClick={() => navigate("/requests")}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            {!editingReturnedRequestId && (
              <button
                type="button"
                disabled={saving || submitting || Boolean(ppmpError)}
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
              disabled={submitting || saving || Boolean(ppmpError)}
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

      {submitConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <AlertCircle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Submit Procurement Request
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Are you sure the entered information is correct? Submit now?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSubmitConfirmOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setSubmitConfirmOpen(false);
                  void submitRequest();
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
