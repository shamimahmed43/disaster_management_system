"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TacticalAuthLayout from "@/components/layout/TacticalAuthLayout";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function AdminRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password || !form.role) {
      setError("All fields including role are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/auth/internal/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, full_name: form.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      
      // Store temp data for OTP verification
      localStorage.setItem("temp_admin_reg_email", form.email);
      router.push("/admin/verify"); // Assuming OTP verification page exists
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TacticalAuthLayout
      title="Internal System Registration"
      subtitle="Request authorization for tactical command"
      backHref="/"
      illustrationType="internal"
    >
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 text-xs mb-4 flex items-center justify-center gap-2 max-w-[300px] w-full">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-[300px]">
        {/* Name Input */}
        <div className="space-y-1 text-center">
          <label className="block text-xs text-gray-400 font-mono tracking-widest uppercase mb-1">Full Name</label>
          <input
            type="text"
            placeholder="COMMANDER ALFA"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full glass-input rounded-full px-5 py-2.5 text-center text-white placeholder-gray-600 font-mono text-sm"
          />
        </div>
        
        {/* Email Input */}
        <div className="space-y-1 text-center">
          <label className="block text-xs text-gray-400 font-mono tracking-widest uppercase mb-1">Email Address</label>
          <input
            type="email"
            placeholder="admin@example.com"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="w-full glass-input rounded-full px-5 py-2.5 text-center text-white placeholder-gray-600 font-mono text-sm"
          />
        </div>

        {/* Phone Input */}
        <div className="space-y-1 text-center">
          <label className="block text-xs text-gray-400 font-mono tracking-widest uppercase mb-1">Secure Comms (Phone)</label>
          <input
            type="text"
            placeholder="017XXXXXXXX"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className="w-full glass-input rounded-full px-5 py-2.5 text-center text-white placeholder-gray-600 font-mono text-sm"
          />
        </div>
        
        {/* Role Selection */}
        <div className="space-y-1 text-center">
          <label className="block text-xs text-gray-400 font-mono tracking-widest uppercase mb-1">Requested Clearance Level</label>
          <select
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
            className="w-full glass-input rounded-full px-5 py-2.5 text-center text-white font-mono text-sm appearance-none cursor-pointer"
          >
            <option value="" disabled className="text-black">-- SELECT ROLE --</option>
            <option value="admin" className="text-black">Administrator (Full Access)</option>
            <option value="staff" className="text-black">Staff (Ops Center)</option>
            <option value="volunteer" className="text-black">Volunteer (Field Ops)</option>
            <option value="medical_staff" className="text-black">Medical Staff (Triage)</option>
          </select>
        </div>
        
        {/* Password Input */}
        <div className="space-y-1 text-center relative">
          <label className="block text-xs text-gray-400 font-mono tracking-widest uppercase mb-1">Auth Key (Password)</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className="w-full glass-input rounded-full px-5 py-2.5 text-center text-white placeholder-gray-600 font-mono text-sm tracking-widest"
            />
            {/* Eye Icon Toggle */}
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-4 flex items-center justify-center text-cyan-400/50 hover:text-cyan-400 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-400 hover:bg-cyan-300 text-obsidian-900 font-bold py-3 px-6 rounded-full transition-all duration-300 shadow-cyan-glow hover:shadow-cyan-glow-strong mt-6 font-mono tracking-widest uppercase text-sm disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {loading ? (
            <><span className="material-symbols-outlined text-[18px] animate-spin">refresh</span> Processing...</>
          ) : (
            "Request Authorization"
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-xs text-gray-500 font-mono tracking-widest uppercase">
        Have clearance?{" "}
        <Link href="/admin/login" className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold">
          Authenticate
        </Link>
      </div>
    </TacticalAuthLayout>
  );
}
