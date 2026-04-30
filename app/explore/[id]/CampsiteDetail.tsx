"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Image from "next/image";

import ConfirmModal from "@/components/ConfirmModal";
import { useToast } from "@/components/ToastProvider";
import { type Campsite, typeColors } from "@/types/campsite";

const CampsiteMap = dynamic(() => import("@/components/CampsiteMap"), {
  ssr: false,
});

const AvailabilityCalendar = dynamic(
  () => import("@/components/AvailabilityCalendar"),
  { ssr: false },
);

type Review = {
  _id: string;
  user: { username: string; avatar?: string };
  rating: number;
  comment: string;
  createdAt: string;
};

type DateRange = { from?: Date; to?: Date };

function CampsiteGallery({
  images,
  name,
  type,
}: {
  images: string[];
  name: string;
  type: Campsite["type"];
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) => (i - 1 + images.length) % images.length);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxOpen, images.length]);

  if (images.length === 0) {
    return (
      <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-[#111827] flex items-center justify-center">
        <span className="text-slate-600 text-sm">No images available</span>
        <span
          className={`absolute top-4 left-4 text-xs font-medium px-3 py-1 rounded-full capitalize ${typeColors[type]}`}
        >
          {type}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Main image */}
      <div
        className="relative w-full h-80 rounded-2xl overflow-hidden cursor-pointer group"
        onClick={() => {
          setLightboxIndex(activeIndex);
          setLightboxOpen(true);
        }}
      >
        <Image
          src={images[activeIndex]}
          alt={`${name} - image ${activeIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 66vw, 800px"
          className="object-cover transition-opacity duration-200"
          priority={activeIndex === 0}
        />
        <span
          className={`absolute top-4 left-4 text-xs font-medium px-3 py-1 rounded-full capitalize ${typeColors[type]}`}
        >
          {type}
        </span>
        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs bg-black/50 px-3 py-1.5 rounded-full">
            View fullscreen
          </span>
        </div>
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 text-xs text-white bg-black/60 px-2.5 py-1 rounded-full">
            {activeIndex + 1} / {images.length}
          </span>
        )}
      </div>

      {/* Thumbnail strip - only rendered when there are multiple images */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`relative shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all duration-150 focus:outline-none ${
                i === activeIndex
                  ? "border-orange-500"
                  : "border-transparent opacity-60 hover:opacity-90"
              }`}
            >
              <Image
                src={src}
                alt={`${name} thumbnail ${i + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg transition z-10"
          >
            ✕
          </button>

          {/* Prev arrow */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(
                  (i) => (i - 1 + images.length) % images.length,
                );
              }}
              className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg transition z-10"
            >
              ‹
            </button>
          )}

          {/* Main lightbox image */}
          <div
            className="relative w-full h-full max-w-5xl max-h-[90vh] mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightboxIndex]}
              alt={`${name} - image ${lightboxIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {/* Next arrow */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i + 1) % images.length);
              }}
              className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg transition z-10"
            >
              ›
            </button>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white bg-black/50 px-3 py-1.5 rounded-full">
              {lightboxIndex + 1} / {images.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function CampsiteDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [campsite, setCampsite] = useState<Campsite | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [guests, setGuests] = useState(2);

  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [saved, setSaved] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  const [hoveredStar, setHoveredStar] = useState(0);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const { toast } = useToast();

  const nights =
    dateRange?.from && dateRange?.to
      ? Math.max(
          0,
          Math.round(
            (dateRange.to.getTime() - dateRange.from.getTime()) /
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

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      const res = await fetch(`/api/campsites/${id}/reviews`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
        if (session) {
          setHasReviewed(
            data.data.some(
              (r: Review) => r.user.username === session.user.username,
            ),
          );
        }
      }
      setLoadingReviews(false);
    };
    fetchReviews();
  }, [id, session]);

  function openAuthPrompt() {
    setAuthPromptOpen(true);
  }

  async function handleBook() {
    setBookingError("");
    if (!session) {
      openAuthPrompt();
      return;
    }
    if (!dateRange?.from || !dateRange?.to) {
      toast(
        "warning",
        "Select your dates",
        "Please pick a check-in and check-out date.",
      );
      return;
    }
    if (nights <= 0) {
      toast("warning", "Invalid dates", "Check-out must be after check-in.");
      return;
    }

    setBooking(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteId: id,
        checkIn: dateRange!.from!.toISOString(),
        checkOut: dateRange!.to!.toISOString(),
        guests,
      }),
    });
    const data = await res.json();
    setBooking(false);
    if (!res.ok) {
      toast("error", "Booking failed", data.error);
      setBookingError(data.error);
      return;
    }
    setBookingSuccess(true);
    toast("success", "Booking submitted", "Head to My Trips to manage it.");
  }

  async function handleSaveToggle() {
    if (!session) {
      openAuthPrompt();
      return;
    }
    setSavingToggle(true);
    const res = await fetch(`/api/saved/${id}`, { method: "POST" });
    const data = await res.json();
    if (data.success) {
      setSaved(data.saved);
      if (data.saved) {
        toast("info", "Saved to wishlist", "Find it in My Trips -> Saved.");
      } else {
        toast("info", "Removed from saved", "You can save it again anytime.");
      }
    } else {
      toast(
        "error",
        "Something went wrong",
        "Could not update your saved list.",
      );
    }
    setSavingToggle(false);
  }

  async function handleReviewSubmit() {
    setReviewError("");
    if (reviewRating === 0) {
      toast(
        "warning",
        "Select a rating",
        "Please pick a star rating before submitting.",
      );
      return;
    }
    setSubmittingReview(true);
    const res = await fetch(`/api/campsites/${id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
    });
    const data = await res.json();
    setSubmittingReview(false);
    if (!res.ok) {
      setReviewError(data.error);
      toast("error", "Review failed", data.error);
      return;
    }
    setReviews((prev) => [data.data, ...prev]);
    setHasReviewed(true);
    setReviewRating(0);
    setReviewComment("");
    setCampsite((prev) =>
      prev
        ? {
            ...prev,
            reviewCount: prev.reviewCount + 1,
            averageRating:
              Math.round(
                ((prev.averageRating * prev.reviewCount + reviewRating) /
                  (prev.reviewCount + 1)) *
                  10,
              ) / 10,
          }
        : prev,
    );
    toast("success", "Review submitted", "Thanks for sharing your experience.");
  }

  async function handleReviewDelete(reviewId: string) {
    const res = await fetch(`/api/campsites/${id}/reviews/${reviewId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast("error", "Something went wrong", "Could not delete your review.");
      return;
    }
    setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    setHasReviewed(false);
    setCampsite((prev) =>
      prev
        ? {
            ...prev,
            reviewCount: Math.max(0, prev.reviewCount - 1),
            averageRating:
              prev.reviewCount <= 1
                ? 0
                : Math.round(
                    ((prev.averageRating * prev.reviewCount -
                      (reviews.find((r) => r._id === reviewId)?.rating ?? 0)) /
                      (prev.reviewCount - 1)) *
                      10,
                  ) / 10,
          }
        : prev,
    );
    toast("success", "Review deleted");
  }

  if (loading)
    return (
      <div className="min-h-screen px-6 md:px-16 pt-6 pb-12 md:py-12 flex flex-col gap-8">
        {/* Back */}
        <div className="w-24 h-4 bg-white/[0.06] rounded-full animate-pulse" />

        {/* Gallery skeleton */}
        <div
          className="w-full h-80 rounded-2xl animate-pulse"
          style={{ background: "var(--bg-card)" }}
        />

        {/* Body */}
        <div className="flex flex-col md:flex-row gap-10 items-start">
          {/* Left */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Title */}
            <div className="flex flex-col gap-2">
              <div className="w-64 h-7 bg-white/[0.06] rounded-lg animate-pulse" />
              <div className="w-48 h-4 bg-white/[0.04] rounded-lg animate-pulse" />
            </div>

            <div className="h-px" style={{ background: "var(--border-subtle)" }} />

            {/* About */}
            <div className="flex flex-col gap-2">
              <div className="w-16 h-3 bg-white/[0.04] rounded animate-pulse" />
              <div className="w-full h-4 bg-white/[0.06] rounded animate-pulse" />
              <div className="w-full h-4 bg-white/[0.06] rounded animate-pulse" />
              <div className="w-3/4 h-4 bg-white/[0.06] rounded animate-pulse" />
            </div>

            <div className="h-px" style={{ background: "var(--border-subtle)" }} />

            {/* Amenities */}
            <div className="flex flex-col gap-3">
              <div className="w-20 h-3 bg-white/[0.04] rounded animate-pulse" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-20 h-7 bg-white/[0.06] rounded-full animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right — booking card skeleton */}
          <div className="w-full md:w-72 md:shrink-0">
            <div
              className="rounded-2xl p-6 flex flex-col gap-5"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="w-40 h-7 bg-white/[0.06] rounded-lg animate-pulse" />
              <div className="h-px" style={{ background: "var(--border-subtle)" }} />
              <div className="w-full h-64 bg-white/[0.04] rounded-xl animate-pulse" />
              <div className="w-full h-10 bg-white/[0.06] rounded-xl animate-pulse" />
              <div className="w-full h-12 bg-orange-500/20 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );

  if (notFound || !campsite)
    return (
      <div className="min-h-screen px-6 md:px-16 py-12 text-slate-400 text-sm">
        Campsite not found.
      </div>
    );

  return (
    <div className="min-h-screen px-6 md:px-16 pt-6 pb-12 md:py-12 flex flex-col gap-8 overflow-x-hidden">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="text-sm transition w-fit"
        style={{ color: "var(--text-faint)" }}
      >
        &larr; Back to Explore
      </button>

      {/* Gallery */}
      <CampsiteGallery
        images={campsite.images}
        name={campsite.name}
        type={campsite.type}
      />

      {/* Body */}
      <div className="flex flex-col md:flex-row gap-10 items-start">
        {/* Left */}
        <div className="flex-1 w-full flex flex-col gap-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                {campsite.name}
              </h1>
              <button
                onClick={handleSaveToggle}
                disabled={savingToggle}
                className={`text-3xl leading-none transition shrink-0
                ${saved ? "text-orange-500" : "text-slate-600 hover:text-slate-400"}`}
              >
                {saved ? "\u2665" : "\u2661"}
              </button>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm" style={{ color: "var(--text-faint)" }}>
              <span>
                {"\u{1F4CD}"} {campsite.wilaya}, {campsite.region}
              </span>
              <span className="text-orange-400 font-medium">
                {"\u2605"} {campsite.averageRating}
              </span>
              <span>{campsite.reviewCount} reviews</span>
            </div>
          </div>

          <div className="h-px" style={{ background: "var(--border-subtle)" }} />

          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              About
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {campsite.description}
            </p>
          </div>

          <div className="h-px" style={{ background: "var(--border-subtle)" }} />

          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Amenities
            </p>
            <div className="flex flex-wrap gap-2">
              {campsite.amenities.map((a) => (
                <span
                  key={a}
                  className="text-xs px-3 py-1.5 rounded-full"
                  style={{
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                    background: "var(--bg-hover)",
                  }}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>

          <div className="h-px" style={{ background: "var(--border-subtle)" }} />

          {/* Owner section*/}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Hosted by
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                {campsite.owner?.avatar ? (
                  <img
                    src={campsite.owner.avatar}
                    alt={campsite.owner.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (campsite.owner?.username?.[0]?.toUpperCase() ?? "?")
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {campsite.owner?.username ?? "Unknown"}
                </p>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                  Member since{" "}
                  {campsite.owner?.createdAt
                    ? new Date(campsite.owner.createdAt).toLocaleDateString(
                        "en-GB",
                        {
                          month: "long",
                          year: "numeric",
                        },
                      )
                    : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Location section */}
          {campsite.coordinates?.lat != null &&
            campsite.coordinates?.lng != null && (
              <>
                <div className="h-px" style={{ background: "var(--border-subtle)" }} />
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    Location
                  </p>
                  <div className="h-64 w-full rounded-2xl overflow-hidden border border-white/[0.08]">
                    <CampsiteMap
                      lat={campsite.coordinates.lat}
                      lng={campsite.coordinates.lng}
                      name={campsite.name}
                    />
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-faint)" }}>
                    {campsite.wilaya}, {campsite.region}
                  </p>
                </div>
              </>
            )}
        </div>

        {/* Right - Booking card */}
        <div className="w-full md:w-72 md:shrink-0 order-1 md:order-2">
          <div className="relative">
            {!session && (
              <div
                className="absolute inset-0 z-10 rounded-2xl flex flex-col items-center justify-center gap-4 backdrop-blur-sm"
                style={{
                  background:
                    "color-mix(in srgb, var(--bg-base) 60%, transparent)",
                }}
              >
                <span className="text-3xl">{"\u{1F512}"}</span>
                <p
                  className="text-sm font-medium text-center px-4"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Sign in to book this campsite
                </p>
                <button
                  onClick={openAuthPrompt}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
                >
                  Sign in
                </button>
              </div>
            )}

            <div
              className={`rounded-2xl p-6 flex flex-col gap-5 ${!session ? "blur-sm pointer-events-none select-none" : ""}`}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-orange-400">
                  {campsite.pricePerNight.toLocaleString()} DZD
                </span>
                <span className="text-slate-500 text-sm">/ night</span>
              </div>

              <div className="h-px" style={{ background: "var(--border-subtle)" }} />

              {bookingSuccess ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <span className="text-3xl">{"\u2714\uFE0F"}</span>
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
                  <AvailabilityCalendar
                    campsiteId={id as string}
                    guests={guests}
                    selected={dateRange}
                    onSelect={setDateRange}
                  />

                  <div
                    className="flex items-center justify-between rounded-lg px-3 py-2.5"
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Guests
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setGuests((g) => Math.max(1, g - 1))}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-sm transition"
                        style={{
                          border: "1px solid var(--border)",
                          color: "var(--text-muted)",
                        }}
                      >
                        -
                      </button>
                      <span className="text-sm text-slate-200 w-4 text-center">
                        {guests}
                      </span>
                      <button
                        onClick={() =>
                          setGuests((g) => Math.min(campsite.capacity, g + 1))
                        }
                        className="w-6 h-6 rounded-full flex items-center justify-center text-sm transition"
                        style={{
                          border: "1px solid var(--border)",
                          color: "var(--text-muted)",
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="h-px" style={{ background: "var(--border-subtle)" }} />

                  <div className="flex flex-col gap-2">
                    {nights > 0 ? (
                      <>
                        <div
                          className="flex justify-between text-sm"
                          style={{ color: "var(--text-faint)" }}
                        >
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

      {/* Reviews - full width, always below everything */}
      <div className="flex flex-col gap-6">
        <div className="h-px" style={{ background: "var(--border-subtle)" }} />
        <p
          className="text-xs font-medium uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Reviews
        </p>

        {/* Write a review */}
        {session && !hasReviewed && (
          <div
            className="flex flex-col gap-3 rounded-xl p-4"
            style={{
              background: "var(--bg-hover)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Write a Review
            </p>

            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setReviewRating(star)}
                  className={`text-2xl transition ${
                    star <= (hoveredStar || reviewRating)
                      ? "text-orange-400"
                      : "text-slate-600"
                  }`}
                >
                  {"\u2605"}
                </button>
              ))}
            </div>

            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
              className="rounded-lg p-3 text-sm outline-none transition resize-none"
            />

            {reviewError && (
              <p className="text-red-400 text-xs bg-red-400/10 px-3 py-2 rounded-lg">
                {reviewError}
              </p>
            )}

            <button
              onClick={handleReviewSubmit}
              disabled={submittingReview}
              className="self-start bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        )}

        {!session && (
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            <button
              onClick={openAuthPrompt}
              className="text-orange-500 hover:underline"
            >
              Sign in
            </button>{" "}
            to leave a review.
          </p>
        )}

        {hasReviewed && (
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            You have already reviewed this campsite.
          </p>
        )}

        {loadingReviews ? (
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            Loading reviews...
          </p>
        ) : reviews.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            No reviews yet. Be the first to review this campsite.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="flex flex-col gap-2 rounded-xl p-4"
                style={{
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
                      {review.user.avatar ? (
                        <img
                          src={review.user.avatar}
                          alt={review.user.username}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        review.user.username[0].toUpperCase()
                      )}
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {review.user.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400 text-sm">
                      {"\u2605".repeat(review.rating)}
                      <span className="text-slate-600">
                        {"\u2606".repeat(5 - review.rating)}
                      </span>
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-ghost)" }}>
                      {new Date(review.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {session?.user.username === review.user.username && (
                      <button
                        onClick={() => setReviewToDelete(review._id)}
                        className="w-6 h-6 rounded-full bg-white/5 hover:bg-red-500/20 text-slate-600 hover:text-red-400 flex items-center justify-center text-xs transition"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                {review.comment && (
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={authPromptOpen}
        title="Sign in required"
        message="You need to log in or sign up before using this feature."
        confirmLabel="Log In"
        secondaryLabel="Sign Up"
        cancelLabel="Stay here"
        variant="warning"
        onConfirm={() => {
          setAuthPromptOpen(false);
          router.push("/auth/login");
        }}
        onSecondary={() => {
          setAuthPromptOpen(false);
          router.push("/auth/signup");
        }}
        onCancel={() => {
          setAuthPromptOpen(false);
        }}
      />

      <ConfirmModal
        open={reviewToDelete !== null}
        title="Delete your review?"
        message="This will permanently remove your review. You'll be able to leave a new one after."
        confirmLabel="Delete"
        cancelLabel="Keep it"
        variant="danger"
        onConfirm={() => {
          if (reviewToDelete) handleReviewDelete(reviewToDelete);
          setReviewToDelete(null);
        }}
        onCancel={() => setReviewToDelete(null)}
      />
    </div>
  );
}
