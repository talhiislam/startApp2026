"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

type CampsiteMapProps = {
    lat: number;
    lng: number;
    name: string;
};

const markerIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export default function CampsiteMap({ lat, lng, name }: CampsiteMapProps) {
    return (
        <MapContainer
            center={[lat, lng]}
            zoom={11}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lng]} icon={markerIcon}>
                <Popup>{name}</Popup>
            </Marker>
        </MapContainer>
    );
}
