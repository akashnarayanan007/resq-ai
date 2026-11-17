// Standalone test script executable directly via node

function isValidCoordinate(lat, lng) {
  if (lat === undefined || lat === null || lng === undefined || lng === null) return false;
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return lat >= 12.0 && lat <= 14.0 && lng >= 79.0 && lng <= 81.0;
}

function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function rankTeamsForIncident(incident, teams) {
  const hasValidIncCoords = isValidCoordinate(incident.location?.lat, incident.location?.lng);

  const results = teams.map((team) => {
    let specializationScore = 10;
    let specializationFit = 'general';
    let specializationReason = 'General emergency support capability.';

    const cat = incident.category;
    const teamType = team.type;

    if (cat === 'flood_water' || cat === 'elderly_infant_stranded') {
      if (teamType === 'ndrf_water_rescue') {
        specializationScore = 50;
        specializationFit = 'primary';
        specializationReason = 'Prime match: Inflatable rescue boats & swift-water flood evacuation divers.';
      } else if (teamType === 'drone_recon') {
        specializationScore = 28;
        specializationFit = 'secondary';
        specializationReason = 'Secondary match: Aerial thermal recon & emergency supply drops.';
      } else if (teamType === 'sdrf_paramedic') {
        specializationScore = 25;
        specializationFit = 'secondary';
        specializationReason = 'Secondary match: Amphibious medical evacuation support.';
      }
    } else if (cat === 'medical_critical') {
      if (teamType === 'sdrf_paramedic') {
        specializationScore = 55;
        specializationFit = 'primary';
        specializationReason = 'Prime match: 4x4 high-wading chassis, ALS obstetric and cardiac trauma kit.';
      } else if (teamType === 'ndrf_water_rescue') {
        specializationScore = 26;
        specializationFit = 'secondary';
        specializationReason = 'Secondary match: Water extraction to land-based ambulance rendezvous.';
      }
    } else if (cat === 'structural_collapse') {
      if (teamType === 'fire_rescue') {
        specializationScore = 55;
        specializationFit = 'primary';
        specializationReason = 'Prime match: Heavy hydraulic spreaders, tree chainsaws & structural shoring.';
      }
    } else if (cat === 'power_hazard') {
      if (teamType === 'electrical_grid') {
        specializationScore = 55;
        specializationFit = 'primary';
        specializationReason = 'Prime match: Certified 33kV high-voltage substation isolation & snapped cable earthing.';
      }
    } else if (cat === 'food_water_supply') {
      if (teamType === 'drone_recon') {
        specializationScore = 50;
        specializationFit = 'primary';
        specializationReason = 'Prime match: Rapid multi-rotor air-drop of ration packs & medicine to isolated roofs.';
      }
    }

    let availabilityScore = 0;
    const isAlreadyAssignedHere = team.assignedIncidentId === incident.id;
    const doubleAssignmentRisk =
      Boolean(team.assignedIncidentId) && team.assignedIncidentId !== incident.id;

    if (isAlreadyAssignedHere) {
      availabilityScore = 35;
    } else if (team.status === 'idle') {
      availabilityScore = 30;
    } else {
      availabilityScore = -40;
    }

    let distanceKm = null;
    let distancePenalty = 0;
    let approxDistanceDisclaimer = 'Distance uncalculated: incident location missing GPS coordinates.';

    if (
      hasValidIncCoords &&
      isValidCoordinate(team.currentLocation?.lat, team.currentLocation?.lng)
    ) {
      distanceKm = calculateHaversineDistanceKm(
        team.currentLocation.lat,
        team.currentLocation.lng,
        incident.location.lat,
        incident.location.lng
      );
      distancePenalty = distanceKm * 1.2;
      approxDistanceDisclaimer = `Approx. straight-line distance: ${distanceKm} km (Not road ETA - road routes may be submerged)`;
    }

    const totalScore = Math.round(specializationScore + availabilityScore - distancePenalty);

    return {
      team,
      totalScore,
      specializationFit,
      specializationScore,
      availabilityScore,
      distanceKm,
      approxDistanceDisclaimer,
      recommendationReason: specializationReason,
      doubleAssignmentRisk,
    };
  });

  results.sort((a, b) => b.totalScore - a.totalScore);
  results.forEach((item, index) => {
    item.rank = index + 1;
  });
  return results;
}

