'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PinPicker from '@/components/map/PinPicker';
import { incidentRepository } from '@/services/repository/IncidentRepository';
import {
  sosInputSchema,
  calculatePreliminaryUrgency,
  CHENNAI_GEO_BOUNDS,
} from '@/lib/validations/sosSchema';
import {
  Incident,
  IncidentCategory,
  IncidentSeverity,
  AccessibilityNeeds,
  ImageObservation,
} from '@/types';
import {
  SOS_TRANSLATIONS,
  SupportedLanguage,
  SOSTranslations,
} from '@/lib/i18n/sosTranslations';
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
  Mic,
  MicOff,
  Trash2,
  Languages,
  Eye,
  Info,
  AlertCircle,
  Copy,
  Check,
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

  // Language state: en | ta | hi
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('en');
  const t: SOSTranslations = SOS_TRANSLATIONS[currentLang];

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

  // SpeechRecognition Voice Dictation State
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Photo Upload & Gemini Vision State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [visionLoading, setVisionLoading] = useState<boolean>(false);
  const [imageObservation, setImageObservation] = useState<ImageObservation | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Errors & Processing
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedIncident, setSubmittedIncident] = useState<Incident | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Status Tracking Lookup
  const [trackQueryId, setTrackQueryId] = useState(initialTrackId);
  const [trackToken, setTrackToken] = useState(searchParams?.get('token') || '');
  const [trackedIncident, setTrackedIncident] = useState<any | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Check SpeechRecognition capability on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
      }
    }
  }, []);

  // Update speech recognition language when currentLang changes
  useEffect(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) { }
      setIsListening(false);
    }
  }, [currentLang]);

  // Voice Dictation Toggle
  const toggleSpeechRecognition = () => {
    setSpeechError(null);

    if (!speechSupported) {
      setSpeechError(t.voiceUnsupported);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) { }
      }
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;

      // Select dynamic regional language
      if (currentLang === 'ta') {
        recognition.lang = 'ta-IN';
      } else if (currentLang === 'hi') {
        recognition.lang = 'hi-IN';
      } else {
        recognition.lang = 'en-IN';
      }

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let transcriptText = '';
        for (let i = 0; i < event.results.length; i++) {
          transcriptText += event.results[i][0].transcript + ' ';
        }
        setLiveTranscript(transcriptText.trim());
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechError(t.voicePermissionDenied);
        } else if (event.error === 'no-speech') {
          // Expected when speech input stops; silent recovery
        } else {
          console.warn('Speech recognition notice:', event.error);
          setSpeechError(t.voiceError);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition start failed:', err);
      setSpeechError(t.voiceUnsupported);
      setIsListening(false);
    }
  };

  const handleAppendTranscript = () => {
    if (!liveTranscript.trim()) return;
    setDescription((prev) => (prev ? `${prev.trim()} • ${liveTranscript.trim()}` : liveTranscript.trim()));
    setLiveTranscript('');
  };

  const handleReplaceTranscript = () => {
    if (!liveTranscript.trim()) return;
    setDescription(liveTranscript.trim());
    setLiveTranscript('');
  };

  // Image Upload with Client Validation & Async Gemini Vision
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      setPhotoError(t.photoInvalidType);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setPhotoError(t.photoTooLarge);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);

      // Trigger optional server-side visual AI observation
      setVisionLoading(true);
      try {
        const res = await fetch('/api/ai/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: dataUrl,
            mimeType: file.type,
            userNotes: description || 'Citizen reported emergency scene.',
          }),
        });

        if (res.ok) {
          const observation: ImageObservation = await res.json();
          setImageObservation(observation);
        }
      } catch (visionErr) {
        console.warn('Optional visual AI observation non-blocking failure:', visionErr);
      } finally {
        setVisionLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setImageObservation(null);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // If initial track ID provided in URL, perform lookup
  useEffect(() => {
    if (initialTrackId) {
      const initialToken = searchParams?.get('token') || '';
      if (initialToken) {
        setTrackToken(initialToken);
      }
      handleLookupTrackId(initialTrackId, initialToken);
    }
  }, [initialTrackId, searchParams]);

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

  // Submit Handler: Resilient (No feature failure blocks text intake)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // 1. Zod Validation Check on core data
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
        console.warn('AI Triage fallback', aiErr);
      }

      // 4. Save into LocalStorage Repository with status=pending & preliminary urgency
      const newIncident = await incidentRepository.create({
        title: `${getCategoryLabel(validatedData.category)} at ${validatedData.area}`,
        description: validatedData.description,
        category: validatedData.category,
        severity: preliminaryUrgency,
        preliminaryUrgency,
        status: 'pending',
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
        imageObservation: imageObservation || undefined,
        photoUrl: photoPreview || undefined,
      });

      setSubmittedIncident(newIncident);
      setTrackedIncident(newIncident);
      setTrackQueryId(newIncident.id);
      if (newIncident.trackingToken) {
        setTrackToken(newIncident.trackingToken);
      }
      setSubmitError(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Failed to create incident:', err);
      setSubmitError(
        err.message || 'Dispatch server unavailable. Your SOS could not be confirmed. Please verify your connection and retry.'
      );
      window.scrollTo({ top: 120, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  // Lookup existing incident for tracking
  const handleLookupTrackId = async (idToLook: string, tokenToLook?: string) => {
    const trimmedId = idToLook.trim();
    if (!trimmedId) return;
    setTrackLoading(true);
    setTrackError(null);

    const token = (tokenToLook !== undefined ? tokenToLook : trackToken).trim();

    try {
      // 1. If tracking token provided, query server endpoint /api/track with privacy projection
      if (token) {
        const res = await fetch(`/api/track?id=${encodeURIComponent(trimmedId)}&token=${encodeURIComponent(token)}`);
        if (res.ok) {
          const data = await res.json();
          setTrackedIncident(data.incident);
          return;
        } else {
          const errData = await res.json().catch(() => ({}));
          setTrackedIncident(null);
          setTrackError(errData.error || t.trackNotFound);
          return;
        }
      }

      // 2. Demo mode fallback lookup from local repository
      const found = await incidentRepository.getById(trimmedId);
      if (found) {
        setTrackedIncident(found);
        if (found.trackingToken) {
          setTrackToken(found.trackingToken);
        }
      } else {
        setTrackedIncident(null);
        setTrackError(t.trackNotFound);
      }
    } catch (err) {
      setTrackError('Failed to query status. Please try again.');
    } finally {
      setTrackLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080F23] text-[#F8FAFF] flex flex-col justify-between py-4 sm:py-6 px-3 sm:px-6 tactical-grid selection:bg-cyan-500/30">
      <div className="max-w-2xl mx-auto w-full">
        {/* Navigation & Language Switcher Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#A5B4D0] hover:text-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t.homeLink}
          </Link>

          {/* Tri-Lingual Switcher: English / தமிழ் / हिंदी */}
          <div className="flex items-center gap-1 bg-[#101C35] border border-[#1E2E4E] p-1 rounded-xl shadow-lg">
            <Languages className="w-3.5 h-3.5 text-[#00D9FF] ml-1 mr-0.5 shrink-0 hidden sm:block" />
            {(['en', 'ta', 'hi'] as SupportedLanguage[]).map((lngKey) => (
              <button
                key={lngKey}
                type="button"
                onClick={() => setCurrentLang(lngKey)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition min-h-[36px] min-w-[44px] flex items-center justify-center ${currentLang === lngKey
                  ? 'bg-[#FF4D67] text-white shadow-md shadow-rose-950/60'
                  : 'text-[#A5B4D0] hover:text-white hover:bg-[#172541]'
                  }`}
                title={`Switch language to ${SOS_TRANSLATIONS[lngKey].langName}`}
              >
                {SOS_TRANSLATIONS[lngKey].langName}
              </button>
            ))}
          </div>

          <Link
            href="/dashboard"
            className="text-xs font-semibold text-[#00D9FF] hover:text-cyan-300 flex items-center gap-1 transition"
          >
            <span>{t.commandCenterLink}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Portal Header Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#172541] via-[#101C35] to-[#172541] border border-[#FF4D67]/40 shadow-2xl mb-4 relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#FF4D67] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-rose-950/80 shrink-0 animate-pulse mt-0.5">
              SOS
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white">{t.title}</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF4D67]/15 text-[#FF4D67] border border-[#FF4D67]/40 font-bold">
                  CHENNAI RAPID INTAKE
                </span>
              </div>
              <p className="text-xs text-[#A5B4D0] mt-1 leading-relaxed">{t.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Mode Selector: Report Distress vs Track Status */}
        <div className="flex rounded-xl bg-[#101C35] border border-[#1E2E4E] p-1 mb-5 text-xs font-semibold shadow-inner">
          <button
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition min-h-[44px] ${activeTab === 'report' ? 'bg-[#FF4D67] text-white shadow-md shadow-rose-950/60' : 'text-[#A5B4D0] hover:text-white'
              }`}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>{t.tabReport}</span>
          </button>
          <button
            onClick={() => setActiveTab('track')}
            className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition min-h-[44px] ${activeTab === 'track' ? 'bg-[#246BFD] text-white shadow-md shadow-blue-950/60' : 'text-[#A5B4D0] hover:text-white'
              }`}
          >
            <Search className="w-4 h-4" />
            <span>{t.tabTrack}</span>
            {submittedIncident && <span className="w-2 h-2 rounded-full bg-[#19E6A0] animate-pulse" />}
          </button>
        </div>

        {/* SUBMISSION CONFIRMATION VIEW */}
        {submittedIncident && activeTab === 'report' ? (
          <div className="p-5 sm:p-6 rounded-2xl bg-[#101C35] border border-[#19E6A0]/50 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#19E6A0]/15 text-[#19E6A0] border border-[#19E6A0]/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">{t.confirmTitle}</h2>
              <p className="text-xs text-[#A5B4D0]">{t.confirmPendingNotice}</p>
            </div>

            {/* Tracking ID Badge */}
            <div className="p-4 rounded-xl bg-[#080F23] border border-[#1E2E4E] space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#1E2E4E] pb-2">
                <span className="text-[#A5B4D0]">{t.confirmId}</span>
                <span className="text-[#FF4D67] font-bold text-base tracking-wider">
                  {submittedIncident.id}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#1E2E4E] pb-2">
                <span className="text-[#A5B4D0]">{t.trackStatusLabel}</span>
                <span className="text-[#FFB547] uppercase font-bold">
                  {getStatusLabel(submittedIncident.status)}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#1E2E4E] pb-2">
                <span className="text-[#A5B4D0]">{t.urgencyPreview}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border uppercase ${getSeverityBadgeClass(
                    submittedIncident.preliminaryUrgency || submittedIncident.severity
                  )}`}
                >
                  {submittedIncident.preliminaryUrgency || submittedIncident.severity}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#1E2E4E] pb-2">
                <span className="text-[#A5B4D0]">LOCATION:</span>
                <span className="text-slate-200">
                  {submittedIncident.location.area} ({submittedIncident.location.lat.toFixed(4)},{' '}
                  {submittedIncident.location.lng.toFixed(4)})
                </span>
              </div>
              <div className="flex justify-between border-b border-[#1E2E4E] pb-2">
                <span className="text-[#A5B4D0]">UNGUESSABLE TRACKING TOKEN:</span>
                <span className="text-[#00D9FF] font-mono font-bold select-all bg-black/40 px-2 py-0.5 rounded border border-cyan-800/40">
                  {submittedIncident.trackingToken || 'Pending Generation'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A5B4D0]">PEOPLE REPORTED:</span>
                <span className="text-white font-bold">{submittedIncident.reporter.citizenCount} Persons</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => {
                  setTrackQueryId(submittedIncident.id);
                  if (submittedIncident.trackingToken) {
                    setTrackToken(submittedIncident.trackingToken);
                  }
                  setActiveTab('track');
                  handleLookupTrackId(submittedIncident.id, submittedIncident.trackingToken);
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#246BFD] hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition min-h-[44px] active:scale-[0.99]"
              >
                <Search className="w-4 h-4" />
                <span>{t.tabTrack} ({submittedIncident.id})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && submittedIncident) {
                    const url = `${window.location.origin}/sos?track=${encodeURIComponent(
                      submittedIncident.id
                    )}&token=${encodeURIComponent(submittedIncident.trackingToken || '')}`;
                    navigator.clipboard.writeText(url).then(() => {
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 3000);
                    }).catch(() => {});
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#172541] hover:bg-[#1E3156] text-[#00D9FF] text-xs font-semibold flex items-center justify-center gap-2 border border-cyan-800/40 transition min-h-[44px] active:scale-[0.99]"
              >
                {copiedLink ? <Check className="w-4 h-4 text-[#19E6A0]" /> : <Copy className="w-4 h-4 text-[#00D9FF]" />}
                <span>{copiedLink ? 'Private Tracking Link Copied!' : 'Copy Shareable Tracking Link'}</span>
              </button>

              <Link
                href="/dashboard"
                className="w-full py-2.5 px-4 rounded-xl bg-[#172541] hover:bg-[#1E3156] text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition min-h-[44px]"
              >
                <span>{t.commandCenterLink} &rarr;</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setSubmittedIncident(null);
                  setDescription('');
                  setAddress('');
                  setArea('');
                  setPhotoPreview(null);
                  setImageObservation(null);
                }}
                className="w-full py-2 text-xs text-[#A5B4D0] hover:text-white transition"
              >
                + {t.tabReport}
              </button>
            </div>
          </div>
        ) : activeTab === 'report' ? (
          /* SOS REPORT INTAKE FORM */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Submission Error Banner */}
            {submitError && (
              <div className="p-4 rounded-xl bg-red-950/80 border border-[#FF4D67]/80 flex items-start gap-3 text-red-200 shadow-xl animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-[#FF4D67] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-sm text-red-100">SOS Submission Failed to Reach Dispatch Server</div>
                  <p className="text-xs text-red-300 leading-relaxed">{submitError}</p>
                  <p className="text-[11px] text-red-400">
                    Your distress report was NOT saved to the live rescue coordination cloud. Form fields have been preserved. Please check your network and tap &quot;{t.submitButton}&quot; to retry.
                  </p>
                </div>
              </div>
            )}

            {/* Section 1: Emergency Description + Voice Dictation */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#101C35] border border-[#1E2E4E] space-y-3 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#FF4D67]" />
                  <span>{t.descriptionLabel} <span className="text-[#FF4D67]">*</span></span>
                </label>

                {/* Voice Dictation Button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition min-h-[38px] ${isListening
                    ? 'bg-[#FF4D67] text-white animate-pulse shadow-lg shadow-rose-950/60'
                    : 'bg-[#172541] hover:bg-[#1E3156] text-[#00D9FF] border border-cyan-800/40'
                    }`}
                  title={isListening ? t.voiceStop : t.voiceDictationButton}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5 text-white animate-spin" />
                      <span>{t.voiceStop}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-[#00D9FF]" />
                      <span>{t.voiceDictationButton}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Listening Indicator Banner */}
              {isListening && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-700/80 flex items-center gap-3 animate-in fade-in">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <div className="text-xs text-red-200 font-medium">
                    {t.voiceListening} ({t.langName})
                  </div>
                </div>
              )}

              {/* Speech Error Banner (Non-blocking) */}
              {speechError && (
                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 flex items-center gap-2 animate-in fade-in">
                  <Info className="w-4 h-4 text-[#FFB547] shrink-0" />
                  <span>{speechError}</span>
                </div>
              )}

              {/* Live Speech Transcript Preview & Edit Card */}
              {liveTranscript && (
                <div className="p-3 rounded-xl bg-[#080F23] border border-cyan-800/60 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#00D9FF]">
                    <span>{t.voiceTranscriptLabel}</span>
                    <button
                      type="button"
                      onClick={() => setLiveTranscript('')}
                      className="text-[#A5B4D0] hover:text-white"
                    >
                      {t.voiceClear}
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={liveTranscript}
                    onChange={(e) => setLiveTranscript(e.target.value)}
                    className="w-full p-2 rounded-lg bg-black/60 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#00D9FF]"
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleAppendTranscript}
                      className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition"
                    >
                      + {t.voiceAppend}
                    </button>
                    <button
                      type="button"
                      onClick={handleReplaceTranscript}
                      className="px-3 py-1.5 rounded bg-[#172541] hover:bg-[#1E3156] text-slate-200 font-semibold text-xs transition"
                    >
                      {t.voiceReplace}
                    </button>
                  </div>
                </div>
              )}

              {/* Main Description Textarea (Never Blocked) */}
              <textarea
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (validationErrors.description) {
                    setValidationErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.description;
                      return copy;
                    });
                  }
                }}
                placeholder={t.descriptionPlaceholder}
                className={`w-full p-3 rounded-xl bg-[#080F23] border text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition leading-relaxed ${validationErrors.description
                  ? 'border-[#FF4D67] focus:border-red-400'
                  : 'border-[#1E2E4E] focus:border-[#00D9FF]'
                  }`}
              />
              {validationErrors.description && (
                <p className="text-[11px] text-[#FF4D67] font-medium">
                  {validationErrors.description}
                </p>
              )}
              <p className="text-[11px] text-[#A5B4D0]">{t.descriptionHelp}</p>
            </div>

            {/* Section 2: Validated Image Upload + Optional Gemini Vision Observations */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#101C35] border border-[#1E2E4E] space-y-3 shadow-xl">
              <label className="text-xs font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#00D9FF]" />
                  <span>{t.photoLabel}</span>
                </span>
                <span className="text-[10px] font-mono text-[#A5B4D0]">JPEG/PNG/WebP • Max 5MB</span>
              </label>

              {/* Upload Drop Zone / Button */}
              {!photoPreview ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="sos-photo-input"
                  />
                  <label
                    htmlFor="sos-photo-input"
                    className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-[#1E2E4E] hover:border-[#00D9FF] bg-[#080F23]/60 hover:bg-[#080F23] cursor-pointer transition text-center space-y-2 min-h-[100px]"
                  >
                    <Camera className="w-7 h-7 text-[#00D9FF]" />
                    <span className="text-xs font-semibold text-slate-200">
                      {t.photoUploadPrompt}
                    </span>
                    <span className="text-[11px] text-[#A5B4D0]">{t.photoHint}</span>
                  </label>
                </div>
              ) : (
                /* Photo Preview & Remove */
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-[#1E2E4E] bg-black max-h-64 flex items-center justify-center">
                    <img
                      src={photoPreview}
                      alt="Scene evidence preview"
                      className="max-h-64 w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute top-2 right-2 px-3 py-1.5 rounded-lg bg-[#FF4D67] hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xl transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.photoRemove}</span>
                    </button>
                  </div>

                  {/* Vision Analysis State */}
                  {visionLoading ? (
                    <div className="p-3 rounded-xl bg-[#080F23] border border-[#1E2E4E] flex items-center gap-2.5 text-xs text-[#FFB547] animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-[#FFB547]" />
                      <span>{t.photoAnalyzing}</span>
                    </div>
                  ) : imageObservation ? (
                    <div className="p-3.5 rounded-xl bg-[#080F23] border border-amber-800/60 space-y-2 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-[#1E2E4E] pb-1.5">
                        <span className="font-mono text-[10px] font-bold text-[#FFB547] flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t.photoUnverifiedBadge}</span>
                        </span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-950 text-[#FFB547] border border-amber-800">
                          AI Observation
                        </span>
                      </div>
                      <p className="text-slate-200 leading-snug">{imageObservation.environmentalNotes}</p>
                      {imageObservation.visibleHazards?.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {imageObservation.visibleHazards.map((hz, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/80 text-[10px] text-amber-200"
                            >
                              ⚠️ {hz}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-[#A5B4D0] italic pt-1 border-t border-[#1E2E4E]">
                        {t.photoUnverifiedDisclaimer}
                      </p>
                    </div>
                  ) : null}
                </div>
              )}

              {photoError && (
                <p className="text-xs text-[#FF4D67] font-medium">{photoError}</p>
              )}
            </div>

            {/* Section 3: Emergency Category */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#101C35] border border-[#1E2E4E] space-y-3 shadow-xl">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#246BFD]" />
                <span>{t.categoryLabel} <span className="text-[#FF4D67]">*</span></span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'flood_water', label: t.catFlood, icon: Droplets, color: 'text-[#00D9FF]' },
                  { key: 'medical_critical', label: t.catMedical, icon: HeartPulse, color: 'text-[#FF4D67]' },
                  { key: 'elderly_infant_stranded', label: t.catStranded, icon: Baby, color: 'text-[#FFB547]' },
                  { key: 'structural_collapse', label: t.catCollapse, icon: AlertTriangle, color: 'text-orange-400' },
                  { key: 'power_hazard', label: t.catPower, icon: Radio, color: 'text-yellow-400' },
                  { key: 'food_water_supply', label: t.catSupplies, icon: LifeBuoy, color: 'text-[#19E6A0]' },
                  { key: 'road_blockage', label: t.catRoad, icon: Compass, color: 'text-indigo-400' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = category === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setCategory(item.key as IncidentCategory)}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 min-h-[44px] ${isSelected
                        ? 'bg-[#172541] border-[#00D9FF] shadow-md text-white'
                        : 'bg-[#080F23] border-[#1E2E4E] text-[#A5B4D0] hover:border-slate-600'
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${item.color} shrink-0`} />
                      <span className="font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Incident Location */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#101C35] border border-[#1E2E4E] space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#00D9FF]" />
                  <span>{t.locationLabel} <span className="text-[#FF4D67]">*</span></span>
                </label>

                {/* Location Mode Toggle */}
                <div className="flex bg-[#080F23] p-1 rounded-lg border border-[#1E2E4E] text-xs">
                  <button
                    type="button"
                    onClick={() => setLocationMode('manual')}
                    className={`px-3 py-1 rounded font-medium transition min-h-[34px] ${locationMode === 'manual'
                      ? 'bg-[#246BFD] text-white font-bold'
                      : 'text-[#A5B4D0] hover:text-white'
                      }`}
                  >
                    {t.locModeManual}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationMode('pin')}
                    className={`px-3 py-1 rounded font-medium transition min-h-[34px] ${locationMode === 'pin'
                      ? 'bg-[#246BFD] text-white font-bold'
                      : 'text-[#A5B4D0] hover:text-white'
                      }`}
                  >
                    {t.locModePin}
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono text-[#A5B4D0]">{t.locPresetsLabel}</div>
                <div className="flex flex-wrap gap-1.5">
                  {CHENNAI_VERIFIED_LOCALITIES.slice(0, 6).map((preset) => (
                    <button
                      key={preset.area}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${area === preset.area
                        ? 'bg-cyan-950 text-[#00D9FF] border-[#00D9FF]'
                        : 'bg-[#080F23] text-slate-300 border-[#1E2E4E] hover:border-slate-600'
                        }`}
                    >
                      {preset.area}
                    </button>
                  ))}
                </div>
              </div>

              {locationMode === 'pin' ? (
                <div className="space-y-2">
                  <PinPicker lat={lat} lng={lng} onChange={handlePinChange} />
                  <div className="text-[11px] font-mono text-[#A5B4D0] flex items-center justify-between">
                    <span>GPS Coordinates:</span>
                    <span className="text-[#00D9FF]">
                      [{lat.toFixed(4)}, {lng.toFixed(4)}]
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Address & Area Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {t.locArea} <span className="text-[#FF4D67]">*</span>
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Velachery / Madipakkam"
                    className="w-full p-2.5 rounded-lg bg-[#080F23] border border-[#1E2E4E] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00D9FF] min-h-[44px]"
                  />
                  {validationErrors.area && (
                    <p className="text-[10px] text-[#FF4D67] mt-1">{validationErrors.area}</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {t.locAddress} <span className="text-[#FF4D67]">*</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Plot 48, Ram Nagar 3rd Cross"
                    className="w-full p-2.5 rounded-lg bg-[#080F23] border border-[#1E2E4E] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00D9FF] min-h-[44px]"
                  />
                  {validationErrors.address && (
                    <p className="text-[10px] text-[#FF4D67] mt-1">{validationErrors.address}</p>
                  )}
                </div>
              </div>

              {/* Landmark & Water Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{t.locLandmark}</label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Behind Sunshine School, near MRTS"
                    className="w-full p-2.5 rounded-lg bg-[#080F23] border border-[#1E2E4E] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00D9FF] min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {t.locWaterDepth}: <strong className="text-[#00D9FF] font-mono">~{waterLevelFt} ft</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={waterLevelFt}
                    onChange={(e) => setWaterLevelFt(parseFloat(e.target.value))}
                    className="w-full accent-[#00D9FF] cursor-pointer mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Affected Citizens Count & Logistical Needs */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#101C35] border border-[#1E2E4E] space-y-4 shadow-xl">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#19E6A0]" />
                <span>{t.citizensLabel}</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {t.citizensCount}: <strong className="text-white font-mono text-sm">{citizenCount}</strong>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={citizenCount}
                    onChange={(e) => setCitizenCount(parseInt(e.target.value))}
                    className="w-full accent-[#246BFD] cursor-pointer mt-2"
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200 min-h-[38px]">
                    <input
                      type="checkbox"
                      checked={needsBoat}
                      onChange={(e) => setNeedsBoat(e.target.checked)}
                      className="rounded border-[#1E2E4E] bg-[#080F23] text-[#00D9FF] focus:ring-[#00D9FF] w-4 h-4"
                    />
                    <span>{t.citizensBoat}</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200 min-h-[38px]">
                    <input
                      type="checkbox"
                      checked={needsMedical}
                      onChange={(e) => setNeedsMedical(e.target.checked)}
                      className="rounded border-[#1E2E4E] bg-[#080F23] text-[#FF4D67] focus:ring-[#FF4D67] w-4 h-4"
                    />
                    <span>{t.citizensMedical}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 6: Vulnerability & Accessibility Needs */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#101C35] border border-[#1E2E4E] space-y-3 shadow-xl">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Accessibility className="w-4 h-4 text-pink-400" />
                <span>{t.accessTitle}</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {[
                  { key: 'elderly', label: t.accessElderly },
                  { key: 'infants', label: t.accessInfants },
                  { key: 'mobilityImpaired', label: t.accessMobility },
                  { key: 'medicalDependency', label: t.accessMedical },
                  { key: 'pregnancy', label: t.accessPregnancy },
                  { key: 'hearingVisionImpaired', label: t.accessVisionHearing },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2 p-2.5 rounded-xl border border-[#1E2E4E] bg-[#080F23] cursor-pointer hover:border-slate-600 text-slate-300 min-h-[44px]"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean((accessibility as any)[item.key])}
                      onChange={(e) =>
                        setAccessibility((prev) => ({
                          ...prev,
                          [item.key]: e.target.checked,
                        }))
                      }
                      className="rounded border-[#1E2E4E] bg-[#080F23] text-[#246BFD] focus:ring-[#246BFD] w-4 h-4 shrink-0"
                    />
                    <span className="text-[11px] leading-tight">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Section 7: Reporter Contact & Privacy */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#101C35] border border-[#1E2E4E] space-y-3 shadow-xl">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-[#00D9FF]" />
                <span>{t.contactTitle}</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{t.contactName}</label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="e.g. K. Raman"
                    className="w-full p-2.5 rounded-lg bg-[#080F23] border border-[#1E2E4E] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00D9FF] min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">{t.contactPhone}</label>
                  <input
                    type="tel"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    placeholder="+91 98400 12345"
                    className="w-full p-2.5 rounded-lg bg-[#080F23] border border-[#1E2E4E] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00D9FF] min-h-[44px]"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 pt-1 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={isPrivateContact}
                  onChange={(e) => setIsPrivateContact(e.target.checked)}
                  className="rounded border-[#1E2E4E] bg-[#080F23] text-[#00D9FF] focus:ring-[#00D9FF] w-4 h-4 mt-0.5"
                />
                <span className="leading-snug">{t.contactPrivate}</span>
              </label>
            </div>

            {/* Preliminary Urgency Preview Card */}
            <div className="p-3.5 rounded-xl bg-[#101C35] border border-[#1E2E4E] flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">{t.urgencyPreview}</span>
              <span
                className={`px-3 py-1 rounded-full uppercase font-mono font-bold text-xs tracking-wider border ${getSeverityBadgeClass(
                  calculatePreliminaryUrgency({
                    category,
                    waterLevelFt,
                    citizenCount,
                    needsMedical,
                    needsBoat,
                    accessibilityNeeds: accessibility,
                  })
                )}`}
              >
                {calculatePreliminaryUrgency({
                  category,
                  waterLevelFt,
                  citizenCount,
                  needsMedical,
                  needsBoat,
                  accessibilityNeeds: accessibility,
                })}
              </span>
            </div>

            {/* Submit Action (Resilient, Guaranteed Intake) */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#FF4D67] via-rose-600 to-[#FF4D67] hover:from-rose-500 hover:to-rose-600 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl shadow-rose-950/80 transition disabled:opacity-50 min-h-[52px] active:scale-[0.99] neon-glow-coral"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t.submittingText}</span>
                  </>
                ) : (
                  <>
                    <LifeBuoy className="w-5 h-5 animate-pulse" />
                    <span>{t.submitButton}</span>
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-[#A5B4D0] leading-normal">
                {t.resilienceNotice}
              </p>
            </div>
          </form>
        ) : (
          /* STATUS TRACKING VIEW */
          <div className="p-5 sm:p-6 rounded-2xl bg-[#101C35] border border-[#1E2E4E] space-y-6 shadow-2xl">
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-[#00D9FF]" />
                <span>{t.trackTitle}</span>
              </h2>
              <p className="text-xs text-[#A5B4D0]">
                Enter your unique Chennai incident code and tracking token to query real-time rescue status, assigned units, and coordinator audit timeline.
              </p>
            </div>

            {/* Search Input with Unguessable Token */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#A5B4D0] mb-1">
                    INCIDENT IDENTIFIER:
                  </label>
                  <input
                    type="text"
                    value={trackQueryId}
                    onChange={(e) => setTrackQueryId(e.target.value)}
                    placeholder={t.trackPlaceholder}
                    className="w-full p-3 rounded-xl bg-[#080F23] border border-[#1E2E4E] text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#00D9FF] min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#A5B4D0] mb-1 flex items-center justify-between">
                    <span>TRACKING TOKEN:</span>
                    <span className="text-[10px] text-[#00D9FF]">Privacy Guard</span>
                  </label>
                  <input
                    type="text"
                    value={trackToken}
                    onChange={(e) => setTrackToken(e.target.value)}
                    placeholder="e.g. trk_7a8f9b..."
                    className="w-full p-3 rounded-xl bg-[#080F23] border border-[#1E2E4E] text-xs sm:text-sm font-mono text-[#00D9FF] placeholder-slate-500 focus:outline-none focus:border-[#00D9FF] min-h-[44px]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleLookupTrackId(trackQueryId, trackToken)}
                disabled={trackLoading || !trackQueryId.trim()}
                className="w-full py-3.5 rounded-xl bg-[#246BFD] hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 min-h-[44px] shadow-lg shadow-blue-950/60 active:scale-[0.99]"
              >
                {trackLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.trackButton}
              </button>
            </div>

            {trackError && (
              <div className="p-3.5 rounded-xl bg-red-950/50 border border-[#FF4D67]/60 text-xs text-red-200">
                {trackError}
              </div>
            )}

            {/* Incident Track Details */}
            {trackedIncident && (
              <div className="space-y-5 pt-2 border-t border-[#1E2E4E] animate-in fade-in">
                {/* Status Card */}
                <div className="p-4 rounded-xl bg-[#080F23] border border-[#1E2E4E] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1E2E4E] pb-2">
                    <span className="font-mono text-xs text-[#A5B4D0] font-bold">
                      {trackedIncident.id}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full border uppercase font-bold tracking-wider ${getStatusBadgeClass(
                        trackedIncident.status
                      )}`}
                    >
                      {getStatusLabel(trackedIncident.status)}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-white">{trackedIncident.title}</div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                    <div>
                      <span className="text-[#A5B4D0]">Location:</span>{' '}
                      <strong>{trackedIncident.location?.area || trackedIncident.area}</strong>
                    </div>
                    <div>
                      <span className="text-[#A5B4D0]">Urgency:</span>{' '}
                      <strong className="uppercase text-[#FFB547]">
                        {trackedIncident.preliminaryUrgency || trackedIncident.severity}
                      </strong>
                    </div>
                  </div>

                  {trackedIncident.assignedTeamName && (
                    <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-200 flex items-center gap-2.5">
                      <Ship className="w-4 h-4 text-[#00D9FF] shrink-0" />
                      <span>
                        <strong>{t.trackAssignedUnit}</strong> {trackedIncident.assignedTeamName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Audit Timeline */}
                {trackedIncident.timeline && trackedIncident.timeline.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#A5B4D0]">
                      Dispatch Audit Timeline
                    </h4>
                    <div className="space-y-2 border-l-2 border-[#1E2E4E] pl-3 ml-2">
                      {trackedIncident.timeline.map((entry: any, idx: number) => (
                        <div key={idx} className="relative pb-2">
                          <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-[#00D9FF] border border-[#080F23]" />
                          <div className="text-[11px] font-bold text-white">{entry.action}</div>
                          {entry.note && <div className="text-[11px] text-[#A5B4D0] mt-0.5">{entry.note}</div>}
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            {formatTimeAgo(entry.timestamp)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer Government Contacts */}
        <div className="mt-8 p-4 rounded-xl bg-[#101C35] border border-[#1E2E4E] text-[11px] text-[#A5B4D0] space-y-2">
          <div className="font-bold text-slate-300 flex items-center gap-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.confirmHelplinesTitle}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-slate-300">
            <div>Emergency: <strong className="text-white">112</strong></div>
            <div>Ambulance: <strong className="text-white">108</strong></div>
            <div>Disaster HQ: <strong className="text-white">1070</strong></div>
            <div>GCC Chennai: <strong className="text-white">1913</strong></div>
          </div>
          <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
            {t.officialDisclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SOSPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070C18] flex items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <span className="font-mono text-xs uppercase tracking-wider text-slate-300">
            Loading Citizen SOS Portal...
          </span>
        </div>
      }
    >
      <SOSPortalContent />
    </Suspense>
  );
}
