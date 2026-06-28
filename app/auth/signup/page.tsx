"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/Card";

export default function Signup() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.email as HTMLInputElement).value;
    const username = (form.username as HTMLInputElement).value;
    const password = (form.password as HTMLInputElement).value;
    const confirmPassword = (form.confirmPassword as HTMLInputElement).value;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });

    const result = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(result.error);
      return;
    }

    // If account was auto-verified (dev mode, no email service), go directly to login
    if (result.autoVerified) {
      router.push("/auth/login?verified=true");
      return;
    }

    const emailSent = result.emailSent !== false;
    router.push(
      `/auth/verify?email=${encodeURIComponent(email)}&sent=${emailSent ? "1" : "0"}`,
    );
  }

  const inputStyle = {
    background: "var(--bg-input)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  } as const;

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-base)" }}
    >
      <Card className="w-full max-w-sm flex flex-col gap-6 p-8">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Create account
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Start planning your adventures
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-400/10 px-4 py-2 text-center text-sm text-red-400">
            {error}
          </p>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="rounded-lg p-3 placeholder:text-slate-500 transition focus:outline-none focus:ring-2 focus:ring-orange-500"
            style={inputStyle}
          />
          <input
            name="username"
            type="text"
            placeholder="Username"
            className="rounded-lg p-3 placeholder:text-slate-500 transition focus:outline-none focus:ring-2 focus:ring-orange-500"
            style={inputStyle}
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            className="rounded-lg p-3 placeholder:text-slate-500 transition focus:outline-none focus:ring-2 focus:ring-orange-500"
            style={inputStyle}
          />
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm password"
            className="rounded-lg p-3 placeholder:text-slate-500 transition focus:outline-none focus:ring-2 focus:ring-orange-500"
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-orange-500 p-3 font-medium text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: "var(--border)" }} />
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>
            or continue with
          </span>
          <div className="h-px flex-1" style={{ background: "var(--border)" }} />
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="flex items-center justify-center gap-3 rounded-lg p-3 transition"
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          <img
            src="https://www.google.com/favicon.ico"
            className="h-4 w-4"
            alt="Google"
          />
          Continue with Google
        </button>

        <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/auth/login" className="text-orange-500 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
