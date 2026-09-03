"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { ShelterMapData, DisasterMapData } from "@/components/map/BangladeshMap";

const BangladeshMap = dynamic(() => import("@/components/map/BangladeshMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] flex items-center justify-center bg-black rounded-xl text-on-surface-variant">
      <div className="flex flex-col items-center gap-3">
        <span className="material-symbols-outlined text-[40px] animate-pulse text-success">map</span>
        <span className="text-sm font-medium font-mono uppercase">Loading map...</span>
      </div>
    </div>
  ),
});

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function PublicDashboardPage() {
  const [kpis, setKpis] = useState({ active: 0, victims: 0, shelters: 0, distributions: 0 });
  const [disasters, setDisasters] = useState<any[]>([]);
  const [shelters, setShelters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Live Data Matrix Filters
  const [filterDivision, setFilterDivision] = useState<string>("All");
  const [filterDistrict, setFilterDistrict] = useState<string>("All");
  const [filterType, setFilterType] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [expandedDisaster, setExpandedDisaster] = useState<string | null>(null);

  const loadData = () => {
    Promise.all([
      fetch(`${API}/dashboard`).then((r) => r.json()),
      fetch(`${API}/disasters`).then((r) => r.json()),
      fetch(`${API}/shelters`).then((r) => r.json()),
    ])
      .then(([dash, dis, shel]) => {
        setKpis({
          active: dash.data?.kpis?.ACTIVE_DISASTERS ?? 0,
          victims: dash.data?.kpis?.TOTAL_VICTIMS ?? 0,
          shelters: dash.data?.kpis?.TOTAL_SHELTERS ?? 0,
          distributions: dash.data?.kpis?.TOTAL_DISTRIBUTIONS ?? 0,
        });
        setDisasters(dis.data ?? []);
        setShelters(shel.data ?? []);
        setLastUpdated(new Date());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const activeDisasters = disasters.filter((d) => !d.END_DATE);
  const openShelters = shelters.filter((s) => s.CURRENT_STATUS === "Open");

  const shelterMapData: ShelterMapData[] = openShelters
    .filter((s) => s.LATITUDE && s.LONGITUDE && parseFloat(s.LATITUDE) !== 0)
    .map((s) => ({
      SHELTER_ID: s.SHELTER_ID, SHELTER_NAME: s.SHELTER_NAME,
      LATITUDE: s.LATITUDE, LONGITUDE: s.LONGITUDE,
      CURRENT_STATUS: s.CURRENT_STATUS, CAPACITY: s.CAPACITY,
      CURRENT_OCCUPANCY: s.CURRENT_OCCUPANCY, DISASTER_NAME: s.DISASTER_NAME,
    }));

  const disasterMapData: DisasterMapData[] = activeDisasters.map((d) => ({
    DISASTER_NAME: d.DISASTER_NAME, DISASTER_TYPE: d.DISASTER_TYPE,
    DIVISION: d.DIVISION, DISTRICT: d.DISTRICT, END_DATE: d.END_DATE,
  }));

  // Matrix Filter Logic
  const divisions = useMemo(() => {
    const divs = new Set(disasters.map(d => d.DIVISION).filter(Boolean));
    return ["All", ...Array.from(divs)];
  }, [disasters]);

  const districts = useMemo(() => {
    const filteredDisasters = filterDivision === "All" ? disasters : disasters.filter(d => d.DIVISION === filterDivision);
    const dists = new Set(filteredDisasters.map(d => d.DISTRICT).filter(Boolean));
    return ["All", ...Array.from(dists)];
  }, [disasters, filterDivision]);

  const types = useMemo(() => {
    const t = new Set(disasters.map(d => d.DISASTER_TYPE).filter(Boolean));
    return ["All", ...Array.from(t)];
  }, [disasters]);

  const matrixDisasters = useMemo(() => {
    return disasters.filter(d => {
      const isActive = !d.END_DATE;
      
      if (filterDivision !== "All" && d.DIVISION !== filterDivision) return false;
      if (filterDistrict !== "All" && d.DISTRICT !== filterDistrict) return false;
      if (filterType !== "All" && d.DISASTER_TYPE !== filterType) return false;
      
      if (filterStatus === "Active" && !isActive) return false;
      if (filterStatus === "Resolved" && isActive) return false;
      
      return true;
    });
  }, [disasters, filterDivision, filterDistrict, filterType, filterStatus]);

  // Reset district if division changes
  useEffect(() => {
    setFilterDistrict("All");
  }, [filterDivision]);

  return (
    <div className="stitch-theme bg-background text-on-surface text-base font-normal font-mono topo-bg min-h-screen relative overflow-x-hidden uppercase tracking-wider flex flex-col h-screen overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        .stitch-theme {
          --color-surface-bright: #262626;
          --color-secondary: #a3a3a3;
          --color-warning-amber: #d4d4d4;
          --color-surface-container-highest: #171717;
          --color-surface-container-high: #171717;
          --color-secondary-container: #404040;
          --color-emergency-red: #ef4444;
          --color-surface-container-low: #0a0a0a;
          --color-outline: #525252;
          --color-primary: #f5f5f5;
          --color-primary-container: #404040;
          --color-on-surface: #f5f5f5;
          --color-on-background: #f5f5f5;
          --color-surface-dim: #171717;
          --color-outline-variant: #404040;
          --color-surface: #171717;
          --color-surface-container: #171717;
          --color-surface-tint: #f5f5f5;
          --color-background: #0a0a0a;
          --color-surface-variant: #262626;
        }
        .topo-bg {
            background-color: #0a0a0a;
            background-image: 
                radial-gradient(circle at center, rgba(255,255,255,0.03) 0, transparent 1px),
                radial-gradient(circle at center, rgba(255,255,255,0.02) 0, transparent 2px);
            background-size: 20px 20px, 60px 60px;
            background-position: 0 0, 10px 10px;
        }
        .tech-card {
            background: rgba(23, 23, 23, 0.8);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            border: 1px solid rgba(82, 82, 82, 0.5);
            position: relative;
            transition: all 0.2s ease;
        }
        .tech-card::before, .tech-card::after {
            content: '';
            position: absolute;
            width: 12px;
            height: 12px;
            pointer-events: none;
        }
        .tech-card::before {
            top: -1px; left: -1px;
            border-top: 1px solid #f5f5f5;
            border-left: 1px solid #f5f5f5;
        }
        .tech-card::after {
            bottom: -1px; right: -1px;
            border-bottom: 1px solid #f5f5f5;
            border-right: 1px solid #f5f5f5;
        }
        .tech-card:hover {
            border-color: rgba(245, 245, 245, 0.4);
            background: rgba(23, 23, 23, 0.95);
        }
        .tech-data-bg {
            position: absolute;
            bottom: 4px;
            right: 8px;
            font-size: 10px;
            color: rgba(245, 245, 245, 0.3);
            font-family: var(--font-jetbrains-mono), monospace;
            pointer-events: none;
            text-align: right;
            line-height: 1.2;
            z-index: 0;
        }
        /* Custom Select Styling */
        select.matrix-select {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23f5f5f5%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat;
          background-position: right 0.7rem top 50%;
          background-size: 0.65rem auto;
        }
        select.matrix-select option {
          background-color: #0a0a0a;
          color: #f5f5f5;
        }
        .truncate-multiline {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;  
          overflow: hidden;
        }
      `}} />
      <div className="flex h-screen overflow-hidden relative z-10 w-full">
        {/* SideNav */}
        <nav className="docked fixed left-0 h-full w-64 border-r border-outline-variant shadow-lg hidden lg:flex flex-col bg-surface-container/95 backdrop-blur-sm z-30">
          <div className="p-6 relative">
            <div className="flex flex-col items-center gap-3 mb-8 border-b border-outline-variant pb-6 text-center">
              <span className="material-symbols-outlined text-primary text-5xl">account_balance</span>
              <div>
                <h1 className="text-2xl font-bold font-serif text-primary tracking-tight">CMD_CTR</h1>
                <p className="text-xs font-medium font-mono text-secondary mt-1">BGD_DIV // SYS_ONLINE</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Link className="bg-surface-bright/50 text-primary border-l-2 border-primary px-4 py-3 flex items-center gap-3" href="/view/dashboard">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
                <span className="text-sm font-medium font-mono">Overview</span>
              </Link>
              <Link className="text-on-surface-variant hover:text-primary px-4 py-3 flex items-center gap-3 border-l-2 border-transparent hover:border-primary/50 transition-all duration-200" href="/view/dashboard#matrix">
                <span className="material-symbols-outlined text-base">table_chart</span>
                <span className="text-sm font-medium font-mono flex-1">Data Matrix</span>
              </Link>
            </div>
          </div>
          <div className="mt-auto p-6 flex flex-col gap-2 relative">
            <Link href="/" className="w-full bg-emergency-red/10 text-emergency-red border border-emergency-red/50 hover:bg-emergency-red/20 py-3 text-sm font-medium font-mono flex items-center justify-center gap-2 transition-colors relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSIjZmYwMDAwIiBzdHJva2Utb3BhY2l0eT0iMC4xIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDQwaDQwVjBIMHoiLz48L2c+PC9zdmc+')] opacity-20 group-hover:opacity-50 transition-opacity"></div>
              <span className="material-symbols-outlined text-base">home</span>
              RETURN_HOME
            </Link>
            <div className="border-t border-outline-variant mt-4 pt-4 flex flex-col items-center">
              <Link className="text-on-surface-variant hover:text-primary px-4 py-2 flex items-center gap-3 transition-all duration-200" href="/admin/login">
                <span className="material-symbols-outlined text-base">terminal</span>
                <span className="text-sm font-medium font-mono">SYS_ADMIN</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content Wrapper */}
        <div className="flex-1 flex flex-col lg:ml-64 relative w-full h-full overflow-hidden">
          {/* TopAppBar */}
          <header className="bg-surface-dim/95 backdrop-blur-sm border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center h-auto min-h-16 w-full px-6 py-4 sm:py-0 max-w-full z-20 shrink-0 gap-4 sm:gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary animate-pulse shrink-0"></div>
                <div>
                  <div className="text-sm font-medium font-mono font-bold text-primary tracking-widest break-words leading-tight">DISASTER MANAGEMENT SYSTEM</div>
                </div>
              </div>
            </div>
            
            {/* Emergency Banner */}
            {activeDisasters.length > 0 && (
                <div className="flex-1 w-full sm:w-auto flex items-center gap-3 bg-emergency-red/10 border border-emergency-red/50 px-4 py-2 rounded-sm mx-0 sm:mx-4 overflow-hidden max-w-full lg:max-w-xl">
                    <span className="material-symbols-outlined text-emergency-red text-base animate-pulse shrink-0">warning</span>
                    <span className="text-xs font-medium font-mono text-emergency-red tracking-widest truncate-multiline sm:truncate w-full leading-relaxed">
                        CRITICAL: {activeDisasters.length} ACTIVE EVENTS // {activeDisasters.map(d => d.DISASTER_NAME).join(" // ")}
                    </span>
                </div>
            )}
            
            <div className="flex items-center gap-4 shrink-0 mt-2 sm:mt-0">
              <span className="text-xs font-medium font-mono text-primary hidden md:flex items-center gap-2">
                <span className="material-symbols-outlined text-base">schedule</span> LIVE - {lastUpdated ? lastUpdated.toLocaleTimeString("en-BD", { timeZone: "Asia/Dhaka", hour: "2-digit", minute: "2-digit", hour12: true }) : "--:--"}
              </span>
              <Link href="/victim/login" className="border border-primary text-primary hover:bg-primary/10 px-4 py-2 text-sm font-medium font-mono flex items-center gap-2 transition-colors whitespace-nowrap">
                <span className="material-symbols-outlined text-base">login</span>
                VICTIM_LOGIN
              </Link>
              <Link href="/victim/register" className="border border-primary bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 text-sm font-medium font-mono flex items-center gap-2 transition-colors whitespace-nowrap">
                <span className="material-symbols-outlined text-base">person_add</span>
                REG_VICTIM
              </Link>
            </div>
          </header>

          {/* Scrollable Content Canvas */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 z-10 relative">
            <div className="max-w-[1600px] mx-auto space-y-6 pb-20">
              
              {/* KPI Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="tech-card p-6 flex flex-col justify-between min-h-[10rem] group border-emergency-red/30 hover:border-emergency-red/60 relative">
                  <div className="tech-data-bg text-emergency-red/30 hidden sm:block">SEQ: 001<br/>STAT: CRIT<br/>LOC: VAR</div>
                  <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                    <span className="material-symbols-outlined text-[64px] text-emergency-red">warning</span>
                  </div>
                  <div className="text-sm font-medium font-mono text-secondary border-b border-outline-variant/50 pb-2 relative z-10">ACTIVE DISASTERS</div>
                  <div className="text-5xl font-bold font-serif text-emergency-red mt-4 text-left relative z-10">{kpis.active < 10 ? `0${kpis.active}` : kpis.active}</div>
                </div>
                
                <div className="tech-card p-6 flex flex-col justify-between min-h-[10rem] group relative">
                  <div className="tech-data-bg hidden sm:block">SEQ: 002<br/>STAT: NOM<br/>DB: SYNC</div>
                  <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                    <span className="material-symbols-outlined text-[64px] text-on-surface">groups</span>
                  </div>
                  <div className="text-sm font-medium font-mono text-secondary border-b border-outline-variant/50 pb-2 relative z-10">VICTIMS REGISTERED</div>
                  <div className="text-5xl font-bold font-serif text-primary mt-4 text-left relative z-10">{kpis.victims < 10 ? `0${kpis.victims}` : kpis.victims}</div>
                </div>
                
                <div className="tech-card p-6 flex flex-col justify-between min-h-[10rem] group relative">
                  <div className="tech-data-bg hidden sm:block">SEQ: 003<br/>STAT: ACT<br/>CAP: 3K</div>
                  <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                    <span className="material-symbols-outlined text-[64px] text-on-surface">home_pin</span>
                  </div>
                  <div className="text-sm font-medium font-mono text-secondary border-b border-outline-variant/50 pb-2 relative z-10">OPEN SHELTERS</div>
                  <div className="text-5xl font-bold font-serif text-primary mt-4 text-left relative z-10">{openShelters.length < 10 ? `0${openShelters.length}` : openShelters.length}</div>
                </div>
                
                <div className="tech-card p-6 flex flex-col justify-between min-h-[10rem] group relative">
                  <div className="tech-data-bg hidden sm:block">SEQ: 004<br/>STAT: DSP<br/>RTE: CLR</div>
                  <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                    <span className="material-symbols-outlined text-[64px] text-on-surface">local_shipping</span>
                  </div>
                  <div className="text-sm font-medium font-mono text-secondary border-b border-outline-variant/50 pb-2 relative z-10">RELIEF DISTRIBUTIONS</div>
                  <div className="text-5xl font-bold font-serif text-primary mt-4 text-left relative z-10">{kpis.distributions < 10 ? `0${kpis.distributions}` : kpis.distributions}</div>
                </div>
              </div>

              {/* Map Section - Now Full Width */}
              <div className="tech-card flex flex-col overflow-hidden h-[600px]">
                <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container/50 z-20 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary animate-ping"></div>
                    <span className="text-sm font-medium font-mono font-bold text-primary tracking-widest break-words">LIVE_OPS_MAP</span>
                  </div>
                  <span className="text-xs font-medium font-mono text-secondary flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">satellite_alt</span> OSM // ACTIVE_EVENTS: {activeDisasters.length}
                  </span>
                </div>
                <div className="flex-1 relative bg-black p-1 h-full">
                  <div className="absolute inset-0 border border-outline/30 pointer-events-none z-10 m-2"></div>
                  <div className="absolute inset-0 w-full h-full opacity-60 filter grayscale contrast-125 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                      <BangladeshMap shelters={shelterMapData} disasters={disasterMapData} height="100%" />
                  </div>
                </div>
              </div>

              {/* LIVE DATA MATRIX - Nested Hierarchical Table */}
              <div id="matrix" className="tech-card mt-8 overflow-hidden">
                <div className="p-4 border-b border-outline-variant flex flex-col xl:flex-row justify-between items-start xl:items-center bg-surface-container/50 gap-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">table_chart</span>
                    <span className="text-sm font-medium font-mono font-bold text-primary tracking-widest break-words">LIVE_DATA_MATRIX (EXPLORER)</span>
                  </div>
                  
                  {/* Matrix Filters */}
                  <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    {/* Status Filter */}
                    <div className="flex items-center gap-2 bg-surface/80 border border-outline-variant p-1 w-full sm:w-auto">
                      <span className="text-xs font-mono text-secondary pl-2">STAT:</span>
                      <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="matrix-select bg-transparent text-primary text-sm font-mono border-none outline-none pr-8 py-1 cursor-pointer w-full sm:w-28 truncate"
                      >
                        <option value="All">All</option>
                        <option value="Active">Active</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>

                    {/* Type Filter */}
                    <div className="flex items-center gap-2 bg-surface/80 border border-outline-variant p-1 w-full sm:w-auto">
                      <span className="text-xs font-mono text-secondary pl-2">TYPE:</span>
                      <select 
                        value={filterType} 
                        onChange={(e) => setFilterType(e.target.value)}
                        className="matrix-select bg-transparent text-primary text-sm font-mono border-none outline-none pr-8 py-1 cursor-pointer w-full sm:w-28 truncate"
                      >
                        {types.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    {/* Division Filter */}
                    <div className="flex items-center gap-2 bg-surface/80 border border-outline-variant p-1 w-full sm:w-auto">
                      <span className="text-xs font-mono text-secondary pl-2">DIV:</span>
                      <select 
                        value={filterDivision} 
                        onChange={(e) => setFilterDivision(e.target.value)}
                        className="matrix-select bg-transparent text-primary text-sm font-mono border-none outline-none pr-8 py-1 cursor-pointer w-full sm:w-28 truncate"
                      >
                        {divisions.map(div => <option key={div} value={div}>{div}</option>)}
                      </select>
                    </div>

                    {/* District Filter */}
                    <div className="flex items-center gap-2 bg-surface/80 border border-outline-variant p-1 w-full sm:w-auto">
                      <span className="text-xs font-mono text-secondary pl-2">DIST:</span>
                      <select 
                        value={filterDistrict} 
                        onChange={(e) => setFilterDistrict(e.target.value)}
                        className="matrix-select bg-transparent text-primary text-sm font-mono border-none outline-none pr-8 py-1 cursor-pointer w-full sm:w-28 truncate"
                      >
                        {districts.map(dist => <option key={dist} value={dist}>{dist}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-surface-bright/20 border-b border-outline-variant">
                      <tr>
                        <th className="p-4 text-xs font-medium font-mono text-secondary font-bold">DISASTER_NAME</th>
                        <th className="p-4 text-xs font-medium font-mono text-secondary font-bold">TYPE</th>
                        <th className="p-4 text-xs font-medium font-mono text-secondary font-bold">LOCATION</th>
                        <th className="p-4 text-xs font-medium font-mono text-secondary font-bold">STATUS</th>
                        <th className="p-4 text-xs font-medium font-mono text-secondary font-bold">SHELTERS</th>
                        <th className="p-4 text-xs font-medium font-mono text-secondary font-bold text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30">
                      {matrixDisasters.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-12 text-center text-secondary">
                            <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">search_off</span>
                            NO_DATA_FOUND_FOR_CRITERIA
                          </td>
                        </tr>
                      ) : matrixDisasters.map((d, idx) => {
                        const dShelters = shelters.filter(s => s.DISASTER_NAME === d.DISASTER_NAME);
                        const isExpanded = expandedDisaster === d.DISASTER_NAME;
                        const isActive = !d.END_DATE;
                        
                        return (
                          <div key={idx} className="contents">
                            {/* Primary Row */}
                            <tr 
                              className={`hover:bg-surface-bright/10 transition-colors cursor-pointer ${isExpanded ? 'bg-surface-bright/20' : ''}`}
                              onClick={() => setExpandedDisaster(isExpanded ? null : d.DISASTER_NAME)}
                            >
                              <td className="p-4 text-sm font-bold text-on-surface break-words max-w-[200px]">{d.DISASTER_NAME}</td>
                              <td className="p-4 text-sm text-primary break-words max-w-[150px]">{d.DISASTER_TYPE}</td>
                              <td className="p-4 text-sm text-secondary break-words max-w-[200px]">{d.DISTRICT ? `${d.DIVISION} // ${d.DISTRICT}` : d.DIVISION}</td>
                              <td className="p-4 text-sm">
                                {isActive ? (
                                    <span className="text-emergency-red font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emergency-red animate-pulse"></span>ACTIVE</span>
                                ) : (
                                    <span className="text-success font-bold flex items-center gap-1"><span className="material-symbols-outlined text-sm">check</span>RESOLVED</span>
                                )}
                              </td>
                              <td className="p-4 text-sm font-mono text-primary font-bold">{dShelters.length}</td>
                              <td className="p-4 text-right">
                                <button className="text-secondary hover:text-primary transition-colors p-2">
                                  <span className={`material-symbols-outlined transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary' : ''}`}>
                                    expand_more
                                  </span>
                                </button>
                              </td>
                            </tr>
                            
                            {/* Nested Shelters Loop (Expanded View) */}
                            {isExpanded && (
                              <tr className="bg-black/40 border-b-2 border-primary/20">
                                <td colSpan={6} className="p-0">
                                  <div className="p-4 sm:p-6 border-l-2 border-primary ml-4 sm:ml-8 my-4 bg-surface-container/50 overflow-x-auto">
                                    <h4 className="text-xs font-bold text-primary mb-4 flex items-center gap-2 whitespace-nowrap">
                                      <span className="material-symbols-outlined text-sm">account_tree</span>
                                      LINKED_SHELTERS_NETWORK
                                    </h4>
                                    
                                    {dShelters.length === 0 ? (
                                      <div className="text-sm text-secondary opacity-70">NO_SHELTERS_ALLOCATED</div>
                                    ) : (
                                      <table className="w-full text-left min-w-[600px]">
                                        <thead className="border-b border-outline-variant/50">
                                          <tr>
                                            <th className="py-2 text-xs text-secondary">SHELTER_ID</th>
                                            <th className="py-2 text-xs text-secondary">NAME</th>
                                            <th className="py-2 text-xs text-secondary">STATUS</th>
                                            <th className="py-2 text-xs text-secondary">CAPACITY</th>
                                            <th className="py-2 text-xs text-secondary text-right">COMM</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-outline-variant/20">
                                          {dShelters.map((s, sIdx) => {
                                            const sPct = s.CAPACITY > 0 ? Math.round(((s.CURRENT_OCCUPANCY ?? 0) / s.CAPACITY) * 100) : 0;
                                            return (
                                              <tr key={sIdx} className="hover:bg-surface-bright/20">
                                                <td className="py-3 text-sm font-mono text-primary">{s.SHELTER_ID}</td>
                                                <td className="py-3 text-sm text-on-surface truncate max-w-[200px]" title={s.SHELTER_NAME}>{s.SHELTER_NAME}</td>
                                                <td className="py-3 text-sm">
                                                  {s.CURRENT_STATUS === 'Open' ? (
                                                    <span className="text-success text-xs font-bold border border-success/30 px-2 py-0.5">OPEN</span>
                                                  ) : (
                                                    <span className="text-emergency-red text-xs font-bold border border-emergency-red/30 px-2 py-0.5">FULL</span>
                                                  )}
                                                </td>
                                                <td className="py-3 text-sm font-mono">
                                                  <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1 bg-outline-variant rounded-full overflow-hidden">
                                                      <div className={`h-full ${sPct > 90 ? 'bg-emergency-red' : 'bg-primary'}`} style={{width: `${Math.min(sPct, 100)}%`}}></div>
                                                    </div>
                                                    <span className="text-secondary text-xs">{s.CURRENT_OCCUPANCY ?? 0}/{s.CAPACITY}</span>
                                                  </div>
                                                </td>
                                                <td className="py-3 text-sm font-mono text-right text-secondary">
                                                  {s.CONTACT_PERSON_PHONE || "N/A"}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </div>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </main>
          
          {/* Footer */}
          <footer className="bg-surface-dim/95 backdrop-blur-sm border-t border-outline-variant flex flex-col md:flex-row justify-between items-center py-4 px-6 w-full text-center md:text-left z-20 shrink-0 gap-4 md:gap-0">
            <div className="text-secondary text-xs font-medium font-mono">
              SYS_COPYRIGHT // 2024 DISASTER MANAGEMENT SYSTEM // BGD_PUB_INFO
            </div>
            <div className="flex gap-4 sm:gap-6 justify-center flex-wrap">
              <a className="text-secondary hover:text-primary transition-colors text-xs font-medium font-mono" href="#">SEC_POLICY</a>
              <a className="text-secondary hover:text-primary transition-colors text-xs font-medium font-mono" href="#">TECH_CREDITS</a>
              <a className="text-secondary hover:text-primary transition-colors text-xs font-medium font-mono" href="#">TOS</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
