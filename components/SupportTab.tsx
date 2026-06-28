"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";

type SupportRequestType = {
  _id: string;
  user: { username: string; email: string; avatar?: string };
  category: string;
  message: string;
  status: "open" | "resolved";
  createdAt: string;
};

const categoryColors: Record<string, string> = {
  bug: "text-red-400 bg-red-400/10",
  booking: "text-yellow-400 bg-yellow-400/10",
  campsite: "text-blue-400 bg-blue-400/10",
  account: "text-purple-400 bg-purple-400/10",
  other: "text-slate-400 bg-slate-400/10",
};

function SupportCard({
  request,
  onResolve,
  processingId,
}: {
  request: SupportRequestType;
  onResolve: (id: string) => void;
  processingId: string | null;
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl p-4"
      style={{
        background: "var(--bg-hover)",
        border: "1px solid var(--border-subtle)",
        opacity: request.status === "resolved" ? 0.6 : 1,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden"
            style={{ background: "var(--accent)" }}
          >
            {request.user.avatar ? (
              <img
                src={request.user.avatar}
                alt={request.user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              request.user.username[0].toUpperCase()
            )}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <p
              className="text-sm font-medium truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {request.user.username}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: "var(--text-faint)" }}
            >
              {request.user.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${categoryColors[request.category]}`}
          >
            {request.category}
          </span>
          <span className="text-xs" style={{ color: "var(--text-ghost)" }}>
            {new Date(request.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          {request.status === "open" && (
            <button
              onClick={() => onResolve(request._id)}
              disabled={processingId === request._id}
              className="text-xs text-green-400 hover:text-green-300 border border-green-400/20 px-3 py-1 rounded-lg transition disabled:opacity-50"
            >
              {processingId === request._id ? "..." : "Resolve"}
            </button>
          )}
          {request.status === "resolved" && (
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full font-medium">
              Resolved
            </span>
          )}
        </div>
      </div>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--text-muted)" }}
      >
        {request.message}
      </p>
    </div>
  );
}

export default function SupportTab() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<SupportRequestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/support")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRequests(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleResolve(id: string) {
    setProcessingId(id);
    const res = await fetch(`/api/admin/support/${id}`, { method: "PUT" });
    if (res.ok) {
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "resolved" } : r)),
      );
      toast("success", "Request resolved", "The user has been notified.");
    } else {
      toast("error", "Something went wrong", "Could not resolve this request.");
    }
    setProcessingId(null);
  }

  const open = requests.filter((r) => r.status === "open");
  const resolved = requests.filter((r) => r.status === "resolved");

  if (loading)
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Loading...
      </p>
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
          Open
          <span
            className="ml-2 text-sm font-normal"
            style={{ color: "var(--text-faint)" }}
          >
            ({open.length})
          </span>
        </h2>
        {open.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No open requests.
          </p>
        ) : (
          open.map((r) => (
            <SupportCard
              key={r._id}
              request={r}
              onResolve={handleResolve}
              processingId={processingId}
            />
          ))
        )}
      </div>

      <div style={{ height: "1px", background: "var(--border)" }} />

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
          Resolved
          <span
            className="ml-2 text-sm font-normal"
            style={{ color: "var(--text-faint)" }}
          >
            ({resolved.length})
          </span>
        </h2>
        {resolved.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No resolved requests yet.
          </p>
        ) : (
          resolved.map((r) => (
            <SupportCard
              key={r._id}
              request={r}
              onResolve={handleResolve}
              processingId={processingId}
            />
          ))
        )}
      </div>
    </div>
  );
}
