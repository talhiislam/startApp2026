import { type Product, categoryColors, categoryLabels } from "@/types/product";

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  const outOfStock = product.stock <= 0;

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "1rem",
        overflow: "hidden",
        transition: "border-color 0.3s",
      }}
      className="group hover:border-[var(--accent-border)]"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div style={{ background: "var(--bg-hover)", width: "100%", height: "100%" }} />
        )}
        <span
          className={`absolute top-3 left-3 text-xs font-medium px-2 py-1 rounded-full z-10 ${categoryColors[product.category]}`}
        >
          {categoryLabels[product.category]}
        </span>
        {outOfStock && (
          <span className="absolute top-3 right-3 text-xs font-medium px-2 py-1 rounded-full z-10 text-red-400 bg-red-400/10">
            Out of stock
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-1">
        <h3 style={{ color: "var(--text-primary)" }} className="font-semibold text-sm">
          {product.name}
        </h3>
        <p
          style={{ color: "var(--text-faint)" }}
          className="text-xs line-clamp-2 leading-relaxed"
        >
          {product.description}
        </p>
        <p className="text-sm font-medium mt-1" style={{ color: "var(--accent-soft)" }}>
          {product.price.toLocaleString()} DZD
        </p>
      </div>
    </div>
  );
}
