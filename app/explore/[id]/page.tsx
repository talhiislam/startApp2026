"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Image from "next/image";

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
      <div className="relative w-full h-80 rounded-2xl overflow-hidden">
        <Image
          src={images[activeIndex]}
          alt={`${name} — image ${activeIndex + 1}`}
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
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 text-xs text-white bg-black/60 px-2.5 py-1 rounded-full">
            {activeIndex + 1} / {images.length}
          </span>
        )}
      </div>

      {/* Thumbnail strip — only rendered when there are multiple images */}
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
    </div>
  );
}

export default function CampsiteDetailPage() {
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
  const [hoveredStar, setHoveredStar] = useState(0);

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

  async function handleBook() {
    setBookingError("");
    if (!session) {
      router.push("/auth/login");
      return;
    }
    if (!dateRange?.from || !dateRange?.to) {
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

  async function handleReviewSubmit() {
    setReviewError("");
    if (reviewRating === 0) {
      setReviewError("Please select a star rating.");
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
    <div className="min-h-screen px-6 md:px-16 pt-6 pb-12 md:py-12 flex flex-col gap-8 overflow-x-hidden">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="text-slate-500 hover:text-slate-300 text-sm transition w-fit"
      >
        ← Back to Explore
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

          {/* Owner section*/}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
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
                <p className="text-slate-200 text-sm font-medium">
                  {campsite.owner?.username ?? "Unknown"}
                </p>
                <p className="text-slate-500 text-xs">
                  Member since{" "}
                  {campsite.owner?.createdAt
                    ? new Date(campsite.owner.createdAt).toLocaleDateString(
                        "en-GB",
                        {
                          month: "long",
                          year: "numeric",
                        },
                      )
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Location section */}
          {campsite.coordinates?.lat && campsite.coordinates?.lng && (
            <>
              <div className="h-px bg-white/[0.06]" />
              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                  Location
                </p>
                <div className="h-64 w-full rounded-2xl overflow-hidden border border-white/[0.08]">
                  <CampsiteMap
                    lat={campsite.coordinates.lat}
                    lng={campsite.coordinates.lng}
                    name={campsite.name}
                  />
                </div>
                <p className="text-xs text-slate-500">
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
              <div className="absolute inset-0 z-10 rounded-2xl flex flex-col items-center justify-center gap-4 bg-[#0a0e17]/60 backdrop-blur-sm">
                <span className="text-3xl">🔒</span>
                <p className="text-slate-300 text-sm font-medium text-center px-4">
                  Sign in to book this campsite
                </p>
                <button
                  onClick={() => router.push("/auth/login")}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
                >
                  Sign in
                </button>
              </div>
            )}

            <div
              className={`bg-[#111827] border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-5 ${!session ? "blur-sm pointer-events-none select-none" : ""}`}
            >
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
                  <AvailabilityCalendar
                    campsiteId={id as string}
                    guests={guests}
                    selected={dateRange}
                    onSelect={setDateRange}
                  />

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
                        onClick={() =>
                          setGuests((g) => Math.min(campsite.capacity, g + 1))
                        }
                        className="w-6 h-6 rounded-full border border-white/[0.08] text-slate-400 hover:text-slate-200 transition text-sm flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="h-px bg-white/[0.06]" />

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

      {/* Reviews — full width, always below everything */}
      <div className="flex flex-col gap-6">
        <div className="h-px bg-white/[0.06]" />
        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
          Reviews
        </p>

        {/* Write a review */}
        {session && !hasReviewed && (
          <div className="flex flex-col gap-3 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <p className="text-sm text-slate-300 font-medium">
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
                  ★
                </button>
              ))}
            </div>

            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience..."
              rows={3}
              className="bg-[#0a0e17] border border-white/[0.08] rounded-lg p-3 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-orange-500/40 transition resize-none"
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
          <p className="text-slate-500 text-sm">
            <button
              onClick={() => router.push("/auth/login")}
              className="text-orange-500 hover:underline"
            >
              Sign in
            </button>{" "}
            to leave a review.
          </p>
        )}

        {hasReviewed && (
          <p className="text-slate-500 text-sm">
            You have already reviewed this campsite.
          </p>
        )}

        {loadingReviews ? (
          <p className="text-slate-500 text-sm">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-slate-500 text-sm">
            No reviews yet. Be the first to review this campsite.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="flex flex-col gap-2 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                      {review.user.username[0].toUpperCase()}
                    </div>
                    <span className="text-slate-300 text-sm font-medium">
                      {review.user.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400 text-sm">
                      {"★".repeat(review.rating)}
                      <span className="text-slate-600">
                        {"★".repeat(5 - review.rating)}
                      </span>
                    </span>
                    <span className="text-slate-600 text-xs">
                      {new Date(review.createdAt).toLocaleDateString(
                        "en-GB",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
