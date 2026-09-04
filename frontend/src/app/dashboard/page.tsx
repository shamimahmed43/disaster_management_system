"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDashboardData } from "@/services/api";

// Quick actions are static UI config, not from DB
const QUICK_ACTIONS = [
  { id: 1, title: "New Incident", icon: "add", href: "/disasters/new" },
  { id: 2, title: "Register Victim", icon: "person_add", href: "/victims" },
  { id: 3, title: "Add Shelter", icon: "home_work", href: "/shelters" },
  { id: 4, title: "New Distribution", icon: "local_shipping", href: "/relief" },
];

type DashboardData = {
  kpis: {
    TOTAL_DISASTERS: number;
    ACTIVE_DISASTERS: number;
    TOTAL_VICTIMS: number;
    MISSING_VICTIMS: number;
    TOTAL_SHELTERS: number;
    TOTAL_PERSONNEL: number;
    TOTAL_WAREHOUSES: number;
    TOTAL_VEHICLES: number;
    AVAILABLE_VEHICLES: number;
    TOTAL_DONATIONS: number;
    TOTAL_DISTRIBUTIONS: number;
  };
  recent_disasters: Array<{
    DISASTER_NAME: string;
    DISASTER_TYPE: string;
    AFFECTED_DISTRICTS: string;
    START_DATE: string;
    END_DATE: string | null;
    DURATION_DAYS: number | null;
  }>;
  shelter_stats: Array<{
    SHELTER_ID: string;
    SHELTER_NAME: string;
    CAPACITY: number;
    CURRENT_OCCUPANCY: number;
    AVAILABLE_CAPACITY: number;
  }>;
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function handleLogout() {
    localStorage.removeItem("dms_token");
    localStorage.removeItem("dms_user");
    router.push("/admin/login");
  }

  useEffect(() => {
    getDashboardData()
      .then((res) => setData(res as unknown as DashboardData))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-cobalt">
          <span className="material-symbols-outlined icon-thick text-[48px] animate-spin">
            progress_activity
          </span>
          <p className="font-bold">Loading operational data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white border border-red-200 rounded-[2rem] p-8 max-w-md text-center shadow-sm">
          <span className="material-symbols-outlined icon-thick text-red-500 text-[48px]">error</span>
          <h2 className="font-display text-2xl text-black mt-4">Backend Unreachable</h2>
          <p className="text-gray-600 font-medium mt-2">
            Cannot connect to the backend server. Make sure the backend is running on port 5000.
          </p>
          <p className="font-mono text-red-500 font-bold mt-4 text-xs bg-red-50 p-2 rounded-lg">{error}</p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis;

  return (
    <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-4">
      {/* Page Header Area */}
      <div className="col-span-full bg-azure rounded-[2rem] p-8 flex flex-col md:flex-row md:items-end justify-between gap-6 shadow-sm border border-blue-200">
        <div>
          <h2 className="font-display text-4xl text-black uppercase tracking-tight">Operations Dashboard</h2>
          <p className="font-bold text-black/70 mt-2 text-lg">Disaster Management System — Bangladesh</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/view/dashboard" target="_blank" className="flex items-center gap-2 px-5 py-3 bg-white hover:bg-gray-50 border border-blue-200 rounded-xl text-cobalt font-bold text-sm transition-colors shadow-sm">
            <span className="material-symbols-outlined icon-thick text-cobalt text-[18px]">public</span>
            Public View
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-3 bg-cobalt hover:bg-cobalt-dark rounded-xl text-white font-bold text-sm transition-colors shadow-sm">
            <span className="material-symbols-outlined icon-thick text-[18px]">logout</span>
            Logout
          </button>
        </div>
      </div>

      {/* Metric Card 1: Active Disasters (High Alert) */}
      <Link href="/disasters" className="col-span-1 md:col-span-2 lg:col-span-4 bg-cobalt rounded-[2rem] p-6 flex flex-col justify-between shadow-sm border border-cobalt-dark text-white min-h-[200px] cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all group">
        <div className="flex justify-between items-start mb-4">
          <span className="font-mono text-sm uppercase tracking-widest font-bold opacity-90 group-hover:text-azure transition-colors">Active Disasters</span>
          <span className="material-symbols-outlined icon-thick text-[28px] text-red-400 animate-pulse group-hover:scale-110 transition-transform">warning</span>
        </div>
        <div>
          <div className="font-display text-7xl leading-none">{kpis?.ACTIVE_DISASTERS ?? 0}</div>
          <div className="font-bold text-lg mt-2 opacity-90">of {kpis?.TOTAL_DISASTERS ?? 0} total</div>
        </div>
      </Link>

      {/* Metric Card 2: Total Victims */}
      <Link href="/victims" className="col-span-1 md:col-span-2 lg:col-span-4 bg-cobalt-dark rounded-[2rem] p-6 flex flex-col justify-between shadow-sm border border-cobalt-dark text-white min-h-[200px] cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all group">
        <div className="flex justify-between items-start mb-4">
          <span className="font-mono text-sm uppercase tracking-widest font-bold opacity-90 group-hover:text-azure transition-colors">Total Victims</span>
          <span className="material-symbols-outlined icon-thick text-[28px] opacity-90 group-hover:scale-110 transition-transform">person</span>
        </div>
        <div>
          <div className="font-display text-7xl leading-none">{kpis?.TOTAL_VICTIMS?.toLocaleString() ?? 0}</div>
          <div className="font-bold text-lg mt-2 text-azure bg-white/20 inline-block px-3 py-1 rounded-lg">{kpis?.MISSING_VICTIMS ?? 0} missing</div>
        </div>
      </Link>

      {/* Metric Card 3: Shelters */}
      <Link href="/shelters" className="col-span-1 md:col-span-2 lg:col-span-4 bg-azure rounded-[2rem] p-6 flex flex-col justify-between shadow-sm border border-blue-100 min-h-[200px] cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all group hover:bg-blue-50">
        <div className="flex justify-between items-start mb-4">
          <span className="font-mono text-sm text-cobalt uppercase tracking-widest font-bold group-hover:text-cobalt-dark transition-colors">Shelters</span>
          <span className="material-symbols-outlined icon-thick text-[28px] text-cobalt/50 group-hover:text-cobalt group-hover:scale-110 transition-all">home_pin</span>
        </div>
        <div>
          <div className="font-display text-7xl text-black leading-none">{kpis?.TOTAL_SHELTERS ?? 0}</div>
          <div className="font-bold text-cobalt/80 text-lg mt-2">Total registered</div>
        </div>
      </Link>

      {/* Metric Card 4: Personnel */}
      <Link href="/personnel" className="col-span-1 md:col-span-2 lg:col-span-4 bg-azure rounded-[2rem] p-6 flex flex-col justify-between shadow-sm border border-blue-100 min-h-[200px] cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all group hover:bg-blue-50">
        <div className="flex justify-between items-start mb-4">
          <span className="font-mono text-sm text-cobalt uppercase tracking-widest font-bold group-hover:text-cobalt-dark transition-colors">Personnel</span>
          <span className="material-symbols-outlined icon-thick text-[28px] text-cobalt/50 group-hover:text-cobalt group-hover:scale-110 transition-all">group</span>
        </div>
        <div>
          <div className="font-display text-7xl text-black leading-none">{kpis?.TOTAL_PERSONNEL ?? 0}</div>
          <div className="font-bold text-cobalt/80 text-lg mt-2">Registered staff</div>
        </div>
      </Link>

      {/* Metric Card 5: Warehouses */}
      <Link href="/warehouses" className="col-span-1 md:col-span-2 lg:col-span-4 bg-azure rounded-[2rem] p-6 flex flex-col justify-between shadow-sm border border-blue-100 min-h-[200px] cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all group hover:bg-blue-50">
        <div className="flex justify-between items-start mb-4">
          <span className="font-mono text-sm text-cobalt uppercase tracking-widest font-bold group-hover:text-cobalt-dark transition-colors">Warehouses</span>
          <span className="material-symbols-outlined icon-thick text-[28px] text-cobalt/50 group-hover:text-cobalt group-hover:scale-110 transition-all">inventory_2</span>
        </div>
        <div>
          <div className="font-display text-7xl text-black leading-none">{kpis?.TOTAL_WAREHOUSES ?? 0}</div>
          <div className="font-bold text-cobalt bg-blue-100 inline-block px-3 py-1 rounded-lg text-lg mt-2 group-hover:bg-blue-200 transition-colors">{kpis?.TOTAL_DONATIONS ?? 0} donations stored</div>
        </div>
      </Link>

      {/* Metric Card 6: Vehicles */}
      <Link href="/vehicles" className="col-span-1 md:col-span-2 lg:col-span-4 bg-azure rounded-[2rem] p-6 flex flex-col justify-between shadow-sm border border-blue-100 min-h-[200px] cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all group hover:bg-blue-50">
        <div className="flex justify-between items-start mb-4">
          <span className="font-mono text-sm text-cobalt uppercase tracking-widest font-bold group-hover:text-cobalt-dark transition-colors">Vehicles</span>
          <span className="material-symbols-outlined icon-thick text-[28px] text-cobalt/50 group-hover:text-cobalt group-hover:scale-110 transition-all">directions_car</span>
        </div>
        <div>
          <div className="font-display text-7xl text-black leading-none">{kpis?.TOTAL_VEHICLES ?? 0}</div>
          <div className="font-bold text-cobalt bg-blue-100 inline-block px-3 py-1 rounded-lg text-lg mt-2 group-hover:bg-blue-200 transition-colors">{kpis?.AVAILABLE_VEHICLES ?? 0} available</div>
        </div>
      </Link>



      {/* Recent Disasters Table */}
      <div className="col-span-1 md:col-span-4 lg:col-span-8 bg-white rounded-[2rem] flex flex-col shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-azure">
          <h3 className="font-display text-2xl text-black uppercase tracking-tight">Recent Disasters</h3>
        </div>
        <div className="overflow-x-auto p-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {["Name", "Type", "Districts", "Duration"].map((h) => (
                  <th key={h} className="p-4 font-mono text-xs text-gray-500 uppercase tracking-wider font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-black">
              {data?.recent_disasters?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 font-bold">
                    No disasters recorded yet.
                  </td>
                </tr>
              ) : (
                data?.recent_disasters?.map((d) => (
                  <tr key={d.DISASTER_NAME} className="hover:bg-azure transition-colors group border-b border-gray-100 last:border-none">
                    <td className="p-4 font-bold text-cobalt">{d.DISASTER_NAME}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-100 text-cobalt font-bold text-xs uppercase tracking-wide">
                        {d.DISASTER_TYPE}
                      </span>
                    </td>
                    <td className="p-4">{d.AFFECTED_DISTRICTS || "—"}</td>
                    <td className="p-4 font-bold text-gray-600">
                      {d.DURATION_DAYS != null ? `${d.DURATION_DAYS} days` : <span className="text-cobalt">Ongoing</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shelter Occupancy */}
      <div className="col-span-1 md:col-span-4 lg:col-span-4 bg-white rounded-[2rem] flex flex-col shadow-sm border border-gray-200 min-h-[400px]">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-azure">
          <h3 className="font-display text-2xl text-black uppercase tracking-tight">Shelter Occupancy</h3>
          <Link href="/shelters" className="text-white font-bold text-sm hover:bg-cobalt-dark bg-cobalt px-4 py-2 rounded-xl transition-colors">
            View All
          </Link>
        </div>
        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
          {data?.shelter_stats?.length === 0 ? (
            <p className="text-gray-500 font-bold text-sm text-center py-4">
              No shelters registered yet.
            </p>
          ) : (
            data?.shelter_stats?.map((s) => {
              const pct = s.CAPACITY > 0 ? Math.round((s.CURRENT_OCCUPANCY / s.CAPACITY) * 100) : 0;
              const barColor = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-cobalt";
              
              return (
                <div key={s.SHELTER_ID} className="flex flex-col gap-3">
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-sm text-black">{s.SHELTER_NAME}</span>
                    <span className="font-mono text-xs text-gray-500 font-bold bg-azure px-2 py-1 rounded-md">
                      {s.CURRENT_OCCUPANCY} / {s.CAPACITY}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-blue-50 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="text-right font-bold text-[10px] uppercase tracking-wider text-gray-500">
                    {pct === 0 ? "0%" : pct < 1 ? "<1%" : `${pct}%`} occupancy
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
