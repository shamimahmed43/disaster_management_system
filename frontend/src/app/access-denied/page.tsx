"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function AccessDeniedPage() {
  const { user } = useAuth();

  const roleLabels: Record<string, string> = {
    admin: "Administrator",
    staff: "Staff (Ops Center)",
    volunteer: "Volunteer (Field Ops)",
    medical_staff: "Medical Staff (Triage)",
    victim: "Victim Portal",
  };

  const currentRole = user?.role ? roleLabels[user.role] || user.role : "Unassigned";

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-[2.5rem] p-8 md:p-10 text-center shadow-lg relative overflow-hidden">
        {/* Glow / Accent Header */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-6 shadow-sm">
          <span className="material-symbols-outlined icon-thick text-[42px]">
            lock
          </span>
        </div>

        <div className="font-mono text-xs font-bold text-red-600 uppercase tracking-widest mb-2">
          HTTP 403 · Access Denied
        </div>
        <h1 className="font-display text-3xl text-black uppercase tracking-tight mb-3">
          Restricted Area
        </h1>
        <p className="text-gray-600 text-sm font-medium leading-relaxed mb-6">
          Your current account role does not have permission to access this module or operational resource.
        </p>

        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-8 text-left">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-gray-500 font-bold uppercase">Current User</span>
            <span className="font-bold text-black">{user?.name || "Anonymous"}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-mono mt-2 pt-2 border-t border-gray-200">
            <span className="text-gray-500 font-bold uppercase">Assigned Role</span>
            <span className="font-bold text-cobalt bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
              {currentRole}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard"
            className="flex-1 py-3 px-5 bg-cobalt hover:bg-cobalt-dark text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined icon-thick text-[18px]">
              dashboard
            </span>
            Return to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined icon-thick text-[18px]">
              arrow_back
            </span>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
