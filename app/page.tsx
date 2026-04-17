import Link from "next/link";
import { playfair } from "@/app/layout";
import { connectToDatabase } from "@/lib/mongodb";
import Image from "next/image";

import CampingSite from "@/models/CampingSite";
import CampsiteCard from "@/components/CampsiteCard";
import type { Types } from "mongoose";
import { type Campsite } from "@/types/campsite";

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
}

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

const steps = [
  {
    number: "01",
    title: "Find a Campsite",
    description:
      "Browse hundreds of campsites across Algeria — from Sahara dunes to mountain forests and coastal spots.",
  },
  {
    number: "02",
    title: "Plan Your Trip",
    description:
      "Save your favorites, set your dates, and build a packing checklist tailored to your destination.",
  },
  {
    number: "03",
    title: "Go Camping",
    description:
      "Head out with everything organized. Contact the campsite owner directly and enjoy the adventure.",
  },
];

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
      <section className="relative h-screen flex items-center justify-center text-center">
        <Image
          src="/hero.jpg"
          alt="Algeria landscape"
          fill
          sizes="100vw"
          className="absolute inset-0 object-cover"
          priority
        />
        <div className="relative z-10 flex flex-col items-center gap-6 px-6">
          <span className="text-xs font-medium px-4 py-1.5 rounded-full border border-orange-500/40 text-orange-400 tracking-widest uppercase">
            Discover Algeria
          </span>
          <h1
            className={`${playfair.className} text-5xl md:text-6xl font-bold text-white leading-tight max-w-2xl`}
          >
            Algeria&apos;s <span className="text-orange-500">Campsites,</span>
            <br />
            All in One Place
          </h1>
          <p
            className="text-slate-300 text-lg max-w-md"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
          >
            Discover the best camping spots across Algeria — from the Sahara to
            the coast.
          </p>
          <Link
            href="/explore"
            className="bg-orange-500 text-white px-6 py-3 rounded-xl font-medium text-base hover:bg-orange-600 transition-all duration-300 mt-2"
          >
            Explore Campsites →
          </Link>
        </div>
      </section>

      {/* Featured Campsites */}
      <section className="px-6 md:px-16 py-20 flex flex-col gap-10">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-orange-500 text-sm font-medium uppercase tracking-widest">
              Featured
            </span>
            <h2 className="text-3xl font-bold text-slate-100">Top Campsites</h2>
          </div>
          <Link
            href="/explore"
            className="text-sm text-slate-400 hover:text-orange-500 transition"
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
            {/* Fallback skeleton cards while DB is empty */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#111827] border border-white/[0.08] rounded-2xl h-64 animate-pulse"
              />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="px-6 md:px-16 py-20 bg-[#111827] flex flex-col gap-10">
        <div className="flex flex-col gap-2 text-center">
          <span className="text-orange-500 text-sm font-medium uppercase tracking-widest">
            Simple
          </span>
          <h2 className="text-3xl font-bold text-slate-100">How It Works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col gap-4">
              <span className="text-5xl font-bold text-orange-500/80">
                {step.number}
              </span>
              <h3 className="text-slate-100 font-semibold text-lg">
                {step.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="px-6 md:px-16 py-20 flex flex-col gap-10">
        <div className="flex flex-col gap-2 text-center">
          <span className="text-orange-500 text-sm font-medium uppercase tracking-widest">
            Reviews
          </span>
          <h2 className="text-3xl font-bold text-slate-100">
            What Campers Say
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div
              key={review.name}
              className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-4"
            >
              <div className="flex gap-1">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <span key={i} className="text-orange-400 text-sm">
                    ★
                  </span>
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                &quot;{review.text}&quot;
              </p>
              <div className="flex flex-col mt-auto">
                <span className="text-slate-100 text-sm font-medium">
                  {review.name}
                </span>
                <span className="text-slate-500 text-xs">{review.city}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
