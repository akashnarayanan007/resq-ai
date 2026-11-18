'use client';

import React, { useState, useEffect } from 'react';
import { Incident, ResponderTeam, IncidentStatus, AITriageAnalysis, IncidentSeverity, IncidentCategory } from '@/types';
import {
  X,
  AlertTriangle,
  Bot,
  MapPin,
  Phone,
  User,
  Users,
  Clock,
  Sparkles,
  ShieldCheck,
  Send,
  Truck,
  Droplets,
  Zap,
  CheckCircle2,
  Activity,
  XCircle,
  Accessibility,
  Lock,
  ArrowRight,
  Languages,
  Edit3,
  Check,
  HelpCircle,
  Info,
} from 'lucide-react';
import {
  formatTimeAgo,
  getSeverityBadgeClass,
  getStatusBadgeClass,
  getStatusLabel,
  getCategoryLabel,
} from '@/lib/utils';

interface IncidentDetailModalProps {
  incident: Incident | null;
  teams: ResponderTeam[];
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (status: IncidentStatus, note?: string) => Promise<void>;
  onCloseAsInvalid?: (reason: string) => Promise<void>;
  onSaveAITriage?: (triage: AITriageAnalysis) => Promise<void>;
  onOpenDispatch: () => void;
  onRunAITriage: (incident: Incident) => Promise<void>;
}

