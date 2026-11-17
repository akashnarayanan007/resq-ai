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
    <aside className="w-64 bg-[#080E1C] border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-screen text-slate-300">
      <div>
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800/80">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-red-950/50 group-hover:scale-105 transition">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-wider text-white">RESQ<span className="text-red-500">.AI</span></span>
                <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">OPS</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">Disaster Coordination</p>
            </div>
          </Link>
        </div>

        {/* Live status telemetry widget */}
        <div className="mx-3 my-4 p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-[11px] mb-2 font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM ACTIVE
            </span>
            <span>CHENNAI GRID</span>
          </div>
          <div className="text-[11px] text-slate-300 font-medium leading-relaxed">
            Cyclone Michaung Simulation Protocol 04
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
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
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-300 border border-blue-500/30 shadow-inner'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full border font-mono font-bold ${
                      item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
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
            className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-red-950/80 to-rose-950/80 border border-red-700/60 text-red-200 hover:from-red-900/90 hover:to-rose-900/90 transition group shadow-lg shadow-red-950/40"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-xs animate-pulse">
                SOS
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-red-200">Citizen SOS Portal</div>
                <div className="text-[10px] text-red-300/80">Mobile-first reporting</div>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-red-400 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>
      </div>

      {/* Footer controls */}
      <div className="p-4 border-t border-slate-800/80 space-y-2">
        <button
          onClick={handleResetData}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          Reset Demo Data
        </button>

        <div className="text-[10px] text-center text-slate-500 font-mono pt-1">
          RESQ.AI v1.0.0-hackathon • Chennai
        </div>
      </div>
    </aside>
  );
}
