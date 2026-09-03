"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TacticalAuthLayout from "@/components/layout/TacticalAuthLayout";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function AdminVerifyPage() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem("temp_admin_reg_email");
    if (!savedEmail) {
      router.push("/admin/register");
    } else {
      setEmail(savedEmail);
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!otp) {
      setError("OTP is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/auth/internal/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed.");
      
      localStorage.removeItem("temp_admin_reg_email");
      router.push("/admin/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!email) return null; // Avoid flicker

  return (
    <TacticalAuthLayout
      title="Verify Authorization"
      subtitle="Enter the OTP sent to your secure comms"
      backHref="/admin/register"
      illustrationType="internal"
    >
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 text-xs mb-4 flex items-center justify-center gap-2 max-w-[300px] w-full">
          <span className="material-symbols-outlined text-[14px]">error</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-[300px]">
        <div className="text-center mb-6">
          <p className="text-xs text-gray-400 font-mono">OTP Sent to:</p>
          <p className="text-cyan-400 font-mono font-bold">{email}</p>
        </div>

        <div className="space-y-1 text-center">
          <label className="block text-xs text-gray-400 font-mono tracking-widest uppercase mb-1">Authorization Code (OTP)</label>
          <input
            type="text"
            placeholder="XXXXXX"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full glass-input rounded-full px-5 py-2.5 text-center text-white placeholder-gray-600 font-mono text-xl tracking-[0.5em]"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !otp}
          className="w-full bg-cyan-400 hover:bg-cyan-300 text-obsidian-900 font-bold py-3 px-6 rounded-full transition-all duration-300 shadow-cyan-glow hover:shadow-cyan-glow-strong mt-6 font-mono tracking-widest uppercase text-sm disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {loading ? (
            <><span className="material-symbols-outlined text-[18px] animate-spin">refresh</span> Verifying...</>
          ) : (
            "Verify & Proceed"
          )}
        </button>
      </form>
    </TacticalAuthLayout>
  );
}
