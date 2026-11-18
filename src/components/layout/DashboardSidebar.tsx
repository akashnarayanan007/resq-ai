'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  AlertOctagon,
  BarChart3,
  Flame,
  LayoutDashboard,
  LifeBuoy,
  Radio,
  RefreshCw,
  Shield,
  Users2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { incidentRepository } from '@/services/repository/IncidentRepository';
import { teamRepository } from '@/services/repository/TeamRepository';

interface SidebarProps {
  unreadCriticalCount?: number;
}

export default function DashboardSidebar({ unreadCriticalCount = 3 }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Command Center',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      label: 'Incident Manager',
      href: '/dashboard/incidents',
      icon: AlertOctagon,
      badge: unreadCriticalCount > 0 ? `${unreadCriticalCount} Critical` : undefined,
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    },
    {
      label: 'Responder Units',
      href: '/dashboard/teams',
      icon: Users2,
      badge: '8 Units',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    },
    {
      label: 'Analytics & Heatmap',
      href: '/dashboard/analytics',
      icon: BarChart3,
    },
  ];

  const handleResetData = async () => {
    if (confirm('Reset simulated database back to initial Chennai Flood baseline?')) {
      await incidentRepository.resetToSimulatedData();
      await teamRepository.resetToSimulatedData();
      window.location.reload();
    }
  };

  return (
    <aside className="w-64 bg-[#080F23] border-r border-[#1E2E4E] flex flex-col justify-between shrink-0 min-h-screen text-[#A5B4D0]">
      <div>
        {/* Brand header */}
        <div className="p-5 border-b border-[#1E2E4E]">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#246BFD] via-[#00D9FF] to-[#246BFD] flex items-center justify-center text-white shadow-lg shadow-cyan-950/50 group-hover:scale-105 transition">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-wider text-white font-mono">
                  RESQ<span className="text-[#00D9FF]">.AI</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/15 text-cyan-300 border border-cyan-500/30">
                  OPS
                </span>
              </div>
              <p className="text-[10px] text-[#A5B4D0] font-mono tracking-tight uppercase">
                Disaster Coordination
              </p>
            </div>
          </Link>
        </div>

        {/* Live status telemetry widget */}
        <div className="mx-3 my-4 p-3 rounded-xl bg-[#101C35] border border-[#1E2E4E] text-xs shadow-md">
          <div className="flex items-center justify-between text-[11px] mb-2 font-mono text-cyan-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#19E6A0] animate-pulse" />
              SYSTEM ACTIVE
            </span>
            <span>CHENNAI GRID</span>
          </div>
          <div className="text-[11px] text-slate-200 font-medium leading-relaxed">
            Cyclone Michaung Simulation Protocol 04
          </div>
          <div className="mt-2 pt-2 border-t border-[#1E2E4E] flex items-center justify-between text-[10px] text-[#A5B4D0] font-mono">
            <span>Sat-Link: 99.8%</span>
            <span>Freq: 156.80 MHz</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[#101C35] text-[#00D9FF] border border-cyan-500/40 shadow-inner'
                    : 'text-[#A5B4D0] hover:text-white hover:bg-[#101C35]/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#00D9FF]' : 'text-[#A5B4D0]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold ${
                      item.badgeColor || 'bg-[#172541] text-slate-300 border-[#1E2E4E]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Citizen SOS Direct Shortcut */}
        <div className="px-3 mt-6">
          <Link
            href="/sos"
            className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-red-950/60 to-[#101C35] border border-[#FF4D67]/40 text-red-200 hover:border-[#FF4D67] transition group shadow-lg shadow-rose-950/40 active:scale-95"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#FF4D67] flex items-center justify-center text-white font-black text-xs animate-pulse shadow-md shadow-rose-950/80">
                SOS
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-red-200">Citizen SOS Portal</div>
                <div className="text-[10px] text-[#A5B4D0]">Mobile-first intake</div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#FF4D67] group-hover:translate-x-0.5 transition" />
          </Link>
        </div>
      </div>

      {/* Footer controls */}
      <div className="p-4 border-t border-[#1E2E4E] space-y-2">
        <button
          onClick={handleResetData}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono rounded-xl bg-[#101C35] hover:bg-[#172541] text-[#A5B4D0] hover:text-white border border-[#1E2E4E] transition active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#00D9FF]" />
          Reset Demo Data
        </button>

        <div className="text-[10px] text-center text-slate-500 font-mono pt-1">
          RESQ.AI v1.0.0-hackathon • Chennai
        </div>
      </div>
    </aside>
  );
}
