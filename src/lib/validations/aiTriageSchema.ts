import { z } from 'zod';

export const aiTriageRequestSchema = z.object({
  text: z.string().trim().min(3, 'Distress message must be at least 3 characters'),
  category: z
    .enum([
      'flood_water',
      'medical_critical',
      'structural_collapse',
      'elderly_infant_stranded',
      'power_hazard',
      'food_water_supply',
      'road_blockage',
    ])
    .optional(),
  location: z.string().trim().optional(),
  waterLevelFt: z.number().optional(),
  citizenCount: z.number().optional(),
  needsBoat: z.boolean().optional(),
  needsMedical: z.boolean().optional(),
  hasChildrenOrElderly: z.boolean().optional(),
});

export type AITriageRequest = z.infer<typeof aiTriageRequestSchema>;

export const aiTriageOutputSchema = z.object({
  originalText: z.string(),
  originalLanguage: z.string(),
  englishTranslation: z.string(),
  category: z.enum([
    'flood_water',
    'medical_critical',
    'structural_collapse',
    'elderly_infant_stranded',
    'power_hazard',
    'food_water_supply',
    'road_blockage',
  ]),
  summary: z.string(),
  peopleAffected: z.number().nullable(),
  vulnerabilities: z.array(z.string()),
  hazardsIdentified: z.array(z.string()),
  explicitlyReportedLocation: z.string().nullable(),
  missingInformation: z.array(z.string()),
  urgency: z.enum(['critical', 'high', 'medium', 'low']),
  priorityScore: z.number().min(0).max(100),
  urgencySummary: z.string(),
  explanation: z.string(),
  uncertaintyIndicators: z.array(z.string()),
  recommendedUnits: z.array(z.string()),
  suggestedActionPlan: z.string(),
  triageConfidence: z.number().min(0).max(1),
  modelUsed: z.string(),
  isDemoFallback: z.boolean(),
  humanReviewStatus: z.enum(['pending', 'approved', 'overridden']).default('pending'),
});

export type AITriageOutput = z.infer<typeof aiTriageOutputSchema>;
