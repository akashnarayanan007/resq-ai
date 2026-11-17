'use client';

import React, { useState, useEffect } from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { teamRepository } from '@/services/repository/TeamRepository';
import { incidentRepository } from '@/services/repository/IncidentRepository';
import { ResponderTeam, TeamStatus, Incident } from '@/types';
import {
  Users2,
  Radio,
  Truck,
  Fuel,
  Battery,
  MapPin,
  CheckCircle,
  Clock,
  Shield,
  Activity,
  Phone,
  Flame,
  LifeBuoy,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

export default function TeamsPage() {
  const [teams, setTeams] = useState<ResponderTeam[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [teamList, incList] = await Promise.all([
        teamRepository.getAll(),
        incidentRepository.getAll(),
      ]);
      setTeams(teamList);
      setIncidents(incList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (teamId: string, newStatus: TeamStatus) => {
    setUpdatingId(teamId);
    try {
      await teamRepository.updateStatus(teamId, newStatus);
      await loadData();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUnassign = async (teamId: string) => {
    setUpdatingId(teamId);
    try {
      await teamRepository.releaseTeam(teamId);
      await loadData();
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTeams = teams.filter((t) => {
    const matchesSearch =
      searchTerm === '' ||
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.callsign.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.commander.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.currentLocation.label.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: TeamStatus) => {
    switch (status) {
      case 'idle':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      case 'en_route':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-800 animate-pulse';
      case 'on_scene':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'refueling':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-[#070C18]">
      <DashboardHeader
        title="Simulated Responder Teams Roster"
        subtitle="Manage deployable battalions, boat squads, paramedic ambulances, and drone wings"
        activeCount={teams.filter((t) => t.status === 'en_route' || t.status === 'on_scene').length}
        criticalCount={0}
        onSearchChange={setSearchTerm}
      />

      <div className="p-6 space-y-6 flex-1">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#0B1120] border border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono">Filter by Status:</span>
            <div className="flex flex-wrap gap-1.5">
              {['all', 'idle', 'en_route', 'on_scene', 'refueling'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                    statusFilter === st
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">
              Total Units: <strong className="text-white">{filteredTeams.length}</strong>
            </span>
            <button
              onClick={loadData}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Teams Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              className="p-5 rounded-2xl bg-[#0B1120] border border-slate-800 shadow-xl space-y-4 hover:border-slate-700 transition flex flex-col justify-between"
            >
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      {team.callsign}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-slate-500">
                      {team.id}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${getStatusBadge(
                      team.status
                    )}`}
                  >
                    {team.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white leading-snug">{team.name}</h3>

                <div className="text-xs text-cyan-300 font-medium flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{team.specialization}</span>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-3">
                  <span>Commander: <strong className="text-slate-200">{team.commander}</strong></span>
                  <span>•</span>
                  <span>Personnel: <strong className="text-slate-200">{team.personnelCount}</strong></span>
                </div>
              </div>

              {/* Specs & Status Metrics */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    Base / Staging:
                  </span>
                  <span className="font-medium text-slate-200">{team.currentLocation.label}</span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Radio className="w-3.5 h-3.5 text-blue-400" />
                    Radio Frequency:
                  </span>
                  <span className="font-mono text-slate-200">{team.radioChannel}</span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Fuel className="w-3.5 h-3.5 text-amber-400" />
                    Fuel / Battery Reserve:
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-amber-500"
                        style={{ width: `${team.batteryOrFuelPercent}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-slate-200">
                      {team.batteryOrFuelPercent}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800">
                  <span>Evacuation Capacity: {team.capacity} pax</span>
                  <span>Ping: {formatTimeAgo(team.lastPingTime)}</span>
                </div>
              </div>

              {/* Equipment Inventory */}
              <div>
                <div className="text-[11px] font-mono uppercase text-slate-400 mb-1.5">
                  Tactical Equipment Kit
                </div>
                <div className="flex flex-wrap gap-1">
                  {team.equipment.map((eq, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>

              {/* Assignment Box */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Active Mission Deployment
                </div>
                {team.assignedIncidentTitle ? (
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-cyan-300 leading-snug">
                      {team.assignedIncidentTitle}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400">
                        {team.assignedIncidentId}
                      </span>
                      <button
                        onClick={() => handleUnassign(team.id)}
                        className="text-[10px] text-red-400 hover:text-red-300 underline"
                      >
                        Release Unit
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic">
                    Unit is currently standing by on idle reserve.
                  </div>
                )}
              </div>

              {/* Interactive Status Controls */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Update Unit Operational State:
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {(['idle', 'en_route', 'on_scene', 'refueling'] as TeamStatus[]).map((st) => (
                    <button
                      key={st}
                      disabled={updatingId === team.id || team.status === st}
                      onClick={() => handleUpdateStatus(team.id, st)}
                      className={`py-1 text-[10px] font-bold uppercase rounded border transition ${
                        team.status === st
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
