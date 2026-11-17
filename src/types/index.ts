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
  urgencySummary: string;
  recommendedUnits: string[];
  hazardsIdentified: string[];
  triageConfidence: number;
  modelUsed?: string;
  suggestedActionPlan: string;
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
  timeline: TimelineEntry[];
  isSimulated: boolean;
  photoUrl?: string;
  audioNoteUrl?: string;
}

export type TeamType =
  | 'ndrf_water_rescue'
  | 'sdrf_paramedic'
  | 'fire_rescue'
  | 'drone_recon'
  | 'corpn_civil_works';

export type TeamStatus = 'idle' | 'en_route' | 'on_scene' | 'refueling';

export interface ResponderTeam {
  id: string;
  name: string;
  callsign: string;
  type: TeamType;
  status: TeamStatus;
  commander: string;
  personnelCount: number;
  capacity: number;
  equipment: string[];
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
