"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image"; // For optimized background if needed, but CSS is fine too.

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#061014] text-slate-200 flex flex-col relative overflow-hidden font-sans selection:bg-[#2DB47E]/30">
      
      {/* Background Map Image exactly like screen.png */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-80"
        style={{ backgroundImage: 'url("/map-bg.jpg")' }}
      />
      {/* Dark overlay to make text readable and blend edges */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#061014]/60 via-[#061014]/40 to-[#061014]/90" />

      {/* Top Header - Glassmorphic Pill */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute top-6 left-6 right-6 z-50 flex items-center justify-between bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(239,68,68,0.5)]">
            <span className="material-symbols-outlined text-white text-[18px]">stars</span>
          </div>
          <span className="text-white font-medium tracking-wide text-sm md:text-base drop-shadow-md">
            Bangladesh Relief & Coordination Platform
          </span>
        </div>
        <Link 
          href="/view/dashboard" 
          className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-colors shadow-sm"
        >
          Public Dashboard
        </Link>
      </motion.div>

      {/* Main Hero Content */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-1 w-full mt-28 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-center mb-16"
        >
          <h1 
            className="font-bold text-5xl md:text-6xl lg:text-[76px] text-center text-white drop-shadow-[0_4px_24px_rgba(255,255,255,0.4)] mb-8 leading-[1.15]"
            style={{ fontFamily: "var(--font-syncopate)" }}
          >
            Coordinating Relief,<br />Saving Lives
          </h1>
          <p className="text-slate-300 text-lg md:text-xl text-center max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md">
            A real-time disaster management platform connecting victims, administrators, and relief operations across Bangladesh.
          </p>
        </motion.div>

        {/* The 3 Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl px-2">
          
          {/* Admin Card */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
            <Link href="/admin/login" className="group flex flex-col items-start p-8 rounded-3xl bg-[#091522]/70 backdrop-blur-xl border border-[#2D73B4]/60 shadow-[0_0_30px_rgba(45,115,180,0.2)] transition-all duration-300 hover:shadow-[0_0_50px_rgba(45,115,180,0.5)] hover:-translate-y-2 h-full">
              <div className="w-14 h-14 rounded-2xl bg-[#11243A] border border-[#2D73B4] flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(45,115,180,0.4)] group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-[#5EB1FF] text-[32px]">security</span>
              </div>
              <h2 className="text-2xl font-semibold text-white mb-3">Admin Portal</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-1">
                Secure portal for authorized relief coordinators and system administrators. Requires authentication.
              </p>
              <div className="flex items-center text-[#5EB1FF] font-medium text-sm group-hover:underline">
                Learn More <span className="material-symbols-outlined text-[18px] ml-1 transition-transform group-hover:translate-x-1">arrow_forward</span>
              </div>
            </Link>
          </motion.div>

          {/* Victim Card */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}>
            <Link href="/victim/login" className="group flex flex-col items-start p-8 rounded-3xl bg-[#17110C]/70 backdrop-blur-xl border border-[#B4742D]/60 shadow-[0_0_30px_rgba(180,116,45,0.2)] transition-all duration-300 hover:shadow-[0_0_50px_rgba(180,116,45,0.5)] hover:-translate-y-2 h-full">
              <div className="w-14 h-14 rounded-2xl bg-[#2D1B11] border border-[#B4742D] flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(180,116,45,0.4)] group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-[#FFAD5E] text-[32px]">person</span>
              </div>
              <h2 className="text-2xl font-semibold text-white mb-3">Victim Portal</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-1">
                Direct channel for affected individuals to request assistance. Email verification required.
              </p>
              <div className="flex items-center text-[#FFAD5E] font-medium text-sm group-hover:underline">
                Learn More <span className="material-symbols-outlined text-[18px] ml-1 transition-transform group-hover:translate-x-1">arrow_forward</span>
              </div>
            </Link>
          </motion.div>

          {/* Public View Card */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}>
            <Link href="/view/dashboard" className="group flex flex-col items-start p-8 rounded-3xl bg-[#091D17]/70 backdrop-blur-xl border border-[#2DB47E]/60 shadow-[0_0_30px_rgba(45,180,126,0.2)] transition-all duration-300 hover:shadow-[0_0_50px_rgba(45,180,126,0.5)] hover:-translate-y-2 h-full">
              <div className="w-14 h-14 rounded-2xl bg-[#0E2D22] border border-[#2DB47E] flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(45,180,126,0.4)] group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-[#5EFFA7] text-[32px]">language</span>
              </div>
              <h2 className="text-2xl font-semibold text-white mb-3">Public View</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 flex-1">
                Real-time information and updates for the general public. No login required.
              </p>
              <div className="flex items-center text-[#5EFFA7] font-medium text-sm group-hover:underline">
                Learn More <span className="material-symbols-outlined text-[18px] ml-1 transition-transform group-hover:translate-x-1">arrow_forward</span>
              </div>
            </Link>
          </motion.div>

        </div>
      </main>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 1, delay: 0.8 }}
        className="relative z-50 flex flex-col md:flex-row items-center justify-between w-full px-8 py-6 mt-auto"
      >
        <div className="px-4 py-2 mb-4 md:mb-0 rounded-lg bg-[#0F2A1E]/80 backdrop-blur-md border border-[#2DB47E]/50 text-[#5EFFA7] text-sm font-medium shadow-[0_0_15px_rgba(45,180,126,0.2)]">
          Operational System Active
        </div>
        <div className="text-slate-500 text-xs md:text-sm tracking-wider font-medium">
          Powered by Oracle Database XE 21c • Next.js • Express.js
        </div>
      </motion.div>
    </div>
  );
}
