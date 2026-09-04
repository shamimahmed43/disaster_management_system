"use client";

import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import { getDistributions, createDistribution, getWarehouses, getPersonnel, getVehicles, getShelters } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Modal } from "@/components/ui/Modal";
import { toast } from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Distribution = {
  DISTRIBUTION_ID: string;
  DISTRIBUTION_DATE: string;
  QUANTITY: number;
  WAREHOUSE_ID: string;
  WAREHOUSE_NAME: string;
  SHELTER_ID: string;
  SHELTER_NAME: string;
  PERSON_ID: string;
  PERSONNEL_NAME: string;
  STATUS?: string;
  VEHICLE_ID: string;
  VEHICLE_TYPE: string;
  REGISTRATION_NO: string;
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-BD", { timeZone: "Asia/Dhaka", day: "2-digit", month: "short", year: "numeric" });
}

export default function ReliefPage() {
  const { data, loading, error, refetch } = useApi<Distribution[]>(getDistributions as any);
  const { data: warehouses } = useApi<{ WAREHOUSE_ID: string; WAREHOUSE_NAME: string }[]>(getWarehouses as any);
  const { data: personnel } = useApi<{ PERSON_ID: string; NAME: string }[]>(getPersonnel as any);
  const { data: vehicles } = useApi<{ VEHICLE_ID: string; VEHICLE_TYPE: string; REGISTRATION_NO: string }[]>(getVehicles as any);
  const { data: shelters } = useApi<{ SHELTER_ID: string; SHELTER_NAME: string }[]>(getShelters as any);

  const distributions = data ?? [];

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [form, setForm] = useState({
    distribution_id: "",
    warehouse_id: "",
    person_id: "",
    shelter_id: "",
    vehicle_id: "",
    distribution_date: new Date().toISOString().split("T")[0],
    quantity: "",
    status: "Completed",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { isInternal, isAdmin, isStaff } = useAuth();
  const canEdit = isAdmin || isStaff;
  
  const [editDist, setEditDist] = useState<Distribution | null>(null);
  const [editForm, setEditForm] = useState({ status: "", quantity: "" });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  function openEdit(d: Distribution) {
    setEditDist(d);
    setEditForm({
      status: d.STATUS || "Completed",
      quantity: String(d.QUANTITY || "")
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editDist) return;
    setIsSavingEdit(true);
    try {
      const token = localStorage.getItem("dms_token");
      const res = await fetch(`${API}/distributions/${editDist.DISTRIBUTION_ID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: editForm.status,
          quantity: parseInt(editForm.quantity) || null
        }),
      });
      if (!res.ok) throw new Error("Failed to update distribution");
      toast.success("Distribution updated");
      setEditDist(null);
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
        <p className="font-bold">Loading distributions...</p>
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

  const totalQty = distributions.reduce((sum, d) => sum + (d.QUANTITY ?? 0), 0);

  const setField = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const openAdd = () => {
    setForm({
      distribution_id: "",
      warehouse_id: "",
      person_id: "",
      shelter_id: "",
      vehicle_id: "",
      distribution_date: new Date().toISOString().split("T")[0],
      quantity: "",
      status: "Completed"
    });
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsDrawerOpen(true);
  };

  async function handleSubmit() {
    if (!form.distribution_id.trim() || !form.warehouse_id || !form.person_id || !form.quantity) {
      setSubmitError("Distribution ID, Warehouse, Personnel, and Quantity are required.");
      return;
    }
    const qtyNum = parseInt(form.quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setSubmitError("Quantity must be a positive number.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createDistribution({
        distribution_id: form.distribution_id.trim(),
        warehouse_id: form.warehouse_id,
        person_id: form.person_id,
        shelter_id: form.shelter_id || null,
        vehicle_id: form.vehicle_id || null,
        distribution_date: form.distribution_date,
        quantity: qtyNum,
        status: form.status || "Completed"
      });
      setSubmitSuccess(true);
      toast.success("Distribution recorded successfully!");
      refetch();
      setTimeout(() => {
        setIsDrawerOpen(false);
        setSubmitSuccess(false);
        setForm({
          distribution_id: "",
          warehouse_id: "",
          person_id: "",
          shelter_id: "",
          vehicle_id: "",
          distribution_date: new Date().toISOString().split("T")[0],
          quantity: "",
          status: "Completed"
        });
      }, 1500);
    } catch (err: any) {
      const errMsg = err.message ?? "Failed to create distribution";
      setSubmitError(errMsg);
      toast.error(errMsg);
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
            <h1 className="font-display text-4xl text-black uppercase tracking-tight">Relief Distribution</h1>
            <p className="font-bold text-black/70 mt-2 text-lg">
              {distributions.length} records · Total distributed: <span className="text-cobalt">{totalQty.toLocaleString()}</span> units
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-cobalt hover:bg-cobalt-dark rounded-xl text-white font-bold text-sm transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined icon-thick text-[18px]">add</span>
            + Add Distribution
          </button>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: "Total Distributions", value: distributions.length, icon: "local_shipping", color: "text-black" },
            { label: "Total Quantity", value: totalQty.toLocaleString(), icon: "inventory_2", color: "text-cobalt" },
          ].map((item) => (
            <div key={item.label} className="bg-white border border-gray-200 rounded-[2rem] p-6 flex justify-between items-center shadow-sm">
              <div>
                <div className="font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{item.label}</div>
                <div className={`font-display text-4xl leading-none ${item.color}`}>{item.value}</div>
              </div>
              <span className="material-symbols-outlined icon-thick text-[32px] text-gray-300">{item.icon}</span>
            </div>
          ))}
        </div>

        {/* Distribution Table */}
        <div className="bg-white border border-gray-200 rounded-[2rem] overflow-hidden shadow-sm flex flex-col min-h-[400px]">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
            <h2 className="font-display text-2xl text-black">Distribution Log</h2>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-cobalt uppercase tracking-wider bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                Warehouse ↔ Personnel
              </span>
              <button
                onClick={openAdd}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-cobalt hover:bg-cobalt-dark rounded-xl text-white font-bold text-sm transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined icon-thick text-[18px]">add</span>
                + Add Distribution
              </button>
            </div>
          </div>
          <div className="overflow-x-auto p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {["Dist. ID", "Date", "Warehouse", "Shelter", "Personnel", "Quantity", "Vehicle", "Status"].map((h) => (
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
                {distributions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <span className="material-symbols-outlined icon-thick text-[48px] text-gray-300">local_shipping</span>
                      <p className="font-bold text-gray-500 mt-4">No distribution records yet.</p>
                    </td>
                  </tr>
                ) : (
                  distributions.map((d) => (
                    <tr key={d.DISTRIBUTION_ID} className="hover:bg-azure transition-colors border-b border-gray-100 last:border-none">
                      <td className="p-4 font-bold text-cobalt">{d.DISTRIBUTION_ID}</td>
                      <td className="p-4 font-mono text-gray-600 font-bold">{formatDate(d.DISTRIBUTION_DATE)}</td>
                      <td className="p-4">
                        <div className="font-bold text-black">{d.WAREHOUSE_NAME || d.WAREHOUSE_ID}</div>
                        <div className="font-mono text-xs text-gray-400 mt-0.5">{d.WAREHOUSE_ID}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-black">{d.SHELTER_NAME || d.SHELTER_ID}</div>
                        <div className="font-mono text-xs text-gray-400 mt-0.5">{d.SHELTER_ID}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-black">{d.PERSONNEL_NAME || d.PERSON_ID}</div>
                        <div className="font-mono text-xs text-gray-400 mt-0.5">{d.PERSON_ID}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-bold text-cobalt bg-blue-50 px-3 py-1 rounded-lg">
                          {d.QUANTITY?.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        {d.VEHICLE_ID ? (
                          <div>
                            <div className="font-bold text-gray-700">{d.VEHICLE_TYPE}</div>
                            <div className="font-mono text-xs text-gray-400 mt-0.5">{d.REGISTRATION_NO}</div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400">
                            —
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wide ${
                          d.STATUS === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                          d.STATUS === 'In Transit' ? 'bg-blue-100 text-blue-700' :
                          d.STATUS === 'Cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {d.STATUS || "Completed"}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="p-4 text-right">
                          <button
                            onClick={() => openEdit(d)}
                            className="p-2 text-gray-400 hover:text-cobalt hover:bg-azure-light rounded-lg transition-colors"
                            title="Edit Distribution"
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

      {/* ─── Add Distribution Drawer ─── */}
      {isDrawerOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsDrawerOpen(false)} />}
      <div className={`fixed inset-y-0 right-0 w-[480px] max-w-[90vw] bg-white border-l border-gray-200 shadow-2xl z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] flex flex-col ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-azure shrink-0">
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-blue-100 transition-colors text-cobalt" onClick={() => setIsDrawerOpen(false)}>
              <span className="material-symbols-outlined icon-thick">close</span>
            </button>
            <h3 className="font-display text-xl text-black">Add Distribution</h3>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {submitSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-700 shadow-sm">
              <span className="material-symbols-outlined icon-thick">check_circle</span>
              <span className="font-bold text-sm">Distribution created successfully!</span>
            </div>
          )}
          {submitError && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm font-bold shadow-sm">{submitError}</div>}

          <div>
            <label className="block font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Distribution ID *</label>
            <input type="text" placeholder="e.g., DIST007" value={form.distribution_id} onChange={(e) => setField("distribution_id", e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-cobalt focus:ring-2 focus:ring-azure rounded-xl px-4 py-3 text-sm font-medium text-black placeholder:text-gray-400 outline-none transition-all" />
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-4">
            <div>
              <label className="block font-mono text-xs font-bold text-cobalt uppercase tracking-wider mb-2">Warehouse *</label>
              <select value={form.warehouse_id} onChange={(e) => setField("warehouse_id", e.target.value)}
                className="w-full bg-white border border-blue-200 focus:border-cobalt focus:ring-2 focus:ring-azure rounded-xl px-4 py-3 text-sm font-medium text-black outline-none transition-all">
                <option value="">-- Select Warehouse --</option>
                {(warehouses ?? []).map((w: any) => <option key={w.WAREHOUSE_ID} value={w.WAREHOUSE_ID}>{w.WAREHOUSE_NAME} ({w.WAREHOUSE_ID})</option>)}
              </select>
            </div>
            <div>
              <label className="block font-mono text-xs font-bold text-cobalt uppercase tracking-wider mb-2">Personnel *</label>
              <select value={form.person_id} onChange={(e) => setField("person_id", e.target.value)}
                className="w-full bg-white border border-blue-200 focus:border-cobalt focus:ring-2 focus:ring-azure rounded-xl px-4 py-3 text-sm font-medium text-black outline-none transition-all">
                <option value="">-- Select Personnel --</option>
                {(personnel ?? []).map((p: any) => <option key={p.PERSON_ID} value={p.PERSON_ID}>{p.NAME} ({p.PERSON_ID})</option>)}
              </select>
            </div>
            <div>
              <label className="block font-mono text-xs font-bold text-cobalt uppercase tracking-wider mb-2">Target Shelter</label>
              <select value={form.shelter_id} onChange={(e) => setField("shelter_id", e.target.value)}
                className="w-full bg-white border border-blue-200 focus:border-cobalt focus:ring-2 focus:ring-azure rounded-xl px-4 py-3 text-sm font-medium text-black outline-none transition-all">
                <option value="">-- Select Shelter (Optional) --</option>
                {(shelters ?? []).map((s: any) => <option key={s.SHELTER_ID} value={s.SHELTER_ID}>{s.SHELTER_NAME} ({s.SHELTER_ID})</option>)}
              </select>
            </div>
            <div>
              <label className="block font-mono text-xs font-bold text-cobalt uppercase tracking-wider mb-2">Vehicle (Optional)</label>
              <select value={form.vehicle_id} onChange={(e) => setField("vehicle_id", e.target.value)}
                className="w-full bg-white border border-blue-200 focus:border-cobalt focus:ring-2 focus:ring-azure rounded-xl px-4 py-3 text-sm font-medium text-black outline-none transition-all">
                <option value="">-- Select Vehicle (Optional) --</option>
                {(vehicles ?? []).map((v: any) => (
                  <option key={v.VEHICLE_ID} value={v.VEHICLE_ID}>
                    {v.VEHICLE_TYPE} ({v.REGISTRATION_NO})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Distribution Date</label>
              <input type="date" value={form.distribution_date} onChange={(e) => setField("distribution_date", e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-cobalt focus:ring-2 focus:ring-azure rounded-xl px-4 py-3 text-sm font-medium text-black outline-none transition-all" />
            </div>
            <div>
              <label className="block font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quantity *</label>
              <input type="number" placeholder="e.g., 500" value={form.quantity} onChange={(e) => setField("quantity", e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-cobalt focus:ring-2 focus:ring-azure rounded-xl px-4 py-3 text-sm font-medium text-black placeholder:text-gray-400 outline-none transition-all" />
            </div>
          </div>
          
          <div>
            <label className="block font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
            <select value={form.status || "Completed"} onChange={(e) => setField("status", e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-cobalt focus:ring-2 focus:ring-azure rounded-xl px-4 py-3 text-sm font-medium text-black outline-none transition-all">
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="In Transit">In Transit</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex shrink-0">
          <button 
            onClick={handleSubmit} 
            disabled={submitting} 
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-cobalt hover:bg-cobalt-dark text-white transition-colors shadow-sm disabled:opacity-50"
          >
            {submitting ? <span className="material-symbols-outlined icon-thick animate-spin">progress_activity</span> : <span className="material-symbols-outlined icon-thick">save</span>}
            {submitting ? "Saving..." : "Add Distribution"}
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editDist} onClose={() => setEditDist(null)} title="Update Distribution">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
            <select
              value={editForm.status}
              onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-cobalt"
            >
              <option value="Pending">Pending</option>
              <option value="In Transit">In Transit</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              value={editForm.quantity}
              onChange={e => setEditForm(p => ({ ...p, quantity: e.target.value }))}
              placeholder="e.g., 500"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-cobalt text-sm"
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setEditDist(null)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={isSavingEdit} className="px-4 py-2 bg-cobalt text-white font-bold rounded-lg hover:bg-cobalt-dark disabled:opacity-50">
              {isSavingEdit ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
