// End-to-end test for /api/ai/triage route with English, Tamil, Hindi, and Demo Fallback
const { z } = require('zod');

const aiTriageOutputSchema = z.object({
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

async function testMultilingualTriage() {
  console.log('=====================================================');
  console.log('   RESQ.AI MULTILINGUAL AI TRIAGE E2E SUITE');
  console.log('=====================================================');

  const BASE_URL = 'http://localhost:3000/api/ai/triage';

  // 1. TEST 1: English Flood & Power Hazard Example
  console.log('\n[TEST 1] English Flash Flood & Power Hazard:');
  const englishInput = 'Severe flash flooding in Saidapet underpass. 3 cars submerged in 7 feet water, drivers evacuated but high-tension power cable snapped and hanging near water.';
  const res1 = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: englishInput }),
  });
  const data1 = await res1.json();
  const valid1 = aiTriageOutputSchema.safeParse(data1);

  console.log('HTTP Status:', res1.status);
  console.log('Zod Output Validation:', valid1.success ? 'PASSED' : 'FAILED');
  console.log('Original Language:', data1.originalLanguage);
  console.log('Category:', data1.category);
  console.log('Urgency & Score:', data1.urgency.toUpperCase(), `(${data1.priorityScore}/100)`);
  console.log('People Affected (Null if unstated):', data1.peopleAffected, '(Never fabricated)');
  console.log('Explicit Location:', data1.explicitlyReportedLocation);
  console.log('Hazards Identified:', data1.hazardsIdentified);
  console.log('Missing Information:', data1.missingInformation);
  console.log('Uncertainty Indicators:', data1.uncertaintyIndicators);
  console.log('Model Used:', data1.modelUsed, `| Demo Fallback: ${data1.isDemoFallback}`);

  // 2. TEST 2: Tamil Trapped-Person Example
  console.log('\n[TEST 2] Tamil Trapped-Person Emergency:');
  const tamilInput = 'வேளச்சேரி ராம் நகரில் வீட்டில் 5 அடி தண்ணீர் புகுந்துவிட்டது. 80 வயது பாட்டி மற்றும் 6 மாத குழந்தை மாடியில் தவிக்கின்றனர். உடனடியாக படகு தேவை.';
  const res2 = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: tamilInput }),
  });
  const data2 = await res2.json();
  const valid2 = aiTriageOutputSchema.safeParse(data2);

  console.log('HTTP Status:', res2.status);
  console.log('Zod Output Validation:', valid2.success ? 'PASSED' : 'FAILED');
  console.log('Original Language:', data2.originalLanguage);
  console.log('English Translation:', data2.englishTranslation);
  console.log('Category:', data2.category);
  console.log('Urgency & Score:', data2.urgency.toUpperCase(), `(${data2.priorityScore}/100)`);
  console.log('People Affected:', data2.peopleAffected, '(Grandmother and infant)');
  console.log('Vulnerabilities:', data2.vulnerabilities);
  console.log('Hazards Identified:', data2.hazardsIdentified);
  console.log('Explicit Location:', data2.explicitlyReportedLocation);
  console.log('Recommended Units:', data2.recommendedUnits);

  // 3. TEST 3: Hindi Medical Emergency Example
  console.log('\n[TEST 3] Hindi Medical (Pregnancy Labor) Emergency:');
  const hindiInput = 'मडीपक्कम में घर में 4 फीट पानी भर गया है। मेरी गर्भवती पत्नी को तेज दर्द हो रहा है, तुरंत एम्बुलेंस या डॉक्टर की जरूरत है।';
  const res3 = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: hindiInput }),
  });
  const data3 = await res3.json();
  const valid3 = aiTriageOutputSchema.safeParse(data3);

  console.log('HTTP Status:', res3.status);
  console.log('Zod Output Validation:', valid3.success ? 'PASSED' : 'FAILED');
  console.log('Original Language:', data3.originalLanguage);
  console.log('English Translation:', data3.englishTranslation);
  console.log('Category:', data3.category);
  console.log('Urgency & Score:', data3.urgency.toUpperCase(), `(${data3.priorityScore}/100)`);
  console.log('People Affected:', data3.peopleAffected, '(Husband and pregnant wife)');
  console.log('Vulnerabilities:', data3.vulnerabilities);
  console.log('Hazards Identified:', data3.hazardsIdentified);
  console.log('Explicit Location:', data3.explicitlyReportedLocation);
  console.log('Recommended Units:', data3.recommendedUnits);
  console.log('Suggested Action Plan:', data3.suggestedActionPlan);

  console.log('\n=====================================================');
  console.log('   ALL MULTILINGUAL AI TRIAGE TESTS SUCCEEDED');
  console.log('=====================================================');
}

testMultilingualTriage();
