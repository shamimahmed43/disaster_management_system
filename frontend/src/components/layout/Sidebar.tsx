"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSystemStatus } from "@/services/api";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    title: "",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/map", label: "Live Map", icon: "map" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/disasters", label: "Disasters", icon: "crisis_alert" },
      { href: "/disasters/new", label: "New Incident", icon: "add_alert" },
      { href: "/victims", label: "Victim Registry", icon: "list_alt" },
      { href: "/shelters", label: "Shelters", icon: "house" },
    ],
  },
  {
    title: "Logistics",
    items: [
      { href: "/warehouse", label: "Warehouses", icon: "warehouse" },
      { href: "/relief", label: "Relief Dist.", icon: "local_shipping" },
      { href: "/vehicles", label: "Fleet", icon: "directions_car" },
      { href: "/donations", label: "Donations", icon: "volunteer_activism" },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/personnel", label: "Personnel", icon: "badge" },
      { href: "/volunteers", label: "Volunteers", icon: "groups" },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/users", label: "User Approvals", icon: "how_to_reg", adminOnly: true },
      { href: "/query-builder", label: "SQL Queries", icon: "manage_search", adminOnly: true },
    ],
  },
];

type DBStatus = "checking" | "connected" | "disconnected";

import { useAuth } from "@/contexts/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const [dbStatus, setDbStatus] = useState<DBStatus>("checking");

  useEffect(() => {
    const checkStatus = () => {
      getSystemStatus()
        .then((s) => setDbStatus(s.database ? "connected" : "disconnected"))
        .catch(() => setDbStatus("disconnected"));
    };
    checkStatus();
    // Re-check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (href: string) => {
    if (href === "/disasters/new") return pathname === href;
    if (href === "/disasters") return pathname === "/disasters" || (pathname.startsWith("/disasters/") && pathname !== "/disasters/new");
    return pathname === href || pathname.startsWith(href + "/");
  };

  const statusDot =
    dbStatus === "connected"
      ? "bg-stable-emerald"
      : dbStatus === "checking"
      ? "bg-warning-amber animate-pulse"
      : "bg-emergency-red";

  const statusText =
    dbStatus === "connected"
      ? "Oracle DB: Connected"
      : dbStatus === "checking"
      ? "Oracle DB: Checking..."
      : "Oracle DB: Disconnected";

  return (
    <nav className="hidden md:flex flex-col w-64 h-full bg-white rounded-[2rem] shadow-sm shrink-0 relative z-10 overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="p-6">
        <h2 className="font-display text-2xl text-black tracking-tight">Mission Control</h2>
        <p className="font-mono text-xs text-gray-500 mt-2 uppercase tracking-wider">Disaster System</p>
      </div>
      
      {/* CTA */}
      <div className="px-6 pb-4">
        <Link href="/disasters/new" className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-cobalt hover:bg-cobalt-dark text-white rounded-xl transition-colors font-bold text-sm">
          <span className="material-symbols-outlined icon-thick text-[18px]">add</span>
          New Incident
        </Link>
      </div>
      
      {/* Scrollable Links */}
      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        <ul className="flex flex-col gap-1 px-4">
          {NAV_SECTIONS.flatMap(section => section.items)
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                    active
                      ? "bg-azure text-cobalt font-bold"
                      : "text-gray-600 hover:bg-azure hover:text-cobalt"
                  }`}
                >
                  <span
                    className="material-symbols-outlined icon-thick text-[20px]"
                    style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer */}
      <div className="p-6 bg-gray-50 mt-auto border-t border-gray-100">
        <div className="flex items-center gap-2 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
          <span className={`material-symbols-outlined icon-thick text-[14px] ${dbStatus === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
            database
          </span>
          <span>{statusText}</span>
        </div>
      </div>
    </nav>
  );
}
