"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type Campsite, typeColors } from "@/types/campsite";

export default function CampsiteDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [campsite, setCampsite] = useState<Campsite | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [saved, setSaved] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);

  const nights =
    checkIn && checkOut
      ? Math.max(
          0,
          Math.round(
            (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0;

  const total = nights * (campsite?.pricePerNight ?? 0);

  useEffect(() => {
    const fetchCampsite = async () => {
      const res = await fetch(`/api/campsites/${id}`);
      const data = await res.json();
      if (!data.success) setNotFound(true);
      else setCampsite(data.data);
      setLoading(false);
    };
    if (id) fetchCampsite();
  }, [id]);

  useEffect(() => {
    const fetchSaved = async () => {
      if (!session) return;
      const res = await fetch("/api/saved");
      const data = await res.json();
      if (data.success) {
        setSaved(data.data.some((s: { _id: string }) => s._id === id));
      }
    };
    fetchSaved();
  }, [session, id]);

  async function handleBook() {
    setBookingError("");
    if (!session) {
      router.push("/auth/login");
      return;
    }
    if (!checkIn || !checkOut) {
      setBookingError("Please select check-in and check-out dates.");
      return;
    }
    if (nights <= 0) {
      setBookingError("Check-out must be after check-in.");
      return;
    }

    setBooking(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId: id, checkIn, checkOut, guests }),
    });
    const data = await res.json();
    setBooking(false);
    if (!res.ok) {
      setBookingError(data.error);
      return;
    }
    setBookingSuccess(true);
  }

  async function handleSaveToggle() {
    if (!session) {
      router.push("/auth/login");
      return;
    }
    setSavingToggle(true);
    const res = await fetch(`/api/saved/${id}`, { method: "POST" });
    const data = await res.json();
    if (data.success) setSaved(data.saved);
    setSavingToggle(false);
  }

  if (loading)
    return (
      <div className="min-h-screen px-6 md:px-16 py-12 text-slate-400 text-sm">
        Loading...
      </div>
    );

  if (notFound || !campsite)
    return (
      <div className="min-h-screen px-6 md:px-16 py-12 text-slate-400 text-sm">
        Campsite not found.
      </div>
    );

  return (
    <div className="min-h-screen px-6 md:px-16 py-12 flex flex-col gap-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="text-slate-500 hover:text-slate-300 text-sm transition w-fit"
      >
        ← Back to Explore
      </button>

      {/* Hero image */}
      <div className="relative w-full h-80 rounded-2xl overflow-hidden">
        <img
          src={campsite.images[0] ?? ""}
          alt={campsite.name}
          className="w-full h-full object-cover"
        />
        <span
          className={`absolute top-4 left-4 text-xs font-medium px-3 py-1 rounded-full capitalize ${typeColors[campsite.type]}`}
        >
          {campsite.type}
        </span>
      </div>

      {/* Body */}
      <div className="flex gap-10 items-start">
        {/* Left */}
        <div className="flex-1 flex flex-col gap-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-slate-100">
                {campsite.name}
              </h1>
              <button
                onClick={handleSaveToggle}
                disabled={savingToggle}
                className={`text-3xl leading-none transition shrink-0
                ${saved ? "text-orange-500" : "text-slate-600 hover:text-slate-400"}`}
              >
                {saved ? "♥" : "♡"}
              </button>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              <span>
                📍 {campsite.wilaya}, {campsite.region}
              </span>
              <span className="text-orange-400 font-medium">
                ★ {campsite.averageRating}
              </span>
              <span>{campsite.reviewCount} reviews</span>
            </div>
          </div>

          <div className="h-px bg-white/[0.06]" />

          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
              About
            </p>
            <p className="text-slate-400 text-sm leading-relaxed">
              {campsite.description}
            </p>
          </div>

          <div className="h-px bg-white/[0.06]" />

          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
              Amenities
            </p>
            <div className="flex flex-wrap gap-2">
              {campsite.amenities.map((a) => (
                <span
                  key={a}
                  className="text-xs text-slate-400 border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 rounded-full"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>

          <div className="h-px bg-white/[0.06]" />

          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
              Reviews
            </p>
            <p className="text-slate-500 text-sm">
              No reviews yet. Be the first to review this campsite.
            </p>
          </div>
        </div>

        {/* Right - Booking card */}
        <div className="w-72 shrink-0">
          <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-orange-400">
                {campsite.pricePerNight.toLocaleString()} DZD
              </span>
              <span className="text-slate-500 text-sm">/ night</span>
            </div>

            <div className="h-px bg-white/[0.06]" />

            {bookingSuccess ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <span className="text-3xl">🏕️</span>
                <p className="text-green-400 text-sm font-medium">
                  Booking confirmed!
                </p>
                <p className="text-slate-500 text-xs">
                  Head to My Trips to manage it.
                </p>
                <button
                  onClick={() => router.push("/trips")}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2.5 rounded-xl transition"
                >
                  View My Trips
                </button>
              </div>
            ) : (
              <>
                {/* Dates */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-500 uppercase tracking-widest">
                      Check in
                    </label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="bg-[#0a0e17] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:border-orange-500/40 transition"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-500 uppercase tracking-widest">
                      Check out
                    </label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="bg-[#0a0e17] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:border-orange-500/40 transition"
                    />
                  </div>
                </div>

                {/* Guests */}
                <div className="flex items-center justify-between bg-[#0a0e17] border border-white/[0.08] rounded-lg px-3 py-2.5">
                  <span className="text-sm text-slate-400">Guests</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setGuests((g) => Math.max(1, g - 1))}
                      className="w-6 h-6 rounded-full border border-white/[0.08] text-slate-400 hover:text-slate-200 transition text-sm flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="text-sm text-slate-200 w-4 text-center">
                      {guests}
                    </span>
                    <button
                      onClick={() => setGuests((g) => Math.min(10, g + 1))}
                      className="w-6 h-6 rounded-full border border-white/[0.08] text-slate-400 hover:text-slate-200 transition text-sm flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="h-px bg-white/[0.06]" />

                {/* Summary */}
                <div className="flex flex-col gap-2">
                  {nights > 0 ? (
                    <>
                      <div className="flex justify-between text-sm text-slate-500">
                        <span>
                          {campsite.pricePerNight.toLocaleString()} DZD x{" "}
                          {nights} night{nights > 1 ? "s" : ""}
                        </span>
                        <span>{total.toLocaleString()} DZD</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium text-slate-100 pt-2 border-t border-white/[0.06]">
                        <span>Total</span>
                        <span>{total.toLocaleString()} DZD</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Select dates to see the total price.
                    </p>
                  )}
                </div>

                {bookingError && (
                  <p className="text-red-400 text-xs bg-red-400/10 px-3 py-2 rounded-lg">
                    {bookingError}
                  </p>
                )}

                <button
                  onClick={handleBook}
                  disabled={booking}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-3 rounded-xl transition disabled:opacity-50"
                >
                  {booking ? "Booking..." : "Book Now"}
                </button>

                <p className="text-xs text-slate-500 text-center">
                  You won&apos;t be charged yet
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
