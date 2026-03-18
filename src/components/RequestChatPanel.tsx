import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleUserRound, Loader2, SendHorizontal } from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  ROLE_LABELS,
  fetchRequestMessages,
  markRequestMessagesRead,
  getChatHandlerRole,
  normalizeUserRole,
  sendRequestMessage,
  type RequestMessageRow,
  type RequestRow,
  type UserRole,
} from "../lib/requests";

function formatName(message: RequestMessageRow) {
  if (message.sender) {
    const sender = Array.isArray(message.sender)
      ? message.sender[0]
      : message.sender;
    if (sender) {
      return `${sender.first_name} ${sender.last_name}`;
    }
  }
  return "Unknown user";
}

export default function RequestChatPanel(props: {
  request: RequestRow;
  currentUserId: string | null | undefined;
  currentUserRole: string | null | undefined;
}) {
  const { request, currentUserId, currentUserRole } = props;

  const [messages, setMessages] = useState<RequestMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);

  const role = useMemo<UserRole | null>(
    () => normalizeUserRole(currentUserRole),
    [currentUserRole],
  );

  const handlerRole = useMemo(
    () => getChatHandlerRole(request.status),
    [request.status],
  );

  const isRequester = !!currentUserId && request.created_by === currentUserId;
  const isCurrentHandler =
    !!role &&
    !!handlerRole &&
    handlerRole !== "department_user" &&
    role === handlerRole;
  const isRequestSentParticipant =
    request.status === "request_sent" &&
    !!role &&
    (role === "department_user" || role === "twg");
  const canSend =
    Boolean(currentUserId) &&
    Boolean(handlerRole) &&
    (isRequester || isCurrentHandler || isRequestSentParticipant);

  const participantsLabel =
    handlerRole === null
      ? "Read-only conversation (workflow completed)."
      : handlerRole === "department_user"
        ? "Only the request owner can send messages at this status."
        : `Participants: ${ROLE_LABELS.department_user} and ${ROLE_LABELS[handlerRole]}`;

  const chatPermissionNote = canSend
    ? "You can send messages in this conversation."
    : "You can view this conversation but you cannot send messages at this status.";

  const loadMessages = useCallback(async () => {
    setError(null);
    try {
      const rows = await fetchRequestMessages(request.id);
      setMessages(rows);

      if (currentUserId) {
        await markRequestMessagesRead({
          requestId: request.id,
          userId: currentUserId,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  }, [request.id, currentUserId]);

  useEffect(() => {
    setLoading(true);
    setText("");
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(`request-chat-${request.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "request_messages",
          filter: `request_id=eq.${request.id}`,
        },
        () => {
          void loadMessages();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadMessages]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  async function handleSend() {
    if (!currentUserId || sending || !text.trim()) return;

    setSending(true);
    setError(null);

    try {
      const created = await sendRequestMessage({
        requestId: request.id,
        senderId: currentUserId,
        message: text,
      });
      setMessages((prev) =>
        prev.some((item) => item.id === created.id) ? prev : [...prev, created],
      );
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  function onComposerKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="flex h-full min-h-[520px] flex-col bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="text-2xl font-semibold text-gray-900">
          Communication History
        </div>
        <div className="mt-1 text-xs text-gray-500">{participantsLabel}</div>
      </div>

      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-start gap-3">
          <CircleUserRound className="mt-1 h-6 w-6 text-gray-400" />
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onComposerKeyDown}
              rows={2}
              placeholder={
                canSend
                  ? "Write a message..."
                  : "Conversation is view-only for your current role/status."
              }
              disabled={!canSend || sending}
              className="w-full resize-none rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">{chatPermissionNote}</p>
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend || sending || !text.trim()}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-indigo-300 px-4 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizontal className="h-4 w-4" />
                )}
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            No messages yet for this request.
          </div>
        ) : (
          messages.map((msg) => {
            const mine = !!currentUserId && msg.sender_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-4 py-3",
                    mine
                      ? "bg-blue-600 text-white"
                      : "border border-green-200 bg-green-50 text-gray-900",
                  ].join(" ")}
                >
                  <div
                    className={`text-xs ${mine ? "text-blue-100" : "text-gray-500"}`}
                  >
                    {formatName(msg)}
                  </div>
                  <div className="mt-1 whitespace-pre-wrap break-words text-sm">
                    {msg.message}
                  </div>
                  <div
                    className={`mt-2 text-[11px] ${mine ? "text-blue-100" : "text-gray-400"}`}
                  >
                    {new Date(msg.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {error && (
        <p className="border-t border-gray-200 px-6 py-3 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
