// src/pages/admin/Monitoring.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Plus, UploadCloud } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  fetchRequestsLight,
  fetchRequestById,
  fetchUnreadChatCounts,
  shouldShowUnreadChatForStatus,
  type RequestRow,
  type RequestStatus,
  STATUS_SHORT_LABELS,
  STATUS_TONE,
  STATUS_FLOW,
} from "../../lib/requests";
import { supabase } from "../../lib/supabase";
import StatusTimeline from "../../components/StatusTimeline";
import RequestChatPanel from "../../components/RequestChatPanel";

// ── helpers ────────────────────────────────────────────

function progressFor(status: RequestStatus): { text: string; value: number } {
  if (status === "returned_for_revision" || status === "returned_for_action")
    return { text: "Returned to User", value: 0 };
  if (status === "completed")
    return {
      text: `${STATUS_FLOW.length} of ${STATUS_FLOW.length}`,
      value: 100,
    };
  const idx = STATUS_FLOW.indexOf(status);
  const step = idx === -1 ? 1 : idx + 1;
  return {
    text: `${step} of ${STATUS_FLOW.length}`,
    value: Math.round((step / STATUS_FLOW.length) * 100),
  };
}

const TONE_MAP: Record<string, string> = {
  gray: "bg-gray-100 text-gray-700",
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  violet: "bg-violet-100 text-violet-700",
  emerald: "bg-emerald-100 text-emerald-700",
};

