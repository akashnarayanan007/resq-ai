'use client';

import React, { useState } from 'react';
import { Incident, ResponderTeam } from '@/types';
import { X, ShieldAlert, Truck, CheckCircle, Navigation, Radio } from 'lucide-react';

interface DispatchModalProps {
  incident: Incident;
  teams: ResponderTeam[];
  isOpen: boolean;
  onClose: () => void;
  onDispatch: (teamId: string, teamName: string, note: string) => Promise<void>;
}

export default function DispatchModal({
  incident,
  teams,
  isOpen,
  onClose,
  onDispatch,
}: DispatchModalProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [dispatchNote, setDispatchNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) return;

    const team = teams.find((t) => t.id === selectedTeamId);
    if (!team) return;

    setSubmitting(true);
    try {
      await onDispatch(team.id, team.name, dispatchNote || `Unit dispatched by command center to ${incident.location.area}`);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0B1222] border border-cyan-500/40 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dispatch Field Responder Unit</h3>
              <p className="text-xs text-slate-400">
                Target: <span className="text-cyan-300 font-medium">{incident.id} - {incident.location.area}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target Incident summary */}
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-1">
            <div className="font-semibold text-slate-200">{incident.title}</div>
            <div className="text-slate-400 flex items-center justify-between">
              <span>Location: {incident.location.address}</span>
              <span className="font-mono text-cyan-400">Depth: {incident.location.waterLevelFt ?? 3} ft</span>
            </div>
            {incident.aiTriage && (
              <div className="mt-1 text-[11px] text-amber-300/90 bg-amber-950/40 px-2 py-1 rounded border border-amber-800/40">
                Recommended: {incident.aiTriage.recommendedUnits.join(', ')}
              </div>
            )}
          </div>

          {/* Select team */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Available Response Unit:
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {teams.map((t) => {
                const isAvailable = t.status === 'idle' || t.status === 'on_scene';
                const isSelected = selectedTeamId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTeamId(t.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-500 shadow-md shadow-cyan-950/40'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">{t.callsign}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono uppercase bg-slate-800 text-slate-300">
                          {t.type.replace('_', ' ')}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase ${
                            t.status === 'idle'
                              ? 'bg-emerald-950 text-emerald-300'
                              : 'bg-amber-950 text-amber-300'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300">{t.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3">
                        <span>Staff: {t.personnelCount}</span>
                        <span>Fuel/Batt: {t.batteryOrFuelPercent}%</span>
                        <span>Loc: {t.currentLocation.label}</span>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-400 text-black'
                          : 'border-slate-600'
                      }`}
                    >
                      {isSelected && <CheckCircle className="w-4 h-4 fill-current text-slate-950" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tactical Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tactical Instructions & Priority Directive:
            </label>
            <textarea
              rows={2}
              value={dispatchNote}
              onChange={(e) => setDispatchNote(e.target.value)}
              placeholder="e.g. Approach from high ground via bypass road, bring infant formula & lifejackets."
              className="w-full p-2.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedTeamId || submitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-950/50"
            >
              <Navigation className="w-3.5 h-3.5" />
              {submitting ? 'Transmitting Dispatch...' : 'Confirm & Authorize Dispatch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
