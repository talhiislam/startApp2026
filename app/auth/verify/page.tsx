"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "@/components/Card";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!email) router.push("/auth/signup");
  }, [email, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    router.push("/auth/login?verified=true");
  }

  async function handleResend() {
    setError("");
    setResendMessage("");
    setResending(true);

    const res = await fetch("/api/auth/resend-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setResending(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setResendMessage("A new code has been sent to your email.");
    setCountdown(60);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0e17]">
      <Card className="p-8 w-full max-w-sm flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-4xl">📬</span>
          <h1 className="text-xl font-bold text-slate-100">Check your email</h1>
          <p className="text-sm text-slate-400">
            We sent a 6-digit code to{" "}
            <span className="text-slate-200 font-medium">{email}</span>. Enter
            it bbelow to verify your account.
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm text-center bg-red-400/10 py-2 px-4 rounded-lg">
            {error}
          </p>
        )}

        {/* Resend message */}
        {resendMessage && (
          <p className="text-green-400 text-sm text-center bg-green-400/10 py-2 px-4 rounded-lg">
            {resendMessage}
          </p>
        )}

        {/* Form */}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="bg-white/5 border border-white/[0.08] text-slate-100 placeholder:text-slate-600 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition text-center text-2xl tracking-[0.5em] font-bold"
          />
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="bg-orange-500 text-white p-3 rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify Account"}
          </button>
        </form>

        {/* Resend */}
        <div className="text-center">
          <p className="text-sm text-slate-400">
            Didn&apos;t receive it?{" "}
            {countdown > 0 ? (
              <span className="text-slate-600">Resend in {countdown}s</span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-orange-500 hover:underline disabled:opacity-50"
              >
                {resending ? "Sending..." : "Resend code"}
              </button>
            )}
          </p>
        </div>
      </Card>
    </main>
  );
}
