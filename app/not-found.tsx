import Link from "next/link";
import { playfair } from "@/app/layout";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="text-orange-500/60 font-bold text-8xl">404</span>
      <div className="flex flex-col gap-2">
        <h1
          className={`${playfair.className} text-3xl font-bold text-slate-100`}
        >
          Page not found
        </h1>
        <p className="text-slate-400 text-sm max-w-sm">
          The page you are looking for does not exist or may have been moved.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/"
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
        >
          Back to Home
        </Link>
        <Link
          href="/explore"
          className="bg-white/5 hover:bg-white/10 border border-white/[0.08] text-slate-300 text-sm font-medium px-5 py-2.5 rounded-xl transition"
        >
          Explore Campsites
        </Link>
      </div>
    </div>
  );
}
