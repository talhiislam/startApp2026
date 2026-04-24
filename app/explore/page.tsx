"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { type Campsite, typeLabels } from "@/types/campsite";
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
const minPrices = [
  { label: "Any", value: "" },
  { label: "From 1000 DZD", value: "1000" },
  { label: "From 2000 DZD", value: "2000" },
  { label: "From 3500 DZD", value: "3500" },
];
const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Top Rated", value: "rating" },
  { label: "Price: low \u2192 high", value: "price_asc" },
  { label: "Price: high \u2192 low", value: "price_desc" },
];

type AutocompleteSuggestion = {
  _id: string;
  name: string;
  wilaya: string;
  region: string;
  type: Campsite["type"];
  images: string[];
};

const ExploreMap = dynamic(() => import("@/components/ExploreMap"), {
  ssr: false,
});

export default function ExplorePage() {
  const router = useRouter();

  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [region, setRegion] = useState("");
  const [type, setType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<"grid" | "map">("grid");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const hasActiveFilters =
    region !== "" || type !== "" || maxPrice !== "" || minPrice !== "";

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e: Event) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    }

  }, []);

  // Debounce search input for the main results (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch autocomplete suggestions (200ms debounce for dropdown responsiveness)
  useEffect(() => {
    if (search.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSuggestionLoading(true);
      try {
        const res = await fetch(
          `/api/campsites/search/autocomplete?q=${encodeURIComponent(search)}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }
        const data = await res.json();
        if (data.success) {
          setSuggestions(data.data);
          setShowSuggestions(data.data.length > 0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        setSuggestionLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  const fetchCampsites = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (region) params.set("region", region);
    if (type) params.set("type", type);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (sort !== "newest") params.set("sort", sort);
    params.set("page", String(page));

    const res = await fetch(`/api/campsites?${params.toString()}`);
    const data = await res.json();

    if (data.success) {
      setCampsites(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages)
    }
    setLoading(false);
  }, [debouncedSearch, region, type, minPrice, maxPrice, sort, page]);

  useEffect(() => {
    if (view === "map") {
      setLoading(true);

      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (region) params.set("region", region);
      if (type) params.set("type", type);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (sort !== "newest") params.set("sort", sort);
      params.set("page", "all");

      fetch(`/api/campsites?${params.toString()}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setCampsites(data.data);
          }
        })
        .finally(() => setLoading(false));

      return;
    }

    void fetchCampsites();
  }, [fetchCampsites, view, debouncedSearch, region, type, minPrice, maxPrice, sort]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, region, type, minPrice, maxPrice, sort]);

  const clearFilters = () => {
    setRegion("");
    setType("");
    setMaxPrice("");
    setMinPrice("");
  };

  function handleSuggestionClick(suggestion: AutocompleteSuggestion) {
    setShowSuggestions(false);
    router.push(`/explore/${suggestion._id}`);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
    if (e.key === "Enter") {
      setShowSuggestions(false);
    }
  }

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
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search with autocomplete */}
        <div ref={searchContainerRef} className="relative w-full md:flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value.length >= 2) setShowSuggestions(true);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search by name, wilaya, amenities..."
            className="w-full bg-[#111827] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-orange-500/40 transition"
          />

          {/* Autocomplete dropdown */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#111827] border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden">
              {suggestionLoading ? (
                <div className="px-4 py-3 text-xs text-slate-500">
                  Searching...
                </div>
              ) : (
                suggestions.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => handleSuggestionClick(s)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition text-left"
                  >
                    {/* Thumbnail */}
                    <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-white/[0.04]">
                      {s.images[0] ? (
                        <img
                          src={s.images[0]}
                          alt={s.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                    {/* Text */}
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-slate-200 text-sm font-medium truncate">
                        {s.name}
                      </span>
                      <span className="text-slate-500 text-xs truncate">
                        {typeLabels[s.type]} {"\u00B7"} {s.wilaya}, {s.region}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex flex-1 gap-3">
          <button
            onClick={() => setDrawerOpen((prev) => !prev)}
            className={`shrink-0 flex items-center justify-center gap-2 bg-[#111827] border rounded-xl px-4 py-2.5 text-sm transition ${
              drawerOpen || hasActiveFilters
                ? "border-orange-500/40 text-orange-400"
                : "border-white/[0.08] text-slate-400 hover:text-slate-200"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 4h18l-7 9v6l-4-2v-4L3 4z" />
            </svg>
            <span className="hidden md:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            )}
          </button>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="flex-1 min-w-0 md:flex-none md:w-auto bg-[#111827] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-slate-400 outline-none focus:border-orange-500/40 transition"
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#111827]">
                {o.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setView((v) => (v === "grid" ? "map" : "grid"))}
            className={`shrink-0 flex items-center justify-center gap-2 bg-[#111827] border rounded-xl px-4 py-2.5 whitespace-nowrap text-sm transition ${
              view === "map"
                ? "border-orange-500/40 text-orange-400"
                : "border-white/[0.08] text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="text-base leading-none">
              {view === "grid" ? "\u{1F5FA}\uFE0F" : "\u25A6"}
            </span>
            <span className="hidden md:inline">
              {view === "grid" ? "Map view" : "Grid view"}
            </span>
          </button>
        </div>
      </div>

      {/* Filter Drawer */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          drawerOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-[#111827] border border-white/[0.08] rounded-2xl p-4 grid grid-cols-2 gap-6 items-start">
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

          {/* Min Price */}
          <div className="flex flex-col gap-2">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-widest">
              Min Price
            </span>
            {minPrices.map((p) => (
              <button
                key={p.value}
                onClick={() => setMinPrice(p.value)}
                className={`text-left text-sm px-3 py-1.5 rounded-lg transition ${minPrice === p.value ? "bg-orange-500/20 text-orange-400" : "text-slate-400 hover:text-slate-200"}`}
              >
                {p.label}
              </button>
            ))}
          </div>

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
        </div>

        <div className="flex items-center justify-between mt-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-slate-500 hover:text-orange-400 transition"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-slate-500 hover:text-slate-300 text-sm transition ml-auto"
          >
            {"\u2715"} Close
          </button>
        </div>
      </div>

      {/* Result count */}
      {view === "grid" && (
        <p className="text-slate-500 text-sm">
          Showing{" "}
          <span className="text-slate-300 font-medium">
            {total === 0 ? 0 : (page - 1) * 12 + 1}-{Math.min(page * 12, total)}
          </span>{" "}
          of{" "}
          <span className="text-slate-300 font-medium">{total}</span> campsites
        </p>
      )}

      {/* Grid or Map */}
      {view === "map" ? (
        <div
          style={{ height: "calc(100vh - 260px)" }}
          className="rounded-2xl overflow-hidden border border-white/[0.08]"
        >
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
          <span className="text-4xl">{"\u{1F50D}"}</span>
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
        <div className="flex flex-col gap-4">
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                {"\u2190"} Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-2 text-slate-600 text-sm"
                    >
                      {"\u2026"}
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                        page === p
                          ? "bg-orange-500 text-white"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                Next {"\u2192"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


