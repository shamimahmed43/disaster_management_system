"use client";

import { useEffect, useState, useCallback } from "react";
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

type FamilyMember = {
  MEMBER_SEQ_NO: number;
  NAME: string;
};

type VictimData = {
  VICTIM_ID: string;
  HOUSEHOLD_HEAD_NAME: string;
  GENDER?: string | null;
  NID_NUMBER?: string | null;
  REPORTED_DATE?: string | null;
  LAST_KNOWN_LOCATION?: string | null;
  MISSING_PERSON?: string | null;
  SPECIAL_NEEDS?: string | null;
  DISASTER_NAME?: string | null;
  phones?: string[];
  family_members?: FamilyMember[];
  special_needs?: string[];
};

function parseMemberDetails(rawName: string) {
  if (!rawName) return { name: "N/A", relation: "Dependent", age: null };
  const match = rawName.match(/^(.*?)\s*\((.*?)\)$/);
  if (match) {
    const cleanName = match[1].trim();
    const inside = match[2].trim();
    const parts = inside.split(",").map((p) => p.trim());
    let relation = "Dependent";
    let age: string | null = null;
    for (const part of parts) {
      if (part.toLowerCase().includes("yr")) {
        age = part;
      } else {
        relation = part;
      }
    }
    return { name: cleanName, relation, age };
  }
  return { name: rawName, relation: "Family Member", age: null };
}

