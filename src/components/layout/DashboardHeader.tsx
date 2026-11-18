'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Radio,
  Search,
  ShieldAlert,
  Flame,
  Users,
  Clock,
  Compass,
  AlertTriangle,
  PlusCircle,
} from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  activeCount?: number;
  criticalCount?: number;
  onSearchChange?: (term: string) => void;
  onRefresh?: () => void;
}

export default function DashboardHeader({
  title,
  subtitle,
  activeCount = 0,
  criticalCount = 0,
  onSearchChange,
  onRefresh,
}: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onSearchChange?.(val);
  };

  return (
    <header className="bg-[#080F23]/95 backdrop-blur-md border-b border-[#1E2E4E] px-4 sm:px-6 py-4 sticky top-0 z-30">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title and subtitle */}
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-mono">{title}</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#19E6A0]/15 text-[#19E6A0] border border-[#19E6A0]/40">
              <span className="w-1.5 h-1.5 rounded-full bg-[#19E6A0] animate-ping" />
              LIVE TELEMETRY
            </span>
          </div>
          {subtitle && <p className="text-xs text-[#A5B4D0] mt-0.5">{subtitle}</p>}
        </div>

        {/* Action and status chips */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick search */}
          {onSearchChange && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#00D9FF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search incidents, area, team..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-52 sm:w-64 pl-9 pr-3 py-1.5 text-xs bg-[#101C35] border border-[#1E2E4E] rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00D9FF] transition"
              />
            </div>
          )}

          {/* Quick status metrics pill */}
          <div className="flex items-center gap-1.5 bg-[#101C35] border border-[#1E2E4E] rounded-xl p-1 text-xs shadow-inner">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FF4D67]/15 border border-[#FF4D67]/40 text-[#FF4D67] font-mono text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#FF4D67] animate-pulse" />
              <span>{criticalCount} Critical</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-cyan-300 font-mono text-[11px] font-semibold">
              <span>{activeCount} Active</span>
            </div>
          </div>

          {/* New Incident Fast Button */}
          <Link
            href="/sos"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF4D67] hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-950/60 transition active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Simulate Citizen SOS</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
