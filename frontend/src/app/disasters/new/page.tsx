"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDisaster } from "@/services/api";

const INCIDENT_TYPES = [
  { id: "Hurricane", icon: "cyclone", label: "HURRICANE / CYCLONE" },
  { id: "Earthquake", icon: "earthquake", label: "SEISMIC EVENT" },
  { id: "Wildfire", icon: "local_fire_department", label: "WILDFIRE" },
  { id: "Flood", icon: "flood", label: "FLOODING" },
  { id: "Industrial", icon: "factory", label: "INDUSTRIAL ACCIDENT" },
  { id: "Other", icon: "warning", label: "OTHER / UNCLASSIFIED" },
];

const DIVISIONS = [
  "Dhaka", "Chittagong", "Rajshahi", "Sylhet", "Barisal",
  "Khulna", "Rangpur", "Mymensingh",
];

const SEVERITY_LEVELS = ["Low", "Medium", "High", "Critical"];

export default function NewIncidentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    disaster_id: "",
    disaster_name: "",
    disaster_type: "",
    division: "",
    district: "",
    start_date: "",
    end_date: "",
    severity_level: "",
    status: "Active",
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  async function handleSubmit() {
    if (!form.disaster_id || !form.disaster_name || !form.disaster_type || !form.division || !form.district || !form.start_date || !form.severity_level || !form.status) {
      setSubmitError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        ...form,
        end_date: form.end_date.trim() === "" ? null : form.end_date,
      };
      await createDisaster(payload as any);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      setSubmitError(err.message ?? "Failed to create disaster. Make sure the backend is running.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-stable-emerald text-[64px]">check_circle</span>
          <h2 className="text-headline-lg font-headline-lg text-on-surface mt-4">Disaster Event Registered</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-2">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const STEP_LABELS = ["CLASSIFICATION", "LOCATION", "TIMELINE", "CONFIRM"];
  const progressPct = `${(step / 4) * 100}%`;

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-12 py-8 flex flex-col h-[calc(100vh-48px)]">
      {/* Step Progress */}
      <div className="w-full max-w-4xl mx-auto mb-10">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface-variant z-0 rounded-full" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary z-0 rounded-full transition-all duration-500"
            style={{ width: progressPct }}
          />
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex flex-col items-center gap-2 relative z-10 w-24">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-label-caps text-label-caps ring-4 ring-navy-bg ${
                  step > i + 1
                    ? "bg-stable-emerald text-white"
                    : step === i + 1
                    ? "bg-primary text-on-primary shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                    : "bg-surface-variant text-on-surface-variant"
                }`}
              >
                {step > i + 1 ? <span className="material-symbols-outlined text-[16px]">check</span> : i + 1}
              </div>
              <span
                className={`font-label-caps text-label-caps text-center ${
                  step === i + 1 ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto flex flex-col flex-1">
        <div className="bg-slate-surface border border-outline-variant rounded-xl p-8 shadow-sm flex-1 mb-8">

          {/* Step 1: Classification */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary text-2xl">emergency</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">Incident Classification</h2>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                      DISASTER ID *
                    </label>
                    <input
                      className="w-full bg-surface-dim border border-outline-variant text-on-surface font-body-md rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder-on-surface-variant/50"
                      placeholder="e.g., FL-2026-001"
                      type="text"
                      value={form.disaster_id}
                      onChange={(e) => set("disaster_id", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                      DISASTER NAME *
                    </label>
                    <input
                      className="w-full bg-surface-dim border border-outline-variant text-on-surface font-body-md rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all placeholder-on-surface-variant/50"
                      placeholder="e.g., Dhaka Flood 2026"
                      type="text"
                      value={form.disaster_name}
                      onChange={(e) => set("disaster_name", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">SEVERITY LEVEL *</label>
                    <select
                      className="w-full bg-surface-dim border border-outline-variant text-on-surface font-body-md rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none"
                      value={form.severity_level}
                      onChange={(e) => set("severity_level", e.target.value)}
                    >
                      <option value="">Select Severity</option>
                      {SEVERITY_LEVELS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">STATUS *</label>
                    <select
                      className="w-full bg-surface-dim border border-outline-variant text-on-surface font-body-md rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none"
                      value={form.status}
                      onChange={(e) => set("status", e.target.value)}
                    >
                      <option value="Active">Active</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-3">
                    PRIMARY HAZARD TYPE *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {INCIDENT_TYPES.map((type) => (
                      <label key={type.id} className="cursor-pointer">
                        <input
                          className="peer sr-only"
                          name="incident_type"
                          type="radio"
                          value={type.id}
                          checked={form.disaster_type === type.id}
                          onChange={() => set("disaster_type", type.id)}
                        />
                        <div className="bg-surface-dim border border-outline-variant rounded-lg p-4 flex flex-col items-center gap-3 peer-checked:border-primary peer-checked:bg-primary-container/10 peer-checked:text-primary transition-colors hover:border-primary/50 text-on-surface-variant">
                          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {type.icon}
                          </span>
                          <span className="font-label-caps text-label-caps text-center">{type.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary text-2xl">location_on</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">Location Details</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">DIVISION *</label>
                  <select
                    className="w-full bg-surface-dim border border-outline-variant text-on-surface font-body-md rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none"
                    value={form.division}
                    onChange={(e) => set("division", e.target.value)}
                  >
                    <option value="">Select Division</option>
                    {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">DISTRICT *</label>
                  <input
                    className="w-full bg-surface-dim border border-outline-variant text-on-surface font-body-md rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    placeholder="e.g., Gazipur"
                    type="text"
                    value={form.district}
                    onChange={(e) => set("district", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Timeline */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary text-2xl">calendar_month</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">Event Timeline</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                    START DATE *
                  </label>
                  <input
                    className="w-full bg-surface-dim border border-outline-variant text-on-surface font-body-md rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all [color-scheme:dark]"
                    type="date"
                    value={form.start_date}
                    onChange={(e) => set("start_date", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-label-caps text-label-caps text-on-surface-variant mb-2">
                    END DATE (leave blank if ongoing)
                  </label>
                  <input
                    className="w-full bg-surface-dim border border-outline-variant text-on-surface font-body-md rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all [color-scheme:dark]"
                    type="date"
                    value={form.end_date}
                    onChange={(e) => set("end_date", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary text-2xl">fact_check</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">Confirm & Submit</h2>
              </div>
              <div className="bg-surface-container-low rounded-lg border border-outline-variant p-6 space-y-4">
                {[
                  { label: "Disaster ID", value: form.disaster_id },
                  { label: "Disaster Name", value: form.disaster_name },
                  { label: "Type", value: form.disaster_type },
                  { label: "Severity", value: form.severity_level },
                  { label: "Status", value: form.status },
                  { label: "Division", value: form.division },
                  { label: "District", value: form.district },
                  { label: "Start Date", value: form.start_date },
                  { label: "End Date", value: form.end_date || "Ongoing (NULL)" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-label-caps font-label-caps text-on-surface-variant">{item.label}</span>
                    <span className="text-body-md font-body-md text-on-surface font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
              {submitError && (
                <div className="mt-4 bg-emergency-red/10 border border-emergency-red/30 rounded-lg p-4 text-emergency-red text-body-md font-body-md">
                  {submitError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="flex justify-between items-center pt-4 border-t border-outline-variant mt-auto">
          <button
            className={`px-6 py-3 rounded-lg font-label-caps text-label-caps border border-outline-variant transition-colors focus:outline-none ${
              step === 1
                ? "opacity-50 cursor-not-allowed text-on-surface-variant"
                : "text-on-surface hover:bg-surface-variant"
            }`}
            disabled={step === 1}
            onClick={() => setStep((s) => s - 1)}
          >
            PREVIOUS
          </button>

          {step < 4 ? (
            <button
              className="px-6 py-3 rounded-lg font-label-caps text-label-caps bg-command-blue text-white hover:bg-command-blue/90 transition-colors focus:outline-none flex items-center gap-2"
              onClick={() => setStep((s) => s + 1)}
            >
              {step === 1 ? "PROCEED TO LOCATION" : step === 2 ? "PROCEED TO TIMELINE" : "REVIEW & CONFIRM"}
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          ) : (
            <button
              className="px-6 py-3 rounded-lg font-label-caps text-label-caps bg-emergency-red text-white hover:bg-emergency-red/90 transition-colors focus:outline-none flex items-center gap-2 disabled:opacity-60"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> SUBMITTING...</>
              ) : (
                <><span className="material-symbols-outlined text-[18px]">add_alert</span> ACTIVATE INCIDENT</>
              )}
            </button>
          )}
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}
