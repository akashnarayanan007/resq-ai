import 'server-only';
import { Incident, IncidentStatus, AITriageAnalysis, PublicTrackedIncident } from '@/types';
import { IncidentRepository, LocalStorageIncidentRepository } from './IncidentRepository';
import { getFirebaseAdminDb } from '../firebase/firebaseAdmin';
import { serverTeamRepository as teamRepository } from './server/serverTeamRepository';

const COLLECTION_NAME = 'incidents';

export class FirestoreIncidentRepository implements IncidentRepository {
  private fallback = new LocalStorageIncidentRepository();

  private get db() {
    return getFirebaseAdminDb();
  }

  async getAll(): Promise<Incident[]> {
    const db = this.db;
    if (!db) return this.fallback.getAll();

    try {
      // Bounded query (limit 100) sorted by reportedAt desc
      const snapshot = await db
        .collection(COLLECTION_NAME)
        .orderBy('reportedAt', 'desc')
        .limit(100)
        .get();

      if (snapshot.empty) {
        // If collection empty, initialize with simulated seed data
        await this.resetToSimulatedData();
        return this.fallback.getAll();
      }

      return snapshot.docs.map((doc) => doc.data() as Incident);
    } catch (err) {
      console.warn('Firestore getAll error, falling back to local demo storage:', err);
      return this.fallback.getAll();
    }
  }

  async getById(id: string): Promise<Incident | null> {
    const db = this.db;
    if (!db) return this.fallback.getById(id);

    try {
      const doc = await db.collection(COLLECTION_NAME).doc(id.trim().toUpperCase()).get();
      if (!doc.exists) return null;
      return doc.data() as Incident;
    } catch (err) {
      console.warn('Firestore getById error, using fallback:', err);
      return this.fallback.getById(id);
    }
  }

  async getByTrackingToken(id: string, token: string): Promise<Incident | null> {
    const incident = await this.getById(id);
    if (!incident) return null;
    if (!incident.trackingToken || incident.trackingToken !== token.trim()) {
      return null;
    }
    return incident;
  }

  async getPublicTrackedIncident(id: string, token: string): Promise<PublicTrackedIncident | null> {
    const incident = await this.getByTrackingToken(id, token);
    if (!incident) return null;

    // Project strictly to privacy-safe fields
    return {
      id: incident.id,
      title: incident.title,
      category: incident.category,
      status: incident.status,
      preliminaryUrgency: incident.preliminaryUrgency || incident.severity,
      reportedAt: incident.reportedAt,
      updatedAt: incident.updatedAt,
      area: incident.location?.area || 'Chennai Metropolitan Area',
      assignedTeamName: incident.assignedTeamName,
      citizenCount: incident.reporter?.citizenCount || 1,
      timeline: incident.timeline.map((t) => ({
        timestamp: t.timestamp,
        action: t.action,
        note: t.note,
      })),
    };
  }

