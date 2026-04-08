"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

type Position = {
  lat: number;
  lng: number;
};

type MapPickerProps = {
  initialPosition?: Position;
  onPositionChange: (pos: Position) => void;
};

const ALGERIA_CENTER: Position = { lat: 28.0339, lng: 1.6596 };
const DEFAULT_ZOOM = 5;
const SELECTED_ZOOM = 10;
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ClickHandler({
  onPositionChange,
}: {
  onPositionChange: (pos: Position) => void;
}) {
  useMapEvents({
    click(e) {
      onPositionChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapPicker({
  initialPosition,
  onPositionChange,
}: MapPickerProps) {
  const position = initialPosition ?? ALGERIA_CENTER;
  const zoom = initialPosition ? SELECTED_ZOOM : DEFAULT_ZOOM;

  return (
    <div className="flex flex-col gap-2">
      <div className="h-96 rounded-xl overflow-hidden border border-white/[0.08]">
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPositionChange={onPositionChange} />
          {initialPosition && (
            <Marker
              position={[initialPosition.lat, initialPosition.lng]}
              icon={markerIcon}
            />
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-slate-500">
        Click anywhere on the map to place your campsite location.
      </p>
    </div>
  );
}
