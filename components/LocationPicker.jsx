"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Leaflet marker ikonunun düzgün görünməsi üçün sazlama
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export default function LocationPicker({ selectedPosition, onPositionChange }) {
  const [position, setPosition] = useState(selectedPosition || [40.4093, 49.8671]); // Bakı mərkəz

  useEffect(() => {
    if (selectedPosition) {
      setPosition(selectedPosition);
    }
  }, [selectedPosition]);

  const handlePositionChange = (newPos) => {
    setPosition(newPos);
    if (onPositionChange) {
      onPositionChange(newPos);
    }
  };

  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden border border-navy/15 z-10">
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={handlePositionChange} />
      </MapContainer>
    </div>
  );
}