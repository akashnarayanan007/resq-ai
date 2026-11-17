'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PinPicker from '@/components/map/PinPicker';
import { incidentRepository } from '@/services/repository/IncidentRepository';
import {
  sosInputSchema,
  calculatePreliminaryUrgency,
  CHENNAI_GEO_BOUNDS,
} from '@/lib/validations/sosSchema';
import { Incident, IncidentCategory, IncidentSeverity, AccessibilityNeeds } from '@/types';
import {
  LifeBuoy,
  MapPin,
  Camera,
  AlertTriangle,
  Users,
  Droplets,
  HeartPulse,
  Baby,
  Ship,
  Sparkles,
  CheckCircle2,
  PhoneCall,
  ArrowLeft,
  Loader2,
  Shield,
  Clock,
  Compass,
  Lock,
  Search,
  ExternalLink,
  ChevronRight,
  Accessibility,
  EyeOff,
  Radio,
  XCircle,
} from 'lucide-react';
import {
  formatTimeAgo,
  getSeverityBadgeClass,
  getStatusBadgeClass,
  getStatusLabel,
  getCategoryLabel,
} from '@/lib/utils';

const CHENNAI_VERIFIED_LOCALITIES = [
  { area: 'Velachery', address: 'Ram Nagar South 3rd Cross, Velachery', lat: 12.9815, lng: 80.218 },
  { area: 'Madipakkam', address: 'Kuberan Nagar Main Road, Madipakkam', lat: 12.9645, lng: 80.1985 },
  { area: 'Tambaram West', address: 'Mudichur Road, Tambaram West', lat: 12.925, lng: 80.119 },
  { area: 'Saidapet', address: 'Maraimalai Adigal Bridge, Saidapet', lat: 13.021, lng: 80.223 },
  { area: 'Kotturpuram / Adyar', address: 'Riverside Settlement, Kotturpuram', lat: 13.018, lng: 80.242 },
  { area: 'Sholinganallur', address: 'Semmancheri Tsunami Quarters, OMR', lat: 12.871, lng: 80.222 },
  { area: 'Pallikaranai', address: '200 Feet Radial Road, Pallikaranai', lat: 12.938, lng: 80.215 },
  { area: 'Mylapore', address: 'Kutchery Road, Luz Corner, Mylapore', lat: 13.036, lng: 80.267 },
  { area: 'Ennore', address: 'Expressway Bund, Ennore Creek', lat: 13.205, lng: 80.32 },
  { area: 'Perungudi', address: 'Kallukuttai Railway Colony, Perungudi', lat: 12.968, lng: 80.245 },
];

