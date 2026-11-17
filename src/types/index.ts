export type IncidentCategory =
  | 'flood_water'
  | 'medical_critical'
  | 'structural_collapse'
  | 'elderly_infant_stranded'
  | 'power_hazard'
  | 'food_water_supply'
  | 'road_blockage';

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

export type IncidentStatus =
  | 'pending'
  | 'under_review'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'invalid'
  // Legacy compatibility
  | 'reported'
  | 'triaged'
  | 'dispatched';

export interface TimelineEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  note?: string;
  previousStatus?: IncidentStatus;
  newStatus?: IncidentStatus;
}

export interface IncidentLocation {
  address: string;
  area: string;
  lat: number;
  lng: number;
  landmark?: string;
  waterLevelFt?: number;
}

export interface AccessibilityNeeds {
  elderly?: boolean;
  infants?: boolean;
  mobilityImpaired?: boolean;
  medicalDependency?: boolean;
  pregnancy?: boolean;
  hearingVisionImpaired?: boolean;
  details?: string;
}

export interface ReporterDetails {
  name: string;
  phone: string;
  citizenCount: number;
  hasChildrenOrElderly: boolean;
  needsBoat: boolean;
  needsMedical: boolean;
  isPrivateContact?: boolean;
  accessibilityNeeds?: AccessibilityNeeds;
  deviceBatteryPercent?: number;
}

export interface AITriageAnalysis {
  priorityScore: number; // 0 - 100
  urgency?: IncidentSeverity; // 'critical' | 'high' | 'medium' | 'low'
  urgencySummary: string;
  summary?: string;
  originalText?: string;
  originalLanguage?: string; // 'English' | 'Tamil' | 'Hindi' | string
  englishTranslation?: string;
  category?: IncidentCategory;
  peopleAffected?: number | null; // null if not explicitly stated - never fabricate
  vulnerabilities?: string[];
  hazardsIdentified: string[];
  explicitlyReportedLocation?: string | null; // null if not explicitly stated
  missingInformation?: string[];
  explanation?: string;
  uncertaintyIndicators?: string[];
  recommendedUnits: string[];
  triageConfidence: number;
  modelUsed: string;
  isDemoFallback?: boolean;
  suggestedActionPlan: string;
  humanReviewStatus?: 'pending' | 'approved' | 'overridden';
  humanReviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ImageObservation {
  visibleHazards: string[];
  estimatedWaterLevelFt?: number;
  environmentalNotes: string;
  isVerified: false;
  disclaimer: string;
  locationInferred: false;
  victimCountInferred: false;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  preliminaryUrgency?: IncidentSeverity;
  reportedAt: string;
  updatedAt: string;
  location: IncidentLocation;
  reporter: ReporterDetails;
  assignedTeamId?: string;
  assignedTeamName?: string;
  accessibilityNeeds?: AccessibilityNeeds;
  closureReason?: string;
  aiTriage?: AITriageAnalysis;
  imageObservation?: ImageObservation;
  timeline: TimelineEntry[];
  isSimulated: boolean;
  trackingToken?: string; // Unguessable token for privacy-safe public status lookup
  photoUrl?: string;
  audioNoteUrl?: string;
}

/** Privacy-safe projection returned to public tracking queries */
export interface PublicTrackedIncident {
  id: string;
  title: string;
  category: IncidentCategory;
  status: IncidentStatus;
  preliminaryUrgency?: IncidentSeverity;
  reportedAt: string;
  updatedAt: string;
  area: string; // Sanitized: area/neighborhood only, never door number or private address
  assignedTeamName?: string;
  citizenCount: number;
  timeline: {
    timestamp: string;
    action: string;
    note?: string;
  }[];
}

export interface CoordinatorSession {
  username: string;
  role: 'coordinator' | 'lead_operator';
  issuedAt: number;
  expiresAt: number;
}

export interface UrgencyDistribution {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface CategoryBreakdown {
  category: IncidentCategory;
  label: string;
  count: number;
}

export interface HourlyTrendPoint {
  hour: string;
  reportedCount: number;
  resolvedCount: number;
}

export interface AnalyticsData {
  totalIncidents: number;
  activeCount: number;
  pendingCount: number;
  underReviewCount: number;
  assignedCount: number;
  inProgressCount: number;
  resolvedCount: number;
  invalidCount: number;
  urgencyDistribution: UrgencyDistribution;
  categoryBreakdown: CategoryBreakdown[];
  hourlyTrends: HourlyTrendPoint[];
  deployedTeamsCount: number;
  totalTeamsCount: number;
  totalCitizensAssisted: number;
  simulatedDisclaimer: string;
}

export type TeamType =
  | 'ndrf_water_rescue'
  | 'sdrf_paramedic'
  | 'fire_rescue'
  | 'drone_recon'
  | 'electrical_grid'
  | 'corpn_civil_works';

export type TeamStatus = 'idle' | 'en_route' | 'on_scene' | 'refueling' | 'busy' | 'maintenance';

export interface ResponderTeam {
  id: string;
  name: string;
  callsign: string;
  type: TeamType;
  specialization: string;
  status: TeamStatus;
  commander: string;
  personnelCount: number;
  capacity: number;
  equipment: string[];
  baseCoordinates: {
    lat: number;
    lng: number;
    label: string;
  };
  currentLocation: {
    lat: number;
    lng: number;
    label: string;
  };
  assignedIncidentId?: string;
  assignedIncidentTitle?: string;
  radioChannel: string;
  batteryOrFuelPercent: number;
  lastPingTime: string;
  isSimulated: boolean;
}

export interface DisasterOverviewStats {
  totalIncidents: number;
  activeCritical: number;
  dispatchedTeams: number;
  availableTeams: number;
  citizensAssisted: number;
  avgResponseTimeMin: number;
  waterLoggedHotspots: number;
}
