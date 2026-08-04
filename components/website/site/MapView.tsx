"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { categoryColor, type Landmark } from "./mapData";

const CENTER: [number, number] = [33.6435, 72.9915];
const ZOOM = 15;
const MIN_ZOOM = 15;
// Padded around the campus landmarks so panning/zooming out never leaves NUST H-12.
const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [33.634, 72.981],
  [33.65, 73.001],
];

function RecenterControl() {
  const map = useMap();

  return (
    <button
      type="button"
      onClick={() => map.setView(CENTER, ZOOM)}
      className="absolute bottom-3 right-3 z-[1000] cursor-pointer rounded-full border-2 border-dotted border-fg/40 bg-surface/90 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-fg backdrop-blur transition-colors hover:border-fg"
    >
      Recenter
    </button>
  );
}

export default function MapView({ landmarks }: { landmarks: Landmark[] }) {
  return (
    <MapContainer
      center={CENTER}
      zoom={ZOOM}
      minZoom={MIN_ZOOM}
      maxBounds={CAMPUS_BOUNDS}
      maxBoundsViscosity={1.0}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", background: "#f2f7ff" }}
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
      <RecenterControl />
    </MapContainer>
  );
}
