"use client";

import { useEffect, useState, useCallback } from "react";
import { type Product, categoryLabels } from "@/types/product";
import ProductCard from "@/components/ProductCard";

const categories: Product["category"][] = [
  "tents",
  "sleeping",
  "cooking",
  "backpacks",
  "lighting",
  "tools",
  "other",
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (category) params.set("category", category);

    try {
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="min-h-screen px-6 md:px-16 py-12 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <span
          className="text-sm font-medium uppercase tracking-widest"
          style={{ color: "var(--accent)" }}
        >
          Gear Up
        </span>
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
          Camping Products
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Everything you need for your next trip, curated by our team.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full md:flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--accent-border)] transition"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--accent-border)] transition"
          style={{
            background: "var(--bg-card)",
            borderColor: category ? "var(--accent-border)" : "var(--border)",
            color: category ? "var(--accent)" : "var(--text-muted)",
          }}
        >
          <option value="" style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>
            All Categories
          </option>
          {categories.map((c) => (
            <option
              key={c}
              value={c}
              style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}
            >
              {categoryLabels[c]}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="border rounded-2xl h-64 animate-pulse"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="text-4xl">🎒</span>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No products found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
