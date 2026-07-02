"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import Card from "@/components/Card";
import ConfirmModal from "@/components/ConfirmModal";
import { type Product, categoryColors, categoryLabels } from "@/types/product";

const categories: Product["category"][] = [
  "tents",
  "sleeping",
  "cooking",
  "backpacks",
  "lighting",
  "tools",
  "other",
];

const emptyForm = {
  name: "",
  description: "",
  category: "tents" as Product["category"],
  price: "",
  stock: "0",
};

const inputClass =
  "p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition w-full text-sm";
const inputStyle = {
  background: "var(--bg-input)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
} as const;
const labelClass = "text-xs uppercase tracking-wide mb-1";

export default function ProductsTab() {
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProducts(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleImageUploading(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploadingImages(true);
    setUploadProgress(0);
    setError("");
    const urls: string[] = [];
    const failedFiles: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const url = await uploadToCloudinary(file, (percent) => {
          const filesDoneProgress = (i / files.length) * 100;
          const thisFileProgress = percent / files.length;
          setUploadProgress(Math.round(filesDoneProgress + thisFileProgress));
        });
        urls.push(url);
      } catch (err) {
        failedFiles.push(
          `${file.name}: ${err instanceof Error ? err.message : "please try again"}`,
        );
      }
    }

    if (urls.length > 0) {
      setUploadProgress(100);
      setUploadedImages((prev) => [...prev, ...urls]);
      toast("success", `${urls.length} image${urls.length > 1 ? "s" : ""} uploaded`);
    }

    if (failedFiles.length > 0) {
      setError(`Some uploads failed: ${failedFiles.join(" | ")}`);
    }

    setTimeout(
      () => {
        setUploadingImages(false);
        setUploadProgress(0);
        input.value = "";
      },
      urls.length > 0 ? 600 : 0,
    );
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setUploadedImages([]);
    setError("");
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditingId(p._id);
    setForm({
      name: p.name,
      description: p.description,
      category: p.category,
      price: String(p.price),
      stock: String(p.stock),
    });
    setUploadedImages(p.images);
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setUploadedImages([]);
    setError("");
  }

  async function handleSubmit() {
    setError("");

    if (!form.name.trim() || !form.description.trim() || !form.price) {
      setError("Name, description, and price are required.");
      return;
    }

    setSubmitting(true);

    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      stock: Number(form.stock),
      images: uploadedImages,
    };

    const url = editingId ? `/api/admin/products/${editingId}` : "/api/admin/products";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    if (editingId) {
      setProducts((prev) => prev.map((p) => (p._id === editingId ? data.data : p)));
      toast("success", "Product updated");
    } else {
      setProducts((prev) => [data.data, ...prev]);
      toast("success", "Product created", "It's now visible on the products page.");
    }

    closeForm();
  }

  async function handleToggleActive(p: Product) {
    setTogglingId(p._id);
    const res = await fetch(`/api/admin/products/${p._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    if (res.ok) {
      const data = await res.json();
      setProducts((prev) => prev.map((x) => (x._id === p._id ? data.data : x)));
      toast(
        "success",
        data.data.isActive ? "Product published" : "Product hidden",
        data.data.isActive
          ? "It's now visible on the products page."
          : "It's been taken off the products page.",
      );
    } else {
      toast("error", "Something went wrong", "Could not update this product.");
    }
    setTogglingId(null);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p._id !== id));
      toast("success", "Product deleted");
    } else {
      toast("error", "Something went wrong", "Could not delete this product.");
    }
    setDeletingId(null);
  }

  if (loading)
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Loading...
      </p>
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>
          Camping Products
          <span className="ml-2 text-sm font-normal" style={{ color: "var(--text-faint)" }}>
            ({products.length})
          </span>
        </h2>
        <button
          onClick={openCreate}
          className="text-white text-sm font-medium px-4 py-2 rounded-xl transition bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
        >
          + New Product
        </button>
      </div>

      {showForm && (
        <Card className="p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>
              {editingId ? "Edit Product" : "New Product"}
            </h2>
            <button
              onClick={closeForm}
              className="transition text-lg"
              style={{ color: "var(--text-faint)" }}
            >
              x
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col md:col-span-2">
              <label className={labelClass} style={{ color: "var(--text-faint)" }}>
                Name
              </label>
              <input
                className={inputClass}
                style={inputStyle}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. 4-Person Waterproof Tent"
              />
            </div>

            <div className="flex flex-col md:col-span-2">
              <label className={labelClass} style={{ color: "var(--text-faint)" }}>
                Description
              </label>
              <textarea
                className={inputClass}
                style={inputStyle}
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the product..."
              />
            </div>

            <div className="flex flex-col">
              <label className={labelClass} style={{ color: "var(--text-faint)" }}>
                Category
              </label>
              <select
                className={inputClass}
                style={inputStyle}
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as Product["category"] })
                }
              >
                {categories.map((c) => (
                  <option
                    key={c}
                    value={c}
                    style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}
                  >
                    {categoryLabels[c]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className={labelClass} style={{ color: "var(--text-faint)" }}>
                Price (DZD)
              </label>
              <input
                className={inputClass}
                style={inputStyle}
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="e.g. 4500"
              />
            </div>

            <div className="flex flex-col">
              <label className={labelClass} style={{ color: "var(--text-faint)" }}>
                Stock
              </label>
              <input
                className={inputClass}
                style={inputStyle}
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="e.g. 20"
              />
            </div>

            <div className="flex flex-col md:col-span-2 gap-2">
              <label className={labelClass} style={{ color: "var(--text-faint)" }}>
                Images
              </label>

              {uploadedImages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {uploadedImages.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setUploadedImages((prev) => prev.filter((_, j) => j !== i))
                        }
                        className="absolute inset-0 bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label
                className={`flex flex-col gap-2 cursor-pointer w-fit ${uploadingImages ? "cursor-not-allowed" : ""}`}
              >
                <div
                  className="flex items-center gap-2 transition px-4 py-2.5 rounded-lg text-sm"
                  style={{
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUploading}
                    disabled={uploadingImages}
                  />
                  {uploadingImages ? `Uploading... ${uploadProgress}%` : "Upload Images"}
                </div>

                {uploadingImages && (
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--bg-hover)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%`, background: "var(--accent)" }}
                    />
                  </div>
                )}
              </label>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 px-4 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="text-white text-sm font-medium px-5 py-2.5 rounded-xl transition disabled:opacity-50 bg-[var(--accent)] hover:bg-[var(--accent-hover)]"
            >
              {submitting ? "Saving..." : editingId ? "Save Changes" : "Create Product"}
            </button>
            <button
              onClick={closeForm}
              className="text-sm font-medium px-5 py-2.5 rounded-xl transition"
              style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      {products.length === 0 ? (
        <Card className="p-12 flex flex-col items-center gap-3 text-center">
          <span className="text-4xl">🎒</span>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No products yet.
          </p>
          <button
            onClick={openCreate}
            className="text-sm hover:underline"
            style={{ color: "var(--accent)" }}
          >
            Add your first product -&gt;
          </button>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((p) => (
            <div
              key={p._id}
              className="flex flex-col sm:flex-row gap-4 rounded-xl p-4"
              style={{
                background: "var(--bg-hover)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div className="w-full sm:w-24 h-28 sm:h-24 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--bg-card)" }}>
                {p.images[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                ) : null}
              </div>

              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                    {p.name}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[p.category]}`}>
                    {categoryLabels[p.category]}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.isActive ? "text-green-400 bg-green-400/10" : "text-yellow-400 bg-yellow-400/10"
                    }`}
                  >
                    {p.isActive ? "Published" : "Hidden"}
                  </span>
                </div>
                <p className="text-xs line-clamp-2" style={{ color: "var(--text-faint)" }}>
                  {p.description}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm font-medium" style={{ color: "var(--accent-soft)" }}>
                    {p.price.toLocaleString()} DZD
                  </span>
                  <span style={{ color: "var(--border)" }}>·</span>
                  <span className="text-xs" style={{ color: "var(--text-ghost)" }}>
                    {p.stock} in stock
                  </span>
                </div>
              </div>

              <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 shrink-0">
                <button
                  onClick={() => handleToggleActive(p)}
                  disabled={togglingId === p._id}
                  className="text-xs border px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                  style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
                >
                  {togglingId === p._id ? "..." : p.isActive ? "Hide" : "Publish"}
                </button>
                <button
                  onClick={() => openEdit(p)}
                  className="text-xs border px-3 py-1.5 rounded-lg transition"
                  style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(p._id)}
                  disabled={deletingId === p._id}
                  className="text-xs text-red-400 hover:text-red-300 border border-red-400/20 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                  {deletingId === p._id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={deleteConfirm !== null}
        title="Delete this product?"
        message={
          <>
            This will permanently remove{" "}
            <span style={{ color: "var(--text-secondary)" }}>
              {products.find((p) => p._id === deleteConfirm)?.name ?? "this product"}
            </span>{" "}
            from the store. This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        cancelLabel="Keep it"
        variant="danger"
        onConfirm={() => {
          if (deleteConfirm) handleDelete(deleteConfirm);
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
