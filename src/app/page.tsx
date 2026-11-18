'use client';

import React from 'react';
import Link from 'next/link';
import DemoDisclaimerBanner from '@/components/common/DemoDisclaimerBanner';
import {
  Shield,
  LifeBuoy,
  AlertOctagon,
  Users2,
  BarChart3,
  Sparkles,
  ChevronRight,
  MapPin,
  Radio,
  ArrowRight,
  PhoneCall,
  CheckCircle,
  Clock,
  Layers,
  Cpu,
  Lock,
  Compass,
  Ship,
  Eye,
  Activity,
  Droplets,
  Languages,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080F23] text-[#F8FAFF] flex flex-col justify-between tactical-grid selection:bg-cyan-500/30">
      {/* Top Simulation Banner */}
      <DemoDisclaimerBanner />

      {/* Primary Sticky Command Navigation */}
      <header className="border-b border-[#1E2E4E] bg-[#080F23]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#246BFD] via-[#00D9FF] to-[#246BFD] p-[1px] shadow-lg shadow-cyan-950/40">
              <div className="w-full h-full bg-[#080F23] rounded-[11px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#00D9FF]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-white font-mono">
                  RESQ<span className="text-[#00D9FF]">.AI</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-cyan-300 border border-cyan-500/30">
                  NEON COMMAND
                </span>
              </div>
              <p className="text-[10px] text-[#A5B4D0] font-mono tracking-tight uppercase hidden sm:block">
                Multilingual Disaster Coordination Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <Link
              href="/sos"
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold bg-[#FF4D67]/15 hover:bg-[#FF4D67]/25 text-[#FF4D67] border border-[#FF4D67]/40 shadow-sm transition active:scale-95"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF4D67] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF4D67]"></span>
              </span>
              <span>Citizen SOS</span>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#246BFD] hover:bg-blue-600 text-white shadow-lg shadow-blue-950/60 transition active:scale-95"
            >
              <span>Command Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-16 md:py-20">
          {/* Hero Header */}
          <div className="text-center max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#101C35] border border-[#1E2E4E] text-xs font-mono text-cyan-300 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-[#19E6A0] animate-pulse" />
              <span>Simulated Scenario: Cyclone Michaung • Chennai Emergency Grid</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.15]">
              Every SOS deserves to be{' '}
              <span className="bg-gradient-to-r from-[#00D9FF] via-[#246BFD] to-[#FF4D67] bg-clip-text text-transparent">
                understood.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#A5B4D0] leading-relaxed max-w-2xl mx-auto font-light">
              AI-assisted multilingual emergency triage and simulated rescue coordination.
              Engineered to convert high-stress vernacular distress voice and photo calls into structured, prioritized operational response.
            </p>

            {/* Quick Action Primary Dual Cards */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left">
              {/* Citizen SOS Intake Card */}
              <Link
                href="/sos"
                className="p-5 rounded-2xl bg-gradient-to-b from-[#101C35] to-[#172541] border border-[#FF4D67]/40 hover:border-[#FF4D67] transition group shadow-xl hover:shadow-2xl hover:shadow-[#FF4D67]/20 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF4D67]/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-[#FF4D67]/15 border border-[#FF4D67]/40 flex items-center justify-center text-[#FF4D67]">
                    <LifeBuoy className="w-6 h-6 animate-pulse" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-[#FF4D67] group-hover:translate-x-1 transition" />
                </div>
                <div className="text-base font-bold text-white flex items-center gap-2">
                  <span>Report Distress SOS</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FF4D67]/20 text-[#FF4D67] border border-[#FF4D67]/40">
                    PUBLIC
                  </span>
                </div>
                <div className="text-xs text-[#A5B4D0] mt-1.5 leading-relaxed">
                  Mobile-first intake with Tamil & Hindi voice recognition, photo upload, and instant cryptographic tracking reference.
                </div>
              </Link>

              {/* Command Center Card */}
              <Link
                href="/dashboard"
                className="p-5 rounded-2xl bg-gradient-to-b from-[#101C35] to-[#172541] border border-[#246BFD]/40 hover:border-[#00D9FF] transition group shadow-xl hover:shadow-2xl hover:shadow-cyan-950/40 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#00D9FF]/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-[#246BFD]/15 border border-[#246BFD]/40 flex items-center justify-center text-[#00D9FF]">
                    <Shield className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-[#00D9FF] group-hover:translate-x-1 transition" />
                </div>
                <div className="text-base font-bold text-white flex items-center gap-2">
                  <span>Tactical Command Center</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-cyan-500/40">
                    OPERATOR
                  </span>
                </div>
                <div className="text-xs text-[#A5B4D0] mt-1.5 leading-relaxed">
                  Full GIS tactical map, live severity hot-spots, simulated responder fleet dispatch, and audit logging.
                </div>
              </Link>
            </div>
          </div>

          {/* Tactical Intelligence Corridor Display */}
          <div className="mt-12 p-5 sm:p-6 rounded-2xl bg-[#101C35] border border-[#1E2E4E] shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1E2E4E] gap-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#00D9FF] animate-ping" />
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
                    Tactical Operations Corridor
                  </span>
                  <h3 className="text-base font-bold text-white">Greater Chennai Simulated Emergency Grid</h3>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-[#19E6A0]/10 text-[#19E6A0] border border-[#19E6A0]/30">
                  8 Teams Staged
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-[#FF4D67]/10 text-[#FF4D67] border border-[#FF4D67]/30">
                  10 Active Hotspots
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/30">
                  Gemini Triage Active
                </span>
              </div>
            </div>

            {/* Hotspot Sector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-[#080F23] border border-[#1E2E4E] hover:border-[#FF4D67]/50 transition space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#FF4D67] font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#FF4D67]" />
                    VELACHERY (SOUTH)
                  </span>
                  <span className="text-[10px] font-bold bg-[#FF4D67]/20 text-[#FF4D67] px-2 py-0.5 rounded-full border border-[#FF4D67]/40">
                    CRITICAL
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ground floor inundation 5.5ft. 12 civilians stranded with infants. NDRF Zodiac Unit 04 staged on bypass.
                </p>
                <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-[#A5B4D0]">
                  <span>AI Score: 96/100</span>
                  <span className="text-cyan-400">Needs Boat Unit</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#080F23] border border-[#1E2E4E] hover:border-[#FF4D67]/50 transition space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#FF4D67] font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#FF4D67]" />
                    MADIPAKKAM LAKE BUND
                  </span>
                  <span className="text-[10px] font-bold bg-[#FF4D67]/20 text-[#FF4D67] px-2 py-0.5 rounded-full border border-[#FF4D67]/40">
                    CRITICAL
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Active pregnancy labor in 4.2ft water surge. 108 Amphibious Medical Unit 07 deployed to sector.
                </p>
                <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-[#A5B4D0]">
                  <span>AI Score: 98/100</span>
                  <span className="text-rose-400">Immediate Medical</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#080F23] border border-[#1E2E4E] hover:border-[#FFB547]/50 transition space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#FFB547] font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#FFB547]" />
                    TAMBARAM WEST
                  </span>
                  <span className="text-[10px] font-bold bg-[#FFB547]/20 text-[#FFB547] px-2 py-0.5 rounded-full border border-[#FFB547]/40">
                    HIGH
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Mudichur canal breach with 5.8ft water. Senior cardiac patient requiring oxygen cylinder resupply.
                </p>
                <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-[#A5B4D0]">
                  <span>AI Score: 88/100</span>
                  <span className="text-[#FFB547]">TNFRS Staged</span>
                </div>
              </div>
            </div>
          </div>

          {/* Architectural Capabilities Grid */}
          <div className="mt-16 sm:mt-20">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
                Core Architectural Pillars
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Engineered for Disaster High-Load Resilience
              </h2>
              <p className="text-xs sm:text-sm text-[#A5B4D0] mt-2">
                Designed to bridge chaotic field signals into actionable coordinator workflows with zero latency.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Feature 1 */}
              <div className="p-5 rounded-2xl bg-[#101C35] border border-[#1E2E4E] hover:border-cyan-500/50 transition space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-[#00D9FF] flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Gemini Multilingual AI</span>
                </h4>
                <p className="text-xs text-[#A5B4D0] leading-relaxed">
                  Processes raw Tamil (தமிழ்), Hindi (हिन्दी), and English audio & text distress reports with deterministic instant offline fallback.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-5 rounded-2xl bg-[#101C35] border border-[#1E2E4E] hover:border-blue-500/50 transition space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-[#246BFD] flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">Leaflet Tactical GIS</h4>
                <p className="text-xs text-[#A5B4D0] leading-relaxed">
                  High-contrast operations map showing live boat positions, flood depths, coordinate geocoding, and interactive pin placement.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-5 rounded-2xl bg-[#101C35] border border-[#1E2E4E] hover:border-emerald-500/50 transition space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[#19E6A0] flex items-center justify-center">
                  <Ship className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">Simulated Fleet Dispatch</h4>
                <p className="text-xs text-[#A5B4D0] leading-relaxed">
                  Manages simulated NDRF Zodiacs, SDRF paramedics, and dewatering pumps with strict double-dispatch locks and telemetry logs.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-5 rounded-2xl bg-[#101C35] border border-[#1E2E4E] hover:border-pink-500/50 transition space-y-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 text-[#FF4D67] flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">Private Citizen Tracking</h4>
                <p className="text-xs text-[#A5B4D0] leading-relaxed">
                  Citizens receive unguessable cryptographic tracking tokens (`trk_...`) with full personal phone number redaction for family tracking.
                </p>
              </div>
            </div>
          </div>

          {/* Official Helplines Guidance Card */}
          <div className="mt-16 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-red-950/40 via-[#101C35] to-amber-950/40 border border-red-500/30 text-slate-200 shadow-2xl">
            <div className="max-w-2xl mx-auto text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-[#FF4D67] text-xs font-bold font-mono">
                <PhoneCall className="w-3.5 h-3.5" />
                EMERGENCY PUBLIC ADVISORY
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Facing a Real Life-Threatening Emergency in Tamil Nadu?</h3>
              <p className="text-xs sm:text-sm text-[#A5B4D0]">
                RESQ.AI is a hackathon simulation. For real emergencies, contact official government emergency numbers immediately:
              </p>

              <div className="flex flex-wrap justify-center gap-3 pt-4">
                <a
                  href="tel:112"
                  className="px-4 py-2.5 rounded-xl bg-[#FF4D67] hover:bg-rose-600 text-white font-mono font-bold text-xs sm:text-sm shadow-lg shadow-red-950/60 transition active:scale-95"
                >
                  Dial 112 (National Emergency)
                </a>
                <a
                  href="tel:1913"
                  className="px-4 py-2.5 rounded-xl bg-[#172541] hover:bg-[#1E3156] text-white font-mono font-bold text-xs sm:text-sm border border-[#1E2E4E] transition active:scale-95"
                >
                  Dial 1913 (Chennai Corp)
                </a>
                <a
                  href="tel:108"
                  className="px-4 py-2.5 rounded-xl bg-[#172541] hover:bg-[#1E3156] text-white font-mono font-bold text-xs sm:text-sm border border-[#1E2E4E] transition active:scale-95"
                >
                  Dial 108 (Ambulance)
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1E2E4E] bg-[#050B1A] py-8 text-xs text-[#A5B4D0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-mono">RESQ.AI</span>
            <span>— AI-Assisted Multilingual Disaster Coordination System</span>
          </div>
          <div className="font-mono text-slate-400 text-[11px] text-center sm:text-right">
            Google DeepMind Hackathon • Cloud Firestore • Gemini AI Models • Chennai Scenario
          </div>
        </div>
      </footer>
    </div>
  );
}
