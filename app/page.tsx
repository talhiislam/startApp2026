import Link from "next/link";
import { connectToDatabase } from "@/lib/mongodb";
import Image from "next/image";

import CampingSite from "@/models/CampingSite";
import CampsiteCard from "@/components/CampsiteCard";
import type { Types } from "mongoose";
import { type Campsite } from "@/types/campsite";
import HowItWorks from "@/components/HowItWorks";
import Hero from "@/components/Hero";

type LeanCampsite = {
  _id: Types.ObjectId;
  name: string;
  wilaya: string;
  region: string;
  type: "tent" | "bungalow" | "wild" | "glamping";
  images: string[];
  pricePerNight: number;
  capacity?: number;
  description?: string;
  amenities?: string[];
  averageRating?: number;
  reviewCount?: number;
};

async function getFeaturedCampsites(): Promise<Campsite[]> {
  try {
    await connectToDatabase();
    const campsites = await CampingSite.find({ isApproved: true })
      .sort({ averageRating: -1 })
      .limit(3)
      .lean<LeanCampsite[]>();

    return campsites.map((c) => ({
      _id: c._id.toString(),
      name: c.name,
      wilaya: c.wilaya,
      region: c.region,
      type: c.type,
      images: c.images,
      pricePerNight: c.pricePerNight,
      capacity: c.capacity ?? 10,
      description: c.description ?? "",
      amenities: c.amenities ?? [],
      averageRating: c.averageRating ?? 0,
      reviewCount: c.reviewCount ?? 0,
    }));
  } catch {
    return [];
  }
}

const reviews = [
  {
    name: "Yacine B.",
    city: "Algiers",
    text: "Finally an app made for Algerian campers. Found an amazing spot in Tassili I never would have discovered on my own.",
    rating: 5,
  },
  {
    name: "Amira K.",
    city: "Oran",
    text: "The trip planner and packing checklist saved us so much time. Everything was organized before we even left home.",
    rating: 5,
  },
  {
    name: "Riadh M.",
    city: "Constantine",
    text: "Great selection of campsites in Kabylie. The region filter makes it super easy to find spots close to home.",
    rating: 4,
  },
];

export default async function Home() {
  const featuredCampsites = await getFeaturedCampsites();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <Hero />

      {/* Featured Campsites */}
      <section className="px-6 md:px-16 py-20 flex flex-col gap-10">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              Featured
            </span>
            <h2
              className="text-3xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Top Campsites
            </h2>
          </div>
          <Link
            href="/explore"
            className="text-sm transition"
            style={{ color: "var(--text-muted)" }}
          >
            View all →
          </Link>
        </div>

        {featuredCampsites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCampsites.map((campsite) => (
              <CampsiteCard
                key={campsite._id}
                id={campsite._id}
                name={campsite.name}
                location={campsite.wilaya}
                region={campsite.region}
                type={campsite.type}
                image={campsite.images[0] ?? ""}
                price={campsite.pricePerNight}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl h-64 animate-pulse"
                style={{ background: "var(--bg-card)" }}
              />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <HowItWorks />

      {/* Reviews */}
      <section className="px-6 md:px-16 py-20 flex flex-col gap-10">
        <div className="flex flex-col gap-2 text-center">
          <span className="text-sm font-medium uppercase tracking-widest" style={{ color: "var(--accent)" }}>
            Reviews
          </span>
          <h2
            className="text-3xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            What Campers Say
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div
              key={review.name}
              className="rounded-2xl p-6 flex flex-col gap-4"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex gap-1">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <span key={i} className="text-sm" style={{ color: "var(--accent-soft)" }}>★</span>
                ))}
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                &quot;{review.text}&quot;
              </p>
              <div className="flex flex-col mt-auto">
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {review.name}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--text-faint)" }}
                >
                  {review.city}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
