import fs from 'fs';

// Load .env.local
if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

import { serverIncidentRepository } from '../services/repository/server/serverIncidentRepository';
import { Incident } from '../types';

async function runRegressionTest() {
  console.log('========================================================================');
  console.log('   RESQ.AI REGRESSION TEST: CREATE -> PERSIST -> TRACK -> REFRESH      ');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${testName}: ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  // 1. Create a simulated QA SOS incident
  console.log('[STEP 1] Creating Citizen SOS Incident...');
  const testPayload: Partial<Incident> = {
    title: 'QA Citizen Rescue Request: Water Rising in Velachery',
    description: 'Ground floor inundated up to 4ft. Family stranded on balcony.',
    category: 'flood_water',
    severity: 'critical',
    preliminaryUrgency: 'critical',
    location: {
      address: 'Plot 10, Ram Nagar North',
      area: 'Velachery',
      landmark: 'Near Velachery Station',
      lat: 12.9815,
      lng: 80.218,
      waterLevelFt: 4,
    },
    reporter: {
      name: 'Private Citizen QA',
      phone: '+91 94440 12345',
      citizenCount: 4,
      hasChildrenOrElderly: true,
      needsBoat: true,
      needsMedical: false,
      isPrivateContact: true,
    },
    isSimulated: true,
  };

  const created = await serverIncidentRepository.create(testPayload);
  assert(Boolean(created.id && created.id.startsWith('INC-CHN-')), 'Generated valid Chennai Incident ID format');
  assert(Boolean(created.trackingToken && created.trackingToken.startsWith('trk_')), 'Generated unguessable tracking token');
  assert(created.status === 'pending', 'Initial status set strictly to pending');

  // 2. Verify backend Firestore persistence
  console.log('\n[STEP 2] Verifying Backend Persistence across independent query...');
  const fetched = await serverIncidentRepository.getById(created.id);
  assert(fetched !== null && fetched.id === created.id, 'Incident persisted and retrieved by ID');
  assert(fetched?.location.area === 'Velachery', 'Location area verified in persisted record');

  // 3. Test public tracking endpoint with unguessable token
  console.log('\n[STEP 3] Verifying Public Tracking with Privacy Projection...');
  const tracked = await serverIncidentRepository.getPublicTrackedIncident(created.id, created.trackingToken!);
  assert(tracked !== null, 'Public tracking returned incident using valid token');
  assert(tracked?.status === 'pending', 'Public tracking reflects correct pending status');
  assert(tracked?.area === 'Velachery', 'Public tracking includes generalized area');
  assert((tracked as any)?.reporter?.phone === undefined, 'Private phone number stripped from tracking projection');
  assert((tracked as any)?.trackingToken === undefined, 'Secret tracking token stripped from public projection');

  // 4. Test tracking rejection with invalid / guessed token
  console.log('\n[STEP 4] Verifying Tracking Token Security...');
  const rejectedBadToken = await serverIncidentRepository.getPublicTrackedIncident(created.id, 'trk_guessed_bad_token');
  assert(rejectedBadToken === null, 'Rejected public tracking with invalid/guessed token');

  const rejectedBadId = await serverIncidentRepository.getPublicTrackedIncident('INC-CHN-999999', created.trackingToken!);
  assert(rejectedBadId === null, 'Rejected public tracking with non-existent incident ID');

  // 5. Test status transition and tracking refresh
  console.log('\n[STEP 5] Verifying Status Transition and Live Tracking Refresh...');
  await serverIncidentRepository.updateStatus(created.id, 'in_progress', 'Coordinator', 'NDRF Unit 04 dispatched');
  const refreshedTracked = await serverIncidentRepository.getPublicTrackedIncident(created.id, created.trackingToken!);
  assert(refreshedTracked?.status === 'in_progress', 'Live tracking reflects updated in_progress status after refresh');

  // 6. Test Failed Network Submission handling (ensuring no false success)
  console.log('\n[STEP 6] Verifying Failed Submission Rejection...');
  const { LocalStorageIncidentRepository } = await import('../services/repository/IncidentRepository');
  const clientRepo = new LocalStorageIncidentRepository();
  
  // Simulate browser environment with failing network fetch
  (global as any).window = {};
  (global as any).fetch = async (url: string) => {
    if (url === '/api/incidents') {
      return {
        ok: false,
        status: 503,
        json: async () => ({ error: 'Dispatch server temporary outage' }),
      };
    }
    return { ok: false, status: 404 };
  };

  let threwExpectedError = false;
  try {
    await clientRepo.create({ title: 'Test Failure' });
  } catch (err: any) {
    threwExpectedError = true;
    assert(err.message.includes('Dispatch server') || err.message.includes('503'), 'Client create throws on server failure', err.message);
  }
  assert(threwExpectedError, 'Submission failed gracefully without claiming false success');

  // Clean up mock
  delete (global as any).window;
  delete (global as any).fetch;

  console.log('\n========================================================================');
  console.log(`REGRESSION TEST RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runRegressionTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
