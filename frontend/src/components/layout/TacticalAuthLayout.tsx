"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface TacticalAuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  backHref: string;
  illustrationType: "internal" | "victim" | "public";
}

export default function TacticalAuthLayout({
  children,
  title,
  subtitle,
  backHref,
  illustrationType,
}: TacticalAuthLayoutProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const isInternal = illustrationType === "internal";
  
  // Theme Variables for CSS Custom Properties
  const themeStyle = {
    "--theme-color-main": isInternal ? "#00f0ff" : "#10B981",
    "--theme-color-glow": isInternal ? "rgba(0, 240, 255, 0.4)" : "rgba(16, 185, 129, 0.4)",
    "--theme-color-border": isInternal ? "rgba(0, 240, 255, 0.2)" : "rgba(16, 185, 129, 0.2)",
    "--theme-color-bg": isInternal ? "rgba(0, 240, 255, 0.05)" : "rgba(16, 185, 129, 0.05)",
  } as React.CSSProperties;

  const textColorClass = isInternal ? "text-cyan-400" : "text-emerald-400";
  const shadowClass = isInternal ? "shadow-cyan-glow" : "shadow-emerald-glow";
  const shadowStrongClass = isInternal ? "shadow-cyan-glow-strong" : "shadow-emerald-glow-strong";
  const borderTopClass = isInternal ? "border-t-cyan-400" : "border-t-emerald-400";

  if (!mounted) return <div className="min-h-screen bg-[#06090e]" />;

  return (
    <div 
      className="flex h-screen w-full antialiased font-sans text-slate-200 overflow-hidden relative" 
      style={{ backgroundColor: "#06090e", ...themeStyle }}
    >
      {/* Background Texture & Grid */}
      <div 
        className="absolute inset-0 pointer-events-none z-0" 
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          backgroundPosition: "center center"
        }} 
      />
      <div 
        className="absolute inset-0 pointer-events-none z-0" 
        style={{ background: `radial-gradient(circle at center, var(--theme-color-bg) 0%, transparent 70%)` }} 
      />

      <main className="flex w-full h-full relative z-10 items-center justify-center">
        
        {/* Background Radar */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vmax] h-[150vmax] sm:w-[120vmax] sm:h-[120vmax] rounded-full border border-white/5 z-0 pointer-events-none" style={{boxShadow: 'inset 0 0 80px var(--theme-color-bg)'}}>
          <div className="radar-ticks" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-white/5 rounded-full w-[80%] h-[80%]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-white/5 rounded-full w-[60%] h-[60%]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-white/5 rounded-full w-[40%] h-[40%]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-white/5 rounded-full w-[20%] h-[20%]" />
          
          <div className="absolute top-0 left-1/2 bottom-0 w-[1px] -translate-x-1/2" style={{ background: 'var(--theme-color-border)' }} />
          <div className="absolute top-1/2 left-0 right-0 h-[1px] -translate-y-1/2" style={{ background: 'var(--theme-color-border)' }} />
          
          <div className="absolute top-0 left-0 w-full h-full rounded-full radar-beam animate-sweep" />
          
          <div className="absolute w-1.5 h-1.5 rounded-full animate-pulse-blip" style={{ top: '25%', left: '65%', backgroundColor: 'var(--theme-color-main)' }} />
          <div className="absolute w-1.5 h-1.5 rounded-full animate-pulse-blip" style={{ top: '75%', left: '80%', backgroundColor: 'var(--theme-color-main)' }} />
          <div className="absolute w-1.5 h-1.5 rounded-full animate-pulse-blip" style={{ top: '80%', left: '35%', backgroundColor: 'var(--theme-color-main)' }} />
          <div className="absolute w-1.5 h-1.5 rounded-full animate-pulse-blip" style={{ top: '30%', left: '30%', backgroundColor: 'var(--theme-color-main)' }} />
        </div>

        {/* Orbiting Nodes */}
        <div className="absolute top-1/2 left-1/2 animate-orbit1 z-[5]">
          <div className={`glass-panel p-4 rounded-lg ${shadowClass} transform -translate-x-1/2 -translate-y-1/2 min-w-[200px]`}>
            <div className={`border-b ${isInternal ? 'border-cyan-400/50' : 'border-emerald-400/50'} pb-1 mb-2 px-2 flex items-center gap-2`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isInternal ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
              <span className={`${textColorClass} font-mono text-xs tracking-widest uppercase`}>Uplink Status</span>
            </div>
            <div className={`font-mono text-[9px] ${textColorClass} opacity-80 space-y-1 pl-2`}>
              <p>CONNECTION ESTABLISHED</p>
              <p>ENCRYPTION: AES-256-GCM</p>
              <p>AWAITING CREDENTIALS...</p>
            </div>
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2 animate-orbit2 z-[5]">
          <div className={`glass-panel p-4 rounded-lg ${shadowClass} transform -translate-x-1/2 -translate-y-1/2 min-w-[180px]`}>
            <div className={`border-b ${isInternal ? 'border-cyan-400/50' : 'border-emerald-400/50'} pb-1 mb-2 px-2`}>
              <span className={`${textColorClass} font-mono text-xs tracking-wider uppercase`}>Node Overview</span>
            </div>
            <div className={`font-mono text-[9px] ${textColorClass} opacity-80 space-y-1 pl-2`}>
              <p>NODE ALPHA: <span className={textColorClass}>ACTIVE</span></p>
              <p>NODE BETA: DEPLOYED</p>
              <p>NODE GAMMA: STANDBY</p>
            </div>
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2 animate-orbit3 z-[5]">
          <div className={`glass-panel p-4 rounded-lg ${shadowClass} transform -translate-x-1/2 -translate-y-1/2 min-w-[160px]`}>
            <div className={`border-b ${isInternal ? 'border-cyan-400/50' : 'border-emerald-400/50'} pb-1 mb-2 px-2`}>
              <span className={`${textColorClass} font-mono text-xs tracking-wider uppercase`}>Telemetry</span>
            </div>
            <div className={`font-mono text-[9px] ${textColorClass} opacity-80 space-y-1 pl-2`}>
              <p>SECURE CHANNEL: 0x8F9A</p>
              <p>LAT: 23.8103° N</p>
              <p>LNG: 90.4125° E</p>
            </div>
          </div>
        </div>
        
        <div className="absolute top-1/2 left-1/2 animate-orbit4 z-[5]">
          <div className={`glass-panel p-4 rounded-lg ${shadowClass} transform -translate-x-1/2 -translate-y-1/2 min-w-[160px]`}>
            <div className={`border-b ${isInternal ? 'border-cyan-400/50' : 'border-emerald-400/50'} pb-1 mb-2 px-2`}>
              <span className={`${textColorClass} font-mono text-xs tracking-wider uppercase`}>Access Level</span>
            </div>
            <div className={`font-mono text-[9px] ${textColorClass} opacity-80 space-y-1 pl-2`}>
              <p>AUTHORIZATION REQUIRED</p>
              <p>ROLE: {isInternal ? "INTERNAL SYS" : "CITIZEN"}</p>
              <p className="animate-pulse">VERIFYING IDENTITY...</p>
            </div>
          </div>
        </div>

        {/* Central Login Interface */}
        <section className="relative z-20 flex items-center justify-center">
          
          {/* Back Button Floating Outside Circle */}
          <Link href={backHref} className={`fixed top-8 left-8 flex items-center gap-2 ${textColorClass} hover:opacity-80 transition-opacity font-mono text-sm tracking-widest group z-50`}>
            <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
            ABORT
          </Link>

          <div className={`w-[95vw] max-w-[750px] aspect-square bg-[#0a111a]/60 backdrop-blur-xl rounded-full border border-white/10 border-t-2 ${borderTopClass} ${shadowStrongClass} relative overflow-hidden flex flex-col items-center justify-center transition-all duration-300`}>
            
            <div className="p-6 sm:p-10 md:p-12 w-full flex flex-col items-center justify-center text-center mt-4">
              
              <div className="text-center mb-4 sm:mb-6">
                <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-white tracking-widest font-light mb-1">{title}</h1>
                <p className="text-gray-400 text-[10px] sm:text-xs font-light uppercase tracking-widest max-w-[350px] mx-auto leading-relaxed">{subtitle}</p>
              </div>
              
              {children}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
