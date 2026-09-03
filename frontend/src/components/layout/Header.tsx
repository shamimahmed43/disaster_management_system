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

type SearchResult = {
  type: "disaster" | "victim" | "shelter";
  label: string;
  sub: string;
  href: string;
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
        const [disRes, vicRes] = await Promise.all([
          fetch(`${API}/disasters?search=${encodeURIComponent(search)}`).then((r) => r.json()),
          fetch(`${API}/victims?search=${encodeURIComponent(search)}`).then((r) => r.json()),
        ]);
        const disasterResults: SearchResult[] = (disRes.data ?? []).slice(0, 4).map((d: any) => ({
          type: "disaster",
          label: d.DISASTER_NAME,
          sub: `${d.DISASTER_TYPE} · ${d.DIVISION}${d.DISTRICT ? `, ${d.DISTRICT}` : ""}`,
          href: `/disasters`,
        }));
        const victimResults: SearchResult[] = (vicRes.data ?? []).slice(0, 3).map((v: any) => ({
          type: "victim",
          label: v.HOUSEHOLD_HEAD_NAME,
          sub: `${v.VICTIM_ID} · ${v.DISASTER_NAME ?? "—"}`,
          href: `/victims`,
        }));
        setResults([...disasterResults, ...victimResults]);
        setShowDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [search]);

  function handleSelect(href: string) {
    setSearch("");
    setShowDropdown(false);
    router.push(href);
  }

  const ICON_MAP = {
    disaster: { icon: "crisis_alert", color: "text-emergency-red" },
    victim: { icon: "personal_injury", color: "text-warning-amber" },
    shelter: { icon: "night_shelter", color: "text-stable-emerald" },
  };

  return (
    <header className="h-20 w-full bg-cobalt rounded-[2rem] shadow-sm flex justify-between items-center px-8 shrink-0 relative z-10 border border-cobalt-dark">
      {/* Left: Brand + Search + Nav */}
      <div className="flex items-center gap-8 h-full">
        <h1 className="font-display text-xl text-white hidden lg:block">Disaster Ops CC</h1>
        
        {/* Global Search — real API */}
        <div className="relative hidden xl:block w-80 group" ref={searchRef}>
          <span className="material-symbols-outlined icon-thick absolute left-4 top-1/2 -translate-y-1/2 text-blue-200 text-[18px]">
            {searching ? "progress_activity" : "search"}
          </span>
          <input
            className="w-full bg-cobalt-dark rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-white placeholder:text-blue-200 border-none focus:ring-2 focus:ring-azure focus:outline-none transition-all duration-300"
            placeholder="Search disasters, victims..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
          />
          {search && (
            <button onClick={() => { setSearch(""); setShowDropdown(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200 hover:text-white">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-50">
              {results.length === 0 ? (
                <div className="px-4 py-3 text-gray-500 text-sm font-medium">No results found</div>
              ) : (
                <>
                  {results.map((r, i) => {
                    const { icon, color } = ICON_MAP[r.type];
                    return (
                      <button key={i} onClick={() => handleSelect(r.href)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-azure transition-colors text-left border-b border-gray-100 last:border-0">
                        <span className={`material-symbols-outlined text-[18px] ${color} shrink-0`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                        <div className="min-w-0">
                          <div className="text-black text-sm font-bold truncate">{r.label}</div>
                          <div className="text-gray-500 text-xs font-mono truncate uppercase tracking-wider">{r.sub}</div>
                        </div>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* Quick Nav */}
        <nav className="hidden md:flex h-full items-center gap-8 ml-4">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link key={link.href} href={link.href}
                className={`h-full flex items-center font-bold text-sm transition-colors ${
                  active
                    ? "text-white border-b-4 border-white pt-1"
                    : "text-blue-200 hover:text-white border-b-4 border-transparent pt-1"
                }`}>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        <Link href="/disasters/new"
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white text-cobalt hover:bg-gray-100 transition-colors rounded-xl font-bold text-sm shadow-sm">
          <span className="material-symbols-outlined icon-thick text-[18px]">warning</span>
          New Incident
        </Link>
        <div className="h-8 w-[2px] bg-cobalt-light mx-2"></div>
        <Link href="/view/dashboard"
          className="text-blue-200 hover:text-white bg-cobalt-dark hover:bg-cobalt-light transition-colors rounded-xl p-2.5 inline-flex"
          title="Public View"
        >
          <span className="material-symbols-outlined icon-thick">public</span>
        </Link>
        <button onClick={() => {
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
