export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--bg-card)",
        borderTop: "1px solid var(--border)",
      }}
      className="px-6 md:px-16 py-8 flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <span style={{ color: "var(--text-faint)" }} className="text-sm">
          © 2025 SahaTour. All rights reserved.
        </span>
        <a
          href="/support"
          className="text-sm transition hover:underline"
          style={{ color: "var(--text-faint)" }}
        >
          Support
        </a>
      </div>
      <span style={{ color: "var(--text-ghost" }} className="text-xs">
        Made for Algeria 🇩🇿
      </span>
    </footer>
  );
}
