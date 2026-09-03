"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import L from "leaflet";

export type ShelterMapData = {
  SHELTER_ID: string;
  SHELTER_NAME: string;
  LATITUDE: string;
  LONGITUDE: string;
  CURRENT_STATUS: string;
  CAPACITY: number;
  CURRENT_OCCUPANCY: number;
  DISASTER_NAME?: string;
};

export type DisasterMapData = {
  DISASTER_NAME: string;
  DISASTER_TYPE: string;
  DIVISION: string;
  DISTRICT: string;
  END_DATE: string | null;
};

// Bangladesh district approximate coordinates for disaster markers
const DISTRICT_COORDS: Record<string, [number, number]> = {
  "Sylhet":       [24.8963, 91.8833],
  "Dhaka":        [23.8103, 90.4125],
  "Chittagong":   [22.3569, 91.7832],
  "Cox's Bazar":  [21.4272, 92.0058],
  "Barisal":      [22.7010, 90.3535],
  "Patuakhali":   [22.3596, 90.3295],
  "Khulna":       [22.8456, 89.5403],
  "Rajshahi":     [24.3636, 88.6241],
  "Rangpur":      [25.7439, 89.2752],
  "Mymensingh":   [24.7471, 90.4203],
  "Comilla":      [23.4607, 91.1809],
  "Gazipur":      [23.9999, 90.4203],
};

const statusColor: Record<string, string> = {
  Open:   "#22c55e",
  Full:   "#ef4444",
  Closed: "#64748b",
};

type Props = {
  shelters?: ShelterMapData[];
  disasters?: DisasterMapData[];
  height?: string;
};

export default function BangladeshMap({
  shelters = [],
  disasters = [],
  height = "100%",
}: Props) {
  // Bangladesh center
  const CENTER: [number, number] = [23.685, 90.356];

  return (
    <MapContainer
      center={CENTER}
      zoom={7}
      style={{ height, width: "100%", borderRadius: "0" }}
      scrollWheelZoom={true}
    >
      {/* OpenStreetMap tiles — 100% free, no API key */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={18}
      />

      {/* Disaster area markers */}
      {disasters.map((d) => {
        const coords = DISTRICT_COORDS[d.DISTRICT] || DISTRICT_COORDS[d.DIVISION];
        if (!coords) return null;
        const isActive = !d.END_DATE;
        return (
          <CircleMarker
            key={d.DISASTER_NAME}
            center={coords}
            radius={isActive ? 18 : 10}
            pathOptions={{
              color: isActive ? "#ef4444" : "#64748b",
              fillColor: isActive ? "#ef4444" : "#64748b",
              fillOpacity: isActive ? 0.25 : 0.15,
              weight: isActive ? 2 : 1,
              dashArray: isActive ? undefined : "4,4",
            }}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>
                  {d.DISASTER_NAME}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>
                  {d.DISASTER_TYPE} · {d.DIVISION}
                </div>
                <div
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 12,
                    fontSize: 11,
                    backgroundColor: isActive ? "#fef2f2" : "#f1f5f9",
                    color: isActive ? "#ef4444" : "#64748b",
                    marginTop: 4,
                  }}
                >
                  {isActive ? "🔴 Active" : "✓ Resolved"}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      {/* Shelter markers */}
      {shelters.map((s) => {
        const lat = parseFloat(s.LATITUDE);
        const lng = parseFloat(s.LONGITUDE);
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

        const color = statusColor[s.CURRENT_STATUS] ?? "#64748b";
        const icon = L.divIcon({
          html: `<div style="
            width:28px;height:28px;border-radius:50% 50% 50% 0;
            background:${color};transform:rotate(-45deg);
            border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);
          "></div>`,
          className: "",
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -32],
        });

        const occupancy = s.CURRENT_OCCUPANCY ?? 0;
        const pct = s.CAPACITY > 0 ? Math.round((occupancy / s.CAPACITY) * 100) : 0;

        return (
          <Marker key={s.SHELTER_ID} position={[lat, lng]} icon={icon}>
            <Popup>
              <div style={{ minWidth: 200 }}>
                <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>
                  {s.SHELTER_NAME}
                </div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
                  ID: {s.SHELTER_ID}
                  {s.DISASTER_NAME && ` · ${s.DISASTER_NAME}`}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span>Capacity: <strong>{s.CAPACITY}</strong></span>
                  <span>Occupied: <strong>{occupancy}</strong></span>
                </div>
                {/* Progress bar */}
                <div style={{ background: "#e2e8f0", borderRadius: 4, height: 6, marginBottom: 6 }}>
                  <div style={{
                    width: `${pct}%`, height: "100%", borderRadius: 4,
                    background: pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#22c55e"
                  }} />
                </div>
                <div
                  style={{
                    display: "inline-block", padding: "2px 8px", borderRadius: 12,
                    fontSize: 11, backgroundColor: color + "22", color,
                  }}
                >
                  {s.CURRENT_STATUS}
                </div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>
                  {lat.toFixed(4)}°N, {lng.toFixed(4)}°E
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