export default function VictimDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [victim, setVictim] = useState<VictimData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddFamilyOpen, setIsAddFamilyOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  // Alert/Notification state
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form states
  const [profileForm, setProfileForm] = useState({
    household_head_name: "",
    gender: "",
    nid_number: "",
    last_known_location: "",
    special_needs: "",
  });
  const [submittingProfile, setSubmittingProfile] = useState(false);

  const [familyForm, setFamilyForm] = useState({
    name: "",
    age: "",
    relation_to_head: "Spouse",
  });
  const [submittingFamily, setSubmittingFamily] = useState(false);

  const [contactForm, setContactForm] = useState({
    phone: "",
  });
  const [submittingContact, setSubmittingContact] = useState(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const loadVictimData = useCallback(async (victimId: string, token: string | null) => {
    try {
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API}/victims/${victimId}`, {
        headers,
        credentials: "include",
      });
      const data = await res.json();
      if (data?.data) {
        setVictim(data.data);
        setProfileForm({
          household_head_name: data.data.HOUSEHOLD_HEAD_NAME || "",
          gender: data.data.GENDER || "",
          nid_number: data.data.NID_NUMBER || "",
          last_known_location: data.data.LAST_KNOWN_LOCATION || "",
          special_needs: data.data.SPECIAL_NEEDS || "",
        });
      }
    } catch (err) {
      console.error("Failed to load victim data", err);
    } finally {
      setLoading(false);
    }
  }, []);

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
    if (u.victim_id) {
      loadVictimData(u.victim_id, token);
    } else {
      setLoading(false);
    }
  }, [router, loadVictimData]);

  function handleLogout() {
    localStorage.removeItem("dms_token");
    localStorage.removeItem("dms_user");
    fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    router.push("/");
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!victim?.VICTIM_ID) return;

    setSubmittingProfile(true);
    const token = localStorage.getItem("dms_token");
    try {
      const res = await fetch(`${API}/victims/${victim.VICTIM_ID}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          household_head_name: profileForm.household_head_name.trim(),
          gender: profileForm.gender || null,
          nid_number: profileForm.nid_number.trim() || null,
          last_known_location: profileForm.last_known_location.trim() || null,
          special_needs: profileForm.special_needs.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        showToast(json.error || "Failed to update profile", "error");
        return;
      }

      showToast("Profile updated successfully!");
      setIsEditProfileOpen(false);
      await loadVictimData(victim.VICTIM_ID, token);
    } catch {
      showToast("An error occurred while updating profile.", "error");
    } finally {
      setSubmittingProfile(false);
    }
  }

  async function handleAddFamilySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!victim?.VICTIM_ID) return;

    setSubmittingFamily(true);
    const token = localStorage.getItem("dms_token");
    try {
      const res = await fetch(`${API}/victims/${victim.VICTIM_ID}/family`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          name: familyForm.name.trim(),
          age: familyForm.age ? parseInt(familyForm.age, 10) : null,
          relation_to_head: familyForm.relation_to_head.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        showToast(json.error || "Failed to add family member", "error");
        return;
      }

      showToast("Family member added successfully!");
      setFamilyForm({ name: "", age: "", relation_to_head: "Spouse" });
      setIsAddFamilyOpen(false);
      await loadVictimData(victim.VICTIM_ID, token);
    } catch {
      showToast("An error occurred while adding family member.", "error");
    } finally {
      setSubmittingFamily(false);
    }
  }

  async function handleAddContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!victim?.VICTIM_ID) return;

    setSubmittingContact(true);
    const token = localStorage.getItem("dms_token");
    try {
      const res = await fetch(`${API}/victims/${victim.VICTIM_ID}/phone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          phone: contactForm.phone.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        showToast(json.error || "Failed to add emergency contact", "error");
        return;
      }

      showToast("Emergency contact added successfully!");
      setContactForm({ phone: "" });
      setIsAddContactOpen(false);
      await loadVictimData(victim.VICTIM_ID, token);
    } catch {
      showToast("An error occurred while adding emergency contact.", "error");
    } finally {
      setSubmittingContact(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#061014] text-slate-200 flex flex-col items-center justify-center font-mono">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-emerald-400 text-4xl animate-spin">progress_activity</span>
          <span className="text-sm text-slate-400 uppercase tracking-widest">Loading Victim Portal...</span>
        </div>
      </div>
    );
  }

  const familyMembers = victim?.family_members || [];
  const phones = victim?.phones || [];

  return (
    <div className="min-h-screen bg-[#061014] text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg border shadow-lg flex items-center gap-3 font-mono text-sm transition-all ${toast.type === "success" ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200" : "bg-red-950/90 border-red-500/50 text-red-200"}`}>
          <span className="material-symbols-outlined text-lg">{toast.type === "success" ? "check_circle" : "error"}</span>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75"><span className="material-symbols-outlined text-sm">close</span></button>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        <header className="bg-[#0c1921] border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400"><span className="material-symbols-outlined text-2xl">person</span></div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Welcome, {victim?.HOUSEHOLD_HEAD_NAME || user?.name || "Victim"}</h1>
              <div className="flex items-center gap-2 mt-1"><span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded">VICTIM PORTAL</span></div>
            </div>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-sm">logout</span>Logout</button>
        </header>

        <section className="bg-[#0c1921] border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
            <h2 className="text-lg font-semibold text-white">My Profile</h2>
            <button onClick={() => setIsEditProfileOpen(true)} className="px-3 py-1.5 text-xs font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2"><span className="material-symbols-outlined text-sm">edit</span>Edit Profile</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 text-sm">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-3.5"><div className="text-xs text-slate-400 font-mono mb-1 uppercase">Full Name</div><div className="font-medium text-slate-100">{victim?.HOUSEHOLD_HEAD_NAME || user?.name || "N/A"}</div></div>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-3.5"><div className="text-xs text-slate-400 font-mono mb-1 uppercase">NID Number</div><div className="font-mono text-slate-100">{victim?.NID_NUMBER || "N/A"}</div></div>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-3.5"><div className="text-xs text-slate-400 font-mono mb-1 uppercase">Gender</div><div className="font-medium text-slate-100">{victim?.GENDER || "N/A"}</div></div>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-3.5"><div className="text-xs text-slate-400 font-mono mb-1 uppercase">Primary Phone</div><div className="font-mono text-slate-100">{phones[0] || "N/A"}</div></div>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-3.5"><div className="text-xs text-slate-400 font-mono mb-1 uppercase">Reported Date</div><div className="font-medium text-slate-100">{victim?.REPORTED_DATE ? new Date(victim.REPORTED_DATE).toLocaleDateString() : "N/A"}</div></div>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-3.5"><div className="text-xs text-slate-400 font-mono mb-1 uppercase">Disaster Event</div><div className="font-medium text-slate-100">{victim?.DISASTER_NAME || "N/A"}</div></div>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-3.5 sm:col-span-2"><div className="text-xs text-slate-400 font-mono mb-1 uppercase">Present Address / Location</div><div className="font-medium text-slate-100">{victim?.LAST_KNOWN_LOCATION || "N/A"}</div></div>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-3.5"><div className="text-xs text-slate-400 font-mono mb-1 uppercase">Status</div><div>{victim?.MISSING_PERSON === "Y" ? <span className="px-2 py-0.5 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded">Missing</span> : <span className="px-2 py-0.5 text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded">Safe</span>}</div></div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-[#0c1921] border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <h2 className="text-lg font-semibold text-white">Family Members</h2>
              <button onClick={() => setIsAddFamilyOpen(true)} className="px-3 py-1.5 text-xs font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">+ Add Member</button>
            </div>
            {familyMembers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-mono text-slate-400 uppercase bg-slate-900/30">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Member Name</th>
                      <th className="py-2.5 px-3">Age</th>
                      <th className="py-2.5 px-3">Relationship</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {familyMembers.map((m, idx) => {
                      const { name, relation, age } = parseMemberDetails(m.NAME);
                      return (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-3 font-mono text-slate-400">#{m.MEMBER_SEQ_NO || idx + 1}</td>
                          <td className="py-3 px-3 font-medium text-slate-100">{name}</td>
                          <td className="py-3 px-3 font-mono text-slate-300">{age || "—"}</td>
                          <td className="py-3 px-3"><span className="px-2 py-0.5 text-xs font-mono bg-slate-800 border border-slate-700 text-slate-300 rounded">{relation}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-slate-500 text-sm">No members added.</p>}
          </section>

          <section className="bg-[#0c1921] border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <h2 className="text-lg font-semibold text-white">Emergency Contacts</h2>
              <button onClick={() => setIsAddContactOpen(true)} className="px-3 py-1.5 text-xs font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-lg transition-colors">+ Add Contact</button>
            </div>
            {phones.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-mono text-slate-400 uppercase bg-slate-900/30">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Phone Number</th>
                      <th className="py-2.5 px-3">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {phones.map((phone, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3 font-mono text-slate-400">#{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-medium text-slate-100">{phone}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs font-mono font-medium rounded ${
                              idx === 0
                                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                : "bg-slate-800 border border-slate-700 text-slate-300"
                            }`}
                          >
                            {idx === 0 ? "Primary Contact" : "Secondary Contact"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No emergency contact numbers recorded.</p>
            )}
          </section>
        </div>
      </div>

      {/* MODAL 1: EDIT PROFILE */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0c1921] border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">edit</span>
                <h3 className="text-lg font-semibold text-white">Edit Profile</h3>
              </div>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.household_head_name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, household_head_name: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Gender</label>
                <select
                  value={profileForm.gender}
                  onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">NID Number</label>
                <input
                  type="text"
                  value={profileForm.nid_number}
                  onChange={(e) => setProfileForm({ ...profileForm, nid_number: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Present Address / Last Known Location
                </label>
                <input
                  type="text"
                  value={profileForm.last_known_location}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, last_known_location: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Special Needs / Notes
                </label>
                <textarea
                  rows={2}
                  value={profileForm.special_needs}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, special_needs: e.target.value })
                  }
                  placeholder="e.g., Medical requirement, wheelchair access, etc."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white bg-slate-800/60 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProfile}
                  className="px-4 py-2 text-xs font-mono text-emerald-950 font-semibold bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  {submittingProfile && (
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD FAMILY MEMBER */}
      {isAddFamilyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0c1921] border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">person_add</span>
                <h3 className="text-lg font-semibold text-white">Add Family Member</h3>
              </div>
              <button
                onClick={() => setIsAddFamilyOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddFamilySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Family Member Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Fatema Begum"
                  value={familyForm.name}
                  onChange={(e) => setFamilyForm({ ...familyForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Relationship</label>
                  <select
                    value={familyForm.relation_to_head}
                    onChange={(e) =>
                      setFamilyForm({ ...familyForm, relation_to_head: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Dependent">Dependent</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Age</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    placeholder="e.g., 28"
                    value={familyForm.age}
                    onChange={(e) => setFamilyForm({ ...familyForm, age: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddFamilyOpen(false)}
                  className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white bg-slate-800/60 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFamily}
                  className="px-4 py-2 text-xs font-mono text-emerald-950 font-semibold bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  {submittingFamily && (
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                  )}
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD EMERGENCY CONTACT */}
      {isAddContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0c1921] border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">add_call</span>
                <h3 className="text-lg font-semibold text-white">Add Emergency Contact</h3>
              </div>
              <button
                onClick={() => setIsAddContactOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddContactSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g., 01811223344"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                  Saved to your emergency contact directory in VICTIM_PHONE.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddContactOpen(false)}
                  className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white bg-slate-800/60 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingContact}
                  className="px-4 py-2 text-xs font-mono text-emerald-950 font-semibold bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  {submittingContact && (
                    <span className="material-symbols-outlined text-sm animate-spin">
                      progress_activity
                    </span>
                  )}
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
