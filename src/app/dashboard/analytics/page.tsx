'use client';

import React, { useState, useEffect } from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { incidentRepository } from '@/services/repository/IncidentRepository';
import { teamRepository } from '@/services/repository/TeamRepository';
import { Incident, ResponderTeam } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  ShieldCheck,
  Users2,
  Droplets,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [teams, setTeams] = useState<ResponderTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [incList, teamList] = await Promise.all([
        incidentRepository.getAll(),
        teamRepository.getAll(),
      ]);
      setIncidents(incList);
      setTeams(teamList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute metrics from actual repository
  const totalIncidents = incidents.length;
  const criticalCount = incidents.filter((i) => i.severity === 'critical').length;
  const highCount = incidents.filter((i) => i.severity === 'high').length;
  const mediumCount = incidents.filter((i) => i.severity === 'medium').length;
  const lowCount = incidents.filter((i) => i.severity === 'low').length;

  const resolvedCount = incidents.filter((i) => i.status === 'resolved').length;
  const inProgressCount = incidents.filter((i) => i.status === 'in_progress').length;
  const dispatchedCount = incidents.filter((i) => i.status === 'dispatched').length;
  const reportedCount = incidents.filter((i) => i.status === 'reported').length;

  const totalCitizens = incidents.reduce((sum, i) => sum + (i.reporter.citizenCount || 0), 0);

  // Severity Data for Pie Chart
  const severityData = [
    { name: 'Critical', value: criticalCount, color: '#EF4444' },
    { name: 'High', value: highCount, color: '#F59E0B' },
    { name: 'Medium', value: mediumCount, color: '#EAB308' },
    { name: 'Low', value: lowCount, color: '#64748B' },
  ];

  // Category Distribution
  const categoryCounts: Record<string, number> = {};
  incidents.forEach((i) => {
    const key = i.category.replace('_', ' ');
    categoryCounts[key] = (categoryCounts[key] || 0) + 1;
  });
  const categoryData = Object.entries(categoryCounts).map(([name, count]) => ({
    name: name.toUpperCase(),
    count,
  }));

  // Hourly Simulation Timeline
  const hourlyData = [
    { time: '06:00', incidents: 2, resolved: 0, critical: 1 },
    { time: '08:00', incidents: 5, resolved: 1, critical: 2 },
    { time: '10:00', incidents: 9, resolved: 2, critical: 4 },
    { time: '12:00', incidents: 14, resolved: 4, critical: 7 },
    { time: '14:00', incidents: 18, resolved: 6, critical: 8 },
    { time: '16:00', incidents: 22, resolved: 9, critical: 6 },
    { time: '18:00', incidents: incidents.length + 12, resolved: 11, critical: criticalCount + 2 },
  ];

  // Water Depth by Area Data
  const depthByArea = incidents
    .filter((i) => i.location.waterLevelFt !== undefined)
    .map((i) => ({
      area: i.location.area,
      depth: i.location.waterLevelFt,
      citizens: i.reporter.citizenCount,
    }));

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-[#070C18]">
      <DashboardHeader
        title="Disaster Operations Analytics & Telemetry"
        subtitle="Simulated storm impact intelligence, evacuation metrics & resource allocation"
        activeCount={incidents.filter((i) => i.status !== 'resolved').length}
        criticalCount={criticalCount}
      />

      <div className="p-6 space-y-6 flex-1">
        {/* KPI Scorecard Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#0B1120] border border-slate-800 shadow-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>AVG DISPATCH TIME</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-black text-white">14.2 min</div>
            <div className="text-[11px] text-emerald-400 font-mono">⚡ 32% faster with AI triage</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0B1120] border border-slate-800 shadow-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>CITIZENS TRACKED</span>
              <Users2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-white">{totalCitizens} Persons</div>
            <div className="text-[11px] text-slate-400 font-mono">Across 8 flood sectors</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0B1120] border border-slate-800 shadow-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>ACTIVE LIFE HAZARDS</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-3xl font-black text-red-400">{criticalCount} Critical</div>
            <div className="text-[11px] text-red-300 font-mono">High priority water rescue</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0B1120] border border-slate-800 shadow-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>UNITS UTILIZATION</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400">
              {Math.round(
                (teams.filter((t) => t.status === 'en_route' || t.status === 'on_scene').length /
                  (teams.length || 1)) *
                  100
              )}
              %
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {teams.filter((t) => t.status === 'en_route' || t.status === 'on_scene').length} of{' '}
              {teams.length} units deployed
            </div>
          </div>
        </div>

        {/* Chart Section 1: Timeline & Severity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Incident Timeline Surge (8 Cols) */}
          <div className="lg:col-span-8 p-5 rounded-2xl bg-[#0B1120] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-white">Storm Surge Incident Influx (Timeline)</h3>
                <p className="text-xs text-slate-400">Total incident reports vs resolved rescues by hour</p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                Hourly Progression
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="incidents"
                    name="Cumulative Reports"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorIncidents)"
                  />
                  <Area
                    type="monotone"
                    dataKey="critical"
                    name="Critical Life Risk"
                    stroke="#EF4444"
                    fillOpacity={1}
                    fill="url(#colorCritical)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Severity Breakdown (4 Cols) */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-[#0B1120] border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Severity Categorization</h3>
              <p className="text-xs text-slate-400">Current active triage distribution</p>
            </div>

            <div className="h-56 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <div className="text-2xl font-black text-white">{totalIncidents}</div>
                <div className="text-[10px] text-slate-400 font-mono">INCIDENTS</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800">
              {severityData.map((s) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-300">{s.name}:</span>
                  <span className="text-white font-bold">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Section 2: Flood Depth by Area & Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Depth by Area Bar Chart */}
          <div className="p-5 rounded-2xl bg-[#0B1120] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-white">Flood Inundation Depth by Sector</h3>
                <p className="text-xs text-slate-400">Recorded water height (Feet) across Chennai wards</p>
              </div>
              <Droplets className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={depthByArea} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="area" stroke="#64748B" fontSize={10} angle={-25} textAnchor="end" />
                  <YAxis stroke="#64748B" fontSize={11} unit="ft" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="depth" name="Water Depth (ft)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distress Category Breakdown */}
          <div className="p-5 rounded-2xl bg-[#0B1120] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-white">Distress Requests by Category</h3>
                <p className="text-xs text-slate-400">Rescue types requested by marooned residents</p>
              </div>
              <BarChart3 className="w-4 h-4 text-purple-400" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis type="number" stroke="#64748B" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={9} width={90} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="count" name="Report Count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