function SOSPortalContent() {
  const searchParams = useSearchParams();
  const initialTrackId = searchParams?.get('track') || '';

  // Mode: Report SOS or Track Status
  const [activeTab, setActiveTab] = useState<'report' | 'track'>(initialTrackId ? 'track' : 'report');

  // Form State
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('flood_water');
  const [locationMode, setLocationMode] = useState<'manual' | 'pin'>('manual');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [lat, setLat] = useState<number>(12.9815);
  const [lng, setLng] = useState<number>(80.218);
  const [waterLevelFt, setWaterLevelFt] = useState<number>(3);
  const [citizenCount, setCitizenCount] = useState<number>(2);

  // Optional Contact & Privacy
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [isPrivateContact, setIsPrivateContact] = useState(false);

  // Accessibility & Vulnerabilities
  const [needsBoat, setNeedsBoat] = useState(false);
  const [needsMedical, setNeedsMedical] = useState(false);
  const [accessibility, setAccessibility] = useState<AccessibilityNeeds>({
    elderly: false,
    infants: false,
    mobilityImpaired: false,
    medicalDependency: false,
    pregnancy: false,
    hearingVisionImpaired: false,
    details: '',
  });

  // Photo
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Errors & Processing
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedIncident, setSubmittedIncident] = useState<Incident | null>(null);

  // Status Tracking Lookup
  const [trackQueryId, setTrackQueryId] = useState(initialTrackId);
  const [trackedIncident, setTrackedIncident] = useState<Incident | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  // If initial track ID provided in URL, perform lookup
  useEffect(() => {
    if (initialTrackId) {
      handleLookupTrackId(initialTrackId);
    }
  }, [initialTrackId]);

  // Quick preset loader
  const handleApplyPreset = (preset: (typeof CHENNAI_VERIFIED_LOCALITIES)[0]) => {
    setArea(preset.area);
    setAddress(preset.address);
    setLat(preset.lat);
    setLng(preset.lng);
    setValidationErrors((prev) => {
      const copy = { ...prev };
      delete copy.address;
      delete copy.area;
      delete copy.lat;
      delete copy.lng;
      return copy;
    });
  };

  const handlePinChange = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    setValidationErrors((prev) => {
      const copy = { ...prev };
      delete copy.lat;
      delete copy.lng;
      return copy;
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Handler with Strict Zod Validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // 1. Zod Validation Check
    const parseResult = sosInputSchema.safeParse({
      description,
      category,
      address,
      area,
      landmark: landmark || undefined,
      lat,
      lng,
      waterLevelFt,
      citizenCount,
      reporterName: reporterName || undefined,
      reporterPhone: reporterPhone || undefined,
      isPrivateContact,
      needsBoat,
      needsMedical,
      accessibilityNeeds: accessibility,
    });

    if (!parseResult.success) {
      const errMap: Record<string, string> = {};
      parseResult.error.errors.forEach((err) => {
        const field = err.path.join('.');
        errMap[field] = err.message;
      });
      setValidationErrors(errMap);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    const validatedData = parseResult.data;
    setSubmitting(true);

    try {
      // 2. Compute Preliminary Urgency Category
      const preliminaryUrgency = calculatePreliminaryUrgency({
        category: validatedData.category,
        waterLevelFt: validatedData.waterLevelFt,
        citizenCount: validatedData.citizenCount,
        needsMedical: validatedData.needsMedical,
        needsBoat: validatedData.needsBoat,
        accessibilityNeeds: validatedData.accessibilityNeeds,
      });

      // 3. Optional AI Triage assist
      let aiTriage = undefined;
      try {
        const aiRes = await fetch('/api/ai/triage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: validatedData.description,
            category: validatedData.category,
            waterLevelFt: validatedData.waterLevelFt,
            citizenCount: validatedData.citizenCount,
            hasChildrenOrElderly:
              Boolean(validatedData.accessibilityNeeds?.elderly) ||
              Boolean(validatedData.accessibilityNeeds?.infants),
            needsBoat: validatedData.needsBoat,
            needsMedical: validatedData.needsMedical,
            location: `${validatedData.address}, ${validatedData.area}`,
          }),
        });
        if (aiRes.ok) {
          aiTriage = await aiRes.json();
        }
      } catch (aiErr) {
        console.warn('AI Triage error fallback', aiErr);
      }

      // 4. Save into LocalStorage Repository with status=pending & preliminary urgency
      const newIncident = await incidentRepository.create({
        title: `${getCategoryLabel(validatedData.category)} at ${validatedData.area}`,
        description: validatedData.description,
        category: validatedData.category,
        severity: preliminaryUrgency,
        preliminaryUrgency,
        status: 'pending', // Starts strictly as pending
        location: {
          address: validatedData.address,
          area: validatedData.area,
          landmark: validatedData.landmark || '',
          lat: validatedData.lat,
          lng: validatedData.lng,
          waterLevelFt: validatedData.waterLevelFt,
        },
        reporter: {
          name: validatedData.isPrivateContact
            ? 'Private Citizen'
            : validatedData.reporterName || 'Anonymous Citizen',
          phone: validatedData.reporterPhone || '',
          citizenCount: validatedData.citizenCount,
          hasChildrenOrElderly:
            Boolean(validatedData.accessibilityNeeds?.elderly) ||
            Boolean(validatedData.accessibilityNeeds?.infants),
          needsBoat: validatedData.needsBoat,
          needsMedical: validatedData.needsMedical,
          isPrivateContact: validatedData.isPrivateContact,
          accessibilityNeeds: validatedData.accessibilityNeeds,
          deviceBatteryPercent: 85,
        },
        accessibilityNeeds: validatedData.accessibilityNeeds,
        aiTriage,
        photoUrl: photoPreview || undefined,
      });

      setSubmittedIncident(newIncident);
      setTrackedIncident(newIncident);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to create incident:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Lookup existing incident for tracking
  const handleLookupTrackId = async (idToLook: string) => {
    const trimmed = idToLook.trim();
    if (!trimmed) return;
    setTrackLoading(true);
    setTrackError(null);
    try {
      const found = await incidentRepository.getById(trimmed);
      if (found) {
        setTrackedIncident(found);
      } else {
        setTrackedIncident(null);
        setTrackError(`No incident found with ID "${trimmed}". Please double-check the tracking code.`);
      }
    } catch (err) {
      setTrackError('Failed to query status. Please try again.');
    } finally {
      setTrackLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070C18] text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto w-full">
        {/* Navigation bar */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <span>Command Center</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Portal Header Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950 via-rose-950 to-amber-950 border border-red-700/60 shadow-2xl mb-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-red-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-red-950/60 shrink-0 animate-pulse">
                SOS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black text-white">CITIZEN DISTRESS INTAKE</h1>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/50">
                    DIRECT DISPATCH
                  </span>
                </div>
                <p className="text-xs text-red-200/90 mt-0.5">
                  Priority life-safety reporting with validation, GPS latching & immediate status tracking.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mode Selector: Report Distress vs Track Status */}
        <div className="flex rounded-xl bg-[#0B1120] border border-slate-800 p-1 mb-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition ${
              activeTab === 'report'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            Submit Distress Report
          </button>
          <button
            onClick={() => setActiveTab('track')}
            className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition ${
              activeTab === 'track'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Track Incident Status
            {submittedIncident && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* SUBMISSION CONFIRMATION VIEW */}
        {submittedIncident && activeTab === 'report' ? (
          <div className="p-6 rounded-2xl bg-[#0B1120] border border-emerald-500/50 shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Distress Beacon Broadcasted!</h2>
              <p className="text-xs text-slate-300">
                Your emergency report has been saved to the coordination repository with initial status{' '}
                <strong className="text-yellow-300 uppercase font-mono">PENDING</strong>.
              </p>
            </div>

            {/* Tracking ID Badge */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">INCIDENT ID:</span>
                <span className="text-red-400 font-bold text-base tracking-wider">
                  {submittedIncident.id}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">CURRENT STATUS:</span>
                <span className="text-yellow-400 uppercase font-bold">
                  {getStatusLabel(submittedIncident.status)}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">PRELIMINARY URGENCY:</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border uppercase ${getSeverityBadgeClass(
                    submittedIncident.preliminaryUrgency || submittedIncident.severity
                  )}`}
                >
                  {submittedIncident.preliminaryUrgency || submittedIncident.severity}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">LOCATION PIN:</span>
                <span className="text-slate-200">
                  {submittedIncident.location.area} ({submittedIncident.location.lat.toFixed(4)},{' '}
                  {submittedIncident.location.lng.toFixed(4)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PEOPLE REPORTED:</span>
                <span className="text-white font-bold">{submittedIncident.reporter.citizenCount} Persons</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => {
                  setTrackQueryId(submittedIncident.id);
                  setActiveTab('track');
                }}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
              >
                <Search className="w-4 h-4" />
                <span>Open Live Track-Status View</span>
              </button>

              <Link
                href="/dashboard"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition"
              >
                <span>View on Rescue Dashboard Matrix</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setSubmittedIncident(null);
                  setDescription('');
                  setAddress('');
                  setArea('');
                  setLandmark('');
                  setPhotoPreview(null);
                }}
                className="w-full py-2 text-xs text-slate-400 hover:text-white text-center transition"
              >
                Submit another incident &rarr;
              </button>
            </div>
          </div>
        ) : activeTab === 'track' ? (
          /* LIVE TRACK-STATUS VIEW */
          <div className="p-6 rounded-2xl bg-[#0B1120] border border-slate-800 shadow-2xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-400" />
                <span>Track Emergency Incident Progress</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your unique incident ID (e.g. <code className="text-blue-300">INC-CHN-4091</code>) to inspect live triage and dispatch state.
              </p>
            </div>

            {/* Search Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookupTrackId(trackQueryId);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="INC-CHN-XXXX"
                value={trackQueryId}
                onChange={(e) => setTrackQueryId(e.target.value.toUpperCase())}
                className="flex-1 p-3 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 uppercase font-mono tracking-wider focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={trackLoading || !trackQueryId.trim()}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition disabled:opacity-50"
              >
                {trackLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Track</span>
              </button>
            </form>

            {trackError && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{trackError}</span>
              </div>
            )}

            {trackedIncident && (
              <div className="space-y-5 border-t border-slate-800 pt-5">
                {/* Status Stepper Progression */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {trackedIncident.id}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${getStatusBadgeClass(
                        trackedIncident.status
                      )}`}
                    >
                      {getStatusLabel(trackedIncident.status)}
                    </span>
                  </div>

                  {/* Status Progression Bar */}
                  <div className="py-2">
                    <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                      {[
                        { key: 'pending', label: 'Pending' },
                        { key: 'under_review', label: 'Under Review' },
                        { key: 'assigned', label: 'Assigned' },
                        { key: 'in_progress', label: 'In Progress' },
                        { key: 'resolved', label: 'Resolved' },
                      ].map((step, idx) => {
                        const statusOrder = ['pending', 'under_review', 'assigned', 'in_progress', 'resolved'];
                        const currentIdx = statusOrder.indexOf(
                          trackedIncident.status === 'reported'
                            ? 'pending'
                            : trackedIncident.status === 'triaged'
                            ? 'under_review'
                            : trackedIncident.status === 'dispatched'
                            ? 'assigned'
                            : trackedIncident.status
                        );
                        const isReached = currentIdx >= idx;
                        const isCurrent = currentIdx === idx;
                        const isInvalid = trackedIncident.status === 'invalid';

                        return (
                          <div key={step.key} className="flex flex-col items-center flex-1">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition ${
                                isInvalid
                                  ? 'bg-rose-950 border-rose-800 text-rose-400'
                                  : isCurrent
                                  ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/50 animate-pulse'
                                  : isReached
                                  ? 'bg-emerald-600 border-emerald-400 text-white'
                                  : 'bg-slate-800 border-slate-700 text-slate-500'
                              }`}
                            >
                              {idx + 1}
                            </div>
                            <span
                              className={`text-[9px] mt-1 text-center ${
                                isCurrent ? 'text-blue-300 font-bold' : isReached ? 'text-slate-300' : 'text-slate-600'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {trackedIncident.status === 'invalid' && (
                    <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-rose-300">
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>Closed as Invalid / False Alarm</span>
                      </div>
                      <p className="text-[11px] text-rose-300/90">
                        Reason: {trackedIncident.closureReason || 'No closure note provided'}
                      </p>
                    </div>
                  )}

                  {trackedIncident.assignedTeamName && (
                    <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-xs flex items-center justify-between">
                      <span className="text-slate-300">Dispatched Response Unit:</span>
                      <span className="font-bold text-cyan-300">{trackedIncident.assignedTeamName}</span>
                    </div>
                  )}
                </div>

                {/* Details Breakdown */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                  <div className="font-semibold text-slate-200">{trackedIncident.title}</div>
                  <p className="text-slate-400 text-[11px]">{trackedIncident.description}</p>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                    <div>
                      <span className="text-slate-500">Location:</span>{' '}
                      <span className="text-slate-300">
                        {trackedIncident.location.address}, {trackedIncident.location.area}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Urgency:</span>{' '}
                      <span className="text-amber-300 font-bold uppercase">
                        {trackedIncident.preliminaryUrgency || trackedIncident.severity}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">People Trapped:</span>{' '}
                      <span className="text-slate-300">{trackedIncident.reporter.citizenCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Reported:</span>{' '}
                      <span className="text-slate-300">{formatTimeAgo(trackedIncident.reportedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Live Audit Trail */}
                <div className="space-y-2">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                    Incident Audit History
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {trackedIncident.timeline.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-0.5"
                      >
                        <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                          <span>{entry.actor}</span>
                          <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="font-semibold text-slate-200">{entry.action}</div>
                        {entry.note && <div className="text-slate-400 text-[10px]">{entry.note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* SOS REPORT INTAKE FORM */
          <form
            onSubmit={handleSubmit}
            className="p-6 rounded-2xl bg-[#0B1120] border border-slate-800 shadow-2xl space-y-6"
          >
            {/* Global validation error banner if any */}
            {Object.keys(validationErrors).length > 0 && (
              <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-700/80 text-rose-200 text-xs space-y-1.5 animate-in fade-in">
                <div className="font-bold flex items-center gap-2 text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Please resolve the following required fields:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-300/90 pl-1">
                  {Object.entries(validationErrors).map(([key, msg]) => (
                    <li key={key}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 1. Emergency Category / Type */}
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                1. Nature of Emergency <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'flood_water', label: 'Flood Inundation', icon: Droplets },
                  { id: 'elderly_infant_stranded', label: 'Infant / Senior Trap', icon: Baby },
                  { id: 'medical_critical', label: 'Critical Medical', icon: HeartPulse },
                  { id: 'power_hazard', label: 'Live Wire / Power Hazard', icon: AlertTriangle },
                  { id: 'structural_collapse', label: 'Building Breach', icon: Shield },
                  { id: 'food_water_supply', label: 'Food / Water Depleted', icon: Users },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = category === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setCategory(item.id as IncidentCategory)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1 transition ${
                        isSelected
                          ? 'bg-red-950/70 border-red-500 text-white shadow-md shadow-red-950/40'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-red-400' : 'text-slate-500'}`} />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Emergency Description */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                  2. Emergency Description <span className="text-red-400">*</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Min 10 characters</span>
              </div>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe current situation: e.g. Water reached stairs, infant needs milk, power line broke in front of house, pregnant woman in labor..."
                className={`w-full p-3 text-xs bg-slate-900 border rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none ${
                  validationErrors.description
                    ? 'border-rose-500 focus:border-rose-500'
                    : 'border-slate-800 focus:border-red-500'
                }`}
              />
              {validationErrors.description && (
                <p className="text-[11px] text-rose-400 mt-1">{validationErrors.description}</p>
              )}
            </div>

            {/* 3. Manually Entered Location or Map Pin */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  3. Location (Manual Address or Map Pin) <span className="text-red-400">*</span>
                </label>

                {/* Location Input Mode Switcher */}
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setLocationMode('manual')}
                    className={`px-3 py-1 rounded text-[11px] font-medium transition ${
                      locationMode === 'manual'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Manual Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationMode('pin')}
                    className={`px-3 py-1 rounded text-[11px] font-medium transition ${
                      locationMode === 'pin'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Interactive Map Pin
                  </button>
                </div>
              </div>

              {/* Verified Chennai Quick Presets */}
              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">
                  Or select a known Chennai flood sector:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {CHENNAI_VERIFIED_LOCALITIES.map((loc) => (
                    <button
                      type="button"
                      key={loc.area}
                      onClick={() => handleApplyPreset(loc)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition ${
                        area === loc.area
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-200 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {loc.area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pin Mode View */}
              {locationMode === 'pin' && (
                <div className="space-y-2">
                  <span className="text-[11px] text-slate-400">
                    Click or drag the pin to mark your exact physical coordinates in Chennai:
                  </span>
                  <PinPicker lat={lat} lng={lng} onChange={handlePinChange} />
                  {(validationErrors.lat || validationErrors.lng) && (
                    <p className="text-[11px] text-rose-400">
                      {validationErrors.lat || validationErrors.lng}
                    </p>
                  )}
                </div>
              )}

              {/* Address & Area Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Area / Locality <span className="text-red-400">*</span>:
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Velachery / Tambaram"
                    className={`w-full p-2.5 text-xs bg-slate-950 border rounded-lg text-slate-200 focus:outline-none ${
                      validationErrors.area ? 'border-rose-500' : 'border-slate-800 focus:border-blue-500'
                    }`}
                  />
                  {validationErrors.area && (
                    <p className="text-[10px] text-rose-400 mt-0.5">{validationErrors.area}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    Street Address / House No. <span className="text-red-400">*</span>:
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Plot 48, Ram Nagar South 3rd Cross Street"
                    className={`w-full p-2.5 text-xs bg-slate-950 border rounded-lg text-slate-200 focus:outline-none ${
                      validationErrors.address ? 'border-rose-500' : 'border-slate-800 focus:border-blue-500'
                    }`}
                  />
                  {validationErrors.address && (
                    <p className="text-[10px] text-rose-400 mt-0.5">{validationErrors.address}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">
                  Landmark / Entrance Gate (Optional):
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Opposite MRTS Pillar 140 or Sunshine School"
                  className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Coordinates info pill */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono bg-slate-950 p-2 rounded border border-slate-800">
                <span>Coordinates:</span>
                <span className="text-cyan-400">
                  Lat: {lat.toFixed(4)}, Lng: {lng.toFixed(4)}
                </span>
              </div>
            </div>

            {/* 4. Number of People Affected & Water Depth */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">
                    Number of People Affected <span className="text-red-400">*</span>:
                  </span>
                  <span className="font-mono text-white font-bold text-sm">{citizenCount} Persons</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={citizenCount}
                  onChange={(e) => setCitizenCount(Number(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1 person</span>
                  <span>Family (4-6)</span>
                  <span>Group (20+)</span>
                </div>
                {validationErrors.citizenCount && (
                  <p className="text-[10px] text-rose-400">{validationErrors.citizenCount}</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Estimated Water Depth:</span>
                  <span className="font-mono text-cyan-400 font-bold text-sm">{waterLevelFt} Feet</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.5"
                  value={waterLevelFt}
                  onChange={(e) => setWaterLevelFt(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Ankle (1ft)</span>
                  <span>Waist (3-4ft)</span>
                  <span>Submerged (6ft+)</span>
                </div>
              </div>
            </div>

            {/* 5. Optional Vulnerability & Accessibility Needs */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Accessibility className="w-3.5 h-3.5 text-purple-400" />
                  <span>Vulnerability & Accessibility Needs (Optional)</span>
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <label className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 cursor-pointer hover:border-slate-700 transition">
                  <input
                    type="checkbox"
                    checked={accessibility.elderly}
                    onChange={(e) => setAccessibility({ ...accessibility, elderly: e.target.checked })}
                    className="w-3.5 h-3.5 accent-purple-600 rounded"
                  />
                  <span className="text-[11px] text-slate-300">Elderly Citizen</span>
                </label>

                <label className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 cursor-pointer hover:border-slate-700 transition">
                  <input
                    type="checkbox"
                    checked={accessibility.infants}
                    onChange={(e) => setAccessibility({ ...accessibility, infants: e.target.checked })}
                    className="w-3.5 h-3.5 accent-purple-600 rounded"
                  />
                  <span className="text-[11px] text-slate-300">Infants / Children</span>
                </label>

                <label className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 cursor-pointer hover:border-slate-700 transition">
                  <input
                    type="checkbox"
                    checked={accessibility.mobilityImpaired}
                    onChange={(e) =>
                      setAccessibility({ ...accessibility, mobilityImpaired: e.target.checked })
                    }
                    className="w-3.5 h-3.5 accent-purple-600 rounded"
                  />
                  <span className="text-[11px] text-slate-300">Mobility / Wheelchair</span>
                </label>

                <label className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 cursor-pointer hover:border-slate-700 transition">
                  <input
                    type="checkbox"
                    checked={accessibility.medicalDependency}
                    onChange={(e) =>
                      setAccessibility({ ...accessibility, medicalDependency: e.target.checked })
                    }
                    className="w-3.5 h-3.5 accent-purple-600 rounded"
                  />
                  <span className="text-[11px] text-slate-300">Oxygen / Dialysis</span>
                </label>

                <label className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 cursor-pointer hover:border-slate-700 transition">
                  <input
                    type="checkbox"
                    checked={accessibility.pregnancy}
                    onChange={(e) =>
                      setAccessibility({ ...accessibility, pregnancy: e.target.checked })
                    }
                    className="w-3.5 h-3.5 accent-purple-600 rounded"
                  />
                  <span className="text-[11px] text-slate-300">Pregnant Woman</span>
                </label>

                <label className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 cursor-pointer hover:border-slate-700 transition">
                  <input
                    type="checkbox"
                    checked={accessibility.hearingVisionImpaired}
                    onChange={(e) =>
                      setAccessibility({ ...accessibility, hearingVisionImpaired: e.target.checked })
                    }
                    className="w-3.5 h-3.5 accent-purple-600 rounded"
                  />
                  <span className="text-[11px] text-slate-300">Hearing / Vision</span>
                </label>
              </div>

              {/* Critical equipment toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <label className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needsBoat}
                    onChange={(e) => setNeedsBoat(e.target.checked)}
                    className="w-3.5 h-3.5 accent-cyan-500 rounded"
                  />
                  <span className="text-xs text-cyan-200 font-medium">Rescue Boat Required</span>
                </label>

                <label className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needsMedical}
                    onChange={(e) => setNeedsMedical(e.target.checked)}
                    className="w-3.5 h-3.5 accent-amber-500 rounded"
                  />
                  <span className="text-xs text-amber-200 font-medium">Urgent Paramedic Required</span>
                </label>
              </div>

              <div>
                <input
                  type="text"
                  value={accessibility.details || ''}
                  onChange={(e) => setAccessibility({ ...accessibility, details: e.target.value })}
                  placeholder="Additional accessibility or medical notes (e.g. insulin storage, stroke patient)"
                  className="w-full p-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* 6. Optional Private Contact Details */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Contact Details (Optional & Private)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Name (Optional):</label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Citizen / Caller Name"
                    className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Phone Number (Optional):</label>
                  <input
                    type="tel"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    placeholder="+91 98401 XXXXX"
                    className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivateContact}
                  onChange={(e) => setIsPrivateContact(e.target.checked)}
                  className="w-3.5 h-3.5 accent-blue-600 rounded"
                />
                <span>Keep contact private (viewable only by verified command dispatchers)</span>
              </label>
            </div>

            {/* 7. Optional Photo Upload */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Attach Photo (Optional):</label>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 cursor-pointer">
                  <Camera className="w-4 h-4 text-slate-400" />
                  <span>Choose Photo</span>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
                {photoPreview && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Photo Attached
                  </span>
                )}
              </div>
            </div>

            {/* Submit SOS Beacon Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm tracking-wide shadow-xl shadow-red-950/60 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validating & Broadcasting Distress Beacon...</span>
                  </>
                ) : (
                  <>
                    <LifeBuoy className="w-4 h-4" />
                    <span>BROADCAST EMERGENCY SOS BEACON (STATUS: PENDING)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function SOSPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070C18] flex items-center justify-center text-slate-400 gap-2 font-mono text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-red-500" />
          <span>Loading Citizen Distress Portal...</span>
        </div>
      }
    >
      <SOSPortalContent />
    </Suspense>
  );
}
