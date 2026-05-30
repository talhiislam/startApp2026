"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ToastProvider";
import Card from "@/components/Card";
import ConfirmModal from "@/components/ConfirmModal";
import SupportTab from "@/components/SupportTab";

import { typeColors, typeLabels } from "@/types/campsite";

type AdminCampsite = {
  _id: string;
  name: string;
  wilaya: string;
  region: string;
  type: "tent" | "bungalow" | "wild" | "glamping";
  images: string[];
  pricePerNight: number;
  isApproved: boolean;
  createdAt: string;
  owner: { username: string; email: string };
};

type AdminUser = {
  _id: string;
  username: string;
  email: string;
  role: "camper" | "owner" | "admin";
  avatar?: string;
  createdAt: string;
};

const tabs = ["Campsites", "Users", "Support"];

const roleColors = {
  camper: "text-green-400 bg-green-400/10",
  owner: "text-blue-400 bg-blue-400/10",
  admin: "text-orange-400 bg-orange-400/10",
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("Campsites");
  const [campsites, setCampsites] = useState<AdminCampsite[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingCampsites, setLoadingCampsites] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated" && session?.user?.role !== "admin") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/admin/campsites")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCampsites(d.data);
      })
      .finally(() => setLoadingCampsites(false));

    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUsers(d.data);
      })
      .finally(() => setLoadingUsers(false));
  }, [status]);

  async function handleApprove(id: string) {
    setProcessingId(id);
    const res = await fetch(`/api/admin/campsites/${id}/approve`, {
      method: "PUT",
    });
    if (res.ok) {
      setCampsites((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isApproved: true } : c)),
      );
      toast("success", "Campsite approved", "It's now live on the explore page.");
    } else {
      toast("error", "Something went wrong", "Could not approve this campsite.");
    }
    setProcessingId(null);
  }

  async function handleReject(id: string) {
    setProcessingId(id);
    const res = await fetch(`/api/admin/campsites/${id}/reject`, {
      method: "PUT",
    });
    if (res.ok) {
      setCampsites((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isApproved: false } : c)),
      );
      toast("warning", "Campsite revoked", "It's been taken off the explore page.");
    } else {
      toast("error", "Something went wrong", "Could not revoke this campsite.");
    }
    setProcessingId(null);
  }

  async function handleRoleChange(userId: string, role: string) {
    setProcessingId(userId);
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, role: role as AdminUser["role"] } : u,
        ),
      );
      toast("success", "Role updated", `User is now a ${role}.`);
    } else {
      toast("error", "Something went wrong", "Could not update this user's role.");
    }
    setProcessingId(null);
  }

  const pendingCampsites = campsites.filter((c) => !c.isApproved);
  const approvedCampsites = campsites.filter((c) => c.isApproved);

  if (status === "loading")
    return (
      <div className="min-h-screen flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
        Loading...
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium uppercase tracking-widest" style={{ color: "var(--accent)" }}>
          Admin
        </span>
        <h1
          className="text-3xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Admin Panel
        </h1>
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>
          {pendingCampsites.length} pending approval · {users.length} users
        </p>
      </div>

      {/* Tabs + Content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <Card className="p-2 flex flex-row md:flex-col gap-1 w-full md:w-48 shrink-0 h-fit overflow-x-auto justify-center md:justify-start">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="shrink-0 text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background:
                  activeTab === tab ? "var(--accent-subtle)" : "transparent",
                color:
                  activeTab === tab ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              {tab}
              {tab === "Campsites" && pendingCampsites.length > 0 && (
                <span className="ml-2 text-xs text-white px-1.5 py-0.5 rounded-full" style={{ background: "var(--accent)" }}>
                  {pendingCampsites.length}
                </span>
              )}
            </button>
          ))}
        </Card>

        {/* Content */}
        <Card className="p-6 flex flex-col gap-6 flex-1">
          {/* Campsites Tab */}
          {activeTab === "Campsites" && (
            <div className="flex flex-col gap-6">
              {/* Pending */}
              <div className="flex flex-col gap-3">
                <h2
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Pending Approval
                  <span className="ml-2 text-sm font-normal" style={{ color: "var(--text-faint)" }}>
                    ({pendingCampsites.length})
                  </span>
                </h2>

                {loadingCampsites ? (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Loading...
                  </p>
                ) : pendingCampsites.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    No campsites pending approval.
                  </p>
                ) : (
                  pendingCampsites.map((c) => (
                    <div
                      key={c._id}
                      className="group flex flex-col md:flex-row rounded-xl overflow-hidden transition-colors"
                      style={{
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {/* Image: md:h-auto + md:w-36 ensures it stretches to match text height */}
                      <div className="w-full h-40 md:h-auto md:w-36 shrink-0 border-r" style={{ borderColor: "var(--border-subtle)" }}>
                        <img
                          src={c.images[0] ?? ""}
                          alt={c.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Main Content Wrapper */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 flex-1 gap-4 md:gap-8">
                        
                        {/* Left Side: Info */}
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3
                              className="font-medium text-base truncate"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {c.name}
                            </h3>
                            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${typeColors[c.type]}`}>
                              {typeLabels[c.type]}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-0.5">
                            <p
                              className="text-xs flex items-center gap-1"
                              style={{ color: "var(--text-faint)" }}
                            >
                              <span className="opacity-70">📍</span> {c.wilaya}, {c.region}
                            </p>
                            <p
                              className="text-xs flex items-center gap-1"
                              style={{ color: "var(--text-faint)" }}
                            >
                              <span className="opacity-70">👤</span> {c.owner?.username} <span style={{ color: "var(--text-ghost)" }}>•</span> {c.owner?.email}
                            </p>
                          </div>
                        </div>

                        {/* Right Side: Status & Actions */}
                        <div className="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0">
                          {/* Status Badge */}
                          <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full font-medium">
                            Approved
                          </span>

                          {/* Buttons Container */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(c._id)}
                              disabled={processingId === c._id}
                              className="text-xs border px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                              style={{
                                color: "var(--text-muted)",
                                borderColor: "var(--border)",
                              }}
                            >
                              {processingId === c._id ? "..." : "Approve"}
                            </button>

                            <button
                              onClick={() => handleReject(c._id)}
                              disabled={processingId === c._id}
                              className="text-xs border px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                              style={{
                                color: "var(--text-muted)",
                                borderColor: "var(--border)",
                              }}
                            >
                              {processingId === c._id ? "..." : "Reject"}
                            </button>

                            <button
                              onClick={() => router.push(`/explore/${c._id}`)}
                              className="text-xs border px-3 py-1.5 rounded-lg transition"
                              style={{
                                color: "var(--text-muted)",
                                borderColor: "var(--border)",
                              }}
                            >
                              Preview
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ height: "1px", background: "var(--border)" }} />

              {/* Approved */}
              <div className="flex flex-col gap-3">
                <h2
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Approved
                  <span className="ml-2 text-sm font-normal" style={{ color: "var(--text-faint)" }}>
                    ({approvedCampsites.length})
                  </span>
                </h2>

                {loadingCampsites ? (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Loading...
                  </p>
                ) : approvedCampsites.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    No approved campsites yet.
                  </p>
                ) : (
                  approvedCampsites.map((c) => (
                    <div
                      key={c._id}
                      className="group flex flex-col md:flex-row rounded-xl overflow-hidden transition-colors"
                      style={{
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {/* Image: md:h-auto + md:w-36 ensures it stretches to match text height */}
                      <div className="w-full h-40 md:h-auto md:w-36 shrink-0 border-r" style={{ borderColor: "var(--border-subtle)" }}>
                        <img
                          src={c.images[0] ?? ""}
                          alt={c.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Main Content Wrapper */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 flex-1 gap-4 md:gap-8">
                        
                        {/* Left Side: Info */}
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3
                              className="font-medium text-base truncate"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {c.name}
                            </h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${typeColors[c.type]}`}>
                              {typeLabels[c.type]}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-0.5">
                            <p
                              className="text-xs flex items-center gap-1"
                              style={{ color: "var(--text-faint)" }}
                            >
                              <span className="opacity-70">📍</span> {c.wilaya}, {c.region}
                            </p>
                            <p
                              className="text-xs flex items-center gap-1"
                              style={{ color: "var(--text-faint)" }}
                            >
                              <span className="opacity-70">👤</span> {c.owner?.username} <span style={{ color: "var(--text-ghost)" }}>•</span> {c.owner?.email}
                            </p>
                          </div>
                        </div>

                        {/* Right Side: Status & Actions */}
                        <div className="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0">
                          {/* Status Badge */}
                          <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full font-medium">
                            Approved
                          </span>

                          {/* Buttons Container */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setRevokeConfirm(c._id)}
                              disabled={processingId === c._id}
                              className="text-xs border px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                              style={{
                                color: "var(--text-muted)",
                                borderColor: "var(--border)",
                              }}
                            >
                              {processingId === c._id ? "..." : "Revoke"}
                            </button>

                            <button
                              onClick={() => router.push(`/explore/${c._id}`)}
                              className="text-xs border px-3 py-1.5 rounded-lg transition"
                              style={{
                                color: "var(--text-muted)",
                                borderColor: "var(--border)",
                              }}
                            >
                              Preview
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "Users" && (
            <div className="flex flex-col gap-4">
              <h2
                className="font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                All Users
              </h2>

              {loadingUsers ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Loading...
                </p>
              ) : users.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No users found.
                </p>
              ) : (
                users.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center justify-between gap-4 rounded-xl px-4 py-3"
                    style={{
                      background: "var(--bg-hover)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden" style={{ background: "var(--accent)" }}>
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            alt={`${u.username} avatar`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          u.username[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {u.username}
                        </p>
                        <p
                          className="text-xs truncate"
                          style={{ color: "var(--text-faint)" }}
                        >
                          {u.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${roleColors[u.role]}`}
                      >
                        {u.role}
                      </span>
                      <select
                        value={u.role}
                        disabled={processingId === u._id}
                        onChange={(e) =>
                          handleRoleChange(u._id, e.target.value)
                        }
                        className="border rounded-lg text-xs px-2 py-1.5 outline-none transition disabled:opacity-50 max-w-[90px]"
                        style={{
                          background: "var(--bg-input)",
                          borderColor: "var(--border)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <option value="camper" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}>
                          camper
                        </option>
                        <option value="owner" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}>
                          owner
                        </option>
                        <option value="admin" style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}>
                          admin
                        </option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Support Tab */}
          {activeTab === "Support" && <SupportTab />}
        </Card>
      </div>

      <ConfirmModal
        open={revokeConfirm !== null}
        title="Revoke approval?"
        message={
          <>
            This will take{" "}
            <span style={{ color: "var(--text-secondary)" }}>
              {campsites.find((c) => c._id === revokeConfirm)?.name ??
                "this campsite"}
            </span>{" "}
            off the explore page. The owner will need to resubmit for approval.
          </>
        }
        confirmLabel="Revoke"
        cancelLabel="Keep approved"
        variant="danger"
        onConfirm={() => {
          if (revokeConfirm) handleReject(revokeConfirm);
          setRevokeConfirm(null);
        }}
        onCancel={() => setRevokeConfirm(null)}
      />
    </div>
  );
}
