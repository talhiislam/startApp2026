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
    };
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

    try {
      const res = await fetch(`/api/campsites?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setCampsites(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch campsites:", error);
    } finally {
      setLoading(false);
    }
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
  }, [
    fetchCampsites,
    view,
    debouncedSearch,
    region,
    type,
    minPrice,
    maxPrice,
    sort,
  ]);

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
        <span className="text-sm font-medium uppercase tracking-widest" style={{ color: "var(--accent)" }}>
          Discover
        </span>
        <h1
          className="text-3xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          Explore Campsites
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
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
            className="w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--accent-border)] transition"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />

          {/* Autocomplete dropdown */}
          {showSuggestions && (
            <div
              className="absolute top-full left-0 right-0 mt-1.5 rounded-xl shadow-2xl z-50 overflow-hidden"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              {suggestionLoading ? (
                <div className="px-4 py-3 text-xs" style={{ color: "var(--text-faint)" }}>
                  Searching...
                </div>
              ) : (
                suggestions.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => handleSuggestionClick(s)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 transition text-left"
                    style={{ background: "transparent" }}
                  >
                    {/* Thumbnail */}
                    <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--bg-hover)" }}>
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
                      <span
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {s.name}
                      </span>
                      <span
                        className="text-xs truncate"
                        style={{ color: "var(--text-faint)" }}
                      >
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
            className="shrink-0 flex items-center justify-center gap-2 border rounded-xl px-4 py-2.5 text-sm transition"
            style={{
              background: "var(--bg-card)",
              borderColor:
                drawerOpen || hasActiveFilters
                  ? "var(--accent-border)"
                  : "var(--border)",
              color:
                drawerOpen || hasActiveFilters
                  ? "var(--accent)"
                  : "var(--text-muted)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 4h18l-7 9v6l-4-2v-4L3 4z" />
            </svg>
            <span className="hidden md:inline">Filters</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent-soft)" }} />
            )}
          </button>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="flex-1 min-w-0 md:flex-none md:w-auto border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--accent-border)] transition"
            style={{
              background: "var(--bg-card)",
              borderColor:
                sort !== "newest" ? "var(--accent-border)" : "var(--border)",
              color: sort !== "newest" ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value} style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>
                {o.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setView((v) => (v === "grid" ? "map" : "grid"))}
            className="shrink-0 flex items-center justify-center gap-2 border rounded-xl px-4 py-2.5 whitespace-nowrap text-sm transition"
            style={{
              background: "var(--bg-card)",
              borderColor:
                view === "map" ? "var(--accent-border)" : "var(--border)",
              color: view === "map" ? "var(--accent)" : "var(--text-muted)",
            }}
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
        <div className="grid grid-cols-2 gap-6 items-start"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "1rem",
            padding: "1rem",
          }}
        >
          {/* Region */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Region
            </span>
            <button
              onClick={() => setRegion("")}
              className={`text-left text-sm px-3 py-1.5 rounded-lg transition ${
                region === "" ? "" : ""
              }`}
              style={{
                color: region === "" ? "var(--accent-soft)" : "var(--text-muted)",
                background: region === "" ? "var(--accent-subtle)" : undefined,
              }}
            >
              All
            </button>
            {regions.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`text-left text-sm px-3 py-1.5 rounded-lg capitalize transition ${
                  region === r ? "" : ""
                }`}
                style={{
                  color: region === r ? "var(--accent-soft)" : "var(--text-muted)",
                  background: region === r ? "var(--accent-subtle)" : undefined,
                }}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Type */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Type
            </span>
            <button
              onClick={() => setType("")}
              className={`text-left text-sm px-3 py-1.5 rounded-lg transition ${
                type === "" ? "" : ""
              }`}
              style={{
                color: type === "" ? "var(--accent-soft)" : "var(--text-muted)",
                background: type === "" ? "var(--accent-subtle)" : undefined,
              }}
            >
              All
            </button>
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`text-left text-sm px-3 py-1.5 rounded-lg capitalize transition ${
                  type === t ? "" : ""
                }`}
                style={{
                  color: type === t ? "var(--accent-soft)" : "var(--text-muted)",
                  background: type === t ? "var(--accent-subtle)" : undefined,
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Min Price */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Min Price
            </span>
            {minPrices.map((p) => (
              <button
                key={p.value}
                onClick={() => setMinPrice(p.value)}
                className={`text-left text-sm px-3 py-1.5 rounded-lg transition ${
                  minPrice === p.value ? "" : ""
                }`}
                style={{
                  color:
                    minPrice === p.value ? "var(--accent-soft)" : "var(--text-muted)",
                  background:
                    minPrice === p.value ? "var(--accent-subtle)" : undefined,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Max Price */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Max Price
            </span>
            {prices.map((p) => (
              <button
                key={p.value}
                onClick={() => setMaxPrice(p.value)}
                className={`text-left text-sm px-3 py-1.5 rounded-lg transition ${
                  maxPrice === p.value ? "" : ""
                }`}
                style={{
                  color:
                    maxPrice === p.value ? "var(--accent-soft)" : "var(--text-muted)",
                  background:
                    maxPrice === p.value ? "var(--accent-subtle)" : undefined,
                }}
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
              className="text-xs transition"
              style={{ color: "var(--text-faint)" }}
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-sm transition ml-auto"
            style={{ color: "var(--text-faint)" }}
          >
            {"\u2715"} Close
          </button>
        </div>
      </div>

      {/* Result count */}
      {view === "grid" && (
        <p className="text-sm" style={{ color: "var(--text-faint)" }}>
          Showing{" "}
          <span style={{ color: "var(--text-primary)" }} className="font-medium">
            {total === 0 ? 0 : (page - 1) * 12 + 1}-{Math.min(page * 12, total)}
          </span>{" "}
          of{" "}
          <span style={{ color: "var(--text-primary)" }} className="font-medium">
            {total}
          </span>{" "}
          campsites
        </p>
      )}

      {/* Grid or Map */}
      {view === "map" ? (
        <div
          style={{ height: "calc(100vh - 260px)", borderColor: "var(--border)" }}
          className="rounded-2xl overflow-hidden border"
        >
          <ExploreMap campsites={campsites} />
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="border rounded-2xl h-64 animate-pulse"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            />
          ))}
        </div>
      ) : campsites.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="text-4xl">{"\u{1F50D}"}</span>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No campsites found for your search.
          </p>
          <button
            onClick={() => {
              setSearch("");
              clearFilters();
            }}
            className="text-sm hover:underline"
            style={{ color: "var(--accent)" }}
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
                className="px-3 py-2 rounded-lg text-sm disabled:opacity-30 disabled:cursor-not-allowed transition"
                style={{ color: "var(--text-muted)" }}
              >
                {"\u2190"} Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                )
                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-2 text-sm"
                      style={{ color: "var(--text-ghost)" }}
                    >
                      {"\u2026"}
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                        page === p
                          ? "text-white"
                          : ""
                      }`}
                      style={
                        page === p
                          ? { background: "var(--accent)" }
                          : { color: "var(--text-muted)" }
                      }
                    >
                      {p}
                    </button>
                  ),
                )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-lg text-sm disabled:opacity-30 disabled:cursor-not-allowed transition"
                style={{ color: "var(--text-muted)" }}
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
