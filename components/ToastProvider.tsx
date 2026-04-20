"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";

type ToastType = "success" | "error" | "warning" | "info";

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
};

type ToastContextValue = {
  toast: (type: ToastType, title: string, message?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "!",
  warning: "!",
  info: "i",
};

const BORDER: Record<ToastType, string> = {
  success: "#4ade80",
  error: "#f87171",
  warning: "#fbbf24",
  info: "#60a5fa",
};

const ICON_BG: Record<ToastType, string> = {
  success: "rgba(74,222,128,0.15)",
  error: "rgba(248,113,113,0.15)",
  warning: "rgba(251,191,36,0.15)",
  info: "rgba(96,165,250,0.15)",
};

const ICON_COLOR: Record<ToastType, string> = {
  success: "#4ade80",
  error: "#f87171",
  warning: "#fbbf24",
  info: "#60a5fa",
};

const DURATION = 4000;

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [toast.id, onRemove]);

  useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true));
    timerRef.current = setTimeout(dismiss, DURATION);
    return () => {
      cancelAnimationFrame(enter);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dismiss]);

  return (
    <div
      style={{
        background: "#111827",
        border: "0.5px solid rgba(255,255,255,0.08)",
        borderLeft: `3px solid ${BORDER[toast.type]}`,
        borderRadius: "12px",
        padding: "12px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        width: "320px",
        transform: visible && !leaving ? "translateX(0)" : "translateX(110%)",
        opacity: visible && !leaving ? 1 : 0,
        transition:
          "transform 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease",
        pointerEvents: "all",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          background: ICON_BG[toast.type],
          color: ICON_COLOR[toast.type],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          fontWeight: 700,
          flexShrink: 0,
          marginTop: "1px",
        }}
      >
        {ICONS[toast.type]}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "#e2e8f0",
            margin: 0,
          }}
        >
          {toast.title}
        </p>
        {toast.message && (
          <p
            style={{
              fontSize: "12px",
              color: "#64748b",
              margin: "2px 0 0",
              lineHeight: 1.4,
            }}
          >
            {toast.message}
          </p>
        )}
      </div>

      {/* Close */}
      <button
        onClick={dismiss}
        style={{
          background: "none",
          border: "none",
          color: "#475569",
          cursor: "pointer",
          fontSize: "14px",
          lineHeight: 1,
          padding: 0,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, type, title, message }]);
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Portal-like fixed container */}
      <div
        style={{
          position: "fixed",
          top: "80px",
          right: "20px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
