"use client";

import { useEffect, useState, useCallback } from "react";
import { type Campsite } from "@/types/campsite";
import dynamic from "next/dynamic";

import CampsiteCard from "@/components/CampsiteCard";

const regions = ["sahara", "kabylie", "hoggar", "coastal", "other"];
const types = ["tent", "bungalow", "wild", "glamping"];
const prices = [
  { label: "Any", value: "" },
  { label: "Up to 2000 DZD", value: "2000" },
  { label: "Up to 3500 DZD", value: "3500" },
  { label: "Up to 5000 DZD", value: "5000" },
];
const ExploreMap = dynamic(() => import("@/components/ExploreMap"), { ssr: false });

export default function ExplorePage() {
  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [region, setRegion] = useState("");
  const [type, setType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [view, setView] = useState<"grid" | "map">("grid");

  const hasActiveFilters = region !== "" || type !== "" || maxPrice !== "";

  // Debounce search input — waits 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCampsites = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (region) params.set("region", region);
    if (type) params.set("type", type);
    if (maxPrice) params.set("maxPrice", maxPrice);

    const res = await fetch(`/api/campsites?${params.toString()}`);
    const data = await res.json();

    if (data.success) setCampsites(data.data);
    setLoading(false);
  }, [debouncedSearch, region, type, maxPrice]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchCampsites();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchCampsites]);

  const clearFilters = () => {
    setRegion("");
    setType("");
    setMaxPrice("");
  };

  return (
    <div className="min-h-screen px-6 md:px-16 py-12 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="text-orange-500 text-sm font-medium uppercase tracking-widest">
          Discover
        </span>
        <h1 className="text-3xl font-bold text-slate-100">Explore Campsites</h1>
        <p className="text-slate-400 text-sm">
          Filter by region, type, or budget to find your perfect spot.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, wilaya, or region..."
          className="flex-1 bg-[#111827] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-orange-500/40 transition"
        />
        <button
          onClick={() => setDrawerOpen((prev) => !prev)}
          className={`flex items-center gap-2 bg-[#111827] border rounded-xl px-4 py-2.5 text-sm transition ${
            drawerOpen || hasActiveFilters
              ? "border-orange-500/40 text-orange-400"
              : "border-white/[0.08] text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>⚙</span> Filters
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          )}
        </button>
        <button
          onClick={() => setView((v) => v === "grid" ? "map" : "grid")}
          className={`flex items-center gap-2 bg-[#111827] border rounded-xl px-4 py-2.5 text-sm transition ${
            view === "map"
              ? "border-orange-500/40 text-orange-400"
              : "border-white/[0.08] text-slate-400 hover:text-slate-200"
          }`}
        >
          {view === "grid" ? "🗺 Map view" : "⊞ Grid view"}
        </button>
      </div>

      {/* Filter Drawer */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          drawerOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-6 flex gap-8 items-start">
          {/* Region */}
          <div className="flex flex-col gap-2">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-widest">
              Region
            </span>
            <button
              onClick={() => setRegion("")}
              className={`text-left text-sm px-3 py-1.5 rounded-lg transition ${region === "" ? "bg-orange-500/20 text-orange-400" : "text-slate-400 hover:text-slate-200"}`}
            >
              All
            </button>
            {regions.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`text-left text-sm px-3 py-1.5 rounded-lg capitalize transition ${region === r ? "bg-orange-500/20 text-orange-400" : "text-slate-400 hover:text-slate-200"}`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="w-px self-stretch bg-white/[0.06]" />

          {/* Type */}
          <div className="flex flex-col gap-2">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-widest">
              Type
            </span>
            <button
              onClick={() => setType("")}
              className={`text-left text-sm px-3 py-1.5 rounded-lg transition ${type === "" ? "bg-orange-500/20 text-orange-400" : "text-slate-400 hover:text-slate-200"}`}
            >
              All
            </button>
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`text-left text-sm px-3 py-1.5 rounded-lg capitalize transition ${type === t ? "bg-orange-500/20 text-orange-400" : "text-slate-400 hover:text-slate-200"}`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="w-px self-stretch bg-white/[0.06]" />

          {/* Max Price */}
          <div className="flex flex-col gap-2">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-widest">
              Max Price
            </span>
            {prices.map((p) => (
              <button
                key={p.value}
                onClick={() => setMaxPrice(p.value)}
                className={`text-left text-sm px-3 py-1.5 rounded-lg transition ${maxPrice === p.value ? "bg-orange-500/20 text-orange-400" : "text-slate-400 hover:text-slate-200"}`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="ml-auto flex flex-col items-end justify-between self-stretch">
            <button
              onClick={() => setDrawerOpen(false)}
              className="text-slate-500 hover:text-slate-300 text-lg transition"
            >
              ✕
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-slate-500 hover:text-orange-400 transition"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Result count */}
      {view === "grid" && (
        <p className="text-slate-500 text-sm">
          <span className="text-slate-300 font-medium">{campsites.length}</span>{" "}
          campsites found
        </p>
      )}

      {/* Grid or Map */}
      {view === "map" ? (
        <div style={{ height: "calc(100vh - 260px)" }} className="rounded-2xl overflow-hidden border border-white/[0.08]">
          <ExploreMap campsites={campsites} />
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-[#111827] border border-white/[0.08] rounded-2xl h-64 animate-pulse"
            />
          ))}
        </div>
      ) : campsites.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="text-4xl">🏕️</span>
          <p className="text-slate-400 text-sm">
            No campsites found for your search.
          </p>
          <button
            onClick={() => {
              setSearch("");
              clearFilters();
            }}
            className="text-orange-500 text-sm hover:underline"
          >
            Clear search and filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {campsites.map((c) => (
            <CampsiteCard
              key={c._id}
              id={c._id}
              name={c.name}
              location={c.wilaya}
              region={c.region}
              type={c.type}
              image={c.images[0] ?? ""}
              price={c.pricePerNight}
            />
          ))}
        </div>
      )}
    </div>
  );
}