// Simulated repository in-memory simulation for unit test
class MockSimulatedEnvironment {
  constructor() {
    this.teams = [
      {
        id: 'TEAM-NDRF-01',
        name: 'NDRF Water Rescue Alpha',
        callsign: 'RESCUE-ALPHA',
        type: 'ndrf_water_rescue',
        specialization: 'Flood Evacuation & Inflatable Rescue Boats (Zodiac IRBs, Divers)',
        status: 'idle',
        commander: 'Deputy Commandant R. Singhal',
        personnelCount: 16,
        capacity: 24,
        equipment: ['Zodiac IRBs x3', '25HP Outboards', 'Life Vests x50'],
        baseCoordinates: { lat: 12.9810, lng: 80.2185, label: 'Velachery Base' },
        currentLocation: { lat: 12.9810, lng: 80.2185, label: 'Velachery Base' },
        assignedIncidentId: undefined,
        assignedIncidentTitle: undefined,
        radioChannel: 'VHF CH-14 (156.700 MHz)',
        batteryOrFuelPercent: 92,
        isSimulated: true,
      },
      {
        id: 'TEAM-EMU-07',
        name: '108 Amphibious Paramedic ALS',
        callsign: 'PARAMEDIC-ALS',
        type: 'sdrf_paramedic',
        specialization: 'High-Wading Trauma, Neonatal ALS & Obstetric Flood Extraction',
        status: 'idle',
        commander: 'Dr. Priya Sundaram',
        personnelCount: 6,
        capacity: 4,
        equipment: ['Custom 4x4 High-Wading Chassis', 'Neonatal Incubator', 'Trauma Kit'],
        baseCoordinates: { lat: 12.9690, lng: 80.1910, label: 'Madipakkam Hub' },
        currentLocation: { lat: 12.9690, lng: 80.1910, label: 'Madipakkam Hub' },
        assignedIncidentId: undefined,
        assignedIncidentTitle: undefined,
        radioChannel: 'VHF CH-11 (156.550 MHz)',
        batteryOrFuelPercent: 88,
        isSimulated: true,
      },
      {
        id: 'TEAM-TNFRS-03',
        name: 'TNFRS Fire & Structural Extrication',
        callsign: 'EXTRICATE-03',
        type: 'fire_rescue',
        specialization: 'Structural Collapse Extrication, Heavy Hydraulic Spreaders & Tree Winches',
        status: 'idle',
        commander: 'Station Officer S. Arumugam',
        personnelCount: 10,
        capacity: 12,
        equipment: ['Hydraulic Spreaders', 'Chainsaws', 'Dewatering Pump'],
        baseCoordinates: { lat: 13.0210, lng: 80.2230, label: 'Saidapet HQ' },
        currentLocation: { lat: 13.0210, lng: 80.2230, label: 'Saidapet HQ' },
        assignedIncidentId: undefined,
        assignedIncidentTitle: undefined,
        radioChannel: 'VHF CH-08 (156.400 MHz)',
        batteryOrFuelPercent: 85,
        isSimulated: true,
      },
      {
        id: 'TEAM-TNEB-05',
        name: 'TANGEDCO High-Voltage Grid Taskforce',
        callsign: 'GRID-TASKFORCE',
        type: 'electrical_grid',
        specialization: 'Substation Isolation, Snapped Cable Neutralization & Live Wire Hazards',
        status: 'idle',
        commander: 'Assistant Executive Engineer K. Velan',
        personnelCount: 8,
        capacity: 6,
        equipment: ['Boom Truck (33kV)', 'Phase Detectors', 'Rubber Insulated PPE'],
        baseCoordinates: { lat: 13.0360, lng: 80.2670, label: 'Mylapore Yard' },
        currentLocation: { lat: 13.0360, lng: 80.2670, label: 'Mylapore Yard' },
        assignedIncidentId: undefined,
        assignedIncidentTitle: undefined,
        radioChannel: 'VHF CH-05 (156.250 MHz)',
        batteryOrFuelPercent: 90,
        isSimulated: true,
      },
      {
        id: 'TEAM-DRONE-01',
        name: 'Pegasus Drone Recon & Air-Drop Wing',
        callsign: 'PEGASUS-AIR',
        type: 'drone_recon',
        specialization: 'Aerial Thermal Reconnaissance, Loudspeaker Broadcast & 5kg Emergency Air-Drops',
        status: 'idle',
        commander: 'Flight Captain Harish Nair',
        personnelCount: 4,
        capacity: 2,
        equipment: ['DJI Matrice 350 RTK Thermal Hexacopter', 'Loudspeaker', '5kg Drop Kit'],
        baseCoordinates: { lat: 12.8980, lng: 80.2280, label: 'Sholinganallur Drone Pad' },
        currentLocation: { lat: 12.8980, lng: 80.2280, label: 'Sholinganallur Drone Pad' },
        assignedIncidentId: undefined,
        assignedIncidentTitle: undefined,
        radioChannel: 'Digital 2.4/5.8 GHz',
        batteryOrFuelPercent: 95,
        isSimulated: true,
      },
    ];

    this.incidents = [];
  }

