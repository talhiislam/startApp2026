import Link from "next/link";
import { playfair } from "@/app/layout";
import CampsiteCard from "@/components/CampsiteCard";

const featuredCampsites = [
  {
    id: "1",
    name: "Tamanrasset Desert Camp",
    location: "Tamanrasset",
    region: "Hoggar",
    type: "wild" as const,
    image: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=80",
    price: 2500,
  },
  {
    id: "2",
    name: "Tassili Plateau Camp",
    location: "Djanet",
    region: "Tassili n'Ajjer",
    type: "tent" as const,
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80",
    price: 1800,
  },
  {
    id: "3",
    name: "Tikjda Mountain Camp",
    location: "Tikjda",
    region: "Kabylie",
    type: "bungalow" as const,
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80",
    price: 3200,
  },
];

const steps = [
  {
    number: "01",
    title: "Find a Campsite",
    description: "Browse hundreds of campsites across Algeria — from Sahara dunes to mountain forests and coastal spots.",
  },
  {
    number: "02",
    title: "Plan Your Trip",
    description: "Save your favorites, set your dates, and build a packing checklist tailored to your destination.",
  },
  {
    number: "03",
    title: "Go Camping",
    description: "Head out with everything organized. Contact the campsite owner directly and enjoy the adventure.",
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

export default function Home() {
  return (
    <div className="flex flex-col">

      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center text-center">
        <img
          src="/hero.jpg"
          alt="Algeria landscape"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-10 flex flex-col items-center gap-6 px-6">
          {/* Badge */}
          <span className="text-xs font-medium px-4 py-1.5 rounded-full border border-orange-500/40 text-orange-400 tracking-widest uppercase">
            Discover Algeria
          </span>

          <h1 className={`${playfair.className} text-5xl md:text-6xl font-bold text-white leading-tight max-w-2xl`}>
            Algeria&apos;s <span className="text-orange-500">Campsites,</span><br />All in One Place
          </h1>
          <p className="text-slate-300 text-lg max-w-md" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
            Discover the best camping spots across Algeria — from the Sahara to the coast.
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
            <span className="text-orange-500 text-sm font-medium uppercase tracking-widest">Featured</span>
            <h2 className="text-3xl font-bold text-slate-100">Top Campsites</h2>
          </div>
          <Link href="/explore" className="text-sm text-slate-400 hover:text-orange-500 transition">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCampsites.map((campsite) => (
              <CampsiteCard key={campsite.id} {...campsite} />
            ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 md:px-16 py-20 bg-[#111827] flex flex-col gap-10">
        <div className="flex flex-col gap-2 text-center">
          <span className="text-orange-500 text-sm font-medium uppercase tracking-widest">Simple</span>
          <h2 className="text-3xl font-bold text-slate-100">How It Works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col gap-4">
              <span className="text-5xl font-bold text-orange-500/80">{step.number}</span>
              <h3 className="text-slate-100 font-semibold text-lg">{step.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="px-6 md:px-16 py-20 flex flex-col gap-10">
        <div className="flex flex-col gap-2 text-center">
          <span className="text-orange-500 text-sm font-medium uppercase tracking-widest">Reviews</span>
          <h2 className="text-3xl font-bold text-slate-100">What Campers Say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div key={review.name} className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex gap-1">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <span key={i} className="text-orange-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">&quot;{review.text}&quot;</p>
              <div className="flex flex-col mt-auto">
                <span className="text-slate-100 text-sm font-medium">{review.name}</span>
                <span className="text-slate-500 text-xs">{review.city}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}