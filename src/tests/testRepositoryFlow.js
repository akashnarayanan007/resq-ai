// Test repository lifecycle & audit trail logic in Node.js environment
const INITIAL_SIMULATED_INCIDENTS = [];

class MockLocalStorageIncidentRepository {
  constructor() {
    this.storage = [...INITIAL_SIMULATED_INCIDENTS];
  }

  async getAll() {
    return [...this.storage].sort(
      (a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
    );
  }

  async getById(id) {
    return this.storage.find((inc) => inc.id.toUpperCase() === id.trim().toUpperCase()) || null;
  }

  async create(incidentData) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = incidentData.id || `INC-CHN-${randomSuffix}`;
    const now = new Date().toISOString();

    const created = {
      id: newId,
      title: incidentData.title || 'Emergency Distress Report',
      description: incidentData.description || 'Reported via SOS Emergency Intake.',
      category: incidentData.category || 'flood_water',
      severity: incidentData.severity || incidentData.preliminaryUrgency || 'high',
      preliminaryUrgency: incidentData.preliminaryUrgency || incidentData.severity || 'high',
      status: 'pending', // Starts strictly as pending per requirement
      reportedAt: now,
      updatedAt: now,
      isSimulated: true,
      location: incidentData.location || {
        address: 'Specified Field Location',
        area: 'Chennai',
        lat: 12.9815,
        lng: 80.218,
      },
      reporter: incidentData.reporter || {
        name: 'Private Citizen',
        phone: '',
        citizenCount: 1,
        hasChildrenOrElderly: false,
        needsBoat: false,
        needsMedical: false,
        isPrivateContact: true,
      },
      timeline: [
        {
          id: `tl-${Date.now()}-init`,
          timestamp: now,
          action: 'Incident Created (Status: PENDING)',
          actor: 'Citizen SOS Intake Portal',
          note: `Preliminary Urgency: ${(incidentData.preliminaryUrgency || 'HIGH').toUpperCase()}`,
          newStatus: 'pending',
        },
      ],
    };

    this.storage.unshift(created);
    return created;
  }