  createIncident(data) {
    const inc = {
      id: `INC-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
      title: data.title,
      description: data.description,
      category: data.category,
      severity: data.severity,
      status: 'pending',
      reportedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      location: data.location,
      reporter: data.reporter,
      timeline: [
        {
          id: 'tl-init',
          timestamp: new Date().toISOString(),
          action: 'Incident Created (Status: PENDING)',
          actor: 'Citizen SOS',
          newStatus: 'pending',
        },
      ],
      isSimulated: true,
    };
    this.incidents.push(inc);
    return inc;
  }

  assignTeam(incidentId, teamId, teamName, actor, forceOverride = false) {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) throw new Error('Team not found');

    const incident = this.incidents.find((i) => i.id === incidentId);
    if (!incident) throw new Error('Incident not found');

    // Double-assignment check
    if (team.assignedIncidentId && team.assignedIncidentId !== incidentId && !forceOverride) {
      throw new Error(`Double-assignment prevented: Team "${team.name}" is already assigned to "${team.assignedIncidentTitle || team.assignedIncidentId}".`);
    }

    // Update Team
    team.assignedIncidentId = incidentId;
    team.assignedIncidentTitle = incident.title;
    team.status = 'en_route';

    // Update Incident
    incident.assignedTeamId = teamId;
    incident.assignedTeamName = teamName;
    incident.status = 'assigned';
    incident.timeline.push({
      id: `tl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Team Assigned & Dispatched',
      actor,
      note: `Unit assigned: ${teamName} (${teamId})`,
      newStatus: 'assigned',
    });

