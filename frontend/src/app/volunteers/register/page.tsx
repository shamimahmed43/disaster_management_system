"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TacticalAuthLayout from "@/components/layout/TacticalAuthLayout";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function VolunteerRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/auth/internal/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Always pass role: volunteer
        body: JSON.stringify({ ...form, full_name: form.name, role: "volunteer" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      
      // Store temp data for OTP verification
      localStorage.setItem("temp_admin_reg_email", form.email);
      router.push("/admin/verify"); // Assuming OTP verification page exists and works for all internal accounts
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TacticalAuthLayout
      title="Volunteer Registration"
      subtitle="Join the task force. Help the community."
      backHref="/"
      illustrationType="public"
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
            placeholder="Your Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full glass-input rounded-full px-5 py-2.5 text-center text-white placeholder-gray-600 font-mono text-sm outline-none focus:border-cobalt"
          />
        </div>
        
        {/* Email Input */}
        <div className="space-y-1 text-center">
          <label className="block text-xs text-gray-400 font-mono tracking-widest uppercase mb-1">Email Address</label>
          <input
            type="email"
            placeholder="volunteer@example.com"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="w-full glass-input rounded-full px-5 py-2.5 text-center text-white placeholder-gray-600 font-mono text-sm outline-none focus:border-cobalt"
          />
        </div>

        {/* Phone Input */}
        <div className="space-y-1 text-center">
          <label className="block text-xs text-gray-400 font-mono tracking-widest uppercase mb-1">Phone Number</label>
          <input
            type="text"
            placeholder="017XXXXXXXX"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            className="w-full glass-input rounded-full px-5 py-2.5 text-center text-white placeholder-gray-600 font-mono text-sm outline-none focus:border-cobalt"
          />
        </div>
        
        {/* Password Input */}
        <div className="space-y-1 text-center relative">
          <label className="block text-xs text-gray-400 font-mono tracking-widest uppercase mb-1">Passkey</label>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            className="w-full glass-input rounded-full px-5 py-2.5 text-center text-white placeholder-gray-600 font-mono text-sm outline-none focus:border-cobalt"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-[26px] text-gray-500 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">{showPassword ? "visibility_off" : "visibility"}</span>
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cobalt hover:bg-cobalt-light text-white font-bold py-3 px-6 rounded-full transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] font-mono text-sm tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
        >
          {loading ? (
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">person_add</span>
          )}
          {loading ? "PROCESSING..." : "REGISTER VOLUNTEER"}
        </button>

        <div className="text-center pt-2">
          <Link href="/admin/login" className="text-xs text-gray-400 font-mono hover:text-cobalt transition-colors">
            Already registered? Login here
          </Link>
        </div>
      </form>
    </TacticalAuthLayout>
  );
}
