"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { categoryColor, type Landmark } from "./mapData";

export default function MapView({ landmarks }: { landmarks: Landmark[] }) {
  return (
    <MapContainer
      center={[33.6435, 72.9915]}
      zoom={15}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", background: "#f4f1ea" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO'
      />
      {landmarks.map((l) => {
        const color = categoryColor(l.category);
        return (
          <CircleMarker
            key={l.id}
            center={[l.lat, l.lng]}
            radius={6}
            pathOptions={{ color: "#090c13", weight: 1.5, fillColor: color, fillOpacity: 1 }}
          >
            <Popup>
              <div style={{ fontFamily: "var(--font-plex-mono), monospace" }}>
                <strong style={{ display: "block", marginBottom: 4 }}>{l.name}</strong>
                <span style={{ fontSize: 12, opacity: 0.8 }}>{l.description}</span>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
