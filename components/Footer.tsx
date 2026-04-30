export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--bg-card)",
        borderTop: "1px solid var(--border)",
      }}
      className="px-6 md:px-16 py-8 flex items-center justify-between"
    >
      <span style={{ color: "var(--text-faint)" }} className="text-sm">
        © 2025 SahaTour. All rights reserved.
      </span>
      <span style={{ color: "var(--text-ghost" }} className="text-xs">
        Made for Algeria 🇩🇿
      </span>
    </footer>
  );
}
