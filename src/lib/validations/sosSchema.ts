import { z } from 'zod';
import { IncidentCategory, IncidentSeverity, AccessibilityNeeds } from '@/types';

// Validated Chennai metropolitan regional bounds
export const CHENNAI_GEO_BOUNDS = {
  MIN_LAT: 12.7,
  MAX_LAT: 13.4,
  MIN_LNG: 79.9,
  MAX_LNG: 80.4,
};

export const sosInputSchema = z.object({
  description: z
    .string({ required_error: 'Emergency description is required' })
    .trim()
    .min(10, 'Please describe the emergency in at least 10 characters so responders can assess the situation'),
  
  category: z.enum([
    'flood_water',
    'medical_critical',
    'structural_collapse',
    'elderly_infant_stranded',
    'power_hazard',
    'food_water_supply',
    'road_blockage',
  ] as const, {
    required_error: 'Please select the emergency type',
  }),

  // Location details: Must be manually entered or pinned via map. Never invented.
  address: z
    .string({ required_error: 'Street address or location details are required' })
    .trim()
    .min(5, 'Please provide a specific street address or physical location detail'),

  area: z
    .string({ required_error: 'Area or locality is required' })
    .trim()
    .min(2, 'Please specify the neighborhood or area (e.g. Velachery, Tambaram)'),

  landmark: z.string().trim().optional(),

  lat: z
    .number({ required_error: 'Location pin coordinates (latitude) are required' })
    .min(CHENNAI_GEO_BOUNDS.MIN_LAT, `Latitude must be within Chennai region (>= ${CHENNAI_GEO_BOUNDS.MIN_LAT})`)
    .max(CHENNAI_GEO_BOUNDS.MAX_LAT, `Latitude must be within Chennai region (<= ${CHENNAI_GEO_BOUNDS.MAX_LAT})`),

  lng: z
    .number({ required_error: 'Location pin coordinates (longitude) are required' })
    .min(CHENNAI_GEO_BOUNDS.MIN_LNG, `Longitude must be within Chennai region (>= ${CHENNAI_GEO_BOUNDS.MIN_LNG})`)
    .max(CHENNAI_GEO_BOUNDS.MAX_LNG, `Longitude must be within Chennai region (<= ${CHENNAI_GEO_BOUNDS.MAX_LNG})`),

  waterLevelFt: z
    .number()
    .min(0, 'Water depth cannot be negative')
    .max(25, 'Maximum estimated flood height is 25 feet')
    .optional(),

  // People affected
  citizenCount: z
    .number({ required_error: 'Number of people affected is required', invalid_type_error: 'Please enter a valid number' })
    .int('Number of people must be a whole number')
    .min(1, 'At least 1 person affected must be specified')
    .max(500, 'For mass casualties exceeding 500, contact State Operations directly at 1070'),

  // Optional Private Contact
  reporterName: z.string().trim().optional(),
  reporterPhone: z.string().trim().optional(),
  isPrivateContact: z.boolean().default(false),

  // Assistance flags & Vulnerabilities
  needsBoat: z.boolean().default(false),
  needsMedical: z.boolean().default(false),
  accessibilityNeeds: z
    .object({
      elderly: z.boolean().default(false),
      infants: z.boolean().default(false),
      mobilityImpaired: z.boolean().default(false),
      medicalDependency: z.boolean().default(false),
      pregnancy: z.boolean().default(false),
      hearingVisionImpaired: z.boolean().default(false),
      details: z.string().trim().optional(),
    })
    .optional(),
});

export type SOSInput = z.infer<typeof sosInputSchema>;

/**
 * Deterministically computes the preliminary urgency category based on
 * the user-supplied inputs before dispatch or full model triage.
 */
export function calculatePreliminaryUrgency(data: {
  category: IncidentCategory;
  waterLevelFt?: number;
  citizenCount: number;
  needsMedical?: boolean;
  needsBoat?: boolean;
  accessibilityNeeds?: AccessibilityNeeds;
}): IncidentSeverity {
  const hasCriticalMedical =
    data.needsMedical ||
    data.category === 'medical_critical' ||
    (data.accessibilityNeeds?.medicalDependency && (data.waterLevelFt ?? 0) >= 2) ||
    (data.accessibilityNeeds?.pregnancy && (data.waterLevelFt ?? 0) >= 2);

  const hasExtremeWater = (data.waterLevelFt ?? 0) >= 5;

  if (hasExtremeWater || hasCriticalMedical) {
    return 'critical';
  }

  const hasHighRiskVulnerability =
    data.accessibilityNeeds?.mobilityImpaired ||
    data.accessibilityNeeds?.elderly ||
    data.accessibilityNeeds?.infants ||
    data.category === 'elderly_infant_stranded';

  const hasHighDepthOrCurrent = (data.waterLevelFt ?? 0) >= 3 || data.needsBoat;
  const hasLargeGroup = data.citizenCount >= 10;
  const hasInfrastructureHazard = data.category === 'power_hazard' || data.category === 'structural_collapse';

  if (hasHighRiskVulnerability || hasHighDepthOrCurrent || hasLargeGroup || hasInfrastructureHazard) {
    return 'high';
  }

  if ((data.waterLevelFt ?? 0) >= 1 || data.citizenCount >= 3 || data.category === 'food_water_supply') {
    return 'medium';
  }

  return 'low';
}
