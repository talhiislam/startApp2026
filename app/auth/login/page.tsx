"use client";

import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Card from "@/components/Card";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "true";

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const email = (form.email as HTMLInputElement).value;
    const password = (form.password as HTMLInputElement).value;

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error === "EMAIL_NOT_VERIFIED") {
      router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
      return;
    }

    if (res?.error) {
      setError("Invalid email or password");
      return;
    }

    window.location.href = "/";
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
          <h1
            className="mb-6 text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Welcome back
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Sign in to your account
          </p>
        </div>

        {verified && (
          <div className="flex items-center gap-3 rounded-lg border border-green-400/20 bg-green-400/10 px-4 py-3 text-sm text-green-400">
            <span className="text-base">✓</span>
            <span>Email verified! You can now sign in.</span>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-400/10 px-4 py-2 text-center text-sm text-red-500">
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
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full rounded-lg p-3 pr-10 placeholder:text-slate-500 transition focus:outline-none focus:ring-2 focus:ring-orange-500"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition"
              style={{ color: "var(--text-muted)" }}
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-orange-500 p-3 font-medium text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
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
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-orange-500 hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
