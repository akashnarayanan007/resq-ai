'use client';

import React, { useState, useEffect } from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import TacticalMap from '@/components/map/TacticalMap';
import IncidentDetailModal from '@/components/modals/IncidentDetailModal';
import DispatchModal from '@/components/modals/DispatchModal';
import { incidentRepository } from '@/services/repository/IncidentRepository';
import { teamRepository } from '@/services/repository/TeamRepository';
import { Incident, ResponderTeam, IncidentStatus, AITriageAnalysis } from '@/types';
import {
  AlertOctagon,
  ShieldAlert,
  Flame,
  Users2,
  Droplets,
  Radio,
  Clock,
  Sparkles,
  Truck,
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  formatTimeAgo,
  getSeverityBadgeClass,
  getStatusBadgeClass,
  getCategoryLabel,
} from '@/lib/utils';

export default function DashboardCommandCenter() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [teams, setTeams] = useState<ResponderTeam[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Selection
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'critical' | 'teams_only'>('all');

  const loadData = async () => {
    try {
      const [incList, teamList] = await Promise.all([
        incidentRepository.getAll(),
        teamRepository.getAll(),
      ]);
      setIncidents(incList);
      setTeams(teamList);

      // Keep selected incident synchronized if open
      if (selectedIncidentId) {
        const found = incList.find((i) => i.id === selectedIncidentId);
        if (found) setSelectedIncident(found);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, [selectedIncidentId]);

  const handleOpenIncident = (inc: Incident) => {
    setSelectedIncident(inc);
    setSelectedIncidentId(inc.id);
    setIsDetailModalOpen(true);
  };

  const handleStatusChange = async (status: IncidentStatus, note?: string) => {
    if (!selectedIncident) return;
    const updated = await incidentRepository.updateStatus(
      selectedIncident.id,
      status,
      'Command Center Operator',
      note
    );
    setSelectedIncident(updated);
    await loadData();
  };

  const handleCloseAsInvalid = async (reason: string) => {
    if (!selectedIncident) return;
    const updated = await incidentRepository.closeAsInvalid(
      selectedIncident.id,
      reason,
      'Command Center Operator'
    );
    setSelectedIncident(updated);
    await loadData();
  };

  const handleDispatch = async (teamId: string, teamName: string, note: string) => {
    if (!selectedIncident) return;
    const updatedInc = await incidentRepository.assignTeam(
      selectedIncident.id,
      teamId,
      teamName,
      'Command Center Dispatcher'
    );
    await teamRepository.assignIncident(teamId, selectedIncident.id, selectedIncident.title);
    setSelectedIncident(updatedInc);
    await loadData();
  };

  const handleRunAITriage = async (incident: Incident) => {
    try {
      const res = await fetch('/api/ai/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: incident.description,
          category: incident.category,
          waterLevelFt: incident.location.waterLevelFt ?? 3,
          citizenCount: incident.reporter.citizenCount,
          hasChildrenOrElderly: incident.reporter.hasChildrenOrElderly,
          needsBoat: incident.reporter.needsBoat,
          needsMedical: incident.reporter.needsMedical,
          location: `${incident.location.address}, ${incident.location.area}`,
        }),
      });

      if (res.ok) {
        const triage: AITriageAnalysis = await res.json();
        const updated = await incidentRepository.updateAITriage(incident.id, triage);
        setSelectedIncident(updated);
        await loadData();
      }
    } catch (err) {
      console.error('Failed to run AI triage:', err);
    }
  };

  const handleSaveAITriage = async (triage: AITriageAnalysis) => {
    if (!selectedIncident) return;
    const updated = await incidentRepository.updateAITriage(selectedIncident.id, triage);
    setSelectedIncident(updated);
    await loadData();
  };

  // Filtered incidents for the feed list
  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      searchTerm === '' ||
      inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.location.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterMode === 'critical') return matchesSearch && inc.severity === 'critical';
    return matchesSearch;
  });

  const criticalCount = incidents.filter(
    (i) => i.severity === 'critical' && i.status !== 'resolved'
  ).length;
  const activeCount = incidents.filter((i) => i.status !== 'resolved').length;
  const dispatchedTeamsCount = teams.filter(
    (t) => t.status === 'en_route' || t.status === 'on_scene'
  ).length;

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-[#070C18]">
      <DashboardHeader
        title="Tactical Emergency Operations Center"
        subtitle="Live multi-agency coordination matrix • Chennai Flood Simulation"
        activeCount={activeCount}
        criticalCount={criticalCount}
        onSearchChange={setSearchTerm}
      />

      <div className="flex-1 p-5 space-y-5">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#0B1120] border border-red-900/60 shadow-lg shadow-red-950/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Critical Distress
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            </div>
            <div className="text-2xl font-black text-red-400 mt-1">{criticalCount}</div>
            <div className="text-[11px] text-red-300/80 mt-0.5">Life-critical priority</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1120] border border-blue-900/60 shadow-lg shadow-blue-950/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Active Incidents
              </span>
              <AlertOctagon className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-400 mt-1">{activeCount}</div>
            <div className="text-[11px] text-blue-300/80 mt-0.5">Awaiting or in progress</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1120] border border-cyan-900/60 shadow-lg shadow-cyan-950/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Deployed Units
              </span>
              <Truck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-400 mt-1">
              {dispatchedTeamsCount} / {teams.length}
            </div>
            <div className="text-[11px] text-cyan-300/80 mt-0.5">NDRF, SDRF & GCC active</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1120] border border-emerald-900/60 shadow-lg shadow-emerald-950/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Citizens Rescued
              </span>
              <Users2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">118+</div>
            <div className="text-[11px] text-emerald-300/80 mt-0.5">Relocated to dry shelters</div>
          </div>
        </div>

        {/* Main Grid: Interactive Tactical Map + Live Telemetry Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Map Column (8 Cols on LG) */}
          <div className="lg:col-span-8 flex flex-col space-y-3">
            <div className="p-4 rounded-2xl bg-[#0B1120] border border-slate-800 shadow-2xl flex flex-col h-[580px]">
              {/* Map Controls Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">Tactical GIS Map</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Chennai Metropolis
                  </span>
                </div>

                {/* Map Filter Toggles */}
                <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                      filterMode === 'all'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Assets
                  </button>
                  <button
                    onClick={() => setFilterMode('critical')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                      filterMode === 'critical'
                        ? 'bg-red-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Critical Only
                  </button>
                  <button
                    onClick={() => setFilterMode('teams_only')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                      filterMode === 'teams_only'
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Units Only
                  </button>
                </div>
              </div>

              {/* Tactical Leaflet Map Canvas */}
              <div className="flex-1 w-full mt-3 relative rounded-xl overflow-hidden border border-slate-800">
                <TacticalMap
                  incidents={incidents}
                  teams={teams}
                  selectedIncidentId={selectedIncidentId}
                  filterMode={filterMode}
                  onSelectIncident={handleOpenIncident}
                  onSelectTeam={(team) => {
                    if (team.assignedIncidentId) {
                      const inc = incidents.find((i) => i.id === team.assignedIncidentId);
                      if (inc) handleOpenIncident(inc);
                    }
                  }}
                />
              </div>

              {/* Map Legend */}
              <div className="pt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono shrink-0">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    Critical Flood Incident
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    High Priority
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    Dispatched Unit
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Resolved
                  </span>
                </div>
                <div>Grid: EPSG:4326 WGS-84</div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Incident Stream & Fast Dispatch (4 Cols on LG) */}
          <div className="lg:col-span-4 flex flex-col space-y-3">
            <div className="p-4 rounded-2xl bg-[#0B1120] border border-slate-800 shadow-2xl flex flex-col h-[580px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">Live Incident Stream</span>
                  <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                    {filteredIncidents.length}
                  </span>
                </div>
                <button
                  onClick={loadData}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Refresh feed"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Scrollable Incidents List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mt-3">
                {filteredIncidents.map((inc) => {
                  const isSelected = inc.id === selectedIncidentId;
                  return (
                    <div
                      key={inc.id}
                      onClick={() => handleOpenIncident(inc)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition space-y-2 ${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-950/40'
                          : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-400">{inc.id}</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] px-2 py-0.2 rounded-full border uppercase tracking-wider font-semibold ${getSeverityBadgeClass(
                              inc.severity
                            )}`}
                          >
                            {inc.severity}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.2 rounded-full border uppercase tracking-wider ${getStatusBadgeClass(
                              inc.status
                            )}`}
                          >
                            {inc.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="font-bold text-xs text-white leading-snug line-clamp-2">
                        {inc.title}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>{inc.location.area}</span>
                        {inc.location.waterLevelFt && (
                          <span className="text-cyan-400 font-mono font-medium">
                            🌊 ~{inc.location.waterLevelFt}ft
                          </span>
                        )}
                      </div>

                      {inc.aiTriage && (
                        <div className="flex items-center justify-between text-[10px] bg-slate-950 p-1.5 rounded border border-slate-800 text-amber-200">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            AI Priority:
                          </span>
                          <span className="font-mono font-bold">{inc.aiTriage.priorityScore}/100</span>
                        </div>
                      )}

                      <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>{formatTimeAgo(inc.reportedAt)}</span>
                        <span className="text-blue-400 flex items-center gap-0.5 hover:underline">
                          Inspect &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <IncidentDetailModal
        incident={selectedIncident}
        teams={teams}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onStatusChange={handleStatusChange}
        onCloseAsInvalid={handleCloseAsInvalid}
        onSaveAITriage={handleSaveAITriage}
        onOpenDispatch={() => {
          setIsDetailModalOpen(false);
          setIsDispatchModalOpen(true);
        }}
        onRunAITriage={handleRunAITriage}
      />

      {selectedIncident && (
        <DispatchModal
          incident={selectedIncident}
          teams={teams}
          isOpen={isDispatchModalOpen}
          onClose={() => setIsDispatchModalOpen(false)}
          onDispatch={handleDispatch}
        />
      )}
    </div>
  );
}
