"use client";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { categoryColor, type Landmark } from "@/components/campus/landmarks";
import { categoryIconSvg } from "@/components/campus/icons";

const CENTER: [number, number] = [33.6435, 72.9915];
const ZOOM = 15;
const MIN_ZOOM = 15;
const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [33.634, 72.981],
  [33.65, 73.001],
];

const PIN_SIZE = 26;
const INK = "#090c13";
const CREAM = "#F4F1EA";

function glyphColor(fill: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(fill.slice(i, i + 2), 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? INK : CREAM;
}

const iconCache = new Map<string, L.DivIcon>();

function pinIcon(category: string) {
  const cached = iconCache.get(category);
  if (cached) return cached;

  const fill = categoryColor(category);
  const icon = L.divIcon({
    className: "campus-pin",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:${PIN_SIZE}px;height:${PIN_SIZE}px;border-radius:9999px;background:${fill};border:1.5px solid ${INK};box-shadow:0 1px 6px rgba(9,12,19,0.35)">${categoryIconSvg(category, 15, glyphColor(fill))}</span>`,
    iconSize: [PIN_SIZE, PIN_SIZE],
    iconAnchor: [PIN_SIZE / 2, PIN_SIZE / 2],
    popupAnchor: [0, -PIN_SIZE / 2],
  });

  iconCache.set(category, icon);
  return icon;
}

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
        attribution="&copy; OpenStreetMap &copy; CARTO"
      />
      {landmarks.map((landmark) => (
        <Marker
          key={landmark.id}
          position={[landmark.lat, landmark.lng]}
          icon={pinIcon(landmark.category)}
          title={landmark.name}
        >
          <Popup>
            <div style={{ fontFamily: "var(--font-plex-mono), monospace" }}>
              <strong style={{ display: "block", marginBottom: 4 }}>{landmark.name}</strong>
              <span style={{ fontSize: 12, opacity: 0.8 }}>{landmark.description}</span>
            </div>
          </Popup>
        </Marker>
      ))}
      <RecenterControl />
    </MapContainer>
  );
}
