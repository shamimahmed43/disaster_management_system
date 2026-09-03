"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/hooks/useApi";
import { getWarehouses, createWarehouse } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Modal } from "@/components/ui/Modal";

type Warehouse = {
  WAREHOUSE_ID: string;
  WAREHOUSE_NAME: string;
  LOCATION: string;
  CAPACITY: number;
  MANAGER_NAME: string;
  TOTAL_DONATIONS_STORED: number;
  TOTAL_DONATION_VALUE: number;
};

const EMPTY = {
  warehouse_id: "", warehouse_name: "", location: "",
  capacity: "", manager_name: ""
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function WarehousePage() {
  const { data, loading, error, refetch } = useApi<Warehouse[]>(getWarehouses as any);
  const warehouses = data ?? [];

  const { isAdmin, isStaff } = useAuth();
  const canEdit = isAdmin || isStaff;

  const [editWarehouse, setEditWarehouse] = useState<Warehouse | null>(null);
  const [editForm, setEditForm] = useState({ capacity: "", manager_name: "" });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editWarehouse) return;
    setIsSavingEdit(true);
    try {
      const token = localStorage.getItem("dms_token");
      const res = await fetch(`${API}/warehouses/${editWarehouse.WAREHOUSE_ID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          capacity: parseInt(editForm.capacity) || null,
          manager_name: editForm.manager_name
        }),
      });
      if (!res.ok) throw new Error("Failed to update warehouse");
      setEditWarehouse(null);
      refetch();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingEdit(false);
    }
  }

  const [locations, setLocations] = useState<string[]>([]);
  useEffect(() => {
    fetch(`${API}/locations/suggestions`)
      .then(res => res.json())
      .then(json => setLocations(json.data || []))
      .catch(() => {});
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-cobalt">
        <span className="material-symbols-outlined icon-thick text-[48px] animate-spin">progress_activity</span>
        <p className="font-bold">Loading warehouses...</p>
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

  const totalValue = warehouses.reduce((s, w) => s + (w.TOTAL_DONATION_VALUE || 0), 0);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit() {
    if (!form.warehouse_id || !form.warehouse_name || !form.location || !form.capacity) {
      setSubmitError("ID, Name, Location and Capacity are required.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createWarehouse({ ...form, capacity: Number(form.capacity) });
      setSubmitSuccess(true);
      refetch();
      setTimeout(() => { setShowForm(false); setSubmitSuccess(false); setForm(EMPTY); }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to create warehouse.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="max-w-[1600px] mx-auto flex flex-col gap-6 p-2 md:p-4">
        {/* Header */}
        <div className="bg-azure rounded-[2rem] p-8 flex flex-col md:flex-row md:items-end justify-between gap-6 shadow-sm border border-blue-200">
          <div>
            <h1 className="font-display text-4xl text-black uppercase tracking-tight">Warehouse Management</h1>
            <p className="font-bold text-black/70 mt-2 text-lg">
              {warehouses.length} distribution points · Total value: <span className="text-green-600">৳{totalValue.toLocaleString()}</span>
            </p>
          </div>
          <button
            onClick={() => { setShowForm(true); setSubmitError(null); setSubmitSuccess(false); }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-cobalt hover:bg-cobalt-dark rounded-xl text-white font-bold text-sm transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined icon-thick text-[18px]">add</span>
            New Warehouse
          </button>
        </div>

        {/* Cards Grid */}
        {warehouses.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-[2rem] p-12 text-center shadow-sm">
            <span className="material-symbols-outlined icon-thick text-gray-300 text-[64px]">warehouse</span>
            <h3 className="font-display text-2xl text-black mt-4">No warehouses registered</h3>
            <p className="text-gray-500 font-bold mt-2">Click 'New Warehouse' to add one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {warehouses.map((wh) => {
              return (
                <div
                  key={wh.WAREHOUSE_ID}
                  className="bg-white border border-gray-200 rounded-[2rem] p-6 transition-all duration-300 hover:shadow-md hover:border-blue-300 relative overflow-hidden flex flex-col"
                >
                  <div className="flex justify-between items-start mb-6 pl-4">
                    <div>
                      <h3 className="font-display text-2xl text-black">{wh.WAREHOUSE_NAME}</h3>
                      <p className="text-sm font-bold text-gray-500 flex items-center gap-1.5 mt-1">
                        <span className="material-symbols-outlined icon-thick text-[16px] text-gray-400">location_on</span>
                        {wh.LOCATION}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 pl-4">
                    {[
                      { label: "Capacity", value: wh.CAPACITY?.toLocaleString() },
                      { label: "Donations", value: wh.TOTAL_DONATIONS_STORED ?? 0 },
                      { label: "Total Value", value: `৳${(wh.TOTAL_DONATION_VALUE ?? 0).toLocaleString()}`, color: "text-green-600 text-lg" },
                      { label: "Manager", value: wh.MANAGER_NAME || "—" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</div>
                        <div className={`font-bold ${color || "text-black"}`}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-100 pl-4 flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-cobalt bg-blue-50 px-2.5 py-1 rounded-md">
                      {wh.WAREHOUSE_ID}
                    </span>
                    {canEdit && (
                      <button
                        onClick={() => {
                          setEditWarehouse(wh);
                          setEditForm({ capacity: String(wh.CAPACITY || ""), manager_name: wh.MANAGER_NAME || "" });
                        }}
                        className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-cobalt rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Edit Details
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editWarehouse} onClose={() => setEditWarehouse(null)} title="Update Warehouse Details">
        <form onSubmit={handleSaveEdit} className="space-y-4">
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
            <label className="block text-sm font-bold text-gray-700 mb-1">Manager Name</label>
            <input
              type="text"
              value={editForm.manager_name}
              onChange={e => setEditForm(p => ({ ...p, manager_name: e.target.value }))}
              placeholder="Name of person in charge"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-cobalt text-sm"
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setEditWarehouse(null)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={isSavingEdit} className="px-4 py-2 bg-cobalt text-white font-bold rounded-lg hover:bg-cobalt-dark disabled:opacity-50">
              {isSavingEdit ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── Add Warehouse Drawer ─── */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setShowForm(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 right-0 w-[480px] max-w-[90vw] bg-white border-l border-gray-200 shadow-2xl z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] flex flex-col ${
          showForm ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-azure shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-full hover:bg-blue-100 transition-colors text-cobalt"
              onClick={() => setShowForm(false)}
            >
              <span className="material-symbols-outlined icon-thick">close</span>
            </button>
            <h3 className="font-display text-xl text-black">
              Register Warehouse
            </h3>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {submitSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-700 shadow-sm">
              <span className="material-symbols-outlined icon-thick">check_circle</span>
              <span className="font-bold text-sm">Warehouse registered successfully!</span>
            </div>
          )}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm font-bold shadow-sm">
              {submitError}
            </div>
          )}

          {[
            { key: "warehouse_id", label: "Warehouse ID *", placeholder: "e.g., WH-001" },
            { key: "warehouse_name", label: "Warehouse Name *", placeholder: "e.g., Dhaka Central Depot" },
            { key: "location", label: "Location *", placeholder: "e.g., Mirpur, Dhaka", list: "locations-list" },
            { key: "capacity", label: "Capacity *", placeholder: "Storage units (number)", type: "number" },
            { key: "manager_name", label: "Manager Name", placeholder: "Full name" },
          ].map(({ key, label, placeholder, type, list }) => (
            <div key={key}>
              <label className="block font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
              <input
                type={type || "text"}
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={(e) => set(key, e.target.value)}
                list={list}
                className="w-full bg-gray-50 border border-gray-200 focus:border-cobalt focus:ring-2 focus:ring-azure rounded-xl px-4 py-3 text-sm font-medium text-black placeholder:text-gray-400 outline-none transition-all"
              />
            </div>
          ))}

          <datalist id="locations-list">
            {locations.map((loc, idx) => (
              <option key={idx} value={loc} />
            ))}
          </datalist>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex shrink-0">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-cobalt hover:bg-cobalt-dark text-white transition-colors shadow-sm disabled:opacity-50"
          >
            {submitting ? <span className="material-symbols-outlined icon-thick animate-spin">progress_activity</span> : <span className="material-symbols-outlined icon-thick">save</span>}
            {submitting ? "Saving..." : "Register Warehouse"}
          </button>
        </div>
      </div>
    </>
  );
}
