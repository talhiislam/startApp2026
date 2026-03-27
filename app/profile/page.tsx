"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
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
  admin: "text-orange-400 bg-orange-400/10"
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("Profile Info");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    city: "",
    dateOfBirth: ""
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
  }, []);

  async function handleProfileSave() {
    setError("");
    setMessage("");
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if(!res.ok) {
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
      confirmPassword: ""
    });
  }

  const inputClass = "bg-white/5 border border-white/[0.08] text-slate-100 placeholder:text-slate-500 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition w-full";
  const labelClass = "text-xs text-slate-500 uppercase tracking-wide mb-1";

  

  if (!profile) return (
    <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-6">

      {/* Header Card */}
      <Card className="p-6 flex items-center gap-6">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center text-white text-3xl font-bold shrink-0">
          {profile.avatar ? (
            <img src={profile.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            profile.username[0].toUpperCase()
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-100">{profile.username}</h1>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${roleColors[profile.role]}`}>
              {profile.role}
            </span>
          </div>
          {profile.fullName && <p className="text-slate-400 text-sm">{profile.fullName}</p>}
          <div className="flex items-center gap-4 text-slate-500 text-xs mt-1">
            <span>Member since {new Date(profile.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric"})}</span>
            {profile.city && <span>📍 {profile.city}</span>}
          </div>
        </div>
      </Card>

      {/* Tabs + Content */}
      <div className="flex gap-6">

        {/* Sidebar tabs */}
        <Card className="p-2 flex flex-col gap-1 w-48 shrink-0 h-fit">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setEditing(false); setMessage(""); setError(""); }}
              className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${activeTab === tab
                  ? "bg-orange-500/10 text-orange-500"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                }`}
            >
              {tab}
            </button>
          ))}
        </Card>

        {/* Content */}
        <Card className="p-6 flex flex-col gap-6 flex-1">

          {/* Feedback */}
          {message && <p className="text-green-400 text-sm bg-green-400/10 px-4 py-2 rounded-lg">{message}</p>}
          {error && <p className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg">{error}</p>}

          {/* Profile Info Tab */}
          {activeTab === "Profile Info" && (
            <>
              {!editing ? (
                <div className="flex flex-col gap-4">
                  <h2 className="text-slate-100 font-semibold text-lg tracking-tight">Personal Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Full Name", value: profile.fullName },
                      { label: "Username", value: profile.username },
                      { label: "Email", value: profile.email },
                      { label: "Phone", value: profile.phone },
                      { label: "City", value: profile.city },
                      { label: "Date of Birth", value: profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString("en-GB") : undefined},
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col gap-1">
                        <span className={labelClass}>{label}</span>
                        <span className="text-slate-300 text-sm">{value ?? <span className="text-slate-600">Not set</span>}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setEditing(true)}
                    className="mt-2 self-start px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition"
                  >
                    Edit Profile
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <h2 className="text-slate-100 font-semibold text-lg tracking-tight">Edit Profile</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={labelClass}>Full Name</label>
                      <input className={inputClass} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Full name" />
                    </div>
                    <div className="flex flex-col">
                      <label className={labelClass}>Phone</label>
                      <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
                    </div>
                    <div className="flex flex-col">
                      <label className={labelClass}>City</label>
                      <input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Your city" />
                    </div>
                    <div className="flex flex-col">
                      <label className={labelClass}>Date of Birth</label>
                      <input className={inputClass} type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button onClick={handleProfileSave} className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition">
                      Save Changes
                    </button>
                    <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg bg-white/5 text-slate-400 text-sm font-medium hover:bg-white/10 transition">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Stats Tab */}
          {activeTab === "Stats" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-slate-100 font-semibold text-lg tracking-tight">Your Stats</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Trips Planned", value: "0" },
                  { label: "Trips Completed", value: "0"},
                  { label: "Campsites Saved", value: "0"},
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col items-center justify-center bg-white/5 rounded-xl p-6 gap-2">
                    <span className="text-3xl font-bold text-orange-500">{value}</span>
                    <span className="text-slate-400 text-sm text-center">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "Security" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-slate-100 font-semibold text-lg tracking-tight">Change Password</h2>
              <div className="flex flex-col gap-3 max-w-sm">
                <div className="flex flex-col">
                  <label className={labelClass}>Current Password</label>
                  <input className={inputClass} type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} placeholder="Current password" />    
                </div>
                <div className="flex flex-col">
                  <label className={labelClass}>New Password</label>
                  <input className={inputClass} type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="New Password" />    
                </div>
                <div className="flex flex-col">
                  <label className={labelClass}>Confirm New Password</label>
                  <input className={inputClass} type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} placeholder="Confirm new password" />    
                </div>
                <button onClick={handlePasswordSave} className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition self-start">
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