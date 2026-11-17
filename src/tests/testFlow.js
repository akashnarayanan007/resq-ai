const { z } = require('zod');

// 1. Test Zod Schema
const CHENNAI_GEO_BOUNDS = {
  MIN_LAT: 12.7,
  MAX_LAT: 13.4,
  MIN_LNG: 79.9,
  MAX_LNG: 80.4,
};

const sosInputSchema = z.object({
  description: z
    .string()
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
  ]),
  address: z.string().trim().min(5, 'Please provide a specific street address or physical location detail'),
  area: z.string().trim().min(2, 'Please specify the neighborhood or area (e.g. Velachery, Tambaram)'),
  landmark: z.string().trim().optional(),
  lat: z
    .number()
    .min(CHENNAI_GEO_BOUNDS.MIN_LAT, `Latitude must be within Chennai region`)
    .max(CHENNAI_GEO_BOUNDS.MAX_LAT, `Latitude must be within Chennai region`),
  lng: z
    .number()
    .min(CHENNAI_GEO_BOUNDS.MIN_LNG, `Longitude must be within Chennai region`)
    .max(CHENNAI_GEO_BOUNDS.MAX_LNG, `Longitude must be within Chennai region`),
  waterLevelFt: z.number().min(0).max(25).optional(),
  citizenCount: z.number().int().min(1).max(500),
  reporterName: z.string().trim().optional(),
  reporterPhone: z.string().trim().optional(),
  isPrivateContact: z.boolean().default(false),
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

function calculatePreliminaryUrgency(data) {
  const hasCriticalMedical =
    data.needsMedical ||
    data.category === 'medical_critical' ||
    (data.accessibilityNeeds?.medicalDependency && (data.waterLevelFt ?? 0) >= 2) ||
    (data.accessibilityNeeds?.pregnancy && (data.waterLevelFt ?? 0) >= 2);

  const hasExtremeWater = (data.waterLevelFt ?? 0) >= 5;
  if (hasExtremeWater || hasCriticalMedical) return 'critical';

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

async function runTestSuite() {
  console.log('--- STARTING RESQ.AI E2E VALIDATION SUITE ---');

  // TEST 1: Zod Rejections (Invalid / Invented Locations & Short Descriptions)
  console.log('\n[TEST 1] Zod Validation Error Checks:');
  
  // Test 1a: Description too short
  const testShortDesc = sosInputSchema.safeParse({
    description: 'Help',
    category: 'flood_water',
    address: 'Plot 10, Gandhi St',
    area: 'Velachery',
    lat: 12.9815,
    lng: 80.218,
    citizenCount: 2,
  });
  console.log('Short description rejected:', !testShortDesc.success, '| Errors:', testShortDesc.error?.issues[0]?.message);

  // Test 1b: Coordinates out of Chennai bounds (Invented location)
  const testOutBounds = sosInputSchema.safeParse({
    description: 'Flooding in ground floor, water level 4ft',
    category: 'flood_water',
    address: 'Invalid Unknown Coordinates',
    area: 'Outside Chennai',
    lat: 40.7128, // New York
    lng: -74.006,
    citizenCount: 2,
  });
  console.log('Out-of-bounds coordinates rejected:', !testOutBounds.success, '| Errors:', testOutBounds.error?.issues[0]?.message);

  // Test 1c: Missing address
  const testMissingAddress = sosInputSchema.safeParse({
    description: 'Family stranded on rooftop with 2 infants',
    category: 'flood_water',
    address: '   ',
    area: 'Tambaram',
    lat: 12.925,
    lng: 80.119,
    citizenCount: 4,
  });
  console.log('Blank address rejected:', !testMissingAddress.success, '| Errors:', testMissingAddress.error?.issues[0]?.message);

  // TEST 2: Valid Zod Input & Preliminary Urgency Calculation
  console.log('\n[TEST 2] Valid Submission & Urgency Calculation:');
  const validPayload = {
    description: 'Ground floor inundated with 5.5ft floodwater. Senior citizen on dialysis stranded on roof.',
    category: 'flood_water',
    address: 'No 45, 2nd Cross Street, AGS Colony',
    area: 'Velachery',
    landmark: 'Near Velachery MRTS',
    lat: 12.9815,
    lng: 80.218,
    waterLevelFt: 5.5,
    citizenCount: 5,
    reporterName: 'Suresh Kumar',
    reporterPhone: '+91 98401 99887',
    isPrivateContact: true,
    needsBoat: true,
    needsMedical: true,
    accessibilityNeeds: {
      elderly: true,
      infants: false,
      mobilityImpaired: false,
      medicalDependency: true,
      pregnancy: false,
      hearingVisionImpaired: false,
      details: 'Dialysis patient needs power supply and transport',
    },
  };

  const parseSuccess = sosInputSchema.safeParse(validPayload);
  console.log('Valid payload accepted by Zod:', parseSuccess.success);

  const urgency = calculatePreliminaryUrgency(validPayload);
  console.log('Preliminary Urgency calculated:', urgency, '(Expected: critical due to 5.5ft depth + medical dependency)');

  // TEST 3: HTTP Dev Server Live Route Checks
  console.log('\n[TEST 3] HTTP Server Live Verification:');
  const routes = ['/', '/sos', '/dashboard', '/dashboard/incidents', '/dashboard/teams', '/dashboard/analytics'];
  for (const route of routes) {
    try {
      const res = await fetch(`http://localhost:3000${route}`);
      console.log(`Route [GET ${route}]: HTTP ${res.status} ${res.statusText}`);
    } catch (e) {
      console.error(`Route [GET ${route}] failed:`, e.message);
    }
  }

  // TEST 4: API Triage Endpoint
  console.log('\n[TEST 4] Server-Side AI Triage API:');
  try {
    const triageRes = await fetch('http://localhost:3000/api/ai/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: validPayload.description,
        category: validPayload.category,
        waterLevelFt: validPayload.waterLevelFt,
        citizenCount: validPayload.citizenCount,
        hasChildrenOrElderly: true,
        needsBoat: true,
        needsMedical: true,
        location: `${validPayload.address}, ${validPayload.area}`,
      }),
    });
    const triageData = await triageRes.json();
    console.log('AI Triage Response Status:', triageRes.status);
    console.log('AI Priority Score:', triageData.priorityScore, '/ 100');
    console.log('Urgency Summary:', triageData.urgencySummary);
    console.log('Recommended Units:', triageData.recommendedUnits);
  } catch (e) {
    console.error('AI Triage API failed:', e.message);
  }

  console.log('\n--- ALL E2E VERIFICATIONS COMPLETE ---');
}

runTestSuite();
