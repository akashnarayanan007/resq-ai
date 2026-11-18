'use client';

import React, { useState, useMemo } from 'react';
import { Incident, ResponderTeam } from '@/types';
import {
  X,
  ShieldAlert,
  Truck,
  CheckCircle,
  Navigation,
  Radio,
  AlertTriangle,
  Award,
  Compass,
  BatteryCharging,
  Users,
  Info,
} from 'lucide-react';
import { rankTeamsForIncident, isValidCoordinate, RankedTeamResult } from '@/lib/geoUtils';

interface DispatchModalProps {
  incident: Incident;
  teams: ResponderTeam[];
  isOpen: boolean;
  onClose: () => void;
  onDispatch: (
    teamId: string,
    teamName: string,
    note: string,
    forceOverride?: boolean
  ) => Promise<void>;
}

export default function DispatchModal({
  incident,
  teams,
  isOpen,
  onClose,
  onDispatch,
}: DispatchModalProps) {
  const rankedResults = useMemo(() => {
    return rankTeamsForIncident(incident, teams);
  }, [incident, teams]);

  const defaultTeam = rankedResults[0]?.team?.id || '';
  const [selectedTeamId, setSelectedTeamId] = useState<string>(defaultTeam);
  const [dispatchNote, setDispatchNote] = useState<string>('');
  const [confirmOverride, setConfirmOverride] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronize initial selection when modal opens
  React.useEffect(() => {
    if (rankedResults.length > 0 && !selectedTeamId) {
      setSelectedTeamId(rankedResults[0].team.id);
    }
  }, [rankedResults, selectedTeamId]);

  if (!isOpen) return null;

  const selectedRanked = rankedResults.find((r) => r.team.id === selectedTeamId);
  const hasCoordinates = isValidCoordinate(incident.location?.lat, incident.location?.lng);
  const requiresOverride = Boolean(selectedRanked?.doubleAssignmentRisk);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedTeamId || !selectedRanked) {
      setErrorMessage('Please select a response team to assign.');
      return;
    }

    if (requiresOverride && !confirmOverride) {
      setErrorMessage(
        'Selected team is currently committed to another mission. Check the coordinator override box to proceed.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await onDispatch(
        selectedRanked.team.id,
        selectedRanked.team.name,
        dispatchNote.trim() ||
          `Dispatched to ${incident.id} (${incident.location.area}). Straight-line distance: ${
            selectedRanked.distanceKm ? `${selectedRanked.distanceKm} km` : 'Pending'
          }.`,
        confirmOverride
      );
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch team. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B1A]/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#101C35] border border-[#1E2E4E] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1E2E4E] flex items-center justify-between bg-[#080F23] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 border border-cyan-500/30 text-[#00D9FF]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">Tactical Dispatch & Team Assignment</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-cyan-950 border border-cyan-700/60 text-[#00D9FF]">
                  SIMULATED DISPATCH
                </span>
              </div>
              <p className="text-xs text-[#A5B4D0]">
                Target Incident: <span className="text-white font-mono font-bold">{incident.id}</span> •{' '}
                <span className="text-[#00D9FF]">{incident.location.area || 'Unknown Area'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A5B4D0] hover:text-white p-1 rounded-lg hover:bg-[#172541] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Incident Context Card */}
          <div className="p-3.5 rounded-xl bg-[#080F23] border border-[#1E2E4E] text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-white line-clamp-1">{incident.title}</span>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  incident.severity === 'critical'
                    ? 'bg-red-950 text-[#FF4D67] border border-[#FF4D67]'
                    : 'bg-amber-950 text-[#FFB547] border border-[#FFB547]'
                }`}
              >
                {incident.severity}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-300">
              <div>
                <span className="text-[#A5B4D0]">Category:</span>{' '}
                <span className="font-medium text-white">{incident.category.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-[#A5B4D0]">People:</span>{' '}
                <span className="font-bold text-white">{incident.reporter.citizenCount} affected</span>
              </div>
              <div>
                <span className="text-[#A5B4D0]">Water Depth:</span>{' '}
                <span className="font-mono text-[#00D9FF]">
                  {incident.location.waterLevelFt ? `~${incident.location.waterLevelFt} ft` : 'N/A'}
                </span>
              </div>
            </div>

            {!hasCoordinates && (
              <div className="mt-2 p-2 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Unmapped Location:</strong> Incident lacks confirmed GPS coordinates. Teams ranked primarily by specialization and baseline availability.
                </span>
              </div>
            )}
          </div>

          {/* Ranking Algorithm Explanation Banner */}
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-slate-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#00D9FF] mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-cyan-300">Algorithmic Recommendation:</span> Teams ranked by{' '}
              <strong>Specialization Fit</strong> + <strong>Unit Availability</strong> +{' '}
              <strong>Approximate straight-line distance</strong>.
              <p className="text-[10px] text-[#A5B4D0] mt-0.5 italic">
                * Note: Straight-line distances do not represent road ETA; floodwaters and submerged bridges may impede standard vehicular routes.
              </p>
            </div>
          </div>

          {/* Ranked Teams List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-200">
                Recommended Responder Units (Ranked):
              </label>
              <span className="text-[11px] font-mono text-slate-400">5 Simulated Teams</span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {rankedResults.map((result) => {
                const { team, rank, specializationFit, distanceKm, approxDistanceDisclaimer } = result;
                const isSelected = selectedTeamId === team.id;
                const isBusy = team.status !== 'idle';
                const isAssignedHere = team.assignedIncidentId === incident.id;

                return (
                  <div
                    key={team.id}
                    onClick={() => {
                      setSelectedTeamId(team.id);
                      setConfirmOverride(false);
                      setErrorMessage(null);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-500 shadow-lg shadow-cyan-950/50'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Badges & Rank */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              rank === 1
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            #{rank} {rank === 1 ? 'TOP MATCH' : 'MATCH'}
                          </span>

                          <span className="font-mono text-xs font-bold text-white tracking-wide">
                            {team.callsign}
                          </span>

                          {/* Specialization fit badge */}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                              specializationFit === 'primary'
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {specializationFit} Fit
                          </span>

                          {/* Status badge */}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${
                              team.status === 'idle'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : isAssignedHere
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {team.status === 'idle'
                              ? 'IDLE • AVAILABLE'
                              : isAssignedHere
                              ? 'ASSIGNED HERE'
                              : `${team.status.toUpperCase()} • BUSY`}
                          </span>
                        </div>

                        {/* Team Name & Specialization */}
                        <div className="text-xs font-bold text-slate-100">{team.name}</div>
                        <div className="text-[11px] text-cyan-400/90 flex items-center gap-1">
                          <Award className="w-3 h-3 shrink-0" />
                          <span>{team.specialization}</span>
                        </div>

                        {/* Recommendation Note */}
                        <div className="text-[11px] text-slate-300 bg-black/40 p-1.5 rounded border border-slate-800/80">
                          {result.recommendationReason}
                        </div>

                        {/* Explicit Distance / ETA Disclaimer */}
                        <div className="text-[10px] font-mono text-amber-300/90 flex items-center gap-1.5 pt-0.5">
                          <Compass className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{approxDistanceDisclaimer}</span>
                        </div>

                        {/* Team Specs */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-500" />
                            Personnel: <b className="text-slate-200">{team.personnelCount}</b>
                          </span>
                          <span className="flex items-center gap-1">
                            <Radio className="w-3 h-3 text-slate-500" />
                            Radio: <b className="text-slate-200">{team.radioChannel}</b>
                          </span>
                          <span className="flex items-center gap-1">
                            <BatteryCharging className="w-3 h-3 text-slate-500" />
                            Fuel: <b className="text-slate-200">{team.batteryOrFuelPercent}%</b>
                          </span>
                          <span>Base: {team.baseCoordinates?.label || team.currentLocation.label}</span>
                        </div>
                      </div>

                      {/* Selection Radio Indicator */}
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 transition ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-400 text-black'
                            : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {isSelected && <CheckCircle className="w-4 h-4 fill-current text-slate-950" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Double-Assignment Warning & Override Checkbox */}
          {requiresOverride && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-700/60 space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2 text-xs text-red-200 font-medium">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Double-Assignment Warning:</strong> This unit is currently dispatched to{' '}
                  <span className="font-bold underline text-white">
                    {selectedRanked?.conflictIncidentTitle || 'another active incident'}
                  </span>
                  . Standard operating protocol prevents concurrent assignments unless explicitly overridden by the Human Coordinator.
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white pt-1">
                <input
                  type="checkbox"
                  checked={confirmOverride}
                  onChange={(e) => setConfirmOverride(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-red-500 focus:ring-red-500 w-4 h-4"
                />
                <span>I confirm human coordinator override to re-assign this active unit</span>
              </label>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 rounded bg-red-950/80 border border-red-700 text-xs text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tactical Note */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1">
              Coordinator Directives & Navigational Notes:
            </label>
            <textarea
              rows={2}
              value={dispatchNote}
              onChange={(e) => setDispatchNote(e.target.value)}
              placeholder="e.g. Approach via Velachery MRTS elevated bypass. High-voltage line downed 200m north."
              className="w-full p-2.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Action buttons with Coordinator Confirmation */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400 hidden sm:block">
              Human Coordinator authorization strictly required.
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedTeamId || submitting || (requiresOverride && !confirmOverride)}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-950/60"
              >
                <Navigation className="w-3.5 h-3.5" />
                {submitting ? 'Transmitting Assignment...' : 'Confirm & Assign Team'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
