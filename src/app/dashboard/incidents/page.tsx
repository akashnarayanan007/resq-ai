'use client';

import React, { useState, useEffect } from 'react';
import DashboardHeader from '@/components/layout/DashboardHeader';
import IncidentDetailModal from '@/components/modals/IncidentDetailModal';
import DispatchModal from '@/components/modals/DispatchModal';
import { incidentRepository } from '@/services/repository/IncidentRepository';
import { teamRepository } from '@/services/repository/TeamRepository';
import { Incident, ResponderTeam, IncidentSeverity, IncidentStatus, AITriageAnalysis } from '@/types';
import {
  AlertOctagon,
  Search,
  Filter,
  Sparkles,
  Truck,
  Kanban,
  Table as TableIcon,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Droplets,
  Clock,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import {
  formatTimeAgo,
  getSeverityBadgeClass,
  getStatusBadgeClass,
  getCategoryLabel,
} from '@/lib/utils';

export default function IncidentsManagementPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [teams, setTeams] = useState<ResponderTeam[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Controls
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal selection
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const [incList, teamList] = await Promise.all([
        incidentRepository.getAll(),
        teamRepository.getAll(),
      ]);
      setIncidents(incList);
      setTeams(teamList);

      if (selectedIncident) {
        const found = incList.find((i) => i.id === selectedIncident.id);
        if (found) setSelectedIncident(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDetail = (inc: Incident) => {
    setSelectedIncident(inc);
    setIsDetailModalOpen(true);
  };

  const handleStatusChange = async (status: IncidentStatus, note?: string) => {
    if (!selectedIncident) return;
    const updated = await incidentRepository.updateStatus(
      selectedIncident.id,
      status,
      'Incident Manager Operator',
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
      'Incident Manager Operator'
    );
    setSelectedIncident(updated);
    await loadData();
  };

  const handleQuickStatusChange = async (incidentId: string, status: IncidentStatus) => {
    await incidentRepository.updateStatus(
      incidentId,
      status,
      'Incident Manager Kanban'
    );
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
      'Incident Management Dispatch',
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

  // Filtered dataset
  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      searchTerm === '' ||
      inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.location.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === 'all' || inc.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const statuses: IncidentStatus[] = ['reported', 'triaged', 'dispatched', 'in_progress', 'resolved'];

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-[#080F23] text-[#F8FAFF]">
      <DashboardHeader
        title="Disaster Incident Matrix"
        subtitle="Manage life-critical emergencies, AI triage assignments, and operational resolutions"
        activeCount={incidents.filter((i) => i.status !== 'resolved').length}
        criticalCount={incidents.filter((i) => i.severity === 'critical' && i.status !== 'resolved').length}
        onSearchChange={setSearchTerm}
      />

      <div className="p-4 sm:p-6 space-y-5 flex-1">
        {/* Controls Bar: Filters & View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#101C35] border border-[#1E2E4E] shadow-lg">
          <div className="flex flex-wrap items-center gap-3">
            {/* Severity Filter */}
            <div className="flex items-center gap-1.5 text-xs text-[#A5B4D0]">
              <span className="text-slate-400 font-mono">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="p-1.5 rounded-xl bg-[#080F23] border border-[#1E2E4E] text-xs text-white focus:outline-none focus:border-[#00D9FF]"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical Only</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-[#A5B4D0]">
              <span className="text-slate-400 font-mono">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-1.5 rounded-xl bg-[#080F23] border border-[#1E2E4E] text-xs text-white focus:outline-none focus:border-[#00D9FF]"
              >
                <option value="all">All Statuses</option>
                <option value="reported">Reported</option>
                <option value="triaged">Triaged</option>
                <option value="dispatched">Dispatched</option>
                <option value="in_progress">In-Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#080F23] border border-[#1E2E4E] rounded-xl p-1 text-xs">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition font-semibold ${viewMode === 'table'
                  ? 'bg-[#246BFD] text-white shadow'
                  : 'text-[#A5B4D0] hover:text-white'
                  }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                Table View
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition font-semibold ${viewMode === 'kanban'
                  ? 'bg-[#246BFD] text-white shadow'
                  : 'text-[#A5B4D0] hover:text-white'
                  }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                Kanban Board
              </button>
            </div>

            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-[#080F23] border border-[#1E2E4E] text-[#A5B4D0] hover:text-white transition active:scale-95"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-[#00D9FF]" />
            </button>
          </div>
        </div>

        {/* View Mode 1: Table View */}
        {viewMode === 'table' && (
          <div className="rounded-2xl bg-[#101C35] border border-[#1E2E4E] shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#A5B4D0]">
                <thead className="bg-[#080F23] text-cyan-400 uppercase font-mono text-[11px] border-b border-[#1E2E4E]">
                  <tr>
                    <th className="p-4">Incident ID</th>
                    <th className="p-4">Title & Distress Summary</th>
                    <th className="p-4">Area & Depth</th>
                    <th className="p-4">AI Priority</th>
                    <th className="p-4">Assigned Unit</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2E4E]">
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-500">
                        No incidents match the applied filters.
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map((inc) => (
                      <tr
                        key={inc.id}
                        onClick={() => handleOpenDetail(inc)}
                        className="hover:bg-slate-900/60 cursor-pointer transition"
                      >
                        <td className="p-4 font-mono font-bold text-slate-300">
                          <div className="flex flex-col">
                            <span>{inc.id}</span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              {formatTimeAgo(inc.reportedAt)}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 max-w-sm">
                          <div className="font-bold text-slate-100 leading-snug line-clamp-1">
                            {inc.title}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {inc.description}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-full border uppercase tracking-wider ${getSeverityBadgeClass(
                                inc.severity
                              )}`}
                            >
                              {inc.severity}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {inc.reporter.citizenCount} people •{' '}
                              {inc.reporter.hasChildrenOrElderly ? '⚠️ Vulnerable' : 'Adults'}
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold text-slate-200">{inc.location.area}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">
                            {inc.location.address}
                          </div>
                          {inc.location.waterLevelFt && (
                            <span className="text-[10px] text-cyan-400 font-mono">
                              🌊 {inc.location.waterLevelFt} ft depth
                            </span>
                          )}
                        </td>

                        <td className="p-4">
                          {inc.aiTriage ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 font-mono font-bold text-amber-300">
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                <span>{inc.aiTriage.priorityScore}/100</span>
                              </div>
                              <div className="text-[10px] text-slate-400 line-clamp-1">
                                {inc.aiTriage.urgencySummary}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">Pending AI</span>
                          )}
                        </td>

                        <td className="p-4">
                          {inc.assignedTeamName ? (
                            <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
                              <Truck className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="line-clamp-1">{inc.assignedTeamName}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-400/80 italic">Unassigned</span>
                          )}
                        </td>

                        <td className="p-4">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${getStatusBadgeClass(
                              inc.status
                            )}`}
                          >
                            {inc.status.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(inc);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View Mode 2: Kanban Columns Board */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
            {statuses.map((status) => {
              const columnIncidents = filteredIncidents.filter((i) => i.status === status);
              return (
                <div
                  key={status}
                  className="rounded-xl bg-[#0B1120] border border-slate-800 flex flex-col min-h-[500px]"
                >
                  {/* Column Header */}
                  <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                    <span className="font-mono text-xs font-bold uppercase text-slate-300">
                      {status.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.2 rounded-full bg-slate-800 text-slate-300">
                      {columnIncidents.length}
                    </span>
                  </div>

                  {/* Cards container */}
                  <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto">
                    {columnIncidents.map((inc) => (
                      <div
                        key={inc.id}
                        onClick={() => handleOpenDetail(inc)}
                        className="p-3 rounded-lg bg-slate-900 border border-slate-800/90 hover:border-slate-700 cursor-pointer transition space-y-2 group shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-slate-400 font-bold">
                            {inc.id}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full border uppercase ${getSeverityBadgeClass(
                              inc.severity
                            )}`}
                          >
                            {inc.severity}
                          </span>
                        </div>

                        <div className="font-bold text-xs text-slate-100 leading-tight line-clamp-2">
                          {inc.title}
                        </div>

                        <div className="text-[10px] text-slate-400 flex justify-between">
                          <span>{inc.location.area}</span>
                          {inc.location.waterLevelFt && (
                            <span className="text-cyan-400 font-mono">
                              🌊 {inc.location.waterLevelFt}ft
                            </span>
                          )}
                        </div>

                        {inc.aiTriage && (
                          <div className="text-[9px] bg-slate-950 p-1 rounded border border-slate-800 text-amber-300 font-mono flex items-center justify-between">
                            <span>Score:</span>
                            <span className="font-bold">{inc.aiTriage.priorityScore}/100</span>
                          </div>
                        )}

                        {/* Quick Kanban Action Dropdown */}
                        <div
                          className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-slate-500 font-mono">Move:</span>
                          <select
                            value={inc.status}
                            onChange={(e) =>
                              handleQuickStatusChange(inc.id, e.target.value as IncidentStatus)
                            }
                            className="bg-slate-950 border border-slate-800 text-slate-300 rounded text-[10px] px-1 py-0.5"
                          >
                            {statuses.map((s) => (
                              <option key={s} value={s}>
                                {s.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
