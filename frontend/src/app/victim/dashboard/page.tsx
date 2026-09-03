"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type User = {
  user_id: string;
  email: string;
  name: string;
  role: string;
  victim_id?: string;
};

type VictimData = {
  VICTIM_ID: string;
  HOUSEHOLD_HEAD_NAME: string;
  AGE?: number | null;
  GENDER?: string | null;
  NID_NUMBER?: string | null;
  REPORTED_DATE?: string | null;
  LAST_KNOWN_LOCATION?: string | null;
  MISSING_PERSON?: string | null;
  SPECIAL_NEEDS?: string | null;
  DISASTER_NAME?: string | null;
  phones?: string[];
  family_members?: Array<{
    MEMBER_SEQ_NO: number;
    NAME: string;
  }>;
  special_needs?: string[];
};

type ShelterStay = {
  SHELTER_NAME: string;
  SHELTER_ID: string;
  CHECKIN_DATE: string;
  CHECKOUT_DATE: string | null;
  CURRENT_STATUS: string;
  ADDRESS_LINE?: string | null;
  CONTACT_PERSON_NAME?: string | null;
  CONTACT_PERSON_PHONE?: string | null;
  LATITUDE?: string | null;
  LONGITUDE?: string | null;
};

export default function VictimDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [victim, setVictim] = useState<VictimData | null>(null);
  const [stays, setStays] = useState<ShelterStay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("dms_user");
    if (!stored) {
      router.push("/victim/login");
      return;
    }
    const u = JSON.parse(stored) as User;
    if (u.role !== "victim") {
      router.push("/");
      return;
    }
    setUser(u);

    const token = localStorage.getItem("dms_token");
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    if (u.victim_id) {
      Promise.all([
        fetch(`${API}/victims/${u.victim_id}`, { headers }).then((r) => r.json()).catch(() => ({ data: null })),
        fetch(`${API}/shelters/stays/${u.victim_id}`, { headers }).then((r) => r.json()).catch(() => ({ data: [] })),
      ])
        .then(([vData, stayData]) => {
          if (vData?.data) setVictim(vData.data);
          if (stayData?.data) setStays(stayData.data);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("dms_token");
    localStorage.removeItem("dms_user");
    fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#061014] text-slate-200 flex flex-col items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-emerald-400 text-4xl animate-spin">
            progress_activity
          </span>
          <span className="text-sm text-slate-400 uppercase tracking-widest">
            Loading Victim Portal...
          </span>
        </div>
      </div>
    );
  }

  const currentStay = stays.find((s) => !s.CHECKOUT_DATE) || stays[0];
  const familyMembers = victim?.family_members || [];
  const phones = victim?.phones || [];

  return (
    <div className="min-h-screen bg-[#061014] text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <header className="bg-[#0c1921] border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <span className="material-symbols-outlined text-2xl">person</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">
                Welcome, {user?.name || victim?.HOUSEHOLD_HEAD_NAME || "Victim"}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block px-2.5 py-0.5 text-xs font-mono font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded">
                  VICTIM PORTAL
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ID: {victim?.VICTIM_ID || user?.victim_id || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              href="/"
              className="px-4 py-2 text-xs font-mono text-slate-300 hover:text-white bg-slate-800/60 border border-slate-700 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">home</span>
              Home
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-xs font-mono text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Logout
            </button>
          </div>
        </header>

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: My Profile */}
          <section className="bg-[#0c1921] border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400 text-xl">
                    badge
                  </span>
                  <h2 className="text-lg font-semibold text-white">My Profile</h2>
                </div>
                <span className="text-xs font-mono text-slate-400 uppercase">
                  Personal Details
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-slate-400 font-mono mb-1 uppercase">Full Name</div>
                  <div className="font-medium text-slate-100">{victim?.HOUSEHOLD_HEAD_NAME || user?.name || "N/A"}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 font-mono mb-1 uppercase">Gender</div>
                  <div className="font-medium text-slate-100">{victim?.GENDER || "N/A"}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 font-mono mb-1 uppercase">NID Number</div>
                  <div className="font-mono text-slate-100">{victim?.NID_NUMBER || "N/A"}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 font-mono mb-1 uppercase">Reported Date</div>
                  <div className="font-medium text-slate-100">
                    {victim?.REPORTED_DATE ? new Date(victim.REPORTED_DATE).toLocaleDateString() : "N/A"}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 font-mono mb-1 uppercase">Last Seen Location</div>
                  <div className="font-medium text-slate-100">{victim?.LAST_KNOWN_LOCATION || "N/A"}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-400 font-mono mb-1 uppercase">Missing Person Status</div>
                  <div>
                    {victim?.MISSING_PERSON === "Y" ? (
                      <span className="inline-block px-2.5 py-0.5 text-xs font-mono font-medium bg-red-500/10 border border-red-500/30 text-red-400 rounded">
                        Missing
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 text-xs font-mono font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded">
                        Safe / Accounted For
                      </span>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-xs text-slate-400 font-mono mb-1 uppercase">Special Needs</div>
                  <div className="text-slate-100">
                    {victim?.special_needs && victim.special_needs.length > 0
                      ? victim.special_needs.join(", ")
                      : victim?.SPECIAL_NEEDS || "None reported"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Card 2: Shelter Information */}
          <section className="bg-[#0c1921] border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400 text-xl">
                    home_pin
                  </span>
                  <h2 className="text-lg font-semibold text-white">Shelter Assignment</h2>
                </div>
                <span className="text-xs font-mono text-slate-400 uppercase">
                  Current Status
                </span>
              </div>

              {currentStay ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="sm:col-span-2">
                    <div className="text-xs text-slate-400 font-mono mb-1 uppercase">Shelter Name</div>
                    <div className="text-base font-semibold text-white">{currentStay.SHELTER_NAME}</div>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="text-xs text-slate-400 font-mono mb-1 uppercase">Address</div>
                    <div className="text-slate-100">{currentStay.ADDRESS_LINE || "N/A"}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 font-mono mb-1 uppercase">Contact Person</div>
                    <div className="text-slate-100 font-medium">
                      {currentStay.CONTACT_PERSON_NAME || currentStay.CONTACT_PERSON_PHONE || "N/A"}
                    </div>
                    {currentStay.CONTACT_PERSON_PHONE && currentStay.CONTACT_PERSON_NAME && (
                      <div className="text-xs font-mono text-slate-400">{currentStay.CONTACT_PERSON_PHONE}</div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 font-mono mb-1 uppercase">Coordinates</div>
                    <div className="font-mono text-slate-100">
                      {currentStay.LATITUDE && currentStay.LONGITUDE
                        ? `${currentStay.LATITUDE}, ${currentStay.LONGITUDE}`
                        : "N/A"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 font-mono mb-1 uppercase">Check-In Date</div>
                    <div className="text-slate-100 font-medium">
                      {currentStay.CHECKIN_DATE ? new Date(currentStay.CHECKIN_DATE).toLocaleDateString() : "N/A"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 font-mono mb-1 uppercase">Check-Out Date</div>
                    <div className="text-slate-100 font-medium">
                      {currentStay.CHECKOUT_DATE ? new Date(currentStay.CHECKOUT_DATE).toLocaleDateString() : "Currently Residing"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg">
                  <span className="material-symbols-outlined text-slate-600 text-4xl mb-2">
                    night_shelter
                  </span>
                  <p className="text-slate-400 text-sm">
                    You are not currently assigned to any shelter.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Card 3: Family Members */}
          <section className="bg-[#0c1921] border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400 text-xl">
                    group
                  </span>
                  <h2 className="text-lg font-semibold text-white">Family Members</h2>
                </div>
                <span className="text-xs font-mono text-slate-400 uppercase">
                  Registered Members
                </span>
              </div>

              {familyMembers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs font-mono text-slate-400 uppercase">
                        <th className="py-2.5 px-3">Sequence #</th>
                        <th className="py-2.5 px-3">Member Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {familyMembers.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="py-3 px-3 font-mono text-slate-400">#{m.MEMBER_SEQ_NO || idx + 1}</td>
                          <td className="py-3 px-3 font-medium text-slate-100">{m.NAME}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg">
                  <span className="material-symbols-outlined text-slate-600 text-4xl mb-2">
                    group_off
                  </span>
                  <p className="text-slate-400 text-sm">
                    No family member record found.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Card 4: Emergency Contacts (VICTIM_PHONE table) */}
          <section className="bg-[#0c1921] border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400 text-xl">
                    call
                  </span>
                  <h2 className="text-lg font-semibold text-white">Emergency Contacts</h2>
                </div>
                <span className="text-xs font-mono text-slate-400 uppercase">
                  VICTIM_PHONE
                </span>
              </div>

              {phones.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs font-mono text-slate-400 uppercase">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Phone Number</th>
                        <th className="py-2.5 px-3">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {phones.map((phone, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="py-3 px-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-medium text-slate-100">{phone}</td>
                          <td className="py-3 px-3">
                            <span className="inline-block px-2 py-0.5 text-xs font-mono font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded">
                              {idx === 0 ? "Primary Contact" : "Secondary Contact"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg">
                  <span className="material-symbols-outlined text-slate-600 text-4xl mb-2">
                    phone_disabled
                  </span>
                  <p className="text-slate-400 text-sm">
                    No emergency phone contact recorded.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
