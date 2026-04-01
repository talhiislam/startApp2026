"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import Card from "@/components/Card";
import { type Campsite } from "@/types/campsite";
import CampsiteCard from "@/components/CampsiteCard";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

type PopulatedSite = Pick<
  Campsite,
  "_id" | "name" | "wilaya" | "region" | "images" | "pricePerNight" | "type"
>;

type Booking = {
  _id: string;
  site: PopulatedSite;
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
const NOTES_KEY = "sahatour_trip_notes";

export default function TripsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("Bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [savedSites, setSavedSites] = useState<PopulatedSite[]>([]);
  const [notes, setNotes] = useState("");
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [unsavingId, setUnsavingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
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

    setNotes(localStorage.getItem(NOTES_KEY) ?? "");
  }, []);

  async function handleCancel(bookingId: string) {
    setCancellingId(bookingId);
    const res = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
    if (res.ok) {
      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId ? { ...b, status: "cancelled" } : b,
        ),
      );
    }
    setCancellingId(null);
  }

  async function handleUnsave(siteId: string) {
    setUnsavingId(siteId);
    const res = await fetch(`/api/saved/${siteId}`, { method: "POST" });
    const data = await res.json();
    if (data.success && !data.saved) {
      setSavedSites((prev) => prev.filter((s) => s._id !== siteId));
    }
    setUnsavingId(null);
  }

  function handleNotesChange(val: string) {
    setNotes(val);
    localStorage.setItem(NOTES_KEY, val);
  }

  if (status === "loading")
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Loading...
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="text-orange-500 text-sm font-medium uppercase tracking-widest">
          My Trips
        </span>
        <h1 className="text-3xl font-bold text-slate-100">Trip Dashboard</h1>
        <p className="text-slate-500 text-sm">
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""} ·{" "}
          {savedSites.length} saved
        </p>
      </div>

      {/* Tabs + Content */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <Card className="p-2 flex flex-col gap-1 w-48 shrink-0 h-fit">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  activeTab === tab
                    ? "bg-orange-500/10 text-orange-500"
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                }`}
            >
              {tab}
              {tab == "Bookings" && bookings.length > 0 && (
                <span className="ml-2 text-xs text-slate-600">
                  {bookings.length}
                </span>
              )}
              {tab == "Saved" && savedSites.length > 0 && (
                <span className="ml-2 text-xs text-slate-600">
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
              <h2 className="text-slate-100 font-semibold text-lg">
                Your Bookings
              </h2>

              {loadingBookings ? (
                <p className="text-slate-500 text-sm">Loading bookings...</p>
              ) : bookings.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <span className="text-4xl">🏕️</span>
                  <p className="text-slate-400 text-sm">No bookinds yet</p>
                  <button
                    onClick={() => router.push("/explore")}
                    className="text-orange-500 text-sm hover:underline"
                  >
                    Explore campsites →
                  </button>
                </div>
              ) : (
                bookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="flex gap-4 bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden"
                  >
                    {/* Image */}
                    <div className="w-32 h-28 shrink-0">
                      <img
                        src={booking.site.images[0] ?? ""}
                        alt={booking.site.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex flex-col justify-between py-3 pr-4 flex-1 gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-slate-100 font-medium text-sm">
                            {booking.site.name}
                          </p>
                          <p className="text-slate-500 text-xs">
                            📍 {booking.site.wilaya}, {booking.site.region}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${statusColors[booking.status]}`}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <div className="flex items-end justify-between">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-slate-400 text-xs">
                            {new Date(booking.checkIn).toLocaleDateString(
                              "en-GB",
                            )}{" "}
                            →{" "}
                            {new Date(booking.checkOut).toLocaleDateString(
                              "en-GB",
                            )}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {booking.guests} guest
                            {booking.guests > 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-orange-400 text-sm font-medium">
                            {booking.totalPrice.toLocaleString()} DZD
                          </span>
                          {booking.status === "pending" && (
                            <button
                              onClick={() => handleCancel(booking._id)}
                              disabled={cancellingId === booking._id}
                              className="text-xs text-red-400 hover:text-red-300 border border-red-400/20 px-3 py-1 rounded-lg transition disabled:opacity-50"
                            >
                              {cancellingId === booking._id
                                ? "Cancelling..."
                                : "Cancel"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Saved Tab */}
          {activeTab === "Saved" && (
            <div className="flex flex-col gap-4">
              <h2 className="text-slate-100 font-semibold text-lg">
                Saved Campsites
              </h2>

              {loadingSaved ? (
                <p className="text-slate-500 text-sm">
                  Loading saved campsites...
                </p>
              ) : savedSites.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <span className="text-4xl">♡</span>
                  <p className="text-slate-400 text-sm">
                    No saved campsites yet.
                  </p>
                  <button
                    onClick={() => router.push("/explore")}
                    className="text-orange-500 text-sm hover:underline"
                  >
                    Browse campsites →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
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
                        onClick={() => handleUnsave(site._id)}
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
              <h2 className="text-slate-100 font-semibold text-lg">
                Trip Notes
              </h2>
              <p className="text-slate-500 text-xs">
                Jot down packing lists, ideas, or plans. Saved locally on this
                device.
              </p>
              <textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Start writing your trip notes..."
                rows={14}
                className="bg-white/5 border border-white/[0.08] rounded-xl p-4 text-slate-300 text-sm placeholder:text-slate-600 outline-none focus:border-orange-500/40 transition resize-none w-full"
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