    return incident;
  }

  updateStatus(incidentId, newStatus, actor, note) {
    const incident = this.incidents.find((i) => i.id === incidentId);
    if (!incident) throw new Error('Incident not found');

    let finalNote = note;

    // Release team on resolution
    if ((newStatus === 'resolved' || newStatus === 'invalid') && incident.assignedTeamId) {
      const team = this.teams.find((t) => t.id === incident.assignedTeamId);
      if (team) {
        team.assignedIncidentId = undefined;
        team.assignedIncidentTitle = undefined;
        team.status = 'idle';
        const releaseMsg = `Responder unit "${team.name}" released back to IDLE inventory.`;
        finalNote = note ? `${note} • ${releaseMsg}` : releaseMsg;
      }
    }

    incident.status = newStatus;
    incident.timeline.push({
      id: `tl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: `Status Changed: ${newStatus.toUpperCase()}`,
      actor,
      note: finalNote,
      newStatus,
    });

    return incident;
  }
}

async function runTest() {
  console.log('=================================================================');
  console.log('  RESQ.AI MAP, TEAMS & DISPATCH VERIFICATION (NODE RUNNER)');
  console.log('=================================================================\n');

  // Test 1: Coordinates validation
  console.log('Test 1: Testing Coordinate Validation...');
  if (
    isValidCoordinate(12.9815, 80.218) === true &&
    isValidCoordinate(0, 0) === false &&
    isValidCoordinate(null, null) === false &&
    isValidCoordinate(28.6139, 77.209) === false
  ) {
    console.log('  ✓ PASSED: Valid Chennai coords accepted; (0,0), null, and out-of-bounds rejected.');
  } else {
    throw new Error('Coordinate validation failed!');
  }

  // Test 2: Haversine Distance & Disclaimer
  console.log('\nTest 2: Testing Haversine Distance & Disclaimer...');
  const dist = calculateHaversineDistanceKm(12.9810, 80.2185, 13.0210, 80.2230);
  console.log(`  Straight line distance between Velachery & Saidapet: ${dist} km`);
  if (dist >= 4.0 && dist <= 6.0) {
    console.log('  ✓ PASSED: Accurate straight-line distance computation.');
  } else {
    throw new Error(`Distance computation unexpected: ${dist}`);
  }

  // Test 3: Environment setup
  const env = new MockSimulatedEnvironment();
  console.log(`\nTest 3: Checking 5 Fictional Teams (${env.teams.length} units)...`);
  env.teams.forEach((t) => {
    console.log(`  - [${t.callsign}] ${t.name} • Specialization: ${t.specialization}`);
  });
  if (env.teams.length !== 5) throw new Error('Expected 5 fictional teams');
  console.log('  ✓ PASSED: All 5 fictional teams loaded.');

  // Test 4: Ranking algorithm test
  console.log('\nTest 4: Team Ranking by Specialization, Distance & Availability...');
  const testIncident = env.createIncident({
    title: 'Severe Inundation with Stranded Residents in Velachery',
    category: 'flood_water',
    severity: 'critical',
    location: { address: 'Velachery 100ft Rd', area: 'Velachery', lat: 12.9815, lng: 80.2185 },
    reporter: { name: 'Karthik', citizenCount: 6 },
  });

  const ranked = rankTeamsForIncident(testIncident, env.teams);
  console.log(`  Top Unit for Flood Category: ${ranked[0].team.name} (Rank #${ranked[0].rank})`);
  console.log(`  Distance Disclaimer: "${ranked[0].approxDistanceDisclaimer}"`);
  if (ranked[0].team.type !== 'ndrf_water_rescue') {
    throw new Error('NDRF Water Rescue should be ranked #1 for flood_water');
  }
  if (!ranked[0].approxDistanceDisclaimer.includes('Not road ETA - road routes may be submerged')) {
    throw new Error('Disclaimer missing submerged road warning!');
  }
  console.log('  ✓ PASSED: Algorithmic ranking and explicit submerged road disclaimer verified.');

  // Test 5: End-to-End Critical Incident → Human Assignment → Double Assignment Guard → Resolution Release
  console.log('\nTest 5: Critical Incident Flow & Team Lifecycle...');

  // 5.1 Assignment
  const assigned = env.assignTeam(
    testIncident.id,
    'TEAM-NDRF-01',
    'NDRF Water Rescue Alpha',
    'Human Coordinator K. Raman'
  );
  console.log(`  5.1 Assigned: Incident status = ${assigned.status}, Unit = ${assigned.assignedTeamName}`);
  const ndrfTeam = env.teams.find((t) => t.id === 'TEAM-NDRF-01');
  console.log(`      Team status: ${ndrfTeam.status}, Assigned to: ${ndrfTeam.assignedIncidentTitle}`);
  if (assigned.status !== 'assigned' || ndrfTeam.status !== 'en_route') {
    throw new Error('Assignment status mismatch!');
  }
  console.log('  ✓ PASSED: Human assignment updated incident and team consistently.');

  // 5.2 Double Assignment Prevention
  console.log('  5.2 Testing double-assignment prevention...');
  const secondIncident = env.createIncident({
    title: 'Another Rapid Flood at Madipakkam',
    category: 'flood_water',
    severity: 'critical',
    location: { address: 'Lake Rd', area: 'Madipakkam', lat: 12.9690, lng: 80.1910 },
    reporter: { name: 'Pooja', citizenCount: 3 },
  });

  let prevented = false;
  try {
    env.assignTeam(secondIncident.id, 'TEAM-NDRF-01', 'NDRF Water Rescue Alpha', 'Dispatcher 2', false);
  } catch (err) {
    prevented = true;
    console.log(`      Expected error caught: ${err.message}`);
  }
  if (!prevented) throw new Error('Double assignment should have been blocked!');
  console.log('  ✓ PASSED: Double assignment blocked successfully.');

  // 5.3 Resolution & Automatic Release
  console.log('  5.3 Resolving incident and releasing team...');
  const resolved = env.updateStatus(
    testIncident.id,
    'resolved',
    'Field Commander',
    'Civilians safely evacuated.'
  );
  console.log(`      Incident status: ${resolved.status}`);
  console.log(`      Team status: ${ndrfTeam.status}, Assigned ID: ${ndrfTeam.assignedIncidentId || 'CLEARED'}`);
  if (ndrfTeam.status !== 'idle' || ndrfTeam.assignedIncidentId !== undefined) {
    throw new Error('Team was not released back to idle on incident resolution!');
  }
  const lastLog = resolved.timeline[resolved.timeline.length - 1];
  console.log(`      Audit Log: "${lastLog.action}" • "${lastLog.note}"`);
  if (!lastLog.note.includes('released back to IDLE')) {
    throw new Error('Audit log missing release confirmation!');
  }
  console.log('  ✓ PASSED: Team automatically released back to IDLE on resolution with audit entry.');

  console.log('\n=================================================================');
  console.log('  ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! (100% PASS)');
  console.log('=================================================================\n');
}

runTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
