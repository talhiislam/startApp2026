import Link from "next/link";
import { playfair } from "@/lib/fonts";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="font-bold text-8xl" style={{ color: "var(--accent)" }}>404</span>
      <div className="flex flex-col gap-2">
        <h1
          className={`${playfair.className} text-3xl font-bold`}
          style={{ color: "var(--text-primary)" }}
        >
          Page not found
        </h1>
        <p className="text-sm max-w-sm" style={{ color: "var(--text-muted)" }}>
          The page you are looking for does not exist or may have been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/"
          className="text-white text-sm font-medium px-5 py-2.5 rounded-xl transition bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
        >
          Back to Home
        </Link>
        <Link
          href="/explore"
          className="text-sm font-medium px-5 py-2.5 rounded-xl transition"
          style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
        >
          Explore Campsites
        </Link>
      </div>
    </div>
  );
}
