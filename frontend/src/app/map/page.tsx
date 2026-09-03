"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/Badge";
import { useApi } from "@/hooks/useApi";
import { getShelters, getDisasters } from "@/services/api";
import type { ShelterMapData, DisasterMapData } from "@/components/map/BangladeshMap";

// Dynamic import — Leaflet requires browser (no SSR)
const BangladeshMap = dynamic(() => import("@/components/map/BangladeshMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-navy-bg text-on-surface-variant">
      <div className="flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-[40px] animate-pulse text-primary">map</span>
        <span className="text-label-caps font-label-caps">Loading OpenStreetMap...</span>
      </div>
    </div>
  ),
});

type Shelter = {
  SHELTER_ID: string;
  SHELTER_NAME: string;
  CAPACITY: number;
  CURRENT_OCCUPANCY: number;
  AVAILABLE_CAPACITY: number;
  CURRENT_STATUS: string;
  DIVISION: string;
  DISTRICT: string;
  LATITUDE: string;
  LONGITUDE: string;
  DISASTER_NAME: string;
};

type Disaster = {
  DISASTER_NAME: string;
  DISASTER_TYPE: string;
  DIVISION: string;
  DISTRICT: string;
  START_DATE: string;
  END_DATE: string | null;
  DURATION_DAYS: number | null;
};

type LayerKey = "disasters" | "shelters";

export default function OperationalMapPage() {
  const { data: shelters, loading: sheltersLoading } = useApi<Shelter[]>(getShelters as any);
  const { data: disasters, loading: disastersLoading } = useApi<Disaster[]>(getDisasters as any);

  const [activeLayers, setActiveLayers] = useState<Set<LayerKey>>(new Set(["disasters", "shelters"]));
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);

  const loading = sheltersLoading || disastersLoading;
  const disasterTypes = Array.from(new Set((disasters ?? []).map((d) => d.DISASTER_TYPE).filter(Boolean)));
  const activeDisasters = (disasters ?? []).filter((d) => !d.END_DATE);

  const toggleLayer = (key: LayerKey) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const filteredDisasters = typeFilter === "All" ? disasters ?? [] : (disasters ?? []).filter((d) => d.DISASTER_TYPE === typeFilter);

  // Prepare shelter data for map (only those with valid coordinates)
  const shelterMapData: ShelterMapData[] = useMemo(() =>
    activeLayers.has("shelters")
      ? (shelters ?? []).filter((s) => s.LATITUDE && s.LONGITUDE && parseFloat(s.LATITUDE) !== 0)
      : [],
    [shelters, activeLayers]
  );

  // Prepare disaster data for map
  const disasterMapData: DisasterMapData[] = useMemo(() =>
    activeLayers.has("disasters") ? filteredDisasters : [],
    [filteredDisasters, activeLayers]
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel */}
      <div className="w-[300px] shrink-0 flex flex-col border-r border-outline-variant bg-surface overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-outline-variant bg-surface-container-low shrink-0">
          <h1 className="text-headline-md font-headline-md text-on-surface">Live Operations Map</h1>
          <p className="text-label-caps font-label-caps text-on-surface-variant mt-0.5">
            OpenStreetMap · Real-time DB data
          </p>
        </div>

        {/* Layer toggles */}
        <div className="p-4 border-b border-outline-variant shrink-0">
          <div className="text-label-caps font-label-caps text-on-surface-variant mb-3">Map Layers</div>
          <div className="flex flex-col gap-2">
            {(["disasters", "shelters"] as LayerKey[]).map((layer) => (
              <button
                key={layer}
                onClick={() => toggleLayer(layer)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${
                  activeLayers.has(layer)
                    ? layer === "disasters"
                      ? "bg-emergency-red/10 border-emergency-red/40 text-emergency-red"
                      : "bg-command-blue/10 border-command-blue/40 text-command-blue"
                    : "bg-surface-container border-outline-variant text-on-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {layer === "disasters" ? "crisis_alert" : "night_shelter"}
                </span>
                <span className="text-body-md font-body-md capitalize">{layer}</span>
                <span className="ml-auto text-label-caps font-label-caps">
                  {layer === "disasters" ? (disasters?.length ?? 0) : (shelters?.length ?? 0)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Disaster type filter */}
        {activeLayers.has("disasters") && (
          <div className="p-4 border-b border-outline-variant shrink-0">
            <div className="text-label-caps font-label-caps text-on-surface-variant mb-2">Filter by Type</div>
            <div className="flex flex-wrap gap-2">
              {["All", ...disasterTypes].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-label-caps transition-colors ${
                    typeFilter === t
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Shelter list */}
        {activeLayers.has("shelters") && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-3 border-b border-outline-variant">
              <div className="text-label-caps font-label-caps text-on-surface-variant">
                Shelters ({shelters?.length ?? 0})
              </div>
            </div>
            {loading ? (
              <div className="p-4 text-label-caps font-label-caps text-on-surface-variant">Loading...</div>
            ) : (
              (shelters ?? []).map((s) => {
                const pct = s.CAPACITY > 0 ? Math.round((s.CURRENT_OCCUPANCY / s.CAPACITY) * 100) : 0;
                const hasCoords = s.LATITUDE && s.LONGITUDE && parseFloat(s.LATITUDE) !== 0;
                return (
                  <button
                    key={s.SHELTER_ID}
                    onClick={() => setSelectedShelter(s)}
                    className={`w-full text-left p-3 border-b border-outline-variant/50 hover:bg-surface-container-high transition-colors ${
                      selectedShelter?.SHELTER_ID === s.SHELTER_ID ? "bg-surface-container-high" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-body-md font-body-md text-on-surface truncate">{s.SHELTER_NAME}</div>
                        <div className="text-[11px] font-label-caps text-on-surface-variant mt-0.5">{s.SHELTER_ID}</div>
                      </div>
                      <Badge variant={s.CURRENT_STATUS === "Open" ? "success" : s.CURRENT_STATUS === "Full" ? "danger" : "neutral"}>
                        {s.CURRENT_STATUS}
                      </Badge>
                    </div>
                    {/* Occupancy bar */}
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-on-surface-variant mb-1">
                        <span>{s.CURRENT_OCCUPANCY ?? 0}/{s.CAPACITY}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-container-low overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-emergency-red" : pct >= 70 ? "bg-warning-amber" : "bg-stable-emerald"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    {!hasCoords && (
                      <div className="text-[10px] text-on-surface-variant/40 mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[11px]">location_off</span>
                        No coordinates — not shown on map
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Stats footer */}
        <div className="p-3 border-t border-outline-variant shrink-0 bg-surface-container-low">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-emergency-red">{activeDisasters.length}</div>
              <div className="text-[10px] font-label-caps text-on-surface-variant">Active Disasters</div>
            </div>
            <div>
              <div className="text-lg font-bold text-stable-emerald">
                {(shelters ?? []).filter((s) => s.CURRENT_STATUS === "Open").length}
              </div>
              <div className="text-[10px] font-label-caps text-on-surface-variant">Open Shelters</div>
            </div>
          </div>
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative overflow-hidden">
        <BangladeshMap
          shelters={shelterMapData}
          disasters={disasterMapData}
          height="100%"
        />

        {/* Map attribution overlay */}
        <div className="absolute top-3 right-3 z-[1000] bg-surface/90 border border-outline-variant rounded-lg px-3 py-1.5 text-[10px] font-label-caps text-on-surface-variant backdrop-blur-sm">
          <span className="material-symbols-outlined text-[12px] align-middle mr-1">map</span>
          OpenStreetMap · Free · No API Key
        </div>
      </div>
    </div>
  );
}
