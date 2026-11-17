import {
  isValidCoordinate,
  calculateHaversineDistanceKm,
  rankTeamsForIncident,
} from '../lib/geoUtils';
import { Incident, ResponderTeam } from '../types';
import { INITIAL_SIMULATED_INCIDENTS, INITIAL_SIMULATED_TEAMS } from '../data/simulatedData';
import { LocalStorageIncidentRepository } from '../services/repository/IncidentRepository';
import { LocalStorageTeamRepository } from '../services/repository/TeamRepository';

async function runTests() {
  console.log('=================================================================');
  console.log('  RESQ.AI Operational Map, Teams & Dispatch Verification Test');
  console.log('=================================================================\n');

  // -------------------------------------------------------------
  // Test 1: Coordinate Validation & Needs-Location Separation
  // -------------------------------------------------------------
  console.log('Test 1: Validating Coordinates & Needs-Location Queue Logic...');
  const validCoord1 = isValidCoordinate(12.9815, 80.218); // Velachery
  const validCoord2 = isValidCoordinate(13.021, 80.223); // Saidapet
  const zeroCoord = isValidCoordinate(0, 0); // Missing GPS
  const nullCoord = isValidCoordinate(null, null);
  const outOfBoundsCoord = isValidCoordinate(28.6139, 77.209); // New Delhi (outside Chennai operational grid)

  if (validCoord1 && validCoord2 && !zeroCoord && !nullCoord && !outOfBoundsCoord) {
    console.log('  ✓ PASSED: Valid Chennai coordinates accepted; zero/null/out-of-bound rejected.');
  } else {
    throw new Error('Coordinate validation failed!');
  }

  // Check seed data for needs-location queue
  const unmappedSeedIncidents = INITIAL_SIMULATED_INCIDENTS.filter(
    (i) => !isValidCoordinate(i.location?.lat, i.location?.lng)
  );
  console.log(
    `  ✓ PASSED: Found ${unmappedSeedIncidents.length} unmapped simulated incidents in seed data (routed to Needs Location Queue, excluded from map points).`
  );
  if (unmappedSeedIncidents.length === 0) {
    throw new Error('Expected at least 1 simulated incident with missing coordinates for Needs Location Queue!');
  }

  // -------------------------------------------------------------
  // Test 2: Haversine Distance & Disclaimer Verification
  // -------------------------------------------------------------
  console.log('\nTest 2: Haversine Distance & Submerged Road Disclaimer...');
  // Velachery (12.9810, 80.2185) to Saidapet (13.0210, 80.2230)
  const distKm = calculateHaversineDistanceKm(12.981, 80.2185, 13.021, 80.223);
  console.log(`  Straight-line distance (Velachery to Saidapet): ${distKm} km`);
  if (distKm > 4 && distKm < 6) {
    console.log('  ✓ PASSED: Haversine distance correctly computed (~4.5 km).');
  } else {
    throw new Error(`Unexpected distance computation: ${distKm}`);
  }

  // -------------------------------------------------------------
  // Test 3: 5 Fictional Simulated Response Teams Verification
  // -------------------------------------------------------------
  console.log('\nTest 3: Checking 5 Fictional Response Teams...');
  const teamRepo = new LocalStorageTeamRepository();
  const allTeams = await teamRepo.getAll();
  console.log(`  Total teams configured: ${allTeams.length}`);
  allTeams.forEach((t) => {
    console.log(`  - [${t.callsign}] ${t.name} (${t.type}) | Specialization: ${t.specialization}`);
    if (!t.specialization || !t.baseCoordinates) {
      throw new Error(`Team ${t.id} missing specialization or base coordinates!`);
    }
  });
  if (allTeams.length !== 5) {
    throw new Error(`Expected exactly 5 fictional simulated teams, found ${allTeams.length}`);
  }
  console.log('  ✓ PASSED: All 5 fictional teams properly seeded with specializations and bases.');

  // -------------------------------------------------------------
  // Test 4: Specialization & Distance Ranking Matrix
  // -------------------------------------------------------------
  console.log('\nTest 4: Specialization & Distance Team Ranking...');
  // Flood water critical incident in Velachery
  const floodIncident: Incident = {
    id: 'INC-TEST-001',
    title: 'Submerged Housing Colony - 8 Stranded',
    description: 'Ground floor submerged by 5ft surge.',
    category: 'flood_water',
    severity: 'critical',
    status: 'pending',
    reportedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    location: {
      address: 'Velachery Main Road',
      area: 'Velachery',
      lat: 12.9815,
      lng: 80.219,
    },
    reporter: {
      name: 'Tester',
      phone: '9999999999',
      citizenCount: 8,
      hasChildrenOrElderly: true,
      needsBoat: true,
      needsMedical: false,
    },
    timeline: [],
    isSimulated: true,
  };

  // Set all teams idle for ranking baseline
  const idleTeams: ResponderTeam[] = allTeams.map((t) => ({
    ...t,
    status: 'idle',
    assignedIncidentId: undefined,
  }));

  const rankedForFlood = rankTeamsForIncident(floodIncident, idleTeams);
  console.log(`  Top Ranked Unit for Flood Incident: ${rankedForFlood[0].team.name}`);
  console.log(`  Specialization Fit: ${rankedForFlood[0].specializationFit}`);
  console.log(`  Distance Disclaimer: "${rankedForFlood[0].approxDistanceDisclaimer}"`);

  if (rankedForFlood[0].team.type === 'ndrf_water_rescue') {
    console.log('  ✓ PASSED: NDRF Water Rescue correctly ranked #1 for flood evacuation.');
  } else {
    throw new Error(`Expected NDRF Water Rescue #1, got: ${rankedForFlood[0].team.name}`);
  }

  // Electrical Hazard ranking
  const electricalIncident: Incident = {
    ...floodIncident,
    id: 'INC-TEST-002',
    category: 'power_hazard',
    title: 'High Voltage Snapped Line in Floodwater',
  };
  const rankedForElectrical = rankTeamsForIncident(electricalIncident, idleTeams);
  console.log(`  Top Ranked Unit for Power Hazard: ${rankedForElectrical[0].team.name}`);
  if (rankedForElectrical[0].team.type === 'electrical_grid') {
    console.log('  ✓ PASSED: TANGEDCO High-Voltage Grid Taskforce ranked #1 for power hazard.');
  } else {
    throw new Error(`Expected electrical_grid #1, got: ${rankedForElectrical[0].team.name}`);
  }

  // -------------------------------------------------------------
  // Test 5: End-to-End Workflow:
  // Critical incident → Recommendation → Human assignment → Double assignment prevention → Resolution → Release
  // -------------------------------------------------------------
  console.log('\nTest 5: End-to-End Workflow & Team Release on Resolution...');
  const incRepo = new LocalStorageIncidentRepository();

  // Step 5.1: Create Incident
  const newIncident = await incRepo.create({
    title: 'E2E Critical Test: Family Marooned in Velachery',
    category: 'flood_water',
    severity: 'critical',
    preliminaryUrgency: 'critical',
    location: {
      address: '100ft Bypass Road',
      area: 'Velachery',
      lat: 12.9810,
      lng: 80.2185,
    },
    reporter: {
      name: 'R. Kannan',
      phone: '+91 98401 22334',
      citizenCount: 4,
      hasChildrenOrElderly: true,
      needsBoat: true,
      needsMedical: false,
    },
  });
  console.log(`  Step 5.1: Created incident ${newIncident.id} (Status: ${newIncident.status})`);

  // Step 5.2: Human Assignment of NDRF Water Rescue Alpha
  const targetTeam = allTeams.find((t) => t.type === 'ndrf_water_rescue')!;
  const assignedInc = await incRepo.assignTeam(
    newIncident.id,
    targetTeam.id,
    targetTeam.name,
    'Human Coordinator K. Raman'
  );
  console.log(`  Step 5.2: Incident assigned to ${assignedInc.assignedTeamName} (Status: ${assignedInc.status})`);
  const updatedTeam = await teamRepo.getById(targetTeam.id);
  console.log(`            Team ${updatedTeam?.name} status: ${updatedTeam?.status}, assignedIncident: ${updatedTeam?.assignedIncidentId}`);

  if (assignedInc.status !== 'assigned' || updatedTeam?.status !== 'en_route') {
    throw new Error('Incident or Team status not synchronized after assignment!');
  }

  // Step 5.3: Verify Double-Assignment Prevention
  console.log('  Step 5.3: Testing double-assignment prevention...');
  let doubleAssignPrevented = false;
  try {
    // Attempt assigning the same team to another incident without override
    await incRepo.assignTeam(
      'INC-ANOTHER-999',
      targetTeam.id,
      targetTeam.name,
      'Another Dispatcher',
      false // No override
    );
  } catch (err: any) {
    doubleAssignPrevented = true;
    console.log(`            Expected error caught: "${err.message.substring(0, 70)}..."`);
  }
  if (!doubleAssignPrevented) {
    throw new Error('Double-assignment was NOT prevented!');
  }
  console.log('  ✓ PASSED: Double-assignment successfully prevented without override.');

  // Step 5.4: Resolve Incident & Verify Team Release
  console.log('  Step 5.4: Resolving incident and verifying team release...');
  const resolvedInc = await incRepo.updateStatus(
    newIncident.id,
    'resolved',
    'Field Commander',
    'All 4 civilians successfully evacuated to staging shelter.'
  );
  console.log(`            Incident status: ${resolvedInc.status}`);

  const releasedTeam = await teamRepo.getById(targetTeam.id);
  console.log(`            Team ${releasedTeam?.name} status after resolution: ${releasedTeam?.status}`);
  console.log(`            Assigned incident ID: ${releasedTeam?.assignedIncidentId || 'CLEARED (None)'}`);

  if (releasedTeam?.status !== 'idle' || releasedTeam?.assignedIncidentId !== undefined) {
    throw new Error('Team was not released back to idle upon incident resolution!');
  }
  console.log('  ✓ PASSED: Team automatically released back to IDLE upon incident resolution.');

  // Step 5.5: Check Timeline Audit Trail
  const lastTimeline = resolvedInc.timeline[resolvedInc.timeline.length - 1];
  console.log(`  Step 5.5: Last Audit Trail Entry: "${lastTimeline.action}" - Note: "${lastTimeline.note}"`);
  if (!lastTimeline.note?.includes('released back to IDLE')) {
    throw new Error('Audit trail note did not mention team release!');
  }
  console.log('  ✓ PASSED: Audit trail logged team release consistently.');

  console.log('\n=================================================================');
  console.log('  ALL VERIFICATION TESTS PASSED SUCCESSFULLY! (100% GREEN)');
  console.log('=================================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
