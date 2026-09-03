"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TacticalAuthLayout from "@/components/layout/TacticalAuthLayout";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function VictimRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", nid: "", dob: "",
    presentAddress: "", gender: "", password: "", confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/auth/victim/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, full_name: form.name, nid_number: form.nid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      
      localStorage.setItem("temp_victim_reg_email", form.email);
      router.push("/victim/verify"); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TacticalAuthLayout
      title="Victim Registration"
      subtitle="Register to request emergency shelter and relief"
      backHref="/"
      illustrationType="victim"
    >
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 text-xs mb-4 flex items-center justify-center gap-2 max-w-[400px] w-full">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-[400px]">
        {/* We use a grid for the registration form so it fits nicely inside the circle */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="space-y-1 text-center">
            <label className="block text-xs text-gray-400 font-mono tracking-widest uppercase mb-0.5">Full Name</label>
            <input
              type="text"
              required
              placeholder="YOUR NAME"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full glass-input rounded-full px-4 py-2 text-center text-white placeholder-gray-600 font-mono text-xs"
            />
          </div>
          
          <div className="space-y-1 text-center">
            <label className="block text-xs text-gray-400 font-mono tracking-widest uppercase mb-0.5">Email</label>
            <input
              type="email"
              required
              placeholder="email@example.com"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full glass-input rounded-full px-4 py-2 text-center text-white placeholder-gray-600 font-mono text-xs"
            />
          </div>

          <div className="space-y-1 text-center">
            <label className="block text-xs text-gray-400 font-mono tracking-widest uppercase mb-0.5">Phone</label>
            <input
              type="text"
              required
              placeholder="017XXXXXXXX"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className="w-full glass-input rounded-full px-4 py-2 text-center text-white placeholder-gray-600 font-mono text-xs"
            />
          </div>

          <div className="space-y-1 text-center">
            <label className="block text-xs text-gray-400 font-mono tracking-widest uppercase mb-0.5">NID</label>
            <input
              type="text"
              required
              placeholder="NATIONAL ID"
              value={form.nid}
              onChange={(e) => setForm((p) => ({ ...p, nid: e.target.value }))}
              className="w-full glass-input rounded-full px-4 py-2 text-center text-white placeholder-gray-600 font-mono text-xs"
            />
          </div>

          <div className="space-y-1 text-center">
            <label className="block text-xs text-gray-400 font-mono tracking-widest uppercase mb-0.5">Date of Birth</label>
            <input
              type="date"
              required
              value={form.dob}
              onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))}
              className="w-full glass-input rounded-full px-4 py-2 text-center text-white placeholder-gray-600 font-mono text-xs"
            />
          </div>

          <div className="space-y-1 text-center">
            <label className="block text-xs text-gray-400 font-mono tracking-widest uppercase mb-0.5">Gender</label>
            <select
              required
              value={form.gender}
              onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
              className="w-full glass-input rounded-full px-4 py-2 text-center text-gray-300 font-mono text-xs appearance-none"
            >
              <option value="">SELECT</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div className="space-y-1 text-center mb-3">
          <label className="block text-xs text-gray-400 font-mono tracking-widest uppercase mb-0.5">Present Address</label>
          <input
            type="text"
            required
            placeholder="FULL ADDRESS"
            value={form.presentAddress}
            onChange={(e) => setForm((p) => ({ ...p, presentAddress: e.target.value }))}
            className="w-full glass-input rounded-full px-4 py-2 text-center text-white placeholder-gray-600 font-mono text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="space-y-1 text-center relative">
            <label className="block text-xs text-gray-400 font-mono tracking-widest uppercase mb-0.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full glass-input rounded-full px-4 py-2 text-center text-white placeholder-gray-600 font-mono text-xs tracking-widest"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center justify-center text-emerald-400/50 hover:text-emerald-400 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">{showPassword ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
          </div>
          
          <div className="space-y-1 text-center relative">
            <label className="block text-xs text-gray-400 font-mono tracking-widest uppercase mb-0.5">Confirm Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                className="w-full glass-input rounded-full px-4 py-2 text-center text-white placeholder-gray-600 font-mono text-xs tracking-widest"
              />
            </div>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-400 hover:bg-emerald-300 text-obsidian-900 font-bold py-2.5 px-6 rounded-full transition-all duration-300 shadow-emerald-glow hover:shadow-emerald-glow-strong font-mono tracking-widest uppercase text-sm disabled:opacity-50 flex justify-center items-center gap-2 mx-auto max-w-[200px]"
        >
          {loading ? (
            <><span className="material-symbols-outlined text-[18px] animate-spin">refresh</span> Processing...</>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <div className="mt-4 text-center text-[10px] text-gray-500 font-mono tracking-widest uppercase">
        Already registered?{" "}
        <Link href="/victim/login" className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold">
          Secure Login
        </Link>
      </div>
    </TacticalAuthLayout>
  );
}
