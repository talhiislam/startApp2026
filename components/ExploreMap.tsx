"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useRouter } from "next/navigation";
import L from "leaflet";
import { type Campsite, typeLabels } from "@/types/campsite";

type ExploreMapProps = {
    campsites: Campsite[];
};

function BoundsUpdater({ campsites }: { campsites: Campsite[] }) {
    const map = useMap();
    const prevLength = useRef(0);

    useEffect(() => {
        const withCoords = campsites.filter((c) => c.coordinates?.lat);
        if (withCoords.length === 0) return;
        if (withCoords.length === prevLength.current) return;

        prevLength.current = withCoords.length;

        const bounds = L.latLngBounds(
            withCoords.map((c) => [c.coordinates!.lat, c.coordinates!.lng])
        );
        map.fitBounds(bounds, { padding: [40, 40] });
    }, [campsites, map]);

    return null;
}

export default function ExploreMap({ campsites }: ExploreMapProps) {
    const router = useRouter();

    useEffect(() => {
        delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: () => string })._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
    }, []);

    const withCoords = campsites.filter((c) => c.coordinates?.lat);

    return (
        <MapContainer
            center={[28.0339, 1.6596]}
            zoom={5}
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <BoundsUpdater campsites={campsites} />
            {withCoords.map((c) => (
                <Marker
                    key={c._id}
                    position={[c.coordinates!.lat, c.coordinates!.lng]}
                >
                    <Popup>
                        <div style={{ minWidth: "160px" }}>
                            {c.images[0] && (
                                <img
                                    src={c.images[0]}
                                    alt={c.name}
                                    style={{ width: "100%", height: "80px", objectFit: "cover", borderRadius: "6px", marginBottom: "8px" }}
                                />
                            )}
                            <p style={{ fontWeight: 600, fontSize: "13px", margin: "0 0 2px" }}>{c.name}</p>
                            <p style={{ fontSize: "11px", color: "#888", margin: "0 0 4px" }}>
                                {typeLabels[c.type]} · {c.wilaya}
                            </p>
                            <p style={{ fontSize: "12px", color: "#f97316", fontWeight: 600, margin: "0 0 8px" }}>
                                {c.pricePerNight.toLocaleString()} DZD / night
                            </p>
                            <button
                                onClick={() => router.push(`/explore/${c._id}`)}
                                style={{
                                    width: "100%",
                                    background: "#f97316",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    padding: "6px 0",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                }}
                            >
                                View campsite
                            </button>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}