"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/hooks/useApi";
import { getShelters, createShelter } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Modal } from "@/components/ui/Modal";
import { toast } from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Shelter = {
  SHELTER_ID: string;
  SHELTER_NAME: string;
  SHELTER_STATUS: string;
  CONTACT_PERSON_NAME: string;
  ADDRESS_LINE: string;
  LONGITUDE: string;
  LATITUDE: string;
  CAPACITY: number;
  CURRENT_OCCUPANCY: number;
  AVAILABLE_CAPACITY: number;
};

export default function SheltersPage() {
  const { data, loading, error, refetch } = useApi<Shelter[]>(getShelters as any);
  const shelters = data ?? [];

  // Locations for autocomplete
  const [locations, setLocations] = useState<string[]>([]);
  useEffect(() => {
    fetch(`${API}/locations/suggestions`)
      .then(res => res.json())
      .then(json => setLocations(json.data || []))
      .catch(() => {});
  }, []);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [form, setForm] = useState({
    shelter_id: "", shelter_name: "", capacity: "", shelter_status: "Open",
    contact_person_name: "", address_line: "", latitude: "", longitude: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ─── Real working filters ───
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { isInternal, isAdmin, isStaff } = useAuth();
  const canEdit = isAdmin || isStaff;
  
  const [editShelter, setEditShelter] = useState<Shelter | null>(null);
  const [editForm, setEditForm] = useState({ shelter_status: "", contact_person_name: "", capacity: "", address_line: "" });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Alerts State
  const [alerts, setAlerts] = useState<any[] | null>(null);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  async function checkAlerts() {
    setLoadingAlerts(true);
    setAlertsError(null);
    try {
      const res = await fetch(`${API}/shelters/alerts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch alerts');
      setAlerts(json.data);
    } catch (err: any) {
      setAlertsError(err.message);
    } finally {
      setLoadingAlerts(false);
    }
  }

  function openEdit(s: Shelter) {
    setEditShelter(s);
    setEditForm({
      shelter_status: s.SHELTER_STATUS,
      contact_person_name: s.CONTACT_PERSON_NAME || "",
      capacity: String(s.CAPACITY || ""),
      address_line: s.ADDRESS_LINE || ""
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editShelter) return;
    setIsSavingEdit(true);
    try {
      const token = localStorage.getItem("dms_token");
      const res = await fetch(`${API}/shelters/${editShelter.SHELTER_ID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contact_person_name: editForm.contact_person_name,
          capacity: parseInt(editForm.capacity) || null,
          shelter_status: editForm.shelter_status
        }),
      });
      if (!res.ok) throw new Error("Failed to update shelter");
      toast.success("Shelter updated");
      setEditShelter(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSavingEdit(false);
    }
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-cobalt">
        <span className="material-symbols-outlined icon-thick text-[48px] animate-spin">progress_activity</span>
        <p className="font-bold">Loading shelter data...</p>
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

  async function handleAddShelter() {
    if (!form.shelter_id || !form.shelter_name || !form.capacity) {
      setSubmitError("Shelter ID, Name, and Capacity are required.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createShelter({
        ...form,
        capacity: parseInt(form.capacity),
        latitude: form.latitude || null,
        longitude: form.longitude || null,
      });
      setSubmitSuccess(true);
      refetch();
      setTimeout(() => setIsDrawerOpen(false), 1500);
    } catch (err: any) {
      setSubmitError(err.message ?? "Failed to add shelter");
    } finally {
      setSubmitting(false);
    }
  }

  const setField = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Derive unique values from actual data
  const allStatuses = Array.from(new Set(shelters.map((s) => s.SHELTER_STATUS).filter(Boolean)));

  // Apply filters
  const filtered = shelters.filter((s) => {
    const matchesStatus = statusFilters.size === 0 || statusFilters.has(s.SHELTER_STATUS);
    const queryLower = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      (s.SHELTER_NAME || "").toLowerCase().includes(queryLower) ||
      (s.SHELTER_ID || "").toLowerCase().includes(queryLower) ||
      (s.ADDRESS_LINE || "").toLowerCase().includes(queryLower);
    return matchesStatus && matchesSearch;
  });

  const toggleStatus = (status: string) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  // Summary from filtered results
  const totalCapacity = filtered.reduce((sum, s) => sum + (s.CAPACITY || 0), 0);
  const totalOccupied = filtered.reduce((sum, s) => sum + (s.CURRENT_OCCUPANCY || 0), 0);
  const totalAvailable = filtered.reduce((sum, s) => sum + (s.AVAILABLE_CAPACITY || 0), 0);

  return (
    <>
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row gap-6 items-start">
        {/* Left Filter Sidebar */}
        <aside className="w-full md:w-72 shrink-0 flex flex-col gap-4 sticky top-[104px]">
          {/* Search */}
          <div className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-sm">
            <div className="relative">
              <span className="material-symbols-outlined icon-thick absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search shelters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-black font-medium rounded-xl pl-11 pr-4 py-3 text-sm focus:border-cobalt focus:ring-2 focus:ring-azure focus:outline-none transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-sm">
            <h2 className="font-display text-xl text-black mb-4 pb-4 border-b border-gray-100 flex items-center justify-between">
              Filters
              {(statusFilters.size > 0 || searchQuery) && (
                <button
                  onClick={() => { setStatusFilters(new Set()); setSearchQuery(""); }}
                  className="font-mono text-xs font-bold text-cobalt uppercase tracking-wider hover:underline"
                >
                  Clear
                </button>
              )}
            </h2>

            {/* Status Filter */}
            <div className="mb-6">
              <h3 className="font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Status</h3>
              {allStatuses.length === 0 ? (
                <p className="text-sm font-bold text-gray-400">No shelters yet</p>
              ) : (
                allStatuses.map((s) => (
                  <label key={s} className="flex items-center gap-3 cursor-pointer mb-3 group" onClick={() => toggleStatus(s)}>
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        statusFilters.has(s)
                          ? "border-cobalt bg-cobalt text-white"
                          : "border-gray-300 bg-white group-hover:border-cobalt"
                      }`}
                    >
                      {statusFilters.has(s) && (
                        <span className="material-symbols-outlined icon-thick text-[14px]">check</span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-gray-700 group-hover:text-black transition-colors">
                      {s}
                    </span>
                    <span className="ml-auto font-mono text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                      {shelters.filter((sh) => sh.SHELTER_STATUS === s).length}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Summary KPIs */}
          <div className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-sm">
            <h2 className="font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 pb-4 border-b border-gray-100">
              Summary {filtered.length !== shelters.length && <span className="text-cobalt">({filtered.length} filtered)</span>}
            </h2>
            <div className="flex flex-col gap-4">
              {[
                { label: "Shelters shown", value: filtered.length, color: "text-black" },
                { label: "Total Capacity", value: totalCapacity.toLocaleString(), color: "text-cobalt" },
                { label: "Occupied", value: totalOccupied.toLocaleString(), color: "text-red-600" },
                { label: "Available", value: totalAvailable.toLocaleString(), color: "text-green-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-600">{label}</span>
                  <span className={`font-mono font-bold text-sm bg-gray-50 px-2 py-1 rounded-md border border-gray-100 ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <section className="flex-1 flex flex-col min-w-0 gap-6">
          <div className="bg-azure rounded-[2rem] p-8 flex flex-col md:flex-row md:items-end justify-between gap-6 shadow-sm border border-blue-200">
            <div>
              <h1 className="font-display text-4xl text-black uppercase tracking-tight">Shelter Management</h1>
              <p className="font-bold text-black/70 mt-2 text-lg">
                {filtered.length} of {shelters.length} facilities
                {statusFilters.size > 0 && <span className="text-cobalt bg-white px-2 py-1 rounded-lg text-sm ml-2">Filtered: {Array.from(statusFilters).join(", ")}</span>}
              </p>
            </div>
            <div className="flex gap-4">
              {canEdit && (
                <button
                  onClick={checkAlerts}
                  disabled={loadingAlerts}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-bold text-sm transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined icon-thick text-[18px]">warning</span>
                  {loadingAlerts ? 'Checking...' : 'Check Capacity Alerts'}
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => { setForm({ shelter_id: "", shelter_name: "", capacity: "", shelter_status: "Open", contact_person_name: "", address_line: "", latitude: "", longitude: "" }); setSubmitError(null); setSubmitSuccess(false); setIsDrawerOpen(true); }}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-cobalt hover:bg-cobalt-dark rounded-xl text-white font-bold text-sm transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined icon-thick text-[18px]">add</span>
                  + New Shelter
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          {filtered.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-[2rem] p-12 text-center shadow-sm">
              <span className="material-symbols-outlined icon-thick text-gray-300 text-[64px]">night_shelter</span>
              <h3 className="font-display text-2xl text-black mt-4">No shelters found</h3>
              <p className="text-gray-500 font-bold mt-2">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filtered.map((shelter) => {
                const pct = shelter.CAPACITY > 0
                  ? Math.round((shelter.CURRENT_OCCUPANCY / shelter.CAPACITY) * 100)
                  : 0;
                const isFull = pct >= 100;
                const barColor = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-cobalt";

                return (
                  <div
                    key={shelter.SHELTER_ID}
                    className="bg-white border border-gray-200 rounded-[2rem] p-6 transition-all duration-300 hover:shadow-md hover:border-blue-300 flex flex-col h-full"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="pr-4">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-display text-xl text-black truncate max-w-[200px] sm:max-w-[300px]">
                            {shelter.SHELTER_NAME}
                          </h3>
                          <span className="font-mono text-xs font-bold text-cobalt bg-blue-50 px-2 py-1 rounded-md shrink-0">
                            {shelter.SHELTER_ID}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-500 flex items-center gap-1.5">
                          <span className="material-symbols-outlined icon-thick text-[16px] text-gray-400">location_on</span>
                          {shelter.ADDRESS_LINE || `Unknown Location`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wide shrink-0 ${
                          isFull ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isFull ? "bg-red-500" : "bg-green-500 animate-pulse"}`} />
                          {shelter.SHELTER_STATUS}
                        </span>
                        {canEdit && (
                          <button
                            onClick={() => openEdit(shelter)}
                            className="text-gray-400 hover:text-cobalt hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                            title="Edit Shelter"
                          >
                            <span className="material-symbols-outlined icon-thick text-[18px]">edit</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Capacity Bar */}
                    <div className="mt-auto mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-end mb-3">
                        <span className="font-mono text-xs font-bold text-gray-500 uppercase tracking-wider">Occupancy</span>
                        <span className="font-mono font-bold">
                          <span className={isFull ? "text-red-600" : "text-black text-lg"}>
                            {shelter.CURRENT_OCCUPANCY}
                          </span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="text-gray-600">{shelter.CAPACITY}</span>
                        </span>
                      </div>
                      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-full transition-all duration-700`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="text-right font-bold text-[10px] uppercase tracking-wider text-gray-500 mt-2">
                        {pct}% full — <span className={isFull ? "text-red-500" : "text-green-600"}>{shelter.AVAILABLE_CAPACITY} available</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm font-bold text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined icon-thick text-[16px] text-gray-400">person</span>
                        {shelter.CONTACT_PERSON_NAME || "—"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ─── Add Shelter Drawer ─── */}
      {isDrawerOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsDrawerOpen(false)} />}
      <div className={`fixed inset-y-0 right-0 w-[440px] max-w-[90vw] bg-white border-l border-gray-200 shadow-2xl z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] flex flex-col ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-azure shrink-0">
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-blue-100 transition-colors text-cobalt" onClick={() => setIsDrawerOpen(false)}>
              <span className="material-symbols-outlined icon-thick">close</span>
            </button>
            <h3 className="font-display text-xl text-black">Register Shelter</h3>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {submitSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-700 shadow-sm">
              <span className="material-symbols-outlined icon-thick">check_circle</span>
              <span className="font-bold text-sm">Shelter registered successfully!</span>
            </div>
          )}
          {submitError && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm font-bold shadow-sm">{submitError}</div>}
          
          {[
            { key: "shelter_id", label: "Shelter ID *", placeholder: "e.g., S-005" },
            { key: "shelter_name", label: "Shelter Name *", placeholder: "e.g., Dhaka School Camp" },
            { key: "capacity", label: "Capacity *", placeholder: "e.g., 500", type: "number" },
            { key: "contact_person_name", label: "Contact Person", placeholder: "Name" },
            { key: "address_line", label: "Address", placeholder: "Full address", list: "locations-list" },
            { key: "latitude", label: "Latitude (for map)", placeholder: "e.g., 23.8103" },
            { key: "longitude", label: "Longitude (for map)", placeholder: "e.g., 90.4125" },
          ].map(({ key, label, placeholder, type, list }) => (
            <div key={key}>
              <label className="block font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
              <input type={type ?? "text"} placeholder={placeholder} value={(form as any)[key]} onChange={(e) => setField(key, e.target.value)}
                list={list}
                className="w-full bg-gray-50 border border-gray-200 focus:border-cobalt focus:ring-2 focus:ring-azure rounded-xl px-4 py-3 text-sm font-medium text-black placeholder:text-gray-400 outline-none transition-all" />
            </div>
          ))}

          <datalist id="locations-list">
            {locations.map((loc, idx) => (
              <option key={idx} value={loc} />
            ))}
          </datalist>
          
          <div>
            <label className="block font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
            <select value={form.shelter_status} onChange={(e) => setField("shelter_status", e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-cobalt focus:ring-2 focus:ring-azure rounded-xl px-4 py-3 text-sm font-medium text-black outline-none transition-all">
              <option>Open</option><option>Full</option><option>Closed</option>
            </select>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex shrink-0">
          <button 
            onClick={handleAddShelter} 
            disabled={submitting} 
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-cobalt hover:bg-cobalt-dark text-white transition-colors shadow-sm disabled:opacity-50"
          >
            {submitting ? <span className="material-symbols-outlined icon-thick animate-spin">progress_activity</span> : <span className="material-symbols-outlined icon-thick">save</span>}
            {submitting ? "Saving..." : "Register Shelter"}
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editShelter} onClose={() => setEditShelter(null)} title="Update Shelter Details">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
            <select
              value={editForm.shelter_status}
              onChange={e => setEditForm(p => ({ ...p, shelter_status: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-cobalt text-sm"
            >
              <option value="Open">Open</option>
              <option value="Full">Full</option>
              <option value="Closed">Closed</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">Warning: Ensure physical capacity matches status.</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Total Capacity</label>
            <input
              type="number"
              value={editForm.capacity}
              onChange={e => setEditForm(p => ({ ...p, capacity: e.target.value }))}
              placeholder="e.g., 500"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-cobalt text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contact Person</label>
            <input
              type="text"
              value={editForm.contact_person_name}
              onChange={e => setEditForm(p => ({ ...p, contact_person_name: e.target.value }))}
              placeholder="Name of person in charge"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-cobalt text-sm"
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setEditShelter(null)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={isSavingEdit} className="px-4 py-2 bg-cobalt text-white font-bold rounded-lg hover:bg-cobalt-dark disabled:opacity-50">
              {isSavingEdit ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
      {/* Alerts Modal */}
      <Modal isOpen={alerts !== null} onClose={() => setAlerts(null)} title="Shelter Capacity Alerts">
        {alertsError ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">{alertsError}</div>
        ) : alerts ? (
          <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
            {alerts.length === 0 ? (
              <p className="text-gray-500">No shelter data available.</p>
            ) : (
              alerts.map((a: any, i: number) => {
                const isCritical = a.OCCUPANCY_PCT >= 90;
                return (
                  <div key={i} className={`p-4 border rounded-xl flex items-center justify-between ${isCritical ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                    <div>
                      <h4 className={`font-bold ${isCritical ? 'text-red-900' : 'text-gray-900'}`}>{a.SHELTER_NAME}</h4>
                      <p className={`text-sm ${isCritical ? 'text-red-700' : 'text-gray-500'}`}>Capacity: {a.CAPACITY} • Occupied: {a.OCCUPIED_COUNT}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl font-bold ${isCritical ? 'text-red-600' : 'text-gray-700'}`}>{a.OCCUPANCY_PCT}%</span>
                      {isCritical && <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Critical</p>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : null}
        <div className="mt-6 flex justify-end">
          <button onClick={() => setAlerts(null)} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors">
            Close
          </button>
        </div>
      </Modal>

    </>
  );
}
