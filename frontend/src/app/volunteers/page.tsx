"use client";

import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import { getVolunteers, createPersonnel } from "@/services/api";
import { toast } from "react-hot-toast";

type Volunteer = {
  PERSON_ID: string;
  NAME: string;
  PHONE: string;
  BASE_LOCATION: string;
  AVAILABILITY_STATUS: string;
  DEPLOYED_SHELTER_NAME: string;
  SKILL: string;
};

const EMPTY_FORM = {
  person_id: "",
  name: "",
  phone: "",
  designation: "Volunteer",
  base_location: "",
  team: "General",
};

export default function VolunteersPage() {
  const { data, loading, error, refetch } = useApi<Volunteer[]>(getVolunteers as any);
  const volunteers = data ?? [];

  const [showDrawer, setShowDrawer] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const teams = Array.from(new Set(volunteers.map((v) => v.SKILL).filter(Boolean)));

  const setField = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit() {
    if (!form.person_id || !form.name) {
      setSubmitError("Person ID and Name are required.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createPersonnel({
        ...form,
        type: "volunteer",
      });
      setSubmitSuccess(true);
      toast.success("Volunteer registered successfully!");
      refetch();
      setTimeout(() => {
        setShowDrawer(false);
        setSubmitSuccess(false);
        setForm(EMPTY_FORM);
      }, 1200);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to register volunteer.");
      toast.error(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-cobalt">
        <span className="material-symbols-outlined icon-thick text-[48px] animate-spin">progress_activity</span>
        <p className="font-bold">Loading volunteers...</p>
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
    <>
      <div className="max-w-[1600px] mx-auto flex flex-col gap-6 p-2 md:p-4">
        {/* Header */}
        <div className="bg-azure rounded-[2rem] p-8 flex flex-col md:flex-row md:items-end justify-between gap-6 shadow-sm border border-blue-200">
          <div>
            <h1 className="font-display text-4xl text-black uppercase tracking-tight">Volunteers</h1>
            <p className="font-bold text-black/70 mt-2 text-lg">
              {volunteers.length} volunteers across {teams.length || 1} teams
            </p>
          </div>
          <button
            onClick={() => {
              setForm(EMPTY_FORM);
              setSubmitError(null);
              setSubmitSuccess(false);
              setShowDrawer(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-cobalt hover:bg-cobalt-dark rounded-xl text-white font-bold text-sm transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined icon-thick text-[18px]">person_add</span>
            + Register Volunteer
          </button>
        </div>

        {/* Teams Summary Cards */}
        {teams.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {teams.map((team) => {
              const count = volunteers.filter((v) => v.SKILL === team).length;
              return (
                <div key={team} className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined icon-thick text-[20px] text-cobalt">groups</span>
                    <span className="font-mono text-xs font-bold text-gray-500 uppercase tracking-wider">{team}</span>
                  </div>
                  <div className="font-display text-4xl text-black">{count}</div>
                  <div className="text-xs font-bold text-gray-400 mt-1">members</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Volunteers Table */}
        <div className="bg-white border border-gray-200 rounded-[2rem] overflow-hidden shadow-sm flex flex-col min-h-[400px]">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-display text-2xl text-black">Volunteer Directory</h2>
          </div>
          <div className="overflow-x-auto p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {["ID", "Name", "Status", "Skill", "Phone", "Base Location"].map((h) => (
                    <th key={h} className="p-4 font-mono text-xs text-gray-500 uppercase tracking-wider font-bold bg-azure border-b border-gray-200 first:rounded-tl-xl last:rounded-tr-xl">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-black">
                {volunteers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-500 font-bold">
                      <span className="material-symbols-outlined icon-thick text-[48px] text-gray-300">groups</span>
                      <p className="mt-4">No volunteers registered yet.</p>
                    </td>
                  </tr>
                ) : (
                  volunteers.map((v) => (
                    <tr key={v.PERSON_ID} className="hover:bg-azure transition-colors border-b border-gray-100 last:border-none">
                      <td className="p-4 font-bold text-cobalt">{v.PERSON_ID}</td>
                      <td className="p-4 font-bold">{v.NAME}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wide ${
                          v.AVAILABILITY_STATUS === "Deployed" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            v.AVAILABILITY_STATUS === "Deployed" ? "bg-blue-500" : "bg-green-500 animate-pulse"
                          }`} />
                          {v.AVAILABILITY_STATUS === "Deployed" && v.DEPLOYED_SHELTER_NAME
                            ? `Deployed @ ${v.DEPLOYED_SHELTER_NAME}`
                            : (v.AVAILABILITY_STATUS || "Available")}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">{v.SKILL || "—"}</td>
                      <td className="p-4 font-mono text-gray-600">{v.PHONE || "—"}</td>
                      <td className="p-4 text-gray-600">{v.BASE_LOCATION || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Volunteer Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={() => setShowDrawer(false)} />
      )}
      <div
        className={`fixed inset-y-0 right-0 w-[480px] max-w-[90vw] bg-white border-l border-gray-200 shadow-2xl z-50 transform transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] flex flex-col ${
          showDrawer ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-azure shrink-0">
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-blue-100 transition-colors text-cobalt" onClick={() => setShowDrawer(false)}>
              <span className="material-symbols-outlined icon-thick">close</span>
            </button>
            <h3 className="font-display text-xl text-black">Register Volunteer</h3>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {submitSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-green-700 shadow-sm">
              <span className="material-symbols-outlined icon-thick">check_circle</span>
              <span className="font-bold text-sm">Volunteer registered successfully!</span>
            </div>
          )}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm font-bold shadow-sm">
              {submitError}
            </div>
          )}

          {[
            { key: "person_id", label: "Person ID *", placeholder: "e.g., VOL-001 or PER010" },
            { key: "name", label: "Full Name *", placeholder: "e.g., Jahangir Alam" },
            { key: "phone", label: "Phone Number", placeholder: "e.g., 01711000085" },
            { key: "team", label: "Team / Unit", placeholder: "e.g., Rescue Team A, Logistics, Food Distribution" },
            { key: "designation", label: "Designation", placeholder: "e.g., Field Lead, Volunteer" },
            { key: "base_location", label: "Base Location", placeholder: "e.g., Rajshahi, Dhaka" },
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
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex shrink-0">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-cobalt hover:bg-cobalt-dark text-white transition-colors shadow-sm disabled:opacity-50"
          >
            {submitting ? (
              <span className="material-symbols-outlined icon-thick animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined icon-thick">save</span>
            )}
            {submitting ? "Saving..." : "Register Volunteer"}
          </button>
        </div>
      </div>
    </>
  );
}
