"use client";

import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Card from "@/components/Card";

function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0e17]">
      <Card className="p-8 w-full max-w-sm flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-bold mb-6 text-slate-100">
            Welcome back
          </h1>
          <p className="text-sm text-slate-400">Sign in to your account</p>
        </div>

        {/* Verified success banner */}
        {verified && (
          <div className="flex items-center gap-3 bg-green-400/10 border border-green-400/20 text-green-400 text-sm px-4 py-3 rounded-lg">
            <span className="text-base">✓</span>
            <span>Email verified! You can now sign in.</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm text-center bg-red-400/10 py-2 px-4 rounded-lg">
            {error}
          </p>
        )}

        {/* Form */}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="bg-white/5 border border-white/[0.08] text-slate-100 placeholder:text-slate-500 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            className="bg-white/5 border border-white/[0.08] text-slate-100 placeholder:text-slate-500 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 text-white p-3 rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/[0.08]" />
          <span className="text-slate-500 text-xs">or continue with</span>
          <div className="flex-1 h-px bg-white/[0.08]" />
        </div>

        {/* Google */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="flex items-center justify-center gap-3 bg-white/5 border border-white/[0.08] text-slate-300 p-3 rounded-lg hover:bg-white/10 transition"
        >
          <img
            src="https://www.google.com/favicon.ico"
            className="w-4 h-4"
            alt="Google"
          />
          Continue with Google
        </button>

        <p className="text-sm text-center text-slate-400">
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
