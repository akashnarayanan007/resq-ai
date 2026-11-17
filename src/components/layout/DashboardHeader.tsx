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
    <header className="bg-[#0B1222] border-b border-slate-800/80 px-6 py-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title and subtitle */}
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              LIVE TELEMETRY
            </span>
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        {/* Action and status chips */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick search */}
          {onSearchChange && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search incidents, area, team..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-56 sm:w-64 pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
          )}

          {/* Quick status metrics pill */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg p-1 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-950/60 border border-red-800/60 text-red-300 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>{criticalCount} Critical</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-slate-300 font-mono text-[11px]">
              <span>{activeCount} Active</span>
            </div>
          </div>

          {/* New Incident Fast Button */}
          <Link
            href="/sos"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs shadow-md shadow-red-950/50 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Simulate Citizen SOS</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
