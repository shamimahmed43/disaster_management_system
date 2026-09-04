"use client";

import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import { getVictims, createVictim, getDisasters, getVictim, getShelters, checkInVictim, checkOutVictim, getVictimStays } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Modal } from "@/components/ui/Modal";
import { toast } from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-BD", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type Victim = {
  VICTIM_ID: string;
  HOUSEHOLD_HEAD_NAME: string;
  AGE: number | null;
  GENDER: string;
  NID_NUMBER: string;
  REPORTED_DATE: string;
  LAST_SEEN_LOCATION: string;
  MISSING_PERSON: string;
  DISASTER_ID: string;
  DISASTER_NAME: string;
  DISASTER_TYPE: string;
  DIVISION: string;
};

type Disaster = {
  DISASTER_ID: string;
  DISASTER_NAME: string;
  DISASTER_TYPE: string;
  DIVISION: string;
  DISTRICT: string;
};

type VictimDetail = {
  VICTIM_ID: string;
  HOUSEHOLD_HEAD_NAME: string;
  AGE: number | null;
  GENDER: string;
  NID_NUMBER: string;
  REPORTED_DATE: string;
  LAST_SEEN_LOCATION: string;
  MISSING_PERSON: string;
  DISASTER_ID: string;
  DISASTER_NAME: string;
  DIVISION: string;
  phones: string[];
  special_needs: string[];
  family_members: Array<{ MEMBER_SEQ_NO: number; NAME: string; AGE?: number; RELATION_TO_HEAD?: string }>;
};

type ShelterStay = {
  VICTIM_ID: string;
  SHELTER_ID: string;
  CHECKIN_DATE: string;
  CHECKOUT_DATE: string | null;
  SHELTER_NAME: string;
  SHELTER_STATUS: string;
};

type DrawerMode = "view" | "add";

const EMPTY_FORM = {
  victim_id: "",
  household_head_name: "",
  age: "",
  gender: "",
  nid_number: "",
  reported_date: "",
  last_seen_location: "",
  missing_person: "N",
  special_needs: "",
  disaster_id: "",
  phones: "",
  family_members: [] as { name: string; age: string; relation_to_head: string }[],
};

