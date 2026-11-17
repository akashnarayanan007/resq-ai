'use client';

import React, { useState, useEffect } from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { AnalyticsData, UrgencyDistribution } from '@/types';
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
  RotateCcw,
  Lock,
  CheckCircle2,
  ShieldAlert,
  Info,
  Truck,
  Check,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Coordinator Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPasscode, setResetPasscode] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [resetErrorMsg, setResetErrorMsg] = useState<string | null>(null);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const data: AnalyticsData = await res.json();
        setAnalytics(data);
      } else {
        throw new Error('Failed to load server analytics');
      }
    } catch (err: any) {
      console.warn('Analytics fetch warning:', err);
      setError('Unable to load server analytics; check connection or local demo mode.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetting(true);
    setResetErrorMsg(null);
    setResetSuccessMsg(null);

    try {
      // 1. Ensure coordinator login session if passcode provided
      if (resetPasscode) {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passcode: resetPasscode }),
        });
        if (!loginRes.ok) {
          const loginData = await loginRes.json();
          throw new Error(loginData.error || 'Coordinator passcode rejected.');
        }
      }

      // 2. Call protected reset endpoint
      const resetRes = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true, operatorNote: 'Reset triggered via Analytics Dashboard' }),
      });

      if (!resetRes.ok) {
        const errData = await resetRes.json();
        throw new Error(errData.error || 'Reset request rejected by server authorization.');
      }

      const resData = await resetRes.json();
      setResetSuccessMsg(resData.message || 'Simulation baseline successfully restored.');
      await loadAnalytics();

      setTimeout(() => {
        setIsResetModalOpen(false);
        setResetSuccessMsg(null);
        setResetPasscode('');
      }, 2000);
    } catch (err: any) {
      setResetErrorMsg(err.message || 'Failed to reset demo simulation.');
    } finally {
      setResetting(false);
    }
  };

  // Pie chart data for Urgency
  const urgencyData = analytics
    ? [
        { name: 'Critical', value: analytics.urgencyDistribution.critical, color: '#EF4444' },
        { name: 'High', value: analytics.urgencyDistribution.high, color: '#F97316' },
        { name: 'Medium', value: analytics.urgencyDistribution.medium, color: '#EAB308' },
        { name: 'Low', value: analytics.urgencyDistribution.low, color: '#22C55E' },
      ]
    : [];

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-[#070C18]">
      <DashboardHeader
        title="Disaster Operations Telemetry & Intelligence"
        subtitle="Live simulated analytics • Chennai Flood Coordination Drill"
        activeCount={analytics?.activeCount || 0}
        criticalCount={analytics?.urgencyDistribution.critical || 0}
      />

      <div className="p-4 sm:p-6 space-y-6 flex-1">
        {/* Prominent Simulated Disaster Disclaimer Banner (Never imply real rescues) */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-amber-950/70 border border-amber-600/50 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white uppercase tracking-wider">
                  DEMO DRILL SIMULATION ENVIRONMENT
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                  NOT REAL RESCUES
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                All analytics, maps, response teams, and incident metrics represent synthetic exercise data. In a real emergency, dial <strong>112</strong> / <strong>108</strong>.
              </p>
            </div>
          </div>

          {/* Coordinator Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={loadAnalytics}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setIsResetModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-200 text-xs font-bold flex items-center gap-1.5 transition shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>

        {/* Status Scorecard Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl bg-[#0B1120] border border-slate-800 shadow space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Total Logged</span>
            <div className="text-2xl font-black text-white">{analytics?.totalIncidents || 0}</div>
            <div className="text-[10px] text-slate-500">Stored drill reports</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1120] border border-amber-900/40 shadow space-y-1">
            <span className="text-[10px] font-mono text-amber-400 uppercase">Pending Review</span>
            <div className="text-2xl font-black text-amber-300">{analytics?.pendingCount || 0}</div>
            <div className="text-[10px] text-amber-400/70">Awaiting coordinator</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1120] border border-cyan-900/40 shadow space-y-1">
            <span className="text-[10px] font-mono text-cyan-400 uppercase">Assigned</span>
            <div className="text-2xl font-black text-cyan-300">{analytics?.assignedCount || 0}</div>
            <div className="text-[10px] text-cyan-400/70">Team en-route</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1120] border border-blue-900/40 shadow space-y-1">
            <span className="text-[10px] font-mono text-blue-400 uppercase">In Progress</span>
            <div className="text-2xl font-black text-blue-300">{analytics?.inProgressCount || 0}</div>
            <div className="text-[10px] text-blue-400/70">On scene / rescue</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1120] border border-emerald-900/40 shadow space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 uppercase">Resolved</span>
            <div className="text-2xl font-black text-emerald-300">{analytics?.resolvedCount || 0}</div>
            <div className="text-[10px] text-emerald-400/70">Safely evacuated</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1120] border border-slate-800 shadow space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Invalid / Closed</span>
            <div className="text-2xl font-black text-slate-400">{analytics?.invalidCount || 0}</div>
            <div className="text-[10px] text-slate-500">Duplicate / False</div>
          </div>
        </div>

        {/* Key Metrics: Citizen Count & Teams Utilization */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#0B1120] border border-slate-800 shadow-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>ESTIMATED CITIZENS AIDED</span>
              <Users2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-white">
              {analytics?.totalCitizensAssisted || 0} Persons
            </div>
            <div className="text-[11px] text-slate-400 font-mono">Across simulated flood corridors</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0B1120] border border-slate-800 shadow-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>DEPLOYED RESPONSE TEAMS</span>
              <Truck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-cyan-400">
              {analytics?.deployedTeamsCount || 0} / {analytics?.totalTeamsCount || 5} Units
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {(analytics?.totalTeamsCount || 5) - (analytics?.deployedTeamsCount || 0)} units idle & ready
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0B1120] border border-red-900/40 shadow-xl space-y-1">
            <div className="flex items-center justify-between text-red-300 text-xs font-mono font-bold">
              <span>CRITICAL LIFE THREATS</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-3xl font-black text-red-400">
              {analytics?.urgencyDistribution.critical || 0} Critical
            </div>
            <div className="text-[11px] text-red-300/80 font-mono">
              Immediate water rescue or medical extraction
            </div>
          </div>
        </div>

        {/* Charts Row 1: Hourly Surge Trends & Urgency Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Hourly Influx Trends (8 Cols) */}
          <div className="lg:col-span-8 p-5 rounded-2xl bg-[#0B1120] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-white">Simulated Incident Influx & Resolution Trend</h3>
                <p className="text-xs text-slate-400">Reported emergencies vs resolved evacuations by hour</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                Hourly Timeline
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={analytics?.hourlyTrends || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="hour" stroke="#64748B" fontSize={11} />
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
                    dataKey="reportedCount"
                    name="Logged Distress Signals"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorReported)"
                  />
                  <Area
                    type="monotone"
                    dataKey="resolvedCount"
                    name="Evacuated / Resolved"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorResolved)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Urgency Categorization Pie (4 Cols) */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-[#0B1120] border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Urgency Breakdown</h3>
              <p className="text-xs text-slate-400">Current triage urgency ratio</p>
            </div>

            <div className="h-56 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={urgencyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {urgencyData.map((entry, index) => (
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
                <div className="text-2xl font-black text-white">{analytics?.totalIncidents || 0}</div>
                <div className="text-[9px] text-slate-400 font-mono">INCIDENTS</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800">
              {urgencyData.map((s) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-300">{s.name}:</span>
                  <span className="text-white font-bold">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2: Distress Categories Bar Chart */}
        <div className="p-5 rounded-2xl bg-[#0B1120] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-white">Emergency Distress Category Breakdown</h3>
              <p className="text-xs text-slate-400">Distribution across flood, medical, structural collapse & power lines</p>
            </div>
            <BarChart3 className="w-4 h-4 text-purple-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics?.categoryBreakdown || []}
                layout="horizontal"
                margin={{ top: 10, right: 20, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="label" stroke="#64748B" fontSize={10} angle={-15} textAnchor="end" />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" name="Report Count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Confirmed Coordinator-Only Reset Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0B1222] border border-rose-500/50 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Demo Simulation Dataset</h3>
                <span className="text-[10px] font-mono text-rose-300">COORDINATOR CONFIRMATION REQUIRED</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action will purge all recently submitted test reports, re-seed the initial simulated Chennai flood incidents, and reset all 5 fictional response teams back to their idle baseline positions.
            </p>

            <form onSubmit={handleExecuteReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Coordinator Passcode (Default: <code className="text-cyan-300">RESQ-CHENNAI-2024</code>):
                </label>
                <input
                  type="password"
                  value={resetPasscode}
                  onChange={(e) => setResetPasscode(e.target.value)}
                  placeholder="Enter coordinator passcode..."
                  className="w-full p-2.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              {resetErrorMsg && (
                <div className="p-2.5 rounded bg-rose-950/70 border border-rose-800 text-xs text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{resetErrorMsg}</span>
                </div>
              )}

              {resetSuccessMsg && (
                <div className="p-2.5 rounded bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-200 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{resetSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetModalOpen(false);
                    setResetErrorMsg(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition disabled:opacity-50 shadow-lg shadow-rose-950/50"
                >
                  {resetting ? 'Resetting Simulation Data...' : 'Confirm Reset Simulation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
