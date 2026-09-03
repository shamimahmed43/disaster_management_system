"use client";

import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import { getPersonnel, createPersonnel, getShelters, deployPersonnel, undeployPersonnel, getPersonnelDeployments } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";

type PersonnelRecord = {
  PERSON_ID: string;
  NAME: string;
  PHONE: string;
  AVAILABILITY_STATUS: string;
  DESIGNATION: string;
  BASE_LOCATION: string;
  SUPERVISOR_ID: string;
  SUPERVISOR_NAME: string;
  PERSONNEL_TYPE: string;
  TEAM_ID: string;
  SKILL: string;
  MEDICAL_SPECIALIZATION: string;
};

const EMPTY_FORM = {
  person_id: "",
  name: "",
  phone: "",
  availability_status: "Available",
  designation: "",
  base_location: "",
  supervisor_id: "",
  type: "base" as "base" | "volunteer" | "medical",
  team_id: "",
  skill: "",
  specialization: "",
  since_date: "",
};

export default function PersonnelPage() {
  const { data, loading, error, refetch } = useApi<PersonnelRecord[]>(getPersonnel as any);
  const [filter, setFilter] = useState<"All" | "Personnel" | "Volunteer" | "Medical Staff">("All");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { isInternal, isAdmin, isStaff, isVolunteer, user } = useAuth();
  const canEdit = isAdmin || isStaff;
  const canDelete = isAdmin;
  const showActionsColumn = isAdmin || isStaff || isVolunteer;

  const [shelters, setShelters] = useState<{SHELTER_ID: string, SHELTER_NAME: string}[]>([]);
  const [deployPerson, setDeployPerson] = useState<PersonnelRecord | null>(null);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [selectedShelterId, setSelectedShelterId] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);

  const [editPerson, setEditPerson] = useState<PersonnelRecord | null>(null);
  const [editForm, setEditForm] = useState({ phone: "", base_location: "", volunteer_status: "" });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  function openEdit(p: PersonnelRecord) {
    setEditPerson(p);
    setEditForm({
      phone: p.PHONE || "",
      base_location: p.BASE_LOCATION || "",
      volunteer_status: p.AVAILABILITY_STATUS || "Available"
    });
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editPerson) return;
    setIsSavingEdit(true);
    try {
      const token = localStorage.getItem("dms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/personnel/${editPerson.PERSON_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          phone: editForm.phone,
          base_location: editForm.base_location,
          volunteer_status: editPerson.PERSONNEL_TYPE === "Volunteer" ? editForm.volunteer_status : undefined
        }),
      });
      if (!res.ok) throw new Error("Failed to update personnel");
      toast.success("Personnel updated");
      setEditPerson(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDelete(p: PersonnelRecord) {
    if (!confirm(`Are you sure you want to delete ${p.NAME} (${p.PERSON_ID})? This will suspend their linked account.`)) return;
    
    try {
      const token = localStorage.getItem("dms_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/personnel/${p.PERSON_ID}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete personnel");
      }
      toast.success("Personnel deleted and linked account suspended.");
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function openDeploy(p: PersonnelRecord) {
    setDeployPerson(p);
    setIsDeploying(true);
    try {
      const [sh, deps] = await Promise.all([
        getShelters(),
        getPersonnelDeployments(p.PERSON_ID)
      ]);
      setShelters(sh as any);
      setDeployments(deps as any);
    } catch (err) {
      toast.error("Failed to load deployment info");
    } finally {
      setIsDeploying(false);
    }
  }

  async function handleDeploy() {
    if (!selectedShelterId || !deployPerson) return;
    setIsDeploying(true);
    try {
      await deployPersonnel({ person_id: deployPerson.PERSON_ID, shelter_id: selectedShelterId });
      toast.success("Personnel deployed successfully");
      const deps = await getPersonnelDeployments(deployPerson.PERSON_ID);
      setDeployments(deps as any);
      setSelectedShelterId("");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to deploy");
    } finally {
      setIsDeploying(false);
    }
  }

  async function handleUndeploy(shelter_id: string) {
    if (!deployPerson) return;
    setIsDeploying(true);
    try {
      await undeployPersonnel({ person_id: deployPerson.PERSON_ID, shelter_id });
      toast.success("Personnel undeployed");
      const deps = await getPersonnelDeployments(deployPerson.PERSON_ID);
      setDeployments(deps as any);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to undeploy");
    } finally {
      setIsDeploying(false);
    }
  }

  const personnel = data ?? [];
  const filtered = filter === "All" ? personnel : personnel.filter((p) => p.PERSONNEL_TYPE === filter);

  const setField = (k: string, val: string) => setForm((p) => ({ ...p, [k]: val }));

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsDrawerOpen(true);
  };

  async function handleSubmit() {
    if (!form.person_id || !form.name) {
      setSubmitError("Person ID and Name are required.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createPersonnel({
        person_id: form.person_id,
        name: form.name,
        phone: form.phone || null,
        availability_status: form.availability_status || "Available",
        designation: form.designation || null,
        base_location: form.base_location || null,
        supervisor_id: form.supervisor_id || null,
        type: form.type,
        team_id: form.type === "volunteer" ? form.team_id || null : null,
        skill: form.type === "volunteer" ? form.skill || null : null,
        specialization: form.type === "medical" ? form.specialization || null : null,
        since_date: form.type === "medical" && form.since_date ? form.since_date : null,
      });
      setSubmitSuccess(true);
      refetch();
      setTimeout(() => setIsDrawerOpen(false), 1500);
    } catch (err: any) {
      setSubmitError(err.message ?? "Failed to add personnel");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-cobalt">
        <span className="material-symbols-outlined icon-thick text-[48px] animate-spin">progress_activity</span>
        <p className="font-bold">Loading personnel...</p>
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

  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-6 p-2 md:p-4">
      {/* Header */}
      <div className="bg-azure rounded-[2rem] p-8 flex flex-col md:flex-row md:items-end justify-between gap-6 shadow-sm border border-blue-200">
        <div>
          <h1 className="font-display text-4xl text-black uppercase tracking-tight">Personnel Directory</h1>
          <p className="font-bold text-black/70 mt-2 text-lg">
            {personnel.length} total staff — Includes Volunteers and Medical Specialists
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-cobalt hover:bg-cobalt-dark rounded-xl text-white font-bold text-sm transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined icon-thick text-[18px]">person_add</span>
            Add Personnel
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-[2rem] p-4 flex flex-wrap gap-2 shadow-sm">
        {(["All", "Personnel", "Volunteer", "Medical Staff"] as const).map((tab) => {
          const isActive = filter === tab;
          const count = tab === "All" ? personnel.length : personnel.filter((p) => p.PERSONNEL_TYPE === tab).length;
          
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-5 py-3 rounded-xl font-bold text-sm transition-all border ${
                isActive
                  ? "bg-cobalt text-white border-cobalt shadow-sm"
                  : "bg-white text-gray-600 border-transparent hover:bg-gray-50"
              }`}
            >
              {tab} <span className={`ml-2 px-2 py-0.5 rounded-md font-mono text-xs ${isActive ? "bg-blue-400/30 text-white" : "bg-gray-100 text-gray-500"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-[2rem] overflow-hidden shadow-sm flex flex-col min-h-[400px]">
        <div className="overflow-x-auto p-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                {["ID", "Name", "Type", "Status", "Designation / Spec.", "Skill / Team", "Phone", "Base Location"].map((h) => (
                  <th key={h} className="p-4 font-mono text-xs text-gray-500 uppercase tracking-wider font-bold bg-azure border-b border-gray-200 first:rounded-tl-xl">
                    {h}
                  </th>
                ))}
                {showActionsColumn && (
                  <th className="p-4 font-mono text-xs text-gray-500 uppercase tracking-wider font-bold bg-azure border-b border-gray-200 rounded-tr-xl text-right">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-black">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={showActionsColumn ? 9 : 8} className="p-12 text-center">
                    <span className="material-symbols-outlined icon-thick text-[48px] text-gray-300">badge</span>
                    <p className="font-bold text-gray-500 mt-4">No records match the current filter.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const typeColor = 
                    p.PERSONNEL_TYPE === "Medical Staff" ? "bg-blue-100 text-cobalt" :
                    p.PERSONNEL_TYPE === "Volunteer" ? "bg-green-100 text-green-700" :
                    "bg-gray-100 text-gray-700";
                    
                  const canEditThisRow = canEdit || user?.person_id === p.PERSON_ID;

                  return (
                    <tr key={p.PERSON_ID} className="hover:bg-azure transition-colors border-b border-gray-100 last:border-none">
                      <td className="p-4 font-bold text-cobalt">{p.PERSON_ID}</td>
                      <td className="p-4 font-bold">{p.NAME}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wide ${typeColor}`}>
                          {p.PERSONNEL_TYPE}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wide ${
                          p.AVAILABILITY_STATUS === "Available" ? "bg-green-100 text-green-700" : 
                          p.AVAILABILITY_STATUS === "Deployed" ? "bg-blue-100 text-blue-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {p.AVAILABILITY_STATUS || "Unknown"}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">
                        {p.MEDICAL_SPECIALIZATION
                          ? <span className="font-bold text-cobalt">Dr. {p.MEDICAL_SPECIALIZATION}</span>
                          : p.DESIGNATION || "—"}
                      </td>
                      <td className="p-4 text-gray-600">
                        {p.PERSONNEL_TYPE === "Volunteer" ? (
                          <div>
                            <span className="block">{p.SKILL ? `Skill: ${p.SKILL}` : "—"}</span>
                            <span className="font-mono text-xs text-gray-400">{p.TEAM_ID ? `Team: ${p.TEAM_ID}` : ""}</span>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="p-4 font-mono text-gray-600">{p.PHONE || "—"}</td>
                      <td className="p-4 text-gray-600">{p.BASE_LOCATION || "—"}</td>
                      {showActionsColumn && (
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            {canEditThisRow && (
                              <button
                                onClick={() => openEdit(p)}
                                className="p-2 text-gray-400 hover:text-cobalt hover:bg-azure-light rounded-lg transition-colors"
                                title="Edit Details"
                              >
                                <span className="material-symbols-outlined icon-thick text-[18px]">edit</span>
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(p)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Personnel"
                              >
                                <span className="material-symbols-outlined icon-thick text-[18px]">delete</span>
                              </button>
                            )}
                            {canEdit && (
                              <button
                                onClick={() => openDeploy(p)}
                                className="p-2 text-gray-400 hover:text-cobalt hover:bg-azure-light rounded-lg transition-colors"
                                title="Deploy / Assign to Shelter"
                              >
                                <span className="material-symbols-outlined icon-thick text-[18px]">transfer_within_a_station</span>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Add Personnel Drawer ─── */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 right-0 w-[480px] max-w-[90vw] bg-white border-l border-gray-200 shadow-2xl z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] flex flex-col ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-azure shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="p-2 rounded-full hover:bg-blue-100 transition-colors text-cobalt"
              onClick={() => setIsDrawerOpen(false)}
            >
              <span className="material-symbols-outlined icon-thick">close</span>
            </button>
            <h3 className="font-display text-xl text-black">
              Add Personnel
            </h3>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {submitSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-700 shadow-sm">
              <span className="material-symbols-outlined icon-thick">check_circle</span>
              <span className="font-bold text-sm">Personnel added successfully!</span>
            </div>
          )}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm font-bold shadow-sm">
              {submitError}
            </div>
          )}

          {/* Type selector */}
          <div>
            <label className="block font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Personnel Type *
            </label>
            <div className="flex gap-2">
              {(["base", "volunteer", "medical"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setField("type", t)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border shadow-sm ${
                    form.type === t
                      ? "bg-cobalt text-white border-cobalt"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {t === "base" ? "Personnel" : t === "volunteer" ? "Volunteer" : "Medical"}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full" />

          {/* Common fields */}
          {[
            { key: "person_id", label: "Person ID *", placeholder: "e.g., P-006" },
            { key: "name", label: "Full Name *", placeholder: "Full name" },
            { key: "phone", label: "Phone", placeholder: "01711000001" },
            { key: "designation", label: "Designation", placeholder: "e.g., Field Supervisor" },
            { key: "base_location", label: "Base Location", placeholder: "e.g., Dhaka" },
            { key: "supervisor_id", label: "Supervisor ID", placeholder: "e.g., P-001 (optional)" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
              <input
                type="text"
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={(e) => setField(key, e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-cobalt focus:ring-2 focus:ring-azure rounded-xl px-4 py-3 text-sm font-medium text-black placeholder:text-gray-400 outline-none transition-all"
              />
            </div>
          ))}

          <div>
            <label className="block font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Availability Status</label>
            <select
              value={form.availability_status}
              onChange={(e) => setField("availability_status", e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 focus:border-cobalt focus:ring-2 focus:ring-azure rounded-xl px-4 py-3 text-sm font-medium text-black outline-none transition-all"
            >
              <option value="Available">Available</option>
              <option value="Deployed">Deployed</option>
              <option value="Off-duty">Off-duty</option>
            </select>
          </div>

          {/* Volunteer-specific */}
          {form.type === "volunteer" && (
            <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col gap-4">
              <div>
                <label className="block font-mono text-xs font-bold text-green-700 uppercase tracking-wider mb-2">Skill</label>
                <input
                  type="text"
                  placeholder="e.g., First Aid, Rescue"
                  value={form.skill}
                  onChange={(e) => setField("skill", e.target.value)}
                  className="w-full bg-white border border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-xl px-4 py-3 text-sm font-medium text-black placeholder:text-gray-400 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block font-mono text-xs font-bold text-green-700 uppercase tracking-wider mb-2">Team ID</label>
                <input
                  type="text"
                  placeholder="e.g., T-001"
                  value={form.team_id}
                  onChange={(e) => setField("team_id", e.target.value)}
                  className="w-full bg-white border border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-xl px-4 py-3 text-sm font-medium text-black placeholder:text-gray-400 outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Medical-specific */}
          {form.type === "medical" && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col gap-4">
              <div>
                <label className="block font-mono text-xs font-bold text-cobalt uppercase tracking-wider mb-2">Specialization</label>
                <input
                  type="text"
                  placeholder="e.g., Emergency Medicine"
                  value={form.specialization}
                  onChange={(e) => setField("specialization", e.target.value)}
                  className="w-full bg-white border border-blue-200 focus:border-cobalt focus:ring-2 focus:ring-azure rounded-xl px-4 py-3 text-sm font-medium text-black placeholder:text-gray-400 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block font-mono text-xs font-bold text-cobalt uppercase tracking-wider mb-2">Since Date</label>
                <input
                  type="date"
                  value={form.since_date}
                  onChange={(e) => setField("since_date", e.target.value)}
                  className="w-full bg-white border border-blue-200 focus:border-cobalt focus:ring-2 focus:ring-azure rounded-xl px-4 py-3 text-sm font-medium text-black outline-none transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex shrink-0">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-cobalt hover:bg-cobalt-dark text-white transition-colors shadow-sm disabled:opacity-50"
          >
            {submitting ? <span className="material-symbols-outlined icon-thick animate-spin">progress_activity</span> : <span className="material-symbols-outlined icon-thick">save</span>}
            {submitting ? "Saving..." : "Add Personnel"}
          </button>
        </div>
      </div>

      {/* Deploy Modal */}
      <Modal isOpen={!!deployPerson} onClose={() => setDeployPerson(null)} title="Deploy Personnel">
        {deployPerson && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="font-bold text-lg">{deployPerson.NAME}</h3>
              <p className="text-sm text-gray-500">{deployPerson.PERSONNEL_TYPE} ({deployPerson.PERSON_ID})</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Current Deployments</h4>
              {isDeploying && deployments.length === 0 ? (
                <p className="text-sm text-gray-400">Loading...</p>
              ) : deployments.length === 0 ? (
                <p className="text-sm font-bold text-gray-400">Not currently deployed to any shelter.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {deployments.map((d, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-bold text-sm text-cobalt">{d.SHELTER_NAME}</p>
                        <p className="text-xs text-gray-500 mt-1">Deployed since {new Date(d.DEPLOYMENT_DATE).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => handleUndeploy(d.SHELTER_ID)}
                        disabled={isDeploying}
                        className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        Undeploy
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h4 className="font-mono text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">New Deployment</h4>
              <div className="flex gap-2">
                <select
                  value={selectedShelterId}
                  onChange={(e) => setSelectedShelterId(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-cobalt"
                >
                  <option value="">-- Select Shelter --</option>
                  {shelters.map(s => (
                    <option key={s.SHELTER_ID} value={s.SHELTER_ID}>{s.SHELTER_NAME}</option>
                  ))}
                </select>
                <button
                  onClick={handleDeploy}
                  disabled={isDeploying || !selectedShelterId}
                  className="px-4 py-2 bg-cobalt text-white rounded-lg font-bold text-sm hover:bg-cobalt-dark disabled:opacity-50"
                >
                  Deploy
                </button>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button onClick={() => setDeployPerson(null)} className="px-5 py-2 text-gray-500 hover:bg-gray-100 rounded-xl font-bold">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Personnel Modal */}
      <Modal isOpen={!!editPerson} onClose={() => setEditPerson(null)} title="Edit Personnel">
        {editPerson && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
              <input type="text" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-cobalt text-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Base Location</label>
              <input type="text" value={editForm.base_location} onChange={e => setEditForm(p => ({ ...p, base_location: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-cobalt text-sm" />
            </div>
            {editPerson.PERSONNEL_TYPE === "Volunteer" && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                <select value={editForm.volunteer_status} onChange={e => setEditForm(p => ({ ...p, volunteer_status: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-cobalt text-sm">
                  <option value="Available">Available</option>
                  <option value="Deployed">Deployed</option>
                  <option value="Off-duty">Off-duty</option>
                </select>
              </div>
            )}
            <div className="pt-4 flex justify-end gap-2 border-t border-gray-100 mt-4">
              <button type="button" onClick={() => setEditPerson(null)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={isSavingEdit} className="px-4 py-2 bg-cobalt text-white font-bold rounded-lg hover:bg-cobalt-dark disabled:opacity-50">
                {isSavingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