export default function VictimsPage() {
  const { data, loading, error, refetch } = useApi<Victim[]>(getVictims as any);
  const { data: disasters } = useApi<Disaster[]>(getDisasters as any);
  const [victimDetail, setVictimDetail] = useState<VictimDetail | null>(null);
  const [victimStays, setVictimStays] = useState<ShelterStay[]>([]);
  const [shelters, setShelters] = useState<{SHELTER_ID: string, SHELTER_NAME: string}[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isCheckingInOut, setIsCheckingInOut] = useState(false);
  const [selectedShelterId, setSelectedShelterId] = useState("");

  const [selected, setSelected] = useState<Victim | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("view");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [missingFilter, setMissingFilter] = useState<"all" | "Y" | "N">("all");

  const { isInternal, isAdmin, isStaff } = useAuth();
  const canEdit = isAdmin || isStaff;
  
  const [editVictim, setEditVictim] = useState<Victim | null>(null);
  const [editForm, setEditForm] = useState({ missing_person: "", last_seen_location: "" });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  function openEdit(v: Victim, e: React.MouseEvent) {
    e.stopPropagation();
    setEditVictim(v);
    setEditForm({
      missing_person: v.MISSING_PERSON,
      last_seen_location: v.LAST_SEEN_LOCATION || ""
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editVictim) return;
    setIsSavingEdit(true);
    try {
      const token = localStorage.getItem("dms_token");
      const res = await fetch(`${API}/victims/${editVictim.VICTIM_ID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update victim");
      toast.success("Victim updated");
      setEditVictim(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSavingEdit(false);
    }
  }

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const victims = data ?? [];
  const filtered = victims.filter((v) => {
    const searchLower = search.toLowerCase();
    const matchSearch = search === "" ||
      (v.VICTIM_ID || "").toLowerCase().includes(searchLower) ||
      (v.HOUSEHOLD_HEAD_NAME || "").toLowerCase().includes(searchLower) ||
      (v.NID_NUMBER || "").toLowerCase().includes(searchLower);
    const matchMissing = missingFilter === "all" || v.MISSING_PERSON === missingFilter;
    return matchSearch && matchMissing;
  });

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-cobalt">
        <span className="material-symbols-outlined icon-thick text-[48px] animate-spin">progress_activity</span>
        <p className="font-bold">Loading registry...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="bg-white border border-red-200 rounded-[2rem] p-8 text-center shadow-sm">
        <span className="material-symbols-outlined icon-thick text-red-500 text-[48px]">error</span>
        <h2 className="font-display text-2xl text-black mt-4">Load Failed</h2>
        <p className="text-gray-600 font-medium mt-2">{error}</p>
        <button onClick={refetch} className="mt-4 px-4 py-2 bg-cobalt text-white rounded-xl font-bold">Retry</button>
      </div>
    </div>
  );

  const missingCount = victims.filter((v) => v.MISSING_PERSON === "Y").length;

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setSubmitError(null);
    setSubmitSuccess(false);
    setDrawerMode("add");
    setIsDrawerOpen(true);
  };

  const openView = (v: Victim) => {
    setSelected(v);
    setDrawerMode("view");
    setIsDrawerOpen(true);
    setDetailLoading(true);
    
    Promise.all([
      getVictim(v.VICTIM_ID),
      getVictimStays(v.VICTIM_ID),
      getShelters()
    ])
    .then(([detail, stays, sh]: any) => {
      setVictimDetail(detail);
      setVictimStays(stays);
      setShelters(sh);
    })
    .catch(() => {
      setVictimDetail(null);
      setVictimStays([]);
    })
    .finally(() => setDetailLoading(false));
  };

  async function handleCheckIn(victim_id: string) {
    if (!selectedShelterId) {
      toast.error("Please select a shelter first.");
      return;
    }
    setIsCheckingInOut(true);
    try {
      await checkInVictim({ victim_id, shelter_id: selectedShelterId });
      toast.success("Victim checked in successfully.");
      const stays = await getVictimStays(victim_id);
      setVictimStays(stays as any);
      setSelectedShelterId("");
    } catch (err: any) {
      toast.error(err.message || "Failed to check in.");
    } finally {
      setIsCheckingInOut(false);
    }
  }

  async function handleCheckOut(victim_id: string, shelter_id: string) {
    if (!confirm("Check out this victim from the shelter?")) return;
    setIsCheckingInOut(true);
    try {
      await checkOutVictim({ victim_id, shelter_id });
      toast.success("Victim checked out successfully.");
      const stays = await getVictimStays(victim_id);
      setVictimStays(stays as any);
    } catch (err: any) {
      toast.error(err.message || "Failed to check out.");
    } finally {
      setIsCheckingInOut(false);
    }
  }

  const setField = (k: string, val: string) => setForm((p) => ({ ...p, [k]: val }));

  async function handleSubmit() {
    if (!form.victim_id || !form.household_head_name || !form.disaster_id) {
      setSubmitError("Victim ID, Name, and Disaster are required.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createVictim({
        ...form,
        age: form.age ? parseInt(form.age) : null,
        phones: form.phones ? form.phones.split(",").map((p) => p.trim()).filter(Boolean) : [],
        special_needs: form.special_needs ? form.special_needs.split(",").map((n) => n.trim()).filter(Boolean) : [],
        family_members: form.family_members.filter(m => m.name.trim() !== "").map(m => ({
          name: m.name.trim(),
          age: m.age ? parseInt(m.age) : null,
          relation_to_head: m.relation_to_head.trim() || null
        })),
      } as any);
      setSubmitSuccess(true);
      refetch();
      setTimeout(() => {
        setIsDrawerOpen(false);
        setSubmitSuccess(false);
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to register victim.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="max-w-[1600px] mx-auto flex flex-col gap-4 pb-12">
        {/* Header */}
        <div className="bg-azure rounded-[2rem] p-8 flex flex-col md:flex-row md:items-end justify-between gap-6 shadow-sm border border-blue-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="p-3 bg-white hover:bg-blue-50 text-cobalt rounded-xl border border-blue-200 transition-colors flex items-center justify-center shrink-0 shadow-sm"
              title="Go Back"
            >
              <span className="material-symbols-outlined icon-thick text-[20px]">arrow_back</span>
            </button>
            <div>
              <h2 className="font-display text-4xl text-black uppercase tracking-tight">Victim Registry</h2>
              <p className="font-bold text-black/70 mt-2 text-lg">
                {victims.length} total records
                {missingCount > 0 && (
                  <span className="ml-2 text-red-500 bg-red-100 px-2 py-1 rounded-lg text-sm">· {missingCount} missing</span>
                )}
              </p>
            </div>
          </div>
          {canEdit && (
            <button onClick={openAdd} className="flex items-center justify-center gap-2 px-5 py-3 bg-cobalt hover:bg-cobalt-dark rounded-xl text-white font-bold text-sm transition-colors shadow-sm">
              <span className="material-symbols-outlined icon-thick text-[18px]">person_add</span>
              Add New Victim
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-[2rem] p-6 flex flex-col lg:flex-row gap-4 items-end shadow-sm">
          {/* Search */}
          <div className="flex-1 w-full relative">
            <label className="block text-xs font-mono text-gray-500 uppercase font-bold tracking-wider mb-2">
              Search ID / Name / NID
            </label>
            <div className="relative">
              <span className="material-symbols-outlined icon-thick absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                search
              </span>
              <input
                className="w-full bg-gray-50 border border-gray-200 focus:border-cobalt focus:ring-2 focus:ring-azure rounded-xl pl-11 pr-4 py-3 text-sm font-medium text-black placeholder:text-gray-400 outline-none transition-all"
                placeholder="e.g., VCT-001 or John..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Missing Filter */}
          <div>
            <label className="block text-xs font-mono text-gray-500 uppercase font-bold tracking-wider mb-2">Status Filter</label>
            <div className="flex gap-2">
              {[
                { val: "all", label: "All Records" },
                { val: "Y", label: "Missing Only" },
                { val: "N", label: "Located Only" },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  onClick={() => setMissingFilter(val as any)}
                  className={`px-4 py-3 rounded-xl text-sm font-bold transition-colors border ${
                    missingFilter === val
                      ? val === "Y"
                        ? "bg-red-500 border-red-500 text-white shadow-sm"
                        : val === "N"
                        ? "bg-green-500 border-green-500 text-white shadow-sm"
                        : "bg-cobalt border-cobalt text-white shadow-sm"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2rem] flex flex-col shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
          <div className="overflow-x-auto p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {["Victim ID", "Household Head", "Age", "Gender", "Status", "Disaster", "Last Seen Location"].map((h) => (
                    <th key={h} className="p-4 font-mono text-xs text-gray-500 uppercase tracking-wider font-bold bg-azure border-b border-gray-200 first:rounded-tl-xl last:rounded-tr-xl">
                      {h}
                    </th>
                  ))}
                  {canEdit && (
                    <th className="p-4 font-mono text-xs text-gray-500 uppercase tracking-wider font-bold bg-azure border-b border-gray-200 rounded-tr-xl text-right">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-black">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500 font-bold">
                      {victims.length === 0 ? "No victims registered yet. Click 'Add New Victim' to begin." : "No victims match your search."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((victim) => (
                    <tr
                      key={victim.VICTIM_ID}
                      className="hover:bg-azure cursor-pointer transition-colors group border-b border-gray-100 last:border-none"
                      onClick={() => openView(victim)}
                    >
                      <td className="p-4 font-bold text-cobalt">{victim.VICTIM_ID}</td>
                      <td className="p-4">{victim.HOUSEHOLD_HEAD_NAME}</td>
                      <td className="p-4 text-gray-600">{victim.AGE || "—"}</td>
                      <td className="p-4 text-gray-600">{victim.GENDER || "—"}</td>
                      <td className="p-4">
                        {victim.MISSING_PERSON === "Y" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-100 text-red-600 font-bold text-xs uppercase tracking-wide">
                            <span className="material-symbols-outlined text-[14px]">person_off</span> Missing
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-green-100 text-green-600 font-bold text-xs uppercase tracking-wide">
                            <span className="material-symbols-outlined text-[14px]">person_check</span> Located
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-700 font-bold text-xs uppercase tracking-wide">
                          {victim.DISASTER_NAME}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">{victim.LAST_SEEN_LOCATION || "Unknown"}</td>
                      {canEdit && (
                        <td className="p-4 text-right">
                          <button
                            onClick={(e) => openEdit(victim, e)}
                            className="p-2 text-gray-400 hover:text-cobalt hover:bg-azure-light rounded-lg transition-colors"
                            title="Edit Victim"
                          >
                            <span className="material-symbols-outlined icon-thick text-[18px]">edit</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Slide-out Drawer ─── */}
      <div
        className={`fixed inset-y-0 right-0 w-[480px] max-w-[90vw] bg-white border-l border-gray-200 shadow-2xl z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] flex flex-col ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-azure shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-full hover:bg-blue-100 transition-colors text-cobalt"
              onClick={() => setIsDrawerOpen(false)}
            >
              <span className="material-symbols-outlined icon-thick">close</span>
            </button>
            <h3 className="font-display text-xl text-black">
              {drawerMode === "add" ? "Register Victim" : "Victim Profile"}
            </h3>
          </div>
          {drawerMode === "view" && selected && (
            <span className={`inline-flex items-center px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wide ${
              selected.MISSING_PERSON === "Y" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
            }`}>
              {selected.MISSING_PERSON === "Y" ? "Missing" : "Located"}
            </span>
          )}
        </div>

        {/* ── VIEW MODE ── */}
        {drawerMode === "view" && selected && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            <div>
              <h2 className="text-3xl font-display text-black">{selected.HOUSEHOLD_HEAD_NAME}</h2>
              <p className="font-mono text-cobalt mt-1 text-sm font-bold">{selected.VICTIM_ID}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Age", value: selected.AGE || "—" },
                { label: "Gender", value: selected.GENDER || "—" },
                { label: "NID Number", value: selected.NID_NUMBER || "Pending" },
                { label: "Status", value: selected.MISSING_PERSON === "Y" ? "⚠ Missing" : "✓ Located" },
                { label: "Last Seen", value: selected.LAST_SEEN_LOCATION || "Unknown" },
                { label: "Disaster", value: selected.DISASTER_NAME },
                { label: "Division", value: selected.DIVISION || "—" },
                { label: "Reported", value: formatDate(selected.REPORTED_DATE) },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{item.label}</div>
                  <div className="font-bold text-black text-sm">{item.value}</div>
                </div>
              ))}
            </div>

            {/* Special Needs */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                <span className="material-symbols-outlined icon-thick text-[18px] text-cobalt">accessibility</span>
                <span className="font-mono text-xs font-bold text-gray-600 uppercase tracking-wider">Special Needs</span>
              </div>
              {detailLoading ? (
                <div className="px-4 py-4 text-sm font-bold text-gray-500">Loading...</div>
              ) : victimDetail?.special_needs && victimDetail.special_needs.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {victimDetail.special_needs.map((sn, i) => (
                    <div key={i} className="px-4 py-3 text-sm font-bold text-black">{sn}</div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-4 text-sm font-bold text-gray-400">No special needs registered</div>
              )}
            </div>

            {/* Phone Numbers */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                <span className="material-symbols-outlined icon-thick text-[18px] text-cobalt">phone</span>
                <span className="font-mono text-xs font-bold text-gray-600 uppercase tracking-wider">Contact Phones</span>
              </div>
              {detailLoading ? (
                <div className="px-4 py-4 text-sm font-bold text-gray-500">Loading...</div>
              ) : victimDetail?.phones && victimDetail.phones.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {victimDetail.phones.map((ph, i) => (
                    <div key={i} className="px-4 py-3 font-mono text-sm font-bold text-black">{ph}</div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-4 text-sm font-bold text-gray-400">No phones registered</div>
              )}
            </div>

            {/* Family Members */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                <span className="material-symbols-outlined icon-thick text-[18px] text-cobalt">group</span>
                <span className="font-mono text-xs font-bold text-gray-600 uppercase tracking-wider">Family Members</span>
              </div>
              {detailLoading ? (
                <div className="px-4 py-4 text-sm font-bold text-gray-500">Loading...</div>
              ) : victimDetail?.family_members && victimDetail.family_members.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {victimDetail.family_members.map((fm) => (
                    <div key={fm.MEMBER_SEQ_NO} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-gray-400 w-6">#{fm.MEMBER_SEQ_NO}</span>
                        <span className="text-sm font-bold text-black">{fm.NAME}</span>
                      </div>
                      <span className="text-xs text-gray-500 font-bold">{fm.RELATION_TO_HEAD ? fm.RELATION_TO_HEAD : ""} {fm.AGE ? `(${fm.AGE} yrs)` : ""}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-4 text-sm font-bold text-gray-400">No family members registered</div>
              )}
            </div>

            {/* Shelter Stays & Assignment */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mt-4">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                <span className="material-symbols-outlined icon-thick text-[18px] text-cobalt">home_work</span>
                <span className="font-mono text-xs font-bold text-gray-600 uppercase tracking-wider">Shelter Assignments</span>
              </div>
              <div className="p-4">
                {detailLoading ? (
                  <div className="text-sm font-bold text-gray-500">Loading stays...</div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {/* Active Stays */}
                    {victimStays.filter(s => !s.CHECKOUT_DATE).map((stay, idx) => (
                      <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-sm text-green-800">Checked into {stay.SHELTER_NAME}</p>
                          <p className="text-xs text-green-600 mt-1">Since {formatDate(stay.CHECKIN_DATE)}</p>
                        </div>
                        {canEdit && (
                          <button
                            onClick={() => handleCheckOut(selected.VICTIM_ID, stay.SHELTER_ID)}
                            disabled={isCheckingInOut}
                            className="px-3 py-1.5 bg-white border border-green-300 text-green-700 hover:bg-green-100 rounded-lg text-sm font-bold disabled:opacity-50"
                          >
                            Check Out
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {/* Check-in UI if not currently in a shelter */}
                    {victimStays.filter(s => !s.CHECKOUT_DATE).length === 0 && canEdit && (
                      <div className="flex gap-2">
                        <select
                          value={selectedShelterId}
                          onChange={(e) => setSelectedShelterId(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-cobalt"
                        >
                          <option value="">-- Assign to Shelter --</option>
                          {shelters.map(sh => (
                            <option key={sh.SHELTER_ID} value={sh.SHELTER_ID}>{sh.SHELTER_NAME}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleCheckIn(selected.VICTIM_ID)}
                          disabled={isCheckingInOut || !selectedShelterId}
                          className="px-4 py-2 bg-cobalt text-white rounded-lg font-bold text-sm hover:bg-cobalt-dark disabled:opacity-50"
                        >
                          Assign
                        </button>
                      </div>
                    )}

                    {/* Past Stays */}
                    {victimStays.filter(s => s.CHECKOUT_DATE).length > 0 && (
                      <div className="mt-2">
                        <p className="font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Past Stays</p>
                        <div className="flex flex-col gap-2">
                          {victimStays.filter(s => s.CHECKOUT_DATE).map((stay, idx) => (
                            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                              <p className="font-bold text-gray-700">{stay.SHELTER_NAME}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(stay.CHECKIN_DATE)} — {formatDate(stay.CHECKOUT_DATE)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ADD MODE ── */}
        {drawerMode === "add" && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
            {submitSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-700 shadow-sm">
                <span className="material-symbols-outlined icon-thick">check_circle</span>
                <span className="font-bold text-sm">Victim registered successfully!</span>
              </div>
            )}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm font-bold shadow-sm">
                {submitError}
              </div>
            )}

            {/* Form Fields */}
            {[
              { key: "victim_id", label: "Victim ID *", placeholder: "e.g., VCT-001", type: "text" },
              { key: "household_head_name", label: "Household Head Name *", placeholder: "Full name", type: "text" },
              { key: "age", label: "Age", placeholder: "e.g., 45", type: "number" },
              { key: "nid_number", label: "NID Number", placeholder: "National ID (unique)", type: "text" },
              { key: "last_seen_location", label: "Last Seen Location", placeholder: "e.g., Mirpur, Dhaka", type: "text" },
              { key: "reported_date", label: "Reported Date", placeholder: "", type: "date" },
              { key: "phones", label: "Phone Numbers (comma-separated)", placeholder: "e.g., 01711000001, 01711000002", type: "text" },
              { key: "special_needs", label: "Special Needs (comma-separated)", placeholder: "Medical, disability, etc.", type: "text" },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="block font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-cobalt focus:ring-2 focus:ring-azure rounded-xl px-4 py-3 text-sm font-medium text-black placeholder:text-gray-400 outline-none transition-all"
                />
              </div>
            ))}

            {/* Family Members Dynamic Fields */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block font-mono text-xs font-bold text-gray-500 uppercase tracking-wider">Family Members</label>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, family_members: [...p.family_members, { name: "", age: "", relation_to_head: "" }] }))}
                  className="text-xs font-bold text-cobalt bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  + Add Member
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {form.family_members.length === 0 ? (
                  <p className="text-sm text-gray-400 bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">No family members added</p>
                ) : (
                  form.family_members.map((member, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-gray-50 p-2 rounded-xl border border-gray-200">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          placeholder="Name *"
                          value={member.name}
                          onChange={(e) => {
                            const newMembers = [...form.family_members];
                            newMembers[idx].name = e.target.value;
                            setForm(p => ({ ...p, family_members: newMembers }));
                          }}
                          className="w-full bg-white border border-gray-200 focus:border-cobalt rounded-lg px-3 py-2 text-sm font-medium outline-none"
                        />
                        <input
                          placeholder="Age"
                          type="number"
                          value={member.age}
                          onChange={(e) => {
                            const newMembers = [...form.family_members];
                            newMembers[idx].age = e.target.value;
                            setForm(p => ({ ...p, family_members: newMembers }));
                          }}
                          className="w-full bg-white border border-gray-200 focus:border-cobalt rounded-lg px-3 py-2 text-sm font-medium outline-none"
                        />
                        <input
                          placeholder="Relation (e.g., Wife)"
                          value={member.relation_to_head}
                          onChange={(e) => {
                            const newMembers = [...form.family_members];
                            newMembers[idx].relation_to_head = e.target.value;
                            setForm(p => ({ ...p, family_members: newMembers }));
                          }}
                          className="w-full bg-white border border-gray-200 focus:border-cobalt rounded-lg px-3 py-2 text-sm font-medium outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newMembers = form.family_members.filter((_, i) => i !== idx);
                          setForm(p => ({ ...p, family_members: newMembers }));
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      >
                        <span className="material-symbols-outlined icon-thick text-[18px]">delete</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setField("gender", e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-cobalt focus:ring-2 focus:ring-azure rounded-xl px-4 py-3 text-sm font-medium text-black outline-none transition-all"
              >
                <option value="">-- Select --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Missing Person */}
            <div>
              <label className="block font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Missing Person?</label>
              <div className="flex gap-3">
                {[{ val: "N", label: "No — Located" }, { val: "Y", label: "Yes — Missing" }].map(({ val, label }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setField("missing_person", val)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-colors shadow-sm ${
                      form.missing_person === val
                        ? val === "Y"
                          ? "bg-red-500 text-white border-red-500"
                          : "bg-green-500 text-white border-green-500"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Disaster Select */}
            <div>
              <label className="block font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Disaster Event *</label>
              <select
                value={form.disaster_id}
                onChange={(e) => setField("disaster_id", e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-cobalt focus:ring-2 focus:ring-azure rounded-xl px-4 py-3 text-sm font-medium text-black outline-none transition-all"
              >
                <option value="">-- Select Disaster --</option>
                {(disasters ?? []).map((d: any) => (
                  <option key={d.DISASTER_ID} value={d.DISASTER_ID}>
                    {d.DISASTER_NAME} ({d.DISASTER_TYPE})
                  </option>
                ))}
              </select>
              {(!disasters || disasters.length === 0) && (
                <p className="text-sm font-bold text-yellow-600 mt-2 bg-yellow-50 p-3 rounded-xl">
                  No disaster events yet — create one first.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Drawer Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button onClick={() => setIsDrawerOpen(false)} className="px-5 py-3 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          {drawerMode === "add" && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-cobalt hover:bg-cobalt-dark text-white transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? <span className="material-symbols-outlined icon-thick text-[18px] animate-spin">progress_activity</span> : <span className="material-symbols-outlined icon-thick text-[18px]">save</span>}
              {submitting ? "Saving..." : "Register Victim"}
            </button>
          )}
        </div>
      </div>

      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}
      
      {/* Edit Modal */}
      <Modal isOpen={!!editVictim} onClose={() => setEditVictim(null)} title="Update Victim Status">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Missing Status</label>
            <select
              value={editForm.missing_person}
              onChange={e => setEditForm(p => ({ ...p, missing_person: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-cobalt"
            >
              <option value="Y">Yes — Missing</option>
              <option value="N">No — Located</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Last Seen Location</label>
            <input
              type="text"
              value={editForm.last_seen_location}
              onChange={e => setEditForm(p => ({ ...p, last_seen_location: e.target.value }))}
              placeholder="e.g., Shelter Alpha"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-cobalt text-sm"
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setEditVictim(null)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={isSavingEdit} className="px-4 py-2 bg-cobalt text-white font-bold rounded-lg hover:bg-cobalt-dark disabled:opacity-50">
              {isSavingEdit ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
