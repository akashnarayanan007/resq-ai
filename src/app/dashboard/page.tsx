'use client';

import React, { useState, useEffect } from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import TacticalMap from '@/components/map/TacticalMap';
import IncidentDetailModal from '@/components/modals/IncidentDetailModal';
import DispatchModal from '@/components/modals/DispatchModal';
import { incidentRepository } from '@/services/repository/IncidentRepository';
import { teamRepository } from '@/services/repository/TeamRepository';
import { Incident, ResponderTeam, IncidentStatus, AITriageAnalysis } from '@/types';
import { isValidCoordinate } from '@/lib/geoUtils';
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
  MapPinOff,
  MapPin,
  CheckCircle2,
  Navigation,
  AlertTriangle,
  Compass,
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
  const [queueTab, setQueueTab] = useState<'all' | 'needs_location' | 'critical' | 'assigned' | 'resolved'>('all');

  // Quick Geolocation Assignment State for Needs Location Queue
  const [locModalIncident, setLocModalIncident] = useState<Incident | null>(null);
  const [selectedPresetLoc, setSelectedPresetLoc] = useState<string>('vyasarpadi');
  const [customLat, setCustomLat] = useState('13.1120');
  const [customLng, setCustomLng] = useState('80.2600');
  const [locAreaName, setLocAreaName] = useState('Vyasarpadi North');

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

  const handleDispatch = async (
    teamId: string,
    teamName: string,
    note: string,
    forceOverride: boolean = false
  ) => {
    if (!selectedIncident) return;
    const updatedInc = await incidentRepository.assignTeam(
      selectedIncident.id,
      teamId,
      teamName,
      'Command Center Dispatcher',
      forceOverride
    );
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

  const handleAssignCoordinates = async () => {
    if (!locModalIncident) return;
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (isNaN(lat) || isNaN(lng)) return;

    await incidentRepository.updateCoordinates(
      locModalIncident.id,
      lat,
      lng,
      `${locAreaName} (Verified via Command Center Operator)`,
      locAreaName,
      'Command Center Dispatcher'
    );

    setLocModalIncident(null);
    await loadData();
  };

  // Grouping & Metric Counters
  const criticalCount = incidents.filter(
    (i) => (i.preliminaryUrgency || i.severity) === 'critical' && i.status !== 'resolved' && i.status !== 'invalid'
  ).length;

  const highCount = incidents.filter(
    (i) => (i.preliminaryUrgency || i.severity) === 'high' && i.status !== 'resolved' && i.status !== 'invalid'
  ).length;

  const needsLocationCount = incidents.filter(
    (i) => !isValidCoordinate(i.location?.lat, i.location?.lng) && i.status !== 'resolved' && i.status !== 'invalid'
  ).length;

  const activeCount = incidents.filter((i) => i.status !== 'resolved' && i.status !== 'invalid').length;

  const deployedTeamsCount = teams.filter(
    (t) => t.status === 'en_route' || t.status === 'on_scene'
  ).length;

  // Filter queue based on tab and search
  const filteredQueue = incidents.filter((inc) => {
    const matchesSearch =
      searchTerm === '' ||
      inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.location.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const hasCoords = isValidCoordinate(inc.location?.lat, inc.location?.lng);

    if (queueTab === 'needs_location') {
      return !hasCoords && inc.status !== 'resolved' && inc.status !== 'invalid';
    }
    if (queueTab === 'critical') {
      return (inc.preliminaryUrgency || inc.severity) === 'critical' && inc.status !== 'resolved';
    }
    if (queueTab === 'assigned') {
      return inc.status === 'assigned' || inc.status === 'in_progress';
    }
    if (queueTab === 'resolved') {
      return inc.status === 'resolved';
    }
    return inc.status !== 'resolved' && inc.status !== 'invalid';
  });

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-[#070C18]">
      <DashboardHeader
        title="Tactical Emergency Operations Center"
        subtitle="Live multi-agency coordination matrix • Chennai Flood Simulation"
        activeCount={activeCount}
        criticalCount={criticalCount}
        onSearchChange={setSearchTerm}
      />

      <div className="flex-1 p-4 sm:p-5 space-y-5">
        {/* Priority Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Critical Distress */}
          <div
            onClick={() => setQueueTab('critical')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              queueTab === 'critical'
                ? 'bg-red-950/40 border-red-500 shadow-lg shadow-red-950/40'
                : 'bg-[#0B1120] border-red-900/40 hover:border-red-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-red-300 uppercase tracking-wider font-bold">
                Critical Priority
              </span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-red-400 mt-1">{criticalCount}</div>
            <div className="text-[11px] text-red-300/80 mt-0.5">Immediate life threat</div>
          </div>

          {/* High Priority */}
          <div
            onClick={() => setQueueTab('all')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              queueTab === 'all'
                ? 'bg-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-950/30'
                : 'bg-[#0B1120] border-amber-900/40 hover:border-amber-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-amber-300 uppercase tracking-wider font-bold">
                High Priority
              </span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">{highCount}</div>
            <div className="text-[11px] text-amber-300/80 mt-0.5">High surge & elder risk</div>
          </div>

          {/* Needs Location Queue (Unmapped) */}
          <div
            onClick={() => setQueueTab('needs_location')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              queueTab === 'needs_location'
                ? 'bg-orange-950/50 border-orange-400 shadow-lg shadow-orange-950/50'
                : 'bg-[#0B1120] border-orange-900/50 hover:border-orange-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-orange-300 uppercase tracking-wider font-bold">
                Needs Location Queue
              </span>
              <MapPinOff className="w-4 h-4 text-orange-400 animate-pulse" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-orange-400 mt-1">
              {needsLocationCount}
            </div>
            <div className="text-[11px] text-orange-300/90 mt-0.5">
              Unmapped • Verification needed
            </div>
          </div>

          {/* Deployed Response Teams */}
          <div className="p-4 rounded-xl bg-[#0B1120] border border-cyan-900/50 shadow-lg shadow-cyan-950/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-cyan-300 uppercase tracking-wider font-bold">
                Teams Deployed
              </span>
              <Truck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-400 mt-1">
              {deployedTeamsCount} / {teams.length}
            </div>
            <div className="text-[11px] text-cyan-300/80 mt-0.5">
              {teams.length - deployedTeamsCount} units idle & ready
            </div>
          </div>
        </div>

        {/* Main Grid: Interactive Tactical Map + Live Telemetry & Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Tactical GIS Map Column (7 cols on LG, 8 on XL) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-3">
            <div className="p-4 rounded-2xl bg-[#0B1120] border border-slate-800 shadow-2xl flex flex-col h-[620px]">
              {/* Map Header & Filter Toggles */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    Tactical Operational GIS Map
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    OpenStreetMap Engine
                  </span>
                </div>

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
                    Critical Distress
                  </button>
                  <button
                    onClick={() => setFilterMode('teams_only')}
                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                      filterMode === 'teams_only'
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Response Teams
                  </button>
                </div>
              </div>

              {/* Tactical Leaflet Map Canvas */}
              <div className="flex-1 w-full mt-3 relative rounded-xl overflow-hidden border border-slate-800/80">
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

              {/* Tactical Map Color Legend */}
              <div className="pt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono shrink-0 gap-2 border-t border-slate-800/60 mt-2">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    Critical
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    High
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    Medium
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Low / Resolved
                  </span>
                  <span className="flex items-center gap-1.5 border-l border-slate-700 pl-3 text-cyan-300">
                    <span className="w-3 h-3 rounded bg-cyan-950 border border-cyan-400 flex items-center justify-center text-[8px]">
                      ⚡
                    </span>
                    5 Simulated Teams
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">Only verified coordinates plotted</div>
              </div>
            </div>
          </div>

          {/* Incident Queue Column (5 cols on LG, 4 on XL) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-3">
            <div className="p-4 rounded-2xl bg-[#0B1120] border border-slate-800 shadow-2xl flex flex-col h-[620px]">
              {/* Queue Controls & Tabs */}
              <div className="pb-3 border-b border-slate-800 shrink-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Incident Queue</span>
                    <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {filteredQueue.length}
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

                {/* Queue Filter Tabs */}
                <div className="grid grid-cols-4 gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-[10px] font-medium">
                  <button
                    onClick={() => setQueueTab('all')}
                    className={`py-1 rounded text-center transition ${
                      queueTab === 'all'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setQueueTab('needs_location')}
                    className={`py-1 rounded text-center transition flex items-center justify-center gap-1 ${
                      queueTab === 'needs_location'
                        ? 'bg-orange-600 text-white font-bold'
                        : 'text-orange-400/90 hover:text-orange-300'
                    }`}
                  >
                    Needs Loc
                    {needsLocationCount > 0 && (
                      <span className="w-3.5 h-3.5 rounded-full bg-orange-950 border border-orange-400 text-[9px] flex items-center justify-center">
                        {needsLocationCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setQueueTab('critical')}
                    className={`py-1 rounded text-center transition ${
                      queueTab === 'critical'
                        ? 'bg-red-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Critical
                  </button>
                  <button
                    onClick={() => setQueueTab('assigned')}
                    className={`py-1 rounded text-center transition ${
                      queueTab === 'assigned'
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Assigned
                  </button>
                </div>
              </div>

              {/* Needs Location Alert Banner when tab active */}
              {queueTab === 'needs_location' && (
                <div className="mt-2.5 p-2 rounded-lg bg-orange-950/40 border border-orange-800/60 text-[11px] text-orange-200 flex items-start gap-2 shrink-0">
                  <MapPinOff className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Needs Location Queue:</strong> These distress reports lack GPS coordinates and are strictly excluded from map plotting. Click <strong>Verify Coordinates</strong> to place on grid.
                  </div>
                </div>
              )}

              {/* Scrollable Incidents List */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mt-3">
                {filteredQueue.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No incidents matching this queue filter.
                  </div>
                ) : (
                  filteredQueue.map((inc) => {
                    const isSelected = inc.id === selectedIncidentId;
                    const hasCoords = isValidCoordinate(inc.location?.lat, inc.location?.lng);
                    const urgency = inc.preliminaryUrgency || inc.severity;

                    return (
                      <div
                        key={inc.id}
                        onClick={() => handleOpenIncident(inc)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition space-y-2 ${
                          isSelected
                            ? 'bg-blue-950/40 border-blue-500 shadow-md shadow-blue-950/40'
                            : !hasCoords
                            ? 'bg-orange-950/20 border-orange-900/50 hover:border-orange-600'
                            : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-400">{inc.id}</span>
                          <div className="flex items-center gap-1.5">
                            {!hasCoords && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-orange-950 text-orange-400 border border-orange-800">
                                UNMAPPED
                              </span>
                            )}
                            <span
                              className={`text-[10px] px-2 py-0.2 rounded-full border uppercase tracking-wider font-semibold ${getSeverityBadgeClass(
                                urgency
                              )}`}
                            >
                              {urgency}
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
                          <span className="flex items-center gap-1">
                            {hasCoords ? (
                              <MapPin className="w-3 h-3 text-cyan-400" />
                            ) : (
                              <MapPinOff className="w-3 h-3 text-orange-400" />
                            )}
                            {inc.location.area || 'Unknown Area'}
                          </span>
                          {inc.location.waterLevelFt ? (
                            <span className="text-cyan-400 font-mono font-medium">
                              🌊 ~{inc.location.waterLevelFt}ft
                            </span>
                          ) : null}
                        </div>

                        {/* Assigned Team indicator */}
                        {inc.assignedTeamName && (
                          <div className="text-[10px] font-mono bg-cyan-950/50 text-cyan-300 p-1 rounded border border-cyan-800/60 flex items-center gap-1.5">
                            <Truck className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="truncate">Unit: {inc.assignedTeamName}</span>
                          </div>
                        )}

                        {/* Direct action button for unmapped incidents */}
                        {!hasCoords && (
                          <div className="pt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocModalIncident(inc);
                              }}
                              className="w-full text-center py-1 px-2 text-[10px] font-bold rounded bg-orange-600/80 hover:bg-orange-600 text-white transition flex items-center justify-center gap-1 shadow"
                            >
                              <MapPin className="w-3 h-3" />
                              Verify & Assign Coordinates
                            </button>
                          </div>
                        )}

                        <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>{formatTimeAgo(inc.reportedAt)}</span>
                          <span className="text-blue-400 flex items-center gap-0.5 hover:underline">
                            Inspect Dossier &rarr;
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Coordinate Assignment Modal for Needs Location Queue */}
      {locModalIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0B1222] border border-orange-500/50 rounded-xl max-w-md w-full shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <MapPin className="w-4 h-4 text-orange-400" />
                Verify Geolocation for {locModalIncident.id}
              </div>
              <button
                onClick={() => setLocModalIncident(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Select verified landmark or input operator verified coordinates to plot this incident on the tactical map.
            </p>

            {/* Presets around Chennai flood hotspots */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400">Quick Landmark Presets:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setCustomLat('13.1120');
                    setCustomLng('80.2600');
                    setLocAreaName('Vyasarpadi');
                  }}
                  className="p-2 rounded bg-slate-900 border border-slate-700 hover:border-cyan-400 text-left text-slate-200"
                >
                  <div className="font-bold">Vyasarpadi Jeeva</div>
                  <div className="text-[10px] text-slate-400 font-mono">13.1120, 80.2600</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomLat('13.0480');
                    setCustomLng('80.1100');
                    setLocAreaName('Poonamallee');
                  }}
                  className="p-2 rounded bg-slate-900 border border-slate-700 hover:border-cyan-400 text-left text-slate-200"
                >
                  <div className="font-bold">Poonamallee Depot</div>
                  <div className="text-[10px] text-slate-400 font-mono">13.0480, 80.1100</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomLat('13.0674');
                    setCustomLng('80.1980');
                    setLocAreaName('Koyambedu');
                  }}
                  className="p-2 rounded bg-slate-900 border border-slate-700 hover:border-cyan-400 text-left text-slate-200"
                >
                  <div className="font-bold">Koyambedu Market</div>
                  <div className="text-[10px] text-slate-400 font-mono">13.0674, 80.1980</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomLat('12.9780');
                    setCustomLng('80.2180');
                    setLocAreaName('Velachery South');
                  }}
                  className="p-2 rounded bg-slate-900 border border-slate-700 hover:border-cyan-400 text-left text-slate-200"
                >
                  <div className="font-bold">Velachery MRTS</div>
                  <div className="text-[10px] text-slate-400 font-mono">12.9780, 80.2180</div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400">Latitude</label>
                <input
                  type="text"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  className="w-full p-2 rounded bg-slate-900 border border-slate-800 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Longitude</label>
                <input
                  type="text"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                  className="w-full p-2 rounded bg-slate-900 border border-slate-800 text-white font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400">Area Name</label>
              <input
                type="text"
                value={locAreaName}
                onChange={(e) => setLocAreaName(e.target.value)}
                className="w-full p-2 rounded bg-slate-900 border border-slate-800 text-white text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setLocModalIncident(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignCoordinates}
                className="px-4 py-1.5 text-xs font-bold rounded bg-orange-600 hover:bg-orange-500 text-white transition shadow"
              >
                Confirm & Plot on Tactical Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incident Dossier Detail Modal */}
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

      {/* Tactical Dispatch Modal */}
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
