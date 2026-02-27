// React default import removed (automatic JSX runtime)

type Props = {
  open: boolean;
  title?: string;
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
};

export default function NotificationModal({
  open,
  title,
  message,
  type = "info",
  onClose,
}: Props) {
  if (!open) return null;

  const color =
    type === "success"
      ? "bg-green-50 border-green-200 text-green-800"
      : type === "error"
        ? "bg-red-50 border-red-200 text-red-800"
        : "bg-white border-gray-200 text-gray-900";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className={`z-10 max-w-md w-full rounded-lg border p-4 ${color}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="font-semibold mb-1">{title}</h3>}
            <p className="text-sm leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close notification"
            className="self-start rounded-md bg-white/50 px-2 py-1 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
