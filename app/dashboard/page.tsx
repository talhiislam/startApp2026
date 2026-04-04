"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import Card from "@/components/Card";
import { type Campsite, typeColors, typeLabels } from "@/types/campsite";

type OwnerCampsite = Campsite & {
    isApproved: boolean;
    createdAt: string;
};

type BookingUser = {
    _id: string;
    username: string;
    avatar?: string;
};

type OwnerBooking = {
    _id: string;
    user: BookingUser;
    site: { _id: string; name: string };
    checkIn: string;
    checkOut: string;
    guests: number;
    totalPrice: number;
    status: "pending" | "confirmed" | "cancelled" | "completed";
};

type BookingStatus = OwnerBooking["status"];

const statusColors: Record<BookingStatus, string> = {
    pending: "text-yellow-400 bg-yellow-400/10",
    confirmed: "text-green-400 bg-green-400/10",
    cancelled: "text-red-400 bg-red-400/10",
    completed: "text-slate-400 bg-slate-400/10",
};

const emptyForm = {
    name: "",
    description: "",
    wilaya: "",
    region: "sahara",
    type: "tent",
    pricePerNight: "",
    amenities: "",
    images: "",
    lat: "",
    lng: "",
};

const regions = ["sahara", "kabylie", "hoggar", "coastal", "other"];
const types = ["tent", "bungalow", "wild", "glamping"];

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [campsites, setCampsites] = useState<OwnerCampsite[]>([]);
    const [bookings, setBookings] = useState<OwnerBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null);
    const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/auth/login");
        if (status === "authenticated") {
            if (session.user.role !== "owner" && session.user.role !== "admin") {
                router.push("/");
            }
        }
    }, [status, session, router]);

    useEffect(() => {
        if (status !== "authenticated") return;

        Promise.all([
            fetch("/api/dashboard/campsites").then((r) => r.json()),
            fetch("/api/dashboard/bookings").then((r) => r.json()),
        ])
            .then(([campsiteData, bookingData]) => {
                if (campsiteData.success) setCampsites(campsiteData.data);
                if (bookingData.success) setBookings(bookingData.data);
            })
            .finally(() => setLoading(false));
    }, [status]);

    function getBookingsForSite(siteId: string) {
        return bookings.filter((b) => b.site._id === siteId);
    }

    function getActiveBookingCount(siteId: string) {
        return bookings.filter(
            (b) => b.site._id === siteId && (b.status === "pending" || b.status === "confirmed"),
        ).length;
    }

    async function handleBookingAction(bookingId: string, newStatus: "confirmed" | "cancelled") {
        setProcessingBookingId(bookingId);
        const res = await fetch(`/api/dashboard/bookings/${bookingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
            setBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, status: newStatus } : b)));
        }
        setProcessingBookingId(null);
    }

    function openCreate() {
        setEditingId(null);
        setForm(emptyForm);
        setError("");
        setSuccess("");
        setShowForm(true);
    }

    function openEdit(c: OwnerCampsite) {
        setEditingId(c._id);
        setForm({
            name: c.name,
            description: c.description,
            wilaya: c.wilaya,
            region: c.region,
            type: c.type,
            pricePerNight: String(c.pricePerNight),
            amenities: c.amenities.join(", "),
            images: c.images.join(", "),
            lat: "",
            lng: "",
        });
        setError("");
        setSuccess("");
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        setError("");
    }

    async function handleSubmit() {
        setError("");
        setSuccess("");
        setSubmitting(true);

        const payload = {
            name: form.name,
            description: form.description,
            wilaya: form.wilaya,
            region: form.region,
            type: form.type,
            pricePerNight: Number(form.pricePerNight),
            amenities: form.amenities.split(",").map((a) => a.trim()).filter(Boolean),
            images: form.images.split(",").map((i) => i.trim()).filter(Boolean),
            coordinates: {
                lat: Number(form.lat) || 0,
                lng: Number(form.lng) || 0,
            },
        };

        const url = editingId ? `/api/dashboard/campsites/${editingId}` : "/api/dashboard/campsites";
        const method = editingId ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        setSubmitting(false);

        if (!res.ok) {
            setError(data.error);
            return;
        }

        if (editingId) {
            setCampsites((prev) => prev.map((c) => (c._id === editingId ? data.data : c)));
            setSuccess("Campsite updated. Pending admin approval.");
        } else {
            setCampsites((prev) => [data.data, ...prev]);
            setSuccess("Campsite created. Pending admin approval.");
        }

        closeForm();
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this campsite?")) return;
        setDeletingId(id);
        const res = await fetch(`/api/dashboard/campsites/${id}`, {
            method: "DELETE",
        });
        if (res.ok) {
            setCampsites((prev) => prev.filter((c) => c._id !== id));
            setBookings((prev) => prev.filter((b) => b.site._id !== id));
        }
        setDeletingId(null);
    }

    const inputClass =
        "bg-white/5 border border-white/[0.08] text-slate-100 placeholder:text-slate-500 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition w-full text-sm";
    const labelClass = "text-xs text-slate-500 uppercase tracking-wide mb-1";

    if (status === "loading" || loading)
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
                Loading...
            </div>
        );

    return (
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <span className="text-orange-500 text-sm font-medium uppercase tracking-widest">
                        Owner
                    </span>
                    <h1 className="text-3xl font-bold text-slate-100">My Campsites</h1>
                    <p className="text-slate-500 text-sm">
                        {campsites.length} campsite{campsites.length !== 1 ? "s" : ""} ·{" "}
                        {bookings.filter((b) => b.status === "pending").length} pending bookings
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
                >
                    + New Campsite
                </button>
            </div>

            {/* Success message */}
            {success && (
                <p className="text-green-400 text-sm bg-green-400/10 px-4 py-3 rounded-lg">
                    {success}
                </p>
            )}

            {/* Form */}
            {showForm && (
                <Card className="p-6 flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-slate-100 font-semibold text-lg">
                            {editingId ? "Edit Campsite" : "New Campsite"}
                        </h2>
                        <button
                            onClick={closeForm}
                            className="text-slate-500 hover:text-slate-300 transition text-lg"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col col-span-2">
                            <label className={labelClass}>Name</label>
                            <input
                                className={inputClass}
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Campsite name"
                            />
                        </div>
                        <div className="flex flex-col col-span-2">
                            <label className={labelClass}>Description</label>
                            <textarea
                                className={inputClass}
                                rows={3}
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Describe your campsite..."
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className={labelClass}>Wilaya</label>
                            <input
                                className={inputClass}
                                value={form.wilaya}
                                onChange={(e) => setForm({ ...form, wilaya: e.target.value })}
                                placeholder="e.g. Tamanrasset"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className={labelClass}>Region</label>
                            <select
                                className={inputClass}
                                value={form.region}
                                onChange={(e) => setForm({ ...form, region: e.target.value })}
                            >
                                {regions.map((r) => (
                                    <option key={r} value={r} className="bg-[#111827] capitalize">
                                        {r}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className={labelClass}>Type</label>
                            <select
                                className={inputClass}
                                value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value })}
                            >
                                {types.map((t) => (
                                    <option key={t} value={t} className="bg-[#111827] capitalize">
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className={labelClass}>Price per Night (DZD)</label>
                            <input
                                className={inputClass}
                                type="number"
                                value={form.pricePerNight}
                                onChange={(e) => setForm({ ...form, pricePerNight: e.target.value })}
                                placeholder="e.g. 2500"
                            />
                        </div>
                        <div className="flex flex-col col-span-2">
                            <label className={labelClass}>Amenities (comma separated)</label>
                            <input
                                className={inputClass}
                                value={form.amenities}
                                onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                                placeholder="e.g. Bonfire, Parking, Showers"
                            />
                        </div>
                        <div className="flex flex-col col-span-2">
                            <label className={labelClass}>Image URLs (comma separated)</label>
                            <input
                                className={inputClass}
                                value={form.images}
                                onChange={(e) => setForm({ ...form, images: e.target.value })}
                                placeholder="https://... , https://..."
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className={labelClass}>Latitude (optional)</label>
                            <input
                                className={inputClass}
                                type="number"
                                value={form.lat}
                                onChange={(e) => setForm({ ...form, lat: e.target.value })}
                                placeholder="e.g. 36.7"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className={labelClass}>Longitude (optional)</label>
                            <input
                                className={inputClass}
                                type="number"
                                value={form.lng}
                                onChange={(e) => setForm({ ...form, lng: e.target.value })}
                                placeholder="e.g. 3.05"
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg">
                            {error}
                        </p>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition disabled:opacity-50"
                        >
                            {submitting ? "Saving..." : editingId ? "Save Changes" : "Create Campsite"}
                        </button>
                        <button
                            onClick={closeForm}
                            className="bg-white/5 hover:bg-white/10 text-slate-400 text-sm font-medium px-5 py-2.5 rounded-xl transition"
                        >
                            Cancel
                        </button>
                    </div>
                </Card>
            )}

            {/* Campsites list */}
            {campsites.length === 0 ? (
                <Card className="p-12 flex flex-col items-center gap-3 text-center">
                    <span className="text-4xl">🏕️</span>
                    <p className="text-slate-400 text-sm">No campsites yet.</p>
                    <button
                        onClick={openCreate}
                        className="text-orange-500 text-sm hover:underline"
                    >
                        Create your first campsite →
                    </button>
                </Card>
            ) : (
                <div className="flex flex-col gap-4">
                    {campsites.map((c) => {
                        const siteBookings = getBookingsForSite(c._id);
                        const activeCount = getActiveBookingCount(c._id);
                        const isExpanded = expandedSiteId === c._id;

                        return (
                            <Card key={c._id} className="overflow-hidden">
                                {/* Campsite row */}
                                <div className="p-5 flex gap-5 items-start">
                                    {/* Image */}
                                    <div className="w-28 h-20 rounded-xl overflow-hidden shrink-0">
                                        <img
                                            src={c.images[0] ?? ""}
                                            alt={c.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex flex-col gap-1 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-slate-100 font-medium">{c.name}</p>
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[c.type]}`}
                                            >
                                                {typeLabels[c.type]}
                                            </span>
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                    c.isApproved
                                                        ? "text-green-400 bg-green-400/10"
                                                        : "text-yellow-400 bg-yellow-400/10"
                                                }`}
                                            >
                                                {c.isApproved ? "Approved" : "Pending"}
                                            </span>
                                        </div>
                                        <p className="text-slate-500 text-xs">
                                            📍 {c.wilaya}, {c.region}
                                        </p>
                                        <p className="text-orange-400 text-sm font-medium">
                                            {c.pricePerNight.toLocaleString()} DZD / night
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 shrink-0 items-center">
                                        <button
                                            onClick={() => router.push(`/explore/${c._id}`)}
                                            className="text-xs text-slate-400 hover:text-slate-200 border border-white/[0.08] px-3 py-1.5 rounded-lg transition"
                                        >
                                            Preview
                                        </button>
                                        <button
                                            onClick={() => openEdit(c)}
                                            className="text-xs text-slate-400 hover:text-slate-200 border border-white/[0.08] px-3 py-1.5 rounded-lg transition"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(c._id)}
                                            disabled={deletingId === c._id}
                                            className="text-xs text-red-400 hover:text-red-300 border border-red-400/20 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                                        >
                                            {deletingId === c._id ? "Deleting..." : "Delete"}
                                        </button>

                                        {/* Bookings toggle */}
                                        <button
                                            onClick={() => setExpandedSiteId(isExpanded ? null : c._id)}
                                            disabled={siteBookings.length === 0}
                                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition disabled:opacity-30 disabled:cursor-not-allowed
                                                ${
                                                    isExpanded
                                                        ? "bg-orange-500/10 border-orange-500/40 text-orange-400"
                                                        : activeCount > 0
                                                          ? "border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
                                                          : "border-white/[0.08] text-slate-400 hover:text-slate-200"
                                                }`}
                                        >
                                            Bookings
                                            {activeCount > 0 && (
                                                <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                                                    {activeCount}
                                                </span>
                                            )}
                                            <span
                                                className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                            >
                                                ▾
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Bookings drawer */}
                                <div
                                    className={`overflow-hidden transition-all duration-300 ${
                                        isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
                                    }`}
                                >
                                    <div className="border-t border-white/[0.06] px-5 py-4 flex flex-col gap-3">
                                        <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
                                            Bookings — {siteBookings.length} total
                                        </p>

                                        {siteBookings.map((booking) => (
                                            <div
                                                key={booking._id}
                                                className="flex items-center justify-between gap-4 bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3"
                                            >
                                                {/* Guest info */}
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                                                        {booking.user.avatar ? (
                                                            <img
                                                                src={booking.user.avatar}
                                                                alt={booking.user.username}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            booking.user.username[0].toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 min-w-0">
                                                        <p className="text-slate-200 text-sm font-medium truncate">
                                                            {booking.user.username}
                                                        </p>
                                                        <p className="text-slate-500 text-xs">
                                                            {new Date(booking.checkIn).toLocaleDateString("en-GB")} →{" "}
                                                            {new Date(booking.checkOut).toLocaleDateString("en-GB")} ·{" "}
                                                            {booking.guests} guest{booking.guests > 1 ? "s" : ""}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Price + status + actions */}
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <span className="text-orange-400 text-sm font-medium">
                                                        {booking.totalPrice.toLocaleString()} DZD
                                                    </span>
                                                    <span
                                                        className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[booking.status]}`}
                                                    >
                                                        {booking.status}
                                                    </span>

                                                    {booking.status === "pending" && (
                                                        <>
                                                            <button
                                                                onClick={() =>
                                                                    handleBookingAction(booking._id, "confirmed")
                                                                }
                                                                disabled={processingBookingId === booking._id}
                                                                className="text-xs text-green-400 hover:text-green-300 border border-green-400/20 px-3 py-1 rounded-lg transition disabled:opacity-50"
                                                            >
                                                                Confirm
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleBookingAction(booking._id, "cancelled")
                                                                }
                                                                disabled={processingBookingId === booking._id}
                                                                className="text-xs text-red-400 hover:text-red-300 border border-red-400/20 px-3 py-1 rounded-lg transition disabled:opacity-50"
                                                            >
                                                                Decline
                                                            </button>
                                                        </>
                                                    )}

                                                    {booking.status === "confirmed" && (
                                                        <button
                                                            onClick={() => handleBookingAction(booking._id, "cancelled")}
                                                            disabled={processingBookingId === booking._id}
                                                            className="text-xs text-red-400 hover:text-red-300 border border-red-400/20 px-3 py-1 rounded-lg transition disabled:opacity-50"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
