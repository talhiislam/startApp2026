"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import Card from "@/components/Card";

const categories = [
    { value: "bug", label: "Bug report" },
    { value: "booking", label: "Booking problem" },
    { value: "campsite", label: "Campsite issue" },
    { value: "account", label: "Account" },
    { value: "other", label: "Other" },
];

export default function SupportPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { toast } = useToast();

    const [category, setCategory] = useState("bug");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/login");
        }
    }, [status, router]);

    async function handleSubmit() {
        if (message.trim().length < 10) {
            toast("warning", "Message too short", "Please describe your issue in at least 10 characters.");
            return;
        }

        setSubmitting(true);
        const res = await fetch("/api/support", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category, message }),
        });

        const data = await res.json();
        setSubmitting(false);

        if (!res.ok) {
            toast("error", "Something went wrong", data.error);
            return;
        }

        toast("success", "Request submitted", "We'll get back to you as soon as possible.");
        router.push("/");
    }

    const inputClass = "p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition w-full text-sm";
    const inputStyle = {
        background: "var(--bg-input)",
        border: "1px solid var(--border)",
        color: "var(--text-primary)",
    } as const;
    const labelClass = "text-xs uppercase tracking-wide mb-1";

    return (
        <div className="max-w-xl mx-auto px-6 py-10 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <span className="text-sm font-medium uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                    Help
                </span>
                <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                    Contact Support
                </h1>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Describe your issue and we&apos;ll look into it as soon as possible.
                </p>
            </div>

            <Card className="p-6 flex flex-col gap-5">
                {/* Read-only user info */}
                <div className="flex gap-4">
                    <div className="flex flex-col flex-1">
                        <label className={labelClass} style={{ color: "var(--text-faint)" }}>Name</label>
                        <input
                            className={inputClass}
                            style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }}
                            value={session?.user.username ?? ""}
                            disabled
                        />
                    </div>
                    <div className="flex flex-col flex-1">
                        <label className={labelClass} style={{ color: "var(--text-faint)" }}>Email</label>
                        <input
                            className={inputClass}
                            style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }}
                            value={session?.user.email ?? ""}
                            disabled
                        />
                    </div>
                </div>

                {/* Category */}
                <div className="flex flex-col">
                    <label className={labelClass} style={{ color: "var(--text-faint)" }}>Category</label>
                    <select
                        className={inputClass}
                        style={inputStyle}
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        {categories.map((c) => (
                            <option key={c.value} value={c.value} style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Message */}
                <div className="flex flex-col">
                    <label className={labelClass} style={{ color: "var(--text-faint)" }}>Message</label>
                    <textarea
                        className={inputClass}
                        style={inputStyle}
                        rows={6}
                        placeholder="Describe your issue in detail..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <p className="text-xs mt-1" style={{ color: "var(--text-ghost)" }}>
                        {message.trim().length} characters {message.trim().length < 10 && "— minimum 10"}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="text-white text-sm font-medium px-5 py-2.5 rounded-xl transition disabled:opacity-50 bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
                    >
                        {submitting ? "Submitting..." : "Submit request"}
                    </button>
                    <button
                        onClick={() => router.back()}
                        className="text-sm font-medium px-5 py-2.5 rounded-xl transition"
                        style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}
                    >
                        Cancel
                    </button>
                </div>
            </Card>

            <p className="text-xs text-center" style={{ color: "var(--text-faint)" }}>
                Your name and email are filled from your account and will be used to follow up with you.
            </p>
        </div>
    );
}