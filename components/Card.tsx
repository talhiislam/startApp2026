export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "1rem",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {children}
    </div>
  );
}
