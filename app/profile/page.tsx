"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import Card from "@/components/Card";

type UserProfile = {
  username: string;
  email: string;
  fullName?: string;
  phone?: string;
  city?: string;
  dateOfBirth?: string;
  role: "camper" | "owner" | "admin";
  avatar?: string;
  createdAt: string;
};

const tabs = ["Profile Info", "Stats", "Security"];

const roleColors = {
  camper: "text-green-400 bg-green-400/10",
  owner: "text-blue-400 bg-blue-400/10",
  admin: "text-orange-400 bg-orange-400/10",
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("Profile Info");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    city: "",
    dateOfBirth: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [becomingOwner, setBecomingOwner] = useState(false);
  const [failedAvatarSrc, setFailedAvatarSrc] = useState("");
  const [stats, setStats] = useState({
    tripsPlanned: 0,
    tripsCompleted: 0,
    campsitesSaved: 0,
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setForm({
          fullName: data.fullName ?? "",
          phone: data.phone ?? "",
          city: data.city ?? "",
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "",
        });
      });

    fetch("/api/profile/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      });
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setError("");
    setMessage("");

    try {
      const url = await uploadToCloudinary(file);

      const profileRes = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, avatar: url }),
      });
      const profileData = await profileRes.json();

      if (profileRes.ok) {
        setProfile((prev) => (prev ? { ...prev, avatar: url } : prev));
        setFailedAvatarSrc("");
        setMessage("Avatar updated successfully");
      } else {
        setError(profileData.error);
      }
    } catch (err) {
      setError(
        `Failed to upload avatar - ${err instanceof Error ? err.message : "please try again"}`,
      );
    } finally {
      setUploadingAvatar(false);
      input.value = "";
    }
  }

  async function handleProfileSave() {
    setError("");
    setMessage("");
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setProfile(data);
    setEditing(false);
    setMessage("Profile updated successfully");
  }

  async function handlePasswordSave() {
    setError("");
    setMessage("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    const res = await fetch("/api/profile/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setMessage(data.message);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  }

  async function handleBecomeOwner() {
    setError("");
    setMessage("");
    setBecomingOwner(true);

    const res = await fetch("/api/profile/become-owner", { method: "POST" });
    const data = await res.json();

    setBecomingOwner(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setMessage(
      "You are now an owner! Sign out and back in to access your dashboard.",
    );
    setProfile((prev) => (prev ? { ...prev, role: "owner" } : prev));
  }

  const inputClass =
    "p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition w-full";
  const inputStyle = {
    background: "var(--bg-input)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  } as const;
  const labelClass = "text-xs uppercase tracking-wide mb-1";

  const rawAvatarSrc =
    profile?.avatar || session?.user?.avatar || session?.user?.image || "";
  const isGoogleAvatar = rawAvatarSrc.includes("googleusercontent.com");
  const proxiedAvatarSrc = isGoogleAvatar
    ? "/api/profile/avatar"
    : rawAvatarSrc;
  const showAvatar =
    Boolean(proxiedAvatarSrc) && failedAvatarSrc !== proxiedAvatarSrc;

  if (!profile)
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Loading...
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-6">
      <Card className="p-6 flex items-center gap-6">
        <label className="relative w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center text-white text-3xl font-bold shrink-0 cursor-pointer group">
          {showAvatar ? (
            <img
              src={proxiedAvatarSrc}
              alt="avatar"
              className="w-full h-full rounded-full object-cover"
              onError={() => setFailedAvatarSrc(proxiedAvatarSrc)}
            />
          ) : (
            profile.username[0].toUpperCase()
          )}
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <span className="text-xs text-white font-medium">Upload</span>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
            disabled={uploadingAvatar}
          />
        </label>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              {profile.username}
            </h1>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${roleColors[profile.role]}`}
            >
              {profile.role}
            </span>
          </div>
          {profile.fullName && (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {profile.fullName}
            </p>
          )}
          <div
            className="flex items-center gap-4 text-xs mt-1"
            style={{ color: "var(--text-faint)" }}
          >
            <span>
              Member since{" "}
              {new Date(profile.createdAt).toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
              })}
            </span>
            {profile.city && <span>City: {profile.city}</span>}
          </div>
        </div>
      </Card>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="p-2 flex flex-row md:flex-col gap-1 w-full md:w-48 md:shrink-0 h-fit overflow-x-auto justify-center md:justify-start">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setEditing(false);
                setMessage("");
                setError("");
              }}
              className="shrink-0 text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                background:
                  activeTab === tab ? "var(--accent-subtle)" : "transparent",
                color:
                  activeTab === tab ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              {tab}
            </button>
          ))}
        </Card>

        <Card className="p-6 flex flex-col gap-6 flex-1">
          {message && (
            <p
              className="text-green-400 text-sm px-4 py-2 rounded-lg"
              style={{ background: "var(--accent-subtle)" }}
            >
              {message}
            </p>
          )}
          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}

          {activeTab === "Profile Info" && (
            <>
              {!editing ? (
                <div className="flex flex-col gap-4">
                  <h2
                    className="font-semibold text-lg tracking-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Personal Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: "Full Name", value: profile.fullName },
                      { label: "Username", value: profile.username },
                      { label: "Email", value: profile.email },
                      { label: "Phone", value: profile.phone },
                      { label: "City", value: profile.city },
                      {
                        label: "Date of Birth",
                        value: profile.dateOfBirth
                          ? new Date(profile.dateOfBirth).toLocaleDateString(
                              "en-GB",
                            )
                          : undefined,
                      },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col gap-1">
                        <span
                          className={labelClass}
                          style={{ color: "var(--text-faint)" }}
                        >
                          {label}
                        </span>
                        <span
                          className="text-sm"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {value ?? (
                            <span style={{ color: "var(--text-ghost)" }}>
                              Not set
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => setEditing(true)}
                      className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition"
                    >
                      Edit Profile
                    </button>

                    {profile.role === "camper" && (
                      <button
                        onClick={handleBecomeOwner}
                        disabled={becomingOwner}
                        className="px-4 py-2 rounded-lg bg-white/5 border border-white/[0.08] text-slate-300 text-sm font-medium hover:bg-white/10 transition disabled:opacity-50"
                      >
                        {becomingOwner ? "Upgrading..." : "Become an Owner"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <h2
                    className="font-semibold text-lg tracking-tight"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Edit Profile
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label
                        className={labelClass}
                        style={{ color: "var(--text-faint)" }}
                      >
                        Full Name
                      </label>
                      <input
                        className={inputClass}
                        style={inputStyle}
                        value={form.fullName}
                        onChange={(e) =>
                          setForm({ ...form, fullName: e.target.value })
                        }
                        placeholder="Full name"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label
                        className={labelClass}
                        style={{ color: "var(--text-faint)" }}
                      >
                        Phone
                      </label>
                      <input
                        className={inputClass}
                        style={inputStyle}
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        placeholder="Phone number"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label
                        className={labelClass}
                        style={{ color: "var(--text-faint)" }}
                      >
                        City
                      </label>
                      <input
                        className={inputClass}
                        style={inputStyle}
                        value={form.city}
                        onChange={(e) =>
                          setForm({ ...form, city: e.target.value })
                        }
                        placeholder="Your city"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label
                        className={labelClass}
                        style={{ color: "var(--text-faint)" }}
                      >
                        Date of Birth
                      </label>
                      <input
                        className={inputClass}
                        style={inputStyle}
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(e) =>
                          setForm({ ...form, dateOfBirth: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={handleProfileSave}
                      className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 rounded-lg bg-white/5 text-slate-400 text-sm font-medium hover:bg-white/10 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "Stats" && (
            <div className="flex flex-col gap-4">
              <h2
                className="font-semibold text-lg tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Your Stats
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Trips Planned", value: stats.tripsPlanned },
                  { label: "Trips Completed", value: stats.tripsCompleted },
                  { label: "Campsites Saved", value: stats.campsitesSaved },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center justify-center rounded-xl p-6 gap-2"
                    style={{ background: "var(--bg-hover)" }}
                  >
                    <span className="text-3xl font-bold text-orange-500">
                      {value}
                    </span>
                    <span
                      className="text-sm text-center"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Security" && (
            <div className="flex flex-col gap-4">
              <h2
                className="font-semibold text-lg tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Change Password
              </h2>
              <div className="flex flex-col gap-3 max-w-sm">
                <div className="flex flex-col">
                  <label
                    className={labelClass}
                    style={{ color: "var(--text-faint)" }}
                  >
                    Current Password
                  </label>
                  <input
                    className={inputClass}
                    style={inputStyle}
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    placeholder="Current password"
                  />
                </div>
                <div className="flex flex-col">
                  <label
                    className={labelClass}
                    style={{ color: "var(--text-faint)" }}
                  >
                    New Password
                  </label>
                  <input
                    className={inputClass}
                    style={inputStyle}
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="New Password"
                  />
                </div>
                <div className="flex flex-col">
                  <label
                    className={labelClass}
                    style={{ color: "var(--text-faint)" }}
                  >
                    Confirm New Password
                  </label>
                  <input
                    className={inputClass}
                    style={inputStyle}
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm new password"
                  />
                </div>
                <button
                  onClick={handlePasswordSave}
                  className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition self-start"
                >
                  Update Password
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
