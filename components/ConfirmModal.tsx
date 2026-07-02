"use client";

import { useEffect, useRef } from "react";

type ConfirmVariant = "danger" | "warning" | "safe";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  secondaryLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onSecondary?: () => void;
  onCancel: () => void;
};

const VARIANT_STYLES = {
  danger: {
    iconBg: "rgba(239,68,68,0.12)",
    iconColor: "#f87171",
    btnBg: "#dc2626",
    btnShadow: "0 0 0 2px rgba(220,38,38,0.35)",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4h6v2" />
      </svg>
    ),
  },
  warning: {
    iconBg: "rgba(251,191,36,0.12)",
    iconColor: "#fbbf24",
    btnBg: "#d97706",
    btnShadow: "0 0 0 2px rgba(217,119,6,0.35)",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
  },
  safe: {
    iconBg: "rgba(74,222,128,0.10)",
    iconColor: "#4ade80",
    btnBg: "#16a34a",
    btnShadow: "0 0 0 2px rgba(22,163,74,0.35)",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  secondaryLabel,
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onSecondary,
  onCancel,
}: ConfirmModalProps) {
  const styles = VARIANT_STYLES[variant];
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          onCancel();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        animation: "fadeIn 0.15s ease",
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>

      <div
        ref={modalRef}
        style={{
          background: "var(--bg-card)",
          border: "0.5px solid var(--border)",
          borderRadius: "16px",
          padding: "28px 24px 24px",
          width: "100%",
          maxWidth: "380px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          animation: "scaleIn 0.2s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: styles.iconBg,
            color: styles.iconColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {styles.icon}
        </div>

        {/* Text */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <h2
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-faint)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {message}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: "10px",
              background: "var(--bg-hover)",
              border: "0.5px solid var(--border)",
              color: "var(--text-muted)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {cancelLabel}
          </button>
          {secondaryLabel && onSecondary ? (
            <button
              onClick={onSecondary}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: "10px",
                background: "var(--bg-hover)",
                border: "0.5px solid var(--text-primary)",
                color: "var(--text-primary)",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {secondaryLabel}
            </button>
          ) : null}
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: "10px",
              background: styles.btnBg,
              border: "none",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              boxShadow: styles.btnShadow,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
