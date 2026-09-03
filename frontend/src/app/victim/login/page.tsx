"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TacticalAuthLayout from "@/components/layout/TacticalAuthLayout";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function VictimLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password) { setError("Credentials required."); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/auth/victim/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");
      if (data.data?.token) {
        localStorage.setItem("dms_token", data.data.token);
        localStorage.setItem("dms_user", JSON.stringify(data.data));
      }
      router.push("/victim/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TacticalAuthLayout
      title="Victim Portal"
      subtitle="Sign in to view your shelter assignment and relief status"
      backHref="/"
      illustrationType="victim"
    >
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 text-xs mb-4 flex items-center justify-center gap-2 max-w-[300px] w-full">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-[300px]">
        {/* Email Input */}
        <div className="space-y-1 text-center">
          <label className="block text-xs text-gray-400 font-mono tracking-widest uppercase mb-1">Email Address</label>
          <input
            type="email"
            autoComplete="email"
            placeholder="victim@example.com"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="w-full glass-input rounded-full px-5 py-2.5 text-center text-white placeholder-gray-600 font-mono text-sm"
          />
        </div>
        
        {/* Password Input */}
        <div className="space-y-1 text-center relative">
          <label className="block text-xs text-gray-400 font-mono tracking-widest uppercase mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className="w-full glass-input rounded-full px-5 py-2.5 text-center text-white placeholder-gray-600 font-mono text-sm tracking-widest"
            />
            {/* Eye Icon Toggle */}
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-4 flex items-center justify-center text-emerald-400/50 hover:text-emerald-400 transition-colors"
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
          className="w-full bg-emerald-400 hover:bg-emerald-300 text-obsidian-900 font-bold py-3 px-6 rounded-full transition-all duration-300 shadow-emerald-glow hover:shadow-emerald-glow-strong mt-6 font-mono tracking-widest uppercase text-sm disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {loading ? (
            <><span className="material-symbols-outlined text-[18px] animate-spin">refresh</span> Accessing...</>
          ) : (
            "Secure Login"
          )}
        </button>
      </form>

      <div className="mt-8 text-center text-xs text-gray-500 font-mono tracking-widest uppercase">
        Not registered?{" "}
        <Link href="/victim/register" className="text-emerald-400 hover:text-emerald-300 transition-colors font-semibold">
          Create Account
        </Link>
      </div>
    </TacticalAuthLayout>
  );
}
