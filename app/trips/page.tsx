"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

import Card from "@/components/Card";
import { type Campsite } from "@/types/campsite";
import CampsiteCard from "@/components/CampsiteCard";
import ConfirmModal from "@/components/ConfirmModal";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

type PopulatedSite = Pick<
  Campsite,
  "_id" | "name" | "wilaya" | "region" | "images" | "pricePerNight" | "type"
>;

type Booking = {
  _id: string;
  site: PopulatedSite | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: BookingStatus;
};

const statusColors: Record<BookingStatus, string> = {
  pending: "text-yellow-400 bg-yellow-400/10",
  confirmed: "text-green-400 bg-green-400/10",
  cancelled: "text-red-400 bg-red-400/10",
  completed: "text-slate-400 bg-slate-400/10",
};

const tabs = ["Bookings", "Saved", "Notes"];

export default function TripsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("Bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [savedSites, setSavedSites] = useState<PopulatedSite[]>([]);
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [unsavingId, setUnsavingId] = useState<string | null>(null);

  const { toast } = useToast();
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
  const [unsaveConfirm, setUnsaveConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/bookings")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setBookings(d.data);
      })
      .finally(() => setLoadingBookings(false));

    fetch("/api/saved")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSavedSites(d.data);
      })
      .finally(() => setLoadingSaved(false));

    fetch("/api/profile/notes")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setNotes(d.data);
          setNotesLoaded(true);
        }
      });
  }, [status]);

  async function handleCancel(bookingId: string) {
    setCancellingId(bookingId);
    const res = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
    if (res.ok) {
      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId ? { ...b, status: "cancelled" } : b,
        ),
      );
      toast("success", "Booking cancelled", "Your booking has been cancelled.");
    } else {
      toast("error", "Something went wrong", "Could not cancel this booking.");
    }
    setCancellingId(null);
  }

  async function handleUnsave(siteId: string) {
    setUnsavingId(siteId);
    const res = await fetch(`/api/saved/${siteId}`, { method: "POST" });
    const data = await res.json();
    if (data.success && !data.saved) {
      setSavedSites((prev) => prev.filter((s) => s._id !== siteId));
      toast("info", "Removed from saved", "You can save it again anytime.");
    } else {
      toast("error", "Something went wrong", "Could not remove this campsite.");
    }
    setUnsavingId(null);
  }

  const saveNotesTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleNotesChange(val: string) {
    setNotes(val);
    if (saveNotesTimeout.current) clearTimeout(saveNotesTimeout.current);
    saveNotesTimeout.current = setTimeout(async () => {
      setNotesSaving(true);
      await fetch("/api/profile/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: val }),
      });
      setNotesSaving(false);
    }, 800);
  }

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
          My Trips
        </span>
        <h1
          className="text-3xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Trip Dashboard
        </h1>
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""} ·{" "}
          {savedSites.length} saved
        </p>
      </div>

      {/* Tabs + Content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <Card className="p-2 flex flex-row md:flex-col gap-1 w-full md:w-48 md:shrink-0 h-fit overflow-x-auto justify-center md:justify-start">
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
              {tab == "Bookings" && bookings.length > 0 && (
                <span
                  className="ml-2 text-xs"
                  style={{ color: "var(--text-ghost)" }}
                >
                  {bookings.length}
                </span>
              )}
              {tab == "Saved" && savedSites.length > 0 && (
                <span
                  className="ml-2 text-xs"
                  style={{ color: "var(--text-ghost)" }}
                >
                  {savedSites.length}
                </span>
              )}
            </button>
          ))}
        </Card>

        {/* Content */}
        <Card className="p-6 flex flex-col gap-6 flex-1">
          {/* Bookings Tab */}
          {activeTab === "Bookings" && (
            <div className="flex flex-col gap-4">
              <h2
                className="font-semibold text-lg"
                style={{ color: "var(--text-primary)" }}
              >
                Your Bookings
              </h2>

              {loadingBookings ? (
                <p className="text-sm" style={{ color: "var(--text-faint)" }}>Loading bookings...</p>
              ) : bookings.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <span className="text-4xl">🏕️</span>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    No bookings yet
                  </p>
                  <button
                    onClick={() => router.push("/explore")}
                    className="text-sm hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    Explore campsites →
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking._id}
                      className="flex flex-col md:flex-row rounded-xl overflow-hidden"
                      style={{
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      {/* Render a fallback block when the campsite was removed but the booking still exists */}
                      <div className="w-full h-40 md:w-36 md:h-auto shrink-0 self-stretch border-r flex items-center justify-center" style={{ borderColor: "var(--border-ghost)", background: "var(--bg-input)" }}>
                        {booking.site?.images?.[0] ? (
                          <img
                            src={booking.site.images[0]}
                            alt={booking.site.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-center px-4" style={{ color: "var(--text-ghost)" }}>
                            Campsite unavailable
                          </span>
                        )}
                      </div>

                      {/* Info Wrapper: Added p-4 and justify-between to push status/price to the right */}
                      <div className="flex flex-col md:flex-row justify-between p-4 flex-1 gap-4 md:gap-8">
                        {/* Left Side: Core Info */}
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <div className="flex flex-col gap-0.5">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {booking.site?.name ?? "Deleted campsite"}
                            </p>
                            <p
                              className="text-xs truncate"
                              style={{ color: "var(--text-faint)" }}
                            >
                              {booking.site
                                ? `📍 ${booking.site.wilaya}, ${booking.site.region}`
                                : "This campsite is no longer available."}
                            </p>
                          </div>

                          <div className="flex flex-col gap-0.5 mt-1">
                            <p
                              className="text-xs truncate"
                              style={{ color: "var(--text-faint)" }}
                            >
                              📅{" "}
                              {new Date(booking.checkIn).toLocaleDateString(
                                "en-GB",
                              )}{" "}
                              →{" "}
                              {new Date(booking.checkOut).toLocaleDateString(
                                "en-GB",
                              )}
                            </p>
                            <p
                              className="text-xs truncate"
                              style={{ color: "var(--text-faint)" }}
                            >
                              👤 {booking.guests} guest
                              {booking.guests > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>

                        {/* Right Side: Status, Price & Actions */}
                        <div className="flex flex-row md:flex-col justify-between items-center md:items-end md:justify-center gap-2 shrink-0">
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${statusColors[booking.status]}`}
                          >
                            {booking.status}
                          </span>

                          <div className="flex items-center md:flex-col md:items-end gap-3">
                            <span className="text-sm font-medium" style={{ color: "var(--accent-soft)" }}>
                              {booking.totalPrice.toLocaleString()} DZD
                            </span>

                            {booking.status === "pending" && (
                              <button
                                onClick={() => setCancelConfirm(booking._id)}
                                disabled={cancellingId === booking._id}
                                className="text-xs text-red-400 hover:text-red-300 border border-red-400/20 px-3 py-1 rounded-lg transition disabled:opacity-50"
                              >
                                {cancellingId === booking._id
                                  ? "..."
                                  : "Cancel"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Saved Tab */}
          {activeTab === "Saved" && (
            <div className="flex flex-col gap-4">
              <h2
                className="font-semibold text-lg"
                style={{ color: "var(--text-primary)" }}
              >
                Saved Campsites
              </h2>

              {loadingSaved ? (
                <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                  Loading saved campsites...
                </p>
              ) : savedSites.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <span className="text-4xl">♡</span>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    No saved campsites yet.
                  </p>
                  <button
                    onClick={() => router.push("/explore")}
                    className="text-sm hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    Browse campsites →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedSites.map((site) => (
                    <div key={site._id} className="relative">
                      <CampsiteCard
                        id={site._id}
                        name={site.name}
                        location={site.wilaya}
                        region={site.region}
                        type={site.type}
                        image={site.images[0] ?? ""}
                        price={site.pricePerNight}
                      />
                      <button
                        onClick={() => setUnsaveConfirm(site._id)}
                        disabled={unsavingId === site._id}
                        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-500/80 transition disabled:opacity-50"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === "Notes" && (
            <div className="flex flex-col gap-4">
              <h2
                className="font-semibold text-lg"
                style={{ color: "var(--text-primary)" }}
              >
                Trip Notes
              </h2>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                Jot down packing lists, ideas, or plans.{" "}
                {notesSaving ? (
                  <span style={{ color: "var(--text-ghost)" }}>Saving...</span>
                ) : notesLoaded ? (
                  <span style={{ color: "var(--accent)" }}>Saved</span>
                ) : null }
              </p>
              <textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Start writing your trip notes..."
                rows={14}
                className="rounded-xl p-4 text-sm outline-none resize-none w-full transition"
                style={{
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          )}
        </Card>
      </div>
      <ConfirmModal
        open={cancelConfirm !== null}
        title="Cancel this booking?"
        message="This will cancel your pending booking. You'll need to rebook if you change your mind."
        confirmLabel="Cancel booking"
        cancelLabel="Keep it"
        variant="danger"
        onConfirm={() => {
          if (cancelConfirm) handleCancel(cancelConfirm);
          setCancelConfirm(null);
        }}
        onCancel={() => setCancelConfirm(null)}
      />

      <ConfirmModal
        open={unsaveConfirm !== null}
        title="Remove from saved?"
        message="This campsite will be removed from your saved list. You can always save it again."
        confirmLabel="Remove"
        cancelLabel="Keep it"
        variant="warning"
        onConfirm={() => {
          if (unsaveConfirm) handleUnsave(unsaveConfirm);
          setUnsaveConfirm(null);
        }}
        onCancel={() => setUnsaveConfirm(null)}
      />
    </div>
  );
}