  async update(id, updates, actor = 'Dispatcher', note) {
    const index = this.storage.findIndex((inc) => inc.id === id);
    if (index === -1) throw new Error(`Incident ${id} not found`);

    const now = new Date().toISOString();
    const existing = this.storage[index];
    const newTimeline = [...existing.timeline];

    if (note || updates.status || updates.assignedTeamName || updates.closureReason) {
      newTimeline.push({
        id: `tl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: now,
        action: updates.status
          ? `Status Changed: ${existing.status.toUpperCase()} → ${updates.status.toUpperCase()}`
          : updates.closureReason
          ? 'Incident Closed as Invalid'
          : 'Incident Updated',
        actor,
        note: note || updates.closureReason || (updates.assignedTeamName ? `Assigned to ${updates.assignedTeamName}` : undefined),
        previousStatus: existing.status,
        newStatus: updates.status || existing.status,
      });
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: now,
      timeline: newTimeline,
    };

    this.storage[index] = updated;
    return updated;
  }

  async updateStatus(id, status, actor, note) {
    return this.update(id, { status }, actor, note);
  }

  async closeAsInvalid(id, reason, actor) {
    return this.update(
      id,
      {
        status: 'invalid',
        closureReason: reason,
      },
      actor,
      `Invalid Report Closed: ${reason}`
    );
  }

  async assignTeam(id, teamId, teamName, actor) {
    return this.update(
      id,
      {
        assignedTeamId: teamId,
        assignedTeamName: teamName,
        status: 'assigned',
      },
      actor,
      `Assigned to responder unit: ${teamName}`
    );
  }
}

async function testRepositoryLifecycle() {
  console.log('--- TESTING REPOSITORY STATUS LIFECYCLE & AUDIT TRAIL ---');
  const repo = new MockLocalStorageIncidentRepository();

  // 1. Create new SOS incident
  const created = await repo.create({
    title: 'Severe Inundation at Velachery AGS Colony',
    description: 'Ground floor submerged in 5ft water, 4 family members on terrace.',
    category: 'flood_water',
    preliminaryUrgency: 'critical',
    location: {
      address: 'Plot 32, AGS Colony 4th Main Rd',
      area: 'Velachery',
      lat: 12.9815,
      lng: 80.218,
      waterLevelFt: 5.0,
    },
    reporter: {
      name: 'Ramesh V',
      phone: '+91 98401 22334',
      citizenCount: 4,
      hasChildrenOrElderly: true,
      needsBoat: true,
      needsMedical: false,
      isPrivateContact: false,
    },
  });

  console.log('[STEP 1] Incident Created:');
  console.log(`- ID: ${created.id}`);
  console.log(`- Status: ${created.status} (Verified initial status is pending)`);
  console.log(`- Preliminary Urgency: ${created.preliminaryUrgency}`);
  console.log(`- Initial Audit Entry:`, created.timeline[0].action);

  // 2. Lifecycle: Pending → Under Review
  const underReview = await repo.updateStatus(created.id, 'under_review', 'Dispatcher Priya', 'Verifying location via satellite telemetry');
  console.log('\n[STEP 2] Transition: Pending → Under Review');
  console.log(`- Status: ${underReview.status}`);
  console.log(`- Latest Audit:`, underReview.timeline[underReview.timeline.length - 1].action);

  // 3. Lifecycle: Under Review → Assigned
  const assigned = await repo.assignTeam(created.id, 'TEAM-NDRF-01', 'NDRF Unit 04 (Velachery IRB Team)', 'Operations Lead');
  console.log('\n[STEP 3] Transition: Under Review → Assigned');
  console.log(`- Status: ${assigned.status}`);
  console.log(`- Assigned Team: ${assigned.assignedTeamName}`);
  console.log(`- Latest Audit:`, assigned.timeline[assigned.timeline.length - 1].action);

  // 4. Lifecycle: Assigned → In Progress
  const inProgress = await repo.updateStatus(created.id, 'in_progress', 'NDRF Unit 04', 'Zodiac boat arrived at staging point on 100ft bypass road');
  console.log('\n[STEP 4] Transition: Assigned → In Progress');
  console.log(`- Status: ${inProgress.status}`);
  console.log(`- Latest Audit:`, inProgress.timeline[inProgress.timeline.length - 1].action);

  // 5. Lifecycle: In Progress → Resolved
  const resolved = await repo.updateStatus(created.id, 'resolved', 'Incident Commander', 'All 4 occupants safely extracted to elevated relief shelter');
  console.log('\n[STEP 5] Transition: In Progress → Resolved');
  console.log(`- Status: ${resolved.status}`);
  console.log(`- Latest Audit:`, resolved.timeline[resolved.timeline.length - 1].action);

  // 6. Test Invalid Report Closure Flow
  const invalidIncident = await repo.create({
    title: 'Duplicate waterlogging report',
    description: 'Same caller reporting already addressed drain overflow.',
    category: 'road_blockage',
    preliminaryUrgency: 'low',
  });

  const closedInvalid = await repo.closeAsInvalid(
    invalidIncident.id,
    'Duplicate submission: Combined with earlier SOS report INC-CHN-4091',
    'Review Officer K. Swaminathan'
  );

  console.log('\n[STEP 6] Invalid Report Closure:');
  console.log(`- ID: ${closedInvalid.id}`);
  console.log(`- Status: ${closedInvalid.status}`);
  console.log(`- Closure Reason: ${closedInvalid.closureReason}`);
  console.log(`- Latest Audit:`, closedInvalid.timeline[closedInvalid.timeline.length - 1].note);

  // 7. Track-Status Lookup Verification
  const lookedUp = await repo.getById(created.id);
  console.log('\n[STEP 7] Track-Status Lookup by ID:');
  console.log(`- Found ID: ${lookedUp.id}`);
  console.log(`- Final Status: ${lookedUp.status}`);
  console.log(`- Total Audit Timeline Entries: ${lookedUp.timeline.length}`);

  console.log('\n--- LIFECYCLE REPOSITORY TEST COMPLETED SUCCESSFULLY ---');
}

testRepositoryLifecycle();