function Pill({ status }: { status: RequestStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${TONE_MAP[STATUS_TONE[status]] ?? TONE_MAP.gray}`}
    >
      {STATUS_SHORT_LABELS[status]}
    </span>
  );
}

function formatPrLabel(request: RequestRow) {
  const groups = request.pr_groups ?? [];
  if (groups.length === 0) return request.pr_no ?? request.id.slice(0, 8);
  if (groups.length === 1) return groups[0].pr_no;
  const [first, ...rest] = groups;
  return `${first.pr_no} +${rest.length}`;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
      <div
        className="h-2 rounded-full bg-blue-600"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function parseContractFileUrls(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((entry) => typeof entry === "string");
    }
  } catch {
    // Fall back to treating the value as a single URL.
  }
  return [value];
}

export default function Monitoring() {
  const { user, role } = useAuth();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [unreadByRequest, setUnreadByRequest] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedFull, setSelectedFull] = useState<RequestRow | null>(null);
  const [contractFiles, setContractFiles] = useState<File[]>([]);
  const [contractSaving, setContractSaving] = useState(false);
  const contractInputRef = useRef<HTMLInputElement | null>(null);
  const [inspectionEdits, setInspectionEdits] = useState<
    Record<string, { notes: string; file: File | null; saving: boolean }>
  >({});
  const [actionError, setActionError] = useState("");

  const loadUnreadCounts = useCallback(
    async (rows: RequestRow[]) => {
      if (!user?.id || rows.length === 0) {
        setUnreadByRequest({});
        return;
      }

      const requestIds = rows
        .filter((row) =>
          shouldShowUnreadChatForStatus({ role, status: row.status }),
        )
        .map((row) => row.id);

      if (requestIds.length === 0) {
        setUnreadByRequest({});
        return;
      }

      try {
        const counts = await fetchUnreadChatCounts({
          userId: user.id,
          requestIds,
        });
        setUnreadByRequest(counts);
      } catch (err) {
        console.error("Failed to load unread chat counts:", err);
      }
    },
    [user?.id, role],
  );

  const loadData = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }
      try {
        const all = await fetchRequestsLight();
        const active = all.filter(
          (r) =>
            r.status !== "returned_for_revision" &&
            r.status !== "returned_for_action",
        );
        setRequests(active);
        void loadUnreadCounts(active);
        if (active.length > 0) {
          const targetId = selectedId ?? active[0].id;
          if (!selectedId) {
            setSelectedId(targetId);
          }
          fetchRequestById(targetId)
            .then(setSelectedFull)
            .catch(() => {});
        } else {
          setSelectedFull(null);
        }
      } catch (err) {
        console.error("Failed to load monitoring data:", err);
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [loadUnreadCounts, selectedId],
  );

  useEffect(() => {
    if (!user?.id || requests.length === 0) {
      return;
    }

    const refresh = () => {
      void loadUnreadCounts(requests);
    };

    const channel = supabase
      .channel(`admin-monitoring-unread-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "request_messages",
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "request_message_reads",
          filter: `user_id=eq.${user.id}`,
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "request_message_reads",
          filter: `user_id=eq.${user.id}`,
        },
        refresh,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, requests, loadUnreadCounts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user?.id) return;

    const refresh = () => {
      void loadData({ silent: true });
    };

    const channel = supabase
      .channel(`admin-monitoring-records-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "requests",
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "requests",
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "requests",
        },
        refresh,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, loadData]);

  function handleSelect(id: string) {
    setSelectedId(id);
    setSelectedFull(null);
    fetchRequestById(id)
      .then(setSelectedFull)
      .catch(() => {});
  }

  useEffect(() => {
    if (!selectedFull) return;
    setContractFiles([]);
    const nextInspectionEdits: Record<
      string,
      { notes: string; file: File | null; saving: boolean }
    > = {};
    (selectedFull.items ?? []).forEach((item) => {
      nextInspectionEdits[item.id] = {
        notes: item.inspection_notes ?? "",
        file: null,
        saving: false,
      };
    });
    setInspectionEdits(nextInspectionEdits);
    setActionError("");
  }, [selectedFull]);

  async function uploadToAwardBucket(path: string, file: File) {
    const bucket = "award_conntract";
    const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
    const fullPath = `${path}/${Date.now()}-${safeName}`;
    const contentType = file.type || "application/octet-stream";
    console.log("UPLOAD DEBUG", {
      bucket,
      fullPath,
      fileName: file.name,
      safeName,
      size: file.size,
      type: file.type,
      contentType,
    });
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fullPath, file, { upsert: true, contentType });
    if (uploadError) {
      console.error("SUPABASE STORAGE ERROR", uploadError);
      throw new Error(
        `Upload failed for ${file.name}: ${uploadError.message} (${uploadError.statusCode ?? "unknown"})`,
      );
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(fullPath);
    return data.publicUrl;
  }

  async function saveContractDetails() {
    if (!selectedFull) return;
    if (role !== "procurement_admin") return;
    if (selectedFull.status !== "contract_awarded") return;
    if (contractFiles.length === 0) {
      setActionError("Please select one or more contract files.");
      return;
    }

    setContractSaving(true);
    setActionError("");
    try {
      const existingUrls = parseContractFileUrls(
        selectedFull.contract_file_url,
      );
      const uploadedUrls: string[] = [];
      for (const file of contractFiles) {
        const uploadedUrl = await uploadToAwardBucket(
          `contracts/${selectedFull.id}`,
          file,
        );
        uploadedUrls.push(uploadedUrl);
      }

      const mergedUrls = [...existingUrls, ...uploadedUrls];
      const contractFileUrl =
        mergedUrls.length === 0
          ? null
          : mergedUrls.length === 1
            ? mergedUrls[0]
            : JSON.stringify(mergedUrls);

      const { error } = await supabase
        .from("requests")
        .update({
          contract_file_url: contractFileUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedFull.id);
      if (error) throw error;

      const refreshed = await fetchRequestById(selectedFull.id);
      setSelectedFull(refreshed);
      setContractFiles([]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save contract details.";
      setActionError(message);
    } finally {
      setContractSaving(false);
    }
  }

  function addContractFiles(fileList: FileList | null) {
    if (!fileList) return;
    const nextFiles = Array.from(fileList);
    setContractFiles((prev) => [...prev, ...nextFiles]);
  }

  async function saveInspectionDetails(itemId: string) {
    if (!selectedFull) return;
    if (role !== "supply_admin") return;
    if (selectedFull.status !== "under_inspection") return;

    setInspectionEdits((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], saving: true },
    }));
    setActionError("");
    try {
      const edit = inspectionEdits[itemId];
      let inspectionFileUrl =
        selectedFull.items?.find((item) => item.id === itemId)
          ?.inspection_file_url ?? null;
      if (edit?.file) {
        inspectionFileUrl = await uploadToAwardBucket(
          `inspection/${selectedFull.id}/${itemId}`,
          edit.file,
        );
      }

      const { error } = await supabase
        .from("request_items")
        .update({
          inspection_notes: edit?.notes ?? null,
          inspection_file_url: inspectionFileUrl,
        })
        .eq("id", itemId);
      if (error) throw error;

      const refreshed = await fetchRequestById(selectedFull.id);
      setSelectedFull(refreshed);
      setInspectionEdits((prev) => ({
        ...prev,
        [itemId]: {
          notes:
            refreshed.items?.find((item) => item.id === itemId)
              ?.inspection_notes ?? "",
          file: null,
          saving: false,
        },
      }));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to save inspection details.";
      setActionError(message);
      setInspectionEdits((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], saving: false },
      }));
    }
  }

  const selected = useMemo(
    () => selectedFull ?? requests.find((r) => r.id === selectedId) ?? null,
    [requests, selectedId, selectedFull],
  );

  const contractFileUrls = useMemo(
    () => parseContractFileUrls(selected?.contract_file_url),
    [selected?.contract_file_url],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">
            Monitoring &amp; Tracking
          </h1>
          <p className="text-sm text-gray-500">No active requests to track.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Monitoring &amp; Tracking
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track the progress of procurement requests
          </p>
        </div>

        {/* Top Cards */}
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-4">
            {requests.map((r) => {
              const active = r.id === selectedId;
              const prog = progressFor(r.status);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelect(r.id)}
                  className={[
                    "w-[360px] shrink-0 rounded-2xl border bg-white p-5 text-left shadow-sm transition-colors",
                    active
                      ? "border-blue-200 ring-2 ring-blue-100"
                      : "border-gray-200 hover:bg-gray-50",
                  ].join(" ")}
                >
                  <div className="text-sm font-semibold text-blue-700">
                    <div className="flex items-center justify-between gap-2">
                      <span>{formatPrLabel(r)}</span>
                      {(unreadByRequest[r.id] ?? 0) > 0 && (
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">
                          {unreadByRequest[r.id] > 99
                            ? "99+"
                            : unreadByRequest[r.id]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-gray-900 line-clamp-1">
                    {r.purpose || "No purpose"}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {r.college?.code ?? "—"}
                    {r.creator &&
                      ` · ${r.creator.first_name} ${r.creator.last_name}`}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span className="font-medium">{prog.text}</span>
                  </div>
                  <ProgressBar value={prog.value} />

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <div className="text-sm text-gray-600">Current Status:</div>
                    <Pill status={r.status} />
                  </div>

                  <div className="mt-2 text-xs text-gray-400">
                    Last updated: {new Date(r.updated_at).toLocaleDateString()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Tracking */}
        {selected && (
          <div className="mt-5 rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="text-lg font-semibold text-gray-900">
                Detailed Tracking
              </div>
              <div className="mt-1 text-sm text-gray-500">
                Request: {formatPrLabel(selected)} —{" "}
                {selected.purpose || "No purpose"}
              </div>
            </div>

            {actionError && (
              <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {actionError}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="border-b border-gray-200 px-6 py-6 lg:border-b-0 lg:border-r">
                <StatusTimeline
                  currentStatus={selected.status}
                  statusLogs={selected.status_logs}
                />
              </div>
              <RequestChatPanel
                request={selected}
                currentUserId={user?.id}
                currentUserRole={role}
              />
            </div>

            {(selected.contract_amount != null ||
              selected.contract_file_url) && (
              <div className="mx-6 mt-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-blue-50 to-white px-5 py-4 text-blue-900">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">
                      Contract Details
                    </div>
                    <div className="mt-1 text-xs text-blue-700">
                      Uploaded files are available for viewing.
                    </div>
                  </div>
                  {selected.contract_amount != null && (
                    <div className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-800">
                      Amount: {selected.contract_amount}
                    </div>
                  )}
                </div>

                {contractFileUrls.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {contractFileUrls.map((url, index) => (
                      <a
                        key={`${url}-${index}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700 hover:border-blue-300 hover:text-blue-800"
                      >
                        {`View Contract File${contractFileUrls.length > 1 ? " " + (index + 1) : ""}`}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selected.status === "contract_awarded" &&
              role === "procurement_admin" && (
                <div className="mx-6 mt-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-emerald-50 to-white px-5 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-emerald-900">
                        Upload Contract Files (Notice of Award Sent)
                      </div>
                      <div className="mt-1 text-xs text-emerald-700">
                        Use the plus button to add more files.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => contractInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Files
                    </button>
                  </div>

                  <input
                    ref={contractInputRef}
                    type="file"
                    multiple
                    onChange={(e) => {
                      addContractFiles(e.target.files);
                      e.currentTarget.value = "";
                    }}
                    className="hidden"
                  />

                  <div className="mt-4 rounded-xl border border-emerald-100 bg-white/70 p-4">
                    <div className="text-xs font-semibold uppercase text-emerald-800">
                      Selected Files
                    </div>
                    {contractFiles.length === 0 ? (
                      <div className="mt-2 text-sm text-emerald-700">
                        No files yet. Click Add Files to select contracts.
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2 text-sm text-emerald-900">
                        {contractFiles.map((file, index) => (
                          <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-white px-3 py-2"
                          >
                            <span className="truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setContractFiles((prev) =>
                                  prev.filter((_, idx) => idx !== index),
                                )
                              }
                              className="text-emerald-700 underline"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={saveContractDetails}
                      disabled={contractSaving || contractFiles.length === 0}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {contractSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UploadCloud className="h-4 w-4" />
                      )}
                      Save Contract Details
                    </button>
                  </div>
                </div>
              )}

            {selected.status === "under_inspection" && selected.items && (
              <div className="mx-6 mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-4">
                <div className="text-sm font-semibold text-amber-900">
                  Inspection Notes &amp; Files
                </div>
                <div className="mt-3 space-y-3">
                  {selected.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-amber-200 bg-white p-3"
                    >
                      <div className="text-sm font-semibold text-gray-900">
                        {item.item_description}
                      </div>
                      <div className="mt-2 grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold text-gray-600">
                            Notes / Remarks
                          </label>
                          <textarea
                            value={inspectionEdits[item.id]?.notes ?? ""}
                            onChange={(e) =>
                              setInspectionEdits((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  notes: e.target.value,
                                },
                              }))
                            }
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                            rows={2}
                            disabled={role !== "supply_admin"}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-600">
                            Upload File
                          </label>
                          <input
                            type="file"
                            onChange={(e) =>
                              setInspectionEdits((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  file: e.target.files?.[0] ?? null,
                                },
                              }))
                            }
                            className="mt-1 w-full text-sm"
                            disabled={role !== "supply_admin"}
                          />
                          {item.inspection_file_url && (
                            <a
                              href={item.inspection_file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block text-xs text-blue-700 underline"
                            >
                              View current file
                            </a>
                          )}
                        </div>
                      </div>
                      {role === "supply_admin" && (
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => saveInspectionDetails(item.id)}
                            disabled={inspectionEdits[item.id]?.saving}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                          >
                            {inspectionEdits[item.id]?.saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UploadCloud className="h-4 w-4" />
                            )}
                            Save Inspection
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Indicators */}
        <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-gray-900">
            Status Indicators
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STATUS_FLOW.map((s) => {
              const toneToColors: Record<string, { bg: string; icon: string }> =
                {
                  gray: { bg: "bg-gray-50", icon: "text-gray-500" },
                  amber: { bg: "bg-amber-50", icon: "text-amber-600" },
                  blue: { bg: "bg-blue-50", icon: "text-blue-600" },
                  green: { bg: "bg-green-50", icon: "text-green-600" },
                  violet: { bg: "bg-violet-50", icon: "text-violet-600" },
                  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600" },
                  red: { bg: "bg-red-50", icon: "text-red-600" },
                };
              const tone = STATUS_TONE[s] ?? "gray";
              const colors = toneToColors[tone] ?? toneToColors.gray;
              return (
                <div key={s} className={`rounded-xl ${colors.bg} p-4`}>
                  <div className="flex items-center gap-2">
                    <Check className={`h-4 w-4 ${colors.icon}`} />
                    <div className="text-sm font-semibold text-gray-900">
                      {STATUS_SHORT_LABELS[s]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
