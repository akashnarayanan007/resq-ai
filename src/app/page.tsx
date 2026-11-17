'use client';

import React from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { CHENNAI_EMERGENCY_CONTACTS } from '@/data/simulatedData';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070C18] text-slate-100 flex flex-col justify-between">
      {/* Top Header / Nav */}
      <header className="border-b border-slate-800/80 bg-[#0B1120]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-red-950/60">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                RESQ<span className="text-red-500">.AI</span>
              </span>
              <span className="text-[10px] font-mono ml-2 px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                PROTOTYPE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sos"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 transition"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-red-400" />
              Citizen SOS
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/50 transition"
            >
              <span>Command Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Simulated Scenario: Cyclone Michaung Chennai Surge</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
              AI-Powered Emergency Coordination for{' '}
              <span className="bg-gradient-to-r from-red-400 via-rose-300 to-amber-300 bg-clip-text text-transparent">
                Mass Disasters
              </span>
            </h1>

            <p className="text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto font-light">
              Autonomous AI triage, tactical GIS mapping, and real-time multi-agency responder dispatch.
              Engineered to save lives when seconds count.
            </p>

            {/* Quick Action CTA Cards */}
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
              <Link
                href="/dashboard"
                className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-[#0F172A] border border-blue-500/40 hover:border-blue-400 text-left transition group shadow-xl shadow-blue-950/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400">
                    <Shield className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition" />
                </div>
                <div className="text-base font-bold text-white">Rescue Coordination</div>
                <div className="text-xs text-slate-400 mt-1">
                  Access live tactical map, dispatch NDRF/SDRF teams, monitor hospital & flood telemetry.
                </div>
              </Link>

              <Link
                href="/sos"
                className="p-5 rounded-2xl bg-gradient-to-b from-red-950/40 to-[#0F172A] border border-red-500/40 hover:border-red-400 text-left transition group shadow-xl shadow-red-950/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400">
                    <LifeBuoy className="w-6 h-6" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-red-400 group-hover:translate-x-1 transition" />
                </div>
                <div className="text-base font-bold text-white">Citizen SOS Portal</div>
                <div className="text-xs text-slate-400 mt-1">
                  Mobile-first one-tap reporting with geolocation, water level estimate & medical flags.
                </div>
              </Link>
            </div>
          </div>

          {/* Live Incident Matrix / Ticker */}
          <div className="mt-16 p-6 rounded-2xl bg-[#0B1120] border border-slate-800 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Simulated Real-Time Hotspot Feed
                </span>
                <h3 className="text-sm font-bold text-white">Greater Chennai Emergency Sectors</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  8 Units Active
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                  10 Hotspots Tracked
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-red-400 font-bold">VELACHERY (SOUTH CHENNAI)</span>
                  <span className="text-red-300 bg-red-950 px-1.5 py-0.2 rounded">CRITICAL</span>
                </div>
                <p className="text-xs text-slate-300">
                  Ground floor inundation 5.5ft. 12 civilians stranded with infants. NDRF Zodiac Unit 04 staged on bypass.
                </p>
                <div className="text-[11px] text-slate-500 font-mono">AI Priority: 96/100</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-red-400 font-bold">MADIPAKKAM LAKE BUND</span>
                  <span className="text-red-300 bg-red-950 px-1.5 py-0.2 rounded">CRITICAL</span>
                </div>
                <p className="text-xs text-slate-300">
                  Full term pregnancy labor with 4.2ft water surge. 108 Amphibious Medical Unit 07 en route.
                </p>
                <div className="text-[11px] text-slate-500 font-mono">AI Priority: 98/100</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-amber-400 font-bold">TAMBARAM WEST</span>
                  <span className="text-amber-300 bg-amber-950 px-1.5 py-0.2 rounded">HIGH</span>
                </div>
                <p className="text-xs text-slate-300">
                  Mudichur canal overflow (5.8ft). Senior cardiac patient oxygen depletion. TNFRS tender mobilizing.
                </p>
                <div className="text-[11px] text-slate-500 font-mono">AI Priority: 88/100</div>
              </div>
            </div>
          </div>

          {/* Features Highlights */}
          <div className="mt-20">
            <div className="text-center max-w-xl mx-auto mb-12">
              <h2 className="text-2xl font-bold text-white">Engineered for Rapid Multi-Agency Response</h2>
              <p className="text-xs text-slate-400 mt-2">
                Designed to bridge citizen distress signals directly to command dispatchers with zero friction.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-5 rounded-2xl bg-[#0B1120] border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">Gemini AI Triage Engine</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Synthesizes flood depth, vulnerable populations, and audio distress cues to compute deterministic urgency scores (0-100).
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0B1120] border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">Leaflet Tactical GIS</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  High-contrast operations map displaying live boat units, ambulances, waterlogged hotspots, and real-time status pulses.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0B1120] border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                  <Users2 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">Simulated Units Roster</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Assign NDRF Zodiac teams, SDRF amphibious craft, and GCC dewatering heavy pumps with telemetry logs and VHF radio channels.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0B1120] border border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white">Response Analytics</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Interactive Recharts graphs tracking incident timeline spikes, category distributions, team load factors, and resolution times.
                </p>
              </div>
            </div>
          </div>

          {/* Official Helplines Guidance Card */}
          <div className="mt-20 p-8 rounded-2xl bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/40 border border-red-900/60 text-slate-200">
            <div className="max-w-2xl mx-auto text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
                <PhoneCall className="w-3.5 h-3.5" />
                EMERGENCY PUBLIC NOTICE
              </div>
              <h3 className="text-xl font-bold text-white">Facing an Active Life Emergency in Tamil Nadu?</h3>
              <p className="text-xs text-slate-400">
                RESQ.AI is a hackathon simulation. For real emergencies, dial official helpline services immediately:
              </p>

              <div className="flex flex-wrap justify-center gap-3 pt-4">
                <a
                  href="tel:112"
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-sm shadow-lg shadow-red-950/50"
                >
                  Dial 112 (National Emergency)
                </a>
                <a
                  href="tel:1913"
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-sm border border-slate-700"
                >
                  Dial 1913 (Greater Chennai Corp)
                </a>
                <a
                  href="tel:108"
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-sm border border-slate-700"
                >
                  Dial 108 (Ambulance Service)
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#080E1C] py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">RESQ.AI</span>
            <span>— AI-Assisted Disaster Incident Coordination System</span>
          </div>
          <div className="font-mono text-slate-500 text-[11px]">
            DEMO MODE • LocalStorage Repository • Simulated Chennai Coordinates
          </div>
        </div>
      </footer>
    </div>
  );
}