export default function IncidentDetailModal({
  incident,
  teams,
  isOpen,
  onClose,
  onStatusChange,
  onCloseAsInvalid,
  onSaveAITriage,
  onOpenDispatch,
  onRunAITriage,
}: IncidentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'ai'>('overview');
  const [triageLoading, setTriageLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [customNote, setCustomNote] = useState('');

  // Invalid Closure Sub-form
  const [showInvalidForm, setShowInvalidForm] = useState(false);
  const [invalidReason, setInvalidReason] = useState('Duplicate submission');
  const [invalidCustomNote, setInvalidCustomNote] = useState('');

  // AI Edit Mode States
  const [isEditingAI, setIsEditingAI] = useState(false);
  const [editSummary, setEditSummary] = useState('');
  const [editUrgency, setEditUrgency] = useState<IncidentSeverity>('high');
  const [editScore, setEditScore] = useState<number>(80);
  const [editPeople, setEditPeople] = useState<string>('');
  const [editMissingInfo, setEditMissingInfo] = useState<string>('');

  useEffect(() => {
    if (incident?.aiTriage) {
      setEditSummary(incident.aiTriage.summary || incident.aiTriage.urgencySummary || '');
      setEditUrgency(incident.aiTriage.urgency || incident.severity || 'high');
      setEditScore(incident.aiTriage.priorityScore || 80);
      setEditPeople(incident.aiTriage.peopleAffected !== null && incident.aiTriage.peopleAffected !== undefined ? String(incident.aiTriage.peopleAffected) : '');
      setEditMissingInfo((incident.aiTriage.missingInformation || []).join('\n'));
    }
  }, [incident]);

  if (!isOpen || !incident) return null;

  const handleStatusUpdate = async (newStatus: IncidentStatus) => {
    setStatusUpdating(true);
    try {
      await onStatusChange(newStatus, customNote || undefined);
      setCustomNote('');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleConfirmInvalidClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCloseAsInvalid) return;
    setStatusUpdating(true);
    try {
      const fullReason = invalidCustomNote
        ? `${invalidReason}: ${invalidCustomNote}`
        : invalidReason;
      await onCloseAsInvalid(fullReason);
      setShowInvalidForm(false);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleTriggerAI = async () => {
    setTriageLoading(true);
    try {
      await onRunAITriage(incident);
    } finally {
      setTriageLoading(false);
    }
  };

  // Human Review Actions: Approve or Override
  const handleApproveTriage = async () => {
    if (!incident.aiTriage || !onSaveAITriage) return;
    const updatedTriage: AITriageAnalysis = {
      ...incident.aiTriage,
      humanReviewStatus: 'approved',
      reviewedBy: 'Command Center Dispatcher',
      reviewedAt: new Date().toISOString(),
    };
    await onSaveAITriage(updatedTriage);
  };

  const handleSaveOverride = async () => {
    if (!incident.aiTriage || !onSaveAITriage) return;
    const parsedPeople = editPeople.trim() === '' ? null : parseInt(editPeople, 10);
    const parsedMissing = editMissingInfo.split('\n').map((s) => s.trim()).filter(Boolean);

    const updatedTriage: AITriageAnalysis = {
      ...incident.aiTriage,
      summary: editSummary,
      urgencySummary: editSummary,
      urgency: editUrgency,
      priorityScore: editScore,
      peopleAffected: isNaN(parsedPeople as number) ? null : parsedPeople,
      missingInformation: parsedMissing,
      humanReviewStatus: 'overridden',
      humanReviewNotes: 'Manually customized and verified by Human Incident Commander',
      reviewedBy: 'Incident Commander',
      reviewedAt: new Date().toISOString(),
    };

    await onSaveAITriage(updatedTriage);
    setIsEditingAI(false);
  };

  const handleApproveAndStageDispatch = async () => {
    await handleApproveTriage();
    onOpenDispatch();
  };

  const canonicalStatuses: { key: IncidentStatus; label: string }[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
  ];

  const ai = incident.aiTriage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B1A]/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#101C35] border border-[#1E2E4E] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative text-[#F8FAFF]">
        {/* Modal Top Header */}
        <div className="p-5 border-b border-[#1E2E4E] flex items-start justify-between bg-[#080F23]">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {incident.id}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getSeverityBadgeClass(
                  incident.preliminaryUrgency || incident.severity
                )}`}
              >
                {incident.preliminaryUrgency || incident.severity}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getStatusBadgeClass(
                  incident.status
                )}`}
              >
                {getStatusLabel(incident.status)}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Reported {formatTimeAgo(incident.reportedAt)}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white pt-1">{incident.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 px-5 gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Incident Overview
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'ai'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            AI Multilingual Triage
            {ai && (
              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                {ai.priorityScore}/100
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Audit History & Trail ({incident.timeline.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Invalid closure banner if closed */}
              {incident.status === 'invalid' && (
                <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 space-y-1">
                  <div className="font-bold flex items-center gap-2 text-rose-300">
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>Incident Closed as Invalid / False Alarm</span>
                  </div>
                  <p className="text-xs text-rose-300/90">
                    Closure Reason: <strong className="text-white">{incident.closureReason || 'Marked invalid'}</strong>
                  </p>
                </div>
              )}

              {/* Description */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Distress Briefing & Description</span>
                  <span className="text-cyan-400">{getCategoryLabel(incident.category)}</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{incident.description}</p>
              </div>

              {/* Grid with Location & Citizen Reporter Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Location Card */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-semibold">
                    <MapPin className="w-4 h-4" />
                    <span>Location Coordinates</span>
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <div>
                      <strong className="text-white">Area:</strong> {incident.location.area}
                    </div>
                    <div>
                      <strong className="text-white">Address:</strong> {incident.location.address}
                    </div>
                    {incident.location.landmark && (
                      <div>
                        <strong className="text-white">Landmark:</strong> {incident.location.landmark}
                      </div>
                    )}
                    <div className="font-mono text-[11px] text-cyan-400 pt-1">
                      Coordinates: {incident.location.lat.toFixed(5)}, {incident.location.lng.toFixed(5)}
                    </div>
                    {incident.location.waterLevelFt !== undefined && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 font-mono">
                        <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Flood Height: {incident.location.waterLevelFt} Feet</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reporter & Vulnerability Card */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <User className="w-4 h-4" />
                      <span>Citizen Profile</span>
                    </div>
                    {incident.reporter.isPrivateContact && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                        <Lock className="w-3 h-3" /> Private Contact
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <div>
                      <strong className="text-white">Caller:</strong>{' '}
                      {incident.reporter.isPrivateContact ? (
                        <span className="italic text-slate-400">Protected Identity (Confidential)</span>
                      ) : (
                        incident.reporter.name || 'Anonymous Citizen'
                      )}
                    </div>
                    {incident.reporter.phone && (
                      <div className="flex items-center gap-2">
                        <strong className="text-white">Phone:</strong>
                        <a
                          href={`tel:${incident.reporter.phone}`}
                          className="font-mono text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          {incident.reporter.phone}
                        </a>
                      </div>
                    )}
                    <div>
                      <strong className="text-white">People Trapped / Affected:</strong>{' '}
                      <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-800 font-mono">
                        {incident.reporter.citizenCount} Persons
                      </span>
                    </div>

                    {/* Vulnerability & Accessibility Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {incident.reporter.needsBoat && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                          Boat Required
                        </span>
                      )}
                      {incident.reporter.needsMedical && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                          Medical Attention
                        </span>
                      )}
                      {incident.accessibilityNeeds?.elderly && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-950 text-purple-300 border border-purple-800">
                          Elderly Trapped
                        </span>
                      )}
                      {incident.accessibilityNeeds?.infants && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-950 text-rose-300 border border-rose-800">
                          Infants / Children
                        </span>
                      )}
                      {incident.accessibilityNeeds?.mobilityImpaired && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-950 text-indigo-300 border border-indigo-800">
                          Wheelchair / Mobility
                        </span>
                      )}
                      {incident.accessibilityNeeds?.medicalDependency && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-950 text-red-300 border border-red-800">
                          Oxygen / Dialysis
                        </span>
                      )}
                      {incident.accessibilityNeeds?.pregnancy && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-pink-950 text-pink-300 border border-pink-800">
                          Pregnancy
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Team Section */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    Assigned Responder Unit
                  </div>
                  {incident.assignedTeamName ? (
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-bold text-white">{incident.assignedTeamName}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-amber-400 italic">No responder unit currently assigned</div>
                  )}
                </div>

                <button
                  onClick={onOpenDispatch}
                  className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-md shadow-cyan-950/50 flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  {incident.assignedTeamName ? 'Reassign / Dispatch Unit' : 'Dispatch Response Team'}
                </button>
              </div>

              {/* Status Update Quick Bar */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Operational Status Progression
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowInvalidForm(!showInvalidForm)}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold underline flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Close as Invalid Report
                  </button>
                </div>

                {/* Canonical Statuses: Pending → Under Review → Assigned → In Progress → Resolved */}
                <div className="flex flex-wrap gap-2">
                  {canonicalStatuses.map((st) => (
                    <button
                      key={st.key}
                      disabled={statusUpdating || incident.status === st.key}
                      onClick={() => handleStatusUpdate(st.key)}
                      className={`px-3.5 py-2 rounded-lg border text-xs font-semibold capitalize transition ${
                        incident.status === st.key
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Invalid Closure Sub-form */}
                {showInvalidForm && (
                  <form
                    onSubmit={handleConfirmInvalidClosure}
                    className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 space-y-3 animate-in fade-in"
                  >
                    <div className="font-bold text-xs text-rose-200">
                      Close Incident as Invalid / False Alarm
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Select Closure Reason:</label>
                      <select
                        value={invalidReason}
                        onChange={(e) => setInvalidReason(e.target.value)}
                        className="w-full p-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
                      >
                        <option value="Duplicate submission">Duplicate submission</option>
                        <option value="False alarm / Hoax call">False alarm / Hoax call</option>
                        <option value="Outside Chennai rescue jurisdiction">Outside Chennai rescue jurisdiction</option>
                        <option value="Resolved independently before arrival">Resolved independently before arrival</option>
                        <option value="Unverifiable location / No response">Unverifiable location / No response</option>
                        <option value="Other administrative closure">Other administrative closure</option>
                      </select>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={invalidCustomNote}
                        onChange={(e) => setInvalidCustomNote(e.target.value)}
                        placeholder="Additional audit note regarding this closure..."
                        className="w-full p-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowInvalidForm(false)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={statusUpdating}
                        className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition"
                      >
                        Confirm Closure & Log Reason
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* AI TAB WITH MULTILINGUAL, EDITABLE ANALYSIS & HUMAN APPROVAL */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              {ai ? (
                <div className="space-y-4">
                  {/* Model Banner: Demo Fallback vs Live Gemini */}
                  <div
                    className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                      ai.isDemoFallback
                        ? 'bg-amber-950/30 border-amber-600/50 text-amber-200'
                        : 'bg-blue-950/30 border-blue-600/50 text-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 shrink-0 text-amber-400" />
                      <div>
                        <span className="font-mono text-xs font-bold uppercase tracking-wider">
                          {ai.isDemoFallback ? 'DEMO ANALYSIS (Simulated AI Engine)' : 'LIVE GEMINI 1.5 PRO TRIAGE'}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Engine: {ai.modelUsed} • Confidence: {(ai.triageConfidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                          ai.humanReviewStatus === 'approved'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : ai.humanReviewStatus === 'overridden'
                            ? 'bg-blue-950 text-blue-300 border-blue-800'
                            : 'bg-amber-950 text-amber-300 border-amber-800'
                        }`}
                      >
                        Human Status: {ai.humanReviewStatus || 'Pending Review'}
                      </span>
                    </div>
                  </div>

                  {/* Safety Guidance Callout */}
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>
                      <strong>Operator Guardrail:</strong> AI is an assistive decision co-pilot. Field responders are <strong>never automatically dispatched</strong> without human operator verification and authorization.
                    </span>
                  </div>

                  {/* Multilingual Text Box: Original Language & English Translation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Original Distress Message */}
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <Languages className="w-3.5 h-3.5 text-blue-400" />
                          Original Message
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-blue-300 font-bold">
                          {ai.originalLanguage || 'Detected'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-mono bg-black/40 p-2.5 rounded-lg border border-slate-800/80 max-h-28 overflow-y-auto">
                        {ai.originalText || incident.description}
                      </p>
                    </div>

                    {/* Operational English Translation */}
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          English Translation
                        </span>
                        <span className="text-[10px] text-slate-500">Standardized</span>
                      </div>
                      <p className="text-xs text-emerald-200 leading-relaxed font-mono bg-black/40 p-2.5 rounded-lg border border-slate-800/80 max-h-28 overflow-y-auto">
                        {ai.englishTranslation || incident.description}
                      </p>
                    </div>
                  </div>

                  {/* Analysis Card (View Mode or Edit Mode) */}
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-white flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Structured Urgency & Life-Safety Diagnosis</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingAI(!isEditingAI)}
                        className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 underline"
                      >
                        <Edit3 className="w-3 h-3" />
                        {isEditingAI ? 'Cancel Editing' : 'Edit Analysis'}
                      </button>
                    </div>

                    {isEditingAI ? (
                      /* EDIT MODE */
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-blue-500/50 space-y-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Situational Summary:</label>
                          <textarea
                            rows={2}
                            value={editSummary}
                            onChange={(e) => setEditSummary(e.target.value)}
                            className="w-full p-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">Urgency Tier:</label>
                            <select
                              value={editUrgency}
                              onChange={(e) => setEditUrgency(e.target.value as IncidentSeverity)}
                              className="w-full p-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                            >
                              <option value="critical">Critical</option>
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">Priority Score (0-100):</label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={editScore}
                              onChange={(e) => setEditScore(Number(e.target.value))}
                              className="w-full p-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">People Count (or leave blank):</label>
                            <input
                              type="text"
                              value={editPeople}
                              onChange={(e) => setEditPeople(e.target.value)}
                              placeholder="Unstated"
                              className="w-full p-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Missing Information Checklist (one per line):
                          </label>
                          <textarea
                            rows={2}
                            value={editMissingInfo}
                            onChange={(e) => setEditMissingInfo(e.target.value)}
                            className="w-full p-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsEditingAI(false)}
                            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveOverride}
                            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                          >
                            Save Overridden Analysis
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* VIEW MODE */
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 uppercase">Priority Rating:</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className={`text-xs px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-bold ${getSeverityBadgeClass(
                                  ai.urgency || incident.severity || 'high'
                                )}`}
                              >
                                {ai.urgency || incident.severity || 'high'}
                              </span>
                              <span className="text-xl font-extrabold text-amber-200 font-mono">
                                {ai.priorityScore} / 100
                              </span>
                            </div>
                          </div>
                          <div className="text-right text-[11px]">
                            <span className="text-slate-500">People Affected:</span>
                            <div className="font-bold text-white font-mono">
                              {ai.peopleAffected !== null && ai.peopleAffected !== undefined
                                ? `${ai.peopleAffected} Persons (Stated)`
                                : '⚠️ Not Stated in Text'}
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Situational Summary:</span>
                          <p className="text-xs text-slate-200 mt-0.5">{ai.summary || ai.urgencySummary}</p>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Triage Justification:</span>
                          <p className="text-xs text-slate-300 mt-0.5">{ai.explanation}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Location & Missing Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Location Verification */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                        Explicit Location in Text
                      </div>
                      {ai.explicitlyReportedLocation ? (
                        <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs bg-slate-950 p-2 rounded border border-slate-800">
                          <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span>{ai.explicitlyReportedLocation}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-amber-400 bg-amber-950/40 p-2 rounded border border-amber-800/40">
                          ⚠️ No specific location was mentioned in the text message. Dispatcher must request GPS or manual pin.
                        </div>
                      )}
                    </div>

                    {/* Missing Information Checklist */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="text-[11px] font-mono text-rose-400 uppercase tracking-wider font-semibold flex items-center justify-between">
                        <span>Missing Information Checklist</span>
                        <span className="text-[10px] text-slate-500 font-normal">Never Fabricated</span>
                      </div>
                      {ai.missingInformation && ai.missingInformation.length > 0 ? (
                        <ul className="space-y-1">
                          {ai.missingInformation.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-1.5 text-[11px] text-rose-300/90">
                              <HelpCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>All essential operational criteria satisfied</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vulnerabilities & Hazards Identified */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="text-[11px] font-mono text-purple-400 uppercase tracking-wider font-semibold">
                        Vulnerabilities Flagged ({ai.vulnerabilities?.length || 0})
                      </div>
                      <ul className="space-y-1">
                        {(ai.vulnerabilities || []).map((v, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                            <Accessibility className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span>{v}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="text-[11px] font-mono text-red-400 uppercase tracking-wider font-semibold">
                        Hazards Identified ({ai.hazardsIdentified?.length || 0})
                      </div>
                      <ul className="space-y-1">
                        {(ai.hazardsIdentified || []).map((h, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Uncertainty Indicators */}
                  {ai.uncertaintyIndicators && ai.uncertaintyIndicators.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-[11px]">
                      <span className="font-mono text-slate-400 uppercase text-[10px]">
                        Uncertainty & Ambiguity Indicators:
                      </span>
                      <ul className="space-y-1">
                        {ai.uncertaintyIndicators.map((u, i) => (
                          <li key={i} className="text-amber-300/80 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>{u}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* HUMAN APPROVAL & DISPATCH CONTROLS */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-blue-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Human-in-the-Loop Verification</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Status: <strong className="text-white capitalize">{ai.humanReviewStatus || 'Pending'}</strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={handleApproveTriage}
                        disabled={ai.humanReviewStatus === 'approved'}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve AI Triage</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsEditingAI(true)}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Override & Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleApproveAndStageDispatch}
                        className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-cyan-950/50"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Approve & Stage Unit Dispatch &rarr;</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 space-y-3">
                  <Bot className="w-10 h-10 mx-auto text-slate-600" />
                  <p>No AI triage analysis generated yet for this incident.</p>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleTriggerAI}
                  disabled={triageLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {triageLoading ? 'Running Gemini Multilingual AI Triage...' : 'Re-Run AI Multilingual Triage'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-3">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                Complete Audit Trail & History Log ({incident.timeline.length} Events)
              </div>
              <div className="relative border-l border-slate-800 ml-3 space-y-4 py-1">
                {incident.timeline.map((entry) => (
                  <div key={entry.id} className="relative pl-6">
                    <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-[#0B1222]" />
                    <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                      <span>{new Date(entry.timestamp).toLocaleTimeString()} ({formatTimeAgo(entry.timestamp)})</span>
                      <span className="text-blue-300 font-semibold">{entry.actor}</span>
                    </div>
                    <div className="font-semibold text-slate-200 mt-0.5 text-xs">{entry.action}</div>
                    {entry.note && (
                      <div className="text-slate-400 text-xs mt-1 bg-slate-900/60 p-2 rounded border border-slate-800/80">
                        {entry.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            SIMULATED INCIDENT • AUDIT TRAIL LOGGED
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
