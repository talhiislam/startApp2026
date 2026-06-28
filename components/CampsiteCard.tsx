import Link from "next/link";
import Image from "next/image";
import { type Campsite, typeColors, typeLabels } from "@/types/campsite";

type CampsiteCardProps = {
  id: string;
  name: string;
  location: string;
  region: string;
  type: Campsite["type"];
  image: string;
  price?: number;
};

export default function CampsiteCard({
  id,
  name,
  location,
  type,
  region,
  image,
  price,
}: CampsiteCardProps) {
  return (
    <Link href={`/explore/${id}`} className="group block">
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "1rem",
          overflow: "hidden",
          transition: "border-color 0.3s",
        }}
        className="hover:border-[var(--accent-border)]"
      >
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              style={{
                background: "var(--bg-hover)",
                width: "100%",
                height: "100%",
              }}
            />
          )}
          <span
            className={`absolute top-3 left-3 text-xs font-medium px-2 py-1 rounded-full z-10 ${typeColors[type]}`}
          >
            {typeLabels[type]}
          </span>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col gap-1">
          <h3
            style={{ color: "var(--text-primary)" }}
            className="font-semibold text-sm"
          >
            {name}
          </h3>
          <p style={{ color: "var(--text-faint)" }} className="text-xs">
            📍 {location}, {region}
          </p>
          {price !== undefined && (
            <p className="text-sm font-medium mt-1" style={{ color: "var(--accent-soft)" }}>
              {price.toLocaleString()} DZD{" "}
              <span
                style={{ color: "var(--text-faint)" }}
                className="font-normal"
              >
                / night
              </span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