  async create(incidentData: Partial<Incident>): Promise<Incident> {
    const db = this.db;
    if (!db) return this.fallback.create(incidentData);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = incidentData.id || `INC-CHN-${randomSuffix}`;
    const now = new Date().toISOString();
    const trackingToken =
      incidentData.trackingToken ||
      `trk_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;

    const created: Incident = {
      id: newId,
      title: incidentData.title || 'Emergency Distress Report',
      description: incidentData.description || 'Reported via SOS Emergency Intake.',
      category: incidentData.category || 'flood_water',
      severity: incidentData.severity || incidentData.preliminaryUrgency || 'high',
      preliminaryUrgency: incidentData.preliminaryUrgency || incidentData.severity || 'high',
      status: 'pending',
      reportedAt: now,
      updatedAt: now,
      isSimulated: true,
      trackingToken,
      location: incidentData.location || {
        address: 'Specified Field Location',
        area: 'Chennai',
        lat: 12.9815,
        lng: 80.218,
        landmark: '',
        waterLevelFt: 0,
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
      accessibilityNeeds: incidentData.accessibilityNeeds,
      aiTriage: incidentData.aiTriage,
      imageObservation: incidentData.imageObservation,
      assignedTeamId: incidentData.assignedTeamId,
      assignedTeamName: incidentData.assignedTeamName,
      timeline: [
        {
          id: `tl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: now,
          action: 'Incident Created (Status: PENDING)',
          actor: 'Citizen SOS Intake Portal',
          note: incidentData.reporter?.isPrivateContact
            ? `Report registered with private contact preferences. Preliminary urgency: ${(
                incidentData.preliminaryUrgency || 'HIGH'
              ).toUpperCase()}`
            : `Reported by ${incidentData.reporter?.name || 'Citizen'} (${
                incidentData.reporter?.citizenCount || 1
              } people). Urgency: ${(incidentData.preliminaryUrgency || 'HIGH').toUpperCase()}`,
          newStatus: 'pending',
        },
      ],
      photoUrl: incidentData.photoUrl,
      audioNoteUrl: incidentData.audioNoteUrl,
    };

    try {
      await db.collection(COLLECTION_NAME).doc(newId).set(created);
      return created;
    } catch (err) {
      console.warn('Firestore create error, using fallback:', err);
      return this.fallback.create(incidentData);
    }
  }

  async update(
    id: string,
    updates: Partial<Incident>,
    actor: string = 'Dispatcher',
    note?: string
  ): Promise<Incident> {
    const db = this.db;
    if (!db) return this.fallback.update(id, updates, actor, note);

    const existing = await this.getById(id);
    if (!existing) throw new Error(`Incident ${id} not found`);

    const now = new Date().toISOString();
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

    const updated: Incident = {
      ...existing,
      ...updates,
      updatedAt: now,
      timeline: newTimeline,
    };

    try {
      await db.collection(COLLECTION_NAME).doc(id).set(updated);
      return updated;
    } catch (err) {
      console.warn('Firestore update error, using fallback:', err);
      return this.fallback.update(id, updates, actor, note);
    }
  }

  async updateStatus(
    id: string,
    status: IncidentStatus,
    actor: string,
    note?: string
  ): Promise<Incident> {
    const existing = await this.getById(id);
    let finalNote = note;

    if (existing && (status === 'resolved' || status === 'invalid') && existing.assignedTeamId) {
      try {
        await teamRepository.releaseTeam(existing.assignedTeamId, existing.id);
        const releaseMsg = `Responder unit "${existing.assignedTeamName || existing.assignedTeamId}" released back to IDLE inventory.`;
        finalNote = note ? `${note} • ${releaseMsg}` : releaseMsg;
      } catch (err) {
        console.warn('Team release notice:', err);
      }
    }

    return this.update(id, { status }, actor, finalNote);
  }

  async closeAsInvalid(id: string, reason: string, actor: string): Promise<Incident> {
    const existing = await this.getById(id);
    if (existing?.assignedTeamId) {
      try {
        await teamRepository.releaseTeam(existing.assignedTeamId, existing.id);
      } catch (err) {
        console.warn('Team release on invalid closure:', err);
      }
    }

    return this.update(
      id,
      { status: 'invalid', closureReason: reason },
      actor,
      `Invalid Report Closed: ${reason}${existing?.assignedTeamName ? ` (Released unit ${existing.assignedTeamName})` : ''}`
    );
  }

  async assignTeam(
    id: string,
    teamId: string,
    teamName: string,
    actor: string,
    forceOverride: boolean = false
  ): Promise<Incident> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Incident ${id} not found`);

    await teamRepository.assignIncident(teamId, id, existing.title, forceOverride);

    return this.update(
      id,
      { assignedTeamId: teamId, assignedTeamName: teamName, status: 'assigned' },
      actor,
      `Human Coordinator confirmed assignment: Unit ${teamName} (${teamId}) dispatched.`
    );
  }

  async updateCoordinates(
    id: string,
    lat: number,
    lng: number,
    address?: string,
    area?: string,
    actor: string = 'Command Center Operator'
  ): Promise<Incident> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Incident ${id} not found`);

    const updatedLocation = {
      ...existing.location,
      lat,
      lng,
      address: address || existing.location.address,
      area: area || existing.location.area,
    };

    return this.update(
      id,
      { location: updatedLocation },
      actor,
      `Coordinates verified on tactical grid: [${lat.toFixed(4)}, ${lng.toFixed(4)}]`
    );
  }

  async updateAITriage(id: string, triage: AITriageAnalysis): Promise<Incident> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Incident ${id} not found`);

    let severity = existing.severity;
    if (triage.priorityScore >= 85) severity = 'critical';
    else if (triage.priorityScore >= 65) severity = 'high';
    else if (triage.priorityScore >= 45) severity = 'medium';

    return this.update(
      id,
      { severity, aiTriage: triage },
      'RESQ.AI Intelligence Co-Pilot',
      `Priority Score ${triage.priorityScore}/100. ${triage.urgencySummary}`
    );
  }

  async resetToSimulatedData(): Promise<void> {
    const db = this.db;
    if (!db) {
      return this.fallback.resetToSimulatedData();
    }

    try {
      const { INITIAL_SIMULATED_INCIDENTS } = await import('@/data/simulatedData');
      const batch = db.batch();

      // Clear existing records
      const snapshot = await db.collection(COLLECTION_NAME).limit(100).get();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Seed initial simulated incidents
      INITIAL_SIMULATED_INCIDENTS.forEach((inc) => {
        const ref = db.collection(COLLECTION_NAME).doc(inc.id);
        const incWithToken = {
          ...inc,
          trackingToken: inc.trackingToken || `trk_${inc.id.toLowerCase().replace(/[^a-z0-9]/g, '_')}_secret`,
        };
        batch.set(ref, incWithToken);
      });

      await batch.commit();
      await this.fallback.resetToSimulatedData();
    } catch (err) {
      console.warn('Firestore resetToSimulatedData error, falling back:', err);
      await this.fallback.resetToSimulatedData();
    }
  }
}
