"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/map", label: "Live Map" },
  { href: "/victims", label: "Registry" },
  { href: "/shelters", label: "Shelters" },
];

export type SearchResult = {
  type:
    | "disaster"
    | "victim"
    | "shelter"
    | "warehouse"
    | "donation"
    | "distribution"
    | "vehicle"
    | "personnel"
    | "volunteer"
    | "medical";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  badge: string;
};

const ENTITY_CONFIG: Record<
  string,
  { icon: string; iconColor: string; badgeClass: string }
> = {
  disaster: {
    icon: "crisis_alert",
    iconColor: "text-red-500",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
  },
  victim: {
    icon: "person",
    iconColor: "text-amber-500",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  shelter: {
    icon: "night_shelter",
    iconColor: "text-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  warehouse: {
    icon: "warehouse",
    iconColor: "text-indigo-500",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  donation: {
    icon: "volunteer_activism",
    iconColor: "text-green-500",
    badgeClass: "bg-green-50 text-green-700 border-green-200",
  },
  distribution: {
    icon: "local_shipping",
    iconColor: "text-cyan-500",
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  vehicle: {
    icon: "directions_car",
    iconColor: "text-blue-500",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  personnel: {
    icon: "badge",
    iconColor: "text-purple-500",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  volunteer: {
    icon: "handshake",
    iconColor: "text-teal-500",
    badgeClass: "bg-teal-50 text-teal-700 border-teal-200",
  },
  medical: {
    icon: "medical_services",
    iconColor: "text-rose-500",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const token = localStorage.getItem("dms_token");
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API}/search?q=${encodeURIComponent(search.trim())}`, {
          headers,
        });
        if (!res.ok) throw new Error("Search failed");
        const json = await res.json();
        setResults(json.data || []);
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
  }, [search]);

  function handleSelect(href: string) {
    setSearch("");
    setShowDropdown(false);
    router.push(href);
  }

  return (
    <header className="h-20 w-full bg-cobalt rounded-[2rem] shadow-sm flex justify-between items-center px-8 shrink-0 relative z-30 border border-cobalt-dark">
      {/* Left: Brand + Global Search + Nav */}
      <div className="flex items-center gap-6 xl:gap-8 h-full">
        <h1 className="font-display text-xl text-white hidden lg:block tracking-tight">
          Disaster Ops CC
        </h1>

        {/* Global Search */}
        <div className="relative w-72 sm:w-80 lg:w-96 group" ref={searchRef}>
          <span className="material-symbols-outlined icon-thick absolute left-4 top-1/2 -translate-y-1/2 text-blue-200 text-[18px]">
            {searching ? "progress_activity" : "search"}
          </span>
          <input
            className="w-full bg-cobalt-dark rounded-xl py-2.5 pl-11 pr-10 text-sm font-medium text-white placeholder:text-blue-200 border border-cobalt-light/20 focus:border-azure focus:ring-2 focus:ring-azure focus:outline-none transition-all duration-300"
            placeholder="Global search (disasters, victims, shelters...)"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => search.trim() && setShowDropdown(true)}
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setShowDropdown(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200 hover:text-white transition-colors"
              title="Clear search"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}

          {/* Dropdown Results */}
          {showDropdown && (
            <div className="absolute top-full left-0 mt-2 w-[340px] sm:w-[420px] bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[460px] flex flex-col">
              <div className="bg-azure px-4 py-2.5 border-b border-gray-200 flex justify-between items-center text-xs font-mono font-bold text-gray-600 uppercase tracking-wider">
                <span>Search Results</span>
                <span>{results.length} found</span>
              </div>

              <div className="overflow-y-auto divide-y divide-gray-100 flex-1 custom-scrollbar">
                {results.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <span className="material-symbols-outlined icon-thick text-[36px] text-gray-300 mb-2 block">
                      search_off
                    </span>
                    <p className="text-sm font-bold">No results found</p>
                    <p className="text-xs text-gray-400 mt-1">Try searching by ID, name, district, or keyword</p>
                  </div>
                ) : (
                  results.map((r, i) => {
                    const cfg = ENTITY_CONFIG[r.type] || {
                      icon: "info",
                      iconColor: "text-gray-500",
                      badgeClass: "bg-gray-50 text-gray-700 border-gray-200",
                    };
                    return (
                      <button
                        key={`${r.type}-${r.id}-${i}`}
                        onClick={() => handleSelect(r.href)}
                        className="w-full flex items-start gap-3.5 px-4 py-3 hover:bg-azure transition-colors text-left group/item"
                      >
                        <div className="mt-0.5 p-2 rounded-xl bg-gray-50 group-hover/item:bg-white border border-gray-200 shrink-0 transition-colors">
                          <span
                            className={`material-symbols-outlined text-[18px] ${cfg.iconColor} block`}
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            {cfg.icon}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-black text-sm font-bold truncate group-hover/item:text-cobalt transition-colors">
                              {r.title}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${cfg.badgeClass}`}
                            >
                              {r.badge}
                            </span>
                          </div>
                          <div className="text-gray-500 text-xs font-medium truncate">
                            {r.subtitle}
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-gray-300 group-hover/item:text-cobalt text-[16px] shrink-0 mt-2 transition-colors">
                          chevron_right
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Nav */}
        <nav className="hidden md:flex h-full items-center gap-8 ml-2">
          {NAV_LINKS.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`h-full flex items-center font-bold text-sm transition-colors ${
                  active
                    ? "text-white border-b-4 border-white pt-1"
                    : "text-blue-200 hover:text-white border-b-4 border-transparent pt-1"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <Link
          href="/view/dashboard"
          className="text-blue-200 hover:text-white bg-cobalt-dark hover:bg-cobalt-light transition-colors rounded-xl p-2.5 inline-flex"
          title="Public View"
        >
          <span className="material-symbols-outlined icon-thick">public</span>
        </Link>
        <button
          onClick={() => {
            localStorage.removeItem("dms_token");
            localStorage.removeItem("dms_user");
            router.push("/admin/login");
          }}
          className="text-blue-200 hover:text-white bg-cobalt-dark hover:bg-cobalt-light transition-colors rounded-xl p-2.5 inline-flex"
          title="Logout"
        >
          <span className="material-symbols-outlined icon-thick">logout</span>
        </button>
      </div>
    </header>
  );
}
